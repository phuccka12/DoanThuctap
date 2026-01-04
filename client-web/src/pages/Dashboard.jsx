/**
 * Dashboard Component - Main dashboard page for IELTS learning platform
 * 
 * DATA INTEGRATION POINTS:
 * ========================
 * 
 * 1. User Profile Data (line ~60-70):
 *    - Replace mock user data with API call to: GET /api/user/profile
 *    - Fields: name, email, avatar, initials, currentBand, targetBand, hasCompletedPlacementTest
 * 
 * 2. Gamification Stats (line ~71-75):
 *    - Fetch from: GET /api/user/stats or include in user profile
 *    - Fields: streak, totalXP, level
 * 
 * 3. Today's Tasks (line ~76):
 *    - API endpoint: GET /api/tasks/today or GET /api/practice/today
 *    - Expected structure: [{ title, subtitle, percent, icon }]
 * 
 * 4. Weekly Time Spent (line ~77-80):
 *    - API endpoint: GET /api/analytics/time-spent?period=week
 *    - Expected structure: { total: number (minutes), breakdown: [{ label, value, color }] }
 * 
 * 5. Latest Scores (line ~81):
 *    - API endpoint: GET /api/scores/latest?limit=3
 *    - Expected structure: [{ score: number, label: string }]
 * 
 * 6. Reminders (line ~82):
 *    - API endpoint: GET /api/reminders or GET /api/notifications
 *    - Expected structure: [{ label: string, id: number }]
 * 
 * 7. Progress Goal (line ~83-87):
 *    - API endpoint: GET /api/user/goals/current
 *    - Expected structure: { current, target, label }
 * 
 * NOTES:
 * - All API calls should be made in the useEffect hook (starting at line ~54)
 * - Add proper error handling for each API call
 * - Consider adding loading skeleton/spinner states
 * - Token/auth should be handled by AuthContext
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  page: "bg-[#EAF1F9]",
  sidebar: "bg-[#F4F8FF]",
  card: "bg-white",
  border: "border-[#E6EEF8]",
  text: "text-[#0F172A]",
  sub: "text-slate-500",
  accent: "text-[#2563EB]",
  accentBg: "bg-[#2563EB]",
  accentSoft: "bg-[#EAF2FF]",
};

const navItems = [
  { key: "dashboard", label: "My Dashboard", icon: <FaHome /> },
  { key: "practice", label: "Practice", icon: <FaBookOpen /> },
  { key: "courses", label: "Courses", icon: <FaGraduationCap /> },
  { key: "schedule", label: "Schedule", icon: <FaCalendarAlt /> },
  { key: "messages", label: "Messages", icon: <FaComments /> },
  { key: "profile", label: "Profile", icon: <FaUser /> },
  { key: "settings", label: "Settings", icon: <FaCog /> },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/dashboard', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const data = await response.json();
        
        // Mock data structure - replace with actual API response
        const data = {
          user: {
            name: user?.user_name || user?.name || "Student",
            email: user?.email || "",
            avatar: user?.avatar || null,
            initials: user?.user_name ? user.user_name.substring(0, 2).toUpperCase() : "ST",
            currentBand: user?.current_band || null,
            targetBand: user?.target_band || null,
            hasCompletedPlacementTest: user?.placement_test_completed || false,
          },
          stats: {
            streak: user?.gamification_data?.streak || 0,
            totalXP: user?.gamification_data?.exp || 0,
            level: user?.gamification_data?.level || 1,
          },
          todayTasks: [], // Will be fetched from API
          weeklyTimeSpent: {
            total: 0,
            breakdown: [],
          },
          latestScores: [], // Will be fetched from API
          reminders: [], // Will be fetched from API
          progressGoal: {
            current: 0,
            target: 100,
            label: "This month",
          }
        };
        
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Handle error - maybe show error state
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleStartPlacementTest = () => {
    navigate('/placement-test');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAF1F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#EAF1F9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Unable to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", theme.page)}>
      <div className="max-w-[1200px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-5">
          {/* SIDEBAR */}
          <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />

          {/* MAIN */}
          <main className="space-y-5">
            <Topbar user={dashboardData.user} />

            <WelcomeBanner
              name={dashboardData.user.name}
              hasDonePlacementTest={dashboardData.user.hasCompletedPlacementTest}
              onStartTest={handleStartPlacementTest}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Card>
                <CardHeader title="Today Practice" right={<SmallLink onClick={() => navigate('/practice')}>View all</SmallLink>} />
                <div className="mt-4 space-y-3">
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
                <div className="mt-4">
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

            <div className={cn("rounded-2xl border", theme.border, theme.card, "p-4 md:p-5")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-sm font-semibold", theme.text)}>Quick Actions</div>
                  <div className={cn("text-xs", theme.sub)}>Bắt đầu nhanh 1 bài trong 10 phút</div>
                </div>
                <div className="flex items-center gap-2">
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
          <aside className="space-y-5">
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
              <div className="mt-4 space-y-2">
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
              <div className="mt-4 space-y-2">
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

function Sidebar({ active, setActive, onLogout }) {
  const navigate = useNavigate();
  
  const handleNavClick = (item) => {
    setActive(item.key);
    // TODO: Navigate to actual routes when pages are created
    // if (item.key !== 'dashboard') {
    //   navigate(`/${item.key}`);
    // }
  };

  return (
    <aside className={cn("rounded-3xl border", theme.border, theme.sidebar, "p-4")}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold">
          AI
        </div>
        <div>
          <div className={cn("font-semibold", theme.text)}>LetsLearn</div>
          <div className={cn("text-xs", theme.sub)}>IELTS Dashboard</div>
        </div>
      </div>

      <div className="mt-5 space-y-1">
        {navItems.map((it) => {
          const isActive = it.key === active;
          return (
            <button
              key={it.key}
              onClick={() => handleNavClick(it)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                isActive
                  ? "bg-white border border-[#E6EEF8] text-[#2563EB] shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              )}
            >
              <span className={cn("text-base", isActive ? "text-[#2563EB]" : "text-slate-400")}>{it.icon}</span>
              <span className="font-medium">{it.label}</span>
              {isActive ? <span className="ml-auto w-1.5 h-6 rounded-full bg-[#2563EB]" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-[#E6EEF8]">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-white/70 transition"
        >
          <span className="text-slate-400"><FaSignOutAlt /></span>
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({ user }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className={cn("text-sm", theme.sub)}>My Dashboard</div>
        <div className={cn("text-xl md:text-2xl font-semibold", theme.text)}>Overview</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-[340px] pl-11 pr-4 py-2.5 rounded-2xl border border-[#E6EEF8] bg-white text-sm outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="What are you looking for?"
          />
        </div>
        <button className="w-11 h-11 rounded-2xl border border-[#E6EEF8] bg-white flex items-center justify-center text-slate-500 hover:bg-[#F4F8FF] transition">
          <FaBell />
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-[#E6EEF8] bg-white px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold">
            {user.initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className={cn("text-sm font-semibold", theme.text)}>{user.name}</div>
            <div className={cn("text-xs", theme.sub)}>{user.band}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeBanner({ name, hasDonePlacementTest, onStartTest }) {
  return (
    <div className="rounded-3xl border border-[#DCE9FF] bg-gradient-to-r from-[#D8ECFF] to-[#EFF6FF] overflow-hidden">
      <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="max-w-xl">
          <div className={cn("text-2xl md:text-3xl font-semibold", theme.text)}>
            Good Morning {name}!
          </div>
          <p className={cn("mt-2 text-sm md:text-base", theme.sub)}>
            {hasDonePlacementTest
              ? "Hôm nay mình luyện 1 bài Writing + 1 bài Speaking để tăng band nhé."
              : "Làm Placement Test để hệ thống đề xuất lộ trình đúng trình độ."}
          </p>

          {!hasDonePlacementTest && (
            <button
              onClick={onStartTest}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition"
            >
              Start Placement Test
              <span className="opacity-90">→</span>
            </button>
          )}
        </div>

        {/* Simple illustration */}
        <div className="w-full md:w-[320px]">
          <Illustration />
        </div>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className={cn("rounded-3xl border", theme.border, theme.card, "p-4 md:p-5")}>{children}</div>
  );
}

function CardHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between">
      <div className={cn("text-sm font-semibold", theme.text)}>{title}</div>
      {right}
    </div>
  );
}

function SmallLink({ children, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="text-xs text-slate-500 hover:text-slate-700 transition"
    >
      {children} →
    </button>
  );
}

function TaskRow({ title, subtitle, percent, icon }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-white border border-[#E6EEF8] flex items-center justify-center text-slate-600">
          {icon}
        </div>
        <div className="min-w-0">
          <div className={cn("text-sm font-semibold truncate", theme.text)}>{title}</div>
          <div className={cn("text-xs truncate", theme.sub)}>{subtitle}</div>
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
      className="w-12 h-12 rounded-full flex items-center justify-center"
      style={{
        backgroundImage: `conic-gradient(#2563EB ${deg}deg, #E7EEF8 0deg)`,
      }}
    >
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#E6EEF8]">
        <div className="text-[11px] font-semibold text-slate-700">{percent}%</div>
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
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="relative w-44 h-44 rounded-full" style={{ backgroundImage: `conic-gradient(${stops})` }}>
        <div className="absolute inset-4 rounded-full bg-white border border-[#E6EEF8] flex flex-col items-center justify-center">
          <div className={cn("text-xl font-semibold", theme.text)}>{centerTop}</div>
          <div className={cn("text-sm", theme.sub)}>{centerBottom}</div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <div className={cn("text-sm font-semibold", theme.text)}>Good job, keep going!</div>
        <div className="mt-3 space-y-2">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-600">{s.label}</span>
              </div>
              <span className="text-slate-500">{Math.round((s.value / total) * 100)}%</span>
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
      className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-[#E6EEF8] bg-white text-sm text-slate-600 hover:bg-[#F4F8FF] transition"
    >
      <span className="text-slate-400">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function ProfileCard({ user }) {
  return (
    <div className={cn("rounded-3xl border", theme.border, theme.card, "p-5")}
    >
      <div className="flex items-center justify-between">
        <div className={cn("text-sm font-semibold", theme.text)}>Profile</div>
        <button className="text-xs text-slate-500 hover:text-slate-700 transition">Edit</button>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl">
          {user.initials}
        </div>
        <div className={cn("mt-3 font-semibold", theme.text)}>{user.name}</div>
        <div className={cn("text-xs", theme.sub)}>{user.band}</div>

        <div className="mt-4 w-full rounded-2xl bg-[#F6FAFF] border border-[#E6EEF8] p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{user.goal}</span>
            <span className="text-slate-700 font-semibold">This month</span>
          </div>
          <div className="mt-2 w-full h-2 rounded-full bg-[#E7EEF8] overflow-hidden">
            <div className="h-full w-[55%] bg-[#2563EB]" />
          </div>
          <div className="mt-2 text-xs text-slate-500">55% progress</div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ score, label }) {
  const color = score >= 7.5 ? "bg-[#EAF2FF] text-[#2563EB]" : score >= 6 ? "bg-[#F2E8FF] text-[#7C3AED]" : "bg-[#FFF3E6] text-[#F59E0B]";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] p-3">
      <div className={cn("text-sm font-medium", theme.text)}>{label}</div>
      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", color)}>{score}</span>
    </div>
  );
}

function ReminderRow({ label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] p-3">
      <span className="w-9 h-9 rounded-2xl bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center">
        <FaClipboardCheck />
      </span>
      <div className={cn("text-sm font-medium", theme.text)}>{label}</div>
    </div>
  );
}

function Illustration() {
  // nhẹ nhàng thôi, để giống vibe ảnh (line art đơn giản)
  return (
    <svg viewBox="0 0 520 180" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="22" width="520" height="136" rx="24" fill="#D8ECFF" />
      <path
        d="M340 136c16-26 48-38 76-30 17 5 33 17 40 36"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M214 132c8-40 46-68 86-64 38 4 68 35 70 72"
        stroke="#1E293B"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="246" cy="78" r="18" stroke="#1E293B" strokeWidth="5" />
      <circle cx="344" cy="82" r="16" stroke="#1E293B" strokeWidth="5" />
      <path
        d="M228 125c10-20 30-33 52-33 23 0 44 14 54 35"
        stroke="#1E293B"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M328 120c8-18 26-30 46-30 18 0 34 10 44 24"
        stroke="#1E293B"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M396 74c12-20 36-30 58-24"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
