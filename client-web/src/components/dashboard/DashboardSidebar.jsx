import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { cn } from "../../utils/dashboardTheme";
import { navGroups } from "../../utils/dashboardNavGroups";
import { useTheme } from "../../context/ThemeContext";

export default function DashboardSidebar({ active, setActive, onLogout, theme: t }) {
  const navigate   = useNavigate();
  const { isDark } = useTheme();

  const ROUTES = {
    dashboard:           "/dashboard",
    learn:               "/learn",
    roadmap:             "/learn",
    topics:              "/learn",
    vocabulary:          "/vocabulary",
    reading:             "/reading",
    grammar:             "/grammar",
    listening:           "/ai-listening",
    "speaking-practice": "/speaking-practice",
    stories:             "/stories",
    writing:             "/ai-writing",
    "writing-scenarios": "/writing-scenarios",
    speaking:            "/ai-speaking",
    conversation:        "/ai-conversation",
    feedback:            "/feedback",
    profile:             "/profile",
    settings:            "/settings",
  };

  const handleNavClick = (item) => {
    setActive(item.key);
    if (ROUTES[item.key]) navigate(ROUTES[item.key]);
  };

  return (
    <aside className={cn(
      "w-64 shrink-0 flex flex-col rounded-2xl sticky top-6 h-fit overflow-hidden",
      t.sidebar
    )}>

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="px-6 pt-7 pb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#6C5CE7] to-[#a78bfa] flex items-center justify-center text-white font-black text-sm tracking-tight shadow">
          AI
        </div>
        <div>
          <p className={cn("font-bold text-sm leading-none", isDark ? "text-white" : "text-slate-800")}>IELTS Coach</p>
          <p className="text-[11px] text-[#6C5CE7] font-semibold mt-0.5">Premium</p>
        </div>
      </div>

      {/* ── Nav groups ────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-5 pb-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            <p className={cn(
              "px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest",
              isDark ? "text-white/30" : "text-indigo-300"
            )}>
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.key === active;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      isActive
                        ? isDark
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : isDark
                          ? "text-white/50 hover:text-white hover:bg-white/8"
                          : "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50/60"
                    )}
                  >
                    {/* Active indicator dot */}
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                      isActive
                        ? "bg-indigo-500"
                        : "bg-transparent"
                    )} />

                    <span className={cn(
                      "text-base shrink-0",
                      isActive
                        ? isDark ? "text-indigo-400" : "text-indigo-600"
                        : isDark ? "text-white/40"   : "text-slate-400"
                    )}>
                      {item.icon}
                    </span>

                    <span className="flex-1 text-left truncate">{item.label}</span>

                    {item.badge === "AI" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#6C5CE7] text-white">AI</span>
                    )}
                    {item.badge === "NEW" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500 text-white">NEW</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Upgrade card ──────────────────────────────────────── */}
      <div className="mx-3 mb-4 rounded-xl bg-linear-to-br from-[#6C5CE7] to-[#a78bfa] p-4">
        <p className="text-white font-bold text-sm">Nâng cấp Premium</p>
        <p className="text-white/70 text-xs mt-1 mb-3 leading-relaxed">Mở khóa AI không giới hạn & toàn bộ nội dung</p>
        <button
          onClick={() => navigate("/pricing")}
          className="w-full py-2 rounded-lg bg-white text-[#6C5CE7] font-bold text-xs hover:shadow transition-all active:scale-[0.98]"
        >
          Xem gói cước →
        </button>
      </div>

      {/* ── Logout ────────────────────────────────────────────── */}
      <div className={cn("px-3 pb-5 border-t", isDark ? "border-white/5" : "border-slate-100")}>
        <button
          onClick={onLogout}
          className={cn(
            "mt-3 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
            isDark
              ? "text-white/30 hover:text-red-400 hover:bg-red-500/10"
              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
          )}
        >
          <FaSignOutAlt className="text-base shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
