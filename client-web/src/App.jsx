import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleCallback from './pages/GoogleCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AIWriting from './pages/AiWriting';
import AISpeaking from './pages/AISpeaking';
import AIConversation from './pages/AIConversation';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import Landingpage from './pages/Landingpage';

// Admin Pages
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminTopics from './pages/Admin/AdminTopics';
import CourseBuilder from './pages/Admin/CourseBuilder';
import AdminLessons from './pages/Admin/AdminLessons';
import AdminSpeakingQuestions from './pages/Admin/AdminSpeakingQuestions';
import AdminWritingPrompts from './pages/Admin/AdminWritingPrompts';
import AdminVocabulary from './pages/Admin/AdminVocabulary';
import AdminReadingPassages from './pages/Admin/AdminReadingPassages';
import AdminWritingScenarios from './pages/Admin/AdminWritingScenarios';

// Protected Route Component with Onboarding check
function ProtectedRoute({ children, allowWithoutOnboarding = false }) {
  const { isAuthenticated, needsOnboarding, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user needs onboarding and this route doesn't allow bypass, redirect to onboarding
  // UNLESS user is admin (bypass for testing)
  const isAdmin = user?.role === 'admin';
  if (needsOnboarding && !allowWithoutOnboarding && !isAdmin) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landingpage />} />
          <Route path="/landingpage" element={<Landingpage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          
          {/* Onboarding Route - Protected but allows access without completed onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute allowWithoutOnboarding={true}>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes - Require onboarding completion */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/ai-writing" element={
            <ProtectedRoute>
              <AIWriting />
            </ProtectedRoute>
          } />
          <Route path="/ai-speaking" element={
            <ProtectedRoute>
              <AISpeaking />
            </ProtectedRoute>
          } />
          <Route path="/ai-conversation" element={
            <ProtectedRoute>
              <AIConversation />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/topics" element={
            <AdminRoute>
              <AdminLayout>
                <AdminTopics />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/topics/:topicId/lessons/:lessonId/builder" element={
            <AdminRoute>
              <CourseBuilder />
            </AdminRoute>
          } />
          <Route path="/admin/topics/:topicId/lessons" element={
            <AdminRoute>
              <AdminLayout>
                <AdminLessons />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/vocabulary" element={
            <AdminRoute>
              <AdminLayout>
                <AdminVocabulary />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/reading-passages" element={
            <AdminRoute>
              <AdminLayout>
                <AdminReadingPassages />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/writing-scenarios" element={
            <AdminRoute>
              <AdminLayout>
                <AdminWritingScenarios />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/speaking-questions" element={
            <AdminRoute>
              <AdminLayout>
                <AdminSpeakingQuestions />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/writing-prompts" element={
            <AdminRoute>
              <AdminLayout>
                <AdminWritingPrompts />
              </AdminLayout>
            </AdminRoute>
          } />
          
          {/* 404 - Catch all undefined routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
