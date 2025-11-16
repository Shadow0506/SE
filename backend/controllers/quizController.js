const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { evaluateAnswer } = require('../services/groqService');

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

// Helper function to adjust adaptive difficulty
const adjustAdaptiveDifficulty = async (userId, userType, isCorrect) => {
  const UserModel = getUserModel(userType);
  if (!UserModel || userType.toLowerCase() !== 'student') return; // Only for students

  try {
    const user = await UserModel.findById(userId);
    if (!user) return;

    if (!user.adaptiveDifficulty) {
      user.adaptiveDifficulty = {
        currentLevel: 'medium',
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastUpdated: new Date()
      };
    }

    if (isCorrect) {
      user.adaptiveDifficulty.consecutiveCorrect += 1;
      user.adaptiveDifficulty.consecutiveIncorrect = 0;

      // 3 correct in a row → increase difficulty
      if (user.adaptiveDifficulty.consecutiveCorrect >= 3) {
        if (user.adaptiveDifficulty.currentLevel === 'easy') {
          user.adaptiveDifficulty.currentLevel = 'medium';
          user.adaptiveDifficulty.consecutiveCorrect = 0;
        } else if (user.adaptiveDifficulty.currentLevel === 'medium') {
          user.adaptiveDifficulty.currentLevel = 'hard';
          user.adaptiveDifficulty.consecutiveCorrect = 0;
        }
      }
    } else {
      user.adaptiveDifficulty.consecutiveIncorrect += 1;
      user.adaptiveDifficulty.consecutiveCorrect = 0;

      // 2 incorrect in a row → decrease difficulty
      if (user.adaptiveDifficulty.consecutiveIncorrect >= 2) {
        if (user.adaptiveDifficulty.currentLevel === 'hard') {
          user.adaptiveDifficulty.currentLevel = 'medium';
          user.adaptiveDifficulty.consecutiveIncorrect = 0;
        } else if (user.adaptiveDifficulty.currentLevel === 'medium') {
          user.adaptiveDifficulty.currentLevel = 'easy';
          user.adaptiveDifficulty.consecutiveIncorrect = 0;
        }
      }
    }

    user.adaptiveDifficulty.lastUpdated = new Date();
    await user.save();
  } catch (error) {
    console.error('Adaptive difficulty adjustment error:', error);
  }
};

// Create a new quiz
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      subject,
      difficulty,
      questionIds,
      timeLimit = 0,
      shuffleQuestions = false,
      shuffleOptions = false,
      userId,
      userType
    } = req.body;

    if (!title || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Title and question IDs are required' });
    }

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User information is required' });
    }

    // Determine the user model
    let userModel;
    switch (userType.toLowerCase()) {
      case 'student':
        userModel = 'Student';
        break;
      case 'faculty':
        userModel = 'Faculty';
        break;
      case 'admin':
        userModel = 'Admin';
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    // Verify all questions exist and belong to the user
    const questions = await Question.find({
      _id: { $in: questionIds },
      userId,
      userModel
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({ error: 'Some questions not found or do not belong to user' });
    }

    // Shuffle questions if requested
    let orderedQuestionIds = [...questionIds];
    if (shuffleQuestions) {
      orderedQuestionIds = orderedQuestionIds.sort(() => Math.random() - 0.5);
    }

    // Create quiz
    const quiz = new Quiz({
      userId,
      userModel,
      title,
      subject: subject || '',
      difficulty: difficulty || 'mixed',
      questions: orderedQuestionIds.map(qId => ({
        questionId: qId,
        userAnswer: '',
        isCorrect: null,
        timeSpent: 0
      })),
      timeLimit,
      shuffleQuestions,
      shuffleOptions,
      totalQuestions: questionIds.length,
      status: 'in-progress',
      startedAt: new Date()
    });

    await quiz.save();

    // Populate question details
    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions.questionId');

    res.status(201).json({
      success: true,
      quiz: populatedQuiz
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ 
      error: 'Failed to create quiz',
      message: error.message 
    });
  }
};

// Get a specific quiz
const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User information is required' });
    }

    const quiz = await Quiz.findById(quizId)
      .populate('questions.questionId');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify ownership
    if (quiz.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to quiz' });
    }

    res.json({
      success: true,
      quiz
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve quiz',
      message: error.message 
    });
  }
};

