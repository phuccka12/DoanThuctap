import api from './api';

const writingScenarioService = {
  // Admin: Get all scenarios
  getAllScenarios: async (params = {}) => {
    const response = await api.get('/admin/writing-scenarios', { params });
    return response.data;
  },

  // Admin: Get stats
  getStats: async () => {
    const response = await api.get('/admin/writing-scenarios/stats');
    return response.data;
  },

  // Admin: Get single scenario
  getScenarioById: async (id) => {
    const response = await api.get(`/admin/writing-scenarios/${id}`);
    return response.data;
  },

  // Admin: Create scenario
  createScenario: async (scenarioData) => {
    const response = await api.post('/admin/writing-scenarios', scenarioData);
    return response.data;
  },

  // Admin: Update scenario
  updateScenario: async (id, scenarioData) => {
    const response = await api.put(`/admin/writing-scenarios/${id}`, scenarioData);
    return response.data;
  },

  // Admin: Delete scenario
  deleteScenario: async (id) => {
    const response = await api.delete(`/admin/writing-scenarios/${id}`);
    return response.data;
  },

  // Admin: Bulk delete
  bulkDeleteScenarios: async (ids) => {
    const response = await api.post('/admin/writing-scenarios/bulk-delete', { ids });
    return response.data;
  },

  // User: Validate submission
  validateSubmission: async (id, text) => {
    const response = await api.post(`/writing-scenarios/${id}/validate`, { text });
    return response.data;
  }
};

export default writingScenarioService;
