const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  // Reference to user taking the quiz
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Student', 'Faculty', 'Admin']
  },
  
  // Quiz details
  title: {
    type: String,
    required: true
  },
  
  subject: {
    type: String,
    default: ''
  },
  
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  
  // Questions in this quiz
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    userAnswer: {
      type: String,
      default: ''
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    // AI evaluation fields for short answer and application questions
    aiScore: {
      type: Number, // 0-100 score from LLM
      default: null
    },
    aiFeedback: {
      type: String, // Feedback from LLM evaluation
      default: ''
    }
  }],
  
  // Quiz settings
  timeLimit: {
    type: Number, // in minutes, 0 = no limit
    default: 0
  },
  
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  
  // Quiz state
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  
  // Results
  score: {
    type: Number,
    default: 0
  },
  
  totalQuestions: {
    type: Number,
    required: true
  },
  
  correctAnswers: {
    type: Number,
    default: 0
  },
  
  percentage: {
    type: Number,
    default: 0
  },
  
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
quizSchema.index({ userId: 1, status: 1 });
quizSchema.index({ createdAt: -1 });

// Calculate score before saving
quizSchema.pre('save', function(next) {
  if (this.status === 'completed') {
    this.correctAnswers = this.questions.filter(q => q.isCorrect === true).length;
    this.percentage = this.totalQuestions > 0 
      ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
      : 0;
    this.score = this.correctAnswers;
  }
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
