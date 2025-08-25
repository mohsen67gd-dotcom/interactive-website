const mongoose = require('mongoose');

const coupleGameSessionSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoupleGame',
    required: true
  },
  couple: {
    partner1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    partner2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // در ابتدا خالی است
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed', 'cancelled'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  pauseTime: {
    type: Date,
    default: null
  },
  totalPauseTime: {
    type: Number, // مجموع زمان‌های توقف (ثانیه)
    default: 0
  },
  timeRemaining: {
    type: Number, // زمان باقی‌مانده (ثانیه)
    default: 0
  },
  questionsOrder: {
    partner1: [{
      type: Number,
      required: true
    }],
    partner2: [{
      type: Number,
      required: true
    }]
  },
  answers: {
    partner1: [{
      questionIndex: {
        type: Number,
        required: true
      },
      selectedOption: {
        type: Number,
        required: true
      },
      timeSpent: {
        type: Number, // زمان صرف شده (ثانیه)
        required: true
      },
      answeredAt: {
        type: Date,
        default: Date.now
      }
    }],
    partner2: [{
      questionIndex: {
        type: Number,
        required: true
      },
      selectedOption: {
        type: Number,
        required: true
      },
      timeSpent: {
        type: Number,
        required: true
      },
      answeredAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  score: {
    totalPoints: {
      type: Number,
      default: 0
    },
    similarityPercentage: {
      type: Number,
      default: 0
    },
    matchingAnswers: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  gameHistory: [{
    action: {
      type: String,
      enum: ['started', 'paused', 'resumed', 'completed', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index ها برای جستجوی سریع
coupleGameSessionSchema.index({ gameId: 1, status: 1 });
coupleGameSessionSchema.index({ 'couple.partner1': 1, 'couple.partner2': 1 });
coupleGameSessionSchema.index({ status: 1, lastActivity: 1 });

// متد برای شروع بازی
coupleGameSessionSchema.methods.startGame = function(gameTimeLimit, questionCount) {
  this.status = 'active';
  this.startTime = new Date();
  this.timeRemaining = gameTimeLimit * 60; // تبدیل به ثانیه
  this.lastActivity = new Date();
  
  // ایجاد ترتیب تصادفی سوالات
  this.generateQuestionsOrder(questionCount);
  
  this.gameHistory.push({
    action: 'started',
    timestamp: new Date(),
    details: 'بازی شروع شد'
  });
};

// متد برای توقف بازی
coupleGameSessionSchema.methods.pauseGame = function() {
  if (this.status === 'active') {
    this.status = 'paused';
    this.pauseTime = new Date();
    this.lastActivity = new Date();
    
    this.gameHistory.push({
      action: 'paused',
      timestamp: new Date(),
      details: 'بازی متوقف شد'
    });
  }
};

// متد برای ادامه بازی
coupleGameSessionSchema.methods.resumeGame = function() {
  if (this.status === 'paused') {
    this.status = 'active';
    
    // محاسبه زمان توقف
    if (this.pauseTime) {
      const pauseDuration = Math.floor((Date.now() - this.pauseTime) / 1000);
      this.totalPauseTime += pauseDuration;
      this.pauseTime = null;
    }
    
    this.lastActivity = new Date();
    
    this.gameHistory.push({
      action: 'resumed',
      timestamp: new Date(),
      details: 'بازی ادامه یافت'
    });
  }
};

// متد برای اتمام بازی
coupleGameSessionSchema.methods.completeGame = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.lastActivity = new Date();
  
  // محاسبه امتیاز نهایی
  this.calculateScore();
  
  this.gameHistory.push({
    action: 'completed',
    timestamp: new Date(),
    details: 'بازی تمام شد'
  });
};

// متد برای لغو بازی
coupleGameSessionSchema.methods.cancelGame = function() {
  this.status = 'cancelled';
  this.endTime = new Date();
  this.lastActivity = new Date();
  
  this.gameHistory.push({
    action: 'cancelled',
    timestamp: new Date(),
    details: 'بازی لغو شد'
  });
};

// متد برای ایجاد ترتیب تصادفی سوالات
coupleGameSessionSchema.methods.generateQuestionsOrder = function(questionCount) {
  // اگر questionCount ارسال نشده، از gameId استفاده کن
  if (!questionCount && this.gameId && this.gameId.questions) {
    questionCount = this.gameId.questions.length;
  }
  
  if (questionCount && questionCount > 0) {
    const questionIndices = Array.from({ length: questionCount }, (_, i) => i);
    
    // ترتیب تصادفی برای هر همسر
    this.questionsOrder.partner1 = [...questionIndices].sort(() => Math.random() - 0.5);
    this.questionsOrder.partner2 = [...questionIndices].sort(() => Math.random() - 0.5);
    
    console.log('🎲 ترتیب سوالات ایجاد شد:', {
      partner1: this.questionsOrder.partner1,
      partner2: this.questionsOrder.partner2,
      questionCount
    });
  } else {
    console.error('❌ تعداد سوالات نامعتبر برای ایجاد ترتیب:', questionCount);
  }
};

// متد برای اضافه کردن پاسخ
coupleGameSessionSchema.methods.addAnswer = function(partnerKey, questionIndex, selectedOption) {
  if (!['partner1', 'partner2'].includes(partnerKey)) {
    throw new Error('کلید همسر نامعتبر است');
  }
  
  // بررسی تکراری نبودن پاسخ
  const existingAnswer = this.answers[partnerKey].find(
    a => a.questionIndex === questionIndex
  );
  
  if (existingAnswer) {
    throw new Error('شما قبلاً به این سوال پاسخ داده‌اید');
  }
  
  // محاسبه زمان صرف شده
  const timeSpent = this.startTime ? 
    Math.floor((Date.now() - this.startTime) / 1000) - this.totalPauseTime : 0;
  
  // اضافه کردن پاسخ
  this.answers[partnerKey].push({
    questionIndex,
    selectedOption,
    timeSpent: Math.max(0, timeSpent),
    answeredAt: new Date()
  });
  
  this.lastActivity = new Date();
  
  // بررسی اتمام بازی
  this.checkGameCompletion();
};

// متد برای بررسی اتمام بازی
coupleGameSessionSchema.methods.checkGameCompletion = function() {
  if (this.gameId && this.gameId.questions) {
    const totalQuestions = this.gameId.questions.length;
    const partner1Answers = this.answers.partner1.length;
    const partner2Answers = this.answers.partner2.length;
    
    // اگر هر دو نفر به همه سوالات پاسخ دادند
    if (partner1Answers >= totalQuestions && partner2Answers >= totalQuestions) {
      this.completeGame();
      return true;
    }
  }
  return false;
};

// متد برای محاسبه امتیاز
coupleGameSessionSchema.methods.calculateScore = function() {
  const partner1Answers = this.answers.partner1 || [];
  const partner2Answers = this.answers.partner2 || [];
  
  let matchingAnswers = 0;
  let totalQuestions = Math.max(partner1Answers.length, partner2Answers.length);
  
  if (totalQuestions === 0) {
    this.score = {
      totalPoints: 0,
      similarityPercentage: 0,
      matchingAnswers: 0,
      totalQuestions: 0,
      averageResponseTime: 0
    };
    return;
  }
  
  // مقایسه پاسخ‌ها
  for (let i = 0; i < totalQuestions; i++) {
    const p1Answer = partner1Answers.find(a => a.questionIndex === i);
    const p2Answer = partner2Answers.find(a => a.questionIndex === i);
    
    if (p1Answer && p2Answer && p1Answer.selectedOption === p2Answer.selectedOption) {
      matchingAnswers++;
    }
  }
  
  // محاسبه درصد تشابه
  const similarityPercentage = Math.round((matchingAnswers / totalQuestions) * 100);
  
  // محاسبه میانگین زمان پاسخ
  const allAnswers = [...partner1Answers, ...partner2Answers];
  const totalResponseTime = allAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0);
  const averageResponseTime = allAnswers.length > 0 ? 
    Math.round(totalResponseTime / allAnswers.length) : 0;
  
  this.score = {
    totalPoints: matchingAnswers,
    similarityPercentage,
    matchingAnswers,
    totalQuestions,
    averageResponseTime
  };
};

// متد برای دریافت وضعیت بازی
coupleGameSessionSchema.methods.getGameStatus = function() {
  return {
    status: this.status,
    timeRemaining: this.timeRemaining,
    partner1Progress: this.answers.partner1.length,
    partner2Progress: this.answers.partner2.length,
    totalQuestions: this.gameId ? this.gameId.questions.length : 0,
    score: this.score,
    lastActivity: this.lastActivity
  };
};

// متد برای بررسی امکان ادامه بازی
coupleGameSessionSchema.methods.canContinue = function() {
  return this.status === 'active' && this.timeRemaining > 0;
};

// متد برای به‌روزرسانی زمان باقی‌مانده
coupleGameSessionSchema.methods.updateTimeRemaining = function(timeLimit) {
  if (this.status === 'active' && this.startTime) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const totalTime = timeLimit ? timeLimit * 60 : (this.gameId && this.gameId.timeLimit ? this.gameId.timeLimit * 60 : 0);
    const remaining = Math.max(0, totalTime - elapsed - this.totalPauseTime);
    
    if (!isNaN(remaining) && remaining >= 0) {
      this.timeRemaining = remaining;
    } else {
      console.error('❌ زمان نامعتبر محاسبه شد:', remaining);
      this.timeRemaining = 0;
    }
    
    // اگر زمان تمام شد
    if (this.timeRemaining <= 0) {
      this.completeGame();
    }
  }
};

module.exports = mongoose.model('CoupleGameSession', coupleGameSessionSchema);
