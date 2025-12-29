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

// Level 2
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);
router.get("/me", protect, (req, res) => res.json({ user: req.user }));

// Level 3
router.post("/verify-email/request", protect, requestVerifyEmail);
router.post("/verify-email/confirm", validate(verifyEmailSchema), confirmVerifyEmail);

router.post("/forgot-password", forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", forgotLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;