// Submit answer for a question in quiz
const submitAnswer = async (req, res) => {
  try {
    const { quizId, questionIndex, userAnswer, timeSpent } = req.body;
    const { userId } = req.body;

    if (!quizId || questionIndex === undefined || !userId) {
      return res.status(400).json({ error: 'Quiz ID, question index, and user ID are required' });
    }

    const quiz = await Quiz.findById(quizId)
      .populate('questions.questionId');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify ownership
    if (quiz.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to quiz' });
    }

    if (quiz.status === 'completed') {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
      return res.status(400).json({ error: 'Invalid question index' });
    }

    // Update answer
    const question = quiz.questions[questionIndex];
    question.userAnswer = userAnswer || '';
    question.timeSpent = timeSpent || 0;

    // Check if answer is correct based on question type
    const questionType = question.questionId.type;
    const correctAnswer = question.questionId.correctAnswer.trim();
    const userAnswerNormalized = (userAnswer || '').trim();
    
    // For short answer and application questions, use LLM evaluation
    if (questionType === 'short' || questionType === 'application') {
      if (userAnswerNormalized) {
        try {
          const evaluation = await evaluateAnswer({
            question: question.questionId.question,
            correctAnswer: correctAnswer,
            userAnswer: userAnswerNormalized,
            explanation: question.questionId.explanation || ''
          });

          question.isCorrect = evaluation.isCorrect;
          question.aiScore = evaluation.score;
          question.aiFeedback = evaluation.feedback;
        } catch (error) {
          console.error('LLM evaluation failed, using exact match:', error);
          // Fallback to case-insensitive exact match
          question.isCorrect = correctAnswer.toLowerCase() === userAnswerNormalized.toLowerCase();
          question.aiScore = question.isCorrect ? 100 : 0;
          question.aiFeedback = 'Exact match evaluation used';
        }
      } else {
        question.isCorrect = false;
        question.aiScore = 0;
        question.aiFeedback = 'No answer provided';
      }
    } else {
      // For MCQ and True/False, use exact match (case-insensitive)
      question.isCorrect = correctAnswer.toLowerCase() === userAnswerNormalized.toLowerCase();
    }

    await quiz.save();

    // Adjust adaptive difficulty based on answer
    await adjustAdaptiveDifficulty(userId, quiz.userModel, question.isCorrect);

    res.json({
      success: true,
      isCorrect: question.isCorrect,
      correctAnswer: question.questionId.correctAnswer,
      explanation: question.questionId.explanation
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ 
      error: 'Failed to submit answer',
      message: error.message 
    });
  }
};

// Complete quiz and calculate results
const completeQuiz = async (req, res) => {
  try {
    const { quizId, userId } = req.body;

    if (!quizId || !userId) {
      return res.status(400).json({ error: 'Quiz ID and user ID are required' });
    }

    const quiz = await Quiz.findById(quizId)
      .populate('questions.questionId');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify ownership
    if (quiz.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to quiz' });
    }

    if (quiz.status === 'completed') {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    // Mark unanswered questions as incorrect
    quiz.questions.forEach(q => {
      if (q.isCorrect === null) {
        q.isCorrect = false;
      }
    });

    // Update quiz status
    quiz.status = 'completed';
    quiz.completedAt = new Date();
    quiz.totalTimeSpent = quiz.questions.reduce((sum, q) => sum + q.timeSpent, 0);

    await quiz.save();

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.totalQuestions,
        correctAnswers: quiz.correctAnswers,
        percentage: quiz.percentage,
        score: quiz.score,
        totalTimeSpent: quiz.totalTimeSpent,
        completedAt: quiz.completedAt
      }
    });

  } catch (error) {
    console.error('Complete quiz error:', error);
    res.status(500).json({ 
      error: 'Failed to complete quiz',
      message: error.message 
    });
  }
};

// Get user's quiz history
const getUserQuizzes = async (req, res) => {
  try {
    const { userId, userType, status } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and type are required' });
    }

    // Determine the user model
    let userModel;
    switch (userType.toLowerCase()) {
      case 'student':
        userModel = 'Student';
        break;
      case 'faculty':
        userModel = 'Faculty';
        break;
      case 'admin':
        userModel = 'Admin';
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    const filter = { userId, userModel };
    if (status) {
      filter.status = status;
    }

    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .populate('questions.questionId', 'question type difficulty');

    res.json({
      success: true,
      count: quizzes.length,
      quizzes
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve quizzes',
      message: error.message 
    });
  }
};

