const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  videoUrl: {
    type: String
  },
  category: {
    type: String,
    enum: ['آموزش عمومی', 'آموزش تخصصی', 'ویدیو', 'مستندات'],
    default: 'آموزش عمومی'
  },
  level: {
    type: String,
    enum: ['مبتدی', 'متوسط', 'پیشرفته'],
    default: 'مبتدی'
  },
  duration: {
    type: Number, // در دقیقه
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
educationSchema.index({ isPublished: 1, publishedAt: -1 });
educationSchema.index({ category: 1, level: 1 });

module.exports = mongoose.model('Education', educationSchema);
