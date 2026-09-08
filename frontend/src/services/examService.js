import api from './api';

export const examService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getTopics: async (category = '') => {
    const response = await api.get('/topics', { params: { category } });
    return response.data;
  },

  getCategoryDetails: async () => {
    const response = await api.get('/categories/details');
    return response.data;
  },

  getExamQuestions: async (params = {}) => {
    const response = await api.get('/exam', { params });
    return response.data;
  },

  submitExamResult: async (payload) => {
    const response = await api.post('/results', payload);
    return response.data;
  },

  getLeaderboard: async (params = {}) => {
    const response = await api.get('/leaderboard', { params });
    return response.data;
  }
};
