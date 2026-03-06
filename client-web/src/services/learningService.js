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
