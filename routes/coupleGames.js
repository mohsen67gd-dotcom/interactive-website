const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const CoupleGame = require('../models/CoupleGame');
const CoupleGameSession = require('../models/CoupleGameSession');
const User = require('../models/User');

// تابع کمکی برای بررسی اعتبار session
const validateSessionAccess = (session, userId) => {
  // بررسی وجود همسران
  if (!session.couple?.partner1 || !session.couple?.partner2) {
    return { 
      valid: false, 
      status: 400, 
      message: 'اطلاعات همسران ناقص است',
      error: 'INCOMPLETE_PARTNERS'
    };
  }
  
  // بررسی اینکه آیا session هنوز معتبر است
  if (!session.gameId) {
    return { 
      valid: false, 
      status: 400, 
      message: 'بازی مربوط به این جلسه یافت نشد',
      error: 'GAME_NOT_FOUND'
    };
  }
  
  // بررسی دسترسی کاربر
  if (session.couple.partner1.toString() !== userId.toString() && 
      session.couple.partner2.toString() !== userId.toString()) {
    return { 
      valid: false, 
      status: 403, 
      message: 'دسترسی غیرمجاز'
    };
  }
  
  return { valid: true };
};

// ===== ADMIN ROUTES =====

// ایجاد بازی جدید (فقط ادمین)
router.post('/create', authenticateToken, [
  body('title').notEmpty().withMessage('عنوان بازی الزامی است'),
  body('description').notEmpty().withMessage('توضیحات بازی الزامی است'),
  body('questions').isArray({ min: 1 }).withMessage('حداقل یک سوال الزامی است'),
  body('timeLimit').isInt({ min: 1, max: 120 }).withMessage('زمان باید بین 1 تا 120 دقیقه باشد'),
  body('category').optional().isIn(['عاطفی', 'فکری', 'عملی', 'ترکیبی']),
  body('difficulty').optional().isIn(['آسان', 'متوسط', 'سخت'])
], async (req, res) => {
  try {
    // بررسی ادمین بودن
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'فقط ادمین می‌تواند بازی ایجاد کند' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, timeLimit, startDate, endDate, category, difficulty } = req.body;

    // اعتبارسنجی سوالات
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || q.options.length < 2) {
        return res.status(400).json({ 
          message: `سوال ${i + 1} نامعتبر است. حداقل 2 گزینه الزامی است` 
        });
      }
    }

    const game = new CoupleGame({
      title,
      description,
      questions,
      timeLimit,
      startDate: startDate || new Date(),
      endDate,
      category: category || 'ترکیبی',
      difficulty: difficulty || 'متوسط',
      createdBy: req.user._id
    });

    await game.save();
    
    console.log('🎮 بازی جدید ایجاد شد:', {
      id: game._id,
      title: game.title,
      questionCount: game.questions.length,
      timeLimit: game.timeLimit
    });
    
    res.status(201).json({ 
      message: 'بازی با موفقیت ایجاد شد', 
      game: game.getSummary() 
    });
  } catch (error) {
    console.error('Error creating couple game:', error);
    res.status(500).json({ message: 'خطا در ایجاد بازی' });
  }
});

// دریافت همه بازی‌ها (ادمین)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    const games = await CoupleGame.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    const gamesSummary = games.map(game => game.getSummary());
    
    res.json(gamesSummary);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'خطا در دریافت بازی‌ها' });
  }
});

// ویرایش بازی (ادمین)
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;
    const game = await CoupleGame.findById(id);
    
    if (!game) {
      return res.status(404).json({ message: 'بازی یافت نشد' });
    }

    // بررسی اینکه آیا بازی در حال اجرا است
    const activeSessions = await CoupleGameSession.countDocuments({
      gameId: id,
      status: { $in: ['waiting', 'active', 'paused'] }
    });

    if (activeSessions > 0) {
      return res.status(400).json({ 
        message: 'نمی‌توان بازی در حال اجرا را ویرایش کرد' 
      });
    }

    Object.assign(game, req.body);
    await game.save();

    res.json({ 
      message: 'بازی با موفقیت ویرایش شد', 
      game: game.getSummary() 
    });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ message: 'خطا در ویرایش بازی' });
  }
});

