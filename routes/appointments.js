const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// User: Get their appointments
router.get('/my', requireAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .sort({ preferredDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ message: 'خطا در دریافت نوبت‌های شما' });
  }
});

// User: Create appointment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      serviceType, 
      title, 
      description, 
      preferredDate, 
      preferredTime, 
      duration,
      contactMethod,
      contactInfo
    } = req.body;
    
    if (!serviceType || !title || !description || !preferredDate || !preferredTime) {
      return res.status(400).json({ message: 'تمام فیلدهای الزامی را پر کنید' });
    }
    
    const appointment = new Appointment({
      userId: req.user._id,
      serviceType,
      title,
      description,
      preferredDate: new Date(preferredDate),
      preferredTime,
      duration: duration || 60,
      contactMethod,
      contactInfo
    });
    
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'خطا در ایجاد نوبت' });
  }
});

// User: Update appointment
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'نوبت یافت نشد' });
    }
    
    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
    
    if (appointment.status !== 'در انتظار') {
      return res.status(400).json({ message: 'نوبت تایید شده قابل ویرایش نیست' });
    }
    
    const { 
      serviceType, 
      title, 
      description, 
      preferredDate, 
      preferredTime, 
      duration,
      contactMethod,
      contactInfo
    } = req.body;
    
    if (!serviceType || !title || !description || !preferredDate || !preferredTime) {
      return res.status(400).json({ message: 'تمام فیلدهای الزامی را پر کنید' });
    }
    
    appointment.serviceType = serviceType;
    appointment.title = title;
    appointment.description = description;
    appointment.preferredDate = new Date(preferredDate);
    appointment.preferredTime = preferredTime;
    appointment.duration = duration || 60;
    appointment.contactMethod = contactMethod;
    appointment.contactInfo = contactInfo;
    
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی نوبت' });
  }
});

// User: Cancel appointment
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'نوبت یافت نشد' });
    }
    
    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
    
    if (appointment.status !== 'در انتظار') {
      return res.status(400).json({ message: 'نوبت تایید شده قابل لغو نیست' });
    }
    
    appointment.status = 'لغو شده';
    await appointment.save();
    
    res.json({ message: 'نوبت با موفقیت لغو شد' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'خطا در لغو نوبت' });
  }
});

// Admin: Get all appointments
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, serviceType } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    
    const appointments = await Appointment.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Appointment.countDocuments(query);
    
    res.json({
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalAppointments: count
    });
  } catch (error) {
    console.error('Admin get all appointments error:', error);
    res.status(500).json({ message: 'خطا در دریافت نوبت‌ها' });
  }
});

// Admin: Update appointment status
router.put('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, confirmedDate, confirmedTime } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'وضعیت الزامی است' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'نوبت یافت نشد' });
    }
    
    appointment.status = status;
    if (adminNotes) appointment.adminNotes = adminNotes;
    if (confirmedDate) appointment.confirmedDate = new Date(confirmedDate);
    if (confirmedTime) appointment.confirmedTime = confirmedTime;
    
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error('Admin update appointment status error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی وضعیت نوبت' });
  }
});

// Admin: Delete appointment
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'نوبت یافت نشد' });
    }
    
    res.json({ message: 'نوبت با موفقیت حذف شد' });
  } catch (error) {
    console.error('Admin delete appointment error:', error);
    res.status(500).json({ message: 'خطا در حذف نوبت' });
  }
});

module.exports = router;
