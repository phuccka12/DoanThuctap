import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../context/AuthContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getReadingTopics, getReadingPassages, getReadingPassageById } from '../services/learningService';
import LearnLayout from '../components/learn/LearnLayout';
import {
  FaBookOpen, FaClock, FaLayerGroup, FaTrophy,
  FaStar, FaChevronLeft, FaChevronRight, FaCheck, FaTimes,
  FaRedo, FaArrowRight, FaSearch, FaGamepad, FaTags,
} from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';
import SharedTopicCard from '../components/shared/TopicCard';

// ─── Phase constants ─────────────────────────────────────────────────────────
const PHASE = {
  TOPICS:    'topics',
  LIST:      'list',
  VOCAB:     'vocab',
  READING:   'reading',
  QUESTIONS: 'questions',
  MINIGAME:  'minigame',
  RESULT:    'result',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LEVEL_META = {
  A1: { label: 'A1', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  A2: { label: 'A2', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  B1: { label: 'B1', color: 'bg-amber-500/20  text-amber-400  border-amber-500/30' },
  B2: { label: 'B2', color: 'bg-amber-500/20  text-amber-400  border-amber-500/30' },
  C1: { label: 'C1', color: 'bg-rose-500/20   text-rose-400   border-rose-500/30' },
  C2: { label: 'C2', color: 'bg-rose-500/20   text-rose-400   border-rose-500/30' },
  beginner:     { label: 'Cơ bản',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'Trung cấp', color: 'bg-amber-500/20  text-amber-400  border-amber-500/30' },
  advanced:     { label: 'Nâng cao',  color: 'bg-rose-500/20   text-rose-400   border-rose-500/30' },
};
const getLevelMeta    = (l) => LEVEL_META[l] || { label: l || '?', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
const estimateMinutes = (p) => p.estimated_time || (p.word_count ? Math.max(1, Math.round(p.word_count / 200)) : 3);

const POS_COLORS = {
  noun:   'text-sky-300 border-sky-400',
  verb:   'text-emerald-300 border-emerald-400',
  adj:    'text-violet-300 border-violet-400',
  adv:    'text-rose-300 border-rose-400',
  phrase: 'text-amber-300 border-amber-400',
  other:  'text-gray-300 border-gray-400',
};
const POS_LABELS = { noun: 'n.', verb: 'v.', adj: 'adj.', adv: 'adv.', phrase: 'phr.', other: '' };

const TOPIC_ICONS = {
  travel: '✈️', food: '🍜', technology: '💻', science: '🔬', health: '🏥',
  sport: '⚽', environment: '🌿', culture: '🎭', business: '💼', education: '📚',
};
const getTopicIcon = (name = '') => {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(TOPIC_ICONS)) {
    if (n.includes(k)) return v;
  }
  return '📖';
};

// ─── HighlightWord ────────────────────────────────────────────────────────────
function HighlightWord({ word, vocab }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const colorCls = POS_COLORS[vocab.pos] || POS_COLORS.other;
  const posLabel = POS_LABELS[vocab.pos] || '';
  return (
    <span ref={ref} className="relative inline-block">
      <span onClick={() => setOpen(o => !o)}
        className="border-b border-dashed cursor-pointer rounded-sm px-0.5 text-amber-300 border-amber-400 hover:bg-amber-400/15 select-none transition-colors">
        {word}
      </span>
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
          bg-gray-800 border border-white/15 rounded-xl shadow-2xl px-3 py-2.5 min-w-40 max-w-64 text-xs pointer-events-none"
          style={{ whiteSpace: 'normal' }}>
          <span className="flex items-baseline gap-1.5 flex-wrap mb-1">
            <span className="font-bold text-amber-300 text-sm">{vocab.word}</span>
            {posLabel && <span className={`italic font-medium text-[10px] border rounded px-1 ${colorCls}`}>{posLabel}</span>}
          </span>
          {vocab.meaning && <span className="block text-gray-200 leading-snug">{vocab.meaning}</span>}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}

// ─── HighlightedPassage ───────────────────────────────────────────────────────
function HighlightedPassage({ text, highlights }) {
  if (!text) return null;
  if (!highlights?.length) return <>{text}</>;
  const vocabMap = new Map();
  highlights.forEach(h => { if (h.word?.trim()) vocabMap.set(h.word.trim().toLowerCase(), h); });
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = Array.from(vocabMap.keys()).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${words.map(escape).join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const vocab = vocabMap.get(part.toLowerCase());
        if (vocab) return <HighlightWord key={i} word={part} vocab={vocab} />;
        return part.split('\n').map((line, li, arr) => (
          <React.Fragment key={`${i}-${li}`}>{line}{li < arr.length - 1 && <br />}</React.Fragment>
        ));
      })}
    </>
  );
}

// ─── Completion Modal ─────────────────────────────────────────────────────────
function CompletionModal({ result, passage, isDark, onReadAgain, onBackList }) {
  const { score, total } = result;
  const pct   = total > 0 ? Math.round((score / total) * 100) : 100;
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  const emoji = pct >= 90 ? '🏆' : pct >= 60 ? '🎉' : '💪';
  const msg   = pct >= 90 ? 'Xuất sắc!' : pct >= 60 ? 'Tốt lắm!' : 'Cố gắng thêm!';
  const [show, setShow] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShow(true), 60); return () => clearTimeout(id); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onBackList}>
      <div onClick={e => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden text-center transition-all duration-500',
          isDark ? 'bg-[#16181f] border-white/10' : 'bg-white border-slate-200',
          show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8',
        )}>
        {/* Rainbow top strip */}
        <div className="h-2 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Floating confetti dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <div key={i}
              className={cn('absolute rounded-full opacity-60 animate-bounce',
                ['bg-indigo-400','bg-purple-400','bg-pink-400','bg-amber-400','bg-emerald-400'][i % 5])}
              style={{
                width:  `${6 + (i % 4) * 3}px`,
                height: `${6 + (i % 4) * 3}px`,
                left:   `${(i * 37 + 5) % 95}%`,
                top:    `${(i * 29 + 10) % 50}%`,
                animationDelay:    `${(i * 0.15) % 1.2}s`,
                animationDuration: `${1.2 + (i % 3) * 0.4}s`,
              }} />
          ))}
        </div>

        <div className="relative px-8 pt-8 pb-10">
          <div className="text-6xl mb-3 animate-bounce" style={{ animationDuration: '1.5s' }}>{emoji}</div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <FaStar key={s} size={30}
                className={s <= stars
                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : 'text-gray-600'} />
            ))}
          </div>

          <h2 className={cn('text-2xl font-extrabold mb-1', isDark ? 'text-white' : 'text-slate-800')}>{msg}</h2>
          <p className={cn('text-sm mb-6 truncate px-4', isDark ? 'text-gray-400' : 'text-slate-500')}>{passage.title}</p>

          {/* Score card */}
          {total > 0 && (
            <div className={cn('rounded-2xl border p-4 mb-6 text-left', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200')}>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Câu đúng</span>
                <span className={cn('font-extrabold', isDark ? 'text-white' : 'text-slate-800')}>{score} / {total}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Độ chính xác</span>
                <span className={cn('font-bold', pct >= 70 ? 'text-emerald-400' : 'text-amber-400')}>{pct}%</span>
              </div>
              <div className={cn('w-full h-2.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                <div className={cn('h-full rounded-full transition-all duration-1000', pct >= 70 ? 'bg-emerald-500' : 'bg-amber-500')}
                  style={{ width: show ? `${pct}%` : '0%' }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={onReadAgain}
              className="w-full py-3 rounded-2xl border border-indigo-500/40 text-indigo-400 font-semibold text-sm hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2">
              <FaRedo size={12} /> Đọc lại
            </button>
            <button onClick={onBackList}
              className="w-full py-3 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
              <FaTags size={12} /> Chọn bài khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TOPIC SCORE MODAL — shown when user clicks an already-completed topic
// ═══════════════════════════════════════════════════════════════════════════════
function TopicScoreModal({ t, isDark, topic, progress, onContinue, onRetry, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShow(true), 60); return () => clearTimeout(id); }, []);

  const { score, total, pct, stars, passageTitle, completedAt } = progress;
  const emoji = pct >= 90 ? '🏆' : pct >= 60 ? '🎉' : '💪';
  const msg   = pct >= 90 ? 'Xuất sắc!' : pct >= 60 ? 'Tốt lắm!' : 'Cố gắng thêm!';
  const icon  = getTopicIcon(topic?.name || '');
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden text-center transition-all duration-500',
          isDark ? 'bg-[#16181f] border-white/10' : 'bg-white border-slate-200',
          show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8',
        )}>
        {/* Rainbow top strip */}
        <div className="h-2 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Floating confetti dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <div key={i}
              className={cn('absolute rounded-full opacity-40 animate-bounce',
                ['bg-indigo-400','bg-purple-400','bg-pink-400','bg-amber-400','bg-emerald-400'][i % 5])}
              style={{
                width:  `${6 + (i % 4) * 3}px`,
                height: `${6 + (i % 4) * 3}px`,
                left:   `${(i * 43 + 5) % 95}%`,
                top:    `${(i * 31 + 8) % 55}%`,
                animationDelay:    `${(i * 0.18) % 1.2}s`,
                animationDuration: `${1.3 + (i % 3) * 0.4}s`,
              }} />
          ))}
        </div>

        <div className="relative px-8 pt-8 pb-10">
          {/* Topic icon / emoji */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-4xl border
            bg-indigo-500/10 border-indigo-500/20">
            {icon}
          </div>

          <h2 className={cn('text-xl font-extrabold mb-0.5 truncate', isDark ? 'text-white' : 'text-slate-800')}>
            {topic?.name || 'Tổng hợp'}
          </h2>
          <p className={cn('text-xs mb-5', isDark ? 'text-gray-400' : 'text-slate-500')}>
            Kết quả lần làm gần nhất
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <FaStar key={s} size={28}
                className={s <= stars
                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : (isDark ? 'text-white/15' : 'text-slate-200')} />
            ))}
          </div>

          <p className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-slate-800')}>{emoji} {msg}</p>

          {/* Score card */}
          <div className={cn('rounded-2xl border p-4 mb-5 text-left', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200')}>
            {total > 0 && (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Câu đúng</span>
                  <span className={cn('font-extrabold', isDark ? 'text-white' : 'text-slate-800')}>{score} / {total}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Độ chính xác</span>
                  <span className={cn('font-bold', pct >= 70 ? 'text-emerald-400' : 'text-amber-400')}>{pct}%</span>
                </div>
                <div className={cn('w-full h-2 rounded-full overflow-hidden mb-3', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                  <div className={cn('h-full rounded-full transition-all duration-1000', pct >= 70 ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: show ? `${pct}%` : '0%' }} />
                </div>
              </>
            )}
            {passageTitle && (
              <div className="flex items-start gap-2 mt-1">
                <FaBookOpen size={11} className={cn('mt-0.5 shrink-0', isDark ? 'text-indigo-300' : 'text-indigo-500')} />
                <span className={cn('text-xs line-clamp-2', isDark ? 'text-gray-400' : 'text-slate-500')}>
                  Bài đã đọc: <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-700')}>{passageTitle}</span>
                </span>
              </div>
            )}
            {dateStr && (
              <div className={cn('text-xs mt-2', isDark ? 'text-gray-500' : 'text-slate-400')}>
                <FaClock size={10} className="inline mr-1" />Hoàn thành: {dateStr}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={onContinue}
              className="w-full py-3 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
              <FaArrowRight size={12} /> Làm thêm bài mới
            </button>
            {onRetry && (
              <button onClick={onRetry}
                className="w-full py-3 rounded-2xl border border-indigo-500/40 text-indigo-400 font-semibold text-sm hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2">
                <FaRedo size={12} /> Làm lại bài này
              </button>
            )}
            <button onClick={onClose}
              className={cn('w-full py-3 rounded-2xl border font-semibold text-sm transition-colors',
                isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 0 — Topic Grid
// ═══════════════════════════════════════════════════════════════════════════════
function TopicsPhase({ t, isDark, onSelectTopic, onRetryPassage, topicProgress }) {
  const [topics,        setTopics]        = useState([]);
  const [uncategorized, setUncategorized] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [scoreModal,    setScoreModal]    = useState(null); // { topic, progress }

  useEffect(() => {
    setLoading(true);
    getReadingTopics()
      .then(r => {
        setTopics(r.data.data?.topics || []);
        setUncategorized(r.data.data?.uncategorized || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const BAND = {
    beginner:     'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    intermediate: 'from-amber-500/20  to-amber-600/5  border-amber-500/20',
    advanced:     'from-rose-500/20   to-rose-600/5   border-rose-500/20',
  };

  const handleTopicClick = (topic) => {
    const id = topic?._id || 'uncategorized';
    const prog = topicProgress?.[id];
    if (prog) {
      setScoreModal({ topic, progress: prog });
    } else {
      onSelectTopic(topic);
    }
  };

  return (
    <>
      {/* Topic score modal */}
      {scoreModal && (
        <TopicScoreModal
          t={t} isDark={isDark}
          topic={scoreModal.topic}
          progress={scoreModal.progress}
          onContinue={() => { setScoreModal(null); onSelectTopic(scoreModal.topic); }}
          onRetry={() => {
              setScoreModal(null);
              if (scoreModal.progress.passageId) {
                onRetryPassage(scoreModal.topic, scoreModal.progress.passageId);
              } else {
                onSelectTopic(scoreModal.topic);
              }
            }}
          onClose={() => setScoreModal(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── HERO BANNER ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          <div className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-linear-to-br from-[#0f1f3d] via-[#0d2d4a] to-[#0a1628]'
              : 'bg-linear-to-br from-[#0369a1] via-[#0284c7] to-[#0ea5e9]',
          )} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          {/* Book decoration */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[80px] opacity-10 pointer-events-none select-none -rotate-6">📖</div>

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-2xl">
                    📖
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Luyện thi IELTS</p>
                    <h1 className="text-white text-2xl font-black leading-tight">Luyện Đọc</h1>
                  </div>
                </div>
                <p className="text-white/75 text-sm max-w-md leading-relaxed">
                  Luyện đọc hiểu với bài đọc thực tế theo chuẩn{' '}
                  <span className="font-bold text-white">IELTS</span> — trả lời câu hỏi và nhận điểm chi tiết.
                </p>
              </div>

              {/* Stats chips */}
              <div className="flex flex-wrap md:flex-col gap-2 md:items-end shrink-0">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                  <FaBookOpen className="text-white/80 text-sm" />
                  <span className="text-white font-black text-lg leading-none">{topics.length}</span>
                  <span className="text-white/70 text-xs">chủ đề</span>
                </div>
                {Object.keys(topicProgress || {}).filter(k => topicProgress[k]).length > 0 && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                    <FaCheck className="text-emerald-300 text-sm" />
                    <span className="text-white font-black text-lg leading-none">
                      {Object.keys(topicProgress || {}).filter(k => topicProgress[k]).length}
                    </span>
                    <span className="text-white/70 text-xs">đã làm</span>
                  </div>
                )}
              </div>
            </div>

            {/* Overall progress bar */}
            {topics.length > 0 && (
              <div className="mt-5">
                {(() => {
                  const done = Object.keys(topicProgress || {}).filter(k => topicProgress[k]).length;
                  const total = topics.length + (uncategorized > 0 ? 1 : 0);
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex justify-between text-xs text-white/70 mb-1.5">
                        <span>Tiến độ tổng thể</span>
                        <span className="font-bold text-white">{done} / {total} chủ đề</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
                        <div className="h-full rounded-full bg-white/90 transition-all duration-700"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ── TOPIC GRID ──────────────────────────────────────────────── */}
        <div>
          <h2 className={cn('text-base font-bold mb-4', isDark ? 'text-white' : 'text-slate-700')}>
            Chọn chủ đề luyện đọc
          </h2>

        {loading ? (
          <div className="flex justify-center py-24"><FiLoader className="animate-spin text-indigo-400" size={32} /></div>
        ) : (topics.length === 0 && uncategorized === 0) ? (
          <div className="text-center py-24 text-gray-400">
            <FaBookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có bài đọc nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(topic => {
              const prog = topicProgress?.[topic._id];
              const done = !!prog;
              const pct  = prog?.pct || 0;

              return (
                <SharedTopicCard
                  key={topic._id}
                  topic={topic}
                  isDark={isDark}
                  t={t}
                  done={done}
                  pct={pct}
                  countLabel={topic.passage_count ? `${topic.passage_count} bài đọc` : ''}
                  fallbackIcon={getTopicIcon(topic.name)}
                  onClick={() => handleTopicClick(topic)}
                />
              );
            })}

            {/* Uncategorised tile */}
            {uncategorized > 0 && (() => {
              const prog = topicProgress?.['uncategorized'];
              const done = !!prog;
              const pct  = prog?.pct || 0;
              return (
                <SharedTopicCard
                  key="uncategorized"
                  topic={{ name: 'Tổng hợp', description: 'Các bài đọc chưa phân loại chủ đề', level: 'beginner' }}
                  isDark={isDark}
                  t={t}
                  done={done}
                  pct={pct}
                  countLabel={`${uncategorized} bài đọc`}
                  fallbackIcon="📂"
                  onClick={() => handleTopicClick(null)}
                />
              );
            })()}
          </div>
        )}
        </div>{/* end topic grid section */}
      </div>{/* end space-y-8 wrapper */}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 1 — Passage List within topic
// ═══════════════════════════════════════════════════════════════════════════════
function PassageListPhase({ t, isDark, selectedTopic, onStart, onBack }) {
  const [passages,    setPassages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const fetchPassages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, search: search.trim(), cefr_level: levelFilter };
      if (selectedTopic) params.topic = selectedTopic._id;
      else params.uncategorized = '1';
      const res = await getReadingPassages(params);
      setPassages(res.data.data?.passages || []);
      setTotalPages(res.data.data?.totalPages || 1);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, search, levelFilter, selectedTopic]);

  useEffect(() => { fetchPassages(); }, [fetchPassages]);

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const title  = selectedTopic ? selectedTopic.name : 'Tổng hợp';
  const icon   = selectedTopic ? getTopicIcon(selectedTopic.name) : '📂';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <FaChevronLeft size={15} />
        </button>
        <div>
          <h1 className={cn('text-2xl font-extrabold leading-snug', isDark ? 'text-white' : 'text-slate-800')}>
            {icon} {title}
          </h1>
          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-slate-500')}>Chọn bài đọc để bắt đầu</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className={cn('flex items-center gap-2 flex-1 min-w-52 rounded-xl border px-3 py-2', t.card, t.border)}>
          <FaSearch className={isDark ? 'text-gray-500' : 'text-slate-400'} size={13} />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm tiêu đề bài đọc…"
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setLevelFilter(''); setPage(1); }}
            className={cn('px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
              !levelFilter ? 'bg-indigo-500 text-white border-indigo-500' :
              (isDark ? 'border-white/10 text-gray-400 hover:border-white/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'))}>
            Tất cả
          </button>
          {levels.map(l => (
            <button key={l} onClick={() => { setLevelFilter(l); setPage(1); }}
              className={cn('px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                levelFilter === l ? 'bg-indigo-500 text-white border-indigo-500' :
                (isDark ? 'border-white/10 text-gray-400 hover:border-white/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'))}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24"><FiLoader className="animate-spin text-indigo-400" size={32} /></div>
      ) : passages.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <FaBookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Không có bài đọc nào phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {passages.map(p => {
            const lm  = getLevelMeta(p.cefr_level || p.level);
            const min = estimateMinutes(p);
            return (
              <button key={p._id} onClick={() => onStart(p)}
                className={cn('group text-left rounded-2xl border p-5 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]', t.card, t.border)}>
                {p.image_url && (
                  <div className="w-full h-28 mb-4 rounded-xl overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', lm.color)}>{lm.label}</span>
                  {p.vocab_highlights?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      ✨ {p.vocab_highlights.length} từ
                    </span>
                  )}
                </div>
                <h3 className={cn('font-bold text-base mb-1 leading-snug line-clamp-2', isDark ? 'text-white' : 'text-slate-800')}>{p.title}</h3>
                {p.passage_preview && (
                  <p className={cn('text-xs leading-relaxed line-clamp-2 mb-3', isDark ? 'text-gray-400' : 'text-slate-500')}>{p.passage_preview}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><FaClock size={11} /> {min} phút</span>
                  {p.word_count > 0 && <span className="flex items-center gap-1"><FaLayerGroup size={11} /> {p.word_count} từ</span>}
                  {p.questions?.length > 0 && <span className="flex items-center gap-1"><FaStar size={11} /> {p.questions.length} câu</span>}
                </div>
                <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold group-hover:bg-indigo-400 transition-colors">
                  Bắt đầu đọc <FaArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-sm disabled:opacity-30 hover:bg-indigo-500/30 transition-colors flex items-center gap-1">
            <FaChevronLeft size={11} /> Trước
          </button>
          <span className="px-4 py-2 text-sm text-gray-400">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-sm disabled:opacity-30 hover:bg-indigo-500/30 transition-colors flex items-center gap-1">
            Tiếp <FaChevronRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 2 — Vocabulary Preview flashcard
// ═══════════════════════════════════════════════════════════════════════════════
function VocabPreviewPhase({ passage, isDark, onStartReading, onBack }) {
  const highlights = passage.vocab_highlights || [];
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (highlights.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-6">Bài đọc này chưa có từ vựng highlight.</p>
        <button onClick={onStartReading}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold text-base transition-colors">
          Đọc bài ngay →
        </button>
      </div>
    );
  }

  const card     = highlights[idx];
  const total    = highlights.length;
  const colorCls = POS_COLORS[card.pos] || POS_COLORS.other;
  const posLabel = POS_LABELS[card.pos] || '';

  const next = () => { setFlipped(false); setTimeout(() => setIdx(i => Math.min(i + 1, total - 1)), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setIdx(i => Math.max(i - 1, 0)), 150); };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <FaChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className={cn('font-bold text-lg', isDark ? 'text-white' : 'text-slate-800')}>📚 Xem trước từ vựng</h2>
          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-slate-500')}>{passage.title}</p>
        </div>
        <span className="text-sm text-gray-400">{idx + 1} / {total}</span>
      </div>

      <div className={cn('w-full h-1.5 rounded-full mb-8', isDark ? 'bg-white/10' : 'bg-slate-200')}>
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      <div onClick={() => setFlipped(f => !f)}
        className={cn(
          'w-full rounded-3xl border cursor-pointer select-none transition-all duration-300',
          'flex flex-col items-center justify-center text-center p-10 min-h-56',
          isDark ? 'bg-[#1C1E28] border-white/10 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-400',
          flipped ? (isDark ? 'bg-indigo-950/60 border-indigo-500/40' : 'bg-indigo-50 border-indigo-300') : '',
        )}>
        {!flipped ? (
          <>
            <span className={cn('text-3xl font-extrabold mb-3 tracking-wide', isDark ? 'text-white' : 'text-slate-800')}>{card.word}</span>
            {posLabel && <span className={`text-xs italic border rounded px-2 py-0.5 ${colorCls}`}>{posLabel}</span>}
            <p className="mt-4 text-xs text-gray-500">👆 Bấm để xem nghĩa</p>
          </>
        ) : (
          <>
            <span className={cn('text-lg font-semibold mb-1', isDark ? 'text-indigo-300' : 'text-indigo-600')}>{card.word}</span>
            {posLabel && <span className={`text-xs italic border rounded px-2 py-0.5 mb-3 ${colorCls}`}>{posLabel}</span>}
            <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-800')}>👉 {card.meaning || '(chưa có nghĩa)'}</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={prev} disabled={idx === 0}
          className="flex-1 py-3 rounded-2xl border text-sm font-semibold disabled:opacity-30 transition-colors border-white/10 text-gray-400 hover:bg-white/5 flex items-center justify-center gap-2">
          <FaChevronLeft size={12} /> Trước
        </button>
        {idx < total - 1 ? (
          <button onClick={next}
            className="flex-1 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            Tiếp <FaChevronRight size={12} />
          </button>
        ) : (
          <button onClick={onStartReading}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <FaBookOpen size={13} /> Bắt đầu đọc
          </button>
        )}
      </div>
      <div className="text-center mt-4">
        <button onClick={onStartReading} className="text-xs text-gray-500 hover:text-gray-400 underline underline-offset-2">Bỏ qua, đọc ngay</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 3 — Reading Article
// ═══════════════════════════════════════════════════════════════════════════════
function ReadingArticlePhase({ passage, isDark, onDone, onBack }) {
  const [fontSize, setFontSize] = useState(15);
  const lm = getLevelMeta(passage.cefr_level || passage.level);
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <FaChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className={cn('font-bold text-lg truncate', isDark ? 'text-white' : 'text-slate-800')}>{passage.title}</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', lm.color)}>{lm.label}</span>
            {passage.word_count > 0 && <span className="text-xs text-gray-500">{passage.word_count} từ</span>}
            <span className="text-xs text-gray-500">⏱ {estimateMinutes(passage)} phút</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize(s => Math.max(12, s - 1))} className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-bold">A-</button>
          <button onClick={() => setFontSize(s => Math.min(22, s + 1))} className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-bold">A+</button>
        </div>
      </div>

      {passage.vocab_highlights?.length > 0 && (
        <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl mb-5 text-xs',
          isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600')}>
          <span>✨</span>
          <span>Từ được <span className="underline decoration-dashed">gạch chân vàng</span> — bấm để xem nghĩa</span>
        </div>
      )}

      <div className={cn('rounded-2xl border p-6 leading-[1.9]', isDark ? 'bg-[#1C1E28] border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
        <p style={{ fontSize }} className={isDark ? 'text-gray-200' : 'text-slate-700'}>
          <HighlightedPassage text={passage.passage} highlights={passage.vocab_highlights} />
        </p>
      </div>

      <button onClick={onDone}
        className="w-full mt-6 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-base transition-colors flex items-center justify-center gap-2">
        Đã đọc xong — Làm câu hỏi <FaArrowRight size={14} />
      </button>
      {!passage.questions?.length && (
        <p className="text-center text-xs text-gray-500 mt-2">Bài này chưa có câu hỏi — bạn sẽ chơi mini game.</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 4 — Comprehension Questions
// ═══════════════════════════════════════════════════════════════════════════════
function QuestionsPhase({ passage, isDark, onResult }) {
  const questions = passage.questions || [];
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results,   setResults]   = useState({});

  useEffect(() => {
    if (questions.length === 0) onResult({ score: 0, total: 0, results: {}, answers: {} });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) return null;

  const handleSubmit = () => {
    let correct = 0;
    const res = {};
    questions.forEach((q, i) => {
      const userAns    = (answers[i] ?? '').toString().toLowerCase().trim();
      const correctAns = (q.correct_answer ?? q.answer ?? '').toString().toLowerCase().trim();
      const ok = userAns === correctAns || userAns === correctAns.charAt(0);
      res[i] = ok;
      if (ok) correct++;
    });
    setResults(res);
    setSubmitted(true);
    onResult({ score: correct, total: questions.length, results: res, answers });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className={cn('font-extrabold text-xl mb-6', isDark ? 'text-white' : 'text-slate-800')}>🧩 Câu hỏi hiểu bài</h2>
      <div className="space-y-5">
        {questions.map((q, i) => {
          const type    = q.question_type || q.type || 'multiple_choice';
          const options = q.options || [];
          const ok      = results[i];
          return (
            <div key={i} className={cn('rounded-2xl border p-5 transition-all',
              !submitted ? (isDark ? 'bg-[#1C1E28] border-white/8' : 'bg-white border-slate-200') :
              ok ? 'bg-emerald-900/15 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30')}>
              <p className={cn('font-semibold text-sm mb-4', isDark ? 'text-white' : 'text-slate-800')}>
                {i + 1}. {q.question_text || q.text || q.question}
              </p>
              {type === 'true_false' && (
                <div className="flex gap-3">
                  {['True', 'False'].map(opt => {
                    const v   = opt.toLowerCase();
                    const sel = answers[i] === v;
                    const cor = (q.correct_answer ?? q.answer)?.toLowerCase() === v && submitted;
                    const wrg = submitted && sel && !cor;
                    return (
                      <button key={opt} disabled={submitted}
                        onClick={() => setAnswers(a => ({ ...a, [i]: v }))}
                        className={cn('flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2',
                          wrg ? 'border-red-500/50 bg-red-900/20 text-red-300' :
                          cor ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-300' :
                          sel ? 'border-indigo-500/50 bg-indigo-900/20 text-indigo-300' :
                               (isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'))}>
                        {submitted && cor && <FaCheck size={11} />}
                        {submitted && wrg && <FaTimes size={11} />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {type !== 'true_false' && options.length > 0 && (
                <div className="space-y-2">
                  {options.map((opt, oi) => {
                    const val = (opt.value ?? opt.text ?? opt ?? '').toString();
                    const lbl = opt.label ?? opt.text ?? opt ?? '';
                    const sel = answers[i] === val;
                    const cor = submitted && ((q.correct_answer ?? q.answer) === val);
                    const wrg = submitted && sel && !cor;
                    return (
                      <button key={oi} disabled={submitted}
                        onClick={() => setAnswers(a => ({ ...a, [i]: val }))}
                        className={cn('w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2',
                          wrg ? 'border-red-500/50 bg-red-900/20 text-red-300' :
                          cor ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-300' :
                          sel ? 'border-indigo-500/50 bg-indigo-900/20 text-indigo-300' :
                               (isDark ? 'border-white/10 bg-white/3 text-gray-300 hover:bg-white/8' : 'border-slate-200 text-slate-600 hover:bg-slate-50'))}>
                        {submitted && cor && <FaCheck size={11} className="text-emerald-400 shrink-0" />}
                        {submitted && wrg && <FaTimes size={11} className="text-red-400 shrink-0" />}
                        {typeof lbl === 'string' ? lbl : JSON.stringify(lbl)}
                      </button>
                    );
                  })}
                </div>
              )}
              {(type === 'fill_blank' || type === 'short_answer') && (
                <input type="text" value={answers[i] || ''}
                  onChange={e => !submitted && setAnswers(a => ({ ...a, [i]: e.target.value }))}
                  disabled={submitted} placeholder="Nhập câu trả lời…"
                  className={cn('w-full rounded-xl px-4 py-2 text-sm border outline-none transition-all',
                    isDark ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400',
                    submitted && (ok ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'))} />
              )}
              {submitted && !ok && (
                <p className="mt-2 text-xs text-emerald-400">✅ Đáp án đúng: <strong>{q.correct_answer ?? q.answer}</strong></p>
              )}
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <button onClick={handleSubmit}
          className="w-full mt-6 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-base transition-colors">
          Kiểm tra đáp án
        </button>
      ) : (
        <p className="text-center text-sm text-gray-400 mt-6 animate-pulse">Đang chuyển sang mini game…</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 5 — Mini Game: Word ↔ Meaning matching
// ═══════════════════════════════════════════════════════════════════════════════
function MinigamePhase({ passage, isDark, onDone }) {
  const raw = useMemo(() => (passage.vocab_highlights || []).filter(v => v.word && v.meaning), [passage]);
  const vocab = useMemo(() => [...raw].sort(() => Math.random() - 0.5).slice(0, Math.min(6, raw.length)), [raw]);
  const meanings = useMemo(() => vocab.map((v, i) => ({ meaning: v.meaning, vocabIdx: i })).sort(() => Math.random() - 0.5), [vocab]);

  const [leftSel,  setLeftSel]  = useState(null);
  const [rightSel, setRightSel] = useState(null);
  const [matched,  setMatched]  = useState({});
  const [wrong,    setWrong]    = useState(null);
  const [done,     setDone]     = useState(false);

  if (vocab.length < 2) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-6">Bài này không đủ từ vựng để chơi mini game.</p>
        <button onClick={onDone} className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-colors">Xem kết quả</button>
      </div>
    );
  }

  const matchedVocab   = new Set(Object.keys(matched).map(Number));
  const matchedMeaning = new Set(Object.values(matched).map(Number));

  const attemptMatch = (li, ri) => {
    const correctRi = meanings.findIndex(m => m.vocabIdx === li);
    if (ri === correctRi) {
      const next = { ...matched, [li]: ri };
      setMatched(next);
      setLeftSel(null); setRightSel(null);
      if (Object.keys(next).length === vocab.length) setDone(true);
    } else {
      setWrong({ li, ri });
      setTimeout(() => { setWrong(null); setLeftSel(null); setRightSel(null); }, 700);
    }
  };

  const handleLeft = (i) => {
    if (matchedVocab.has(i)) return;
    setLeftSel(i);
    if (rightSel !== null) attemptMatch(i, rightSel);
  };
  const handleRight = (ri) => {
    if (matchedMeaning.has(ri)) return;
    setRightSel(ri);
    if (leftSel !== null) attemptMatch(leftSel, ri);
  };

  const leftCls = (i) => {
    if (matchedVocab.has(i))  return 'border-emerald-500/50 bg-emerald-900/20 text-emerald-300 cursor-default';
    if (wrong?.li === i)       return 'border-red-500/60 bg-red-900/20 text-red-300 scale-95';
    if (leftSel === i)         return 'border-indigo-400 bg-indigo-900/30 text-indigo-200 scale-[1.03] shadow-lg';
    return isDark ? 'border-white/10 text-gray-200 hover:border-indigo-400/50 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50';
  };
  const rightCls = (ri) => {
    if (matchedMeaning.has(ri)) return 'border-emerald-500/50 bg-emerald-900/20 text-emerald-300 cursor-default';
    if (wrong?.ri === ri)        return 'border-red-500/60 bg-red-900/20 text-red-300 scale-95';
    if (rightSel === ri)         return 'border-violet-400 bg-violet-900/30 text-violet-200 scale-[1.03] shadow-lg';
    return isDark ? 'border-white/10 text-gray-300 hover:border-violet-400/50 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-900/30">
          <FaGamepad size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className={cn('font-extrabold text-xl', isDark ? 'text-white' : 'text-slate-800')}>🎮 Nối từ với nghĩa</h2>
          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-slate-500')}>
            {matchedVocab.size} / {vocab.length} cặp đã ghép
          </p>
        </div>
        {/* Progress bar */}
        <div className={cn('w-28 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-200')}>
          <div className="h-full bg-linear-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(matchedVocab.size / vocab.length) * 100}%` }} />
        </div>
      </div>

      {/* Hint */}
      <div className={cn('text-xs px-4 py-2 rounded-xl mb-6 flex items-center gap-2',
        isDark ? 'bg-violet-500/10 border border-violet-500/20 text-violet-300' : 'bg-violet-50 border border-violet-200 text-violet-700')}>
        💡 Bấm một từ tiếng Anh bên trái, rồi bấm nghĩa tiếng Việt bên phải để ghép cặp
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {vocab.map((v, i) => (
            <button key={i} disabled={matchedVocab.has(i)} onClick={() => handleLeft(i)}
              className={cn('w-full px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all duration-150', leftCls(i))}>
              {matchedVocab.has(i) && <FaCheck size={10} className="inline mr-1.5 text-emerald-400" />}
              {v.word}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {meanings.map((m, ri) => (
            <button key={ri} disabled={matchedMeaning.has(ri)} onClick={() => handleRight(ri)}
              className={cn('w-full px-4 py-3 rounded-xl border text-sm text-left leading-snug transition-all duration-150', rightCls(ri))}>
              {matchedMeaning.has(ri) && <FaCheck size={10} className="inline mr-1.5 text-emerald-400" />}
              {m.meaning}
            </button>
          ))}
        </div>
      </div>

      {done && (
        <div className="mt-8 text-center">
          <div className="text-4xl mb-2 animate-bounce">🎉</div>
          <p className={cn('font-extrabold text-xl mb-1', isDark ? 'text-white' : 'text-slate-800')}>Hoàn thành!</p>
          <p className="text-gray-400 text-sm mb-6">Bạn đã ghép đúng tất cả {vocab.length} cặp từ!</p>
          <button onClick={onDone}
            className="px-10 py-3.5 rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 text-white font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-indigo-900/30">
            Xem kết quả <FaArrowRight size={13} className="inline ml-1" />
          </button>
        </div>
      )}

      {!done && (
        <button onClick={onDone}
          className={cn('w-full mt-6 py-3 rounded-2xl border text-sm transition-colors',
            isDark ? 'border-white/10 text-gray-500 hover:text-gray-400 hover:bg-white/3' : 'border-slate-200 text-slate-400 hover:text-slate-500 hover:bg-slate-50')}>
          Bỏ qua → Xem kết quả
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReadingPractice() {
  const { isDark } = useTheme();
  const t          = isDark ? darkTheme : theme;
  const { user }   = useAuth();

  const LS_KEY = user?._id
    ? `reading_topic_progress_${user._id}`
    : 'reading_topic_progress'; // fallback

  const [phase,         setPhase]         = useState(PHASE.TOPICS);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [passage,       setPassage]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [showModal,     setShowModal]     = useState(false);

  // ── Topic completion tracking (localStorage, per-user) ────────────────────
  const [topicProgress, setTopicProgress] = useState({});

  useEffect(() => {
    try {
      setTopicProgress(JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
    } catch { setTopicProgress({}); }
  }, [LS_KEY]);

  // Topic selected → show passage list
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setPhase(PHASE.LIST);
  };

  // Retry a specific passage directly from topic score modal
  const handleRetryPassage = (topic, passageId) => {
    setSelectedTopic(topic);
    handleStart({ _id: passageId });
  };

  // Passage card clicked → load full data
  const handleStart = async (preview) => {
    setLoading(true);
    try {
      const res  = await getReadingPassageById(preview._id);
      const full = res.data.data;
      setPassage(full);
      setPhase((full?.vocab_highlights || []).length > 0 ? PHASE.VOCAB : PHASE.READING);
    } catch {
      setPassage(preview);
      setPhase(PHASE.READING);
    } finally {
      setLoading(false);
    }
  };

  // Reading done → questions or minigame
  const handleReadingDone = () => {
    if (passage?.questions?.length > 0) {
      setPhase(PHASE.QUESTIONS);
    } else {
      setResult({ score: 0, total: 0, results: {}, answers: {} });
      const hasGame = (passage?.vocab_highlights || []).filter(v => v.word && v.meaning).length >= 2;
      setPhase(hasGame ? PHASE.MINIGAME : PHASE.RESULT);
    }
  };

  // Questions done → minigame or result
  const handleQuestionsResult = (r) => {
    setResult(r);
    const hasGame = (passage?.vocab_highlights || []).filter(v => v.word && v.meaning).length >= 2;
    setPhase(hasGame ? PHASE.MINIGAME : PHASE.RESULT);
  };

  // Minigame done → result + modal
  const handleMinigameDone = () => setPhase(PHASE.RESULT);

  // Modal opens when RESULT phase is entered; also save topic progress
  useEffect(() => {
    if (phase === PHASE.RESULT) {
      setShowModal(true);

      // Persist best score for this topic (per-user key)
      if (passage) {
        const topicId = selectedTopic?._id || 'uncategorized';
        const pct     = result && result.total > 0
          ? Math.round((result.score / result.total) * 100)
          : 100;
        const stars   = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
        const existing = (() => {
          try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
          catch { return {}; }
        })();
        const prev = existing[topicId];
        // Save if first time or score improved
        if (!prev || pct >= prev.pct) {
          existing[topicId] = {
            score:        result?.score ?? 0,
            total:        result?.total ?? 0,
            pct,
            stars,
            passageId:    passage._id,
            passageTitle: passage.title,
            completedAt:  Date.now(),
          };
          localStorage.setItem(LS_KEY, JSON.stringify(existing));
          setTopicProgress({ ...existing });
        }
      }
    }
  }, [phase]);

  const handleReadAgain = () => {
    setResult(null); setShowModal(false); setPhase(PHASE.READING);
  };
  const handleBackList = () => {
    setPassage(null); setResult(null); setShowModal(false); setPhase(PHASE.LIST);
  };
  const handleBackTopics = () => {
    setPassage(null); setResult(null); setShowModal(false);
    setSelectedTopic(null); setPhase(PHASE.TOPICS);
  };

  const isInSession = ![PHASE.TOPICS, PHASE.LIST].includes(phase);
  const DOTS = [PHASE.VOCAB, PHASE.READING, PHASE.QUESTIONS, PHASE.MINIGAME];
  const phaseLabel = {
    [PHASE.TOPICS]:    'Luyện Đọc',
    [PHASE.LIST]:      'Chọn bài đọc',
    [PHASE.VOCAB]:     'Từ vựng',
    [PHASE.READING]:   'Đọc bài',
    [PHASE.QUESTIONS]: 'Câu hỏi',
    [PHASE.MINIGAME]:  'Mini Game',
    [PHASE.RESULT]:    'Kết quả',
  }[phase];

  return (
    <LearnLayout breadcrumbs={[{ label: '📖 Luyện Đọc' }]}>
      <div className={cn('min-h-screen', t.page)}>

        {/* Top bar for session phases */}
        {isInSession && (
          <div className={cn('sticky top-0 z-30 border-b backdrop-blur-sm',
            isDark ? 'bg-[#0F1117]/90 border-white/8' : 'bg-white/90 border-slate-200')}>
            {/* Row 1: back + title */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
              <button onClick={handleBackList}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <FaChevronLeft size={14} />
              </button>
              <span className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-slate-700')}>{phaseLabel}</span>
              <span className={cn('ml-auto text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>
                {DOTS.indexOf(phase) + 1 > 0 ? `${Math.max(DOTS.indexOf(phase), 0) + 1} / ${DOTS.length}` : ''}
              </span>
            </div>

            {/* Row 2: step progress bar */}
            <div className="flex items-center gap-0 px-4 pb-3">
              {DOTS.map((p, i) => {
                const currentIdx = DOTS.indexOf(phase);
                const isDone     = currentIdx > i;
                const isActive   = phase === p;
                const STEP_LABELS = {
                  [PHASE.VOCAB]:     'Từ vựng',
                  [PHASE.READING]:   'Đọc bài',
                  [PHASE.QUESTIONS]: 'Câu hỏi',
                  [PHASE.MINIGAME]:  'Mini game',
                };
                return (
                  <React.Fragment key={p}>
                    {/* Step node */}
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 shrink-0',
                        isDone    ? 'bg-indigo-500 border-indigo-500 text-white' :
                        isActive  ? 'bg-indigo-500 border-indigo-400 text-white scale-110 shadow-md shadow-indigo-500/40' :
                                    (isDark ? 'bg-white/5 border-white/15 text-gray-500' : 'bg-slate-100 border-slate-300 text-slate-400'),
                      )}>
                        {isDone ? <FaCheck size={10} /> : i + 1}
                      </div>
                      <span className={cn('text-[10px] font-medium whitespace-nowrap transition-colors',
                        isActive  ? (isDark ? 'text-indigo-400' : 'text-indigo-600') :
                        isDone    ? (isDark ? 'text-indigo-400/70' : 'text-indigo-400') :
                                    (isDark ? 'text-gray-600' : 'text-slate-400'))}>
                        {STEP_LABELS[p]}
                      </span>
                    </div>
                    {/* Connector line */}
                    {i < DOTS.length - 1 && (
                      <div className={cn('flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500',
                        DOTS.indexOf(phase) > i ? 'bg-indigo-500' : (isDark ? 'bg-white/10' : 'bg-slate-200'))} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <FiLoader className="animate-spin text-indigo-400" size={36} />
          </div>
        )}

        {/* Phase rendering */}
        {phase === PHASE.TOPICS && (
          <TopicsPhase t={t} isDark={isDark} onSelectTopic={handleSelectTopic} onRetryPassage={handleRetryPassage} topicProgress={topicProgress} />
        )}
        {phase === PHASE.LIST && (
          <PassageListPhase t={t} isDark={isDark} selectedTopic={selectedTopic} onStart={handleStart} onBack={handleBackTopics} />
        )}
        {phase === PHASE.VOCAB && passage && (
          <VocabPreviewPhase passage={passage} isDark={isDark}
            onStartReading={() => setPhase(PHASE.READING)} onBack={handleBackList} />
        )}
        {phase === PHASE.READING && passage && (
          <ReadingArticlePhase passage={passage} isDark={isDark}
            onDone={handleReadingDone}
            onBack={() => setPhase((passage.vocab_highlights || []).length > 0 ? PHASE.VOCAB : PHASE.LIST)} />
        )}
        {phase === PHASE.QUESTIONS && passage && (
          <QuestionsPhase passage={passage} isDark={isDark} onResult={handleQuestionsResult} />
        )}
        {phase === PHASE.MINIGAME && passage && (
          <MinigamePhase passage={passage} isDark={isDark} onDone={handleMinigameDone} />
        )}
        {phase === PHASE.RESULT && passage && result && !showModal && (
          <div className="max-w-md mx-auto px-4 py-12 text-center">
            <FaTrophy size={48} className="text-amber-400 mx-auto mb-4" />
            <button onClick={() => setShowModal(true)}
              className="mt-4 px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-colors">
              Xem kết quả
            </button>
          </div>
        )}

        {/* Completion Modal */}
        {showModal && passage && result && (
          <CompletionModal
            result={result} passage={passage} isDark={isDark}
            onReadAgain={handleReadAgain}
            onBackList={handleBackList}
          />
        )}
      </div>
    </LearnLayout>
  );
}
