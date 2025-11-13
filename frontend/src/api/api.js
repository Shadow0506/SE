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

  extractConcepts: async (text) => {
    const response = await api.post('/questions/extract-concepts', { text });
    return response.data;
  },
};

export default api;
