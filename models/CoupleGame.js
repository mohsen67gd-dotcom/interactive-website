const mongoose = require('mongoose');

const coupleGameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      type: String,
      required: true,
      trim: true
    }],
    // حذف correctAnswer و points چون در بازی زوج‌شناسی معنی ندارند
  }],
  timeLimit: {
    type: Number,
    required: true,
    min: 1,
    max: 120, // حداکثر 2 ساعت
    default: 10
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: 100, // حداکثر تعداد زوج‌ها
    min: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameRules: {
    type: String,
    default: 'سوالات را طوری پاسخ دهید که فکر می‌کنید همسر شما هم همان گزینه را انتخاب می‌کند. امتیاز بر اساس تشابه پاسخ‌های شما محاسبه می‌شود.'
  },
  category: {
    type: String,
    enum: ['عاطفی', 'فکری', 'عملی', 'ترکیبی'],
    default: 'ترکیبی'
  },
  difficulty: {
    type: String,
    enum: ['آسان', 'متوسط', 'سخت'],
    default: 'متوسط'
  }
}, {
  timestamps: true
});

// Index برای جستجوی بازی‌های فعال
coupleGameSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// متد برای بررسی فعال بودن بازی
coupleGameSchema.methods.isGameActive = function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
};

// متد برای بررسی امکان شرکت در بازی
coupleGameSchema.methods.canJoin = function() {
  return this.isGameActive();
};

// متد برای دریافت اطلاعات خلاصه
coupleGameSchema.methods.getSummary = function() {
  return {
    id: this._id.toString(),  // تبدیل ObjectId به string
    title: this.title,
    description: this.description,
    questions: this.questions, // اضافه کردن سوالات
    timeLimit: this.timeLimit,
    startDate: this.startDate,
    endDate: this.endDate,
    category: this.category,
    difficulty: this.difficulty,
    questionCount: this.questions.length,
    isActive: this.isGameActive()
  };
};

module.exports = mongoose.model('CoupleGame', coupleGameSchema);
