import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import dashboardService from "../services/dashboardService";
import PetWidget from "../components/PetWidget";
import {
  FaBookOpen,
  FaBell,
  FaClipboardCheck,
  FaMicrophoneAlt,
  FaPenFancy,
  FaChartPie,
  FaComments,
  FaStar,
} from "react-icons/fa";

import { cn, theme, darkTheme } from "../utils/dashboardTheme";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardTopbar from "../components/dashboard/DashboardTopbar";
import DashboardWelcome from "../components/dashboard/DashboardWelcome";
import {
  Card,
  CardHeader,
  SmallLink,
  TaskRow,
  Pill,
  ScoreRow,
  ReminderRow,
} from "../components/dashboard/DashboardCards";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const t = isDark ? darkTheme : theme;

  const getTaskIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "writing":   return <FaPenFancy />;
      case "speaking":  return <FaMicrophoneAlt />;
      case "reading":   return <FaBookOpen />;
      case "listening": return <FaBell />;
      case "placement":
      case "test":      return <FaClipboardCheck />;
      default:          return <FaBookOpen />;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) { setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const [userProfile, todayTasks, timeSpent, latestScores, reminders, userGoals] =
          await Promise.all([
            dashboardService.getUserProfile(),
            dashboardService.getTodayTasks(),
            dashboardService.getTimeSpent("week"),
            dashboardService.getLatestScores(3),
            dashboardService.getReminders(),
            dashboardService.getUserGoals(),
          ]);
  const userInfo = userProfile.user || userProfile;
  const learningPrefs = userInfo.learning_preferences || {};
        setDashboardData({
          user: {
            name: userInfo.user_name || "Student",
            email: userInfo.email || "",
            avatar: userInfo.avatar || null,
            initials: userInfo.user_name ? userInfo.user_name.substring(0, 2).toUpperCase() : "ST",
            currentBand: userInfo.current_band || null,
            targetBand: userInfo.target_band || null,
            hasCompletedPlacementTest: userInfo.placement_test_completed || false,
            // onboarding / self-assessment flags
            selfAssessedLevel: learningPrefs.current_level || null,
            wantsPlacementCheck: learningPrefs.wants_placement_check || false,
          },
          stats: {
            streak: userInfo.gamification_data?.streak || 0,
            totalXP: userInfo.gamification_data?.exp || 0,
            level: userInfo.gamification_data?.level || 1,
          },
          todayTasks: todayTasks.map((task) => ({
            title: task.title,
            subtitle: task.subtitle || task.description,
            percent: task.progress || 0,
            icon: getTaskIcon(task.type),
          })),
          weeklyTimeSpent: {
            total: timeSpent.total || 0,
            breakdown: timeSpent.breakdown || [],
          },
          latestScores: latestScores.map((s) => {
            const value = s.score ?? s.value ?? s.band ?? 0;
            // Friendly label: prefer explicit label, fallback to name/test_name/title + date
            const date = s.date || s.test_date || s.createdAt || s.timestamp;
            const prettyDate = date ? ` - ${new Date(date).toLocaleDateString()}` : "";
            const name = s.label || s.test_name || s.name || s.title || s.type || s.skill;
            return { score: value, label: name ? `${name}${prettyDate}` : `Test${prettyDate}` };
          }),
          reminders: reminders.map((r) => ({ id: r.id, label: r.message || r.title })),
          progressGoal: userGoals || { current: 0, target: 100, label: "This month" },
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (err) { console.error("Logout error:", err); }
  };

  const handleStartPlacementTest = () => {
    navigate('/placement-test');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6C5CE7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">{error || "Unable to load dashboard data"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white rounded-lg hover:from-[#8E44AD] hover:to-[#00CEC9] shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", t.page)}>
      <div className="max-w-450 mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_380px] gap-4">

          {/* SIDEBAR */}
          <DashboardSidebar active={active} setActive={setActive} onLogout={handleLogout} theme={t} />

          {/* MAIN */}
          <main className="space-y-4">
            <DashboardTopbar user={dashboardData.user} theme={t} />

            {/* Welcome / CTA logic:
                - If user has completed placement test -> hide welcome
                - Else if user asked for placement check -> show placement CTA
                - Else if user self-assessed level -> show quick-start path CTA
            */}
            {!dashboardData.user.hasCompletedPlacementTest && (
              <DashboardWelcome
                name={dashboardData.user.name}
                hasDonePlacementTest={dashboardData.user.hasCompletedPlacementTest}
                // decide CTA variant and handler
                ctaVariant={dashboardData.user.wantsPlacementCheck ? 'placement' : (dashboardData.user.selfAssessedLevel ? 'path' : 'placement')}
                ctaLabel={(() => {
                  const map = {
                    stranger: 'Mới bắt đầu',
                    old_friend: 'Cơ bản',
                    learning: 'Trung bình',
                    close_friend: 'Khá tốt',
                  };
                  const lvl = dashboardData.user.selfAssessedLevel;
                  return lvl ? `Bắt đầu lộ trình ${map[lvl] || lvl}` : 'Start Placement Test';
                })()}
                onStartTest={handleStartPlacementTest}
                onStartPath={() => navigate('/practice')}
                theme={t}
              />
            )}

            {/* Center upgrade banner removed to avoid duplication with sidebar banner */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card theme={t}>
                <CardHeader
                  title={"Nhiệm vụ hôm nay (Daily Quests)"}
                  right={<SmallLink onClick={() => navigate("/practice")} theme={t}>View all</SmallLink>}
                  theme={t}
                />
                <div className="mt-4 space-y-3">
                  {dashboardData.todayTasks.length > 0 ? (
                    dashboardData.todayTasks.map((task, i) => <TaskRow key={i} {...task} />)
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No practice tasks for today</p>
                  )}
                </div>
              </Card>

              <Card theme={t}>
                <CardHeader
                  title="Tiến độ học tập"
                  right={<span className="text-xs font-medium text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1.5 rounded-lg">Tuần này</span>}
                  theme={t}
                />
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-linear-to-r from-[#6C5CE7]/10 to-[#00CEC9]/10 border border-[#6C5CE7]/20">
                    <div>
                      <div className="text-sm text-slate-600 font-medium">Tổng thời gian</div>
                      <div className="text-3xl font-bold text-slate-800 mt-1">
                        {dashboardData.weeklyTimeSpent.total > 0
                          ? `${Math.floor(dashboardData.weeklyTimeSpent.total / 60)}h ${dashboardData.weeklyTimeSpent.total % 60}m`
                          : "0h 0m"}
                      </div>
                    </div>
                    <div className="text-4xl"></div>
                  </div>
                  <div className="space-y-4">
                    {(dashboardData.weeklyTimeSpent.breakdown.length > 0
                      ? dashboardData.weeklyTimeSpent.breakdown
                      : [
                          { label: "Writing",   value: 0, color: "#6C5CE7", icon: "" },
                          { label: "Speaking",  value: 0, color: "#00CEC9", icon: "" },
                          { label: "Reading",   value: 0, color: "#A29BFE", icon: "" },
                          { label: "Listening", value: 0, color: "#74B9FF", icon: "" },
                        ]
                    ).map((skill, idx) => {
                      const totalTime = dashboardData.weeklyTimeSpent.total || 1;
                      const percentage = Math.round((skill.value / totalTime) * 100) || 0;
                      const hours = Math.floor(skill.value / 60);
                      const mins = skill.value % 60;
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{skill.icon || ""}</span>
                              <span className="font-semibold text-slate-700">{skill.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500">
                                {skill.value > 0 ? `${hours}h ${mins}m` : "0m"}
                              </span>
                              <span className="text-sm font-bold text-[#6C5CE7] min-w-10 text-right">{percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%`, background: `linear-gradient(to right, ${skill.color}, ${skill.color}dd)` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-600">
                      {dashboardData.weeklyTimeSpent.total > 0
                        ? " Tuyệt vời! Tiếp tục phát huy nhé!"
                        : " Hãy bắt đầu luyện tập ngay hôm nay!"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className={cn("rounded-3xl border", t.border, t.card, "p-5 md:p-6")}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className={cn("text-base font-semibold", t.text)}>Quick Actions</div>
                  <div className={cn("text-sm", t.sub)}>Bắt đầu nhanh 1 bài trong 10 phút</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Pill icon={<FaPenFancy />}      label="Writing"      onClick={() => navigate("/ai-writing")} />
                  <Pill icon={<FaMicrophoneAlt />} label="Speaking"     onClick={() => navigate("/ai-speaking")} />
                  <Pill icon={<FaComments />}      label="Conversation" onClick={() => navigate("/ai-conversation")} />
                  <Pill icon={<FaChartPie />}      label="Mock Test"    onClick={() => navigate("/mock-tests")} />
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside className="space-y-6">
            <div className="min-h-44">
              <PetWidget theme={t} />
            </div>
            <Card>
              <CardHeader
                title="Latest Score"
                right={<SmallLink onClick={() => navigate("/progress")}>View all</SmallLink>}
              />
              <div className="mt-5 space-y-3">
                {dashboardData.latestScores.length > 0 ? (
                  dashboardData.latestScores.map((s, i) => <ScoreRow key={i} score={s.score} label={s.label} />)
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No scores yet</p>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader
                title="Reminder"
                right={<SmallLink onClick={() => navigate("/reminders")}>View all</SmallLink>}
              />
              <div className="mt-5 space-y-3">
                {dashboardData.reminders.length > 0 ? (
                  dashboardData.reminders.map((r, i) => <ReminderRow key={i} label={r.label} />)
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
