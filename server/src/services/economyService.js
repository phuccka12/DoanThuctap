'use strict';
/**
 * economyService.js
 * Trung tâm xử lý nghiệp vụ Coins + Pet survival + EXP cho toàn hệ thống.
 * Không hard-code số liệu — mọi hằng số đọc từ SystemConfig (DB) qua getNum().
 *
 * Public API:
 *   earnCoins(userId, source, rawAmount)   → { earned, totalToday, capReached, pet }
 *   spendCoins(userId, itemId, qty)        → { pet }
 *   getPetState(pet)                       → { status, expMultiplier, expLocked }
 *   getPetBuffMultiplier(pet, skill)       → Number (multiplier tổng của EXP)
 *   resolvePetEvolution(pet, species)      → currentImageUrl
 */

const SystemConfig = require('../models/SystemConfig');
const CoinLog      = require('../models/CoinLog');
const ShopItem     = require('../models/ShopItem');
const Pet          = require('../models/Pet');
const PetSpecies   = require('../models/PetSpecies');
const User         = require('../models/User');

// ─── Config cache (refresh mỗi 5 phút để không spam DB) ─────────────────────
let _cfgCache = null;
let _cfgCacheAt = 0;
const CFG_TTL_MS = 5 * 60 * 1000;

async function loadEconomyCfg() {
  if (_cfgCache && Date.now() - _cfgCacheAt < CFG_TTL_MS) return _cfgCache;
  const keys = [
    'economy_daily_coin_cap',
    'economy_reward_vocab',
    'economy_reward_speaking',
    'economy_reward_writing',
    'economy_reward_reading',
    'economy_reward_listening',
    'economy_reward_checkin',
    'economy_hunger_decay_per_day',
    'economy_hunger_happy_threshold',
    'economy_hunger_dying_threshold',
    'economy_exp_buff_happy_pct',
    'economy_freeze_streak_cost',
    'economy_pet_exp_per_level_base',
  ];
  const rows = await SystemConfig.find({ key: { $in: keys } }).lean();
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  _cfgCache = map;
  _cfgCacheAt = Date.now();
  return map;
}

/** Lấy số từ config, nếu thiếu trả về fallback */
async function getNum(key, fallback) {
  const cfg = await loadEconomyCfg();
  const v = parseFloat(cfg[key]);
  return isNaN(v) ? fallback : v;
}

