import React, { useState, useEffect, useRef } from 'react';
import {
  FiUsers, FiBook, FiMic, FiVolume2,
  FiRefreshCw, FiLoader, FiTrendingUp, FiTrendingDown,
  FiZap, FiShield, FiAward, FiAlertTriangle,
  FiCheckCircle, FiAlertCircle, FiDollarSign,
} from 'react-icons/fi';
import { FaCrown, FaGraduationCap } from 'react-icons/fa';
import adminService from '../../services/adminService';

const fmt    = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : (n ?? '—'));
const fmtVND = (n) => typeof n === 'number'
  ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
  : '—';
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

function MiniDonut({ value = 0, max = 100, color = '#a78bfa', size = 52 }) {
  const r = 14, cx = 18, cy = 18, circ = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = ratio * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox="0 0 36 36">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="4" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
        {Math.round(ratio * 100)}%
      </div>
    </div>
  );
}

function StackedBar({ data = [], keys = [], colors = [], height = 180 }) {
  const maxVal = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k] || 0), 0)), 1);
  return (
    <div className="relative flex items-end gap-[3px]" style={{ height }}>
      {[0.25, 0.5, 0.75].map((f, gi) => (
        <div key={gi} className="absolute w-full border-t border-dashed border-gray-600/15 pointer-events-none"
          style={{ bottom: `${f * 100}%` }} />
      ))}
      {data.map((item, idx) => {
        const total = keys.reduce((s, k) => s + (item[k] || 0), 0);
        const barPct = Math.max((total / maxVal) * 100, total > 0 ? 3 : 0);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative z-10">
            <div className="w-full relative" style={{ height: `${barPct}%`, minHeight: total > 0 ? 3 : 0 }}>
              {total > 0 && (
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                  bg-gray-950/95 border border-gray-700/60 rounded-2xl px-3.5 py-3 text-xs text-white
                  whitespace-nowrap z-30 shadow-2xl pointer-events-none transition-all duration-150">
                  <div className="font-bold text-gray-200 mb-2 pb-1.5 border-b border-gray-800">{item.label}</div>
                  {keys.map((k, ki) => (
                    <div key={k} className="flex items-center gap-2 py-0.5">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[ki] }} />
                      <span className="text-gray-400 capitalize">{k}:</span>
                      <span className="font-black ml-auto pl-3">{item[k] || 0}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-800 mt-1.5 pt-1.5 flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-black text-white">{total}</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col-reverse overflow-hidden"
                style={{ borderRadius: '4px 4px 0 0' }}>
                {keys.map((k, ki) => {
                  const seg = item[k] || 0;
                  const segPct = total > 0 ? (seg / total) * 100 : 0;
                  const isTop = ki === keys.length - 1;
                  return (
                    <div key={k}
                      style={{
                        height: `${segPct}%`,
                        backgroundColor: colors[ki],
                        borderRadius: isTop ? '4px 4px 0 0' : '0',
                      }}
                      className="w-full group-hover:brightness-125 transition-all duration-200" />
                  );
                })}
              </div>
            </div>
            <span className="text-[9px] text-gray-600 font-medium group-hover:text-gray-400 transition-colors">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Area Revenue Chart (pure SVG, no library) ────────────────────────────────
function AreaRevenueChart({ data = [], height = 220 }) {
  const [tooltip, setTooltip] = React.useState(null);
  const [hovIdx, setHovIdx]   = React.useState(null);
  const svgRef = useRef(null);
  const W = 800, H = height;
  const PAD = { top: 20, right: 16, bottom: 28, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const n = data.length;

  const pts = data.map((d, i) => ({
    x: PAD.left + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: PAD.top  + chartH - (d.revenue / maxVal) * chartH,
    ...d,
  }));

  const makeLinePath = (points) =>
    points.map((p, i) => {
      if (i === 0) return 'M ' + p.x.toFixed(1) + ',' + p.y.toFixed(1);
      const prev = points[i - 1];
      const cpx = ((prev.x + p.x) / 2).toFixed(1);
      return 'C ' + cpx + ',' + prev.y.toFixed(1) + ' ' + cpx + ',' + p.y.toFixed(1) + ' ' + p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');

  const linePath = pts.length > 0 ? makeLinePath(pts) : '';
  const areaPath = pts.length > 0
    ? linePath + ' L ' + pts[pts.length - 1].x.toFixed(1) + ',' + (PAD.top + chartH).toFixed(1)
      + ' L ' + pts[0].x.toFixed(1) + ',' + (PAD.top + chartH).toFixed(1) + ' Z'
    : '';

  const onMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bestD = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.x - mx); if (d < bestD) { bestD = d; best = i; } });
    setHovIdx(best);
    setTooltip({ tx: (pts[best].x / W) * 100, ty: (pts[best].y / H) * 100, ...data[best] });
  };

  const fmtV = (n) => typeof n === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
    : '—';

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg ref={svgRef} viewBox={'0 0 ' + W + ' ' + H} className="w-full h-full cursor-crosshair"
        onMouseMove={onMove} onMouseLeave={() => { setTooltip(null); setHovIdx(null); }}>
        <defs>
          <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.30" />
            <stop offset="65%"  stopColor="#f59e0b" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
          </linearGradient>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Dashed horizontal grid — axis lines hidden, opacity 10% only */}
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i}
            x1={PAD.left} y1={(PAD.top + chartH * f).toFixed(1)}
            x2={(PAD.left + chartW).toFixed(1)} y2={(PAD.top + chartH * f).toFixed(1)}
            stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" opacity="0.10" />
        ))}

        {/* Area gradient */}
        {areaPath && <path d={areaPath} fill="url(#revAreaGrad)" />}

        {/* Glow behind line on hover */}
        {hovIdx !== null && linePath && (
          <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="8"
            opacity="0.18" filter="url(#lineGlow)" strokeLinecap="round" />
        )}

        {/* Main gold line — 2.5px smooth monotone */}
        {linePath && (
          <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* X labels — no axis bar */}
        {pts.map((p, i) => (
          <text key={i} x={p.x.toFixed(1)} y={(H - 4).toFixed(1)}
            textAnchor="middle" fontSize="10"
            fill={hovIdx === i ? '#fbbf24' : '#4b5563'}
            fontWeight={hovIdx === i ? '700' : '500'}>
            {p.label}
          </text>
        ))}

        {/* Hover: vertical rule + dot glow */}
        {hovIdx !== null && pts[hovIdx] && (() => {
          const p = pts[hovIdx];
          return (
            <g>
              <line x1={p.x.toFixed(1)} y1={p.y.toFixed(1)}
                x2={p.x.toFixed(1)} y2={(PAD.top + chartH).toFixed(1)}
                stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.25" />
              <circle cx={p.x} cy={p.y} r="12" fill="#f59e0b" opacity="0.12" filter="url(#dotGlow)" />
              <circle cx={p.x} cy={p.y} r="5"  fill="#f59e0b" />
              <circle cx={p.x} cy={p.y} r="2.5" fill="white" />
            </g>
          );
        })()}
      </svg>

      {/* Tooltip: dark glass, rounded, drop-shadow */}
      {tooltip && (
        <div className="absolute pointer-events-none z-30"
          style={{
            left:      'clamp(2%, ' + tooltip.tx + '%, 78%)',
            top:       Math.max(tooltip.ty - 30, 0) + '%',
            transform: 'translateX(-50%)',
          }}>
          <div className="bg-gray-950 border border-amber-500/30 rounded-2xl px-4 py-3 shadow-2xl min-w-[155px]"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.15)' }}>
            <div className="text-[11px] text-gray-500 font-semibold mb-1">{tooltip.label}</div>
            <div className="text-xl font-black text-amber-400 tracking-tight leading-none">{fmtV(tooltip.revenue)}</div>
            {tooltip.count != null && tooltip.count > 0 && (
              <div className="text-xs text-gray-600 mt-1.5 border-t border-gray-800 pt-1.5">
                {tooltip.count.toLocaleString('vi-VN')} giao dịch
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleDonut({ segments = [], total = 0 }) {
  const r = 42, cx = 56, cy = 56, circ = 2 * Math.PI * r;
  const safeTotal = total || 1;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
        <svg className="-rotate-90" width={112} height={112} viewBox="0 0 112 112">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111827" strokeWidth="14" />
          {segments.map((seg, i) => {
            const dash = (seg.count / safeTotal) * circ;
            const cur = offset; offset += dash;
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
              strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-cur} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{fmt(total)}</span>
          <span className="text-[9px] text-gray-500">users</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1">
        {segments.map((seg) => (
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

function FunnelBar({ label, value, maxValue, color, sublabel }) {
  const w = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">{fmt(value)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      {sublabel && <div className="text-[10px] text-gray-600">{sublabel}</div>}
    </div>
  );
}

function PulseCard({ icon: Icon, label, mainValue, trendLabel, trendUp, accent, children }) {
  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all duration-300 overflow-hidden">
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: accent }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}20`, color: accent }}>
            <Icon size={17} />
          </div>
        </div>
        <div className="text-4xl font-black text-white mb-2 tabular-nums">{mainValue}</div>
        {trendLabel && (
          <div className="flex items-center gap-1 text-xs">
            {trendUp ? <FiTrendingUp size={12} className="text-emerald-400" /> : <FiTrendingDown size={12} className="text-rose-400" />}
            <span className={trendUp ? 'text-emerald-400' : 'text-rose-400'}>{trendLabel}</span>
          </div>
        )}
        {children && <div className="mt-4 pt-4 border-t border-gray-800">{children}</div>}
      </div>
    </div>
  );
}

function AlertItem({ icon: Icon, label, value, color, desc }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20`, color }}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        {desc && <div className="text-[11px] text-gray-600 truncate">{desc}</div>}
      </div>
      <div className="text-sm font-bold shrink-0" style={{ color }}>{value}</div>
    </div>
  );
}

function SectionLabel({ color, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-1 h-5 rounded-full ${color}`} />
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{children}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [year, setYear]         = useState(new Date().getFullYear());
  const [loading, setLoading]   = useState(true);
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
    Array.from({ length: 12 }, (_, i) => ({ label: `T${i + 1}`, topics: 0, speaking: 0, writing: 0 }))
  );
  const [billing, setBilling] = useState({ totalRevenue: 0, success: 0, pending: 0, failed: 0 });
  const [revenueMonthly, setRevenueMonthly] = useState([]);

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
        if (d.monthly?.length) setMonthly(d.monthly.map(m => ({ label: `T${m.month}`, topics: m.topics || 0, speaking: m.speaking || 0, writing: m.writing || 0 })));
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
      if (r6.status === 'fulfilled') { const d = r6.value.data.data; setRevenueMonthly(d.byMonth || []); }
      if (r7.status === 'fulfilled') { const d = r7.value.data.data; setTotals(p => ({ ...p, speakingActive: d.active || 0 })); }
    } catch (e) { console.error('Dashboard load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }

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

  const revenueChartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const found = revenueMonthly.find(r => r._id?.month === m);
    return { label: `T${m}`, revenue: found?.revenue || 0 };
  });
  const maxRevenue = Math.max(...revenueChartData.map(r => r.revenue), 1);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <FiLoader className="animate-spin text-purple-400" size={32} />
      <span className="text-gray-500 text-sm">Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-12 text-gray-100">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            HIDAY ENGLISH Admin Panel &middot;{' '}
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2.5 shadow-xl">
          <span className="text-xs text-gray-600 font-medium">Năm</span>
          <select value={year} onChange={e => setYear(+e.target.value)} className="bg-transparent text-sm text-white focus:outline-none cursor-pointer">
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

      {/* TẦNG 1 */}
      <section>
        <SectionLabel color="bg-sky-500">Tầng 1 · The Pulse — Nhịp đập hệ thống</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <PulseCard icon={FiUsers} label="User Base" accent="#22d3ee"
            mainValue={fmt(totals.users)} trendLabel={`${fmt(uStats.active)} đang hoạt động`} trendUp={true}>
            <div className="flex items-center gap-3">
              <MiniDonut value={uStats.active} max={totals.users} color="#22d3ee" size={48} />
              <div className="text-xs text-gray-500 leading-relaxed space-y-0.5">
                <div><span className="text-white font-bold">{verifiedP}%</span> đã xác thực</div>
                <div><span className="text-white font-bold">{onboardedP}%</span> đã onboard</div>
                <div><span className="text-red-400 font-bold">{fmt(uStats.banned)}</span> bị khoá</div>
              </div>
            </div>
          </PulseCard>

          <PulseCard icon={FiDollarSign} label="Doanh thu thực tế" accent="#f59e0b"
            mainValue={billing.totalRevenue > 0 ? `${(billing.totalRevenue / 1e6).toFixed(1)}M ₫` : '—'}
            trendLabel={`${fmt(billing.success)} giao dịch thành công`} trendUp={billing.success > 0}>
            <div className="flex items-center gap-3">
              <MiniDonut value={uStats.byRole.vip} max={totals.users} color="#f59e0b" size={48} />
              <div className="text-xs text-gray-500 leading-relaxed space-y-0.5">
                <div><span className="text-white font-bold">{fmt(uStats.byRole.vip)}</span> VIP</div>
                <div><span className="text-amber-400 font-bold">{fmt(billing.pending)}</span> chờ xử lý</div>
                <div><span className="text-red-400 font-bold">{fmt(billing.failed)}</span> thất bại</div>
              </div>
            </div>
          </PulseCard>

          <PulseCard icon={FiZap} label="Engagement Rate" accent="#a78bfa"
            mainValue={`${activeP}%`} trendLabel={`${verifiedP}% đã xác thực email`} trendUp={activeP > 50}>
            <div className="space-y-2">
              {[
                { label: 'Online',  val: uStats.active,     max: totals.users, color: '#22d3ee' },
                { label: 'Onboard', val: uStats.onboarded,  max: totals.users, color: '#a78bfa' },
                { label: 'VIP',     val: uStats.byRole.vip, max: totals.users, color: '#f59e0b' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-white font-bold">{pct(item.val, item.max)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct(item.val, item.max)}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </PulseCard>

          <PulseCard icon={FiBook} label="Kho nội dung" accent="#10b981"
            mainValue={fmt(totalContent)} trendLabel="Tổng tất cả loại nội dung" trendUp={totalContent > 0}>
            <div className="space-y-1.5 text-xs">
              {[
                ['Topics',    totals.topics,    '#a78bfa'],
                ['Speaking',  totals.speaking,  '#60a5fa'],
                ['Writing',   totals.writing,   '#f472b6'],
                ['Vocab',     totals.vocab,     '#34d399'],
                ['Reading',   totals.reading,   '#fbbf24'],
                ['Listening', totals.listening, '#818cf8'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-14 text-gray-500 shrink-0">{k}</span>
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

      {/* TẦNG 2 */}
      <section>
        <SectionLabel color="bg-purple-500">Tầng 2 · The Engine — Động cơ tăng trưởng</SectionLabel>
        <div className="grid grid-cols-12 gap-5">

          <div className="col-span-12 lg:col-span-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Nội dung tạo mới theo tháng</h3>
                <p className="text-xs text-gray-600 mt-0.5">Topics · Speaking · Writing — {year}</p>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                {[['Topics','#a78bfa'],['Speaking','#60a5fa'],['Writing','#f472b6']].map(([k, c]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />{k}
                  </div>
                ))}
              </div>
            </div>
            <StackedBar data={monthly} keys={['topics','speaking','writing']}
              colors={['#a78bfa','#60a5fa','#f472b6']} height={200} />
          </div>

          <div className="col-span-12 lg:col-span-4 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">User Funnel</h3>
            <p className="text-xs text-gray-600 mb-5">Phân tích dropout người dùng</p>
            <div className="space-y-5">
              <FunnelBar label="Tổng đăng ký"     value={totals.users}      maxValue={totals.users} color="#6366f1" sublabel="100% baseline" />
              <FunnelBar label="Đã xác thực"       value={uStats.verified}   maxValue={totals.users} color="#22d3ee" sublabel={`Dropout: ${fmt(totals.users - uStats.verified)} người`} />
              <FunnelBar label="Đã onboard"         value={uStats.onboarded}  maxValue={totals.users} color="#a78bfa" sublabel={`Dropout: ${fmt(uStats.verified - uStats.onboarded)} người`} />
              <FunnelBar label="Đang hoạt động"    value={uStats.active}     maxValue={totals.users} color="#10b981" sublabel={`${activeP}% retention rate`} />
            </div>
            {totals.users > 0 && (() => {
              const steps = [
                { label: 'Xác thực email',     drop: totals.users     - uStats.verified  },
                { label: 'Hoàn thành onboard', drop: uStats.verified  - uStats.onboarded },
                { label: 'Giữ chân active',    drop: uStats.onboarded - uStats.active    },
              ];
              const worst = steps.reduce((a, b) => b.drop > a.drop ? b : a, steps[0]);
              if (worst.drop > 0) return (
                <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <FiAlertTriangle size={12} /> Điểm dropout lớn nhất
                  </div>
                  <div className="text-gray-400">{worst.label}: <span className="text-white font-bold">{fmt(worst.drop)}</span> người</div>
                </div>
              );
              return null;
            })()}
          </div>

        </div>
      </section>

      {/* REVENUE CHART — Area + Gradient */}
      <section>
        <SectionLabel color="bg-amber-500">Doanh thu thực tế theo tháng — {year}</SectionLabel>
        <div className="bg-gray-900 border border-amber-500/10 hover:border-amber-500/20 rounded-2xl p-6 shadow-lg transition-colors">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Revenue Flow — {year}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tổng tích luỹ:{' '}
                <span className="text-amber-400 font-bold">{fmtVND(billing.totalRevenue)}</span>
                {' · '}{fmt(billing.success)} GD thành công{' · '}
                <span className="text-amber-300">{fmt(billing.pending)}</span> chờ{' · '}
                <span className="text-red-400">{fmt(billing.failed)}</span> thất bại
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/50 border border-gray-700/40 rounded-xl px-3 py-1.5 shrink-0">
              <span className="w-7 h-[2px] rounded bg-amber-400 inline-block" />
              <span>Di chuột để xem chi tiết</span>
            </div>
          </div>
          <AreaRevenueChart data={revenueChartData} height={220} />
        </div>
      </section>
      {/* TẦNG 3 */}
      <section>
        <SectionLabel color="bg-emerald-500">Tầng 3 · The Warehouse — Kho dữ liệu</SectionLabel>
        <div className="grid grid-cols-12 gap-5">

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Tổng nội dung theo loại</h3>
            <p className="text-xs text-gray-600 mb-5">Số lượng hiện có trong hệ thống</p>
            <div className="space-y-4">
              {[
                { label: 'Topics',    val: totals.topics,          color: '#a78bfa', emoji: '📚', sub: `Chủ đề IELTS` },
                { label: 'Speaking',  val: totals.speaking,         color: '#60a5fa', emoji: '🎤', sub: `${totals.speakingActive} đang active` },
                { label: 'Writing',   val: totals.writing,          color: '#f472b6', emoji: '✍️', sub: `Đề bài viết` },
                { label: 'Từ vựng',   val: totals.vocab,            color: '#34d399', emoji: '📖', sub: `Từ trong ngân hàng` },
                { label: 'Reading',   val: totals.reading,          color: '#fbbf24', emoji: '📰', sub: `Bài đọc` },
                { label: 'Listening', val: totals.listening,        color: '#818cf8', emoji: '🎧', sub: `${totals.listeningActive} đang active` },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="text-base w-6 shrink-0">{item.emoji}</span>
                    <span className="text-sm text-gray-400 w-20 shrink-0">{item.label}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct(item.val, contentMax), item.val > 0 ? 2 : 0)}%`, backgroundColor: item.color }} />
                    </div>
                    <span className="text-sm font-bold text-white w-8 text-right">{item.val}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 pl-9">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Phân bổ vai trò</h3>
            <p className="text-xs text-gray-600 mb-5">Cơ cấu tài khoản theo quyền hạn</p>
            <RoleDonut segments={roleSegments} total={totals.users} />
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Đang hoạt động', val: uStats.active,    color: 'text-emerald-400', Icon: FiCheckCircle },
                { label: 'Bị khoá',        val: uStats.banned,    color: 'text-rose-400',    Icon: FiAlertCircle },
                { label: 'Đã xác thực',    val: uStats.verified,  color: 'text-sky-400',     Icon: FiShield },
                { label: 'Đã onboard',     val: uStats.onboarded, color: 'text-purple-400',  Icon: FaGraduationCap },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2.5 p-3 bg-gray-800/50 rounded-xl border border-gray-800">
                  <m.Icon size={14} className={m.color} />
                  <div>
                    <div className={`text-lg font-black ${m.color}`}>{fmt(m.val)}</div>
                    <div className="text-[11px] text-gray-600">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* TẦNG 4 */}
      <section>
        <SectionLabel color="bg-rose-500">Tầng 4 · The Action Center — Trung tâm vận hành</SectionLabel>
        <div className="grid grid-cols-12 gap-5">

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FiAward size={16} className="text-amber-400" /> Chỉ số hệ thống
            </h3>
            <div className="space-y-2">
              <AlertItem icon={FiUsers}      label="Tổng người dùng"       value={fmt(totals.users)}                           color="#22d3ee" desc={`${fmt(uStats.active)} online · ${fmt(uStats.banned)} bị khoá`} />
              <AlertItem icon={FiBook}       label="Tổng nội dung"         value={fmt(totalContent)}                           color="#a78bfa" desc="Topics + Speaking + Writing + Vocab + Reading + Listening" />
              <AlertItem icon={FiDollarSign} label="Doanh thu tích luỹ"    value={fmtVND(billing.totalRevenue)}                color="#f59e0b" desc={`${fmt(billing.success)} giao dịch · ${fmt(billing.pending)} chờ`} />
              <AlertItem icon={FaCrown}      label="Tài khoản VIP"         value={fmt(uStats.byRole.vip)}                      color="#f59e0b" desc={`${vipP}% tổng người dùng`} />
              <AlertItem icon={FiShield}     label="Tài khoản bị khoá"     value={fmt(uStats.banned)}                          color={uStats.banned > 0 ? '#ef4444' : '#10b981'} desc={uStats.banned > 0 ? 'Cần kiểm tra' : 'Hệ thống sạch'} />
              <AlertItem icon={FiMic}        label="Speaking đang active"  value={fmt(totals.speakingActive)}                  color="#60a5fa" desc={`Trên tổng ${fmt(totals.speaking)}`} />
              <AlertItem icon={FiVolume2}    label="Listening đang active" value={fmt(totals.listeningActive)}                 color="#818cf8" desc={`Trên tổng ${fmt(totals.listening)}`} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FiAlertTriangle size={16} className="text-rose-400" /> Trạng thái giao dịch
            </h3>
            <div className="space-y-4 mb-6">
              {[
                { label: 'Thành công', val: billing.success, color: '#10b981' },
                { label: 'Đang chờ',  val: billing.pending, color: '#f59e0b' },
                { label: 'Thất bại',  val: billing.failed,  color: '#ef4444' },
              ].map(item => {
                const total = billing.success + billing.pending + billing.failed || 1;
                return <FunnelBar key={item.label} label={item.label} value={item.val}
                  maxValue={total} color={item.color} sublabel={`${pct(item.val, total)}% tổng giao dịch`} />;
              })}
            </div>
            <div className="pt-4 border-t border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cơ cấu người dùng theo gói</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Standard', val: uStats.byRole.standard, color: '#6366f1' },
                  { label: 'VIP',      val: uStats.byRole.vip,      color: '#f59e0b' },
                  { label: 'Admin',    val: uStats.byRole.admin,    color: '#ef4444' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-gray-800/50 rounded-xl border border-gray-800">
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
