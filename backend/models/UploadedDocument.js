const mongoose = require('mongoose');

const uploadedDocumentSchema = new mongoose.Schema({
  // User who uploaded the document
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

  // Document details
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt'],
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },

  // Extracted text content (instead of storing the actual file)
  extractedText: {
    type: String,
    required: true
  },

  // Metadata
  subject: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  
  // Generated questions from this document
  generatedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],

  // Processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  processingError: {
    type: String,
    default: ''
  },

  // Timestamps
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
uploadedDocumentSchema.index({ userId: 1, userModel: 1 });
uploadedDocumentSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('UploadedDocument', uploadedDocumentSchema);