/** Invalidate cache khi admin cập nhật economy settings */
function invalidateEconomyCache() {
  _cfgCache = null;
  _cfgCacheAt = 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayUtcKey() {
  const d = new Date();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

/**
 * Đọc số Coins đã kiếm hôm nay từ field trên Pet document (fast path).
 * Nếu ngày khác → reset về 0.
 */
function coinsEarnedTodayFromPet(pet) {
  const today = todayUtcKey();
  if (pet.coinsEarnedDate !== today) return 0;
  return pet.coinsEarnedToday || 0;
}

// ─── Resolve evolution image từ species ─────────────────────────────────────
function resolvePetEvolution(pet, species) {
  if (!species || !species.evolutions || !species.evolutions.length) {
    return species?.base_image_url || '';
  }
  // Lấy evolution cao nhất mà pet.level đạt được
  const sorted = [...species.evolutions].sort((a, b) => b.level - a.level);
  const match = sorted.find(e => pet.level >= e.level);
  return match?.image_url || species.base_image_url || '';
}

// ─── Pet state logic ─────────────────────────────────────────────────────────
/**
 * Trả về trạng thái pet dựa trên hunger:
 *   happy   – hunger < happy_threshold    → +expBuff, expLocked=false
 *   neutral – hunger < warning_threshold  → expBuff=0, expLocked=false
 *   warning – hunger < dying_threshold    → expBuff=0, expLocked=false, widget chớp đỏ
 *   dying   – hunger >= dying_threshold   → expBuff=0, expLocked=true, streak vỡ
 */
async function getPetState(pet) {
  const happyThreshold   = await getNum('economy_hunger_happy_threshold',   50);
  const warningThreshold = await getNum('economy_hunger_warning_threshold', 80);
  const dyingThreshold   = await getNum('economy_hunger_dying_threshold',  100);
  const expBuffPct       = await getNum('economy_exp_buff_happy_pct',       10);

  const h = pet.hunger ?? 0;
  if (h >= dyingThreshold) {
    return { status: 'dying',   expMultiplier: 1,                    expLocked: true  };
  }
  if (h >= warningThreshold) {
    return { status: 'warning', expMultiplier: 1,                    expLocked: false };
  }
  if (h < happyThreshold) {
    return { status: 'happy',   expMultiplier: 1 + expBuffPct / 100, expLocked: false };
  }
  return   { status: 'neutral', expMultiplier: 1,                    expLocked: false };
}

// ─── Pet species buff multiplier ─────────────────────────────────────────────
async function getPetBuffMultiplier(pet, skill) {
  try {
    if (!pet.speciesRef) return 1;
    const species = await PetSpecies.findById(pet.speciesRef).lean();
    if (!species || !species.buffs || !species.buffs.length) return 1;
    let pct = 0;
    for (const buff of species.buffs) {
      if (buff.type !== 'exp_bonus_pct') continue;
      if (buff.skill === 'all' || buff.skill === skill) {
        pct += buff.value;
      }
    }
    return 1 + pct / 100;
  } catch {
    return 1;
  }
}

// ─── EarnCoins ───────────────────────────────────────────────────────────────
/**
 * Ghi nhận user kiếm Coins sau khi hoàn thành bài tập.
 * rawAmount: số Coins dự kiến (từ reward config).
 * Trả về số Coins thực sự kiếm được (có thể = 0 nếu đã đạt cap).
 */
async function earnCoins(userId, source, rawAmount) {
  const cap  = await getNum('economy_daily_coin_cap', 300);
  const pet  = await Pet.findOne({ user: userId });
  if (!pet) return { earned: 0, totalToday: 0, capReached: true, pet: null };

  const today          = todayUtcKey();
  const alreadyEarned  = coinsEarnedTodayFromPet(pet);
  const canEarn        = Math.max(0, cap - alreadyEarned);
  const earned         = Math.min(rawAmount, canEarn);
  const capReached     = canEarn <= 0;

  if (earned > 0) {
    pet.coins += earned;
    // Cập nhật daily counter
    if (pet.coinsEarnedDate !== today) {
      pet.coinsEarnedToday = earned;
      pet.coinsEarnedDate  = today;
    } else {
      pet.coinsEarnedToday = alreadyEarned + earned;
    }
    await pet.save();

    await CoinLog.create({
      user:          userId,
      pet:           pet._id,
      type:          'earn',
      source,
      amount:        earned,
      balance_after: pet.coins,
      note:          `Nhận ${earned} Coins từ ${source}`,
    });
  }

  return { earned, totalToday: alreadyEarned + earned, capReached, pet };
}

// ─── SpendCoins ──────────────────────────────────────────────────────────────
/**
 * User mua vật phẩm từ shop.
 * Trả về { pet, item, qty } sau khi trừ coin và cộng vào inventory.
 */
async function spendCoins(userId, itemId, qty = 1) {
  const item = await ShopItem.findById(itemId);
  if (!item || !item.is_active) throw new Error('Vật phẩm không tồn tại hoặc đã ngừng bán');

  const totalCost = item.price * qty;
  const pet = await Pet.findOne({ user: userId });
  if (!pet) throw new Error('Chưa có thú cưng');

  if (pet.coins < totalCost) throw new Error(`Không đủ Coins (cần ${totalCost}, có ${pet.coins})`);

  // Trừ coin
  pet.coins -= totalCost;

  // Thêm vào inventory
  if (item.category !== 'skin') {
    // food & function: stack vào inventory
    const idx = pet.inventory.findIndex(i => i.itemId === itemId.toString());
    if (idx >= 0) {
      pet.inventory[idx].qty += qty;
    } else {
      pet.inventory.push({ itemId: itemId.toString(), qty });
    }
  }

  // Nếu là skin → tự apply ngay (gắn vào pet.equippedSkin)
  if (item.category === 'skin') {
    pet.equippedSkin = itemId.toString();
  }

  await pet.save();

  await CoinLog.create({
    user:          userId,
    pet:           pet._id,
    type:          'spend',
    source:        'buy_item',
    amount:        -totalCost,
    balance_after: pet.coins,
    item_id:       itemId,
    note:          `Mua ${qty}x ${item.name} (-${totalCost} Coins)`,
  });

  return { pet, item, qty };
}

// ─── UseItem (dùng vật phẩm từ inventory) ────────────────────────────────────
/**
 * Dùng vật phẩm có sẵn trong inventory (food / function).
 * Trả về { pet, effects } — effects là object mô tả tác dụng đã áp dụng.
 */
async function useItem(userId, itemId, qty = 1) {
  const item = await ShopItem.findById(itemId);
  if (!item) throw new Error('Vật phẩm không tồn tại');

  const pet = await Pet.findOne({ user: userId });
  if (!pet) throw new Error('Chưa có thú cưng');

  // Kiểm tra inventory
  const idx = pet.inventory.findIndex(i => i.itemId === itemId.toString());
  if (idx === -1 || pet.inventory[idx].qty < qty) {
    throw new Error('Không đủ vật phẩm trong túi đồ');
  }

  pet.inventory[idx].qty -= qty;
  if (pet.inventory[idx].qty <= 0) pet.inventory.splice(idx, 1);

  const effects = item.effects || {};
  const appliedEffects = {};

  // Áp dụng tác dụng
  if (effects.hunger_restore) {
    const restore = effects.hunger_restore * qty;
    pet.hunger = Math.max(0, pet.hunger - restore);
    appliedEffects.hunger_restored = restore;
  }
  if (effects.exp_bonus_pct !== undefined) {
    // Buff tạm thời — lưu vào pet.activeBuffs (xử lý ở controller bài tập)
    pet.activeExpBuff = (pet.activeExpBuff || 0) + effects.exp_bonus_pct;
    appliedEffects.exp_bonus_pct = effects.exp_bonus_pct;
  }
  if (effects.growth_points) {
    const gp = effects.growth_points * qty;
    pet.growthPoints += gp;
    appliedEffects.growth_points = gp;
    // Level up check
    const expNeeded = await getExpNeeded(pet);
    while (pet.growthPoints >= expNeeded) {
      pet.growthPoints -= expNeeded;
      pet.level += 1;
    }
  }
  if (effects.freeze_streak) {
    // Đóng băng streak 1 ngày — lưu flag
    pet.streakFrozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    appliedEffects.freeze_streak = true;
  }

  await pet.save();
  return { pet, appliedEffects };
}

// ─── GetExpNeeded (dùng milestones của species hoặc công thức mặc định) ──────
async function getExpNeeded(pet) {
  const base = await getNum('economy_pet_exp_per_level_base', 100);
  try {
    if (pet.speciesRef) {
      const species = await PetSpecies.findById(pet.speciesRef).lean();
      if (species) {
        const milestone = species.milestones.find(m => m.level === pet.level + 1);
        if (milestone) return milestone.required_exp;
      }
    }
  } catch { /* ignore */ }
  return base * pet.level;
}

// ─── Admin: cộng/trừ Coin thủ công ──────────────────────────────────────────
async function adminAdjustCoins(targetUserId, amount, reason, adminId) {
  const pet = await Pet.findOne({ user: targetUserId });
  if (!pet) throw new Error('User chưa có thú cưng');

  pet.coins = Math.max(0, pet.coins + amount);
  await pet.save();

  await CoinLog.create({
    user:          targetUserId,
    pet:           pet._id,
    type:          'admin',
    source:        amount >= 0 ? 'manual_grant' : 'manual_deduct',
    amount,
    balance_after: pet.coins,
    note:          reason || (amount >= 0 ? `Admin cộng ${amount} Coins` : `Admin trừ ${Math.abs(amount)} Coins`),
    admin_by:      adminId,
  });

  return pet;
}

// ─── Admin: reset pet về level 1 ─────────────────────────────────────────────
async function adminResetPet(petId, adminId) {
  const pet = await Pet.findById(petId);
  if (!pet) throw new Error('Không tìm thấy thú cưng');

  const reason = `Admin reset Pet về Level 1`;

  pet.level        = 1;
  pet.growthPoints = 0;
  pet.streakCount  = 0;
  pet.hunger       = 0;
  pet.happiness    = 80;
  pet.inventory    = [];
  pet.equippedSkin = null;
  pet.streakFrozenUntil = null;
  pet.activeExpBuff = 0;
  await pet.save();

  await CoinLog.create({
    user:     pet.user,
    pet:      pet._id,
    type:     'admin',
    source:   'manual_deduct',
    amount:   0,
    balance_after: pet.coins,
    note:     reason,
    admin_by: adminId,
  });

  return pet;
}

module.exports = {
  earnCoins,
  spendCoins,
  useItem,
  getPetState,
  getPetBuffMultiplier,
  resolvePetEvolution,
  adminAdjustCoins,
  adminResetPet,
  getExpNeeded,
  invalidateEconomyCache,
  loadEconomyCfg,
  getNum,
};
