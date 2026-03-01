const fs = require('fs');console.log("script ok")
const path = 'd:\\ĐỒ ÁN THỰC TẬP\\Doantotnghiep\\client-web\\src\\pages\\Admin\\AdminDashboard.jsx';
let c = fs.readFileSync(path, 'utf8');

// ── 1) Add useRef import ──────────────────────────────────────────────────────
c = c.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

// ── 2) Replace StackedBar (find bounds by unique markers) ─────────────────────
const SB_OPEN  = 'function StackedBar({ data = [], keys = [], colors = [], height = 180 }) {';
const SB_CLOSE = '\nfunction RoleDonut(';
const sbStart  = c.indexOf(SB_OPEN);
const sbEnd    = c.indexOf(SB_CLOSE);
if (sbStart < 0 || sbEnd < 0) { console.error('StackedBar bounds not found', sbStart, sbEnd); process.exit(1); }

const newStackedBarPlusArea = `function StackedBar({ data = [], keys = [], colors = [], height = 180 }) {
  const maxVal = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k] || 0), 0)), 1);
  return (
    <div className="relative flex items-end gap-[3px]" style={{ height }}>
      {[0.25, 0.5, 0.75].map((f, gi) => (
        <div key={gi} className="absolute w-full border-t border-dashed border-gray-600/15 pointer-events-none"
          style={{ bottom: \`\${f * 100}%\` }} />
      ))}
      {data.map((item, idx) => {
        const total = keys.reduce((s, k) => s + (item[k] || 0), 0);
        const barPct = Math.max((total / maxVal) * 100, total > 0 ? 3 : 0);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative z-10">
            <div className="w-full relative" style={{ height: \`\${barPct}%\`, minHeight: total > 0 ? 3 : 0 }}>
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
                        height: \`\${segPct}%\`,
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
`;

c = c.slice(0, sbStart) + newStackedBarPlusArea + c.slice(sbEnd);

// ── 3) Replace Revenue bar chart section with AreaRevenueChart ────────────────
const REV_OPEN  = '      {/* REVENUE CHART */}';
const REV_CLOSE = '\n      {/* TẦNG 3 */}';
const revStart  = c.indexOf(REV_OPEN);
const revEnd    = c.indexOf(REV_CLOSE);
if (revStart < 0 || revEnd < 0) { console.error('Revenue section not found', revStart, revEnd); process.exit(1); }

const newRevSection = `      {/* REVENUE CHART — Area + Gradient */}
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
      </section>`;

c = c.slice(0, revStart) + newRevSection + c.slice(revEnd);

// ── 4) Verify ─────────────────────────────────────────────────────────────────
const checks = {
  'AreaRevenueChart defined': c.includes('function AreaRevenueChart'),
  'roundedTop':               c.includes('borderRadius: isTop ?'),
  'revAreaGrad':              c.includes('revAreaGrad'),
  'lineGlow filter':          c.includes('lineGlow'),
  'dotGlow filter':           c.includes('dotGlow'),
  'AreaRevenueChart used':    c.includes('<AreaRevenueChart'),
  'noMockTopics':             !c.includes('topTopics'),
  'noMockUsers':              !c.includes('topUsers'),
  'useRef added':             c.includes('useRef'),
};

let ok = true;
for (const [k, v] of Object.entries(checks)) {
  console.log((v ? '✓' : '✗'), k);
  if (!v) ok = false;
}

if (!ok) { console.error('\nSome checks failed!'); process.exit(1); }

fs.writeFileSync(path, c, 'utf8');
console.log('\nSUCCESS. Total lines:', c.split('\n').length);
