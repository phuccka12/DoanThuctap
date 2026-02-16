import React, { useState, useEffect } from 'react';
import { 
  FiBook, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter,
  FiUpload, FiDownload, FiRefreshCw, FiCheck, FiX, FiGrid, FiList, FiClock, FiFileText,
  FiZap, FiLink
} from 'react-icons/fi';
import adminService from '../../services/adminService';
import SmartPassageEditor from '../../components/SmartPassageEditor';
import AIGenerateModal from '../../components/AIGenerateModal';

/**
 * AdminReadingPassages - Quản lý Kho Bài Đọc (Smart Edition)
 * Features:
 * - Rich Text Editor với React Quill
 * - AI Text Generation
 * - Auto-Link Vocabulary
 * - CEFR Levels & Content Types
 * - "Write Once, Use Everywhere" concept
 */

const LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', color: 'orange' },
  { value: 'advanced', label: 'Advanced', color: 'red' }
];

const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Proficient' }
];

const CONTENT_TYPES = [
  { value: 'email', label: '📧 Email', icon: '📧' },
  { value: 'letter', label: '✉️ Letter', icon: '✉️' },
  { value: 'news', label: '📰 News Article', icon: '📰' },
  { value: 'story', label: '📖 Story', icon: '📖' },
  { value: 'conversation', label: '💬 Conversation', icon: '💬' },
  { value: 'announcement', label: '📢 Announcement', icon: '📢' },
  { value: 'article', label: '📝 Article', icon: '📝' },
  { value: 'blog', label: '✍️ Blog Post', icon: '✍️' },
  { value: 'report', label: '📊 Report', icon: '📊' },
  { value: 'other', label: '📄 Other', icon: '📄' }
];

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' }
];

