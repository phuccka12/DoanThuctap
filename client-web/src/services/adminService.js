import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

/**
 * Admin Service - Handle all admin API calls
 * All methods use Bearer token (auto-handled by axiosInstance)
 */

// Create dedicated axios instance for admin (inherits token from storage)
const adminAxios = axios.create({ baseURL: API_BASE });

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ TOPICS ============
export const getTopics = () => adminAxios.get('/admin/topics');
export const getTopicById = (id) => adminAxios.get(`/admin/topics/${id}`);
export const createTopic = (data) => adminAxios.post('/admin/topics', data);
export const updateTopic = (id, data) => adminAxios.put(`/admin/topics/${id}`, data);
export const deleteTopic = (id) => adminAxios.delete(`/admin/topics/${id}`);

// ============ SPEAKING QUESTIONS ============
export const getSpeakingQuestions = () => adminAxios.get('/admin/speaking-questions');
export const getSpeakingQuestionById = (id) => adminAxios.get(`/admin/speaking-questions/${id}`);
export const createSpeakingQuestion = (data) => adminAxios.post('/admin/speaking-questions', data);
export const updateSpeakingQuestion = (id, data) => adminAxios.put(`/admin/speaking-questions/${id}`, data);
export const deleteSpeakingQuestion = (id) => adminAxios.delete(`/admin/speaking-questions/${id}`);

// ============ WRITING PROMPTS ============
export const getWritingPrompts = () => adminAxios.get('/admin/writing-prompts');
export const getWritingPromptById = (id) => adminAxios.get(`/admin/writing-prompts/${id}`);
export const createWritingPrompt = (data) => adminAxios.post('/admin/writing-prompts', data);
export const updateWritingPrompt = (id, data) => adminAxios.put(`/admin/writing-prompts/${id}`, data);
export const deleteWritingPrompt = (id) => adminAxios.delete(`/admin/writing-prompts/${id}`);

// Admin analytics/stats
export const getAdminStats = (year) => adminAxios.get('/admin/stats', { params: { year } });

// ============ USERS MANAGEMENT ============
export const createUser = (data) => adminAxios.post('/admin/users', data);
export const getUsers = (params) => adminAxios.get('/admin/users', { params });
export const getUserById = (id) => adminAxios.get(`/admin/users/${id}`);
export const updateUser = (id, data) => adminAxios.put(`/admin/users/${id}`, data);
export const resetPassword = (id, password) => adminAxios.patch(`/admin/users/${id}/password`, { password });
export const updateUserStatus = (id, status) => adminAxios.patch(`/admin/users/${id}/status`, { status });
export const deleteUser = (id) => adminAxios.delete(`/admin/users/${id}`);
export const getUserStats = () => adminAxios.get('/admin/users/stats');

export default {
  // Topics
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  // Speaking Questions
  getSpeakingQuestions,
  getSpeakingQuestionById,
  createSpeakingQuestion,
  updateSpeakingQuestion,
  deleteSpeakingQuestion,
  // Writing Prompts
  getWritingPrompts,
  getWritingPromptById,
  createWritingPrompt,
  updateWritingPrompt,
  deleteWritingPrompt,
  getAdminStats,
  // Users
  createUser,
  getUsers,
  getUserById,
  updateUser,
  resetPassword,
  updateUserStatus,
  deleteUser,
  getUserStats,
};
