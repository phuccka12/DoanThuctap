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
    const { user_name, email, password } = req.body;

    if (!user_name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ user_name, email, mật khẩu" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const emailLower = String(email).toLowerCase().trim();
    const existed = await User.findOne({ email: emailLower });
    if (existed) return res.status(409).json({ message: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      user_name: user_name.trim(),
      email: emailLower,
      password_hash: hashedPassword,
      role: "standard",
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        user_name: user.user_name,
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

    if (user.lock_until && user.lock_until > new Date()) {
      return res.status(423).json({ message: "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau." });
    }

    // nếu hết hạn VIP thì tự hạ xuống standard
    if (user.role === "vip" && user.vip_expire_at && user.vip_expire_at < new Date()) {
      user.role = "standard";
      user.vip_expire_at = null;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    
    user.failed_login_attempts = 0;
    user.lock_until = null;
    user.last_login_at = new Date();
    await user.save();

    const token = signToken(user);

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        user_name: user.user_name,
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

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user_id);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Check VIP expiry
    if (user.role === "vip" && user.vip_expire_at && user.vip_expire_at < new Date()) {
      user.role = "standard";
      user.vip_expire_at = null;
      await user.save();
    }

    const newToken = signToken(user);

    return res.json({
      message: "Làm mới token thành công",
      token: newToken,
      user: {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        role: user.role,
        vip_expire_at: user.vip_expire_at,
        gamification_data: user.gamification_data,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ", error: err.message });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // For JWT, we can't invalidate token on server side
    // Client should remove token from storage
    return res.json({ message: "Đăng xuất thành công" });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/auth/logout-all
exports.logoutAll = async (req, res) => {
  try {
    // This would require a session management system
    // For now, just return success message
    return res.json({ message: "Đăng xuất khỏi tất cả thiết bị thành công" });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
