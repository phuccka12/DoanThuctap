const Pet = require('../models/Pet');
const User = require('../models/User');

// Helper: are two dates same UTC day
function isSameUtcDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
}

// GET /api/pet/  - get current user's pet status
exports.getStatus = async (req, res) => {
  try {
    console.log('[PetController.getStatus] Called by user:', req.userId);
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    let pet = await Pet.findOne({ user: userId });
    if (!pet) {
      // create default pet for user
      console.log('[PetController.getStatus] Creating new pet for user:', userId);
      pet = await Pet.create({ user: userId });
    }

    console.log('[PetController.getStatus] Returning pet:', pet._id);
    return res.json({ success: true, pet });
  } catch (err) {
    console.error('Pet getStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/pet/checkin - record a daily check-in
exports.checkin = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const now = new Date();
    let pet = await Pet.findOne({ user: userId });
    if (!pet) {
      pet = await Pet.create({ user: userId, lastCheckinAt: null });
    }

    // If already checked in today
    if (pet.lastCheckinAt && isSameUtcDay(pet.lastCheckinAt, now)) {
      return res.status(400).json({ success: false, message: 'Already checked in today', pet });
    }

    // Determine streak: if lastCheckin was yesterday (UTC) then increment, else reset to 1
    let newStreak = 1;
    if (pet.lastCheckinAt) {
      const last = new Date(pet.lastCheckinAt);
      const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
      if (last.getUTCFullYear() === yesterday.getUTCFullYear() && last.getUTCMonth() === yesterday.getUTCMonth() && last.getUTCDate() === yesterday.getUTCDate()) {
        newStreak = pet.streakCount + 1;
      }
    }

    pet.streakCount = newStreak;
    pet.lastCheckinAt = now;
    // Growth points reward (example: 10 pts/day + bonus for streak)
    const bonus = Math.floor(Math.min(50, pet.streakCount / 2));
    pet.growthPoints += 10 + bonus;
    pet.happiness = Math.min(100, pet.happiness + 5 + Math.floor(bonus / 5));
    pet.hunger = Math.max(0, pet.hunger - 5);
    pet.coins += 5; // small reward

    // Level up if growthPoints threshold reached
    const threshold = 100 * pet.level;
    if (pet.growthPoints >= threshold) {
      pet.growthPoints -= threshold;
      pet.level += 1;
      // on level up, extra coins/happiness
      pet.coins += 20;
      pet.happiness = Math.min(100, pet.happiness + 10);
    }

    await pet.save();

    return res.json({ success: true, message: 'Check-in recorded', pet });
  } catch (err) {
    console.error('Pet checkin error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/pet/feed - feed the pet using inventory item or by buying food with coins
exports.feed = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { itemId, qty = 1 } = req.body || {};
    const amount = Math.max(1, Number(qty) || 1);

    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    // If itemId provided, consume from inventory
    if (itemId) {
      const idx = pet.inventory.findIndex(i => i.itemId === itemId);
      if (idx === -1 || pet.inventory[idx].qty < amount) {
        return res.status(400).json({ success: false, message: 'Not enough item in inventory' });
      }
      pet.inventory[idx].qty -= amount;
      if (pet.inventory[idx].qty <= 0) pet.inventory.splice(idx, 1);
    } else {
      // Purchase food with coins (fallback) - cost 2 coins per feed unit
      const costPer = 2;
      const totalCost = costPer * amount;
      if (pet.coins < totalCost) return res.status(400).json({ success: false, message: 'Not enough coins to buy food' });
      pet.coins -= totalCost;
    }

    // Apply feed effects
    pet.hunger = Math.max(0, pet.hunger - 20 * amount);
    pet.happiness = Math.min(100, pet.happiness + 5 * amount);

    await pet.save();
    return res.json({ success: true, message: 'Fed pet', pet });
  } catch (err) {
    console.error('Pet feed error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/pet/play - play with pet (cooldown enforced)
exports.play = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    const now = new Date();
    const cooldownMin = Number(process.env.PET_PLAY_COOLDOWN_MIN || 10);
    const cooldownMs = cooldownMin * 60 * 1000;
    if (pet.lastPlayedAt && (now - new Date(pet.lastPlayedAt) < cooldownMs)) {
      const waitMs = cooldownMs - (now - new Date(pet.lastPlayedAt));
      return res.status(429).json({ success: false, message: 'Play on cooldown', retryAfterMs: waitMs });
    }

    pet.lastPlayedAt = now;
    pet.happiness = Math.min(100, pet.happiness + 15);
    // playing makes pet slightly hungrier
    pet.hunger = Math.min(100, pet.hunger + 5);
    pet.growthPoints += 2;
    pet.coins += 1;

    // Level up check (reuse same threshold logic)
    const threshold = 100 * pet.level;
    if (pet.growthPoints >= threshold) {
      pet.growthPoints -= threshold;
      pet.level += 1;
      pet.coins += 10;
      pet.happiness = Math.min(100, pet.happiness + 5);
    }

    await pet.save();
    return res.json({ success: true, message: 'Played with pet', pet });
  } catch (err) {
    console.error('Pet play error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
