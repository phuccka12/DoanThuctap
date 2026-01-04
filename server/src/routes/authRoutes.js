const express = require("express");
const router = express.Router();

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
const User = require("../models/User");

// Level 2
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);

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
        created_at: user.created_at
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
