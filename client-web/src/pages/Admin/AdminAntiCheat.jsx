import { useState, useEffect, useRef } from 'react';
import {
  FiShield, FiSearch, FiFilter, FiAlertTriangle, FiRefreshCw,
  FiUser, FiX, FiEdit3, FiRotateCcw, FiCheckCircle,
} from 'react-icons/fi';
import {
  getCoinLogs, getSuspiciousUsers, getAntiCheatUserDetail,
  adjustCoins, resetPetAdmin,
} from '../../services/adminService';

/* ─────────────────────────── helpers ─────────────────────────── */
const LOG_TYPES = [
  { value: '',      label: 'Tất cả loại' },
  { value: 'earn',  label: '🟢 Earn' },
  { value: 'spend', label: '🔴 Spend' },
  { value: 'admin', label: '🟡 Admin' },
];

const TYPE_BADGE = {
  earn:  'bg-green-500/15 text-green-400 border-green-500/30',
  spend: 'bg-red-500/15   text-red-400   border-red-500/30',
  admin: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
};

function TypeBadge({ type }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_BADGE[type] || 'bg-gray-700 text-gray-400'}`}>
      {type}
    </span>
  );
}

function Avatar({ user }) {
  if (!user) return <div className="w-7 h-7 rounded-full bg-gray-700" />;
  return (
    <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {user.name?.[0] || user.email?.[0] || '?'}
    </div>
  );
}

const TABS = ['📋 Nhật ký Coins', '⚠️ Nghi ngờ gian lận', '🔍 Chi tiết User'];

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminAntiCheat() {
  const [tab, setTab] = useState(0);

  /* ── TAB 0: Coin Logs ── */
  const [logs, setLogs]           = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage]   = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({ type: '', source: '', userId: '', startDate: '', endDate: '' });

  const fetchLogs = async (pg = logsPage) => {
    setLogsLoading(true);
    try {
      const params = { page: pg, limit: 20, ...logFilters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await getCoinLogs(params);
      // backend trả { success, data: logs[], total }
      setLogs(res.data.data || res.data.logs || []);
      setLogsTotal(res.data.total || 0);
    } catch { /* ignore */ }
    setLogsLoading(false);
  };

  useEffect(() => { if (tab === 0) fetchLogs(logsPage); }, [tab, logsPage]);

  /* ── TAB 1: Suspicious ── */
  const [suspicious, setSuspicious]   = useState([]);
  const [suspLoading, setSuspLoading] = useState(false);

  const fetchSuspicious = async () => {
    setSuspLoading(true);
    try {
      const res = await getSuspiciousUsers();
      // backend trả { success, data: [...] }
      setSuspicious(res.data.data || res.data.users || []);
    } catch { /* ignore */ }
    setSuspLoading(false);
  };

  useEffect(() => { if (tab === 1) fetchSuspicious(); }, [tab]);

  /* ── TAB 2: User Detail ── */
  const [detailUserId, setDetailUserId] = useState('');
  const [detailInput, setDetailInput]   = useState('');
  const [detail, setDetail]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adjustForm, setAdjustForm]     = useState({ amount: 0, reason: '' });
  const [adjusting, setAdjusting]       = useState(false);
  const [resetPetId, setResetPetId]     = useState(null);
  const [toast, setToast]               = useState(null);

  const fetchDetail = async (uid) => {
    if (!uid.trim()) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await getAntiCheatUserDetail(uid.trim());
      // backend trả { success, data: { user, pet, stats, logs } }
      setDetail(res.data.data ?? res.data);
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.message || 'Không tìm thấy user' });
    }
    setDetailLoading(false);
  };

  const handleAdjust = async () => {
    if (!detail?.user?._id) return;
    setAdjusting(true);
    try {
      await adjustCoins(detail.user._id, adjustForm.amount, adjustForm.reason);
      setToast({ type: 'success', msg: `Đã điều chỉnh ${adjustForm.amount > 0 ? '+' : ''}${adjustForm.amount} coins!` });
      fetchDetail(detail.user._id);
      setAdjustForm({ amount: 0, reason: '' });
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.message || 'Lỗi điều chỉnh coins' });
    }
    setAdjusting(false);
    setTimeout(() => setToast(null), 3500);
  };

  const handleResetPet = async () => {
    if (!resetPetId) return;
    try {
      await resetPetAdmin(resetPetId);
      setToast({ type: 'success', msg: 'Đã reset pet!' });
      if (detail?.user?._id) fetchDetail(detail.user._id);
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.message || 'Lỗi reset pet' });
    }
    setResetPetId(null);
    setTimeout(() => setToast(null), 3500);
  };

  /* ─── render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-linear-to-br from-red-500 to-rose-600">
          <FiShield className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Anti-Cheat &amp; Giám sát</h1>
          <p className="text-gray-400 text-sm">Nhật ký Coins · Nghi ngờ gian lận · Điều chỉnh thủ công</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <FiCheckCircle className="shrink-0" /> : <FiAlertTriangle className="shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all
              ${tab === i ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Logs ── */}
      {tab === 0 && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
              <FiFilter className="text-gray-500 text-sm" />
              <select value={logFilters.type} onChange={e => setLogFilters(f => ({ ...f, type: e.target.value }))}
                className="bg-transparent text-white text-sm outline-none">
                {LOG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 flex-1 min-w-36">
              <FiSearch className="text-gray-500 text-sm" />
              <input value={logFilters.userId} onChange={e => setLogFilters(f => ({ ...f, userId: e.target.value }))}
                placeholder="User ID…" className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-600" />
            </div>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 flex-1 min-w-36">
              <input value={logFilters.source} onChange={e => setLogFilters(f => ({ ...f, source: e.target.value }))}
                placeholder="Source (vocab, writing…)" className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-600" />
            </div>
            <input type="date" value={logFilters.startDate} onChange={e => setLogFilters(f => ({ ...f, startDate: e.target.value }))}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-400 text-sm outline-none" />
            <input type="date" value={logFilters.endDate} onChange={e => setLogFilters(f => ({ ...f, endDate: e.target.value }))}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-400 text-sm outline-none" />
            <button onClick={() => fetchLogs(1)}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2">
              <FiRefreshCw className={logsLoading ? 'animate-spin' : ''} /> Lọc
            </button>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Loại</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-right px-4 py-3">Số lượng</th>
                    <th className="text-right px-4 py-3">Số dư sau</th>
                    <th className="text-left px-4 py-3">Ghi chú</th>
                    <th className="text-right px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-gray-600 py-10">Không có logs</td></tr>
                  ) : logs.map(log => (
                    <tr key={log._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar user={log.user} />
                          <div className="min-w-0">
                            <p className="text-white text-xs font-semibold truncate max-w-28">{log.user?.name || 'N/A'}</p>
                            <p className="text-gray-600 text-xs truncate max-w-28">{log.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={log.type} /></td>
                      <td className="px-4 py-3"><code className="text-gray-400 text-xs">{log.source}</code></td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${log.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {log.amount > 0 ? '+' : ''}{log.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-400 font-semibold text-xs">🪙 {log.balance_after}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{log.note || '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.created_at || log.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {logsTotal > 20 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">{logsTotal} logs tổng cộng</p>
              <div className="flex gap-2">
                {Array.from({ length: Math.min(Math.ceil(logsTotal / 20), 10) }).map((_, i) => (
                  <button key={i} onClick={() => { setLogsPage(i + 1); fetchLogs(i + 1); }}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                      ${logsPage === i + 1 ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: Suspicious ── */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Người dùng có Coins kiếm bất thường (vượt giới hạn ngày)</p>
            <button onClick={fetchSuspicious}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white text-sm transition-colors">
              <FiRefreshCw className={suspLoading ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          {suspLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-16 animate-pulse" />
              ))}
            </div>
          ) : suspicious.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-600">
              <FiShield className="text-5xl mb-3 text-green-500/30" />
              <p className="text-green-400 font-semibold">Không phát hiện hành vi bất thường</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-right px-4 py-3">Tổng earn hôm nay</th>
                    <th className="text-right px-4 py-3">Số giao dịch</th>
                    <th className="text-left px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {suspicious.map(u => (
                    <tr key={u._id || u.userId} className="border-b border-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar user={u} />
                          <div>
                            <p className="text-white text-xs font-semibold">{u.name || u.email || u._id}</p>
                            <p className="text-gray-600 text-xs">{u.email || u._id || u.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-red-400 font-bold">🪙 {u.totalEarned || u.total_earned}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{u.txCount || u.count}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setTab(2); setDetailInput(u._id || u.userId || u.email); fetchDetail(u._id || u.userId); }}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                          <FiSearch /> Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: User Detail ── */}
      {tab === 2 && (
        <div className="space-y-5">
          {/* Search */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 flex-1">
              <FiSearch className="text-gray-500" />
              <input value={detailInput} onChange={e => setDetailInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setDetailUserId(detailInput); fetchDetail(detailInput); } }}
                placeholder="Nhập User ID hoặc email…"
                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-600" />
            </div>
            <button onClick={() => { setDetailUserId(detailInput); fetchDetail(detailInput); }} disabled={detailLoading}
              className="px-5 py-2 rounded-xl bg-linear-to-r from-red-500 to-rose-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {detailLoading ? 'Đang tìm…' : 'Tìm kiếm'}
            </button>
          </div>

          {detail && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: User + Pet card */}
              <div className="space-y-4">
                {/* User card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar user={detail.user} />
                    <div>
                      <p className="text-white font-bold">{detail.user?.name}</p>
                      <p className="text-gray-500 text-xs">{detail.user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Coins</span><span className="text-yellow-400 font-bold">🪙 {detail.pet?.coins ?? 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Earn hôm nay</span><span className="text-green-400">{detail.todayEarn ?? 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Spend hôm nay</span><span className="text-red-400">{detail.todaySpend ?? 0}</span></div>
                  </div>
                </div>

                {/* Pet card */}
                {detail.pet && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold text-sm">🐾 Thú cưng</p>
                      <button onClick={() => setResetPetId(detail.pet._id)}
                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20 transition-colors">
                        <FiRotateCcw /> Reset
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Cấp</span><span className="text-white">{detail.pet.level}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Growth EXP</span><span className="text-purple-400">{detail.pet.growthPoints}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Hunger</span>
                        <span className={detail.pet.hunger > 70 ? 'text-red-400' : detail.pet.hunger > 40 ? 'text-yellow-400' : 'text-green-400'}>
                          {detail.pet.hunger}/100
                        </span>
                      </div>
                      <div className="flex justify-between"><span className="text-gray-500">Streak</span><span className="text-orange-400">{detail.pet.streakCount} ngày</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Loài</span><span className="text-gray-300">{detail.pet.petType}</span></div>
                    </div>
                  </div>
                )}

                {/* Manual adjust */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-white font-bold text-sm mb-3 flex items-center gap-2"><FiEdit3 /> Điều chỉnh Coins thủ công</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Số coins (âm = trừ)</label>
                      <input type="number" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: +e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-red-500 transition-colors" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Lý do *</label>
                      <input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                        placeholder="VD: Sửa lỗi bug, giải thưởng…"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-red-500 placeholder-gray-600 transition-colors" />
                    </div>
                    <button onClick={handleAdjust} disabled={adjusting || !adjustForm.reason.trim()}
                      className="w-full py-2 rounded-xl bg-linear-to-r from-red-500 to-rose-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                      {adjusting ? 'Đang xử lý…' : 'Áp dụng'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Last 100 logs */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800">
                    <p className="text-white font-bold text-sm">100 giao dịch gần nhất</p>
                  </div>
                  <div className="overflow-y-auto max-h-150">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-900">
                        <tr className="border-b border-gray-800 text-gray-500">
                          <th className="text-left px-4 py-2.5">Loại</th>
                          <th className="text-left px-4 py-2.5">Source</th>
                          <th className="text-right px-4 py-2.5">Coins</th>
                          <th className="text-right px-4 py-2.5">Số dư sau</th>
                          <th className="text-left px-4 py-2.5">Ghi chú</th>
                          <th className="text-right px-4 py-2.5">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.recentLogs || []).length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-gray-600 py-8">Chưa có giao dịch</td></tr>
                        ) : (detail.recentLogs || []).map(log => (
                          <tr key={log._id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-2"><TypeBadge type={log.type} /></td>
                            <td className="px-4 py-2"><code className="text-gray-400">{log.source}</code></td>
                            <td className="px-4 py-2 text-right">
                              <span className={log.amount >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {log.amount > 0 ? '+' : ''}{log.amount}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-yellow-400">🪙 {log.balance_after}</td>
                            <td className="px-4 py-2 text-gray-500 max-w-28 truncate">{log.note || '—'}</td>
                            <td className="px-4 py-2 text-right text-gray-600 whitespace-nowrap">
                              {new Date(log.created_at || log.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Reset Pet Confirm ─── */}
      {resetPetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
              <FiRotateCcw className="text-orange-400 text-2xl" />
            </div>
            <p className="text-white font-semibold">Reset pet này?</p>
            <p className="text-gray-500 text-sm">Level, EXP, inventory và streak sẽ về mặc định. Không thể hoàn tác.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setResetPetId(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white bg-gray-800 text-sm transition-colors">Hủy</button>
              <button onClick={handleResetPet} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
