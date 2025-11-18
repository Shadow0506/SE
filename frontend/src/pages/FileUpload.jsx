import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, questionAPI } from '../api/api';

const FileUpload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [generateNow, setGenerateNow] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quota, setQuota] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [generatingForDoc, setGeneratingForDoc] = useState(null);
  
  // Modal states for question generation
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedDocForGeneration, setSelectedDocForGeneration] = useState(null);
  const [generationConfig, setGenerationConfig] = useState({
    difficulty: 'medium',
    questionCount: 5,
    questionTypes: ['mcq', 'short', 'truefalse', 'application']
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionsPreview, setShowQuestionsPreview] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);

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
      fetchQuota();
      fetchDocuments();
    }
  }, [user]);

  // Re-fetch quota when page gains focus (after returning from pricing page)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        // Update user from localStorage in case it changed
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const updatedUser = JSON.parse(storedUser);
          setUser(updatedUser);
          fetchQuota();
          fetchDocuments();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchQuota = async () => {
    try {
      const response = await uploadAPI.getUserQuota(user.id, user.userType);
      setQuota(response.quota);
    } catch (err) {
      console.error('Fetch quota error:', err);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await uploadAPI.getUserDocuments(user.id, user.userType);
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('Fetch documents error:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
        setFile(null);
        return;
      }

      // Check file size (10 MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10 MB limit.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('userType', user.userType);
      formData.append('subject', subject);
      formData.append('generateQuestionsNow', generateNow.toString());

      const response = await uploadAPI.uploadFile(formData);

      setSuccess(`File uploaded successfully! ${generateNow ? 'Questions generated.' : ''}`);
      setFile(null);
      setSubject('');
      setGenerateNow(false);
      
      // Reset file input
      document.getElementById('fileInput').value = '';

      // Refresh quota and documents
      await fetchQuota();
      await fetchDocuments();

      if (response.generatedQuestions && response.generatedQuestions.length > 0) {
        setTimeout(() => {
          navigate('/question-bank');
        }, 2000);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await uploadAPI.deleteDocument(documentId, user.id, user.userType);
      setSuccess('Document deleted successfully');
      await fetchQuota();
      await fetchDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete document');
    }
  };

  const handleGenerateFromDocument = async (documentId) => {
    const doc = documents.find(d => d._id === documentId);
    setSelectedDocForGeneration(doc);
    setShowGenerateModal(true);
  };

  const handleGenerateQuestions = async () => {
    if (!selectedDocForGeneration) return;
    
    setGeneratingForDoc(selectedDocForGeneration._id);
    setError('');

    try {
      const response = await uploadAPI.generateFromDocument(selectedDocForGeneration._id, {
        userId: user.id,
        userType: user.userType,
        difficulty: generationConfig.difficulty,
        questionCount: generationConfig.questionCount,
        questionTypes: generationConfig.questionTypes
      });

      setGeneratedQuestions(response.questions || []);
      setSelectedQuestions(response.questions?.map((_, idx) => idx) || []); // Select all by default
      await fetchQuota(); // Refresh quota after generation
      
      // Close config modal and show preview
      setShowGenerateModal(false);
      setShowQuestionsPreview(true);

    } catch (err) {
      console.error('Generate from document error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setGeneratingForDoc(null);
    }
  };

  const handleSaveSelectedQuestions = async () => {
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question to save');
      return;
    }

    if (!selectedDocForGeneration || !selectedDocForGeneration.extractedText) {
      setError('Document text not available. Please try generating questions again.');
      return;
    }

    setSavingQuestions(true);
    setError('');

    try {
      const questionsToSave = selectedQuestions.map(idx => ({
        ...generatedQuestions[idx],
        sourceText: selectedDocForGeneration.extractedText || '' // Add sourceText from document
      }));
      
      console.log('Saving questions with sourceText:', questionsToSave[0]?.sourceText?.substring(0, 100)); // Debug log
      
      const response = await questionAPI.saveQuestions({
        userId: user.id,
        userType: user.userType,
        questions: questionsToSave
      });

      setSuccess(`Successfully saved ${selectedQuestions.length} question(s)!`);
      setShowQuestionsPreview(false);
      setGeneratedQuestions([]);
      setSelectedQuestions([]);
      
      // Navigate to question bank after a short delay
      setTimeout(() => {
        navigate('/question-bank');
      }, 1500);

    } catch (err) {
      console.error('Save questions error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save questions');
    } finally {
      setSavingQuestions(false);
    }
  };

  const toggleQuestionSelection = (index) => {
    if (selectedQuestions.includes(index)) {
      setSelectedQuestions(selectedQuestions.filter(i => i !== index));
    } else {
      setSelectedQuestions([...selectedQuestions, index]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === generatedQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(generatedQuestions.map((_, idx) => idx));
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    if (!quota) return 0;
    return Math.round((quota.storageUsed / quota.storageLimit) * 100);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'txt': return '📃';
      default: return '📁';
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
              <h1 className="text-xl sm:text-2xl font-bold">File Upload</h1>
              <p className="text-sm sm:text-base text-white/80 mt-1">
                Upload PDF, DOCX, or TXT files to generate questions
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
        {/* Quota Information */}
        {quota && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Quota</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Storage Used</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatBytes(quota.storageUsed)}
                </div>
                <div className="text-xs text-gray-500">of {formatBytes(quota.storageLimit)}</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Uploads Today</div>
                <div className="text-2xl font-bold text-green-600">
                  {quota.uploadsToday} / {quota.uploadsLimit}
                </div>
                <div className="text-xs text-gray-500">Resets daily</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Generations Today</div>
                <div className="text-2xl font-bold text-purple-600">
                  {quota.generationsToday} / {quota.generationsLimit}
                </div>
                <div className="text-xs text-gray-500">Resets daily</div>
              </div>
            </div>

            {/* Storage Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Storage</span>
                <span>{getStoragePercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    getStoragePercentage() >= 90 ? 'bg-red-500' :
                    getStoragePercentage() >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload File</h3>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (PDF, DOCX, or TXT)
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({formatBytes(file.size)})
                </div>
              )}
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
                placeholder="e.g., Database Management Systems"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Generate Questions Now */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generateNow"
                checked={generateNow}
                onChange={(e) => setGenerateNow(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="generateNow" className="text-sm text-gray-700 cursor-pointer">
                Generate questions immediately after upload
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Uploaded Documents</h3>

          {loadingDocs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">📁</div>
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                        <div>
                          <div className="font-semibold text-gray-800">{doc.fileName}</div>
                          <div className="text-sm text-gray-500">
                            {formatBytes(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {doc.subject && (
                        <div className="text-sm text-gray-600 mb-2">
                          Subject: <span className="font-medium">{doc.subject}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                          doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          doc.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        {doc.extractedText && (
                          <span className="text-xs text-gray-500">
                            {doc.extractedText.length} characters extracted
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleGenerateFromDocument(doc._id);
                        }}
                        disabled={generatingForDoc === doc._id || doc.status !== 'completed'}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {generatingForDoc === doc._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            <span>Generate Questions</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteDocument(doc._id);
                        }}
                        className="text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-all text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap border border-red-200"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Questions Configuration Modal */}
      {showGenerateModal && selectedDocForGeneration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Questions</h2>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600">Document:</div>
              <div className="font-semibold text-gray-900">{selectedDocForGeneration.fileName}</div>
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
              <select
                value={generationConfig.difficulty}
                onChange={(e) => setGenerationConfig({...generationConfig, difficulty: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Question Count */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions: {generationConfig.questionCount}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={generationConfig.questionCount}
                onChange={(e) => setGenerationConfig({...generationConfig, questionCount: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* Question Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Types</label>
              <div className="space-y-2">
                {[
                  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
                  { value: 'short', label: 'Short Answer' },
                  { value: 'truefalse', label: 'True/False' },
                  { value: 'application', label: 'Application Questions' }
                ].map(type => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generationConfig.questionTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGenerationConfig({
                            ...generationConfig,
                            questionTypes: [...generationConfig.questionTypes, type.value]
                          });
                        } else {
                          setGenerationConfig({
                            ...generationConfig,
                            questionTypes: generationConfig.questionTypes.filter(t => t !== type.value)
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generatingForDoc}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateQuestions}
                disabled={generatingForDoc || generationConfig.questionTypes.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingForDoc ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Preview Modal */}
      {showQuestionsPreview && generatedQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generated Questions</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedQuestions.length} of {generatedQuestions.length} selected
                  </p>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {selectedQuestions.length === generatedQuestions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedQuestions.includes(idx)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(idx)}
                        onChange={() => toggleQuestionSelection(idx)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded">
                            {q.type.toUpperCase()}
                          </span>
                          <span className="text-xs font-semibold text-white bg-purple-600 px-2 py-1 rounded capitalize">
                            {q.difficulty}
                          </span>
                        </div>

                        <p className="font-semibold text-gray-900 mb-3">{q.question}</p>

                        {q.type === 'mcq' && q.options && (
                          <div className="space-y-2 mb-3">
                            {q.options.map((option, optIdx) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded ${
                                  option.startsWith(q.correctAnswer)
                                    ? 'bg-green-100 border border-green-300'
                                    : 'bg-gray-50'
                                }`}
                              >
                                {option}
                                {option.startsWith(q.correctAnswer) && (
                                  <span className="ml-2 text-green-600 font-semibold">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type !== 'mcq' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <div className="text-xs font-semibold text-green-800 mb-1">Correct Answer:</div>
                            <p className="text-gray-800">{q.correctAnswer}</p>
                          </div>
                        )}

                        {q.hint && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                            <div className="text-xs font-semibold text-yellow-800 mb-1">💡 Hint:</div>
                            <p className="text-sm text-gray-700">{q.hint}</p>
                          </div>
                        )}

                        {q.explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-xs font-semibold text-blue-800 mb-1">📖 Explanation:</div>
                            <p className="text-sm text-gray-700">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuestionsPreview(false);
                    setGeneratedQuestions([]);
                    setSelectedQuestions([]);
                  }}
                  disabled={savingQuestions}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSelectedQuestions}
                  disabled={savingQuestions || selectedQuestions.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingQuestions ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Selected ({selectedQuestions.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
