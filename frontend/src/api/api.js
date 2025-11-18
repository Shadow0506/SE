import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  updateSubscription: async (data) => {
    const response = await api.put('/auth/subscription', data);
    return response.data;
  },
};

export const questionAPI = {
  generateQuestions: async (data) => {
    const response = await api.post('/questions/generate', data);
    return response.data;
  },

  saveQuestions: async (data) => {
    const response = await api.post('/questions/save', data);
    return response.data;
  },

  getUserQuestions: async (userId, userType) => {
    const response = await api.get('/questions/user', {
      params: { userId, userType }
    });
    return response.data;
  },

  getFilteredQuestions: async (userId, userType, filters = {}) => {
    const response = await api.get('/questions/filtered', {
      params: { userId, userType, ...filters }
    });
    return response.data;
  },

  updateQuestion: async (questionId, userId, updates) => {
    const response = await api.put(`/questions/${questionId}`, {
      userId,
      updates
    });
    return response.data;
  },

  deleteQuestion: async (questionId, userId) => {
    const response = await api.delete(`/questions/${questionId}`, {
      data: { userId }
    });
    return response.data;
  },

  extractConcepts: async (text) => {
    const response = await api.post('/questions/extract-concepts', { text });
    return response.data;
  },
};

export const quizAPI = {
  createQuiz: async (data) => {
    const response = await api.post('/quizzes/create', data);
    return response.data;
  },

  createRandomQuiz: async (data) => {
    const response = await api.post('/quizzes/create-random', data);
    return response.data;
  },

  getQuiz: async (quizId, userId, userType) => {
    const response = await api.get(`/quizzes/${quizId}`, {
      params: { userId, userType }
    });
    return response.data;
  },

  submitAnswer: async (data) => {
    const response = await api.post('/quizzes/submit-answer', data);
    return response.data;
  },

  completeQuiz: async (quizId, userId) => {
    const response = await api.post('/quizzes/complete', { quizId, userId });
    return response.data;
  },

  getUserQuizzes: async (userId, userType, status = null) => {
    const params = { userId, userType };
    if (status) params.status = status;
    const response = await api.get('/quizzes/user/all', { params });
    return response.data;
  },

  getStatistics: async (userId, userType) => {
    const response = await api.get('/quizzes/user/statistics', {
      params: { userId, userType }
    });
    return response.data;
  },

  getAdaptiveDifficulty: async (userId, userType) => {
    const response = await api.get('/quizzes/user/adaptive-difficulty', {
      params: { userId, userType }
    });
    return response.data;
  },

  deleteQuiz: async (quizId, userId) => {
    const response = await api.delete(`/quizzes/${quizId}`, {
      data: { userId }
    });
    return response.data;
  },
};

export const exportAPI = {
  exportPDF: async (questionIds, options = {}) => {
    const response = await api.post('/export/pdf', {
      questionIds,
      ...options
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportDOCX: async (questionIds, options = {}) => {
    const response = await api.post('/export/docx', {
      questionIds,
      ...options
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const uploadAPI = {
  // Single file upload
  uploadFile: async (formData) => {
    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Bulk file upload (faculty only)
  uploadBulkFiles: async (formData) => {
    const response = await api.post('/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get user's uploaded documents
  getUserDocuments: async (userId, userType) => {
    const response = await api.get('/upload/documents', {
      params: { userId, userType }
    });
    return response.data;
  },

  // Delete uploaded document
  deleteDocument: async (documentId, userId, userType) => {
    const response = await api.delete(`/upload/documents/${documentId}`, {
      data: { userId, userType }
    });
    return response.data;
  },

  // Get user's quota information
  getUserQuota: async (userId, userType) => {
    const response = await api.get('/upload/quota', {
      params: { userId, userType }
    });
    return response.data;
  },

  // Generate questions from uploaded document
  generateFromDocument: async (documentId, data) => {
    const response = await api.post(`/upload/documents/${documentId}/generate`, data);
    return response.data;
  }
};

export default api;
