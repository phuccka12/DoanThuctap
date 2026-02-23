import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiMic,
  FiBarChart2, FiCheckSquare, FiSquare, FiRefreshCw
} from 'react-icons/fi';
import speakingQuestionService from '../../services/speakingQuestionService';
import topicService from '../../services/topicService';
import CreateEditSpeakingModal from '../../components/CreateEditSpeakingModal';

const PART_LABELS = { free: '🎙️ Free', p1: '📝 Part 1', p2: '📋 Part 2', p3: '💬 Part 3' };
const PART_COLORS = {
  free:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  p1:    'bg-blue-500/20   text-blue-400   border-blue-500/30',
  p2:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  p3:    'bg-green-500/20  text-green-400  border-green-500/30'
};
const DIFF_COLORS = {
  easy:   'bg-green-500/20  text-green-400  border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard:   'bg-red-500/20    text-red-400    border-red-500/30'
};

function AdminSpeakingQuestions() {
  const [questions, setQuestions]   = useState([]);
  const [topics, setTopics]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingQ, setEditingQ]     = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [filters, setFilters] = useState({ search: '', part: '', difficulty: '', cefr_level: '', is_active: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });

      const [qRes, statsRes, tRes] = await Promise.all([
        speakingQuestionService.getAllQuestions(params),
        speakingQuestionService.getStats(),
        topicService.getAllTopics()
      ]);

      setQuestions(qRes.data?.questions || []);
      setPagination(prev => ({ ...prev, totalPages: qRes.data?.totalPages || 1, total: qRes.data?.total || 0 }));
      setStats(statsRes.data);
      setTopics(tRes.data?.topics || tRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSave = async () => { setShowModal(false); setEditingQ(null); fetchAll(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    await speakingQuestionService.deleteQuestion(id);
    fetchAll();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !window.confirm(`Xóa ${selectedIds.length} câu hỏi?`)) return;
    await speakingQuestionService.bulkDelete(selectedIds);
    setSelectedIds([]);
    fetchAll();
  };

  const toggleSelect = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === questions.length ? [] : questions.map(q => q._id));

  const filterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <FiMic size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Speaking Questions</h1>
            <p className="text-gray-400 text-sm">Quản lý câu hỏi luyện nói IELTS</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingQ(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm font-medium"
        >
          <FiPlus size={16} /> Thêm câu hỏi
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng câu hỏi', value: stats.total,  color: 'purple', icon: '🎙️' },
            { label: 'Đang active',  value: stats.active,  color: 'green',  icon: '✅' },
            { label: 'Part 1',       value: stats.byPart?.find(p => p._id === 'p1')?.count || 0, color: 'blue',   icon: '📝' },
            { label: 'Part 2 & 3',   value: (stats.byPart?.find(p => p._id === 'p2')?.count || 0) + (stats.byPart?.find(p => p._id === 'p3')?.count || 0), color: 'orange', icon: '💬' }
          ].map(({ label, value, color, icon }) => (
            <div key={label} className={`bg-linear-to-br from-${color}-900/50 to-${color}-800/30 border border-${color}-500/30 rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <FiBarChart2 className={`text-${color}-400`} size={16} />
              </div>
              <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
              <div className="text-gray-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm câu hỏi..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={filters.search}
              onChange={e => filterChange('search', e.target.value)}
            />
          </div>

          {/* Part filter */}
          <select
            className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            value={filters.part}
            onChange={e => filterChange('part', e.target.value)}
          >
            <option value="">Tất cả Part</option>
            <option value="free">Free</option>
            <option value="p1">Part 1</option>
            <option value="p2">Part 2</option>
            <option value="p3">Part 3</option>
          </select>

          {/* Difficulty filter */}
          <select
            className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            value={filters.difficulty}
            onChange={e => filterChange('difficulty', e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* CEFR filter */}
          <select
            className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            value={filters.cefr_level}
            onChange={e => filterChange('cefr_level', e.target.value)}
          >
            <option value="">Tất cả CEFR</option>
            {['A1','A2','B1','B2','C1','C2'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status filter */}
          <select
            className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            value={filters.is_active}
            onChange={e => filterChange('is_active', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button onClick={fetchAll} className="p-2 text-gray-400 hover:text-white bg-gray-900/50 border border-gray-700 rounded-lg transition-colors">
            <FiRefreshCw size={14} />
          </button>

          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm">
              <FiTrash2 size={14} /> Xóa ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-900/50 border-b border-gray-700/50 px-4 py-3 flex items-center gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <button onClick={toggleAll} className="text-gray-400 hover:text-white">
            {selectedIds.length === questions.length && questions.length > 0
              ? <FiCheckSquare size={16} className="text-purple-400" />
              : <FiSquare size={16} />}
          </button>
          <div className="flex-1">Câu hỏi</div>
          <div className="w-24 text-center hidden md:block">Topic</div>
          <div className="w-20 text-center hidden md:block">Part</div>
          <div className="w-20 text-center hidden lg:block">Độ khó</div>
          <div className="w-16 text-center hidden lg:block">CEFR</div>
          <div className="w-20 text-center hidden lg:block">TG (s)</div>
          <div className="w-16 text-center">Status</div>
          <div className="w-20 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <FiRefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Đang tải...
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎙️</div>
            <p className="text-gray-400 text-lg">Chưa có câu hỏi nào</p>
            <p className="text-gray-500 text-sm mt-1">Nhấn "Thêm câu hỏi" để bắt đầu</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {questions.map(q => (
              <div
                key={q._id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30 transition-colors ${selectedIds.includes(q._id) ? 'bg-purple-900/10' : ''}`}
              >
                <button onClick={() => toggleSelect(q._id)} className="text-gray-400 hover:text-purple-400 shrink-0">
                  {selectedIds.includes(q._id) ? <FiCheckSquare size={16} className="text-purple-400" /> : <FiSquare size={16} />}
                </button>

                {/* Question text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{q.question}</p>
                  {q.keywords?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {q.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded text-[10px]">{kw}</span>
                      ))}
                      {q.keywords.length > 3 && <span className="text-[10px] text-gray-500">+{q.keywords.length - 3}</span>}
                    </div>
                  )}
                </div>

                {/* Topic */}
                <div className="w-24 text-center hidden md:block">
                  <span className="text-xs text-gray-400 truncate block">{q.topic_id?.name || '—'}</span>
                </div>

                {/* Part */}
                <div className="w-20 text-center hidden md:block">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${PART_COLORS[q.part] || ''}`}>
                    {PART_LABELS[q.part] || q.part}
                  </span>
                </div>

                {/* Difficulty */}
                <div className="w-20 text-center hidden lg:block">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${DIFF_COLORS[q.difficulty] || ''}`}>
                    {q.difficulty}
                  </span>
                </div>

                {/* CEFR */}
                <div className="w-16 text-center hidden lg:block">
                  <span className="text-xs text-gray-300 font-mono">{q.cefr_level}</span>
                </div>

                {/* Time */}
                <div className="w-20 text-center hidden lg:block">
                  <span className="text-xs text-gray-400">{q.time_limit_sec}s</span>
                </div>

                {/* Status */}
                <div className="w-16 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    q.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-700/50 text-gray-500 border-gray-600/30'
                  }`}>
                    {q.is_active ? 'Active' : 'Off'}
                  </span>
                </div>

                {/* Actions */}
                <div className="w-20 flex items-center justify-center gap-1">
                  <button
                    onClick={() => { setEditingQ(q); setShowModal(true); }}
                    className="p-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                    title="Xóa"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-400">
            Hiển thị {questions.length} / {pagination.total} câu hỏi
          </span>
          <div className="flex gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === pagination.page
                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateEditSpeakingModal
          question={editingQ}
          topics={topics}
          onClose={() => { setShowModal(false); setEditingQ(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default AdminSpeakingQuestions;
