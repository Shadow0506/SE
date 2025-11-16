const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuiz,
  submitAnswer,
  completeQuiz,
  getUserQuizzes,
  getQuizStatistics,
  deleteQuiz,
  getAdaptiveDifficulty,
  createRandomQuiz
} = require('../controllers/quizController');

// Create a new quiz
router.post('/create', createQuiz);

// Create random quiz from saved questions
router.post('/create-random', createRandomQuiz);

// Get a specific quiz
router.get('/:quizId', getQuiz);

// Submit answer for a question
router.post('/submit-answer', submitAnswer);

// Complete quiz
router.post('/complete', completeQuiz);

// Get user's quizzes
router.get('/user/all', getUserQuizzes);

// Get quiz statistics
router.get('/user/statistics', getQuizStatistics);

// Get adaptive difficulty
router.get('/user/adaptive-difficulty', getAdaptiveDifficulty);

// Delete quiz
router.delete('/:quizId', deleteQuiz);

module.exports = router;
