'use strict';
/**
 * Story.js — RPG Writing/Reading mini-game.
 *
 * Architecture (fully embedded NoSQL):
 *   Story
 *     └── parts[]           (Part 1, Part 2 …)
 *           └── sentences[] (Vietnamese source + EN hint words)
 *
 * A single .findById(storyId) gives you everything needed to render the game.
 */
const mongoose = require('mongoose');

// ── Hint word (shown on hover) ────────────────────────────────────────────────
const hintSchema = new mongoose.Schema({
  word:        { type: String, required: true },   // Vietnamese word / phrase
  hint:        { type: String, required: true },   // English translation / clue
}, { _id: false });

// ── One sentence inside a Part ────────────────────────────────────────────────
const sentenceSchema = new mongoose.Schema({
  order:     { type: Number, required: true },
  vi:        { type: String, required: true },   // Vietnamese source sentence
  en_sample: { type: String, required: true },   // Canonical English translation (for reference)
  hints:     { type: [hintSchema], default: [] }, // Vocabulary hints on hover
}, { _id: false });

// ── One Part (chapter) of a story ─────────────────────────────────────────────
const partSchema = new mongoose.Schema({
  part_number: { type: Number, required: true },   // 1-based
  title:       { type: String, default: '' },
  sentences:   { type: [sentenceSchema], default: [] },
  xp_reward:   { type: Number, default: 50 },      // XP awarded on completion
  coins_reward:{ type: Number, default: 30 },
}, { _id: false });

// ── Main Story document ───────────────────────────────────────────────────────
const storySchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    cover_image: { type: String, default: '' },          // Cloudinary URL
    theme:       {                                        // Genre / setting tag
      type: String,
      enum: ['daily_life', 'travel', 'mystery', 'adventure', 'business', 'romance', 'sci_fi', 'other'],
      default: 'daily_life',
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    tags:        { type: [String], default: [] },
    parts:       { type: [partSchema], default: [] },
    is_active:   { type: Boolean, default: true },
    created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    total_parts: { type: Number, default: 0 },           // denormalised — set on save
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Keep total_parts in sync automatically
// Use a no-callback pre hook so it works with both sync and async middleware handling
storySchema.pre('save', function () {
  this.total_parts = Array.isArray(this.parts) ? this.parts.length : 0;
});

storySchema.index({ theme: 1, level: 1, is_active: 1 });
storySchema.index({ created_at: -1 });

module.exports = mongoose.model('Story', storySchema);
