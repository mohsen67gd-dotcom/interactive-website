const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Settings = require('../models/Settings');
const { requireAdmin } = require('../middleware/auth');
const excel = require('exceljs');
const bcrypt = require('bcryptjs');

// Get survey analytics
router.get('/surveys/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const surveyId = req.params.id;
    
    // Get survey details
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ surveyId }).populate('userId', 'firstName lastName phoneNumber gender birthDate');
    
    // Calculate analytics
    const totalResponses = responses.length;
    const questionAnalytics = [];

    survey.questions.forEach((question, questionIndex) => {
      const questionResponses = responses.map(response => {
        const answer = response.answers.find(a => a.questionId === `question_${questionIndex}`);
        return answer ? answer.answer : null;
      }).filter(answer => answer !== null);

      let analytics = {
        questionIndex,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: questionResponses.length,
        responseRate: totalResponses > 0 ? (questionResponses.length / totalResponses * 100).toFixed(1) : 0
      };

      if (question.type === 'multiple_choice' && question.options) {
        // Count each option
        const optionCounts = {};
        question.options.forEach(option => {
          optionCounts[option] = questionResponses.filter(answer => answer === option).length;
        });
        analytics.optionCounts = optionCounts;
        analytics.mostPopularOption = Object.keys(optionCounts).reduce((a, b) => 
          optionCounts[a] > optionCounts[b] ? a : b
        );
      } else if (question.type === 'text') {
        // For text questions, analyze response length
        const responseLengths = questionResponses.map(answer => answer.length);
        analytics.averageLength = responseLengths.length > 0 ? 
          (responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length).toFixed(1) : 0;
        analytics.shortestResponse = responseLengths.length > 0 ? Math.min(...responseLengths) : 0;
        analytics.longestResponse = responseLengths.length > 0 ? Math.max(...responseLengths) : 0;
      }

      questionAnalytics.push(analytics);
    });

    // Gender distribution
    const genderDistribution = {};
    responses.forEach(response => {
      if (response.userId && response.userId.gender) {
        const gender = response.userId.gender;
        genderDistribution[gender] = (genderDistribution[gender] || 0) + 1;
      } else {
        genderDistribution['نامشخص'] = (genderDistribution['نامشخص'] || 0) + 1;
      }
    });

    // Age distribution (calculate from birthDate)
    const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 };
    responses.forEach(response => {
      if (response.userId && response.userId.birthDate) {
        const age = new Date().getFullYear() - new Date(response.userId.birthDate).getFullYear();
        if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 45) ageGroups['36-45']++;
        else ageGroups['46+']++;
      }
    });

    const analytics = {
      surveyId: survey._id,
      surveyTitle: survey.title,
      totalResponses,
      questionAnalytics,
      genderDistribution,
      ageGroups,
      responseRate: totalResponses > 0 ? (totalResponses / 100 * 100).toFixed(1) : 0, // Assuming 100 is total users
      createdAt: survey.createdAt,
      lastResponse: responses.length > 0 ? Math.max(...responses.map(r => r.submittedAt)) : null
    };

    res.json(analytics);
  } catch (error) {
    console.error('Survey analytics error:', error);
    res.status(500).json({ message: 'خطا در دریافت تحلیل نظرسنجی' });
  }
});

