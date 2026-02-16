import api from './api';

const topicService = {
  // Get all topics (public)
  getAllTopics: async (params = {}) => {
    const response = await api.get('/topics', { params });
    return response.data;
  },

  // Get single topic
  getTopicById: async (id) => {
    const response = await api.get(`/topics/${id}`);
    return response.data;
  },

  // Admin: Get all topics
  getAdminTopics: async (params = {}) => {
    const response = await api.get('/admin/topics', { params });
    return response.data;
  },

  // Admin: Create topic
  createTopic: async (topicData) => {
    const response = await api.post('/admin/topics', topicData);
    return response.data;
  },

  // Admin: Update topic
  updateTopic: async (id, topicData) => {
    const response = await api.put(`/admin/topics/${id}`, topicData);
    return response.data;
  },

  // Admin: Delete topic
  deleteTopic: async (id) => {
    const response = await api.delete(`/admin/topics/${id}`);
    return response.data;
  }
};

export default topicService;
