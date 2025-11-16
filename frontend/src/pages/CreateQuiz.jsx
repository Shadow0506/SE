import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, questionAPI } from '../api/api';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Quiz Mode: 'random' or 'generate'
  const [quizMode, setQuizMode] = useState('random');
  
  // Random Quiz Mode States
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [subject, setSubject] = useState('');
  const [questionType, setQuestionType] = useState('all');
  const [quizTitle, setQuizTitle] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [totalAvailableQuestions, setTotalAvailableQuestions] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(null);
  
  // Generate from Text Mode States
  const [answerText, setAnswerText] = useState('');
  const [generateQuestionCount, setGenerateQuestionCount] = useState(5);
  const [generateDifficulty, setGenerateDifficulty] = useState('medium');
  const [generateQuestionTypes, setGenerateQuestionTypes] = useState({
    mcq: true,
    short: true,
    truefalse: true,
    application: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MAX_CHARS = 30000;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (user && quizMode === 'random') {
      fetchAvailableQuestions();
      fetchAdaptiveDifficulty();
    }
  }, [user, quizMode]);

  const fetchAvailableQuestions = async () => {
    try {
      const response = await questionAPI.getUserQuestions(user.id, user.userType);
      setTotalAvailableQuestions(response.questions.length);
      
      // Extract unique subjects
      const subjects = [...new Set(response.questions.map(q => q.subject).filter(s => s))];
      setAvailableSubjects(subjects);
    } catch (err) {
      console.error('Fetch questions error:', err);
    }
  };

  const fetchAdaptiveDifficulty = async () => {
    try {
      const response = await quizAPI.getAdaptiveDifficulty(user.id, user.userType);
      setAdaptiveDifficulty(response.adaptiveDifficulty);
    } catch (err) {
      console.error('Fetch adaptive difficulty error:', err);
    }
  };

  const handleCreateRandomQuiz = async () => {
    if (!quizTitle.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    if (questionCount < 1) {
      setError('Please select at least 1 question');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await quizAPI.createRandomQuiz({
        title: quizTitle,
        questionCount,
        difficulty: difficulty === 'adaptive' ? adaptiveDifficulty?.currentLevel : difficulty,
        subject: subject || undefined,
        type: questionType === 'all' ? undefined : questionType,
        userId: user.id,
        userType: user.userType
      });

      // Navigate to quiz
      navigate('/take-quiz', { 
        state: { 
          quizId: response.quiz._id,
          fromRandom: true
        } 
      });
    } catch (err) {
      console.error('Create random quiz error:', err);
      setError(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndTakeQuiz = async () => {
    if (!answerText.trim()) {
      setError('Please enter some text to generate questions from');
      return;
    }

    if (answerText.length > MAX_CHARS) {
      setError(`Text exceeds maximum length of ${MAX_CHARS.toLocaleString()} characters`);
      return;
    }

    if (!quizTitle.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    const selectedTypes = Object.keys(generateQuestionTypes).filter(type => generateQuestionTypes[type]);
    if (selectedTypes.length === 0) {
      setError('Please select at least one question type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate questions
      const generateResponse = await questionAPI.generateQuestions({
        answerText,
        difficulty: generateDifficulty,
        questionCount: generateQuestionCount,
        questionTypes: selectedTypes,
        subject: subject || '',
        tags: [],
        userId: user.id,
        userType: user.userType
      });

      // Save questions temporarily
      const saveResponse = await questionAPI.saveQuestions({
        questions: generateResponse.questions,
        sourceText: answerText,
        keyConcepts: generateResponse.keyConcepts || [],
        subject: subject || '',
        tags: ['instant-quiz'],
        userId: user.id,
        userType: user.userType
      });

      // Create quiz from saved questions
      const questionIds = saveResponse.questions.map(q => q._id);
      const quizResponse = await quizAPI.createQuiz({
        title: quizTitle,
        questionIds,
        userId: user.id,
        userType: user.userType
      });

      // Navigate to quiz
      navigate('/take-quiz', { 
        state: { 
          quizId: quizResponse.quiz._id,
          fromGenerate: true
        } 
      });
    } catch (err) {
      console.error('Generate and take quiz error:', err);
      setError(err.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Create Quiz</h1>
              <p className="text-sm sm:text-base text-white/80 mt-1">
                Choose your quiz mode and get started
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/20 hover:bg-white hover:text-primary-500 border-2 border-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Quiz Mode</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setQuizMode('random')}
              className={`p-6 rounded-lg border-2 transition-all ${
                quizMode === 'random'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="text-4xl mb-3">🎲</div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Random from Saved</h4>
              <p className="text-sm text-gray-600">
                Create a quiz from your existing question bank with random selection
              </p>
              {totalAvailableQuestions > 0 && (
                <p className="text-xs text-primary-600 mt-2 font-medium">
                  {totalAvailableQuestions} questions available
                </p>
              )}
            </button>

            <button
              onClick={() => setQuizMode('generate')}
              className={`p-6 rounded-lg border-2 transition-all ${
                quizMode === 'generate'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="text-4xl mb-3">✨</div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Generate from Text</h4>
              <p className="text-sm text-gray-600">
                Instantly generate and take a quiz from any text content
              </p>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Random Quiz Mode */}
        {quizMode === 'random' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Random Quiz Configuration</h3>

            {totalAvailableQuestions === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📚</div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">No Questions Available</h4>
                <p className="text-gray-600 mb-6">
                  You need to generate and save questions first
                </p>
                <button
                  onClick={() => navigate('/generate-questions')}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Generate Questions
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quiz Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g., Random Practice Quiz"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions: {questionCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={Math.min(50, totalAvailableQuestions)}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>{Math.min(50, totalAvailableQuestions)} max</span>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="mixed">Mixed Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    {adaptiveDifficulty && user.userType === 'student' && (
                      <option value="adaptive">
                        Adaptive ({adaptiveDifficulty.currentLevel}) - Recommended
                      </option>
                    )}
                  </select>
                  {adaptiveDifficulty && difficulty === 'adaptive' && (
                    <p className="text-xs text-blue-600 mt-2">
                      🎯 Current streak: {adaptiveDifficulty.consecutiveCorrect} correct, {adaptiveDifficulty.consecutiveIncorrect} incorrect
                    </p>
                  )}
                </div>

                {/* Subject Filter */}
                {availableSubjects.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject (Optional)
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Subjects</option>
                      {availableSubjects.map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="short">Short Answer</option>
                    <option value="truefalse">True/False</option>
                    <option value="application">Application</option>
                  </select>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateRandomQuiz}
                  disabled={loading}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Quiz...' : 'Create & Start Quiz'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generate from Text Mode */}
        {quizMode === 'generate' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Generate Quiz from Text</h3>

            <div className="space-y-6">
              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 Practice Quiz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Text Content *
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Paste or type your study material, notes, or any content here..."
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y font-mono text-sm"
                  disabled={loading}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${answerText.length > MAX_CHARS * 0.9 ? 'text-red-600' : 'text-gray-600'}`}>
                    {answerText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                  </span>
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions: {generateQuestionCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={generateQuestionCount}
                  onChange={(e) => setGenerateQuestionCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map(level => (
                    <button
                      key={level}
                      onClick={() => setGenerateDifficulty(level)}
                      className={`px-4 py-2 rounded-lg border-2 font-semibold capitalize transition-all ${
                        generateDifficulty === level
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Types
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'mcq', label: 'Multiple Choice' },
                    { key: 'short', label: 'Short Answer' },
                    { key: 'truefalse', label: 'True/False' },
                    { key: 'application', label: 'Application' }
                  ].map(type => (
                    <label
                      key={type.key}
                      className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-primary-300 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={generateQuestionTypes[type.key]}
                        onChange={() => setGenerateQuestionTypes(prev => ({
                          ...prev,
                          [type.key]: !prev[type.key]
                        }))}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Database Management"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAndTakeQuiz}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Quiz...' : 'Generate & Start Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuiz;
