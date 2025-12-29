const rateLimit = require("express-rate-limit");

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều lần đăng ký, thử lại sau." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Quá nhiều lần đăng nhập, thử lại sau." },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều yêu cầu, thử lại sau." },
});

module.exports = { registerLimiter, loginLimiter, forgotLimiter };