// حذف بازی (ادمین)
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;
    console.log('🗑️ حذف بازی با ID:', id);
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'شناسه بازی نامعتبر است' });
    }

    const game = await CoupleGame.findById(id);
    
    if (!game) {
      return res.status(404).json({ message: 'بازی یافت نشد' });
    }

    // بررسی اینکه آیا بازی در حال اجرا است
    const activeSessions = await CoupleGameSession.countDocuments({
      gameId: id,
      status: { $in: ['waiting', 'active', 'paused'] }
    });

    if (activeSessions > 0) {
      return res.status(400).json({ 
        message: 'نمی‌توان بازی در حال اجرا را حذف کرد' 
      });
    }

    await CoupleGame.findByIdAndDelete(id);
    
    // حذف جلسات مربوطه
    const deletedSessions = await CoupleGameSession.deleteMany({ gameId: id });
    
    console.log(`🗑️ ${deletedSessions.deletedCount} جلسه بازی حذف شد برای بازی: ${game.title}`);
    
    res.json({ 
      message: 'بازی با موفقیت حذف شد',
      deletedSessions: deletedSessions.deletedCount
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ message: 'خطا در حذف بازی' });
  }
});

// ===== USER ROUTES =====

// دریافت بازی‌های فعال
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    
    // فیلتر کردن بازی‌های فعال بر اساس تاریخ
    const games = await CoupleGame.find({ 
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
      ]
    })
    .select('title description timeLimit startDate endDate questions category difficulty')
    .sort({ startDate: -1 });
    
    // اضافه کردن questionCount به هر بازی
    const gamesWithCount = games.map(game => ({
      ...game.toObject(),
      questionCount: game.questions ? game.questions.length : 0
    }));
    
    console.log('🎮 بازی‌های فعال:', gamesWithCount.length);
    
    res.json(gamesWithCount);
  } catch (error) {
    console.error('Error fetching active games:', error);
    res.status(500).json({ message: 'خطا در دریافت بازی‌ها' });
  }
});

