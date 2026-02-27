import api from './api';

const billingService = {
  // ── Plans ────────────────────────────────────────────────────────────────
  getPlans: () => api.get('/admin/billing/plans'),
  createPlan: (data) => api.post('/admin/billing/plans', data),
  updatePlan: (id, data) => api.put(`/admin/billing/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/admin/billing/plans/${id}`),

  // ── Transactions ─────────────────────────────────────────────────────────
  getTransactionStats: () => api.get('/admin/billing/transactions/stats'),
  getRevenueByMonth: (months = 6) => api.get('/admin/billing/transactions/revenue', { params: { months } }),
  getTransactions: (params) => api.get('/admin/billing/transactions', { params }),
  createManualTransaction: (data) => api.post('/admin/billing/transactions', data),
  updateTransactionStatus: (id, data) => api.patch(`/admin/billing/transactions/${id}/status`, data),
  hideTransaction: (id) => api.patch(`/admin/billing/transactions/${id}/hide`),
  bulkHideTransactions: (ids) => api.patch('/admin/billing/transactions/bulk-hide', { ids }),
  syncVnpayTransaction: (id) => api.post(`/admin/billing/transactions/${id}/sync-vnpay`),
};

export default billingService;
