import React, { useState, useEffect } from 'react';
import { 
  FiBook, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter,
  FiUpload, FiDownload, FiImage, FiVolume2, FiRefreshCw,
  FiCheck, FiX, FiGrid, FiList
} from 'react-icons/fi';
import adminService from '../../services/adminService';
import FileUploader from '../../components/FileUploader';

/**
 * AdminVocabulary - Quản lý Kho Từ vựng
 * Features:
 * - Table view với pagination
 * - Search & filters (level, part_of_speech, tags)
 * - CRUD operations
 * - Media upload (image + audio)
 * - Import/Export CSV
 * - Bulk delete
 * - Statistics cards
 */

const PARTS_OF_SPEECH = [
  { value: 'noun', label: 'Noun (Danh từ)' },
  { value: 'verb', label: 'Verb (Động từ)' },
  { value: 'adjective', label: 'Adjective (Tính từ)' },
  { value: 'adverb', label: 'Adverb (Trạng từ)' },
  { value: 'pronoun', label: 'Pronoun (Đại từ)' },
  { value: 'preposition', label: 'Preposition (Giới từ)' },
  { value: 'conjunction', label: 'Conjunction (Liên từ)' },
  { value: 'interjection', label: 'Interjection (Thán từ)' },
  { value: 'other', label: 'Other (Khác)' }
];

const LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', color: 'orange' },
  { value: 'advanced', label: 'Advanced', color: 'red' }
];

