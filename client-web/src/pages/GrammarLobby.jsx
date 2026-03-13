import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import LearnLayout from '../components/learn/LearnLayout';
import { getGrammarLessons } from '../services/learningService';
import {
  FaBook, FaSearch, FaFilter, FaPlay, FaSpinner,
  FaTimes, FaBolt, FaGraduationCap,
} from 'react-icons/fa';

const LEVEL_META = {
  beginner:     { label: 'Sơ cấp',   color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'Trung cấp', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  advanced:     { label: 'Nâng cao',  color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

const LEVELS = [
  { value: '',             label: 'Tất cả cấp độ' },
  { value: 'beginner',     label: '🌱 Sơ cấp' },
  { value: 'intermediate', label: '🔥 Trung cấp' },
  { value: 'advanced',     label: '💎 Nâng cao' },
];

export default function GrammarLobby() {
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const t           = isDark ? darkTheme : theme;

  const [lessons, setLessons] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [level,   setLevel]   = useState('');

  useEffect(() => {
    setLoading(true);
    getGrammarLessons({ search, level, limit: 50 })
      .then(r => {
        const payload = r.data?.data;
        setLessons(Array.isArray(payload) ? payload : []);
        setTotal(r.data?.total || 0);
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [search, level]);

  return (
    <LearnLayout breadcrumbs={[{ label: 'Ngữ pháp', path: '/grammar' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className={cn('rounded-2xl p-6 border', isDark ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <FaBook className="text-white" />
            </div>
            <h1 className={cn('text-2xl font-bold', t.text)}>Lộ trình Ngữ pháp</h1>
          </div>
          <p className={cn('text-sm', t.sub)}>Hook → Lý thuyết → Mini-games → Phần thưởng. Học theo 4 chặng mượt mà!</p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className={cn('flex items-center gap-1.5', t.sub)}><FaBolt className="text-yellow-400" /> {total} bài học</span>
            <span className={cn('flex items-center gap-1.5', t.sub)}><FaGraduationCap className="text-purple-400" /> 3 cấp độ</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm', t.sub)} />
            <input
              className={cn('w-full rounded-xl pl-9 pr-3 py-2.5 text-sm border focus:outline-none focus:border-purple-500 transition-colors', t.input)}
              placeholder="Tìm bài học..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <FaFilter className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm', t.sub)} />
            <select
              className={cn('rounded-xl pl-9 pr-4 py-2.5 text-sm border focus:outline-none focus:border-purple-500 transition-colors', t.input)}
              value={level}
              onChange={e => setLevel(e.target.value)}
            >
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-purple-500 text-2xl" />
          </div>
        ) : lessons.length === 0 ? (
          <div className={cn('text-center py-20', t.sub)}>
            <FaBook className="text-4xl mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">Chưa có bài học nào</p>
            <p className="text-sm mt-1 opacity-60">Admin chưa tạo bài ngữ pháp cho cấp độ này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map(lesson => {
              const lm = LEVEL_META[lesson.level] || LEVEL_META.intermediate;
              return (
                <button
                  key={lesson._id}
                  onClick={() => navigate(`/grammar/${lesson._id}`)}
                  className={cn(
                    'group text-left rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl',
                    isDark
                      ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/8'
                      : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-purple-100/50'
                  )}
                >
                  {/* Level badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', lm.color)}>
                      {lm.label}
                    </span>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                      isDark ? 'bg-purple-600/20 group-hover:bg-purple-600/40' : 'bg-purple-100 group-hover:bg-purple-200'
                    )}>
                      <FaPlay className="text-purple-500 text-xs ml-0.5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={cn('font-bold text-base mb-1.5 leading-snug', t.text)}>{lesson.title}</h3>
                  {lesson.description && (
                    <p className={cn('text-xs line-clamp-2 mb-3', t.sub)}>{lesson.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs flex items-center gap-1', t.sub)}>
                      <span>❓</span> {lesson.hookCount} câu mồi
                    </span>
                    <span className={cn('text-xs flex items-center gap-1', t.sub)}>
                      <span>🎮</span> {lesson.minigameCount} game
                    </span>
                  </div>

                  {/* Progress bar placeholder */}
                  <div className={cn('mt-3 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${lesson.isCompleted ? 100 : (lesson.progressScore || 0)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </LearnLayout>
  );
}
