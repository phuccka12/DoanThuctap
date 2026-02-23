import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDollarSign, FiPackage, FiList, FiPlus, FiEdit2, FiTrash2,
  FiRefreshCw, FiSearch, FiCheck, FiX, FiZap, FiStar, FiShield,
  FiAlertCircle, FiLoader, FiChevronLeft, FiChevronRight, FiSave,
  FiArrowRight, FiUsers, FiTrendingUp,
} from 'react-icons/fi';
import { FaCrown, FaRocket, FaGem } from 'react-icons/fa';
import billingService from '../../services/billingService';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  success:   { label: 'Thành công', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  pending:   { label: 'Chờ xử lý', cls: 'bg-amber-500/15  text-amber-400  border-amber-500/30'  },
  failed:    { label: 'Thất bại',   cls: 'bg-rose-500/15   text-rose-400   border-rose-500/30'   },
  refunded:  { label: 'Hoàn tiền',  cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30'   },
  cancelled: { label: 'Đã hủy',     cls: 'bg-gray-500/15   text-gray-400   border-gray-500/30'   },
};

const GATEWAY_LABELS = { stripe: 'Stripe', paypal: 'PayPal', vnpay: 'VNPay', manual: 'Thủ công' };

const PLAN_THEMES = {
  gray:   { bg: 'from-gray-700/50 to-gray-800/30',   border: 'border-gray-600/50',   badge: 'bg-gray-500/20 text-gray-300',   accent: 'text-gray-300' },
  blue:   { bg: 'from-blue-900/40 to-blue-800/20',   border: 'border-blue-500/40',   badge: 'bg-blue-500/20 text-blue-300',   accent: 'text-blue-400' },
  purple: { bg: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-300', accent: 'text-purple-400' },
  gold:   { bg: 'from-yellow-900/40 to-amber-800/20', border: 'border-yellow-500/40', badge: 'bg-yellow-500/20 text-yellow-300', accent: 'text-yellow-400' },
};

const PLAN_ICONS = { gray: FiShield, blue: FaRocket, purple: FaCrown, gold: FaGem };

const QUOTA_FIELDS = [
  { key: 'speaking_checks_per_day',      label: 'Speaking checks / ngày',      icon: '🎤', hint: '-1 = ∞' },
  { key: 'writing_checks_per_day',       label: 'Writing checks / ngày',       icon: '✍️', hint: '-1 = ∞' },
  { key: 'ai_chat_messages_per_day',     label: 'AI Chat messages / ngày',     icon: '💬', hint: '-1 = ∞' },
  { key: 'ai_roleplay_sessions_per_day', label: 'AI Roleplay sessions / ngày', icon: '🤖', hint: '-1 = ∞' },
  { key: 'reading_passages_access',      label: 'Reading Passages',            icon: '📖', type: 'select', options: ['limited', 'full'] },
];

const PLAN_TEMPLATES = [
  {
    label: 'Free', icon: '🛡️', color: 'gray',
    price_monthly: 0, price_yearly: 0,
    description: 'Dành cho người mới bắt đầu khám phá nền tảng',
    features: ['3 speaking checks mỗi ngày', '10 AI chat messages', 'Truy cập reading hạn chế', 'Từ vựng cơ bản'],
    quota: { speaking_checks_per_day: 3, writing_checks_per_day: 3, ai_chat_messages_per_day: 10, ai_roleplay_sessions_per_day: 1, reading_passages_access: 'limited' },
  },
  {
    label: 'Pro', icon: '🚀', color: 'blue',
    price_monthly: 99000, price_yearly: 990000,
    description: 'Dành cho học viên muốn luyện tập nghiêm túc mỗi ngày',
    features: ['30 speaking checks mỗi ngày', '100 AI chat messages', 'Toàn bộ reading passages', '10 AI roleplay sessions', 'Phân tích điểm yếu'],
    quota: { speaking_checks_per_day: 30, writing_checks_per_day: 30, ai_chat_messages_per_day: 100, ai_roleplay_sessions_per_day: 10, reading_passages_access: 'full' },
  },
  {
    label: 'Premium', icon: '👑', color: 'purple',
    price_monthly: 199000, price_yearly: 1990000,
    description: 'Trải nghiệm không giới hạn, tối đa hóa kết quả',
    features: ['Không giới hạn speaking', 'Không giới hạn AI chat', 'Toàn bộ tính năng', 'Ưu tiên hỗ trợ 24/7', 'Chứng chỉ hoàn thành'],
    quota: { speaking_checks_per_day: -1, writing_checks_per_day: -1, ai_chat_messages_per_day: -1, ai_roleplay_sessions_per_day: -1, reading_passages_access: 'full' },
  },
];

const fmtMoney  = (n) => n === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtQuota  = (v) => v === -1 ? '∞' : (v ?? '—');

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  const isErr = msg.startsWith('❌');
  return (
    <div className={`fixed top-5 right-5 z-100 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2 ${
      isErr ? 'bg-rose-900/90 border-rose-500/50 text-rose-200' : 'bg-gray-800/95 border-gray-600/50 text-white'
    }`}>
      {isErr ? <FiAlertCircle size={16} /> : <FiCheck size={16} className="text-emerald-400" />}
      {msg}
    </div>
  );
}

// ─── Plan Preview Card ────────────────────────────────────────────────────────
function PlanPreviewCard({ form }) {
  const theme = PLAN_THEMES[form.color] || PLAN_THEMES.gray;
  const Icon = PLAN_ICONS[form.color] || FiShield;
  return (
    <div className={`bg-linear-to-br ${theme.bg} border ${theme.border} rounded-2xl p-5 flex flex-col gap-3 h-full`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{form.icon || '🎯'}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-base ${theme.accent}`}>{form.name || 'Tên gói'}</span>
            {form.is_featured && <FiStar size={13} className="text-yellow-400" />}
          </div>
          <span className="text-xs text-gray-400">{form.description || 'Mô tả gói...'}</span>
        </div>
      </div>
      <div>
        <span className={`text-2xl font-bold ${theme.accent}`}>{fmtMoney(form.price_monthly)}</span>
        <span className="text-xs text-gray-500 ml-1">/ tháng</span>
        {form.price_yearly > 0 && (
          <div className="text-xs text-emerald-400 mt-0.5">{fmtMoney(form.price_yearly)} / năm</div>
        )}
      </div>
      <div className="space-y-1 text-xs">
        {QUOTA_FIELDS.map(({ key, icon, label }) => (
          <div key={key} className="flex justify-between text-gray-400">
            <span>{icon} {label}</span>
            <span className={`font-mono font-semibold ${fmtQuota(form.quota?.[key]) === '∞' ? 'text-emerald-400' : 'text-white'}`}>
              {fmtQuota(form.quota?.[key])}
            </span>
          </div>
        ))}
      </div>
      {form.features?.length > 0 && (
        <div className="space-y-1">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
              <FiCheck size={10} className="text-emerald-400 shrink-0" /> {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plan Form (multi-step) ───────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSave }) {
  const isEdit = !!plan?._id;
  const EMPTY = {
    name: '', slug: '', description: '', color: 'gray', icon: '🎯',
    price_monthly: 0, price_yearly: 0,
    is_active: true, is_featured: false, sort_order: 0,
    features: [],
    quota: { speaking_checks_per_day: 3, writing_checks_per_day: 3, ai_chat_messages_per_day: 10, ai_roleplay_sessions_per_day: 2, reading_passages_access: 'limited' },
  };

  const [step, setStep]       = useState(isEdit ? 1 : 0); // 0=template picker, 1=basic, 2=quota, 3=features
  const [form, setForm]       = useState(plan ? { ...EMPTY, ...plan, features: plan.features || [], quota: { ...EMPTY.quota, ...plan.quota } } : EMPTY);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [featureInput, setFeatureInput] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setQuota = (k, v) => setForm(p => ({ ...p, quota: { ...p.quota, [k]: v } }));

  const applyTemplate = (tpl) => {
    setForm(p => ({
      ...p,
      name: tpl.label, slug: tpl.label.toLowerCase(),
      icon: tpl.icon, color: tpl.color,
      description: tpl.description,
      price_monthly: tpl.price_monthly,
      price_yearly: tpl.price_yearly,
      features: [...tpl.features],
      quota: { ...tpl.quota },
    }));
    setStep(1);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Tên gói không được để trống';
    if (form.price_monthly < 0) e.price_monthly = 'Giá không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { setStep(1); return; }
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
      if (isEdit) await billingService.updatePlan(plan._id, payload);
      else await billingService.createPlan(payload);
      onSave('✅ ' + (isEdit ? 'Đã cập nhật gói cước' : 'Đã tạo gói cước mới'));
    } catch (e) {
      setErrors({ api: e.response?.data?.message || 'Lỗi khi lưu' });
    } finally { setSaving(false); }
  };

  const addFeature = () => {
    const f = featureInput.trim();
    if (f && !form.features.includes(f)) { set('features', [...form.features, f]); setFeatureInput(''); }
  };

  const STEPS = ['Mẫu', 'Thông tin', 'Hạn mức AI', 'Tính năng'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700/60 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdit ? '✏️ Chỉnh sửa gói cước' : '➕ Tạo gói cước mới'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Cập nhật thông tin và cấu hình giới hạn' : 'Thiết lập gói subscription cho học viên'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>

        {/* Step Indicator (skip for edit) */}
        {!isEdit && (
          <div className="flex items-center gap-0 px-6 py-3 border-b border-gray-800/60 bg-gray-900/50">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => i > 0 && setStep(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    step === i ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    i < step   ? 'text-emerald-400 cursor-pointer hover:bg-gray-800' :
                                 'text-gray-500 cursor-default'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < step ? 'bg-emerald-500 text-white' : step === i ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>{i < step ? '✓' : i + 1}</span>
                  {s}
                </button>
                {i < STEPS.length - 1 && <FiArrowRight size={12} className="text-gray-600 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Body: left=form, right=preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Form Area */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* STEP 0: Template Picker */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-300 mb-4">Chọn mẫu nhanh hoặc <button onClick={() => setStep(1)} className="text-purple-400 underline">bắt đầu từ đầu</button></p>
                <div className="grid grid-cols-3 gap-4">
                  {PLAN_TEMPLATES.map((tpl) => {
                    const theme = PLAN_THEMES[tpl.color];
                    const Icon = PLAN_ICONS[tpl.color];
                    return (
                      <button
                        key={tpl.label}
                        onClick={() => applyTemplate(tpl)}
                        className={`group relative bg-linear-to-br ${theme.bg} border-2 ${theme.border} rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-3xl">{tpl.icon}</span>
                          <div>
                            <p className={`font-bold text-base ${theme.accent}`}>{tpl.label}</p>
                            <p className="text-xs text-gray-400">{fmtMoney(tpl.price_monthly)}/tháng</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{tpl.description}</p>
                        <div className="space-y-1">
                          {tpl.features.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                              <FiCheck size={10} className="text-emerald-400 shrink-0" /> {f}
                            </div>
                          ))}
                        </div>
                        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge}`}>
                          Dùng mẫu này →
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setStep(1)} className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition">
                  + Tạo gói tùy chỉnh từ đầu
                </button>
              </div>
            )}

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tên gói <span className="text-rose-400">*</span></label>
                    <input
                      type="text" value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="VD: Free, Pro, Premium..."
                      className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.name ? 'border-rose-500' : 'border-gray-600'}`}
                    />
                    {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Slug (URL-friendly)</label>
                    <input
                      type="text" value={form.slug}
                      onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="free / pro / premium"
                      className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Icon (emoji)</label>
                    <div className="flex gap-2">
                      <input
                        type="text" value={form.icon} onChange={e => set('icon', e.target.value)}
                        className="w-20 px-3 py-2.5 bg-gray-800/60 border border-gray-600 rounded-xl text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {['🛡️','🚀','👑','💎','⭐','🎯','🔥','💡'].map(e => (
                          <button key={e} onClick={() => set('icon', e)}
                            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${form.icon === e ? 'bg-purple-500/30 border border-purple-500/50' : 'hover:bg-gray-700/50'}`}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Mô tả ngắn</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                    placeholder="Mô tả dành cho ai và phù hợp mục tiêu gì..."
                    className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                {/* Color / Theme */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Chủ đề màu sắc</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(PLAN_THEMES).map(([colorKey, theme]) => {
                      const Icon = PLAN_ICONS[colorKey];
                      return (
                        <button key={colorKey} onClick={() => set('color', colorKey)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition text-sm font-semibold bg-linear-to-br ${theme.bg} ${
                            form.color === colorKey ? theme.border + ' scale-[1.03]' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}>
                          <Icon size={14} className={theme.accent} />
                          <span className={theme.accent}>{colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">💰 Giá cả</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[['Giá hàng tháng (VND)', 'price_monthly'], ['Giá hàng năm (VND)', 'price_yearly']].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₫</span>
                          <input type="number" min="0" value={form[key]}
                            onChange={e => set(key, Math.max(0, Number(e.target.value)))}
                            className={`w-full pl-7 pr-3 py-2.5 bg-gray-800/60 border rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors[key] ? 'border-rose-500' : 'border-gray-600'}`}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{form[key] === 0 ? 'Miễn phí' : fmtMoney(form[key])}</p>
                      </div>
                    ))}
                  </div>
                  {form.price_yearly > 0 && form.price_monthly > 0 && (
                    <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                      💡 Tiết kiệm {Math.round((1 - (form.price_yearly / (form.price_monthly * 12))) * 100)}% khi đăng ký năm
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="flex items-center gap-6">
                  {[['Kích hoạt gói này', 'is_active', 'bg-emerald-500'], ['Hiển thị nổi bật', 'is_featured', 'bg-yellow-500']].map(([label, key, activeCls]) => (
                    <div key={key} className="flex items-center gap-2.5 cursor-pointer" onClick={() => set(key, !form[key])}>
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${form[key] ? activeCls : 'bg-gray-600'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                      <span className="text-sm text-gray-300">{label}</span>
                    </div>
                  ))}
                  <div className="ml-auto">
                    <label className="block text-xs text-gray-400 mb-1">Thứ tự</label>
                    <input type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 text-center bg-gray-800/60 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Quota */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex gap-2">
                  <FiZap size={14} className="shrink-0 mt-0.5" />
                  Nhập <strong>-1</strong> để cho phép không giới hạn. Cài đặt này kiểm soát mức sử dụng AI mỗi ngày của người dùng thuộc gói này.
                </div>
                <div className="space-y-3">
                  {QUOTA_FIELDS.map(({ key, label, icon, hint, type, options }) => (
                    <div key={key} className="bg-gray-800/40 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-2xl shrink-0">{icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-xs text-gray-500">{hint}</p>
                      </div>
                      {type === 'select' ? (
                        <select value={form.quota[key]} onChange={e => setQuota(key, e.target.value)}
                          className="w-28 px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500">
                          {options.map(o => <option key={o} value={o}>{o === 'full' ? '✅ Full' : '⚠️ Limited'}</option>)}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQuota(key, Math.max(-1, (form.quota[key] || 0) - 1))}
                            className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm flex items-center justify-center transition">−</button>
                          <input type="number" value={form.quota[key]} onChange={e => setQuota(key, Number(e.target.value))}
                            className={`w-16 text-center px-2 py-1.5 text-sm font-mono bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 ${form.quota[key] === -1 ? 'text-emerald-400' : ''}`}
                          />
                          <button onClick={() => setQuota(key, (form.quota[key] || 0) + 1)}
                            className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm flex items-center justify-center transition">+</button>
                          <button onClick={() => setQuota(key, -1)}
                            className="px-2 py-1.5 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg transition">∞</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Features */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Các tính năng nổi bật hiển thị trên trang đăng ký cho học viên thấy.</p>
                <div className="flex gap-2">
                  <input
                    value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="VD: Không giới hạn speaking checks..."
                    className="flex-1 px-4 py-2.5 bg-gray-800/60 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button onClick={addFeature} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-1">
                    <FiPlus size={14} /> Thêm
                  </button>
                </div>

                {/* Quick add suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  {['Ưu tiên hỗ trợ', 'Phân tích điểm yếu', 'Chứng chỉ hoàn thành', 'Offline mode', 'Lịch sử học tập', 'Download tài liệu'].map(s => (
                    !form.features.includes(s) && (
                      <button key={s} onClick={() => set('features', [...form.features, s])}
                        className="px-2.5 py-1 text-xs bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-full transition">
                        + {s}
                      </button>
                    )
                  ))}
                </div>

                {/* Features list */}
                <div className="space-y-2">
                  {form.features.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 text-sm">Chưa có tính năng nào. Thêm tính năng để làm nổi bật gói này.</p>
                  ) : form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/40 border border-gray-700/50 rounded-xl group">
                      <FiCheck size={14} className="text-emerald-400 shrink-0" />
                      <span className="flex-1 text-sm text-white">{f}</span>
                      <button onClick={() => set('features', form.features.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition">
                        <FiX size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Error */}
            {errors.api && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm mt-4">
                <FiAlertCircle size={15} /> {errors.api}
              </div>
            )}
          </div>

          {/* RIGHT: Live Preview */}
          {step >= 1 && (
            <div className="w-64 shrink-0 border-l border-gray-700/50 p-4 bg-gray-900/50 overflow-y-auto">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
              <PlanPreviewCard form={form} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between bg-gray-900/50">
          <div className="flex gap-2">
            {step > 0 && !isEdit && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-xl text-sm transition">
                <FiChevronLeft size={14} /> Quay lại
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-xl transition">
              Hủy
            </button>
            {(step < 3 && !isEdit) ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium transition hover:shadow-lg hover:shadow-purple-500/20">
                Tiếp theo <FiChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium disabled:opacity-50 transition hover:shadow-lg hover:shadow-purple-500/30">
                {saving ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật gói' : 'Tạo gói cước'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card (display) ──────────────────────────────────────────────────────
function PlanCard({ plan, onEdit, onDelete, onToggleActive }) {
  const theme = PLAN_THEMES[plan.color] || PLAN_THEMES.gray;
  const Icon = PLAN_ICONS[plan.color] || FiShield;

  return (
    <div className={`relative bg-linear-to-br ${theme.bg} border ${theme.border} rounded-2xl flex flex-col overflow-hidden transition-opacity ${!plan.is_active ? 'opacity-60' : ''}`}>
      {/* Featured ribbon */}
      {plan.is_featured && (
        <div className="absolute top-0 right-0">
          <div className="bg-yellow-500 text-black text-[10px] font-bold px-3 py-0.5 rounded-bl-xl">⭐ Nổi bật</div>
        </div>
      )}
      {!plan.is_active && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="px-2 py-0.5 bg-gray-800/90 border border-gray-600 text-gray-400 text-[10px] font-medium rounded-full">Đã tắt</span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${theme.bg} border ${theme.border} flex items-center justify-center text-xl`}>
              {plan.icon}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${theme.accent}`}>{plan.name}</h3>
              <p className="text-xs text-gray-400 line-clamp-1">{plan.description}</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onToggleActive(plan)} title={plan.is_active ? 'Tắt gói' : 'Bật gói'} className={`p-1.5 hover:bg-white/10 rounded-lg transition ${plan.is_active ? 'text-emerald-400 hover:text-amber-400' : 'text-gray-500 hover:text-emerald-400'}`}>
              {plan.is_active ? <FiZap size={14} /> : <FiZap size={14} />}
            </button>
            <button onClick={() => onEdit(plan)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition"><FiEdit2 size={14} /></button>
            <button onClick={() => onDelete(plan._id)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-rose-400 transition"><FiTrash2 size={14} /></button>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold ${theme.accent}`}>{fmtMoney(plan.price_monthly)}</span>
          {plan.price_monthly > 0 && <span className="text-xs text-gray-500">/ tháng</span>}
          {plan.price_yearly > 0 && (
            <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {fmtMoney(plan.price_yearly)}/năm
            </span>
          )}
        </div>

        {/* Quota */}
        <div className="bg-black/20 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Giới hạn AI mỗi ngày</p>
          {QUOTA_FIELDS.map(({ key, icon, label }) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">{icon} {label}</span>
              <span className={`font-mono font-bold ${fmtQuota(plan.quota?.[key]) === '∞' ? 'text-emerald-400' : 'text-white'}`}>
                {fmtQuota(plan.quota?.[key])}
              </span>
            </div>
          ))}
        </div>

        {/* Features */}
        {plan.features?.length > 0 && (
          <div className="space-y-1.5 flex-1">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                <FiCheck size={11} className="text-emerald-400 shrink-0" /> {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
        <span>#{plan.sort_order} · slug: <span className="font-mono">{plan.slug}</span></span>
        <span className={`px-2 py-0.5 rounded-full border ${plan.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-gray-700/30 text-gray-500 border-gray-600/30'}`}>
          {plan.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminBilling() {
  const [tab, setTab]               = useState('plans');
  const [plans, setPlans]           = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txStats, setTxStats]       = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters]       = useState({ search: '', status: '', gateway: '' });
  const [loadingTx, setLoadingTx]   = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planModal, setPlanModal]   = useState(null); // null | 'new' | planObj
  const [statusModal, setStatusModal] = useState(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await billingService.getPlans();
      setPlans(res.data?.data || []);
    } catch { showToast('❌ Không tải được danh sách gói'); }
    finally { setLoadingPlans(false); }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const params = { page: pagination.page, limit: 15, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await billingService.getTransactions(params);
      setTransactions(res.data?.data?.transactions || []);
      setPagination(p => ({ ...p, totalPages: res.data?.data?.totalPages || 1, total: res.data?.data?.total || 0 }));
    } catch { showToast('❌ Không tải được giao dịch'); }
    finally { setLoadingTx(false); }
  }, [pagination.page, filters]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { if (tab === 'transactions') fetchTransactions(); }, [tab, fetchTransactions]);

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Xóa gói cước này? Hành động không thể hoàn tác.')) return;
    try {
      await billingService.deletePlan(id);
      showToast('✅ Đã xóa gói cước');
      fetchPlans();
    } catch (e) { showToast('❌ ' + (e.response?.data?.message || 'Lỗi khi xóa')); }
  };

  const handleToggleActive = async (plan) => {
    try {
      await billingService.updatePlan(plan._id, { is_active: !plan.is_active });
      showToast(plan.is_active ? '✅ Đã tắt gói cước' : '✅ Đã bật gói cước');
      fetchPlans();
    } catch (e) { showToast('❌ ' + (e.response?.data?.message || 'Lỗi')); }
  };

  const handleUpdateTxStatus = async () => {
    if (!statusModal) return;
    try {
      await billingService.updateTransactionStatus(statusModal.tx._id, { status: statusModal.newStatus });
      showToast('✅ Đã cập nhật trạng thái');
      setStatusModal(null);
      fetchTransactions();
    } catch { showToast('❌ Lỗi khi cập nhật'); }
  };

  const filterChange = (k, v) => {
    setFilters(p => ({ ...p, [k]: v }));
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <Toast msg={toast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <FiDollarSign size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gói Cước & Thanh Toán</h1>
            <p className="text-gray-400 text-sm">Quản lý subscription plans và lịch sử giao dịch</p>
          </div>
        </div>
        {tab === 'plans' && (
          <button
            onClick={() => setPlanModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm transition hover:shadow-lg hover:shadow-purple-500/30"
          >
            <FiPlus size={16} /> Tạo gói mới
          </button>
        )}
      </div>

      {/* Stats summary */}
      {tab === 'plans' && plans.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: FiPackage, label: 'Tổng gói cước', value: plans.length,                              color: 'from-purple-500/10 to-purple-900/5 border-purple-500/20 text-purple-400' },
            { icon: FiUsers,   label: 'Gói đang hoạt động', value: plans.filter(p => p.is_active).length, color: 'from-emerald-500/10 to-emerald-900/5 border-emerald-500/20 text-emerald-400' },
            { icon: FiStar,    label: 'Gói nổi bật', value: plans.filter(p => p.is_featured).length,      color: 'from-yellow-500/10 to-yellow-900/5 border-yellow-500/20 text-yellow-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`bg-linear-to-br ${color} border rounded-xl p-4 flex items-center gap-3`}>
              <Icon size={22} className="shrink-0" />
              <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        {[
          { id: 'plans', label: 'Các gói cước', icon: FiPackage },
          { id: 'transactions', label: 'Lịch sử giao dịch', icon: FiList },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB: PLANS ── */}
      {tab === 'plans' && (
        <>
          {loadingPlans ? (
            <div className="flex justify-center py-20">
              <FiLoader className="animate-spin text-purple-400" size={32} />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-24 bg-gray-800/30 border border-dashed border-gray-700 rounded-2xl">
              <FiPackage size={48} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Chưa có gói cước nào</h3>
              <p className="text-gray-500 mb-6 text-sm">Tạo gói đầu tiên để học viên có thể đăng ký</p>
              <button onClick={() => setPlanModal('new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-lg">
                <FiPlus size={16} /> Tạo gói đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...plans].sort((a, b) => a.sort_order - b.sort_order).map(plan => (
                <PlanCard key={plan._id} plan={plan} onEdit={(p) => setPlanModal(p)} onDelete={handleDeletePlan} onToggleActive={handleToggleActive} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: TRANSACTIONS ── */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input value={filters.search} onChange={e => filterChange('search', e.target.value)}
                placeholder="Tìm theo email / tên user..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
            <select value={filters.status} onChange={e => filterChange('status', e.target.value)}
              className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filters.gateway} onChange={e => filterChange('gateway', e.target.value)}
              className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500">
              <option value="">Tất cả kênh TT</option>
              {Object.entries(GATEWAY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={fetchTransactions} className="p-2 bg-gray-900/50 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition" title="Làm mới">
              <FiRefreshCw size={14} className={loadingTx ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_130px_110px_110px_90px_70px] px-5 py-3 bg-gray-900/50 border-b border-gray-700/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <div>Người dùng / Gói</div>
              <div>Số tiền</div>
              <div>Kênh</div>
              <div>Trạng thái</div>
              <div>Ngày tạo</div>
              <div className="text-center">Sửa</div>
            </div>
            {loadingTx ? (
              <div className="flex justify-center py-16 text-gray-400">
                <FiLoader className="animate-spin" size={24} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FiList size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Không có giao dịch nào</p>
              </div>
            ) : transactions.map(tx => (
              <div key={tx._id} className="grid grid-cols-[1fr_130px_110px_110px_90px_70px] px-5 py-3.5 hover:bg-gray-700/20 items-center border-b border-gray-700/30 last:border-0 transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {(tx.user_id?.user_name || tx.user_id?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{tx.user_id?.user_name || '—'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{tx.user_id?.email} · {tx.plan_id?.name}</p>
                  </div>
                </div>
                <div className="text-sm font-mono font-semibold text-emerald-400">{fmtMoney(tx.amount)}</div>
                <div className="text-xs text-gray-300">{GATEWAY_LABELS[tx.gateway] || tx.gateway || '—'}</div>
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_CFG[tx.status]?.cls || STATUS_CFG.pending.cls}`}>
                    {STATUS_CFG[tx.status]?.label || tx.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{fmtDate(tx.created_at)}</div>
                <div className="flex justify-center">
                  <button onClick={() => setStatusModal({ tx, newStatus: tx.status })}
                    className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition" title="Đổi trạng thái">
                    <FiEdit2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-gray-500">
                Trang {pagination.page}/{pagination.totalPages} · {pagination.total} giao dịch
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 transition">
                  <FiChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${p === pagination.page ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 transition">
                  <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Plan Modal ── */}
      {planModal !== null && (
        <PlanModal
          plan={planModal === 'new' ? null : planModal}
          onClose={() => setPlanModal(null)}
          onSave={(msg) => { setPlanModal(null); fetchPlans(); showToast(msg); }}
        />
      )}

      {/* ── Status Change Modal ── */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-bold text-white mb-1">Đổi trạng thái giao dịch</h3>
            <p className="text-xs text-gray-400 mb-4">User: {statusModal.tx.user_id?.email}</p>
            <select value={statusModal.newStatus} onChange={e => setStatusModal(p => ({ ...p, newStatus: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-gray-800 border border-gray-600 text-white rounded-xl mb-4 outline-none focus:ring-2 focus:ring-purple-500">
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setStatusModal(null)} className="flex-1 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-xl transition">Hủy</button>
              <button onClick={handleUpdateTxStatus} className="flex-1 py-2.5 text-sm bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold transition">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
