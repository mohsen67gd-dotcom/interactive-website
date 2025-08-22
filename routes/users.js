const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'خطا در دریافت پروفایل' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, birthDate, gender } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (birthDate) updateData.birthDate = birthDate;
    if (gender) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'پروفایل با موفقیت بروزرسانی شد', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی پروفایل' });
  }
});

// Change password
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'رمز عبور فعلی و جدید الزامی هستند' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'رمز عبور جدید باید حداقل 6 کاراکتر باشد' });
    }

    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'رمز عبور فعلی اشتباه است' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'رمز عبور با موفقیت تغییر یافت' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'خطا در تغییر رمز عبور' });
  }
});

module.exports = router;
