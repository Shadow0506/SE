const express = require('express');
const router = express.Router();
const {
  generateQuestionsFromAnswer,
  saveQuestions,
  getUserQuestions,
  extractConcepts,
  deleteQuestion,
  updateQuestion,
  getFilteredQuestions
} = require('../controllers/questionController');

// Generate questions from answer text
router.post('/generate', generateQuestionsFromAnswer);

// Save generated questions
router.post('/save', saveQuestions);

// Get user's questions
router.get('/user', getUserQuestions);

// Get filtered questions
router.get('/filtered', getFilteredQuestions);

// Extract key concepts
router.post('/extract-concepts', extractConcepts);

// Update question
router.put('/:questionId', updateQuestion);

// Delete question
router.delete('/:questionId', deleteQuestion);

module.exports = router;
