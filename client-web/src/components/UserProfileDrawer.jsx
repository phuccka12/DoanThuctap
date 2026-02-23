import React, { useState, useEffect } from 'react';
import {
  FiX, FiUser, FiCreditCard, FiActivity, FiBookOpen,
  FiShield, FiZap, FiCheckCircle, FiAlertCircle, FiTrendingUp,
  FiCalendar, FiClock, FiLoader, FiCheck, FiMic, FiEdit3
} from 'react-icons/fi';
import api from '../services/api';
import billingService from '../services/billingService';

const fmtMoney = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const STATUS_STYLES = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  failed:  'bg-red-500/20 text-red-400 border-red-500/30',
  refunded:'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled:'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
const STATUS_LABELS = { success:'Thành công', pending:'Chờ', failed:'Thất bại', refunded:'Hoàn', cancelled:'Hủy' };

// ─── Tab 1: Subscription ──────────────────────────────────────────────────────
function SubscriptionTab({ profile, plans, userId, onRefresh }) {
  const { subscription } = profile;
  const user = profile.user;
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upForm, setUpForm] = useState({ plan_id: '', months: 1, notes: '' });
  const [saving, setSaving] = useState(false);

  const handleUpgrade = async () => {
    setSaving(true);
    try {
      await api.post(`/admin/users/${userId}/upgrade`, upForm);
      setUpgradeModal(false);
      onRefresh();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Hủy gói cước của user này?')) return;
    await api.post(`/admin/users/${userId}/cancel-subscription`);
    onRefresh();
  };

  const isVIP = user.role === 'vip';
  const expired = user.vip_expire_at && new Date(user.vip_expire_at) < new Date();

  return (
    <div className="space-y-5">
      {/* Current plan card */}
      <div className={`rounded-2xl p-5 border ${isVIP && !expired ? 'bg-linear-to-br from-purple-900/40 to-pink-900/20 border-purple-500/40' : 'bg-gray-800/50 border-gray-700/50'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Gói hiện tại</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{subscription.current_plan?.icon || '🆓'}</span>
              <h3 className="text-xl font-bold text-white">{subscription.current_plan?.name || 'Free'}</h3>
              {isVIP && !expired && <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">ACTIVE</span>}
              {expired && <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 rounded-full">HẾT HẠN</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setUpgradeModal(true)}
              className="px-3 py-1.5 text-xs bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              ⬆️ Nâng cấp
            </button>
            {isVIP && (
              <button onClick={handleCancel} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">
                Hủy gói
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hết hạn', value: fmtDate(user.vip_expire_at), icon: FiCalendar },
            { label: 'Thanh toán gần nhất', value: fmtMoney(subscription.latest_tx?.amount), icon: FiCreditCard },
            { label: 'Kênh thanh toán', value: subscription.latest_tx?.gateway || '—', icon: FiCheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-gray-900/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1"><Icon size={10} /> {label}</div>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quota display */}
      {subscription.current_plan?.quota && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Giới hạn AI theo gói</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Speaking checks/ngày', subscription.current_plan.quota.speaking_checks_per_day],
              ['Writing checks/ngày', subscription.current_plan.quota.writing_checks_per_day],
              ['AI Chat/ngày', subscription.current_plan.quota.ai_chat_messages_per_day],
              ['AI Roleplay/ngày', subscription.current_plan.quota.ai_roleplay_sessions_per_day],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center px-3 py-2 bg-gray-900/40 rounded-lg">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={`text-sm font-mono font-bold ${val === -1 ? 'text-green-400' : 'text-white'}`}>
                  {val === -1 ? '∞' : val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FiTrendingUp size={16} /> Nâng cấp gói cước</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Chọn gói</label>
                <select value={upForm.plan_id} onChange={e => setUpForm(p => ({ ...p, plan_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-white rounded-xl outline-none">
                  <option value="">— Chọn gói —</option>
                  {plans.map(p => <option key={p._id} value={p._id}>{p.icon} {p.name} - {fmtMoney(p.price_monthly)}/tháng</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Số tháng</label>
                <input type="number" min={1} max={24} value={upForm.months} onChange={e => setUpForm(p => ({ ...p, months: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-white rounded-xl outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ghi chú (lý do nâng cấp)</label>
                <input value={upForm.notes} onChange={e => setUpForm(p => ({ ...p, notes: e.target.value }))} placeholder="VD: Chuyển khoản xác nhận..."
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-xl outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setUpgradeModal(false)} className="flex-1 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-xl">Hủy</button>
              <button onClick={handleUpgrade} disabled={saving || !upForm.plan_id}
                className="flex-1 py-2 text-sm bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: AI Usage ──────────────────────────────────────────────────────────
function AIUsageTab({ profile, userId, onRefresh }) {
  const { ai_usage } = profile;
  const [blocking, setBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);

  const handleToggleBlock = async (block) => {
    setBlocking(true);
    try {
      await api.patch(`/admin/users/${userId}/ai-block`, { block, reason: blockReason });
      setShowBlockForm(false);
      setBlockReason('');
      onRefresh();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setBlocking(false); }
  };

  const isBlocked = ai_usage?.is_blocked;
  const today = ai_usage?.today || {};
  const weekly = ai_usage?.weekly || [];

  // Chart-like bar
  const maxVal = Math.max(...weekly.map(d => d.speaking_checks + d.writing_checks + d.ai_chat_messages), 1);

  return (
    <div className="space-y-5">
      {/* Block status + actions */}
      <div className={`rounded-2xl p-5 border flex items-center justify-between ${isBlocked ? 'bg-red-900/20 border-red-500/40' : 'bg-gray-800/50 border-gray-700/50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBlocked ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            {isBlocked ? <FiAlertCircle size={18} className="text-red-400" /> : <FiCheckCircle size={18} className="text-green-400" />}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{isBlocked ? '🚫 Tính năng AI đang bị khóa' : '✅ Tính năng AI hoạt động bình thường'}</p>
            {isBlocked && ai_usage.blocked_record && (
              <p className="text-xs text-red-400/70 mt-0.5">Lý do: {ai_usage.blocked_record.blocked_reason || 'Không có lý do'}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isBlocked ? (
            <button onClick={() => handleToggleBlock(false)} disabled={blocking}
              className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors">
              {blocking ? '...' : '🔓 Mở khóa'}
            </button>
          ) : (
            <button onClick={() => setShowBlockForm(true)} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">
              🔒 Khóa AI
            </button>
          )}
        </div>
      </div>

      {showBlockForm && (
        <div className="bg-gray-800/50 border border-red-500/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-red-400">Lý do khóa AI (sẽ lưu vào lịch sử)</p>
          <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="VD: Spam AI liên tục, vi phạm điều khoản..."
            className="w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl outline-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowBlockForm(false)} className="flex-1 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg">Hủy</button>
            <button onClick={() => handleToggleBlock(true)} disabled={blocking}
              className="flex-1 py-2 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 font-medium">
              {blocking ? '...' : 'Xác nhận khóa'}
            </button>
          </div>
        </div>
      )}

      {/* Today stats */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hôm nay</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Speaking checks', value: today.speaking_checks, icon: FiMic, color: 'purple' },
            { label: 'Writing checks', value: today.writing_checks, icon: FiEdit3, color: 'blue' },
            { label: 'AI Chat', value: today.ai_chat_messages, icon: FiZap, color: 'orange' },
            { label: 'AI Roleplay', value: today.ai_roleplay_sessions, icon: FiActivity, color: 'pink' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`bg-${color}-900/20 border border-${color}-500/20 rounded-xl p-4 flex items-center gap-3`}>
              <Icon size={18} className={`text-${color}-400 shrink-0`} />
              <div>
                <div className={`text-2xl font-bold text-${color}-400`}>{value || 0}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Hoạt động 7 ngày qua</p>
        <div className="flex items-end gap-2 h-24">
          {weekly.map((day, i) => {
            const total = day.speaking_checks + day.writing_checks + day.ai_chat_messages;
            const height = maxVal > 0 ? (total / maxVal) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500">{total > 0 ? total : ''}</span>
                <div className="w-full rounded-t-sm bg-purple-500/30 hover:bg-purple-500/50 transition-colors" style={{ height: `${Math.max(height, 4)}%` }} title={`${total} lần`} />
                <span className="text-[9px] text-gray-500">{day.date?.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Learning Progress ─────────────────────────────────────────────────
function LearningTab({ profile }) {
  const { learning } = profile;
  const g = learning.gamification || {};
  const prefs = learning.preferences || {};

  return (
    <div className="space-y-5">
      {/* Gamification */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gamification</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Level', value: g.level ?? 1,   icon: '⭐', color: 'yellow' },
            { label: 'Gold',  value: g.gold  ?? 0,   icon: '🪙', color: 'yellow' },
            { label: 'EXP',   value: g.exp   ?? 0,   icon: '✨', color: 'blue'   },
            { label: 'Streak',value: g.streak ?? 0,  icon: '🔥', color: 'orange' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-${color}-900/20 border border-${color}-500/20 rounded-xl p-3 text-center`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-xl font-bold text-${color}-400`}>{value}</div>
              <div className="text-[10px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning preferences */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mục tiêu học tập</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['Mục tiêu', prefs.goal],
            ['Band mục tiêu', prefs.target_band],
            ['Trình độ hiện tại', prefs.current_level],
            ['Giờ học/tuần', prefs.study_hours_per_week ? `${prefs.study_hours_per_week}h` : null],
            ['Ngày thi', prefs.exam_date ? fmtDate(prefs.exam_date) : null],
            ['Kỹ năng tập trung', prefs.focus_skills?.join(', ')],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center px-3 py-2 bg-gray-900/40 rounded-lg">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-medium text-white">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lịch sử thanh toán</p>
        {learning.transactions?.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào</p>
        ) : (
          <div className="space-y-2">
            {learning.transactions?.map(tx => (
              <div key={tx._id} className="flex items-center gap-3 px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl">
                <span className="text-lg">{tx.plan_id?.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{tx.plan_id?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{fmtDate(tx.created_at)} · {tx.gateway}</p>
                </div>
                <span className="text-sm font-mono text-green-400">{fmtMoney(tx.amount)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[tx.status] || ''}`}>
                  {STATUS_LABELS[tx.status] || tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function UserProfileDrawer({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscription');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [pRes, plRes] = await Promise.all([
        api.get(`/admin/users/${userId}/profile`),
        billingService.getPlans(),
      ]);
      setProfile(pRes.data?.data);
      setPlans(plRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (userId) fetchProfile(); }, [userId]);

  const tabs = [
    { id: 'subscription', label: 'Gói cước', icon: FiCreditCard },
    { id: 'ai_usage',     label: 'Hao tổn AI', icon: FiActivity },
    { id: 'learning',     label: 'Học tập', icon: FiBookOpen },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-end z-50">
      <div className="w-full max-w-lg h-full bg-gray-900 border-l border-gray-700/50 flex flex-col shadow-2xl">
        {/* Header */}
        {profile && (
          <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-700/50 bg-linear-to-r from-purple-900/30 to-gray-900 shrink-0">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold text-white shrink-0">
              {profile.user?.avatar
                ? <img src={profile.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                : (profile.user?.user_name?.[0] || '?').toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{profile.user?.user_name}</h2>
              <p className="text-xs text-gray-400 truncate">{profile.user?.email}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors shrink-0">
              <FiX size={18} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-700/50 shrink-0 bg-gray-900">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <FiLoader className="animate-spin mr-2" size={20} /> Đang tải...
            </div>
          ) : !profile ? (
            <div className="text-center py-16 text-gray-500">Không thể tải profile</div>
          ) : (
            <>
              {activeTab === 'subscription' && <SubscriptionTab profile={profile} plans={plans} userId={userId} onRefresh={fetchProfile} />}
              {activeTab === 'ai_usage'     && <AIUsageTab profile={profile} userId={userId} onRefresh={fetchProfile} />}
              {activeTab === 'learning'     && <LearningTab profile={profile} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
