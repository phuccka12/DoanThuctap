const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const signAccessToken = (user) => {
  return jwt.sign(
    { user_id: user._id.toString(), role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );
};

const signRefreshToken = (user, jti) => {
  return jwt.sign(
    { user_id: user._id.toString(), jti },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d" }
  );
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const newJti = () => uuidv4();

module.exports = { signAccessToken, signRefreshToken, hashToken, newJti };
