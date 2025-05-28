const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // קבלת הטוקן מה-header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'אין טוקן אימות או הטוקן לא תקין'
      });
    }

    const token = authHeader.split(' ')[1];

    // אימות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');

    // חיפוש המשתמש במסד הנתונים
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'משתמש לא נמצא'
      });
    }

    // בדיקה שהמשתמש פעיל
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'חשבון המשתמש אינו פעיל'
      });
    }

    // הוספת המשתמש לבקשה
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'טוקן אימות לא תקין'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'טוקן אימות פג תוקף'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'שגיאה פנימית בשרת'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // אם אין טוקן, המשך בלי משתמש
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
    
    const user = await User.findById(decoded.userId).select('-password');
    req.user = user;
    
    next();
  } catch (error) {
    // במקרה של שגיאה, המשך בלי משתמש
    req.user = null;
    next();
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    { expiresIn: '30d' }
  );
};

module.exports = {
  authMiddleware,
  optionalAuth,
  generateToken,
  generateRefreshToken
}; 