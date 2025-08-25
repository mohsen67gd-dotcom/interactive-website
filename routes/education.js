const express = require('express');
const router = express.Router();
const Education = require('../models/Education');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all published education content
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, search } = req.query;
    
    let query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    if (level) {
      query.level = level;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const education = await Education.find(query)
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1, isFeatured: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Education.countDocuments(query);
    
    res.json({
      education,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalEducation: count
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({ message: 'خطا در دریافت محتوای آموزشی' });
  }
});

// Get featured education content
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const featuredEducation = await Education.find({ isPublished: true, isFeatured: true })
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .exec();
    
    res.json(featuredEducation);
  } catch (error) {
    console.error('Get featured education error:', error);
    res.status(500).json({ message: 'خطا در دریافت محتوای آموزشی ویژه' });
  }
});

// Get education by ID
router.get('/:id', async (req, res) => {
  try {
    const education = await Education.findById(req.params.id)
      .populate('author', 'firstName lastName');
    
    if (!education || !education.isPublished) {
      return res.status(404).json({ message: 'محتوای آموزشی یافت نشد' });
    }
    
    // Increment views
    education.views += 1;
    await education.save();
    
    res.json(education);
  } catch (error) {
    console.error('Get education by ID error:', error);
    res.status(500).json({ message: 'خطا در دریافت محتوای آموزشی' });
  }
});

// Admin: Create education
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, content, image, videoUrl, category, level, duration, isPublished, isFeatured, tags } = req.body;
    
    if (!title || !description || !content) {
      return res.status(400).json({ message: 'عنوان، توضیحات و محتوا الزامی هستند' });
    }
    
    const education = new Education({
      title,
      description,
      content,
      image,
      videoUrl,
      category,
      level,
      duration,
      isPublished,
      isFeatured,
      tags,
      author: req.user._id
    });
    
    await education.save();
    res.status(201).json(education);
  } catch (error) {
    console.error('Create education error:', error);
    res.status(500).json({ message: 'خطا در ایجاد محتوای آموزشی' });
  }
});

// Admin: Update education
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, content, image, videoUrl, category, level, duration, isPublished, isFeatured, tags } = req.body;
    
    if (!title || !description || !content) {
      return res.status(400).json({ message: 'عنوان، توضیحات و محتوا الزامی هستند' });
    }
    
    const education = await Education.findByIdAndUpdate(
      req.params.id,
      { title, description, content, image, videoUrl, category, level, duration, isPublished, isFeatured, tags },
      { new: true, runValidators: true }
    );
    
    if (!education) {
      return res.status(404).json({ message: 'محتوای آموزشی یافت نشد' });
    }
    
    res.json(education);
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی محتوای آموزشی' });
  }
});

// Admin: Delete education
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const education = await Education.findByIdAndDelete(req.params.id);
    
    if (!education) {
      return res.status(404).json({ message: 'محتوای آموزشی یافت نشد' });
    }
    
    res.json({ message: 'محتوای آموزشی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ message: 'خطا در حذف محتوای آموزشی' });
  }
});

// Admin: Get all education (including unpublished)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status === 'published') query.isPublished = true;
    if (status === 'unpublished') query.isPublished = false;
    
    const education = await Education.find(query)
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Education.countDocuments(query);
    
    res.json({
      education,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalEducation: count
    });
  } catch (error) {
    console.error('Admin get all education error:', error);
    res.status(500).json({ message: 'خطا در دریافت محتوای آموزشی' });
  }
});

module.exports = router;
