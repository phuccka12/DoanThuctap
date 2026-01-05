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

const userSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },

    // Google OAuth fields
    google_id: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: null },

    role: { type: String, enum: ["standard", "vip", "admin"], default: "standard" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    vip_expire_at: { type: Date, default: null },

    gamification_data: { type: gamificationSchema, default: () => ({}) },

    last_login_at: { type: Date, default: null },

    email_verified: { type: Boolean, default: false },

    failed_login_attempts: { type: Number, default: 0 },
    lock_until: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model('User', userSchema);