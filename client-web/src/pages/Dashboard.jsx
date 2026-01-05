
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import {
  FaHome,
  FaBookOpen,
  FaGraduationCap,
  FaMap,
  FaLightbulb,
  FaPenFancy,
  FaMicrophoneAlt,
  FaComments,
  FaHistory,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaBell,
  FaChartPie,
  FaClipboardCheck,
  FaFire,
  FaTrophy,
  FaStar,
} from "react-icons/fa";

const cn = (...c) => c.filter(Boolean).join(" ");

const theme = {
  page: "bg-[#1a1d29]",
  sidebar: "bg-[#252b3b]",
  card: "bg-[#252b3b]",
  border: "border-gray-700",
  text: "text-white",
  sub: "text-gray-400",
  accent: "text-purple-400",
  accentBg: "bg-gradient-to-r from-purple-600 to-blue-600",
  accentSoft: "bg-purple-900/30",
  input: "bg-[#1a1d29] border-gray-700",
  hover: "hover:bg-[#2a3142]",
};

// Navigation structure with 3 main groups
const navGroups = [
  {
    title: "QUẢN LÝ & LỘ TRÌNH",
    items: [
      { key: "dashboard", label: "Tổng quan", icon: <FaHome />, route: "/dashboard" },
      { key: "roadmap", label: "Lộ trình học", icon: <FaMap />, route: "/roadmap" },
      { key: "topics", label: "Kho Chủ đề", icon: <FaLightbulb />, route: "/topics" },
    ]
  },
  {
    title: "LUYỆN THI & CHẤM ĐIỂM",
    items: [
      { key: "writing", label: "Luyện Writing", icon: <FaPenFancy />, route: "/ai-writing" },
      { key: "speaking", label: "Luyện Speaking", icon: <FaMicrophoneAlt />, route: "/ai-speaking" },
      { key: "conversation", label: "Hội thoại 1-1", icon: <FaComments />, route: "/ai-conversation" },
    ]
  },
  {
    title: "CÁ NHÂN & KẾT QUẢ",
    items: [
      { key: "history", label: "Kết quả & Sửa lỗi", icon: <FaHistory />, route: "/history" },
      { key: "profile", label: "Hồ sơ", icon: <FaUser />, route: "/profile" },
      { key: "settings", label: "Cài đặt", icon: <FaCog />, route: "/settings" },
    ]
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">{error || "Unable to load dashboard data"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", theme.page)}>
      <div className="max-w-[1600px] mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_380px] gap-6">
          {/* SIDEBAR */}
          <Sidebar 
            active={active} 
            setActive={setActive} 
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* MAIN */}
          <main className="space-y-6">
            <Topbar 
              user={dashboardData.user} 
              onMenuClick={() => setSidebarOpen(true)}
            />

            <WelcomeBanner
              name={dashboardData.user.name}
              hasDonePlacementTest={dashboardData.user.hasCompletedPlacementTest}
              onStartTest={handleStartPlacementTest}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Today Practice" right={<SmallLink onClick={() => navigate('/practice')}>View all</SmallLink>} />
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

              <Card>
                <CardHeader title="Time Spent" right={<span className={cn("text-xs", theme.sub)}>This week</span>} />
                <div className="mt-5">
                  <TimeDonut
                    centerTop={dashboardData.weeklyTimeSpent.total > 0 ? `${Math.floor(dashboardData.weeklyTimeSpent.total / 60)}h` : "0h"}
                    centerBottom={dashboardData.weeklyTimeSpent.total > 0 ? `${dashboardData.weeklyTimeSpent.total % 60}m` : "0m"}
                    segments={dashboardData.weeklyTimeSpent.breakdown.length > 0 ? dashboardData.weeklyTimeSpent.breakdown : [
                      { label: "Writing", value: 0, color: "#2563EB" },
                      { label: "Speaking", value: 0, color: "#7C3AED" },
                      { label: "Reading", value: 0, color: "#F59E0B" },
                      { label: "Listening", value: 0, color: "#10B981" },
                    ]}
                  />
                </div>
              </Card>
            </div>

            <div className={cn("rounded-3xl border", theme.border, theme.card, "p-5 md:p-6")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-base font-semibold", theme.text)}>Quick Actions</div>
                  <div className={cn("text-sm", theme.sub)}>Bắt đầu nhanh 1 bài trong 10 phút</div>
                </div>
                <div className="flex items-center gap-3">
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
                    icon={<FaChartPie />} 
                    label="Mock" 
                    onClick={() => navigate('/mock-tests')}
                  />
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside className="space-y-6">
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

function Sidebar({ active, setActive, onLogout, isOpen, onClose }) {
  const navigate = useNavigate();
  
  const handleNavClick = (item) => {
    setActive(item.key);
    onClose(); // Close sidebar on mobile after selection
    
    // Navigate to route if specified
    if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "rounded-3xl border p-5 transition-transform duration-300 ease-in-out overflow-y-auto",
          theme.border, 
          theme.sidebar,
          // Mobile: fixed positioning with slide animation
          "fixed top-0 left-0 h-full w-[300px] z-50 lg:relative lg:w-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-purple-500/30 transition-all group-hover:shadow-purple-500/50 group-hover:scale-105">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-7 h-7"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.8"/>
                <circle cx="15" cy="11" r="1" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <div className={cn("font-black text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent tracking-tight")}>
              LetsLearn
            </div>
            <div className={cn("text-xs font-semibold tracking-wide uppercase", theme.sub, "opacity-70")}>
              IELTS Platform
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-6">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Group Title */}
              <div className={cn("px-3 mb-2 text-xs font-bold tracking-wider uppercase", theme.sub, "opacity-60")}>
                {group.title}
              </div>
              
              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.key === active;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavClick(item)}
                      style={{
                        backgroundColor: isActive ? 'rgba(147, 51, 234, 0.15)' : 'transparent',
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                        isActive
                          ? "border border-purple-500/40 shadow-lg shadow-purple-500/10"
                          : "border border-transparent hover:bg-[#2a3142] hover:border-purple-500/30 hover:shadow-md"
                      )}
                    >
                      <span className={cn(
                        "text-base shrink-0 transition-colors duration-200",
                        isActive ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400"
                      )}>
                        {item.icon}
                      </span>
                      <span className={cn(
                        "font-medium transition-colors duration-200",
                        isActive ? "text-purple-300" : "text-gray-400 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-blue-500 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-5 border-t border-gray-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
          >
            <span className="text-base flex-shrink-0"><FaSignOutAlt /></span>
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ user, onMenuClick }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button - Only visible on mobile/tablet */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-12 h-12 rounded-2xl border border-gray-700 bg-[#252b3b] flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:bg-[#2a3142] transition group"
          aria-label="Toggle menu"
        >
          <span className="w-6 h-0.5 bg-gray-400 rounded-full transition-all group-hover:bg-purple-400" />
          <span className="w-6 h-0.5 bg-gray-400 rounded-full transition-all group-hover:bg-purple-400" />
          <span className="w-6 h-0.5 bg-gray-400 rounded-full transition-all group-hover:bg-purple-400" />
        </button>
        
        <div>
          <div className={cn("text-base", theme.sub)}>My Dashboard</div>
          <div className={cn("text-3xl md:text-4xl font-bold", theme.text)}>Overview</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
          <input
            className="w-[400px] pl-12 pr-5 py-3.5 rounded-2xl border border-gray-700 bg-[#1a1d29] text-white text-base outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500"
            placeholder="What are you looking for?"
          />
        </div>
        <button className="w-14 h-14 rounded-2xl border border-gray-700 bg-[#252b3b] flex items-center justify-center text-gray-400 hover:bg-[#2a3142] transition text-xl">
          <FaBell />
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-gray-700 bg-[#252b3b] px-4 py-2.5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg">
            {user.initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className={cn("text-base font-semibold", theme.text)}>{user.name}</div>
            <div className={cn("text-sm", theme.sub)}>{user.band}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeBanner({ name, hasDonePlacementTest, onStartTest }) {
  return (
    <div className="rounded-3xl border border-gray-700 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className={cn("text-3xl md:text-4xl font-bold", theme.text)}>
            Welcome to  {name}!!!
          </div>
          <p className={cn("mt-3 text-base md:text-lg", theme.sub)}>
            {hasDonePlacementTest
              ? "Hôm nay mình luyện 1 bài Writing + 1 bài Speaking để tăng band nhé."
              : "Làm Placement Test để hệ thống đề xuất lộ trình đúng trình độ."}
          </p>

          {!hasDonePlacementTest && (
            <button
              onClick={onStartTest}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-base hover:from-purple-700 hover:to-blue-700 transition"
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
      className="text-sm font-medium text-purple-400 hover:text-purple-300 transition"
    >
      {children} →
    </button>
  );
}

function TaskRow({ title, subtitle, percent, icon }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-700 bg-[#1a1d29] p-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-[#252b3b] border border-gray-700 flex items-center justify-center text-purple-400 text-xl">
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
        backgroundImage: `conic-gradient(#a855f7 ${deg}deg, #374151 0deg)`,
      }}
    >
      <div className="w-[52px] h-[52px] rounded-full bg-[#252b3b] flex items-center justify-center border border-gray-700">
        <div className="text-sm font-bold text-gray-300">{percent}%</div>
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
      <div className="relative w-52 h-52 rounded-full" style={{ backgroundImage: `conic-gradient(${stops})` }}>
        <div className="absolute inset-5 rounded-full bg-[#252b3b] border border-gray-700 flex flex-col items-center justify-center">
          <div className={cn("text-2xl font-bold", theme.text)}>{centerTop}</div>
          <div className={cn("text-base", theme.sub)}>{centerBottom}</div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <div className={cn("text-base font-bold", theme.text)}>Good job, keep going!</div>
        <div className="mt-4 space-y-3">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                <span className="text-gray-300 font-medium">{s.label}</span>
              </div>
              <span className="text-gray-400 font-semibold">{Math.round((s.value / total) * 100)}%</span>
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
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-700 bg-[#252b3b] text-base text-gray-300 hover:bg-[#2a3142] transition"
    >
      <span className="text-purple-400 text-lg">{icon}</span>
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
        <button className="text-sm font-medium text-purple-400 hover:text-purple-300 transition">Edit</button>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-purple-500/50">
          {user.initials}
        </div>
        <div className={cn("mt-4 font-bold text-xl", theme.text)}>{user.name}</div>
        <div className={cn("text-sm", theme.sub)}>{user.band}</div>

        <div className="mt-5 w-full rounded-2xl bg-[#1a1d29] border border-gray-700 p-4">
          <div className="flex items-center justify-between text-base">
            <span className="text-gray-300 font-medium">{user.goal}</span>
            <span className="text-gray-200 font-bold">This month</span>
          </div>
          <div className="mt-3 w-full h-2.5 rounded-full bg-gray-700 overflow-hidden">
            <div className="h-full w-[55%] bg-gradient-to-r from-purple-500 to-blue-500" />
          </div>
          <div className="mt-2 text-sm text-gray-400">55% progress</div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ score, label }) {
  const color = score >= 7.5 ? "bg-purple-900/30 text-purple-400" : score >= 6 ? "bg-blue-900/30 text-blue-400" : "bg-orange-900/30 text-orange-400";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-700 bg-[#1a1d29] p-4">
      <div className={cn("text-base font-medium", theme.text)}>{label}</div>
      <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full", color)}>{score}</span>
    </div>
  );
}

function ReminderRow({ label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-700 bg-[#1a1d29] p-4">
      <span className="w-11 h-11 rounded-2xl bg-purple-900/30 text-purple-400 flex items-center justify-center text-lg">
        <FaClipboardCheck />
      </span>
      <div className={cn("text-base font-medium", theme.text)}>{label}</div>
    </div>
  );
}

function Illustration() {
  // Dark theme illustration
  return (
    <svg viewBox="0 0 520 180" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="22" width="520" height="136" rx="24" fill="#2a3142" />
      <path
        d="M340 136c16-26 48-38 76-30 17 5 33 17 40 36"
        stroke="#8b5cf6"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M214 132c8-40 46-68 86-64 38 4 68 35 70 72"
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="246" cy="78" r="18" stroke="#a855f7" strokeWidth="5" />
      <circle cx="344" cy="82" r="16" stroke="#a855f7" strokeWidth="5" />
      <path
        d="M228 125c10-20 30-33 52-33 23 0 44 14 54 35"
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M328 120c8-18 26-30 46-30 18 0 34 10 44 24"
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M396 74c12-20 36-30 58-24"
        stroke="#3b82f6"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}
