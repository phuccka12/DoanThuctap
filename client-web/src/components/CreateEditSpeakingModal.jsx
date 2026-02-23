import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiMic, FiZap, FiLoader } from 'react-icons/fi';
import speakingQuestionService from '../services/speakingQuestionService';

const INITIAL_FORM = {
  question: '',
  follow_up_questions: [],
  part: 'p1',
  topic_id: '',
  keywords: [],
  sample_answer: { text: '', audio_url: '' },
  time_limit_sec: 60,
  prep_time_sec: 0,
  difficulty: 'medium',
  cefr_level: 'B1',
  ai_persona: { role: 'examiner', feedback_style: 'formal' },
  rubric: {
    fluency:       { weight: 25, description: 'Fluency & Coherence' },
    pronunciation: { weight: 25, description: 'Pronunciation' },
    vocabulary:    { weight: 25, description: 'Lexical Resource' },
    grammar:       { weight: 25, description: 'Grammatical Range' },
  },
  hints: [],
  tags: [],
  is_active: true,
};

const PART_OPTIONS  = ['free', 'p1', 'p2', 'p3'];
const PART_LABELS   = { free: 'Free', p1: 'Part 1', p2: 'Part 2', p3: 'Part 3' };
const DIFF_OPTIONS  = ['easy', 'medium', 'hard'];
const CEFR_OPTIONS  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ROLE_OPTIONS  = ['examiner', 'teacher', 'mentor', 'peer'];
const STYLE_OPTIONS = ['formal', 'casual', 'encouraging', 'strict'];

