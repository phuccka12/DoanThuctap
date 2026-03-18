import React from "react";
import { cn, theme } from "../../utils/dashboardTheme";

/* ── Card (Nâng cấp bo góc 24px & Soft Shadow) ──────────────────── */
export function Card({ children, theme: t, className }) {
  const th = t || theme;
  return (
    <div className={cn(
      "rounded-3xl border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-lg",
      th.border, th.card, className
    )}>
      {children}
    </div>
  );
}

/* ── CardHeader ────────────────────────────────────────────────── */
export function CardHeader({ title, right, theme: t }) {
  const th = t || theme;
  return (
    <div className="flex items-center justify-between mb-5">
      <p className={cn("text-base font-bold tracking-tight", th.text)}>{title}</p>
      {right}
    </div>
  );
}

/* ── SmallLink ─────────────────────────────────────────────────── */
export function SmallLink({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
    >
      {children} &rarr;
    </button>
  );
}

/* ── ProgressRing (Cập nhật màu Indigo mới) ────────────────────── */
export function ProgressRing({ percent }) {
  const deg = Math.max(0, Math.min(100, percent)) * 3.6;
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm"
      style={{ backgroundImage: `conic-gradient(#6366F1 ${deg}deg, #EEF2FF 0deg)` }}
    >
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-inner">
        <span className="text-[10px] font-black text-slate-700">{percent}%</span>
      </div>
    </div>
  );
}

/* ── TaskRow ───────────────────────────────────────────────────── */
export function TaskRow({ title, subtitle, percent }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-xl last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
        {subtitle && <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <ProgressRing percent={percent} />
    </div>
  );
}

/* ── Pill (Quick Action) ───────────────────────────────────────── */
export function Pill({ label, onClick, emoji }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:border-[#6366F1]/40 hover:text-[#6366F1] hover:bg-indigo-50/50 hover:shadow-sm transition-all active:scale-95"
    >
      {emoji && <span className="text-base">{emoji}</span>}
      {label}
    </button>
  );
}

/* ── ScoreRow ──────────────────────────────────────────────────── */
export function ScoreRow({ score, label }) {
  const band = parseFloat(score);
  const color =
    band >= 7.5 ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
      band >= 6 ? "text-[#6366F1] bg-indigo-50 border-indigo-100" :
        "text-orange-600 bg-orange-50 border-orange-100";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <p className="text-sm font-medium text-slate-600 truncate flex-1">{label}</p>
      <span className={cn("text-xs font-black px-3 py-1.5 rounded-xl border shrink-0", color)}>
        {score}
      </span>
    </div>
  );
}

/* ── ReminderRow ───────────────────────────────────────────────── */
export function ReminderRow({ label }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="w-2 h-2 rounded-full bg-[#6366F1] shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
      <p className="text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}

/* ── StatCard (Hero numbers, thêm Icon nền) ───────────────────── */
export function StatCard({ label, value, sub, accent, icon: IconComponent }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl px-6 py-5 flex flex-col gap-1.5 shadow-sm transition-transform hover:-translate-y-1",
      accent || "bg-white border border-slate-100"
    )}>
      {IconComponent && (
        <div className="absolute -bottom-4 -right-4 text-slate-100 opacity-60">
          <IconComponent size={100} />
        </div>
      )}
      <div className="relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-800 leading-none mt-1">{value}</p>
        {sub && <p className="text-xs font-bold text-[#6366F1] mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── SkillBar — defined once below near DailyQuestCard ───────── */

/* ── TimeDonut ────────────────────────────────────────────────── */
export function TimeDonut({ segments, centerTop, centerBottom }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    return `${s.color} ${start}deg ${(acc / total) * 360}deg`;
  }).join(", ");

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-40 h-40 rounded-full shadow-sm" style={{ backgroundImage: `conic-gradient(${stops})` }}>
        <div className="absolute inset-5 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
          <span className="text-2xl font-black text-slate-800">{centerTop}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{centerBottom}</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-3.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md shadow-sm" style={{ background: s.color }} />
              <span className="font-semibold text-slate-600">{s.label}</span>
            </div>
            <span className="font-black text-slate-800">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Gamification: CoinBadge ──────────────────────────────────── */
export function CoinBadge({ amount }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl shrink-0 cursor-default hover:bg-amber-100 transition-colors">
      <span className="text-base leading-none">🪙</span>
      <span className="text-sm font-black text-amber-600">{amount}</span>
    </div>
  );
}

