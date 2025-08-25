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
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      nationalCode, 
      email, 
      address,
      spouseFirstName,
      spouseLastName,
      spousePhoneNumber,
      spouseNationalCode
    } = req.body;
    
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (nationalCode !== undefined) updateData.nationalCode = nationalCode;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (spouseFirstName !== undefined) updateData.spouseFirstName = spouseFirstName;
    if (spouseLastName !== undefined) updateData.spouseLastName = spouseLastName;
    if (spousePhoneNumber !== undefined) updateData.spousePhoneNumber = spousePhoneNumber;
    if (spouseNationalCode !== undefined) updateData.spouseNationalCode = spouseNationalCode;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'کاربر پیدا نشد' });
    }

    console.log('Updated user data:', user);
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
