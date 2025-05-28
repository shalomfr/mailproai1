const express = require('express');
const router = express.Router();
const Joi = require('joi');
const ProviderService = require('../services/providerService');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   GET /api/providers
// @desc    Get all email providers
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const providers = ProviderService.getAllProviders();
  
  res.json({
    success: true,
    data: {
      providers,
      count: providers.length
    }
  });
}));

// @route   GET /api/providers/popular
// @desc    Get popular email providers
// @access  Public
router.get('/popular', asyncHandler(async (req, res) => {
  const providers = ProviderService.getPopularProviders();
  
  res.json({
    success: true,
    data: {
      providers,
      count: providers.length
    }
  });
}));

// @route   GET /api/providers/suggest
// @desc    Get email suggestions for autocomplete
// @access  Public
router.get('/suggest', asyncHandler(async (req, res) => {
  const { q: query } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'פרמטר חיפוש נדרש'
      }
    });
  }

  const suggestions = ProviderService.getSuggestions(query.trim());
  
  res.json({
    success: true,
    data: {
      query: query.trim(),
      suggestions,
      count: suggestions.length
    }
  });
}));

// @route   POST /api/providers/detect
// @desc    Detect provider from email address
// @access  Public
router.post('/detect', asyncHandler(async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'כתובת מייל לא תקינה',
      'any.required': 'כתובת מייל נדרשת'
    })
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

  const { email } = value;
  const provider = ProviderService.detectProviderFromEmail(email);
  
  if (!provider) {
    return res.json({
      success: true,
      data: {
        email,
        provider: null,
        detected: false,
        message: 'ספק מייל לא מזוהה - ניתן להגדיר הגדרות מותאמות אישית'
      }
    });
  }

  // Get default settings for this provider
  const defaultSettings = ProviderService.getDefaultSettings(provider.domain);
  
  res.json({
    success: true,
    data: {
      email,
      provider,
      defaultSettings,
      detected: true,
      message: `זוהה כ-${provider.name}`
    }
  });
}));

// @route   GET /api/providers/:domain
// @desc    Get specific provider by domain
// @access  Public
router.get('/:domain', asyncHandler(async (req, res) => {
  const { domain } = req.params;
  
  if (!domain) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'דומיין נדרש'
      }
    });
  }

  const provider = ProviderService.getProvider(domain.toLowerCase());
  
  if (!provider) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'ספק מייל לא נמצא'
      }
    });
  }

  const defaultSettings = ProviderService.getDefaultSettings(domain.toLowerCase());
  
  res.json({
    success: true,
    data: {
      domain: domain.toLowerCase(),
      provider,
      defaultSettings
    }
  });
}));

// @route   POST /api/providers/validate
// @desc    Validate email settings for a provider
// @access  Public
router.post('/validate', asyncHandler(async (req, res) => {
  const schema = Joi.object({
    provider: Joi.string().required(),
    settings: Joi.object({
      imap: Joi.object({
        server: Joi.string().required(),
        port: Joi.number().integer().min(1).max(65535).required(),
        ssl: Joi.boolean().required(),
        auth: Joi.string().valid('normal', 'oauth2').required()
      }).required(),
      smtp: Joi.object({
        server: Joi.string().required(),
        port: Joi.number().integer().min(1).max(65535).required(),
        ssl: Joi.boolean(),
        tls: Joi.boolean(),
        auth: Joi.string().valid('normal', 'oauth2').required()
      }).required()
    }).required()
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

  const { provider, settings } = value;
  const validation = ProviderService.validateEmailSettings(provider, settings);
  
  res.json({
    success: true,
    data: {
      provider,
      settings,
      validation
    }
  });
}));

// @route   GET /api/providers/search/:query
// @desc    Search providers by name or domain
// @access  Public
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  
  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'מונח חיפוש חייב להכיל לפחות 2 תווים'
      }
    });
  }

  const allProviders = ProviderService.getAllProviders();
  const searchTerm = query.trim().toLowerCase();
  
  const results = allProviders.filter(provider => 
    provider.name.toLowerCase().includes(searchTerm) ||
    provider.domain.toLowerCase().includes(searchTerm) ||
    provider.type.toLowerCase().includes(searchTerm)
  );
  
  res.json({
    success: true,
    data: {
      query: searchTerm,
      results,
      count: results.length,
      total: allProviders.length
    }
  });
}));

// @route   GET /api/providers/domain/:domain/documentation
// @desc    Get documentation URL for a specific provider
// @access  Public
router.get('/domain/:domain/documentation', asyncHandler(async (req, res) => {
  const { domain } = req.params;
  const provider = ProviderService.getProvider(domain.toLowerCase());
  
  if (!provider) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFound',
        message: 'ספק מייל לא נמצא'
      }
    });
  }

  res.json({
    success: true,
    data: {
      domain: domain.toLowerCase(),
      provider: provider.name,
      documentation: provider.documentation || null,
      hasDocumentation: !!provider.documentation
    }
  });
}));

module.exports = router; 