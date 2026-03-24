'use strict';

const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');
const LessonProgress = require('../models/LessonProgress');
const UserPlan = require('../models/UserPlan');
const User = require('../models/User');
const Pet = require('../models/Pet');

// New models for multi-source AI plan
const Vocabulary = require('../models/Vocabulary');
const ReadingPassage = require('../models/ReadingPassage');
const SpeakingQuestion = require('../models/SpeakingQuestion');
const WritingPrompt = require('../models/WritingPrompt');
const Story = require('../models/Story');
const ListeningPassage = require('../models/ListeningPassage');
const GrammarLesson = require('../models/GrammarLesson');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const economyService = require('../services/economyService');
const embeddingService = require('../services/embeddingService');
const aiService = require('../services/aiService');
const axios = require('axios');

const TASK_WEIGHTS = {
  reading: 3, listening: 3, speaking: 5, writing: 5,
  vocabulary: 1, grammar: 2, story: 2
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map lesson.level string → numeric rank for filtering */
const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3 };

/** Determine the skill icons an array of nodes represents */
function nodeSkillIcons(nodes = []) {
  const icons = new Set();
  nodes.forEach(n => {
    const t = (n.type || n.node_type || '').toLowerCase();
    if (t.includes('reading') || t.includes('read')) icons.add('reading');
    if (t.includes('listen') || t.includes('audio')) icons.add('listening');
    if (t.includes('vocab') || t.includes('vocabulary')) icons.add('vocabulary');
    if (t.includes('quiz') || t.includes('grammar')) icons.add('quiz');
    if (t.includes('writ') || t.includes('essay')) icons.add('writing');
    if (t.includes('speak') || t.includes('roleplay')) icons.add('speaking');
    if (t.includes('video')) icons.add('video');
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

    if (!topicId || topicId === 'null' || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ success: false, message: 'ID Chủ đề không hợp lệ' });
    }

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
      const prevDone = idx === 0 || completedSet.has(lessons[idx - 1]._id.toString());
      return {
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        level: lesson.level,
        duration: lesson.duration,
        cover_image: lesson.cover_image,
        skillIcons: nodeSkillIcons(lesson.nodes || []),
        nodeCount: (lesson.nodes || []).length,
        isCompleted,
        isUnlocked: prevDone,
        isLocked: !prevDone,
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

    // Sync with Roadmap V4.0
    await exports.updatePlanTaskStatus(req.userId, lessonId, 'completed');

    progress.completedNodes = completedNodes;
    progress.score = scoreNum;
    progress.timeSpentSec = (progress.timeSpentSec || 0) + timeSpentSec;
    progress.completedAt = new Date();

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
        const petState = await economyService.getPetState(pet);
        const buffMult = await economyService.getPetBuffMultiplier(pet, 'all');
        const baseExp = 20;
        const expGain = petState.expLocked
          ? 0
          : Math.round(baseExp * petState.expMultiplier * buffMult);

        if (expGain > 0) {
          pet.growthPoints += expGain;
          // Simple level-up loop
          const expNeeded = await economyService.getExpNeeded(pet);
          while (pet.growthPoints >= expNeeded) {
            pet.growthPoints -= expNeeded;
            pet.level += 1;
          }
          await pet.save();
          rewardResult.expGain = expGain;
          rewardResult.pet = pet;
        }
      }

      progress.rewarded = true;
      progress.coinsEarned = rewardResult.earned || 0;
      progress.expEarned = rewardResult.expGain || 0;
    }

    await progress.save();

    // Update lesson stats
    Lesson.findByIdAndUpdate(lessonId, { $inc: { 'stats.completions': 1 } }).exec();

    // Get pet state for frontend animation
    const petDoc = rewardResult.pet || await Pet.findOne({ user: req.userId }).lean();
    const petState = petDoc ? await economyService.getPetState(petDoc) : null;

    res.json({
      success: true,
      data: {
        progress,
        reward: {
          coins: progress.coinsEarned,
          exp: progress.expEarned,
          petState,
          pet: petDoc ? { coins: petDoc.coins, level: petDoc.level, petType: petDoc.petType, egg_type: petDoc.egg_type } : null,
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

    // 🟢 KIỂM TRA GÓI CƯỚC: Gói Free không được tạo lộ trình
    const planInfo = await aiService.getActivePlan(req.userId);
    if (planInfo && planInfo.slug === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản Free không thể tạo lộ trình học cá nhân hóa. Hãy nâng cấp lên gói PRO hoặc PREMIUM để AI thiết kế kế hoạch dành riêng cho bạn! 🚀',
        code: 'UPGRADE_REQUIRED'
      });
    }

    const prefs = user.learning_preferences || {};
    const placement = user.placement_test_result || {};

    const userLevelStr = placement.cefr_level ? cefrToLessonLevel(placement.cefr_level) : normaliseLevelStr(prefs.current_level);
    const allowedLevels = getAllowedLevels(userLevelStr);

    // ── Fetch all multi-source data ───────────────────────────────────────────
    // Try with is_active: true first, then fallback to no filter
    let topics = await Topic.find({ is_active: true, level: { $in: allowedLevels } }).select('_id name description').lean();
    if (topics.length === 0) {
      console.warn('[generatePlan] No active topics found, fetching all topics...');
      topics = await Topic.find({ level: { $in: allowedLevels } }).select('_id name description').limit(50).lean();
    }

    let readings = await ReadingPassage.find({ is_active: true }).limit(50).select('_id title').lean();
    if (readings.length === 0) {
      console.warn('[generatePlan] No active readings found, fetching all readings...');
      readings = await ReadingPassage.find().limit(50).select('_id title').lean();
    }

    let speakings = await SpeakingQuestion.find({ is_active: true }).limit(50).select('_id question_text').lean();
    if (speakings.length === 0) {
      console.warn('[generatePlan] No active speakings found, fetching all speakings...');
      speakings = await SpeakingQuestion.find().limit(50).select('_id question_text').lean();
    }

    let writings = await WritingPrompt.find({ is_active: true }).limit(50).select('_id prompt').lean();
    if (writings.length === 0) {
      console.warn('[generatePlan] No active writings found, fetching all writings...');
      writings = await WritingPrompt.find().limit(50).select('_id prompt').lean();
    }

    let stories = await Story.find({ is_active: true, level: { $in: allowedLevels } }).limit(50).select('_id title').lean();
    if (stories.length === 0) {
      console.warn('[generatePlan] No active stories found, fetching all stories...');
      stories = await Story.find({ level: { $in: allowedLevels } }).limit(50).select('_id title').lean();
    }

    let listenings = await ListeningPassage.find({ is_active: true }).limit(50).select('_id title').lean();
    if (listenings.length === 0) {
      console.warn('[generatePlan] No active listenings found, fetching all listenings...');
      listenings = await ListeningPassage.find().limit(50).select('_id title').lean();
    }

    let grammars = await GrammarLesson.find({ is_active: true }).limit(50).select('_id title').lean();
    if (grammars.length === 0) {
      console.warn('[generatePlan] No active grammars found, fetching all grammars...');
      grammars = await GrammarLesson.find().limit(50).select('_id title').lean();
    }

    let vocabularies = await Vocabulary.find({ is_active: true, level: { $in: allowedLevels } }).limit(50).select('_id word').lean();
    if (vocabularies.length === 0) {
      console.warn('[generatePlan] No active vocabularies found, fetching all vocabularies...');
      vocabularies = await Vocabulary.find({ level: { $in: allowedLevels } }).limit(50).select('_id word').lean();
    }

    // Log data availability
    console.log('[generatePlan] Data fetched:', {
      topics: topics.length,
      readings: readings.length,
      speakings: speakings.length,
      writings: writings.length,
      stories: stories.length,
      listenings: listenings.length,
      grammars: grammars.length,
      vocabularies: vocabularies.length
    });

    // Build content summary for AI
    const contentSummary = `
Available Topics: ${topics.length} items
Available Reading Passages: ${readings.length} items
Available Speaking Questions: ${speakings.length} items
Available Writing Prompts: ${writings.length} items
Available Stories: ${stories.length} items
Available Listening Passages: ${listenings.length} items
Available Grammar Lessons: ${grammars.length} items
Available Vocabulary: ${vocabularies.length} items
    `.trim();

    const userProfile = `
User Level: ${userLevelStr}
CEFR: ${placement.cefr_level || 'N/A'}
Goal: ${prefs.goal || 'general'}
Focus Skills: ${(prefs.focus_skills || []).join(', ') || 'all'}
    `.trim();

    // --- TẦNG 1 & 2: GỌI PYTHON ĐỂ LẤY PERSONA & SEQUENCE TỐI ƯU ---
    let strategy = { persona: { intensity: 'STEADY', tasks_per_day: 1 }, sequence: [] };
    const pythonUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    try {
      // Giả lập lấy dữ liệu Mastery từ DB (Sẽ kết nối thật sau)
      const masteryData = user.mastery || {}; // e.g. { reading: 0.8, grammar: 0.5 }
      const lastSeen = user.last_activity_at || {}; // e.g. { reading: timestamp }

      const strategyRes = await axios.post(`${pythonUrl}/api/ai/roadmap/generate`, {
        profile: {
          goal: prefs.goal,
          current_level: userLevelStr,
          study_hours_per_week: prefs.study_hours_per_week || 5,
          focus_skills: prefs.focus_skills || [],
          interests: prefs.interests || [], // Sở thích từ Onboarding
          major: prefs.major || null,       // Chuyên ngành từ Onboarding
          needs_review: Object.keys(masteryData).filter(k => masteryData[k] < 0.6)
        },
        days: 7
      });
      if (strategyRes.data.success) {
        strategy = strategyRes.data;
        console.log('[generatePlan] Strategy from Python:', strategy.persona);
      }
    } catch (pyErr) {
      console.warn('[generatePlan] Python strategy failed, using default sequence:', pyErr.message);
      const types = ["topic", "reading", "listening", "speaking", "writing", "vocabulary", "grammar"];
      strategy.sequence = Array.from({ length: 7 }, (_, i) => ({ day: i + 1, tasks: [types[i % types.length]] }));
    }

    // --- TẦNG 3: MAPPING DANH SÁCH BÀI TẬP (V4.5 NEURAL MATCH) ---
    const availableItems = {
      reading: readings, listening: listenings, speaking: speakings,
      writing: writings, vocabulary: vocabularies, grammar: grammars,
      story: stories, topic: topics
    };

    // 2. TÌM KIẾM BĂNG EMBEDDING (Neural Semantic Matching)
    let neuralMatches = [];
    try {
      const response = await axios.post(`${pythonUrl}/api/ai/roadmap/semantic-match`, {
        interests: prefs.interests || [],
        major: prefs.major || '',
        level: userLevelStr,
        mastery: user.learning_stats?.mastery || {},
        n_results: 20 // Lấy dư để phân bổ cho 7 ngày
      });
      if (response.data && response.data.success) {
        neuralMatches = response.data.matches;
        console.log(`🧠 [V4.5] Neural Roadmap: Found ${neuralMatches.length} semantic matches.`);
      }
    } catch (err) {
      console.warn('⚠️ Neural Match failed, falling back to keywords:', err.message);
    }

    const schedule = [];
    const TASK_WEIGHTS = { reading: 3, listening: 3, speaking: 5, writing: 5, vocabulary: 1, grammar: 2, story: 2, topic: 0 };

    for (const dayData of strategy.sequence) {
      const dayTasksDetail = [];
      for (const type of dayData.tasks) {
        const queue = availableItems[type] || [];
        if (queue.length === 0) continue;

        let item = null;

        // 1. Ưu tiên Neural Match
        const match = neuralMatches.find(m => m.type === type);
        if (match) {
          item = queue.find(it => it._id.toString() === match.id);
          if (item) neuralMatches = neuralMatches.filter(m => m.id !== match.id);
        }

        // 2. Fallback: Keyword Search
        if (!item && (prefs.interests?.length > 0 || prefs.major)) {
          const keywords = [...(prefs.interests || []), prefs.major].filter(Boolean);
          item = queue.find(it => {
            const title = (it.title || it.name || it.question || it.word || "").toLowerCase();
            return keywords.some(k => title.includes(k.toLowerCase()));
          });
        }

        // 3. Fallback: Random
        if (!item) {
          item = queue[Math.floor(Math.random() * queue.length)];
        }

        if (item) {
          dayTasksDetail.push({
            type: type,
            name: item.title || item.name || item.question || item.word || "Bài học AI",
            itemId: item._id,
            weight: TASK_WEIGHTS[type] || 2,
            status: 'pending'
          });
          // Xóa khỏi queue để tránh trùng lặp
          availableItems[type] = queue.filter(it => it._id.toString() !== item._id.toString());
        }
      }

      schedule.push({
        dayIndex: dayData.day - 1,
        status: 'pending',
        tasks: dayTasksDetail,
        topicId: dayTasksDetail.find(t => t.type === 'topic')?.itemId || null,
        similarityScore: 0.95
      });
    }

    // --- TẦNG 4: LLM ORCHESTRATOR (GEMINI EXPLANATION) ---
    const roadmapSummary = strategy.sequence.map(d => `Day ${d.day}: ${d.tasks.join(', ')}`).join('\n');
    const finalPrompt = `Bạn là "Orchestrator" của Hệ điều hành Giáo dục AI (Phiên bản V4.5 Neural Match). 
Dựa trên chiến lược tối ưu hóa đa mục tiêu và DỮ LIỆU ONBOARDING bên dưới, hãy viết một lời nhắn chào mừng cực kỳ truyền cảm hứng.

DỮ LIỆU ONBOARDING:
- Chuyên ngành: ${prefs.major || 'Chưa xác định'}
- Sở thích: ${(prefs.interests || []).join(', ') || 'Chung chung'}
- Mục tiêu: ${prefs.goal || 'Tiếng Anh tổng quát'}

CHIẾN LƯỢC V4.5 (NEURAL MATCH):
- Tìm kiếm bài học bằng Embedding (Vector Search) dựa trên sở thích ${prefs.major} và ${(prefs.interests || []).join(', ')}.
- Hybrid Matching: Kết hợp Semantic Similarity + Level Match + BKT Mastery.
- Progressive Overload: Tăng tải bứt phá cuối tuần.

TRÌNH TỰ LỘ TRÌNH:
${roadmapSummary}

Trả về JSON: { "welcome_message": "...", "phase_explanation": "..." }
Lời nhắn cần thể hiện sự thấu hiểu sâu sắc rằng bạn biết họ là ai và lộ trình này được "đo ni đóng giày" bằng trí tuệ nhân tạo.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    let aiExplanation = { welcome_message: "Khởi đầu hành trình chinh phục IELTS của bạn ngay hôm nay!", phase_explanation: "Lộ trình được thiết kế để cân bằng các kỹ năng." };

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(finalPrompt);
      const resText = result.response.text();
      const jsonMatch = resText.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiExplanation = JSON.parse(jsonMatch[0]);
    } catch (err) { console.error('Gemini Orchestration failed:', err); }

    // --- LƯU LỘ TRÌNH & TRẢ VỀ ---
    await UserPlan.updateMany({ userId: req.userId, status: 'active' }, { $set: { status: 'replaced' } });

    const monday = weekMonday();
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);

    const plan = await UserPlan.create({
      userId: req.userId,
      weekStart: monday,
      weekEnd: sunday,
      dayItems: schedule,
      generatedForLevel: userLevelStr,
      explorationRatio: 0,
      status: 'active',
      generationMethod: 'v4.5_neural_match',
      metadata: {
        persona: strategy.persona.persona,
        welcome_message: aiExplanation.welcome_message,
        phase_explanation: aiExplanation.phase_explanation,
        mastery_stats: strategy.persona.masteryData || {},
        method: 'v4.5_neural_match',
        generated_at: new Date()
      }
    });

    console.log('[generatePlan] New Neural V4.5 Plan created:', plan._id);
    res.json({ success: true, data: plan });
  } catch (err) {
    console.error('[LearningController] generatePlan Error:', err);
  }
};

// ─── 6. Get current active plan ──────────────────────────────────────────────
exports.getCurrentPlan = async (req, res) => {
  try {
    const plan = await UserPlan.findOne({ userId: req.userId, status: 'active' })
      .sort({ created_at: -1 });

    if (!plan) return res.json({ success: true, data: null });

    console.log('[getCurrentPlan] Found plan with', plan.dayItems?.length || 0, 'dayItems');

    // Populate different item types
    const populatedItems = [];
    for (let item of plan.dayItems) {
      const itemData = {
        dayIndex: item.dayIndex,
        status: item.status,
        completedAt: item.completedAt,
        tasks: []
      };

      // V4.0: Populate the 'tasks' array
      if (item.tasks && item.tasks.length > 0) {
        for (let task of item.tasks) {
          const taskData = { ...task.toObject() };

          if (task.type === 'topic' && task.itemId) {
            taskData.content = await Topic.findById(task.itemId).select('name description cover_image icon_name level').lean();
          } else if (task.type === 'reading' && task.itemId) {
            taskData.content = await ReadingPassage.findById(task.itemId).select('title level').lean();
          } else if (task.type === 'speaking' && task.itemId) {
            taskData.content = await SpeakingQuestion.findById(task.itemId).select('question_text level topic_id').lean();
          } else if (task.type === 'writing' && task.itemId) {
            taskData.content = await WritingPrompt.findById(task.itemId).select('prompt type topic_id').lean();
          } else if (task.type === 'story' && task.itemId) {
            taskData.content = await Story.findById(task.itemId).select('title level').lean();
          } else if (task.type === 'vocabulary' && task.itemId) {
            taskData.content = await Vocabulary.findById(task.itemId).select('word meaning level topics').lean();
          } else if (task.type === 'listening' && task.itemId) {
            taskData.content = await ListeningPassage.findById(task.itemId).select('title').lean();
          } else if (task.type === 'grammar' && task.itemId) {
            taskData.content = await GrammarLesson.findById(task.itemId).select('title').lean();
          }

          itemData.tasks.push(taskData);
        }
      }

      // Backward compatibility: maintain lesson/topic refs for older UI
      if (itemData.tasks.length > 0) {
        const mainTask = itemData.tasks[0];
        itemData.topic = mainTask.type === 'topic' ? mainTask.content : null;
        itemData.lesson = mainTask.type !== 'topic' ? {
          _id: mainTask.itemId,
          title: mainTask.content?.title || mainTask.content?.name || mainTask.content?.word || mainTask.name,
          itemType: mainTask.type
        } : null;
      }

      populatedItems.push(itemData);
    }

    const responseData = {
      ...plan.toObject(),
      dayItems: populatedItems
    };

    console.log('[getCurrentPlan] Returning populated plan with', populatedItems.length, 'items with content');
    res.json({ success: true, data: responseData });
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
    const totalScore = progresses.reduce((s, p) => s + (p.score || 0), 0);
    const avgScore = completedCount ? Math.round(totalScore / completedCount) : 0;

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
        topicProgress: Object.values(topicMap),
      },
    });
  } catch (err) {
    console.error('[LearningController] getProgress:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── 8. Multi-task Synchronization ──────────────────────────────────────────
/**
 * Global helper to mark a task as completed in the active roadmap.
 * To be called by all practice controllers (Reading, Speaking, etc.)
 */
exports.updatePlanTaskStatus = async (userId, itemId, status = 'completed') => {
  try {
    const plan = await UserPlan.findOne({ userId, status: 'active' });
    if (!plan) return false;

    let modified = false;
    for (let day of plan.dayItems) {
      if (day.tasks && day.tasks.length > 0) {
        for (let task of day.tasks) {
          // Both string or ObjectId check
          if (task.itemId && task.itemId.toString() === itemId.toString()) {
            task.status = status;
            modified = true;
          }
        }
      }

      // Update day overall status if all tasks are done
      if (day.tasks && day.tasks.length > 0) {
        const allDone = day.tasks.every(t => t.status === 'completed');
        if (allDone && day.status !== 'completed') {
          day.status = 'completed';
          day.completedAt = new Date();
          modified = true;
        }
      }
    }

    if (modified) {
      await plan.save();
      console.log(`[updatePlanTaskStatus] Sync: Item ${itemId} -> ${status}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[updatePlanTaskStatus] Error:', err);
    return false;
  }
};

