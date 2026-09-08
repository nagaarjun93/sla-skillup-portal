import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://sla-skillup-portal.onrender.com/api';
    }
  }
  return 'http://localhost:5002/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Admin JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sla_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized 401 Handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sla_admin_token');
      localStorage.removeItem('sla_admin_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.endsWith('/login')) {
        window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

