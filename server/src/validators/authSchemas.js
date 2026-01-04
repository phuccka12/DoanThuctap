const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    user_name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(72),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    new_password: z.string().min(6).max(72),
  })
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
};
