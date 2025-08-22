const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const { requireAuth } = require('../middleware/auth');

// Get all surveys
router.get('/', async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({ message: 'خطا در دریافت نظرسنجی‌ها' });
  }
});

// Get survey by ID
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }
    res.json(survey);
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ message: 'خطا در دریافت نظرسنجی' });
  }
});

// Create new survey
router.post('/', async (req, res) => {
  try {
    console.log('Received survey data:', req.body);
    
    const { title, description, questions } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'عنوان و سوالات الزامی هستند' });
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text || !question.type) {
        return res.status(400).json({ 
          message: `سوال ${i + 1} نامعتبر است. متن و نوع سوال الزامی هستند.` 
        });
      }
      
      if (question.type === 'multiple_choice' && (!question.options || question.options.length === 0)) {
        return res.status(400).json({ 
          message: `سوال ${i + 1} چند گزینه‌ای است اما گزینه‌ای ندارد.` 
        });
      }
    }

    const survey = new Survey({
      title,
      description,
      questions
    });

    console.log('Saving survey:', survey);
    await survey.save();
    console.log('Survey saved successfully');
    
    res.status(201).json(survey);
  } catch (error) {
    console.error('Create survey error:', error);
    console.error('Error details:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'خطا در اعتبارسنجی داده‌ها',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'خطا در ایجاد نظرسنجی' });
  }
});

// Update survey
router.put('/:id', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'عنوان و سوالات الزامی هستند' });
    }

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { title, description, questions },
      { new: true, runValidators: true }
    );

    if (!survey) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }

    res.json(survey);
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی نظرسنجی' });
  }
});

// Delete survey
router.delete('/:id', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }

    res.json({ message: 'نظرسنجی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({ message: 'خطا در حذف نظرسنجی' });
  }
});

// Submit survey response
router.post('/:id/respond', requireAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    const surveyId = req.params.id;
    const userId = req.user._id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'پاسخ‌ها الزامی هستند' });
    }

    // Find the survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }

    // Check if user already responded to this survey
    const existingResponse = await SurveyResponse.findOne({ surveyId, userId });
    if (existingResponse) {
      return res.status(400).json({ message: 'شما قبلاً به این نظرسنجی پاسخ داده‌اید' });
    }

    // Create new response
    const surveyResponse = new SurveyResponse({
      surveyId,
      userId,
      answers
    });

    await surveyResponse.save();
    console.log('Survey response saved:', surveyResponse);

    res.json({ 
      message: 'پاسخ شما با موفقیت ثبت شد',
      surveyId,
      answersCount: answers.length
    });

  } catch (error) {
    console.error('Submit survey response error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'شما قبلاً به این نظرسنجی پاسخ داده‌اید' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'خطا در اعتبارسنجی داده‌ها',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'خطا در ثبت پاسخ' });
  }
});

module.exports = router;
