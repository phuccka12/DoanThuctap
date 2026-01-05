const Session = require("../models/Session");
const { signAccessToken, signRefreshToken, hashToken, newJti } = require("../utils/token");

const cookieOptions = () => ({
  httpOnly: true,
  secure: String(process.env.COOKIE_SECURE).toLowerCase() === "true",
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
  path: "/api/auth/refresh",
});

// Callback sau khi Google xác thực
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=auth_failed`);
    }

    // Tạo access token và refresh token
    const accessToken = signAccessToken(user);
    const jti = newJti();
    const refreshToken = signRefreshToken(user, jti);

    // Lưu session vào database
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
    await Session.create({
      user_id: user._id,
      refresh_token_hash: hashToken(refreshToken),
      jti,
      user_agent: req.headers["user-agent"] || "",
      ip: req.ip || "",
      expires_at: expiresAt,
      last_used_at: new Date(),
    });

    // Set cookie
    res.cookie("refresh_token", refreshToken, cookieOptions());

    // Redirect về frontend với access token
    const redirectUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/google/callback?token=${accessToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=server_error`);
  }
};
