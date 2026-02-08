import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit2, FiTrash2, FiLoader, FiSearch, FiGrid, FiList, 
  FiBook, FiCheckCircle, FiXCircle, FiEye, FiTrendingUp 
} from 'react-icons/fi';
import { 
  FaLeaf, FaLaptopCode, FaGraduationCap, FaHeartbeat, FaCity, 
  FaGlobe, FaPalette, FaShoppingCart, FaMusic, FaFutbol 
} from 'react-icons/fa';
import adminService from '../../services/adminService';

/**
 * AdminTopics - Professional Topics Library Management
 * Features:
 * - Grid/List view toggle
 * - Search & filter functionality
 * - Beautiful card design with icons
 * - Status badges (SYNCED/NOT SYNCED)
 * - Lesson count display
 * - Professional UI/UX
 */

// Icon mapping for different topics
const topicIcons = {
  'Environment': FaLeaf,
  'Technology': FaLaptopCode,
  'Education': FaGraduationCap,
  'Health & Fitness': FaHeartbeat,
  'Urbanization': FaCity,
  'Travel': FaGlobe,
  'Arts & Culture': FaPalette,
  'Business': FaShoppingCart,
  'Music': FaMusic,
  'Sports': FaFutbol,
};

// Color schemes for different topics - Use inline styles or solid colors
const topicColors = {
  'Environment': 'bg-green-900/30 border-green-500/30',
  'Technology': 'bg-blue-900/30 border-blue-500/30',
  'Education': 'bg-orange-900/30 border-orange-500/30',
  'Health & Fitness': 'bg-pink-900/30 border-pink-500/30',
  'Urbanization': 'bg-indigo-900/30 border-indigo-500/30',
  'Travel': 'bg-teal-900/30 border-teal-500/30',
  'Arts & Culture': 'bg-purple-900/30 border-purple-500/30',
  'Business': 'bg-yellow-900/30 border-yellow-500/30',
  'Music': 'bg-violet-900/30 border-violet-500/30',
  'Sports': 'bg-red-900/30 border-red-500/30',
};

