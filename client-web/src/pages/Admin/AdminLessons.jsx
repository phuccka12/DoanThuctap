

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiBook, FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, 
  FiEye, FiLoader, FiChevronRight, FiRefreshCw, FiCheckCircle,
  FiAlertCircle, FiClock
} from 'react-icons/fi';
import { 
  FaHeadphones, FaBook, FaPen, FaMicrophone 
} from 'react-icons/fa';
import adminService from '../../services/adminService';

function AdminLessons() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  // States
  const [topic, setTopic] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [aiStatusFilter, setAiStatusFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0
  });

  // Fetch topic and lessons
  useEffect(() => {
    fetchTopicAndLessons();
  }, [topicId]);

  const fetchTopicAndLessons = async () => {
    try {
      setLoading(true);
      
      // Fetch topic info
      const topicRes = await adminService.getTopics();
      const topicsData = topicRes.data.data?.topics || topicRes.data.data || [];
      const foundTopic = topicsData.find(t => t._id === topicId);
      setTopic(foundTopic);

      // Fetch lessons by topic from backend
      // TODO: Implement getLessonsByTopic in adminService
      // const lessonsRes = await adminService.getLessonsByTopic(topicId);
      // const lessonsData = lessonsRes.data.data || [];
      
      // For now, set empty array until backend API is ready
      const lessonsData = [];
      setLessons(lessonsData);

      // Calculate stats
      const statsData = {
        total: lessonsData.length,
        listening: lessonsData.filter(l => l.skill === 'listening').length,
        reading: lessonsData.filter(l => l.skill === 'reading').length,
        writing: lessonsData.filter(l => l.skill === 'writing').length,
        speaking: lessonsData.filter(l => l.skill === 'speaking').length,
      };
      setStats(statsData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       lesson.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSkill = !skillFilter || lesson.skill === skillFilter;
    const matchLevel = !levelFilter || lesson.level === levelFilter;
    const matchAiStatus = !aiStatusFilter || lesson.ai_status === aiStatusFilter;
    
    return matchSearch && matchSkill && matchLevel && matchAiStatus;
  });

  // Handle actions
  const handleEdit = (lesson) => {
    // TODO: Navigate to edit page or open modal
    alert(`Edit lesson: ${lesson.title}`);
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;
    try {
      // TODO: await adminService.deleteLesson(lessonId);
      alert('Deleted successfully!');
      fetchTopicAndLessons();
    } catch (err) {
      alert('Error deleting lesson: ' + err.message);
    }
  };

  const handlePreview = (lesson) => {
    // TODO: Open preview modal or navigate to user view
    alert(`Preview lesson: ${lesson.title}`);
  };

  const handleResyncVector = async () => {
    if (!window.confirm('Re-sync tất cả vectors cho chủ đề này?')) return;
    try {
      // TODO: await adminService.resyncTopicVectors(topicId);
      alert('Re-sync started! This may take a few minutes.');
      fetchTopicAndLessons();
    } catch (err) {
      alert('Error re-syncing: ' + err.message);
    }
  };

  const handleAddLesson = () => {
    // TODO: Navigate to create lesson page
    alert('Navigate to create lesson page');
  };

  // Get skill icon and color - SIMPLIFIED (only gray + purple accent)
  const getSkillConfig = (skill) => {
    const configs = {
      reading: { 
        icon: FaBook, 
        color: 'text-gray-300', 
        bg: 'bg-gray-700/50', 
        border: 'border-gray-600', 
        label: 'Reading' 
      },
      listening: { 
        icon: FaHeadphones, 
        color: 'text-gray-300', 
        bg: 'bg-gray-700/50', 
        border: 'border-gray-600', 
        label: 'Listening' 
      },
      writing: { 
        icon: FaPen, 
        color: 'text-gray-300', 
        bg: 'bg-gray-700/50', 
        border: 'border-gray-600', 
        label: 'Writing' 
      },
      speaking: { 
        icon: FaMicrophone, 
        color: 'text-gray-300', 
        bg: 'bg-gray-700/50', 
        border: 'border-gray-600', 
        label: 'Speaking' 
      },
    };
    return configs[skill] || configs.reading;
  };

  // Get AI status config - SIMPLIFIED (only 2 colors)
  const getAiStatusConfig = (status) => {
    const configs = {
      ready: { 
        icon: FiCheckCircle, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20', 
        label: 'AI Ready' 
      },
      pending: { 
        icon: FiClock, 
        color: 'text-gray-400', 
        bg: 'bg-gray-700/50', 
        label: 'Pending' 
      },
      error: { 
        icon: FiAlertCircle, 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        label: 'Error' 
      },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button 
            onClick={() => navigate('/admin/topics')}
            className="hover:text-purple-400 transition-colors"
          >
            Kho chủ đề
          </button>
          <FiChevronRight size={14} />
          <span className="text-white font-medium">{topic?.name || 'Loading...'}</span>
        </div>

        {/* Title & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold text-gray-100">{topic?.name} Lessons</h2>
            <p className="text-gray-400 text-sm mt-1">Quản lý bài học cho chủ đề này</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
            {/* Re-sync Vector Button */}
            <button
              onClick={handleResyncVector}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-all border border-gray-600 whitespace-nowrap shadow-lg"
              style={{ minWidth: '140px' }}
            >
              <FiRefreshCw size={16} />
              <span>Re-sync Vector</span>
            </button>

            {/* Add Lesson Button */}
            <button
              onClick={handleAddLesson}
              className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              style={{ minWidth: '150px' }}
            >
              <FiPlus size={18} />
              <span>Thêm bài học</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          {/* Total */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <FiBook className="text-gray-500" size={32} />
            </div>
          </div>

          {/* Listening */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">🎧 Listening</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.listening}</p>
              </div>
              <FaHeadphones className="text-gray-500" size={28} />
            </div>
          </div>

          {/* Reading */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">📖 Reading</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.reading}</p>
              </div>
              <FaBook className="text-gray-500" size={28} />
            </div>
          </div>

          {/* Writing */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">✍️ Writing</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.writing}</p>
              </div>
              <FaPen className="text-gray-500" size={28} />
            </div>
          </div>

          {/* Speaking */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">🗣️ Speaking</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.speaking}</p>
              </div>
              <FaMicrophone className="text-gray-500" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR - FILTERS */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Tìm bài học trong ${topic?.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Skill Filter */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Skills</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* AI Status Filter */}
          <select
            value={aiStatusFilter}
            onChange={(e) => setAiStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All AI Status</option>
            <option value="ready">AI Ready</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* LESSONS LIST */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <FiBook className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg">Không tìm thấy bài học nào</p>
            <p className="text-gray-500 text-sm mt-2">Thử điều chỉnh bộ lọc hoặc thêm bài học mới</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {filteredLessons.map((lesson) => {
              const skillConfig = getSkillConfig(lesson.skill);
              const aiStatusConfig = getAiStatusConfig(lesson.ai_status);
              const SkillIcon = skillConfig.icon;
              const AiStatusIcon = aiStatusConfig.icon;

              return (
                <div 
                  key={lesson._id}
                  className="p-5 hover:bg-gray-700/30 transition-colors group"
                >
                  <div className="flex items-center gap-6">
                    {/* Column 1: Info (40%) */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                        {lesson.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {lesson.keywords.map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs border border-purple-500/20"
                          >
                            #{keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Type (20%) */}
                    <div className="flex flex-col gap-2 w-32">
                      {/* Skill Badge */}
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${skillConfig.bg} ${skillConfig.border}`}>
                        <SkillIcon className={skillConfig.color} size={14} />
                        <span className={`text-xs font-semibold ${skillConfig.color}`}>
                          {skillConfig.label}
                        </span>
                      </div>
                      {/* Level Badge */}
                      <div className="px-3 py-1 bg-gray-700/50 rounded-lg text-center">
                        <span className="text-xs text-gray-300 font-medium">
                          {lesson.band_score}
                        </span>
                      </div>
                    </div>

                    {/* Column 3: AI Status (20%) */}
                    <div className="w-32">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${aiStatusConfig.bg}`}>
                        <AiStatusIcon className={aiStatusConfig.color} size={16} />
                        <span className={`text-sm font-semibold ${aiStatusConfig.color}`}>
                          {aiStatusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Column 4: Actions (20%) */}
                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                        title="Edit"
                      >
                        <FiEdit2 className="text-white" size={16} />
                      </button>

                      {/* Preview */}
                      <button
                        onClick={() => handlePreview(lesson)}
                        className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
                        title="Preview"
                      >
                        <FiEye className="text-white" size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(lesson._id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                        title="Delete"
                      >
                        <FiTrash2 className="text-white" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Result Count */}
      <div className="text-center text-gray-400 text-sm">
        Hiển thị {filteredLessons.length} / {lessons.length} bài học
      </div>
    </div>
  );
}

export default AdminLessons;
