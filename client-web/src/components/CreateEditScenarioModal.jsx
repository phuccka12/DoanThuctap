import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiImage, FiPlus, FiTrash2, FiEye } from 'react-icons/fi';
import writingScenarioService from '../services/writingScenarioService';
import topicService from '../services/topicService';

const CreateEditScenarioModal = ({ scenario, onClose, onSave }) => {
  const isEdit = !!scenario?._id;
  
  // Topics
  const [allTopics, setAllTopics] = useState([]);
  
  // Form state - 3 COLUMNS
  const [formData, setFormData] = useState({
    // COLUMN 1: CONTEXT (Bối cảnh)
    title: '',
    scenario_type: 'messenger',
    context_image_url: '',
    context_description: '',
    situation_prompt: '',
    
    // COLUMN 2: GAME RULES (Luật chơi)
    forbidden_words: [],
    required_keywords: [],
    target_tone: 'neutral',
    tone_intensity: 5,
    word_limit: { min: 50, max: 150 },
    time_limit: null,
    
    // COLUMN 3: AI PERSONA (Nhân vật AI)
    ai_persona: {
      role: 'best_friend',
      personality: '',
      feedback_style: 'casual',
      response_template: 'Chấm: {{score}}/10\n\n{{feedback}}\n\n{{encouragement}}'
    },
    
    // Metadata
    level: 'intermediate',
    cefr_level: 'B1',
    topics: [],
    estimated_time: 10,
    difficulty_score: 5,
    is_active: true,
    
    // Rubric (optional customization)
    rubric: {
      tone_match: { weight: 30, description: 'Độ chuẩn xác về tone' },
      vocabulary: { weight: 25, description: 'Sử dụng từ vựng' },
      creativity: { weight: 25, description: 'Sáng tạo trong nội dung' },
      grammar: { weight: 20, description: 'Ngữ pháp và chính tả' }
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [tempWord, setTempWord] = useState('');
  const [tempKeyword, setTempKeyword] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load data
  useEffect(() => {
    fetchTopics();
    if (scenario) {
      setFormData({
        ...formData,
        ...scenario,
        topics: scenario.topics?.map(t => t._id || t) || []
      });
    }
  }, [scenario]);

  const fetchTopics = async () => {
    try {
      const result = await topicService.getAllTopics();
      setAllTopics(result.data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  // Add forbidden word
  const addForbiddenWord = () => {
    if (tempWord.trim() && !formData.forbidden_words.includes(tempWord.trim())) {
      setFormData({
        ...formData,
        forbidden_words: [...formData.forbidden_words, tempWord.trim()]
      });
      setTempWord('');
    }
  };

  // Remove forbidden word
  const removeForbiddenWord = (word) => {
    setFormData({
      ...formData,
      forbidden_words: formData.forbidden_words.filter(w => w !== word)
    });
  };

  // Add required keyword
  const addRequiredKeyword = () => {
    if (tempKeyword.trim() && !formData.required_keywords.includes(tempKeyword.trim())) {
      setFormData({
        ...formData,
        required_keywords: [...formData.required_keywords, tempKeyword.trim()]
      });
      setTempKeyword('');
    }
  };

  // Remove required keyword
  const removeRequiredKeyword = (keyword) => {
    setFormData({
      ...formData,
      required_keywords: formData.required_keywords.filter(k => k !== keyword)
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isEdit) {
        await writingScenarioService.updateScenario(scenario._id, formData);
        alert('Cập nhật scenario thành công!');
      } else {
        await writingScenarioService.createScenario(formData);
        alert('Tạo scenario thành công!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const scenarioTypeOptions = [
    { value: 'messenger', label: '💬 Messenger', icon: '💬' },
    { value: 'email', label: '📧 Email', icon: '📧' },
    { value: 'comment', label: '💭 Comment', icon: '💭' },
    { value: 'diary', label: '📔 Nhật ký', icon: '📔' },
    { value: 'letter', label: '✉️ Thư tay', icon: '✉️' },
    { value: 'social_post', label: '📱 Social Post', icon: '📱' },
    { value: 'review', label: '⭐ Review', icon: '⭐' }
  ];

  const toneOptions = [
    { value: 'neutral', label: 'Trung tính' },
    { value: 'formal', label: 'Trang trọng' },
    { value: 'casual', label: 'Thân mật' },
    { value: 'friendly', label: 'Thân thiện' },
    { value: 'professional', label: 'Chuyên nghiệp' },
    { value: 'humorous', label: 'Hài hước' },
    { value: 'sarcastic', label: 'Châm biếm' },
    { value: 'empathetic', label: 'Đồng cảm' },
    { value: 'persuasive', label: 'Thuyết phục' }
  ];

  const personaRoles = [
    { value: 'best_friend', label: '👥 Best Friend' },
    { value: 'teacher', label: '👨‍🏫 Teacher' },
    { value: 'boss', label: '👔 Boss' },
    { value: 'parent', label: '👪 Parent' },
    { value: 'mentor', label: '🧙 Mentor' },
    { value: 'critic', label: '🎭 Critic' },
    { value: 'stranger', label: '🤷 Stranger' }
  ];

  const feedbackStyles = [
    { value: 'formal', label: 'Trang trọng' },
    { value: 'casual', label: 'Thoải mái' },
    { value: 'humorous', label: 'Hài hước' },
    { value: 'strict', label: 'Nghiêm khắc' },
    { value: 'encouraging', label: 'Động viên' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">
            {isEdit ? '✏️ Chỉnh sửa Scenario' : '🎮 Tạo Scenario mới'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4">
          {/* 3 COLUMNS LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* ========================================
                COLUMN 1: CONTEXT (Bối cảnh)
                ======================================== */}
            <div className="bg-linear-to-br from-blue-900/30 to-cyan-900/20 rounded-xl p-4 border-2 border-blue-500/30">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                <span className="text-xl">🎬</span> CONTEXT
              </h3>

              {/* Title */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tiêu đề Scenario *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  placeholder="VD: Nhắn tin xin lỗi bạn thân"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Scenario Type */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Loại UI *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {scenarioTypeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, scenario_type: option.value })}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        formData.scenario_type === option.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-gray-300 border border-gray-600 hover:bg-gray-700/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context Image */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Link ảnh bối cảnh
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    value={formData.context_image_url}
                    onChange={(e) => setFormData({ ...formData, context_image_url: e.target.value })}
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30"
                  >
                    <FiImage />
                  </button>
                </div>
                {formData.context_image_url && (
                  <img
                    src={formData.context_image_url}
                    alt="Preview"
                    className="mt-2 w-full h-24 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Context Description */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Mô tả bối cảnh *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Bạn vừa nói điều gì đó làm tổn thương best friend của mình..."
                  value={formData.context_description}
                  onChange={(e) => setFormData({ ...formData, context_description: e.target.value })}
                />
              </div>

              {/* Situation Prompt */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nhiệm vụ *
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Viết tin nhắn xin lỗi, thể hiện sự hối hận nhưng không quá sến..."
                  value={formData.situation_prompt}
                  onChange={(e) => setFormData({ ...formData, situation_prompt: e.target.value })}
                />
              </div>
            </div>

            {/* ========================================
                COLUMN 2: GAME RULES (Luật chơi)
                ======================================== */}
            <div className="bg-linear-to-br from-orange-900/30 to-red-900/20 rounded-xl p-4 border-2 border-orange-500/30">
              <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
                <span className="text-xl">🎯</span> GAME RULES
              </h3>

              {/* Forbidden Words */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  🚫 Từ cấm
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-2 py-1.5 bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 text-xs"
                    placeholder="Nhập từ cấm..."
                    value={tempWord}
                    onChange={(e) => setTempWord(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addForbiddenWord())}
                  />
                  <button
                    type="button"
                    onClick={addForbiddenWord}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    <FiPlus />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.forbidden_words.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs flex items-center gap-1"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => removeForbiddenWord(word)}
                        className="hover:text-red-300"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Keywords */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ✅ Từ bắt buộc
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-2 py-1.5 bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 text-xs"
                    placeholder="Nhập từ bắt buộc..."
                    value={tempKeyword}
                    onChange={(e) => setTempKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredKeyword())}
                  />
                  <button
                    type="button"
                    onClick={addRequiredKeyword}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    <FiPlus />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.required_keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs flex items-center gap-1"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeRequiredKeyword(keyword)}
                        className="hover:text-green-300"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Tone */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  🎭 Tone mục tiêu
                </label>
                <select
                  className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={formData.target_tone}
                  onChange={(e) => setFormData({ ...formData, target_tone: e.target.value })}
                >
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Tone Intensity */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  🔥 Độ mạnh tone: {formData.tone_intensity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  className="w-full h-1.5"
                  value={formData.tone_intensity}
                  onChange={(e) => setFormData({ ...formData, tone_intensity: parseInt(e.target.value) })}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Nhẹ</span>
                  <span>TB</span>
                  <span>Mạnh</span>
                </div>
              </div>

              {/* Word Limit */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  📏 Giới hạn từ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">Min</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                      value={formData.word_limit.min}
                      onChange={(e) => setFormData({
                        ...formData,
                        word_limit: { ...formData.word_limit, min: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Max</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                      value={formData.word_limit.max}
                      onChange={(e) => setFormData({
                        ...formData,
                        word_limit: { ...formData.word_limit, max: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Time Limit */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ⏱️ Giới hạn TG (phút)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Để trống = không giới hạn"
                  value={formData.time_limit || ''}
                  onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>

            {/* ========================================
                COLUMN 3: AI PERSONA (Nhân vật AI)
                ======================================== */}
            <div className="bg-linear-to-br from-purple-900/30 to-pink-900/20 rounded-xl p-4 border-2 border-purple-500/30">
              <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span> AI PERSONA
              </h3>

              {/* Persona Role */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Vai trò AI
                </label>
                <select
                  className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.ai_persona.role}
                  onChange={(e) => setFormData({
                    ...formData,
                    ai_persona: { ...formData.ai_persona, role: e.target.value }
                  })}
                >
                  {personaRoles.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Personality */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tính cách AI *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Thẳng tính, hay chửi thề, nhưng thật lòng quan tâm bạn..."
                  value={formData.ai_persona.personality}
                  onChange={(e) => setFormData({
                    ...formData,
                    ai_persona: { ...formData.ai_persona, personality: e.target.value }
                  })}
                />
              </div>

              {/* Feedback Style */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Phong cách feedback
                </label>
                <select
                  className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.ai_persona.feedback_style}
                  onChange={(e) => setFormData({
                    ...formData,
                    ai_persona: { ...formData.ai_persona, feedback_style: e.target.value }
                  })}
                >
                  {feedbackStyles.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Response Template */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Template phản hồi
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="Dùng {{score}}, {{feedback}}, {{encouragement}}"
                  value={formData.ai_persona.response_template}
                  onChange={(e) => setFormData({
                    ...formData,
                    ai_persona: { ...formData.ai_persona, response_template: e.target.value }
                  })}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Variables: {`{{score}}`}, {`{{feedback}}`}, {`{{encouragement}}`}, {`{{violations}}`}
                </p>
              </div>
            </div>
          </div>

          {/* METADATA ROW */}
          <div className="bg-gray-800/30 rounded-xl p-4 mb-4 border border-gray-700/50">
            <h3 className="text-base font-bold text-gray-300 mb-3">⚙️ Metadata & Settings</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Level */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Level</label>
                <select
                  className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="beginner">Mới bắt đầu</option>
                  <option value="elementary">Cơ bản</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="upper_intermediate">Khá</option>
                  <option value="advanced">Nâng cao</option>
                  <option value="proficiency">Thành thạo</option>
                </select>
              </div>

              {/* CEFR Level */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">CEFR</label>
                <select
                  className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.cefr_level}
                  onChange={(e) => setFormData({ ...formData, cefr_level: e.target.value })}
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  TG ước tính (phút)
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Difficulty Score */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Độ khó (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.difficulty_score}
                  onChange={(e) => setFormData({ ...formData, difficulty_score: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            {/* Topics */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Topics liên quan</label>
              <select
                multiple
                className="w-full px-2 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                value={formData.topics}
                onChange={(e) => setFormData({
                  ...formData,
                  topics: Array.from(e.target.selectedOptions, option => option.value)
                })}
                size={3}
              >
                {allTopics.map(topic => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name} ({topic.level})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-0.5">Giữ Ctrl/Cmd để chọn nhiều</p>
            </div>

            {/* Active Status */}
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="text-xs font-medium text-gray-300">Kích hoạt scenario (hiển thị cho học viên)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 shrink-0 pt-2 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FiSave /> {isEdit ? 'Cập nhật' : 'Tạo mới'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditScenarioModal;
