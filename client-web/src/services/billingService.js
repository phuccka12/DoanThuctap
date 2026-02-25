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
  deleteTransaction: (id) => api.delete(`/admin/billing/transactions/${id}`),
  bulkDeleteTransactions: (ids) => api.delete('/admin/billing/transactions/bulk', { data: { ids } }),
};

export default billingService;
