'use strict';
/**
 * rewardHelper.js
 * Tiện ích để các controller bài tập gọi 1 dòng và tự cộng Coins + EXP cho user.
 *
 * Usage trong bất kỳ controller nào:
 *   const { rewardExercise } = require('../utils/rewardHelper');
 *   const coinResult = await rewardExercise(req.userId, 'vocab');
 *   // coinResult: { earned, totalToday, capReached }
 *
 * Supported sources: 'vocab' | 'speaking' | 'writing' | 'reading' | 'listening' | 'checkin'
 */
const { earnCoins, getNum, getPetState, getPetBuffMultiplier } = require('../services/economyService');
const Pet  = require('../models/Pet');
const User = require('../models/User');

const SOURCE_CONFIG_KEY = {
  vocab:     'economy_reward_vocab',
  speaking:  'economy_reward_speaking',
  writing:   'economy_reward_writing',
  reading:   'economy_reward_reading',
  listening: 'economy_reward_listening',
  checkin:   'economy_reward_checkin',
};

/**
 * Cộng Coins + EXP cho user sau khi hoàn thành bài tập.
 *
 * @param {string} userId   – req.userId
 * @param {string} source   – loại bài tập (vocab | speaking | writing | ...)
 * @param {object} options  – { customAmount?: number, expAmount?: number }
 * @returns {{ earned, totalToday, capReached, expLocked, expMultiplier }}
 */
async function rewardExercise(userId, source, options = {}) {
  if (!userId) return { earned: 0, totalToday: 0, capReached: false, expLocked: false, expMultiplier: 1 };

  const configKey   = SOURCE_CONFIG_KEY[source] || 'economy_reward_vocab';
  const rawReward   = options.customAmount ?? (await getNum(configKey, 10));

  // Coin reward
  const coinResult  = await earnCoins(userId, source, rawReward);

  // Pet state check cho EXP lock/buff
  const pet         = coinResult.pet || await Pet.findOne({ user: userId });
  let expLocked     = false;
  let expMultiplier = 1;

  if (pet) {
    const state      = await getPetState(pet);
    expLocked        = state.expLocked;
    expMultiplier    = state.expMultiplier;

    // Cộng thêm EXP species buff
    const speciesBuff = await getPetBuffMultiplier(pet, source);
    expMultiplier    *= speciesBuff;

    // Cộng activeExpBuff từ item
    if (pet.activeExpBuff && pet.activeExpBuff > 0) {
      expMultiplier *= (1 + pet.activeExpBuff / 100);
      // Reset sau khi đã áp dụng 1 lần
      pet.activeExpBuff = 0;
      await pet.save();
    }
  }

  return {
    earned:       coinResult.earned,
    totalToday:   coinResult.totalToday,
    capReached:   coinResult.capReached,
    expLocked,
    expMultiplier,
  };
}

module.exports = { rewardExercise };
