'use strict';
/**
 * LearningController.js
 * User-facing endpoints for the Learn / Practice module.
 *
 * Routes (all mounted under /api/learn):
 *   GET  /topics                   — public topic list with user progress
 *   GET  /topics/:topicId/lessons  — lessons for a topic (published only)
 *   GET  /lessons/:lessonId        — single lesson with full nodes (auth optional)
 *   POST /lessons/:lessonId/complete — mark lesson complete + award coins (auth required)
 *   POST /generate-plan            — generate 7-day personalised plan (auth required)
 *   GET  /plan/current             — get active plan for this user (auth required)
 *   GET  /progress                 — summary of user's completed lessons & topics
 */

const mongoose       = require('mongoose');
const Lesson         = require('../models/Lesson');
const Topic          = require('../models/Topic');
const LessonProgress = require('../models/LessonProgress');
const UserPlan       = require('../models/UserPlan');
const User           = require('../models/User');
const Pet            = require('../models/Pet');

const economyService   = require('../services/economyService');
const embeddingService = require('../services/embeddingService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map lesson.level string → numeric rank for filtering */
const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3 };

/** Determine the skill icons an array of nodes represents */
function nodeSkillIcons(nodes = []) {
  const icons = new Set();
  nodes.forEach(n => {
    const t = (n.type || n.node_type || '').toLowerCase();
    if (t.includes('reading')  || t.includes('read'))       icons.add('reading');
    if (t.includes('listen')   || t.includes('audio'))      icons.add('listening');
    if (t.includes('vocab')    || t.includes('vocabulary')) icons.add('vocabulary');
    if (t.includes('quiz')     || t.includes('grammar'))    icons.add('quiz');
    if (t.includes('writ')     || t.includes('essay'))      icons.add('writing');
    if (t.includes('speak')    || t.includes('roleplay'))   icons.add('speaking');
    if (t.includes('video'))                                 icons.add('video');
  });
  return [...icons];
}

/** Monday of the week containing `date` (00:00 UTC) */
function weekMonday(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 = Sun
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d;
}

