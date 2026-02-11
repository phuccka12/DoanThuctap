const mongoose = require('mongoose');

/**
 * ReadingPassage Schema
 * Manages reading passages bank for English learning
 * Features: title, passage content, questions, categorization by topics
 */
const readingPassageSchema = new mongoose.Schema({
  // Core Fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  passage: {
    type: String,
    required: [true, 'Passage content is required'],
    trim: true,
    maxlength: [10000, 'Passage cannot exceed 10000 characters']
  },
  
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Level is required'],
    default: 'beginner'
  },
  
  // CEFR Level (A1-C2) - More granular than basic level
  cefr_level: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'A2'
  },
  
  // Content Type (for "Write Once, Use Everywhere" concept)
  content_type: {
    type: String,
    enum: ['email', 'news', 'story', 'conversation', 'announcement', 'article', 'blog', 'letter', 'report', 'other'],
    default: 'article'
  },
  
  // Genre/Category (for General English)
  genre: {
    type: String,
    trim: true,
    maxlength: [100, 'Genre cannot exceed 100 characters']
  },
  
  // Topics (multiple)
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  
  // Linked Vocabulary (Auto-linked words from Vocabulary Bank)
  linked_vocabulary: [{
    word_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary'
    },
    word: String,
    positions: [{
      start: Number,
      end: Number
    }]
  }],
  
  // Reading Questions (embedded)
  questions: [{
    question_text: {
      type: String,
      required: true,
      maxlength: [500, 'Question cannot exceed 500 characters']
    },
    question_type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'],
      default: 'multiple_choice'
    },
    options: [{
      type: String,
      maxlength: [200, 'Option cannot exceed 200 characters']
    }],
    correct_answer: {
      type: String,
      required: true,
      maxlength: [500, 'Answer cannot exceed 500 characters']
    },
    explanation: {
      type: String,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters']
    },
    points: {
      type: Number,
      default: 1,
      min: 0
    }
  }],
  
  // Metadata
  word_count: {
    type: Number,
    default: 0
  },
  
  estimated_time: {
    type: Number, // minutes
    default: 5
  },
  
  source: {
    type: String,
    trim: true,
    maxlength: [200, 'Source cannot exceed 200 characters']
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Media
  image_url: {
    type: String,
    trim: true
  },
  
  audio_url: {
    type: String,
    trim: true
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  
  difficulty_score: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // AI & RAG Features
  ai_generated: {
    type: Boolean,
    default: false
  },
  
  ai_prompt: {
    type: String,
    trim: true
  },
  
  // Vector Embedding (for AI RAG)
  vector_embedding: {
    indexed: {
      type: Boolean,
      default: false
    },
    embedding_id: String,
    last_indexed_at: Date
  },
  
  // Usage Tracking
  usage_count: {
    type: Number,
    default: 0
  },
  
  last_used_at: Date,
  
  // Creator
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
readingPassageSchema.index({ title: 'text', passage: 'text', tags: 'text' });
readingPassageSchema.index({ level: 1 });
readingPassageSchema.index({ cefr_level: 1 });
readingPassageSchema.index({ content_type: 1 });
readingPassageSchema.index({ topics: 1 });
readingPassageSchema.index({ is_active: 1 });
readingPassageSchema.index({ created_at: -1 });
readingPassageSchema.index({ usage_count: -1 });

// Middleware: Calculate word count before save
readingPassageSchema.pre('save', function(next) {
  if (this.isModified('passage')) {
    this.word_count = this.passage.trim().split(/\s+/).length;
  }
  next();
});

// Virtual: Question count
readingPassageSchema.virtual('question_count').get(function() {
  return this.questions ? this.questions.length : 0;
});

// Ensure virtuals are included in JSON
readingPassageSchema.set('toJSON', { virtuals: true });
readingPassageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReadingPassage', readingPassageSchema);