// شروع بازی جدید
router.post('/start/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id;

    // بررسی وجود بازی
    const game = await CoupleGame.findById(gameId);
    if (!game || !game.isGameActive()) {
      return res.status(404).json({ message: 'بازی یافت نشد یا غیرفعال است' });
    }

    // بررسی تکمیل پروفایل همسر
    if (!req.user.spouseFirstName || !req.user.spouseLastName || 
        !req.user.spouseNationalCode || !req.user.spousePhoneNumber) {
      return res.status(400).json({ 
        message: 'ابتدا باید اطلاعات کامل همسر خود را در پروفایل تکمیل کنید' 
      });
    }

    // بررسی وجود جلسه فعال برای این کاربر
    let existingSession = await CoupleGameSession.findOne({
      gameId,
      $or: [
        { 'couple.partner1': userId },
        { 'couple.partner2': userId }
      ],
      status: { $in: ['waiting', 'active', 'paused'] }
    });

    if (existingSession) {
      // کاربر قبلاً در بازی شرکت کرده - به بازی برمی‌گردد
      console.log('🔄 کاربر به بازی برمی‌گردد:', userId);
      
      // به‌روزرسانی زمان باقی‌مانده
      existingSession.updateTimeRemaining(game.timeLimit);
      await existingSession.save();
      
      return res.json({ 
        message: 'به بازی بازگشتید!',
        session: existingSession,
        game: game.getSummary()
      });
    }

    // بررسی وجود همسر در انتظار با تطبیق اطلاعات
    const waitingPartner = await CoupleGameSession.findOne({
      gameId,
      status: 'waiting',
      $or: [
        { 'couple.partner1': { $exists: false } },
        { 'couple.partner2': { $exists: false } }
      ]
    });

    if (waitingPartner) {
      // بررسی تطبیق اطلاعات همسر
      const waitingUser = await User.findById(
        waitingPartner.couple.partner1 || waitingPartner.couple.partner2
      );
      
      if (!waitingUser) {
        return res.status(400).json({ message: 'کاربر منتظر یافت نشد' });
      }

      const isSpouseMatch = (
        waitingUser.spouseNationalCode === req.user.nationalCode &&
        waitingUser.spousePhoneNumber === req.user.phoneNumber &&
        req.user.spouseNationalCode === waitingUser.nationalCode &&
        req.user.spousePhoneNumber === waitingUser.phoneNumber
      );
      
      if (!isSpouseMatch) {
        return res.status(400).json({ 
          message: 'اطلاعات همسر شما با کاربر منتظر تطبیق ندارد' 
        });
      }

      // اضافه کردن همسر دوم و شروع بازی
      if (!waitingPartner.couple.partner1) {
        waitingPartner.couple.partner1 = userId;
      } else {
        waitingPartner.couple.partner2 = userId;
      }
      
      // شروع بازی
      waitingPartner.startGame(game.timeLimit, game.questions.length);
      await waitingPartner.save();
      
      console.log('🎮 بازی شروع شد:', {
        sessionId: waitingPartner._id,
        gameId: game._id,
        partner1: waitingPartner.couple.partner1,
        partner2: waitingPartner.couple.partner2
      });
      
      // ارسال اطلاعات کامل بازی برای هر دو همسر
      const populatedSession = await CoupleGameSession.findById(waitingPartner._id)
        .populate('gameId')
        .populate('couple.partner1', 'firstName lastName')
        .populate('couple.partner2', 'firstName lastName');
      
      return res.json({ 
        message: 'بازی شروع شد! همسر شما وارد شده است.',
        session: populatedSession,
        game: game.getSummary(),
        gameStarted: true
      });
    } else {
      // ایجاد جلسه جدید
      const newSession = new CoupleGameSession({
        gameId,
        couple: { partner1: userId },
        status: 'waiting',
        questionsOrder: {
          partner1: Array.from({ length: game.questions.length }, (_, i) => i).sort(() => Math.random() - 0.5),
          partner2: Array.from({ length: game.questions.length }, (_, i) => i).sort(() => Math.random() - 0.5)
        }
      });
      
      await newSession.save();
      
      console.log('⏳ جلسه جدید ایجاد شد:', {
        sessionId: newSession._id,
        gameId: game._id,
        partner1: userId
      });
      
      return res.json({ 
        message: 'در انتظار ورود همسر شما...',
        session: newSession,
        game: game.getSummary()
      });
    }
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ message: 'خطا در شروع بازی' });
  }
});

// دریافت وضعیت جلسه
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await CoupleGameSession.findById(sessionId)
      .populate('gameId')
      .populate('couple.partner1', 'firstName lastName')
      .populate('couple.partner2', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ message: 'جلسه یافت نشد' });
    }

    // بررسی دسترسی کاربر
    if (!session.couple?.partner1 || !session.couple?.partner2) {
      return res.status(400).json({ message: 'اطلاعات همسران ناقص است' });
    }
    
    if (session.couple.partner1.toString() !== userId.toString() && 
        session.couple.partner2.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    // به‌روزرسانی زمان باقی‌مانده
    session.updateTimeRemaining(session.gameId?.timeLimit);
    await session.save();

    res.json({
      session: session,
      gameStatus: session.getGameStatus()
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'خطا در دریافت جلسه' });
  }
});

// دریافت وضعیت به‌روز شده جلسه (برای همگام‌سازی)
router.get('/session/:sessionId/status', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await CoupleGameSession.findById(sessionId)
      .populate('gameId')
      .populate('couple.partner1', 'firstName lastName')
      .populate('couple.partner2', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ message: 'جلسه یافت نشد' });
    }

    // بررسی دسترسی کاربر
    if (!session.couple?.partner1 || !session.couple?.partner2) {
      return res.status(400).json({ message: 'اطلاعات همسران ناقص است' });
    }
    
    if (session.couple.partner1.toString() !== userId.toString() && 
        session.couple.partner2.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    // به‌روزرسانی زمان باقی‌مانده
    session.updateTimeRemaining(session.gameId?.timeLimit);
    await session.save();

    res.json({
      session: session,
      gameStatus: session.getGameStatus(),
      isActive: session.status === 'active',
      hasBothPartners: !!(session.couple.partner1 && session.couple.partner2)
    });
  } catch (error) {
    console.error('Error fetching session status:', error);
    res.status(500).json({ message: 'خطا در دریافت وضعیت جلسه' });
  }
});

