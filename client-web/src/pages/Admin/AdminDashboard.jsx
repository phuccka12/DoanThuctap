import React, { useState, useEffect } from 'react';
import { FiBook, FiHeadphones, FiEdit3, FiTrendingUp, FiUsers, FiActivity } from 'react-icons/fi';
import adminService from '../../services/adminService';

/**
 * AdminDashboard - Modern Analytics Dashboard
 * Inspired by professional analytics design
 */
function AdminDashboard() {
  const [stats, setStats] = useState({
    topics: 0,
    speakingQuestions: 0,
    writingPrompts: 0,
    totalUsers: 0, // Đổi từ 4890 thành 0, sẽ load từ API
  });
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState('01.05.2024 - 31.05.2024');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Prefer aggregated admin stats endpoint if available
      try {
        const res = await adminService.getAdminStats();
        const totals = res.data.data.totals || {};
        const monthly = res.data.data.monthly || [];

        setStats(prev => ({
          ...prev,
          topics: totals.topics || 0,
          speakingQuestions: totals.speaking || 0,
          writingPrompts: totals.writing || 0,
          totalUsers: totals.users || prev.totalUsers
        }));

        // map monthly series to frontend-friendly structure
        if (monthly && monthly.length) {
          setMonthlyData(monthly.map((m) => ({ month: `T${m.month}`, value: m.total })));
        }
      } catch (e) {
        // Fallback to existing endpoints if stats endpoint not available
        const [topicsRes, speakingRes, writingRes, usersRes] = await Promise.all([
          adminService.getTopics(),
          adminService.getSpeakingQuestions(),
          adminService.getWritingPrompts(),
          adminService.getUserStats(), // Lấy thống kê người dùng thực
        ]);

        setStats(prev => ({
          ...prev,
          topics: topicsRes.data.data?.length || topicsRes.data.length || 0,
          speakingQuestions: speakingRes.data.data?.length || speakingRes.data.length || 0,
          writingPrompts: writingRes.data.data?.length || writingRes.data.length || 0,
          totalUsers: usersRes.data.data?.total || 0, // Số người dùng thực từ DB
        }));
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Monthly data for charts (populated from API)
  const [monthlyData, setMonthlyData] = useState([
    { month: 'T1', value: 0 },
    { month: 'T2', value: 0 },
    { month: 'T3', value: 0 },
    { month: 'T4', value: 0 },
    { month: 'T5', value: 0 },
    { month: 'T6', value: 0 },
    { month: 'T7', value: 0 },
    { month: 'T8', value: 0 },
    { month: 'T9', value: 0 },
    { month: 'T10', value: 0 },
    { month: 'T11', value: 0 },
    { month: 'T12', value: 0 },
  ]);

  const recentActivities = [
    { name: 'Chủ đề Công nghệ', location: 'Chủ đề', date: '22.08.2025', status: 'Hoạt động', amount: '15 câu hỏi' },
    { name: 'Speaking Part 2', location: 'Speaking', date: '24.08.2025', status: 'Đã xử lý', amount: '8 câu hỏi' },
    { name: 'Writing Task 1', location: 'Writing', date: '18.08.2025', status: 'Chờ duyệt', amount: '12 đề bài' },
    { name: 'Trình độ Nâng cao', location: 'Chủ đề', date: '03.08.2025', status: 'Hoạt động', amount: '20 câu hỏi' },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'hoạt động':
      case 'active':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'đã xử lý':
      case 'processed':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'chờ duyệt':
      case 'pending':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">Analytics</h2>
          <p className="text-gray-400 text-sm mt-1">{dateRange}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 text-xl">
            🔔
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 text-xl">
            🔍
          </button>
        </div>
      </div>

      {/* Stats Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Topics Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">Topics</div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FiBook className="text-white" size={20} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">{stats.topics}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-400">↑ 4.3%</span>
                <span className="text-gray-500">so với tháng trước</span>
              </div>
            </div>
            {/* Mini donut chart */}
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="75, 100" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">75%</div>
            </div>
          </div>
        </div>

        {/* Speaking Questions Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">Speaking</div>
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FiHeadphones className="text-white" size={20} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">{stats.speakingQuestions}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-400">↑ 2.7%</span>
                <span className="text-gray-500">so với tháng trước</span>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="62, 100" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">62%</div>
            </div>
          </div>
        </div>

        {/* Writing Prompts Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">Writing</div>
            <div className="w-12 h-12 bg-linear-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <FiEdit3 className="text-white" size={20} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">{stats.writingPrompts}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-red-400">↓ 1.2%</span>
                <span className="text-gray-500">so với tháng trước</span>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="88, 100" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">88%</div>
            </div>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">User</div>
            <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <FiUsers className="text-white" size={20} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-400">↑ 8.5%</span>
                <span className="text-gray-500">so với tháng trước</span>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="95, 100" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">95%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Hoạt động nội dung</h3>
              <p className="text-sm text-gray-400 mt-1">Xu hướng tạo nội dung hàng tháng</p>
            </div>
            <select className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500">
              <option>2024</option>
              <option>2025</option>
            </select>
          </div>
          
          {/* Bar Chart */}
          <div className="flex items-end justify-between h-48 gap-2">
            {monthlyData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-700/30 rounded-t-lg relative group cursor-pointer hover:bg-gray-700/40 transition-colors" style={{ height: `${item.value}%` }}>
                  <div className="absolute inset-0 bg-linear-to-t from-purple-500 via-purple-400 to-blue-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    {item.value}
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Engagement Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Tương tác người dùng</h3>
              <p className="text-sm text-gray-400 mt-1">Hoạt động tổng thể trên nền tảng</p>
            </div>
            <select className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500">
              <option>2024</option>
              <option>2025</option>
            </select>
          </div>

          {/* Area Chart */}
          <div className="h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 0 120 Q 50 100, 100 80 T 200 60 T 300 40 T 400 30 L 400 150 L 0 150 Z"
                fill="url(#areaGradient)"
              />
              <path
                d="M 0 120 Q 50 100, 100 80 T 200 60 T 300 40 T 400 30"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
              />
            </svg>
            <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700/50">
              <div className="text-xs text-gray-400">Người dùng đang hoạt động</div>
              <div className="text-xl font-bold text-white">2,847</div>
              <div className="text-xs text-green-400">+12.5% hôm nay</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
              <p className="text-sm text-gray-400 mt-1">Cập nhật và thay đổi nội dung mới nhất</p>
            </div>
            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1 transition-colors">
              Xem tất cả
              <span>→</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Số lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {recentActivities.map((activity, idx) => (
                <tr key={idx} className="hover:bg-gray-700/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{activity.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{activity.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{activity.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{activity.amount}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
