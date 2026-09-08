import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('sla_admin_token');
    const savedAdmin = localStorage.getItem('sla_admin_user');

    if (savedToken && savedAdmin) {
      try {
        setToken(savedToken);
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        localStorage.removeItem('sla_admin_token');
        localStorage.removeItem('sla_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/admin/login', { username, password });
    const { token: authToken, admin: adminData } = res.data;

    localStorage.setItem('sla_admin_token', authToken);
    localStorage.setItem('sla_admin_user', JSON.stringify(adminData));

    setToken(authToken);
    setAdmin(adminData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('sla_admin_token');
    localStorage.removeItem('sla_admin_user');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AuthContext);

