const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
  return jwt.sign(
    { user_id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ họ tên, email, mật khẩu" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const emailLower = String(email).toLowerCase().trim();
    const existed = await User.findOne({ email: emailLower });
    if (existed) return res.status(409).json({ message: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      full_name: full_name.trim(),
      email: emailLower,
      password_hash,
      role: "standard",
      status: "active",
      gamification_data: { level: 1, gold: 0, exp: 0, streak: 0 },
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        vip_expire_at: user.vip_expire_at,
        gamification_data: user.gamification_data,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });

    const emailLower = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    if (user.status === "banned")
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    // nếu hết hạn VIP thì tự hạ xuống standard (tuỳ bạn)
    if (user.role === "vip" && user.vip_expire_at && user.vip_expire_at < new Date()) {
      user.role = "standard";
      user.vip_expire_at = null;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    user.last_login_at = new Date();
    await user.save();

    const token = signToken(user);

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        vip_expire_at: user.vip_expire_at,
        gamification_data: user.gamification_data,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
