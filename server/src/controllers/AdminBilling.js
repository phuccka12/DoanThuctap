const SubscriptionPlan = require('../models/SubscriptionPlan');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ sort_order: 1 });
    res.json({ message: 'OK', data: plans });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ message: 'Tao goi cuoc thanh cong', data: plan });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Ten hoac slug da ton tai' });
    res.status(500).json({ message: 'Loi server', error: e.message });
  }
};
exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: 'Khong tim thay goi cuoc' });
    res.json({ message: 'Cap nhat thanh cong', data: plan });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xoa goi cuoc thanh cong' });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, gateway, user_id, search, dateFrom, dateTo } = req.query;
    const query = {};
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (user_id) query.user_id = user_id;
    if (dateFrom || dateTo) {
      query.created_at = {};
      if (dateFrom) query.created_at.$gte = new Date(dateFrom);
      if (dateTo) { const end = new Date(dateTo); end.setHours(23,59,59,999); query.created_at.$lte = end; }
    }
    if (search) {
      const users = await User.find({ $or: [{ email: { $regex: search, $options: 'i' } }, { user_name: { $regex: search, $options: 'i' } }] }).select('_id');
      query.user_id = { $in: users.map(u => u._id) };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).populate('user_id','user_name email avatar role').populate('plan_id','name slug color price_monthly').sort({ created_at: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);
    res.json({ message: 'OK', data: { transactions, total, totalPages: Math.ceil(total / Number(limit)), page: Number(page) } });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.getTransactionStats = async (req, res) => {
  try {
    const [total, success, pending, failed, refunded, cancelled, revenueAgg] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'success' }),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ status: 'failed' }),
      Transaction.countDocuments({ status: 'refunded' }),
      Transaction.countDocuments({ status: 'cancelled' }),
      Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({ message: 'OK', data: { total, success, pending, failed, refunded, cancelled, totalRevenue: revenueAgg[0]?.total || 0 } });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.getRevenueByMonth = async (req, res) => {
  try {
    const months = Number(req.query.months) || 6;
    const since = new Date();
    since.setMonth(since.getMonth() - months + 1);
    since.setDate(1); since.setHours(0,0,0,0);
    const [byMonth, byPlan] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'success', created_at: { $gte: since } } },
        { $group: { _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: '$plan_id', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'subscriptionplans', localField: '_id', foreignField: '_id', as: 'plan' } },
        { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
        { $project: { revenue: 1, count: 1, planName: { $ifNull: ['$plan.name', 'Unknown'] }, planColor: { $ifNull: ['$plan.color', 'gray'] } } },
      ]),
    ]);
    res.json({ message: 'OK', data: { byMonth, byPlan } });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.createManualTransaction = async (req, res) => {
  try {
    const { user_id, plan_id, amount, billing_cycle, notes, subscription_start, subscription_end } = req.body;
    const tx = await Transaction.create({ user_id, plan_id, amount, billing_cycle: billing_cycle || 'monthly', gateway: 'manual', status: 'success', notes, subscription_start: subscription_start || new Date(), subscription_end, created_by_admin: true });
    const plan = await SubscriptionPlan.findById(plan_id);
    if (plan && plan.slug !== 'free') await User.findByIdAndUpdate(user_id, { role: 'vip', vip_expire_at: subscription_end || null });
    await tx.populate('user_id','user_name email');
    await tx.populate('plan_id','name slug');
    res.status(201).json({ message: 'Tao giao dich thu cong thanh cong', data: tx });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const tx = await Transaction.findByIdAndUpdate(req.params.id, { status, notes, ...(status === 'refunded' ? { refunded_at: new Date() } : {}) }, { new: true }).populate('user_id','user_name email').populate('plan_id','name slug');
    if (!tx) return res.status(404).json({ message: 'Khong tim thay giao dich' });
    res.json({ message: 'Cap nhat trang thai thanh cong', data: tx });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Khong tim thay giao dich' });
    if (!['cancelled', 'failed'].includes(tx.status)) return res.status(400).json({ message: 'Chi duoc xoa giao dich da huy hoac that bai' });
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Da xoa giao dich thanh cong' });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};
exports.bulkDeleteTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Danh sach id khong hop le' });
    const result = await Transaction.deleteMany({ _id: { $in: ids }, status: { $in: ['cancelled', 'failed'] } });
    res.json({ message: `Da xoa ${result.deletedCount} giao dich`, deletedCount: result.deletedCount });
  } catch (e) { res.status(500).json({ message: 'Loi server', error: e.message }); }
};