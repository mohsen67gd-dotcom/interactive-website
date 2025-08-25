const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consultationType: {
    type: String,
    enum: ['مشاوره خانواده', 'مشاوره تحصیلی', 'مشاوره شغلی', 'مشاوره روانشناسی', 'سایر'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  detailedQuestion: {
    type: String,
    required: true
  },
  preferredContactMethod: {
    type: String,
    enum: ['تلفن', 'ویدیو', 'پیام متنی', 'ایمیل'],
    default: 'تلفن'
  },
  preferredTime: {
    type: String,
    enum: ['صبح', 'ظهر', 'عصر', 'شب', 'هر زمان'],
    default: 'هر زمان'
  },
  urgency: {
    type: String,
    enum: ['عادی', 'مهم', 'خیلی مهم', 'فوری'],
    default: 'عادی'
  },
  status: {
    type: String,
    enum: ['در انتظار', 'در حال بررسی', 'پاسخ داده شده', 'بسته شده'],
    default: 'در انتظار'
  },
  adminResponse: {
    content: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    preferredTime: String
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for better performance
consultationSchema.index({ userId: 1, status: 1 });
consultationSchema.index({ status: 1, urgency: 1, createdAt: -1 });
consultationSchema.index({ consultationType: 1, status: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
