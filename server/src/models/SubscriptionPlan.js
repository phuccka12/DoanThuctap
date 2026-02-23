const mongoose = require('mongoose');

const quotaSchema = new mongoose.Schema({
  speaking_checks_per_day:    { type: Number, default: 3 },    // -1 = unlimited
  ai_chat_messages_per_day:   { type: Number, default: 10 },
  reading_passages_access:    { type: String, enum: ['limited', 'full'], default: 'limited' },
  writing_checks_per_day:     { type: Number, default: 3 },
  ai_roleplay_sessions_per_day: { type: Number, default: 2 },
}, { _id: false });

const subscriptionPlanSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true }, // 'Free', 'Pro', 'Premium'
  slug:        { type: String, required: true, unique: true, lowercase: true }, // 'free', 'pro', 'premium'
  description: { type: String, default: '' },
  price_monthly: { type: Number, default: 0 },   // VND
  price_yearly:  { type: Number, default: 0 },
  currency:    { type: String, default: 'VND' },
  color:       { type: String, default: 'gray' }, // For UI: purple, blue, gold
  icon:        { type: String, default: '🎯' },
  is_active:   { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  quota:       { type: quotaSchema, default: () => ({}) },
  features:    [{ type: String }],  // ['Unlimited Speaking', 'AI Feedback', ...]
  sort_order:  { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
