const { generateQuestions, extractKeyConcepts } = require('../services/groqService');
const Question = require('../models/Question');

// Generate questions from answer text
const generateQuestionsFromAnswer = async (req, res) => {
  try {
    const {
      answerText,
      difficulty = 'medium',
      questionCount = 5,
      questionTypes = ['mcq', 'short', 'truefalse', 'application'],
      subject = '',
      tags = []
    } = req.body;

    // Get user info from request (assuming it's attached by auth middleware or sent in body)
    const { userId, userType } = req.body;

    // Validate input
    if (!answerText || answerText.trim().length === 0) {
      return res.status(400).json({ error: 'Answer text is required' });
    }

    // Character limit validation (30,000 chars as per SRS)
    if (answerText.length > 30000) {
      return res.status(400).json({ 
        error: 'Answer text exceeds maximum length of 30,000 characters' 
      });
    }

    if (questionCount < 1 || questionCount > 20) {
      return res.status(400).json({ 
        error: 'Question count must be between 1 and 20' 
      });
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid difficulty level. Must be easy, medium, or hard' 
      });
    }

    // Validate question types
    const validTypes = ['mcq', 'short', 'truefalse', 'application'];
    const invalidTypes = questionTypes.filter(type => !validTypes.includes(type));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ 
        error: `Invalid question types: ${invalidTypes.join(', ')}` 
      });
    }

    // Generate questions using Groq
    const result = await generateQuestions({
      answerText,
      difficulty: difficulty.toLowerCase(),
      questionCount,
      questionTypes
    });

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to generate questions' });
    }

    // Prepare response
    const response = {
      success: true,
      keyConcepts: result.data.keyConcepts || [],
      questions: result.data.questions || [],
      usage: result.usage,
      metadata: {
        sourceTextLength: answerText.length,
        requestedCount: questionCount,
        generatedCount: result.data.questions?.length || 0,
        difficulty,
        questionTypes
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      message: error.message 
    });
  }
};

// Save generated questions to database
const saveQuestions = async (req, res) => {
  try {
    const {
      questions,
      sourceText,
      keyConcepts = [],
      subject = '',
      tags = [],
      userId,
      userType
    } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
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

    // Save each question to database
    const savedQuestions = [];
    for (const q of questions) {
      const questionDoc = new Question({
        userId,
        userModel,
        sourceText: sourceText || '',
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        hint: q.hint || '',
        explanation: q.explanation || '',
        keyConcepts: keyConcepts,
        tags: tags,
        subject: subject,
        generationMetadata: {
          model: 'llama-3.3-70b-versatile',
          tokensUsed: 0,
          generatedAt: new Date()
        }
      });

      const saved = await questionDoc.save();
      savedQuestions.push(saved);
    }

    res.status(201).json({
      success: true,
      message: `${savedQuestions.length} questions saved successfully`,
      questions: savedQuestions
    });

  } catch (error) {
    console.error('Save questions error:', error);
    res.status(500).json({ 
      error: 'Failed to save questions',
      message: error.message 
    });
  }
};

// Get user's saved questions
const getUserQuestions = async (req, res) => {
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

    const questions = await Question.find({ 
      userId,
      userModel 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve questions',
      message: error.message 
    });
  }
};

// Extract key concepts from text
const extractConcepts = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const concepts = await extractKeyConcepts(text);

    res.json({
      success: true,
      concepts
    });

  } catch (error) {
    console.error('Concept extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract concepts',
      message: error.message 
    });
  }
};

// Delete a question
const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify ownership
    if (question.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this question' });
    }

    await Question.findByIdAndDelete(questionId);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      error: 'Failed to delete question',
      message: error.message 
    });
  }
};

// Update/Edit a question
const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { userId, updates } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!updates) {
      return res.status(400).json({ error: 'Updates are required' });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify ownership
    if (question.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this question' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'question', 'options', 'correctAnswer', 'hint', 
      'explanation', 'difficulty', 'subject', 'tags', 'type'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        question[key] = updates[key];
      }
    });

    // Mark as edited
    question.isEdited = true;

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      error: 'Failed to update question',
      message: error.message 
    });
  }
};

// Get questions with filters
const getFilteredQuestions = async (req, res) => {
  try {
    const { userId, userType, type, difficulty, subject, tags, search } = req.query;

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

    // Build filter
    const filter = { userId, userModel };
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    
    if (subject) {
      filter.subject = subject;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      if (tagArray.length > 0) {
        filter.tags = { $in: tagArray };
      }
    }
    
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { sourceText: { $regex: search, $options: 'i' } },
        { keyConcepts: { $regex: search, $options: 'i' } }
      ];
    }

    const questions = await Question.find(filter).sort({ createdAt: -1 });

    // Get unique subjects and tags for filters
    const allQuestions = await Question.find({ userId, userModel });
    const subjects = [...new Set(allQuestions.map(q => q.subject).filter(s => s))];
    const allTags = [...new Set(allQuestions.flatMap(q => q.tags))];

    res.json({
      success: true,
      count: questions.length,
      questions,
      filters: {
        subjects,
        tags: allTags
      }
    });

  } catch (error) {
    console.error('Get filtered questions error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve questions',
      message: error.message 
    });
  }
};

module.exports = {
  generateQuestionsFromAnswer,
  saveQuestions,
  getUserQuestions,
  extractConcepts,
  deleteQuestion,
  updateQuestion,
  getFilteredQuestions
};

