import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiHome, FiBook, FiHeadphones, FiEdit3, FiUsers, FiBookOpen, FiFileText } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

/**
 * AdminLayout - Modern professional layout for admin panel
 * - Beautiful gradient sidebar with clear hover states
 * - Professional header with search and notifications
 * - Smooth animations and transitions
 */
function AdminLayout({ children }) {
  const [sidebarOpen, setShowSidebar] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: FiHome, label: 'Panel', path: '/admin' },
    { icon: FiUsers, label: 'User', path: '/admin/users' },
    { icon: FiBook, label: 'Topic', path: '/admin/topics' },
    { icon: FiBookOpen, label: 'Vocabulary', path: '/admin/vocabulary' },
    { icon: FiFileText, label: 'Reading Passages', path: '/admin/reading-passages' },
    { icon: FiEdit3, label: 'Writing Scenarios', path: '/admin/writing-scenarios' },
    { icon: FiHeadphones, label: 'Speaking Questions', path: '/admin/speaking-questions' },
    { icon: FiEdit3, label: 'Writing Prompts', path: '/admin/writing-prompts' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Sidebar with Gradient Background */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-linear-to-b from-gray-900 to-gray-950 border-r border-purple-500/20 transition-all duration-300 flex flex-col shadow-2xl shadow-purple-500/10`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-purple-500/20 bg-linear-to-r from-purple-600/10 to-blue-600/10">
          <div className={`font-bold text-2xl ${!sidebarOpen && 'hidden'}`}>
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-blue-500 bg-clip-text text-transparent">
              HIDAY ENGLISH
            </span>
          </div>
          <button
            onClick={() => setShowSidebar(!sidebarOpen)}
            className="p-2.5 rounded-xl hover:bg-purple-500/20 transition-all duration-200 text-purple-400 hover:text-purple-300 hover:scale-110"
          >
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-linear-to-r hover:from-purple-600/20 hover:to-blue-600/20'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={22} className={`shrink-0 ${active ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'}`} />
                {sidebarOpen && (
                  <span className={`text-sm font-semibold ${active ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                )}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-linear-to-b from-purple-400 to-blue-500 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-purple-500/20 bg-linear-to-r from-purple-600/5 to-blue-600/5">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20">
                <div className="w-11 h-11 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/30">
                  {user?.user_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.user_name || 'Admin'}</p>
                  <p className="text-xs text-purple-300 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/40"
              >
                <FiLogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-3 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-200 border border-red-500/20"
              title="Đăng xuất"
            >
              <FiLogOut size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Professional Header */}
        <header className="h-20 bg-gray-900/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-8 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Quản trị viên'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Chào mừng trở lại, {user?.user_name || 'Admin'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/30">
              <p className="text-xs text-purple-300 font-medium">Vai trò</p>
              <p className="text-sm font-bold text-white">{user?.role?.toUpperCase()}</p>
            </div>
          </div>
        </header>

        {/* Content Area with Beautiful Background */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
