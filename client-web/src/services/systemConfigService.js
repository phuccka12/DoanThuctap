import api from './api';

const systemConfigService = {
  getConfigs:   () => api.get('/admin/system-config'),
  getStaff:     () => api.get('/admin/system-config/staff'),
  updateConfig: (key, value) => api.patch(`/admin/system-config/${key}`, { value }),
  updateBulk:   (configs) => api.post('/admin/system-config/bulk', { configs }),
  testEmail:    (to) => api.post('/admin/system-config/test-email', { to }),
};

export default systemConfigService;

