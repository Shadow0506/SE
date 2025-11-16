import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../api/api';

const MyProgress = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [statistics, setStatistics] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizDetails, setShowQuizDetails] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchStatistics();
      fetchQuizHistory();
    }
  }, [user]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await quizAPI.getStatistics(user.id, user.userType);
      setStatistics(response.statistics);
    } catch (err) {
      console.error('Fetch statistics error:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const response = await quizAPI.getUserQuizzes(user.id, user.userType, 'completed');
      setQuizHistory(response.quizzes || []);
    } catch (err) {
      console.error('Fetch quiz history error:', err);
    }
  };

  const handleViewQuizDetails = async (quizId) => {
    try {
      const response = await quizAPI.getQuiz(quizId, user.id, user.userType);
      setSelectedQuiz(response.quiz);
      setShowQuizDetails(true);
    } catch (err) {
      console.error('Fetch quiz details error:', err);
      alert('Failed to load quiz details');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 80) return { emoji: '🌟', message: 'Excellent!' };
    if (percentage >= 60) return { emoji: '👍', message: 'Good Job!' };
    if (percentage >= 40) return { emoji: '💪', message: 'Keep Practicing!' };
    return { emoji: '📚', message: 'More Practice Needed' };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (loading && !statistics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Loading your progress...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">My Progress</h1>
              <p className="text-sm sm:text-base text-white/80 mt-1">
                Track your learning journey
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {statistics && statistics.totalQuizzes === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Quiz History Yet</h3>
            <p className="text-gray-600 mb-6">
              Take some quizzes to start tracking your progress
            </p>
            <button
              onClick={() => navigate('/question-bank')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Create a Quiz
            </button>
          </div>
        )}

        {/* Statistics Available */}
        {statistics && statistics.totalQuizzes > 0 && (
          <>
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Quizzes</span>
                  <span className="text-2xl">📝</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {statistics.totalQuizzes}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Questions</span>
                  <span className="text-2xl">❓</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {statistics.totalQuestions}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className={`text-3xl font-bold ${getPercentageColor(statistics.averagePercentage)}`}>
                  {statistics.averagePercentage.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Time Spent</span>
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {formatTime(statistics.totalTimeSpent)}
                </div>
              </div>
            </div>

            {/* Performance by Difficulty */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Difficulty</h3>
              <div className="space-y-4">
                {Object.entries(statistics.performanceByDifficulty).map(([difficulty, data]) => (
                  data.total > 0 && (
                    <div key={difficulty}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {difficulty} ({data.correct}/{data.total})
                        </span>
                        <span className={`text-sm font-semibold ${getPercentageColor(data.percentage)}`}>
                          {data.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            difficulty === 'easy' ? 'bg-green-500' :
                            difficulty === 'medium' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Performance by Subject */}
            {Object.keys(statistics.performanceBySubject).length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Subject</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(statistics.performanceBySubject).map(([subject, data]) => (
                    <div key={subject} className="p-4 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-gray-800 mb-2">{subject}</div>
                      <div className="text-sm text-gray-600 mb-1">
                        {data.correct}/{data.total} correct ({data.quizCount} quiz{data.quizCount !== 1 ? 'zes' : ''})
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                      <div className={`text-sm font-semibold mt-1 ${getPercentageColor(data.percentage)}`}>
                        {data.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Quizzes */}
            {statistics.recentQuizzes && statistics.recentQuizzes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Quizzes</h3>
                <div className="space-y-3">
                  {statistics.recentQuizzes.map((quiz) => {
                    const performance = getPerformanceMessage(quiz.percentage);
                    return (
                      <div
                        key={quiz._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{quiz.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {quiz.subject && <span className="mr-3">📚 {quiz.subject}</span>}
                            <span>{new Date(quiz.completedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{performance.emoji}</span>
                            <span className={`text-2xl font-bold ${getPercentageColor(quiz.percentage)}`}>
                              {quiz.percentage}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {quiz.score}/{quiz.totalQuestions}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Quiz History */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quiz History ({quizHistory.length})
              </h3>
              
              {quizHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No quiz history available</p>
              ) : (
                <div className="space-y-3">
                  {quizHistory.map((quiz) => {
                    const performance = getPerformanceMessage(quiz.percentage);
                    return (
                      <div
                        key={quiz._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex-1 mb-3 sm:mb-0">
                          <div className="font-semibold text-gray-800 mb-1">{quiz.title}</div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            {quiz.subject && (
                              <span className="flex items-center gap-1">
                                <span>📚</span> {quiz.subject}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <span>📝</span> {quiz.totalQuestions} questions
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏱️</span> {formatTime(quiz.totalTimeSpent)}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📅</span> {new Date(quiz.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{performance.emoji}</span>
                              <div>
                                <div className={`text-xl font-bold ${getPercentageColor(quiz.percentage)}`}>
                                  {quiz.percentage}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {quiz.correctAnswers}/{quiz.totalQuestions}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleViewQuizDetails(quiz._id)}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm whitespace-nowrap"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Quiz Details Modal */}
      {showQuizDetails && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedQuiz.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Score: {selectedQuiz.percentage}% ({selectedQuiz.correctAnswers}/{selectedQuiz.totalQuestions})
                </p>
              </div>
              <button
                onClick={() => setShowQuizDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedQuiz.questions.map((q, idx) => {
                const question = q.questionId;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      q.isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-gray-800">
                        Question {idx + 1}: {question.question}
                      </div>
                      <div className="text-2xl">
                        {q.isCorrect ? '✅' : '❌'}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Your Answer: </span>
                        <span className={q.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {q.userAnswer || '(No answer)'}
                        </span>
                      </div>
                      
                      {/* AI Evaluation Feedback for short answer and application questions */}
                      {(question.type === 'short' || question.type === 'application') && q.aiFeedback && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">🤖 AI Feedback:</span>
                            <span className="text-blue-800">{q.aiFeedback}</span>
                          </div>
                          {q.aiScore !== null && q.aiScore !== undefined && (
                            <div className="mt-2">
                              <span className="font-medium text-blue-700">Score: </span>
                              <span className="text-blue-900 font-bold">{q.aiScore}/100</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!q.isCorrect && (
                        <div>
                          <span className="font-medium text-gray-700">Correct Answer: </span>
                          <span className="text-green-700">{question.correctAnswer}</span>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="font-medium text-gray-700">Explanation: </span>
                          <p className="text-gray-600 mt-1">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={() => setShowQuizDetails(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgress;
