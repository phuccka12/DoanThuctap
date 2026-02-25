import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheck, FiZap, FiShield, FiLoader, FiX,
  FiAlertCircle, FiArrowRight, FiChevronDown, FiChevronUp, FiLock, FiArrowLeft, FiMinus,
} from 'react-icons/fi';
import { FaCrown, FaRocket, FaGem } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import userBillingService from '../services/userBillingService';

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  gray:   {
    card:    'bg-gray-900/80 border-gray-700/60',
    accent:  'text-gray-200',
    sub:     'text-gray-400',
    btn:     'bg-gray-700 hover:bg-gray-600 text-white',
    badge:   'bg-gray-700/60 text-gray-300',
    iconBg:  'bg-gray-800',
    iconClr: 'text-gray-300',
    check:   'text-gray-400',
    glow:    '',
  },
  blue:   {
    card:    'bg-linear-to-b from-blue-950/60 to-gray-900/90 border-blue-500/40',
    accent:  'text-blue-300',
    sub:     'text-blue-200/60',
    btn:     'bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25',
    badge:   'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    iconBg:  'bg-blue-900/60',
    iconClr: 'text-blue-300',
    check:   'text-blue-400',
    glow:    'shadow-blue-500/20',
  },
  purple: {
    card:    'bg-linear-to-b from-purple-950/70 to-gray-900/90 border-purple-500/50',
    accent:  'text-purple-200',
    sub:     'text-purple-200/60',
    btn:     'bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30',
    badge:   'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    iconBg:  'bg-purple-900/60',
    iconClr: 'text-purple-300',
    check:   'text-purple-400',
    glow:    'shadow-purple-500/25',
  },
  gold:   {
    card:    'bg-linear-to-b from-amber-950/60 to-gray-900/90 border-amber-500/40',
    accent:  'text-amber-300',
    sub:     'text-amber-200/60',
    btn:     'bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-gray-900 shadow-lg shadow-amber-500/25',
    badge:   'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    iconBg:  'bg-amber-900/60',
    iconClr: 'text-amber-300',
    check:   'text-amber-400',
    glow:    'shadow-amber-500/20',
  },
};
const ICONS = { gray: FiShield, blue: FaRocket, purple: FaCrown, gold: FaGem };

const fmtMoney  = (n) => n === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
const fmtQuota  = (v, type) => {
  if (type === 'select') return v === 'full' ? 'Toàn bộ' : 'Hạn chế';
  return v === -1 ? '∞' : String(v);
};
const isGoodVal = (v) => v === -1 || v === 'full';

const QUOTA_LABELS = [
  { key: 'speaking_checks_per_day',      label: 'Speaking AI / ngày',     icon: '🎤', type: 'number' },
  { key: 'writing_checks_per_day',       label: 'Writing AI / ngày',      icon: '✍️', type: 'number' },
  { key: 'ai_chat_messages_per_day',     label: 'AI Chat / ngày',         icon: '💬', type: 'number' },
  { key: 'ai_roleplay_sessions_per_day', label: 'Roleplay / ngày',        icon: '🤖', type: 'number' },
  { key: 'reading_passages_access',      label: 'Reading Passages',       icon: '📖', type: 'select' },
];

