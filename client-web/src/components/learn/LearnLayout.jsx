import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn, theme, darkTheme } from '../../utils/dashboardTheme';
import DashboardSidebar from '../dashboard/DashboardSidebar';
import ThemeToggle from '../ThemeToggle';
import {
  FaSignOutAlt, FaStar, FaChevronRight,
  FaBars, FaTimes, FaHome, FaGraduationCap,
} from 'react-icons/fa';
export default function LearnLayout({ children, breadcrumbs = [] }) {
  const navigate        = useNavigate();
  const location        = useLocation();
  const { user, logout } = useAuth();
  const { isDark }      = useTheme();
  const t               = isDark ? darkTheme : theme;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine active sidebar key from pathname
  const getActiveKeyFromPath = (p) => {
    if (!p) return 'dashboard';
    if (p.startsWith('/stories'))    return 'stories';
    if (p.startsWith('/vocabulary')) return 'vocabulary';
    if (p.startsWith('/reading'))    return 'reading';
    if (p.startsWith('/learn') || p.startsWith('/topics') || p.startsWith('/learn/')) return 'learn';
    if (p.startsWith('/ai-writing'))    return 'writing';
    if (p.startsWith('/ai-speaking'))   return 'speaking';
    if (p.startsWith('/ai-conversation')) return 'conversation';
    if (p.startsWith('/profile'))    return 'profile';
    if (p.startsWith('/settings'))   return 'settings';
    if (p.startsWith('/dashboard'))  return 'dashboard';
    return 'dashboard';
  };

  const activeKey = getActiveKeyFromPath(location.pathname);

  const handleNavClick = (item) => {
    setSidebarOpen(false);
    const routes = {
      dashboard:    '/dashboard',
      learn:        '/learn',
      roadmap:      '/learn',
      topics:       '/learn',
      vocabulary:   '/vocabulary',
      reading:      '/reading',
      stories:      '/stories',
      writing:      '/ai-writing',
      speaking:     '/ai-speaking',
      conversation: '/ai-conversation',
      feedback:     '/feedback',
      profile:      '/profile',
      settings:     '/settings',
    };
    if (routes[item.key]) navigate(routes[item.key]);
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (e) { console.error(e); }
  };

  const initials = user?.user_name
    ? user.user_name.substring(0, 2).toUpperCase()
    : user?.name?.substring(0, 2).toUpperCase() || 'ST';
  const displayName = user?.user_name || user?.name || 'Student';

  // Reuse shared DashboardSidebar component for consistency and to avoid duplication.

  return (
    <div className={cn('min-h-screen', t.page)}>
      <div className="max-w-400 mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">

          {/* ── Desktop Sidebar ── */}
          <div className="hidden lg:block sticky top-6">
            <DashboardSidebar active={activeKey} setActive={() => {}} onLogout={handleLogout} theme={t} />
          </div>

          {/* ── Mobile sidebar overlay ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 w-72 p-4">
                <DashboardSidebar active={activeKey} setActive={() => setSidebarOpen(false)} onLogout={handleLogout} theme={t} />
              </div>
            </div>
          )}

          {/* ── Main content ── */}
          <div className="min-w-0">
            {/* Topbar */}
            <div className={cn(
              'flex items-center justify-between gap-3 mb-5 px-4 py-3 rounded-2xl border shadow-sm',
              t.border, t.card
            )}>
              {/* Left: hamburger (mobile) + breadcrumb */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile hamburger */}
                <button
                  className="lg:hidden p-2 rounded-xl hover:bg-black/5 transition-all"
                  onClick={() => setSidebarOpen(true)}
                >
                  <FaBars className={cn('text-lg', t.sub)} />
                </button>

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-wrap">
                  <Link
                    to="/dashboard"
                    className={cn('flex items-center gap-1 hover:text-[#6C5CE7] transition-colors shrink-0', t.sub)}
                  >
                    <FaHome className="text-xs" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>

                  <FaChevronRight className="text-[10px] text-gray-400 shrink-0" />

                  <Link
                    to="/learn"
                    className={cn(
                      'flex items-center gap-1 hover:text-[#6C5CE7] transition-colors shrink-0',
                      breadcrumbs.length === 0 ? 'text-[#6C5CE7] font-semibold' : t.sub
                    )}
                  >
                    <FaGraduationCap className="text-xs" />
                    <span>Luyện Tập</span>
                  </Link>

                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <FaChevronRight className="text-[10px] text-gray-400 shrink-0" />
                      {crumb.to && idx < breadcrumbs.length - 1 ? (
                        <Link
                          to={crumb.to}
                          className={cn('hover:text-[#6C5CE7] transition-colors truncate max-w-30', t.sub)}
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={cn('font-semibold truncate max-w-40', t.text)}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              {/* Right: theme toggle + avatar */}
              <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle />
                <div className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm',
                  t.border, isDark ? 'bg-gray-700/50' : 'bg-white/60'
                )}>
                  <div className="w-7 h-7 rounded-full bg-linear-to-tr from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center font-bold text-xs">
                    {initials}
                  </div>
                  <span className={cn('text-sm font-medium hidden sm:block', t.text)}>{displayName}</span>
                </div>
              </div>
            </div>

            {/* Page content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
