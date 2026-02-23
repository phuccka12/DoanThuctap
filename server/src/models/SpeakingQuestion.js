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
  // Follow-up questions (cho Part 3)
  follow_up_questions: [{ type: String, trim: true }],
  keywords: [{ type: String }],
  // Sample answer
  sample_answer: {
    text:      { type: String, default: '' },
    audio_url: { type: String, default: '' }
  },
  // Time limits (giây)
  time_limit_sec: { type: Number, default: 60 },
  prep_time_sec:  { type: Number, default: 0 },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  cefr_level: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'B1'
  },
  // AI Persona chấm bài
  ai_persona: {
    role:           { type: String, enum: ['examiner', 'teacher', 'mentor', 'peer'], default: 'examiner' },
    feedback_style: { type: String, enum: ['formal', 'casual', 'encouraging', 'strict'], default: 'formal' }
  },
  // Rubric IELTS-style
  rubric: {
    fluency:       { weight: { type: Number, default: 25 }, description: { type: String, default: 'Fluency & Coherence' } },
    pronunciation: { weight: { type: Number, default: 25 }, description: { type: String, default: 'Pronunciation' } },
    vocabulary:    { weight: { type: Number, default: 25 }, description: { type: String, default: 'Lexical Resource' } },
    grammar:       { weight: { type: Number, default: 25 }, description: { type: String, default: 'Grammatical Range & Accuracy' } }
  },
  hints: [{ type: String }],
  tags:  [{ type: String }],
  // Usage stats
  times_attempted: { type: Number, default: 0 },
  avg_score:       { type: Number, default: 0 },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true
});

speakingQuestionSchema.index({ topic_id: 1, part: 1, is_active: 1 });
speakingQuestionSchema.index({ difficulty: 1, cefr_level: 1 });
speakingQuestionSchema.index({ tags: 1 });

module.exports = mongoose.model('SpeakingQuestion', speakingQuestionSchema);