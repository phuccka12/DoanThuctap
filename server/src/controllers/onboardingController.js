const User = require("../models/User");
const Pet  = require("../models/Pet");

/**
 * Save onboarding data for a user
 * POST /api/onboarding
 */
exports.saveOnboarding = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      goal,
      target_band,
      current_level,
      study_hours_per_week,
      preferred_study_days,
      exam_date,
      focus_skills,
      wants_placement_check,
      egg_type,             // new: trứng user đã chọn ở bước 6
    } = req.body;

    // Validate required fields. If user requests placement check, current_level may be omitted.
    if (!goal || (!current_level && !wants_placement_check)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: goal và current_level (hoặc chọn kiểm tra trình độ)",
      });
    }

    // ── Guard: tài khoản đã làm onboarding rồi → không cho làm lại ──
    const existingUser = await User.findById(userId).select('onboarding_completed');
    if (existingUser?.onboarding_completed) {
      return res.status(200).json({
        success: true,
        message: "Onboarding đã hoàn thành trước đó",
        alreadyCompleted: true,
      });
    }

    // Update user with onboarding data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        onboarding_completed: true,
        learning_preferences: {
          goal,
          target_band: target_band || null,
          current_level: current_level || null,
          wants_placement_check: !!wants_placement_check,
          study_hours_per_week: study_hours_per_week || null,
          preferred_study_days: preferred_study_days || [],
          exam_date: exam_date || null,
          focus_skills: focus_skills || [],
        },
      },
      { new: true, runValidators: true }
    ).select("-password_hash");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // ── Tạo / cập nhật pet record với egg_type ──────────────────────────────
    // egg_type hợp lệ: fire / ice / leaf / default
    // Nếu user không chọn (e.g. skip toàn bộ onboarding) → 'default' (Slime)
    const validEgg = ['fire', 'ice', 'leaf'].includes(egg_type) ? egg_type : 'default';
    try {
      let pet = await Pet.findOne({ user: userId });
      if (!pet) {
        pet = new Pet({ user: userId });
      }
      // Chỉ cập nhật nếu chưa nở (tránh ghi đè pet đã được hatch)
      if (!pet.hatched) {
        pet.egg_type = validEgg;
        pet.hatched  = false;
        await pet.save();
      }
    } catch (petErr) {
      // Không nên fail toàn bộ onboarding chỉ vì pet record
      console.error('[Onboarding] pet upsert error:', petErr.message);
    }

    // If the user explicitly chose NOT to take placement check and provided a current_level,
    // apply the skip-placement shortcut so we trust their self-assessment immediately.
    if (!wants_placement_check && current_level) {
      // fire-and-forget; function handles errors internally
      applySkipPlacementFromOnboarding(userId, current_level);
    }

    return res.status(200).json({
      success: true,
      message: "Đã lưu thông tin onboarding thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error saving onboarding:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lưu dữ liệu onboarding",
      error: error.message,
    });
  }
};

// If user explicitly skipped placement check (i.e., provided current_level and wants_placement_check=false)
// we also set a minimal placement_result based on their declared level and award a small subsidy (50 coins).
// This ensures the backend "trusts" the user's self-assessment immediately.
async function applySkipPlacementFromOnboarding(userId, current_level) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return;

    const map = {
      stranger: 'A1',
      old_friend: 'A2',
      learning: 'B1',
      close_friend: 'B2',
    };
    const band = (current_level && map[current_level]) ? map[current_level] : 'A1';
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
    if (!user.gamification_data) user.gamification_data = {};
    user.gamification_data.gold = (user.gamification_data.gold || 0) + 50;
    if (!user.learning_preferences) user.learning_preferences = {};
    user.learning_preferences.current_level = band.toLowerCase();
    user.learning_preferences.wants_placement_check = false;

    user.markModified('gamification_data');
    user.markModified('learning_preferences');
    user.markModified('placement_test_result');
    await user.save();
  } catch (err) {
    console.error('[Onboarding] applySkipPlacementFromOnboarding error:', err);
  }
}

/**
 * Get onboarding status
 * GET /api/onboarding/status
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const userId = req.userId; // Changed from req.user._id to req.userId

    const user = await User.findById(userId).select(
      "onboarding_completed learning_preferences"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      onboarding_completed: user.onboarding_completed,
      learning_preferences: user.learning_preferences,
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trạng thái onboarding",
      error: error.message,
    });
  }
};