// Get quiz statistics
const getQuizStatistics = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and type are required' });
    }

    // Determine the user model
    let userModel;
    switch (userType.toLowerCase()) {
      case 'student':
        userModel = 'Student';
        break;
      case 'faculty':
        userModel = 'Faculty';
        break;
      case 'admin':
        userModel = 'Admin';
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    const completedQuizzes = await Quiz.find({
      userId,
      userModel,
      status: 'completed'
    }).sort({ createdAt: -1 });

    const totalQuizzes = completedQuizzes.length;
    
    if (totalQuizzes === 0) {
      return res.json({
        success: true,
        statistics: {
          totalQuizzes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          averageScore: 0,
          averagePercentage: 0,
          totalTimeSpent: 0,
          recentQuizzes: [],
          performanceByDifficulty: {
            easy: { total: 0, correct: 0, percentage: 0 },
            medium: { total: 0, correct: 0, percentage: 0 },
            hard: { total: 0, correct: 0, percentage: 0 }
          },
          performanceBySubject: {}
        }
      });
    }

    const totalQuestions = completedQuizzes.reduce((sum, q) => sum + q.totalQuestions, 0);
    const totalCorrect = completedQuizzes.reduce((sum, q) => sum + q.correctAnswers, 0);
    const averageScore = totalCorrect / totalQuizzes;
    const averagePercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const totalTimeSpent = completedQuizzes.reduce((sum, q) => sum + q.totalTimeSpent, 0);

    // Performance by difficulty
    const performanceByDifficulty = {
      easy: { total: 0, correct: 0, percentage: 0 },
      medium: { total: 0, correct: 0, percentage: 0 },
      hard: { total: 0, correct: 0, percentage: 0 }
    };

    // Performance by subject
    const performanceBySubject = {};

    for (const quiz of completedQuizzes) {
      // By subject
      if (quiz.subject) {
        if (!performanceBySubject[quiz.subject]) {
          performanceBySubject[quiz.subject] = {
            total: 0,
            correct: 0,
            percentage: 0,
            quizCount: 0
          };
        }
        performanceBySubject[quiz.subject].total += quiz.totalQuestions;
        performanceBySubject[quiz.subject].correct += quiz.correctAnswers;
        performanceBySubject[quiz.subject].quizCount += 1;
      }

      // By difficulty (need to check individual questions)
      await quiz.populate('questions.questionId');
      quiz.questions.forEach(q => {
        const diff = q.questionId.difficulty;
        if (performanceByDifficulty[diff]) {
          performanceByDifficulty[diff].total += 1;
          if (q.isCorrect) {
            performanceByDifficulty[diff].correct += 1;
          }
        }
      });
    }

    // Calculate percentages
    Object.keys(performanceByDifficulty).forEach(diff => {
      const data = performanceByDifficulty[diff];
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    });

    Object.keys(performanceBySubject).forEach(subject => {
      const data = performanceBySubject[subject];
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    });

    // Recent quizzes (last 5)
    const recentQuizzes = completedQuizzes.slice(0, 5).map(q => ({
      _id: q._id,
      title: q.title,
      subject: q.subject,
      percentage: q.percentage,
      score: q.score,
      totalQuestions: q.totalQuestions,
      completedAt: q.completedAt
    }));

    res.json({
      success: true,
      statistics: {
        totalQuizzes,
        totalQuestions,
        totalCorrect,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        totalTimeSpent,
        recentQuizzes,
        performanceByDifficulty,
        performanceBySubject
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve statistics',
      message: error.message 
    });
  }
};

// Delete a quiz
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify ownership
    if (quiz.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this quiz' });
    }

    await Quiz.findByIdAndDelete(quizId);

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ 
      error: 'Failed to delete quiz',
      message: error.message 
    });
  }
};

// Get user's adaptive difficulty level
const getAdaptiveDifficulty = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and type are required' });
    }

    const UserModel = getUserModel(userType);
    if (!UserModel) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adaptiveInfo = user.adaptiveDifficulty || {
      currentLevel: 'medium',
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      adaptiveDifficulty: adaptiveInfo
    });

  } catch (error) {
    console.error('Get adaptive difficulty error:', error);
    res.status(500).json({ 
      error: 'Failed to get adaptive difficulty',
      message: error.message 
    });
  }
};

// Create random quiz from saved questions
const createRandomQuiz = async (req, res) => {
  try {
    const {
      title,
      questionCount = 10,
      difficulty,
      subject,
      type,
      userId,
      userType
    } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User information is required' });
    }

    // Determine the user model
    let userModel;
    switch (userType.toLowerCase()) {
      case 'student':
        userModel = 'Student';
        break;
      case 'faculty':
        userModel = 'Faculty';
        break;
      case 'admin':
        userModel = 'Admin';
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    // Build filter for random selection
    const filter = { userId, userModel };
    if (difficulty && difficulty !== 'mixed') {
      filter.difficulty = difficulty;
    }
    if (subject) {
      filter.subject = subject;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Get all matching questions
    const allQuestions = await Question.find(filter);

    if (allQuestions.length === 0) {
      return res.status(400).json({ error: 'No questions found matching criteria' });
    }

    // Randomly select questions
    const selectedCount = Math.min(questionCount, allQuestions.length);
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, selectedCount);

    // Create quiz
    const quiz = new Quiz({
      userId,
      userModel,
      title: title || 'Random Practice Quiz',
      subject: subject || '',
      difficulty: difficulty || 'mixed',
      questions: selectedQuestions.map(q => ({
        questionId: q._id,
        userAnswer: '',
        isCorrect: null,
        timeSpent: 0
      })),
      timeLimit: 0,
      shuffleQuestions: true,
      shuffleOptions: false,
      totalQuestions: selectedQuestions.length,
      status: 'in-progress',
      startedAt: new Date()
    });

    await quiz.save();

    // Populate question details
    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions.questionId');

    res.status(201).json({
      success: true,
      quiz: populatedQuiz
    });

  } catch (error) {
    console.error('Create random quiz error:', error);
    res.status(500).json({ 
      error: 'Failed to create random quiz',
      message: error.message 
    });
  }
};

module.exports = {
  createQuiz,
  getQuiz,
  submitAnswer,
  completeQuiz,
  getUserQuizzes,
  getQuizStatistics,
  deleteQuiz,
  getAdaptiveDifficulty,
  createRandomQuiz
};
