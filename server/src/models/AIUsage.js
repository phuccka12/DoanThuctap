const mongoose = require('mongoose');

// Daily usage counters per user (reset at midnight)
const aiUsageSchema = new mongoose.Schema({
  user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true }, // 'YYYY-MM-DD'

  speaking_checks:      { type: Number, default: 0 },
  writing_checks:       { type: Number, default: 0 },
  translation_checks:   { type: Number, default: 0 },
  ai_chat_messages:     { type: Number, default: 0 },
  ai_roleplay_sessions: { type: Number, default: 0 },

  // Block flags (set by admin)
  ai_blocked:    { type: Boolean, default: false },
  blocked_reason: { type: String, default: '' },
  blocked_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  blocked_at:    { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

aiUsageSchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AIUsage', aiUsageSchema);