// ─── 1. Public topic list with user progress ─────────────────────────────────
exports.getTopicsWithProgress = async (req, res) => {
  try {
    const topics = await Topic.find({ is_active: true })
      .select('name description cover_image icon_name level keywords')
      .sort({ level: 1 })
      .lean();

    // If authenticated, attach progress percentage
    let progressMap = {};
    if (req.userId) {
      const userObjId = new mongoose.Types.ObjectId(req.userId);

      // Count total published lessons per topic
      const lessonCounts = await Lesson.aggregate([
        { $match: { is_published: true, is_active: true } },
        { $group: { _id: '$topic_id', total: { $sum: 1 } } },
      ]);
      const totalMap = {};
      lessonCounts.forEach(r => { totalMap[r._id.toString()] = r.total; });

      // Count completed lessons per topic for this user
      const completedAgg = await LessonProgress.aggregate([
        { $match: { userId: userObjId, lessonId: { $ne: null }, completedAt: { $ne: null } } },
        { $group: { _id: '$topicId', done: { $sum: 1 } } },
      ]);
      completedAgg.forEach(r => {
        if (!r._id) return; // skip null topicId (story records)
        const tid = r._id.toString();
        const total = totalMap[tid] || 1;
        progressMap[tid] = Math.round((r.done / total) * 100);
      });
    }

    // Determine unlock status based on user's CEFR level
    let userLevelRank = 0;
    if (req.userId) {
      const user = await User.findById(req.userId).select('placement_test_result learning_preferences').lean();
      const cefrToRank = { A1: 1, A2: 1, B1: 2, B2: 2, C1: 3, C2: 3 };
      const cefr = user?.placement_test_result?.cefr_level || user?.learning_preferences?.current_level || '';
      userLevelRank = cefrToRank[cefr?.toUpperCase?.()] || 0;
    }

    const result = topics.map(t => ({
      ...t,
      progress: progressMap[t._id.toString()] ?? 0,
      isLocked: userLevelRank > 0 && (LEVEL_RANK[t.level] || 1) > userLevelRank + 1,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[LearningController] getTopicsWithProgress:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── 2. Lessons for a topic (roadmap) ────────────────────────────────────────
exports.getLessonsForTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await Topic.findById(topicId).lean();
    if (!topic) return res.status(404).json({ success: false, message: 'Không tìm thấy chủ đề' });

    const lessons = await Lesson.find({ topic_id: topicId, is_published: true, is_active: true })
      .sort({ order: 1 })
      .lean();

    // Get completed lessons for user (if authenticated)
    let completedSet = new Set();
    if (req.userId) {
      const progresses = await LessonProgress.find({
        userId: req.userId,
        topicId,
        completedAt: { $ne: null },
      }).select('lessonId').lean();
      progresses.forEach(p => completedSet.add(p.lessonId.toString()));
    }

    const enriched = lessons.map((lesson, idx) => {
      const isCompleted = completedSet.has(lesson._id.toString());
      // First lesson is always unlocked; subsequent require previous completed
      const prevDone    = idx === 0 || completedSet.has(lessons[idx - 1]._id.toString());
      return {
        _id:         lesson._id,
        title:       lesson.title,
        description: lesson.description,
        order:       lesson.order,
        level:       lesson.level,
        duration:    lesson.duration,
        cover_image: lesson.cover_image,
        skillIcons:  nodeSkillIcons(lesson.nodes || []),
        nodeCount:   (lesson.nodes || []).length,
        isCompleted,
        isUnlocked: prevDone,
        isLocked:   !prevDone,
      };
    });

    res.json({ success: true, data: { topic, lessons: enriched } });
  } catch (err) {
    console.error('[LearningController] getLessonsForTopic:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── 3. Single lesson with full nodes ────────────────────────────────────────
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      is_published: true,
      is_active: true,
    })
      .populate('topic_id', 'name cover_image level')
      .lean();

    if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });

    // Increment view count (fire and forget)
    Lesson.findByIdAndUpdate(lesson._id, { $inc: { 'stats.views': 1 } }).exec();

    // Get user's progress on this lesson
    let progress = null;
    if (req.userId) {
      progress = await LessonProgress.findOne({ userId: req.userId, lessonId: lesson._id }).lean();
    }

    res.json({ success: true, data: { lesson, progress } });
  } catch (err) {
    console.error('[LearningController] getLessonById:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── 4. Complete lesson + award coins ────────────────────────────────────────
exports.completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { score = 0, completedNodes = [], timeSpentSec = 0 } = req.body;

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });

    const scoreNum = Math.min(100, Math.max(0, Number(score) || 0));

    // Upsert progress record
    let progress = await LessonProgress.findOne({ userId: req.userId, lessonId });

    if (!progress) {
      progress = new LessonProgress({
        userId: req.userId,
        lessonId,
        topicId: lesson.topic_id,
      });
    } else {
      progress.attemptCount += 1;
    }

    progress.completedNodes = completedNodes;
    progress.score          = scoreNum;
    progress.timeSpentSec   = timeSpentSec;
    progress.completedAt    = new Date();

    // ── Award coins & EXP once per lesson (idempotency) ──────────────────
    let rewardResult = { earned: 0, pet: null, expMultiplier: 1 };

    if (!progress.rewarded) {
      // Determine reward amount from economy config
      const baseCoins = await economyService.getNum('economy_reward_reading', 20);
      // Scale by score: 100% → full reward, 50% → half
      const earnAmount = Math.round(baseCoins * (scoreNum / 100));

      if (earnAmount > 0) {
        rewardResult = await economyService.earnCoins(req.userId, 'lesson_complete', earnAmount);
      }

      // Award pet EXP
      const pet = rewardResult.pet || await Pet.findOne({ user: req.userId });
      if (pet) {
        const petState    = await economyService.getPetState(pet);
        const buffMult    = await economyService.getPetBuffMultiplier(pet, 'all');
        const baseExp     = 20;
        const expGain     = petState.expLocked
          ? 0
          : Math.round(baseExp * petState.expMultiplier * buffMult);

        if (expGain > 0) {
          pet.growthPoints += expGain;
          // Simple level-up loop
          const expNeeded = await economyService.getExpNeeded(pet);
          while (pet.growthPoints >= expNeeded) {
            pet.growthPoints -= expNeeded;
            pet.level        += 1;
          }
          await pet.save();
          rewardResult.expGain = expGain;
          rewardResult.pet     = pet;
        }
      }

      progress.rewarded    = true;
      progress.coinsEarned = rewardResult.earned || 0;
      progress.expEarned   = rewardResult.expGain || 0;
    }

    await progress.save();

    // Update lesson stats
    Lesson.findByIdAndUpdate(lessonId, { $inc: { 'stats.completions': 1 } }).exec();

    // Get pet state for frontend animation
    const petDoc    = rewardResult.pet || await Pet.findOne({ user: req.userId }).lean();
    const petState  = petDoc ? await economyService.getPetState(petDoc) : null;

    res.json({
      success: true,
      data: {
        progress,
        reward: {
          coins:  progress.coinsEarned,
          exp:    progress.expEarned,
          petState,
          pet:    petDoc ? { coins: petDoc.coins, level: petDoc.level, petType: petDoc.petType, egg_type: petDoc.egg_type } : null,
        },
      },
    });
  } catch (err) {
    console.error('[LearningController] completeLesson:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── 5. Generate 7-day personalised plan ─────────────────────────────────────
exports.generatePlan = async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    const prefs     = user.learning_preferences || {};
    const placement = user.placement_test_result || {};

    // ── 1. Determine user level ───────────────────────────────────────────────
    const userLevelStr = placement.cefr_level
      ? cefrToLessonLevel(placement.cefr_level)
      : normaliseLevelStr(prefs.current_level);
    const allowedLevels = getAllowedLevels(userLevelStr);

    // ── 2. Fetch eligible topics + lesson counts ──────────────────────────────
    // If level resolves to beginner but DB has no beginner topics, expand to all levels
    let levelFilter = allowedLevels;
    const topicCountAtLevel = await Topic.countDocuments({ is_active: true, level: { $in: allowedLevels } });
    if (topicCountAtLevel === 0) {
      levelFilter = ['beginner', 'intermediate', 'advanced']; // fallback: show all
    }

    const allTopics = await Topic.find({
      is_active: true,
      level: { $in: levelFilter },
    }).lean();

    if (!allTopics.length) {
      return res.status(200).json({ success: true, data: null, message: 'Chưa có chủ đề phù hợp trong hệ thống' });
    }

    const lessonCounts = await Lesson.aggregate([
      { $match: { is_published: true, is_active: true } },
      { $group: { _id: '$topic_id', count: { $sum: 1 } } },
    ]);
    const lessonCountMap = {};
    lessonCounts.forEach(r => { lessonCountMap[r._id.toString()] = r.count; });

    const topicsWithLessons = allTopics.filter(tp => (lessonCountMap[tp._id.toString()] || 0) > 0);
    if (!topicsWithLessons.length) {
      return res.status(200).json({ success: true, data: null, message: 'Chưa có chủ đề nào có bài học' });
    }

    // ── 3. Get user's progress per topic ─────────────────────────────────────
    const completedTopicAgg = await LessonProgress.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId), lessonId: { $ne: null }, completedAt: { $ne: null } } },
      { $group: { _id: '$topicId', done: { $sum: 1 } } },
    ]);
    const completedTopicMap = {};
    completedTopicAgg.forEach(r => { if (r._id) completedTopicMap[r._id.toString()] = r.done; });

    // ── 4. Build topic profile texts (for semantic matching) ──────────────────
    function buildTopicText(tp) {
      const nodeTypeLabels = [...new Set((tp.nodes || []).map(n => n.type))].join(', ');
      const parts = [
        tp.name        ? `Topic: ${tp.name}`             : '',
        tp.description ? tp.description                  : '',
        tp.level       ? `Level: ${tp.level}`            : '',
        tp.frequency   ? `Importance: ${tp.frequency}`   : '',
        tp.keywords?.length ? `Keywords: ${tp.keywords.join(', ')}` : '',
        nodeTypeLabels ? `Skills covered: ${nodeTypeLabels}` : '',
      ];
      return parts.filter(Boolean).join('. ').slice(0, 1000);
    }

    // ── 5. Rank topics by semantic similarity (AI) with rule-based fallback ───
    const NODE_TYPE_TO_SKILL = {
      vocabulary: 'vocabulary',
      video:      'listening',
      listening:  'listening',
      ai_roleplay: 'speaking',
      grammar:    'writing',
      quiz:       'reading',
    };

    // Map ALL possible goal values → node types to prioritise
    const GOAL_NODE_MAP = {
      speaking:     ['ai_roleplay', 'video'],
      listening:    ['video', 'listening'],
      writing:      ['grammar', 'vocabulary'],
      grammar:      ['grammar', 'vocabulary'],
      band:         ['vocabulary', 'quiz', 'grammar'],
      graduation:   ['vocabulary', 'quiz', 'grammar', 'listening'],   // exam-style
      study_abroad: ['ai_roleplay', 'vocabulary', 'listening'],        // communicative
      other:        [],  // no specific priority → let AI/progress decide
    };

    // Resolve focus_skills: "all" means all skills, normalise to known skill names
    const ALL_SKILLS = ['vocabulary', 'listening', 'reading', 'writing', 'speaking'];
    const rawFocusSkills = Array.isArray(prefs.focus_skills) ? prefs.focus_skills : [];
    const focusSkills = rawFocusSkills.includes('all') ? ALL_SKILLS
      : rawFocusSkills.filter(s => ALL_SKILLS.includes(s));

    const userGoal          = prefs.goal || null;
    const priorityNodeTypes = GOAL_NODE_MAP[userGoal] || [];

    let scored; // [{ topic, totalScore, pct, lessonCount }]

    try {
      // ── 5a. Build user profile text & embed ──────────────────────────────
      const userProfileText = embeddingService.buildUserProfileText(user);
      const userVector      = await embeddingService.embedText(userProfileText);

      // Check if we got a real (non-zero) vector — zero vector means API failed silently
      const isZeroVector = userVector.every(v => v === 0);
      if (isZeroVector) throw new Error('Embedding API returned zero vector — API key missing or quota exceeded');

      // ── 5b. Embed each topic and compute cosine similarity in parallel ────
      const topicTexts   = topicsWithLessons.map(buildTopicText);
      const topicVectors = await Promise.all(topicTexts.map(t => embeddingService.embedText(t)));

      // ── 5c. Score = cosine similarity (0–1) + progress bonus ─────────────
      scored = topicsWithLessons.map((tp, i) => {
        const tid          = tp._id.toString();
        const total        = lessonCountMap[tid] || 1;
        const done         = completedTopicMap[tid] || 0;
        const pct          = (done / total) * 100;

        const similarity   = embeddingService.cosineSimilarity(userVector, topicVectors[i]);

        // Blend: 70% AI similarity + 30% progress bonus
        // Progress bonus: in-progress=1.0, not-started=0.67, completed=0.17
        const progressBonus = pct > 0 && pct < 100 ? 1.0 : pct === 0 ? 0.67 : 0.17;
        const totalScore    = similarity * 0.7 + progressBonus * 0.3;

        return { topic: tp, totalScore, similarity, pct, lessonCount: total };
      });

      console.log('[generatePlan] AI vector ranking succeeded — top topic:', scored.sort((a, b) => b.totalScore - a.totalScore)[0]?.topic?.name);

    } catch (aiErr) {
      // ── 5d. Fallback: rule-based scoring (no API needed) ─────────────────
      console.warn('[generatePlan] AI ranking failed, falling back to rule-based:', aiErr.message);

      const rawScores = {
        vocabulary: placement.vocab_score    != null ? placement.vocab_score / 40  : null,
        reading:    placement.reading_score  != null ? placement.reading_score / 35 : null,
        speaking:   placement.speaking_score != null ? placement.speaking_score / 25: null,
      };
      const weakestSkill = Object.entries(rawScores)
        .filter(([, v]) => v !== null)
        .sort(([, a], [, b]) => a - b)[0]?.[0] || null;

      scored = topicsWithLessons.map(tp => {
        const tid   = tp._id.toString();
        const total = lessonCountMap[tid] || 1;
        const done  = completedTopicMap[tid] || 0;
        const pct   = (done / total) * 100;

        const topicNodeTypes = (tp.nodes || []).map(n => n.type);
        const scoreProgress  = pct > 0 && pct < 100 ? 30 : pct === 0 ? 20 : 5;
        const goalMatchCount = priorityNodeTypes.filter(nt => topicNodeTypes.includes(nt)).length;
        const scoreGoal      = Math.min(30, goalMatchCount * 10);
        let   scoreWeak      = 0;
        if (weakestSkill) {
          const topicSkills = topicNodeTypes.map(nt => NODE_TYPE_TO_SKILL[nt]).filter(Boolean);
          if (topicSkills.includes(weakestSkill)) scoreWeak = 20;
        }
        const topicSkills2 = topicNodeTypes.map(nt => NODE_TYPE_TO_SKILL[nt]).filter(Boolean);
        const scoreFocus   = focusSkills.length > 0
          ? Math.min(20, focusSkills.filter(s => topicSkills2.includes(s)).length * 7) : 0;
        const scoreFreq    = tp.frequency === 'high' ? 15 : tp.frequency === 'medium' ? 8 : 0;
        const kwMatch      = (tp.keywords || []).filter(k => focusSkills.includes(k.toLowerCase())).length;
        const scoreKw      = Math.min(5, kwMatch * 3);

        // Normalize to 0–1 range (max possible = 100)
        const totalScore = (scoreProgress + scoreGoal + scoreWeak + scoreFocus + scoreFreq + scoreKw) / 100;
        return { topic: tp, totalScore, similarity: 0, pct, lessonCount: total };
      });
    }

    // Sort descending by blended score
    scored.sort((a, b) => b.totalScore - a.totalScore || a.pct - b.pct);

    // ── 6. Build 7-day schedule (align days to user's focus skills) ───────────
    const SKILL_CYCLE    = ['vocabulary', 'listening', 'reading', 'writing', 'speaking', 'grammar', 'quiz'];
    const daySkillOrder  = focusSkills.length > 0
      ? [...focusSkills, ...SKILL_CYCLE].slice(0, 7)
      : SKILL_CYCLE;

    const schedule = [];
    for (let day = 0; day < 7; day++) {
      const daySkill = daySkillOrder[day] || SKILL_CYCLE[day % SKILL_CYCLE.length];

      // Pick highest-scored topic whose nodes cover today's skill (not yet used this week)
      let picked = scored.find(({ topic }) =>
        !schedule.some(s => s.topicId.toString() === topic._id.toString()) &&
        (topic.nodes || []).some(n => (NODE_TYPE_TO_SKILL[n.type] || '') === daySkill)
      );

      // Fallback: best unused topic regardless of skill
      if (!picked) {
        picked = scored.find(({ topic }) =>
          !schedule.some(s => s.topicId.toString() === topic._id.toString())
        ) || scored[day % scored.length];
      }

      schedule.push({
        dayIndex:        day,
        topicId:         picked.topic._id,
        lessonId:        null,
        skill:           daySkill,
        similarityScore: parseFloat(picked.totalScore.toFixed(2)),
        isExploration:   picked.pct === 100,
      });
    }

    // ── 7. Expire old plan & persist new one ─────────────────────────────────
    await UserPlan.updateMany(
      { userId: req.userId, status: 'active' },
      { $set: { status: 'replaced' } }
    );

    const monday = weekMonday();
    const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate() + 6);

    const plan = await UserPlan.create({
      userId:            req.userId,
      weekStart:         monday,
      weekEnd:           sunday,
      dayItems:          schedule,
      generatedForLevel: userLevelStr,
      explorationRatio:  scored.filter(s => s.pct === 100).length / scored.length,
      status:            'active',
    });

    // ── 8. Populate topic info for response ───────────────────────────────────
    const topicIds = [...new Set(schedule.map(s => s.topicId?.toString()))];
    const topics   = await Topic.find({ _id: { $in: topicIds } })
      .select('name description cover_image icon_name level frequency')
      .lean();
    const topicMap = {};
    topics.forEach(tp => { topicMap[tp._id.toString()] = tp; });

    const enrichedItems = plan.dayItems.map(item => ({
      ...item,
      topic:  topicMap[item.topicId?.toString()] || null,
      lesson: null,
    }));

    res.json({ success: true, data: { ...plan.toObject(), dayItems: enrichedItems } });
  } catch (err) {
    console.error('[LearningController] generatePlan:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo lộ trình' });
  }
};

