'use strict';
/**
 * ReverseTranslationController.js
 * Routes prefix: /api/reverse-translation
 *
 * Endpoints:
 *   GET  /sets                     — danh sách bộ đề (public)
 *   GET  /sets/:setId              — chi tiết bộ đề (ẩn enTarget với user)
 *   POST /session/start            — tạo / resume session
 *   POST /session/:sessionId/grade — nộp 1 câu để AI chấm + tính combo
 *   POST /session/:sessionId/hint  — mua hint (trừ coins)
 *   POST /session/:sessionId/complete — hoàn thành session, trao thưởng
 *   GET  /session/active           — session đang in_progress của user
 */

const axios = require('axios');

const ReverseTranslationSet     = require('../models/ReverseTranslationSet');
const ReverseTranslationSession = require('../models/ReverseTranslationSession');
const Pet   = require('../models/Pet');
const CoinLog = require('../models/CoinLog');
const User  = require('../models/User');
const { earnCoins, spendCoins: spendCoinsSvc, getNum, getPetState } = require('../services/economyService');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

// ─── Coin costs for hints ──────────────────────────────────────────────────
const HINT_COSTS = {
  first_letter:  5,
  grammar:       10,
  view_passage:  15,
};

// ─── Base coins per correct sentence ──────────────────────────────────────
const BASE_COINS_PER_SENTENCE = 5;

// ─── Combo thresholds ─────────────────────────────────────────────────────
// streak ≥ 2 → x2 multiplier
function comboMultiplier(streak) {
  if (streak >= 4) return 3;
  if (streak >= 2) return 2;
  return 1;
}

// ─── Helper: trừ coins từ Pet + sync User + ghi CoinLog ───────────────────
async function deductPetCoins(userId, amount, source, note) {
  const pet = await Pet.findOne({ user: userId });
  if (!pet) throw new Error('Chưa có thú cưng');
  if (pet.coins < amount) throw new Error(`Không đủ Xu. Cần ${amount} 🪙, bạn có ${pet.coins} 🪙`);

  pet.coins -= amount;
  await pet.save();

  await User.findByIdAndUpdate(userId, { $set: { 'gamification_data.gold': pet.coins } });

  await CoinLog.create({
    user: userId, pet: pet._id,
    type: 'spend', source,
    amount: -amount,
    balance_after: pet.coins,
    note,
  });

  return pet.coins;
}

