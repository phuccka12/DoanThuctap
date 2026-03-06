const mongoose = require('mongoose');

/**
 * LessonProgress — tracks each user's progress per lesson.
 * - completedNodes: array of node IDs / indices completed.
 * - rewarded: ensures coins/EXP are awarded exactly once.
 * - skillScores: snapshot score per skill for adaptive algorithm.
 */
const lessonProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    // Array of node indices/IDs that have been completed
    completedNodes: {
      type: [String],
      default: [],
    },
    // 0–100 score for this lesson
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // True once coins+EXP have been awarded (idempotency guard)
    rewarded: {
      type: Boolean,
      default: false,
    },
    coinsEarned: {
      type: Number,
      default: 0,
    },
    expEarned: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Time spent in seconds
    timeSpentSec: {
      type: Number,
      default: 0,
    },
    // Number of attempts (for retry tracking)
    attemptCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// One progress record per (user, lesson) — use upsert to update
lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
