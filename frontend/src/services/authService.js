import api from './api';

export const authService = {
  registerStudent: async (studentData) => {
    const response = await api.post('/students/register', studentData);
    return response.data;
  },

  loginStudent: async (email, password) => {
    const response = await api.post('/students/login', { email, password });
    return response.data;
  },

  loginAdmin: async (username, password) => {
    const response = await api.post('/admin/login', { username, password });
    return response.data;
  },

  requestForgotPassword: async (email) => {
    const response = await api.post('/students/forgot-password/request', { email });
    return response.data;
  },

  requestForgotPasswordByPhone: async (phone) => {
    const response = await api.post('/students/forgot-password/request', { phone });
    return response.data;
  },

  verifyOtpOnly: async (phone, otp) => {
    const response = await api.post('/students/forgot-password/verify-otp', { phone, otp });
    return response.data;
  },

  resetPasswordAfterOtp: async (phone, newPassword) => {
    const response = await api.post('/students/forgot-password/reset-password', { phone, newPassword });
    return response.data;
  },

  verifyForgotPassword: async (email, otp, newPassword) => {
    const response = await api.post('/students/forgot-password/verify', { email, otp, newPassword });
    return response.data;
  },

  getStudentProfile: async () => {
    const response = await api.get('/students/profile');
    return response.data;
  }
};