// ─── Helper: áp HP penalty cho pet khi user trả lời sai hoàn toàn ─────────
async function applyHpPenalty(userId, hpAmount) {
  try {
    const pet = await Pet.findOne({ user: userId });
    if (!pet || !pet.hatched) return null;
    // hunger tăng = "mất máu" (hệ thống đang dùng hunger làm HP inverse)
    pet.hunger    = Math.min(100, pet.hunger + hpAmount);
    pet.happiness = Math.max(0, pet.happiness - 5);
    await pet.save();
    return await getPetState(pet);
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /sets — danh sách bộ đề đang publish
// ─────────────────────────────────────────────────────────────────────────────
exports.listSets = async (req, res) => {
  try {
    const { level } = req.query;
    const filter = { is_active: true, is_published: true };
    if (level) filter.level = level;

    const sets = await ReverseTranslationSet.find(filter)
      .select('title description level rewardCoins items.order items.difficulty created_at')
      .populate('sourceLesson', 'title cover_image')
      .sort({ created_at: -1 })
      .lean();

    // Thêm thống kê nhanh
    const enriched = sets.map(s => ({
      ...s,
      sentenceCount: s.items?.length ?? 0,
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[ReverseTranslation] listSets:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /sets/:setId — chi tiết bộ đề (ẩn enTarget & firstLetterHint)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSet = async (req, res) => {
  try {
    const set = await ReverseTranslationSet.findOne({
      _id: req.params.setId, is_active: true, is_published: true,
    })
      .populate('sourceLesson', 'title cover_image level')
      .lean();

    if (!set) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ đề' });

    // Ẩn đáp án và hint khỏi response — chỉ trả về khi user yêu cầu hint
    const safeItems = set.items.map(item => ({
      _id:          item._id,
      order:        item.order,
      vnText:       item.vnText,
      requiredWords: item.requiredWords,
      difficulty:   item.difficulty,
      grammarHint:  undefined, // ẩn
      firstLetterHint: undefined, // ẩn
      enTarget:     undefined, // ẩn
    }));

    return res.json({ success: true, data: { ...set, items: safeItems } });
  } catch (err) {
    console.error('[ReverseTranslation] getSet:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /session/start — tạo hoặc resume session
// ─────────────────────────────────────────────────────────────────────────────
exports.startSession = async (req, res) => {
  try {
    const { setId } = req.body;
    if (!setId) return res.status(400).json({ success: false, message: 'Thiếu setId' });

    const set = await ReverseTranslationSet.findOne({
      _id: setId, is_active: true, is_published: true,
    }).lean();
    if (!set) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ đề' });

    // Resume nếu đang có session in_progress
    let session = await ReverseTranslationSession.findOne({
      userId: req.userId, setId, status: 'in_progress',
    });

    if (!session) {
      // Tạo session mới — khởi tạo results rỗng cho mỗi item
      const results = set.items
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          itemId: item._id,
          order:  item.order,
          status: 'pending',
        }));

      session = await ReverseTranslationSession.create({
        userId: req.userId,
        setId,
        results,
      });
    }

    return res.json({ success: true, data: session, isResume: !!session.createdAt });
  } catch (err) {
    console.error('[ReverseTranslation] startSession:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /session/active — lấy session đang in_progress (nếu có)
// ─────────────────────────────────────────────────────────────────────────────
exports.getActiveSession = async (req, res) => {
  try {
    const { setId } = req.query;
    const filter = { userId: req.userId, status: 'in_progress' };
    if (setId) filter.setId = setId;

    const session = await ReverseTranslationSession.findOne(filter)
      .sort({ created_at: -1 })
      .lean();

    return res.json({ success: true, data: session });
  } catch (err) {
    console.error('[ReverseTranslation] getActiveSession:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /session/:sessionId/grade — nộp 1 câu để AI chấm
// body: { itemId, userAnswer }
// ─────────────────────────────────────────────────────────────────────────────
exports.gradeItem = async (req, res) => {
  try {
    const { sessionId }  = req.params;
    const { itemId, userAnswer = '' } = req.body;

    const session = await ReverseTranslationSession.findOne({
      _id: sessionId, userId: req.userId, status: 'in_progress',
    });
    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại hoặc đã kết thúc' });

    // Lấy item từ bộ đề (cần enTarget và requiredWords để gửi AI)
    const set = await ReverseTranslationSet.findById(session.setId).lean();
    if (!set) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ đề' });

    const item = set.items.find(i => i._id.toString() === itemId.toString());
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy câu' });

    // Tìm result entry trong session
    const resultIdx = session.results.findIndex(r => r.itemId.toString() === itemId.toString());
    if (resultIdx === -1) return res.status(400).json({ success: false, message: 'itemId không hợp lệ' });

    const result = session.results[resultIdx];
    result.attempts += 1;
    result.userAnswer = userAnswer;

    // ── Gọi AI chấm điểm ──────────────────────────────────────────────────
    let aiResult;
    try {
      const aiRes = await axios.post(`${AI_SERVICE_URL}/api/reverse-translation/grade`, {
        vnText:        item.vnText,
        userAnswer,
        enTarget:      item.enTarget,
        requiredWords: item.requiredWords || [],
      }, { timeout: 30000 });
      aiResult = aiRes.data;
    } catch (aiErr) {
      // Fallback rule-based nếu Python service không hoạt động
      console.warn('[ReverseTranslation] AI grader unavailable, using fallback:', aiErr.message);
      const lower = userAnswer.toLowerCase();
      const enLower = item.enTarget.toLowerCase();
      const overlap = enLower.split(' ').filter(w => w.length > 3 && lower.includes(w)).length;
      const totalWords = enLower.split(' ').filter(w => w.length > 3).length || 1;
      const score = Math.round((overlap / totalWords) * 100);
      aiResult = {
        totalScore: score,
        status: score >= 75 ? 'correct' : score >= 45 ? 'partial' : 'wrong',
        feedback: score >= 75
          ? 'Bản dịch có vẻ chính xác.'
          : 'Một số từ khóa quan trọng còn thiếu hoặc sai.',
        naturalnessNote: '',
        missingRequiredWords: (item.requiredWords || []).filter(w => !lower.includes(w.toLowerCase())),
      };
    }

    // ── Ghi kết quả vào result ─────────────────────────────────────────────
    result.aiScore        = aiResult.totalScore;
    result.aiFeedback     = aiResult.feedback || '';
    result.aiNaturalness  = aiResult.naturalnessNote || '';
    result.status         = aiResult.status; // correct | partial | wrong

    // ── Tính combo & coins thưởng ──────────────────────────────────────────
    let coinsEarned = 0;
    let newCombo    = session.currentCombo;
    let petState    = null;
    const penaltyHp = set.wrongAnswerHpPenalty || 5;

    if (aiResult.status === 'correct') {
      newCombo += 1;
      const mult = comboMultiplier(newCombo);
      coinsEarned = BASE_COINS_PER_SENTENCE * mult;

      try {
        const earnResult = await earnCoins(req.userId, 'reverse_translation', coinsEarned);
        coinsEarned = earnResult.earned; // thực sự kiếm được (sau daily cap)
        petState = earnResult.pet ? await getPetState(earnResult.pet) : null;
      } catch (e) {
        console.warn('[ReverseTranslation] earnCoins failed:', e.message);
      }

      session.totalCoinsEarned += coinsEarned;
    } else if (aiResult.status === 'wrong') {
      newCombo = 0; // đứt combo
      session.wrongCountFull += 1;
      // HP penalty
      petState = await applyHpPenalty(req.userId, penaltyHp);
    } else {
      // partial — không tính combo, không mất combo
    }

    result.comboAtSubmit = newCombo;
    result.coinsEarned   = coinsEarned;

    session.currentCombo  = newCombo;
    session.totalScore   += aiResult.totalScore;
    session.currentIndex  = Math.max(session.currentIndex, resultIdx + 1);
    session.results[resultIdx] = result;
    session.markModified('results');
    await session.save();

    return res.json({
      success: true,
      data: {
        result: {
          itemId,
          status:           aiResult.status,
          aiScore:          aiResult.totalScore,
          feedback:         aiResult.feedback,
          naturalnessNote:  aiResult.naturalnessNote,
          missingWords:     aiResult.missingRequiredWords,
          comboAtSubmit:    newCombo,
          comboMultiplier:  comboMultiplier(newCombo),
          coinsEarned,
        },
        session: {
          currentCombo:      session.currentCombo,
          totalScore:        session.totalScore,
          totalCoinsEarned:  session.totalCoinsEarned,
          currentIndex:      session.currentIndex,
        },
        petState,
      },
    });
  } catch (err) {
    console.error('[ReverseTranslation] gradeItem:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /session/:sessionId/hint — mua hint cho một câu
// body: { itemId, hintType: 'first_letter' | 'grammar' | 'view_passage' }
// ─────────────────────────────────────────────────────────────────────────────
exports.buyHint = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { itemId, hintType } = req.body;

    if (!HINT_COSTS[hintType]) {
      return res.status(400).json({ success: false, message: `hintType không hợp lệ: ${hintType}` });
    }

    const session = await ReverseTranslationSession.findOne({
      _id: sessionId, userId: req.userId, status: 'in_progress',
    });
    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại' });

    const resultIdx = session.results.findIndex(r => r.itemId.toString() === itemId.toString());
    if (resultIdx === -1) return res.status(400).json({ success: false, message: 'itemId không hợp lệ' });

    const result = session.results[resultIdx];

    // Kiểm tra đã mua hint này chưa (tránh mua lại)
    if (result.hintsPurchased.includes(hintType)) {
      return res.status(400).json({ success: false, message: 'Đã mua hint này rồi' });
    }

    const cost = HINT_COSTS[hintType];

    // Trừ coins
    let coinsLeft;
    try {
      coinsLeft = await deductPetCoins(
        req.userId, cost, `hint_${hintType}`,
        `Mua gợi ý "${hintType}" (-${cost} 🪙)`
      );
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    // Ghi nhận hint đã mua
    result.hintsPurchased.push(hintType);
    result.hintCoinsPaid += cost;
    session.totalCoinsSpentOnHints += cost;
    session.results[resultIdx] = result;
    session.markModified('results');
    await session.save();

    // Lấy nội dung hint từ set
    const set = await ReverseTranslationSet.findById(session.setId).lean();
    const item = set?.items.find(i => i._id.toString() === itemId.toString());

    let hintContent = null;
    if (hintType === 'first_letter') {
      hintContent = item?.firstLetterHint || [];
    } else if (hintType === 'grammar') {
      hintContent = item?.grammarHint || 'Không có gợi ý ngữ pháp cho câu này.';
    } else if (hintType === 'view_passage') {
      // Trả về nội dung bài Reading gốc (từ sourceLesson)
      const Lesson = require('../models/Lesson');
      const lesson = set?.sourceLesson
        ? await Lesson.findById(set.sourceLesson).select('title nodes').lean()
        : null;
      hintContent = lesson
        ? { title: lesson.title, nodes: lesson.nodes }
        : 'Không có bài đọc nguồn.';
    }

    return res.json({
      success: true,
      data: {
        hintType,
        hintContent,
        cost,
        coinsLeft,
      },
    });
  } catch (err) {
    console.error('[ReverseTranslation] buyHint:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /session/:sessionId/complete — hoàn thành session, trao thưởng cuối
// ─────────────────────────────────────────────────────────────────────────────
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ReverseTranslationSession.findOne({
      _id: sessionId, userId: req.userId, status: 'in_progress',
    });
    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại' });

    const set = await ReverseTranslationSet.findById(session.setId).lean();
    const totalItems = set?.items?.length || 1;

    // Tính điểm trung bình
    const answeredResults = session.results.filter(r => r.status !== 'pending');
    const avgScore = answeredResults.length
      ? Math.round(session.totalScore / answeredResults.length)
      : 0;

    // Thưởng hoàn thành bộ đề (nếu avgScore >= 60)
    let bonusCoins = 0;
    let netCoins   = 0;
    if (avgScore >= 60) {
      const configBonus = await getNum('economy_reward_reading', 20);
      const setBonus    = set?.rewardCoins || 0;
      bonusCoins        = Math.max(configBonus, setBonus);

      try {
        const earnRes  = await earnCoins(req.userId, 'reverse_translation_complete', bonusCoins);
        bonusCoins     = earnRes.earned;
      } catch (e) {
        console.warn('[ReverseTranslation] completeSession earnCoins:', e.message);
      }
    }

    netCoins = session.totalCoinsEarned + bonusCoins - session.totalCoinsSpentOnHints;

    // Cập nhật session
    session.status       = 'completed';
    session.completedAt  = new Date();
    session.totalScore   = avgScore;
    await session.save();

    // Lấy petState mới nhất
    const pet      = await Pet.findOne({ user: req.userId });
    const petState = pet ? await getPetState(pet) : null;

    return res.json({
      success: true,
      data: {
        avgScore,
        totalCoinsEarned:      session.totalCoinsEarned,
        totalCoinsSpentOnHints: session.totalCoinsSpentOnHints,
        bonusCoins,
        netCoins,
        wrongCountFull:  session.wrongCountFull,
        results:         session.results,
        petState,
        pet: pet ? { coins: pet.coins, level: pet.level, hunger: pet.hunger } : null,
      },
    });
  } catch (err) {
    console.error('[ReverseTranslation] completeSession:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
