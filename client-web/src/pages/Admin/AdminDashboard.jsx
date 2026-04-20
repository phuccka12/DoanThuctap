import React, { useState, useEffect } from 'react';
import {
  FiBook, FiEdit3, FiUsers, FiMic, FiBookOpen,
  FiLoader, FiVolume2, FiTrendingUp, FiTrendingDown,
  FiZap, FiAlertTriangle, FiAlertCircle, FiCheckCircle,
  FiRefreshCw, FiShield, FiAward, FiFlag
} from 'react-icons/fi';
import { FaGraduationCap, FaCrown } from 'react-icons/fa';
import adminService from '../../services/adminService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : n ?? '—');

// ─── Mini Donut ───────────────────────────────────────────────────────────────
function MiniDonut({ percent, color, size = 56 }) {
  const r = 14, cx = 18, cy = 18;
  const circ = 2 * Math.PI * r;
  const dash = ((percent || 0) / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox="0 0 36 36">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="4" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
        {percent}%
      </div>
    </div>
  );
}

// ─── Multi Line Trend Chart (nhấp nhô) ────────────────────────────────────────
function BarChart({ data, seriesKeys, colors, labels, height = 200 }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const CHART_W = 1200;
  const CHART_H = 260;
  const PAD = { top: 16, right: 18, bottom: 26, left: 24 };
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const rawMax = Math.max(1, ...data.flatMap((d) => seriesKeys.map((k) => Number(d[k] || 0))));
  const base = rawMax <= 10 ? 1 : 10 ** Math.floor(Math.log10(rawMax));
  const yMax = Math.max(5, Math.ceil((rawMax * 1.15) / base) * base);

  const xAt = (idx) =>
    PAD.left + (data.length <= 1 ? innerW / 2 : (idx / (data.length - 1)) * innerW);
  const yAt = (val) => PAD.top + (1 - (Number(val || 0) / yMax)) * innerH;

  const pointsFor = (key) => data.map((item, idx) => ({
    x: xAt(idx),
    y: yAt(item[key]),
    v: Number(item[key] || 0),
    month: item.month,
  }));

  const smoothPath = (pts) => {
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const n = pts[i + 1];
      const cx = (p.x + n.x) / 2;
      d += ` C ${cx} ${p.y}, ${cx} ${n.y}, ${n.x} ${n.y}`;
    }
    return d;
  };

  const monthStep = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const activeMonth = activeIdx !== null ? data[activeIdx] : null;
  const activeX = activeIdx !== null ? xAt(activeIdx) : null;

  return (
    <div className="space-y-2" style={{ height }}>
      <div className="relative w-full" style={{ height: Math.max(height - 26, 130) }}>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-full overflow-visible">
          <defs>
            {colors.map((c, i) => (
              <linearGradient key={i} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity="0.25" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
            const y = PAD.top + t * innerH;
            const tickVal = Math.round(yMax * (1 - t));
            return (
              <g key={idx}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={CHART_W - PAD.right}
                  y2={y}
                  stroke="rgba(75,85,99,0.35)"
                  strokeWidth="1"
                  strokeDasharray="6 7"
                />
                <text x={4} y={y + 3} fontSize="10" fill="rgba(148,163,184,0.65)">
                  {tickVal}
                </text>
              </g>
            );
          })}

          {seriesKeys.map((k, ki) => {
            const pts = pointsFor(k);
            const line = smoothPath(pts);
            const area = `${line} L ${pts[pts.length - 1]?.x ?? PAD.left} ${PAD.top + innerH} L ${pts[0]?.x ?? PAD.left} ${PAD.top + innerH} Z`;
            return (
              <g key={k}>
                <path d={area} fill={`url(#area-${ki})`} />
                <path
                  d={line}
                  fill="none"
                  stroke={colors[ki]}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {activeIdx !== null && pts[activeIdx] && (
                  <circle cx={pts[activeIdx].x} cy={pts[activeIdx].y} r="4" fill={colors[ki]} stroke="#0f172a" strokeWidth="2" />
                )}
              </g>
            );
          })}

          {activeIdx !== null && activeX !== null && (
            <line
              x1={activeX}
              y1={PAD.top}
              x2={activeX}
              y2={PAD.top + innerH}
              stroke="rgba(167,139,250,0.55)"
              strokeWidth="1.2"
              strokeDasharray="5 5"
            />
          )}

          {data.map((_, idx) => {
            const x = xAt(idx);
            return (
              <rect
                key={`hit-${idx}`}
                x={x - monthStep / 2}
                y={PAD.top}
                width={monthStep}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseMove={() => setActiveIdx(idx)}
              />
            );
          })}
        </svg>

        {activeMonth && activeX !== null && (
          <div
            className="absolute -top-2 -translate-x-1/2 bg-gray-950/95 border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-2xl pointer-events-none"
            style={{ left: `${(activeX / CHART_W) * 100}%` }}
          >
            <div className="font-bold text-gray-200 mb-1">{activeMonth.month}</div>
            {seriesKeys.map((k, i) => (
              <div key={k} className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                <span>{labels?.[i] || k}:</span>
                <span className="font-semibold text-white">{fmt(Number(activeMonth[k] || 0))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-1 px-1" onMouseLeave={() => setActiveIdx(null)}>
        {data.map((item, idx) => (
          <span
            key={idx}
            className={`text-[10px] font-medium text-center transition-colors ${activeIdx === idx ? 'text-purple-300' : 'text-gray-600'}`}
          >
            {item.month}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Role Donut ───────────────────────────────────────────────────────────────
function RoleDonut({ segments, total }) {
  const r = 44, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const safeTotal = total || 1;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111827" strokeWidth="12" />
          {segments.map((seg, i) => {
            const pct = seg.count / safeTotal;
            const dash = pct * circ;
            const cur = offset;
            offset += dash;
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="12"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-cur} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-white">{fmt(total)}</span>
          <span className="text-[10px] text-gray-500">users</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-gray-400 flex-1">{seg.label}</span>
            <span className="text-sm font-bold text-white">{fmt(seg.count)}</span>
            <span className="text-xs text-gray-600 w-10 text-right">{total > 0 ? Math.round(seg.count / total * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Funnel Progress Bar ──────────────────────────────────────────────────────
function FunnelBar({ label, percent, color, sublabel }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <div className="flex items-baseline gap-1.5">
          {sublabel && <span className="text-xs text-gray-600">{sublabel}</span>}
          <span className="text-base font-bold text-white">{percent}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Pulse Card (Tầng 1) ─────────────────────────────────────────────────────
function PulseCard({ label, mainValue, subValue, subLabel, icon: Icon, accentColor, borderColor, trendValue, trendUp, badge, children }) {
  return (
    <div className={`relative bg-gray-900 rounded-2xl p-6 border ${borderColor} hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
      {/* Glow bg */}
      <div className="absolute inset-0 opacity-5 rounded-2xl" style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
              <Icon size={17} style={{ color: accentColor }} />
            </div>
            <span className="text-sm font-medium text-gray-400">{label}</span>
          </div>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-4xl font-black text-white tracking-tight mb-1">{mainValue}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-sm">
            {trendUp !== undefined && (
              trendUp
                ? <FiTrendingUp size={14} className="text-emerald-400" />
                : <FiTrendingDown size={14} className="text-red-400" />
            )}
            <span className={trendUp ? 'text-emerald-400' : trendUp === false ? 'text-red-400' : 'text-gray-500'}>
              {trendValue}
            </span>
          </div>
          {subValue !== undefined && (
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: accentColor }}>{subValue}</div>
              <div className="text-xs text-gray-600">{subLabel}</div>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Ops Alert Item ───────────────────────────────────────────────────────────
function AlertItem({ icon: Icon, label, value, color, borderColor, desc }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${borderColor} bg-gray-900/60`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {desc && <div className="text-xs text-gray-600 truncate">{desc}</div>}
      </div>
      <div className="text-lg font-black shrink-0" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [totals, setTotals] = useState({ topics: 0, speaking: 0, writing: 0, users: 0, vocab: 0, reading: 0, listening: 0 });
  const [userStats, setUserStats] = useState({ active: 0, banned: 0, verified: 0, onboarded: 0, byRole: { standard: 0, vip: 0, admin: 0 } });
  const [finance, setFinance] = useState({ totalRevenue: 0, successTransactions: 0, revenueByMonth: {} });
  const [aiUsage, setAiUsage] = useState({ speakingChecks: 0, writingChecks: 0, chatMessages: 0, roleplaySessions: 0, blockedUsers: 0 });
  const [topTopics, setTopTopics] = useState([]);
  const [topTopicsWindow, setTopTopicsWindow] = useState('30d');
  const [topUsers, setTopUsers] = useState([]);
  const [opsAlerts, setOpsAlerts] = useState([]);
  const [monthly, setMonthly] = useState(
    Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, newUsers: 0, verifiedUsers: 0, onboardedUsers: 0 }))
  );

  useEffect(() => { loadAll(); }, [year]);

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminService.getAdminStats(year),
        adminService.getUserStats(),
        adminService.getVocabularyStats(),
        adminService.getReadingPassageStats(),
        adminService.getListeningStats(),
      ]);
      if (results[0].status === 'fulfilled') {
        const d = results[0].value.data.data;
        setTotals(prev => ({ ...prev, topics: d.totals?.topics || 0, speaking: d.totals?.speaking || 0, writing: d.totals?.writing || 0, users: d.totals?.users || 0 }));
        if (d.userMonthly?.length) {
          setMonthly(d.userMonthly.map(m => ({
            month: `T${m.month}`,
            newUsers: m.newUsers || 0,
            verifiedUsers: m.verifiedUsers || 0,
            onboardedUsers: m.onboardedUsers || 0
          })));
        }
        setFinance({
          totalRevenue: d.finance?.totalRevenue || 0,
          successTransactions: d.finance?.successTransactions || 0,
          revenueByMonth: d.finance?.revenueByMonth || {}
        });
        setAiUsage({
          speakingChecks: d.aiUsage?.speakingChecks || 0,
          writingChecks: d.aiUsage?.writingChecks || 0,
          chatMessages: d.aiUsage?.chatMessages || 0,
          roleplaySessions: d.aiUsage?.roleplaySessions || 0,
          blockedUsers: d.aiUsage?.blockedUsers || 0,
        });
        setTopTopics(Array.isArray(d.topTopics) ? d.topTopics : []);
  setTopTopicsWindow(d.topTopicsWindow || '30d');
        setTopUsers(Array.isArray(d.topUsers) ? d.topUsers : []);
        setOpsAlerts(Array.isArray(d.opsAlerts) ? d.opsAlerts : []);
      }
      if (results[1].status === 'fulfilled') {
        const d = results[1].value.data.data;
        setUserStats({ active: d.active || 0, banned: d.banned || 0, verified: d.verified || 0, onboarded: d.onboarded || 0, byRole: d.byRole || { standard: 0, vip: 0, admin: 0 } });
        setTotals(prev => ({ ...prev, users: d.total || prev.users }));
      }
      if (results[2].status === 'fulfilled') {
        const d = results[2].value.data.data;
        setTotals(prev => ({ ...prev, vocab: d.total || d.totalWords || 0 }));
      }
      if (results[3].status === 'fulfilled') {
        const d = results[3].value.data.data;
        setTotals(prev => ({ ...prev, reading: d.total || 0 }));
      }
      if (results[4].status === 'fulfilled') {
        const d = results[4].value.data.data;
        setTotals(prev => ({ ...prev, listening: d.total || 0 }));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <FiLoader className="animate-spin text-purple-400" size={32} />
        <span className="text-gray-500 text-sm">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // ── Derived metrics ──
  const p = totals.users > 0;
  const activePercent    = p ? Math.round((userStats.active   / totals.users) * 100) : 0;
  const verifiedPercent  = p ? Math.round((userStats.verified / totals.users) * 100) : 0;
  const onboardedPercent = p ? Math.round((userStats.onboarded/ totals.users) * 100) : 0;
  const vipPercent       = p ? Math.round((userStats.byRole.vip / totals.users) * 100) : 0;
  const estimatedRevenue = userStats.byRole.vip * 199000; // ước tính 199k/VIP
  const contentMax = Math.max(totals.topics, totals.speaking, totals.writing, totals.vocab, totals.reading, totals.listening, 1);

  const roleSegments = [
    { label: 'Standard', count: userStats.byRole.standard, color: '#6366f1' },
    { label: 'VIP',      count: userStats.byRole.vip,      color: '#f59e0b' },
    { label: 'Admin',    count: userStats.byRole.admin,    color: '#ef4444' },
  ];

  const revenueInMillions = finance.totalRevenue > 0 ? `${(finance.totalRevenue / 1e6).toFixed(1)}M ₫` : '0 ₫';
  const totalAiRequests = aiUsage.speakingChecks + aiUsage.writingChecks + aiUsage.chatMessages + aiUsage.roleplaySessions;

  const now = new Date();

  return (
    <div className="space-y-8 pb-10">

      {/* ════════════════════════════════════════════════════════════
          TOOLBAR — dính cố định góc trên phải
      ════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            {' · '}Cập nhật {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {/* Sticky Toolbar */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700/60 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-sm shrink-0">
          <span className="text-xs text-gray-500 font-medium mr-1">Năm</span>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
          </select>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="font-medium">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TẦNG 1 — THE PULSE (4 Stat Cards to)
      ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tầng 1 · The Pulse — Nhịp đập hệ thống</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Card 1: User Base */}
          <PulseCard
            label="User Base"
            mainValue={fmt(totals.users)}
            trendValue="+8.5% so với T.trước"
            trendUp={true}
            icon={FiUsers}
            accentColor="#22d3ee"
            borderColor="border-cyan-500/20 hover:border-cyan-500/50"
            badge="CEO"
          >
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-800">
              <MiniDonut percent={activePercent} color="#22d3ee" size={44} />
              <div>
                <div className="text-sm font-bold text-white">{fmt(userStats.active)} đang online</div>
                <div className="text-xs text-gray-600">{activePercent}% hoạt động</div>
              </div>
            </div>
          </PulseCard>

          {/* Card 2: Revenue/VIP */}
          <PulseCard
            label="Doanh thu ước tính"
            mainValue={revenueInMillions}
            trendValue={`${fmt(finance.successTransactions)} giao dịch thành công`}
            trendUp={finance.totalRevenue > 0}
            icon={FaCrown}
            accentColor="#f59e0b"
            borderColor="border-amber-500/20 hover:border-amber-500/50"
            badge="Revenue"
          >
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-800">
              <MiniDonut percent={vipPercent} color="#f59e0b" size={44} />
              <div>
                <div className="text-sm font-bold text-white">{vipPercent}% là VIP</div>
                <div className="text-xs text-gray-600">Doanh thu thật từ transaction</div>
              </div>
            </div>
          </PulseCard>

          {/* Card 3: Engagement */}
          <PulseCard
            label="Engagement Rate"
            mainValue={`${activePercent}%`}
            trendValue={`${verifiedPercent}% đã xác thực email`}
            trendUp={activePercent > 50}
            icon={FiZap}
            accentColor="#a78bfa"
            borderColor="border-purple-500/20 hover:border-purple-500/50"
            badge="Product"
          >
            <div className="mt-4 pt-3 border-t border-gray-800 space-y-1.5">
              {[
                { label: 'Onboarded', val: onboardedPercent, color: '#a78bfa' },
                { label: 'Active', val: activePercent, color: '#34d399' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-16">{r.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                    <div className="h-full rounded-full" style={{ width: `${r.val}%`, backgroundColor: r.color }} />
                  </div>
                  <span className="text-xs font-bold text-white w-8 text-right">{r.val}%</span>
                </div>
              ))}
            </div>
          </PulseCard>

          {/* Card 4: AI Burn Rate */}
          <PulseCard
            label="AI Burn Rate"
            mainValue={fmt(totalAiRequests)}
            trendValue={`${fmt(aiUsage.blockedUsers)} user bị chặn AI`}
            trendUp={aiUsage.blockedUsers === 0}
            icon={FiAlertTriangle}
            accentColor="#f97316"
            borderColor="border-orange-500/30 hover:border-orange-500/60"
            badge="⚠ Cost"
          >
            <div className="mt-4 pt-3 border-t border-gray-800">
              <div className="text-xs text-gray-600 leading-relaxed">
                Speaking: <span className="text-orange-300 font-medium">{fmt(aiUsage.speakingChecks)}</span> · Writing: <span className="text-orange-300 font-medium">{fmt(aiUsage.writingChecks)}</span> · Chat: <span className="text-orange-300 font-medium">{fmt(aiUsage.chatMessages)}</span>
              </div>
            </div>
          </PulseCard>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TẦNG 2 — THE ENGINE (Biểu đồ cột 8col + Funnel 4col)
      ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-purple-500" />
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tầng 2 · The Engine — Động cơ tăng trưởng</h2>
        </div>
        <div className="grid grid-cols-12 gap-5">

          {/* Stacked Bar Chart — 8 cols */}
          <div className="col-span-12 lg:col-span-8 bg-gray-900 rounded-2xl p-6 border border-gray-700/40 hover:border-gray-600/60 transition-colors shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Tăng trưởng người dùng theo tháng</h3>
                <p className="text-xs text-gray-500 mt-0.5">Đăng ký mới · Đã xác thực · Đã onboard — {year}</p>
              </div>
              <div className="flex gap-3">
                {[['New users','#a78bfa'],['Verified','#60a5fa'],['Onboarded','#34d399']].map(([k,c]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: c }} />
                    <span className="text-xs text-gray-500">{k}</span>
                  </div>
                ))}
              </div>
            </div>
            <BarChart
              data={monthly}
              seriesKeys={['newUsers','verifiedUsers','onboardedUsers']}
              colors={['#a78bfa','#60a5fa','#34d399']}
              labels={['Đăng ký mới','Đã xác thực','Đã onboard']}
              height={210}
            />
          </div>

          {/* User Funnel — 4 cols */}
          <div className="col-span-12 lg:col-span-4 bg-gray-900 rounded-2xl p-6 border border-gray-700/40 hover:border-gray-600/60 transition-colors shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">User Funnel</h3>
            <p className="text-xs text-gray-500 mb-5">User rớt đài ở bước nào nhiều nhất?</p>
            <div className="space-y-5">
              <FunnelBar label="✉️ Xác thực Email" percent={verifiedPercent} color="#60a5fa"
                sublabel={`${fmt(userStats.verified)} / ${fmt(totals.users)}`} />
              <FunnelBar label="🚀 Đã Onboard" percent={onboardedPercent} color="#a78bfa"
                sublabel={`${fmt(userStats.onboarded)} / ${fmt(totals.users)}`} />
              <FunnelBar label="⚡ Đang Active" percent={activePercent} color="#34d399"
                sublabel={`${fmt(userStats.active)} / ${fmt(totals.users)}`} />
              <FunnelBar label="👑 Nâng lên VIP" percent={vipPercent} color="#f59e0b"
                sublabel={`${fmt(userStats.byRole.vip)} / ${fmt(totals.users)}`} />
            </div>
            {/* Dropout highlight */}
            <div className="mt-5 pt-4 border-t border-gray-800">
              <div className="text-xs text-gray-600 mb-2">🔻 Dropout lớn nhất</div>
              {(() => {
                const steps = [
                  { name: 'Đăng ký → Xác thực', drop: 100 - verifiedPercent },
                  { name: 'Xác thực → Onboard', drop: verifiedPercent - onboardedPercent },
                  { name: 'Onboard → Active', drop: onboardedPercent - activePercent },
                  { name: 'Active → VIP', drop: activePercent - vipPercent },
                ];
                const worst = steps.reduce((a, b) => b.drop > a.drop ? b : a, steps[0]);
                return (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <FiAlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-300">{worst.name}: <strong>-{worst.drop}%</strong></span>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TẦNG 3 — THE WAREHOUSE (Content 6col + Donut 6col)
      ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-emerald-500" />
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tầng 3 · The Warehouse — Kho nội dung</h2>
        </div>
        <div className="grid grid-cols-12 gap-5">

          {/* Horizontal Content Bars — 6 cols */}
          <div className="col-span-12 lg:col-span-6 bg-gray-900 rounded-2xl p-6 border border-gray-700/40 shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">Phân bổ Kho Nội dung</h3>
            <p className="text-xs text-gray-500 mb-5">Loại nào đang thiếu? Ưu tiên sản xuất thêm.</p>
            <div className="space-y-3.5">
              {[
                { label: 'Topics',    val: totals.topics,    color: '#a78bfa', icon: '📚' },
                { label: 'Speaking',  val: totals.speaking,  color: '#60a5fa', icon: '🎤' },
                { label: 'Writing',   val: totals.writing,   color: '#f472b6', icon: '✍️' },
                { label: 'Từ vựng',   val: totals.vocab,     color: '#34d399', icon: '📖' },
                { label: 'Reading',   val: totals.reading,   color: '#fbbf24', icon: '📰' },
                { label: 'Listening', val: totals.listening, color: '#818cf8', icon: '🎧' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-5 shrink-0">{item.icon}</span>
                  <span className="text-sm text-gray-400 w-18 shrink-0">{item.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max((item.val / contentMax) * 100, item.val > 0 ? 2 : 0)}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-sm font-black text-white w-9 text-right">{fmt(item.val)}</span>
                  {/* thiếu cảnh báo */}
                  {item.val < contentMax * 0.2 && item.val < 10 && (
                    <span className="text-xs text-orange-400 font-medium">⚠ Ít</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Role Donut — 6 cols */}
          <div className="col-span-12 lg:col-span-6 bg-gray-900 rounded-2xl p-6 border border-gray-700/40 shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">Phân bổ Vai trò User</h3>
            <p className="text-xs text-gray-500 mb-5">Tỉ lệ Standard / VIP / Admin trong hệ thống.</p>
            <RoleDonut segments={roleSegments} total={totals.users} />
            {/* Extra detail */}
            <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
              {[
                { label: 'Đang hoạt động', val: userStats.active, color: '#34d399', border: 'border-emerald-500/25', icon: FiCheckCircle },
                { label: 'Bị khoá', val: userStats.banned, color: '#ef4444', border: 'border-red-500/25', icon: FiShield },
                { label: 'Đã xác thực', val: userStats.verified, color: '#60a5fa', border: 'border-blue-500/25', icon: FiCheckCircle },
                { label: 'Đã onboard', val: userStats.onboarded, color: '#a78bfa', border: 'border-purple-500/25', icon: FaGraduationCap },
              ].map(m => (
                <div key={m.label} className={`flex items-center gap-3 p-3 rounded-xl border ${m.border} bg-gray-950/50`}>
                  <m.icon size={15} style={{ color: m.color }} />
                  <div>
                    <div className="text-base font-black" style={{ color: m.color }}>{fmt(m.val)}</div>
                    <div className="text-xs text-gray-600">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TẦNG 4 — THE ACTION CENTER (Leaderboard 6col + Ops 6col)
      ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-amber-500" />
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tầng 4 · The Action Center — Vận hành</h2>
        </div>
        <div className="grid grid-cols-12 gap-5">

          {/* Leaderboard — 6 cols */}
          <div className="col-span-12 lg:col-span-6 bg-gray-900 rounded-2xl p-6 border border-gray-700/40 shadow-lg">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FiAward className="text-amber-400" size={17} /> Bảng Vàng Tuần này
            </h3>

            {/* Top Topics */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🏆 Top 5 Topic phổ biến nhất {topTopicsWindow === 'all' ? '(toàn thời gian)' : '(30 ngày gần nhất)'}
              </div>
              <div className="space-y-2">
                {(topTopics.length > 0 ? topTopics : [{ name: 'Chưa có dữ liệu', count: 0 }]).map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-500'}`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-300 truncate">{t.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 rounded-full bg-amber-500/30" style={{ width: `${((t.count || 0) / Math.max(topTopics[0]?.count || 1, 1)) * 60}px` }}>
                        <div className="h-full rounded-full bg-amber-400" style={{ width: '100%' }} />
                      </div>
                      <span className="text-xs font-bold text-amber-400 w-10 text-right">{fmt(t.count || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">⚡ Top 5 User nhiều EXP nhất (toàn hệ thống)</div>
              <div className="space-y-2">
                {(topUsers.length > 0 ? topUsers : [{ name: 'Chưa có dữ liệu', xp: 0 }]).map((u, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-500'}`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-300 truncate">{u.name}</span>
                    <span className="text-xs font-bold text-purple-400">{fmt(u.xp || 0)} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ops Alerts — 6 cols */}
          <div className="col-span-12 lg:col-span-6 bg-gray-900 rounded-2xl p-6 border border-gray-700/40 shadow-lg">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FiFlag className="text-red-400" size={17} /> Cảnh báo & Vận hành
            </h3>

            {/* System metrics */}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">📊 Trạng thái hệ thống</div>
            <div className="space-y-2 mb-5">
              <AlertItem icon={FiCheckCircle} label="Đang hoạt động" value={fmt(userStats.active)}
                color="#34d399" borderColor="border-emerald-500/25" desc="Người dùng active hôm nay" />
              <AlertItem icon={FiShield} label="Tài khoản bị khoá" value={fmt(userStats.banned)}
                color={userStats.banned > 0 ? '#ef4444' : '#6b7280'} borderColor={userStats.banned > 0 ? 'border-red-500/30' : 'border-gray-700/40'} desc="Cần xem xét & xử lý" />
              <AlertItem icon={FiAlertCircle} label="Chưa xác thực email" value={fmt(totals.users - userStats.verified)}
                color="#f97316" borderColor="border-orange-500/25" desc="Có thể gửi reminder email" />
              <AlertItem icon={FiZap} label="Chưa onboard" value={fmt(totals.users - userStats.onboarded)}
                color="#a78bfa" borderColor="border-purple-500/25" desc="Cần hướng dẫn thêm" />
            </div>

            {/* Pending Reports */}
            <div className="border-t border-gray-800 pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🚩 Cảnh báo vận hành (real-time)</div>
              <div className="space-y-2">
                {(opsAlerts.length > 0 ? opsAlerts : [{ key: 'none', label: 'Chưa có dữ liệu cảnh báo', value: 0, desc: 'Không có cảnh báo vận hành lúc này', severity: 'low' }]).map((r, i) => {
                  const urgent = r.severity === 'high';
                  const warn = r.severity === 'medium';
                  return (
                  <div key={r.key || i} className={`flex items-center gap-3 p-2.5 rounded-xl border ${urgent ? 'border-red-500/30 bg-red-500/5' : warn ? 'border-amber-500/25 bg-amber-500/5' : 'border-gray-800'}`}>
                    <FiFlag size={13} className={urgent ? 'text-red-400' : warn ? 'text-amber-400' : 'text-gray-600'} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-300 truncate block">{r.label}</span>
                      <span className="text-[10px] text-gray-600 truncate block">{r.desc}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 font-semibold">{fmt(r.value)}</span>
                    {urgent && <span className="text-[10px] font-bold text-red-400 shrink-0">Gấp</span>}
                    {warn && <span className="text-[10px] font-bold text-amber-400 shrink-0">Theo dõi</span>}
                  </div>
                )})}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default AdminDashboard;
