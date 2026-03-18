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

    const prompt = `Bạn là một AI chuyên gia giáo dục IELTS. Dựa trên hồ sơ học sinh và các tài liệu có sẵn, tạo một lộ trình học 7 ngày.

${userProfile}

${contentSummary}

Hãy tạo một kế hoạch trải đều các kỹ năng (Reading, Speaking, Writing, Listening, Vocabulary, Grammar, Topic). Mỗi ngày chọn 1 loại tài liệu.

Trả về JSON theo định dạng:
{
  "dayItems": [
    {
      "dayIndex": 0,
      "skill": "reading",
      "itemType": "reading",
      "reason": "Tăng cường kỹ năng đọc hiểu"
    },
    ...
  ]
}

Trong đó itemType phải là một trong: topic, reading, speaking, writing, story, vocabulary, listening, grammar.
`;

    // Call Gemini 2.5 Flash with retry logic
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    let responseText = "";
    let useAI = true;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
      console.log('[generatePlan] AI generated successfully');
    } catch (aiError) {
      console.warn('[generatePlan] AI Error, falling back to rule-based:', aiError.message);
      useAI = false;
    }

    let parsedResponse = { dayItems: [] };

    if (useAI) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error('Failed to parse AI response:', parseErr.message);
        useAI = false;
      }
    }

    // Fallback: Rule-based if AI fails
    if (!useAI || !parsedResponse.dayItems || parsedResponse.dayItems.length === 0) {
      console.log('[generatePlan] Using rule-based fallback plan');
      
      const skillQueues = {
        reading: readings,
        listening: listenings,
        speaking: speakings,
        writing: writings,
        vocabulary: vocabularies,
        grammar: grammars,
        story: stories,
        topic: topics
      };
      
      const skillCycle = ['topic', 'reading', 'listening', 'speaking', 'writing', 'vocabulary', 'grammar', 'story'];
      
      parsedResponse.dayItems = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const skill = skillCycle[dayIndex % skillCycle.length];
        parsedResponse.dayItems.push({
          dayIndex,
          skill,
          itemType: skill,
          reason: `Daily ${skill} practice`
        });
      }
    }

    // Build schedule from AI response
    const schedule = [];
    const skillQueues = {
      reading: readings,
      listening: listenings,
      speaking: speakings,
      writing: writings,
      vocabulary: vocabularies,
      grammar: grammars,
      story: stories,
      topic: topics
    };
    
    console.log('[generatePlan] Building schedule with AI items:', {
      aiItemsCount: parsedResponse.dayItems.length,
      skillQueuesStatus: Object.keys(skillQueues).reduce((acc, k) => { acc[k] = skillQueues[k].length; return acc; }, {})
    });
    
    for (const aiItem of parsedResponse.dayItems) {
      if (aiItem.dayIndex === undefined) continue;
      
      const itemType = aiItem.itemType || 'topic';
      const queue = skillQueues[itemType] || topics;
      const item = queue.length > 0 ? queue[Math.floor(Math.random() * queue.length)] : null;
      
      console.log(`[generatePlan] Day ${aiItem.dayIndex} - Type: ${itemType}, Queue size: ${queue.length}, Item found: ${!!item}`);
      
      if (item) {
        schedule.push({
          dayIndex: aiItem.dayIndex,
          topicId: itemType === 'topic' ? item._id : null,
          lessonId: null,
          itemId: item._id,
          itemType: itemType,
          skill: aiItem.skill || itemType,
          similarityScore: 0.85,
          isExploration: false
        });
      }
    }
    
    console.log('[generatePlan] Final schedule has', schedule.length, 'items');

    // Safety check: if schedule is incomplete (< 7 days), trigger fallback logic
    if (schedule.length < 7) {
      console.warn('[generatePlan] Schedule incomplete (only', schedule.length, 'items), using fallback to complete...');
      
      const skillQueues = {
        reading: readings,
        listening: listenings,
        speaking: speakings,
        writing: writings,
        vocabulary: vocabularies,
        grammar: grammars,
        story: stories,
        topic: topics
      };
      
      const skillCycle = ['topic', 'reading', 'listening', 'speaking', 'writing', 'vocabulary', 'grammar', 'story'];
      const scheduleSet = new Set(schedule.map(s => s.dayIndex));
      
      // Fill missing days
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        if (scheduleSet.has(dayIndex)) continue;
        
        const skill = skillCycle[dayIndex % skillCycle.length];
        const queue = skillQueues[skill] || [];
        const item = queue.length > 0 ? queue[Math.floor(Math.random() * queue.length)] : null;
        
        if (item) {
          schedule.push({
            dayIndex,
            topicId: skill === 'topic' ? item._id : null,
            lessonId: null,
            itemId: item._id,
            itemType: skill,
            skill,
            similarityScore: 0.85,
            isExploration: false
          });
        }
      }
    }
    
    console.log('[generatePlan] After safety check:', schedule.length, 'items');
    
    // Sort by dayIndex to ensure correct order
    schedule.sort((a, b) => a.dayIndex - b.dayIndex);
    
    console.log('[generatePlan] Sorted schedule:', schedule.map(s => ({ day: s.dayIndex, type: s.itemType, id: s.itemId?.toString().slice(-4) })));

    // Save plan
    await UserPlan.updateMany(
      { userId: req.userId, status: 'active' },
      { $set: { status: 'replaced' } }
    );

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
      generationMethod: useAI ? 'gemini_2_0_flash' : 'rule_based_fallback'
    });

    console.log('[generatePlan] Returning plan with', plan.dayItems.length, 'dayItems');
    console.log('[generatePlan] Plan object keys:', Object.keys(plan.toObject()));
    
    res.json({ success: true, data: { ...plan.toObject() } });
  } catch (err) {
    console.error('[LearningController] generatePlan:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo lộ trình', error: err.message });
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
        lessonId: item.lessonId,
        topicId: item.topicId,
        itemId: item.itemId,
        itemType: item.itemType,
        skill: item.skill,
        similarityScore: item.similarityScore,
        isExploration: item.isExploration,
        status: item.status,
        completedAt: item.completedAt
      };
      
      console.log('[getCurrentPlan] Processing item:', { dayIndex: item.dayIndex, itemType: item.itemType, itemId: item.itemId ? item.itemId.toString().slice(-4) : 'null' });
      
      if (item.itemType === 'topic' && item.itemId) {
        const topic = await Topic.findById(item.itemId).select('name description cover_image icon_name level').lean();
        itemData.content = topic;
      } else if (item.itemType === 'reading' && item.itemId) {
        const reading = await ReadingPassage.findById(item.itemId).select('title level').lean();
        itemData.content = reading;
      } else if (item.itemType === 'speaking' && item.itemId) {
        const speaking = await SpeakingQuestion.findById(item.itemId).select('question_text level topic_id').lean();
        itemData.content = speaking;
        if (speaking?.topic_id) itemData.topicId = speaking.topic_id;
      } else if (item.itemType === 'writing' && item.itemId) {
        const writing = await WritingPrompt.findById(item.itemId).select('prompt type topic_id').lean();
        itemData.content = writing;
        if (writing?.topic_id) itemData.topicId = writing.topic_id;
      } else if (item.itemType === 'story' && item.itemId) {
        const story = await Story.findById(item.itemId).select('title level').lean();
        itemData.content = story;
      } else if (item.itemType === 'vocabulary' && item.itemId) {
        const vocab = await Vocabulary.findById(item.itemId).select('word meaning level topics').lean();
        itemData.content = vocab;
        // Get topicId from vocabulary's topics array if available
        if (vocab?.topics && vocab.topics.length > 0) {
          itemData.topicId = vocab.topics[0];
        }
      } else if (item.itemType === 'listening' && item.itemId) {
        const listening = await ListeningPassage.findById(item.itemId).select('title').lean();
        itemData.content = listening;
      } else if (item.itemType === 'grammar' && item.itemId) {
        const grammar = await GrammarLesson.findById(item.itemId).select('title').lean();
        itemData.content = grammar;
      }
      
      // Sync content to topic or lesson for frontend compatibility
      if (itemData.content) {
        if (item.itemType === 'topic') {
          itemData.topic = itemData.content;
        } else {
          // For other types, we'll treat them as a "pseudo-lesson" or just pass content
          itemData.lesson = {
            _id: item.itemId,
            title: itemData.content.title || itemData.content.name || itemData.content.word || itemData.content.question_text || itemData.content.prompt,
            itemType: item.itemType
          };
        }
      }
      
      // Backwards compat with legacy topicId format
      if (!item.itemType && item.topicId) {
        const topic = await Topic.findById(item.topicId).select('name description cover_image icon_name level').lean();
        itemData.content = topic;
      }
      
      // Backwards compat with legacy lessonId format
      if (item.lessonId) {
        const lesson = await Lesson.findById(item.lessonId).populate('topic_id', 'name cover_image').lean();
        itemData.lesson = lesson;
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
