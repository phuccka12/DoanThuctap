/**
 * userController.js
 * GET  /api/user/profile  — fetch full profile for logged-in user
 * PUT  /api/user/profile  — update editable profile fields
 */
const User = require('../models/User');
const Pet = require('../models/Pet');
const CoinLog = require('../models/CoinLog');

// Allowed editable fields (whitelist)
const EDITABLE = ['user_name', 'phone', 'date_of_birth', 'address', 'bio', 'current_band', 'avatar'];

// ─── GET profile ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // [SINGLE SOURCE OF TRUTH] Sync coins, level, exp, streak from Pet directly
    const userPet = await Pet.findOne({ user: req.userId });
    const realCoins = userPet ? userPet.coins : (user.gamification_data?.gold || 0);
    const realLevel = userPet ? (userPet.level || 1) : (user.gamification_data?.level || 1);
    const realExp = userPet ? (userPet.growthPoints || 0) : (user.gamification_data?.exp || 0);
    const realStreak = userPet ? (userPet.streakCount || 0) : (user.gamification_data?.streak || 0);

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
          level:  realLevel,
          exp:    realExp,
          streak: realStreak,
          gold:   realCoins,
          coins:  realCoins
        },
        // placement
        placement_test_completed: user.placement_test_completed || false,
        placement_test_result:    user.placement_test_result    || null,
        // settings
        settings: user.settings || { ai_voice: 'female', ai_speed: 1.0, notifications_enabled: true },
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

    // Update settings if provided
    const { settings } = req.body;
    if (settings) {
      if (!user.settings) user.settings = {};
      if (settings.ai_voice !== undefined) user.settings.ai_voice = settings.ai_voice;
      if (settings.ai_speed !== undefined) user.settings.ai_speed = settings.ai_speed;
      if (settings.notifications_enabled !== undefined) user.settings.notifications_enabled = settings.notifications_enabled;
      user.markModified('settings');
    }

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
        settings: user.settings || {},
      },
    });
  } catch (err) {
    console.error('[userController] updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── GET coin history ─────────────────────────────────────────────────────────
exports.getCoinHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const history = await CoinLog.find({ user: req.userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CoinLog.countDocuments({ user: req.userId });

    return res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[userController] getCoinHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
