import api from './api';

export const adminService = {
  // Question operations
  getAllQuestions: async (params = {}) => {
    const response = await api.get('/admin/questions', { params });
    return response.data;
  },

  getQuestionById: async (id) => {
    const response = await api.get(`/admin/questions/${id}`);
    return response.data;
  },

  addQuestionManual: async (questionData) => {
    const response = await api.post('/admin/questions/manual', questionData);
    return response.data;
  },

  uploadQuestionFile: async (formData) => {
    const response = await api.post('/admin/questions/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadQuestionsCsv: async (formData) => {
    const response = await api.post('/admin/questions/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  parseQuestionsFile: async (formData) => {
    const response = await api.post('/admin/questions/parse-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  saveBulkQuestions: async (questions, weeklyTestId = null) => {
    const response = await api.post('/admin/questions/save-bulk', { questions, weeklyTestId });
    return response.data;
  },

  updateQuestion: async (id, questionData) => {
    const response = await api.put(`/admin/questions/${id}`, questionData);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/admin/questions/${id}`);
    return response.data;
  },

  // Results operations
  getResults: async (params = {}) => {
    const response = await api.get('/admin/results', { params });
    return response.data;
  },

  getNotAttemptedStudents: async () => {
    const response = await api.get('/admin/results/not-attempted');
    return response.data;
  },

  markResult: async (id, markData) => {
    const response = await api.put(`/admin/results/${id}/mark`, markData);
    return response.data;
  },

  getResultDetails: async (id) => {
    const response = await api.get(`/admin/results/${id}/details`);
    return response.data;
  },

  // Student management
  getAllStudents: async () => {
    const response = await api.get('/admin/students');
    return response.data;
  },

  getStudentManagement: async () => {
    const response = await api.get('/admin/students/management');
    return response.data;
  },

  getStudentDetails: async (id) => {
    const response = await api.get(`/admin/students/${id}/details`);
    return response.data;
  },

  updateStudentStatus: async (id, status) => {
    const response = await api.put(`/admin/students/${id}/status`, { status });
    return response.data;
  }
};
