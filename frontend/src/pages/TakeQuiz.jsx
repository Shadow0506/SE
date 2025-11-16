import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { quizAPI, questionAPI } from '../api/api';

const TakeQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizId, setQuizId] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  
  // Timer
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (user && location.state?.questionIds) {
      initializeQuiz();
    } else if (user && location.state?.quizId) {
      loadExistingQuiz();
    } else if (user && !location.state) {
      navigate('/question-bank');
    }
  }, [user, location.state]);

  // Timer for current question
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { questionIds, title } = location.state;
      
      // Create quiz
      const response = await quizAPI.createQuiz({
        title: title || 'Practice Quiz',
        questionIds,
        userId: user.id,
        userType: user.userType,
        shuffleQuestions: false,
        shuffleOptions: false
      });
      
      setQuiz(response.quiz);
      setQuizId(response.quiz._id);
      setQuestions(response.quiz.questions.map(q => q.questionId));
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Initialize quiz error:', err);
      setError('Failed to initialize quiz');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { quizId: existingQuizId } = location.state;
      
      const response = await quizAPI.getQuiz(existingQuizId, user.id, user.userType);
      
      setQuiz(response.quiz);
      setQuizId(response.quiz._id);
      setQuestions(response.quiz.questions.map(q => q.questionId));
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Load quiz error:', err);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex];
  };

  const handleAnswerChange = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      saveCurrentAnswer();
      setCurrentQuestionIndex(prev => prev + 1);
      setShowHint(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      saveCurrentAnswer();
      setCurrentQuestionIndex(prev => prev - 1);
      setShowHint(false);
      setQuestionStartTime(Date.now());
    }
  };

  const saveCurrentAnswer = async () => {
    const answer = userAnswers[currentQuestionIndex] || '';
    const questionTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const currentQ = getCurrentQuestion();
    
    // Show loading indicator for short answer and application questions (AI evaluation)
    const needsAIEvaluation = currentQ?.type === 'short' || currentQ?.type === 'application';
    if (needsAIEvaluation && answer.trim()) {
      setIsSavingAnswer(true);
    }
    
    try {
      await quizAPI.submitAnswer({
        quizId,
        questionIndex: currentQuestionIndex,
        userAnswer: answer,
        timeSpent: questionTime,
        userId: user.id
      });
    } catch (err) {
      console.error('Save answer error:', err);
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!confirm('Are you sure you want to submit the quiz? You cannot change your answers after submission.')) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      // Save current answer
      await saveCurrentAnswer();
      
      // Complete quiz
      const response = await quizAPI.completeQuiz(quizId, user.id);
      setResults(response.quiz);
      setQuizCompleted(true);
    } catch (err) {
      console.error('Submit quiz error:', err);
      setError('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answered = Object.keys(userAnswers).filter(key => userAnswers[key]).length;
    return Math.round((answered / questions.length) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Preparing your quiz...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/question-bank')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Back to Question Bank
          </button>
        </div>
      </div>
    );
  }

  // Quiz Completed - Results View
  if (quizCompleted && results) {
    const percentage = results.percentage;
    const passColor = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
    
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <h1 className="text-xl sm:text-2xl font-bold">Quiz Completed! 🎉</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className={`text-6xl font-bold mb-4 ${passColor}`}>
                {percentage}%
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {percentage >= 70 ? '🌟 Great Job!' : percentage >= 50 ? '👍 Good Effort!' : '💪 Keep Practicing!'}
              </h2>
              <p className="text-gray-600">
                {results.title}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {results.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatTime(results.totalTimeSpent)}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/my-progress')}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                View Progress
              </button>
              <button
                onClick={() => navigate('/question-bank')}
                className="flex-1 border-2 border-primary-500 text-primary-500 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Back to Question Bank
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-xl font-bold">{quiz?.title}</h1>
              <p className="text-sm text-white/80">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">Time</div>
              <div className="text-lg font-bold">{formatTime(timeSpent)}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{getProgressPercentage()}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          
          {/* Question Navigator */}
          <div className="flex flex-wrap gap-2 mt-4">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  saveCurrentAnswer();
                  setCurrentQuestionIndex(idx);
                  setQuestionStartTime(Date.now());
                }}
                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                  idx === currentQuestionIndex
                    ? 'bg-primary-500 text-white'
                    : userAnswers[idx]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
          {/* Question Type & Difficulty */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {currentQuestion.difficulty.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {currentQuestion.type.replace('mcq', 'Multiple Choice').replace('truefalse', 'True/False')}
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Answer Input */}
          <div className="mb-6">
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userAnswers[currentQuestionIndex] === option
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={option}
                      checked={userAnswers[currentQuestionIndex] === option}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="ml-3 font-medium text-gray-700">
                      {String.fromCharCode(65 + idx)}. {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'truefalse' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userAnswers[currentQuestionIndex] === option
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={option}
                      checked={userAnswers[currentQuestionIndex] === option}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="ml-3 font-medium text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {(currentQuestion.type === 'short' || currentQuestion.type === 'application') && (
              <textarea
                value={userAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                rows={currentQuestion.type === 'application' ? 8 : 4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500 resize-none"
              />
            )}
          </div>

          {/* Hint */}
          {currentQuestion.hint && (
            <div className="mb-6">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-2"
              >
                💡 {showHint ? 'Hide' : 'Show'} Hint
              </button>
              {showHint && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
                  {currentQuestion.hint}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSavingAnswer}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                currentQuestionIndex === 0 || isSavingAnswer
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ← Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={isSavingAnswer}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingAnswer ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Evaluating answer...</span>
                  </>
                ) : (
                  'Next →'
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || isSavingAnswer}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting || isSavingAnswer ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeQuiz;
