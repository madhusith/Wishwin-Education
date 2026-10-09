import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { getRoleDashboardPath } from './utils/navigation';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentLiveClassesPage from './pages/student/StudentLiveClassesPage';
import StudentRecordingsPage from './pages/student/StudentRecordingsPage';
import StudentMaterialsPage from './pages/student/StudentMaterialsPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherLiveClassesPage from './pages/teacher/TeacherLiveClassesPage';
import TeacherRecordingsPage from './pages/teacher/TeacherRecordingsPage';
import TeacherMaterialsPage from './pages/teacher/TeacherMaterialsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminClassesPage from './pages/admin/AdminClassesPage';
import AdminEnrollmentsPage from './pages/admin/AdminEnrollmentsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import ParentDashboard from './pages/parent/ParentDashboard';

// Root redirect handler
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/live-classes"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLiveClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/recorded-lessons"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentRecordingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/recordings"
            element={<Navigate to="/student/recorded-lessons" replace />}
          />
          <Route
            path="/student/learning-materials"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentMaterialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/materials"
            element={<Navigate to="/student/learning-materials" replace />}
          />

          {/* Teacher Protected Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/live-classes"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherLiveClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/recorded-lessons"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherRecordingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/recordings"
            element={<Navigate to="/teacher/recorded-lessons" replace />}
          />
          <Route
            path="/teacher/learning-materials"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherMaterialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/materials"
            element={<Navigate to="/teacher/learning-materials" replace />}
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminEnrollmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {/* Parent Protected Routes */}
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
