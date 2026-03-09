import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiBook,
  FiEye, FiEyeOff, FiImage, FiChevronDown, FiChevronUp,
  FiX, FiCheck, FiLoader, FiAlertCircle, FiLayers,
  FiBookOpen, FiStar, FiTag, FiArrowRight,
} from 'react-icons/fi';
import { FaBookOpen, FaCoins, FaBolt } from 'react-icons/fa';
import adminService from '../../services/adminService';
import FileUploader from '../../components/FileUploader';

// ─── Constants ────────────────────────────────────────────────────────────────
const THEMES = [
  { value: 'daily_life',  label: '🏠 Cuộc sống hàng ngày', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'travel',      label: '✈️ Du lịch',             color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'mystery',     label: '🔍 Bí ẩn',               color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'adventure',   label: '⚔️ Phiêu lưu',          color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'business',    label: '💼 Kinh doanh',          color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { value: 'romance',     label: '💕 Lãng mạn',            color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { value: 'sci_fi',      label: '🚀 Khoa học viễn tưởng', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'other',       label: '📚 Khác',                color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
];

const LEVELS = [
  { value: 'beginner',     label: '🌱 Cơ bản',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'intermediate', label: '🔥 Trung cấp', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'advanced',     label: '💎 Nâng cao',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
];

const themeInfo  = Object.fromEntries(THEMES.map(t => [t.value, t]));
const levelInfo  = Object.fromEntries(LEVELS.map(l => [l.value, l]));

// ─── Empty templates ──────────────────────────────────────────────────────────
const emptyHint     = () => ({ word: '', hint: '' });
const emptySentence = () => ({ order: 1, vi: '', en_sample: '', hints: [] });
const emptyPart     = () => ({ part_number: 1, title: '', sentences: [emptySentence()], xp_reward: 50, coins_reward: 30 });
const emptyStory    = () => ({
  title: '', description: '', cover_image: '', theme: 'daily_life',
  level: 'beginner', tags: '', is_active: true, parts: [emptyPart()],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const tagsToArray  = str => str ? str.split(',').map(t => t.trim()).filter(Boolean) : [];
const tagsToString = arr => (arr || []).join(', ');

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single hint row inside a sentence */
function HintRow({ hint, onUpdate, onRemove }) {
  return (
    <div className="flex gap-2 items-center">
      <input
        value={hint.word}
        onChange={e => onUpdate({ ...hint, word: e.target.value })}
        placeholder="Từ tiếng Việt"
        className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
      />
      <FiArrowRight className="text-gray-500 shrink-0" size={12} />
      <input
        value={hint.hint}
        onChange={e => onUpdate({ ...hint, hint: e.target.value })}
        placeholder="Gợi ý tiếng Anh"
        className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
      />
      <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 shrink-0"><FiX size={14} /></button>
    </div>
  );
}

/** One sentence row inside a part */
function SentenceEditor({ sentence, idx, onChange, onRemove }) {
  const [open, setOpen] = useState(idx === 0);

  const updateHint = (hi, newHint) => {
    const hints = sentence.hints.map((h, i) => i === hi ? newHint : h);
    onChange({ ...sentence, hints });
  };
  const addHint = () => onChange({ ...sentence, hints: [...sentence.hints, emptyHint()] });
  const removeHint = (hi) => onChange({ ...sentence, hints: sentence.hints.filter((_, i) => i !== hi) });

  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-750 hover:bg-gray-700/60 transition text-left"
      >
        <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">
          {idx + 1}
        </span>
        <span className="flex-1 text-sm text-gray-300 truncate">
          {sentence.vi || <span className="italic text-gray-600">Chưa nhập câu tiếng Việt…</span>}
        </span>
        {open ? <FiChevronUp className="text-gray-500" size={14} /> : <FiChevronDown className="text-gray-500" size={14} />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-800/40">
          {/* Order */}
          <div className="flex gap-3">
            <div className="w-20">
              <label className="text-xs text-gray-500 mb-1 block">Thứ tự</label>
              <input
                type="number" min={1}
                value={sentence.order}
                onChange={e => onChange({ ...sentence, order: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1" />
            <button type="button" onClick={onRemove} className="self-end text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-red-500/10 transition">
              <FiTrash2 size={12} /> Xóa câu
            </button>
          </div>
          {/* VI */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">📝 Câu tiếng Việt <span className="text-red-400">*</span></label>
            <textarea
              rows={2}
              value={sentence.vi}
              onChange={e => onChange({ ...sentence, vi: e.target.value })}
              placeholder="Câu tiếng Việt người dùng cần dịch..."
              className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          {/* EN sample */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">✅ Bản dịch mẫu (EN) <span className="text-red-400">*</span></label>
            <textarea
              rows={2}
              value={sentence.en_sample}
              onChange={e => onChange({ ...sentence, en_sample: e.target.value })}
              placeholder="Bản dịch tiếng Anh chuẩn để AI so sánh..."
              className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          {/* Hints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">💡 Gợi ý từ vựng (hover)</label>
              <button type="button" onClick={addHint} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <FiPlus size={11} /> Thêm gợi ý
              </button>
            </div>
            {sentence.hints.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Chưa có gợi ý nào — người dùng sẽ tự dịch toàn bộ.</p>
            ) : (
              <div className="space-y-1.5">
                {sentence.hints.map((h, hi) => (
                  <HintRow key={hi} hint={h} onUpdate={nh => updateHint(hi, nh)} onRemove={() => removeHint(hi)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** One Part tab/accordion inside the story form */
function PartEditor({ part, partIdx, onChange, onRemove, totalParts }) {
  const [open, setOpen] = useState(partIdx === 0);

  const updateSentence = (si, newSent) => {
    const sentences = part.sentences.map((s, i) => i === si ? newSent : s);
    onChange({ ...part, sentences });
  };
  const addSentence = () => {
    const nextOrder = part.sentences.length + 1;
    onChange({ ...part, sentences: [...part.sentences, { ...emptySentence(), order: nextOrder }] });
  };
  const removeSentence = (si) => {
    if (part.sentences.length <= 1) return;
    const sentences = part.sentences.filter((_, i) => i !== si)
      .map((s, i) => ({ ...s, order: i + 1 }));
    onChange({ ...part, sentences });
  };

  return (
    <div className="border border-gray-700/80 rounded-2xl overflow-hidden">
      {/* Part header — using div to avoid nested <button> inside <button> */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-gray-800/60 hover:bg-gray-800 transition text-left cursor-pointer select-none"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 text-white text-xs font-bold shrink-0">
          {part.part_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{part.title || `Phần ${part.part_number}`}</p>
          <p className="text-xs text-gray-500">{part.sentences.length} câu · +{part.xp_reward} XP · +{part.coins_reward} xu</p>
        </div>
        <div className="flex items-center gap-2">
          {totalParts > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
              title="Xóa phần này"
            >
              <FiTrash2 size={14} />
            </button>
          )}
          {open ? <FiChevronUp className="text-gray-500" size={16} /> : <FiChevronDown className="text-gray-500" size={16} />}
        </div>
      </div>

      {open && (
        <div className="p-5 space-y-4 bg-gray-900/30">
          {/* Part meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs text-gray-400 mb-1 block">Tiêu đề phần</label>
              <input
                value={part.title}
                onChange={e => onChange({ ...part, title: e.target.value })}
                placeholder="Ví dụ: Buổi sáng ở Hội An"
                className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block"><FaBolt className="inline mr-1 text-yellow-400" size={11} />XP thưởng</label>
              <input
                type="number" min={0}
                value={part.xp_reward}
                onChange={e => onChange({ ...part, xp_reward: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block"><FaCoins className="inline mr-1 text-yellow-400" size={11} />Xu thưởng</label>
              <input
                type="number" min={0}
                value={part.coins_reward}
                onChange={e => onChange({ ...part, coins_reward: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Sentence list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Danh sách câu ({part.sentences.length})</p>
              <button type="button" onClick={addSentence} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded-lg hover:bg-purple-500/10 transition">
                <FiPlus size={12} /> Thêm câu
              </button>
            </div>
            <div className="space-y-2">
              {part.sentences.map((s, si) => (
                <SentenceEditor
                  key={si} idx={si} sentence={s}
                  onChange={ns => updateSentence(si, ns)}
                  onRemove={() => removeSentence(si)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cover Image Preview ───────────────────────────────────────────────────────
function CoverPreview({ url, title, theme, level }) {
  const tInfo = themeInfo[theme] || themeInfo.other;
  const lInfo = levelInfo[level] || levelInfo.beginner;

  return (
    <div className="relative rounded-2xl overflow-hidden h-48 bg-linear-to-br from-purple-900/60 to-indigo-900/60 border border-gray-700 group">
      {url ? (
        <img src={url} alt={title || 'Cover'} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
          <FiImage size={36} />
          <span className="text-xs">Chưa có ảnh bìa</span>
        </div>
      )}
      {/* overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
        <p className="text-white font-bold text-sm leading-snug line-clamp-2">{title || 'Tiêu đề câu chuyện'}</p>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${tInfo.color}`}>{tInfo.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${lInfo.color}`}>{lInfo.label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Story Form Modal ─────────────────────────────────────────────────────────
function StoryFormModal({ story, onClose, onSave }) {
  const isEdit = !!story?._id;
  const [form, setForm]       = useState(() => {
    if (!story) return emptyStory();
    return {
      title:       story.title || '',
      description: story.description || '',
      cover_image: story.cover_image || '',
      theme:       story.theme || 'daily_life',
      level:       story.level || 'beginner',
      tags:        tagsToString(story.tags),
      is_active:   story.is_active !== false,
      parts:       story.parts?.length ? story.parts : [emptyPart()],
    };
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('info'); // 'info' | 'parts'

  const updatePart = (pi, newPart) => setForm(f => ({ ...f, parts: f.parts.map((p, i) => i === pi ? newPart : p) }));
  const addPart = () => setForm(f => {
    const next = f.parts.length + 1;
    return { ...f, parts: [...f.parts, { ...emptyPart(), part_number: next }] };
  });
  const removePart = (pi) => setForm(f => {
    if (f.parts.length <= 1) return f;
    return { ...f, parts: f.parts.filter((_, i) => i !== pi).map((p, i) => ({ ...p, part_number: i + 1 })) };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Vui lòng nhập tiêu đề câu chuyện.'); return; }

    // Lọc bỏ các câu rỗng (cả 2 trường đều trống) trước khi lưu
    const cleanedParts = form.parts.map(p => ({
      ...p,
      sentences: p.sentences.filter(s => s.vi.trim() || s.en_sample.trim()),
    }));

    // Nếu có câu chỉ nhập 1 trong 2 trường → báo lỗi
    const hasIncomplete = cleanedParts.some(p =>
      p.sentences.some(s => (s.vi.trim() && !s.en_sample.trim()) || (!s.vi.trim() && s.en_sample.trim()))
    );
    if (hasIncomplete) {
      setError('Mỗi câu cần có đủ cả tiếng Việt lẫn bản dịch tiếng Anh mẫu.');
      setTab('parts');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, parts: cleanedParts, tags: tagsToArray(form.tags) };
      if (isEdit) await adminService.updateStoryAdmin(story._id, payload);
      else        await adminService.createStoryAdmin(payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi lưu câu chuyện.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <FaBookOpen className="text-white" size={16} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{isEdit ? 'Chỉnh sửa câu chuyện' : 'Tạo câu chuyện mới'}</h3>
              <p className="text-gray-500 text-xs">RPG Story Mini-game — dữ liệu được nhúng đầy đủ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"><FiX size={20} /></button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-3 shrink-0">
          {[
            { key: 'info',  label: '📋 Thông tin chung',    count: null },
            { key: 'parts', label: '📖 Nội dung & Câu',     count: form.parts.length },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-b-2 transition ${
                tab === t.key
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}{t.count !== null ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <form id="story-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              <FiAlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── Tab: Info ───────────────────────────────── */}
          {tab === 'info' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: meta fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Tiêu đề câu chuyện <span className="text-red-400">*</span></label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Ví dụ: Buổi sáng ở phố cổ Hội An"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Mô tả ngắn</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Giới thiệu nội dung và điều thú vị người dùng sẽ học..."
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1.5 block">Thể loại</label>
                      <select
                        value={form.theme}
                        onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                      >
                        {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1.5 block">Cấp độ</label>
                      <select
                        value={form.level}
                        onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                      >
                        {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block"><FiTag className="inline mr-1" size={13} />Thẻ (cách nhau bởi dấu phẩy)</label>
                    <input
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="hội an, phố cổ, văn hóa, ẩm thực"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 border border-gray-700">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded accent-purple-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer select-none">
                      <span className="font-semibold text-white">Công khai câu chuyện</span>
                      <span className="block text-xs text-gray-500">Người dùng có thể thấy và chơi câu chuyện này</span>
                    </label>
                  </div>
                </div>

                {/* Right: cover image */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 block"><FiImage className="inline mr-1" size={13} />Ảnh bìa (URL Cloudinary / link ảnh)</label>
                  <div className="space-y-3">
                    <FileUploader
                      accept="image/*"
                      folder="stories/covers"
                      onUploadSuccess={(data) => setForm(f => ({ ...f, cover_image: data.url }))}
                      onUploadError={(err) => console.error('Cover upload error', err)}
                      placeholder="Kéo thả hoặc nhấn để chọn ảnh bìa"
                      maxSize={10}
                    />

                    <div className="flex items-center gap-3">
                      <input
                        value={form.cover_image}
                        onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                        placeholder="Hoặc dán URL ảnh ở đây (ví dụ: https://res.cloudinary.com/...)"
                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm transition"
                      >Xóa</button>
                    </div>

                    <p className="text-xs text-gray-600">Khuyến nghị: ảnh tỉ lệ 16:9 hoặc 4:3, tối thiểu 800×450px, phong cảnh hoặc minh họa có màu sắc ấn tượng.</p>

                    {/* Live preview */}
                    <CoverPreview url={form.cover_image} title={form.title} theme={form.theme} level={form.level} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Parts & Sentences ───────────────────── */}
          {tab === 'parts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Các phần của câu chuyện</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mỗi phần có nhiều câu — người dùng dịch từng câu, AI chấm điểm rồi dịch ngược.</p>
                </div>
                <button
                  type="button"
                  onClick={addPart}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition shadow-lg shadow-purple-500/20"
                >
                  <FiPlus size={15} /> Thêm phần
                </button>
              </div>

              <div className="space-y-3">
                {form.parts.map((part, pi) => (
                  <PartEditor
                    key={pi}
                    part={part}
                    partIdx={pi}
                    totalParts={form.parts.length}
                    onChange={np => updatePart(pi, np)}
                    onRemove={() => removePart(pi)}
                  />
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
          <div className="text-xs text-gray-600">
            {form.parts.length} phần · {form.parts.reduce((a, p) => a + p.sentences.length, 0)} câu tổng
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-semibold transition">
              Hủy
            </button>
            <button
              type="submit"
              form="story-form"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {saving ? <FiLoader className="animate-spin" size={15} /> : <FiCheck size={15} />}
              {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo câu chuyện'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Story Detail View Modal ──────────────────────────────────────────────────
function StoryDetailModal({ story, onClose, onEdit }) {
  const tInfo = themeInfo[story.theme] || themeInfo.other;
  const lInfo = levelInfo[story.level] || levelInfo.beginner;
  const totalSentences = (story.parts || []).reduce((a, p) => a + (p.sentences?.length || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h3 className="text-white font-bold text-lg">Chi tiết câu chuyện</h3>
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition">
              <FiEdit2 size={14} /> Chỉnh sửa
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"><FiX size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cover + meta */}
          <div className="relative rounded-2xl overflow-hidden h-52 border border-gray-700">
            {story.cover_image ? (
              <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-purple-900/60 to-indigo-900/60 flex items-center justify-center">
                <FaBookOpen className="text-gray-600" size={48} />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-white font-black text-xl leading-snug mb-2">{story.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tInfo.color}`}>{tInfo.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${lInfo.color}`}>{lInfo.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${story.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {story.is_active ? '✅ Công khai' : '🔒 Ẩn'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Số phần', value: story.total_parts || story.parts?.length || 0, icon: <FiLayers /> },
              { label: 'Tổng câu', value: totalSentences, icon: <FiBookOpen /> },
              { label: 'XP tổng', value: (story.parts || []).reduce((a, p) => a + (p.xp_reward || 0), 0), icon: <FaBolt /> },
            ].map(s => (
              <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-purple-400 text-lg mb-1 flex justify-center">{s.icon}</div>
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {story.description && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-300 text-sm leading-relaxed">{story.description}</p>
            </div>
          )}

          {/* Tags */}
          {story.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {story.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">#{tag}</span>
              ))}
            </div>
          )}

          {/* Parts tree */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Cấu trúc nội dung</p>
            <div className="space-y-2">
              {(story.parts || []).map(part => (
                <div key={part.part_number} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-lg bg-linear-to-br from-purple-600 to-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{part.part_number}</span>
                    <span className="text-sm font-semibold text-white">{part.title || `Phần ${part.part_number}`}</span>
                    <span className="ml-auto text-xs text-gray-500">+{part.xp_reward} XP · +{part.coins_reward} xu</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">{part.sentences?.length || 0} câu dịch</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Story Card (list item) ───────────────────────────────────────────────────
function StoryListCard({ story, onEdit, onDelete, onView }) {
  const tInfo = themeInfo[story.theme] || themeInfo.other;
  const lInfo = levelInfo[story.level] || levelInfo.beginner;
  const totalSentences = (story.parts || []).reduce((a, p) => a + (p.sentences?.length || 0), 0);

  return (
    <div className="group bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 hover:border-purple-500/30 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col">
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden cursor-pointer" onClick={onView}>
        {story.cover_image ? (
          <img
            src={story.cover_image}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        {/* fallback */}
        <div
          className="absolute inset-0 bg-linear-to-br from-purple-900/80 to-indigo-900/80 flex items-center justify-center"
          style={{ display: story.cover_image ? 'none' : 'flex' }}
        >
          <FaBookOpen className="text-purple-400/40" size={42} />
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium backdrop-blur-sm ${tInfo.color}`}>{tInfo.label}</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium backdrop-blur-sm ${story.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
            {story.is_active ? '✅ Live' : '🔒 Ẩn'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 cursor-pointer hover:text-purple-300 transition-colors" onClick={onView}>
            {story.title}
          </h3>
          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${lInfo.color}`}>{lInfo.label}</span>
        </div>

        {story.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{story.description}</p>
        )}

        {/* Stats mini row */}
        <div className="flex gap-3 text-xs text-gray-500 mt-auto pt-1">
          <span><FiLayers className="inline mr-0.5" size={11} />{story.total_parts || story.parts?.length || 0} phần</span>
          <span><FiBookOpen className="inline mr-0.5" size={11} />{totalSentences} câu</span>
          {story.tags?.slice(0, 2).map(t => <span key={t} className="text-purple-500/60">#{t}</span>)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button onClick={onView}  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold flex items-center justify-center gap-1 transition">
          <FiEye size={13} /> Xem
        </button>
        <button onClick={onEdit}  className="flex-1 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1 transition">
          <FiEdit2 size={13} /> Sửa
        </button>
        <button onClick={onDelete} className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1 transition">
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminStories ────────────────────────────────────────────────────────
export default function AdminStories() {
  const [stories,       setStories]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [levelFilter,   setLevelFilter]   = useState('');
  const [themeFilter,   setThemeFilter]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');

  // Modals
  const [showForm,    setShowForm]    = useState(false);
  const [editStory,   setEditStory]   = useState(null);  // story object or null (create)
  const [viewStory,   setViewStory]   = useState(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, byLevel: {}, byTheme: {} });

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getStoriesAdmin({ limit: 100 });
      const data = res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : (data.stories || []);
      setStories(list);
      // Compute stats
      const active = list.filter(s => s.is_active).length;
      const byLevel = {}, byTheme = {};
      list.forEach(s => {
        byLevel[s.level] = (byLevel[s.level] || 0) + 1;
        byTheme[s.theme] = (byTheme[s.theme] || 0) + 1;
      });
      setStats({ total: list.length, active, byLevel, byTheme });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách câu chuyện');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa câu chuyện này? Tất cả tiến trình người dùng liên quan cũng sẽ bị ảnh hưởng.')) return;
    try {
      await adminService.deleteStoryAdmin(id);
      fetchStories();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditStory(null);
    fetchStories();
  };

  const openCreate = () => { setEditStory(null); setShowForm(true); };
  const openEdit = async (s) => {
    // The admin list returns a lightweight story (no parts). Fetch full story
    // before opening the edit modal so the parts/sentences are present.
    try {
      setLoading(true);
      const res = await adminService.getStoryAdmin(s._id);
      const full = res.data?.data || res.data || s;
      setEditStory(full);
      setViewStory(null);
      setShowForm(true);
    } catch (err) {
      // fallback to the list item if fetch fails
      setEditStory(s);
      setShowForm(true);
      console.error('Failed to load full story for edit', err);
      alert('Không tải được dữ liệu chi tiết của câu chuyện — thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filtered = stories.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    const matchLevel  = !levelFilter  || s.level === levelFilter;
    const matchTheme  = !themeFilter  || s.theme === themeFilter;
    const matchStatus = !statusFilter || (statusFilter === 'active' ? s.is_active : !s.is_active);
    return matchSearch && matchLevel && matchTheme && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FaBookOpen className="text-white" size={18} />
            </div>
            Quản lý Câu chuyện
          </h2>
          <p className="text-gray-400 text-sm mt-1">RPG Story mini-game — tạo, chỉnh sửa, quản lý nội dung dịch thuật</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30 shrink-0"
        >
          <FiPlus size={18} /> Tạo câu chuyện mới
        </button>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng câu chuyện',  value: stats.total,                     icon: <FiBook />,      color: 'from-purple-600/20 to-purple-900/20 border-purple-500/20' },
          { label: 'Đang công khai',    value: stats.active,                    icon: <FiEye />,       color: 'from-green-600/20 to-green-900/20 border-green-500/20' },
          { label: 'Tổng phần',         value: stories.reduce((a,s)=>a+(s.total_parts||0),0), icon: <FiLayers />, color: 'from-blue-600/20 to-blue-900/20 border-blue-500/20' },
          { label: 'Tổng câu dịch',     value: stories.reduce((a,s)=>a+((s.parts||[]).reduce((b,p)=>b+(p.sentences?.length||0),0)),0), icon: <FiBookOpen />, color: 'from-indigo-600/20 to-indigo-900/20 border-indigo-500/20' },
        ].map(s => (
          <div key={s.label} className={`bg-linear-to-br ${s.color} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="text-2xl text-purple-300">{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề hoặc mô tả..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <select value={themeFilter} onChange={e => setThemeFilter(e.target.value)} className="px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
            <option value="">Tất cả thể loại</option>
            {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
            <option value="">Tất cả cấp độ</option>
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
            <option value="">Tất cả trạng thái</option>
            <option value="active">✅ Công khai</option>
            <option value="inactive">🔒 Ẩn</option>
          </select>
        </div>
        {(search || levelFilter || themeFilter || statusFilter) && (
          <p className="text-xs text-gray-500 mt-2">Tìm thấy <span className="text-white font-semibold">{filtered.length}</span> / {stories.length} câu chuyện</p>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
          <FiAlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FiLoader className="animate-spin text-purple-400" size={36} />
          <p className="text-gray-400 text-sm">Đang tải danh sách câu chuyện…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="text-6xl">📚</div>
          <p className="text-white font-semibold text-lg">{stories.length === 0 ? 'Chưa có câu chuyện nào' : 'Không tìm thấy kết quả'}</p>
          <p className="text-gray-400 text-sm">{stories.length === 0 ? 'Tạo câu chuyện đầu tiên để bắt đầu RPG mini-game!' : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}</p>
          {stories.length === 0 && (
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-blue-700 transition">
              <FiPlus size={16} /> Tạo câu chuyện đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(story => (
            <StoryListCard
              key={story._id}
              story={story}
              onView={() => setViewStory(story)}
              onEdit={() => openEdit(story)}
              onDelete={() => handleDelete(story._id)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {showForm && (
        <StoryFormModal
          story={editStory}
          onClose={() => { setShowForm(false); setEditStory(null); }}
          onSave={handleSave}
        />
      )}
      {viewStory && !showForm && (
        <StoryDetailModal
          story={viewStory}
          onClose={() => setViewStory(null)}
          onEdit={() => openEdit(viewStory)}
        />
      )}
    </div>
  );
}
