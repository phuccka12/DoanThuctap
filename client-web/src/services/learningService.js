import axiosInstance from '../utils/axiosConfig';

const BASE = '/learn';

/** Topic list with user progress (auth optional) */
export const getTopics = () => axiosInstance.get(`${BASE}/topics`);

/** Lessons roadmap for a topic */
export const getLessonsForTopic = (topicId) => axiosInstance.get(`${BASE}/topics/${topicId}/lessons`);

/** Single lesson with full nodes */
export const getLessonById = (lessonId) => axiosInstance.get(`${BASE}/lessons/${lessonId}`);

/** Mark lesson as complete, receive reward */
export const completeLesson = (lessonId, payload) =>
  axiosInstance.post(`${BASE}/lessons/${lessonId}/complete`, payload);

/** Generate a fresh 7-day personalised plan */
export const generatePlan = () => axiosInstance.post(`${BASE}/generate-plan`);

/** Get current active plan */
export const getCurrentPlan = () => axiosInstance.get(`${BASE}/plan/current`);

/** User progress summary */
export const getProgress = () => axiosInstance.get(`${BASE}/progress`);

// ── Reading Practice ──────────────────────────────────────────────────────────
export const getReadingTopics = () => axiosInstance.get('/reading-passages/topics');
export const getReadingPassages = (params) => axiosInstance.get('/reading-passages/list', { params });
export const getReadingPassageById = (id) => axiosInstance.get(`/reading-passages/${id}`);
export const submitReading = (id, payload) => axiosInstance.post(`/reading-passages/${id}/submit`, payload);

// ── Speaking Practice ─────────────────────────────────────────────────────────
export const getSpeakingTopics = () => axiosInstance.get('/speaking-practice/topics');
export const getSpeakingQuestions = (params) => axiosInstance.get('/speaking-practice/questions', { params });
export const getSpeakingWarmup = (params) => axiosInstance.get('/speaking-practice/warmup', { params });
export const evaluateSpeaking = (formData) =>
  axiosInstance.post('/speaking-practice/evaluate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 130_000,
  });

// ── Grammar Practice ──────────────────────────────────────────────────────────
export const getGrammarLessons = (params) => axiosInstance.get('/grammar', { params });
export const getGrammarLesson = (id) => axiosInstance.get(`/grammar/${id}`);
export const completeGrammarLesson = (id, payload) => axiosInstance.post(`/grammar/${id}/complete`, payload);
