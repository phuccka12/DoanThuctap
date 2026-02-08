import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiBook, FiPlus, FiEdit2, FiTrash2, FiEye, FiRefreshCw, 
  FiMove, FiClock, FiCheckCircle, FiXCircle, FiGrid, FiArrowLeft, FiChevronRight
} from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import adminService from '../../services/adminService';

/**
 * AdminLessons - LEVEL 2: Table of Contents (Mục Lục Chương)
 * Shows list of lessons for a topic
 * Admin can:
 * - Create new lessons
 * - Reorder lessons by drag & drop
 * - Edit lesson info
 * - Delete lessons
 * - Open Builder for each lesson
 */
function AdminLessons() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    duration: 15,
    level: 'beginner'
  });

  useEffect(() => {
    fetchLessons();
  }, [topicId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      
      // Get lessons from new API
      const res = await adminService.getLessonsByTopic(topicId);
      const data = res.data.data;
      
      setTopic(data.topic);
      setLessons(data.lessons || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Lỗi khi tải dữ liệu');
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!newLesson.title.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }

    try {
      await adminService.createLesson(topicId, newLesson);
      
      setShowCreateModal(false);
      setNewLesson({
        title: '',
        description: '',
        duration: 15,
        level: 'beginner'
      });
      
      fetchLessons();
      alert('✅ Tạo bài học thành công!');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;

    try {
      await adminService.deleteLesson(lessonId);
      fetchLessons();
      alert('✅ Đã xóa bài học!');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleOpenBuilder = (lessonId) => {
    // Navigate to Builder for this specific lesson
    navigate(`/admin/topics/${topicId}/lessons/${lessonId}/builder`);
  };

  const handleTogglePublish = async (lessonId, currentStatus) => {
    try {
      await adminService.updateLesson(lessonId, { 
        is_published: !currentStatus 
      });
      fetchLessons();
      alert(`✅ Đã ${!currentStatus ? 'xuất bản' : 'gỡ xuất bản'} bài học!`);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handlePublishAll = async () => {
    if (!window.confirm('Xuất bản tất cả bài học?')) return;
    
    try {
      const updatePromises = lessons.map(lesson => 
        adminService.updateLesson(lesson._id, { is_published: true })
      );
      await Promise.all(updatePromises);
      fetchLessons();
      alert('✅ Đã xuất bản tất cả bài học!');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleUnpublishAll = async () => {
    if (!window.confirm('Gỡ xuất bản tất cả bài học?')) return;
    
    try {
      const updatePromises = lessons.map(lesson => 
        adminService.updateLesson(lesson._id, { is_published: false })
      );
      await Promise.all(updatePromises);
      fetchLessons();
      alert('✅ Đã gỡ xuất bản tất cả bài học!');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Lỗi: ' + err.message);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLessons(items);

    try {
      // Send new order to backend
      const lessonIds = items.map(l => l._id);
      await adminService.reorderLessons(topicId, lessonIds);
    } catch (err) {
      console.error('Error reordering:', err);
      alert('❌ Lỗi khi sắp xếp lại');
      fetchLessons(); // Revert
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchLessons}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/topics')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3 group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại Topics</span>
          </button>
          
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/admin/topics')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              📚 Quản lý Topics
            </button>
            <FiChevronRight className="text-gray-600" />
            <span className="text-gray-300">
              {topic?.name || 'Loading...'}
            </span>
          </div>
        </div>

        {/* Topic Info Card */}
        {topic && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {topic.icon_image_url ? (
                    <img src={topic.icon_image_url} alt={topic.name} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <span>📚</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{topic.name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{topic.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      topic.level === 'beginner' ? 'bg-green-900 text-green-300' :
                      topic.level === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {topic.level}
                    </span>
                    <span className="text-xs text-gray-400">
                      {lessons.length} bài học
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <FiBook className="text-blue-500" />
              Mục Lục Bài Học
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Cấp độ 2: Danh sách các chương (Lessons)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePublishAll}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              title="Xuất bản tất cả"
            >
              <FiCheckCircle />
              Publish All
            </button>
            <button
              onClick={handleUnpublishAll}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}
              title="Gỡ xuất bản tất cả"
            >
              <FiXCircle />
              Unpublish All
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            >
              <FiPlus />
              Thêm Bài Học
            </button>
            <button
              onClick={fetchLessons}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Tổng bài học</div>
            <div className="text-3xl font-bold text-white">{lessons.length}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Đã xuất bản</div>
            <div className="text-3xl font-bold text-green-500">
              {lessons.filter(l => l.is_published).length}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Nháp</div>
            <div className="text-3xl font-bold text-yellow-500">
              {lessons.filter(l => !l.is_published).length}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Tổng hoạt động</div>
            <div className="text-3xl font-bold text-purple-500">
              {lessons.reduce((sum, l) => sum + (l.nodes?.length || 0), 0)}
            </div>
          </div>
        </div>

        {/* Lessons List with Drag & Drop */}
        {lessons.length === 0 ? (
          <div className="text-center py-16">
            <FiBook className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">
              Chưa có bài học nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy tạo bài học đầu tiên cho chủ đề này!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 mx-auto"
            >
              <FiPlus />
              Tạo Bài Học Đầu Tiên
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lessons">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {lessons.map((lesson, index) => (
                    <Draggable
                      key={lesson._id}
                      draggableId={lesson._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-gray-800 rounded-lg border-2 transition-all ${
                            snapshot.isDragging
                              ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                              : 'border-gray-700'
                          }`}
                        >
                          <div className="p-4 flex items-center gap-4">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing"
                            >
                              <FiMove className="text-2xl" />
                            </div>

                            {/* Order Number */}
                            <div className="shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <span className="text-xl font-bold text-blue-400">
                                {index + 1}
                              </span>
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p className="text-sm text-gray-400 line-clamp-1">
                                  {lesson.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <FiClock className="text-blue-400" />
                                  {lesson.duration || 15} phút
                                </span>
                                <span className="flex items-center gap-1">
                                  <FiGrid className="text-purple-400" />
                                  {lesson.nodes?.length || 0} hoạt động
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  lesson.level === 'beginner' ? 'bg-green-900 text-green-300' :
                                  lesson.level === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                                  'bg-red-900 text-red-300'
                                }`}>
                                  {lesson.level === 'beginner' ? 'Cơ bản' :
                                   lesson.level === 'intermediate' ? 'Trung bình' :
                                   'Nâng cao'}
                                </span>
                                {lesson.is_published ? (
                                  <span className="flex items-center gap-1 text-green-400">
                                    <FiCheckCircle />
                                    Đã xuất bản
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-yellow-400">
                                    <FiXCircle />
                                    Nháp
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenBuilder(lesson._id)}
                                className="px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}
                                title="Mở Builder"
                              >
                                <FiEdit2 />
                                Builder
                              </button>
                              <button
                                onClick={() => handleTogglePublish(lesson._id, lesson.is_published)}
                                className="px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 hover:opacity-90"
                                style={{ 
                                  background: lesson.is_published 
                                    ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' 
                                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                }}
                                title={lesson.is_published ? 'Gỡ xuất bản' : 'Xuất bản'}
                              >
                                <FiCheckCircle />
                                {lesson.is_published ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                onClick={() => alert(`Preview: ${lesson.title}`)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                title="Preview"
                              >
                                <FiEye />
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson._id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Tạo Bài Học Mới</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tên bài học *</label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="VD: Check-in tại sân bay"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mô tả</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    placeholder="Mô tả ngắn về bài học"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Thời lượng (phút)</label>
                    <input
                      type="number"
                      value={newLesson.duration}
                      onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 15 })}
                      min="1"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cấp độ</label>
                    <select
                      value={newLesson.level}
                      onChange={(e) => setNewLesson({ ...newLesson, level: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="beginner">Cơ bản</option>
                      <option value="intermediate">Trung bình</option>
                      <option value="advanced">Nâng cao</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateLesson}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Tạo Bài Học
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLessons;