const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'instagram', 'email', 'phone'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const settingsSchema = new mongoose.Schema({
  siteTitle: {
    type: String,
    default: 'Interactive Website',
    trim: true
  },
  siteLogo: {
    type: String,
    trim: true
  },
  aboutUs: {
    title: {
      type: String,
      default: 'درباره ما',
      trim: true
    },
    content: {
      type: String,
      default: 'متن درباره ما اینجا قرار می‌گیرد',
      trim: true
    },
    image: {
      type: String,
      trim: true
    }
  },
  socialLinks: [socialLinkSchema],
  contactInfo: {
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
