const express = require('express');
const router = express.Router();
const {
  upload,
  uploadSingleFile,
  uploadBulkFiles,
  getUserDocuments,
  deleteDocument,
  getUserQuota,
  generateQuestionsFromDocument
} = require('../controllers/uploadController');

// Single file upload (students and faculty)
router.post('/single', upload.single('file'), uploadSingleFile);

// Bulk file upload (faculty only)
router.post('/bulk', upload.array('files', 50), uploadBulkFiles);

// Get user's uploaded documents
router.get('/documents', getUserDocuments);

// Delete uploaded document
router.delete('/documents/:documentId', deleteDocument);

// Get user's quota information
router.get('/quota', getUserQuota);

// Generate questions from uploaded document
router.post('/documents/:documentId/generate', generateQuestionsFromDocument);

module.exports = router;
