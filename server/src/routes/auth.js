const express = require('express');
const router = express.Router();
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, generateToken, generateRefreshToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': 'שם משתמש חייב להכיל לפחות 3 תווים',
    'string.max': 'שם משתמש לא יכול להכיל יותר מ-30 תווים',
    'any.required': 'שם משתמש נדרש'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'כתובת מייל לא תקינה',
    'any.required': 'כתובת מייל נדרשת'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'סיסמה חייבת להכיל לפחות 6 תווים',
    'any.required': 'סיסמה נדרשת'
  }),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'כתובת מייל לא תקינה',
    'any.required': 'כתובת מייל נדרשת'
  }),
  password: Joi.string().required().messages({
    'any.required': 'סיסמה נדרשת'
  })
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  // Validation
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: error.details[0].message
      }
    });
  }

  const { username, email, password, firstName, lastName } = value;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'DuplicateField',
        message: 'משתמש עם כתובת מייל או שם משתמש זה כבר קיים'
      }
    });
  }

  // Create user
  const user = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    firstName,
    lastName
  });

  await user.save();

  // Generate tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update last login
  await user.updateLastLogin();

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    },
    message: 'הרשמה הושלמה בהצלחה'
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  // Validation
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: error.details[0].message
      }
    });
  }

  const { email, password } = value;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'כתובת מייל או סיסמה שגויים'
      }
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'חשבון המשתמש אינו פעיל'
      }
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'כתובת מייל או סיסמה שגויים'
      }
    });
  }

  // Generate tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update last login
  await user.updateLastLogin();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    },
    message: 'התחברות הושלמה בהצלחה'
  });
}));

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token - client side)
// @access  Private
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({
    success: true,
    message: 'יציאה הושלמה בהצלחה'
  });
}));

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('emailAccounts', 'name email provider status')
    .select('-password');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        emailAccounts: user.emailAccounts,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const updateSchema = Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    username: Joi.string().min(3).max(30).optional()
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: error.details[0].message
      }
    });
  }

  // Check if username is taken (if being updated)
  if (value.username && value.username !== req.user.username) {
    const existingUser = await User.findOne({ 
      username: value.username.toLowerCase(),
      _id: { $ne: req.user.id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'DuplicateField',
          message: 'שם משתמש זה כבר תפוס'
        }
      });
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { 
      ...value,
      ...(value.username && { username: value.username.toLowerCase() })
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    data: {
      user: updatedUser
    },
    message: 'פרופיל עודכן בהצלחה'
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Refresh token נדרש'
      }
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production'
    );

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const accessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Refresh token לא תקין או פג תוקף'
      }
    });
  }
}));

module.exports = router; 