// ─── 6. Get current active plan ──────────────────────────────────────────────
exports.getCurrentPlan = async (req, res) => {
  try {
    const plan = await UserPlan.findOne({ userId: req.userId, status: 'active' })
      .sort({ created_at: -1 })
      .lean();

    if (!plan) return res.json({ success: true, data: null });

    // Populate topic info for each day item (new topic-based plan)
    const topicIds = plan.dayItems.map(d => d.topicId).filter(Boolean);
    const topics   = await Topic.find({ _id: { $in: topicIds } })
      .select('name description cover_image icon_name level')
      .lean();
    const topicMap = {};
    topics.forEach(tp => { topicMap[tp._id.toString()] = tp; });

    // Populate lesson info only if present (legacy plans)
    const lessonIds = plan.dayItems.map(d => d.lessonId).filter(Boolean);
    const lessonMap = {};
    if (lessonIds.length > 0) {
      const lessons = await Lesson.find({ _id: { $in: lessonIds } })
        .populate('topic_id', 'name cover_image')
        .lean();
      lessons.forEach(l => { lessonMap[l._id.toString()] = l; });
    }

    const enriched = plan.dayItems.map(item => ({
      ...item,
      topic:    topicMap[item.topicId?.toString()] || null,
      lesson:   item.lessonId ? (lessonMap[item.lessonId?.toString()] || null) : null,
      progress: null,
    }));

    res.json({ success: true, data: { ...plan, dayItems: enriched } });
  } catch (err) {
    console.error('[LearningController] getCurrentPlan:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── 7. User progress summary ────────────────────────────────────────────────
exports.getProgress = async (req, res) => {
  try {
    const progresses = await LessonProgress.find({ userId: req.userId })
      .populate('lessonId', 'title level topic_id')
      .populate('topicId', 'name cover_image')
      .sort({ completedAt: -1 })
      .lean();

    const completedCount = progresses.filter(p => p.completedAt).length;
    const totalScore     = progresses.reduce((s, p) => s + (p.score || 0), 0);
    const avgScore       = completedCount ? Math.round(totalScore / completedCount) : 0;

    // Group by topic
    const topicMap = {};
    progresses.forEach(p => {
      const tid = p.topicId?._id?.toString() || p.topicId?.toString();
      if (!tid) return;
      if (!topicMap[tid]) topicMap[tid] = { topic: p.topicId, done: 0, total: 0 };
      if (p.completedAt) topicMap[tid].done += 1;
    });

    res.json({
      success: true,
      data: {
        completedLessons: completedCount,
        avgScore,
        recentProgress: progresses.slice(0, 10),
        topicProgress:  Object.values(topicMap),
      },
    });
  } catch (err) {
    console.error('[LearningController] getProgress:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── Helper: convert CEFR → lesson level string ──────────────────────────────
function cefrToLessonLevel(cefr) {
  if (!cefr) return 'beginner';
  const u = cefr.toUpperCase();
  if (['A1', 'A2'].includes(u)) return 'beginner';
  if (['B1', 'B2'].includes(u)) return 'intermediate';
  if (['C1', 'C2'].includes(u)) return 'advanced';
  return 'beginner'; // fallback
}

/**
 * Map onboarding current_level (free-form) → normalised level string.
 * Handles values like 'b1', 'close_friend', 'learning', 'beginner', etc.
 */
function normaliseLevelStr(raw) {
  if (!raw) return 'beginner';
  const r = raw.toLowerCase().trim();
  // Standard
  if (r === 'beginner')     return 'beginner';
  if (r === 'intermediate') return 'intermediate';
  if (r === 'advanced')     return 'advanced';
  // CEFR shorthand stored as level
  if (['a1', 'a2'].includes(r))        return 'beginner';
  if (['b1', 'b2'].includes(r))        return 'intermediate';
  if (['c1', 'c2'].includes(r))        return 'advanced';
  // Vietnamese onboarding free-text options → treat as beginner/intermediate
  if (['learning', 'close_friend', 'basic', 'elementary'].includes(r)) return 'beginner';
  return 'beginner'; // safe fallback
}

function getAllowedLevels(level) {
  if (level === 'beginner')     return ['beginner'];
  if (level === 'intermediate') return ['beginner', 'intermediate'];
  return ['beginner', 'intermediate', 'advanced']; // advanced sees all
}
