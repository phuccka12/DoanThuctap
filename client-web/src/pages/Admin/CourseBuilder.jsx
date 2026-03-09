import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  FiPlus, FiSave, FiArrowLeft, FiLoader, FiMenu,
  FiTrash2, FiCopy, FiEye, FiCheckCircle, FiSearch, FiX
} from 'react-icons/fi';
import { 
  FaBook, FaVideo, FaRobot, FaClipboardCheck, 
  FaGraduationCap, FaHeadphones, FaNewspaper
} from 'react-icons/fa';
import adminService from '../../services/adminService';
import AdminLayout from '../../components/AdminLayout';
import FileUploader from '../../components/FileUploader';

const ACTIVITY_TYPES = [
  {
    id: 'vocabulary',
    label: 'Bộ Từ Vựng',
    icon: FaBook,
    emoji: '�',
    description: 'Tạo bộ từ vựng theo chủ đề với hình ảnh minh họa'
  },
  {
    id: 'video',
    label: 'Bài Giảng Video',
    icon: FaVideo,
    emoji: '🎥',
    description: 'Video bài giảng kèm phụ đề và câu hỏi'
  },
  {
    id: 'ai_roleplay',
    label: 'Luyện Hội Thoại AI',
    icon: FaRobot,
    emoji: '🤖',
    description: 'Luyện nói với AI theo tình huống thực tế'
  },
  {
    id: 'quiz',
    label: 'Bài Kiểm Tra',
    icon: FaClipboardCheck,
    emoji: '✍️',
    description: 'Tạo bài tập trắc nghiệm và tự luận'
  },
  {
    id: 'grammar',
    label: 'Ngữ Pháp',
    icon: FaGraduationCap,
    emoji: '�',
    description: 'Giải thích ngữ pháp với ví dụ minh họa'
  },
  {
    id: 'listening',
    label: 'Luyện Nghe',
    icon: FaHeadphones,
    emoji: '🎧',
    description: 'Bài tập nghe với phụ đề tương tác'
  },
  {
    id: 'reading',
    label: 'Bài Đọc',
    icon: FaNewspaper,
    emoji: '📖',
    description: 'Bài đọc hiểu với câu hỏi trắc nghiệm'
  }
];

