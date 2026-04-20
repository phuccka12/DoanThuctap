'use strict';

const User = require('../models/User');
const Topic = require('../models/Topic');
const ReadingPassage = require('../models/ReadingPassage');

function normaliseLevelStr(raw) {
  if (!raw) return 'beginner';
  const r = String(raw).toLowerCase().trim();
  if (['beginner', 'a1', 'a2', 'learning', 'close_friend', 'basic', 'elementary'].includes(r)) return 'beginner';
  if (['intermediate', 'b1', 'b2'].includes(r)) return 'intermediate';
  if (['advanced', 'c1', 'c2'].includes(r)) return 'advanced';
  return 'beginner';
}

function getAllowedLevels(level) {
  if (level === 'beginner') return ['beginner'];
  if (level === 'intermediate') return ['beginner', 'intermediate'];
  return ['beginner', 'intermediate', 'advanced'];
}

exports.getBonusTasks = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('learning_preferences placement_test_result')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const prefs = user.learning_preferences || {};
    const interests = Array.isArray(prefs.interests) ? prefs.interests.filter(Boolean) : [];
    const major = prefs.major || '';

    const inferredLevel = user.placement_test_result?.cefr_level
      ? (['A1', 'A2'].includes(user.placement_test_result.cefr_level.toUpperCase())
        ? 'beginner'
        : (['B1', 'B2'].includes(user.placement_test_result.cefr_level.toUpperCase()) ? 'intermediate' : 'advanced'))
      : normaliseLevelStr(prefs.current_level);

    const levelFilter = getAllowedLevels(inferredLevel);

    const keywordRegex = interests
      .slice(0, 6)
      .map(i => new RegExp(String(i).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

    const topicQuery = {
      is_active: true,
      level: { $in: levelFilter },
    };

    if (keywordRegex.length > 0 || major) {
      topicQuery.$or = [];
      if (keywordRegex.length > 0) {
        topicQuery.$or.push({ name: { $in: keywordRegex } });
        topicQuery.$or.push({ description: { $in: keywordRegex } });
      }
      if (major) {
        topicQuery.$or.push({ description: new RegExp(String(major).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      }
    }

    let topics = await Topic.find(topicQuery)
      .select('name level')
      .limit(4)
      .lean();

    if (topics.length === 0) {
      topics = await Topic.find({ is_active: true, level: { $in: levelFilter } })
        .select('name level')
        .limit(3)
        .lean();
    }

    // Relax level filter if still empty
    if (topics.length === 0) {
      topics = await Topic.find({ is_active: true })
        .select('name level')
        .sort({ created_at: -1 })
        .limit(4)
        .lean();
    }

    let readings = await ReadingPassage.find({
      is_active: true,
      level: { $in: levelFilter },
    })
      .sort({ usage_count: -1, created_at: -1 })
      .limit(3)
      .select('title level')
      .lean();

    // Relax level filter if none
    if (readings.length === 0) {
      readings = await ReadingPassage.find({ is_active: true })
        .sort({ usage_count: -1, created_at: -1 })
        .limit(3)
        .select('title level')
        .lean();
    }

    // Last fallback: allow any status (for fresh DBs where is_active may be missing/false)
    if (readings.length === 0) {
      readings = await ReadingPassage.find({})
        .sort({ usage_count: -1, created_at: -1 })
        .limit(3)
        .select('title level')
        .lean();
    }

    let bonus = [
      ...topics.map(t => ({
        id: t._id,
        type: 'topic',
        name: t.name,
        icon: '🔥',
        reason: 'Dựa trên mục tiêu và sở thích của bạn',
      })),
      ...readings.map(r => ({
        id: r._id,
        type: 'reading',
        name: r.title,
        icon: '📖',
        reason: 'Bài đọc phù hợp để tăng tốc hôm nay',
      })),
    ]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    // Absolute fallback: return some topics so UI never looks broken when DB has content
    if (bonus.length === 0) {
      const emergencyTopics = await Topic.find({})
        .select('name level')
        .sort({ created_at: -1 })
        .limit(4)
        .lean();

      bonus = emergencyTopics.map(t => ({
        id: t._id,
        type: 'topic',
        name: t.name,
        icon: '📚',
        reason: 'Gợi ý nhanh để bắt đầu học ngay',
      }));
    }

    return res.json({ success: true, data: bonus });
  } catch (err) {
    console.error('[BonusTasksController] getBonusTasks error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