// دریافت تمام نتایج بازی‌های زوج‌شناسی (فقط ادمین)
router.get('/admin/all-results', authenticateToken, async (req, res) => {
  try {
    // بررسی اینکه کاربر ادمین است
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'فقط ادمین می‌تواند نتایج را مشاهده کند' });
    }

    const sessions = await CoupleGameSession.find({
      status: 'completed'
    })
    .populate('gameId', 'title description')
    .populate('couple.partner1', 'firstName lastName')
    .populate('couple.partner2', 'firstName lastName')
    .sort({ completedAt: -1 });

    const results = sessions.map(session => ({
      id: session._id,
      gameId: session.gameId._id,
      gameTitle: session.gameId.title,
      gameDescription: session.gameId.description,
      similarityPercentage: session.score.similarityPercentage,
      totalPoints: session.score.totalPoints,
      matchingAnswers: session.score.matchingAnswers,
      totalQuestions: session.score.totalQuestions,
      completedAt: session.completedAt,
      partner1: session.couple.partner1,
      partner2: session.couple.partner2
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching all couple game results:', error);
    res.status(500).json({ message: 'خطا در دریافت نتایج بازی‌ها' });
  }
});

// حذف تمام نتایج یک بازی زوج‌شناسی (فقط ادمین)
router.delete('/admin/:gameId/clear-results', authenticateToken, async (req, res) => {
  try {
    // بررسی اینکه کاربر ادمین است
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'فقط ادمین می‌تواند نتایج را حذف کند' });
    }

    const { gameId } = req.params;
    
    // بررسی وجود بازی
    const game = await CoupleGame.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'بازی یافت نشد' });
    }

    // حذف تمام جلسات مربوط به این بازی
    const deleteResult = await CoupleGameSession.deleteMany({ gameId });
    
    console.log(`🗑️ ${deleteResult.deletedCount} جلسه بازی حذف شد برای بازی: ${game.title}`);

    res.json({ 
      message: 'نتایج بازی با موفقیت حذف شد',
      deletedSessions: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error clearing game results:', error);
    res.status(500).json({ message: 'خطا در حذف نتایج بازی' });
  }
});

// خروجی گرفتن از نتایج (فقط ادمین)
router.get('/admin/export-results', authenticateToken, async (req, res) => {
  try {
    // بررسی اینکه کاربر ادمین است
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'فقط ادمین می‌تواند نتایج را export کند' });
    }

    const sessions = await CoupleGameSession.find({
      status: 'completed'
    })
    .populate('gameId', 'title description')
    .populate('couple.partner1', 'firstName lastName')
    .populate('couple.partner2', 'firstName lastName')
    .sort({ completedAt: -1 });

    // ایجاد فایل Excel
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('نتایج بازی‌های زوج‌شناسی');

    // تنظیم ستون‌ها
    worksheet.columns = [
      { header: 'عنوان بازی', key: 'gameTitle', width: 20 },
      { header: 'توضیحات بازی', key: 'gameDescription', width: 30 },
      { header: 'نام همسر اول', key: 'partner1Name', width: 20 },
      { header: 'نام همسر دوم', key: 'partner2Name', width: 20 },
      { header: 'درصد تشابه', key: 'similarityPercentage', width: 15 },
      { header: 'امتیاز کل', key: 'totalPoints', width: 15 },
      { header: 'پاسخ‌های مشابه', key: 'matchingAnswers', width: 20 },
      { header: 'تعداد کل سوالات', key: 'totalQuestions', width: 20 },
      { header: 'تاریخ تکمیل', key: 'completedAt', width: 20 }
    ];

    // اضافه کردن داده‌ها
    sessions.forEach(session => {
      worksheet.addRow({
        gameTitle: session.gameId.title,
        gameDescription: session.gameId.description,
        partner1Name: `${session.couple.partner1.firstName} ${session.couple.partner1.lastName}`,
        partner2Name: `${session.couple.partner2.firstName} ${session.couple.partner2.lastName}`,
        similarityPercentage: `${session.score.similarityPercentage}%`,
        totalPoints: session.score.totalPoints,
        matchingAnswers: session.score.matchingAnswers,
        totalQuestions: session.score.totalQuestions,
        completedAt: new Date(session.completedAt).toLocaleDateString('fa-IR')
      });
    });

    // تنظیم header
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=couple-game-results.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting results:', error);
    res.status(500).json({ message: 'خطا در خروجی گرفتن از نتایج' });
  }
});

