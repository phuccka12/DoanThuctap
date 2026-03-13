import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiX,
  FiSave, FiChevronDown, FiChevronUp, FiAlertCircle,
  FiZap, FiBook, FiHelpCircle, FiGrid, FiEye, FiEyeOff,
  FiCheck, FiFileText, FiLoader,
} from 'react-icons/fi';
import * as adminService from '../../services/adminService';

// ─── Constants ─────────────────────────────────────────────────────────────
const LEVELS = [
  { value: 'beginner',     label: 'Sơ cấp',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'intermediate', label: 'Trung cấp', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'advanced',     label: 'Nâng cao',  color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

const MINIGAME_TYPES = [
  { value: 'multiple_choice', label: '🔘 Trắc nghiệm' },
  { value: 'error_detection', label: '🔍 Tìm lỗi sai' },
  { value: 'word_order',      label: '🔤 Sắp xếp câu' },
];

const emptyHookQuestion = () => ({
  _id: `hq_${Date.now()}_${Math.random()}`,
  text: '', optionA: '', optionB: '', correct: 'A',
});

const emptySubCard = () => ({
  _id: `sc_${Date.now()}_${Math.random()}`,
  title: '', content: '',
});

const emptyMinigame = (type = 'multiple_choice') => {
  if (type === 'multiple_choice') return {
    _id: `mg_${Date.now()}_${Math.random()}`,
    type, question: '', options: ['', '', '', ''], correct: 0,
  };
  if (type === 'error_detection') return {
    _id: `mg_${Date.now()}_${Math.random()}`,
    type, sentence: '', errorWord: '', correction: '', explanation: '',
  };
  return {
    _id: `mg_${Date.now()}_${Math.random()}`,
    type, words: [''], correct: '',
  };
};

const emptyForm = () => ({
  title: '',
  description: '',
  level: 'intermediate',
  hook: { questions: [] },
  theory: { mainCard: '', subCards: [] },
  minigames: [],
  is_active: true,
  is_published: false,
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';

function LevelBadge({ level }) {
  const meta = LEVELS.find(l => l.value === level);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${meta?.color || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {meta?.label || level}
    </span>
  );
}

function AccordionBlock({ title, icon: Icon, open, onToggle, children, badge }) {
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/60 hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-white">
          {Icon && <Icon size={16} className="text-purple-400" />}
          {title}
          {badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 text-xs">{badge}</span>
          )}
        </div>
        {open ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="p-4 bg-gray-900/40 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Hook Questions Editor ──────────────────────────────────────────────────
function HookEditor({ questions, onChange }) {
  const add = () => onChange([...questions, emptyHookQuestion()]);
  const remove = (id) => onChange(questions.filter(q => q._id !== id));
  const update = (id, field, val) =>
    onChange(questions.map(q => q._id === id ? { ...q, [field]: val } : q));

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q._id} className="bg-gray-800/60 border border-gray-700/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Câu hỏi #{i + 1}</span>
            <button type="button" onClick={() => remove(q._id)} className="text-red-400 hover:text-red-300 transition-colors">
              <FiX size={14} />
            </button>
          </div>
          <input
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="Nội dung câu hỏi..."
            value={q.text}
            onChange={e => update(q._id, 'text', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="Đáp án A..."
              value={q.optionA}
              onChange={e => update(q._id, 'optionA', e.target.value)}
            />
            <input
              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="Đáp án B..."
              value={q.optionB}
              onChange={e => update(q._id, 'optionB', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Đáp án đúng:</span>
            {['A', 'B'].map(opt => (
              <label key={opt} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`correct_${q._id}`}
                  value={opt}
                  checked={q.correct === opt}
                  onChange={() => update(q._id, 'correct', opt)}
                  className="accent-purple-500"
                />
                <span className="text-sm text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        <FiPlus size={14} /> Thêm câu hỏi mồi
      </button>
    </div>
  );
}

// ─── Theory Editor ──────────────────────────────────────────────────────────
function TheoryEditor({ theory, onChange }) {
  const updateMain = (val) => onChange({ ...theory, mainCard: val });
  const addSub = () => onChange({ ...theory, subCards: [...(theory.subCards || []), emptySubCard()] });
  const removeSub = (id) => onChange({ ...theory, subCards: theory.subCards.filter(c => c._id !== id) });
  const updateSub = (id, field, val) =>
    onChange({ ...theory, subCards: theory.subCards.map(c => c._id === id ? { ...c, [field]: val } : c) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Thẻ lý thuyết chính (Markdown)</label>
        <textarea
          rows={6}
          className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono resize-y"
          placeholder="# Công thức&#10;S + động từ + ...&#10;&#10;**Ví dụ:** ..."
          value={theory.mainCard || ''}
          onChange={e => updateMain(e.target.value)}
        />
      </div>
      {(theory.subCards || []).map((card, i) => (
        <div key={card._id} className="bg-gray-800/60 border border-gray-700/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Thẻ lưu ý #{i + 1}</span>
            <button type="button" onClick={() => removeSub(card._id)} className="text-red-400 hover:text-red-300 transition-colors">
              <FiX size={14} />
            </button>
          </div>
          <input
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="Tiêu đề thẻ..."
            value={card.title}
            onChange={e => updateSub(card._id, 'title', e.target.value)}
          />
          <textarea
            rows={3}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
            placeholder="Nội dung lưu ý..."
            value={card.content}
            onChange={e => updateSub(card._id, 'content', e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addSub}
        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        <FiPlus size={14} /> Thêm thẻ lưu ý
      </button>
    </div>
  );
}

// ─── Minigame Editor ────────────────────────────────────────────────────────
function MinigameEditor({ minigames, onChange }) {
  const [newType, setNewType] = useState('multiple_choice');

  const add = () => onChange([...minigames, emptyMinigame(newType)]);
  const remove = (id) => onChange(minigames.filter(m => m._id !== id));
  const update = (id, field, val) =>
    onChange(minigames.map(m => m._id === id ? { ...m, [field]: val } : m));
  const updateOption = (id, idx, val) =>
    onChange(minigames.map(m => m._id === id ? { ...m, options: m.options.map((o, i) => i === idx ? val : o) } : m));
  const addWord = (id) =>
    onChange(minigames.map(m => m._id === id ? { ...m, words: [...(m.words || []), ''] } : m));
  const removeWord = (id, idx) =>
    onChange(minigames.map(m => m._id === id ? { ...m, words: m.words.filter((_, i) => i !== idx) } : m));
  const updateWord = (id, idx, val) =>
    onChange(minigames.map(m => m._id === id ? { ...m, words: m.words.map((w, i) => i === idx ? val : w) } : m));

  return (
    <div className="space-y-3">
      {minigames.map((mg, i) => (
        <div key={mg._id} className="bg-gray-800/60 border border-gray-700/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              {MINIGAME_TYPES.find(t => t.value === mg.type)?.label} #{i + 1}
            </span>
            <button type="button" onClick={() => remove(mg._id)} className="text-red-400 hover:text-red-300 transition-colors">
              <FiX size={14} />
            </button>
          </div>

          {mg.type === 'multiple_choice' && (
            <>
              <input
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Câu hỏi trắc nghiệm..."
                value={mg.question || ''}
                onChange={e => update(mg._id, 'question', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                {(mg.options || ['', '', '', '']).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct_${mg._id}`}
                      checked={mg.correct === idx}
                      onChange={() => update(mg._id, 'correct', idx)}
                      className="accent-purple-500 shrink-0"
                    />
                    <input
                      className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                      value={opt}
                      onChange={e => updateOption(mg._id, idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">● Chọn radio để đánh dấu đáp án đúng</p>
            </>
          )}

          {mg.type === 'error_detection' && (
            <>
              <input
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Câu có lỗi sai..."
                value={mg.sentence || ''}
                onChange={e => update(mg._id, 'sentence', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Từ sai..."
                  value={mg.errorWord || ''}
                  onChange={e => update(mg._id, 'errorWord', e.target.value)}
                />
                <input
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Từ đúng..."
                  value={mg.correction || ''}
                  onChange={e => update(mg._id, 'correction', e.target.value)}
                />
              </div>
              <input
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Giải thích lỗi sai..."
                value={mg.explanation || ''}
                onChange={e => update(mg._id, 'explanation', e.target.value)}
              />
            </>
          )}

          {mg.type === 'word_order' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Các từ (người dùng sẽ sắp xếp)</label>
                {(mg.words || []).map((w, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder={`Từ ${idx + 1}...`}
                      value={w}
                      onChange={e => updateWord(mg._id, idx, e.target.value)}
                    />
                    <button type="button" onClick={() => removeWord(mg._id, idx)} className="text-red-400 hover:text-red-300">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addWord(mg._id)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <FiPlus size={12} /> Thêm từ
                </button>
              </div>
              <input
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Câu đúng hoàn chỉnh..."
                value={mg.correct || ''}
                onChange={e => update(mg._id, 'correct', e.target.value)}
              />
            </>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <select
          value={newType}
          onChange={e => setNewType(e.target.value)}
          className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          {MINIGAME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <FiPlus size={14} /> Thêm game
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminGrammar() {
  const [items, setItems]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');

  // Accordion open states
  const [accordionOpen, setAccordionOpen] = useState({ hook: true, theory: true, minigames: true });

  // AI Generate state
  const [aiTopic, setAiTopic]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState('');

  const LIMIT = 15;

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getGrammarList({ page, limit: LIMIT, search, level: filterLevel });
      const payload = res.data?.data;
      setItems(Array.isArray(payload) ? payload : (payload?.lessons || []));
      setTotal(res.data?.total ?? payload?.pagination?.total ?? 0);
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterLevel]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Open create ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setAiTopic('');
    setAiError('');
    setSaveErr('');
    setAccordionOpen({ hook: true, theory: true, minigames: true });
    setDrawerOpen(true);
  };

  // ── Open edit ─────────────────────────────────────────────────────────────
  const openEdit = async (id) => {
    setSaveErr('');
    setAiError('');
    setAiTopic('');
    setDrawerOpen(true);
    setEditId(id);
    setAccordionOpen({ hook: true, theory: true, minigames: true });
    try {
      const res = await adminService.getGrammarById(id);
      const d = res.data?.data || res.data;
      // Attach _id to array items so editors can key them
      setForm({
        title: d.title || '',
        description: d.description || '',
        level: d.level || 'intermediate',
        hook: {
          questions: (d.hook?.questions || []).map((q, i) => ({ _id: `hq_${i}`, ...q })),
        },
        theory: {
          mainCard: d.theory?.mainCard || '',
          subCards: (d.theory?.subCards || []).map((c, i) => ({ _id: `sc_${i}`, ...c })),
        },
        minigames: (d.minigames || []).map((m, i) => ({ _id: `mg_${i}`, ...m })),
        is_active: d.is_active ?? true,
        is_published: d.is_published ?? false,
      });
    } catch {
      setSaveErr('Không tải được dữ liệu bài');
    }
  };

  // ── AI Generate ───────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) { setAiError('Nhập chủ đề trước'); return; }
    setAiLoading(true);
    setAiError('');
    try {
      const res = await adminService.aiGenerateGrammar(aiTopic.trim());
      const d = res.data?.data || res.data;
      setForm(prev => ({
        ...prev,
        title: d.title || prev.title,
        description: d.description || prev.description,
        level: d.level || prev.level,
        hook: {
          questions: (d.hook?.questions || []).map((q, i) => ({ _id: `hq_ai_${i}`, ...q })),
        },
        theory: {
          mainCard: d.theory?.mainCard || '',
          subCards: (d.theory?.subCards || []).map((c, i) => ({ _id: `sc_ai_${i}`, ...c })),
        },
        minigames: (d.minigames || []).map((m, i) => ({ _id: `mg_ai_${i}`, ...m })),
      }));
    } catch (e) {
      setAiError(e.response?.data?.message || 'AI tạo thất bại. Thử lại!');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { setSaveErr('Vui lòng nhập tiêu đề'); return; }
    setSaving(true);
    setSaveErr('');
    // Strip temp _id before sending
    const payload = {
      ...form,
      hook: {
        questions: form.hook.questions.map(({ _id, ...q }) => q),
      },
      theory: {
        mainCard: form.theory.mainCard,
        subCards: form.theory.subCards.map(({ _id, ...c }) => c),
      },
      minigames: form.minigames.map(({ _id, ...m }) => m),
    };
    try {
      if (editId) {
        await adminService.updateGrammar(editId, payload);
      } else {
        await adminService.createGrammar(payload);
      }
      setDrawerOpen(false);
      fetchList();
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xoá bài ngữ pháp "${title}"?`)) return;
    try {
      await adminService.deleteGrammar(id);
      fetchList();
    } catch {
      alert('Xoá thất bại');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const toggleAccordion = (key) => setAccordionOpen(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiBook className="text-purple-400" size={24} />
            Quản lý Ngữ pháp
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Bài học ngữ pháp độc lập với Hook → Lý thuyết → Mini-game</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <FiPlus size={16} /> Tạo bài mới
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Tìm theo tiêu đề..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={filterLevel}
          onChange={e => { setFilterLevel(e.target.value); setPage(1); }}
          className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="">Tất cả cấp độ</option>
          {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <button
          onClick={fetchList}
          className="p-2 bg-gray-800/60 border border-gray-700/50 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Tiêu đề</th>
                <th className="text-left px-4 py-3 font-medium">Cấp độ</th>
                <th className="text-center px-4 py-3 font-medium">Hook</th>
                <th className="text-center px-4 py-3 font-medium">Minigames</th>
                <th className="text-center px-4 py-3 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <FiRefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <FiBook size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Chưa có bài ngữ pháp nào</p>
                    <button onClick={openCreate} className="mt-3 text-purple-400 hover:text-purple-300 text-sm underline">
                      Tạo bài đầu tiên
                    </button>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item._id} className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{item.title}</p>
                      {item.description && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><LevelBadge level={item.level} /></td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {item.hookCount ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {item.minigameCount ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.is_published
                          ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-xs"><FiEye size={10} /> Published</span>
                          : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-600/30 text-gray-400 border border-gray-600/30 text-xs"><FiEyeOff size={10} /> Draft</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item._id)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.title)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Xoá"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/40">
            <span className="text-xs text-gray-500">
              {total} bài · trang {page}/{totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs bg-gray-700/50 text-gray-400 disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >Trước</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs bg-gray-700/50 text-gray-400 disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >Sau</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawer / Modal ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          {/* Panel */}
          <div className="w-full max-w-2xl bg-gray-900 border-l border-gray-700/60 flex flex-col overflow-hidden shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50 shrink-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FiBook className="text-purple-400" />
                {editId ? 'Sửa bài ngữ pháp' : 'Tạo bài ngữ pháp mới'}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <FiX size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* ── AI Auto-Gen ── */}
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
                  <FiZap size={16} className="text-yellow-400" />
                  AI Tự động tạo nội dung
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-800/60 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="Nhập chủ đề ngữ pháp... (VD: Câu điều kiện loại 2)"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                  />
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {aiLoading ? <FiLoader size={15} className="animate-spin" /> : <FiZap size={15} />}
                    {aiLoading ? 'Đang tạo...' : 'Tạo'}
                  </button>
                </div>
                {aiError && (
                  <p className="text-red-400 text-xs flex items-center gap-1"><FiAlertCircle size={12} /> {aiError}</p>
                )}
                <p className="text-gray-500 text-xs">AI sẽ tạo tự động tiêu đề, lý thuyết, câu hỏi mồi và mini-games.</p>
              </div>

              {/* ── Basic Info ── */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tiêu đề <span className="text-red-400">*</span></label>
                  <input
                    className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="VD: Câu điều kiện loại 2 trong tiếng Anh"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mô tả ngắn</label>
                  <input
                    className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Mô tả ngắn về bài học..."
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Cấp độ</label>
                    <select
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      value={form.level}
                      onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                    >
                      {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-4 pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-purple-500 w-4 h-4"
                        checked={form.is_active}
                        onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-300">Kích hoạt</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-green-500 w-4 h-4"
                        checked={form.is_published}
                        onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-300">Publish</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Accordion: Hook ── */}
              <AccordionBlock
                title="Khối 1 — Câu hỏi mồi (Hook)"
                icon={FiHelpCircle}
                open={accordionOpen.hook}
                onToggle={() => toggleAccordion('hook')}
                badge={form.hook.questions.length}
              >
                <HookEditor
                  questions={form.hook.questions}
                  onChange={qs => setForm(p => ({ ...p, hook: { ...p.hook, questions: qs } }))}
                />
              </AccordionBlock>

              {/* ── Accordion: Theory ── */}
              <AccordionBlock
                title="Khối 2 — Lý thuyết"
                icon={FiFileText}
                open={accordionOpen.theory}
                onToggle={() => toggleAccordion('theory')}
                badge={(form.theory.subCards?.length || 0) + (form.theory.mainCard ? 1 : 0)}
              >
                <TheoryEditor
                  theory={form.theory}
                  onChange={t => setForm(p => ({ ...p, theory: t }))}
                />
              </AccordionBlock>

              {/* ── Accordion: Minigames ── */}
              <AccordionBlock
                title="Khối 3 — Mini-games"
                icon={FiGrid}
                open={accordionOpen.minigames}
                onToggle={() => toggleAccordion('minigames')}
                badge={form.minigames.length}
              >
                <MinigameEditor
                  minigames={form.minigames}
                  onChange={mgs => setForm(p => ({ ...p, minigames: mgs }))}
                />
              </AccordionBlock>

              {saveErr && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <FiAlertCircle size={15} /> {saveErr}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-700/50 shrink-0 bg-gray-900/80">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {saving
                  ? <><FiLoader size={15} className="animate-spin" /> Đang lưu...</>
                  : <><FiSave size={15} /> {editId ? 'Cập nhật' : 'Tạo bài'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