function AdminReadingPassages() {
  const [passages, setPassages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Topics
  const [allTopics, setAllTopics] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [editingPassage, setEditingPassage] = useState(null);
  const [viewingPassage, setViewingPassage] = useState(null);
  
  // AI States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchPassages();
    fetchStats();
    fetchTopics();
  }, [page, search, levelFilter, topicFilter]);

  const fetchTopics = async () => {
    try {
      const res = await adminService.getAllTopicsForDropdown();
      const topicsArray = res.data.data?.topics || [];
      setAllTopics(topicsArray);
    } catch (err) {
      console.error('❌ Error fetching topics:', err);
      setAllTopics([]);
    }
  };

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search,
        level: levelFilter,
        topic: topicFilter
      };
      
      const res = await adminService.getReadingPassages(params);
      console.log('📦 API Response passages:', res.data.data.passages);
      console.log('🏷️ First passage topics:', res.data.data.passages[0]?.topics);
      setPassages(res.data.data.passages);
      setTotalPages(res.data.data.totalPages);
      setTotal(res.data.data.total);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching passages:', err);
      alert('❌ Lỗi tải dữ liệu');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminService.getReadingPassageStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bài đọc này?')) return;
    
    try {
      await adminService.deleteReadingPassage(id);
      fetchPassages();
      fetchStats();
      alert('✅ Đã xóa bài đọc');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Chưa chọn bài đọc nào');
      return;
    }
    
    if (!window.confirm(`Xóa ${selectedIds.length} bài đọc đã chọn?`)) return;
    
    try {
      await adminService.bulkDeleteReadingPassages(selectedIds);
      setSelectedIds([]);
      fetchPassages();
      fetchStats();
      alert(`✅ Đã xóa ${selectedIds.length} bài đọc`);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleAgenticGenerate = async (options) => {
    try {
      setAiGenerating(true);
      console.log('🤖 Starting Agentic Generation...', options);
      
      const res = await adminService.agenticGeneratePassage(options);
      const result = res.data;
      
      setAiResult(result);
      setAiGenerating(false);
      
      if (result.status === 'success') {
        console.log('✅ AI Result:', result);
        alert(`✅ AI Generation Successful!\n\nAttempts: ${result.attempts}\nFlesch Score: ${result.audit_report?.flesch_score || 'N/A'}\nWord Count: ${result.word_count}`);
        
        // Auto-match topics based on generated content topic keyword
        const matchedTopics = [];
        if (options.topic && allTopics.length > 0) {
          const topicKeyword = options.topic.toLowerCase();
          const matched = allTopics.filter(t => 
            t.name.toLowerCase().includes(topicKeyword) || 
            topicKeyword.includes(t.name.toLowerCase())
          );
          if (matched.length > 0) {
            matchedTopics.push(...matched.map(t => t._id));
            console.log('🏷️ Auto-matched topics:', matched.map(t => t.name));
          }
        }
        
        // Create a passage object to pass to CreateModal
        const aiGeneratedPassage = {
          title: result.title,
          passage: result.passage,
          cefr_level: result.cefr_level,
          word_count: result.word_count,
          ai_generated: true,
          level: 'intermediate', // default
          content_type: 'article', // default
          topics: matchedTopics, // Auto-matched topics
          questions: []
        };
        
        console.log('📦 AI Generated Passage:', aiGeneratedPassage);
        setEditingPassage(aiGeneratedPassage);
        setShowAIGenerateModal(false);
        setShowCreateModal(true); // Open create modal with pre-filled data
      } else {
        alert(`⚠️ Generation completed with warnings.\n\nAttempts: ${result.attempts}\nStatus: ${result.status}\n\nYou can still review and save the content.`);
        
        const aiGeneratedPassage = {
          title: result.title,
          passage: result.passage,
          cefr_level: result.cefr_level,
          ai_generated: true,
          level: 'intermediate',
          content_type: 'article',
          topics: [],
          questions: []
        };
        
        setEditingPassage(aiGeneratedPassage);
        setShowAIGenerateModal(false);
        setShowCreateModal(true);
      }
      
    } catch (err) {
      console.error('❌ AI Generate Error:', err);
      setAiGenerating(false);
      alert(`❌ AI Generation Failed:\n${err.response?.data?.error || err.message}\n\nPlease check:\n- Python AI service running at localhost:5000\n- GEMINI_API_KEY configured\n- Node server running at localhost:3001`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminService.exportReadingPassagesCSV();
      const csvData = res.data.data;
      
      // Convert to CSV string
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reading_passages_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      alert(`✅ Đã xuất ${csvData.length} bài đọc`);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi export');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === passages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(passages.map(p => p._id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  if (loading && passages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-4xl text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiFileText className="text-blue-500" />
              Kho Bài Đọc
            </h1>
            <p className="text-gray-400 mt-1">Quản lý tập trung bài đọc và câu hỏi</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <FiDownload />
              Export CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}
            >
              <FiUpload />
              Import CSV
            </button>
            <button
              onClick={() => setShowAIGenerateModal(true)}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}
            >
              <FiZap />
              AI Generate
            </button>
            <button
              onClick={() => {
                setEditingPassage(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            >
              <FiPlus />
              Thêm Bài Đọc
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Tổng Bài Đọc</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <FiFileText className="text-blue-400 text-3xl" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Beginner</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.byLevel?.beginner || 0}</p>
                </div>
                <FiBook className="text-green-400 text-3xl" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Intermediate</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.byLevel?.intermediate || 0}</p>
                </div>
                <FiBook className="text-orange-400 text-3xl" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-medium">Advanced</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.byLevel?.advanced || 0}</p>
                </div>
                <FiBook className="text-red-400 text-3xl" />
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, nội dung, tags..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <select
                value={levelFilter}
                onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">🎯 All Levels</option>
                {LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <select
                value={topicFilter}
                onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">📚 All Topics</option>
                {allTopics.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.level})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(search || levelFilter || topicFilter) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {search && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1">
                  🔍 "{search}"
                  <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-white">
                    <FiX size={12} />
                  </button>
                </span>
              )}
              {levelFilter && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1">
                  🎯 {LEVELS.find(l => l.value === levelFilter)?.label}
                  <button onClick={() => { setLevelFilter(''); setPage(1); }} className="hover:text-white">
                    <FiX size={12} />
                  </button>
                </span>
              )}
              {topicFilter && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1">
                  📚 {allTopics.find(t => t._id === topicFilter)?.name}
                  <button onClick={() => { setTopicFilter(''); setPage(1); }} className="hover:text-white">
                    <FiX size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-purple-300 font-medium">
              Đã chọn {selectedIds.length} bài đọc
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
            >
              <FiTrash2 />
              Xóa đã chọn
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === passages.length && passages.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Level</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Topics</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Thông tin</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Câu hỏi</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {passages.map(passage => (
                  <tr key={passage._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(passage._id)}
                        onChange={() => toggleSelect(passage._id)}
                        className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <p className="font-medium text-white">{passage.title}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {(() => {
                            // Clean HTML entities and tags for preview
                            const textarea = document.createElement('textarea');
                            textarea.innerHTML = passage.passage || '';
                            let cleaned = textarea.value;
                            cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, ''); // Remove all HTML tags
                            cleaned = cleaned.replace(/\s+/g, ' ').trim();
                            return cleaned.substring(0, 100) + '...';
                          })()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        passage.level === 'beginner' ? 'bg-green-900/50 text-green-300' :
                        passage.level === 'intermediate' ? 'bg-orange-900/50 text-orange-300' :
                        'bg-red-900/50 text-red-300'
                      }`}>
                        {passage.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {passage.topics?.slice(0, 2).map((topic, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full text-xs">
                            {topic.name}
                          </span>
                        ))}
                        {passage.topics?.length > 2 && (
                          <span className="text-xs text-gray-400">+{passage.topics.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-gray-400">
                          <FiFileText size={12} />
                          <span>{passage.word_count} từ</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <FiClock size={12} />
                          <span>{passage.estimated_time} phút</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-semibold">
                        {passage.questions?.length || 0} câu
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewingPassage(passage)}
                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <FiBook size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPassage(passage);
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-yellow-400 hover:bg-yellow-900/30 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(passage._id)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {passages.length === 0 && !loading && (
            <div className="text-center py-12">
              <FiFileText className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Chưa có bài đọc nào</p>
              <p className="text-gray-500 text-sm mt-2">Thêm bài đọc mới hoặc import từ CSV</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Hiển thị {passages.length} / {total} bài đọc
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1 text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEditModal
          passage={editingPassage}
          allTopics={allTopics}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPassage(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingPassage(null);
            fetchPassages();
            fetchStats();
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchPassages();
            fetchStats();
          }}
        />
      )}

      {viewingPassage && (
        <ViewPassageModal
          passage={viewingPassage}
          onClose={() => setViewingPassage(null)}
        />
      )}

      {showAIGenerateModal && (
        <AIGenerateModal
          onClose={() => setShowAIGenerateModal(false)}
          onGenerate={handleAgenticGenerate}
          generating={aiGenerating}
        />
      )}
    </div>
  );
}

// Create/Edit Modal Component
function CreateEditModal({ passage, allTopics, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    passage: '',
    level: 'beginner',
    cefr_level: 'A2',
    content_type: 'article',
    genre: '',
    topics: [],
    questions: [],
    source: '',
    tags: [],
    image_url: '',
    audio_url: '',
    estimated_time: 5,
    difficulty_score: 5,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [scanningVocab, setScanningVocab] = useState(false);
  const [linkedVocabCount, setLinkedVocabCount] = useState(0);

  useEffect(() => {
    console.log('🔍 CreateEditModal received passage:', passage);
    if (passage) {
      // Helper: Clean HTML entities and tags from old data
      const cleanText = (text) => {
        if (!text) return '';
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        let cleaned = textarea.value;
        cleaned = cleaned.replace(/<\/?p>/gi, '');
        cleaned = cleaned.replace(/\s+/g, ' ');
        return cleaned.trim();
      };
      
      const newFormData = {
        title: cleanText(passage.title) || '',
        passage: cleanText(passage.passage) || '',
        level: passage.level || 'beginner',
        cefr_level: passage.cefr_level || 'A2',
        content_type: passage.content_type || 'article',
        genre: passage.genre || '',
        topics: passage.topics?.map(t => t._id) || [],
        questions: passage.questions || [],
        source: passage.source || '',
        tags: passage.tags || [],
        image_url: passage.image_url || '',
        audio_url: passage.audio_url || '',
        estimated_time: passage.estimated_time || 5,
        difficulty_score: passage.difficulty_score || 5,
        is_active: passage.is_active !== false
      };
      console.log('📝 Setting formData to:', newFormData);
      setFormData(newFormData);
      setLinkedVocabCount(passage.linked_vocabulary?.length || 0);
    }
  }, [passage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.passage) {
      alert('Vui lòng nhập tiêu đề và nội dung bài đọc');
      return;
    }

    try {
      setSaving(true);
      
      // If passage exists and has a valid _id => update, otherwise create new
      if (passage && passage._id) {
        await adminService.updateReadingPassage(passage._id, formData);
        alert('✅ Đã cập nhật bài đọc');
      } else {
        await adminService.createReadingPassage(formData);
        alert('✅ Đã tạo bài đọc mới');
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + (err.response?.data?.message || err.message));
      setSaving(false);
    }
  };

  // AI Generate Text
  const handleAIGenerate = async () => {
    const prompt = window.prompt(
      'Mô tả bài đọc bạn muốn tạo:\n\nVí dụ: "Viết email phàn nàn về dịch vụ khách sạn, giọng điệu lịch sự"'
    );
    
    if (!prompt) return;
    
    try {
      setAiGenerating(true);
      const res = await adminService.generatePassageWithAI({
        prompt,
        content_type: formData.content_type,
        cefr_level: formData.cefr_level,
        word_count: 200,
        tone: 'neutral'
      });
      
      setFormData({
        ...formData,
        passage: res.data.data.generated_text
      });
      
      alert(`✅ AI đã tạo ${res.data.data.word_count} từ`);
      setAiGenerating(false);
    } catch (err) {
      console.error('AI Error:', err);
      alert('❌ AI service không khả dụng. Đã dùng template mẫu.');
      setAiGenerating(false);
    }
  };

  // Scan & Link Vocabulary
  const handleScanVocabulary = async () => {
    if (!passage) {
      alert('Vui lòng lưu bài đọc trước khi scan vocabulary');
      return;
    }
    
    try {
      setScanningVocab(true);
      const res = await adminService.scanAndLinkVocabulary(passage._id);
      setLinkedVocabCount(res.data.data.linked_count);
      alert(`✅ Đã link ${res.data.data.linked_count} từ vựng`);
      setScanningVocab(false);
    } catch (err) {
      console.error('Scan Error:', err);
      alert('❌ Lỗi khi scan vocabulary');
      setScanningVocab(false);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question_text: '',
          question_type: 'multiple_choice',
          options: ['', '', '', ''],
          correct_answer: '',
          explanation: '',
          points: 1
        }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {passage ? 'Chỉnh sửa Bài Đọc' : 'Thêm Bài Đọc Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Passage Content - Smart Editor */}
          <SmartPassageEditor
            key={passage?._id || 'new'}
            value={formData.passage}
            onChange={(value) => setFormData({ ...formData, passage: value })}
            onAIGenerate={handleAIGenerate}
            onScanVocabulary={handleScanVocabulary}
            aiGenerating={aiGenerating}
            scanningVocab={scanningVocab}
            linkedVocabCount={linkedVocabCount}
            passageId={passage?._id}
          />

          {/* Content Type, CEFR Level & Basic Level */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CEFR Level</label>
              <select
                value={formData.cefr_level}
                onChange={(e) => setFormData({ ...formData, cefr_level: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {CEFR_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Basic Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre & Topics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre/Category</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Business, Academic, Daily Life..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Topics</label>
              <select
                multiple
                value={formData.topics}
                onChange={(e) => setFormData({
                  ...formData,
                  topics: Array.from(e.target.selectedOptions, opt => opt.value)
                })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                size={3}
              >
                {allTopics.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Câu hỏi ({formData.questions.length})
              </label>
              <button
                type="button"
                onClick={addQuestion}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
              >
                <FiPlus /> Thêm câu hỏi
              </button>
            </div>

            <div className="space-y-3">
              {formData.questions.map((q, index) => (
                <div key={index} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-gray-300">Câu {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Câu hỏi..."
                    value={q.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm mb-2"
                  />

                  <select
                    value={q.question_type}
                    onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm mb-2"
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  {q.question_type === 'multiple_choice' && (
                    <div className="space-y-1 mb-2">
                      {q.options.map((opt, optIdx) => (
                        <input
                          key={optIdx}
                          type="text"
                          placeholder={`Đáp án ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[optIdx] = e.target.value;
                            updateQuestion(index, 'options', newOptions);
                          }}
                          className="w-full px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
                        />
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Đáp án đúng..."
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Thời gian đọc (phút)
              </label>
              <input
                type="number"
                value={formData.estimated_time}
                onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Độ khó (1-10)
              </label>
              <input
                type="number"
                value={formData.difficulty_score}
                onChange={(e) => setFormData({ ...formData, difficulty_score: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nguồn</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Ví dụ: IELTS Cambridge 15"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="environment, technology, education"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Kích hoạt (hiển thị công khai)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
              {passage ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import Modal Component
function ImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Vui lòng chọn file CSV');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await adminService.importReadingPassagesCSV(formData);
      alert(res.data.message);
      
      if (res.data.errors && res.data.errors.length > 0) {
        console.error('Import errors:', res.data.errors);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi import: ' + (err.response?.data?.message || err.message));
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Import Reading Passages từ CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300 font-medium mb-2">📋 Format CSV:</p>
          <code className="text-xs text-gray-300 block">
            title,passage,level,topics,questions,source,tags,estimated_time,difficulty_score
          </code>
          <p className="text-xs text-gray-400 mt-2">
            • topics: Topic names phân cách bằng "|" (Travel|Technology)<br />
            • questions: JSON array<br />
            • tags: Phân cách bằng "|"
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={importing || !file}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? <FiRefreshCw className="animate-spin" /> : <FiUpload />}
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Passage Modal
function ViewPassageModal({ passage, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{passage.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-3 py-1 rounded-full font-semibold ${
              passage.level === 'beginner' ? 'bg-green-900/50 text-green-300' :
              passage.level === 'intermediate' ? 'bg-orange-900/50 text-orange-300' :
              'bg-red-900/50 text-red-300'
            }`}>
              {passage.level}
            </span>
            <span className="text-gray-400">{passage.word_count} từ</span>
            <span className="text-gray-400">{passage.estimated_time} phút</span>
            <span className="text-gray-400">Độ khó: {passage.difficulty_score}/10</span>
          </div>

          {/* Topics */}
          {passage.topics && passage.topics.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {passage.topics.map((topic, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm">
                    {topic.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Passage Content */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Nội dung:</h3>
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {(() => {
                  // Clean HTML entities and tags for display
                  const textarea = document.createElement('textarea');
                  textarea.innerHTML = passage.passage || '';
                  let cleaned = textarea.value;
                  cleaned = cleaned.replace(/<\/?p>/gi, ''); // Remove <p> tags
                  cleaned = cleaned.replace(/\s+/g, ' ').trim();
                  return cleaned;
                })()}
              </p>
            </div>
          </div>

          {/* Questions */}
          {passage.questions && passage.questions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Câu hỏi ({passage.questions.length}):</h3>
              <div className="space-y-4">
                {passage.questions.map((q, idx) => (
                  <div key={idx} className="bg-gray-700/30 p-4 rounded-lg">
                    <p className="font-medium text-white mb-2">{idx + 1}. {q.question_text}</p>
                    <p className="text-xs text-gray-400 mb-2">Type: {q.question_type}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <ul className="space-y-1 mb-2">
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx} className="text-sm text-gray-300">
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="mt-2 p-2 bg-green-900/30 rounded">
                      <p className="text-sm text-green-300">
                        <strong>Đáp án:</strong> {q.correct_answer}
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-gray-400 mt-1">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source & Tags */}
          {(passage.source || passage.tags?.length > 0) && (
            <div className="text-sm space-y-2">
              {passage.source && (
                <p className="text-gray-400">
                  <strong>Nguồn:</strong> {passage.source}
                </p>
              )}
              {passage.tags && passage.tags.length > 0 && (
                <p className="text-gray-400">
                  <strong>Tags:</strong> {passage.tags.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReadingPassages;

