import api from './api';

const speakingQuestionService = {
  // Admin: Get stats
  getStats: async () => {
    const response = await api.get('/admin/speaking-questions/stats');
    return response.data;
  },

  // Admin: Get all questions
  getAllQuestions: async (params = {}) => {
    const response = await api.get('/admin/speaking-questions', { params });
    return response.data;
  },

  // Admin: Get single question
  getQuestionById: async (id) => {
    const response = await api.get(`/admin/speaking-questions/${id}`);
    return response.data;
  },

  // Admin: Create question
  createQuestion: async (data) => {
    const response = await api.post('/admin/speaking-questions', data);
    return response.data;
  },

  // Admin: Update question
  updateQuestion: async (id, data) => {
    const response = await api.put(`/admin/speaking-questions/${id}`, data);
    return response.data;
  },

  // Admin: Delete question
  deleteQuestion: async (id) => {
    const response = await api.delete(`/admin/speaking-questions/${id}`);
    return response.data;
  },

  // Admin: Bulk delete
  bulkDelete: async (ids) => {
    const response = await api.post('/admin/speaking-questions/bulk-delete', { ids });
    return response.data;
  },

  // Admin: AI Generate sample answer
  generateSampleAnswer: async (payload) => {
    const response = await api.post('/admin/speaking-questions/generate-sample', payload);
    return response.data;
  }
};

export default speakingQuestionService;
