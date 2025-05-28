const express = require('express');
const router = express.Router();
const Joi = require('joi');
const EmailAccount = require('../models/EmailAccount');
const User = require('../models/User');
const EmailTestService = require('../services/emailTestService');
const ProviderService = require('../services/providerService');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Validation schemas
const createAccountSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'שם החשבון נדרש',
    'string.max': 'שם החשבון לא יכול להכיל יותר מ-100 תווים',
    'any.required': 'שם החשבון נדרש'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'כתובת מייל לא תקינה',
    'any.required': 'כתובת מייל נדרשת'
  }),
  password: Joi.string().min(1).required().messages({
    'string.min': 'סיסמה נדרשת',
    'any.required': 'סיסמה נדרשת'
  }),
  provider: Joi.string().valid('gmail', 'outlook', 'yahoo', 'icloud', 'custom').required(),
  settings: Joi.object({
    imap: Joi.object({
      server: Joi.string().required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      ssl: Joi.boolean().required(),
      auth: Joi.string().valid('normal', 'oauth2').default('normal')
    }).required(),
    smtp: Joi.object({
      server: Joi.string().required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      ssl: Joi.boolean().default(false),
      tls: Joi.boolean().default(true),
      auth: Joi.string().valid('normal', 'oauth2').default('normal')
    }).required(),
    sync: Joi.object({
      enabled: Joi.boolean().default(true),
      interval: Joi.number().integer().min(1).max(60).default(5),
      folders: Joi.array().items(Joi.string()).default(['INBOX'])
    }).optional()
  }).required()
});

// @route   GET /api/accounts
// @desc    Get all email accounts for current user
// @access  Private
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const accounts = await EmailAccount.find({ 
    user: req.user.id, 
    isActive: true 
  }).select('-password').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      accounts,
      count: accounts.length
    }
  });
}));

// @route   GET /api/accounts/:id
// @desc    Get specific email account
// @access  Private
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  }).select('-password');

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'חשבון מייל לא נמצא'
      }
    });
  }

  res.json({
    success: true,
    data: {
      account
    }
  });
}));

// @route   POST /api/accounts
// @desc    Create new email account
// @access  Private
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  // Validation
  const { error, value } = createAccountSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: error.details[0].message
      }
    });
  }

  const { name, email, password, provider, settings } = value;

  // Check if email account already exists for this user
  const existingAccount = await EmailAccount.findOne({
    user: req.user.id,
    email: email.toLowerCase(),
    isActive: true
  });

  if (existingAccount) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'DuplicateField',
        message: 'חשבון מייל זה כבר קיים'
      }
    });
  }

  // Create account
  const account = new EmailAccount({
    user: req.user.id,
    name,
    email: email.toLowerCase(),
    password,
    provider,
    settings: {
      ...settings,
      sync: settings.sync || {
        enabled: true,
        interval: 5,
        folders: ['INBOX']
      }
    }
  });

  await account.save();

  // Add account to user's emailAccounts array
  await User.findByIdAndUpdate(req.user.id, {
    $push: { emailAccounts: account._id }
  });

  // Return account without password
  const createdAccount = await EmailAccount.findById(account._id).select('-password');

  res.status(201).json({
    success: true,
    data: {
      account: createdAccount
    },
    message: 'חשבון מייל נוצר בהצלחה'
  });
}));

// @route   PUT /api/accounts/:id
// @desc    Update email account
// @access  Private
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const updateSchema = createAccountSchema.fork(['email', 'provider'], (schema) => schema.optional());

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

  const account = await EmailAccount.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'חשבון מייל לא נמצא'
      }
    });
  }

  // Update account
  Object.assign(account, value);
  account.status = 'disconnected'; // Reset status after update
  await account.save();

  // Return updated account without password
  const updatedAccount = await EmailAccount.findById(account._id).select('-password');

  res.json({
    success: true,
    data: {
      account: updatedAccount
    },
    message: 'חשבון מייל עודכן בהצלחה'
  });
}));

