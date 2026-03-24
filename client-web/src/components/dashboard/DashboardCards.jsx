import React from "react";
import { cn, theme } from "../../utils/dashboardTheme";

/* ── Card (Nâng cấp bo góc 24px & Soft Shadow) ──────────────────── */
export function Card({ children, theme: t, className }) {
  const th = t || theme;
  return (
    <div className={cn(
      "rounded-3xl p-5 transition-all duration-300",
      th.card, className
    )}>
      {children}
    </div>
  );
}

/* ── CardHeader ────────────────────────────────────────────────── */
export function CardHeader({ title, right, theme: t }) {
  const th = t || theme;
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className={cn("text-base font-black tracking-tight", th.text)}>{title}</h3>
      {right}
    </div>
  );
}

/* ── SmallLink ─────────────────────────────────────────────────── */
export function SmallLink({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
    >
      {children} &rarr;
    </button>
  );
}

/* ── ProgressRing ──────────────────────────────────────────────── */
/* ── ProgressRing (Compact & Elegant) ────────────────────────── */
export function ProgressRing({ percent }) {
  const deg = Math.max(0, Math.min(100, percent)) * 3.6;

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-500 hover:scale-110",
        "ring-1 ring-slate-100/50" // Thêm một lớp viền cực mảnh bên ngoài cho tinh tế
      )}
      style={{
        backgroundImage: `conic-gradient(#6366F1 ${deg}deg, #EEF2FF 0deg)`
      }}
    >
      {/* Vòng tròn trắng bên trong: Thu nhỏ xuống w-6.5 để vòng màu nhìn dày dặn hơn */}
      <div className="w-[26px] h-[26px] rounded-full bg-white flex items-center justify-center shadow-inner">
        <span className="text-[8px] font-black text-slate-700 leading-none">
          {percent}%
        </span>
      </div>
    </div>
  );
}

export function Pill({ label, onClick, emoji }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300",
        "bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
      )}
    >
      <span className="text-lg group-hover:scale-125 transition-transform">{emoji}</span>
      <span className="text-[13px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{label}</span>
    </button>
  );
}

export function QuickActionCard({ label, onClick, emoji, color = "indigo", theme: t }) {
  const colors = {
    indigo: "from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-100 hover:border-indigo-400 hover:shadow-indigo-100",
    purple: "from-purple-500/10 to-purple-600/5 text-purple-600 border-purple-100 hover:border-purple-400 hover:shadow-purple-100",
    emerald: "from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100 hover:border-emerald-400 hover:shadow-emerald-100",
    cyan: "from-cyan-500/10 to-cyan-600/5 text-cyan-600 border-cyan-100 hover:border-cyan-400 hover:shadow-cyan-100",
    amber: "from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-100 hover:border-amber-400 hover:shadow-amber-100",
  };

  const c = colors[color] || colors.indigo;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex-1 min-w-[100px] flex flex-col items-center gap-3 p-4 rounded-[28px] border bg-linear-to-b transition-all duration-500",
        "shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-95",
        c
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110",
        "bg-white shadow-sm border border-inherit/30"
      )}>
        {emoji}
      </div>
      <span className="text-[11px] font-black tracking-tighter uppercase opacity-80 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  );
}

