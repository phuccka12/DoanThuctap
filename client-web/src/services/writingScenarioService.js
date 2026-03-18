import api from './api';

const writingScenarioService = {
  // User: Get all scenarios
  getAllScenarios: async (params = {}) => {
    const is_admin = params.is_admin;
    delete params.is_admin;
    const endpoint = is_admin ? '/admin/writing-scenarios' : '/writing-scenarios';
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // User: Get single scenario
  getScenarioById: async (id) => {
    const response = await api.get(`/writing-scenarios/${id}`);
    return response.data;
  },

  // Admin: Get statistics
  getStats: async () => {
    const response = await api.get('/admin/writing-scenarios/stats');
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

  // User: Validate submission in real-time
  validateSubmission: async (id, text) => {
    const response = await api.post(`/writing-scenarios/${id}/validate`, { text });
    return response.data;
  },

  // User: Final evaluation with AI
  evaluateSubmission: async (id, text, timeSpentSec) => {
    const res = await api.post(`/writing-scenarios/${id}/evaluate`, { text, timeSpentSec });
    return res.data;
  },

  // User: Get submission history
  getSubmissionHistory: async (id) => {
    const response = await api.get(`/writing-scenarios/${id}/history`);
    return response.data;
  }
};

export default writingScenarioService;