// @route   DELETE /api/accounts/:id
// @desc    Delete email account
// @access  Private
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'חשבון מייל לא נמצא'
      }
    });
  }

  // Soft delete - mark as inactive
  account.isActive = false;
  await account.save();

  // Remove from user's emailAccounts array
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { emailAccounts: account._id }
  });

  res.json({
    success: true,
    message: 'חשבון מייל נמחק בהצלחה'
  });
}));

// @route   POST /api/accounts/:id/test
// @desc    Test email account connection
// @access  Private
router.post('/:id/test', authMiddleware, asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'חשבון מייל לא נמצא'
      }
    });
  }

  // Update status to testing
  await account.updateStatus('testing');

  try {
    // Test connection
    const testConfig = {
      email: account.email,
      password: account.getDecryptedPassword(),
      settings: account.settings
    };

    const testResult = await EmailTestService.testConnection(testConfig);

    // Update account status based on test result
    if (testResult.success) {
      await account.updateStatus('connected');
    } else {
      const errorMessage = testResult.imap.error || testResult.smtp.error || 'Connection failed';
      await account.updateStatus('error', new Error(errorMessage));
    }

    res.json({
      success: true,
      data: {
        testResult,
        account: {
          id: account._id,
          status: testResult.success ? 'connected' : 'error'
        }
      },
      message: testResult.success ? 'בדיקת החיבור הצליחה' : 'בדיקת החיבור נכשלה'
    });

  } catch (error) {
    // Update status to error
    await account.updateStatus('error', error);

    res.status(400).json({
      success: false,
      error: {
        type: 'EmailConnectionError',
        message: 'שגיאה בבדיקת החיבור',
        details: error.message
      }
    });
  }
}));

// @route   POST /api/accounts/test-quick
// @desc    Quick test with email credentials (without saving)
// @access  Private
router.post('/test-quick', authMiddleware, asyncHandler(async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    provider: Joi.string().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: error.details[0].message
      }
    });
  }

  const { email, password, provider } = value;

  try {
    const testResult = await EmailTestService.testQuickConnection(email, password, provider);

    res.json({
      success: true,
      data: {
        testResult,
        email
      },
      message: testResult.success ? 'בדיקת החיבור הצליחה' : 'בדיקת החיבור נכשלה'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        type: 'EmailConnectionError',
        message: 'שגיאה בבדיקת החיבור',
        details: error.message
      }
    });
  }
}));

// @route   POST /api/accounts/:id/sync
// @desc    Manually trigger sync for email account
// @access  Private
router.post('/:id/sync', authMiddleware, asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'חשבון מייל לא נמצא'
      }
    });
  }

  if (account.status !== 'connected') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'AccountNotConnected',
        message: 'חשבון מייל לא מחובר'
      }
    });
  }

  // Update last sync time
  account.lastSync = new Date();
  await account.save();

  res.json({
    success: true,
    data: {
      account: {
        id: account._id,
        lastSync: account.lastSync
      }
    },
    message: 'סנכרון הופעל בהצלחה'
  });
}));

// @route   GET /api/accounts/:id/diagnostic
// @desc    Run full diagnostic for email account
// @access  Private
router.get('/:id/diagnostic', authMiddleware, asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'חשבון מייל לא נמצא'
      }
    });
  }

  try {
    const diagnosticConfig = {
      email: account.email,
      password: account.getDecryptedPassword(),
      provider: account.provider,
      settings: account.settings
    };

    const diagnostic = await EmailTestService.runFullDiagnostic(diagnosticConfig);

    res.json({
      success: true,
      data: {
        diagnostic,
        account: {
          id: account._id,
          email: account.email,
          provider: account.provider
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        type: 'DiagnosticError',
        message: 'שגיאה בהרצת אבחון',
        details: error.message
      }
    });
  }
}));

module.exports = router; 