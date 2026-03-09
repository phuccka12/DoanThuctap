'use strict';
/**
 * StoryController.js
 * RPG Writing/Reading mini-game endpoints.
 *
 * User-facing routes (all under /api/stories):
 *   GET  /                          — story lobby list (with user progress)
 *   GET  /:storyId                  — full story document (all parts embedded)
 *   GET  /:storyId/progress         — user's progress for this story
 *   POST /:storyId/parts/:partNum/submit  — submit translations for a part → AI grade
 *   POST /:storyId/parts/:partNum/complete — mark part complete + award coins/XP
 *
 * Admin routes (under /api/admin/stories):
 *   GET    /                         — list all stories (paginated)
 *   POST   /                         — create story
 *   GET    /:id                       — get one story
 *   PUT    /:id                       — update story
 *   DELETE /:id                       — delete story
 */

const Story          = require('../models/Story');
const LessonProgress = require('../models/LessonProgress');
const Pet            = require('../models/Pet');
const economyService = require('../services/economyService');
const axios          = require('axios');

// ─── Gemini AI grader ─────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-2.0-flash';

// --- Offline N-gram similarity grader (pure JS, no external packages) ---

function normalizeTokens(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function countNgrams(arr) {
  const map = new Map();
  for (const item of arr) map.set(item, (map.get(item) || 0) + 1);
  return map;
}

function buildNgrams(tokens, n) {
  const result = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(' '));
  }
  return result;
}

function ngramPrecision(candTokens, refTokens, n) {
  const candGrams = buildNgrams(candTokens, n);
  if (candGrams.length === 0) return 0;
  const refCount  = countNgrams(buildNgrams(refTokens, n));
  const candCount = countNgrams(candGrams);
  let clipSum = 0;
  for (const [gram, cnt] of candCount) {
    clipSum += Math.min(cnt, refCount.get(gram) || 0);
  }
  return clipSum / candGrams.length;
}

function brevityPenalty(candLen, refLen) {
  if (candLen === 0) return 0;
  if (candLen >= refLen) return 1;
  return Math.exp(1 - refLen / candLen);
}

// Synonym groups: nếu candidate là paraphrase đúng nghĩa của cụm trong reference
// thì tính là "có từ đúng về mặt từ vựng" (chỉ ảnh hưởng vocabulary, KHÔNG cho grammar)
const SYNONYM_GROUPS = [
  ['sleep', 'go to bed', 'go to sleep', 'sleeping'],
  ['buy', 'purchase', 'buying'],
  ['start', 'begin', 'starting', 'beginning'],
  ['kids', 'children', 'child'],
  ['happy', 'glad', 'joyful'],
  ['angry', 'mad', 'furious'],
  ['eat', 'have', 'eating', 'having'],
  ['big', 'large', 'huge'],
  ['small', 'little', 'tiny'],
  ['go', 'walk', 'travel', 'head'],
];

/**
 * Kiểm tra xem candidate string có nằm trong cùng synonym group với ref string không.
 * @returns {boolean}
 */
function hasSynonymMatch(candTok, refTok) {
  const candStr = candTok.join(' ');
  const refStr  = refTok.join(' ');
  for (const grp of SYNONYM_GROUPS) {
    const candHit = grp.some(x => candStr.includes(x));
    const refHit  = grp.some(x => refStr.includes(x));
    if (candHit && refHit) return true;
  }
  return false;
}

function computeNgramSimilarity(reference, candidate) {
  const refTok  = normalizeTokens(reference);
  const candTok = normalizeTokens(candidate);
  if (refTok.length === 0 || candTok.length === 0) {
    return { unigramScore: 0, bigramScore: 0, combined: 0 };
  }

  let p1 = ngramPrecision(candTok, refTok, 1);   // từ vựng (unigram)
  const p2 = ngramPrecision(candTok, refTok, 2); // thứ tự từ / cú pháp (bigram)
  const bp = brevityPenalty(candTok.length, refTok.length); // phạt câu ngắn

  // Synonym boost: nếu candidate là paraphrase đúng nghĩa nhưng unigram thấp
  // → nâng vocabulary lên, nhưng grammar/naturalness vẫn tính theo độ dài thực
  if (p1 < 0.3 && hasSynonymMatch(candTok, refTok)) {
    p1 = 0.5; // partial credit về vocabulary
  }

  // combined = bp × (60% vocab + 40% syntax)
  // bp tự nhiên sẽ kéo combined xuống nếu câu quá ngắn → grammar/naturalness thấp
  const combined = bp * (0.6 * p1 + 0.4 * p2);

  return {
    unigramScore: p1,  // → vocabulary
    bigramScore:  p2,  // → grammar
    combined,          // → naturalness
  };
}

