const mongoose = require('mongoose');

// System-wide key-value configuration store
// Used for: API keys, AI prompts, payment settings
const systemConfigSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },  // e.g. 'gemini_api_key'
  value:       { type: String, default: '' },                   // The actual value
  group:       { type: String, default: 'general' },            // 'payment', 'ai', 'email', 'prompts'
  label:       { type: String, default: '' },                   // Human-readable label
  description: { type: String, default: '' },
  is_secret:   { type: Boolean, default: false },               // Mask in UI if true
  updated_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
