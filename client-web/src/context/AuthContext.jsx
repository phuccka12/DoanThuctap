// Authentication Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api/auth'; // Changed to port 5000

  // Configure axios defaults and fetch user on mount
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get(`${API_URL}/me`);
      setUser(res.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only logout if it's not a token refresh issue
      if (error.response?.status === 401 && !localStorage.getItem('refreshToken')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axiosInstance.post(`${API_URL}/login`, { email, password });
    const { token: newToken, refreshToken, user: userData } = res.data;
    
    localStorage.setItem('token', newToken);
    // Only store refresh token if provided (normal login has it, Google OAuth might not)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setToken(newToken);
    setUser(userData);
    
    return res.data;
  };

  const register = async (user_name, email, password) => {
    const res = await axiosInstance.post(`${API_URL}/register`, { user_name, email, password });
    const { token: newToken, refreshToken, user: userData } = res.data;
    
    localStorage.setItem('token', newToken);
    // Only store refresh token if provided
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setToken(newToken);
    setUser(userData);
    
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  const setAccessToken = (newToken, newRefreshToken = null) => {
    localStorage.setItem('token', newToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    setToken(newToken);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const fetchUserInfo = async () => {
    try {
      console.log('🔄 Fetching user info from:', `${API_URL}/me`);
      const res = await axiosInstance.get(`${API_URL}/me`);
      console.log('✅ User data received:', res.data.user);
      console.log('📊 onboarding_completed:', res.data.user?.onboarding_completed);
      setUser(res.data.user);
      return res.data.user; // Return user data
    } catch (error) {
      console.error('❌ Failed to fetch user:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setAccessToken,
    fetchUserInfo,
    isAuthenticated: !!token && !!user,
    needsOnboarding: user && !user.onboarding_completed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
