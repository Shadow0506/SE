const rateLimit = require('express-rate-limit');

// Check if in test mode
const isTestMode = process.env.NODE_ENV === 'test';

// General API rate limiter - 100 requests per 15 minutes (10000 in test)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestMode ? 10000 : 100,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for question generation - 30 requests per hour (1000 in test)
const questionGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTestMode ? 1000 : 30,
  message: {
    error: 'Question generation rate limit exceeded',
    message: 'You have exceeded the hourly limit for question generation. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Upload rate limiter - 20 uploads per hour (1000 in test)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTestMode ? 1000 : 20,
  message: {
    error: 'Upload rate limit exceeded',
    message: 'You have exceeded the hourly upload limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter - 5 attempts per 15 minutes (1000 in test)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestMode ? 1000 : 5,
  message: {
    error: 'Too many login attempts',
    message: 'Too many failed login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Export rate limiter - 10 exports per hour
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Export rate limit exceeded',
    message: 'You have exceeded the hourly export limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  questionGenerationLimiter,
  uploadLimiter,
  loginLimiter,
  exportLimiter
};