const TagInput = ({ items, onChange, placeholder, colorClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30' }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !items.includes(v)) { onChange([...items, v]); }
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none"
        />
        <button type="button" onClick={add} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm">
          <FiPlus size={14} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colorClass}`}>
              {item}
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="hover:text-white transition-colors">
                <FiX size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateEditSpeakingModal = ({ question, topics = [], onClose, onSave }) => {
  const isEdit = !!question?._id;
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [generatingSample, setGeneratingSample] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setFormData({
        question:             question.question             || '',
        follow_up_questions:  question.follow_up_questions  || [],
        part:                 question.part                 || 'p1',
        topic_id:             question.topic_id?._id || question.topic_id || '',
        keywords:             question.keywords             || [],
        sample_answer: {
          text:      question.sample_answer?.text      || '',
          audio_url: question.sample_answer?.audio_url || '',
        },
        time_limit_sec: question.time_limit_sec ?? 60,
        prep_time_sec:  question.prep_time_sec  ?? 0,
        difficulty:  question.difficulty  || 'medium',
        cefr_level:  question.cefr_level  || 'B1',
        ai_persona: {
          role:           question.ai_persona?.role           || 'examiner',
          feedback_style: question.ai_persona?.feedback_style || 'formal',
        },
        rubric: question.rubric || INITIAL_FORM.rubric,
        hints:     question.hints     || [],
        tags:      question.tags      || [],
        is_active: question.is_active ?? true,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [question]);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const setNested = (parent, key, val) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: val } }));
  const setRubric = (criterion, key, val) => setFormData(prev => ({
    ...prev,
    rubric: { ...prev.rubric, [criterion]: { ...prev.rubric[criterion], [key]: val } }
  }));

  const handleGenerateSample = async () => {
    if (!formData.question.trim()) {
      setError('Nhập câu hỏi trước rồi mới generate được!');
      return;
    }
    setGeneratingSample(true);
    setError('');
    try {
      const res = await speakingQuestionService.generateSampleAnswer({
        question:            formData.question,
        part:                formData.part,
        cefr_level:          formData.cefr_level,
        difficulty:          formData.difficulty,
        keywords:            formData.keywords,
        follow_up_questions: formData.follow_up_questions,
      });
      const result = res?.data || res;
      if (result?.sample_answer) {
        setNested('sample_answer', 'text', result.sample_answer);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'AI không phản hồi, thử lại sau!');
    } finally {
      setGeneratingSample(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim()) { setError('Câu hỏi không được để trống'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await speakingQuestionService.updateQuestion(question._id, formData);
      } else {
        await speakingQuestionService.createQuestion(formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700/50 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FiMic size={16} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{isEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2>
              <p className="text-xs text-gray-400">IELTS Speaking Question</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-700/40">

            {/* ── COLUMN 1: Question Content ── */}
            <div className="p-5 space-y-4 bg-linear-to-br from-blue-950/30 to-purple-950/20">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">📝 Nội dung câu hỏi</h3>

              {/* Question text */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Câu hỏi chính <span className="text-red-400">*</span></label>
                <textarea
                  value={formData.question}
                  onChange={e => set('question', e.target.value)}
                  rows={3}
                  placeholder="Nhập câu hỏi speaking..."
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  required
                />
              </div>

              {/* Follow-up questions */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Câu hỏi follow-up</label>
                <TagInput
                  items={formData.follow_up_questions}
                  onChange={val => set('follow_up_questions', val)}
                  placeholder="Thêm câu hỏi phụ rồi Enter..."
                  colorClass="bg-blue-500/20 text-blue-300 border-blue-500/30"
                />
              </div>

              {/* Part selector */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Part</label>
                <div className="flex gap-2 flex-wrap">
                  {PART_OPTIONS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set('part', p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.part === p
                          ? 'bg-purple-500/30 border-purple-500/60 text-purple-300'
                          : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {PART_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Topic</label>
                <select
                  value={formData.topic_id}
                  onChange={e => set('topic_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">— Không chọn —</option>
                  {topics.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Keywords gợi ý</label>
                <TagInput
                  items={formData.keywords}
                  onChange={val => set('keywords', val)}
                  placeholder="Thêm keyword rồi Enter..."
                  colorClass="bg-gray-700/50 text-gray-300 border-gray-600/50"
                />
              </div>

              {/* Sample answer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-300">Câu trả lời mẫu</label>
                  <button
                    type="button"
                    onClick={handleGenerateSample}
                    disabled={generatingSample}
                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium bg-linear-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg border border-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingSample
                      ? <><FiLoader size={11} className="animate-spin" /> Đang generate...</>
                      : <><FiZap size={11} /> AI Generate</>
                    }
                  </button>
                </div>
                <textarea
                  value={formData.sample_answer.text}
                  onChange={e => setNested('sample_answer', 'text', e.target.value)}
                  rows={5}
                  placeholder={generatingSample ? '⏳ AI đang viết câu trả lời mẫu...' : 'Nhập câu trả lời mẫu hoặc nhấn AI Generate...'}
                  className={`w-full px-3 py-2 text-sm bg-gray-800/50 border text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-colors ${
                    generatingSample ? 'border-purple-500/50 animate-pulse' : 'border-gray-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Audio URL mẫu (tùy chọn)</label>
                <input
                  type="text"
                  value={formData.sample_answer.audio_url}
                  onChange={e => setNested('sample_answer', 'audio_url', e.target.value)}
                  placeholder="Dán link audio hoặc để trống..."
                  className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* ── COLUMN 2: Settings ── */}
            <div className="p-5 space-y-4 bg-linear-to-br from-purple-950/20 to-pink-950/20">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">⚙️ Cài đặt & Tiêu chí</h3>

              {/* Time limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Thời gian TL (giây)</label>
                  <input
                    type="number" min={10} max={600}
                    value={formData.time_limit_sec}
                    onChange={e => set('time_limit_sec', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Thời gian chuẩn bị (s)</label>
                  <input
                    type="number" min={0} max={120}
                    value={formData.prep_time_sec}
                    onChange={e => set('prep_time_sec', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Độ khó</label>
                <div className="flex gap-2">
                  {DIFF_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set('difficulty', d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                        formData.difficulty === d
                          ? d === 'easy' ? 'bg-green-500/30 border-green-500/60 text-green-300'
                            : d === 'medium' ? 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300'
                            : 'bg-red-500/30 border-red-500/60 text-red-300'
                          : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* CEFR */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">CEFR Level</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CEFR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('cefr_level', c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                        formData.cefr_level === c
                          ? 'bg-purple-500/30 border-purple-500/60 text-purple-300'
                          : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Persona */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-pink-400">🤖 AI Persona</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1">Vai trò</label>
                    <select
                      value={formData.ai_persona.role}
                      onChange={e => setNested('ai_persona', 'role', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-pink-500 outline-none capitalize"
                    >
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1">Phong cách feedback</label>
                    <select
                      value={formData.ai_persona.feedback_style}
                      onChange={e => setNested('ai_persona', 'feedback_style', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-pink-500 outline-none capitalize"
                    >
                      {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rubric weights */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-400 mb-3">📊 Rubric (trọng số %)</p>
                <div className="space-y-2">
                  {Object.entries(formData.rubric).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400 w-28 capitalize">{val.description}</span>
                      <input
                        type="number" min={0} max={100}
                        value={val.weight}
                        onChange={e => setRubric(key, 'weight', Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs bg-gray-800/50 border border-gray-600 text-white rounded-lg text-center focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-[10px] text-gray-500">%</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-gray-500 mt-1">
                    Tổng: {Object.values(formData.rubric).reduce((s, v) => s + (Number(v.weight) || 0), 0)}%
                    {Object.values(formData.rubric).reduce((s, v) => s + (Number(v.weight) || 0), 0) !== 100 && (
                      <span className="text-yellow-400 ml-1">(nên bằng 100%)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hints */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Gợi ý (hints)</label>
                <TagInput
                  items={formData.hints}
                  onChange={val => set('hints', val)}
                  placeholder="Thêm gợi ý rồi Enter..."
                  colorClass="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Tags</label>
                <TagInput
                  items={formData.tags}
                  onChange={val => set('tags', val)}
                  placeholder="Thêm tag rồi Enter..."
                  colorClass="bg-gray-700/50 text-gray-300 border-gray-600/50"
                />
              </div>
        {/* Is Active */}
<div className="flex items-center gap-3 pt-1">
  <button
    type="button"
    onClick={() => set('is_active', !formData.is_active)}
    className={`relative flex items-center w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none border-0 ${
      formData.is_active ? 'bg-green-500' : 'bg-gray-600'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ease-in-out duration-200 ${
        formData.is_active ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
  <span className="text-sm text-gray-300">
    {formData.is_active ? 'Active — hiển thị cho học viên' : 'Inactive — ẩn'}
  </span>
</div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between gap-4 bg-gray-900/50 shrink-0">
            {error && (
              <p className="text-red-400 text-sm flex-1">{error}</p>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium disabled:opacity-50"
              >
                <FiSave size={14} />
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo câu hỏi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditSpeakingModal;
