const mongoose = require('mongoose');
const crypto = require('crypto');

const emailAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'שם החשבון נדרש'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'כתובת מייל נדרשת'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'כתובת מייל לא תקינה']
  },
  password: {
    type: String,
    required: [true, 'סיסמה נדרשת']
  },
  provider: {
    type: String,
    required: true,
    enum: ['gmail', 'outlook', 'yahoo', 'icloud', 'custom']
  },
  settings: {
    imap: {
      server: {
        type: String,
        required: true
      },
      port: {
        type: Number,
        required: true,
        min: 1,
        max: 65535
      },
      ssl: {
        type: Boolean,
        default: true
      },
      auth: {
        type: String,
        enum: ['normal', 'oauth2'],
        default: 'normal'
      }
    },
    smtp: {
      server: {
        type: String,
        required: true
      },
      port: {
        type: Number,
        required: true,
        min: 1,
        max: 65535
      },
      ssl: {
        type: Boolean,
        default: false
      },
      tls: {
        type: Boolean,
        default: true
      },
      auth: {
        type: String,
        enum: ['normal', 'oauth2'],
        default: 'normal'
      }
    },
    sync: {
      enabled: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 5, // minutes
        min: 1,
        max: 60
      },
      folders: {
        type: [String],
        default: ['INBOX']
      }
    }
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'testing'],
    default: 'disconnected'
  },
  lastSync: {
    type: Date
  },
  lastError: {
    message: String,
    timestamp: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Encrypt password before saving
emailAccountSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(this.password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    this.password = encrypted;
    next();
  } catch (error) {
    next(error);
  }
});

// Decrypt password method
emailAccountSchema.methods.getDecryptedPassword = function() {
  try {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(this.password, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt password');
  }
};

// Update status
emailAccountSchema.methods.updateStatus = function(status, error = null) {
  this.status = status;
  if (error) {
    this.lastError = {
      message: error.message,
      timestamp: new Date()
    };
  }
  if (status === 'connected') {
    this.lastSync = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('EmailAccount', emailAccountSchema); 