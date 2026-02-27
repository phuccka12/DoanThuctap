/**
 * cancelStalePending.js
 * Cron job chạy mỗi 1 tiếng: tự động hủy các giao dịch "pending" đã quá hạn.
 * - VNPay: hết hạn sau 15 phút (timeout cổng)
 * - Manual/Stripe: hết hạn sau 24 giờ (đủ thời gian xác nhận thủ công)
 */
const Transaction = require('../models/Transaction');

const TIMEOUT_VNPAY_MS  = 15 * 60 * 1000;         // 15 phút
const TIMEOUT_MANUAL_MS = 24 * 60 * 60 * 1000;    // 24 giờ
const INTERVAL_MS       =  1 * 60 * 60 * 1000;    // chạy mỗi 1 tiếng

async function cancelStalePendingOnce() {
  try {
    const now = new Date();
    console.log('[cancelStalePending] Đang quét giao dịch pending quá hạn...');

    // --- VNPay: quá 15 phút ---
    const vnpayCutoff = new Date(now - TIMEOUT_VNPAY_MS);
    const vnpayResult = await Transaction.updateMany(
      { status: 'pending', gateway: 'vnpay', created_at: { $lte: vnpayCutoff } },
      { $set: { status: 'cancelled', notes: 'Tự động hủy: giao dịch VNPay quá 15 phút không xác nhận' } }
    );

    // --- Manual / Stripe / PayPal: quá 24 giờ ---
    const manualCutoff = new Date(now - TIMEOUT_MANUAL_MS);
    const manualResult = await Transaction.updateMany(
      { status: 'pending', gateway: { $in: ['manual', 'stripe', 'paypal'] }, created_at: { $lte: manualCutoff } },
      { $set: { status: 'cancelled', notes: 'Tự động hủy: giao dịch chờ xác nhận quá 24 giờ' } }
    );

    const total = vnpayResult.modifiedCount + manualResult.modifiedCount;
    if (total > 0) {
      console.log(`[cancelStalePending] Đã hủy ${total} giao dịch (VNPay: ${vnpayResult.modifiedCount}, Thủ công/Khác: ${manualResult.modifiedCount})`);
    } else {
      console.log('[cancelStalePending] Không có giao dịch quá hạn.');
    }
  } catch (err) {
    console.error('[cancelStalePending] Lỗi khi chạy job:', err);
  }
}

function startCancelStalePendingJob() {
  console.log('[cancelStalePending] Job đã đăng ký, chạy ngay lần đầu và sau đó mỗi 1 tiếng.');
  // Chạy ngay khi server khởi động
  cancelStalePendingOnce();
  // Sau đó lặp mỗi 1 tiếng
  setInterval(cancelStalePendingOnce, INTERVAL_MS);
}

module.exports = { startCancelStalePendingJob };
