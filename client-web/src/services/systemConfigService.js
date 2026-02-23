import api from './api';

const systemConfigService = {
  getConfigs: () => api.get('/admin/system-config'),
  updateConfig: (key, value) => api.patch(`/admin/system-config/${key}`, { value }),
  updateBulk: (configs) => api.post('/admin/system-config/bulk', { configs }),
};

export default systemConfigService;
