const mongoose = require('mongoose');

const speakingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpeakingQuestion',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  timeSpentSec: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

speakingProgressSchema.index({ userId: 1, questionId: 1 });
speakingProgressSchema.index({ updated_at: -1 });

module.exports = mongoose.model('SpeakingProgress', speakingProgressSchema);
