import axiosInstance from '../utils/axiosConfig';

const BASE = '/stories';

/** Story lobby — filter by theme/level, paginated */
export const getStories = (params = {}) => axiosInstance.get(BASE, { params });

/** Full story with all parts (sentences, hints) */
export const getStoryById = (storyId) => axiosInstance.get(`${BASE}/${storyId}`);

/** User progress for a story */
export const getStoryProgress = (storyId) => axiosInstance.get(`${BASE}/${storyId}/progress`);

/**
 * Submit translations for a part.
 * @param {string} storyId
 * @param {number} partNum
 * @param {Array<{order: number, answer: string}>} answers
 */
export const submitPartTranslations = (storyId, partNum, answers) =>
  axiosInstance.post(`${BASE}/${storyId}/parts/${partNum}/submit`, { answers });

/**
 * Mark a part as complete and claim rewards.
 * @param {string} storyId
 * @param {number} partNum
 * @param {number} partScore  0–10
 */
export const completeStoryPart = (storyId, partNum, partScore) =>
  axiosInstance.post(`${BASE}/${storyId}/parts/${partNum}/complete`, { partScore });
