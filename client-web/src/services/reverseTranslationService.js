import axiosInstance from '../utils/axiosConfig';

const BASE = 'http://localhost:3001/api/reverse-translation';

const reverseTranslationService = {
  /** Lấy danh sách bộ đề */  
  listSets: async (level) => {
    const res = await axiosInstance.get(`${BASE}/sets`, { params: level ? { level } : {} });
    return res.data.data;
  },

  /** Chi tiết bộ đề (ẩn đáp án) */
  getSet: async (setId) => {
    const res = await axiosInstance.get(`${BASE}/sets/${setId}`);
    return res.data.data;
  },

  /** Tạo / Resume session */
  startSession: async (setId) => {
    const res = await axiosInstance.post(`${BASE}/session/start`, { setId });
    return res.data.data;
  },

  /** Lấy session đang in_progress */
  getActiveSession: async (setId) => {
    const res = await axiosInstance.get(`${BASE}/session/active`, { params: setId ? { setId } : {} });
    return res.data.data;
  },

  /** Nộp 1 câu để AI chấm */
  gradeItem: async (sessionId, itemId, userAnswer) => {
    const res = await axiosInstance.post(`${BASE}/session/${sessionId}/grade`, { itemId, userAnswer });
    return res.data.data;
  },

  /** Mua hint */
  buyHint: async (sessionId, itemId, hintType) => {
    const res = await axiosInstance.post(`${BASE}/session/${sessionId}/hint`, { itemId, hintType });
    return res.data.data;
  },

  /** Hoàn thành session */
  completeSession: async (sessionId) => {
    const res = await axiosInstance.post(`${BASE}/session/${sessionId}/complete`);
    return res.data.data;
  },
};

export default reverseTranslationService;
