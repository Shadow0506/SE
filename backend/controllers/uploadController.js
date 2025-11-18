const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const UploadedDocument = require('../models/UploadedDocument');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { generateQuestions } = require('../services/groqService');

// Configure multer for memory storage (we don't save files to disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOCX, and TXT files
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
    }
  }
});

// Helper function to get user model
const getUserModel = (userType) => {
  switch (userType.toLowerCase()) {
    case 'student':
      return Student;
    case 'faculty':
      return Faculty;
    case 'admin':
      return Admin;
    default:
      return null;
  }
};

// Helper function to reset daily counters if needed
const resetDailyCountersIfNeeded = async (user) => {
  if (!user.quota) {
    // Initialize quota if it doesn't exist
    user.quota = {
      storageLimit: user.userType === 'faculty' ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
      storageUsed: 0,
      generationsToday: 0,
      generationsLimit: user.userType === 'faculty' ? 100 : 20,
      uploadsToday: 0,
      uploadsLimit: user.userType === 'faculty' ? 50 : 5,
      lastResetDate: new Date()
    };
  }

  const today = new Date();
  const lastReset = new Date(user.quota.lastResetDate);
  
  // Check if it's a new day
  if (today.toDateString() !== lastReset.toDateString()) {
    user.quota.generationsToday = 0;
    user.quota.uploadsToday = 0;
    user.quota.lastResetDate = today;
    await user.save();
  }
};

