import axios from 'axios';
import { getSecureItem } from '../utils/storage';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const rawHost = hostUri.split(':')[0];
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawHost)) {
      return rawHost;
    }
  }
  return '10.11.52.199';
};

const LOCAL_HOST_IP = getHostIp();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://sla-skillup-portal.onrender.com/api';
      }
      return `http://${window.location.hostname}:5002/api`;
    }
    return 'http://localhost:5002/api';
  }
  return 'https://sla-skillup-portal.onrender.com/api';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getSecureItem('arjun_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching auth token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
