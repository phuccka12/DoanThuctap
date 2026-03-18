const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Transaction = require('../models/Transaction');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const AIUsage = require('../models/AIUsage');

// Admin: Tạo user mới
exports.createUser = async (req, res) => {
  try {
    const { 
      email, 
      password,
      user_name, 
      role = 'standard',
      email_verified = false,
      onboarding_completed = false
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email đã được sử dụng'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      user_name: user_name || email.split('@')[0],
      role,
      email_verified,
      onboarding_completed,
      status: 'active',
      gamification_data: {
        level: 1,
        gold: 0,
        exp: 0,
        streak: 0
      }
    });

    await newUser.save();

    // Return user without sensitive fields
    const createdUser = await User.findById(newUser._id)
      .select('-password_hash -failed_login_attempts -lock_until');

    res.status(201).json({
      message: 'Tạo người dùng thành công',
      data: createdUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo người dùng'
    });
  }
};

// Admin: Lấy danh sách users với filter và pagination
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      status,
      onboarding_completed 
    } = req.query;
    
    const query = {};
    
    // Search by email or username
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { user_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by onboarding status
    if (onboarding_completed !== undefined) {
      query.onboarding_completed = onboarding_completed === 'true';
    }

    const users = await User.find(query)
      .select('-password_hash -failed_login_attempts -lock_until')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      message: 'Lấy danh sách người dùng thành công',
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách người dùng'
    });
  }
};

// Admin: Lấy chi tiết user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password_hash -failed_login_attempts -lock_until');
    
    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      message: 'Lấy thông tin người dùng thành công',
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin người dùng'
    });
  }
};

// Admin: Cập nhật thông tin user
exports.updateUser = async (req, res) => {
  try {
    const { 
      user_name, 
      role, 
      status, 
      email_verified,
      onboarding_completed,
      vip_expire_at,
      gamification_data 
    } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    // Update fields
    if (user_name !== undefined) user.user_name = user_name;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (email_verified !== undefined) user.email_verified = email_verified;
    if (onboarding_completed !== undefined) user.onboarding_completed = onboarding_completed;
    if (vip_expire_at !== undefined) user.vip_expire_at = vip_expire_at;
    if (gamification_data !== undefined) {
      user.gamification_data = { ...user.gamification_data, ...gamification_data };
    }

    await user.save();

    // Return user without sensitive fields
    const updatedUser = await User.findById(user._id)
      .select('-password_hash -failed_login_attempts -lock_until');

    res.json({
      message: 'Cập nhật người dùng thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật người dùng'
    });
  }
};

// Admin: Đổi mật khẩu người dùng
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password_hash = hashedPassword;
    
    // Reset lock fields if any
    user.failed_login_attempts = 0;
    user.lock_until = null;

    await user.save();

    res.json({
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      message: 'Lỗi server khi đặt lại mật khẩu'
    });
  }
};

// Admin: Ban/Unban user
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({
        message: 'Trạng thái không hợp lệ'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      message: `${status === 'banned' ? 'Cấm' : 'Kích hoạt'} người dùng thành công`,
      data: {
        _id: user._id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật trạng thái người dùng'
    });
  }
};

// Admin: Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        message: 'Không thể xóa tài khoản admin'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa người dùng'
    });
  }
};

// Admin: Thống kê users
exports.getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      standardUsers,
      vipUsers,
      adminUsers,
      verifiedUsers,
      onboardedUsers
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ role: 'standard' }),
      User.countDocuments({ role: 'vip' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ email_verified: true }),
      User.countDocuments({ onboarding_completed: true })
    ]);

    res.json({
      message: 'Lấy thống kê người dùng thành công',
      data: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        byRole: {
          standard: standardUsers,
          vip: vipUsers,
          admin: adminUsers
        },
        verified: verifiedUsers,
        onboarded: onboardedUsers
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê người dùng'
    });
  }
};