// دریافت نتایج بازی‌های کاربر
router.get('/my-results', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await CoupleGameSession.find({
      $or: [
        { 'couple.partner1': userId },
        { 'couple.partner2': userId }
      ],
      status: 'completed'
    })
    .populate('gameId', 'title description')
    .populate('couple.partner1', 'firstName lastName')
    .populate('couple.partner2', 'firstName lastName')
    .sort({ completedAt: -1 })
    .limit(10);

    const results = sessions.map(session => ({
      id: session._id,
      gameTitle: session.gameId.title,
      gameDescription: session.gameId.description,
      similarityPercentage: session.score.similarityPercentage,
      totalPoints: session.score.totalPoints,
      matchingAnswers: session.score.matchingAnswers,
      totalQuestions: session.score.totalQuestions,
      completedAt: session.completedAt,
      partner1: session.couple.partner1,
      partner2: session.couple.partner2
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching couple game results:', error);
    res.status(500).json({ message: 'خطا در دریافت نتایج بازی‌ها' });
  }
});

// پاسخ به سوال
router.post('/answer/:sessionId', authenticateToken, [
  body('questionIndex').isInt({ min: 0 }).withMessage('شماره سوال نامعتبر است'),
  body('selectedOption').isInt({ min: 0 }).withMessage('گزینه انتخاب شده نامعتبر است')
], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionIndex, selectedOption } = req.body;
    const userId = req.user._id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await CoupleGameSession.findById(sessionId)
      .populate('gameId');

    if (!session) {
      return res.status(404).json({ message: 'جلسه یافت نشد' });
    }

    // بررسی دسترسی کاربر
    let partnerKey = null;
    if (session.couple.partner1.toString() === userId.toString()) {
      partnerKey = 'partner1';
    } else if (session.couple.partner2.toString() === userId.toString()) {
      partnerKey = 'partner2';
    } else {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    // بررسی وضعیت بازی
    if (session.status !== 'active') {
      return res.status(400).json({ message: 'بازی فعال نیست' });
    }

    // بررسی اعتبار سوال
    if (!session.gameId || !session.gameId.questions) {
      return res.status(400).json({ message: 'اطلاعات بازی نامعتبر است' });
    }

    if (questionIndex < 0 || questionIndex >= session.gameId.questions.length) {
      return res.status(400).json({ message: 'شماره سوال نامعتبر است' });
    }

    // بررسی اعتبار گزینه
    const question = session.gameId.questions[questionIndex];
    if (selectedOption < 0 || selectedOption >= question.options.length) {
      return res.status(400).json({ message: 'گزینه انتخاب شده نامعتبر است' });
    }

    try {
      // اضافه کردن پاسخ
      session.addAnswer(partnerKey, questionIndex, selectedOption);
      await session.save();
      
      console.log('📝 پاسخ ثبت شد:', {
        sessionId,
        partnerKey,
        questionIndex,
        selectedOption,
        totalQuestions: session.gameId.questions.length,
        partner1Answers: session.answers.partner1.length,
        partner2Answers: session.answers.partner2.length
      });

      // بررسی اتمام بازی
      if (session.status === 'completed') {
        console.log('🎯 بازی تمام شد!');
      }

      res.json({ 
        message: 'پاسخ ثبت شد', 
        session: session,
        gameStatus: session.getGameStatus()
      });
    } catch (answerError) {
      res.status(400).json({ message: answerError.message });
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'خطا در ثبت پاسخ' });
  }
});

