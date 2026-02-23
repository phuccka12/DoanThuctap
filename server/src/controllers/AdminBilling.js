const SubscriptionPlan = require('../models/SubscriptionPlan');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ── Plans ──────────────────────────────────────────────────────────────────────

exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ sort_order: 1 });
    res.json({ message: 'OK', data: plans });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ message: 'Tạo gói cước thành công', data: plan });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Tên hoặc slug đã tồn tại' });
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: 'Không tìm thấy gói cước' });
    res.json({ message: 'Cập nhật thành công', data: plan });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa gói cước thành công' });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── Transactions ───────────────────────────────────────────────────────────────

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, gateway, user_id, search } = req.query;
    const query = {};
    if (status)  query.status  = status;
    if (gateway) query.gateway = gateway;
    if (user_id) query.user_id = user_id;

    let userIds = null;
    if (search) {
      const users = await User.find({
        $or: [
          { email:     { $regex: search, $options: 'i' } },
          { user_name: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      userIds = users.map(u => u._id);
      query.user_id = { $in: userIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user_id', 'user_name email avatar role')
        .populate('plan_id', 'name slug color price_monthly')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);

    res.json({ message: 'OK', data: { transactions, total, totalPages: Math.ceil(total / Number(limit)), page: Number(page) } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.getTransactionStats = async (req, res) => {
  try {
    const [total, success, pending, failed, refunded, revenueAgg] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'success' }),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ status: 'failed' }),
      Transaction.countDocuments({ status: 'refunded' }),
      Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    res.json({ message: 'OK', data: { total, success, pending, failed, refunded, totalRevenue } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// Admin manually creates a transaction (e.g. bank transfer confirmed)
exports.createManualTransaction = async (req, res) => {
  try {
    const { user_id, plan_id, amount, billing_cycle, notes, subscription_start, subscription_end } = req.body;

    const tx = await Transaction.create({
      user_id, plan_id, amount,
      billing_cycle: billing_cycle || 'monthly',
      gateway: 'manual',
      status: 'success',
      notes,
      subscription_start: subscription_start || new Date(),
      subscription_end,
      created_by_admin: true,
    });

    // Upgrade user role
    const plan = await SubscriptionPlan.findById(plan_id);
    if (plan && plan.slug !== 'free') {
      await User.findByIdAndUpdate(user_id, {
        role: plan.slug === 'premium' ? 'vip' : 'vip',
        vip_expire_at: subscription_end || null,
      });
    }

    await tx.populate('user_id', 'user_name email');
    await tx.populate('plan_id', 'name slug');
    res.status(201).json({ message: 'Tạo giao dịch thủ công thành công', data: tx });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const tx = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status, notes, ...(status === 'refunded' ? { refunded_at: new Date() } : {}) },
      { new: true }
    ).populate('user_id', 'user_name email').populate('plan_id', 'name slug');
    if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    res.json({ message: 'Cập nhật trạng thái thành công', data: tx });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
