const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// Register user
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('نام باید حداقل 2 کاراکتر باشد'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('نام خانوادگی باید حداقل 2 کاراکتر باشد'),
  body('nationalCode').isLength({ min: 10, max: 10 }).withMessage('کد ملی باید 10 رقم باشد'),
  body('birthDate').isISO8601().withMessage('تاریخ تولد نامعتبر است'),
  body('gender').isIn(['male', 'female']).withMessage('جنسیت نامعتبر است'),
  body('phoneNumber').trim().isLength({ min: 11 }).withMessage('شماره تلفن نامعتبر است'),
  body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل 6 کاراکتر باشد'),
  // Spouse validation (optional)
  body('spouseFirstName').optional().trim().isLength({ min: 2 }).withMessage('نام همسر باید حداقل 2 کاراکتر باشد'),
  body('spouseLastName').optional().trim().isLength({ min: 2 }).withMessage('نام خانوادگی همسر باید حداقل 2 کاراکتر باشد'),
  body('spouseNationalCode').optional().isLength({ min: 10, max: 10 }).withMessage('کد ملی همسر باید 10 رقم باشد'),
  body('spousePhoneNumber').optional().trim().isLength({ min: 11 }).withMessage('شماره تلفن همسر نامعتبر است')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      firstName, lastName, nationalCode, birthDate, gender, phoneNumber, password,
      spouseFirstName, spouseLastName, spouseNationalCode, spousePhoneNumber
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ nationalCode }, { phoneNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'کاربری با این کد ملی یا شماره تلفن قبلاً ثبت شده است'
      });
    }

    // Create user with provided password and spouse information
    const user = new User({
      firstName,
      lastName,
      nationalCode,
      birthDate,
      gender,
      phoneNumber,
      password: password, // Use the password provided by user
      spouseFirstName,
      spouseLastName,
      spouseNationalCode,
      spousePhoneNumber
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'ثبت نام با موفقیت انجام شد',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'خطا در ثبت نام' });
  }
});

// Login user
router.post('/login', [
  body('phoneNumber').trim().notEmpty().withMessage('شماره تلفن الزامی است'),
  body('password').notEmpty().withMessage('رمز عبور الزامی است')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, password } = req.body;

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'کاربری با این شماره تلفن یافت نشد' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'رمز عبور اشتباه است' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'خطا در ورود' });
  }
});

// Forgot password - verify user identity
router.post('/forgot-password', [
  body('nationalCode').isLength({ min: 10, max: 10 }).withMessage('کد ملی باید 10 رقم باشد'),
  body('birthDate').isISO8601().withMessage('تاریخ تولد نامعتبر است'),
  body('phoneNumber').trim().notEmpty().withMessage('شماره تلفن الزامی است')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nationalCode, birthDate, phoneNumber } = req.body;

    // Find user by national code, birth date, and phone number
    const user = await User.findOne({ 
      nationalCode, 
      phoneNumber,
      birthDate: new Date(birthDate)
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'اطلاعات وارد شده صحیح نیست. لطفاً کد ملی، تاریخ تولد و شماره تلفن را بررسی کنید' 
      });
    }

    // Generate a temporary reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'هویت شما تایید شد. حالا می‌توانید رمز عبور جدید را تنظیم کنید',
      resetToken,
      user: {
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'خطا در تایید هویت' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('resetToken').notEmpty().withMessage('توکن بازنشانی الزامی است'),
  body('newPassword').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل 6 کاراکتر باشد')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resetToken, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'توکن نامعتبر است' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'رمز عبور با موفقیت تغییر یافت' });

  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'JsonWebTokenError') {
      res.status(400).json({ message: 'توکن نامعتبر یا منقضی شده است' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(400).json({ message: 'توکن منقضی شده است. لطفاً دوباره درخواست دهید' });
    } else {
      res.status(500).json({ message: 'خطا در تغییر رمز عبور' });
    }
  }
});

// Change password (for logged-in users)
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('رمز عبور فعلی الزامی است'),
  body('newPassword').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل 6 کاراکتر باشد')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'توکن احراز هویت یافت نشد' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'رمز عبور فعلی اشتباه است' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'رمز عبور با موفقیت تغییر یافت' });

  } catch (error) {
    console.error('Change password error:', error);
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'توکن نامعتبر است' });
    } else {
      res.status(500).json({ message: 'خطا در تغییر رمز عبور' });
    }
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'توکن احراز هویت یافت نشد' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'توکن نامعتبر است' });
  }
});

module.exports = router;
