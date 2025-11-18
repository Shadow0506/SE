const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  userType: {
    type: String,
    default: 'student',
    immutable: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Subscription details
  subscriptionPlan: {
    type: String,
    enum: ['free', 'student', 'educator', 'enterprise'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  subscriptionBillingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  // Adaptive difficulty tracking
  adaptiveDifficulty: {
    currentLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    consecutiveCorrect: {
      type: Number,
      default: 0
    },
    consecutiveIncorrect: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Storage quota and rate limiting (for students - limited)
  quota: {
    // Storage quota in bytes (10 MB for students)
    storageLimit: {
      type: Number,
      default: 10 * 1024 * 1024 // 10 MB
    },
    storageUsed: {
      type: Number,
      default: 0
    },
    // Rate limiting for question generation
    generationsToday: {
      type: Number,
      default: 0
    },
    generationsLimit: {
      type: Number,
      default: 20 // 20 generations per day for students
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    // File upload limits
    uploadsToday: {
      type: Number,
      default: 0
    },
    uploadsLimit: {
      type: Number,
      default: 5 // 5 file uploads per day for students
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
