import React, { useState, useEffect, useCallback } from 'react';
import {
  FiHeadphones, FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiRefreshCw, FiToggleLeft, FiToggleRight, FiX, FiCheck,
  FiMusic, FiList, FiBarChart2, FiChevronLeft, FiChevronRight,
  FiVolume2, FiSave, FiAlertCircle, FiCopy, FiEye,
  FiDownload, FiCheckSquare, FiSquare, FiMinus,
  FiClock, FiFileText, FiTag, FiChevronDown, FiChevronUp,
  FiActivity,
} from 'react-icons/fi';
import * as adminService from '../../services/adminService';
import FileUploader from '../../components/FileUploader';

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVELS = [
  { value: 'beginner',     label: 'Sơ cấp',   color: 'emerald' },
  { value: 'intermediate', label: 'Trung cấp', color: 'amber'   },
  { value: 'advanced',     label: 'Nâng cao',  color: 'rose'    },
];

const SECTIONS = [
  { value: 'section1', label: 'Section 1' },
  { value: 'section2', label: 'Section 2' },
  { value: 'section3', label: 'Section 3' },
  { value: 'section4', label: 'Section 4' },
  { value: 'general',  label: 'Tổng hợp'  },
];

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'fill_blank',      label: 'Điền vào chỗ trống' },
  { value: 'matching',        label: 'Nối đáp án' },
];

const LEVEL_COLORS = {
  beginner:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  intermediate: 'bg-amber-500/20  text-amber-300  border-amber-500/30',
  advanced:     'bg-rose-500/20   text-rose-300   border-rose-500/30',
};

const emptyQuestion = () => ({
  _tempId: Date.now() + Math.random(),
  order: 1, type: 'multiple_choice',
  question: '', options: ['', '', '', ''], answer: '',
});

const emptyForm = () => ({
  title: '', audio_url: '', duration_sec: '', transcript: '',
  level: 'intermediate', section: 'general',
  topics: [], is_active: true, questions: [],
});

