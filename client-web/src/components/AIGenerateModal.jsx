import React, { useState } from 'react';
import { FiX, FiZap, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 - Cơ bản', desc: 'Câu đơn giản, rất ngắn' },
  { value: 'A2', label: 'A2 - Sơ cấp', desc: 'Câu đơn giản, chủ đề thông dụng' },
  { value: 'B1', label: 'B1 - Trung cấp', desc: 'Văn bản chuẩn, rõ ràng' },
  { value: 'B2', label: 'B2 - Trung cấp cao', desc: 'Văn bản phức tạp, chủ đề trừu tượng' },
  { value: 'C1', label: 'C1 - Nâng cao', desc: 'Văn bản dài, yêu cầu cao' },
  { value: 'C2', label: 'C2 - Thành thạo', desc: 'Văn bản học thuật rất phức tạp' }
];

const CONTENT_TYPES = [
  { value: 'email', label: '📧 Email' },
  { value: 'letter', label: '✉️ Thư tín' },
  { value: 'news', label: '📰 Tin tức' },
  { value: 'story', label: '📖 Truyện kể' },
  { value: 'article', label: '📝 Bài viết' },
  { value: 'blog', label: '✍️ Blog' },
  { value: 'announcement', label: '📢 Thông báo' },
  { value: 'report', label: '📊 Báo cáo' }
];

const TONES = [
  { value: 'neutral', label: 'Trung tính' },
  { value: 'formal', label: 'Trang trọng' },
  { value: 'informal', label: 'Thân mật' },
  { value: 'polite', label: 'Lịch sự' },
  { value: 'friendly', label: 'Thân thiện' }
];

function AIGenerateModal({ onClose, onGenerate, generating = false }) {
  const [options, setOptions] = useState({
    topic: '',
    cefr_level: 'B1',
    wordCount: 150,
    tone: 'neutral',
    topicHints: '',
    core_vocab: [],
    maxRetries: 3
  });

  const [vocabInput, setVocabInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!options.topic.trim()) {
      alert('Vui lòng nhập chủ đề');
      return;
    }
    onGenerate(options);
  };

  const addVocab = () => {
    if (vocabInput.trim()) {
      const words = vocabInput.split(',').map(w => w.trim()).filter(Boolean);
      setOptions({ ...options, core_vocab: [...options.core_vocab, ...words] });
      setVocabInput('');
    }
  };

  const removeVocab = (index) => {
    const newVocab = options.core_vocab.filter((_, i) => i !== index);
    setOptions({ ...options, core_vocab: newVocab });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-blue-900 p-6 flex justify-between items-center border-b border-purple-500/30">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FiZap className="text-yellow-400" />
              Hệ Thống AI Tạo Nội Dung
            </h2>
            <p className="text-purple-200 text-sm mt-1">
              Đa tác tử: Kiến trúc sư → Tác giả → Phê bình → Tự sửa lỗi
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={generating}
            className="text-gray-300 hover:text-white disabled:opacity-50"
          >
            <FiX size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Chủ đề * <span className="text-xs font-normal text-gray-400">(Bài đọc về chủ đề gì?)</span>
            </label>
            <input
              type="text"
              value={options.topic}
              onChange={(e) => setOptions({ ...options, topic: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              placeholder="VD: Biến đổi khí hậu, Công nghệ giáo dục, Du lịch mạo hiểm..."
              disabled={generating}
              required
            />
          </div>

          {/* CEFR Level & Word Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Trình độ CEFR *
              </label>
              <select
                value={options.cefr_level}
                onChange={(e) => setOptions({ ...options, cefr_level: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                disabled={generating}
              >
                {CEFR_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {CEFR_LEVELS.find(l => l.value === options.cefr_level)?.desc}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Số từ mục tiêu
              </label>
              <input
                type="number"
                value={options.wordCount}
                onChange={(e) => setOptions({ ...options, wordCount: parseInt(e.target.value) || 150 })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min="50"
                max="500"
                disabled={generating}
              />
              <p className="text-xs text-gray-400 mt-1">Khuyến nghị: 100-200 từ</p>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-2"
            disabled={generating}
          >
            {showAdvanced ? '▼' : '▶'} Tùy chọn nâng cao
          </button>

          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
              {/* Tone */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Giọng điệu</label>
                <select
                  value={options.tone}
                  onChange={(e) => setOptions({ ...options, tone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  disabled={generating}
                >
                  {TONES.map(tone => (
                    <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
              </div>

              {/* Topic Hints */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Gợi ý nội dung (Tùy chọn)
                </label>
                <textarea
                  value={options.topicHints}
                  onChange={(e) => setOptions({ ...options, topicHints: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Bối cảnh bổ sung hoặc các điểm cụ thể cần đề cập..."
                  rows={2}
                  disabled={generating}
                />
              </div>

              {/* Core Vocabulary */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Từ vựng bắt buộc (Tùy chọn)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={vocabInput}
                    onChange={(e) => setVocabInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVocab())}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Nhập từ, phân tách bằng dấu phẩy..."
                    disabled={generating}
                  />
                  <button
                    type="button"
                    onClick={addVocab}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    disabled={generating}
                  >
                    Thêm
                  </button>
                </div>
                {options.core_vocab.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {options.core_vocab.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm flex items-center gap-2">
                        {word}
                        <button
                          type="button"
                          onClick={() => removeVocab(idx)}
                          className="hover:text-red-400"
                          disabled={generating}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Max Retries */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Số lần thử lại tối đa (Vòng lặp tự sửa)
                </label>
                <input
                  type="number"
                  value={options.maxRetries}
                  onChange={(e) => setOptions({ ...options, maxRetries: parseInt(e.target.value) || 3 })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min="1"
                  max="5"
                  disabled={generating}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Số lần Tác giả có thể thử lại nếu Phê bình từ chối (1-5)
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Cách hoạt động:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li><strong>Kiến trúc sư</strong> tạo dàn ý có cấu trúc dựa trên nguyên tắc sư phạm</li>
                  <li><strong>Tác giả</strong> viết bài đọc theo dàn ý và yêu cầu</li>
                  <li><strong>Phê bình</strong> kiểm tra độ dễ đọc, ngữ pháp, đa dạng từ vựng bằng thuật toán</li>
                  <li><strong>Tự sửa lỗi</strong> lặp lại nếu bị từ chối, với gợi ý cải thiện cụ thể</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={generating || !options.topic.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generating ? (
                <>
                  <FiRefreshCw className="animate-spin" size={20} />
                  Đang tạo... (Có thể mất 30-90 giây)
                </>
              ) : (
                <>
                  <FiZap size={20} />
                  Tạo với AI
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIGenerateModal;
