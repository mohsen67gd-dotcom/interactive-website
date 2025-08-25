const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// User: Get their consultations
router.get('/my', requireAuth, async (req, res) => {
  try {
    const consultations = await Consultation.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(consultations);
  } catch (error) {
    console.error('Get user consultations error:', error);
    res.status(500).json({ message: 'خطا در دریافت مشاوره‌های شما' });
  }
});

// User: Create consultation
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      consultationType, 
      title, 
      description, 
      detailedQuestion, 
      preferredContactMethod, 
      preferredTime,
      urgency,
      contactInfo,
      isAnonymous,
      tags
    } = req.body;
    
    if (!consultationType || !title || !description || !detailedQuestion) {
      return res.status(400).json({ message: 'تمام فیلدهای الزامی را پر کنید' });
    }
    
    const consultation = new Consultation({
      userId: req.user._id,
      consultationType,
      title,
      description,
      detailedQuestion,
      preferredContactMethod,
      preferredTime,
      urgency,
      contactInfo,
      isAnonymous,
      tags
    });
    
    await consultation.save();
    res.status(201).json(consultation);
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ message: 'خطا در ایجاد درخواست مشاوره' });
  }
});

// User: Update consultation
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'درخواست مشاوره یافت نشد' });
    }
    
    if (consultation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
    
    if (consultation.status !== 'در انتظار') {
      return res.status(400).json({ message: 'درخواست تایید شده قابل ویرایش نیست' });
    }
    
    const { 
      consultationType, 
      title, 
      description, 
      detailedQuestion, 
      preferredContactMethod, 
      preferredTime,
      urgency,
      contactInfo,
      isAnonymous,
      tags
    } = req.body;
    
    if (!consultationType || !title || !description || !detailedQuestion) {
      return res.status(400).json({ message: 'تمام فیلدهای الزامی را پر کنید' });
    }
    
    consultation.consultationType = consultationType;
    consultation.title = title;
    consultation.description = description;
    consultation.detailedQuestion = detailedQuestion;
    consultation.preferredContactMethod = preferredContactMethod;
    consultation.preferredTime = preferredTime;
    consultation.urgency = urgency;
    consultation.contactInfo = contactInfo;
    consultation.isAnonymous = isAnonymous;
    consultation.tags = tags;
    
    await consultation.save();
    res.json(consultation);
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی درخواست مشاوره' });
  }
});

// User: Close consultation
router.put('/:id/close', requireAuth, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'درخواست مشاوره یافت نشد' });
    }
    
    if (consultation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
    
    consultation.status = 'بسته شده';
    await consultation.save();
    
    res.json({ message: 'درخواست مشاوره با موفقیت بسته شد' });
  } catch (error) {
    console.error('Close consultation error:', error);
    res.status(500).json({ message: 'خطا در بستن درخواست مشاوره' });
  }
});

// Admin: Get all consultations
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, consultationType, urgency } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (consultationType) query.consultationType = consultationType;
    if (urgency) query.urgency = urgency;
    
    const consultations = await Consultation.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Consultation.countDocuments(query);
    
    res.json({
      consultations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalConsultations: count
    });
  } catch (error) {
    console.error('Admin get all consultations error:', error);
    res.status(500).json({ message: 'خطا در دریافت درخواست‌های مشاوره' });
  }
});

// Admin: Respond to consultation
router.put('/admin/:id/respond', requireAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'محتوی پاسخ الزامی است' });
    }
    
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'درخواست مشاوره یافت نشد' });
    }
    
    consultation.adminResponse = {
      content,
      respondedAt: new Date(),
      respondedBy: req.user._id
    };
    
    consultation.status = 'پاسخ داده شده';
    await consultation.save();
    
    res.json(consultation);
  } catch (error) {
    console.error('Admin respond to consultation error:', error);
    res.status(500).json({ message: 'خطا در پاسخ به درخواست مشاوره' });
  }
});

// Admin: Update consultation status
router.put('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, priority } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'وضعیت الزامی است' });
    }
    
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'درخواست مشاوره یافت نشد' });
    }
    
    consultation.status = status;
    if (priority) consultation.priority = priority;
    
    await consultation.save();
    res.json(consultation);
  } catch (error) {
    console.error('Admin update consultation status error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی وضعیت درخواست مشاوره' });
  }
});

// Admin: Delete consultation
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndDelete(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'درخواست مشاوره یافت نشد' });
    }
    
    res.json({ message: 'درخواست مشاوره با موفقیت حذف شد' });
  } catch (error) {
    console.error('Admin delete consultation error:', error);
    res.status(500).json({ message: 'خطا در حذف درخواست مشاوره' });
  }
});

module.exports = router;
