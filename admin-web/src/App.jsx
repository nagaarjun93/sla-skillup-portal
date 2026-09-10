import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAdminAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import ManageQuestions from './pages/ManageQuestions';
import QuestionUpload from './pages/QuestionUpload';
import WeeklyTests from './pages/WeeklyTests';
import ThisWeekQuestions from './pages/ThisWeekQuestions';
import StudentManagement from './pages/StudentManagement';
import TestResults from './pages/TestResults';
import MockTestSettings from './pages/MockTestSettings';
import MockTestResults from './pages/MockTestResults';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="questions" element={<ManageQuestions />} />
            <Route path="manage-questions" element={<ManageQuestions />} />
            <Route path="upload-questions" element={<QuestionUpload />} />
            <Route path="weekly-tests" element={<WeeklyTests />} />
            <Route path="this-week-questions" element={<ThisWeekQuestions />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="results" element={<TestResults />} />
            <Route path="mock-settings" element={<MockTestSettings />} />
            <Route path="mock-results" element={<MockTestResults />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

