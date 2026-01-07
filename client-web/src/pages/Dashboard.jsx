
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import dashboardService from "../services/dashboardService";
import ThemeToggle from "../components/ThemeToggle";
import PetWidget from "../components/PetWidget";
import {
  FaHome,
  FaBookOpen,
  FaGraduationCap,
  FaCalendarAlt,
  FaComments,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaBell,
  FaChartPie,
  FaClipboardCheck,
  FaMicrophoneAlt,
  FaPenFancy,
  FaFire,
  FaTrophy,
  FaStar,
} from "react-icons/fa";

const cn = (...c) => c.filter(Boolean).join(" ");

const theme = {
  page: "bg-gradient-to-br from-purple-50 via-white to-violet-50",
  sidebar: "bg-white shadow-lg",
  card: "bg-white shadow-md",
  border: "border-purple-100",
  text: "text-gray-800",
  sub: "text-gray-600",
  accent: "text-[#6C5CE7]",
  accentBg: "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9]",
  accentSoft: "bg-[#A29BFE]/20",
  input: "bg-white border-purple-200",
  hover: "hover:bg-purple-50",
};

const navGroups = [
  {
    title: "QUẢN LÝ & LỘ TRÌNH",
    items: [
      { key: "dashboard", label: "Tổng quan", icon: <FaHome />, badge: null },
      { key: "roadmap", label: "Lộ trình học", icon: <FaCalendarAlt />, badge: "AI" },
      { key: "topics", label: "Kho Chủ đề", icon: <FaBookOpen />, badge: null },
    ]
  },
  {
    title: "LUYỆN THI & CHẤM ĐIỂM",
    items: [
      { key: "writing", label: "Luyện Writing", icon: <FaPenFancy />, badge: "Check" },
      { key: "speaking", label: "Luyện Speaking", icon: <FaMicrophoneAlt />, badge: "Check" },
      { key: "conversation", label: "Hội thoại AI", icon: <FaComments />, badge: "1-1" },
    ]
  },
  {
    title: "CÁ NHÂN & KẾT QUẢ",
    items: [
      { key: "feedback", label: "Kết quả & Sửa lỗi", icon: <FaClipboardCheck />, badge: null },
      { key: "profile", label: "Hồ sơ", icon: <FaUser />, badge: null },
      { key: "settings", label: "Cài đặt", icon: <FaCog />, badge: null },
    ]
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Dynamic theme based on dark mode
  const dynamicTheme = isDark ? {
    page: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
    sidebar: "bg-gray-800 shadow-2xl border-gray-700",
    card: "bg-gray-800 shadow-xl",
    border: "border-gray-700",
    text: "text-white",
    sub: "text-gray-400",
    accent: "text-[#A29BFE]",
    accentBg: "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9]",
    accentSoft: "bg-[#A29BFE]/10",
    input: "bg-gray-700 border-gray-600 text-white placeholder-gray-400",
    hover: "hover:bg-gray-700",
  } : theme;

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel for better performance
        const [
          userProfile,
          todayTasks,
          timeSpent,
          latestScores,
          reminders,
          userGoals
        ] = await Promise.all([
          dashboardService.getUserProfile(),
          dashboardService.getTodayTasks(),
          dashboardService.getTimeSpent('week'),
          dashboardService.getLatestScores(3),
          dashboardService.getReminders(),
          dashboardService.getUserGoals()
        ]);

        // Structure the data - Backend returns { user: { user_name, ... } }
        const userInfo = userProfile.user || userProfile; // Handle both response formats
        
        const data = {
          user: {
            name: userInfo.user_name || "Student",
            email: userInfo.email || "",
            avatar: userInfo.avatar || null,
            initials: userInfo.user_name ? userInfo.user_name.substring(0, 2).toUpperCase() : "ST",
            currentBand: userInfo.current_band || null,
            targetBand: userInfo.target_band || null,
            hasCompletedPlacementTest: userInfo.placement_test_completed || false,
          },
          stats: {
            streak: userInfo.gamification_data?.streak || 0,
            totalXP: userInfo.gamification_data?.exp || 0,
            level: userInfo.gamification_data?.level || 1,
          },
          todayTasks: todayTasks.map(task => ({
            title: task.title,
            subtitle: task.subtitle || task.description,
            percent: task.progress || 0,
            icon: getTaskIcon(task.type)
          })),
          weeklyTimeSpent: {
            total: timeSpent.total || 0,
            breakdown: timeSpent.breakdown || []
          },
          latestScores: latestScores.map(score => ({
            score: score.score,
            label: score.label || `${score.skill} - ${score.test_name}`
          })),
          reminders: reminders.map(reminder => ({
            id: reminder.id,
            label: reminder.message || reminder.title
          })),
          progressGoal: userGoals || {
            current: 0,
            target: 100,
            label: "This month"
          }
        };
        
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper function to get icon based on task type
  const getTaskIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'writing':
        return <FaPenFancy />;
      case 'speaking':
        return <FaMicrophoneAlt />;
      case 'reading':
        return <FaBookOpen />;
      case 'listening':
        return <FaBell />;
      case 'placement':
      case 'test':
        return <FaClipboardCheck />;
      default:
        return <FaBookOpen />;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleStartPlacementTest = async () => {
    try {
      // Update placement test status in backend
      await dashboardService.updatePlacementTestStatus(true);
      
      // Navigate to placement test page
      navigate('/placement-test');
    } catch (error) {
      console.error("Error starting placement test:", error);
      // Still navigate even if update fails
      navigate('/placement-test');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6C5CE7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">{error || "Unable to load dashboard data"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white rounded-lg hover:from-[#8E44AD] hover:to-[#00CEC9] shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", dynamicTheme.page)}>
      <div className="max-w-[1800px] mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_380px] gap-6">
          {/* SIDEBAR */}
          <Sidebar active={active} setActive={setActive} onLogout={handleLogout} theme={dynamicTheme} />

          {/* MAIN */}
          <main className="space-y-6">
            <Topbar user={dashboardData.user} theme={dynamicTheme} />

            <WelcomeBanner
              name={dashboardData.user.name}
              hasDonePlacementTest={dashboardData.user.hasCompletedPlacementTest}
              onStartTest={handleStartPlacementTest}
              theme={dynamicTheme}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card theme={dynamicTheme}>
                <CardHeader title="Today Practice" right={<SmallLink onClick={() => navigate('/practice')} theme={dynamicTheme}>View all</SmallLink>} theme={dynamicTheme} />
                <div className="mt-5 space-y-4">
                  {dashboardData.todayTasks.length > 0 ? (
                    dashboardData.todayTasks.map((t, i) => (
                      <TaskRow key={i} {...t} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No practice tasks for today</p>
                  )}
                </div>
              </Card>

              <Card theme={dynamicTheme}>
                <CardHeader title="Tiến độ học tập" right={<span className="text-xs font-medium text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1.5 rounded-lg">Tuần này</span>} theme={dynamicTheme} />
                <div className="mt-6 space-y-5">
                  {/* Tổng thời gian */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/10 to-[#00CEC9]/10 border border-[#6C5CE7]/20">
                    <div>
                      <div className="text-sm text-slate-600 font-medium">Tổng thời gian</div>
                      <div className="text-3xl font-bold text-slate-800 mt-1">
                        {dashboardData.weeklyTimeSpent.total > 0 
                          ? `${Math.floor(dashboardData.weeklyTimeSpent.total / 60)}h ${dashboardData.weeklyTimeSpent.total % 60}m` 
                          : "0h 0m"}
                      </div>
                    </div>
                    <div className="text-4xl">📚</div>
                  </div>

                  {/* Progress bars cho từng kỹ năng */}
                  <div className="space-y-4">
                    {(dashboardData.weeklyTimeSpent.breakdown.length > 0 ? dashboardData.weeklyTimeSpent.breakdown : [
                      { label: "Writing", value: 0, color: "#6C5CE7", icon: "✍️" },
                      { label: "Speaking", value: 0, color: "#00CEC9", icon: "🎤" },
                      { label: "Reading", value: 0, color: "#A29BFE", icon: "📖" },
                      { label: "Listening", value: 0, color: "#74B9FF", icon: "🎧" },
                    ]).map((skill, idx) => {
                      const totalTime = dashboardData.weeklyTimeSpent.total || 1;
                      const percentage = Math.round((skill.value / totalTime) * 100) || 0;
                      const hours = Math.floor(skill.value / 60);
                      const mins = skill.value % 60;
                      
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{skill.icon || "📝"}</span>
                              <span className="font-semibold text-slate-700">{skill.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500">
                                {skill.value > 0 ? `${hours}h ${mins}m` : "0m"}
                              </span>
                              <span className="text-sm font-bold text-[#6C5CE7] min-w-[40px] text-right">{percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{ 
                                width: `${percentage}%`,
                                background: `linear-gradient(to right, ${skill.color}, ${skill.color}dd)`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message động */}
                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-600">
                      {dashboardData.weeklyTimeSpent.total > 0 
                        ? "🎯 Tuyệt vời! Tiếp tục phát huy nhé!" 
                        : "💪 Hãy bắt đầu luyện tập ngay hôm nay!"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className={cn("rounded-3xl border", theme.border, theme.card, "p-5 md:p-6")}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className={cn("text-base font-semibold", theme.text)}>Quick Actions</div>
                  <div className={cn("text-sm", theme.sub)}>Bắt đầu nhanh 1 bài trong 10 phút</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Pill 
                    icon={<FaPenFancy />} 
                    label="Writing" 
                    onClick={() => navigate('/ai-writing')}
                  />
                  <Pill 
                    icon={<FaMicrophoneAlt />} 
                    label="Speaking" 
                    onClick={() => navigate('/ai-speaking')}
                  />
                  <Pill 
                    icon={<FaComments />} 
                    label="Conversation" 
                    onClick={() => navigate('/ai-conversation')}
                  />
                  <Pill 
                    icon={<FaChartPie />} 
                    label="Mock Test" 
                    onClick={() => navigate('/mock-tests')}
                  />
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside className="space-y-6">
            <PetWidget theme={dynamicTheme} />
            <ProfileCard 
              user={{
                name: dashboardData.user.name,
                initials: dashboardData.user.initials,
                band: dashboardData.user.currentBand ? `Band ${dashboardData.user.currentBand}` : "Not assessed",
                goal: dashboardData.user.targetBand ? `Goal: ${dashboardData.user.targetBand}+` : "Set your goal"
              }}
            />

            <Card>
              <CardHeader title="Latest Score" right={<SmallLink onClick={() => navigate('/progress')}>View all</SmallLink>} />
              <div className="mt-5 space-y-3">
                {dashboardData.latestScores.length > 0 ? (
                  dashboardData.latestScores.map((s, i) => (
                    <ScoreRow key={i} score={s.score} label={s.label} />
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No scores yet</p>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Reminder" right={<SmallLink onClick={() => navigate('/reminders')}>View all</SmallLink>} />
              <div className="mt-5 space-y-3">
                {dashboardData.reminders.length > 0 ? (
                  dashboardData.reminders.map((r, i) => (
                    <ReminderRow key={i} label={r.label} />
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No reminders</p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, onLogout, theme: t }) {
  const navigate = useNavigate();
  
  const handleNavClick = (item) => {
    setActive(item.key);
    
    // Navigation routing
    const routes = {
      'dashboard': '/dashboard',
      'roadmap': '/roadmap',
      'topics': '/topics',
      'writing': '/ai-writing',
      'speaking': '/ai-speaking',
      'conversation': '/ai-conversation',
      'feedback': '/feedback',
      'profile': '/profile',
      'settings': '/settings',
    };
    
    if (routes[item.key] && item.key !== 'dashboard') {
      navigate(routes[item.key]);
    }
  };

  return (
    <aside className={cn("rounded-3xl border p-6 h-fit sticky top-6", t.border, t.sidebar)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center font-bold text-lg shadow-md">
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
            {/* Group Title */}
            <div className="px-2 mb-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {group.title}
              </h4>
            </div>
            
            {/* Group Items */}
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
                        ? "bg-gradient-to-r from-[#A29BFE]/30 to-[#00CEC9]/20 border border-[#6C5CE7]/30 text-[#6C5CE7] shadow-sm font-semibold"
                        : "text-gray-600 hover:bg-purple-50 hover:text-[#6C5CE7]"
                    )}
                  >
                    <span className={cn("text-base", isActive ? "text-[#6C5CE7]" : "text-gray-500")}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        item.badge === "AI" ? "bg-[#6C5CE7] text-white" :
                        item.badge === "Check" ? "bg-[#00CEC9] text-white" :
                        "bg-orange-500 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Active Indicator */}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00CEC9] shadow-[0_0_8px_#00CEC9]" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="mt-8 pt-6 border-t border-dashed border-purple-100">
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

function Topbar({ user, theme: t }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className={cn("text-base", t.sub)}>My Dashboard</div>
        <div className={cn("text-3xl md:text-4xl font-bold", t.text)}>Overview</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block relative">
          <FaSearch className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-lg", t.sub)} />
          <input
            className={cn("w-[400px] pl-12 pr-5 py-3.5 rounded-2xl border text-base outline-none focus:ring-2 focus:ring-[#6C5CE7]", t.input, t.border)}
            placeholder="What are you looking for?"
          />
        </div>
        
        {/* Theme Toggle Button */}
        <ThemeToggle />
        
        <button className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center transition text-xl shadow-sm", t.border, t.card, t.hover)}>
          <FaBell className={t.sub} />
        </button>
        <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-sm", t.border, t.card)}>
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center font-bold text-lg shadow-md">
            {user.initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className={cn("text-base font-semibold", t.text)}>{user.name}</div>
            <div className={cn("text-sm", t.sub)}>{user.band}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeBanner({ name, hasDonePlacementTest, onStartTest }) {
  return (
    <div className="rounded-3xl border border-purple-200 bg-gradient-to-r from-[#A29BFE]/20 via-purple-50 to-[#A29BFE]/20 overflow-hidden shadow-md">
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className={cn("text-3xl md:text-4xl font-bold", theme.text)}>
            Welcome to  {name}! 🌟
          </div>
          <p className={cn("mt-3 text-base md:text-lg", theme.sub)}>
            {hasDonePlacementTest
              ? "Hôm nay mình luyện 1 bài Writing + 1 bài Speaking để tăng band nhé."
              : "Làm Placement Test để hệ thống đề xuất lộ trình đúng trình độ."}
          </p>

          {!hasDonePlacementTest && (
            <button
              onClick={onStartTest}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-semibold text-base hover:from-[#8E44AD] hover:to-[#00CEC9] transition shadow-md hover:shadow-lg"
            >
              Start Placement Test
              <span className="opacity-90">→</span>
            </button>
          )}
        </div>

        {/* Simple illustration */}
        <div className="w-full md:w-[380px]">
          <Illustration />
        </div>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className={cn("rounded-3xl border", theme.border, theme.card, "p-5 md:p-6")}>{children}</div>
  );
}

function CardHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between">
      <div className={cn("text-base font-bold", theme.text)}>{title}</div>
      {right}
    </div>
  );
}

function SmallLink({ children, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="text-sm font-medium text-[#6C5CE7] hover:text-[#8E44AD] transition"
    >
      {children} →
    </button>
  );
}

function TaskRow({ title, subtitle, percent, icon }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-[#A29BFE]/10 p-4 hover:shadow-md transition">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-white border border-purple-200 flex items-center justify-center text-[#6C5CE7] text-xl shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <div className={cn("text-base font-semibold truncate", theme.text)}>{title}</div>
          <div className={cn("text-sm truncate", theme.sub)}>{subtitle}</div>
        </div>
      </div>

      <ProgressRing percent={percent} />
    </div>
  );
}

function ProgressRing({ percent }) {
  const deg = Math.max(0, Math.min(100, percent)) * 3.6;
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{
        backgroundImage: `conic-gradient(#6C5CE7 ${deg}deg, #e5e7eb 0deg)`,
      }}
    >
      <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center border border-purple-200 shadow-sm">
        <div className="text-sm font-bold text-gray-800">{percent}%</div>
      </div>
    </div>
  );
}

function TimeDonut({ segments, centerTop, centerBottom }) {
  // Build conic gradient stops
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

function Pill({ icon, label, onClick }) {
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

function ProfileCard({ user }) {
  return (
    <div className={cn("rounded-3xl border", theme.border, theme.card, "p-6")}
    >
      <div className="flex items-center justify-between">
        <div className={cn("text-base font-bold", theme.text)}>Profile</div>
        <button className="text-sm font-medium text-[#6C5CE7] hover:text-[#8E44AD] transition">Edit</button>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white font-bold text-3xl shadow-lg">
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
            <div className="h-full w-[55%] bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] shadow-sm" />
          </div>
          <div className="mt-2 text-sm text-gray-600">55% progress</div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ score, label }) {
  const color = score >= 7.5 ? "bg-green-100 text-green-700 border border-green-300" : score >= 6 ? "bg-[#A29BFE]/30 text-[#6C5CE7] border border-purple-300" : "bg-orange-100 text-orange-700 border border-orange-300";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-[#A29BFE]/10 p-4 hover:shadow-md transition">
      <div className={cn("text-base font-medium", theme.text)}>{label}</div>
      <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full shadow-sm", color)}>{score}</span>
    </div>
  );
}

function ReminderRow({ label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-[#A29BFE]/10 p-4 hover:shadow-md transition">
      <span className="w-11 h-11 rounded-2xl bg-white border border-purple-200 text-[#6C5CE7] flex items-center justify-center text-lg shadow-sm">
        <FaClipboardCheck />
      </span>
      <div className={cn("text-base font-medium", theme.text)}>{label}</div>
    </div>
  );
}

function Illustration() {
  // Modern Purple theme illustration
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
