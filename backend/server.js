const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/question');
const quizRoutes = require('./routes/quiz');
const exportRoutes = require('./routes/export');
const uploadRoutes = require('./routes/upload');
const {
  generalLimiter,
  questionGenerationLimiter,
  uploadLimiter,
  loginLimiter,
  exportLimiter
} = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Routes with specific rate limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/questions/generate', questionGenerationLimiter);
app.use('/api/questions', questionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/export', exportLimiter, exportRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
