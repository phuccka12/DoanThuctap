const User = require("../models/User");

/**
 * Save onboarding data for a user
 * POST /api/onboarding
 */
exports.saveOnboarding = async (req, res) => {
  try {
    const userId = req.userId; // Changed from req.user._id to req.userId (set by protect middleware)
    const {
      goal,
      target_band,
      current_level,
      study_hours_per_week,
      preferred_study_days,
      exam_date,
      focus_skills,
    } = req.body;

    // Validate required fields
    if (!goal || !current_level) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: goal và current_level",
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
          current_level,
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