// ─── Admin: User Detail Profile (3 tabs) ───────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    const Pet = require('../models/Pet');
    const AIUsage = require('../models/AIUsage');
    const Transaction = require('../models/Transaction');
    const SubscriptionPlan = require('../models/SubscriptionPlan');

    const user = await User.findById(req.params.id)
      .select('-password_hash -failed_login_attempts -lock_until');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // [SINGLE SOURCE OF TRUTH] Sync gamification from Pet
    const userPet = await Pet.findOne({ user: user._id });
    const realGamification = {
      level:  userPet ? (userPet.level || 1) : (user.gamification_data?.level || 1),
      gold:   userPet ? (userPet.coins || 0) : (user.gamification_data?.gold || 0),
      exp:    userPet ? (userPet.growthPoints || 0) : (user.gamification_data?.exp || 0),
      streak: userPet ? (userPet.streakCount || 0) : (user.gamification_data?.streak || 0),
    };

    // Tab 1: Subscription info
    const latestSuccessTx = await Transaction.findOne({ user_id: user._id, status: 'success' })
      .sort({ created_at: -1 })
      .populate('plan_id', 'name slug color price_monthly quota');

    // Tab 2: AI usage (last 7 days)
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
    const dateRange = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo); d.setDate(sevenDaysAgo.getDate() + i);
      dateRange.push(d.toISOString().slice(0, 10));
    }
    const usageRecords = await AIUsage.find({ user_id: user._id, date: { $in: dateRange } });
    const todayUsage = usageRecords.find(u => u.date === todayStr) || {};
    const isAIBlocked = usageRecords.some(u => u.ai_blocked);

    // Tab 3: Learning progress & Stats
    const LessonProgress = require('../models/LessonProgress');
    const [lessonStats, exercisesCount, topicsCount] = await Promise.all([
      LessonProgress.aggregate([
        { $match: { userId: user._id, lessonId: { $ne: null } } },
        {
          $group: {
            _id: null,
            completedLessons: { $count: {} },
            avgScore: { $avg: "$score" },
            highestScore: { $max: "$score" },
            totalTimeSpent: { $sum: "$timeSpentSec" }
          }
        }
      ]),
      LessonProgress.countDocuments({ userId: user._id, lessonId: null, $or: [{ passageId: { $ne: null } }, { speakingId: { $ne: null } }] }),
      LessonProgress.distinct('topicId', { userId: user._id, topicId: { $ne: null } })
    ]);

    const stats = lessonStats[0] || { completedLessons: 0, avgScore: 0, highestScore: 0, totalTimeSpent: 0 };

    // Tab 3: Learning progress (transactions + gamification)
    const allTransactions = await Transaction.find({ user_id: user._id })
      .populate('plan_id', 'name slug color')
      .sort({ created_at: -1 })
      .limit(10);

    res.json({
      message: 'OK',
      data: {
        user,
        subscription: {
          current_plan: latestSuccessTx?.plan_id || null,
          expires_at: user.vip_expire_at,
          latest_tx: latestSuccessTx,
        },
        ai_usage: {
          today: {
            speaking_checks:      todayUsage.speaking_checks      || 0,
            writing_checks:       todayUsage.writing_checks       || 0,
            ai_chat_messages:     todayUsage.ai_chat_messages     || 0,
            ai_roleplay_sessions: todayUsage.ai_roleplay_sessions || 0,
          },
          weekly: dateRange.map(date => {
            const r = usageRecords.find(u => u.date === date) || {};
            return {
              date,
              speaking_checks:  r.speaking_checks  || 0,
              writing_checks:   r.writing_checks   || 0,
              ai_chat_messages: r.ai_chat_messages || 0,
            };
          }),
          is_blocked: isAIBlocked,
          blocked_record: usageRecords.find(u => u.ai_blocked) || null,
        },
        learning: {
          gamification: realGamification,
          preferences:  user.learning_preferences,
          transactions: allTransactions,
          progress_stats: {
            completed_lessons: stats.completedLessons,
            completed_exercises: exercisesCount,
            average_score: stats.avgScore,
            highest_score: stats.highestScore,
            total_study_time: stats.totalTimeSpent,
            topics_studied: topicsCount,
          }
        },
      }
    });
  } catch (e) {
    console.error('getUserProfile error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── Admin: Upgrade / Cancel subscription manually ────────────────────────────
exports.manualUpgradeUser = async (req, res) => {
  try {
    const { plan_id, months = 1, notes } = req.body;
    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) return res.status(404).json({ message: 'Không tìm thấy gói cước' });

    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(months));

    // Create transaction record
    await Transaction.create({
      user_id: req.params.id,
      plan_id,
      amount: plan.price_monthly * months,
      billing_cycle: 'monthly',
      gateway: 'manual',
      status: 'success',
      subscription_start: start,
      subscription_end: end,
      notes: notes || `Admin nâng cấp thủ công (${months} tháng)`,
      created_by_admin: true,
    });

    // Update user
    await User.findByIdAndUpdate(req.params.id, {
      role: plan.slug === 'free' ? 'standard' : 'vip',
      vip_expire_at: plan.slug === 'free' ? null : end,
    });

    res.json({ message: `Đã nâng cấp lên gói ${plan.name} thành công` });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.cancelUserSubscription = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: 'standard', vip_expire_at: null });
    res.json({ message: 'Đã hủy gói cước của người dùng' });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─── Admin: Block/Unblock AI for a user ───────────────────────────────────────
exports.toggleAIBlock = async (req, res) => {
  try {
    const { block, reason } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    await AIUsage.findOneAndUpdate(
      { user_id: req.params.id, date: today },
      {
        ai_blocked: block,
        blocked_reason: block ? (reason || 'Admin blocked') : '',
        blocked_by:  block ? req.user._id : null,
        blocked_at:  block ? new Date() : null,
      },
      { upsert: true, new: true }
    );

    res.json({ message: block ? 'Đã khóa AI cho người dùng' : 'Đã mở khóa AI cho người dùng' });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