/**
 * 9. Get Bonus Tasks (Active Learning)
 * When a user wants to study more than the assigned roadmap.
 */
exports.getBonusTasks = async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    const onboarding = await mongoose.model('UserOnboarding').findOne({ user_id: req.userId }).lean();

    // Fetch some high-relevance items based on interests
    const interests = onboarding?.interests || [];
    const major = onboarding?.major || '';
    const level = normaliseLevelStr(onboarding?.current_level);

    // Quick search for related topics/passages
    const topics = await Topic.find({
      $or: [
        { name: { $in: interests.map(i => new RegExp(i, 'i')) } },
        { description: new RegExp(major, 'i') }
      ],
      level: { $in: getAllowedLevels(level) }
    }).limit(3).lean();

    const readings = await ReadingPassage.find({
      is_active: true,
      level: { $in: getAllowedLevels(level) }
    }).sort({ usage_count: -1 }).limit(3).lean();

    const bonus = [
      ...topics.map(t => ({ id: t._id, type: 'topic', name: t.name, icon: '🔥', reason: 'Dựa trên sở thích của ní' })),
      ...readings.map(r => ({ id: r._id, type: 'reading', name: r.title, icon: '📖', reason: 'Bài đọc hot nhất tuần' }))
    ].sort(() => 0.5 - Math.random()).slice(0, 4);

    res.json({ success: true, data: bonus });
  } catch (err) {
    console.error('[getBonusTasks] Error:', err);
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
  if (r === 'beginner') return 'beginner';
  if (r === 'intermediate') return 'intermediate';
  if (r === 'advanced') return 'advanced';
  // CEFR shorthand stored as level
  if (['a1', 'a2'].includes(r)) return 'beginner';
  if (['b1', 'b2'].includes(r)) return 'intermediate';
  if (['c1', 'c2'].includes(r)) return 'advanced';
  // Vietnamese onboarding free-text options → treat as beginner/intermediate
  if (['learning', 'close_friend', 'basic', 'elementary'].includes(r)) return 'beginner';
  return 'beginner'; // safe fallback
}

function getAllowedLevels(level) {
  if (level === 'beginner') return ['beginner'];
  if (level === 'intermediate') return ['beginner', 'intermediate'];
  return ['beginner', 'intermediate', 'advanced']; // advanced sees all
}
