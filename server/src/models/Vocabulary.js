const mongoose = require('mongoose');

/**
 * Vocabulary Schema
 * Manages vocabulary bank for English learning
 * Features: word, pronunciation, meaning, examples, media, categorization
 */
const vocabularySchema = new mongoose.Schema({
  // Core Fields
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true,
    maxlength: [100, 'Word cannot exceed 100 characters']
  },
  
  part_of_speech: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'other'],
    default: 'other'
  },
  
  pronunciation: {
    type: String,
    trim: true,
    maxlength: [200, 'Pronunciation cannot exceed 200 characters']
  },
  
  meaning: {
    type: String,
    required: [true, 'Meaning is required'],
    trim: true,
    maxlength: [500, 'Meaning cannot exceed 500 characters']
  },
  
  example: {
    type: String,
    trim: true,
    maxlength: [1000, 'Example cannot exceed 1000 characters']
  },
  
  // Related Words
  synonyms: [{
    type: String,
    trim: true
  }],
  
  antonyms: [{
    type: String,
    trim: true
  }],
  
  // Media
  imageUrl: {
    type: String,
    trim: true
  },
  
  audioUrl: {
    type: String,
    trim: true
  },
  
  // Categorization
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Usage tracking
  usage_count: {
    type: Number,
    default: 0
  },
  
  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  is_active: {
    type: Boolean,
    default: true
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
vocabularySchema.index({ word: 1, part_of_speech: 1 });
vocabularySchema.index({ level: 1 });
vocabularySchema.index({ tags: 1 });
vocabularySchema.index({ topics: 1 });
vocabularySchema.index({ created_at: -1 });

// Text search index
vocabularySchema.index({ 
  word: 'text', 
  meaning: 'text', 
  example: 'text' 
});

// Virtual field - check if has media
vocabularySchema.virtual('has_media').get(function() {
  return !!(this.imageUrl || this.audioUrl);
});

// Pre-save: normalize word to lowercase for consistency
vocabularySchema.pre('save', async function() {
  if (this.isModified('word')) {
    this.word = this.word.toLowerCase();
  }
  
  // Remove empty strings from arrays
  if (this.synonyms) {
    this.synonyms = this.synonyms.filter(s => s && s.trim());
  }
  if (this.antonyms) {
    this.antonyms = this.antonyms.filter(a => a && a.trim());
  }
  if (this.tags) {
    this.tags = this.tags.filter(t => t && t.trim());
  }
});

// Static method: Check for duplicates
vocabularySchema.statics.findDuplicate = async function(word, partOfSpeech, excludeId = null) {
  const query = { 
    word: word.toLowerCase(),
    part_of_speech: partOfSpeech
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return await this.findOne(query);
};

// Static method: Get statistics
vocabularySchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        beginner: { $sum: { $cond: [{ $eq: ['$level', 'beginner'] }, 1, 0] } },
        intermediate: { $sum: { $cond: [{ $eq: ['$level', 'intermediate'] }, 1, 0] } },
        advanced: { $sum: { $cond: [{ $eq: ['$level', 'advanced'] }, 1, 0] } },
        withMedia: { $sum: { $cond: [{ $or: [{ $ne: ['$imageUrl', null] }, { $ne: ['$audioUrl', null] }] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { total: 0, beginner: 0, intermediate: 0, advanced: 0, withMedia: 0 };
};

// Instance method: Increment usage count
vocabularySchema.methods.incrementUsage = async function() {
  this.usage_count += 1;
  await this.save();
};

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);

module.exports = Vocabulary;
