import React from "react";
import { FaClipboardCheck, FaCoins } from "react-icons/fa";
import { cn, theme } from "../../utils/dashboardTheme";

/* ---------- Card ---------- */
export function Card({ children, theme: t }) {
  const th = t || theme;
  return (
    <div className={cn("rounded-3xl border", th.border, th.card, "p-4 md:p-4")}>
      {children}
    </div>
  );
}

/* ---------- CardHeader ---------- */
export function CardHeader({ title, right, theme: t }) {
  const th = t || theme;
  return (
    <div className="flex items-center justify-between">
      <div className={cn("text-base font-bold", th.text)}>{title}</div>
      {right}
    </div>
  );
}

/* ---------- SmallLink ---------- */
export function SmallLink({ children, onClick, theme: t }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-medium text-[#6C5CE7] hover:text-[#8E44AD] transition"
    >
      {children} →
    </button>
  );
}

/* ---------- ProgressRing ---------- */
export function ProgressRing({ percent }) {
  const deg = Math.max(0, Math.min(100, percent)) * 3.6;
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center"
      style={{ backgroundImage: `conic-gradient(#6C5CE7 ${deg}deg, #e5e7eb 0deg)` }}
    >
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-purple-200 shadow-sm">
        <div className="text-xs font-bold text-gray-800">{percent}%</div>
      </div>
    </div>
  );
}

/* ---------- TaskRow ---------- */
export function TaskRow({ title, subtitle, percent, icon }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-[#A29BFE]/10 p-3 hover:shadow-md transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 flex items-center justify-center text-[#6C5CE7] text-lg shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <div className={cn("text-sm font-semibold truncate", theme.text)}>{title}</div>
          <div className={cn("text-xs truncate", theme.sub)}>{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Coin reward badge */}
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded-full text-xs font-semibold text-yellow-700">
          <FaCoins className="text-yellow-600" /> <span>+50</span>
        </div>

        <ProgressRing percent={percent} />
      </div>
    </div>
  );
}

/* ---------- TimeDonut ---------- */
export function TimeDonut({ segments, centerTop, centerBottom }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = (acc / total) * 360;
      acc += s.value;
      const end = (acc / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-52 h-52 rounded-full shadow-md" style={{ backgroundImage: `conic-gradient(${stops})` }}>
        <div className="absolute inset-5 rounded-full bg-white border border-purple-200 flex flex-col items-center justify-center shadow-sm">
          <div className={cn("text-2xl font-bold", theme.text)}>{centerTop}</div>
          <div className={cn("text-base", theme.sub)}>{centerBottom}</div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <div className={cn("text-base font-bold", theme.text)}>Good job, keep going! 🎯</div>
        <div className="mt-4 space-y-3">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: s.color }} />
                <span className="text-gray-700 font-medium">{s.label}</span>
              </div>
              <span className="text-gray-600 font-semibold">{Math.round((s.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Pill ---------- */
export function Pill({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-purple-200 bg-white text-base text-gray-700 hover:bg-[#A29BFE]/20 hover:border-[#6C5CE7] transition shadow-sm hover:shadow-md"
    >
      <span className="text-[#6C5CE7] text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

/* ---------- ProfileCard ---------- */
export function ProfileCard({ user }) {
  return (
    <div className={cn("rounded-3xl border", theme.border, theme.card, "p-6")}>
      <div className="flex items-center justify-between">
        <div className={cn("text-base font-bold", theme.text)}>Profile</div>
        <button className="text-sm font-medium text-[#6C5CE7] hover:text-[#8E44AD] transition">Edit</button>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-linear-to-tr from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white font-bold text-3xl shadow-lg">
          {user.initials}
        </div>
        <div className={cn("mt-4 font-bold text-xl", theme.text)}>{user.name}</div>
        <div className={cn("text-sm", theme.sub)}>{user.band}</div>

        <div className="mt-5 w-full rounded-2xl bg-[#A29BFE]/15 border border-purple-200 p-4">
          <div className="flex items-center justify-between text-base">
            <span className="text-gray-700 font-medium">{user.goal}</span>
            <span className="text-gray-800 font-bold">This month</span>
          </div>
          <div className="mt-3 w-full h-2.5 rounded-full bg-purple-100 overflow-hidden">
            <div className="h-full w-[55%] bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] shadow-sm" />
          </div>
          <div className="mt-2 text-sm text-gray-600">55% progress</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- ScoreRow ---------- */
export function ScoreRow({ score, label }) {
  const color =
    score >= 7.5
      ? "bg-green-100 text-green-700 border border-green-300"
      : score >= 6
      ? "bg-[#A29BFE]/30 text-[#6C5CE7] border border-purple-300"
      : "bg-orange-100 text-orange-700 border border-orange-300";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-[#A29BFE]/10 p-4 hover:shadow-md transition">
      <div className={cn("text-base font-medium", theme.text)}>{label}</div>
      <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full shadow-sm", color)}>{score}</span>
    </div>
  );
}

/* ---------- ReminderRow ---------- */
export function ReminderRow({ label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-[#A29BFE]/10 p-4 hover:shadow-md transition">
      <span className="w-11 h-11 rounded-2xl bg-white border border-purple-200 text-[#6C5CE7] flex items-center justify-center text-lg shadow-sm">
        <FaClipboardCheck />
      </span>
      <div className={cn("text-base font-medium", theme.text)}>{label}</div>
    </div>
  );
}
