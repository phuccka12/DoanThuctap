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

// Protected Route Component with Onboarding check
function ProtectedRoute({ children, allowWithoutOnboarding = false }) {
  const { isAuthenticated, needsOnboarding, loading } = useAuth();
  
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
  if (needsOnboarding && !allowWithoutOnboarding) {
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          
          {/* 404 - Catch all undefined routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
