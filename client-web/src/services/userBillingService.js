import api from './api';

const userBillingService = {
  // Public — lấy gói đang hoạt động
  getPublicPlans: () => api.get('/billing/plans'),

  // Authenticated user
  getMySubscription:  () => api.get('/billing/my-subscription'),
  getMyTransactions:  () => api.get('/billing/my-transactions'),

  // VNPay — trả về { payUrl } để redirect
  createPayment: (data) => api.post('/billing/create-payment', data),

  // VNPay — frontend gọi sau khi VNPay redirect về, để verify + cập nhật DB
  verifyPayment: (vnpParams) => api.post('/billing/vnpay-verify', vnpParams),
};

export default userBillingService;
