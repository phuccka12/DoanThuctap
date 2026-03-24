import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getLessonsForTopic } from '../services/learningService';
import LearnLayout from '../components/learn/LearnLayout';
import { FaLock, FaCheckCircle, FaSpinner, FaPlay, FaChevronRight, FaTrophy } from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';

const ICON_NAME_MAP = {
  'book-open': '📖', 'book': '📚', 'books': '📚',
  'graduation-cap': '🎓', 'school': '🏫',
  'airplane': '✈️', 'plane': '✈️', 'airport': '🛫',
  'travel': '🌍', 'globe': '🌐',
  'technology': '💻', 'tech': '🔧',
  'business': '💼', 'food': '🍜', 'health': '🏥',
  'sport': '⚽', 'music': '🎵', 'art': '🎨',
  'nature': '🌿', 'science': '🔬', 'city': '🏙️',
};
function getTopicIcon(icon_name) {
  if (!icon_name) return '📚';
  if ([...icon_name][0]?.codePointAt(0) > 127) return icon_name;
  const key = icon_name.toLowerCase().replace(/[-_]/g, '-');
  return ICON_NAME_MAP[key] || ICON_NAME_MAP[key.split('-')[0]] || '📚';
}

const SKILL_META = {
  reading: { icon: '📖', label: 'Đọc', color: 'text-blue-400', bg: 'bg-blue-500/15    border-blue-400/30' },
  listening: { icon: '🎧', label: 'Nghe', color: 'text-purple-400', bg: 'bg-purple-500/15  border-purple-400/30' },
  vocabulary: { icon: '📝', label: 'Từ vựng', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30' },
  writing: { icon: '✍️', label: 'Viết', color: 'text-yellow-400', bg: 'bg-yellow-500/15  border-yellow-400/30' },
  speaking: { icon: '🎙️', label: 'Nói', color: 'text-rose-400', bg: 'bg-rose-500/15    border-rose-400/30' },
  quiz: { icon: '🧩', label: 'Quiz', color: 'text-orange-400', bg: 'bg-orange-500/15  border-orange-400/30' },
  video: { icon: '🎬', label: 'Video', color: 'text-sky-400', bg: 'bg-sky-500/15     border-sky-400/30' },
  general: { icon: '📚', label: 'Học', color: 'text-gray-400', bg: 'bg-gray-500/10    border-gray-400/20' },
};

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const [topic, setTopic] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Khi quay về từ LessonPlayer sau khi hoàn thành, refetch để cập nhật progress
  useEffect(() => {
    if (location.state?.refresh) {
      setRefreshKey(k => k + 1);
      // Xoá state để tránh refetch mỗi lần render
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    setLoading(true);
    getLessonsForTopic(topicId)
      .then(r => {
        setTopic(r.data.data.topic);
        setLessons(r.data.data.lessons || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [topicId, refreshKey]);

  if (loading) {
    return (
      <LearnLayout breadcrumbs={[{ label: 'Chủ đề' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingCat size={250} text="Đang tải nội dung bài học..." />
        </div>
      </LearnLayout>
    );
  }

  const completedCount = lessons.filter(l => l.isCompleted).length;
  const totalCount = lessons.length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const breadcrumbs = [
    { label: 'Chủ đề', to: '/learn' },
    { label: topic?.name || 'Chi tiết' },
  ];

  return (
    <LearnLayout breadcrumbs={breadcrumbs}>

      {/* ── Simplified Topic Header ── */}
      <div className={cn('p-8 rounded-3xl border mb-6 relative overflow-hidden', t.border, t.card)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
             <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100')}>
                  {getTopicIcon(topic?.icon_name)}
                </div>
                <div>
                  <h1 className={cn('text-2xl font-black leading-tight', t.text)}>{topic?.name}</h1>
                  <p className={cn('text-xs font-bold uppercase tracking-widest opacity-40', t.sub)}>Chủ đề học tập</p>
                </div>
             </div>
             {topic?.description && (
               <p className={cn('text-sm leading-relaxed max-w-2xl', t.sub)}>{topic.description}</p>
             )}
          </div>

          {/* Compact Progress */}
          <div className="shrink-0">
             <div className={cn('p-4 rounded-2xl border min-w-[180px]', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100')}>
                <div className="flex justify-between items-end mb-2">
                   <span className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', t.text)}>Tiến độ</span>
                   <span className={cn('text-xl font-black text-[#6C5CE7]')}>{progressPct}%</span>
                </div>
                <div className={cn('w-full h-2 rounded-full overflow-hidden mb-2', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                   <div 
                      className="h-full bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                   />
                </div>
                <p className={cn('text-[10px] font-bold text-center', t.sub)}>
                   {completedCount}/{totalCount} bài học
                </p>
             </div>
          </div>
        </div>
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      </div>

      {/* ── Roadmap ── */}
      <div className="relative">
        {lessons.length === 0 ? (
          <div className={cn('text-center py-20 rounded-3xl border', t.border, t.card)}>
            <p className="text-5xl mb-3">📭</p>
            <p className={cn('text-base font-bold mb-1', t.text)}>Chưa có bài học</p>
            <p className={cn('text-sm', t.sub)}>Chủ đề này chưa có bài học nào được xuất bản.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Section label */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
              <span className={cn('text-xs font-bold uppercase tracking-widest px-3', t.sub)}>Lộ trình học</span>
              <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
            </div>

            {lessons.map((lesson, idx) => (
              <RoadmapNode
                key={lesson._id}
                lesson={lesson}
                idx={idx}
                t={t}
                isDark={isDark}
                onClick={() => lesson.isUnlocked && navigate(`/learn/lessons/${lesson._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </LearnLayout>
  );
}

/* ── Roadmap Node ─────────────────────────────────────────────────────────── */
function RoadmapNode({ lesson, idx, t, isDark, onClick }) {
  const skills = lesson.skillIcons || [];
  const isCompleted = lesson.isCompleted;
  const isUnlocked = lesson.isUnlocked;
  const isLocked = !isUnlocked && !isCompleted;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-4 p-4 rounded-3xl border transition-all duration-300',
        isCompleted
          ? 'border-emerald-400/40 bg-emerald-500/5 hover:border-emerald-400/70'
          : isUnlocked
            ? cn(
              'border-[#6C5CE7]/30 bg-[#6C5CE7]/5 cursor-pointer',
              'hover:border-[#6C5CE7]/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#6C5CE7]/10'
            )
            : cn('opacity-50 cursor-not-allowed', t.border, t.card)
      )}
    >
      {/* Left: Step indicator */}
      <div className={cn(
        'shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-center transition-all',
        isCompleted
          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
          : isUnlocked
            ? 'bg-[#6C5CE7] shadow-lg shadow-[#6C5CE7]/30 group-hover:scale-105'
            : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
      )}>
        {isCompleted
          ? <FaCheckCircle className="text-white text-xl" />
          : isLocked
            ? <FaLock className={cn('text-base', isDark ? 'text-gray-600' : 'text-gray-400')} />
            : <>
              <span className={cn('text-[10px] font-bold', isUnlocked ? 'text-white/70' : t.sub)}>Bài</span>
              <span className={cn('text-lg font-black leading-tight', isUnlocked ? 'text-white' : t.text)}>{idx + 1}</span>
            </>
        }
      </div>

      {/* Right: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-black text-base leading-snug mb-1',
              isCompleted ? 'text-emerald-600' : isUnlocked ? t.text : isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              {lesson.title}
            </h3>
            {lesson.description && (
              <p className={cn('text-xs leading-relaxed line-clamp-2', t.sub)}>{lesson.description}</p>
            )}
          </div>
          {/* Duration */}
          {lesson.duration && (
            <span className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-xl shrink-0 border',
              isDark ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200'
            )}>
              ⏱ {lesson.duration}ph
            </span>
          )}
        </div>

        {/* Skill tags */}
        {skills.length > 0 && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {skills.map(skill => {
              const s = SKILL_META[skill] || SKILL_META.general;
              return (
                <span key={skill} className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', s.bg, s.color)}>
                  {s.icon} {s.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Status footer */}
        <div className="mt-2.5">
          {isCompleted && (
            <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-black">
              <FaCheckCircle className="text-[10px]" /> Đã hoàn thành
            </div>
          )}
          {isUnlocked && !isCompleted && (
            <div className="flex items-center gap-1.5 text-[#6C5CE7] text-xs font-bold">
              <FaPlay className="text-[9px]" />
              Bắt đầu học
              <FaChevronRight className="text-[9px] ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
          )}
          {isLocked && (
            <p className={cn('text-xs', t.sub)}>🔒 Hoàn thành bài trước để mở khoá</p>
          )}
        </div>
      </div>
    </div>
  );
}
