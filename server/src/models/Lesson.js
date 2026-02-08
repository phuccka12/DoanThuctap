const mongoose = require('mongoose');

/**
 * Lesson Model - Represents a chapter/lesson in a topic
 * Example: "Check-in at airport", "Ordering food", "Asking directions"
 */
const lessonSchema = new mongoose.Schema({
  // Reference to parent topic
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
    index: true
  },

  // Basic info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Display order (for sorting)
  order: {
    type: Number,
    default: 0
  },

  // Estimated duration in minutes
  duration: {
    type: Number,
    default: 15
  },

  // Cover image for lesson
  cover_image: {
    type: String,
    default: ''
  },

  // Level
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },

  // CourseBuilder nodes (activities)
  // This is where Builder data is stored for THIS specific lesson
  nodes: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  // Status
  is_active: {
    type: Boolean,
    default: true
  },

  is_published: {
    type: Boolean,
    default: false
  },

  // Statistics
  stats: {
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    avg_time_spent: { type: Number, default: 0 }
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save - use async/await for newer Mongoose
lessonSchema.pre('save', async function() {
  this.updated_at = Date.now();
});

// Virtual for activity count
lessonSchema.virtual('activities_count').get(function() {
  return this.nodes ? this.nodes.length : 0;
});

// Ensure virtuals are included in JSON
lessonSchema.set('toJSON', { virtuals: true });
lessonSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Lesson', lessonSchema);
