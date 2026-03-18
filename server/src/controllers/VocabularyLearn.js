'use strict';
const Vocabulary = require('../models/Vocabulary');
const Topic = require('../models/Topic');
const Pet = require('../models/Pet');
const User = require('../models/User');
const mongoose = require('mongoose');
const { rewardExercise } = require('../utils/rewardHelper');

// ─── optional Gemini AI ───────────────────────────────────────────────────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (_) { /* package not installed — AI fill disabled */ }

// ─── simple shuffle ──────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── GET /api/vocabulary/topics ──────────────────────────────────────────────
exports.getVocabTopics = async (req, res) => {
  try {
    // Find all topics that have at least 1 active vocabulary word
    const topicIds = await Vocabulary.distinct('topics', { is_active: true });

    const topics = await Topic.find({
      _id: { $in: topicIds },
    }).select('name description cover_image icon_name level is_active').lean();

    // Count words per topic
    const wordCounts = await Vocabulary.aggregate([
      { $match: { is_active: true, topics: { $in: topicIds } } },
      { $unwind: '$topics' },
      { $group: { _id: '$topics', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    wordCounts.forEach(r => { countMap[String(r._id)] = r.count; });

    // User progress — how many words they've "seen" in completed sessions
    // We store completed word IDs per topic in User.vocab_progress (Map)
    let progressMap = {};
    if (req.userId) {
      const user = await User.findById(req.userId).select('vocab_progress').lean();
      if (user?.vocab_progress) {
        for (const [k, v] of Object.entries(user.vocab_progress)) {
          progressMap[k] = Array.isArray(v) ? v.length : (v || 0);
        }
      }
    }

    const result = topics.map(t => {
      const id = String(t._id);
      const total = countMap[id] || 0;
      const learned = progressMap[id] || 0;
      return {
        ...t,
        total_words: total,
        learned_words: Math.min(learned, total),
        progress_pct: total > 0 ? Math.round((Math.min(learned, total) / total) * 100) : 0,
      };
    });

    // Sort: in-progress first, then not started
    result.sort((a, b) => {
      if (a.progress_pct === b.progress_pct) return 0;
      if (a.progress_pct === 100) return 1;
      if (b.progress_pct === 100) return -1;
      return b.progress_pct - a.progress_pct;
    });

    res.json({ data: result });
  } catch (err) {
    console.error('[VocabLearn] getVocabTopics:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── GET /api/vocabulary/topics/:topicId/words ───────────────────────────────
exports.getTopicWords = async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: 'topicId không hợp lệ' });
    }

    const topic = await Topic.findById(topicId).select('name description cover_image level').lean();
    if (!topic) return res.status(404).json({ message: 'Không tìm thấy chủ đề' });

    const words = await Vocabulary.find({
      topics: topicId,
      is_active: true,
    })
      .select('word part_of_speech pronunciation meaning example synonyms imageUrl audioUrl level')
      .lean();

    if (!words.length) {
      return res.json({ topic, words: [], total: 0 });
    }

    // Attach learned flag for current user
    let learnedSet = new Set();
    if (req.userId) {
      const user = await User.findById(req.userId).select('vocab_progress').lean();
      const arr = user?.vocab_progress?.[topicId];
      if (Array.isArray(arr)) arr.forEach(id => learnedSet.add(String(id)));
    }

    const enriched = words.map(w => ({
      ...w,
      learned: learnedSet.has(String(w._id)),
    }));

    res.json({ topic, words: enriched, total: enriched.length });
  } catch (err) {
    console.error('[VocabLearn] getTopicWords:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── POST /api/vocabulary/topics/:topicId/complete ───────────────────────────
exports.completeSession = async (req, res) => {
  try {
    const { topicId } = req.params;
    const {
      correctCount = 0,
      totalCount = 1,
      wordIds = [],
      wrongCount = 0,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: 'topicId không hợp lệ' });
    }

    // ── 1. Save learned word IDs to user.vocab_progress[topicId] ──────────
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });

    // vocab_progress là Mongoose Map — phải dùng .get() / .set()
    const existingArr = user.vocab_progress.get(topicId) || [];
    const existing = new Set(existingArr.map(String));
    wordIds.forEach(id => existing.add(String(id)));
    user.vocab_progress.set(topicId, Array.from(existing));
    user.markModified('vocab_progress');
    await user.save();

    // ── 2. Reward coins + EXP (per correct answer) ────────────────────────
    let rewardResult = { earned: 0, totalToday: 0, capReached: false };
    if (correctCount > 0) {
      rewardResult = await rewardExercise(req.userId, 'vocab', {
        customAmount: correctCount * 10, // 10 coins per correct answer (configurable)
      });
    }

    // ── 3. Pet HP damage for wrong answers ────────────────────────────────
    let petState = null;
    if (wrongCount > 0) {
      const pet = await Pet.findOne({ user: req.userId });
      if (pet) {
        const dmg = wrongCount * 5; // 5 HP per wrong answer
        pet.hp = Math.max(0, (pet.hp || 100) - dmg);
        pet.markModified('hp');
        await pet.save();
        petState = {
          hp: pet.hp,
          maxHp: pet.max_hp || 100,
          hpDamaged: dmg,
        };
      }
    }

    // ── 4. Accuracy & XP info ─────────────────────────────────────────────
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    res.json({
      success: true,
      accuracy,
      coinsEarned: rewardResult.earned,
      expEarned: rewardResult.expEarned || Math.floor(correctCount * 5),
      capReached: rewardResult.capReached,
      pet: petState,
      learnedCount: existing.size,
    });
  } catch (err) {
    console.error('[VocabLearn] completeSession:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── POST /api/vocabulary/ai-fill ────────────────────────────────────────────
/**
 * Body: { word: string, meaning: string, example?: string }
 * Returns: { sentence: string, blank: string }  (sentence has ___ for the word)
 */
exports.aiFill = async (req, res) => {
  try {
    const { word, meaning, example } = req.body;
    if (!word || !meaning) {
      return res.status(400).json({ message: 'Cần cung cấp word và meaning' });
    }

    // If Gemini not available, return a simple fallback
    if (!genAI) {
      const fallback = example
        ? example.replace(new RegExp(`\\b${word}\\b`, 'gi'), '___')
        : `Please fill in the blank: ___ means "${meaning}".`;
      return res.json({ sentence: fallback, answer: word });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Create ONE short English sentence (max 15 words) that uses the word "${word}" (${meaning}) naturally in context. 
Then output ONLY the sentence with the word replaced by "___".
Do NOT include any explanation. Output format: just the sentence with ___ placeholder.
Example output: "She ordered a ___ of coffee at the airport café."`;

    const result = await model.generateContent(prompt);
    const sentence = result.response.text().trim().replace(/^["']|["']$/g, '');

    res.json({ sentence, answer: word });
  } catch (err) {
    console.error('[VocabLearn] aiFill:', err);
    // Graceful fallback
    const { word, example, meaning } = req.body;
    const fallback = example
      ? example.replace(new RegExp(`\\b${word}\\b`, 'gi'), '___')
      : `___ means "${meaning}".`;
    res.json({ sentence: fallback, answer: word });
  }
};
