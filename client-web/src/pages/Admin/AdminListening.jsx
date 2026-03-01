import React, { useState, useEffect, useCallback } from 'react';
import {
  FiHeadphones, FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiRefreshCw, FiToggleLeft, FiToggleRight, FiX, FiCheck,
  FiMusic, FiList, FiBarChart2, FiChevronLeft, FiChevronRight,
  FiVolume2, FiSave, FiAlertCircle, FiPlay
} from 'react-icons/fi';
import * as adminService from '../../services/adminService';
import FileUploader from '../../components/FileUploader';

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVELS = [
  { value: 'beginner',     label: 'Sơ cấp',      color: 'emerald' },
  { value: 'intermediate', label: 'Trung cấp',    color: 'amber'   },
  { value: 'advanced',     label: 'Nâng cao',     color: 'rose'    },
];

const SECTIONS = [
  { value: 'section1', label: 'Phần 1' },
  { value: 'section2', label: 'Phần 2' },
  { value: 'section3', label: 'Phần 3' },
  { value: 'section4', label: 'Phần 4' },
  { value: 'general',  label: 'Tổng hợp' },
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

// ─── Small helpers ────────────────────────────────────────────────────────────
function Badge({ level }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${LEVEL_COLORS[level] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {level}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white text-2xl font-bold">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ─── Question Builder ─────────────────────────────────────────────────────────
function QuestionBuilder({ questions, onChange }) {
  const add = () => onChange([...questions, { ...emptyQuestion(), order: questions.length + 1 }]);

  const remove = (idx) => onChange(questions.filter((_, i) => i !== idx));

  const update = (idx, field, val) => {
    const next = questions.map((q, i) => (i === idx ? { ...q, [field]: val } : q));
    onChange(next);
  };

  const updateOption = (qIdx, oIdx, val) => {
    const next = questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = val;
      return { ...q, options: opts };
    });
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">
          Câu hỏi ({questions.length})
        </h4>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs rounded-lg transition-all"
        >
          <FiPlus size={13} /> Thêm câu hỏi
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-6">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
      )}

      {questions.map((q, qi) => (
        <div key={q._tempId ?? qi} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-400 text-xs font-medium">Q{qi + 1}</span>
            <select
              value={q.type}
              onChange={(e) => update(qi, 'type', e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-purple-500"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => remove(qi)} className="text-red-400 hover:text-red-300 p-1">
              <FiTrash2 size={14} />
            </button>
          </div>

          {/* Question text */}
          <input
            type="text"
            value={q.question}
            onChange={(e) => update(qi, 'question', e.target.value)}
            placeholder="Nội dung câu hỏi..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500"
          />

          {/* Options for multiple_choice */}
          {q.type === 'multiple_choice' && (
            <div className="grid grid-cols-2 gap-2">
              {(q.options || ['', '', '', '']).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs w-5">{String.fromCharCode(65 + oi)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Answer */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs shrink-0">Đáp án:</span>
            <input
              type="text"
              value={q.answer}
              onChange={(e) => update(qi, 'answer', e.target.value)}
              placeholder={q.type === 'multiple_choice' ? 'VD: A hoặc toàn bộ nội dung đáp án' : 'Đáp án đúng'}
              className="flex-1 bg-gray-800 border border-green-600/40 rounded-lg px-2 py-1.5 text-green-300 text-xs focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      ))}
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
      topics: passage.topics || [],
      is_active: passage.is_active ?? true,
      questions: (passage.questions || []).map((q) => ({
        ...q,
        _tempId: q._id || Date.now() + Math.random(),
        options: q.options || ['', '', '', ''],
      })),
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())     return setError('Vui lòng nhập tiêu đề.');
    if (!form.audio_url.trim()) return setError('Vui lòng tải lên file audio trước khi lưu.');
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_sec: form.duration_sec === '' ? undefined : Number(form.duration_sec),
        questions: form.questions.map(({ _tempId, ...q }) => q),
      };
      if (isEdit) {
        await adminService.updateListeningPassage(passage._id, payload);
      } else {
        await adminService.createListeningPassage(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tiêu đề *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="VD: Hội thoại tại sân bay"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Audio Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">File Audio *</label>
            {form.audio_url ? (
              <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                <FiMusic size={18} className="text-purple-400 shrink-0" />
                <span className="text-gray-300 text-sm flex-1 truncate">{form.audio_url}</span>
                <audio controls src={form.audio_url} className="h-8 w-40 shrink-0" />
                <button
                  type="button"
                  onClick={() => set('audio_url', '')}
                  className="text-red-400 hover:text-red-300 shrink-0"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <FileUploader
                accept="audio/*"
                folder="listening-audio"
                maxSize={100}
                placeholder="Tải lên file audio (MP3, WAV, OGG – tối đa 100 MB)"
                onUploadSuccess={(data) => set('audio_url', data.secure_url || data.url)}
                onUploadError={(err) => setError('Tải lên thất bại: ' + err)}
              />
            )}
          </div>

          {/* Level / Section / Duration row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cấp độ</label>
              <select
                value={form.level}
                onChange={(e) => set('level', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500"
              >
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phần</label>
              <select
                value={form.section}
                onChange={(e) => set('section', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500"
              >
                {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Thời lượng (giây)</label>
              <input
                type="number"
                value={form.duration_sec}
                onChange={(e) => set('duration_sec', e.target.value)}
                placeholder="VD: 180"
                min={0}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Transcript */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Transcript <span className="text-gray-500 font-normal">(hiển thị sau khi nộp bài)</span>
            </label>
            <textarea
              value={form.transcript}
              onChange={(e) => set('transcript', e.target.value)}
              rows={5}
              placeholder="Toàn bộ nội dung transcript của audio…"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-200 focus:outline-none focus:border-purple-500 resize-y font-mono text-sm"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              className={`p-1 rounded-full transition-colors ${form.is_active ? 'text-emerald-400' : 'text-gray-500'}`}
            >
              {form.is_active ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
            </button>
            <span className="text-sm text-gray-300">
              {form.is_active ? 'Đang hiển thị (người dùng thấy)' : 'Đang ẩn (người dùng không thấy)'}
            </span>
          </div>

          {/* Questions */}
          <div className="border-t border-gray-700 pt-6">
            <QuestionBuilder
              questions={form.questions}
              onChange={(qs) => set('questions', qs)}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition-all text-sm font-medium"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-xl transition-all text-sm font-medium"
            >
              {saving ? <FiRefreshCw size={15} className="animate-spin" /> : <FiSave size={15} />}
              {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
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

  // Modal state
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null); // null = create, object = edit

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const r = await adminService.getListeningStats();
      setStats(r.data?.data || r.data);
    } catch { /* silent */ }
  }, []);

  const fetchPassages = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 10 };
      if (search)        params.search    = search;
      if (levelFilter)   params.level     = levelFilter;
      if (sectionFilter) params.section   = sectionFilter;
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

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      await adminService.toggleListeningActive(id);
      fetchPassages(page);
      fetchStats();
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteListeningPassage(deleteTarget._id);
      setDeleteTarget(null);
      fetchPassages(page);
      fetchStats();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  };

  // ── After save ────────────────────────────────────────────────────────────
  const handleSaved = () => {
    setShowModal(false);
    setEditing(null);
    fetchPassages(1);
    fetchStats();
  };

  // ── Search debounce via controlled input ──────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      {/* Page Header */}
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
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-500/20"
        >
          <FiPlus size={18} /> Thêm bài nghe
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiList}      label="Tổng bài"    value={stats.total}                    color="bg-blue-600"    />
          <StatCard icon={FiCheck}     label="Đang hiện"   value={stats.active}                   color="bg-emerald-600" />
          <StatCard icon={FiX}         label="Đang ẩn"     value={stats.inactive}                 color="bg-gray-600"    />
          <StatCard icon={FiBarChart2} label="Nâng cao"    value={stats.byLevel?.advanced ?? 0}   color="bg-rose-600"    />
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 flex-1 min-w-48">
          <FiSearch size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm tiêu đề…"
            className="bg-transparent text-gray-200 text-sm flex-1 focus:outline-none placeholder:text-gray-500"
          />
        </div>

        {/* Level */}
        <select
          value={levelFilter}
          onChange={(e) => setLevel(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">Tất cả cấp độ</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        {/* Section */}
        <select
          value={sectionFilter}
          onChange={(e) => setSection(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">Tất cả phần</option>
          {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Active */}
        <select
          value={activeFilter}
          onChange={(e) => setActive(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hiện</option>
          <option value="false">Đang ẩn</option>
        </select>

        <button
          onClick={() => fetchPassages(1)}
          className="p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 transition-all"
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <span className="text-sm text-gray-400">Tìm thấy {total} bài nghe</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <FiRefreshCw size={20} className="animate-spin" /> Đang tải…
          </div>
        ) : passages.length === 0 ? (
          <div className="text-center py-20">
            <FiHeadphones size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Chưa có bài nghe nào.</p>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="mt-4 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl text-sm transition-all"
            >
              Tạo bài nghe đầu tiên
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Tiêu đề</th>
                <th className="px-4 py-3 text-left">Cấp độ</th>
                <th className="px-4 py-3 text-left">Phần</th>
                <th className="px-4 py-3 text-center">Câu hỏi</th>
                <th className="px-4 py-3 text-center">Audio</th>
                <th className="px-4 py-3 text-center">Hiển thị</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {passages.map((p) => (
                <tr key={p._id} className="hover:bg-gray-700/20 transition-colors">
                  {/* Title */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/10 rounded-lg shrink-0">
                        <FiVolume2 size={16} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-1">{p.title}</p>
                        {p.duration_sec > 0 && (
                          <p className="text-gray-500 text-xs">{Math.floor(p.duration_sec / 60)}:{String(p.duration_sec % 60).padStart(2, '0')}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Level */}
                  <td className="px-4 py-4"><Badge level={p.level} /></td>

                  {/* Section */}
                  <td className="px-4 py-4">
                    <span className="text-gray-300 text-sm capitalize">{p.section}</span>
                  </td>

                  {/* Questions */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-gray-300 text-sm font-medium">
                      {p.questions?.length ?? 0}
                    </span>
                  </td>

                  {/* Audio preview */}
                  <td className="px-4 py-4 text-center">
                    {p.audio_url ? (
                      <audio
                        controls
                        src={p.audio_url}
                        className="h-7 w-32 mx-auto"
                        preload="none"
                      />
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Active toggle */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(p._id)}
                      className={`transition-colors ${p.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {p.is_active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditing(p); setShowModal(true); }}
                        className="p-2 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                        title="Xoá"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-700/50 flex items-center justify-between">
            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPassages(page - 1)}
                disabled={page <= 1}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded-lg transition-all"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                onClick={() => fetchPassages(page + 1)}
                disabled={page >= totalPages}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded-lg transition-all"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <ListeningModal
          passage={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
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
              Bạn có chắc muốn xoá <strong className="text-white">"{deleteTarget.title}"</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm transition-all"
              >
                Huỷ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl text-sm transition-all"
              >
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
