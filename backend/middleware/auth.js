const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token && token !== 'null' && token !== 'undefined') {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
    next();
  } catch (error) {
    // If token is invalid or expired, continue without setting req.user
    next();
  }
};

const adminOnly = (req, res, next) => {
  const allowed = ['gokulsurya021@gmail.com', 'admin@mlpkids.com', (process.env.ADMIN_EMAIL || '').toLowerCase()].filter(Boolean);
  if (req.user && (req.user.role === 'admin' || allowed.includes(req.user.email?.toLowerCase()))) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Admin block is restricted strictly to authorized administrator.'
  });
};

module.exports = { protect, optionalAuth, adminOnly };
