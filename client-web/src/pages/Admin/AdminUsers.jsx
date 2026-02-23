import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiEdit2, FiTrash2, FiShield, FiLock, FiUnlock, FiX, FiCheck, FiPlus, FiBarChart2, FiEye, FiClock, FiTrendingUp, FiAward, FiActivity, FiDownload, FiCreditCard } from 'react-icons/fi';
import adminService from '../../services/adminService';
import * as XLSX from 'xlsx';
import UserProfileDrawer from '../../components/UserProfileDrawer';
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [profileDrawerUserId, setProfileDrawerUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    user_name: '',
    role: 'standard',
    email_verified: false,
    onboarding_completed: false
  });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    user_name: '',
    role: 'standard',
    status: 'active',
    email_verified: false,
    onboarding_completed: false,
    newPassword: '', // Thêm field mật khẩu vào form chỉnh sửa
    'gamification_data.level': 1,
    'gamification_data.gold': 0,
    'gamification_data.exp': 0,
    'gamification_data.streak': 0,
  });

  // User Details/Analytics Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Statistics
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      };

      const res = await adminService.getUsers(params);
      const data = res.data.data;
      
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminService.getUserStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // CREATE USER
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(createForm);
      alert('Tạo người dùng thành công');
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        password: '',
        user_name: '',
        role: 'standard',
        email_verified: false,
        onboarding_completed: false
      });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo người dùng');
    }
  };

  // EDIT USER
  const handleEdit = async (user) => {
    setEditingUser(user);
    setEditForm({
      user_name: user.user_name,
      role: user.role,
      status: user.status,
      email_verified: user.email_verified,
      onboarding_completed: user.onboarding_completed,
      newPassword: '', // Reset password field
      'gamification_data.level': user.gamification_data?.level || 1,
      'gamification_data.gold': user.gamification_data?.gold || 0,
      'gamification_data.exp': user.gamification_data?.exp || 0,
      'gamification_data.streak': user.gamification_data?.streak || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse gamification data
      const updateData = {
        user_name: editForm.user_name,
        role: editForm.role,
        status: editForm.status,
        email_verified: editForm.email_verified,
        onboarding_completed: editForm.onboarding_completed,
        gamification_data: {
          level: parseInt(editForm['gamification_data.level']),
          gold: parseInt(editForm['gamification_data.gold']),
          exp: parseInt(editForm['gamification_data.exp']),
          streak: parseInt(editForm['gamification_data.streak']),
        }
      };

      await adminService.updateUser(editingUser._id, updateData);

      // Nếu có nhập mật khẩu mới, đổi mật khẩu
      if (editForm.newPassword && editForm.newPassword.length >= 6) {
        await adminService.resetPassword(editingUser._id, editForm.newPassword);
      }

      alert('Cập nhật người dùng thành công' + (editForm.newPassword ? ' (bao gồm mật khẩu)' : ''));
      setShowEditModal(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  // BAN/UNBAN
  const handleBanToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    const confirmMsg = newStatus === 'banned' 
      ? 'Bạn có chắc muốn cấm người dùng này?' 
      : 'Bạn có chắc muốn mở khóa người dùng này?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.updateUserStatus(user._id, newStatus);
      alert(`${newStatus === 'banned' ? 'Cấm' : 'Mở khóa'} người dùng thành công`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  // DELETE
  const handleDelete = async (user) => {
    if (user.role === 'admin') {
      alert('Không thể xóa tài khoản admin');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${user.user_name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      await adminService.deleteUser(user._id);
      alert('Xóa người dùng thành công');
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  // VIEW USER DETAILS & ANALYTICS
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // OPEN PROFILE DRAWER (Subscription / AI Usage / Learning)
  const handleOpenProfileDrawer = (user) => {
    setProfileDrawerUserId(user._id);
  };

  // EXPORT TO EXCEL
  const handleExportToExcel = () => {
    try {
      // Chuẩn bị dữ liệu cho Excel
      const exportData = users.map((user, index) => ({
        'STT': index + 1,
        'Tên người dùng': user.user_name || '',
        'Email': user.email || '',
        'Vai trò': user.role === 'admin' ? 'Admin' : user.role === 'vip' ? 'VIP' : 'Standard',
        'Trạng thái': user.status === 'active' ? 'Hoạt động' : 'Đã cấm',
        'Email xác thực': user.email_verified ? 'Đã xác thực' : 'Chưa xác thực',
        'Onboarding': user.onboarding_completed ? 'Hoàn thành' : 'Chưa hoàn thành',
        'Level': user.gamification_data?.level || 1,
        'Gold': user.gamification_data?.gold || 0,
        'EXP': user.gamification_data?.exp || 0,
        'Streak': user.gamification_data?.streak || 0,
        'Bài học hoàn thành': user.learning_progress?.completed_lessons?.length || 0,
        'Bài tập đã làm': user.learning_progress?.completed_exercises?.length || 0,
        'Chủ đề đã học': user.learning_progress?.topics_studied?.length || 0,
        'Điểm TB': (user.learning_progress?.average_score || 0).toFixed(1),
        'Điểm cao nhất': user.learning_progress?.highest_score || 0,
        'Thời gian học (giờ)': Math.floor((user.learning_progress?.total_study_time || 0) / 60),
        'Đăng nhập cuối': user.last_login ? new Date(user.last_login).toLocaleString('vi-VN') : 'Chưa đăng nhập',
        'Ngày tạo': new Date(user.created_at).toLocaleString('vi-VN'),
        'Cập nhật cuối': new Date(user.updated_at).toLocaleString('vi-VN'),
      }));

      // Tạo worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Tự động điều chỉnh độ rộng cột
      const colWidths = [
        { wch: 5 },   // STT
        { wch: 20 },  // Tên
        { wch: 30 },  // Email
        { wch: 12 },  // Vai trò
        { wch: 12 },  // Trạng thái
        { wch: 15 },  // Email xác thực
        { wch: 15 },  // Onboarding
        { wch: 8 },   // Level
        { wch: 10 },  // Gold
        { wch: 10 },  // EXP
        { wch: 8 },   // Streak
        { wch: 18 },  // Bài học
        { wch: 15 },  // Bài tập
        { wch: 15 },  // Chủ đề
        { wch: 10 },  // Điểm TB
        { wch: 13 },  // Điểm cao nhất
        { wch: 18 },  // Thời gian học
        { wch: 20 },  // Đăng nhập cuối
        { wch: 20 },  // Ngày tạo
        { wch: 20 },  // Cập nhật
      ];
      ws['!cols'] = colWidths;

      // Tạo workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách người dùng');

      // Xuất file
      const fileName = `DanhSachNguoiDung_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      alert('Xuất file Excel thành công!');
    } catch (err) {
      console.error('Export error:', err);
      alert('Không thể xuất file Excel: ' + err.message);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'vip':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active'
      ? 'bg-green-500/10 text-green-400 border-green-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-100">Quản lý người dùng</h2>
            <p className="text-gray-400 text-sm mt-1">Tổng cộng {totalUsers} người dùng</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportToExcel}
              disabled={users.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
              title="Xuất danh sách ra Excel"
            >
              <FiDownload size={20} />
              Xuất Excel
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30"
            >
              <FiPlus size={20} />
              Tạo tài khoản mới
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Tổng số</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FiUsers className="text-blue-400" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <FiCheck className="text-green-400" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Đã cấm</p>
                  <p className="text-2xl font-bold text-red-400">{stats.banned}</p>
                </div>
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <FiLock className="text-red-400" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">VIP</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.byRole.vip}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <FiShield className="text-yellow-400" size={20} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm theo email hoặc tên..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tất cả vai trò</option>
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="banned">Đã cấm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/30 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-700/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white">
                        {user.user_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.user_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {user.email_verified && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <FiCheck size={12} /> Xác thực
                            </span>
                          )}
                          {user.onboarding_completed && (
                            <span className="text-xs text-blue-400">• Onboarded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'vip' ? 'VIP' : 'Standard'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(user.status)}`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Đã cấm'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      Lv {user.gamification_data?.level || 1} • {user.gamification_data?.gold || 0} 🪙
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenProfileDrawer(user)}
                        className="p-2 hover:bg-gray-700 rounded transition text-emerald-400"
                        title="Hồ sơ: Gói cước & AI Usage"
                      >
                        <FiCreditCard size={18} />
                      </button>
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="p-2 hover:bg-gray-700 rounded transition text-purple-400"
                        title="Xem chi tiết & phân tích"
                      >
                        <FiBarChart2 size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-gray-700 rounded transition text-blue-400"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleBanToggle(user)}
                        className={`p-2 hover:bg-gray-700 rounded transition ${
                          user.status === 'active' ? 'text-red-400' : 'text-green-400'
                        }`}
                        title={user.status === 'active' ? 'Cấm' : 'Mở khóa'}
                      >
                        {user.status === 'active' ? <FiLock size={18} /> : <FiUnlock size={18} />}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 hover:bg-gray-700 rounded transition text-red-400"
                          title="Xóa"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400">
            Không tìm thấy người dùng nào
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Tạo tài khoản mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tên người dùng</label>
                <input
                  type="text"
                  value={createForm.user_name}
                  onChange={(e) => setCreateForm({ ...createForm, user_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Để trống = lấy từ email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vai trò</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="standard">Standard</option>
                  <option value="vip">VIP</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create_email_verified"
                  checked={createForm.email_verified}
                  onChange={(e) => setCreateForm({ ...createForm, email_verified: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600"
                />
                <label htmlFor="create_email_verified" className="text-sm text-gray-300">Email đã xác thực</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create_onboarding_completed"
                  checked={createForm.onboarding_completed}
                  onChange={(e) => setCreateForm({ ...createForm, onboarding_completed: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600"
                />
                <label htmlFor="create_onboarding_completed" className="text-sm text-gray-300">Đã hoàn thành onboarding</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Tạo tài khoản
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL - Đầy đủ thông tin */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Chỉnh sửa người dùng</h3>
                <p className="text-sm text-gray-400 mt-1">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-purple-400 uppercase">Thông tin cơ bản</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tên người dùng</label>
                    <input
                      type="text"
                      value={editForm.user_name}
                      onChange={(e) => setEditForm({ ...editForm, user_name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vai trò</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="vip">VIP</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="banned">Đã cấm</option>
                  </select>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_email_verified"
                      checked={editForm.email_verified}
                      onChange={(e) => setEditForm({ ...editForm, email_verified: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 text-purple-600"
                    />
                    <label htmlFor="edit_email_verified" className="text-sm text-gray-300">Email đã xác thực</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_onboarding_completed"
                      checked={editForm.onboarding_completed}
                      onChange={(e) => setEditForm({ ...editForm, onboarding_completed: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 text-purple-600"
                    />
                    <label htmlFor="edit_onboarding_completed" className="text-sm text-gray-300">Đã hoàn thành onboarding</label>
                  </div>
                </div>
              </div>

              {/* Đổi mật khẩu */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-yellow-400 uppercase">Đổi mật khẩu (Tùy chọn)</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                    placeholder="Để trống nếu không muốn đổi mật khẩu"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Nhập mật khẩu mới (tối thiểu 6 ký tự) nếu muốn đổi. Để trống nếu không cần thay đổi.
                  </p>
                </div>
              </div>

              {/* Gamification Data */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-blue-400 uppercase">Dữ liệu Gamification</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                    <input
                      type="number"
                      value={editForm['gamification_data.level']}
                      onChange={(e) => setEditForm({ ...editForm, 'gamification_data.level': e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gold (🪙)</label>
                    <input
                      type="number"
                      value={editForm['gamification_data.gold']}
                      onChange={(e) => setEditForm({ ...editForm, 'gamification_data.gold': e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Experience (EXP)</label>
                    <input
                      type="number"
                      value={editForm['gamification_data.exp']}
                      onChange={(e) => setEditForm({ ...editForm, 'gamification_data.exp': e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Streak (🔥)</label>
                    <input
                      type="number"
                      value={editForm['gamification_data.streak']}
                      onChange={(e) => setEditForm({ ...editForm, 'gamification_data.streak': e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAILS & ANALYTICS MODAL */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xl">
                  {selectedUser.user_name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedUser.user_name}</h3>
                  <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <FiX size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FiUsers className="text-purple-400" />
                  Thông tin cơ bản
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Vai trò</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'vip' ? 'VIP' : 'Standard'}
                    </span>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Trạng thái</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(selectedUser.status)}`}>
                      {selectedUser.status === 'active' ? 'Hoạt động' : 'Đã cấm'}
                    </span>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Email xác thực</p>
                    <p className="text-white font-medium">{selectedUser.email_verified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Onboarding</p>
                    <p className="text-white font-medium">{selectedUser.onboarding_completed ? '✅ Hoàn thành' : '❌ Chưa hoàn thành'}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Ngày tạo</p>
                    <p className="text-white font-medium">{new Date(selectedUser.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Cập nhật lần cuối</p>
                    <p className="text-white font-medium">{new Date(selectedUser.updated_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              {/* Gamification Stats */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FiBarChart2 className="text-yellow-400" />
                  Thống kê Gamification
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-linear-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-gray-400 text-sm mb-2">Level</p>
                    <p className="text-3xl font-bold text-purple-400">{selectedUser.gamification_data?.level || 1}</p>
                  </div>
                  <div className="bg-linear-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                    <p className="text-gray-400 text-sm mb-2">Gold</p>
                    <p className="text-3xl font-bold text-yellow-400">{selectedUser.gamification_data?.gold || 0} 🪙</p>
                  </div>
                  <div className="bg-linear-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                    <p className="text-gray-400 text-sm mb-2">EXP</p>
                    <p className="text-3xl font-bold text-blue-400">{selectedUser.gamification_data?.exp || 0}</p>
                  </div>
                  <div className="bg-linear-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
                    <p className="text-gray-400 text-sm mb-2">Streak</p>
                    <p className="text-3xl font-bold text-orange-400">{selectedUser.gamification_data?.streak || 0} 🔥</p>
                  </div>
                </div>
              </div>

              {/* Learning Progress */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-green-400" />
                  Tiến độ học tập & Thống kê
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Bài học */}
                  <div className="bg-linear-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FiEye className="text-blue-400" size={20} />
                        <p className="text-gray-300 font-medium">Bài học</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-400">
                        {selectedUser.learning_progress?.completed_lessons?.length || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Đã hoàn thành
                    </div>
                  </div>

                  {/* Bài tập */}
                  <div className="bg-linear-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FiActivity className="text-purple-400" size={20} />
                        <p className="text-gray-300 font-medium">Bài tập</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-400">
                        {selectedUser.learning_progress?.completed_exercises?.length || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Đã làm xong
                    </div>
                  </div>

                  {/* Điểm trung bình */}
                  <div className="bg-linear-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FiAward className="text-yellow-400" size={20} />
                        <p className="text-gray-300 font-medium">Điểm TB</p>
                      </div>
                      <span className="text-2xl font-bold text-yellow-400">
                        {(selectedUser.learning_progress?.average_score || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Cao nhất:</span>
                      <span className="text-green-400 font-semibold">
                        {selectedUser.learning_progress?.highest_score || 0}
                      </span>
                    </div>
                  </div>

                  {/* Thời gian học */}
                  <div className="bg-linear-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-green-400" size={20} />
                        <p className="text-gray-300 font-medium">Thời gian</p>
                      </div>
                      <span className="text-2xl font-bold text-green-400">
                        {Math.floor((selectedUser.learning_progress?.total_study_time || 0) / 60)}h
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Tổng thời gian học
                    </div>
                  </div>
                </div>

                {/* Chủ đề đã học */}
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-300 font-medium">Chủ đề đã học</p>
                    <span className="text-xl font-bold text-white">
                      {selectedUser.learning_progress?.topics_studied?.length || 0} chủ đề
                    </span>
                  </div>
                  {selectedUser.learning_progress?.topics_studied && selectedUser.learning_progress.topics_studied.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedUser.learning_progress.topics_studied.slice(0, 10).map((topicId, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                          Topic #{topicId.slice(-6)}
                        </span>
                      ))}
                      {selectedUser.learning_progress.topics_studied.length > 10 && (
                        <span className="px-3 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">
                          +{selectedUser.learning_progress.topics_studied.length - 10} nữa
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">Chưa học chủ đề nào</p>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FiActivity className="text-cyan-400" />
                  Lịch sử truy cập gần đây
                </h4>
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 divide-y divide-gray-700">
                  {/* Last Login */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <FiClock className="text-green-400" size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium">Lần đăng nhập cuối</p>
                        <p className="text-gray-400 text-sm">
                          {selectedUser.last_login 
                            ? new Date(selectedUser.last_login).toLocaleString('vi-VN')
                            : 'Chưa có dữ liệu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Created */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FiUsers className="text-blue-400" size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium">Tạo tài khoản</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(selectedUser.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {Math.floor((Date.now() - new Date(selectedUser.created_at)) / (1000 * 60 * 60 * 24))} ngày trước
                    </span>
                  </div>

                  {/* Last Update */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <FiEdit2 className="text-purple-400" size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium">Cập nhật lần cuối</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(selectedUser.updated_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              {selectedUser.provider && selectedUser.provider !== 'local' && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiShield className="text-green-400" />
                    Thông tin đăng nhập
                  </h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Phương thức đăng nhập</p>
                    <p className="text-white font-medium capitalize">{selectedUser.provider}</p>
                    {selectedUser.provider_id && (
                      <>
                        <p className="text-gray-400 text-sm mb-1 mt-3">Provider ID</p>
                        <p className="text-white font-mono text-sm">{selectedUser.provider_id}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedUser);
                }}
                className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <FiEdit2 size={18} />
                Chỉnh sửa
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Drawer - Subscription / AI Usage / Learning */}
      {profileDrawerUserId && (
        <UserProfileDrawer
          userId={profileDrawerUserId}
          onClose={() => setProfileDrawerUserId(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}

export default AdminUsers;
