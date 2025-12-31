const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  cover_image: {
    type: String,
    default: null
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index cho search và filter
topicSchema.index({ name: 'text' });
topicSchema.index({ is_active: 1, created_at: -1 });

module.exports = mongoose.model('Topic', topicSchema);