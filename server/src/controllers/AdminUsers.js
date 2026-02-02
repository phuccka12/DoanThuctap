const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
