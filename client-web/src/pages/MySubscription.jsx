import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCreditCard, FiClock, FiCheck, FiX, FiLoader,
  FiAlertCircle, FiArrowRight, FiRefreshCw, FiZap, FiArrowLeft,
} from 'react-icons/fi';
import { FaCrown, FaRocket, FaGem, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import userBillingService from '../services/userBillingService';
import LoadingCat from '../components/shared/LoadingCat';

const THEME = {
  gray:   { bg: 'from-gray-800/60 to-gray-900/40', border: 'border-gray-600/40', accent: 'text-gray-300',   badge: 'bg-gray-500/20 text-gray-300' },
  blue:   { bg: 'from-blue-950/60 to-gray-900/40', border: 'border-blue-500/40', accent: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300' },
  purple: { bg: 'from-purple-950/60 to-gray-900/40', border: 'border-purple-500/40', accent: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  gold:   { bg: 'from-yellow-950/60 to-gray-900/40', border: 'border-yellow-500/40', accent: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
};
const ICONS = { gray: FaShieldAlt, blue: FaRocket, purple: FaCrown, gold: FaGem };

const TX_STATUS = {
  pending:   { label: 'Chờ xác nhận', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  success:   { label: 'Thành công',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  failed:    { label: 'Thất bại',     cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  refunded:  { label: 'Hoàn tiền',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  cancelled: { label: 'Đã hủy',       cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

const fmtMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const daysLeft = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
};

export default function MySubscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sub, setSub]         = useState(null);
  const [txs, setTxs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('subscription');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subRes, txRes] = await Promise.all([
        userBillingService.getMySubscription(),
        userBillingService.getMyTransactions(),
      ]);
      setSub(subRes.data?.data);
      setTxs(txRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingCat size={250} text="Đang tải thông tin gói cước..." />
      </div>
    );
  }

  const plan = sub?.currentPlan;
  const theme = THEME[plan?.color] || THEME.gray;
  const Icon = ICONS[plan?.color] || FaShieldAlt;
  const days = daysLeft(sub?.subscription_end);
  const isActive = sub?.isActive;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-700/60 hover:border-gray-600 text-sm font-medium transition-all duration-200"
            >
              <FiArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
              Quay lại
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FiCreditCard className="text-purple-400" /> Gói đăng ký của tôi
              </h1>
              <p className="text-gray-400 text-sm mt-1">Quản lý gói cước và lịch sử thanh toán</p>
            </div>
          </div>
          <button onClick={fetchAll} className="p-2 text-gray-400 hover:text-white bg-gray-800/50 border border-gray-700 rounded-lg transition overflow-hidden">
            {loading ? <LoadingCat size={24} text={null} /> : <FiRefreshCw size={15} />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          {[
            { id: 'subscription', label: 'Gói hiện tại' },
            { id: 'history',      label: `Lịch sử (${txs.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Subscription ── */}
        {tab === 'subscription' && (
          <div className="space-y-5">
            {/* Pending alert */}
            {sub?.pendingTransaction && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-300">Đang có giao dịch chờ xác nhận</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Gói <strong className="text-amber-300">{sub.pendingTransaction.plan?.name}</strong> — {fmtMoney(sub.pendingTransaction.amount)}
                    {' · '}Tạo lúc {fmtDate(sub.pendingTransaction.created_at)}
                  </p>
                  <p className="text-xs text-amber-400/60 mt-1">Admin sẽ kích hoạt trong vòng 24h sau khi nhận thanh toán.</p>
                </div>
              </div>
            )}

            {/* Current plan card */}
            <div className={`bg-linear-to-br ${theme.bg} border ${theme.border} rounded-2xl p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${theme.bg} border ${theme.border} flex items-center justify-center text-3xl`}>
                    {plan?.icon || <Icon size={24} />}
                  </div>
                  <div>
                    <h2 className={`text-xl font-extrabold ${theme.accent}`}>
                      {plan ? plan.name : 'Free'}
                    </h2>
                    <p className="text-gray-400 text-sm">{plan?.description || 'Gói miễn phí cơ bản'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-gray-700/30 text-gray-500 border-gray-600/30'}`}>
                        {isActive ? '● Đang hoạt động' : '○ Free / Hết hạn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiry */}
                {sub?.subscription_end && (
                  <div className={`text-right shrink-0 ${days !== null && days <= 7 ? 'text-rose-400' : 'text-gray-400'}`}>
                    <p className="text-xs">Hết hạn</p>
                    <p className="font-bold text-sm text-white">{fmtDate(sub.subscription_end)}</p>
                    {days !== null && (
                      <p className={`text-xs mt-0.5 ${days <= 0 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-gray-500'}`}>
                        {days <= 0 ? 'Đã hết hạn' : `còn ${days} ngày`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Features list */}
              {plan?.features?.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-1.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <FiCheck size={11} className="text-emerald-400 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning if expiring soon */}
            {isActive && days !== null && days <= 7 && days > 0 && (
              <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-sm">
                <FiAlertCircle className="text-rose-400 shrink-0" size={14} />
                <span className="text-rose-300">Gói sẽ hết hạn trong <strong>{days} ngày</strong>. Gia hạn ngay để không bị gián đoạn.</span>
              </div>
            )}

            {/* Upgrade CTA */}
            {!isActive || (user?.role !== 'admin') ? (
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-linear-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                <FiZap size={16} />
                {isActive ? 'Gia hạn / Nâng cấp gói' : 'Nâng cấp ngay'}
                <FiArrowRight size={14} />
              </button>
            ) : null}
          </div>
        )}

        {/* ── TAB: History ── */}
        {tab === 'history' && (
          <div className="space-y-3">
            {txs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FiCreditCard size={40} className="mx-auto mb-3 opacity-30" />
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : txs.map(tx => {
              const st = TX_STATUS[tx.status] || TX_STATUS.pending;
              const txTheme = THEME[tx.plan_id?.color] || THEME.gray;
              return (
                <div key={tx._id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${txTheme.bg} border ${txTheme.border} flex items-center justify-center text-lg shrink-0`}>
                    {tx.plan_id?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{tx.plan_id?.name || 'Gói không xác định'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{fmtDate(tx.created_at)}</span>
                      <span>·</span>
                      <span>{tx.billing_cycle === 'yearly' ? '1 năm' : '1 tháng'}</span>
                      {tx.subscription_end && (
                        <>
                          <span>·</span>
                          <span>HSD: {fmtDate(tx.subscription_end)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-white">{fmtMoney(tx.amount)}</p>
                    <p className="text-xs text-gray-500 capitalize">{tx.gateway}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
