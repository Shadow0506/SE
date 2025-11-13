const express = require('express');
const router = express.Router();
const {
  generateQuestionsFromAnswer,
  saveQuestions,
  getUserQuestions,
  extractConcepts
} = require('../controllers/questionController');

// Generate questions from answer text
router.post('/generate', generateQuestionsFromAnswer);

// Save generated questions
router.post('/save', saveQuestions);

// Get user's questions
router.get('/user', getUserQuestions);

// Extract key concepts
router.post('/extract-concepts', extractConcepts);

module.exports = router;
