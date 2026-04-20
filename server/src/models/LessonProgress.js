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
      required: false,
      default: null,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: false,
      default: null,
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
    // ── Story RPG fields (optional — only set when this record tracks a story part) ──
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null,
      index: true,
    },
    // Which part of the story was completed (1-based)
    current_story_part: {
      type: Number,
      default: null,
    },
    // ── Reading/Listening fields ──
    passageId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'passageModel',
      default: null,
      index: true,
    },
    passageType: {
      type: String,
      enum: ['reading', 'listening'],
      default: null,
    },
    // ── Speaking fields ──
    speakingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpeakingQuestion',
      default: null,
      index: true,
    },
    // ── AI Writing Prompt fields ──
    writingPromptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WritingPrompt',
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// One progress record per (user, lesson) — only enforce uniqueness when lessonId is a real ObjectId.
// Story progress records have lessonId: null and are NOT covered by this index,
// allowing multiple story-part records per user.
// Note: $type:'objectId' is used instead of $ne:null because MongoDB Atlas
// does not support $ne in partialFilterExpression.
lessonProgressSchema.index(
  { userId: 1, lessonId: 1 },
  { unique: true, partialFilterExpression: { lessonId: { $type: 'objectId' } } }
);

lessonProgressSchema.index(
  { userId: 1, writingPromptId: 1 },
  { unique: true, partialFilterExpression: { writingPromptId: { $type: 'objectId' } } }
);

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
