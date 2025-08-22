const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate responses from same user to same survey
surveyResponseSchema.index({ surveyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
