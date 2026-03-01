'use strict';
/**
 * AdminAntiCheat.js — Giám sát gian lận, coin logs, điều chỉnh thủ công, reset pet
 * Routes prefix: /api/admin/anti-cheat
 */
const CoinLog  = require('../models/CoinLog');
const Pet      = require('../models/Pet');
const User     = require('../models/User');
const { adminAdjustCoins, adminResetPet } = require('../services/economyService');

// GET /api/admin/anti-cheat/logs  — lịch sử coin toàn server (có filter)
// query: userId, type (earn|spend|admin), source, startDate, endDate, page, limit
exports.getLogs = async (req, res) => {
  try {
    const { userId, type, source, startDate, endDate, page = 1, limit = 50 } = req.query;
    const q = {};
    if (userId)    q.user   = userId;
    if (type)      q.type   = type;
    if (source)    q.source = source;
    if (startDate || endDate) {
      q.created_at = {};
      if (startDate) q.created_at.$gte = new Date(startDate);
      if (endDate)   q.created_at.$lte = new Date(endDate);
    }

    const total = await CoinLog.countDocuments(q);
    const logs  = await CoinLog.find(q)
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user',     'user_name email')
      .populate('item_id',  'name category')
      .populate('admin_by', 'user_name email')
      .lean();

    return res.json({ success: true, data: logs, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/anti-cheat/user/:userId  — tổng quan + logs của 1 user
exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('user_name email role gamification_data');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    const pet = await Pet.findOne({ user: userId })
      .populate('speciesRef', 'name species_key base_image_url evolutions');

    const logs = await CoinLog.find({ user: userId })
      .sort({ created_at: -1 })
      .limit(100)
      .populate('item_id',  'name category')
      .populate('admin_by', 'user_name email')
      .lean();

    // Tổng kiếm/tiêu hôm nay
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => new Date(l.created_at) >= start);
    const earnedToday  = todayLogs.filter(l => l.type === 'earn').reduce((s, l) => s + l.amount, 0);
    const spentToday   = todayLogs.filter(l => l.type === 'spend').reduce((s, l) => s + Math.abs(l.amount), 0);

    return res.json({
      success: true,
      data: {
        user,
        pet,
        stats: { earnedToday, spentToday },
        logs,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/anti-cheat/user/:userId/coins
// body: { amount: Number (dương = cộng, âm = trừ), reason: String }
exports.adjustCoins = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    if (amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, message: 'amount phải là số' });
    }
    const pet = await adminAdjustCoins(userId, Number(amount), reason, req.userId);
    return res.json({ success: true, message: `Đã ${Number(amount) >= 0 ? 'cộng' : 'trừ'} ${Math.abs(Number(amount))} Coins`, data: pet });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/anti-cheat/pet/:petId/reset  — reset Pet về Level 1
exports.resetPet = async (req, res) => {
  try {
    const { petId } = req.params;
    const pet = await adminResetPet(petId, req.userId);
    return res.json({ success: true, message: 'Pet đã được reset về Level 1', data: pet });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/admin/anti-cheat/suspicious  — phát hiện bất thường
// Điều kiện: earn trong 1 ngày > daily_cap (user gian lận hoặc bug)
exports.getSuspiciousActivity = async (req, res) => {
  try {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const suspicious = await CoinLog.aggregate([
      { $match: { type: 'earn', created_at: { $gte: start } } },
      { $group: { _id: '$user', totalEarned: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $match: { totalEarned: { $gt: 300 } } },   // lấy hardcode 300 làm ngưỡng alert tạm, real config check ở service
      { $sort: { totalEarned: -1 } },
      {
        $lookup: {
          from: 'users', localField: '_id', foreignField: '_id',
          as: 'userInfo',
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          totalEarned: 1,
          count: 1,
          user_name: '$userInfo.user_name',
          email: '$userInfo.email',
        }
      },
    ]);

    return res.json({ success: true, data: suspicious });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
