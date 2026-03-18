const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  passageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReadingPassage',
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

readingProgressSchema.index({ userId: 1, passageId: 1 });
readingProgressSchema.index({ updated_at: -1 });

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