// توقف/ادامه بازی
router.post('/session/:sessionId/toggle', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body; // 'pause' یا 'resume'
    const userId = req.user._id;

    const session = await CoupleGameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'جلسه یافت نشد' });
    }

    // بررسی دسترسی کاربر
    if (!session.couple?.partner1 || !session.couple?.partner2) {
      return res.status(400).json({ message: 'اطلاعات همسران ناقص است' });
    }
    
    if (session.couple.partner1.toString() !== userId.toString() && 
        session.couple.partner2.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    if (action === 'pause') {
      session.pauseGame();
    } else if (action === 'resume') {
      session.resumeGame();
    } else {
      return res.status(400).json({ message: 'عملیات نامعتبر است' });
    }

    await session.save();
    
    res.json({ 
      message: action === 'pause' ? 'بازی متوقف شد' : 'بازی ادامه یافت',
      session: session,
      gameStatus: session.getGameStatus()
    });
  } catch (error) {
    console.error('Error toggling game:', error);
    res.status(500).json({ message: 'خطا در تغییر وضعیت بازی' });
  }
});

// لغو بازی
router.post('/session/:sessionId/cancel', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await CoupleGameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'جلسه یافت نشد' });
    }

    // بررسی دسترسی کاربر
    if (!session.couple?.partner1 || !session.couple?.partner2) {
      return res.status(400).json({ message: 'اطلاعات همسران ناقص است' });
    }
    
    if (session.couple.partner1.toString() !== userId.toString() && 
        session.couple.partner2.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    // فقط جلسات در انتظار یا متوقف شده قابل لغو هستند
    if (!['waiting', 'paused'].includes(session.status)) {
      return res.status(400).json({ message: 'این جلسه قابل لغو نیست' });
    }

    session.cancelGame();
    await session.save();
    
    res.json({ 
      message: 'بازی لغو شد',
      session: session
    });
  } catch (error) {
    console.error('Error cancelling game:', error);
    res.status(500).json({ message: 'خطا در لغو بازی' });
  }
});

// دریافت نتایج
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await CoupleGameSession.find({
      $or: [
        { 'couple.partner1': userId },
        { 'couple.partner2': userId }
      ],
      status: 'completed'
    })
    .populate('gameId', 'title description category difficulty')
    .populate('couple.partner1', 'firstName lastName')
    .populate('couple.partner2', 'firstName lastName')
    .sort({ endTime: -1 });

    const results = sessions.map(session => ({
      id: session._id,
      game: session.gameId,
      score: session.score,
      endTime: session.endTime,
      partner1: session.couple.partner1,
      partner2: session.couple.partner2,
      totalQuestions: session.gameId.questions.length
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'خطا در دریافت نتایج' });
  }
});

// ===== LEADERBOARD =====

// رتبه‌بندی زوج‌ها
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await CoupleGameSession.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$couple',
          totalSessions: { $sum: 1 },
          avgSimilarity: { $avg: '$score.similarityPercentage' },
          bestScore: { $max: '$score.similarityPercentage' },
          totalPoints: { $sum: '$score.totalPoints' },
          avgResponseTime: { $avg: '$score.averageResponseTime' }
        }
      },
      { $sort: { avgSimilarity: -1 } },
      { $limit: 50 }
    ]);

    // پر کردن اطلاعات کاربران
    const populatedLeaderboard = await CoupleGameSession.populate(leaderboard, [
      { path: '_id.partner1', select: 'firstName lastName' },
      { path: '_id.partner2', select: 'firstName lastName' }
    ]);

    res.json(populatedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'خطا در دریافت رتبه‌بندی' });
  }
});

module.exports = router;
