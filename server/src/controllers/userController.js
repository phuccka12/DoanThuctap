/**
 * userController.js
 * GET  /api/user/profile  — fetch full profile for logged-in user
 * PUT  /api/user/profile  — update editable profile fields
 */
const User = require('../models/User');

// Allowed editable fields (whitelist)
const EDITABLE = ['user_name', 'phone', 'date_of_birth', 'address', 'bio', 'current_band', 'avatar'];

// ─── GET profile ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      profile: {
        // identity
        id:            user._id,
        user_name:     user.user_name,
        email:         user.email,
        avatar:        user.avatar || null,
        phone:         user.phone || null,
        date_of_birth: user.date_of_birth || null,
        address:       user.address || null,
        bio:           user.bio || null,
        role:          user.role,
        email_verified: user.email_verified,
        created_at:    user.created_at,
        // IELTS scores
        current_band:  user.current_band || null,
        target_band:   user.learning_preferences?.target_band || null,
        // learning prefs
        learning_preferences: user.learning_preferences || {},
        // gamification
        gamification: {
          level:  user.gamification_data?.level  || 1,
          exp:    user.gamification_data?.exp    || 0,
          streak: user.gamification_data?.streak || 0,
          gold:   user.gamification_data?.gold   || 0,
        },
        // placement
        placement_test_completed: user.placement_test_completed || false,
        placement_test_result:    user.placement_test_result    || null,
      },
    });
  } catch (err) {
    console.error('[userController] getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUT profile ─────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only apply whitelisted fields
    EDITABLE.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field] || null;
      }
    });

    // Update learning_preferences sub-fields if provided
    const { target_band, goal, study_hours_per_week, preferred_study_days, exam_date, focus_skills } = req.body;
    if (!user.learning_preferences) user.learning_preferences = {};
    if (target_band          !== undefined) user.learning_preferences.target_band          = target_band || null;
    if (goal                 !== undefined) user.learning_preferences.goal                 = goal || null;
    if (study_hours_per_week !== undefined) user.learning_preferences.study_hours_per_week = study_hours_per_week || null;
    if (preferred_study_days !== undefined) user.learning_preferences.preferred_study_days = preferred_study_days || [];
    if (exam_date            !== undefined) user.learning_preferences.exam_date            = exam_date || null;
    if (focus_skills         !== undefined) user.learning_preferences.focus_skills         = focus_skills || [];

    user.markModified('learning_preferences');
    await user.save();

    return res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      profile: {
        id:            user._id,
        user_name:     user.user_name,
        email:         user.email,
        avatar:        user.avatar || null,
        phone:         user.phone || null,
        date_of_birth: user.date_of_birth || null,
        address:       user.address || null,
        bio:           user.bio || null,
        current_band:  user.current_band || null,
        learning_preferences: user.learning_preferences || {},
        gamification: {
          level:  user.gamification_data?.level  || 1,
          exp:    user.gamification_data?.exp    || 0,
          streak: user.gamification_data?.streak || 0,
          gold:   user.gamification_data?.gold   || 0,
        },
      },
    });
  } catch (err) {
    console.error('[userController] updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
