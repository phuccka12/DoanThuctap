const mongoose = require("mongoose");

const gamificationSchema = new mongoose.Schema(
  {
    level: { type: Number, default: 1 },
    gold: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
  },
  { _id: false }
);

const learningPreferencesSchema = new mongoose.Schema(
  {
    goal: { type: String, default: null }, // 'band', 'speaking', 'writing', 'listening', 'grammar'
    target_band: { type: Number, default: null }, // 6.5, 7.0, 7.5, 8.0
    current_level: { type: String, default: null }, // 'beginner', 'intermediate', 'advanced'
    study_hours_per_week: { type: Number, default: null }, // 5, 10, 15, 20
    preferred_study_days: { type: [String], default: [] }, // ['monday', 'tuesday', ...]
    exam_date: { type: Date, default: null },
    focus_skills: { type: [String], default: [] }, // ['speaking', 'writing', 'listening', 'reading']
    wants_placement_check: { type: Boolean, default: false },
  },
  { _id: false }
);

const placementResultSchema = new mongoose.Schema(
  {
    score:          { type: Number, default: null }, // 0-100
    cefr_level:     { type: String, default: null }, // A1 A2 B1 B2 C1 C2
    vocab_score:    { type: Number, default: null }, // 0-40
    reading_score:  { type: Number, default: null }, // 0-35
    speaking_score: { type: Number, default: null }, // 0-25
    completed_at:   { type: Date,   default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },

    // Extended profile fields
    phone:         { type: String, default: null },
    date_of_birth: { type: Date,   default: null },
    address:       { type: String, default: null },
    bio:           { type: String, default: null },
    current_band:  { type: Number, default: null },

    // Google OAuth fields
    google_id: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: null },

    role: { type: String, enum: ["standard", "vip", "admin"], default: "standard" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    vip_expire_at: { type: Date, default: null },

    gamification_data: { type: gamificationSchema, default: () => ({}) },

    // Onboarding tracking
    onboarding_completed: { type: Boolean, default: false },
    learning_preferences: { type: learningPreferencesSchema, default: () => ({}) },

    // Placement test
    placement_test_completed: { type: Boolean, default: false },
    placement_test_result:    { type: placementResultSchema, default: null },
  // Temporary bonus stored when user starts a retake from UI (consumed on submit)
  placement_test_bonus: { type: Number, default: 0 },
  // Whether we auto-assigned a default onboarding level (to avoid double-awarding subsidy)
  onboarding_default_assigned: { type: Boolean, default: false },

    last_login_at: { type: Date, default: null },

    email_verified: { type: Boolean, default: false },

    // Vocabulary learning progress: { [topicId]: [wordId, ...] }
    vocab_progress: { type: Map, of: [mongoose.Schema.Types.ObjectId], default: {} },

    failed_login_attempts: { type: Number, default: 0 },
    lock_until: { type: Date, default: null },

    // User settings
    settings: {
      ai_voice: { type: String, default: 'female' }, // 'male' / 'female'
      ai_speed: { type: Number, default: 1.0 },    // 0.5 to 2.0
      notifications_enabled: { type: Boolean, default: true },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model('User', userSchema);