/* ── ScoreRow (Compact & Modern) ───────────────────────────────── */
export function ScoreRow({ score, label, onClick }) {
  const band = parseFloat(score);

  // Tinh chỉnh lại màu sắc cho viền mỏng và nhạt hơn (border opacity 60%)
  const style =
    band >= 7.5 ? { color: "text-emerald-600 bg-emerald-50 border-emerald-200/60", dot: "bg-emerald-400" } :
      band >= 6 ? { color: "text-indigo-600 bg-indigo-50 border-indigo-200/60", dot: "bg-indigo-400" } :
        { color: "text-orange-600 bg-orange-50 border-orange-200/60", dot: "bg-orange-400" };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between py-2 border-b border-slate-100/60 last:border-0 group transition-all duration-300",
        onClick && "cursor-pointer hover:bg-slate-50/80 -mx-1.5 px-1.5 rounded-xl"
      )}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
        {/* Dấu chấm màu chỉ báo trạng thái */}
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />

        {/* Label với hiệu ứng trượt nhẹ khi hover */}
        <p className="text-[13px] font-semibold text-slate-600 truncate group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all">
          {label}
        </p>
      </div>

      {/* Điểm số thu gọn, có hiệu ứng nẩy nhẹ */}
      <span className={cn(
        "text-[11px] font-black px-2.5 py-0.5 rounded-lg border shrink-0 shadow-[0_1px_2px_rgb(0,0,0,0.02)] transition-all group-hover:scale-105 group-hover:shadow-sm",
        style.color
      )}>
        {score}
      </span>
    </div>
  );
}

/* ── ReminderRow ───────────────────────────────────────────────── */
export function ReminderRow({ label }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
      <p className="text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}

/* ── StatCard ─────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, accent, icon: IconComponent }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl px-6 py-4 flex flex-col gap-1 shadow-sm transition-transform hover:-translate-y-1",
      accent || "bg-white border border-slate-100"
    )}>
      {IconComponent && (
        <div className="absolute -bottom-2 -right-2 text-slate-100 opacity-40">
          <IconComponent size={60} />
        </div>
      )}
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none mt-1">{value}</p>
        {sub && <p className="text-[11px] font-bold text-indigo-500 mt-2">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Gamification: CoinBadge ──────────────────────────────────── */
export function CoinBadge({ amount }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl shrink-0 cursor-default hover:bg-amber-100 transition-colors shadow-sm">
      <span className="text-base leading-none">🪙</span>
      <span className="text-sm font-black text-amber-600">{amount}</span>
    </div>
  );
}

/* ── Gamification: StreakFlame ────────────────────────────────── */
export function StreakFlame({ days }) {
  const isHot = days >= 3;
  const isSuperHot = days >= 7;
  const isEpic = days >= 30;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-2xl border shrink-0 cursor-default transition-all shadow-sm",
      isEpic ? "bg-indigo-600 border-indigo-400 text-white" :
        isSuperHot ? "bg-orange-50 border-orange-200" :
          isHot ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
    )}>
      <div className="relative">
        <span className={cn(
          "text-lg leading-none block",
          isHot ? "animate-pulse" : "grayscale opacity-50"
        )}>
          {isEpic ? '💎' : '🔥'}
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn(
          "text-sm font-black",
          isEpic ? "text-white" : isHot ? "text-orange-600" : "text-slate-500"
        )}>{days}</span>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-tighter opacity-70",
          isEpic ? "text-white" : "text-slate-400"
        )}>Streak</span>
      </div>
    </div>
  );
}

