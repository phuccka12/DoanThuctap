import axiosInstance from '../utils/axiosConfig';

/**
 * vocabService.js
 * API calls for the Vocabulary Learning module.
 */

// GET /api/vocabulary/topics — topics with word counts + user progress
export const getVocabTopics = () =>
  axiosInstance.get('/vocabulary/topics').then(r => r.data);

// GET /api/vocabulary/topics/:topicId/words — all words for a topic
export const getTopicWords = (topicId) =>
  axiosInstance.get(`/vocabulary/topics/${topicId}/words`).then(r => r.data);

// POST /api/vocabulary/topics/:topicId/complete — save session + earn rewards
export const completeVocabSession = (topicId, payload) =>
  axiosInstance.post(`/vocabulary/topics/${topicId}/complete`, payload).then(r => r.data);

// POST /api/vocabulary/ai-fill — Gemini generates a fill-in-the-blank sentence
export const getAiFill = (word, meaning, example) =>
  axiosInstance.post('/vocabulary/ai-fill', { word, meaning, example }).then(r => r.data);
