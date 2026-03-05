import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaStar } from "react-icons/fa";
import { cn } from "../../utils/dashboardTheme";
import { navGroups } from "../../utils/dashboardNavGroups";

export default function DashboardSidebar({ active, setActive, onLogout, theme: t }) {
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    setActive(item.key);
    const routes = {
      dashboard:    "/dashboard",
      roadmap:      "/roadmap",
      topics:       "/topics",
      writing:      "/ai-writing",
      speaking:     "/ai-speaking",
      conversation: "/ai-conversation",
      feedback:     "/feedback",
      profile:      "/profile",
      settings:     "/settings",
    };
    if (routes[item.key] && item.key !== "dashboard") {
      navigate(routes[item.key]);
    }
  };

  return (
    <aside className={cn("rounded-3xl border p-6 h-fit sticky top-6", t.border, t.sidebar)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-12 h-12 rounded-xl bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center font-bold text-lg shadow-md">
          AI
        </div>
        <div>
          <div className={cn("font-bold text-lg", t.text)}>IELTS Coach</div>
          <div className="text-xs text-[#6C5CE7] font-semibold uppercase tracking-wider">Premium</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div className="px-2 mb-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {group.title}
              </h4>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.key === active;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                      isActive
                        ? "bg-linear-to-r from-[#A29BFE]/30 to-[#00CEC9]/20 border border-[#6C5CE7]/30 text-[#6C5CE7] shadow-sm font-semibold"
                        : cn("text-gray-600", t.hover, "hover:text-[#6C5CE7]")
                    )}
                  >
                    <span className={cn("text-base", isActive ? "text-[#6C5CE7]" : "text-gray-500")}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>

                    {item.badge && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        item.badge === "AI"    ? "bg-[#6C5CE7] text-white" :
                        item.badge === "Check" ? "bg-[#00CEC9] text-white" :
                                                  "bg-orange-500 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00CEC9] shadow-[0_0_8px_#00CEC9]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade Banner */}
      <div className="mt-6 rounded-2xl bg-linear-to-br from-[#6C5CE7] to-[#a855f7] p-4 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <FaStar className="text-yellow-300" />
          <span className="font-bold text-sm">Nâng cấp Premium</span>
        </div>
        <p className="text-xs text-white/80 mb-3 leading-relaxed">
          Mở khóa AI không giới hạn &amp; toàn bộ nội dung
        </p>
        <button
          onClick={() => navigate("/pricing")}
          className="w-full py-2 rounded-xl bg-white text-[#6C5CE7] font-bold text-xs hover:shadow-md transition-all active:scale-95"
        >
          ⚡ Xem gói cước
        </button>
        <button
          onClick={() => navigate("/my-subscription")}
          className="w-full pt-2 text-[10px] text-white/60 hover:text-white transition text-center"
        >
          Gói hiện tại của tôi →
        </button>
      </div>

      {/* Logout */}
      <div className="mt-4 pt-4 border-t border-dashed border-purple-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors font-medium"
        >
          <FaSignOutAlt className="text-base" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
