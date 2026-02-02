const Topic = require('../models/Topic');
const SpeakingQuestion = require('../models/SpeakingQuestion');
const WritingPrompt = require('../models/WritingPrompt');
const User = require('../models/User');

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

    res.json({
      message: 'Admin stats fetched',
      data: {
        totals: { topics: topicsTotal, speaking: speakingTotal, writing: writingTotal, users: usersTotal },
        monthly
      }
    });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê', error: err.message });
  }
};
