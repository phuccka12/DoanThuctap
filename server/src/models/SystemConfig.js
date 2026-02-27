const mongoose = require('mongoose');

// System-wide key-value configuration store
// Used for: API keys, AI prompts, payment settings, maintenance, quota, RBAC, email templates
const systemConfigSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: String, default: '' },
  group:       { type: String, default: 'general' }, // 'general','integrations','ai_quota','roles','email_templates','prompts'
  label:       { type: String, default: '' },
  description: { type: String, default: '' },
  is_secret:   { type: Boolean, default: false },
  field_type:  { type: String, default: 'text' },    // 'text','toggle','number','textarea','select'
  options:     { type: [String], default: [] },       // for select field_type
  sort_order:  { type: Number, default: 0 },
  updated_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
