const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Link tới PetSpecies (Pokedex) — nếu null → dùng petType string cũ cho backwards compat
    speciesRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'PetSpecies', default: null },
    petType:       { type: String, enum: ['cat', 'dog', 'dragon', 'bird', 'slime', 'custom', 'frog', 'pig'], default: 'cat' },

    // Tên do user đặt (tối đa 20 ký tự)
    nickname: { type: String, default: '', trim: true, maxlength: 20 },

    // ── Egg / Hatch system ──────────────────────────────────────────────
    // egg_type: loại trứng user chọn trong onboarding ('fire','ice','leaf','default')
    // hatched: false = trứng chưa nở (hiện widget trứng), true = đã nở (hiện pet)
    egg_type: { type: String, enum: ['fire', 'ice', 'leaf', 'default', null], default: null },
    hatched:  { type: Boolean, default: false },
    // ────────────────────────────────────────────────────────────────────
    level:         { type: Number, default: 1 },
    growthPoints:  { type: Number, default: 0 },
    streakCount:   { type: Number, default: 0 },
    lastCheckinAt: { type: Date, default: null },

    // hunger: 0 = full / no hunger, 100 = maximal hunger (hấp hối)
    hunger:        { type: Number, default: 0, min: 0, max: 100 },
    happiness:     { type: Number, default: 80, min: 0, max: 100 },
    lastPlayedAt:  { type: Date, default: null },

    coins:         { type: Number, default: 0, min: 0 },

    // Trang phục đang mặc
    equippedSkin:  { type: String, default: null },

    // Bùa đóng băng streak
    streakFrozenUntil: { type: Date, default: null },

    // Các mốc streak đã đạt được và nhận thưởng (e.g. [3, 7, 14, 30])
    streakMilestones: { type: [Number], default: [] },

    // EXP buff tạm thời (từ vật phẩm) — % cộng thêm
    activeExpBuff: { type: Number, default: 0 },

    // Coins earned today (dùng để check daily cap — reset hàng ngày)
    coinsEarnedToday: { type: Number, default: 0 },
    coinsEarnedDate:  { type: String, default: '' }, // format: YYYY-MM-DD UTC

    // Study time tracked via heartbeat (seconds)
    studyTimeToday:   { type: Number, default: 0 },
    studyTimeDate:    { type: String, default: '' }, // format: YYYY-MM-DD UTC

    inventory: [
      {
        itemId: { type: String },
        qty:    { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pet', petSchema);
