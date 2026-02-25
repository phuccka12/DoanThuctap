import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiAlertCircle, FiLoader, FiArrowRight, FiHome, FiArrowLeft } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const RESULT_MAP = {
  success: {
    icon: <FiCheck size={36} className="text-emerald-400" />,
    bg:   'bg-emerald-500/15 border-emerald-500/30',
    title: 'Thanh toán thành công! 🎉',
    color: 'text-emerald-400',
  },
  failed: {
    icon: <FiX size={36} className="text-rose-400" />,
    bg:   'bg-rose-500/15 border-rose-500/30',
    title: 'Thanh toán thất bại',
    color: 'text-rose-400',
  },
  cancelled: {
    icon: <FiX size={36} className="text-gray-400" />,
    bg:   'bg-gray-700/30 border-gray-600/30',
    title: 'Đã hủy giao dịch',
    color: 'text-gray-400',
  },
  invalid: {
    icon: <FiAlertCircle size={36} className="text-amber-400" />,
    bg:   'bg-amber-500/15 border-amber-500/30',
    title: 'Chữ ký không hợp lệ',
    color: 'text-amber-400',
  },
  error: {
    icon: <FiAlertCircle size={36} className="text-amber-400" />,
    bg:   'bg-amber-500/15 border-amber-500/30',
    title: 'Có lỗi xảy ra',
    color: 'text-amber-400',
  },
  notfound: {
    icon: <FiAlertCircle size={36} className="text-gray-400" />,
    bg:   'bg-gray-700/30 border-gray-600/30',
    title: 'Không tìm thấy giao dịch',
    color: 'text-gray-400',
  },
};

const VNPAY_CODES = {
  '07': 'Giao dịch bị nghi ngờ (thẻ/tài khoản bị khóa).',
  '09': 'Thẻ/tài khoản chưa đăng ký InternetBanking.',
  '10': 'Xác thực thông tin thẻ/tài khoản quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thử lại.',
  '12': 'Thẻ/tài khoản bị khóa.',
  '13': 'Mã OTP không đúng. Vui lòng thử lại.',
  '24': 'Khách hàng đã hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Nhập sai mật khẩu quá số lần quy định.',
  '99': 'Lỗi không xác định từ VNPay.',
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function PaymentResult() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { fetchUserInfo } = useAuth();
  const [refreshed, setRefreshed] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Nếu có vnp_ResponseCode → đây là redirect trực tiếp từ VNPay → cần verify
  const vnpResponseCode = params.get('vnp_ResponseCode');
  const vnpTxnRef       = params.get('vnp_TxnRef');

  // State sau khi verify
  const [resolvedStatus, setResolvedStatus] = useState(null);
  const [resolvedPlan,   setResolvedPlan]   = useState('');
  const [resolvedEnd,    setResolvedEnd]    = useState('');
  const [resolvedCode,   setResolvedCode]   = useState('');

  useEffect(() => {
    if (vnpResponseCode && vnpTxnRef && !verifying && !resolvedStatus) {
      setVerifying(true);
      // Gửi toàn bộ VNPay params lên server để verify
      const vnpParams = {};
      for (const [k, v] of params.entries()) vnpParams[k] = v;

      import('../services/userBillingService').then(({ default: svc }) => {
        svc.verifyPayment(vnpParams)
          .then(res => {
            const d = res.data;
            setResolvedStatus(d.status);
            setResolvedPlan(d.plan || '');
            setResolvedEnd(d.end   || '');
            setResolvedCode(d.code || '');
            if (d.status === 'success') fetchUserInfo?.();
          })
          .catch(() => setResolvedStatus('error'))
          .finally(() => setVerifying(false));
      });
    }
  }, [vnpResponseCode, vnpTxnRef]);

  // Nếu không có VNPay params → dùng ?status= truyền thống
  const status  = resolvedStatus || params.get('status') || 'error';
  const plan    = resolvedPlan   || params.get('plan')   || '';
  const endDate = resolvedEnd    || params.get('end')    || '';
  const code    = resolvedCode   || params.get('code')   || '';

  const cfg = RESULT_MAP[status] || RESULT_MAP.error;

  // Refresh auth state khi success để cập nhật role VIP
  useEffect(() => {
    if (status === 'success' && !refreshed) {
      setRefreshed(true);
      fetchUserInfo?.();
    }
  }, [status, refreshed]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      {/* Loading khi đang verify VNPay params */}
      {verifying && (
        <div className="flex flex-col items-center gap-4 text-gray-300">
          <FiLoader size={40} className="animate-spin text-purple-400" />
          <p className="text-lg font-medium">Đang xác nhận thanh toán...</p>
        </div>
      )}
      {!verifying && (
      <div className="w-full max-w-sm space-y-5">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-700/60 hover:border-gray-600 text-sm font-medium transition-all duration-200"
        >
          <FiArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          Quay lại
        </button>
        {/* Result card */}
        <div className={`${cfg.bg} border rounded-2xl p-8 flex flex-col items-center text-center gap-4`}>
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${cfg.bg}`}>
            {cfg.icon}
          </div>
          <h1 className={`text-xl font-bold ${cfg.color}`}>{cfg.title}</h1>

          {/* Success details */}
          {status === 'success' && (
            <div className="w-full space-y-2 text-sm">
              {plan && (
                <div className="flex items-center justify-center gap-2 text-white font-semibold">
                  <FaCrown className="text-yellow-400" size={16} /> Gói {plan} đã được kích hoạt
                </div>
              )}
              {endDate && (
                <p className="text-gray-400">
                  Hiệu lực đến: <strong className="text-white">{fmtDate(endDate)}</strong>
                </p>
              )}
              <div className="bg-black/20 rounded-xl p-3 text-left text-xs text-gray-400 space-y-1 mt-2">
                <p>✅ Tài khoản đã được nâng cấp ngay lập tức</p>
                <p>🔓 Mọi tính năng premium đã được mở khóa</p>
                <p>📧 Xác nhận đã được ghi vào lịch sử giao dịch</p>
              </div>
            </div>
          )}

          {/* Failed details */}
          {(status === 'failed' || status === 'cancelled') && code && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {VNPAY_CODES[code] || `Mã lỗi VNPay: ${code}`}
            </p>
          )}

          {status === 'invalid' && (
            <p className="text-sm text-gray-400">Chữ ký giao dịch không khớp. Vui lòng liên hệ hỗ trợ.</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          {status === 'success' ? (
            <>
              <button onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl font-bold text-white bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 hover:shadow-lg transition">
                <FiArrowRight size={15} /> Đến trang học ngay
              </button>
              <button onClick={() => navigate('/my-subscription')}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800/40 border border-gray-700/40 hover:text-white transition">
                Xem gói đăng ký của tôi
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/pricing')}
                className="w-full py-3 rounded-xl font-bold text-white bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 hover:shadow-lg transition">
                Thử lại
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800/40 border border-gray-700/40 hover:text-white transition flex items-center justify-center gap-2">
                <FiHome size={14} /> Về trang chủ
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600">
          Cần hỗ trợ? Liên hệ admin qua email hoặc chat
        </p>
      </div>
      )}
    </div>
  );
}
