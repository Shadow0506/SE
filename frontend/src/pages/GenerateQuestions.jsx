import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../api/api';

const GenerateQuestions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState({
    mcq: true,
    short: true,
    truefalse: true,
    application: true,
  });
  const [subject, setSubject] = useState('');
  const [tags, setTags] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [extractingConcepts, setExtractingConcepts] = useState(false);
  const [error, setError] = useState('');
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const MAX_CHARS = 30000;
  const charCount = answerText.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleQuestionTypeToggle = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getSelectedQuestionTypes = () => {
    return Object.keys(questionTypes).filter(type => questionTypes[type]);
  };

  const handleExtractConcepts = async () => {
    if (!answerText.trim()) {
      setError('Please enter some text first');
      return;
    }

    setExtractingConcepts(true);
    setError('');

    try {
      const response = await questionAPI.extractConcepts(answerText);
      setKeyConcepts(response.concepts || []);
    } catch (err) {
      console.error('Concept extraction error:', err);
      setError('Failed to extract concepts');
    } finally {
      setExtractingConcepts(false);
    }
  };

  const handleGenerate = async () => {
    setError('');
    
    // Validation
    if (!answerText.trim()) {
      setError('Please enter some text to generate questions from');
      return;
    }

    if (answerText.length > MAX_CHARS) {
      setError(`Text exceeds maximum length of ${MAX_CHARS.toLocaleString()} characters`);
      return;
    }

    const selectedTypes = getSelectedQuestionTypes();
    if (selectedTypes.length === 0) {
      setError('Please select at least one question type');
      return;
    }

    setLoading(true);

    try {
      const response = await questionAPI.generateQuestions({
        answerText,
        difficulty,
        questionCount,
        questionTypes: selectedTypes,
        subject,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        userId: user.id,
        userType: user.userType
      });

      setGeneratedQuestions(response.questions || []);
      setKeyConcepts(response.keyConcepts || []);
      setShowResults(true);
    } catch (err) {
      console.error('Question generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (generatedQuestions.length === 0) {
      setError('No questions to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await questionAPI.saveQuestions({
        questions: generatedQuestions,
        sourceText: answerText,
        keyConcepts,
        subject,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        userId: user.id,
        userType: user.userType
      });

      alert('Questions saved successfully!');
      // Reset form
      setAnswerText('');
      setGeneratedQuestions([]);
      setKeyConcepts([]);
      setShowResults(false);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save questions');
    } finally {
      setLoading(false);
    }
  };

  const handleNewGeneration = () => {
    setShowResults(false);
    setGeneratedQuestions([]);
    setKeyConcepts([]);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">Generate Questions</h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/question-bank')}
                className="bg-white/20 hover:bg-white hover:text-primary-500 border-2 border-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                📚 View Saved Questions
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white/20 hover:bg-white hover:text-primary-500 border-2 border-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <>
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Enter Your Answer/Content</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Text
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Paste or type your answer, notes, code, or formulas here..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y font-mono text-sm"
                  disabled={loading}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${charPercentage > 90 ? 'text-red-600' : 'text-gray-600'}`}>
                    {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                  </span>
                  <button
                    onClick={handleExtractConcepts}
                    disabled={extractingConcepts || !answerText.trim()}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium disabled:opacity-50"
                  >
                    {extractingConcepts ? 'Extracting...' : '🔍 Extract Key Concepts'}
                  </button>
                </div>
                {charPercentage > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        charPercentage > 90 ? 'bg-red-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(charPercentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {keyConcepts.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Key Concepts Detected:</h3>
                  <div className="flex flex-wrap gap-2">
                    {keyConcepts.map((concept, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics, Physics, Programming"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Optional, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., chapter1, midterm, algorithms"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Question Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Difficulty Level
                  </label>
                  <div className="space-y-2">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <label key={level} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value={level}
                          checked={difficulty === level}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="ml-3 capitalize text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Number of Questions: {questionCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                  </div>
                </div>
              </div>

              {/* Question Types */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'mcq', label: 'Multiple Choice', icon: '📝' },
                    { key: 'short', label: 'Short Answer', icon: '✍️' },
                    { key: 'truefalse', label: 'True/False', icon: '✓✗' },
                    { key: 'application', label: 'Application', icon: '🧠' },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        questionTypes[key]
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={questionTypes[key]}
                        onChange={() => handleQuestionTypeToggle(key)}
                        className="sr-only"
                      />
                      <span className="text-2xl mr-2">{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !answerText.trim()}
                className="w-full mt-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Questions...
                  </span>
                ) : (
                  '🚀 Generate Questions'
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results Section */
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Generated Questions ({generatedQuestions.length})
              </h2>
              <div className="space-x-3">
                <button
                  onClick={handleNewGeneration}
                  className="px-4 py-2 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-all"
                >
                  New Generation
                </button>
                <button
                  onClick={handleSaveQuestions}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : '💾 Save Questions'}
                </button>
              </div>
            </div>

            {keyConcepts.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Key Concepts:</h3>
                <div className="flex flex-wrap gap-2">
                  {keyConcepts.map((concept, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {generatedQuestions.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-bold">
                        {index + 1}
                      </span>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                          {q.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-lg font-semibold text-gray-800 mb-4">{q.question}</p>

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {q.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            option.startsWith(q.correctAnswer) || option.includes(`${q.correctAnswer})`)
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type !== 'mcq' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Answer:</p>
                      <p className="text-gray-800">{q.correctAnswer}</p>
                    </div>
                  )}

                  {q.hint && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">💡 Hint:</p>
                      <p className="text-gray-800 text-sm">{q.hint}</p>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">📖 Explanation:</p>
                      <p className="text-gray-800 text-sm">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateQuestions;
