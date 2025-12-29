const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Thiếu access token" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.user_id).select("-password_hash");
    if (!user) return res.status(401).json({ message: "Token không hợp lệ" });
    if (user.status === "banned") return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Access token hết hạn hoặc không hợp lệ" });
  }
};

module.exports = authMiddleware;
