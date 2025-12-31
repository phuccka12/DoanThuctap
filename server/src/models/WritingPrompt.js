const mongoose = require('mongoose');

const writingPromptSchema = new mongoose.Schema({
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  type: {
    type: String,
    enum: ['topic', 'task1', 'task2'],
    required: true
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  image_url: {
    type: String,
    default: null
  },
  ideas: [{
    type: String
  }],
  min_words: {
    type: Number,
    default: 150
  },
  max_words: {
    type: Number,
    default: 250
  },
  model_essay: {
    type: String,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
writingPromptSchema.index({ topic_id: 1, is_active: 1 });
writingPromptSchema.index({ type: 1, difficulty: 1 });

module.exports = mongoose.model('WritingPrompt', writingPromptSchema);