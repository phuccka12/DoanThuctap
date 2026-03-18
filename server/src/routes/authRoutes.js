const express = require("express");
const router = express.Router();
const passport = require("../config/passport");

const { protect, admin, vip } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { registerLimiter, loginLimiter, forgotLimiter } = require("../middlewares/rateLimiters");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} = require("../validators/authSchemas");

const { register, login, refresh, logout, logoutAll, changePassword } = require("../controllers/authController");
const {
  requestVerifyEmail,
  confirmVerifyEmail,
  forgotPassword,
  resetPassword
} = require("../controllers/authExtraController");
const { googleCallback } = require("../controllers/googleAuthController");
const User = require("../models/User");

// Health check / ping (used by MaintenancePage auto-retry)
router.get("/ping", (req, res) => res.json({ ok: true }));

// Level 2
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);
router.post("/change-password", protect, changePassword);

// Google OAuth routes - Đăng nhập
router.get("/google/login", (req, res, next) => {
  req.session.authType = 'login';
  passport.authenticate("google-login", { scope: ["profile", "email"] })(req, res, next);
});

// Google OAuth routes - Đăng ký
router.get("/google/register", (req, res, next) => {
  req.session.authType = 'register';
  passport.authenticate("google-register", { scope: ["profile", "email"] })(req, res, next);
});

// Chung 1 callback cho cả login và register
router.get("/google/callback", (req, res, next) => {
  const authType = req.session.authType || 'login';
  const strategy = authType === 'register' ? 'google-register' : 'google-login';
  const errorRedirect = authType === 'register' ? '/register' : '/login';
  const errorMessage = authType === 'register' ? 'account_exists' : 'account_not_found';

  passport.authenticate(strategy, { session: false }, (err, user, info) => {
    if (err) {
      console.error(`Google ${authType} error:`, err);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}${errorRedirect}?error=server_error`);
    }
    if (!user) {
      console.log(`Google ${authType} failed:`, info?.message);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}${errorRedirect}?error=${errorMessage}`);
    }
    req.user = user;
    googleCallback(req, res, next);
  })(req, res, next);
});

// Get current user info
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    // If user skipped onboarding entirely (no onboarding_completed and no declared level),
    // assign default beginner level (A1) and give a small subsidy (50 coins) once.
    if (!user.onboarding_completed && (!user.learning_preferences || !user.learning_preferences.current_level) && !user.onboarding_default_assigned) {
      if (!user.learning_preferences) user.learning_preferences = {};
      user.learning_preferences.current_level = 'a1';
      user.learning_preferences.wants_placement_check = false;
      if (!user.gamification_data) user.gamification_data = {};
      user.gamification_data.gold = (user.gamification_data.gold || 0) + 50; // subsidy for skipping
      user.onboarding_default_assigned = true;
      await user.save();
    }

    // [SINGLE SOURCE OF TRUTH] Lấy coins từ Pet + lấy level/exp từ Pet
    const Pet = require('../models/Pet');
    const userPet = await Pet.findOne({ user: req.userId });
    
    // Khởi tạo gamification_data nếu chưa có
    const gamification_data = user.gamification_data || {};
    if (userPet) {
      gamification_data.coins = userPet.coins;
      gamification_data.gold = userPet.coins; // Đề phòng frontend gọi thuộc tính gold
      gamification_data.level = userPet.level || 1;
      gamification_data.exp = userPet.growthPoints || 0;
      gamification_data.streak = userPet.streakCount || 0;
    }

    res.json({
      user: {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        role: user.role,
        status: user.status,
        vip_expire_at: user.vip_expire_at,
        email_verified: user.email_verified,
        gamification_data: gamification_data,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        onboarding_completed: user.onboarding_completed,
        learning_preferences: user.learning_preferences,
        placement_test_completed: user.placement_test_completed,
        placement_test_result: user.placement_test_result,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// Level 3
router.post("/verify-email/request", protect, requestVerifyEmail);
router.post("/verify-email/confirm", validate(verifyEmailSchema), confirmVerifyEmail);

router.post("/forgot-password", forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", forgotLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;