// Export survey responses to Excel
router.get('/surveys/:id/export', requireAdmin, async (req, res) => {
  try {
    const surveyId = req.params.id;
    
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }

    const responses = await SurveyResponse.find({ surveyId }).populate('userId', 'firstName lastName phoneNumber gender birthDate');
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('نتایج نظرسنجی');
    
    // Add headers
    const headers = ['نام', 'نام خانوادگی', 'شماره تلفن', 'جنسیت', 'تاریخ تولد', 'تاریخ پاسخ'];
    survey.questions.forEach((question, index) => {
      headers.push(`سوال ${index + 1}: ${question.text}`);
    });
    
    worksheet.addRow(headers);
    
    // Add data rows
    responses.forEach(response => {
      const row = [
        response.userId ? response.userId.firstName || '' : '',
        response.userId ? response.userId.lastName || '' : '',
        response.userId ? response.userId.phoneNumber || '' : '',
        response.userId ? response.userId.gender || '' : '',
        response.userId && response.userId.birthDate ? new Date(response.userId.birthDate).toLocaleDateString('fa-IR') : '',
        new Date(response.submittedAt).toLocaleDateString('fa-IR')
      ];
      
      survey.questions.forEach((question, questionIndex) => {
        const answer = response.answers.find(a => a.questionId === `question_${questionIndex}`);
        row.push(answer ? answer.answer : '');
      });
      
      worksheet.addRow(row);
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Sanitize filename by removing invalid characters and using only safe characters
    const sanitizedTitle = survey.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const filename = `survey-${sanitizedTitle}-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Export survey error:', error);
    res.status(500).json({ message: 'خطا در خروجی گرفتن' });
  }
});

// Get exam analytics
router.get('/exams/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    
    // Get exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }

    // Get all results for this exam
    const results = await ExamResult.find({ examId, completed: true }).populate('userId', 'firstName lastName phoneNumber gender birthDate');
    
    // Calculate analytics
    const totalParticipants = results.length;
    const totalPossiblePoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    if (totalParticipants === 0) {
      return res.json({
        examId: exam._id,
        examTitle: exam.title,
        totalParticipants: 0,
        message: 'هنوز هیچ کس در این آزمون شرکت نکرده است'
      });
    }

    // Score statistics
    const scores = results.map(r => r.score);
    const percentages = results.map(r => r.percentage);
    const timeSpent = results.map(r => r.timeSpent);
    
    const scoreStats = {
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
    };

    const percentageStats = {
      average: (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2),
      highest: Math.max(...percentages).toFixed(2),
      lowest: Math.min(...percentages).toFixed(2)
    };

    const timeStats = {
      average: (timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length / 60).toFixed(2), // in minutes
      fastest: (Math.min(...timeSpent) / 60).toFixed(2),
      slowest: (Math.max(...timeSpent) / 60).toFixed(2)
    };

    // Performance distribution
    const performanceDistribution = {
      'عالی (90-100%)': percentages.filter(p => p >= 90).length,
      'خوب (80-89%)': percentages.filter(p => p >= 80 && p < 90).length,
      'متوسط (70-79%)': percentages.filter(p => p >= 70 && p < 80).length,
      'ضعیف (60-69%)': percentages.filter(p => p >= 60 && p < 70).length,
      'خیلی ضعیف (<60%)': percentages.filter(p => p < 60).length
    };

    // Gender distribution
    const genderDistribution = {};
    results.forEach(result => {
      if (result.userId && result.userId.gender) {
        const gender = result.userId.gender;
        genderDistribution[gender] = (genderDistribution[gender] || 0) + 1;
      } else {
        genderDistribution['نامشخص'] = (genderDistribution['نامشخص'] || 0) + 1;
      }
    });

    // Age distribution
    const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 };
    results.forEach(result => {
      if (result.userId && result.userId.birthDate) {
        const age = new Date().getFullYear() - new Date(result.userId.birthDate).getFullYear();
        if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 45) ageGroups['36-45']++;
        else ageGroups['46+']++;
      }
    });

    // Top performers
    const topPerformers = results
      .filter(result => result.userId) // Only include results with valid user data
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(result => ({
        name: result.userId ? `${result.userId.firstName || ''} ${result.userId.lastName || ''}`.trim() || 'کاربر ناشناس' : 'کاربر ناشناس',
        phone: result.userId ? result.userId.phoneNumber || 'نامشخص' : 'نامشخص',
        score: result.score,
        percentage: result.percentage.toFixed(2),
        timeSpent: (result.timeSpent / 60).toFixed(2)
      }));

    // Question analysis
    const questionAnalysis = exam.questions.map((question, index) => {
      const questionResults = results.map(result => {
        const answer = result.answers.find(a => a.questionId === `question_${index}`);
        return answer ? answer.answer : null;
      }).filter(answer => answer !== null);

      let analysis = {
        questionIndex: index + 1,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: questionResults.length,
        correctAnswers: 0,
        accuracy: 0
      };

      if (question.type === 'multiple_choice') {
        const correctCount = questionResults.filter(answer => 
          parseInt(answer) === question.correctAnswer
        ).length;
        analysis.correctAnswers = correctCount;
        analysis.accuracy = questionResults.length > 0 ? 
          (correctCount / questionResults.length * 100).toFixed(1) : 0;
      }

      return analysis;
    });

    const analytics = {
      examId: exam._id,
      examTitle: exam.title,
      totalParticipants,
      totalPossiblePoints,
      scoreStats,
      percentageStats,
      timeStats,
      performanceDistribution,
      genderDistribution,
      ageGroups,
      topPerformers,
      questionAnalysis,
      createdAt: exam.createdAt,
      lastParticipation: results.length > 0 ? Math.max(...results.map(r => r.submittedAt)) : null
    };

    res.json(analytics);
  } catch (error) {
    console.error('Exam analytics error:', error);
    res.status(500).json({ message: 'خطا در دریافت تحلیل آزمون' });
  }
});

// Export exam results to Excel
router.get('/exams/:id/export', requireAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }

    const results = await ExamResult.find({ examId, completed: true }).populate('userId', 'firstName lastName phoneNumber gender birthDate');
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('نتایج آزمون');
    
    // Add headers
    const headers = [
      'نام', 'نام خانوادگی', 'شماره تلفن', 'جنسیت', 'تاریخ تولد',
      'امتیاز', 'امتیاز کل', 'درصد', 'زمان صرف شده (دقیقه)', 'تاریخ شرکت'
    ];
    
    worksheet.addRow(headers);
    
    // Add data rows
    results.forEach(result => {
      const row = [
        result.userId ? result.userId.firstName || '' : '',
        result.userId ? result.userId.lastName || '' : '',
        result.userId ? result.userId.phoneNumber || '' : '',
        result.userId ? result.userId.gender || '' : '',
        result.userId && result.userId.birthDate ? new Date(result.userId.birthDate).toLocaleDateString('fa-IR') : '',
        result.score,
        result.totalPoints,
        result.percentage.toFixed(2),
        (result.timeSpent / 60).toFixed(2),
        new Date(result.submittedAt).toLocaleDateString('fa-IR')
      ];
      
      worksheet.addRow(row);
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Sanitize filename by removing invalid characters and using only safe characters
    const sanitizedTitle = exam.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const filename = `exam-${sanitizedTitle}-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Export exam error:', error);
    res.status(500).json({ message: 'خطا در خروجی گرفتن' });
  }
});

// Get all users with export to Excel
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    if (req.query.export === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      worksheet.columns = [
        { header: 'نام', key: 'firstName', width: 15 },
        { header: 'نام خانوادگی', key: 'lastName', width: 20 },
        { header: 'کد ملی', key: 'nationalCode', width: 15 },
        { header: 'تاریخ تولد', key: 'birthDate', width: 15 },
        { header: 'جنسیت', key: 'gender', width: 10 },
        { header: 'شماره تلفن', key: 'phoneNumber', width: 15 },
        { header: 'نام همسر', key: 'spouseFirstName', width: 15 },
        { header: 'نام خانوادگی همسر', key: 'spouseLastName', width: 20 },
        { header: 'کد ملی همسر', key: 'spouseNationalCode', width: 15 },
        { header: 'شماره تلفن همسر', key: 'spousePhoneNumber', width: 15 },
        { header: 'وضعیت', key: 'isActive', width: 10 },
        { header: 'نوع کاربر', key: 'isAdmin', width: 10 },
        { header: 'تاریخ ثبت نام', key: 'createdAt', width: 20 }
      ];

      users.forEach(user => {
        worksheet.addRow({
          firstName: user.firstName,
          lastName: user.lastName,
          nationalCode: user.nationalCode,
          birthDate: user.birthDate.toLocaleDateString('fa-IR'),
          gender: user.gender === 'male' ? 'مرد' : 'زن',
          phoneNumber: user.phoneNumber,
          spouseFirstName: user.spouseFirstName || '-',
          spouseLastName: user.spouseLastName || '-',
          spouseNationalCode: user.spouseNationalCode || '-',
          spousePhoneNumber: user.spousePhoneNumber || '-',
          isActive: user.isActive ? 'فعال' : 'غیرفعال',
          isAdmin: user.isAdmin ? 'ادمین' : 'کاربر عادی',
          createdAt: user.createdAt.toLocaleDateString('fa-IR')
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ users });
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'خطا در دریافت کاربران' });
  }
});

