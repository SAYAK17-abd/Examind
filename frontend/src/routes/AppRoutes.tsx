import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { ExamList } from '../pages/student/ExamList';
import { ExamInstructions } from '../pages/student/ExamInstructions';
import { ExamInterface } from '../pages/student/ExamInterface';
import { StudentResultsList } from '../pages/student/StudentResultsList';
import { ResultDetails } from '../pages/student/ResultDetails';
import { StudentInsights } from '../pages/student/StudentInsights';

// Teacher Pages
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { ExamManagement } from '../pages/teacher/ExamManagement';
import { ExamForm } from '../pages/teacher/ExamForm';
import { QuestionManagement } from '../pages/teacher/QuestionManagement';
import { SubmissionMonitoring } from '../pages/teacher/SubmissionMonitoring';
import { EvaluationReview } from '../pages/teacher/EvaluationReview';
import { TeacherAnalytics } from '../pages/teacher/TeacherAnalytics';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isStudent, isTeacher, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isTeacher) return <Navigate to="/teacher" replace />;
  if (isStudent) return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['STUDENT', 'ROLE_STUDENT']}>
              <StudentLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="exams" element={<ExamList />} />
        <Route path="exams/:id/instructions" element={<ExamInstructions />} />
        <Route path="exams/:examId/room/:submissionId" element={<ExamInterface />} />
        <Route path="results" element={<StudentResultsList />} />
        <Route path="results/:id" element={<ResultDetails />} />
        <Route path="insights" element={<StudentInsights />} />
      </Route>

      {/* Teacher Protected Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['TEACHER', 'ROLE_TEACHER']}>
              <TeacherLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="exams/new" element={<ExamForm />} />
        <Route path="exams/:id/edit" element={<ExamForm />} />
        <Route path="exams/:examId/questions" element={<QuestionManagement />} />
        <Route path="exams/:examId/submissions" element={<SubmissionMonitoring />} />
        <Route path="submissions" element={<SubmissionMonitoring />} />
        <Route path="evaluations/:evaluationId" element={<EvaluationReview />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="exams/:examId/analytics" element={<TeacherAnalytics />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMIN', 'ROLE_ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
