const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    petType: { type: String, enum: ['cat', 'dog', 'dragon', 'bird'], default: 'cat' },
    level: { type: Number, default: 1 },
    growthPoints: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    lastCheckinAt: { type: Date, default: null },
    hunger: { type: Number, default: 0 }, // 0 = full, 100 = starving
    happiness: { type: Number, default: 80 }, // 0-100
  lastPlayedAt: { type: Date, default: null },
    coins: { type: Number, default: 0 },
    inventory: [
      {
        itemId: { type: String },
        qty: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pet', petSchema);
