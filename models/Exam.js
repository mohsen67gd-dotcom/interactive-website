const mongoose = require('mongoose');

const examQuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'descriptive'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: function() {
      return this.type === 'multiple_choice';
    }
  },
  points: {
    type: Number,
    default: 1
  },
  required: {
    type: Boolean,
    default: true
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [examQuestionSchema],
  timeLimit: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

examSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Calculate total points
  this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  next();
});

module.exports = mongoose.model('Exam', examSchema);