function AdminTopics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    level: 'beginner', 
    cover_image: '', 
    is_active: true, 
    description: '', 
    icon_name: '',
    keywords: [],
    frequency: 'medium'
  });
  
  // View & Filter states
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch topics
  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await adminService.getTopics();
      console.log('🔍 API Full Response:', res);
      console.log('📦 Response data:', res.data);
      
      // Backend returns: { data: { topics: [], totalPages: 1, currentPage: 1, total: 6 } }
      const apiData = res.data.data || res.data;
      const topicsData = apiData.topics || apiData || [];
      
      console.log('📊 API Data:', apiData);
      console.log('📊 Topics array:', topicsData);
      console.log('📊 Topics count:', Array.isArray(topicsData) ? topicsData.length : 'Not an array');
      
      setTopics(topicsData);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching topics:', err);
      console.error('❌ Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch topics');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    // Prepare data - send all fields
    const submitData = {
      name: formData.name,
      level: formData.level,
      is_active: formData.is_active,
    };
    
    // Add optional fields if provided
    if (formData.cover_image && formData.cover_image.trim()) {
      submitData.cover_image = formData.cover_image.trim();
    }
    
    if (formData.description && formData.description.trim()) {
      submitData.description = formData.description.trim();
    }
    
    if (formData.icon_name && formData.icon_name.trim()) {
      submitData.icon_name = formData.icon_name.trim();
    }
    
    // Add keywords array if provided
    if (formData.keywords && formData.keywords.length > 0) {
      submitData.keywords = formData.keywords;
    }
    
    // Add frequency if provided
    if (formData.frequency) {
      submitData.frequency = formData.frequency;
    }
    
    console.log('Cleaned submit data:', submitData);
    
    try {
      if (editingId) {
        console.log('Updating topic:', editingId);
        const res = await adminService.updateTopic(editingId, submitData);
        console.log('Update response:', res);
        alert('Cập nhật chủ đề thành công!');
      } else {
        console.log('Creating new topic');
        const res = await adminService.createTopic(submitData);
        console.log('Create response:', res);
        alert('Tạo chủ đề thành công!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ 
        name: '', 
        level: 'beginner', 
        cover_image: '', 
        is_active: true, 
        description: '', 
        icon_name: '',
        keywords: [],
        frequency: 'medium'
      });
      fetchTopics();
    } catch (err) {
      console.error('Error submitting form:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save topic';
      alert('Lỗi: ' + errorMessage);
    }
  };

  const handleEdit = (topic) => {
    setFormData({
      name: topic.name,
      level: topic.level,
      cover_image: topic.cover_image || '',
      is_active: topic.is_active,
      description: topic.description || '',
      icon_name: topic.icon_name || '',
      keywords: topic.keywords || [],
      frequency: topic.frequency || 'medium',
    });
    setEditingId(topic._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    try {
      await adminService.deleteTopic(id);
      alert('Topic deleted successfully');
      fetchTopics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete topic');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', level: 'beginner', cover_image: '', is_active: true, description: '', icon_name: '' });
  };

  // Filter topics based on search and filters
  const filteredTopics = Array.isArray(topics) ? topics.filter(topic => {
    const matchesSearch = topic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = !levelFilter || topic.level === levelFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && topic.is_active) ||
                         (statusFilter === 'inactive' && !topic.is_active);
    return matchesSearch && matchesLevel && matchesStatus;
  }) : [];

  console.log('🔢 Total topics:', topics.length);
  console.log('🔍 Filtered topics:', filteredTopics.length);
  console.log('📋 Topics state:', topics);
  console.log('📋 Filtered result:', filteredTopics);

  // Get icon component for topic
  const getTopicIcon = (topicName) => {
    const IconComponent = topicIcons[topicName] || FiBook;
    return IconComponent;
  };

  // Get color scheme for topic
  const getTopicColor = (topicName) => {
    return topicColors[topicName] || 'bg-gray-900/30 border-gray-500/30';
  };

  // Get level badge color
  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'advanced':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-100">Kho chủ đề</h2>
            <p className="text-gray-400 text-sm mt-1">Manage and organize IELTS lessons and AI knowledge bases.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30"
          >
            <FiPlus size={20} />
            Thêm chủ đề mới
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm chủ đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tất cả Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tất cả Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* View Toggle */}
            <div className="flex gap-2 bg-gray-700/50 border border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <FiGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <FiList size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tên chủ đề *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Technology, Environment..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level *</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Mô tả ngắn về chủ đề..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image URL</label>
                <input
                  type="url"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon Name</label>
                <input
                  type="text"
                  name="icon_name"
                  value={formData.icon_name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="FaLeaf, FaLaptopCode, FaGraduationCap..."
                />
              </div>

              {/* Keywords Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🏷️ Keywords (Tags cho AI tìm kiếm)
                </label>
                <div className="space-y-2">
                  {/* Input để thêm keyword mới */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="keyword-input"
                      placeholder="Nhập keyword và nhấn Enter..."
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target;
                          const keyword = input.value.trim();
                          if (keyword && !formData.keywords?.includes(keyword)) {
                            setFormData(prev => ({
                              ...prev,
                              keywords: [...(prev.keywords || []), keyword]
                            }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('keyword-input');
                        const keyword = input.value.trim();
                        if (keyword && !formData.keywords?.includes(keyword)) {
                          setFormData(prev => ({
                            ...prev,
                            keywords: [...(prev.keywords || []), keyword]
                          }));
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                    >
                      + Thêm
                    </button>
                  </div>
                  
                  {/* Hiển thị các keywords đã thêm */}
                  {formData.keywords && formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-900/50 border border-gray-600 rounded-lg min-h-15">
                      {formData.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                keywords: prev.keywords.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="hover:text-red-400 transition"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Thêm các từ khóa giúp AI tìm kiếm bài học phù hợp với chủ đề này
                  </p>
                </div>
              </div>

              {/* Frequency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tần suất xuất hiện (Frequency)
                </label>
                <select
                  name="frequency"
                  value={formData.frequency || 'medium'}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="high">🔴 HIGH - Xuất hiện thường xuyên trong đề thi</option>
                  <option value="medium">🟡 MEDIUM - Xuất hiện vừa phải</option>
                  <option value="low">🟢 LOW - Ít xuất hiện trong đề thi</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Đánh dấu mức độ phổ biến của chủ đề này trong các đề thi IELTS
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Active (Hiển thị chủ đề này)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topics Grid/List View */}
      {filteredTopics.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-12 text-center">
          <FiBook className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">Không tìm thấy chủ đề nào</p>
          <p className="text-gray-500 text-sm mt-2">Thử điều chỉnh bộ lọc hoặc tạo chủ đề mới</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View - Professional Topic Card with Keywords */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => {
            const IconComponent = getTopicIcon(topic.name);
            const colorScheme = getTopicColor(topic.name);
            const lessonCount = topic.lesson_count || 0;
            
            // Mock keywords - Replace with actual data from backend
            const keywords = topic.keywords || [
              'Pollution', 'Climate Change', 'Renewable Energy', 
              'Biodiversity', 'Global Warming', 'Recycling'
            ];
            
            // Mock frequency - Replace with actual data from backend
            const frequency = topic.frequency || 'high'; // 'high', 'medium', 'low'

            return (
              <div
                key={topic._id}
                className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col h-full"
              >
                {/* COVER IMAGE SECTION WITH OVERLAY */}
                <div className="relative h-44 overflow-hidden">
                  {/* Background Cover Image */}
                  <img 
                    src={topic.cover_image || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&q=80'} 
                    alt={topic.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/60 to-black/90" />
                  
                  {/* Icon Badge - Top Left Corner */}
                  <div className={`absolute top-3 left-3 w-11 h-11 rounded-lg flex items-center justify-center ${colorScheme} shadow-xl border border-white/20 backdrop-blur-sm`}>
                    <IconComponent className="text-white" size={22} />
                  </div>

                  {/* Frequency Badge - Top Right Corner */}
                  <div className="absolute top-3 right-3">
                    {frequency === 'high' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/90 text-white text-xs font-bold rounded-md backdrop-blur-sm shadow-lg">
                        🔴 HIGH
                      </span>
                    ) : frequency === 'medium' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/90 text-white text-xs font-bold rounded-md backdrop-blur-sm shadow-lg">
                        🟡 MEDIUM
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/90 text-white text-xs font-bold rounded-md backdrop-blur-sm shadow-lg">
                        🟢 LOW
                      </span>
                    )}
                  </div>

                  {/* Topic Name + Level Badge - Bottom Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 pb-3">
                    <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                      {topic.name}
                    </h3>
                    
                    {/* Level Badge */}
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md backdrop-blur-sm border shadow-lg ${getLevelBadgeColor(topic.level)}`}>
                      {topic.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* KEYWORDS SECTION */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      🏷️ Keywords for AI Search
                    </h4>
                    <span className="text-xs text-gray-500">{keywords.length} tags</span>
                  </div>
                  
                  {/* Keywords Tags - Scrollable */}
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar min-h-16">
                    {keywords.length > 0 ? (
                      keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20 transition-colors cursor-default"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs italic">No keywords added yet</span>
                    )}
                  </div>
                </div>

                {/* FOOTER - Stats + Action Buttons */}
                <div className="px-4 pb-4 pt-3 border-t border-gray-700/50 bg-gray-900/20 mt-auto">
                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-sm mb-3">
                    {/* Lessons Count */}
                    <div className="flex items-center gap-1.5">
                      <FiBook className="text-blue-400" size={15} />
                      <span className="font-semibold text-white">{lessonCount}</span>
                      <span className="text-gray-400 text-xs">Lessons</span>
                    </div>
                    
                    {/* Status Indicator (if synced) */}
                    {topic.is_synced && (
                      <div className="flex items-center gap-1">
                        <FiCheckCircle className="text-green-400" size={13} />
                        <span className="text-xs text-green-400 font-medium">Synced</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(topic);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>

                    {/* View Lessons Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/topics/${topic._id}/lessons`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      <FiBook size={14} />
                      📚 Lessons
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(topic._id);
                      }}
                      className="px-3 py-2 text-white rounded-lg transition-all duration-200 hover:opacity-90 border border-red-500/30"
                      style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
                      title="Delete Topic"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Topic Card */}
          <button
            onClick={() => setShowForm(true)}
            className="group relative bg-gray-800/30 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-500 hover:bg-purple-500/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] p-6"
          >
            <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all">
              <FiPlus className="text-purple-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 group-hover:text-purple-400 transition-colors">
              Thêm chủ đề mới
            </h3>
            <p className="text-gray-500 text-sm mt-2">Create a new category</p>
          </button>
        </div>
      ) : (
        /* List View */
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/30 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lessons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredTopics.map((topic) => {
                  const IconComponent = getTopicIcon(topic.name);
                  const lessonCount = topic.lesson_count || 0;

                  return (
                    <tr key={topic._id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <IconComponent className="text-purple-400" size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{topic.name}</div>
                            {topic.description && (
                              <div className="text-xs text-gray-400 line-clamp-1">{topic.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getLevelBadgeColor(topic.level)}`}>
                          {topic.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <FiBook size={16} />
                          <span>{lessonCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {topic.is_active ? (
                          <span className="flex items-center gap-1 w-fit px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                            <FiCheckCircle size={12} />
                            SYNCED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 w-fit px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
                            <FiXCircle size={12} />
                            NOT SYNCED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(topic)}
                            className="p-2 hover:bg-gray-700 rounded transition text-blue-400"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(topic._id)}
                            className="p-2 hover:bg-gray-700 rounded transition text-red-400"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTopics;
