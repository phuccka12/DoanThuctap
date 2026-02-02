const mongoose = require('mongoose');
const slugify = require('slugify');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: null,
    maxlength: 500
  },
  cover_image: {
    type: String,
    default: null
  },
  icon_name: {
    type: String,
    default: null,
    maxlength: 50
  },
  keywords: {
    type: [String],
    default: []
  },
  frequency: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  nodes: {
    type: [{
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['vocabulary', 'video', 'ai_roleplay', 'quiz', 'grammar', 'listening']
      },
      title: {
        type: String,
        required: true
      },
      data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
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

// Auto-generate slug from name before saving
topicSchema.pre('save', async function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

// Index cho search và filter
topicSchema.index({ name: 'text' });
topicSchema.index({ is_active: 1, created_at: -1 });

module.exports = mongoose.model('Topic', topicSchema);