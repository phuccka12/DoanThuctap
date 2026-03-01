import { writeFileSync } from 'fs';

const jsx = String.raw`import React, { useState, useEffect, useRef } from 'react';
import {
  FiBook, FiUsers, FiMic, FiVolume2,
  FiLoader, FiRefreshCw, FiTrendingUp, FiTrendingDown,
  FiZap, FiAlertTriangle, FiAlertCircle, FiCheckCircle,
  FiShield, FiAward, FiDollarSign,
} from 'react-icons/fi';
import { FaGraduationCap, FaCrown } from 'react-icons/fa';
import adminService from '../../services/adminService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : (n ?? '—'));
const fmtVND = (n) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
    : '—';
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ─── Mini Donut ───────────────────────────────────────────────────────────────
function MiniDonut({ percent = 0, color = '#a78bfa', size = 52 }) {
  const r = 14, cx = 18, cy = 18;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(percent / 100, 1) * circ;
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

// ─── Area Revenue Chart (SVG pure, no lib) ───────────────────────────────────
function AreaRevenueChart({ data = [], height = 200 }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);
  const W = 800, H = height, PAD = { top: 20, right: 20, bottom: 28, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1 || 1)) * chartW,
    y: PAD.top + chartH - (d.revenue / maxVal) * chartH,
    ...d,
  }));

  // Cubic bezier smooth path
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C ${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }).join(' ');

  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x},${PAD.top + chartH}`
    + ` L ${pts[0].x},${PAD.top + chartH} Z`;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * W;
    let best = 0, bestDist = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.x - mx); if (d < bestDist) { bestDist = d; best = i; } });
    setHoveredIdx(best);
    setTooltip({ x: pts[best].x / W * 100, y: pts[best].y / H * 100, ...data[best] });
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
        onMouseMove={handleMouseMove} onMouseLeave={() => { setTooltip(null); setHoveredIdx(null); }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Subtle grid — dashed, low opacity */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i}
            x1={PAD.left} y1={PAD.top + chartH * f}
            x2={PAD.left + chartW} y2={PAD.top + chartH * f}
            stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" opacity="0.12" />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#revGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Glow line on hover */}
        {hoveredIdx !== null && (
          <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="5"
            strokeLinecap="round" opacity="0.2" filter="url(#glow)" />
        )}

        {/* X labels */}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle"
            fontSize="10" fill={hoveredIdx === i ? '#f59e0b' : '#4b5563'} fontWeight={hoveredIdx === i ? '700' : '500'}>
            {p.label}
          </text>
        ))}

        {/* Hover dot with glow */}
        {hoveredIdx !== null && pts[hoveredIdx] && (() => {
          const p = pts[hoveredIdx];
          return (
            <>
              <circle cx={p.x} cy={p.y} r="10" fill="#f59e0b" opacity="0.15" />
              <circle cx={p.x} cy={p.y} r="5" fill="#f59e0b" />
              <circle cx={p.x} cy={p.y} r="5" fill="#f59e0b" opacity="0.4" filter="url(#glow)" />
              {/* Vertical rule */}
              <line x1={p.x} y1={p.y} x2={p.x} y2={PAD.top + chartH}
                stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            </>
          );
        })()}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-30 transition-all duration-100"
          style={{ left: `clamp(4%, ${tooltip.x}%, 80%)`, top: `${Math.max(tooltip.y - 28, 0)}%`, transform: 'translateX(-50%)' }}>
          <div className="bg-gray-950 border border-amber-500/30 rounded-2xl px-4 py-3 shadow-2xl min-w-[140px]">
            <div className="text-xs text-gray-500 mb-0.5 font-medium">{tooltip.label}</div>
            <div className="text-lg font-black text-amber-400">{fmtVND(tooltip.revenue)}</div>
            {tooltip.count != null && (
              <div className="text-xs text-gray-600 mt-0.5">{fmt(tooltip.count)} giao dịch</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stacked Bar Chart (rounded top segment) ─────────────────────────────────
function StackedBarChart({ data = [], keys = [], colors = [], height = 200 }) {
  const maxVal = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k] || 0), 0)), 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((item, idx) => {
        const total = keys.reduce((s, k) => s + (item[k] || 0), 0);
        const barPct = Math.max((total / maxVal) * 100, total > 0 ? 3 : 0);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full relative" style={{ height: `${barPct}%`, minHeight: total > 0 ? 3 : 0 }}>
              {/* Tooltip */}
              {total > 0 && (
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                  bg-gray-950 border border-gray-700/60 rounded-2xl px-3 py-2.5 text-xs text-white
                  whitespace-nowrap z-20 shadow-2xl pointer-events-none transition-all duration-150">
                  <div className="font-semibold text-gray-300 mb-1.5 border-b border-gray-800 pb-1">{item.month}</div>
                  {keys.map((k, ki) => (
                    <div key={k} className="flex items-center gap-2 py-0.5">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[ki] }} />
                      <span className="text-gray-400 capitalize">{k}:</span>
                      <span className="font-black ml-auto pl-3">{item[k] || 0}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-800 mt-1 pt-1 flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-black text-white">{total}</span>
                  </div>
                </div>
              )}
              {/* Bar segments — stacked, top segment rounded */}
              <div className="absolute inset-0 overflow-hidden flex flex-col-reverse"
                style={{ borderRadius: '3px 3px 0 0' }}>
                {keys.map((k, ki) => {
                  const seg = item[k] || 0;
                  const segPct = total > 0 ? (seg / total) * 100 : 0;
                  const isTop = ki === keys.length - 1;
                  return (
                    <div key={k}
                      style={{
                        height: `${segPct}%`,
                        backgroundColor: colors[ki],
                        borderRadius: isTop ? '3px 3px 0 0' : '0',
                      }}
                      className="w-full group-hover:brightness-125 transition-all duration-200" />
                  );
                })}
              </div>
            </div>
            <span className="text-[9px] text-gray-600 font-medium group-hover:text-gray-400 transition-colors">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Role Donut ───────────────────────────────────────────────────────────────
function RoleDonut({ segments = [], total = 0 }) {
  const r = 44, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const safeTotal = total || 1;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111827" strokeWidth="14" />
          {segments.map((seg, i) => {
            const d = (seg.count / safeTotal) * circ;
            const cur = offset; offset += d;
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
              strokeWidth="14" strokeDasharray={`${d} ${circ - d}`} strokeDashoffset={-cur} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{fmt(total)}</span>
          <span className="text-[10px] text-gray-500">users</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-gray-400 flex-1">{seg.label}</span>
            <span className="text-sm font-bold text-white">{fmt(seg.count)}</span>
            <span className="text-xs text-gray-600 w-10 text-right">{pct(seg.count, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Funnel Progress Bar ──────────────────────────────────────────────────────
function FunnelBar({ label, value, maxValue, color, sublabel }) {
  const w = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <div className="flex items-baseline gap-1.5">
          {sublabel && <span className="text-xs text-gray-600">{sublabel}</span>}
          <span className="text-base font-bold text-white">{fmt(value)}</span>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Pulse Card ───────────────────────────────────────────────────────────────
function PulseCard({ label, mainValue, trendValue, trendUp, icon: Icon, accentColor, borderColor, badge, children }) {
  return (
    <div className={`relative bg-gray-900 rounded-2xl p-6 border ${borderColor} hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
      <div className="absolute inset-0 opacity-5 rounded-2xl"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}>
              <Icon size={17} style={{ color: accentColor }} />
            </div>
            <span className="text-sm font-medium text-gray-400">{label}</span>
          </div>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-4xl font-black text-white tracking-tight mb-2">{mainValue}</div>
        {trendValue && (
          <div className="flex items-center gap-1.5 text-sm">
            {trendUp === true  && <FiTrendingUp  size={14} className="text-emerald-400" />}
            {trendUp === false && <FiTrendingDown size={14} className="text-red-400" />}
            <span className={trendUp === true ? 'text-emerald-400' : trendUp === false ? 'text-red-400' : 'text-gray-500'}>
              {trendValue}
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
function AlertItem({ icon: Icon, label, value, color, desc }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-800/80 bg-gray-900/60 hover:border-gray-700 transition-colors">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18`, color }}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {desc && <div className="text-xs text-gray-600 truncate">{desc}</div>}
      </div>
      <div className="text-lg font-black shrink-0" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ color, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-1 h-5 rounded-full ${color}`} />
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{children}</h2>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [year, setYear]       = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [totals, setTotals] = useState({
    topics: 0, speaking: 0, speakingActive: 0,
    writing: 0, users: 0, vocab: 0,
    reading: 0, listening: 0, listeningActive: 0,
  });
  const [uStats, setUStats] = useState({
    active: 0, banned: 0, verified: 0, onboarded: 0,
    byRole: { standard: 0, vip: 0, admin: 0 },
  });
  const [monthly, setMonthly] = useState(
    Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, topics: 0, speaking: 0, writing: 0 }))
  );
  const [billing, setBilling]         = useState({ totalRevenue: 0, success: 0, pending: 0, failed: 0 });
  const [revenueMonthly, setRevMonthly] = useState([]);

  useEffect(() => { load(); }, [year]);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [r0, r1, r2, r3, r4, r5, r6, r7] = await Promise.allSettled([
        adminService.getAdminStats(year),
        adminService.getUserStats(),
        adminService.getVocabularyStats(),
        adminService.getReadingPassageStats(),
        adminService.getListeningStats(),
        adminService.getTransactionStats(),
        adminService.getRevenueByMonth(12),
        adminService.getSpeakingStats(),
      ]);

      if (r0.status === 'fulfilled') {
        const d = r0.value.data.data;
        setTotals(p => ({ ...p, topics: d.totals?.topics || 0, speaking: d.totals?.speaking || 0, writing: d.totals?.writing || 0, users: d.totals?.users || 0 }));
        if (d.monthly?.length)
          setMonthly(d.monthly.map(m => ({ month: `T${m.month}`, topics: m.topics || 0, speaking: m.speaking || 0, writing: m.writing || 0 })));
      }
      if (r1.status === 'fulfilled') {
        const d = r1.value.data.data;
        setUStats({ active: d.active || 0, banned: d.banned || 0, verified: d.verified || 0, onboarded: d.onboarded || 0, byRole: d.byRole || { standard: 0, vip: 0, admin: 0 } });
        setTotals(p => ({ ...p, users: d.total || p.users }));
      }
      if (r2.status === 'fulfilled') { const d = r2.value.data.data; setTotals(p => ({ ...p, vocab: d.total || d.totalWords || 0 })); }
      if (r3.status === 'fulfilled') { const d = r3.value.data.data; setTotals(p => ({ ...p, reading: d.total || 0 })); }
      if (r4.status === 'fulfilled') { const d = r4.value.data.data; setTotals(p => ({ ...p, listening: d.total || 0, listeningActive: d.active || 0 })); }
      if (r5.status === 'fulfilled') {
        const d = r5.value.data.data;
        setBilling({ totalRevenue: d.totalRevenue || 0, success: d.success || 0, pending: d.pending || 0, failed: d.failed || 0 });
      }
      if (r6.status === 'fulfilled') { const d = r6.value.data.data; setRevMonthly(d.byMonth || []); }
      if (r7.status === 'fulfilled') { const d = r7.value.data.data; setTotals(p => ({ ...p, speakingActive: d.active || 0 })); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  // Derived
  const activeP    = pct(uStats.active,      totals.users);
  const verifiedP  = pct(uStats.verified,    totals.users);
  const onboardedP = pct(uStats.onboarded,   totals.users);
  const vipP       = pct(uStats.byRole.vip,  totals.users);
  const contentMax = Math.max(totals.topics, totals.speaking, totals.writing, totals.vocab, totals.reading, totals.listening, 1);
  const totalContent = totals.topics + totals.speaking + totals.writing + totals.vocab + totals.reading + totals.listening;

  const roleSegments = [
    { label: 'Standard', count: uStats.byRole.standard, color: '#6366f1' },
    { label: 'VIP',      count: uStats.byRole.vip,      color: '#f59e0b' },
    { label: 'Admin',    count: uStats.byRole.admin,    color: '#ef4444' },
  ];

  // Revenue area chart — 12 months filled from API
  const revenueChartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const found = revenueMonthly.find(r => r._id?.month === m);
    return { label: `T${m}`, revenue: found?.revenue || 0, count: found?.count };
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <FiLoader className="animate-spin text-purple-400" size={32} />
      <span className="text-gray-500 text-sm">Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-12 text-gray-100">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            HIDAY ENGLISH Admin Panel &middot;{' '}
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2.5 shadow-xl shrink-0">
          <span className="text-xs text-gray-600 font-medium">Năm</span>
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer">
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
          </select>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-40">
            <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="font-medium">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── TẦNG 1 ── */}
      <section>
        <SectionLabel color="bg-sky-500">Tầng 1 · The Pulse — Nhịp đập hệ thống</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <PulseCard icon={FiUsers} label="User Base" mainValue={fmt(totals.users)}
            trendValue={`${fmt(uStats.active)} đang online`} trendUp={true}
            accentColor="#22d3ee" borderColor="border-cyan-500/20 hover:border-cyan-500/40" badge="Users">
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-800">
              <MiniDonut percent={activeP} color="#22d3ee" size={46} />
              <div className="text-xs text-gray-500 space-y-0.5 leading-relaxed">
                <div><span className="text-white font-bold">{verifiedP}%</span> đã xác thực</div>
                <div><span className="text-white font-bold">{onboardedP}%</span> đã onboard</div>
                <div><span className="text-red-400 font-bold">{fmt(uStats.banned)}</span> bị khoá</div>
              </div>
            </div>
          </PulseCard>

          <PulseCard icon={FiDollarSign} label="Doanh thu thực tế"
            mainValue={billing.totalRevenue > 0 ? `${(billing.totalRevenue / 1e6).toFixed(1)}M ₫` : '—'}
            trendValue={`${fmt(billing.success)} giao dịch thành công`} trendUp={billing.success > 0}
            accentColor="#f59e0b" borderColor="border-amber-500/20 hover:border-amber-500/40" badge="Revenue">
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-800">
              <MiniDonut percent={vipP} color="#f59e0b" size={46} />
              <div className="text-xs text-gray-500 space-y-0.5 leading-relaxed">
                <div><span className="text-white font-bold">{fmt(uStats.byRole.vip)}</span> VIP</div>
                <div><span className="text-amber-400 font-bold">{fmt(billing.pending)}</span> chờ xử lý</div>
                <div><span className="text-red-400 font-bold">{fmt(billing.failed)}</span> thất bại</div>
              </div>
            </div>
          </PulseCard>

          <PulseCard icon={FiZap} label="Engagement Rate" mainValue={`${activeP}%`}
            trendValue={`${verifiedP}% đã xác thực email`} trendUp={activeP > 50}
            accentColor="#a78bfa" borderColor="border-purple-500/20 hover:border-purple-500/40" badge="Product">
            <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
              {[
                { label: 'Online',  val: activeP,    color: '#22d3ee' },
                { label: 'Onboard', val: onboardedP, color: '#a78bfa' },
                { label: 'VIP',     val: vipP,       color: '#f59e0b' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-14 shrink-0">{r.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.val}%`, backgroundColor: r.color }} />
                  </div>
                  <span className="text-xs font-bold text-white w-8 text-right">{r.val}%</span>
                </div>
              ))}
            </div>
          </PulseCard>

          <PulseCard icon={FiBook} label="Kho nội dung" mainValue={fmt(totalContent)}
            trendValue="Tổng tất cả loại nội dung" trendUp={totalContent > 0}
            accentColor="#10b981" borderColor="border-emerald-500/20 hover:border-emerald-500/40" badge="Content">
            <div className="mt-4 pt-3 border-t border-gray-800 space-y-1.5 text-xs">
              {[
                ['Topics',    totals.topics,    '#a78bfa'],
                ['Speaking',  totals.speaking,  '#60a5fa'],
                ['Writing',   totals.writing,   '#f472b6'],
                ['Vocab',     totals.vocab,     '#34d399'],
                ['Reading',   totals.reading,   '#fbbf24'],
                ['Listening', totals.listening, '#818cf8'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-gray-600 w-14 shrink-0">{k}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct(v, contentMax)}%`, backgroundColor: c }} />
                  </div>
                  <span className="font-bold text-white w-6 text-right">{v}</span>
                </div>
              ))}
            </div>
          </PulseCard>

        </div>
      </section>

      {/* ── TẦNG 2 · Engine ── */}
      <section>
        <SectionLabel color="bg-purple-500">Tầng 2 · The Engine — Động cơ tăng trưởng</SectionLabel>
        <div className="grid grid-cols-12 gap-5">

          {/* Stacked Bar — 8 cols */}
          <div className="col-span-12 lg:col-span-8 bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Năng suất sản xuất Content</h3>
                <p className="text-xs text-gray-500 mt-0.5">Topics · Speaking · Writing mỗi tháng — {year}</p>
              </div>
              <div className="flex gap-3">
                {[['Topics','#a78bfa'],['Speaking','#60a5fa'],['Writing','#f472b6']].map(([k,c]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                    <span className="text-xs text-gray-500">{k}</span>
                  </div>
                ))}
              </div>
            </div>
            <StackedBarChart
              data={monthly}
              keys={['topics', 'speaking', 'writing']}
              colors={['#a78bfa', '#60a5fa', '#f472b6']}
              height={210}
            />
          </div>

          {/* User Funnel — 4 cols */}
          <div className="col-span-12 lg:col-span-4 bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">User Funnel</h3>
            <p className="text-xs text-gray-500 mb-5">Dropout ở bước nào nhiều nhất?</p>
            <div className="space-y-5">
              <FunnelBar label="✉️ Xác thực Email" value={uStats.verified}  maxValue={totals.users} color="#60a5fa" sublabel={`/ ${fmt(totals.users)}`} />
              <FunnelBar label="🚀 Đã Onboard"     value={uStats.onboarded} maxValue={totals.users} color="#a78bfa" sublabel={`/ ${fmt(totals.users)}`} />
              <FunnelBar label="⚡ Đang Active"    value={uStats.active}    maxValue={totals.users} color="#34d399" sublabel={`/ ${fmt(totals.users)}`} />
              <FunnelBar label="👑 Nâng lên VIP"   value={uStats.byRole.vip} maxValue={totals.users} color="#f59e0b" sublabel={`/ ${fmt(totals.users)}`} />
            </div>
            {totals.users > 0 && (() => {
              const steps = [
                { name: 'Đăng ký → Xác thực',   drop: totals.users      - uStats.verified },
                { name: 'Xác thực → Onboard',    drop: uStats.verified   - uStats.onboarded },
                { name: 'Onboard → Active',       drop: uStats.onboarded  - uStats.active },
                { name: 'Active → VIP',           drop: uStats.active     - uStats.byRole.vip },
              ];
              const worst = steps.reduce((a, b) => b.drop > a.drop ? b : a, steps[0]);
              if (worst.drop <= 0) return null;
              return (
                <div className="mt-5 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <FiAlertCircle size={13} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-300">{worst.name}: <strong>-{fmt(worst.drop)} người</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </section>

      {/* ── REVENUE AREA CHART ── */}
      <section>
        <SectionLabel color="bg-amber-500">Doanh thu thực tế theo tháng</SectionLabel>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/20 transition-colors shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">Revenue Flow — {year}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tổng tích luỹ:{' '}
                <span className="text-amber-400 font-bold">{fmtVND(billing.totalRevenue)}</span>
                {' · '}{fmt(billing.success)} GD thành công · {fmt(billing.pending)} chờ · {fmt(billing.failed)} thất bại
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
              <span className="w-6 h-0.5 rounded bg-amber-400 inline-block" />Doanh thu (hover để xem)
            </div>
          </div>
          <AreaRevenueChart data={revenueChartData} height={220} />
        </div>
      </section>

      {/* ── TẦNG 3 · Warehouse ── */}
      <section>
        <SectionLabel color="bg-emerald-500">Tầng 3 · The Warehouse — Kho nội dung</SectionLabel>
        <div className="grid grid-cols-12 gap-5">

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">Phân bổ Kho Nội dung</h3>
            <p className="text-xs text-gray-500 mb-5">Loại nào đang thiếu? Ưu tiên sản xuất thêm.</p>
            <div className="space-y-4">
              {[
                { label: 'Topics',    val: totals.topics,         color: '#a78bfa', icon: '📚', sub: 'Chủ đề IELTS' },
                { label: 'Speaking',  val: totals.speaking,        color: '#60a5fa', icon: '🎤', sub: `${totals.speakingActive} đang active` },
                { label: 'Writing',   val: totals.writing,         color: '#f472b6', icon: '✍️', sub: 'Đề bài viết' },
                { label: 'Từ vựng',   val: totals.vocab,           color: '#34d399', icon: '📖', sub: 'Từ trong ngân hàng' },
                { label: 'Reading',   val: totals.reading,         color: '#fbbf24', icon: '📰', sub: 'Bài đọc' },
                { label: 'Listening', val: totals.listening,       color: '#818cf8', icon: '🎧', sub: `${totals.listeningActive} đang active` },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="text-base w-6 shrink-0">{item.icon}</span>
                    <span className="text-sm text-gray-400 w-20 shrink-0">{item.label}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct(item.val, contentMax), item.val > 0 ? 2 : 0)}%`, backgroundColor: item.color }} />
                    </div>
                    <span className="text-sm font-black text-white w-8 text-right">{item.val}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 pl-9">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">Phân bổ Vai trò User</h3>
            <p className="text-xs text-gray-500 mb-5">Tỉ lệ Standard / VIP / Admin trong hệ thống.</p>
            <RoleDonut segments={roleSegments} total={totals.users} />
            <div className="mt-6 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
              {[
                { label: 'Đang hoạt động', val: uStats.active,    color: '#34d399', Icon: FiCheckCircle },
                { label: 'Bị khoá',        val: uStats.banned,    color: '#ef4444', Icon: FiShield },
                { label: 'Đã xác thực',    val: uStats.verified,  color: '#60a5fa', Icon: FiCheckCircle },
                { label: 'Đã onboard',     val: uStats.onboarded, color: '#a78bfa', Icon: FaGraduationCap },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2.5 p-3 bg-gray-950/50 rounded-xl border border-gray-800">
                  <m.Icon size={15} style={{ color: m.color }} />
                  <div>
                    <div className="text-lg font-black" style={{ color: m.color }}>{fmt(m.val)}</div>
                    <div className="text-xs text-gray-600">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── TẦNG 4 · Action Center ── */}
      <section>
        <SectionLabel color="bg-rose-500">Tầng 4 · The Action Center — Vận hành</SectionLabel>
        <div className="grid grid-cols-12 gap-5">

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FiAward size={16} className="text-amber-400" /> Chỉ số hệ thống
            </h3>
            <div className="space-y-2">
              <AlertItem icon={FiUsers}      label="Tổng người dùng"       value={fmt(totals.users)}               color="#22d3ee" desc={`${fmt(uStats.active)} online · ${fmt(uStats.banned)} bị khoá`} />
              <AlertItem icon={FiBook}       label="Tổng nội dung"         value={fmt(totalContent)}               color="#a78bfa" desc="Topics + Speaking + Writing + Vocab + Reading + Listening" />
              <AlertItem icon={FiDollarSign} label="Doanh thu tích luỹ"    value={fmtVND(billing.totalRevenue)}    color="#f59e0b" desc={`${fmt(billing.success)} GD thành công · ${fmt(billing.pending)} chờ`} />
              <AlertItem icon={FaCrown}      label="Tài khoản VIP"         value={fmt(uStats.byRole.vip)}          color="#f59e0b" desc={`${vipP}% tổng người dùng`} />
              <AlertItem icon={FiShield}     label="Tài khoản bị khoá"     value={fmt(uStats.banned)}              color={uStats.banned > 0 ? '#ef4444' : '#10b981'} desc={uStats.banned > 0 ? 'Cần kiểm tra' : 'Hệ thống sạch'} />
              <AlertItem icon={FiMic}        label="Speaking đang active"  value={fmt(totals.speakingActive)}      color="#60a5fa" desc={`Trên tổng ${fmt(totals.speaking)}`} />
              <AlertItem icon={FiVolume2}    label="Listening đang active" value={fmt(totals.listeningActive)}     color="#818cf8" desc={`Trên tổng ${fmt(totals.listening)}`} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FiAlertTriangle size={16} className="text-rose-400" /> Trạng thái giao dịch
            </h3>
            <div className="space-y-4 mb-6">
              {[
                { label: 'Thành công', val: billing.success, color: '#10b981' },
                { label: 'Đang chờ',  val: billing.pending, color: '#f59e0b' },
                { label: 'Thất bại',  val: billing.failed,  color: '#ef4444' },
              ].map(item => {
                const t = billing.success + billing.pending + billing.failed || 1;
                return <FunnelBar key={item.label} label={item.label} value={item.val}
                  maxValue={t} color={item.color} sublabel={`${pct(item.val, t)}% tổng`} />;
              })}
            </div>
            <div className="pt-4 border-t border-gray-800">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cơ cấu theo gói</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Standard', val: uStats.byRole.standard, color: '#6366f1' },
                  { label: 'VIP',      val: uStats.byRole.vip,      color: '#f59e0b' },
                  { label: 'Admin',    val: uStats.byRole.admin,    color: '#ef4444' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-gray-950/50 rounded-xl border border-gray-800">
                    <div className="text-2xl font-black" style={{ color: item.color }}>{fmt(item.val)}</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{item.label}</div>
                    <div className="text-[10px] text-gray-700">{pct(item.val, totals.users)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
`;

writeFileSync(
  "d:\\ĐỒ ÁN THỰC TẬP\\Doantotnghiep\\client-web\\src\\pages\\Admin\\AdminDashboard.jsx",
  jsx,
  'utf8'
);
console.log('Done. Lines:', jsx.split('\n').length);
