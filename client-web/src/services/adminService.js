import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

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
export const getTopics = (params) => adminAxios.get('/admin/topics', { params });
export const getAllTopicsForDropdown = () => adminAxios.get('/admin/topics', { params: { limit: 1000, is_active: true } });
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

// ============ LESSONS ============
export const getLessonsByTopic = (topicId) => adminAxios.get(`/admin/topics/${topicId}/lessons`);
export const createLesson = (topicId, data) => adminAxios.post(`/admin/topics/${topicId}/lessons`, data);
export const getLessonById = (id) => adminAxios.get(`/admin/lessons/${id}`);
export const updateLesson = (id, data) => adminAxios.put(`/admin/lessons/${id}`, data);
export const deleteLesson = (id) => adminAxios.delete(`/admin/lessons/${id}`);
export const reorderLessons = (topicId, lessonIds) => adminAxios.put(`/admin/topics/${topicId}/lessons/reorder`, { lessonIds });

// ============ VOCABULARY BANK ============
export const getVocabularies = (params) => adminAxios.get('/admin/vocab', { params });
export const getVocabularyById = (id) => adminAxios.get(`/admin/vocab/${id}`);
export const createVocabulary = (data) => adminAxios.post('/admin/vocab', data);
export const updateVocabulary = (id, data) => adminAxios.put(`/admin/vocab/${id}`, data);
export const deleteVocabulary = (id) => adminAxios.delete(`/admin/vocab/${id}`);
export const bulkDeleteVocabulary = (ids) => adminAxios.delete('/admin/vocab/bulk', { data: { ids } });
export const importVocabularyCSV = (csvData) => adminAxios.post('/admin/vocab/import', { csvData });
export const exportVocabularyCSV = () => adminAxios.get('/admin/vocab/export');
export const getVocabularyStats = () => adminAxios.get('/admin/vocab/stats');

// ============ READING PASSAGES BANK ============
export const getReadingPassages = (params) => adminAxios.get('/admin/reading-passages', { params });
export const getReadingPassageById = (id) => adminAxios.get(`/admin/reading-passages/${id}`);
export const createReadingPassage = (data) => adminAxios.post('/admin/reading-passages', data);
export const updateReadingPassage = (id, data) => adminAxios.put(`/admin/reading-passages/${id}`, data);
export const deleteReadingPassage = (id) => adminAxios.delete(`/admin/reading-passages/${id}`);
export const bulkDeleteReadingPassages = (ids) => adminAxios.post('/admin/reading-passages/bulk-delete', { ids });
export const importReadingPassagesCSV = (formData) => adminAxios.post('/admin/reading-passages/import', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const exportReadingPassagesCSV = () => adminAxios.get('/admin/reading-passages/export');
export const getReadingPassageStats = () => adminAxios.get('/admin/reading-passages/stats');
// AI Features
export const generatePassageWithAI = (data) => adminAxios.post('/admin/reading-passages/generate-ai', data);
export const agenticGeneratePassage = (data) => adminAxios.post('/admin/reading-passages/agentic-generate', data);
export const scanAndLinkVocabulary = (id) => adminAxios.post(`/admin/reading-passages/${id}/scan-vocabulary`);
export const trackPassageUsage = (id) => adminAxios.post(`/admin/reading-passages/${id}/track-usage`);
export const getPassagesForLessonBuilder = (params) => adminAxios.get('/admin/reading-passages/for-lesson-builder', { params });

export default {
  // Topics
  getTopics,
  getAllTopicsForDropdown,
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
  // Lessons
  getLessonsByTopic,
  createLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  reorderLessons,
  // Vocabulary Bank
  getVocabularies,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  bulkDeleteVocabulary,
  importVocabularyCSV,
  exportVocabularyCSV,
  getVocabularyStats,
  // Reading Passages Bank
  getReadingPassages,
  getReadingPassageById,
  createReadingPassage,
  updateReadingPassage,
  deleteReadingPassage,
  bulkDeleteReadingPassages,
  importReadingPassagesCSV,
  exportReadingPassagesCSV,
  getReadingPassageStats,
  generatePassageWithAI,
  agenticGeneratePassage,
  scanAndLinkVocabulary,
  trackPassageUsage,
  getPassagesForLessonBuilder,
};