function CourseBuilder() {
  const { topicId, lessonId } = useParams();
  const navigate = useNavigate();

  // States
  const [topic, setTopic] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActivityMenu, setShowActivityMenu] = useState(false);

  // Fetch lesson data
  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const res = await adminService.getLessonById(lessonId);
      const lessonData = res.data.data;
      
      if (!lessonData) {
        alert('Lesson not found!');
        navigate(`/admin/topics/${topicId}/lessons`);
        return;
      }

      setLesson(lessonData);
      setTopic(lessonData.topic_id); // Topic is populated from backend
      
      // Load existing nodes from lesson.nodes or initialize empty
      setNodes(lessonData.nodes || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      alert('Failed to load lesson');
      navigate(`/admin/topics/${topicId}/lessons`);
      setLoading(false);
    }
  };

  // Add new node
  const handleAddActivity = (activityType) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: activityType.id,
      title: `${activityType.label} Mới`,
      data: getDefaultData(activityType.id),
      createdAt: new Date().toISOString()
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setShowActivityMenu(false);
  };

  // Get default data structure for each activity type
  const getDefaultData = (type) => {
    switch(type) {
      case 'vocabulary':
        return {
          words: [
            { word: '', meaning: '', pronunciation: '', example: '', imageUrl: '' }
          ]
        };
      case 'video':
        return {
          url: '',
          transcript: '',
          questions: []
        };
      case 'ai_roleplay':
        return {
          scenario: '',
          aiRole: '',
          userGoal: '',
          initialPrompt: ''
        };
      case 'quiz':
        return {
          questions: [
            { 
              question: '', 
              options: ['', '', '', ''], 
              correctAnswer: 0,
              explanation: '' 
            }
          ]
        };
      case 'grammar':
        return {
          title: '',
          content: '',
          examples: []
        };
      case 'listening':
        return {
          audioUrl: '',
          transcript: '',
          dictationMode: false,
          questions: []
        };
      default:
        return {};
    }
  };

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(nodes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setNodes(items);
  };

  // Update node data
  const handleUpdateNode = (nodeId, updatedData) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, ...updatedData }
        : node
    ));
  };

  // Delete node
  const handleDeleteNode = (nodeId) => {
    if (!window.confirm('Xóa hoạt động này?')) return;
    setNodes(nodes.filter(n => n.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Duplicate node
  const handleDuplicateNode = (node) => {
    const newNode = {
      ...node,
      id: `node_${Date.now()}`,
      title: `${node.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setNodes([...nodes, newNode]);
  };

  // Save course
  const handleSave = async () => {
    if (!lesson) return;

    try {
      setSaving(true);
      
      const updatedLesson = {
        nodes: nodes
      };

      await adminService.updateLesson(lessonId, updatedLesson);
      
      alert('✅ Đã lưu thành công!');
      setSaving(false);
    } catch (err) {
      console.error('Error saving:', err);
      alert('❌ Lỗi khi lưu: ' + err.message);
      setSaving(false);
    }
  };

  // Get selected node
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <FiLoader className="animate-spin text-4xl text-purple-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/admin/topics/${topicId}/lessons`)}
              className="p-2.5 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
              title="Quay lại danh sách bài học"
            >
              <FiArrowLeft className="text-xl text-gray-300 group-hover:text-white transition-colors" />
            </button>
            <div className="border-l border-gray-700 pl-4">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                <span>Xây Dựng Bài Học</span>
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {topic?.name} → {lesson?.title || 'Chưa có tiêu đề'}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {/* TODO: Preview mode */}}
              className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
            >
              <FiEye className="text-lg" />
              <span>Xem Trước</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <FiLoader className="animate-spin text-lg" /> : <FiSave className="text-lg" />}
              <span>{saving ? 'Đang lưu...' : 'Lưu Khóa Học'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Split Screen */}
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* LEFT PANEL: Node List (30%) */}
        <div className="w-[30%] bg-gray-900 border-r border-gray-700 flex flex-col">
          {/* Panel Header */}
          <div className="px-4 py-4 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">📚</span>
              <span>Lộ Trình Học Tập</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full font-medium">
                {nodes.length}
              </span>
              <span>hoạt động • Kéo thả để sắp xếp</span>
            </p>
          </div>

          {/* Nodes List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="nodes-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {nodes.map((node, index) => {
                      const activityType = ACTIVITY_TYPES.find(t => t.id === node.type);
                      const Icon = activityType?.icon || FaBook;
                      const isSelected = selectedNodeId === node.id;

                      return (
                        <Draggable key={node.id} draggableId={node.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group relative p-3 rounded-lg border cursor-pointer
                                transition-all duration-200
                                ${isSelected 
                                  ? 'bg-purple-900/30 border-purple-500' 
                                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                }
                                ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}
                              `}
                              onClick={() => setSelectedNodeId(node.id)}
                            >
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing"
                              >
                                <FiMenu />
                              </div>

                              {/* Content */}
                              <div className="ml-6">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-lg">{activityType?.emoji}</span>
                                  <span className="text-sm font-semibold text-white">
                                    {node.title}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {activityType?.label}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateNode(node);
                                  }}
                                  className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white"
                                  title="Duplicate"
                                >
                                  <FiCopy className="text-xs" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(node.id);
                                  }}
                                  className="p-1.5 bg-red-900/30 hover:bg-red-800 rounded text-red-400 hover:text-red-300"
                                  title="Delete"
                                >
                                  <FiTrash2 className="text-xs" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="text-center py-16">
                <div className="text-7xl mb-4 animate-bounce">📦</div>
                <p className="text-gray-400 text-sm font-medium">
                  Chưa có hoạt động nào<br />
                  <span className="text-purple-400">Nhấn "+ Thêm Hoạt Động"</span> để bắt đầu!
                </p>
              </div>
            )}
          </div>

          {/* Add Activity Button */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <button
              onClick={() => setShowActivityMenu(!showActivityMenu)}
              className="w-full py-3.5 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
            >
              <FiPlus className="text-xl" />
              <span>Thêm Hoạt Động</span>
            </button>

            {/* Activity Type Menu */}
            {showActivityMenu && (
              <div className="absolute bottom-20 left-4 right-4 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-100 overflow-y-auto custom-scrollbar z-50 backdrop-blur-sm">
                <div className="p-3 border-b border-gray-700 bg-gray-900/50 sticky top-0">
                  <p className="text-sm font-semibold text-gray-300">Chọn loại hoạt động</p>
                </div>
                {ACTIVITY_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleAddActivity(type)}
                      className="w-full p-4 hover:bg-gray-700/70 transition-all duration-200 flex items-start gap-3 border-b border-gray-700/50 last:border-b-0 group"
                    >
                      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 text-2xl group-hover:scale-110 transition-transform">
                        {type.emoji}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-white text-sm mb-0.5">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-400 leading-relaxed">
                          {type.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Content Editor (70%) */}
        <div className="flex-1 bg-gray-950 overflow-y-auto custom-scrollbar">
          {selectedNode ? (
            <ContentEditor
              node={selectedNode}
              activityTypes={ACTIVITY_TYPES}
              onUpdate={(data) => handleUpdateNode(selectedNode.id, data)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-8xl mb-6 animate-pulse">👈</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Chọn Một Hoạt Động
                </h3>
                <p className="text-gray-400 text-base">
                  Nhấn vào bất kỳ hoạt động nào từ panel bên trái<br />
                  để bắt đầu chỉnh sửa nội dung
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ==========================================
// Content Editor Component
// ==========================================
function ContentEditor({ node, activityTypes, onUpdate }) {
  const activityType = activityTypes.find(t => t.id === node.type);
  const Icon = activityType?.icon || FaBook;

  const handleChange = (field, value) => {
    onUpdate({
      ...node,
      [field]: value
    });
  };

  const handleDataChange = (dataUpdates) => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        ...dataUpdates
      }
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Editor Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-700 text-white text-2xl shadow-lg">
            {activityType?.emoji}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activityType?.label}
            </h2>
            <p className="text-sm text-gray-500">
              {activityType?.description}
            </p>
          </div>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={node.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Tiêu đề hoạt động..."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Dynamic Form Based on Type */}
      <div className="space-y-6">
        {node.type === 'vocabulary' && (
          <VocabularyEditor data={node.data} onChange={handleDataChange} />
        )}
        {node.type === 'video' && (
          <VideoEditor data={node.data} onChange={handleDataChange} />
        )}
        {node.type === 'ai_roleplay' && (
          <AIRoleplayEditor data={node.data} onChange={handleDataChange} />
        )}
        {node.type === 'quiz' && (
          <QuizEditor data={node.data} onChange={handleDataChange} />
        )}
        {node.type === 'grammar' && (
          <GrammarEditor data={node.data} onChange={handleDataChange} />
        )}
        {node.type === 'listening' && (
          <ListeningEditor data={node.data} onChange={handleDataChange} />
        )}
        {node.type === 'reading' && (
          <ReadingEditor data={node.data} onChange={handleDataChange} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// Editor Components for Each Activity Type
// ==========================================

// 1. Vocabulary Editor
function VocabularyEditor({ data, onChange }) {
  const words = data.words || [];
  const [showPicker, setShowPicker] = useState(false);

  const handleAddWord = () => {
    onChange({
      words: [...words, { word: '', meaning: '', pronunciation: '', example: '', imageUrl: '' }]
    });
  };

  const handleWordChange = (index, field, value) => {
    const updatedWords = [...words];
    updatedWords[index][field] = value;
    onChange({ words: updatedWords });
  };

  const handleRemoveWord = (index) => {
    onChange({ words: words.filter((_, i) => i !== index) });
  };

  const handleAutoGenerate = async () => {
    alert('🤖 AI Auto-generate feature coming soon!');
    // TODO: Call AI API to generate vocabulary based on topic
  };

  const handleImportFromBank = (selectedVocabs) => {
    const importedWords = selectedVocabs.map(v => ({
      word: v.word,
      meaning: v.meaning,
      pronunciation: v.pronunciation || '',
      example: v.example || '',
      imageUrl: v.imageUrl || ''
    }));
    
    onChange({
      words: [...words, ...importedWords]
    });
    
    setShowPicker(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAutoGenerate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <span>⚡</span>
          <span>Auto-generate from Topic</span>
        </button>
        
        <button
          onClick={() => setShowPicker(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <FaBook />
          <span>Chọn từ Kho Từ Vựng</span>
        </button>
      </div>

      {/* Vocabulary Picker Modal */}
      {showPicker && (
        <VocabularyPickerModal
          onClose={() => setShowPicker(false)}
          onImport={handleImportFromBank}
        />
      )}

      {/* AI Generate Button - OLD, keeping for reference */}
      {/* <button
        onClick={handleAutoGenerate}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
      >
        <span>⚡</span>
        <span>Auto-generate from Topic</span>
      </button> */}

      {/* Word List */}
      {words.map((word, index) => (
        <div key={index} className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-gray-500 text-sm font-semibold">Word #{index + 1}</span>
            <button
              onClick={() => handleRemoveWord(index)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              <FiTrash2 />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={word.word}
              onChange={(e) => handleWordChange(index, 'word', e.target.value)}
              placeholder="Word (e.g., Passport)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              value={word.meaning}
              onChange={(e) => handleWordChange(index, 'meaning', e.target.value)}
              placeholder="Meaning (e.g., Hộ chiếu)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              value={word.pronunciation}
              onChange={(e) => handleWordChange(index, 'pronunciation', e.target.value)}
              placeholder="IPA (e.g., /ˈpɑːspɔːrt/)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              📷 Hình Minh Họa
            </label>
            <FileUploader
              accept="image/*"
              folder="ielts-app/vocabulary"
              onUploadSuccess={(data) => {
                handleWordChange(index, 'imageUrl', data.url);
              }}
              maxSize={5}
              placeholder="Kéo thả hình ảnh vào đây hoặc nhấn để chọn"
            />
            {word.imageUrl && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">URL hiện tại:</p>
                <input
                  type="text"
                  value={word.imageUrl}
                  onChange={(e) => handleWordChange(index, 'imageUrl', e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="hoặc paste URL trực tiếp"
                />
              </div>
            )}
          </div>

          <textarea
            value={word.example}
            onChange={(e) => handleWordChange(index, 'example', e.target.value)}
            placeholder="Example sentence"
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      ))}

      <button
        onClick={handleAddWord}
        className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg text-gray-500 hover:text-gray-400 transition-colors flex items-center justify-center space-x-2"
      >
        <FiPlus />
        <span>Add Word</span>
      </button>
    </div>
  );
}

// 2. Video Editor
function VideoEditor({ data, onChange }) {
  const [uploadType, setUploadType] = React.useState('youtube'); // 'youtube' or 'upload'

  return (
    <div className="space-y-4">
      {/* Toggle Upload Type */}
      <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
        <button
          onClick={() => setUploadType('youtube')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            uploadType === 'youtube'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📺 YouTube URL
        </button>
        <button
          onClick={() => setUploadType('upload')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            uploadType === 'upload'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎥 Upload Video
        </button>
      </div>

      {/* YouTube URL Input */}
      {uploadType === 'youtube' && (
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            📺 YouTube Video URL
          </label>
          <input
            type="url"
            value={data.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {data.url && (
            <div className="mt-3 aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={data.url.replace('watch?v=', 'embed/')}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video preview"
              />
            </div>
          )}
        </div>
      )}

      {/* Video Upload */}
      {uploadType === 'upload' && (
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            🎥 Upload Video File (MP4, MOV)
          </label>
          <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg mb-3">
            <p className="text-xs text-yellow-400">
              ⚠️ Lưu ý: File video có thể lớn (max 100MB). Khuyến nghị dùng YouTube để tiết kiệm storage.
            </p>
          </div>
          <FileUploader
            accept="video/*"
            folder="ielts-app/videos"
            onUploadSuccess={(uploadData) => {
              onChange({ url: uploadData.url });
            }}
            maxSize={100}
            placeholder="Kéo thả video vào đây hoặc nhấn để chọn"
          />
          {data.url && !data.url.includes('youtube') && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg">
              <video controls className="w-full rounded">
                <source src={data.url} />
                Trình duyệt không hỗ trợ phát video.
              </video>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          📝 Transcript (Phụ đề video)
        </label>
        <textarea
          value={data.transcript || ''}
          onChange={(e) => onChange({ transcript: e.target.value })}
          placeholder="Nhập nội dung transcript..."
          rows={10}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
        />
      </div>
    </div>
  );
}

// 3. AI Roleplay Editor
function AIRoleplayEditor({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          🎭 Scenario (Context)
        </label>
        <textarea
          value={data.scenario || ''}
          onChange={(e) => onChange({ scenario: e.target.value })}
          placeholder="Example: You are at the airport check-in counter..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          🤖 AI Persona (Who is the AI?)
        </label>
        <input
          type="text"
          value={data.aiRole || ''}
          onChange={(e) => onChange({ aiRole: e.target.value })}
          placeholder="Example: A strict customs officer"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          🎯 User Goal
        </label>
        <input
          type="text"
          value={data.userGoal || ''}
          onChange={(e) => onChange({ userGoal: e.target.value })}
          placeholder="Example: Pass through security successfully"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          💬 Initial Prompt (AI's first message)
        </label>
        <textarea
          value={data.initialPrompt || ''}
          onChange={(e) => onChange({ initialPrompt: e.target.value })}
          placeholder="Example: Good morning. Your passport and boarding pass, please."
          rows={2}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>
  );
}

// 4. Quiz Editor
function QuizEditor({ data, onChange }) {
  const questions = data.questions || [];

  const handleAddQuestion = () => {
    onChange({
      questions: [...questions, {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }]
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    onChange({ questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    onChange({ questions: updated });
  };

  const handleRemoveQuestion = (index) => {
    onChange({ questions: questions.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-gray-500 text-sm font-semibold">Question #{qIndex + 1}</span>
            <button
              onClick={() => handleRemoveQuestion(qIndex)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              <FiTrash2 />
            </button>
          </div>

          <textarea
            value={q.question}
            onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
            placeholder="Enter question..."
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="space-y-2">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={q.correctAnswer === oIndex}
                  onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                  className="text-gray-400"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                  placeholder={`Option ${oIndex + 1}`}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ))}
          </div>

          <textarea
            value={q.explanation}
            onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
            placeholder="Explanation (why this answer is correct)"
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      ))}

      <button
        onClick={handleAddQuestion}
        className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg text-gray-500 hover:text-gray-400 transition-colors flex items-center justify-center space-x-2"
      >
        <FiPlus />
        <span>Add Question</span>
      </button>
    </div>
  );
}

// 5. Grammar Editor
function GrammarEditor({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Grammar Point Title
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Example: Present Perfect Tense"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Explanation (Supports Markdown)
        </label>
        <textarea
          value={data.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Explain the grammar rule..."
          rows={8}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Examples (One per line)
        </label>
        <textarea
          value={(data.examples || []).join('\n')}
          onChange={(e) => onChange({ examples: e.target.value.split('\n') })}
          placeholder="I have lived here for 5 years.&#10;She has just finished her homework."
          rows={4}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>
  );
}

// Helper: strip HTML tags + decode &nbsp; etc. → plain text
function stripHtml(html = '') {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')   // remove tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')    // collapse multiple spaces
    .trim();
}

// 7. Reading Editor
function ReadingEditor({ data, onChange }) {
  const [showPicker, setShowPicker] = useState(false);

  const handlePickPassage = (passage) => {
    onChange({
      passage_id:       passage._id,
      passage_title:    passage.title,
      passage:          stripHtml(passage.passage || ''),
      vocab_highlights: passage.vocab_highlights || [],
      questions:        passage.questions || [],
      level:            passage.cefr_level || passage.level || '',
    });
    setShowPicker(false);
  };

  const handleClearPassage = () => {
    onChange({
      passage_id:       null,
      passage_title:    '',
      passage:          '',
      vocab_highlights: [],
      questions:        [],
      level:            '',
    });
  };

  const LEVEL_COLORS = {
    A1: 'bg-green-700 text-green-200', A2: 'bg-green-700 text-green-200',
    B1: 'bg-yellow-700 text-yellow-200', B2: 'bg-yellow-700 text-yellow-200',
    C1: 'bg-red-700 text-red-200',   C2: 'bg-red-700 text-red-200',
    beginner: 'bg-green-700 text-green-200',
    intermediate: 'bg-yellow-700 text-yellow-200',
    advanced: 'bg-red-700 text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Passage Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">📖 Bài đọc từ kho</label>
        {data.passage_id ? (
          <div className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-500/40 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center shrink-0">
              <FaNewspaper className="text-white" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{data.passage_title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {data.level && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[data.level] || 'bg-gray-700 text-gray-300'}`}>
                    {data.level}
                  </span>
                )}
                {data.vocab_highlights?.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-800/60 text-amber-300">
                    {data.vocab_highlights.length} từ highlight
                  </span>
                )}
                {data.questions?.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-800 text-blue-200">
                    {data.questions.length} câu hỏi
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors"
              >
                Đổi bài
              </button>
              <button
                type="button"
                onClick={handleClearPassage}
                className="px-3 py-1.5 bg-red-700/60 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full py-4 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl text-gray-400 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            <FaNewspaper size={18} />
            <span>Chọn bài đọc từ kho</span>
          </button>
        )}
      </div>

      {/* Preview passage snippet */}
      {data.passage && (
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Xem trước đoạn văn</p>
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{stripHtml(data.passage)}</p>
        </div>
      )}

      {/* Picker modal */}
      {showPicker && (
        <ReadingPickerModal
          onClose={() => setShowPicker(false)}
          onPick={handlePickPassage}
        />
      )}
    </div>
  );
}

// ============ Reading Picker Modal ============
function ReadingPickerModal({ onClose, onPick }) {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [level, setLevel]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LEVEL_COLORS = {
    beginner:     'bg-green-700 text-green-200',
    intermediate: 'bg-yellow-700 text-yellow-200',
    advanced:     'bg-red-700 text-red-200',
  };
  const LEVEL_LABELS = { beginner: 'Sơ cấp', intermediate: 'Trung cấp', advanced: 'Nâng cao' };

  useEffect(() => { fetchPassages(); }, [page, search, level]);

  const fetchPassages = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPassagesForLessonBuilder({
        page, limit: 8,
        search: search.trim(),
        cefr_level: level,
        is_active: true,
      });
      const raw = res.data.data || [];
      setPassages(Array.isArray(raw) ? raw : raw.passages || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Lỗi tải kho bài đọc:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">📖 Kho Bài Đọc</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><FiX size={22} /></button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm tiêu đề bài đọc..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả cấp độ</option>
            {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
            <option value="beginner">Sơ cấp</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <FiLoader className="animate-spin text-blue-400" size={32} />
            </div>
          ) : passages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">Không tìm thấy bài đọc nào</div>
          ) : (
            passages.map((p) => (
              <div
                key={p._id}
                onClick={() => onPick(p)}
                className="flex items-start gap-4 p-4 bg-gray-800 hover:bg-blue-900/30 border border-gray-700 hover:border-blue-500 rounded-xl cursor-pointer transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FaNewspaper className="text-white" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{p.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(p.cefr_level || p.level) && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[p.cefr_level || p.level] || 'bg-gray-700 text-gray-300'}`}>
                        {LEVEL_LABELS[p.cefr_level || p.level] || p.cefr_level || p.level}
                      </span>
                    )}
                    {p.word_count > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{p.word_count} từ</span>
                    )}
                    {p.vocab_highlights?.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-800/60 text-amber-300">
                        ✨ {p.vocab_highlights.length} highlight
                      </span>
                    )}
                    {p.questions?.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-800 text-blue-200">{p.questions.length} câu hỏi</span>
                    )}
                  </div>
                  {p.passage && (
                    <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{stripHtml(p.passage)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-700">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-1.5 rounded-lg bg-gray-700 text-white text-sm disabled:opacity-40 hover:bg-gray-600">
              ← Trước
            </button>
            <span className="px-4 py-1.5 text-gray-400 text-sm">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-1.5 rounded-lg bg-gray-700 text-white text-sm disabled:opacity-40 hover:bg-gray-600">
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 6. Listening Editor
function ListeningEditor({ data, onChange }) {
  const [showPicker, setShowPicker] = useState(false);

  const handlePickPassage = (passage) => {
    onChange({
      passage_id: passage._id,
      passage_title: passage.title,
      audioUrl: passage.audio_url,
      transcript: passage.transcript || '',
      level: passage.level,
      section: passage.section,
      questions: passage.questions || [],
    });
    setShowPicker(false);
  };

  const handleClearPassage = () => {
    onChange({
      passage_id: null,
      passage_title: '',
      audioUrl: '',
      transcript: '',
      level: '',
      section: '',
      questions: [],
    });
  };

  return (
    <div className="space-y-4">
      {/* Nút chọn từ kho */}
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
      >
        🗂️ Chọn từ kho Listening
      </button>

      {/* Hiển thị bài đã chọn */}
      {data.passage_id && (
        <div className="flex items-start justify-between p-3 bg-purple-900/40 border border-purple-600 rounded-lg">
          <div>
            <p className="text-xs text-purple-300 mb-1">Bài đã chọn từ kho:</p>
            <p className="text-white font-semibold">{data.passage_title}</p>
            <div className="flex gap-2 mt-1">
              {data.level && (
                <span className="text-xs px-2 py-0.5 bg-purple-700 rounded-full text-purple-200">
                  {data.level === 'beginner' ? 'Sơ cấp' : data.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                </span>
              )}
              {data.section && (
                <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300">
                  {data.section}
                </span>
              )}
              {data.questions?.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300">
                  {data.questions.length} câu hỏi
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearPassage}
            className="text-gray-400 hover:text-red-400 p-1"
            title="Bỏ chọn"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      <div className="border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-500 mb-3">— hoặc upload audio thủ công —</p>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            🎧 File Audio (MP3, WAV, M4A)
          </label>
          <FileUploader
            accept="audio/*"
            folder="ielts-app/audio"
            onUploadSuccess={(uploadData) => {
              onChange({ audioUrl: uploadData.url, passage_id: null, passage_title: '' });
            }}
            maxSize={20}
            placeholder="Kéo thả file audio vào đây hoặc nhấn để chọn"
          />
          {data.audioUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">URL hiện tại:</p>
              <input
                type="text"
                value={data.audioUrl}
                onChange={(e) => onChange({ audioUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="hoặc paste URL trực tiếp"
              />
              <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                <audio controls className="w-full">
                  <source src={data.audioUrl} />
                  Trình duyệt không hỗ trợ phát audio.
                </audio>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            📝 Transcript (Phụ đề tương tác)
          </label>
          <textarea
            value={data.transcript || ''}
            onChange={(e) => onChange({ transcript: e.target.value })}
            placeholder="Nhập nội dung transcript..."
            rows={6}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          />
        </div>

        <div className="flex items-center space-x-3 mt-3">
          <input
            type="checkbox"
            id="dictation"
            checked={data.dictationMode || false}
            onChange={(e) => onChange({ dictationMode: e.target.checked })}
            className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
          />
          <label htmlFor="dictation" className="text-white font-semibold">
            🎯 Dictation Mode (Ẩn transcript, bắt người dùng nghe và gõ)
          </label>
        </div>
      </div>

      {showPicker && (
        <ListeningPickerModal
          onClose={() => setShowPicker(false)}
          onPick={handlePickPassage}
        />
      )}
    </div>
  );
}

// ============ Listening Picker Modal ============
function ListeningPickerModal({ onClose, onPick }) {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [section, setSection] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LEVEL_LABELS = { beginner: 'Sơ cấp', intermediate: 'Trung cấp', advanced: 'Nâng cao' };
  const LEVEL_COLORS = { beginner: 'bg-green-700 text-green-200', intermediate: 'bg-yellow-700 text-yellow-200', advanced: 'bg-red-700 text-red-200' };

  useEffect(() => {
    fetchPassages();
  }, [page, search, level, section]);

  const fetchPassages = async () => {
    setLoading(true);
    try {
      const res = await adminService.getListeningPassages({ page, limit: 8, search: search.trim(), level, section, is_active: true });
      setPassages(res.data.data?.passages || res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Lỗi tải kho listening:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">🗂️ Kho Bài Nghe Listening</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><FiX size={22} /></button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm tiêu đề bài nghe..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tất cả cấp độ</option>
            <option value="beginner">Sơ cấp</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
          <select
            value={section}
            onChange={(e) => { setSection(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tất cả phần</option>
            {['section1','section2','section3','section4','general'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <FiLoader className="animate-spin text-purple-400" size={32} />
            </div>
          ) : passages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">Không tìm thấy bài nghe nào</div>
          ) : (
            passages.map((p) => (
              <div
                key={p._id}
                onClick={() => onPick(p)}
                className="flex items-center gap-4 p-4 bg-gray-800 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500 rounded-xl cursor-pointer transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-purple-700 flex items-center justify-center shrink-0">
                  <FaHeadphones className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{p.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {p.level && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[p.level]}`}>
                        {LEVEL_LABELS[p.level]}
                      </span>
                    )}
                    {p.section && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{p.section}</span>
                    )}
                    {p.duration_sec > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {Math.floor(p.duration_sec / 60)}:{String(p.duration_sec % 60).padStart(2, '0')}
                      </span>
                    )}
                    {p.questions?.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-800 text-blue-200">{p.questions.length} câu hỏi</span>
                    )}
                  </div>
                </div>
                {p.audio_url && (
                  <audio
                    src={p.audio_url}
                    controls
                    className="h-8 w-40 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-700">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-1.5 rounded-lg bg-gray-700 text-white text-sm disabled:opacity-40 hover:bg-gray-600"
            >
              ← Trước
            </button>
            <span className="px-4 py-1.5 text-gray-400 text-sm">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-1.5 rounded-lg bg-gray-700 text-white text-sm disabled:opacity-40 hover:bg-gray-600"
            >
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Vocabulary Picker Modal ============
function VocabularyPickerModal({ onClose, onImport }) {
  const [vocabularies, setVocabularies] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchVocabularies();
  }, [page, search, level, topic]);

  const fetchTopics = async () => {
    try {
      const res = await adminService.getAllTopicsForDropdown();
      const topicsArray = res.data.data?.topics || [];
      setAllTopics(topicsArray);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchVocabularies = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search.trim(),
        level,
        topic
      };
      
      const res = await adminService.getVocabularies(params);
      setVocabularies(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching vocabularies:', err);
      alert('Lỗi tải danh sách từ vựng');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (vocabId) => {
    setSelectedIds(prev =>
      prev.includes(vocabId)
        ? prev.filter(id => id !== vocabId)
        : [...prev, vocabId]
    );
  };

  const handleImport = () => {
    const selectedVocabs = vocabularies.filter(v => selectedIds.includes(v._id));
    onImport(selectedVocabs);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaBook className="text-blue-500" />
            Chọn Từ Vựng từ Kho
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm từ vựng..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-45"
            >
              <option value="">📚 Tất cả Topics</option>
              {allTopics.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.level})
                </option>
              ))}
            </select>
            
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">🎯 Tất cả Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          {/* Active Filters */}
          {(search || topic || level) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {search && (
                <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs flex items-center gap-1">
                  🔍 "{search}"
                  <button onClick={() => { setSearch(''); setPage(1); }}>
                    <FiX size={12} />
                  </button>
                </span>
              )}
              {topic && (
                <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs flex items-center gap-1">
                  📚 {allTopics.find(t => t._id === topic)?.name}
                  <button onClick={() => { setTopic(''); setPage(1); }}>
                    <FiX size={12} />
                  </button>
                </span>
              )}
              {level && (
                <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs flex items-center gap-1">
                  🎯 {level}
                  <button onClick={() => { setLevel(''); setPage(1); }}>
                    <FiX size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={() => { setSearch(''); setTopic(''); setLevel(''); setPage(1); }}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Vocabulary List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FiLoader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : vocabularies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaBook size={48} className="mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy từ vựng</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {vocabularies.map(vocab => (
                <div
                  key={vocab._id}
                  onClick={() => toggleSelect(vocab._id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedIds.includes(vocab._id)
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-1 ${
                      selectedIds.includes(vocab._id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-500'
                    }`}>
                      {selectedIds.includes(vocab._id) && (
                        <FiCheckCircle className="text-white" size={14} />
                      )}
                    </div>

                    {/* Vocab Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-bold text-lg">{vocab.word}</h4>
                          {vocab.pronunciation && (
                            <p className="text-gray-400 text-sm italic">{vocab.pronunciation}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          vocab.level === 'beginner' ? 'bg-green-900 text-green-300' :
                          vocab.level === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {vocab.level}
                        </span>
                      </div>
                      <p className="text-gray-300 mt-2">{vocab.meaning}</p>
                      {vocab.example && (
                        <p className="text-gray-400 text-sm mt-1 italic">"{vocab.example}"</p>
                      )}
                      
                      {/* Topics Tags */}
                      {vocab.topics && vocab.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vocab.topics.slice(0, 3).map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full text-xs"
                            >
                              {topic.name || 'Topic'}
                            </span>
                          ))}
                          {vocab.topics.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full text-xs">
                              +{vocab.topics.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image Preview */}
                    {vocab.imageUrl && (
                      <img
                        src={vocab.imageUrl}
                        alt={vocab.word}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Đã chọn: <span className="text-white font-semibold">{selectedIds.length}</span> từ vựng
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FiCheckCircle />
              Import {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseBuilder;