/* ── Gamification: StreakFlame ────────────────────────────────── */
export function StreakFlame({ days }) {
  const isHot = days >= 3;
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shrink-0 cursor-default transition-all",
      isHot ? "bg-red-50 border-red-200 hover:bg-red-100" : "bg-slate-50 border-slate-200"
    )}>
      <span className={cn("text-base leading-none", isHot ? "animate-pulse" : "grayscale opacity-50")}>🔥</span>
      <span className={cn(
        "text-sm font-black",
        isHot ? "text-red-500" : "text-slate-500"
      )}>{days}</span>
    </div>
  );
}


/* ── 1. AI Up Next Card (Học tiếp bài này nhé) ──────────────────── */
export function UpNextCard({ title, skill, duration, onClick }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#6366F1] to-[#8B5CF6] p-6 shadow-[0_10px_30px_rgba(99,102,241,0.3)] group cursor-pointer" onClick={onClick}>
      {/* Hiệu ứng tia sáng chéo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/20 px-2 py-0.5 rounded-lg backdrop-blur-sm">
              ✨ AI GỢI Ý
            </span>
            <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-lg">{duration}</span>
          </div>
          <h3 className="text-xl font-black text-white leading-tight mt-1">{title}</h3>
          <p className="text-sm font-medium text-indigo-100 mt-1">Kỹ năng: {skill}</p>
        </div>

        {/* Nút Play siêu to */}
        <div className="w-14 h-14 rounded-full bg-white text-[#6366F1] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0">
          <span className="text-xl ml-1">▶</span>
        </div>
      </div>
    </div>
  );
}

/* ── 2. Daily Quest Card ────────────────────────────────────────── */
export function DailyQuestCard({ quests }) {
  const done = quests.filter((q) => q.isDone).length;
  const total = quests.length;
  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Nhiệm vụ hôm nay"
        right={
          total > 0
            ? <span className="text-[11px] font-black text-white bg-[#6366F1] px-2.5 py-1 rounded-lg shadow-sm">{done}/{total} Xong</span>
            : null
        }
      />
      {total === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Hôm nay chưa có nhiệm vụ 🎉</p>
      ) : (
        <div className="space-y-3 mt-1">
          {quests.map((q, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-100 transition-all">

              {/* Checkbox Icon - Làm nhỏ lại và tinh tế hơn */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-sm",
                q.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 text-transparent"
              )}>
                <span className="text-[10px] font-black">{q.isDone ? "✓" : ""}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold truncate", q.isDone ? "text-slate-400 line-through" : "text-slate-700")}>
                  {q.title}
                </p>
                {/* Thanh tiến độ có viền bọc rõ ràng, không bị giống gạch chân nữa */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", q.isDone ? "bg-emerald-500" : "bg-[#6366F1]")}
                    style={{ width: `${Math.max(5, (q.progress / q.total) * 100)}%` }} // Ít nhất 5% để thấy cái đầu vạch
                  />
                </div>
              </div>

              {/* Tiền thưởng - Căn chỉnh lại cho gọn */}
              <div className="flex items-center gap-1 bg-amber-100/80 px-2.5 py-1.5 rounded-xl border border-amber-200/50 shrink-0">
                <span className="text-[12px] leading-none">🪙</span>
                <span className="text-xs font-black text-amber-600">+{q.reward}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── 3. Activity Heatmap (Gom gọn chữ vào trong ô tròn/vuông) ────────────── */
export function ActivityHeatmap({ activeDays }) {
  // activeDays = [true, false, true, true, false, false, true] (Từ T2 -> CN)
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/60 mt-4">
      {days.map((day, idx) => {
        const isActive = activeDays[idx];
        return (
          <div key={idx} className="flex flex-col items-center gap-1 relative group cursor-pointer">
            <div className={cn(
              "w-8 h-9 rounded-[10px] flex flex-col items-center justify-center transition-all duration-300 shadow-sm",
              isActive
                ? "bg-linear-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-[#6366F1]/30 hover:-translate-y-1"
                : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-100"
            )}>
              <span className={cn("text-[10px] font-black", isActive ? "text-white" : "text-slate-400")}>{day}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 animate-pulse" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 4. Skill Bar (Sửa lại rãnh trượt cho sắc nét) ───────────────────────── */
export function SkillBar({ label, value, total, color, isCount }) {
  const pct = isCount 
    ? Math.min(100, Math.round((value / (total || 100)) * 100))
    : (total > 0 ? Math.round((value / total) * 100) : 0);
    
  const h = Math.floor(value / 60);
  const m = value % 60;
  
  const displayValue = isCount 
    ? `${value} từ` 
    : (value > 0 ? `${h > 0 ? h + "h " : ""}${m}m` : "0m");

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
          {displayValue}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.max(2, pct)}%`, // Cho nó 2% tổi thiểu để không bị tàng hình
            background: pct > 0 ? (color || "#6366F1") : "#CBD5E1" // Xám đậm hơn chút nếu chưa có điểm
          }}
        />
      </div>
    </div>
  );
}