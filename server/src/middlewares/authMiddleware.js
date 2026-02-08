const jwt = require('jsonwebtoken');

// Middleware kiểm tra JWT token
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra token trong Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

      // Gắn user ID vào request (decoded có user_id, không phải id)
      req.userId = decoded.user_id;
      req.userRole = decoded.role;

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  // Kiểm tra token trong cookie (nếu không có trong header)
  if (!token && req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
      req.userId = decoded.user_id;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      console.error('Cookie token verification failed:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

// Middleware kiểm tra role admin
const requireAdmin = (req, res, next) => {
  if (req.userRole && req.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Not authorized as admin' 
    });
  }
};

// Alias for backward compatibility
const admin = requireAdmin;

// Middleware kiểm tra role VIP
const vip = (req, res, next) => {
  if (req.userRole && (req.userRole === 'vip' || req.userRole === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'VIP access required' 
    });
  }
};

module.exports = { protect, requireAdmin, admin, vip };