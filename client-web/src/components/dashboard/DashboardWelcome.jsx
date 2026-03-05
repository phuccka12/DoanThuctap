import React from "react";
import { cn } from "../../utils/dashboardTheme";

function Illustration() {
  return (
    <svg viewBox="0 0 520 180" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="22" width="520" height="136" rx="24" fill="#f5f3ff" />
      <path
        d="M340 136c16-26 48-38 76-30 17 5 33 17 40 36"
        stroke="#00CEC9"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M214 132c8-40 46-68 86-64 38 4 68 35 70 72"
        stroke="#6C5CE7"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="246" cy="78" r="18" stroke="#6C5CE7" strokeWidth="5" />
      <circle cx="344" cy="82" r="16" stroke="#6C5CE7" strokeWidth="5" />
      <path
        d="M228 125c10-20 30-33 52-33 23 0 44 14 54 35"
        stroke="#A29BFE"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M328 120c8-18 26-30 46-30 18 0 34 10 44 24"
        stroke="#A29BFE"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M396 74c12-20 36-30 58-24"
        stroke="#00CEC9"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export default function DashboardWelcome({ name, hasDonePlacementTest, ctaVariant = 'placement', ctaLabel = null, onStartTest, onStartPath, theme: t }) {
  const renderCTA = () => {
    if (ctaVariant === 'placement') {
      return (
        <button
          onClick={onStartTest}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-semibold text-sm hover:from-[#8E44AD] hover:to-[#00CEC9] transition shadow-md hover:shadow-lg animate-pulse hover:animate-none"
        >
          Start Placement Test
          <span className="opacity-90">→</span>
        </button>
      );
    }

    if (ctaVariant === 'path') {
      return (
        <button
          onClick={onStartPath}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-linear-to-r from-[#4CC9F0] to-[#6C5CE7] text-white font-semibold text-sm hover:from-[#3AA9D6] hover:to-[#5B4FD6] transition shadow-md hover:shadow-lg"
        >
          {ctaLabel || '🎯 Học bài hôm nay'}
          <span className="opacity-90">→</span>
        </button>
      );
    }

    return null;
  };

  return (
    <div className="rounded-3xl border border-purple-200 bg-linear-to-r from-[#A29BFE]/20 via-purple-50 to-[#A29BFE]/20 overflow-hidden shadow-md">
      <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className={cn("text-2xl md:text-3xl font-bold", t.text)}>
            Welcome to {name}! 🌟
          </div>
          <p className={cn("mt-2 text-sm md:text-base", t.sub)}>
            {hasDonePlacementTest
              ? "Hôm nay mình luyện 1 bài Writing + 1 bài Speaking để tăng band nhé."
              : "Chào mừng! Chúng tôi sẽ tư vấn lộ trình phù hợp — bạn có muốn làm bài kiểm tra đánh giá không?"}
          </p>

          {!hasDonePlacementTest && renderCTA()}
        </div>

        {/* Illustration */}
        <div className="w-full md:w-56">
          <Illustration />
        </div>
      </div>
    </div>
  );
}
