const express = require('express');
const router = express.Router();
const GrammarLesson = require('../../models/GrammarLesson');
const LessonProgress = require('../../models/LessonProgress');
const { protect } = require('../../middlewares/authMiddleware');

// GET /api/grammar — danh sách bài published
router.get('/', protect, async (req, res) => {
  try {
    const { level = '', search = '', page = 1, limit = 20 } = req.query;
    const q = { is_active: true, is_published: true };
    if (level) q.level = level;
    if (search) q.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [lessons, total] = await Promise.all([
      GrammarLesson.find(q)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('title description level is_published created_at hook.questions minigames')
        .lean(),
      GrammarLesson.countDocuments(q),
    ]);

    const rows = lessons.map(l => ({
      _id: l._id,
      title: l.title,
      description: l.description,
      level: l.level,
      hookCount: l.hook?.questions?.length ?? 0,
      minigameCount: l.minigames?.length ?? 0,
      created_at: l.created_at,
    }));

    // If authenticated, attach per-lesson progress (simple: completed boolean)
    if (req.userId) {
      try {
        const ids = rows.map(r => r._id);
        const progs = await LessonProgress.find({ userId: req.userId, lessonId: { $in: ids } })
          .select('lessonId completedAt score')
          .lean();
        const progMap = {};
        progs.forEach(p => { progMap[p.lessonId?.toString()] = p; });
        rows.forEach(r => {
          const p = progMap[r._id.toString()];
          r.isCompleted = !!(p && p.completedAt);
          r.progressScore = p?.score ?? 0;
        });
      } catch (e) {
        // ignore progress enrichment errors — don't block listing
        console.warn('[GrammarRoutes] failed to attach progress:', e.message);
      }
    }

    res.json({ data: rows, total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/grammar/:id — full bài học để play
router.get('/:id', protect, async (req, res) => {
  try {
    const lesson = await GrammarLesson.findOne({
      _id: req.params.id,
      is_active: true,
      is_published: true,
    }).lean();
    if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại' });
    res.json({ data: lesson });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/grammar/:id/complete — mark grammar lesson completed for user
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const gid = req.params.id;
    const lesson = await GrammarLesson.findOne({ _id: gid, is_active: true, is_published: true }).lean();
    if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại' });

    const { score = 100, completedNodes = [] } = req.body || {};

    let progress = await LessonProgress.findOne({ userId: req.userId, lessonId: gid });
    if (!progress) {
      progress = new LessonProgress({
        userId: req.userId,
        lessonId: gid,
        topicId: null,
      });
    } else {
      progress.attemptCount = (progress.attemptCount || 0) + 1;
    }

    progress.completedNodes = Array.isArray(completedNodes) ? completedNodes : [];
    progress.score = Math.min(100, Math.max(0, Number(score) || 0));
    progress.completedAt = new Date();

    await progress.save();

    // ── AWARD COINS ──────────────────
    let reward = null;
    if (req.userId) {
      try {
        const { rewardExercise } = require('../../utils/rewardHelper');
        reward = await rewardExercise(req.userId, 'grammar');
      } catch (e) {
        console.error('Reward grammar error:', e.message);
      }
    }

    res.json({ data: progress, reward });
  } catch (e) {
    console.error('[GrammarRoutes] complete:', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
