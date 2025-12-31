const mongoose = require('mongoose');

const speakingQuestionSchema = new mongoose.Schema({
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  part: {
    type: String,
    enum: ['free', 'p1', 'p2', 'p3'],
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  keywords: [{
    type: String
  }],
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
speakingQuestionSchema.index({ topic_id: 1, part: 1, is_active: 1 });
speakingQuestionSchema.index({ difficulty: 1 });

module.exports = mongoose.model('SpeakingQuestion', speakingQuestionSchema);