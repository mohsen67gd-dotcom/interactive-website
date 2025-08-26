const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// تنظیمات multer برای آپلود فایل
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ایجاد پوشه uploads اگر وجود ندارد
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // نام فایل: timestamp + نام اصلی
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// فیلتر فایل‌ها
const fileFilter = (req, file, cb) => {
  // فقط فایل‌های تصویری
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری مجاز هستند'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // حداکثر 5MB
  }
});

// آپلود تصویر
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'فایل تصویری انتخاب نشده است' });
    }

    // URL تصویر آپلود شده - استفاده از URL کامل
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
    
    res.json({
      message: 'تصویر با موفقیت آپلود شد',
      imageUrl: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'خطا در آپلود تصویر' });
  }
});

// دریافت تصویر
router.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', 'images', filename);
  
  // بررسی وجود فایل
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'تصویر یافت نشد' });
  }
});

module.exports = router;
