const Pet = require('../models/Pet');
const User = require('../models/User');
const PetSpecies = require('../models/PetSpecies');
const {
  earnCoins,
  getPetState,
  getPetBuffMultiplier,
  resolvePetEvolution,
  getExpNeeded,
   getNum,
} = require('../services/economyService');

// Pet Controller functions follow...

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
  const state = await getPetState(pet);
  let evolutionImage = '';
  if (pet.speciesRef) {
    const species = await PetSpecies.findById(pet.speciesRef).lean();
    evolutionImage = resolvePetEvolution(pet, species);
  }
  return { ...pet.toObject(), state, evolutionImage };
}

/** Đồng bộ coin giữa Pet và User.gamification_data để UI không lệch */
async function syncUserCoinsFromPet(userId, pet) {
  if (!userId || !pet) return;
  const coins = Number(pet.coins || 0);
  await User.findByIdAndUpdate(userId, {
    $set: {
      'gamification_data.gold': coins,
      'gamification_data.coins': coins,
      'gamification_data.level': Number(pet.level || 1),
      'gamification_data.exp': Number(pet.growthPoints || 0),
      'gamification_data.streak': Number(pet.streakCount || 0),
    },
  });
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
    return res.json({ success: true, pet: petData, userGold: 0 });
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
    // Prevent double check-in within 12 hours
    if (pet.lastCheckinAt) {
      const last = new Date(pet.lastCheckinAt);
      if ((now - last) / (1000 * 60 * 60) < 12) {
        return res.status(400).json({ success: false, message: 'Bạn vừa check-in cách đây chưa tới 12 tiếng!', pet });
      }
    }

    // Streak logic — Improved for timezones (12-48h window)
    const isFrozen = pet.streakFrozenUntil && new Date(pet.streakFrozenUntil) > now;
    let newStreak = 1;
    
    if (pet.lastCheckinAt) {
      const last = new Date(pet.lastCheckinAt);
      const diffMs = now - last;
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 12) {
        // Too soon, probably same local day
        return res.status(400).json({ success: false, message: 'Hôm nay bạn đã check-in rồi!', pet });
      } else if (diffHours <= 48) {
        // Meaningful gap (next day), increment
        newStreak = pet.streakCount + 1;
      } else if (isFrozen) {
        // More than 48h but has freeze buff
        newStreak = pet.streakCount;
        pet.streakFrozenUntil = null; // consume
      } else {
        // Too long, reset
        newStreak = 1;
      }
    }

    pet.streakCount = newStreak;
    pet.lastCheckinAt = now;

    // Milestone Rewards Logic
    const milestoneRewards = {
      3:  { coins: 50, gp: 0,   happiness: 10, label: 'Đồng' },
      7:  { coins: 150, gp: 50,  happiness: 20, label: 'Bạc' },
      14: { coins: 400, gp: 100, happiness: 30, label: 'Vàng' },
      30: { coins: 1000, gp: 250, happiness: 50, label: 'Kim cương' }
    };

    let milestoneReached = null;
    if (milestoneRewards[newStreak] && !pet.streakMilestones.includes(newStreak)) {
      const reward = milestoneRewards[newStreak];
      milestoneReached = { day: newStreak, ...reward };
      
      // Grant coins
      await earnCoins(userId, `streak_milestone_${newStreak}`, reward.coins);
      
      // Grant GP & Happiness
      pet.growthPoints += reward.gp;
      pet.happiness = Math.min(100, pet.happiness + reward.happiness);
      
      // Save milestone
      pet.streakMilestones.push(newStreak);
    }

    // Standard growth points reward
    const bonus = Math.floor(Math.min(50, pet.streakCount / 2));
    pet.growthPoints += 10 + bonus;
    pet.happiness = Math.min(100, pet.happiness + 5);
    pet.hunger = Math.max(0, pet.hunger - 5);

    // Level up
    await applyLevelUp(pet);
    
    // Earn coins từ checkin (cộng trực tiếp, không cap hàng ngày)
    const checkinReward = await getNum('economy_reward_checkin', 5);
    pet.coins += checkinReward;
    await pet.save();
  await syncUserCoinsFromPet(userId, pet);

    const petData = await buildPetResponse(pet);
    return res.json({
      success: true,
      message: milestoneReached 
        ? `CHÚC MỪNG! Bạn đã đạt mốc ${newStreak} ngày (${milestoneReached.label})!` 
        : 'Check-in thành công!',
      milestone: milestoneReached,
      coinsEarned: checkinReward + (milestoneReached?.coins || 0),
      capReached: false,
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

    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Chưa có thú cưng' });

    // Kiểm tra số dư coin thú cưng
    const currentCoins = pet.coins ?? 0;
    if (currentCoins < FEED_COST) {
      return res.status(400).json({
        success: false,
        message: `Không đủ coins! Cần ${FEED_COST} 🪙, bạn có ${currentCoins} 🪙`,
        required: FEED_COST,
        current: currentCoins,
      });
    }

    // Trừ coins, giảm hunger
    pet.coins = Math.max(0, currentCoins - FEED_COST);
    pet.hunger = Math.max(0, pet.hunger - 30);
    pet.happiness = Math.min(100, pet.happiness + 5);
    await pet.save();
  await syncUserCoinsFromPet(userId, pet);

    const petData = await buildPetResponse(pet);
    return res.json({
      success: true,
      message: `Đã cho ăn! -${FEED_COST} 🪙`,
      costPaid: FEED_COST,
      userGold: 0,
      pet: petData,
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

    const now = new Date();
    const cooldownMin = Number(process.env.PET_PLAY_COOLDOWN_MIN || 10);
    const cooldownMs = cooldownMin * 60 * 1000;
    if (pet.lastPlayedAt && (now - new Date(pet.lastPlayedAt) < cooldownMs)) {
      const waitMs = cooldownMs - (now - new Date(pet.lastPlayedAt));
      return res.status(429).json({ success: false, message: 'Còn trong cooldown chơi', retryAfterMs: waitMs });
    }

    // Kiểm tra trạng thái pet — nếu hấp hối không chơi được
    const state = await getPetState(pet);
    if (state.status === 'dying') {
      return res.status(400).json({ success: false, message: 'Pet đang hấp hối! Hãy cho ăn trước rồi chơi' });
    }

    // Trạng thái coin: chơi tiêu PLAY_COST coin thú cưng
    if ((pet.coins ?? 0) < PLAY_COST) {
      return res.status(400).json({
        success: false,
        message: `Không đủ coins để chơi! Cần ${PLAY_COST} 🪙, bạn có ${pet.coins ?? 0} 🪙`
      });
    }

    pet.coins = Math.max(0, (pet.coins ?? 0) - PLAY_COST);
    pet.lastPlayedAt = now;
    pet.happiness = Math.min(100, pet.happiness + 15);
    pet.hunger = Math.min(100, pet.hunger + 5);
    pet.growthPoints += 2;

    await applyLevelUp(pet);
    await pet.save();

    // Earn 1 coin từ play (cộng trực tiếp)
    pet.coins += 1;
    await pet.save();
  await syncUserCoinsFromPet(userId, pet);

    const petData = await buildPetResponse(pet);
    return res.json({ success: true, message: 'Đã chơi với pet!', coinsEarned: 1, pet: petData });
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
  fire: 'dragon',  // Trứng Lửa → Rồng (Dino đỏ GIF)
  ice: 'frog',    // Trứng Băng → Ếch Băng (pixel sprite)
  leaf: 'pig',     // Trứng Lá  → Heo Lá (pixel sprite)
  default: 'slime',   // Default (skip)  → Slime
};

const EGG_NAMES = {
  fire: 'Rồng Lửa',
  ice: 'Mèo Băng',
  leaf: 'Corgi Lá',
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
    pet.hatched = false; // chưa nở
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
    pet.hatched = true;
    pet.happiness = 100;
    pet.hunger = 0;
    pet.coins = 200;  // Bonus coins khi hatch (cộng trực tiếp, không dùng earnCoins vì là 1 lần)
    await pet.save();
  await syncUserCoinsFromPet(userId, pet);

    const petData = await buildPetResponse(pet);
    return res.json({
      success: true,
      message: `🎉 ${petName} đã gia nhập đội của bạn!`,
      petName,
      petType,
      coinsEarned: 200,
      pet: petData,
    });
  } catch (err) {
    console.error('hatch error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
