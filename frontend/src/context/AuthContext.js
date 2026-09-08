import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/storage';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await getSecureItem('arjun_auth_token');
      const storedUser = await getSecureItem('arjun_auth_user');
      const storedRole = await getSecureItem('arjun_auth_role');

      if (storedToken && storedUser && storedRole) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      }
    } catch (e) {
      console.error('Error loading stored auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const loginStudent = async (email, password) => {
    const data = await authService.loginStudent(email, password);
    const authToken = data.token;
    const authUser = data.student;

    await setSecureItem('arjun_auth_token', authToken);
    await setSecureItem('arjun_auth_user', JSON.stringify(authUser));
    await setSecureItem('arjun_auth_role', 'student');

    setToken(authToken);
    setUser(authUser);
    setRole('student');
    return data;
  };

  const loginAdmin = async (username, password) => {
    const data = await authService.loginAdmin(username, password);
    const authToken = data.token;
    const authUser = data.admin;

    await setSecureItem('arjun_auth_token', authToken);
    await setSecureItem('arjun_auth_user', JSON.stringify(authUser));
    await setSecureItem('arjun_auth_role', 'admin');

    setToken(authToken);
    setUser(authUser);
    setRole('admin');
    return data;
  };

  const registerStudent = async (studentData) => {
    const data = await authService.registerStudent(studentData);
    const authToken = data.token;
    const authUser = data.student;

    await setSecureItem('arjun_auth_token', authToken);
    await setSecureItem('arjun_auth_user', JSON.stringify(authUser));
    await setSecureItem('arjun_auth_role', 'student');

    setToken(authToken);
    setUser(authUser);
    setRole('student');
    return data;
  };

  const logout = async () => {
    try {
      await removeSecureItem('arjun_auth_token');
      await removeSecureItem('arjun_auth_user');
      await removeSecureItem('arjun_auth_role');
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      setToken(null);
      setUser(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        loginStudent,
        loginAdmin,
        registerStudent,
        logout,
        isAuthenticated: !!token,
        isAdmin: role === 'admin',
        isStudent: role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useArjunAuth = () => useContext(AuthContext);
export default AuthContext;
