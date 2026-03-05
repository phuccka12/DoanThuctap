/**
 * Placement Test Controller
 * POST /api/placement/submit  — grade answers, save result, award coins
 */
const User = require('../models/User');

// ─── scoring weights ────────────────────────────────────────────────────────
// Section max scores: vocab 40 | reading 35 | speaking 25 → total 100
const VOCAB_PER_Q   = 40 / 3; // ≈ 13.3 per correct vocab answer
const READING_PER_Q = 35 / 2; // 17.5 per correct reading answer
const SPEAKING_MAX  = 25;     // speaking scored by pronunciation ratio

// CEFR bands
function cefrLevel(score) {
  // Award coins by resulting band: A1/A2 => 300, B1/B2 => 200, C1/C2 => 100
  if (score <= 30) return { cefr: 'A1/A2', label: 'Mất gốc',   band: 'A1', coins: 300, ielts: '3.0–4.0' };
  if (score <= 70) return { cefr: 'B1/B2', label: 'Trung cấp', band: 'B1', coins: 200, ielts: '5.0–6.5' };
  return               { cefr: 'C1/C2', label: 'Cao thủ',   band: 'C1', coins: 100, ielts: '7.0–8.0' };
}

// ─── correct answer keys (hardcoded for the static question set) ─────────────
// Section 1 – Vocab/Grammar (3 MCQ)
// q0=easy A1, q1=medium B1, q2=hard C1
const VOCAB_ANSWERS = ['b', 'c', 'a']; // answer index 0=a, 1=b, 2=c, 3=d → letter

// Section 2 – Reading (2 MCQ)
const READING_ANSWERS = ['c', 'b'];

/**
 * POST /api/placement/submit
 * body: {
 *   vocab:    ['b', 'a', 'c'],       // user's answer letters for 3 vocab q's
 *   reading:  ['c', 'b'],            // user's answer letters for 2 reading q's
 *   speaking: { score: 0.82 }        // pronunciation ratio 0-1 from frontend
 * }
 */
exports.submitPlacement = async (req, res) => {
  try {
    const userId = req.userId;
    const { vocab = [], reading = [], speaking = {} } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorised' });
    }

    // ── Section 1: Vocabulary/Grammar ────────────────────────────────────────
    let vocabScore = 0;
    vocab.forEach((ans, i) => {
      if (ans === VOCAB_ANSWERS[i]) vocabScore += VOCAB_PER_Q;
    });
    vocabScore = Math.round(vocabScore);

    // ── Section 2: Reading ────────────────────────────────────────────────────
    let readingScore = 0;
    reading.forEach((ans, i) => {
      if (ans === READING_ANSWERS[i]) readingScore += READING_PER_Q;
    });
    readingScore = Math.round(readingScore);

    // ── Section 3: Speaking (pronunciation ratio → 0-25) ─────────────────────
    const pronRatio    = Math.min(1, Math.max(0, speaking.score || 0));
    const speakingScore = Math.round(pronRatio * SPEAKING_MAX);

    const totalScore = Math.min(100, vocabScore + readingScore + speakingScore);
    const { cefr, label, band, coins, ielts } = cefrLevel(totalScore);

    // ── Save to DB ────────────────────────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.placement_test_completed = true;
    user.placement_test_result = {
      score:          totalScore,
      cefr_level:     band,
      vocab_score:    vocabScore,
      reading_score:  readingScore,
      speaking_score: speakingScore,
      completed_at:   new Date(),
    };

  // Award coins (include any active bonus stored on user, then clear it)
  if (!user.gamification_data) user.gamification_data = {};
  const bonus = user.placement_test_bonus || 0;
  const totalCoins = (coins || 0) + (bonus || 0);
  user.gamification_data.gold = (user.gamification_data.gold || 0) + totalCoins;
  // clear bonus after use
  user.placement_test_bonus = 0;

    // Also update learning_preferences.current_level based on result
    if (!user.learning_preferences) user.learning_preferences = {};
    user.learning_preferences.current_level = band.toLowerCase();
    user.learning_preferences.wants_placement_check = false;

    user.markModified('gamification_data');
    user.markModified('learning_preferences');
    user.markModified('placement_test_result');
    await user.save();

    return res.json({
      success: true,
      result: {
        totalScore,
        vocabScore,
        readingScore,
        speakingScore,
        cefr,
        band,
        label,
        ieltsEstimate: ielts,
        coinsAwarded: totalCoins,
      },
    });
  } catch (err) {
    console.error('[PlacementController] submitPlacement error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/**
 * POST /api/placement/skip
 * Accepts optional body.current_level (string from onboarding). If provided, trust user's self-assessed level,
 * map to an internal band and set a minimal placement_result. This path awards a small 50-coin subsidy (penalty)
 * instead of the full test reward.
 */
exports.skipPlacement = async (req, res) => {
  try {
    const userId = req.userId;
    const { current_level } = req.body || {};
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // map onboarding current_level keys to band
    const map = {
      stranger: 'A1',       // Mới bắt đầu
      old_friend: 'A2',     // Cơ bản
      learning: 'B1',       // Trung bình / Tạm ổn
      close_friend: 'B2',   // Khá tốt
    };
    const band = (current_level && map[current_level]) ? map[current_level] : (user.learning_preferences?.current_level || 'A1');

    // Representative total score by band (used for display)
    const repScores = { A1: 20, A2: 28, B1: 50, B2: 65, C1: 80, C2: 90 };
    const totalScore = repScores[band] || 20;

    user.placement_test_completed = true;
    user.placement_test_result = {
      score: totalScore,
      cefr_level: band,
      vocab_score: 0,
      reading_score: 0,
      speaking_score: 0,
      completed_at: new Date(),
    };

    // Award the small subsidy (penalty path)
    if (!user.gamification_data) user.gamification_data = {};
    const subsidy = 50;
    user.gamification_data.gold = (user.gamification_data.gold || 0) + subsidy;

    if (!user.learning_preferences) user.learning_preferences = {};
    user.learning_preferences.current_level = band.toLowerCase();
    user.learning_preferences.wants_placement_check = false;

    // persist
    user.markModified('gamification_data');
    user.markModified('learning_preferences');
    user.markModified('placement_test_result');
    await user.save();

    return res.json({
      success: true,
      message: 'Placement skipped. User level set from onboarding and subsidy applied.',
      result: {
        totalScore,
        band,
        coinsAwarded: subsidy,
      },
    });
  } catch (err) {
    console.error('[PlacementController] skipPlacement error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/**
 * POST /api/placement/start-bonus
 * Lightweight endpoint to register a one-time bonus for retaking placement test.
 * The UI calls this when the user clicks the small "retake +200 coins" button, then navigates to the test.
 */
exports.startPlacementBonus = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorised' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.placement_test_bonus = 200; // stored until submitPlacement consumes it
    await user.save();
    return res.json({ success: true, message: 'Bonus registered' });
  } catch (err) {
    console.error('[PlacementController] startPlacementBonus error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/placement/result
 * Returns the saved placement result for the authenticated user
 */
exports.getPlacementResult = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'placement_test_completed placement_test_result gamification_data'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      completed: user.placement_test_completed,
      result:    user.placement_test_result,
      coins:     user.gamification_data?.gold || 0,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
