import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiSearch, FiFilter, FiBarChart2 } from 'react-icons/fi';
import writingScenarioService from '../../services/writingScenarioService';
import CreateEditScenarioModal from '../../components/CreateEditScenarioModal';

const AdminWritingScenarios = () => {
  // States
  const [scenarios, setScenarios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    scenario_type: '',
    is_active: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0
  });

  // Fetch scenarios
  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });
      
      const result = await writingScenarioService.getAllScenarios(params);
      setScenarios(result.data.scenarios);
      setPagination(prev => ({
        ...prev,
        totalPages: result.data.totalPages,
        total: result.data.total
      }));
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      alert('Lỗi khi tải danh sách scenarios');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const result = await writingScenarioService.getStats();
      setStats(result.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchScenarios();
    fetchStats();
  }, [pagination.page, filters]);

  // Handle create
  const handleCreate = () => {
    setEditingScenario(null);
    setShowCreateModal(true);
  };

  // Handle edit
  const handleEdit = (scenario) => {
    setEditingScenario(scenario);
    setShowCreateModal(true);
  };

  // Handle duplicate
  const handleDuplicate = (scenario) => {
    const duplicated = {
      ...scenario,
      _id: undefined,
      title: `${scenario.title} (Copy)`,
      usage_count: 0,
      average_score: 0,
      completion_count: 0
    };
    setEditingScenario(duplicated);
    setShowCreateModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa scenario này?')) return;
    
    try {
      await writingScenarioService.deleteScenario(id);
      alert('Xóa thành công!');
      fetchScenarios();
      fetchStats();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Lỗi khi xóa scenario');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 scenario');
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} scenarios?`)) return;
    
    try {
      await writingScenarioService.bulkDeleteScenarios(selectedIds);
      alert('Xóa hàng loạt thành công!');
      setSelectedIds([]);
      fetchScenarios();
      fetchStats();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Lỗi khi xóa hàng loạt');
    }
  };

  // Handle save from modal
  const handleSave = async () => {
    setShowCreateModal(false);
    fetchScenarios();
    fetchStats();
  };

  // Toggle select
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === scenarios.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(scenarios.map(s => s._id));
    }
  };

  // Scenario type labels
  const scenarioTypeLabels = {
    messenger: '💬 Messenger',
    email: '📧 Email',
    comment: '💭 Comment',
    diary: '📔 Nhật ký',
    letter: '✉️ Thư tay',
    social_post: '📱 Social Post',
    review: '⭐ Review'
  };

  const levelLabels = {
    beginner: 'Mới bắt đầu',
    elementary: 'Cơ bản',
    intermediate: 'Trung cấp',
    upper_intermediate: 'Khá',
    advanced: 'Nâng cao',
    proficiency: 'Thành thạo'
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              🎮
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Writing Scenarios
              </h1>
              <p className="text-gray-400 text-sm">
                Tạo "màn chơi" viết văn với game rules và AI persona
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-xs font-medium uppercase">Tổng Scenarios</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FiBarChart2 className="text-purple-400 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-xs font-medium uppercase">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-xs font-medium uppercase">TB sử dụng</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.avgUsage}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-xl">
                  🔥
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border border-pink-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-300 text-xs font-medium uppercase">Loại phổ biến</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {Object.keys(stats.byType).sort((a, b) => stats.byType[b] - stats.byType[a])[0] || '-'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-xl">
                  🎯
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {/* Filters */}
            <select
              className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-white"
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            >
              <option value="">Tất cả Level</option>
              {Object.keys(levelLabels).map(key => (
                <option key={key} value={key}>{levelLabels[key]}</option>
              ))}
            </select>

            <select
              className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-white"
              value={filters.scenario_type}
              onChange={(e) => setFilters({ ...filters, scenario_type: e.target.value })}
            >
              <option value="">Tất cả loại</option>
              {Object.keys(scenarioTypeLabels).map(key => (
                <option key={key} value={key}>{scenarioTypeLabels[key]}</option>
              ))}
            </select>

            <select
              className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-white"
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm dừng</option>
            </select>

            {/* Actions */}
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 font-medium text-sm shadow-lg shadow-purple-500/30"
            >
              <FiPlus /> Tạo Scenario
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2 text-sm"
              >
                <FiTrash2 /> Xóa ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === scenarios.length && scenarios.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 bg-gray-700 border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Độ phức tạp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sử dụng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : scenarios.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                      Chưa có scenario nào. Nhấn "Tạo Scenario" để bắt đầu! 🎮
                    </td>
                  </tr>
                ) : (
                  scenarios.map((scenario) => (
                    <tr key={scenario._id} className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(scenario._id)}
                          onChange={() => toggleSelect(scenario._id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 bg-gray-700 border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white text-sm">{scenario.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs mt-1">
                            {scenario.context_description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">{scenarioTypeLabels[scenario.scenario_type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-medium border border-purple-500/30">
                          {levelLabels[scenario.level]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-300">{scenario.complexity_score || 0}</span>
                          <span className="text-xs text-gray-500">/10</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">{scenario.usage_count || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        {scenario.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-700/50 text-gray-400 rounded-full text-xs font-medium border border-gray-600/30">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(scenario)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(scenario)}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Nhân bản"
                          >
                            <FiCopy size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(scenario._id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && scenarios.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between bg-gray-900/30">
              <p className="text-sm text-gray-400">
                Hiển thị {scenarios.length} / {pagination.total} scenarios
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Trước
                </button>
                <span className="px-4 py-2 bg-purple-500/20 text-purple-300 font-medium rounded-lg border border-purple-500/30 text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateEditScenarioModal
          scenario={editingScenario}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminWritingScenarios;