// ─── Purchase Modal ────────────────────────────────────────────────────────────
function PurchaseModal({ plan, onClose }) {
  const [cycle,   setCycle]   = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const theme   = THEME[plan.color] || THEME.gray;
  const amount  = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const savings = plan.price_monthly > 0 && plan.price_yearly > 0
    ? Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100) : 0;

  const handlePay = async () => {
    setError(''); setLoading(true);
    try {
      const res = await userBillingService.createPayment({ plan_id: plan._id, billing_cycle: cycle });
      window.location.href = res.data.data.payUrl;
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể kết nối cổng thanh toán. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const Icon = ICONS[plan.color] || FiShield;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-700/70 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-gray-800">
          <button onClick={onClose} disabled={loading}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition">
            <FiX size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center text-xl`}>
              {plan.icon || <Icon size={20} className={theme.iconClr} />}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Đăng ký gói</p>
              <h2 className={`font-bold text-lg leading-tight ${theme.accent}`}>{plan.name}</h2>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Billing toggle */}
          {plan.price_yearly > 0 && (
            <div className="grid grid-cols-2 gap-2 bg-gray-800/50 p-1.5 rounded-xl">
              {[
                { id: 'monthly', label: 'Theo tháng', price: fmtMoney(plan.price_monthly) },
                { id: 'yearly',  label: 'Theo năm',   price: fmtMoney(plan.price_yearly), tag: savings > 0 ? `-${savings}%` : null },
              ].map(opt => (
                <button key={opt.id} onClick={() => setCycle(opt.id)} disabled={loading}
                  className={`relative rounded-lg py-2.5 px-3 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                    cycle === opt.id ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className="text-xs">{opt.label}</span>
                  <span className="font-bold">{opt.price}</span>
                  {opt.tag && (
                    <span className="absolute -top-1.5 -right-1 text-[9px] font-extrabold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                      {opt.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Order summary */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl divide-y divide-gray-700/40">
            <div className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="text-gray-400">Gói</span>
              <span className="font-semibold text-white">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="text-gray-400">Thời hạn</span>
              <span className="text-white">{cycle === 'yearly' ? '12 tháng' : '1 tháng'}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-gray-300 font-semibold">Tổng cộng</span>
              <span className={`text-2xl font-extrabold ${theme.accent}`}>{fmtMoney(amount)}</span>
            </div>
          </div>

          {/* VNPay note */}
          <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-800/40 rounded-xl p-3.5">
            <FiLock className="text-blue-400 shrink-0 mt-0.5" size={14} />
            <div className="text-xs text-gray-400 leading-relaxed space-y-1">
              <p>Bạn sẽ được chuyển sang cổng <strong className="text-white">VNPay</strong> (sandbox).</p>
              <p>Thẻ test: <span className="font-mono text-yellow-300 text-[11px]">9704198526191432198</span> · <span className="font-mono text-yellow-300 text-[11px]">07/15</span> · OTP <span className="font-mono text-yellow-300 text-[11px]">123456</span></p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <FiAlertCircle size={13} className="shrink-0" /> {error}
            </div>
          )}

          <button onClick={handlePay} disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${theme.btn}`}
          >
            {loading
              ? <><FiLoader className="animate-spin" size={15} /> Đang chuyển sang VNPay...</>
              : <><FiLock size={14} /> Thanh toán {fmtMoney(amount)}</>
            }
          </button>

          <p className="text-center text-[11px] text-gray-600">Mã hóa SSL 256-bit · Sandbox mode</p>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, currentRole, onSelect, isPopular, billingCycle }) {
  const theme = THEME[plan.color] || THEME.gray;
  const Icon  = ICONS[plan.color] || FiShield;
  const isFree        = plan.slug === 'free';
  const isCurrentPlan = (currentRole === 'vip' && !isFree) || (currentRole === 'standard' && isFree);
  const price   = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const savings = plan.price_monthly > 0 && plan.price_yearly > 0
    ? Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100) : 0;

  return (
    <div className={`relative flex flex-col rounded-2xl border backdrop-blur-sm transition-all duration-300
      ${theme.card}
      ${isPopular
        ? `shadow-2xl ${theme.glow} scale-[1.03] z-10 ring-1 ${
            plan.color === 'purple' ? 'ring-purple-500/30' :
            plan.color === 'blue'   ? 'ring-blue-500/30' :
            plan.color === 'gold'   ? 'ring-amber-500/30' : 'ring-gray-500/20'
          }`
        : 'hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      {/* Popular label */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <span className="inline-flex items-center gap-1.5 bg-linear-to-r from-purple-500 to-pink-500 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
            ⭐ Được chọn nhiều nhất
          </span>
        </div>
      )}

      <div className={`p-6 flex flex-col gap-5 flex-1 ${isPopular ? 'pt-8' : ''}`}>
        {/* Plan header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center`}>
              {plan.icon
                ? <span className="text-xl">{plan.icon}</span>
                : <Icon size={18} className={theme.iconClr} />
              }
            </div>
            {isCurrentPlan && (
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${theme.badge}`}>
                Gói hiện tại
              </span>
            )}
          </div>
          <h3 className={`text-xl font-extrabold ${theme.accent}`}>{plan.name}</h3>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="py-4 border-y border-gray-800/60">
          {plan.price_monthly === 0 ? (
            <div className={`text-4xl font-extrabold ${theme.accent}`}>Miễn phí</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold tracking-tight ${theme.accent}`}>
                  {new Intl.NumberFormat('vi-VN').format(price)}
                </span>
                <span className="text-gray-500 text-sm">₫</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {billingCycle === 'yearly' ? 'mỗi năm' : 'mỗi tháng'}
                {billingCycle === 'yearly' && savings > 0 && (
                  <span className="ml-2 text-emerald-400 font-semibold">tiết kiệm {savings}%</span>
                )}
              </p>
            </>
          )}
        </div>

        {/* Quota */}
        <div className="space-y-2.5">
          {QUOTA_LABELS.map(({ key, label, icon, type }) => {
            const val     = plan.quota?.[key];
            const display = fmtQuota(val, type);
            const good    = isGoodVal(val);
            const none    = val === 0 || val === 'limited';
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-400 text-xs">
                  <span className="text-base leading-none">{icon}</span>
                  {label}
                </span>
                <span className={`text-xs font-bold min-w-8 text-right ${
                  good ? 'text-emerald-400' : none ? 'text-gray-600' : 'text-gray-200'
                }`}>
                  {none ? <FiMinus size={12} className="inline" /> : display}
                </span>
              </div>
            );
          })}
        </div>

        {/* Features */}
        {plan.features?.length > 0 && (
          <ul className="space-y-2 flex-1 pt-2 border-t border-gray-800/50">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                <FiCheck size={12} className={`${theme.check} shrink-0 mt-0.5`} />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        {isCurrentPlan ? (
          <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            ✓ Gói đang sử dụng
          </div>
        ) : isFree ? (
          <div className="w-full py-3 rounded-xl text-center text-sm text-gray-600 bg-gray-800/40 border border-gray-700/30">
            Mặc định · Miễn phí
          </div>
        ) : (
          <button
            onClick={() => onSelect(plan)}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${theme.btn}`}
          >
            Bắt đầu ngay <FiArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [faqOpen,  setFaqOpen]  = useState(null);
  const [cycle,    setCycle]    = useState('monthly');

  useEffect(() => {
    userBillingService.getPublicPlans()
      .then(r => setPlans(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (plan) => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/pricing' } }); return; }
    setSelected(plan);
  };

  const hasYearly = plans.some(p => p.price_yearly > 0);

  const FAQS = [
    { q: 'Sau khi thanh toán bao lâu thì được kích hoạt?',
      a: 'Tài khoản được nâng cấp ngay lập tức sau khi VNPay xác nhận giao dịch thành công — không cần chờ đợi.' },
    { q: 'Tôi có thể hủy gói và được hoàn tiền không?',
      a: 'Hiện tại chưa hỗ trợ hoàn tiền sau khi đã kích hoạt. Liên hệ admin trong các trường hợp đặc biệt.' },
    { q: 'Hết hạn gói thì tài khoản có bị khóa không?',
      a: 'Không. Tài khoản tự động trở về gói Free. Dữ liệu học tập của bạn vẫn được giữ nguyên hoàn toàn.' },
    { q: 'Tôi có thể nâng cấp lên gói cao hơn không?',
      a: 'Có. Bạn có thể đăng ký gói mới bất cứ lúc nào. Gói mới sẽ được kích hoạt ngay từ ngày thanh toán.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Sticky top nav ── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-700/60 text-sm font-medium transition-all duration-200"
          >
            <FiArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Quay lại
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiLock size={11} /> SSL · VNPay Sandbox
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pt-20 pb-16 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-72 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-1/4 w-56 h-56 bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-56 h-56 bg-pink-600/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <FiZap size={11} className="text-yellow-400" /> Nâng cấp tài khoản IELTS AI
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-5">
            Đơn giản, minh bạch{' '}
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              không ẩn phí
            </span>
          </h1>

          <p className="text-gray-400 text-base leading-relaxed max-w-md mx-auto">
            Chọn gói phù hợp với mục tiêu IELTS của bạn. Nâng cấp hoặc hủy bất cứ lúc nào.
          </p>

          {/* Billing toggle */}
          {hasYearly && (
            <div className="mt-8 inline-flex items-center bg-gray-900 border border-gray-700/60 p-1 rounded-xl gap-1">
              <button
                onClick={() => setCycle('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  cycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Theo tháng
              </button>
              <button
                onClick={() => setCycle('yearly')}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  cycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Theo năm
                <span className="absolute -top-2 -right-2 text-[9px] font-extrabold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shadow">
                  -20%
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Plans grid ── */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <FiLoader className="animate-spin text-purple-400" size={36} />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-24 text-gray-600">Chưa có gói nào đang hoạt động.</div>
        ) : (
          <div className={`grid gap-4 items-start pt-6 ${
            plans.length === 1 ? 'max-w-xs mx-auto' :
            plans.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
            plans.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
            'sm:grid-cols-3'
          }`}>
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                currentRole={user?.role}
                onSelect={handleSelect}
                billingCycle={cycle}
                isPopular={plan.is_featured || (plans.length >= 2 && idx === Math.floor(plans.length / 2))}
              />
            ))}
          </div>
        )}

        {/* Trust row */}
        {!loading && plans.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: '🔒', text: 'Bảo mật SSL 256-bit' },
              { icon: '⚡', text: 'Kích hoạt tức thì' },
              { icon: '🏦', text: 'Thanh toán VNPay' },
              { icon: '📞', text: 'Hỗ trợ 24/7' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 text-xs text-gray-600">
                <span>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>
        )}

        {/* ── FAQ ── */}
        <div className="mt-24 max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">Câu hỏi thường gặp</h2>
            <p className="text-gray-500 text-sm mt-2">Mọi thứ bạn cần biết trước khi bắt đầu</p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => {
              const open = faqOpen === i;
              return (
                <div key={i} className={`rounded-xl border overflow-hidden transition-colors ${
                  open ? 'bg-gray-800/60 border-gray-700/70' : 'bg-gray-900/50 border-gray-800/60 hover:border-gray-700/50'
                }`}>
                  <button
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm text-left gap-4 group"
                  >
                    <span className={`font-medium transition-colors ${open ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {faq.q}
                    </span>
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      open ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {open ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-700/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Purchase Modal ── */}
      {selected && (
        <PurchaseModal
          plan={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
