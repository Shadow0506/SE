const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Reference to user who created/generated this question
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
  
  // Original answer/source text
  sourceText: {
    type: String,
    required: true
  },
  
  // Question details
  type: {
    type: String,
    required: true,
    enum: ['mcq', 'short', 'truefalse', 'application']
  },
  
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  
  question: {
    type: String,
    required: true
  },
  
  // For MCQ questions
  options: [{
    type: String
  }],
  
  correctAnswer: {
    type: String,
    required: true
  },
  
  hint: {
    type: String,
    default: ''
  },
  
  explanation: {
    type: String,
    default: ''
  },
  
  // Key concepts extracted from source
  keyConcepts: [{
    type: String
  }],
  
  // Tags for categorization
  tags: [{
    type: String
  }],
  
  subject: {
    type: String,
    default: ''
  },
  
  // Whether this question has been edited by user
  isEdited: {
    type: Boolean,
    default: false
  },
  
  // Generation metadata
  generationMetadata: {
    model: {
      type: String,
      default: 'llama-3.3-70b-versatile'
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
questionSchema.index({ userId: 1, difficulty: 1, type: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ subject: 1 });

module.exports = mongoose.model('Question', questionSchema);