// Create new user
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, nationalCode, birthDate, gender, phoneNumber, password, isAdmin, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ phoneNumber }, { nationalCode }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'کاربری با این شماره تلفن یا کد ملی قبلاً ثبت شده است' 
      });
    }

    // Hash password if provided, otherwise use national code as default
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash(nationalCode, 10);

    const user = new User({
      firstName,
      lastName,
      nationalCode,
      birthDate,
      gender,
      phoneNumber,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      isActive: isActive !== false // Default to true if not specified
    });

    await user.save();

    res.status(201).json({ 
      message: 'کاربر با موفقیت ایجاد شد',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nationalCode: user.nationalCode,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'خطا در ایجاد کاربر' });
  }
});

// Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, nationalCode, birthDate, gender, phoneNumber, isAdmin, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Check if phone number or national code is already taken by another user
    const existingUser = await User.findOne({ 
      $or: [{ phoneNumber }, { nationalCode }],
      _id: { $ne: id }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'کاربری با این شماره تلفن یا کد ملی قبلاً ثبت شده است' 
      });
    }

    // Update user fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.nationalCode = nationalCode;
    user.birthDate = birthDate;
    user.gender = gender;
    user.phoneNumber = phoneNumber;
    user.isAdmin = isAdmin;
    user.isActive = isActive;

    await user.save();

    res.json({ 
      message: 'کاربر با موفقیت بروزرسانی شد',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nationalCode: user.nationalCode,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی کاربر' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Prevent deleting the current admin user
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'نمی‌توانید حساب کاربری خود را حذف کنید' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'خطا در حذف کاربر' });
  }
});

