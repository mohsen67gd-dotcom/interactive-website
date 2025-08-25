const express = require('express');
const router = express.Router();
const News = require('../models/News');
const Comment = require('../models/Comment');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all published news
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, tags, sort = 'latest' } = req.query;
    
    let query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags.split(',') };
    }
    
    let sortOptions = {};
    switch (sort) {
      case 'latest':
        sortOptions = { publishedAt: -1 };
        break;
      case 'oldest':
        sortOptions = { publishedAt: 1 };
        break;
      case 'popular':
        sortOptions = { views: -1, publishedAt: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      default:
        sortOptions = { publishedAt: -1, isImportant: -1 };
    }
    
    const news = await News.find(query)
      .populate('author', 'firstName lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await News.countDocuments(query);
    
    res.json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalNews: count
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ message: 'خطا در دریافت اخبار' });
  }
});

// Get news statistics
router.get('/stats', async (req, res) => {
  try {
    const totalNews = await News.countDocuments({ isPublished: true });
    
    // Get total views manually
    const allNews = await News.find({ isPublished: true });
    const totalViews = allNews.reduce((sum, news) => sum + (news.views || 0), 0);
    
    // Get unique categories
    const categories = [...new Set(allNews.map(news => news.category))];
    
    res.json({
      totalNews,
      totalViews,
      totalCategories: categories.length,
      categoryStats: categories.map(cat => ({ _id: cat, count: allNews.filter(n => n.category === cat).length }))
    });
  } catch (error) {
    console.error('Get news stats error:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار' });
  }
});

// Get recent news for homepage
router.get('/recent', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const recentNews = await News.find({ isPublished: true })
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1, isImportant: -1 })
      .limit(parseInt(limit))
      .exec();
    
    res.json(recentNews);
  } catch (error) {
    console.error('Get recent news error:', error);
    res.status(500).json({ message: 'خطا در دریافت اخبار اخیر' });
  }
});

// Admin: Get all news (including unpublished)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status === 'published') query.isPublished = true;
    if (status === 'unpublished') query.isPublished = false;
    
    const news = await News.find(query)
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await News.countDocuments(query);
    
    res.json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalNews: count
    });
  } catch (error) {
    console.error('Admin get all news error:', error);
    res.status(500).json({ message: 'خطا در دریافت اخبار' });
  }
});

// Admin: Get all comments for moderation
router.get('/admin/comments', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (status === 'spam') query.isSpam = true;
    
    const comments = await Comment.find(query)
      .populate('author', 'firstName lastName')
      .populate('newsId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Comment.countDocuments(query);
    
    res.json({
      comments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalComments: count
    });
  } catch (error) {
    console.error('Admin get comments error:', error);
    res.status(500).json({ message: 'خطا در دریافت نظرات' });
  }
});

// Admin: Approve/Reject comment
router.put('/admin/comments/:id', requireAdmin, async (req, res) => {
  try {
    const { isApproved, isSpam } = req.body;
    
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isApproved, isSpam },
      { new: true, runValidators: true }
    );
    
    if (!comment) {
      return res.status(404).json({ message: 'نظر یافت نشد' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Admin update comment error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی نظر' });
  }
});

// Admin: Delete comment
router.delete('/admin/comments/:id', requireAdmin, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'نظر یافت نشد' });
    }
    
    res.json({ message: 'نظر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Admin delete comment error:', error);
    res.status(500).json({ message: 'خطا در حذف نظر' });
  }
});

// Admin: Create news
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, summary, image, category, isPublished, isImportant, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'عنوان و محتوا الزامی هستند' });
    }
    
    const news = new News({
      title,
      content,
      summary,
      image,
      category,
      isPublished,
      isImportant,
      tags,
      author: req.user._id
    });
    
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ message: 'خطا در ایجاد خبر' });
  }
});

// Admin: Update news
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, content, summary, image, category, isPublished, isImportant, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'عنوان و محتوا الزامی هستند' });
    }
    
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { title, content, summary, image, category, isPublished, isImportant, tags },
      { new: true, runValidators: true }
    );
    
    if (!news) {
      return res.status(404).json({ message: 'خبر یافت نشد' });
    }
    
    res.json(news);
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی خبر' });
  }
});

// Admin: Delete news
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'خبر یافت نشد' });
    }
    
    res.json({ message: 'خبر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ message: 'خطا در حذف خبر' });
  }
});

// Get related news
router.get('/:id/related', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'خبر یافت نشد' });
    }

    const relatedNews = await News.find({
      _id: { $ne: req.params.id },
      isPublished: true,
      $or: [
        { category: news.category },
        { tags: { $in: news.tags || [] } }
      ]
    })
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1 })
      .limit(4)
      .exec();

    res.json(relatedNews);
  } catch (error) {
    console.error('Get related news error:', error);
    res.status(500).json({ message: 'خطا در دریافت اخبار مرتبط' });
  }
});

// Get news by ID
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'firstName lastName');
    
    if (!news || !news.isPublished) {
      return res.status(404).json({ message: 'خبر یافت نشد' });
    }
    
    // Increment views
    news.views += 1;
    await news.save();
    
    res.json(news);
  } catch (error) {
    console.error('Get news by ID error:', error);
    res.status(500).json({ message: 'خطا در دریافت خبر' });
  }
});

// Get news comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ newsId: req.params.id, isApproved: true })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Get news comments error:', error);
    res.status(500).json({ message: 'خطا در دریافت نظرات' });
  }
});

// Add comment to news
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'محتوی نظر الزامی است' });
    }

    const comment = new Comment({
      content: content.trim(),
      author: req.user._id,
      newsId: req.params.id,
      isApproved: true // برای کاربران احراز هویت شده
    });

    await comment.save();
    
    // Populate author info for response
    await comment.populate('author', 'firstName lastName');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'خطا در ثبت نظر' });
  }
});

module.exports = router;
