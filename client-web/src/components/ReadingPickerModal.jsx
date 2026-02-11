import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiBook, FiClock, FiFileText, FiCheckCircle } from 'react-icons/fi';
import adminService from '../services/adminService';

/**
 * ReadingPickerModal - Select passages for Lesson Builder
 * "Write Once, Use Everywhere" - Pick from Reading Bank
 */

const CEFR_LEVELS = [
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
  { value: 'C2', label: 'C2' }
];

const CONTENT_TYPES = [
  { value: 'email', label: '📧 Email' },
  { value: 'letter', label: '✉️ Letter' },
  { value: 'news', label: '📰 News' },
  { value: 'story', label: '📖 Story' },
  { value: 'conversation', label: '💬 Conversation' },
  { value: 'article', label: '📝 Article' },
  { value: 'blog', label: '✍️ Blog' },
  { value: 'other', label: '📄 Other' }
];

function ReadingPickerModal({ onClose, onSelect }) {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('');
  const [cefrLevel, setCefrLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [allTopics, setAllTopics] = useState([]);

  useEffect(() => {
    fetchTopics();
    fetchPassages();
  }, []);

  useEffect(() => {
    fetchPassages();
  }, [search, contentType, cefrLevel, topic]);

  const fetchTopics = async () => {
    try {
      const res = await adminService.getAllTopicsForDropdown();
      setAllTopics(res.data.data?.topics || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPassagesForLessonBuilder({
        search,
        content_type: contentType,
        cefr_level: cefrLevel,
        topic,
        limit: 50
      });
      setPassages(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching passages:', err);
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedPassage) {
      // Track usage
      adminService.trackPassageUsage(selectedPassage._id).catch(console.error);
      onSelect(selectedPassage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiBook className="text-blue-500" />
              Chọn Bài Đọc từ Kho
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {passages.length} bài đọc khả dụng
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 bg-gray-750">
          <div className="grid grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Content Type */}
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả loại</option>
              {CONTENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* CEFR Level */}
            <select
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả levels</option>
              {CEFR_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>

            {/* Topic */}
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả topics</option>
              {allTopics.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content - Split view */}
        <div className="flex-1 overflow-hidden flex">
          {/* List */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin text-blue-500 text-4xl mb-2">⟳</div>
                  <p className="text-gray-400">Đang tải...</p>
                </div>
              </div>
            ) : passages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiBook className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Không tìm thấy bài đọc</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {passages.map(passage => (
                  <div
                    key={passage._id}
                    onClick={() => setSelectedPassage(passage)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPassage?._id === passage._id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 bg-gray-750 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {passage.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                          {passage.passage?.replace(/<[^>]*>/g, '').substring(0, 120)}...
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                            {passage.content_type}
                          </span>
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded">
                            {passage.cefr_level}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <FiFileText size={12} />
                            {passage.word_count} từ
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <FiClock size={12} />
                            {passage.estimated_time} phút
                          </span>
                        </div>
                      </div>
                      {selectedPassage?._id === passage._id && (
                        <FiCheckCircle className="text-blue-500 flex-shrink-0 ml-2" size={20} />
                      )}
                    </div>

                    {/* Topics */}
                    {passage.topics && passage.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {passage.topics.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                            {t.name}
                          </span>
                        ))}
                        {passage.topics.length > 3 && (
                          <span className="text-xs text-gray-400">+{passage.topics.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="w-1/2 overflow-y-auto bg-gray-750">
            {selectedPassage ? (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {selectedPassage.title}
                </h2>

                {/* Meta */}
                <div className="flex items-center gap-3 mb-4 text-sm">
                  <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full font-semibold">
                    {CONTENT_TYPES.find(t => t.value === selectedPassage.content_type)?.label || selectedPassage.content_type}
                  </span>
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full font-semibold">
                    {selectedPassage.cefr_level}
                  </span>
                  <span className="text-gray-400">{selectedPassage.word_count} từ</span>
                  <span className="text-gray-400">{selectedPassage.estimated_time} phút</span>
                </div>

                {/* Topics */}
                {selectedPassage.topics && selectedPassage.topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPassage.topics.map((topic, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          {topic.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passage Content */}
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <div 
                    className="text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPassage.passage }}
                  />
                </div>

                {/* Linked Vocabulary */}
                {selectedPassage.linked_vocabulary && selectedPassage.linked_vocabulary.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      📚 Linked Vocabulary ({selectedPassage.linked_vocabulary.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPassage.linked_vocabulary.slice(0, 10).map((vocab, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs">
                          {vocab.word}
                        </span>
                      ))}
                      {selectedPassage.linked_vocabulary.length > 10 && (
                        <span className="text-xs text-gray-400">
                          +{selectedPassage.linked_vocabulary.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {selectedPassage.questions && selectedPassage.questions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      ❓ Questions ({selectedPassage.questions.length})
                    </p>
                    <div className="space-y-2">
                      {selectedPassage.questions.slice(0, 3).map((q, idx) => (
                        <div key={idx} className="p-2 bg-gray-700/30 rounded text-sm text-gray-400">
                          {idx + 1}. {q.question_text}
                        </div>
                      ))}
                      {selectedPassage.questions.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{selectedPassage.questions.length - 3} more questions
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiBook className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Chọn bài đọc để xem preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedPassage && (
              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" />
                Đã chọn: <strong className="text-white">{selectedPassage.title}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedPassage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheckCircle />
              Chọn bài này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadingPickerModal;
