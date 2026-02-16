const mongoose = require('mongoose');

/**
 * WritingScenario Schema
 * Gamified writing experience with simulation-based learning
 * Admin creates "game levels" instead of traditional writing prompts
 */
const writingScenarioSchema = new mongoose.Schema({
  // === LEVEL DESIGN (Dựng màn chơi) ===
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  scenario_type: {
    type: String,
    enum: ['messenger', 'email', 'comment', 'diary', 'letter', 'social_post', 'review'],
    required: [true, 'Scenario type is required'],
    default: 'messenger'
  },
  
  // Context/Background
  context_image_url: {
    type: String,
    trim: true
  },
  
  context_description: {
    type: String,
    required: [true, 'Context description is required'],
    trim: true,
    maxlength: [500, 'Context description cannot exceed 500 characters']
  },
  
  situation_prompt: {
    type: String,
    required: [true, 'Situation prompt is required'],
    trim: true,
    maxlength: [300, 'Situation prompt cannot exceed 300 characters']
  },
  
  // === GAME RULES (Luật chơi/Constraints) ===
  forbidden_words: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  required_keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  target_tone: {
    type: String,
    enum: ['neutral', 'friendly', 'formal', 'casual', 'sarcastic', 'angry', 'emotional', 'professional', 'humorous'],
    default: 'neutral'
  },
  
  tone_intensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  word_limit: {
    min: {
      type: Number,
      default: 50
    },
    max: {
      type: Number,
      default: 150
    }
  },
  
  time_limit: {
    type: Number, // seconds (optional)
    default: null
  },
  
  // === AI PERSONA (Đứa chấm bài) ===
  ai_persona: {
    role: {
      type: String,
      enum: ['best_friend', 'teacher', 'boss', 'parent', 'mentor', 'critic', 'stranger'],
      default: 'teacher'
    },
    personality: {
      type: String,
      trim: true,
      maxlength: [300, 'Personality description cannot exceed 300 characters']
    },
    feedback_style: {
      type: String,
      enum: ['formal', 'casual', 'humorous', 'strict', 'encouraging'],
      default: 'casual'
    },
    response_template: {
      type: String,
      default: '{{feedback}} Score: {{score}}/10'
    }
  },
  
  // === EVALUATION CRITERIA (Rubric) ===
  rubric: {
    tone_match: {
      weight: { type: Number, default: 30 },
      description: { type: String, default: 'Does the tone match the target?' }
    },
    vocabulary: {
      weight: { type: Number, default: 30 },
      description: { type: String, default: 'Are required keywords used?' }
    },
    creativity: {
      weight: { type: Number, default: 20 },
      description: { type: String, default: 'Is it creative and original?' }
    },
    grammar: {
      weight: { type: Number, default: 20 },
      description: { type: String, default: 'Is the grammar correct?' }
    }
  },
  
  // === METADATA ===
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  cefr_level: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'B1'
  },
  
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  
  estimated_time: {
    type: Number, // minutes
    default: 10
  },
  
  difficulty_score: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  is_active: {
    type: Boolean,
    default: true
  },
  
  // Usage & Stats
  usage_count: {
    type: Number,
    default: 0
  },
  
  average_score: {
    type: Number,
    default: 0
  },
  
  completion_count: {
    type: Number,
    default: 0
  },
  
  // Sample answers (for reference)
  sample_answers: [{
    text: String,
    score: Number,
    feedback: String,
    is_model_answer: {
      type: Boolean,
      default: false
    }
  }],
  
  // Creator
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
writingScenarioSchema.index({ title: 'text', context_description: 'text', tags: 'text' });
writingScenarioSchema.index({ scenario_type: 1 });
writingScenarioSchema.index({ level: 1 });
writingScenarioSchema.index({ cefr_level: 1 });
writingScenarioSchema.index({ topics: 1 });
writingScenarioSchema.index({ is_active: 1 });
writingScenarioSchema.index({ created_at: -1 });
writingScenarioSchema.index({ usage_count: -1 });

// Virtual: Question/challenge complexity score
writingScenarioSchema.virtual('complexity_score').get(function() {
  let score = 0;
  score += this.forbidden_words?.length * 2 || 0;
  score += this.required_keywords?.length * 3 || 0;
  score += this.tone_intensity > 7 ? 5 : 0;
  score += this.word_limit?.max > 200 ? 3 : 0;
  return Math.min(score, 10);
});

// Ensure virtuals are included
writingScenarioSchema.set('toJSON', { virtuals: true });
writingScenarioSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WritingScenario', writingScenarioSchema);
