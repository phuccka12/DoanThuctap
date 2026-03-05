'use strict';
/**
 * AdminEconomy.js — Bảng điều khiển cân bằng game (Economy Settings)
 * Routes prefix: /api/admin/economy
 *
 * Các key được seed vào SystemConfig:
 *   economy_daily_coin_cap          – giới hạn Coins kiếm/ngày
 *   economy_reward_vocab            – Coins/câu vocab
 *   economy_reward_speaking         – Coins/bài speaking
 *   economy_reward_writing          – Coins/bài writing
 *   economy_reward_reading          – Coins/bài reading
 *   economy_reward_listening        – Coins/bài listening
 *   economy_reward_checkin          – Coins/checkin
 *   economy_hunger_decay_per_day    – HP đói trừ mỗi 24h
 *   economy_hunger_happy_threshold  – hunger < X → vui vẻ (buff EXP)
 *   economy_hunger_dying_threshold  – hunger >= X → hấp hối (khóa EXP)
 *   economy_exp_buff_happy_pct      – % EXP thêm khi pet vui
 *   economy_freeze_streak_cost      – Coins để mua Freeze Streak
 *   economy_pet_exp_per_level_base  – EXP base để lên cấp (nhân level)
 */
const SystemConfig = require('../models/SystemConfig');
const { invalidateEconomyCache } = require('../services/economyService');

const ECONOMY_KEYS = [
  { key: 'economy_daily_coin_cap',         label: 'Giới hạn Coins kiếm/ngày',           group: 'economy', field_type: 'number', sort_order: 1,  description: 'Tối đa bao nhiêu Coins user kiếm được mỗi ngày (chống cày cấp lạm phát)', value: '300' },
  { key: 'economy_reward_vocab',           label: 'Coins/câu Vocabulary',               group: 'economy', field_type: 'number', sort_order: 2,  description: 'Hoàn thành 1 câu vocab nhận mấy Coins', value: '10' },
  { key: 'economy_reward_speaking',        label: 'Coins/bài Speaking',                 group: 'economy', field_type: 'number', sort_order: 3,  description: 'Hoàn thành 1 bài Speaking nhận mấy Coins', value: '50' },
  { key: 'economy_reward_writing',         label: 'Coins/bài Writing',                  group: 'economy', field_type: 'number', sort_order: 4,  description: 'Hoàn thành 1 bài Writing nhận mấy Coins', value: '40' },
  { key: 'economy_reward_reading',         label: 'Coins/bài Reading',                  group: 'economy', field_type: 'number', sort_order: 5,  description: 'Hoàn thành 1 bài Reading nhận mấy Coins', value: '20' },
  { key: 'economy_reward_listening',       label: 'Coins/bài Listening',                group: 'economy', field_type: 'number', sort_order: 6,  description: 'Hoàn thành 1 bài Listening nhận mấy Coins', value: '20' },
  { key: 'economy_reward_checkin',         label: 'Coins/checkin hàng ngày',            group: 'economy', field_type: 'number', sort_order: 7,  description: 'Check-in mỗi ngày nhận mấy Coins', value: '5' },
  { key: 'economy_hunger_decay_per_day',      label: 'HP đói trừ mỗi 24h',                group: 'economy', field_type: 'number', sort_order: 10, description: 'Cronjob sẽ trừ mấy điểm Đói (hunger) mỗi ngày. Giảm số này nếu game quá khắc nghiệt', value: '30' },
  { key: 'economy_hunger_happy_threshold',    label: 'Ngưỡng Đói – Vui vẻ (< X)',          group: 'economy', field_type: 'number', sort_order: 11, description: 'Khi hunger < X → Pet vui vẻ → buff +EXP cho user', value: '50' },
  { key: 'economy_hunger_warning_threshold',  label: 'Ngưỡng Đói – Cảnh báo (>= X)',       group: 'economy', field_type: 'number', sort_order: 12, description: 'Khi hunger >= X → Widget chớp đỏ, Pet mếu (< 20% máu)', value: '80' },
  { key: 'economy_hunger_dying_threshold',    label: 'Ngưỡng Đói – Hấp hối (>= X)',        group: 'economy', field_type: 'number', sort_order: 13, description: 'Khi hunger >= X → Pet hấp hối → khóa EXP + vỡ Streak', value: '100' },
  { key: 'economy_exp_buff_happy_pct',        label: '% EXP buff khi Pet vui vẻ',          group: 'economy', field_type: 'number', sort_order: 14, description: 'User được cộng thêm X% EXP khi Pet đang vui vẻ (VD: 10 = +10%)', value: '10' },
  { key: 'economy_freeze_streak_cost',        label: 'Giá Bùa Đóng Băng Streak (Coins)',   group: 'economy', field_type: 'number', sort_order: 15, description: 'Bao nhiêu Coins để mua 1 Bùa Đóng Băng bảo vệ chuỗi streak', value: '500' },
  { key: 'economy_pet_exp_per_level_base',    label: 'EXP Base để Pet lên cấp',            group: 'economy', field_type: 'number', sort_order: 16, description: 'Công thức: cần (base × level) EXP để tăng 1 level (nếu không dùng Pokedex milestones)', value: '100' },
];

// GET /api/admin/economy  – lấy toàn bộ cấu hình economy, seed nếu thiếu
exports.getEconomySettings = async (req, res) => {
  try {
    const existingKeys = new Set(
      (await SystemConfig.find({ group: 'economy' }).lean()).map(c => c.key)
    );
    const toSeed = ECONOMY_KEYS.filter(k => !existingKeys.has(k.key));
    if (toSeed.length) await SystemConfig.insertMany(toSeed);

    const configs = await SystemConfig.find({ group: 'economy' }).sort({ sort_order: 1 }).lean();
    return res.json({ success: true, data: configs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/economy  – bulk update, body: { configs: [{ key, value }] }
exports.updateEconomySettings = async (req, res) => {
  try {
    const { configs } = req.body;
    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({ success: false, message: 'configs phải là mảng [{ key, value }]' });
    }

    const results = [];
    for (const { key, value } of configs) {
      if (!ECONOMY_KEYS.find(k => k.key === key)) continue; // chỉ cho phép economy keys
      const c = await SystemConfig.findOneAndUpdate(
        { key },
        { value: String(value), updated_by: req.userId },
        { new: true, upsert: true }
      );
      results.push({ key: c.key, value: c.value });
    }

    invalidateEconomyCache(); // flush cache để áp dụng ngay
    return res.json({ success: true, message: `Đã cập nhật ${results.length} cấu hình economy`, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
