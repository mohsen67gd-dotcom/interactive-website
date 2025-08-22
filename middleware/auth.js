const jwt = require('jsonwebtoken');
const User = require('../models/User');
// const rateLimit = require('express-rate-limit');

// Rate limiting middleware (temporarily disabled)
/*
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ 
        message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.' 
      });
    }
  });
};

// Rate limiters for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'تعداد تلاش‌های ورود بیش از حد مجاز است');
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'تعداد درخواست‌های شما بیش از حد مجاز است');
const adminLimiter = createRateLimiter(15 * 60 * 1000, 200, 'تعداد درخواست‌های شما بیش از حد مجاز است');
*/

// Temporary placeholder functions
const authLimiter = (req, res, next) => next();
const generalLimiter = (req, res, next) => next();
const adminLimiter = (req, res, next) => next();

// Middleware to check authentication
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'توکن احراز هویت یافت نشد' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'حساب کاربری شما غیرفعال شده است' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'توکن نامعتبر است' });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'توکن احراز هویت یافت نشد' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'حساب کاربری شما غیرفعال شده است' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'توکن نامعتبر است' });
  }
};

// Security middleware
const securityMiddleware = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;");
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS and injection attempts
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  authLimiter,
  generalLimiter,
  adminLimiter,
  securityMiddleware,
  sanitizeInput
};
