const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Yêu cầu xác thực'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Chỉ admin mới có quyền truy cập'
    });
  }

  next();
};

module.exports = requireAdmin;