/* ── Milestone Progress ───────────────────────────────────────── */
export function MilestoneProgress({ progress, theme: t }) {
  const { streak, next, percent } = progress;

  const getMilestoneLabel = (m) => {
    if (m <= 3) return 'ĐỒNG';
    if (m <= 7) return 'BẠC';
    if (m <= 14) return 'VÀNG';
    return 'KIM CƯƠNG';
  };

  const getMilestoneColor = (m) => {
    if (m <= 3) return 'from-orange-500 to-amber-600';
    if (m <= 7) return 'from-slate-400 to-slate-600';
    if (m <= 14) return 'from-yellow-400 to-amber-500';
    return 'from-blue-400 via-cyan-400 to-indigo-500';
  };

  const getMilestoneIcon = (m) => {
    if (m <= 3) return '🥉';
    if (m <= 7) return '🥈';
    if (m <= 14) return '🥇';
    return '💎';
  };

  return (
    <div className={cn("p-5 rounded-3xl border shadow-sm relative overflow-hidden group transition-all", t.card)}>
      <div className={cn("absolute -right-5 -top-5 w-32 h-32 rounded-full blur-2xl opacity-10 bg-gradient-to-br", getMilestoneColor(next))} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className={cn("px-2 py-1 rounded-md text-[9px] font-black tracking-widest w-fit bg-gradient-to-r text-white shadow-xs", getMilestoneColor(next))}>
              MỐC {getMilestoneLabel(next)}
            </div>
            <h4 className={cn("text-base font-black mt-1 flex items-center gap-1.5", t.text)}>
              {getMilestoneIcon(next)} Chặng đường mới
            </h4>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-3xl font-black text-orange-500 tracking-tighter">{streak}</span>
              <span className={cn("text-sm font-bold opacity-40", t.sub)}>/{next}</span>
            </div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", t.sub)}>Ngày</p>
          </div>
        </div>

        <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div
            className={cn("absolute top-0 left-0 h-full transition-all duration-1000 ease-out bg-gradient-to-r", getMilestoneColor(next))}
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs">🎁</div>
            <p className={cn("text-[11px] font-bold", t.text)}>
              Còn <span className="text-orange-500 font-black">{next - streak} ngày</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── AI Up Next Card ──────────────────────────────────────────── */
export function UpNextCard({ title, skill, duration, onClick }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 shadow-lg group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1" onClick={onClick}>
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
              ✨ AI GỢI Ý
            </span>
            <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-1 rounded-md">{duration}</span>
          </div>
          <h3 className="text-lg font-black text-white leading-tight truncate">{title}</h3>
          <p className="text-xs font-medium text-indigo-100 mt-1 truncate">Kỹ năng mục tiêu: {skill}</p>
        </div>

        <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
          <span className="text-xl ml-1">▶</span>
        </div>
      </div>
    </div>
  );
}

/* ── Activity Heatmap ─────────────────────────────────────────── */
export function ActivityHeatmap({ activeDays }) {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  return (
    <div className="flex items-center justify-between gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 mt-5">
      {days.map((day, idx) => {
        const isActive = activeDays[idx];
        return (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1">
            <div className={cn(
              "w-full aspect-square max-w-[36px] rounded-[12px] flex flex-col items-center justify-center transition-all duration-300",
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white border border-slate-200 text-slate-400"
            )}>
              <span className="text-[10px] font-black">{day}</span>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white mt-1 opacity-80" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Skill Donut Chart ──────────────────────────────────────────── */
export function SkillDonut({ skills, totalTimeStr }) {
  const timeSkills = skills.filter(s => !s.isCount);

  // Chỉ tính reduce 1 lần duy nhất
  const rawTotal = timeSkills.reduce((acc, s) => acc + s.value, 0);
  const isZero = rawTotal === 0;
  const total = rawTotal || 1; // Tránh chia cho 0 khi vẽ chart

  let acc = 0;
  const stops = timeSkills.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${s.color || '#e2e8f0'} ${start}deg ${end}deg`;
  }).join(", ");

  const bgStyle = isZero
    ? { backgroundImage: `conic-gradient(#f1f5f9 0deg, #f1f5f9 360deg)` }
    : { backgroundImage: `conic-gradient(${stops})` };

  return (
    <div className="flex flex-col items-center gap-3 mt-1 mb-1">
      {/* Circle */}
      <div className="relative w-28 h-28 rounded-full drop-shadow-sm transition-transform hover:scale-105 duration-500" style={bgStyle}>
        <div className="absolute inset-[16%] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
          <span className="text-base font-black text-slate-800 leading-none">{totalTimeStr}</span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tuần này</span>
        </div>
      </div>

      {/* Legend — 3 cols, compact */}
      <div className="w-full grid grid-cols-3 gap-1.5">
        {skills.map((s, idx) => {
          const hours = Math.floor(s.value / 60);
          const mins = s.value % 60;
          const valStr = s.isCount
            ? `${s.value}từ`
            : (s.value > 0 ? `${hours > 0 ? hours + 'h' : ''}${mins}m` : '0m');

          return (
            <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || '#cbd5e1' }} />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-slate-600 truncate leading-none">{s.label}</p>
                <p className="text-[9px] font-black text-slate-400 leading-none mt-0.5">{valStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
