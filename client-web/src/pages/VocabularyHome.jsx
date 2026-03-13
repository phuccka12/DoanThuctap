import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnLayout from '../components/learn/LearnLayout';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getVocabTopics } from '../services/vocabService';
import {
  FaBookOpen, FaGraduationCap, FaLeaf, FaLaptopCode,
  FaCity, FaHeartbeat, FaGlobe, FaPalette, FaFutbol, FaMusic,
  FaSearch, FaStar, FaTrophy, FaFire,
} from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

const ICON_MAP = {
  FaLeaf, FaLaptopCode, FaCity, FaHeartbeat, FaGlobe,
  FaPalette, FaFutbol, FaMusic, FaBookOpen, FaGraduationCap,
};

const LEVEL_COLOR = {
  beginner:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  intermediate: 'text-amber-400  bg-amber-400/10  border-amber-400/30',
  advanced:     'text-rose-400   bg-rose-400/10   border-rose-400/30',
};

const LEVEL_LABEL = { beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao' };

function TopicCard({ topic, t, onClick }) {
  const Icon = ICON_MAP[topic.icon_name] || FaBookOpen;
  const pct  = topic.progress_pct || 0;
  const lvl  = LEVEL_COLOR[topic.level] || LEVEL_COLOR.beginner;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-left rounded-2xl border p-5 transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]',
        t.card, t.border,
      )}
    >
      {/* Cover image */}
      {topic.cover_image && (
        <div className="w-full h-28 mb-4 rounded-xl overflow-hidden">
          <img
            src={topic.cover_image}
            alt={topic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Icon + level badge */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg', 'bg-purple-500/15 text-purple-400')}>
          <Icon />
        </div>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', lvl)}>
          {LEVEL_LABEL[topic.level] || topic.level}
        </span>
      </div>

      {/* Name & description */}
      <h3 className={cn('font-bold text-base mb-1', t.text)}>{topic.name}</h3>
      {topic.description && (
        <p className={cn('text-xs line-clamp-2 mb-3', t.sub)}>{topic.description}</p>
      )}

      {/* Stats */}
      <div className={cn('flex items-center justify-between text-xs mb-2', t.sub)}>
        <span>{topic.learned_words} / {topic.total_words} từ</span>
        <span className={pct === 100 ? 'text-emerald-400 font-bold' : ''}>
          {pct === 100 ? '✅ Hoàn thành' : `${pct}%`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-gray-700/50 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct === 100 ? 'bg-emerald-400' : 'bg-linear-to-r from-purple-500 to-blue-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

export default function VocabularyHome() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    setLoading(true);
    getVocabTopics()
      .then(d => setTopics(d.data || []))
      .catch(() => setError('Không tải được danh sách chủ đề'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = topics.filter(tp =>
    tp.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords   = topics.reduce((s, t) => s + (t.total_words   || 0), 0);
  const learnedWords = topics.reduce((s, t) => s + (t.learned_words || 0), 0);
  const doneTopics   = topics.filter(t => t.progress_pct === 100).length;

  return (
    <LearnLayout breadcrumbs={[{ label: 'Từ Vựng', to: '/vocabulary' }]}>
      <div className="space-y-6">

        {/* ── HERO BANNER ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          <div className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-linear-to-br from-[#1a0a3d] via-[#2d1060] to-[#0f1122]'
              : 'bg-linear-to-br from-[#7C3AED] via-[#6D28D9] to-[#4F46E5]',
          )} />
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          {/* Floating book decoration */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[80px] opacity-10 pointer-events-none select-none rotate-12">📚</div>

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-2xl">
                    📚
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Học từ vựng</p>
                    <h1 className="text-white text-2xl font-black leading-tight">Kho Từ Vựng IELTS</h1>
                  </div>
                </div>
                <p className="text-white/75 text-sm max-w-md leading-relaxed">
                  Học từ vựng theo chủ đề với{' '}
                  <span className="font-bold text-white">Flashcard</span>,{' '}
                  <span className="font-bold text-white">Quiz</span> và{' '}
                  <span className="font-bold text-white">Mini-Game</span> — ghi nhớ nhanh, nhớ lâu.
                </p>
              </div>

              {/* Stats chips */}
              <div className="flex flex-wrap md:flex-col gap-2 md:items-end shrink-0">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                  <FaBookOpen className="text-white/80 text-sm" />
                  <span className="text-white font-black text-lg leading-none">{topics.length}</span>
                  <span className="text-white/70 text-xs">chủ đề</span>
                </div>
                {learnedWords > 0 && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                    <FaStar className="text-amber-300 text-sm" />
                    <span className="text-white font-black text-lg leading-none">{learnedWords}</span>
                    <span className="text-white/70 text-xs">từ đã học</span>
                  </div>
                )}
                {doneTopics > 0 && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                    <FaTrophy className="text-emerald-300 text-sm" />
                    <span className="text-white font-black text-lg leading-none">{doneTopics}</span>
                    <span className="text-white/70 text-xs">hoàn thành</span>
                  </div>
                )}
              </div>
            </div>

            {/* Overall progress bar */}
            {totalWords > 0 && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-white/70 mb-1.5">
                  <span>Tiến độ tổng thể</span>
                  <span className="font-bold text-white">{learnedWords} / {totalWords} từ</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/90 transition-all duration-700"
                    style={{ width: `${Math.round(learnedWords / totalWords * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className={cn('relative')}>
          <FaSearch className={cn('absolute left-4 top-1/2 -translate-y-1/2 text-sm', t.sub)} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm chủ đề từ vựng..."
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition',
              t.card, t.border, t.text,
              'focus:border-purple-500',
            )}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-3xl text-purple-400" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-3">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); getVocabTopics().then(d => setTopics(d.data||[])).catch(()=>setError('Lỗi tải dữ liệu')).finally(()=>setLoading(false)); }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn('text-center py-20', t.sub)}>
            <FaBookOpen className="text-4xl mx-auto mb-3 opacity-30" />
            <p>{search ? 'Không tìm thấy chủ đề phù hợp' : 'Chưa có chủ đề từ vựng nào'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(topic => (
              <TopicCard
                key={topic._id}
                topic={topic}
                t={t}
                onClick={() => navigate(`/vocabulary/${topic._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </LearnLayout>
  );
}
