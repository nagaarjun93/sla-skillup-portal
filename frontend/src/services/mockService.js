import api from './api';

export const mockService = {
  // Admin mock operations
  saveBulkMockQuestions: async (questions, targetModelSet = 'Model 1', replaceExisting = false) => {
    const response = await api.post('/admin/mock/questions/save-bulk', { questions, targetModelSet, replaceExisting });
    return response.data;
  },

  clearModelQuestions: async (modelSet) => {
    const response = await api.delete(`/admin/mock/models/${encodeURIComponent(modelSet)}/questions`);
    return response.data;
  },

  uploadMockQuestionsCsv: async (formData) => {
    const response = await api.post('/admin/mock/questions/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMockQuestions: async (params = {}) => {
    const response = await api.get('/admin/mock/questions', { params });
    return response.data;
  },

  updateMockQuestion: async (id, questionData) => {
    const response = await api.put(`/admin/mock/questions/${id}`, questionData);
    return response.data;
  },

  deleteMockQuestion: async (id) => {
    const response = await api.delete(`/admin/mock/questions/${id}`);
    return response.data;
  },

  getMockSettings: async () => {
    const response = await api.get('/admin/mock/settings');
    return response.data;
  },

  updateMockSettings: async (settings) => {
    const response = await api.put('/admin/mock/settings', settings);
    return response.data;
  },

  getMockModelsStats: async () => {
    const response = await api.get('/admin/mock/models-stats');
    return response.data;
  },

  assignStudentMockModel: async (studentId, modelSet) => {
    const response = await api.post('/admin/mock/assign-student-model', { studentId, modelSet });
    return response.data;
  },

  autoDistributeMockModels: async () => {
    const response = await api.post('/admin/mock/auto-distribute-models');
    return response.data;
  },

  updateStudentMockEligibility: async (studentId, accessEnabled) => {
    const response = await api.put('/admin/students/mock-access', { studentIds: [studentId], accessEnabled });
    return response.data;
  },

  setBulkMockEligibility: async (accessEnabled) => {
    const response = await api.put('/admin/students/mock-access', { accessList: [], studentIds: [], accessEnabled });
    const studentsRes = await api.get('/admin/students');
    const allIds = (studentsRes.data || []).map(s => s._id);
    const updateRes = await api.put('/admin/students/mock-access', { studentIds: allIds, accessEnabled });
    return updateRes.data;
  },

  setBulkMockAccess: async (payload) => {
    const response = await api.put('/admin/students/mock-access', payload);
    return response.data;
  },

  getMockAccessList: async () => {
    const response = await api.get('/admin/mock/access');
    return response.data;
  },

  // Student mock operations
  checkStudentMockAccess: async () => {
    const response = await api.get('/student/mock/access');
    return response.data;
  },

  checkStudentAttempted: async () => {
    const response = await api.get('/student/mock/check-attempted');
    return response.data;
  },

  getStudentMockExam: async () => {
    const response = await api.get('/student/mock/exam');
    return response.data;
  },

  submitStudentMockExam: async (payload) => {
    const response = await api.post('/student/mock/submit', payload);
    return response.data;
  },

  getMockResultsAdmin: async () => {
    const response = await api.get('/admin/mock/results');
    return response.data;
  },

  getMockResultDetails: async (id) => {
    const response = await api.get(`/admin/mock/results/${id}/details`);
    return response.data;
  }
};