// Extract text from different file types
const extractTextFromFile = async (file) => {
  const fileType = file.mimetype;

  try {
    if (fileType === 'application/pdf') {
      // Extract text from PDF
      const data = await pdfParse(file.buffer);
      return data.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from DOCX
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } else if (fileType === 'text/plain') {
      // Extract text from TXT
      return file.buffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

// Get file type from mimetype
const getFileType = (mimetype) => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mimetype === 'text/plain') return 'txt';
  return 'unknown';
};

// Single file upload (for students and faculty)
const uploadSingleFile = async (req, res) => {
  try {
    const { userId, userType, subject, generateQuestionsNow } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const UserModel = getUserModel(userType);
    if (!UserModel) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset daily counters if needed
    await resetDailyCountersIfNeeded(user);

    // Check upload limit
    if (user.quota.uploadsToday >= user.quota.uploadsLimit) {
      return res.status(429).json({ 
        error: 'Daily upload limit reached',
        limit: user.quota.uploadsLimit,
        message: `You have reached your daily upload limit of ${user.quota.uploadsLimit} files. Please try again tomorrow.`
      });
    }

    const fileSize = req.file.size;

    // Check storage quota
    if (user.quota.storageUsed + fileSize > user.quota.storageLimit) {
      const remainingMB = ((user.quota.storageLimit - user.quota.storageUsed) / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      return res.status(413).json({ 
        error: 'Storage quota exceeded',
        message: `This file (${fileSizeMB} MB) exceeds your remaining storage (${remainingMB} MB). Please delete some documents to free up space.`,
        storageUsed: user.quota.storageUsed,
        storageLimit: user.quota.storageLimit
      });
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(req.file);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from file. The file might be empty or corrupted.' });
    }

    // Create uploaded document record
    const uploadedDoc = new UploadedDocument({
      userId,
      userModel: userType.charAt(0).toUpperCase() + userType.slice(1),
      fileName: req.file.originalname,
      fileType: getFileType(req.file.mimetype),
      fileSize: fileSize,
      extractedText: extractedText,
      subject: subject || '',
      status: generateQuestionsNow === 'true' ? 'processing' : 'completed' // Changed from 'uploaded' to 'completed'
    });

    await uploadedDoc.save();

    // Update user's storage quota and upload count
    user.quota.storageUsed += fileSize;
    user.quota.uploadsToday += 1;
    await user.save();

    // Generate questions if requested
    let generatedQuestions = null;
    if (generateQuestionsNow === 'true') {
      try {
        // Check generation limit
        if (user.quota.generationsToday >= user.quota.generationsLimit) {
          uploadedDoc.status = 'completed'; // Changed from 'uploaded' to 'completed'
          uploadedDoc.processingError = 'Daily generation limit reached. Questions can be generated later.';
          await uploadedDoc.save();
          
          return res.status(200).json({
            message: 'File uploaded successfully, but daily generation limit reached',
            document: uploadedDoc,
            warning: 'Questions will need to be generated manually later'
          });
        }

        const result = await generateQuestions({
          answerText: extractedText,
          difficulty: 'medium',
          questionCount: 10,
          questionTypes: ['mcq', 'short', 'truefalse', 'application']
        });

        if (result.success && result.data.questions) {
          generatedQuestions = result.data.questions;
          uploadedDoc.status = 'completed';
          uploadedDoc.processedAt = new Date();
          
          // Increment generation counter
          user.quota.generationsToday += 1;
          await user.save();
        } else {
          uploadedDoc.status = 'completed'; // Changed from 'uploaded' to 'completed' - file is ready for use
          uploadedDoc.processingError = 'Question generation failed. You can try again later.';
        }
        
        await uploadedDoc.save();
      } catch (error) {
        console.error('Question generation error:', error);
        uploadedDoc.status = 'failed';
        uploadedDoc.processingError = error.message;
        await uploadedDoc.save();
      }
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      document: uploadedDoc,
      extractedTextLength: extractedText.length,
      generatedQuestions: generatedQuestions,
      quota: {
        storageUsed: user.quota.storageUsed,
        storageLimit: user.quota.storageLimit,
        uploadsToday: user.quota.uploadsToday,
        uploadsLimit: user.quota.uploadsLimit,
        generationsToday: user.quota.generationsToday,
        generationsLimit: user.quota.generationsLimit
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      message: error.message 
    });
  }
};

// Bulk file upload (for faculty)
const uploadBulkFiles = async (req, res) => {
  try {
    const { userId, userType, subject } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    if (userType.toLowerCase() !== 'faculty' && userType.toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Bulk upload is only available for faculty and admin users' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset daily counters if needed
    await resetDailyCountersIfNeeded(user);

    // Check if bulk upload would exceed daily limit
    if (user.quota.uploadsToday + req.files.length > user.quota.uploadsLimit) {
      return res.status(429).json({ 
        error: 'Bulk upload would exceed daily limit',
        filesAttempted: req.files.length,
        remainingUploads: user.quota.uploadsLimit - user.quota.uploadsToday,
        message: `You can only upload ${user.quota.uploadsLimit - user.quota.uploadsToday} more files today.`
      });
    }

    const results = [];
    let totalSize = 0;

    // Process each file
    for (const file of req.files) {
      try {
        const fileSize = file.size;
        
        // Check if adding this file would exceed storage quota
        if (user.quota.storageUsed + totalSize + fileSize > user.quota.storageLimit) {
          results.push({
            fileName: file.originalname,
            status: 'failed',
            error: 'Would exceed storage quota'
          });
          continue;
        }

        // Extract text
        const extractedText = await extractTextFromFile(file);

        if (!extractedText || extractedText.trim().length === 0) {
          results.push({
            fileName: file.originalname,
            status: 'failed',
            error: 'Could not extract text from file'
          });
          continue;
        }

        // Create document record
        const uploadedDoc = new UploadedDocument({
          userId,
          userModel: userType.charAt(0).toUpperCase() + userType.slice(1),
          fileName: file.originalname,
          fileType: getFileType(file.mimetype),
          fileSize: fileSize,
          extractedText: extractedText,
          subject: subject || '',
          status: 'completed' // Changed from 'uploaded' to 'completed'
        });

        await uploadedDoc.save();
        totalSize += fileSize;

        results.push({
          fileName: file.originalname,
          status: 'success',
          documentId: uploadedDoc._id,
          textLength: extractedText.length
        });

      } catch (error) {
        results.push({
          fileName: file.originalname,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update user's quota
    user.quota.storageUsed += totalSize;
    user.quota.uploadsToday += results.filter(r => r.status === 'success').length;
    await user.save();

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    res.status(200).json({
      message: `Bulk upload completed: ${successCount} succeeded, ${failCount} failed`,
      results: results,
      quota: {
        storageUsed: user.quota.storageUsed,
        storageLimit: user.quota.storageLimit,
        uploadsToday: user.quota.uploadsToday,
        uploadsLimit: user.quota.uploadsLimit
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ 
      error: 'Bulk upload failed',
      message: error.message 
    });
  }
};

// Get user's uploaded documents
const getUserDocuments = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const documents = await UploadedDocument.find({
      userId,
      userModel: userType.charAt(0).toUpperCase() + userType.slice(1)
    }).sort({ uploadedAt: -1 });

    res.status(200).json({
      documents,
      count: documents.length
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      message: error.message 
    });
  }
};

// Delete uploaded document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const document = await UploadedDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership
    if (document.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const fileSize = document.fileSize;

    // Delete the document
    await UploadedDocument.findByIdAndDelete(documentId);

    // Update user's storage quota
    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);
    if (user && user.quota) {
      user.quota.storageUsed = Math.max(0, user.quota.storageUsed - fileSize);
      await user.save();
    }

    res.status(200).json({
      message: 'Document deleted successfully',
      freedSpace: fileSize,
      quota: user ? {
        storageUsed: user.quota.storageUsed,
        storageLimit: user.quota.storageLimit
      } : null
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      error: 'Failed to delete document',
      message: error.message 
    });
  }
};

// Get user's quota information
const getUserQuota = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset daily counters if needed
    await resetDailyCountersIfNeeded(user);

    res.status(200).json({
      quota: user.quota || {
        storageLimit: userType === 'faculty' ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
        storageUsed: 0,
        generationsToday: 0,
        generationsLimit: userType === 'faculty' ? 100 : 20,
        uploadsToday: 0,
        uploadsLimit: userType === 'faculty' ? 50 : 5
      }
    });

  } catch (error) {
    console.error('Get quota error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve quota information',
      message: error.message 
    });
  }
};

// Generate questions from uploaded document
const generateQuestionsFromDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId, userType, difficulty, questionCount, questionTypes } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const document = await UploadedDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership
    if (document.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset daily counters if needed
    await resetDailyCountersIfNeeded(user);

    // Check generation limit
    if (user.quota.generationsToday >= user.quota.generationsLimit) {
      return res.status(429).json({ 
        error: 'Daily generation limit reached',
        limit: user.quota.generationsLimit,
        message: `You have reached your daily generation limit of ${user.quota.generationsLimit}. Please try again tomorrow.`
      });
    }

    document.status = 'processing';
    await document.save();

    try {
      const result = await generateQuestions({
        answerText: document.extractedText,
        difficulty: difficulty || 'medium',
        questionCount: questionCount || 10,
        questionTypes: questionTypes || ['mcq', 'short', 'truefalse', 'application']
      });

      if (result.success && result.data.questions) {
        document.status = 'completed';
        document.processedAt = new Date();
        await document.save();

        // Increment generation counter
        user.quota.generationsToday += 1;
        await user.save();

        res.status(200).json({
          message: 'Questions generated successfully',
          questions: result.data.questions,
          keyConcepts: result.data.keyConcepts,
          quota: {
            generationsToday: user.quota.generationsToday,
            generationsLimit: user.quota.generationsLimit
          }
        });
      } else {
        throw new Error('Question generation failed');
      }

    } catch (error) {
      document.status = 'failed';
      document.processingError = error.message;
      await document.save();
      throw error;
    }

  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions from document',
      message: error.message 
    });
  }
};

module.exports = {
  upload,
  uploadSingleFile,
  uploadBulkFiles,
  getUserDocuments,
  deleteDocument,
  getUserQuota,
  generateQuestionsFromDocument
};
