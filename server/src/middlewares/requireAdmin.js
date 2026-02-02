const requireAdmin = (req, res, next) => {
  // Check if protect middleware has run (sets req.userId and req.userRole)
  if (!req.userId || !req.userRole) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực'
    });
  }

  // Check if user is admin
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền truy cập'
    });
  }

  next();
};

module.exports = requireAdmin;