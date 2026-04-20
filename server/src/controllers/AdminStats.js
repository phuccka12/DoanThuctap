const Topic = require('../models/Topic');
const SpeakingQuestion = require('../models/SpeakingQuestion');
const WritingPrompt = require('../models/WritingPrompt');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const LessonProgress = require('../models/LessonProgress');
const AIUsage = require('../models/AIUsage');
const mongoose = require('mongoose');

// Helper to build month map 1..12
const emptyMonthMap = () => {
  const map = {};
  for (let m = 1; m <= 12; m++) map[m] = 0;
  return map;
};

// GET /api/admin/stats?year=2025
exports.getStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);
    const yearPrefix = `${year}-`;

    // Totals
    const [topicsTotal, speakingTotal, writingTotal, usersTotal] = await Promise.all([
      Topic.countDocuments({}),
      SpeakingQuestion.countDocuments({}),
      WritingPrompt.countDocuments({}),
      User.countDocuments({})
    ]);

    // Aggregate by month for each collection
    const topicsAgg = await Topic.aggregate([
      { $match: { created_at: { $gte: start, $lt: end } } },
      { $group: { _id: { $month: '$created_at' }, count: { $sum: 1 } } }
    ]);

    const speakingAgg = await SpeakingQuestion.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
    ]);

    const writingAgg = await WritingPrompt.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
    ]);

    const topicsByMonth = emptyMonthMap();
    const speakingByMonth = emptyMonthMap();
    const writingByMonth = emptyMonthMap();

    topicsAgg.forEach((r) => { topicsByMonth[r._id] = r.count; });
    speakingAgg.forEach((r) => { speakingByMonth[r._id] = r.count; });
    writingAgg.forEach((r) => { writingByMonth[r._id] = r.count; });

    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      monthly.push({
        month: m,
        topics: topicsByMonth[m] || 0,
        speaking: speakingByMonth[m] || 0,
        writing: writingByMonth[m] || 0,
        total: (topicsByMonth[m] || 0) + (speakingByMonth[m] || 0) + (writingByMonth[m] || 0)
      });
    }

    // ── User growth by month (new/verified/onboarded) ──────────────────────
    const userMonthlyAgg = await User.aggregate([
      { $match: { created_at: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $month: '$created_at' },
          newUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: {
              $cond: [{ $eq: ['$email_verified', true] }, 1, 0]
            }
          },
          onboardedUsers: {
            $sum: {
              $cond: [{ $eq: ['$onboarding_completed', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const userNewByMonth = emptyMonthMap();
    const userVerifiedByMonth = emptyMonthMap();
    const userOnboardedByMonth = emptyMonthMap();

    userMonthlyAgg.forEach((r) => {
      userNewByMonth[r._id] = r.newUsers || 0;
      userVerifiedByMonth[r._id] = r.verifiedUsers || 0;
      userOnboardedByMonth[r._id] = r.onboardedUsers || 0;
    });

    const userMonthly = [];
    for (let m = 1; m <= 12; m++) {
      userMonthly.push({
        month: m,
        newUsers: userNewByMonth[m] || 0,
        verifiedUsers: userVerifiedByMonth[m] || 0,
        onboardedUsers: userOnboardedByMonth[m] || 0
      });
    }

    // ── Revenue (real transaction data) ─────────────────────────────────────
    const [yearRevenueAgg, monthRevenueAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'success', is_hidden: { $ne: true }, created_at: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { status: 'success', is_hidden: { $ne: true }, created_at: { $gte: start, $lt: end } } },
        { $group: { _id: { $month: '$created_at' }, revenue: { $sum: '$amount' } } }
      ])
    ]);

    const revenueByMonth = emptyMonthMap();
    monthRevenueAgg.forEach((r) => { revenueByMonth[r._id] = r.revenue || 0; });

    // ── AI Usage (real counters from AIUsage) ───────────────────────────────
    const aiUsageAgg = await AIUsage.aggregate([
      { $match: { date: { $regex: `^${yearPrefix}` } } },
      {
        $group: {
          _id: null,
          speaking_checks: { $sum: '$speaking_checks' },
          writing_checks: { $sum: '$writing_checks' },
          ai_chat_messages: { $sum: '$ai_chat_messages' },
          ai_roleplay_sessions: { $sum: '$ai_roleplay_sessions' },
          blocked_users: {
            $addToSet: {
              $cond: [{ $eq: ['$ai_blocked', true] }, '$user_id', '$$REMOVE']
            }
          }
        }
      }
    ]);

    const aiUsage = aiUsageAgg[0] || {
      speaking_checks: 0,
      writing_checks: 0,
      ai_chat_messages: 0,
      ai_roleplay_sessions: 0,
      blocked_users: []
    };

    // ── Top Topics (prefer recent 30d, fallback all-time) ───────────────────
    const topicPipeline = (matchStage) => ([
      { $match: matchStage },
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: '_id',
          as: 'topic'
        }
      },
      { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          topicId: '$_id',
          name: { $ifNull: ['$topic.name', 'Chủ đề không xác định'] },
          count: 1
        }
      }
    ]);

    const topTopicsRecent = await LessonProgress.aggregate(topicPipeline({
      topicId: { $type: 'objectId' },
      completedAt: { $gte: last30Days, $lte: now }
    }));

    const topTopicsAllTime = topTopicsRecent.length === 0
      ? await LessonProgress.aggregate(topicPipeline({ topicId: { $type: 'objectId' } }))
      : [];

    const topTopics = topTopicsRecent.length > 0 ? topTopicsRecent : topTopicsAllTime;
    const topTopicsWindow = topTopicsRecent.length > 0 ? '30d' : 'all';

    // ── Top Users (XP leaderboard; fallback recent login if no users) ───────
    const topUsers = await User.aggregate([
      {
        $project: {
          user_name: 1,
          xp: { $ifNull: ['$gamification_data.exp', 0] },
          last_login_at: 1,
          created_at: 1
        }
      },
      { $sort: { xp: -1, created_at: 1 } },
      { $limit: 5 }
    ]);

    const normalizedTopUsers = topUsers.map((u) => ({
      userId: u._id,
      name: u.user_name || 'Người dùng',
      xp: Number(u?.xp || 0)
    }));

    // ── Operational alerts (real counts) ────────────────────────────────────
    const [verifiedUsers, onboardedUsers, bannedUsers, activeRecentUsers] = await Promise.all([
      User.countDocuments({ email_verified: true }),
      User.countDocuments({ onboarding_completed: true }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ last_login_at: { $gte: last30Days } })
    ]);

    const unverifiedUsers = Math.max(0, usersTotal - verifiedUsers);
    const notOnboardedUsers = Math.max(0, usersTotal - onboardedUsers);

    const opsAlerts = [
      {
        key: 'active_recent',
        label: 'Hoạt động 30 ngày',
        value: activeRecentUsers,
        severity: 'ok',
        desc: 'Người dùng có đăng nhập trong 30 ngày gần nhất'
      },
      {
        key: 'banned_users',
        label: 'Tài khoản bị khoá',
        value: bannedUsers,
        severity: bannedUsers > 0 ? 'high' : 'low',
        desc: 'Cần theo dõi và xử lý nếu phát sinh bất thường'
      },
      {
        key: 'unverified_users',
        label: 'Chưa xác thực email',
        value: unverifiedUsers,
        severity: unverifiedUsers > Math.max(10, usersTotal * 0.1) ? 'medium' : 'low',
        desc: 'Nên gửi nhắc xác thực để giảm rơi funnel'
      },
      {
        key: 'not_onboarded_users',
        label: 'Chưa hoàn thành onboarding',
        value: notOnboardedUsers,
        severity: notOnboardedUsers > Math.max(10, usersTotal * 0.1) ? 'medium' : 'low',
        desc: 'Có thể cải thiện bằng flow onboarding ngắn gọn hơn'
      },
      {
        key: 'ai_blocked_users',
        label: 'User bị chặn AI',
        value: Array.isArray(aiUsage.blocked_users) ? aiUsage.blocked_users.length : 0,
        severity: (Array.isArray(aiUsage.blocked_users) ? aiUsage.blocked_users.length : 0) > 0 ? 'medium' : 'low',
        desc: 'Được tổng hợp từ cờ ai_blocked trong AIUsage'
      }
    ];

    res.json({
      message: 'Admin stats fetched',
      data: {
        totals: { topics: topicsTotal, speaking: speakingTotal, writing: writingTotal, users: usersTotal },
        monthly,
        userMonthly,
        finance: {
          totalRevenue: yearRevenueAgg[0]?.total || 0,
          successTransactions: yearRevenueAgg[0]?.count || 0,
          revenueByMonth
        },
        aiUsage: {
          speakingChecks: aiUsage.speaking_checks || 0,
          writingChecks: aiUsage.writing_checks || 0,
          chatMessages: aiUsage.ai_chat_messages || 0,
          roleplaySessions: aiUsage.ai_roleplay_sessions || 0,
          blockedUsers: Array.isArray(aiUsage.blocked_users) ? aiUsage.blocked_users.length : 0
        },
        topTopics,
        topTopicsWindow,
        topUsers: normalizedTopUsers,
        opsAlerts
      }
    });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê', error: err.message });
  }
};
