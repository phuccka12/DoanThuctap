import React from "react";
import { FaBell } from "react-icons/fa";
import { HiOutlineSearch } from "react-icons/hi";
import axiosInstance from "../../utils/axiosConfig";
import { useNavigate } from 'react-router-dom';
import ThemeToggle from "../ThemeToggle";
import { cn } from "../../utils/dashboardTheme";

export default function DashboardTopbar({ user, theme: t }) {
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const handleRetakeWithBonus = async () => {
    try {
      await axiosInstance.post('/placement/start-bonus');
    } catch (_) {}
    navigate('/placement-test');
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {/* Greeting */}
        <div>
          <p className={cn("text-xs font-medium", t.sub)}>{greeting} 👋</p>
          <h1 className={cn("text-xl font-bold mt-0.5", t.text)}>{user.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 text-slate-400 text-sm w-52 cursor-pointer hover:bg-slate-200 transition-colors">
            <HiOutlineSearch className="text-base shrink-0" />
            <span className="text-slate-400 text-sm">Tìm kiếm...</span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Bell */}
          <button className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors relative",
          )}>
            <FaBell className="text-base" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6C5CE7]" />
          </button>

          {/* Avatar */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#6C5CE7] to-[#a78bfa] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user.initials}
            </div>
            <span className={cn("hidden sm:block text-sm font-semibold", t.text)}>{user.name}</span>
          </button>
        </div>
      </div>

      {/* Subtle coin retake nudge */}
      <button
        onClick={handleRetakeWithBonus}
        title="Làm bài kiểm tra trình độ để nhận 200 Coins"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border border-yellow-200 bg-[#FFFBEB] text-yellow-700 text-xs font-semibold hover:bg-yellow-100 hover:shadow-xl transition-all duration-200 group"
      >
        <span className="text-base animate-bounce group-hover:animate-none">🪙</span>
        Kiểm tra lại trình độ
        <span className="bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">+200</span>
      </button>
    </>
  );
}
