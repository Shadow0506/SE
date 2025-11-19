import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI, exportAPI } from '../api/api';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  
  // Selection
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');

  // View mode
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Export options
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeAnswers: true,
    includeHints: true
  });

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
      fetchQuestions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [questions, searchTerm, typeFilter, difficultyFilter, subjectFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await questionAPI.getUserQuestions(user.id, user.userType);
      setQuestions(response.questions || []);
      
      // Extract unique subjects
      const subjects = [...new Set(response.questions.map(q => q.subject).filter(s => s))];
      setAvailableSubjects(subjects);
      
      // Extract unique tags
      const tags = [...new Set(response.questions.flatMap(q => q.tags || []))];
      setAvailableTags(tags);
    } catch (err) {
      console.error('Fetch questions error:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(term) ||
        q.sourceText.toLowerCase().includes(term) ||
        q.keyConcepts.some(k => k.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.type === typeFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(q => q.subject === subjectFilter);
    }

    setFilteredQuestions(filtered);
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q._id));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await questionAPI.deleteQuestion(questionId, user.id);
      setQuestions(prev => prev.filter(q => q._id !== questionId));
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete question');
    }
  };

  const handleCreateQuiz = () => {
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }
    setShowQuizModal(true);
  };

  const handleStartQuiz = () => {
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    
    // Navigate to quiz with selected questions
    navigate('/take-quiz', { 
      state: { 
        questionIds: selectedQuestions,
        title: quizTitle
      } 
    });
  };

  const handleExportClick = () => {
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question to export');
      return;
    }
    setShowExportModal(true);
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      let blob;
      
      if (format === 'pdf') {
        blob = await exportAPI.exportPDF(selectedQuestions, user.id, exportOptions);
      } else {
        blob = await exportAPI.exportDOCX(selectedQuestions, user.id, exportOptions);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `questions-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
      alert(`Successfully exported ${selectedQuestions.length} question(s) as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export questions');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return '📝';
      case 'short': return '✍️';
      case 'truefalse': return '✓✗';
      case 'application': return '🧠';
      default: return '❓';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Question Bank</h1>
              <p className="text-sm sm:text-base text-white/80 mt-1">
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} available
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
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="mcq">Multiple Choice</option>
                <option value="short">Short Answer</option>
                <option value="truefalse">True/False</option>
                <option value="application">Application</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all' || subjectFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setDifficultyFilter('all');
                setSubjectFilter('all');
              }}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Actions Bar */}
        {filteredQuestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({selectedQuestions.length} selected)
                </span>
              </label>
            </div>
            
            {selectedQuestions.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleExportClick}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  📥 Export ({selectedQuestions.length})
                </button>
                <button
                  onClick={handleCreateQuiz}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Create Quiz ({selectedQuestions.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading questions...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredQuestions.length === 0 && questions.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Questions Yet</h3>
            <p className="text-gray-600 mb-6">
              Generate and save questions to build your question bank
            </p>
            <button
              onClick={() => navigate('/generate-questions')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Generate Questions
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredQuestions.length === 0 && questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Matching Questions</h3>
            <p className="text-gray-600">
              Try adjusting your filters or search term
            </p>
          </div>
        )}

        {/* Questions List */}
        {!loading && filteredQuestions.length > 0 && (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={question._id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question._id)}
                      onChange={() => handleSelectQuestion(question._id)}
                      className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-2xl">{getTypeIcon(question.type)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {question.type.replace('mcq', 'Multiple Choice').replace('truefalse', 'True/False')}
                          </span>
                          {question.subject && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {question.subject}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(question._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Question */}
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        {question.question}
                      </h4>

                      {/* Options for MCQ */}
                      {question.type === 'mcq' && question.options && question.options.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {question.options.map((option, idx) => (
                            <div
                              key={idx}
                              className={`px-4 py-2 rounded-lg border ${
                                option === question.correctAnswer
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                              {option}
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Correct Answer (for non-MCQ) */}
                      {question.type !== 'mcq' && (
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-700">Correct Answer: </span>
                          <span className="text-sm text-gray-600">{question.correctAnswer}</span>
                        </div>
                      )}

                      {/* Expandable Details */}
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === question._id ? null : question._id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2"
                      >
                        {expandedQuestion === question._id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>

                      {expandedQuestion === question._id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                          {question.explanation && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Explanation: </span>
                              <p className="text-sm text-gray-600 mt-1">{question.explanation}</p>
                            </div>
                          )}
                          
                          {question.hint && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Hint: </span>
                              <p className="text-sm text-gray-600 mt-1">{question.hint}</p>
                            </div>
                          )}

                          {question.keyConcepts && question.keyConcepts.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Key Concepts: </span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {question.keyConcepts.map((concept, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {question.tags && question.tags.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Tags: </span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {question.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                            Created: {new Date(question.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create Quiz</h3>
            <p className="text-gray-600 mb-4">
              You've selected {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} for this quiz.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g., Practice Quiz 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizTitle('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStartQuiz}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Export Questions</h3>
            <p className="text-gray-600 mb-4">
              Exporting {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''}
            </p>
            
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Export Options</h4>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAnswers}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeAnswers: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Include Answers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeHints}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeHints: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Include Hints</span>
              </label>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Export Format</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 disabled:opacity-50"
                >
                  <span className="text-3xl mb-2">📄</span>
                  <span className="text-sm font-semibold">PDF</span>
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 disabled:opacity-50"
                >
                  <span className="text-3xl mb-2">📝</span>
                  <span className="text-sm font-semibold">DOCX</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
