const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'שם משתמש נדרש'],
    unique: true,
    trim: true,
    minlength: [3, 'שם משתמש חייב להכיל לפחות 3 תווים'],
    maxlength: [30, 'שם משתמש לא יכול להכיל יותר מ-30 תווים']
  },
  email: {
    type: String,
    required: [true, 'כתובת מייל נדרשת'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'כתובת מייל לא תקינה']
  },
  password: {
    type: String,
    required: [true, 'סיסמה נדרשת'],
    minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'שם פרטי לא יכול להכיל יותר מ-50 תווים']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'שם משפחה לא יכול להכיל יותר מ-50 תווים']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  emailAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 