import React from "react";
import { FaSearch, FaBell } from "react-icons/fa";
import axiosInstance from "../../utils/axiosConfig";
import { useNavigate } from 'react-router-dom';
import ThemeToggle from "../ThemeToggle";
import { cn } from "../../utils/dashboardTheme";

export default function DashboardTopbar({ user, theme: t }) {
  const navigate = useNavigate();

  const handleRetakeWithBonus = async () => {
    try {
      await axiosInstance.post('/placement/start-bonus');
      navigate('/placement-test');
    } catch (err) {
      console.error('Failed to start bonus retake', err);
      // fallback: still navigate to test
      navigate('/placement-test');
    }
  };
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className={cn("text-base", t.sub)}>My Dashboard</div>
        <div className={cn("text-3xl md:text-4xl font-bold", t.text)}>Overview</div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:block relative">
          <FaSearch className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-lg", t.sub)} />
          <input
            className={cn(
              "w-100 pl-12 pr-5 py-3.5 rounded-2xl border text-base outline-none focus:ring-2 focus:ring-[#6C5CE7]",
              t.input,
              t.border
            )}
            placeholder="What are you looking for?"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Bell */}
        <button
          className={cn(
            "w-14 h-14 rounded-2xl border flex items-center justify-center transition text-xl shadow-sm",
            t.border, t.card, t.hover
          )}
        >
          <FaBell className={t.sub} />
        </button>

        {/* Avatar */}
        <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-sm", t.border, t.card)}>
          <div className="w-11 h-11 rounded-full bg-linear-to-tr from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center font-bold text-lg shadow-md">
            {user.initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className={cn("text-base font-semibold", t.text)}>{user.name}</div>
            <div className={cn("text-sm", t.sub)}>{user.band}</div>
          </div>
        </div>
      </div>

      {/* ── Backdoor: retake placement for coins ─────────────────────────────
          Deliberately subtle but tempting — shows when user is on dashboard.
          Positioned bottom-right corner, fixed, always visible as a "mồi nhử".
      ─────────────────────────────────────────────────────────────────────── */}
      <button
        onClick={handleRetakeWithBonus}
        title="Làm bài kiểm tra trình độ để nhận 200 Coins"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border border-yellow-300 bg-[#FFFBEB] text-yellow-700 text-xs font-semibold hover:bg-yellow-100 hover:shadow-xl transition-all duration-200 group"
      >
        <span className="text-base animate-bounce group-hover:animate-none">🪙</span>
        Kiểm tra lại trình độ
        <span className="bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">+200</span>
      </button>
    </div>
  );
}
