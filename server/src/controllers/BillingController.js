const SubscriptionPlan = require('../models/SubscriptionPlan');
const Transaction      = require('../models/Transaction');
const User             = require('../models/User');
const vnpay            = require('../services/vnpayService');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get all active plans
// ─────────────────────────────────────────────────────────────────────────────
exports.getPublicPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ is_active: true }).sort({ sort_order: 1 });
    res.json({ message: 'OK', data: plans });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET my current subscription info
// ─────────────────────────────────────────────────────────────────────────────
exports.getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('role vip_expire_at user_name email avatar');

    // Find most recent successful transaction
    const lastTx = await Transaction.findOne({
      user_id: req.userId,
      status: 'success',
    })
      .populate('plan_id', 'name slug color icon description features quota price_monthly price_yearly')
      .sort({ created_at: -1 });

    // Check if there's a pending transaction
    const pendingTx = await Transaction.findOne({
      user_id: req.userId,
      status: 'pending',
    })
      .populate('plan_id', 'name slug color icon price_monthly')
      .sort({ created_at: -1 });

    const isVip = user.role === 'vip' || user.role === 'admin';
    const isExpired = user.vip_expire_at && new Date(user.vip_expire_at) < new Date();

    res.json({
      message: 'OK',
      data: {
        user: { role: user.role, vip_expire_at: user.vip_expire_at },
        isActive: isVip && !isExpired,
        currentPlan: lastTx?.plan_id || null,
        subscription_end: user.vip_expire_at,
        pendingTransaction: pendingTx ? {
          _id: pendingTx._id,
          plan: pendingTx.plan_id,
          amount: pendingTx.amount,
          billing_cycle: pendingTx.billing_cycle,
          created_at: pendingTx.created_at,
        } : null,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /billing/create-payment — tạo URL redirect VNPay
// ─────────────────────────────────────────────────────────────────────────────
exports.createVnpayPayment = async (req, res) => {
  try {
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan || !plan.is_active)
      return res.status(404).json({ message: 'Gói cước không tồn tại hoặc đã ngừng hoạt động' });
    if (plan.slug === 'free')
      return res.status(400).json({ message: 'Gói Free không cần thanh toán' });

    // Nếu đang có pending TX cùng plan+cycle → reuse payUrl bằng cách cancel cũ tạo mới
    // (thay vì chặn, ta cancel pending cũ để tránh user bị kẹt)
    await Transaction.updateMany(
      { user_id: req.userId, status: 'pending' },
      { $set: { status: 'cancelled' } }
    );

    const amount = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Chu kỳ thanh toán không hợp lệ' });

    // Tính ngày
    const start = new Date();
    const end   = new Date(start);
    billing_cycle === 'yearly' ? end.setFullYear(end.getFullYear() + 1) : end.setMonth(end.getMonth() + 1);

    // Tạo giao dịch PENDING trước
    // Tạo vnp_txn_ref unique = timestamp + random để tránh trùng trên VNPay sandbox
    const vnpTxnRef = `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const tx = await Transaction.create({
      user_id: req.userId,
      plan_id: plan._id,
      amount,
      billing_cycle,
      gateway: 'vnpay',
      gateway_tx_id: vnpTxnRef,   // lưu để callback tra cứu
      status:  'pending',
      subscription_start: start,
      subscription_end:   end,
      created_by_admin: false,
    });

    // Lấy IP
    const ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const payUrl = vnpay.createPaymentUrl({
      txnRef:    vnpTxnRef,
      amount,
      orderInfo: `Thanh toan ${plan.slug} ${billing_cycle === 'yearly' ? '1 nam' : '1 thang'}`,
      ipAddr,
      // Trỏ return URL thẳng về FRONTEND để tránh VNPay AJAX gọi server bị 401
      returnUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`,
    });

    res.json({ message: 'OK', data: { payUrl, txnId: tx._id } });
  } catch (e) {
    console.error('[createVnpayPayment ERROR]', e.message, e.stack);
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /billing/vnpay-return — VNPay callback (user redirect back)
// ─────────────────────────────────────────────────────────────────────────────
exports.handleVnpayReturn = async (req, res) => {
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const result = vnpay.verifyReturn(req.query);
    console.log('[VNPay Return] isValid:', result.isValid, '| responseCode:', result.responseCode, '| txnRef:', result.txnRef);

    if (!result.isValid) {
      console.log('[VNPay Return] INVALID SIGNATURE - redirecting to invalid');
      return res.redirect(`${CLIENT_URL}/payment/result?status=invalid`);
    }

    // Tìm TX bằng gateway_tx_id (vnpTxnRef) thay vì _id
    const tx = await Transaction.findOne({ gateway_tx_id: result.txnRef }).populate('plan_id');
    if (!tx) return res.redirect(`${CLIENT_URL}/payment/result?status=notfound`);

    if (result.responseCode === '00') {
      // ── Thanh toán thành công ──────────────────────────────────────────
      tx.status         = 'success';
      tx.gateway_payload = req.query;
      tx.notes          = `VNPay TxnNo: ${result.vnpTxnNo || ''}`;
      await tx.save();

      // Cập nhật role + vip_expire_at cho user
      const plan = tx.plan_id;
      if (plan && plan.slug !== 'free') {
        await User.findByIdAndUpdate(tx.user_id, {
          role:          'vip',
          vip_expire_at: tx.subscription_end,
        });
      }

      return res.redirect(
        `${CLIENT_URL}/payment/result?status=success&plan=${plan?.name || ''}&end=${tx.subscription_end?.toISOString() || ''}`
      );
    } else {
      // ── Thanh toán thất bại / bị hủy ──────────────────────────────────
      tx.status          = result.responseCode === '24' ? 'cancelled' : 'failed';
      tx.gateway_payload = req.query;
      await tx.save();

      return res.redirect(`${CLIENT_URL}/payment/result?status=failed&code=${result.responseCode}`);
    }
  } catch (e) {
    console.error('[VNPay Return]', e.message);
    return res.redirect(`${CLIENT_URL}/payment/result?status=error`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /billing/vnpay-verify — Frontend gọi sau khi VNPay redirect về
// Frontend truyền toàn bộ query params VNPay lên để server verify + cập nhật DB
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyVnpayPayment = async (req, res) => {
  try {
    const vnpParams = req.body; // frontend gửi toàn bộ searchParams lên
    const result = vnpay.verifyReturn(vnpParams);

    console.log('[VNPay Verify] isValid:', result.isValid, '| code:', result.responseCode, '| txnRef:', result.txnRef);

    if (!result.isValid) {
      return res.status(400).json({ message: 'Chữ ký không hợp lệ', status: 'invalid' });
    }

    const tx = await Transaction.findOne({ gateway_tx_id: result.txnRef }).populate('plan_id');
    if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch', status: 'notfound' });

    // Bảo mật: chỉ cho phép user sở hữu giao dịch này verify
    if (tx.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Không có quyền xác nhận giao dịch này' });
    }

    // Bảo mật: kiểm tra số tiền khớp (chống giả mạo amount)
    if (tx.amount !== result.amount) {
      console.warn('[VNPay Verify] Amount mismatch! DB:', tx.amount, '| VNPay:', result.amount);
      return res.status(400).json({ message: 'Số tiền không khớp', status: 'invalid' });
    }

    // Tránh xử lý lại nếu đã success
    if (tx.status === 'success') {
      return res.json({ message: 'OK', status: 'success', plan: tx.plan_id?.name, end: tx.subscription_end });
    }

    if (result.responseCode === '00') {
      tx.status          = 'success';
      tx.gateway_payload = vnpParams;
      tx.notes           = `VNPay TxnNo: ${result.vnpTxnNo || ''}`;
      await tx.save();

      const plan = tx.plan_id;
      if (plan && plan.slug !== 'free') {
        await User.findByIdAndUpdate(tx.user_id, {
          role:          'vip',
          vip_expire_at: tx.subscription_end,
        });
      }

      return res.json({ message: 'OK', status: 'success', plan: plan?.name, end: tx.subscription_end });
    } else {
      tx.status          = result.responseCode === '24' ? 'cancelled' : 'failed';
      tx.gateway_payload = vnpParams;
      await tx.save();

      return res.json({ message: 'OK', status: tx.status, code: result.responseCode });
    }
  } catch (e) {
    console.error('[VNPay Verify]', e.message);
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET my transaction history
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.userId })
      .populate('plan_id', 'name slug color icon')
      .sort({ created_at: -1 })
      .limit(20);

    res.json({ message: 'OK', data: transactions });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