// -------------------------------------------------------------------------

async function gradeTranslationWithGemini(vi, en_sample, userAnswer) {
  if (!GEMINI_API_KEY) {
    const { unigramScore, bigramScore, combined } = computeNgramSimilarity(
      en_sample,
      userAnswer || ''
    );
    const toScore     = v => Math.min(10, Math.round(v * 10));
    const vocabulary  = toScore(unigramScore);
    const grammar     = toScore(bigramScore);
    const naturalness = toScore(combined);
    const total       = Math.round((vocabulary + grammar + naturalness) / 3);
    let feedback;
    if (total >= 8) {
      feedback = '[Offline Grader] Tuyệt vời! Câu dịch của bạn rất chính xác và tự nhiên. Hãy tiếp tục phát huy nhé!';
    } else if (total >= 5) {
      feedback = '[Offline Grader] Khá tốt! Bạn đã dùng đúng nhiều từ, nhưng thứ tự từ hoặc cách diễn đạt có thể tự nhiên hơn một chút.';
    } else {
      feedback = '[Offline Grader] Cần cải thiện thêm. Hãy chú ý đến từ vựng và cấu trúc câu  thử đối chiếu với câu mẫu để học cách đặt từ đúng chỗ.';
    }
    return { vocabulary, grammar, naturalness, total, feedback, suggestion: en_sample };
  }

  const prompt = `You are an English translation evaluator for Vietnamese learners.
The student translated this Vietnamese sentence into English.

Vietnamese source: "${vi}"
Reference translation: "${en_sample}"
Student's answer: "${userAnswer}"

Score the student's answer on THREE criteria, each from 0–10 (integers only):
1. Vocabulary (word choice accuracy)
2. Grammar (grammatical correctness)
3. Naturalness (how natural it sounds to a native speaker)

Also provide:
- A short, encouraging feedback sentence in Vietnamese (1–2 sentences).
- A suggested improved version in English (use the reference as a guide, but allow natural paraphrases).

Respond with VALID JSON only, no markdown:
{
  "vocabulary": <0-10>,
  "grammar": <0-10>,
  "naturalness": <0-10>,
  "feedback": "<Vietnamese feedback>",
  "suggestion": "<improved English sentence>"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 400 } },
      { timeout: 20000 }
    );
    const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    // Strip potential markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const clamp  = v => Math.min(10, Math.max(0, Number(v) || 0));
    const vocab  = clamp(parsed.vocabulary);
    const gram   = clamp(parsed.grammar);
    const nat    = clamp(parsed.naturalness);
    return {
      vocabulary:  vocab,
      grammar:     gram,
      naturalness: nat,
      total:       Math.round((vocab + gram + nat) / 3),
      feedback:    parsed.feedback   || 'Câu dịch của bạn khá tốt!',
      suggestion:  parsed.suggestion || en_sample,
    };
  } catch (err) {
    console.error('[StoryController] Gemini grading error:', err.message);
    // Gemini bị lỗi → fallback về N-gram offline grader (không hardcode điểm)
    const { unigramScore, bigramScore, combined } = computeNgramSimilarity(
      en_sample,
      userAnswer || ''
    );
    const toScore     = v => Math.min(10, Math.round(v * 10));
    const vocabulary  = toScore(unigramScore);
    const grammar     = toScore(bigramScore);
    const naturalness = toScore(combined);
    const total       = Math.round((vocabulary + grammar + naturalness) / 3);
    let feedback;
    if (total >= 8) {
      feedback = '[Offline Grader] Tuyệt vời! Câu dịch của bạn rất chính xác và tự nhiên. Hãy tiếp tục phát huy nhé!';
    } else if (total >= 5) {
      feedback = '[Offline Grader] Khá tốt! Bạn đã dùng đúng nhiều từ, nhưng thứ tự từ hoặc cách diễn đạt có thể tự nhiên hơn một chút.';
    } else {
      feedback = '[Offline Grader] Cần cải thiện thêm. Hãy chú ý đến từ vựng và cấu trúc câu — thử đối chiếu với câu mẫu để học cách đặt từ đúng chỗ.';
    }
    return { vocabulary, grammar, naturalness, total, feedback, suggestion: en_sample };
  }
}

// ─── User: Story lobby ────────────────────────────────────────────────────────
exports.getStories = async (req, res) => {
  try {
    const { theme, level, page = 1, limit = 12 } = req.query;
    const q = { is_active: true };
    if (theme) q.theme = theme;
    if (level) q.level = level;

    const total  = await Story.countDocuments(q);
    const stories = await Story.find(q)
      .select('title description cover_image theme level tags total_parts created_at')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // If authenticated, attach per-story progress (how many parts completed)
    let progressMap = {};
    if (req.userId) {
      const progs = await LessonProgress.find({
        userId:  req.userId,
        storyId: { $in: stories.map(s => s._id) },
        completedAt: { $ne: null },
      }).select('storyId current_story_part').lean();

      progs.forEach(p => {
        const sid = p.storyId?.toString();
        if (!sid) return;
        if (!progressMap[sid] || p.current_story_part > progressMap[sid]) {
          progressMap[sid] = p.current_story_part;
        }
      });
    }

    const enriched = stories.map(s => ({
      ...s,
      completedParts: progressMap[s._id.toString()] || 0,
    }));

    res.json({ success: true, data: enriched, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[StoryController] getStories:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── User: Full story (all parts) ────────────────────────────────────────────
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.storyId, is_active: true }).lean();
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy câu chuyện' });

    // Attach per-part unlock status if authenticated
    let unlockedParts = new Set([1]); // Part 1 always unlocked
    if (req.userId) {
      const progs = await LessonProgress.find({
        userId:  req.userId,
        storyId: story._id,
        completedAt: { $ne: null },
      }).select('current_story_part').lean();

      progs.forEach(p => {
        if (p.current_story_part) {
          unlockedParts.add(p.current_story_part + 1); // completing partN unlocks partN+1
        }
      });
    }

    const partsEnriched = story.parts.map(pt => ({
      ...pt,
      isUnlocked: unlockedParts.has(pt.part_number),
    }));

    res.json({ success: true, data: { ...story, parts: partsEnriched } });
  } catch (err) {
    console.error('[StoryController] getStoryById:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── User: Progress for a story ──────────────────────────────────────────────
exports.getStoryProgress = async (req, res) => {
  try {
    const progs = await LessonProgress.find({
      userId:  req.userId,
      storyId: req.params.storyId,
    }).lean();

    res.json({ success: true, data: progs });
  } catch (err) {
    console.error('[StoryController] getStoryProgress:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─── User: Submit translations for a part → AI grade each sentence ────────────
exports.submitPartTranslations = async (req, res) => {
  try {
    const { storyId, partNum } = req.params;
    // answers: [{ order: 1, answer: "..." }, ...]
    const { answers = [] } = req.body;

    const story = await Story.findOne({ _id: storyId, is_active: true }).lean();
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy câu chuyện' });

    const part = story.parts.find(p => p.part_number === Number(partNum));
    if (!part) return res.status(404).json({ success: false, message: 'Không tìm thấy phần này' });

    // Grade each submitted sentence in parallel
    const gradedResults = await Promise.all(
      part.sentences.map(async sentence => {
        const submitted = answers.find(a => a.order === sentence.order);
        const userAnswer = submitted?.answer || '';

        if (!userAnswer.trim()) {
          return {
            order:      sentence.order,
            vi:         sentence.vi,
            en_sample:  sentence.en_sample,
            userAnswer: '',
            grade: { vocabulary: 0, grammar: 0, naturalness: 0, total: 0, feedback: 'Bạn chưa nhập câu trả lời.', suggestion: sentence.en_sample },
          };
        }

        const grade = await gradeTranslationWithGemini(sentence.vi, sentence.en_sample, userAnswer);
        return {
          order:      sentence.order,
          vi:         sentence.vi,
          en_sample:  sentence.en_sample,
          userAnswer,
          grade,
        };
      })
    );

    // Overall part score = average of sentence totals (0–10)
    const answeredCount = gradedResults.filter(r => r.userAnswer.trim()).length;
    const partScore = answeredCount > 0
      ? Math.round(gradedResults.reduce((s, r) => s + r.grade.total, 0) / gradedResults.length)
      : 0;

    res.json({
      success: true,
      data: {
        partScore,
        results: gradedResults,
      },
    });
  } catch (err) {
    console.error('[StoryController] submitPartTranslations:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi chấm điểm' });
  }
};

// ─── User: Mark part complete + award coins/XP ───────────────────────────────
exports.completeStoryPart = async (req, res) => {
  try {
    const { storyId, partNum } = req.params;
    const { partScore = 0 } = req.body;          // 0–10, sent from frontend after grading

    const story = await Story.findOne({ _id: storyId, is_active: true }).lean();
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy câu chuyện' });

    const part = story.parts.find(p => p.part_number === Number(partNum));
    if (!part) return res.status(404).json({ success: false, message: 'Không tìm thấy phần này' });

    // Check unlock — Part 1 free; Part N requires Part N-1 completed
    if (Number(partNum) > 1) {
      const prevDone = await LessonProgress.findOne({
        userId:  req.userId,
        storyId,
        current_story_part: Number(partNum) - 1,
        completedAt: { $ne: null },
      });
      if (!prevDone) {
        return res.status(403).json({ success: false, message: 'Bạn cần hoàn thành phần trước để mở khóa phần này' });
      }
    }

    // Upsert progress record for this part
    let prog = await LessonProgress.findOne({
      userId:  req.userId,
      storyId,
      current_story_part: Number(partNum),
    });

    const alreadyRewarded = prog?.rewarded || false;

    if (!prog) {
      prog = new LessonProgress({
        userId:             req.userId,
        storyId,
        current_story_part: Number(partNum),
        score:              Math.round(partScore * 10), // convert 0-10 → 0-100
        completedAt:        new Date(),
      });
    } else {
      prog.score       = Math.round(partScore * 10);
      prog.completedAt = new Date();
      prog.attemptCount += 1;
    }

    // Award coins + EXP only once per part
    let rewardResult = { earned: 0, pet: null };

    if (!alreadyRewarded) {
      const rawCoins = part.coins_reward || 30;
      // Scale by score: 10/10 → full, lower → proportional, min 30%
      const earnAmount = Math.round(rawCoins * Math.max(0.3, partScore / 10));

      if (earnAmount > 0) {
        try {
          rewardResult = await economyService.earnCoins(req.userId, 'story_complete', earnAmount);
        } catch (e) {
          console.warn('[StoryController] earnCoins failed:', e.message);
        }
      }

      // Award pet EXP
      const pet = rewardResult.pet || await Pet.findOne({ user: req.userId });
      if (pet) {
        try {
          const petState = await economyService.getPetState(pet);
          if (!petState.expLocked) {
            const buffMult = await economyService.getPetBuffMultiplier(pet, 'all');
            const baseExp  = part.xp_reward || 50;
            const expGain  = Math.round(baseExp * petState.expMultiplier * buffMult * Math.max(0.3, partScore / 10));
            if (expGain > 0) {
              pet.growthPoints += expGain;
              const expNeeded   = await economyService.getExpNeeded(pet);
              while (pet.growthPoints >= expNeeded) {
                pet.growthPoints -= expNeeded;
                pet.level        += 1;
              }
              await pet.save();
              rewardResult.expGain = expGain;
              rewardResult.pet     = pet;
            }
          }
        } catch (e) {
          console.warn('[StoryController] pet EXP error:', e.message);
        }
      }

      prog.rewarded    = true;
      prog.coinsEarned = rewardResult.earned || 0;
      prog.expEarned   = rewardResult.expGain || 0;
    }

    await prog.save();

    const petDoc   = rewardResult.pet || null;
    const petState = petDoc ? await economyService.getPetState(petDoc) : null;

    res.json({
      success: true,
      data: {
        progress: prog,
        nextPartUnlocked: Number(partNum) < story.total_parts,
        reward: {
          coins:    prog.coinsEarned,
          exp:      prog.expEarned,
          petState,
        },
      },
    });
  } catch (err) {
    console.error('[StoryController] completeStoryPart:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CRUD
// ─────────────────────────────────────────────────────────────────────────────

exports.adminList = async (req, res) => {
  try {
    const { page = 1, limit = 20, theme, level, search } = req.query;
    const q = {};
    if (theme)  q.theme = theme;
    if (level)  q.level = level;
    if (search) q.title = { $regex: search, $options: 'i' };

    const total   = await Story.countDocuments(q);
    // Include cover_image and description so admin grid can display cover previews
    const stories = await Story.find(q)
      .select('title description cover_image theme level is_active total_parts created_at')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: stories, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[StoryController] adminList:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.adminCreate = async (req, res) => {
  try {
    const story = await Story.create({ ...req.body, created_by: req.userId });
    res.status(201).json({ success: true, data: story });
  } catch (err) {
    console.error('[StoryController] adminCreate:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminGetOne = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).lean();
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: story });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.adminUpdate = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    // Merge all fields from body; pre-save will recalculate total_parts
    Object.assign(story, req.body);
    await story.save();
    res.json({ success: true, data: story });
  } catch (err) {
    console.error('[StoryController] adminUpdate:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, message: 'Đã xóa câu chuyện' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
