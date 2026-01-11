const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Strategy cho đăng nhập Google (chỉ cho phép nếu đã có tài khoản)
passport.use('google-login',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Use env GOOGLE_CALLBACK_URL if provided, otherwise build from PORT
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const emailLower = profile.emails[0].value.toLowerCase();
        
        // Tìm user với google_id hoặc email
        let user = await User.findOne({ 
          $or: [
            { google_id: profile.id },
            { email: emailLower }
          ]
        });

        if (!user) {
          // Không tìm thấy tài khoản
          return done(null, false, { message: 'Tài khoản chưa được đăng ký. Vui lòng đăng ký trước.' });
        }

        // Nếu tìm thấy bằng email nhưng chưa có google_id, liên kết
        if (!user.google_id) {
          user.google_id = profile.id;
          user.avatar = profile.photos[0]?.value || user.avatar;
          user.email_verified = true;
        }

        user.last_login_at = new Date();
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Strategy cho đăng ký Google (tạo tài khoản mới)
passport.use('google-register',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Use env GOOGLE_CALLBACK_URL if provided, otherwise build from PORT
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const emailLower = profile.emails[0].value.toLowerCase();
        
        // Kiểm tra user đã tồn tại chưa
        let user = await User.findOne({ 
          $or: [
            { google_id: profile.id },
            { email: emailLower }
          ]
        });

        if (user) {
          // Tài khoản đã tồn tại
          return done(null, false, { message: 'Email này đã được đăng ký. Vui lòng đăng nhập.' });
        }

        // Tạo user mới
        user = await User.create({
          google_id: profile.id,
          user_name: profile.displayName || profile.emails[0].value.split("@")[0],
          email: emailLower,
          password_hash: "google_oauth_no_password",
          avatar: profile.photos[0]?.value || null,
          email_verified: true,
          role: "standard",
          status: "active",
          gamification_data: { level: 1, gold: 0, exp: 0, streak: 0 },
          last_login_at: new Date(),
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
