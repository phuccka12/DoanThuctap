const mongoose = require('mongoose');

const writingScenarioProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WritingScenario',
    required: true,
    index: true
  },
  bestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  rewarded: {
    type: Boolean,
    default: false
  },
  coinsEarned: {
    type: Number,
    default: 0
  },
  expEarned: {
    type: Number,
    default: 0
  },
  lastSubmissionText: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  timeSpentSec: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Mỗi user chỉ có 1 bản ghi progress cho mỗi kịch bản
writingScenarioProgressSchema.index({ userId: 1, scenarioId: 1 }, { unique: true });

module.exports = mongoose.model('WritingScenarioProgress', writingScenarioProgressSchema);
