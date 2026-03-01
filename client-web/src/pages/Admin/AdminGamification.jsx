import React, { useState, useEffect, useCallback } from 'react';
import {
  FiRefreshCw, FiLoader, FiSearch, FiEdit2, FiGift,
  FiTrash2, FiStar, FiTrendingUp, FiUsers, FiZap,
  FiAward, FiHeart, FiDollarSign, FiAlertTriangle,
  FiChevronLeft, FiChevronRight, FiX, FiCheck,
} from 'react-icons/fi';
import adminService, {
  getPetStats,
  getAllPets,
  updatePet,
  grantPetCoins,
  deletePet,
} from '../../services/adminService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : (n ?? '—'));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const PET_EMOJI = { cat: '🐱', dog: '🐶', dragon: '🐲', bird: '🐦' };
const PET_LABEL = { cat: 'Mèo', dog: 'Chó', dragon: 'Rồng', bird: 'Chim' };
const PET_COLOR = { cat: '#a78bfa', dog: '#60a5fa', dragon: '#f97316', bird: '#34d399' };

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-5 overflow-hidden hover:border-gray-700 transition-colors">
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-15"
        style={{ backgroundColor: accent }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}20`, color: accent }}>
            <Icon size={17} />
          </div>
          <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-3xl font-black text-white tabular-nums">{value}</div>
        {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Pet Type Badge ───────────────────────────────────────────────────────────
function PetBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: `${PET_COLOR[type] || '#6b7280'}20`, color: PET_COLOR[type] || '#9ca3af' }}>
      {PET_EMOJI[type] || '🐾'} {PET_LABEL[type] || type}
    </span>
  );
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-white font-bold">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ pet, onClose, onSave }) {
  const [form, setForm] = useState({
    level:        pet.level ?? 1,
    growthPoints: pet.growthPoints ?? 0,
    coins:        pet.coins ?? 0,
    hunger:       pet.hunger ?? 0,
    happiness:    pet.happiness ?? 80,
    streakCount:  pet.streakCount ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(pet._id, form); onClose(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Chỉnh sửa thú cưng</h3>
            <p className="text-xs text-gray-500 mt-0.5">{pet.user?.user_name || pet.user?.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 text-gray-500 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'level',        label: '⭐ Level',        min: 1, max: 99 },
            { key: 'growthPoints', label: '📈 Growth Points', min: 0, max: 99999 },
            { key: 'coins',        label: '🪙 Coins',         min: 0, max: 99999 },
            { key: 'streakCount',  label: '🔥 Streak',        min: 0, max: 999 },
            { key: 'hunger',       label: '🍽️ Hunger (0=full)', min: 0, max: 100 },
            { key: 'happiness',    label: '😊 Happiness',    min: 0, max: 100 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                type="number" min={min} max={max}
                value={form[key]}
                onChange={(e) => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors">
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grant Coins Modal ────────────────────────────────────────────────────────
function GrantCoinsModal({ pet, onClose, onGrant }) {
  const [amount, setAmount] = useState(100);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try { await onGrant(pet._id, amount); onClose(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🪙 Tặng Coins
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 text-gray-500 transition-colors">
            <FiX size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Tặng coins cho thú cưng của <span className="text-white font-semibold">{pet.user?.user_name || pet.user?.email}</span>
        </p>
        <div className="flex gap-2 mb-4">
          {[50, 100, 500, 1000].map(v => (
            <button key={v} onClick={() => setAmount(v)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                amount === v ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {v}
            </button>
          ))}
        </div>
        <input type="number" min={1} value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors mb-4"
          placeholder="Nhập số coins..."
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium">
            Huỷ
          </button>
          <button onClick={handle} disabled={saving || amount <= 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <FiLoader className="animate-spin" size={14} /> : '🪙'}
            Tặng {fmt(amount)} coins
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminGamification() {
  const [tab, setTab] = useState('overview'); // 'overview' | 'pets'
  const [stats, setStats]     = useState(null);
  const [pets, setPets]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [page, setPage]         = useState(1);

  // Modals
  const [editTarget, setEditTarget]   = useState(null);
  const [grantTarget, setGrantTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await getPetStats();
      setStats(res.data.data);
    } catch (e) { console.error(e); }
  }, []);

  const loadPets = useCallback(async () => {
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterType) params.petType = filterType;
      if (filterLevel) params.minLevel = filterLevel;
      const res = await getAllPets(params);
      setPets(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (e) { console.error(e); }
  }, [page, search, filterType, filterLevel]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadPets()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { if (!loading) loadPets(); }, [page, filterType, filterLevel]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadPets();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadPets()]);
    setRefreshing(false);
  };

  const handleUpdate = async (id, data) => {
    await updatePet(id, data);
    await loadPets();
    await loadStats();
  };

  const handleGrant = async (id, amount) => {
    await grantPetCoins(id, amount);
    await loadPets();
  };

  const handleDelete = async (id) => {
    await deletePet(id);
    setDeleteTarget(null);
    await loadPets();
    await loadStats();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <FiLoader className="animate-spin text-purple-400" size={32} />
      <span className="text-gray-500 text-sm">Đang tải dữ liệu Gamification...</span>
    </div>
  );

  const byType = stats?.byType || {};
  const totalPets = stats?.totalPets || 0;

  return (
    <div className="space-y-8 pb-12 text-gray-100">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            🐾 <span>Gamification Hub</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý hệ thống nuôi thú cưng · Streak · Coins · Level
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2.5">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-40">
            <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="font-medium">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 w-fit">
        {[
          { id: 'overview', label: '📊 Tổng quan' },
          { id: 'pets',     label: '🐾 Danh sách thú' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW TAB ════════ */}
      {tab === 'overview' && stats && (
        <div className="space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={FiUsers}      label="Tổng thú cưng"   value={fmt(totalPets)}                           accent="#a78bfa" sub="Tất cả user có pet" />
            <StatCard icon={FiStar}       label="Level trung bình" value={stats.avgLevel ?? '—'}                  accent="#f59e0b" sub="Avg level toàn server" />
            <StatCard icon={FiZap}        label="Active 7 ngày"   value={fmt(stats.recentActive7d)}               accent="#22d3ee" sub="Check-in trong 7 ngày" />
            <StatCard icon={FiTrendingUp} label="Tỉ lệ active"    value={totalPets > 0 ? `${Math.round(stats.recentActive7d / totalPets * 100)}%` : '—'} accent="#10b981" sub="Check-in / Tổng" />
          </div>

          {/* Pet Type Distribution */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                🐾 Phân bổ loại thú cưng
              </h3>
              <div className="space-y-4">
                {['cat', 'dog', 'dragon', 'bird'].map(type => (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${PET_COLOR[type]}15` }}>
                      {PET_EMOJI[type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: PET_COLOR[type] }}>{PET_LABEL[type]}</span>
                        <span className="text-sm font-bold text-white">{fmt(byType[type] || 0)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${totalPets > 0 ? Math.round((byType[type] || 0) / totalPets * 100) : 0}%`,
                            backgroundColor: PET_COLOR[type],
                          }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 w-10 text-right">
                      {totalPets > 0 ? Math.round((byType[type] || 0) / totalPets * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Distribution */}
            <div className="col-span-12 lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                ⭐ Phân bổ Level
              </h3>
              {stats.levelDistribution?.length > 0 ? (
                <div className="flex items-end gap-2 h-36">
                  {stats.levelDistribution.map((bucket, i) => {
                    const maxCount = Math.max(...stats.levelDistribution.map(b => b.count), 1);
                    const h = Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 5 : 0);
                    const colors = ['#6366f1','#a78bfa','#c4b5fd','#f59e0b','#fbbf24','#f97316','#ef4444','#ec4899','#22d3ee','#10b981'];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full" style={{ height: `${h}%`, minHeight: bucket.count > 0 ? 4 : 0 }}>
                          {bucket.count > 0 && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-950 border border-gray-700 px-2 py-1 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {bucket.count} pets
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-t group-hover:brightness-125 transition-all"
                            style={{ backgroundColor: colors[i % colors.length] }} />
                        </div>
                        <span className="text-[9px] text-gray-600">
                          {bucket._id === '10+' ? '10+' : `L${bucket._id}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-36 text-gray-600 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Top Leaderboards */}
          <div className="grid grid-cols-12 gap-5">

            {/* Top Level */}
            <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <FiAward className="text-amber-400" size={16} /> Top 10 Level cao nhất
              </h3>
              <div className="space-y-2">
                {stats.topLevel?.length > 0 ? stats.topLevel.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/50 transition-colors">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{p.user?.user_name || p.user?.email || '—'}</div>
                      <div className="text-[11px] text-gray-600">{PET_EMOJI[p.petType]} {PET_LABEL[p.petType] || p.petType}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-amber-400">⭐ {p.level}</div>
                      <div className="text-[10px] text-gray-600">{fmt(p.growthPoints)} GP</div>
                    </div>
                  </div>
                )) : <div className="text-gray-600 text-sm py-4 text-center">Chưa có dữ liệu</div>}
              </div>
            </div>

            {/* Top Coins */}
            <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <FiDollarSign className="text-yellow-400" size={16} /> Top 10 Coins nhiều nhất
              </h3>
              <div className="space-y-2">
                {stats.topCoins?.length > 0 ? stats.topCoins.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/50 transition-colors">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-yellow-700 text-white' : 'bg-gray-800 text-gray-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{p.user?.user_name || p.user?.email || '—'}</div>
                      <div className="text-[11px] text-gray-600">{PET_EMOJI[p.petType]} {PET_LABEL[p.petType] || p.petType} · Streak {p.streakCount} 🔥</div>
                    </div>
                    <div className="text-sm font-black text-yellow-400 shrink-0">
                      🪙 {fmt(p.coins)}
                    </div>
                  </div>
                )) : <div className="text-gray-600 text-sm py-4 text-center">Chưa có dữ liệu</div>}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════ PETS LIST TAB ════════ */}
      {tab === 'pets' && (
        <div className="space-y-5">

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-70">
              <div className="relative flex-1">
                <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên / email user..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <button type="submit"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Tìm
              </button>
            </form>

            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors">
              <option value="">Tất cả loại</option>
              {['cat','dog','dragon','bird'].map(t => (
                <option key={t} value={t} className="bg-gray-900">{PET_EMOJI[t]} {PET_LABEL[t]}</option>
              ))}
            </select>

            <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors">
              <option value="">Tất cả level</option>
              {[2,3,5,10].map(l => (
                <option key={l} value={l} className="bg-gray-900">Level ≥ {l}</option>
              ))}
            </select>

            <span className="text-xs text-gray-600 ml-auto">
              {fmt(pagination.total)} thú cưng
            </span>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Chủ sở hữu','Loại','Level','GP','Coins','Streak','Hunger','Happiness','Check-in','Thao tác'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {pets.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-600">Không có dữ liệu</td></tr>
                  ) : pets.map((pet) => (
                    <tr key={pet._id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{pet.user?.user_name || '—'}</div>
                        <div className="text-xs text-gray-600 truncate max-w-40">{pet.user?.email}</div>
                      </td>
                      <td className="px-4 py-3"><PetBadge type={pet.petType} /></td>
                      <td className="px-4 py-3">
                        <span className="font-black text-amber-400 text-base">⭐ {pet.level}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 tabular-nums">{fmt(pet.growthPoints)}</td>
                      <td className="px-4 py-3">
                        <span className="text-yellow-400 font-bold">🪙 {fmt(pet.coins)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${pet.streakCount >= 7 ? 'text-orange-400' : pet.streakCount >= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                          🔥 {pet.streakCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${pet.hunger}%`, backgroundColor: pet.hunger > 70 ? '#ef4444' : pet.hunger > 40 ? '#f59e0b' : '#10b981' }} />
                          </div>
                          <span className={`text-xs font-bold ${pet.hunger > 70 ? 'text-red-400' : 'text-gray-400'}`}>{pet.hunger}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${pet.happiness}%`, backgroundColor: pet.happiness > 60 ? '#10b981' : pet.happiness > 30 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className={`text-xs font-bold ${pet.happiness < 30 ? 'text-red-400' : 'text-gray-400'}`}>{pet.happiness}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(pet.lastCheckinAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditTarget(pet)} title="Chỉnh sửa"
                            className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => setGrantTarget(pet)} title="Tặng coins"
                            className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors">
                            <FiGift size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(pet)} title="Xoá"
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <span className="text-xs text-gray-600">
                  Trang {pagination.page} / {pagination.pages} · {fmt(pagination.total)} thú
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 disabled:opacity-30 transition-colors">
                    <FiChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const p = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                          p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-800 text-gray-500'
                        }`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 disabled:opacity-30 transition-colors">
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {editTarget && (
        <EditModal pet={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdate} />
      )}
      {grantTarget && (
        <GrantCoinsModal pet={grantTarget} onClose={() => setGrantTarget(null)} onGrant={handleGrant} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <FiAlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Xoá thú cưng?</h3>
                <p className="text-xs text-gray-500">{deleteTarget.user?.user_name || deleteTarget.user?.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu thú cưng, coins, streak sẽ bị xoá vĩnh viễn.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium">
                Huỷ
              </button>
              <button onClick={() => handleDelete(deleteTarget._id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors">
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
