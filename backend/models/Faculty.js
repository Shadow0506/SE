const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
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
    default: 'faculty',
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
  // Storage quota and rate limiting (for faculty - more generous)
  quota: {
    // Storage quota in bytes (100 MB for faculty - 10x students)
    storageLimit: {
      type: Number,
      default: 100 * 1024 * 1024 // 100 MB
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
      default: 100 // 100 generations per day for faculty
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
      default: 50 // 50 file uploads per day for faculty (bulk upload)
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
