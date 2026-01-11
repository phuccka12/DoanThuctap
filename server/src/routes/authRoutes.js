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

const { register, login, refresh, logout, logoutAll } = require("../controllers/authController");
const {
  requestVerifyEmail,
  confirmVerifyEmail,
  forgotPassword,
  resetPassword
} = require("../controllers/authExtraController");
const { googleCallback } = require("../controllers/googleAuthController");
const User = require("../models/User");

// Level 2
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);

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
    res.json({ 
      user: {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        role: user.role,
        status: user.status,
        vip_expire_at: user.vip_expire_at,
        email_verified: user.email_verified,
        gamification_data: user.gamification_data,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        onboarding_completed: user.onboarding_completed, // ← THÊM DÒNG NÀY
        learning_preferences: user.learning_preferences  // ← VÀ DÒNG NÀY
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
