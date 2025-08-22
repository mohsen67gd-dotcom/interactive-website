const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const { requireAuth } = require('../middleware/auth');

// Get all exams
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'خطا در دریافت آزمون‌ها' });
  }
});

// Start exam - MUST come before /:id route
router.post('/:id/start', requireAuth, async (req, res) => {
  try {
    const examId = req.params.id;
    const userId = req.user._id;

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }

    // Check if user already started this exam
    const existingResult = await ExamResult.findOne({ examId, userId });
    console.log('Existing result check:', { existingResult: existingResult ? existingResult._id : null, completed: existingResult?.completed });
    
    if (existingResult && existingResult.completed) {
      return res.status(400).json({ message: 'شما قبلاً این آزمون را تکمیل کرده‌اید' });
    }

    let examResult;
    if (existingResult) {
      // Resume existing exam
      examResult = existingResult;
    } else {
      // Create new exam result
      const totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      console.log('Creating new exam result:', { examId, userId, totalPoints });
      
      examResult = new ExamResult({
        examId,
        userId,
        totalPoints,
        startedAt: new Date(),
        timeSpent: 0
      });
      
      console.log('Exam result object before save:', examResult);
      await examResult.save();
      console.log('Exam result saved successfully:', examResult._id);
    }

    console.log('Exam started:', { examId, examResultId: examResult._id, timeLimit: exam.timeLimit });

    res.json({ 
      message: 'آزمون شروع شد',
      examResultId: examResult._id,
      timeLimit: exam.timeLimit
    });

  } catch (error) {
    console.error('Start exam error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'خطا در اعتبارسنجی داده‌ها',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'خطا در شروع آزمون' });
  }
});

// Submit exam - MUST come before /:id route
router.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const { answers, examResultId } = req.body;
    const examId = req.params.id;
    const userId = req.user._id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'پاسخ‌ها الزامی هستند' });
    }

    if (!examResultId) {
      return res.status(400).json({ message: 'شناسه آزمون الزامی است' });
    }

    console.log('Submit exam request:', { examId, examResultId, userId });
    
    // Find the exam and result
    const [exam, examResult] = await Promise.all([
      Exam.findById(examId),
      ExamResult.findById(examResultId)
    ]);

    console.log('Found exam:', exam ? exam._id : null);
    console.log('Found exam result:', examResult ? { 
      id: examResult._id, 
      userId: examResult.userId, 
      examId: examResult.examId,
      completed: examResult.completed 
    } : null);

    if (!exam) {
      console.log('Exam not found for ID:', examId);
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }

    if (!examResult) {
      console.log('Exam result not found for ID:', examResultId);
      return res.status(404).json({ message: 'نتیجه آزمون یافت نشد' });
    }

    if (examResult.userId.toString() !== userId.toString()) {
      console.log('User ID mismatch:', { 
        examResultUserId: examResult.userId.toString(), 
        requestUserId: userId.toString() 
      });
      return res.status(404).json({ message: 'نتیجه آزمون یافت نشد' });
    }

    if (examResult.completed) {
      return res.status(400).json({ message: 'این آزمون قبلاً تکمیل شده است' });
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;

    answers.forEach(answer => {
      const questionIndex = parseInt(answer.questionId.split('_')[1]);
      const question = exam.questions[questionIndex];
      
      if (question) {
        totalPoints += question.points || 1;
        
        if (question.type === 'multiple_choice') {
          const selectedOption = parseInt(answer.answer);
          if (selectedOption === question.correctAnswer) {
            score += question.points || 1;
          }
        } else if (question.type === 'descriptive') {
          // For descriptive questions, give partial points if answer is not empty
          if (answer.answer && answer.answer.trim().length > 0) {
            score += Math.floor((question.points || 1) * 0.5); // 50% of points
          }
        }
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const timeSpent = Math.floor((new Date() - examResult.startedAt) / 1000);

    // Update exam result
    examResult.answers = answers;
    examResult.score = score;
    examResult.totalPoints = totalPoints;
    examResult.percentage = percentage;
    examResult.timeSpent = timeSpent;
    examResult.completed = true;
    examResult.submittedAt = new Date();

    await examResult.save();

    console.log('Exam submitted:', { examId, examResultId, score, totalPoints, percentage, timeSpent });

    res.json({ 
      message: 'آزمون با موفقیت تکمیل شد',
      score,
      totalPoints,
      percentage: Math.round(percentage * 10) / 10
    });

  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ message: 'خطا در تکمیل آزمون' });
  }
});

// Get exam by ID - MUST come after specific routes
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }
    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'خطا در دریافت آزمون' });
  }
});

// Create new exam
router.post('/', async (req, res) => {
  try {
    console.log('Received exam data:', req.body);
    
    const { title, description, timeLimit, questions } = req.body;
    
    if (!title || !questions || questions.length === 0 || !timeLimit) {
      return res.status(400).json({ message: 'عنوان، سوالات و زمان آزمون الزامی هستند' });
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text || !question.type) {
        return res.status(400).json({ 
          message: `سوال ${i + 1} نامعتبر است. متن و نوع سوال الزامی هستند.` 
        });
      }
      
      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length === 0) {
          return res.status(400).json({ 
            message: `سوال ${i + 1} چند گزینه‌ای است اما گزینه‌ای ندارد.` 
          });
        }
        
        if (question.correctAnswer === undefined || question.correctAnswer === null) {
          return res.status(400).json({ 
            message: `سوال ${i + 1} چند گزینه‌ای است اما پاسخ صحیح انتخاب نشده.` 
          });
        }
      }
      
      if (!question.points || question.points < 1) {
        return res.status(400).json({ 
          message: `سوال ${i + 1} امتیاز معتبر ندارد.` 
        });
      }
    }

    const exam = new Exam({
      title,
      description,
      timeLimit,
      questions
    });

    console.log('Saving exam:', exam);
    await exam.save();
    console.log('Exam saved successfully');
    
    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
    console.error('Error details:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'خطا در اعتبارسنجی داده‌ها',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'خطا در ایجاد آزمون' });
  }
});

// Update exam
router.put('/:id', async (req, res) => {
  try {
    const { title, description, timeLimit, questions } = req.body;
    
    if (!title || !questions || questions.length === 0 || !timeLimit) {
      return res.status(400).json({ message: 'عنوان، سوالات و زمان آزمون الزامی هستند' });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { title, description, timeLimit, questions },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی آزمون' });
  }
});

// Delete exam
router.delete('/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: 'آزمون یافت نشد' });
    }

    res.json({ message: 'آزمون با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'خطا در حذف آزمون' });
  }
});

module.exports = router;
