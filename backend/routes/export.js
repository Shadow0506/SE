const express = require('express');
const router = express.Router();
const {
  exportDOCX,
  exportPDF
} = require('../controllers/exportController');

// Export questions as DOCX
router.post('/docx', exportDOCX);

// Export questions as PDF
router.post('/pdf', exportPDF);

module.exports = router;
