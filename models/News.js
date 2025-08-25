const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  category: {
    type: String,
    enum: ['اخبار', 'اطلاعیه', 'مهم'],
    default: 'اخبار'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isImportant: {
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
newsSchema.index({ isPublished: 1, publishedAt: -1 });
newsSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('News', newsSchema);
