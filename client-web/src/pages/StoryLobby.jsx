import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getStories, getStoryProgress } from '../services/storyService';
import LearnLayout from '../components/learn/LearnLayout';
import {
  FaBook, FaLock, FaPlay, FaCheckCircle, FaSpinner,
  FaStar, FaFilter, FaSearch, FaTimes, FaUndo, FaTrophy,
  FaCoins, FaBolt,
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';

// ─── Constants ─────────────────────────────────────────────────────────────────
const THEMES = [
  { value: '',            label: 'Tất cả thể loại' },
  { value: 'daily_life',  label: '🏠 Cuộc sống hàng ngày' },
  { value: 'travel',      label: '✈️ Du lịch' },
  { value: 'mystery',     label: '🔍 Bí ẩn' },
  { value: 'romance',     label: '💕 Lãng mạn' },
  { value: 'adventure',   label: '⚔️ Phiêu lưu' },
  { value: 'sci_fi',      label: '🚀 Khoa học viễn tưởng' },
  { value: 'culture',     label: '🎎 Văn hóa' },
  { value: 'business',    label: '💼 Kinh doanh' },
];
const LEVELS = [
  { value: '',             label: 'Tất cả cấp độ' },
  { value: 'beginner',     label: '🌱 Cơ bản' },
  { value: 'intermediate', label: '🔥 Trung cấp' },
  { value: 'advanced',     label: '💎 Nâng cao' },
];
const LEVEL_STYLE = {
  beginner:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  intermediate: 'bg-amber-500/15   text-amber-400   border border-amber-500/30',
  advanced:     'bg-rose-500/15    text-rose-400    border border-rose-500/30',
};
const LEVEL_LABEL = {
  beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao',
};

// ─── helpers ───────────────────────────────────────────────────────────────────
function scoreLabel(avg) {
  if (avg >= 9)  return { text: 'Xuất sắc',   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30',  emoji: '🏆' };
  if (avg >= 7)  return { text: 'Giỏi',        color: 'text-indigo-400',  bg: 'bg-indigo-500/15  border-indigo-500/30',   emoji: '⭐' };
  if (avg >= 5)  return { text: 'Khá',         color: 'text-yellow-400',  bg: 'bg-yellow-500/15  border-yellow-500/30',   emoji: '👍' };
  return          { text: 'Cần cải thiện', color: 'text-rose-400',    bg: 'bg-rose-500/15    border-rose-500/30',     emoji: '💪' };
}

// ─── CompletedStoryModal ────────────────────────────────────────────────────────
function CompletedStoryModal({ story, onClose, onReplay, navigate }) {
  const { isDark } = useTheme();
  const [progress, setProgress] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getStoryProgress(story._id)
      .then(r => setProgress(r.data.data || []))
      .catch(() => setProgress([]))
      .finally(() => setLoading(false));
  }, [story._id]);

  // Sort parts and compute average score (scores stored 0-100 in DB)
  const parts = [...progress]
    .filter(p => p.current_story_part != null)
    .sort((a, b) => a.current_story_part - b.current_story_part);

  const avg10 = parts.length
    ? +(parts.reduce((s, p) => s + (p.score || 0), 0) / parts.length / 10).toFixed(1)
    : 0;

  const totalCoins = parts.reduce((s, p) => s + (p.coinsEarned || 0), 0);
  const totalExp   = parts.reduce((s, p) => s + (p.expEarned  || 0), 0);
  const label      = scoreLabel(avg10);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden',
          isDark ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition',
            isDark ? 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700'
          )}
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Header gradient */}
        <div className={cn(
          'px-6 pt-7 pb-5 text-center',
          isDark
            ? 'bg-linear-to-b from-yellow-500/10 to-transparent'
            : 'bg-linear-to-b from-yellow-50 to-transparent'
        )}>
          <div className="text-5xl mb-2">🎉</div>
          <h2 className={cn('text-xl font-black mb-0.5', isDark ? 'text-white' : 'text-slate-900')}>
            {story.title}
          </h2>
          <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>
            Đã hoàn thành · {story.total_parts} phần
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingCat size={150} text="Đang tải..." />
            </div>
          ) : (
            <>
              {/* Overall score badge */}
              <div className={cn(
                'flex items-center justify-between rounded-2xl px-5 py-4 border',
                isDark ? label.bg : label.bg.replace('/15', '/10')
              )}>
                <div>
                  <p className={cn('text-xs font-medium mb-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>Điểm trung bình</p>
                  <p className={cn('text-3xl font-black', label.color)}>{avg10}<span className="text-sm font-normal opacity-60">/10</span></p>
                </div>
                <div className="text-right">
                  <p className="text-3xl mb-0.5">{label.emoji}</p>
                  <p className={cn('text-sm font-bold', label.color)}>{label.text}</p>
                </div>
              </div>

              {/* Per-part breakdown */}
              {parts.length > 0 && (
                <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'border-white/8' : 'border-slate-100')}>
                  {parts.map((p, i) => {
                    const s10 = +(p.score / 10).toFixed(1);
                    const bar = scoreLabel(s10);
                    return (
                      <div
                        key={p._id || i}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3',
                          i < parts.length - 1 && (isDark ? 'border-b border-white/8' : 'border-b border-slate-100')
                        )}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                          isDark ? 'bg-white/8 text-gray-300' : 'bg-slate-100 text-slate-600'
                        )}>
                          {p.current_story_part}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                            <div
                              className={`h-full rounded-full transition-all ${s10 >= 7 ? 'bg-indigo-500' : s10 >= 5 ? 'bg-yellow-400' : 'bg-rose-400'}`}
                              style={{ width: `${Math.min(100, s10 * 10)}%` }}
                            />
                          </div>
                        </div>
                        <span className={cn('text-sm font-bold shrink-0', bar.color)}>{s10}/10</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rewards row */}
              {(totalCoins > 0 || totalExp > 0) && (
                <div className="flex gap-3">
                  {totalCoins > 0 && (
                    <div className={cn(
                      'flex-1 flex items-center gap-2 rounded-xl px-4 py-3 border',
                      isDark ? 'bg-yellow-400/8 border-yellow-400/20' : 'bg-yellow-50 border-yellow-200'
                    )}>
                      <FaCoins className="text-yellow-500" />
                      <span className="text-yellow-500 font-black">{totalCoins}</span>
                      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>Xu đã nhận</span>
                    </div>
                  )}
                  {totalExp > 0 && (
                    <div className={cn(
                      'flex-1 flex items-center gap-2 rounded-xl px-4 py-3 border',
                      isDark ? 'bg-purple-400/8 border-purple-400/20' : 'bg-purple-50 border-purple-200'
                    )}>
                      <FaBolt className="text-purple-500" />
                      <span className="text-purple-500 font-black">{totalExp}</span>
                      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>EXP đã nhận</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-2',
                    isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                  )}
                >
                  <FaTimes className="text-xs" /> Đóng
                </button>
                <button
                  onClick={onReplay}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
                >
                  <FaUndo className="text-xs" /> Chơi lại
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StoryCard ──────────────────────────────────────────────────────────────────
function StoryCard({ story, onClick }) {
  const completed  = story.completedParts || 0;
  const total      = story.total_parts || 1;
  const pct        = Math.round((completed / total) * 100);
  const isFinished = completed >= total;

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer rounded-2xl overflow-hidden
                 bg-white/5 border border-white/10 hover:border-purple-500/50
                 hover:shadow-xl hover:shadow-purple-500/10
                 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover image / placeholder */}
      <div className="relative h-40 bg-linear-to-br from-purple-600/30 to-indigo-700/30 overflow-hidden">
        {story.cover_image
          ? <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          : (
            <div className="w-full h-full flex items-center justify-center">
              <FaBook className="text-5xl text-purple-400/50" />
            </div>
          )
        }
        {/* Level badge */}
        <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm ${LEVEL_STYLE[story.level] || 'bg-gray-500/20 text-gray-400'}`}>
          {LEVEL_LABEL[story.level] || story.level}
        </span>
        {/* Finish crown */}
        {isFinished && (
          <div className="absolute top-3 left-3 bg-yellow-400/90 text-yellow-900 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow">
            ✓
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
          {story.title}
        </h3>
        {story.description && (
          <p className="text-gray-400 text-xs line-clamp-2">{story.description}</p>
        )}

        {/* Tags */}
        {story.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {story.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-auto pt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500">{completed}/{total} phần</span>
            <span className="text-[10px] text-gray-500">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-yellow-400' : 'bg-purple-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Play / Continue button */}
      <div className="px-4 pb-4">
        <button className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all
          ${isFinished
            ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/25'
            : completed > 0
            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40'
            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/25'
          }`}
        >
          {isFinished ? <><FaStar /> Chơi lại</> : completed > 0 ? <><FaPlay /> Tiếp tục</> : <><FaPlay /> Bắt đầu</>}
        </button>
      </div>
    </div>
  );
}

// ─── StoryLobby ────────────────────────────────────────────────────────────────
export default function StoryLobby() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;
  const [stories,  setStories]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selectedTheme,    setSelectedTheme]    = useState('');
  const [level,    setLevel]    = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [modalStory, setModalStory] = useState(null); // story shown in completed-modal

  const LIMIT = 12;

  useEffect(() => {
    setLoading(true);
  getStories({ theme: selectedTheme, level, page, limit: LIMIT })
      .then(r => {
        setStories(r.data.data || []);
        setTotal(r.data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTheme, level, page]);

  // Client-side search filter
  const filtered = search
    ? stories.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      )
    : stories;

  const totalPages = Math.ceil(total / LIMIT);

  const handleStart = (story) => {
    navigate(`/stories/${story._id}`);
  };

  const handleReplayFromModal = () => {
    if (!modalStory) return;
    setModalStory(null);
    navigate(`/stories/${modalStory._id}/parts/1`);
  };

  return (
    <LearnLayout breadcrumbs={[{ label: 'Hành lang câu chuyện' }] }>
      {/* Completed-story modal */}
      {modalStory && (
        <CompletedStoryModal
          story={modalStory}
          onClose={() => setModalStory(null)}
          onReplay={handleReplayFromModal}
          navigate={navigate}
        />
      )}
      {/* Hero (matching TopicDetail style) */}
      <div className={cn('relative overflow-hidden rounded-3xl border mb-6 shadow-lg', t.border)}>
        <div className={cn('relative h-44 overflow-hidden', isDark ? 'bg-linear-to-br from-[#1a1040] via-[#2d1b69] to-[#0f172a]' : 'bg-linear-to-br from-[#6C5CE7]/20 via-[#A29BFE]/30 to-[#EDE9FE]')}>
          {/* decorative blobs (kept subtle) */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        </div>

        <div className={cn('px-6 pb-6 -mt-6 relative z-10', t.card)}>
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm mb-2 flex items-center gap-2 transition-colors">← Quay lại</button>
          <h1 className={cn('text-2xl font-black mb-1', t.text)}>📖 Hành lang câu chuyện</h1>
          <p className={cn('text-sm leading-relaxed mb-4', t.sub)}>Chọn một câu chuyện để luyện dịch. Từng câu sẽ được chiếu sáng theo lượt — bạn dịch, AI chấm, rồi dịch ngược lại!</p>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-45">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input
              type="text"
              placeholder="Tìm câu chuyện..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
            />
          </div>
          <select value={selectedTheme} onChange={e => { setSelectedTheme(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm">
            {THEMES.map(t => <option key={t.value} value={t.value} className="bg-[#1A1830]">{t.label}</option>)}
          </select>
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm">
            {LEVELS.map(l => <option key={l.value} value={l.value} className="bg-[#1A1830]">{l.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingCat size={250} text="Đang chuẩn bị kho câu chuyện cho bạn..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="text-5xl">📚</div>
            <p className="text-white font-semibold">Chưa có câu chuyện nào</p>
            <p className="text-gray-400 text-sm">Hãy thay đổi bộ lọc hoặc quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filtered.map(story => (
              <StoryCard key={story._id} story={story} onClick={() => handleStart(story)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !search && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-30 transition">← Trước</button>
            <span className="text-gray-400 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-30 transition">Tiếp →</button>
          </div>
        )}
      </div>
    </LearnLayout>
  );
}
