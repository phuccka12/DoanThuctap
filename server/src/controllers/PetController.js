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

    // Lấy gold của user để frontend biết nút nào disabled
    const user = await User.findById(userId).select('gamification_data');
    const userGold = user?.gamification_data?.gold ?? 0;

    const petData = await buildPetResponse(pet);
    return res.json({ success: true, pet: petData, userGold });
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

/**
 * POST /api/pet/feed-direct
 * Cho pet ăn trực tiếp bằng coins (không cần inventory item).
 * Chi phí: FEED_COST coins. Giảm hunger 30 điểm.
 */
const FEED_COST = 50;
const PLAY_COST = 20;

exports.feedDirect = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    // Kiểm tra số dư
    const user = await User.findById(userId).select('gamification_data');
    const currentGold = user?.gamification_data?.gold ?? 0;
    if (currentGold < FEED_COST) {
      return res.status(400).json({
        success: false,
        message: `Không đủ coins! Cần ${FEED_COST} 🪙, bạn có ${currentGold} 🪙`,
        required: FEED_COST,
        current: currentGold,
      });
    }

    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Chưa có thú cưng' });

    // Trừ coins, giảm hunger
    await User.findByIdAndUpdate(userId, {
      $inc: { 'gamification_data.gold': -FEED_COST },
    });
    pet.hunger    = Math.max(0, pet.hunger - 30);
    pet.happiness = Math.min(100, pet.happiness + 5);
    await pet.save();

    const updatedUser = await User.findById(userId).select('gamification_data');
    const userGold = updatedUser?.gamification_data?.gold ?? 0;

    const petData = await buildPetResponse(pet);
    return res.json({
      success:   true,
      message:   `Đã cho ăn! -${FEED_COST} 🪙`,
      costPaid:  FEED_COST,
      userGold,
      pet:       petData,
    });
  } catch (err) {
    console.error('feedDirect error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
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

/**
 * PATCH /api/pet/rename
 * Đổi nickname cho pet. Body: { nickname: string }
 */
exports.rename = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { nickname } = req.body || {};
    if (!nickname || typeof nickname !== 'string') {
      return res.status(400).json({ success: false, message: 'nickname không hợp lệ' });
    }
    const trimmed = nickname.trim().slice(0, 20);
    if (!trimmed) return res.status(400).json({ success: false, message: 'nickname không được để trống' });

    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Chưa có thú cưng' });

    pet.nickname = trimmed;
    await pet.save();

    return res.json({ success: true, nickname: pet.nickname });
  } catch (err) {
    console.error('rename error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── EGG / HATCH SYSTEM ───────────────────────────────────────────────────────

// Map trứng → petType khi nở
const EGG_TO_PET = {
  fire:    'dragon',  // Trứng Lửa → Rồng (Dino đỏ GIF)
  ice:     'frog',    // Trứng Băng → Ếch Băng (pixel sprite)
  leaf:    'pig',     // Trứng Lá  → Heo Lá (pixel sprite)
  default: 'slime',   // Default (skip)  → Slime
};

const EGG_NAMES = {
  fire:    'Rồng Lửa',
  ice:     'Mèo Băng',
  leaf:    'Corgi Lá',
  default: 'Slime',
};

/**
 * POST /api/pet/choose-egg
 * Gọi trong onboarding bước chọn trứng.
 * body: { egg_type: 'fire' | 'ice' | 'leaf' }
 */
exports.chooseEgg = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { egg_type } = req.body || {};
    if (!['fire', 'ice', 'leaf'].includes(egg_type)) {
      return res.status(400).json({ success: false, message: 'egg_type không hợp lệ (fire | ice | leaf)' });
    }

    // Tạo hoặc cập nhật pet record
    let pet = await Pet.findOne({ user: userId });
    if (!pet) {
      pet = new Pet({ user: userId });
    }

    pet.egg_type = egg_type;
    pet.hatched  = false; // chưa nở
    await pet.save();

    return res.json({ success: true, message: `Đã chọn trứng ${egg_type}!`, egg_type });
  } catch (err) {
    console.error('chooseEgg error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/pet/hatch
 * User bấm nút "Ấp nở" trên Dashboard. Chỉ cho phép nếu hatched=false.
 * Trả về petType sau khi nở + thưởng 200 coins.
 */
exports.hatch = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    let pet = await Pet.findOne({ user: userId });
    if (!pet) {
      pet = await Pet.create({ user: userId, egg_type: 'default', hatched: false });
    }

    if (pet.hatched) {
      const petData = await buildPetResponse(pet);
      return res.status(400).json({ success: false, message: 'Trứng đã nở rồi!', pet: petData });
    }

    const eggType = pet.egg_type || 'default';
    const petType = EGG_TO_PET[eggType] || 'slime';
    const petName = EGG_NAMES[eggType] || 'Slime';

    pet.petType = petType;
    pet.hatched  = true;
    pet.happiness = 100;
    pet.hunger    = 0;
    await pet.save();

    // Thưởng 200 coins khi ấp nở
    const { earned } = await earnCoins(userId, 'hatch_bonus', 200);

    const petData = await buildPetResponse(pet);
    return res.json({
      success:    true,
      message:    `🎉 ${petName} đã gia nhập đội của bạn!`,
      petName,
      petType,
      coinsEarned: earned,
      pet:        petData,
    });
  } catch (err) {
    console.error('hatch error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
