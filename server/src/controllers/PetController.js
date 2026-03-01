const Pet        = require('../models/Pet');
const User       = require('../models/User');
const PetSpecies = require('../models/PetSpecies');
const {
  earnCoins,
  getPetState,
  getPetBuffMultiplier,
  resolvePetEvolution,
  getExpNeeded,
  getNum,
} = require('../services/economyService');

// Helper: are two dates same UTC day
function isSameUtcDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
}

/** Áp dụng level-up loop theo milestones hoặc base formula */
async function applyLevelUp(pet) {
  let leveled = false;
  let expNeeded = await getExpNeeded(pet);
  while (pet.growthPoints >= expNeeded) {
    pet.growthPoints -= expNeeded;
    pet.level += 1;
    pet.coins += 20;          // bonus coins khi lên cấp
    pet.happiness = Math.min(100, pet.happiness + 10);
    leveled = true;
    expNeeded = await getExpNeeded(pet);
  }
  return leveled;
}

/** Build response đầy đủ: pet + state + evolution image */
async function buildPetResponse(pet) {
  const state   = await getPetState(pet);
  let evolutionImage = '';
  if (pet.speciesRef) {
    const species  = await PetSpecies.findById(pet.speciesRef).lean();
    evolutionImage = resolvePetEvolution(pet, species);
  }
  return { ...pet.toObject(), state, evolutionImage };
}

// GET /api/pet/  - get current user's pet status
exports.getStatus = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    let pet = await Pet.findOne({ user: userId })
      .populate('speciesRef', 'name species_key base_image_url evolutions buffs milestones');
    if (!pet) {
      pet = await Pet.create({ user: userId });
    }

    const petData = await buildPetResponse(pet);
    return res.json({ success: true, pet: petData });
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
      pet = await Pet.create({ user: userId });
    }

    // If already checked in today
    if (pet.lastCheckinAt && isSameUtcDay(pet.lastCheckinAt, now)) {
      return res.status(400).json({ success: false, message: 'Hôm nay đã check-in rồi', pet });
    }

    // Streak logic — kiểm tra freeze
    const isFrozen = pet.streakFrozenUntil && new Date(pet.streakFrozenUntil) > now;
    let newStreak = 1;
    if (pet.lastCheckinAt) {
      const last      = new Date(pet.lastCheckinAt);
      const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
      if (
        last.getUTCFullYear() === yesterday.getUTCFullYear() &&
        last.getUTCMonth()    === yesterday.getUTCMonth()    &&
        last.getUTCDate()     === yesterday.getUTCDate()
      ) {
        newStreak = pet.streakCount + 1;
      } else if (isFrozen) {
        // Bùa đóng băng: giữ nguyên streak dù bỏ hôm qua
        newStreak = pet.streakCount;
        pet.streakFrozenUntil = null; // dùng 1 lần
      }
    }

    pet.streakCount   = newStreak;
    pet.lastCheckinAt = now;

    // Growth points reward
    const bonus = Math.floor(Math.min(50, pet.streakCount / 2));
    pet.growthPoints += 10 + bonus;
    pet.happiness     = Math.min(100, pet.happiness + 5);
    pet.hunger        = Math.max(0, pet.hunger - 5);

    // Level up
    await applyLevelUp(pet);
    await pet.save();

    // Earn coins từ checkin (qua economyService để áp cap)
    const checkinReward = await getNum('economy_reward_checkin', 5);
    const { earned, capReached } = await earnCoins(userId, 'checkin', checkinReward);

    const petData = await buildPetResponse(pet);
    return res.json({
      success: true,
      message: 'Check-in thành công!',
      coinsEarned: earned,
      capReached,
      pet: petData,
    });
  } catch (err) {
    console.error('Pet checkin error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/pet/feed - feed the pet using inventory item (thức ăn từ shop)
exports.feed = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { itemId, qty = 1 } = req.body || {};
    if (!itemId) return res.status(400).json({ success: false, message: 'Cần truyền itemId' });

    // Dùng service useItem để áp dụng effects đúng cách
    const { useItem } = require('../services/economyService');
    const result = await useItem(userId, itemId, Number(qty) || 1);

    const petData = await buildPetResponse(result.pet);
    return res.json({
      success: true,
      message: 'Đã cho pet ăn!',
      appliedEffects: result.appliedEffects,
      pet: petData,
    });
  } catch (err) {
    console.error('Pet feed error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/pet/play - play with pet (cooldown enforced)
exports.play = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Chưa có thú cưng' });

    const now          = new Date();
    const cooldownMin  = Number(process.env.PET_PLAY_COOLDOWN_MIN || 10);
    const cooldownMs   = cooldownMin * 60 * 1000;
    if (pet.lastPlayedAt && (now - new Date(pet.lastPlayedAt) < cooldownMs)) {
      const waitMs = cooldownMs - (now - new Date(pet.lastPlayedAt));
      return res.status(429).json({ success: false, message: 'Còn trong cooldown chơi', retryAfterMs: waitMs });
    }

    // Kiểm tra trạng thái pet — nếu hấp hối không chơi được
    const state = await getPetState(pet);
    if (state.status === 'dying') {
      return res.status(400).json({ success: false, message: 'Pet đang hấp hối! Hãy cho ăn trước rồi chơi' });
    }

    pet.lastPlayedAt = now;
    pet.happiness    = Math.min(100, pet.happiness + 15);
    pet.hunger       = Math.min(100, pet.hunger + 5);
    pet.growthPoints += 2;

    await applyLevelUp(pet);
    await pet.save();

    // Earn 1 coin từ play (qua service để áp cap)
    const { earned } = await earnCoins(userId, 'play', 1);

    const petData = await buildPetResponse(pet);
    return res.json({ success: true, message: 'Đã chơi với pet!', coinsEarned: earned, pet: petData });
  } catch (err) {
    console.error('Pet play error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
