import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import dashboardService from "../services/dashboardService";
import PetWidget from "../components/PetWidget";
import { dashboardRefreshEmitter } from "../utils/dashboardRefresh";

import { cn, theme, darkTheme } from "../utils/dashboardTheme";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardTopbar from "../components/dashboard/DashboardTopbar";
import DashboardWelcome from "../components/dashboard/DashboardWelcome";
import {
  Card,
  CardHeader,
  SmallLink,
  Pill,
  ScoreRow,
  ReminderRow,
  StatCard,
  SkillBar,
  UpNextCard,
  DailyQuestCard,
  ActivityHeatmap,
  CoinBadge,
  StreakFlame,
} from "../components/dashboard/DashboardCards";
import LoadingCat from "../components/shared/LoadingCat";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = isDark ? darkTheme : theme;

  // No icon helper needed — we removed per-row icons

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
            coins: userInfo.gamification_data?.coins ?? userInfo.gamification_data?.gold ?? 0,
            // Build a 7-element boolean array (Mon→Sun) from streak value
            activityWeek: (() => {
              const streak = userInfo.gamification_data?.streak || 0;
              // Fill last `streak` days as active, cap at 7
              const arr = Array(7).fill(false);
              const active = Math.min(streak, 7);
              for (let i = 7 - active; i < 7; i++) arr[i] = true;
              return arr;
            })(),
          },
          todayTasks: todayTasks.map((task) => ({
            id: task.id,
            title: task.title,
            subtitle: task.subtitle || task.description,
            percent: task.progress || 0,
            type: task.type,
            actionUrl: task.actionUrl,
            actionText: task.actionText,
            reward: task.reward,
            lessonId: task.lessonId,
            lessonType: task.lessonType,
          })),
          weeklyTimeSpent: {
            total: timeSpent.total || 0,
            breakdown: timeSpent.breakdown || [],
          },
          activityHeatmap: timeSpent.activityHeatmap || [],
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

  // ─── REAL-TIME DASHBOARD REFRESH ───────────────────────────────────────────
  const refreshDashboard = async () => {
    if (isRefreshing || !user) return;
    try {
      setIsRefreshing(true);
      const [userProfile, todayTasks, timeSpent, latestScores] = await Promise.all([
        dashboardService.getUserProfile(),
        dashboardService.getTodayTasks(),
        dashboardService.getTimeSpent("week"),
        dashboardService.getLatestScores(3),
      ]);
      
      const userInfo = userProfile.user || userProfile;
      
      // Update only changed data (optimistic update)
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          streak: userInfo.gamification_data?.streak || 0,
          totalXP: userInfo.gamification_data?.exp || 0,
          level: userInfo.gamification_data?.level || 1,
          coins: userInfo.gamification_data?.coins ?? userInfo.gamification_data?.gold ?? 0,
        },
        todayTasks: todayTasks.map((task) => ({
          id: task.id,
          title: task.title,
          subtitle: task.subtitle || task.description,
          percent: task.progress || 0,
          type: task.type,
          actionUrl: task.actionUrl,
          actionText: task.actionText,
          reward: task.reward,
          lessonId: task.lessonId,
          lessonType: task.lessonType,
        })),
        weeklyTimeSpent: {
          total: timeSpent.total || 0,
          breakdown: timeSpent.breakdown || [],
        },
        activityHeatmap: timeSpent.activityHeatmap || [],
        latestScores: latestScores.map((s) => {
          const value = s.score ?? s.value ?? s.band ?? 0;
          const date = s.date || s.test_date || s.createdAt || s.timestamp;
          const prettyDate = date ? ` - ${new Date(date).toLocaleDateString()}` : "";
          const name = s.label || s.test_name || s.name || s.title || s.type || s.skill;
          return { score: value, label: name ? `${name}${prettyDate}` : `Test${prettyDate}` };
        }),
      }));
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds for Real-Time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (dashboardData) {
        refreshDashboard();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [dashboardData, user, isRefreshing]);

  // Listen for external refresh events (e.g., from LessonPlayer after completing lesson)
  useEffect(() => {
    const unsubscribe = dashboardRefreshEmitter.on(() => {
      if (!isRefreshing) {
        console.log('[Dashboard] Refresh triggered from external source');
        refreshDashboard();
      }
    });
    return unsubscribe;
  }, [isRefreshing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <LoadingCat size={300} text="Đang tải dữ liệu học tập..." />
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
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex gap-5">

          {/* ── SIDEBAR ─────────────────────────────── */}
          <DashboardSidebar active={active} setActive={setActive} onLogout={handleLogout} theme={t} />

          {/* ── MAIN CONTENT ────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Topbar with inline gamification badges */}
            <div className="flex items-center justify-between gap-3">
              <DashboardTopbar user={dashboardData.user} theme={t} />
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <StreakFlame days={dashboardData.stats.streak} />
                <CoinBadge amount={dashboardData.stats.coins} />
              </div>
            </div>

            {/* Placement nudge */}
            {!dashboardData.user.hasCompletedPlacementTest && (
              <DashboardWelcome
                name={dashboardData.user.name}
                hasDonePlacementTest={dashboardData.user.hasCompletedPlacementTest}
                ctaVariant={dashboardData.user.wantsPlacementCheck ? 'placement' : (dashboardData.user.selfAssessedLevel ? 'path' : 'placement')}
                ctaLabel={(() => {
                  const map = { stranger: 'Mới bắt đầu', old_friend: 'Cơ bản', learning: 'Trung bình', close_friend: 'Khá tốt' };
                  const lvl = dashboardData.user.selfAssessedLevel;
                  return lvl ? `Bắt đầu lộ trình ${map[lvl] || lvl}` : 'Làm bài kiểm tra trình độ';
                })()}
                onStartTest={handleStartPlacementTest}
                onStartPath={() => navigate('/practice')}
                theme={t}
              />
            )}

            {/* ── Hero stat strip ─────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Streak"
                value={`${dashboardData.stats.streak} ngày`}
                sub={dashboardData.stats.streak >= 3 ? "🔥 Đang cháy!" : "Bắt đầu nhé!"}
                accent="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100"
              />
              <StatCard
                label="Tổng XP"
                value={dashboardData.stats.totalXP.toLocaleString()}
                sub={`Cấp ${dashboardData.stats.level}`}
                accent="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100"
              />
              <StatCard
                label="Thời gian tuần"
                value={dashboardData.weeklyTimeSpent.total > 0
                  ? `${Math.floor(dashboardData.weeklyTimeSpent.total / 60)}h ${dashboardData.weeklyTimeSpent.total % 60}m`
                  : "—"}
                sub="Tổng học tập"
              />
              <StatCard
                label="Band hiện tại"
                value={dashboardData.user.currentBand ?? "—"}
                sub={dashboardData.user.targetBand ? `🎯 Mục tiêu: ${dashboardData.user.targetBand}` : "Chưa thi"}
                accent="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100"
              />
            </div>

            {/* ── AI UpNext + Activity heatmap ────── */}
            {dashboardData.todayTasks.length > 0 && (
              <UpNextCard
                title={dashboardData.todayTasks[0].title}
                skill={dashboardData.todayTasks[0].subtitle || "IELTS"}
                duration={dashboardData.todayTasks[0].lessonType === 'continue' ? "Tiếp tục" : "Bắt đầu"}
                onClick={() => {
                  if (dashboardData.todayTasks[0].actionUrl) {
                    navigate(dashboardData.todayTasks[0].actionUrl);
                  } else {
                    navigate("/learn");
                  }
                }}
                actionText={dashboardData.todayTasks[0].actionText || "Bắt đầu"}
              />
            )}

            {/* ── 2-col: Daily quests + Skill bars ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* Daily quests with action buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">🎯 Nhiệm vụ hôm nay</h3>
                  <button
                    onClick={refreshDashboard}
                    disabled={isRefreshing}
                    className={cn(
                      "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                      isRefreshing 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    )}
                  >
                    {isRefreshing ? "🔄..." : "🔄 Cập nhật"}
                  </button>
                </div>
                {dashboardData.todayTasks.map((task, idx) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.subtitle}</p>
                      </div>
                      {task.reward && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{task.reward}</span>}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-linear-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(task.percent, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{task.percent}%</span>
                      {task.actionUrl && (
                        <button
                          onClick={() => navigate(task.actionUrl)}
                          className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                        >
                          {task.actionText || "Bắt đầu"} →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Skill breakdown */}
              <Card theme={t}>
                <CardHeader
                  title="Tiến độ kỹ năng"
                  right={<span className="text-xs font-bold text-indigo-400 bg-indigo-50 px-2.5 py-1 rounded-lg">Tuần này</span>}
                  theme={t}
                />
                <div>
                  {(dashboardData.weeklyTimeSpent.breakdown && dashboardData.weeklyTimeSpent.breakdown.length > 0
                    ? dashboardData.weeklyTimeSpent.breakdown
                    : [
                      { label: "Lessons", value: 0, color: "#6366F1" },
                      { label: "Writing", value: 0, color: "#8B5CF6" },
                      { label: "Speaking", value: 0, color: "#10B981" },
                      { label: "Reading", value: 0, color: "#06B6D4" },
                      { label: "Listening", value: 0, color: "#3B82F6" },
                      { label: "Vocabulary", value: 0, color: "#F59E0B", isCount: true },
                      { label: "Translation", value: 0, color: "#EC4899" },
                    ]
                  ).map((skill, idx) => (
                    <SkillBar
                      key={idx}
                      label={skill.label}
                      value={skill.value}
                      total={skill.isCount ? (skill.target || 100) : (dashboardData.weeklyTimeSpent.total || 1)}
                      color={skill.color || "#6366F1"}
                      isCount={skill.isCount}
                    />
                  ))}
                </div>

                {/* Activity heatmap at bottom of skill card */}
                <ActivityHeatmap activeDays={
                  dashboardData.activityHeatmap.length > 0 
                  ? dashboardData.activityHeatmap.map(d => d.minutes > 0) 
                  : dashboardData.stats.activityWeek
                } />
              </Card>
            </div>

            {/* ── Quick actions ────────────────────── */}
            <Card theme={t}>
              <CardHeader title="Luyện tập nhanh" theme={t} />
              <div className="flex flex-wrap gap-2">
                <Pill emoji="✍️" label="Writing" onClick={() => navigate("/ai-writing")} />
                <Pill emoji="�" label="Listening" onClick={() => navigate("/ai-listening")} />
                <Pill emoji="�🎙️" label="Speaking" onClick={() => navigate("/ai-speaking")} />
                <Pill emoji="💬" label="Conversation" onClick={() => navigate("/ai-conversation")} />
                <Pill emoji="📝" label="Mock Test" onClick={() => navigate("/mock-tests")} />
                <Pill emoji="📚" label="Từ vựng" onClick={() => navigate("/learn")} />
              </div>
            </Card>
          </div>

          {/* ── RIGHT PANEL ─────────────────────────── */}
          <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
            <PetWidget theme={t} />

            <Card>
              <CardHeader
                title="Điểm gần nhất"
                right={<SmallLink onClick={() => navigate("/progress")}>Xem tất cả</SmallLink>}
              />
              {dashboardData.latestScores.length > 0 ? (
                dashboardData.latestScores.map((s, i) => (
                  <ScoreRow key={i} score={s.score} label={s.label} />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Chưa có điểm nào</p>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Nhắc nhở"
                right={<SmallLink onClick={() => navigate("/reminders")}>Xem tất cả</SmallLink>}
              />
              {dashboardData.reminders.length > 0 ? (
                dashboardData.reminders.map((r, i) => (
                  <ReminderRow key={i} label={r.label} />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Không có nhắc nhở</p>
              )}
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