// Toggle user status (active/inactive)
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Prevent deactivating the current admin user
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({ message: 'نمی‌توانید حساب کاربری خود را غیرفعال کنید' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ 
      message: `کاربر ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      user: {
        _id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'خطا در تغییر وضعیت کاربر' });
  }
});

// Toggle admin status
router.patch('/users/:id/admin', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Prevent removing admin status from the current admin user
    if (user._id.toString() === req.user._id.toString() && !isAdmin) {
      return res.status(400).json({ message: 'نمی‌توانید وضعیت ادمین خود را تغییر دهید' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ 
      message: `کاربر ${isAdmin ? 'ادمین' : 'کاربر عادی'} شد`,
      user: {
        _id: user._id,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({ message: 'خطا در تغییر وضعیت ادمین' });
  }
});

// Get survey responses with export
router.get('/surveys/:surveyId/responses', requireAdmin, async (req, res) => {
  try {
    const { surveyId } = req.params;
    const responses = await SurveyResponse.find({ surveyId })
      .populate('userId', 'firstName lastName phoneNumber')
      .populate('surveyId', 'title');

    if (req.query.export === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Survey Responses');

      worksheet.columns = [
        { header: 'نام', key: 'firstName', width: 15 },
        { header: 'نام خانوادگی', key: 'lastName', width: 20 },
        { header: 'شماره تلفن', key: 'phoneNumber', width: 15 },
        { header: 'سوال', key: 'question', width: 30 },
        { header: 'پاسخ', key: 'answer', width: 40 },
        { header: 'تاریخ پاسخ', key: 'submittedAt', width: 20 }
      ];

      responses.forEach(response => {
        response.answers.forEach(answer => {
          worksheet.addRow({
            firstName: response.userId ? response.userId.firstName || '' : '',
            lastName: response.userId ? response.userId.lastName || '' : '',
            phoneNumber: response.userId ? response.userId.phoneNumber || '' : '',
            question: answer.questionText || '',
            answer: answer.answer || '',
            submittedAt: response.submittedAt.toLocaleDateString('fa-IR')
          });
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="survey-responses.xlsx"');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ responses });
    }
  } catch (error) {
    console.error('Get survey responses error:', error);
    res.status(500).json({ message: 'خطا در دریافت پاسخ‌ها' });
  }
});

// Get exam results with export
router.get('/exams/:examId/results', requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await ExamResult.find({ examId })
      .populate('userId', 'firstName lastName phoneNumber')
      .populate('examId', 'title totalPoints')
      .sort({ score: -1 });

    if (req.query.export === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Exam Results');

      worksheet.columns = [
        { header: 'نام', key: 'firstName', width: 15 },
        { header: 'نام خانوادگی', key: 'lastName', width: 20 },
        { header: 'شماره تلفن', key: 'phoneNumber', width: 15 },
        { header: 'امتیاز', key: 'score', width: 10 },
        { header: 'کل امتیاز', key: 'totalPoints', width: 10 },
        { header: 'درصد', key: 'percentage', width: 10 },
        { header: 'مدت زمان (دقیقه)', key: 'duration', width: 15 },
        { header: 'تاریخ آزمون', key: 'submittedAt', width: 20 }
      ];

      results.forEach(result => {
        worksheet.addRow({
          firstName: result.userId ? result.userId.firstName || '' : '',
          lastName: result.userId ? result.userId.lastName || '' : '',
          phoneNumber: result.userId ? result.userId.phoneNumber || '' : '',
          score: result.score,
          totalPoints: result.totalPoints,
          percentage: `${result.percentage}%`,
          duration: result.duration,
          submittedAt: result.submittedAt.toLocaleDateString('fa-IR')
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="exam-results.xlsx"');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Calculate statistics
      const stats = {
        totalParticipants: results.length,
        averageScore: results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2) : 0,
        averagePercentage: results.length > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2) : 0,
        highestScore: results.length > 0 ? Math.max(...results.map(r => r.score)) : 0,
        lowestScore: results.length > 0 ? Math.min(...results.map(r => r.score)) : 0
      };

      res.json({ results, stats });
    }
  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({ message: 'خطا در دریافت نتایج' });
  }
});

// Update site settings
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    console.log('Updating settings with:', req.body);
    
    let settings = await Settings.findOne();
    
    if (settings) {
      // Update existing settings
      Object.assign(settings, req.body);
      await settings.save();
      console.log('Settings updated successfully');
    } else {
      // Create new settings
      settings = new Settings(req.body);
      await settings.save();
      console.log('New settings created successfully');
    }

    res.json({ message: 'تنظیمات با موفقیت بروزرسانی شد' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی تنظیمات' });
  }
});

// Get site settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = new Settings({
        siteTitle: 'سایت تعاملی',
        siteLogo: '',
        aboutUs: {
          title: 'درباره ما',
          content: 'به سایت تعاملی ما خوش آمدید. این سایت برای ارائه خدمات نظرسنجی و آزمون طراحی شده است.',
          image: ''
        },
        socialLinks: [
          {
            platform: 'whatsapp',
            title: 'واتساپ',
            url: 'https://wa.me/your-number',
            icon: 'whatsapp',
            isActive: true
          },
          {
            platform: 'telegram',
            title: 'تلگرام',
            url: 'https://t.me/your-channel',
            icon: 'telegram',
            isActive: true
          }
        ],
        contactInfo: {
          email: 'info@example.com',
          phone: '+98-21-12345678',
          address: 'تهران، ایران'
        }
      });
      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'خطا در دریافت تنظیمات' });
  }
});

module.exports = router;