function AdminVocabulary() {
  const [vocabularies, setVocabularies] = useState([]);
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
  const [posFilter, setPosFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState(null);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchVocabularies();
    fetchStats();
    fetchTopics();
  }, [page, search, levelFilter, posFilter, topicFilter]);

  const fetchTopics = async () => {
    try {
      const res = await adminService.getAllTopicsForDropdown();
      console.log('📚 Topics API response:', res.data);
      
      // API returns: { message: '...', data: { topics: [...], totalPages, currentPage, total } }
      const topicsArray = res.data.data?.topics || [];
      console.log('✅ Parsed topics:', topicsArray.length, 'topics found');
      
      setAllTopics(topicsArray);
    } catch (err) {
      console.error('❌ Error fetching topics:', err);
      setAllTopics([]); // Set empty array on error
    }
  };

  const fetchVocabularies = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search,
        level: levelFilter,
        part_of_speech: posFilter,
        topic: topicFilter
      };
      
      const res = await adminService.getVocabularies(params);
      setVocabularies(res.data.data);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vocabularies:', err);
      alert('❌ Lỗi tải dữ liệu');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminService.getVocabularyStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa từ vựng này?')) return;
    
    try {
      await adminService.deleteVocabulary(id);
      fetchVocabularies();
      fetchStats();
      alert('✅ Đã xóa từ vựng');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Chưa chọn từ nào');
      return;
    }
    
    if (!window.confirm(`Xóa ${selectedIds.length} từ đã chọn?`)) return;
    
    try {
      await adminService.bulkDeleteVocabulary(selectedIds);
      setSelectedIds([]);
      fetchVocabularies();
      fetchStats();
      alert(`✅ Đã xóa ${selectedIds.length} từ`);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminService.exportVocabularyCSV();
      const csvData = res.data.data;
      
      // Convert to CSV string
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      alert(`✅ Đã xuất ${csvData.length} từ vựng`);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi export');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === vocabularies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vocabularies.map(v => v._id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  if (loading && vocabularies.length === 0) {
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
              <FiBook className="text-purple-500" />
              Kho Từ Vựng
            </h1>
            <p className="text-gray-400 mt-1">Quản lý tập trung từ vựng tiếng Anh</p>
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
              onClick={() => {
                setEditingVocab(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            >
              <FiPlus />
              Thêm Từ Mới
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Tổng từ vựng</div>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Beginner</div>
                <div className="text-3xl font-bold text-green-500">{stats.beginner}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Intermediate</div>
                <div className="text-3xl font-bold text-orange-500">{stats.intermediate}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Advanced</div>
                <div className="text-3xl font-bold text-red-500">{stats.advanced}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Có media</div>
                <div className="text-3xl font-bold text-purple-500">{stats.withMedia}</div>
              </div>
            </div>

            {/* Topics Statistics */}
            {stats && stats.topicStats && stats.topicStats.length > 0 && (
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <FiGrid className="text-blue-400" />
                  Thống kê theo Topics
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {stats.topicStats.map(topic => (
                    <div 
                      key={topic.topicId} 
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                      onClick={() => {
                        setTopicFilter(topic.topicId);
                        setPage(1);
                      }}
                    >
                      <div className="text-sm text-gray-300 truncate">{topic.topicName}</div>
                      <div className="text-2xl font-bold text-blue-400">{topic.count}</div>
                      <div className="text-xs text-gray-500">từ vựng</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Filters & Search */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-5 gap-4">
            {/* Search */}
            <div className="col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm từ, nghĩa, ví dụ..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {/* Topic Filter */}
            <div>
              <select
                value={topicFilter}
                onChange={(e) => {
                  setTopicFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tất cả Topics</option>
                {allTopics && allTopics.length > 0 && allTopics.map(topic => (
                  <option key={topic._id} value={topic._id}>{topic.name}</option>
                ))}
              </select>
            </div>
            
            {/* Level Filter */}
            <div>
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tất cả Level</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            
            {/* POS Filter */}
            <div>
              <select
                value={posFilter}
                onChange={(e) => {
                  setPosFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tất cả loại từ</option>
                {PARTS_OF_SPEECH.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(search || levelFilter || posFilter || topicFilter) && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-400">Đang lọc:</span>
              {search && (
                <span className="px-3 py-1 bg-purple-900 text-purple-300 rounded-full text-sm flex items-center gap-2">
                  Tìm: "{search}"
                  <FiX className="cursor-pointer" onClick={() => setSearch('')} />
                </span>
              )}
              {topicFilter && (
                <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Topic: {allTopics && allTopics.find(t => t._id === topicFilter)?.name || topicFilter}
                  <FiX className="cursor-pointer" onClick={() => setTopicFilter('')} />
                </span>
              )}
              {levelFilter && (
                <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm flex items-center gap-2">
                  Level: {levelFilter}
                  <FiX className="cursor-pointer" onClick={() => setLevelFilter('')} />
                </span>
              )}
              {posFilter && (
                <span className="px-3 py-1 bg-orange-900 text-orange-300 rounded-full text-sm flex items-center gap-2">
                  POS: {posFilter}
                  <FiX className="cursor-pointer" onClick={() => setPosFilter('')} />
                </span>
              )}
              <button
                onClick={() => {
                  setSearch('');
                  setLevelFilter('');
                  setPosFilter('');
                  setTopicFilter('');
                  setPage(1);
                }}
                className="px-3 py-1 bg-red-900 text-red-300 rounded-full text-sm hover:bg-red-800"
              >
                Xóa tất cả
              </button>
            </div>
          )}
          
          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <span className="text-gray-400">
                Đã chọn: <span className="text-white font-bold">{selectedIds.length}</span> từ
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                <FiTrash2 />
                Xóa đã chọn
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === vocabularies.length && vocabularies.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Từ</th>
                  <th className="px-4 py-3 text-left">Loại từ</th>
                  <th className="px-4 py-3 text-left">Phiên âm</th>
                  <th className="px-4 py-3 text-left">Nghĩa</th>
                  <th className="px-4 py-3 text-left">Topics</th>
                  <th className="px-4 py-3 text-left">Level</th>
                  <th className="px-4 py-3 text-left">Media</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vocabularies.map((vocab) => (
                  <tr key={vocab._id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(vocab._id)}
                        onChange={() => toggleSelect(vocab._id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white">{vocab.word}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">{vocab.part_of_speech}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400 italic">{vocab.pronunciation || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">
                        {vocab.meaning.length > 50 ? vocab.meaning.substring(0, 50) + '...' : vocab.meaning}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {vocab.topics && vocab.topics.length > 0 ? (
                          vocab.topics.slice(0, 2).map(topic => (
                            <span key={topic._id} className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                              {topic.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600 text-xs">Chưa có topic</span>
                        )}
                        {vocab.topics && vocab.topics.length > 2 && (
                          <span className="text-gray-400 text-xs">+{vocab.topics.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vocab.level === 'beginner' ? 'bg-green-900 text-green-300' :
                        vocab.level === 'intermediate' ? 'bg-orange-900 text-orange-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {vocab.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {vocab.imageUrl && <FiImage className="text-blue-400" title="Có hình ảnh" />}
                        {vocab.audioUrl && <FiVolume2 className="text-green-400" title="Có audio" />}
                        {!vocab.imageUrl && !vocab.audioUrl && <span className="text-gray-600">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingVocab(vocab);
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-gray-700 rounded"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(vocab._id)}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {vocabularies.length === 0 && (
            <div className="text-center py-12">
              <FiBook className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Chưa có từ vựng nào</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Thêm từ đầu tiên
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg"
            >
              Trước
            </button>
            <span className="text-gray-400">
              Trang {page} / {totalPages} (Tổng: {total})
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <VocabularyFormModal
          vocabulary={editingVocab}
          allTopics={allTopics}
          onClose={() => {
            setShowCreateModal(false);
            setEditingVocab(null);
          }}
          onSuccess={() => {
            fetchVocabularies();
            fetchStats();
            setShowCreateModal(false);
            setEditingVocab(null);
          }}
        />
      )}

      {showImportModal && (
        <ImportCSVModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchVocabularies();
            fetchStats();
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}

// ============ Vocabulary Form Modal ============
function VocabularyFormModal({ vocabulary, allTopics, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    word: vocabulary?.word || '',
    part_of_speech: vocabulary?.part_of_speech || 'other',
    pronunciation: vocabulary?.pronunciation || '',
    meaning: vocabulary?.meaning || '',
    example: vocabulary?.example || '',
    synonyms: vocabulary?.synonyms?.join(', ') || '',
    antonyms: vocabulary?.antonyms?.join(', ') || '',
    imageUrl: vocabulary?.imageUrl || '',
    audioUrl: vocabulary?.audioUrl || '',
    level: vocabulary?.level || 'beginner',
    topics: vocabulary?.topics?.map(t => t._id || t) || [],
    tags: vocabulary?.tags?.join(', ') || '',
    notes: vocabulary?.notes || ''
  });

  const [loading, setLoading] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  // Debug: Log allTopics when modal opens
  React.useEffect(() => {
    console.log('🔍 Modal opened - allTopics:', allTopics);
    console.log('🔍 allTopics count:', allTopics?.length);
    console.log('🔍 First topic:', allTopics?.[0]);
  }, []);

  const toggleTopic = (topicId) => {
    setFormData(prev => {
      const topics = prev.topics.includes(topicId)
        ? prev.topics.filter(id => id !== topicId)
        : [...prev.topics, topicId];
      return { ...prev, topics };
    });
  };

  const removeTopic = (topicId) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(id => id !== topicId)
    }));
  };

  // Safety check: ensure allTopics is an array
  const safeAllTopics = Array.isArray(allTopics) ? allTopics : [];
  
  const filteredTopics = safeAllTopics.filter(topic =>
    topic?.name?.toLowerCase().includes(topicSearchTerm.toLowerCase())
  );

  // Debug logs
  React.useEffect(() => {
    if (showTopicDropdown) {
      console.log('🔍 DEBUG - allTopics:', allTopics);
      console.log('🔍 DEBUG - filteredTopics:', filteredTopics);
      console.log('🔍 DEBUG - First topic:', allTopics[0]);
    }
  }, [showTopicDropdown, allTopics, filteredTopics]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.word || !formData.meaning) {
      alert('Word và Meaning là bắt buộc');
      return;
    }

    setLoading(true);
    
    try {
      const data = {
        ...formData,
        synonyms: formData.synonyms.split(',').map(s => s.trim()).filter(Boolean),
        antonyms: formData.antonyms.split(',').map(a => a.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        topics: formData.topics // Already array of IDs
      };

      if (vocabulary) {
        await adminService.updateVocabulary(vocabulary._id, data);
        alert('✅ Cập nhật thành công');
      } else {
        await adminService.createVocabulary(data);
        alert('✅ Tạo từ vựng thành công');
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            {vocabulary ? 'Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Word + POS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Từ vựng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({...formData, word: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="airport"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Loại từ</label>
              <select
                value={formData.part_of_speech}
                onChange={(e) => setFormData({...formData, part_of_speech: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {PARTS_OF_SPEECH.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pronunciation */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phiên âm (IPA)</label>
            <input
              type="text"
              value={formData.pronunciation}
              onChange={(e) => setFormData({...formData, pronunciation: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="/ˈeə.pɔːt/"
            />
          </div>

          {/* Meaning */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nghĩa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.meaning}
              onChange={(e) => setFormData({...formData, meaning: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Sân bay"
              required
            />
          </div>

          {/* Example */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ví dụ</label>
            <textarea
              value={formData.example}
              onChange={(e) => setFormData({...formData, example: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="I'm going to the airport."
            />
          </div>

          {/* Synonyms + Antonyms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Từ đồng nghĩa (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={formData.synonyms}
                onChange={(e) => setFormData({...formData, synonyms: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="aerodrome, airfield"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Từ trái nghĩa (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={formData.antonyms}
                onChange={(e) => setFormData({...formData, antonyms: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder=""
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hình ảnh</label>
              <FileUploader
                onUploadSuccess={(url) => setFormData({...formData, imageUrl: url})}
                currentUrl={formData.imageUrl}
                acceptedTypes="image/*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Audio (phát âm)</label>
              <FileUploader
                onUploadSuccess={(url) => setFormData({...formData, audioUrl: url})}
                currentUrl={formData.audioUrl}
                acceptedTypes="audio/*"
              />
            </div>
          </div>

          {/* Level + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="travel, transportation"
              />
            </div>
          </div>

          {/* Topics - Multi-select Dropdown with Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topics (chủ đề liên quan)
            </label>
            
            {/* Selected Topics Display */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[42px] p-2 bg-gray-700 rounded-lg">
              {formData.topics.length > 0 ? (
                formData.topics.map(topicId => {
                  const topic = safeAllTopics.find(t => t._id === topicId);
                  if (!topic) {
                    console.warn('⚠️ Topic not found:', topicId);
                    return null;
                  }
                  return (
                    <span
                      key={topicId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                    >
                      {topic.name || topic.title || `Topic ${topicId.substring(0, 8)}`}
                      <button
                        type="button"
                        onClick={() => removeTopic(topicId)}
                        className="hover:text-red-300"
                      >
                        <FiX size={16} />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-500 text-sm">Chọn topics...</span>
              )}
            </div>

            {/* Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-between hover:bg-gray-600 transition-colors border border-gray-600"
              >
                <span className="font-medium">
                  {formData.topics.length > 0 
                    ? `✓ Đã chọn ${formData.topics.length} topic${formData.topics.length > 1 ? 's' : ''}` 
                    : '+ Chọn topics'}
                </span>
                <FiFilter className={`transition-transform duration-200 ${showTopicDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showTopicDropdown && (
                <div className="absolute z-50 mt-2 w-full bg-gray-700 rounded-lg shadow-lg border border-gray-600 max-h-64 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-600">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm topic..."
                        value={topicSearchTerm}
                        onChange={(e) => setTopicSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-48 overflow-y-auto">
                    {allTopics && filteredTopics.length > 0 ? (
                      filteredTopics.map(topic => (
                        <button
                          key={topic._id}
                          type="button"
                          onClick={() => toggleTopic(topic._id)}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-600 flex items-center gap-3 transition-colors"
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            formData.topics.includes(topic._id)
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-400 bg-gray-700'
                          }`}>
                            {formData.topics.includes(topic._id) && (
                              <FiCheck className="text-white" size={14} />
                            )}
                          </div>
                          
                          {/* Topic Name */}
                          <div className="flex-1 min-w-0">
                            <span className="text-white font-medium block truncate">
                              {topic.name || topic.title || `Topic ${topic._id?.substring(0, 8)}` || 'Unnamed'}
                            </span>
                          </div>
                          
                          {/* Level Badge */}
                          <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded-full flex-shrink-0">
                            {topic.level || 'N/A'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-400">
                        {topicSearchTerm ? 'Không tìm thấy topic' : 'Chưa có topics. Vui lòng tạo topics trước.'}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2 border-t border-gray-600 flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {formData.topics.length} topics đã chọn
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTopicDropdown(false)}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Xong
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="Ghi chú nội bộ..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
            >
              {loading ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
              {vocabulary ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ Import CSV Modal ============
function ImportCSVModal({ onClose, onSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      
      // Simple preview (first 5 lines)
      const lines = text.split('\n').slice(0, 6);
      setPreview(lines);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText) {
      alert('Chưa có dữ liệu CSV');
      return;
    }

    setLoading(true);
    
    try {
      const res = await adminService.importVocabularyCSV(csvText);
      const result = res.data.data;
      
      // Show detailed results
      let message = res.data.message + '\n\n';
      
      if (result.errors && result.errors.length > 0) {
        message += '❌ Chi tiết lỗi:\n';
        result.errors.slice(0, 5).forEach(err => {
          message += `- Dòng ${err.row}: ${err.word || '?'} - ${err.error}\n`;
        });
        
        if (result.errors.length > 5) {
          message += `... và ${result.errors.length - 5} lỗi khác`;
        }
      }
      
      alert(message);
      
      if (result.success > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi import: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Import CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Instructions */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-bold text-white mb-2">📝 Format CSV:</h3>
            <code className="text-sm text-gray-300 block mb-2">
              word,part_of_speech,pronunciation,meaning,example,synonyms,antonyms,imageUrl,audioUrl,level,topics,tags
            </code>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Ví dụ 1 (dùng topic names):</strong></p>
              <code className="text-xs">airport,noun,/ˈeə.pɔːt/,Sân bay,I'm at the airport,aerodrome,,,beginner,Travel|Airport,travel</code>
              
              <p className="mt-2"><strong>Ví dụ 2 (không topics):</strong></p>
              <code className="text-xs">hello,interjection,/həˈləʊ/,Xin chào,Hello everyone!,,,,beginner,,greetings</code>
            </div>
            <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500/30 rounded">
              <p className="text-xs text-blue-300">
                💡 <strong>Lưu ý:</strong> Topics có thể dùng <strong>tên topic</strong> (VD: "Travel") hoặc <strong>ObjectID</strong>. Nhiều topics cách nhau bởi <code>|</code>
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Chọn file CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preview (5 dòng đầu):</label>
              <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs text-gray-300">{preview.join('\n')}</pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !csvText}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
            >
              {loading ? <FiRefreshCw className="animate-spin" /> : <FiUpload />}
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminVocabulary;