const fmtDuration = (sec) => {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function Badge({ level }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${LEVEL_COLORS[level] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {LEVELS.find(l => l.value === level)?.label || level}
    </span>
  );
}

function SectionBadge({ section }) {
  const s = SECTIONS.find(s => s.value === section);
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
      {s?.label || section}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:border-gray-600 transition-colors' : ''}`}
    >
      <div className={`p-3 rounded-xl ${color} shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white text-2xl font-bold leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Level/Section breakdown bar ─────────────────────────────────────────────
function BreakdownBar({ label, items, total }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
      <p className="text-gray-400 text-xs font-medium mb-3">{label}</p>
      <div className="space-y-2.5">
        {items.map(({ key, name, value, color }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{name}</span>
                <span className="text-gray-400">{value} <span className="text-gray-600">({pct}%)</span></span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Question Builder ─────────────────────────────────────────────────────────
function QuestionBuilder({ questions, onChange }) {
  const add = () => onChange([...questions, { ...emptyQuestion(), order: questions.length + 1 }]);
  const remove = (idx) => onChange(questions.filter((_, i) => i !== idx));
  const update = (idx, field, val) =>
    onChange(questions.map((q, i) => (i === idx ? { ...q, [field]: val } : q)));
  const updateOption = (qIdx, oIdx, val) =>
    onChange(questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options]; opts[oIdx] = val; return { ...q, options: opts };
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Câu hỏi ({questions.length})</h4>
        <button type="button" onClick={add}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs rounded-lg transition-all">
          <FiPlus size={13} /> Thêm câu hỏi
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-6 border border-dashed border-gray-700 rounded-xl">
          Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
        </p>
      )}

      {questions.map((q, qi) => (
        <div key={q._tempId ?? qi} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-400 text-xs font-bold bg-gray-700 px-2 py-0.5 rounded-md shrink-0">Q{qi + 1}</span>
            <select value={q.type} onChange={(e) => update(qi, 'type', e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-purple-500">
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button type="button" onClick={() => remove(qi)} className="text-red-400 hover:text-red-300 p-1">
              <FiTrash2 size={14} />
            </button>
          </div>

          <input type="text" value={q.question} onChange={(e) => update(qi, 'question', e.target.value)}
            placeholder="Nội dung câu hỏi..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500" />

          {q.type === 'multiple_choice' && (
            <div className="grid grid-cols-2 gap-2">
              {(q.options || ['', '', '', '']).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs w-5 shrink-0">{String.fromCharCode(65 + oi)}.</span>
                  <input type="text" value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-purple-500" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs shrink-0">✅ Đáp án:</span>
            <input type="text" value={q.answer} onChange={(e) => update(qi, 'answer', e.target.value)}
              placeholder={q.type === 'multiple_choice' ? 'VD: A' : 'Đáp án đúng'}
              className="flex-1 bg-gray-800 border border-green-600/40 rounded-lg px-2 py-1.5 text-green-300 text-xs focus:outline-none focus:border-green-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Topic Dropdown Multi-select ──────────────────────────────────────────────
function TopicDropdown({ allTopics, selected, onToggle, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedTopics = allTopics.filter(t => selected.includes(t._id));

  return (
    <div ref={ref} className="relative">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
        <FiTag size={14} className="text-purple-400" /> Chủ đề (Topics)
        {selected.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded-full">
            {selected.length} đã chọn
          </span>
        )}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 border rounded-xl text-sm transition-colors
          ${open ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-gray-600 hover:border-gray-500'}`}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selectedTopics.length === 0 ? (
            <span className="text-gray-500">Chọn chủ đề…</span>
          ) : (
            selectedTopics.map(t => (
              <span key={t._id}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-600/25 border border-purple-500/40 text-purple-300 rounded-full text-xs">
                {t.name}
                <span
                  role="button"
                  tabIndex={-1}
                  onMouseDown={(e) => { e.stopPropagation(); onToggle(t._id); }}
                  className="ml-0.5 hover:text-white cursor-pointer leading-none">×</span>
              </span>
            ))
          )}
        </div>
        <FiChevronDown size={16} className={`text-gray-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
          {allTopics.length === 0 ? (
            <p className="text-gray-500 text-xs italic p-3">
              Chưa có topic nào. Tạo tại <span className="text-purple-400">/admin/topics</span>
            </p>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {allTopics.map(t => {
                const checked = selected.includes(t._id);
                return (
                  <li key={t._id}>
                    <button
                      type="button"
                      onClick={() => onToggle(t._id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors
                        ${checked ? 'bg-purple-600/15 text-purple-300' : 'text-gray-300 hover:bg-gray-700/60'}`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                        ${checked ? 'bg-purple-600 border-purple-500' : 'border-gray-500 bg-transparent'}`}>
                        {checked && <FiCheck size={10} className="text-white" />}
                      </span>
                      {t.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {selected.length > 0 && (
            <div className="border-t border-gray-700 px-3 py-2">
              <button type="button" onClick={() => { onClear(); setOpen(false); }}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                ✕ Xoá tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function ListeningModal({ passage, onClose, onSaved }) {
  const isEdit = !!passage?._id;
  const [form, setForm] = useState(() => {
    if (!passage) return emptyForm();
    return {
      title: passage.title || '',
      audio_url: passage.audio_url || '',
      duration_sec: passage.duration_sec ?? '',
      transcript: passage.transcript || '',
      level: passage.level || 'intermediate',
      section: passage.section || 'general',
      topics: (passage.topics || []).map(t => (typeof t === 'object' ? t._id : t)),
      is_active: passage.is_active ?? true,
      questions: (passage.questions || []).map((q) => ({
        ...q, _tempId: q._id || Date.now() + Math.random(),
        options: q.options || ['', '', '', ''],
      })),
    };
  });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [allTopics, setAllTopics] = useState([]);

  useEffect(() => {
    adminService.getAllTopicsForDropdown()
      .then(r => {
        const arr = r.data?.data?.topics || r.data?.data || r.data || [];
        setAllTopics(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setAllTopics([]));
  }, []);

  const toggleTopic = (id) => {
    setForm(f => {
      const topics = f.topics.includes(id)
        ? f.topics.filter(t => t !== id)
        : [...f.topics, id];
      return { ...f, topics };
    });
  };

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())     return setError('Vui lòng nhập tiêu đề.');
    if (!form.audio_url.trim()) return setError('Vui lòng tải lên file audio.');
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_sec: form.duration_sec === '' ? undefined : Number(form.duration_sec),
        questions: form.questions.map(({ _tempId, ...q }) => q),
      };
      if (isEdit) await adminService.updateListeningPassage(passage._id, payload);
      else        await adminService.createListeningPassage(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic',      label: 'Thông tin cơ bản' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'questions',  label: `Câu hỏi (${form.questions.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl my-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 rounded-xl">
              <FiHeadphones size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Chỉnh sửa bài nghe' : 'Thêm bài nghe mới'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          {/* ─ TAB: Basic ─ */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tiêu đề *</label>
                <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                  placeholder="VD: Hội thoại tại sân bay"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">File Audio *</label>
                {form.audio_url ? (
                  <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                    <FiMusic size={18} className="text-purple-400 shrink-0" />
                    <span className="text-gray-300 text-sm flex-1 truncate">{form.audio_url}</span>
                    <audio controls src={form.audio_url} className="h-8 w-40 shrink-0" />
                    <button type="button" onClick={() => set('audio_url', '')} className="text-red-400 hover:text-red-300 shrink-0">
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <FileUploader accept="audio/*" folder="listening-audio" maxSize={100}
                    placeholder="Tải lên file audio (MP3, WAV, OGG – tối đa 100 MB)"
                    onUploadSuccess={(data) => set('audio_url', data.secure_url || data.url)}
                    onUploadError={(err) => setError('Tải lên thất bại: ' + err)} />
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Cấp độ</label>
                  <select value={form.level} onChange={(e) => set('level', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500">
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Phần</label>
                  <select value={form.section} onChange={(e) => set('section', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500">
                    {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Thời lượng (giây)</label>
                  <input type="number" value={form.duration_sec} onChange={(e) => set('duration_sec', e.target.value)}
                    placeholder="VD: 180" min={0}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500" />
                </div>
              </div>

              {/* Topics dropdown multi-select */}
              <TopicDropdown
                allTopics={allTopics}
                selected={form.topics}
                onToggle={toggleTopic}
                onClear={() => setForm(f => ({ ...f, topics: [] }))}
              />

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => set('is_active', !form.is_active)}
                  className={`p-1 rounded-full transition-colors ${form.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {form.is_active ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
                </button>
                <span className="text-sm text-gray-300">
                  {form.is_active ? 'Đang hiển thị (người dùng thấy)' : 'Đang ẩn (người dùng không thấy)'}
                </span>
              </div>
            </div>
          )}

          {/* ─ TAB: Transcript ─ */}
          {activeTab === 'transcript' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Transcript <span className="text-gray-500 font-normal">(hiển thị sau khi nộp bài)</span>
              </label>
              <textarea value={form.transcript} onChange={(e) => set('transcript', e.target.value)}
                rows={14} placeholder="Toàn bộ nội dung transcript của audio…"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-purple-500 resize-y font-mono text-sm leading-relaxed" />
              <p className="text-gray-500 text-xs mt-1.5">{form.transcript.length} ký tự</p>
            </div>
          )}

          {/* ─ TAB: Questions ─ */}
          {activeTab === 'questions' && (
            <QuestionBuilder questions={form.questions} onChange={(qs) => set('questions', qs)} />
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
            <div className="flex gap-2">
              {activeTab !== 'basic' && (
                <button type="button"
                  onClick={() => setActiveTab(activeTab === 'questions' ? 'transcript' : 'basic')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm">
                  ← Trước
                </button>
              )}
              {activeTab !== 'questions' && (
                <button type="button"
                  onClick={() => setActiveTab(activeTab === 'basic' ? 'transcript' : 'questions')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm">
                  Tiếp →
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition-all text-sm font-medium">
                Huỷ
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-xl transition-all text-sm font-medium">
                {saving ? <FiRefreshCw size={15} className="animate-spin" /> : <FiSave size={15} />}
                {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ passage, onClose, onEdit, onDuplicate }) {
  const [expanded, setExpanded] = useState({});
  if (!passage) return null;

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-gray-900 border-l border-gray-700 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-purple-600/20 rounded-lg shrink-0">
              <FiHeadphones size={18} className="text-purple-400" />
            </div>
            <h3 className="text-white font-bold text-base truncate">{passage.title}</h3>
          </div>
          <button onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white ml-2 shrink-0">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge level={passage.level} />
            <SectionBadge section={passage.section} />
            {passage.duration_sec > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 border border-gray-600">
                <FiClock size={10} /> {fmtDuration(passage.duration_sec)}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs border ${
              passage.is_active
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-gray-700 text-gray-400 border-gray-600'
            }`}>
              {passage.is_active ? '● Đang hiện' : '○ Đang ẩn'}
            </span>
          </div>

          {/* Audio Player */}
          {passage.audio_url && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
                <FiMusic size={12} /> Nghe thử
              </p>
              <audio controls src={passage.audio_url} className="w-full h-10" preload="metadata" />
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/40 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Câu hỏi</p>
              <p className="text-white font-bold text-xl">{passage.questions?.length ?? 0}</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Ngày tạo</p>
              <p className="text-white text-sm font-medium">{fmtDate(passage.created_at)}</p>
            </div>
          </div>

          {/* Topics */}
          {passage.topics?.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
                <FiTag size={12} /> Chủ đề
              </p>
              <div className="flex flex-wrap gap-1.5">
                {passage.topics.map((t) => (
                  <span key={t._id || t}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-600">
                    {t.name || t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Questions list */}
          {passage.questions?.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
                <FiList size={12} /> Danh sách câu hỏi
              </p>
              <div className="space-y-2">
                {passage.questions.map((q, i) => (
                  <div key={q._id || i}
                    className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggle(q._id || i)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-bold shrink-0">Q{i + 1}</span>
                        <span className="text-gray-200 text-sm truncate">{q.question}</span>
                      </div>
                      {expanded[q._id || i]
                        ? <FiChevronUp size={14} className="text-gray-500 shrink-0" />
                        : <FiChevronDown size={14} className="text-gray-500 shrink-0" />}
                    </button>
                    {expanded[q._id || i] && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-700/50 pt-2">
                        {q.type === 'multiple_choice' && q.options?.length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className={`text-xs px-2 py-1.5 rounded-lg border ${
                                opt === q.answer || String.fromCharCode(65 + oi) === q.answer
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-gray-700/50 text-gray-400 border-gray-700'
                              }`}>
                                <span className="font-bold mr-1">{String.fromCharCode(65 + oi)}.</span>{opt}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs pt-1">
                          <span className="text-gray-500">Đáp án đúng:</span>
                          <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{q.answer}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          {passage.transcript && (
            <div>
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
                <FiFileText size={12} /> Transcript
              </p>
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">{passage.transcript}</p>
              </div>
            </div>
          )}

          {/* Creator */}
          {passage.created_by && (
            <p className="text-gray-600 text-xs">
              Tạo bởi: {passage.created_by.user_name || passage.created_by.email || '—'}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 flex gap-2">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all">
            <FiEdit2 size={15} /> Chỉnh sửa
          </button>
          <button onClick={onDuplicate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm transition-all"
            title="Nhân đôi bài nghe">
            <FiCopy size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminListening() {
  const [passages, setPassages]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  // Filters
  const [search, setSearch]         = useState('');
  const [levelFilter, setLevel]     = useState('');
  const [sectionFilter, setSection] = useState('');
  const [activeFilter, setActive]   = useState('');

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);

  // Drawer
  const [drawerPassage, setDrawerPassage] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Bulk selection
  const [selected, setSelected]         = useState(new Set());
  const [bulkLoading, setBulkLoading]   = useState(false);

  // Toast
  const [toast, setToast]               = useState(null);

  // Search debounce
  const [searchInput, setSearchInput]   = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const r = await adminService.getListeningStats();
      setStats(r.data?.data || r.data);
    } catch { /* silent */ }
  }, []);

  const fetchPassages = useCallback(async (pg = 1) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = { page: pg, limit: 10 };
      if (search)          params.search    = search;
      if (levelFilter)     params.level     = levelFilter;
      if (sectionFilter)   params.section   = sectionFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const r = await adminService.getListeningPassages(params);
      const d = r.data?.data || r.data;
      setPassages(d?.passages || d?.docs || []);
      setTotalPages(d?.totalPages || 1);
      setTotal(d?.total || 0);
      setPage(pg);
    } catch (err) {
      console.error('Fetch listening passages failed', err);
    } finally {
      setLoading(false);
    }
  }, [search, levelFilter, sectionFilter, activeFilter]);

  useEffect(() => { fetchPassages(1); fetchStats(); }, [search, levelFilter, sectionFilter, activeFilter]);

  // ── Toggle single ──────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      await adminService.toggleListeningActive(id);
      fetchPassages(page);
      fetchStats();
    } catch { /* silent */ }
  };

  // ── Delete single ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteListeningPassage(deleteTarget._id);
      setDeleteTarget(null);
      fetchPassages(page > 1 && passages.length === 1 ? page - 1 : page);
      fetchStats();
    } catch { /* silent */ }
    finally { setDeleting(false); }
  };

  // ── Duplicate ──────────────────────────────────────────────────────────────
  const handleDuplicate = async (id) => {
    try {
      await adminService.duplicateListeningPassage(id);
      showToast('Đã nhân đôi bài nghe thành công!', 'success');
      fetchPassages(1);
      fetchStats();
    } catch {
      showToast('Nhân đôi thất bại', 'error');
    }
  };

  // ── Bulk actions ───────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === passages.length && passages.length > 0) setSelected(new Set());
    else setSelected(new Set(passages.map(p => p._id)));
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await adminService.bulkDeleteListening([...selected]);
      showToast(`Đã xoá ${selected.size} bài nghe`, 'success');
      fetchPassages(1);
      fetchStats();
    } catch {
      showToast('Xoá hàng loạt thất bại', 'error');
    } finally { setBulkLoading(false); }
  };

  const handleBulkToggle = async (is_active) => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await adminService.bulkToggleListening([...selected], is_active);
      showToast(`Đã cập nhật ${selected.size} bài nghe`, 'success');
      fetchPassages(page);
      fetchStats();
    } catch {
      showToast('Cập nhật thất bại', 'error');
    } finally { setBulkLoading(false); }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const r = await adminService.getListeningPassages({ limit: 9999 });
      const all = r.data?.data?.passages || r.data?.data || [];
      const rows = [
        ['ID', 'Tiêu đề', 'Cấp độ', 'Phần', 'Thời lượng (s)', 'Số câu hỏi', 'Trạng thái', 'Ngày tạo'],
        ...all.map(p => [
          p._id, p.title, p.level, p.section,
          p.duration_sec || 0, p.questions?.length || 0,
          p.is_active ? 'Đang hiện' : 'Đang ẩn',
          fmtDate(p.created_at),
        ]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `listening-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất file CSV', 'success');
    } catch {
      showToast('Xuất thất bại', 'error');
    }
  };

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── After save ─────────────────────────────────────────────────────────────
  const handleSaved = () => {
    setShowModal(false);
    setEditing(null);
    fetchPassages(1);
    fetchStats();
  };

  // ── Stats computed for charts ──────────────────────────────────────────────
  const levelItems = LEVELS.map(l => ({
    key: l.value, name: l.label,
    value: stats?.byLevel?.[l.value] ?? 0,
    color: l.color === 'emerald' ? 'bg-emerald-500' : l.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500',
  }));

  const sectionItems = SECTIONS.map(s => ({
    key: s.value, name: s.label,
    value: stats?.bySection?.[s.value] ?? 0,
    color: 'bg-purple-500',
  }));

  const hasFilters = !!(search || levelFilter || sectionFilter || activeFilter);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">

      {/* ── Toast notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-60 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600/20 rounded-xl">
            <FiHeadphones size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Bài nghe</h1>
            <p className="text-gray-400 text-sm">Quản lý audio và câu hỏi IELTS Listening</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm transition-all border border-gray-600">
            <FiDownload size={16} /> Xuất CSV
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-500/20">
            <FiPlus size={18} /> Thêm bài nghe
          </button>
        </div>
      </div>

      {/* ── Stats cards ───────────────────────────────────────────────────── */}
      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FiList}      label="Tổng bài"     value={stats.total}          color="bg-blue-600" />
            <StatCard icon={FiCheck}     label="Đang hiện"    value={stats.active}         color="bg-emerald-600" />
            <StatCard icon={FiActivity}  label="Tổng câu hỏi" value={stats.totalQuestions} color="bg-purple-600"
              sub={`Trung bình ${stats.avgQuestions} câu/bài`} />
            <StatCard icon={FiBarChart2} label="Nâng cao"     value={stats.byLevel?.advanced ?? 0} color="bg-rose-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakdownBar label="Phân bố theo cấp độ" items={levelItems} total={stats.total} />
            <BreakdownBar label="Phân bố theo Section" items={sectionItems} total={stats.total} />
          </div>
        </>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 flex-1 min-w-48">
          <FiSearch size={16} className="text-gray-400 shrink-0" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm tiêu đề…"
            className="bg-transparent text-gray-200 text-sm flex-1 focus:outline-none placeholder:text-gray-500" />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="text-gray-500 hover:text-gray-300 transition-colors">
              <FiX size={14} />
            </button>
          )}
        </div>

        <select value={levelFilter} onChange={(e) => setLevel(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500">
          <option value="">Tất cả cấp độ</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        <select value={sectionFilter} onChange={(e) => setSection(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500">
          <option value="">Tất cả phần</option>
          {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={activeFilter} onChange={(e) => setActive(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hiện</option>
          <option value="false">Đang ẩn</option>
        </select>

        {hasFilters && (
          <button onClick={() => { setSearchInput(''); setLevel(''); setSection(''); setActive(''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-sm transition-all">
            <FiX size={14} /> Xoá lọc
          </button>
        )}

        <button onClick={() => fetchPassages(1)}
          className="p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 transition-all">
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* ── Bulk Action Bar ────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-purple-300 text-sm font-medium">
            Đã chọn <strong className="text-white">{selected.size}</strong> bài nghe
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => handleBulkToggle(true)} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs transition-all disabled:opacity-50">
              <FiToggleRight size={14} /> Hiện tất cả
            </button>
            <button onClick={() => handleBulkToggle(false)} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-xs transition-all disabled:opacity-50">
              <FiToggleLeft size={14} /> Ẩn tất cả
            </button>
            <button onClick={handleBulkDelete} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs transition-all disabled:opacity-50">
              {bulkLoading ? <FiRefreshCw size={14} className="animate-spin" /> : <FiTrash2 size={14} />}
              Xoá đã chọn
            </button>
            <button onClick={() => setSelected(new Set())}
              className="p-2 text-gray-500 hover:text-gray-300 rounded-lg transition-all">
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-400">
            Tìm thấy <strong className="text-white">{total}</strong> bài nghe
          </span>
          {passages.length > 0 && (
            <button onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
              {selected.size === passages.length && passages.length > 0
                ? <><FiCheckSquare size={14} className="text-purple-400" /> Bỏ chọn tất cả</>
                : <><FiSquare size={14} /> Chọn tất cả trang</>}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <FiRefreshCw size={20} className="animate-spin" /> Đang tải…
          </div>
        ) : passages.length === 0 ? (
          <div className="text-center py-20">
            <FiHeadphones size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              {hasFilters ? 'Không tìm thấy bài nghe phù hợp.' : 'Chưa có bài nghe nào.'}
            </p>
            {!hasFilters && (
              <button onClick={() => { setEditing(null); setShowModal(true); }}
                className="mt-4 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl text-sm transition-all">
                Tạo bài nghe đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b border-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll}>
                      {selected.size === passages.length && passages.length > 0
                        ? <FiCheckSquare size={16} className="text-purple-400" />
                        : selected.size > 0
                          ? <FiMinus size={16} className="text-purple-400" />
                          : <FiSquare size={16} />}
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left">Tiêu đề</th>
                  <th className="px-4 py-3 text-left">Cấp độ</th>
                  <th className="px-4 py-3 text-left">Phần</th>
                  <th className="px-4 py-3 text-center">Câu hỏi</th>
                  <th className="px-4 py-3 text-center">Nghe thử</th>
                  <th className="px-4 py-3 text-center">Ngày tạo</th>
                  <th className="px-4 py-3 text-center">Hiển thị</th>
                  <th className="px-4 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {passages.map((p) => (
                  <tr key={p._id}
                    className={`hover:bg-gray-700/20 transition-colors ${selected.has(p._id) ? 'bg-purple-600/5' : ''}`}>

                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelect(p._id)}>
                        {selected.has(p._id)
                          ? <FiCheckSquare size={16} className="text-purple-400" />
                          : <FiSquare size={16} className="text-gray-600 hover:text-gray-400" />}
                      </button>
                    </td>

                    {/* Title — click to open drawer */}
                    <td className="px-5 py-4">
                      <button onClick={() => setDrawerPassage(p)}
                        className="flex items-center gap-3 text-left group w-full">
                        <div className="p-2 bg-purple-600/10 rounded-lg shrink-0 group-hover:bg-purple-600/20 transition-colors">
                          <FiVolume2 size={16} className="text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-purple-300 transition-colors">
                            {p.title}
                          </p>
                          <p className="text-gray-500 text-xs flex items-center gap-1">
                            {fmtDuration(p.duration_sec)
                              ? <><FiClock size={9} />{fmtDuration(p.duration_sec)}</>
                              : 'Chưa có thời lượng'}
                          </p>
                        </div>
                      </button>
                    </td>

                    {/* Level */}
                    <td className="px-4 py-4"><Badge level={p.level} /></td>

                    {/* Section */}
                    <td className="px-4 py-4"><SectionBadge section={p.section} /></td>

                    {/* Question count */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        (p.questions?.length ?? 0) > 0
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-700 text-gray-500'
                      }`}>
                        {p.questions?.length ?? 0}
                      </span>
                    </td>

                    {/* Audio preview */}
                    <td className="px-4 py-4 text-center">
                      {p.audio_url
                        ? <audio controls src={p.audio_url} className="h-7 w-36 mx-auto" preload="none" />
                        : <span className="text-gray-600 text-xs">—</span>}
                    </td>

                    {/* Created at */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-gray-400 text-xs">{fmtDate(p.created_at)}</span>
                    </td>

                    {/* Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => handleToggle(p._id)}
                        className={`transition-colors ${p.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-600 hover:text-gray-400'}`}>
                        {p.is_active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDrawerPassage(p)}
                          className="p-2 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 rounded-lg transition-all"
                          title="Xem chi tiết">
                          <FiEye size={15} />
                        </button>
                        <button onClick={() => { setEditing(p); setShowModal(true); }}
                          className="p-2 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                          title="Chỉnh sửa">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => handleDuplicate(p._id)}
                          className="p-2 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded-lg transition-all"
                          title="Nhân đôi">
                          <FiCopy size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)}
                          className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                          title="Xoá">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-700/50 flex items-center justify-between">
            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => fetchPassages(1)} disabled={page <= 1}
                className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded-lg transition-all text-xs">
                «
              </button>
              <button onClick={() => fetchPassages(page - 1)} disabled={page <= 1}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded-lg transition-all">
                <FiChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pg = start + i;
                return (
                  <button key={pg} onClick={() => fetchPassages(pg)}
                    className={`w-8 h-8 rounded-lg text-sm transition-all ${
                      pg === page
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => fetchPassages(page + 1)} disabled={page >= totalPages}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded-lg transition-all">
                <FiChevronRight size={16} />
              </button>
              <button onClick={() => fetchPassages(totalPages)} disabled={page >= totalPages}
                className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded-lg transition-all text-xs">
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      {drawerPassage && (
        <DetailDrawer
          passage={drawerPassage}
          onClose={() => setDrawerPassage(null)}
          onEdit={() => {
            setEditing(drawerPassage);
            setDrawerPassage(null);
            setShowModal(true);
          }}
          onDuplicate={() => {
            handleDuplicate(drawerPassage._id);
            setDrawerPassage(null);
          }}
        />
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showModal && (
        <ListeningModal
          passage={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-600/20 rounded-xl">
                <FiTrash2 size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Xoá bài nghe</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Bạn có chắc muốn xoá <strong className="text-white">"{deleteTarget.title}"</strong>?{' '}
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm transition-all">
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl text-sm transition-all">
                {deleting ? <FiRefreshCw size={14} className="animate-spin" /> : <FiTrash2 size={14} />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
