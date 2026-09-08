import api from './api';

export const weeklyService = {
  // Admin weekly operations
  createWeeklyTest: async (testData) => {
    const response = await api.post('/admin/weekly', testData);
    return response.data;
  },

  updateWeeklyTest: async (id, testData) => {
    const response = await api.put(`/admin/weekly/${id}`, testData);
    return response.data;
  },

  deleteWeeklyTest: async (id) => {
    const response = await api.delete(`/admin/weekly/${id}`);
    return response.data;
  },

  addQuestionsToWeeklyTest: async (id, questionIds) => {
    const response = await api.post(`/admin/weekly/${id}/questions`, { questionIds });
    return response.data;
  },

  getAllWeeklyTestsAdmin: async () => {
    const response = await api.get('/admin/weekly');
    return response.data;
  },

  // Student weekly operations
  getActiveWeeklyTest: async () => {
    const response = await api.get('/student/weekly/active');
    return response.data;
  },

  getStudentWeeklyHistory: async () => {
    const response = await api.get('/student/weekly/history');
    return response.data;
  }
};
