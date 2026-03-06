const fs = require('fs');
const path = require('path');

const content = `import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getLessonsForTopic } from '../services/learningService';
import LearnLayout from '../components/learn/LearnLayout';
import { FaLock, FaCheckCircle, FaSpinner, FaPlay, FaChevronRight, FaTrophy } from 'react-icons/fa';

const SKILL_META = {
  reading:    { icon: '\u{1F4D6}', label: '\u0110\u1ECD\u0063',      color: 'text-blue-400',    bg: 'bg-blue-500/15    border-blue-400/30'    },
  listening:  { icon: '\u{1F3A7}', label: 'Nghe',     color: 'text-purple-400',  bg: 'bg-purple-500/15  border-purple-400/30'  },
  vocabulary: { icon: '\u{1F4DD}', label: 'T\u1EEB v\u1EF1ng',  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30' },
  writing:    { icon: '\u270D\uFE0F',  label: 'Vi\u1EBFt',     color: 'text-yellow-400',  bg: 'bg-yellow-500/15  border-yellow-400/30'  },
  speaking:   { icon: '\u{1F399}\uFE0F', label: 'N\u00F3i',      color: 'text-rose-400',    bg: 'bg-rose-500/15    border-rose-400/30'    },
  quiz:       { icon: '\u{1F9E9}', label: 'Quiz',     color: 'text-orange-400',  bg: 'bg-orange-500/15  border-orange-400/30'  },
  video:      { icon: '\u{1F3AC}', label: 'Video',    color: 'text-sky-400',     bg: 'bg-sky-500/15     border-sky-400/30'     },
  general:    { icon: '\u{1F4DA}', label: 'H\u1ECDc',      color: 'text-gray-400',    bg: 'bg-gray-500/10    border-gray-400/20'    },
};

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const t           = isDark ? darkTheme : theme;

  const [topic,   setTopic]   = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessonsForTopic(topicId)
      .then(r => {
        setTopic(r.data.data.topic);
        setLessons(r.data.data.lessons || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [topicId]);

  if (loading) {
    return (
      <LearnLayout breadcrumbs={[{ label: 'Ch\u1EE7 \u0111\u1EC1' }]}>
        <div className="flex flex-col items-center justify-center min-h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center">
              <FaSpinner className="text-[#6C5CE7] text-2xl animate-spin" />
            </div>
          </div>
          <p className={cn('text-sm font-medium', t.sub)}>\u0110ang t\u1EA3i b\u00E0i h\u1ECDc\u2026</p>
        </div>
      </LearnLayout>
    );
  }

  const completedCount = lessons.filter(l => l.isCompleted).length;
  const totalCount     = lessons.length;
  const progressPct    = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const breadcrumbs = [
    { label: 'Ch\u1EE7 \u0111\u1EC1', to: '/learn' },
    { label: topic?.name || 'Chi ti\u1EBFt' },
  ];

  return (
    <LearnLayout breadcrumbs={breadcrumbs}>

      {/* \u2500\u2500 Topic Hero \u2500\u2500 */}
      <div className={cn('relative overflow-hidden rounded-3xl border mb-6 shadow-lg', t.border)}>
        {/* Cover */}
        <div className="relative h-52 overflow-hidden">
          {topic?.cover_image
            ? <img src={topic.cover_image} alt={topic.name} className="w-full h-full object-cover" />
            : <div className={cn(
                'w-full h-full flex items-center justify-center text-8xl',
                isDark
                  ? 'bg-linear-to-br from-[#1a1040] via-[#2d1b69] to-[#0f172a]'
                  : 'bg-linear-to-br from-[#6C5CE7]/20 via-[#A29BFE]/30 to-[#EDE9FE]'
              )}>
                <span className="drop-shadow-lg">{topic?.icon_name || '\u{1F4DA}'}</span>
              </div>
          }
          {/* Overlay */}
          <div className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent'
              : 'bg-linear-to-t from-white via-white/40 to-transparent'
          )} />

          {/* Lesson count badge */}
          {totalCount > 0 && (
            <div className={cn(
              'absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-sm border text-xs font-bold',
              isDark ? 'bg-black/50 text-gray-200 border-white/15' : 'bg-white/80 text-gray-700 border-black/10'
            )}>
              \u{1F4DA} {totalCount} b\u00E0i h\u1ECDc
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className={cn('px-6 pb-6 -mt-6 relative z-10', t.card)}>
          <h1 className={cn('text-2xl font-black mb-1', t.text)}>{topic?.name}</h1>
          {topic?.description && (
            <p className={cn('text-sm leading-relaxed mb-5', t.sub)}>{topic.description}</p>
          )}

          {/* Progress section */}
          <div className={cn('rounded-2xl border p-4', isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50/80 border-gray-100')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {progressPct === 100 ? (
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-sm">
                    <FaTrophy /> Ho\u00E0n th\u00E0nh to\u00E0n b\u1ED9!
                  </div>
                ) : (
                  <span className={cn('text-sm font-bold', t.text)}>
                    {completedCount}/{totalCount} b\u00E0i ho\u00E0n th\u00E0nh
                  </span>
                )}
              </div>
              <span className={cn('text-2xl font-black', progressPct === 100 ? 'text-emerald-500' : 'text-[#6C5CE7]')}>
                {progressPct}%
              </span>
            </div>
            <div className={cn('w-full h-3 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  progressPct === 100
                    ? 'bg-emerald-500'
                    : 'bg-linear-to-r from-[#6C5CE7] to-[#00CEC9]'
                )}
                style={{ width: \`\${progressPct}%\` }}
              />
            </div>
            {/* Progress dots */}
            {totalCount <= 12 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {lessons.map((l, i) => (
                  <div key={i} className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all',
                    l.isCompleted ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                      : l.isUnlocked ? 'bg-[#6C5CE7] animate-pulse'
                      : isDark ? 'bg-white/20' : 'bg-gray-200'
                  )} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* \u2500\u2500 Roadmap \u2500\u2500 */}
      <div className="relative">
        {lessons.length === 0 ? (
          <div className={cn('text-center py-20 rounded-3xl border', t.border, t.card)}>
            <p className="text-5xl mb-3">\u{1F4ED}</p>
            <p className={cn('text-base font-bold mb-1', t.text)}>Ch\u01B0a c\u00F3 b\u00E0i h\u1ECDc</p>
            <p className={cn('text-sm', t.sub)}>Ch\u1EE7 \u0111\u1EC1 n\u00E0y ch\u01B0a c\u00F3 b\u00E0i h\u1ECDc n\u00E0o \u0111\u01B0\u1EE3c xu\u1EA5t b\u1EA3n.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Section label */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
              <span className={cn('text-xs font-bold uppercase tracking-widest px-3', t.sub)}>L\u1ED9 tr\u00ECnh h\u1ECDc</span>
              <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
            </div>

            {lessons.map((lesson, idx) => (
              <RoadmapNode
                key={lesson._id}
                lesson={lesson}
                idx={idx}
                t={t}
                isDark={isDark}
                onClick={() => lesson.isUnlocked && navigate(\`/learn/lessons/\${lesson._id}\`)}
              />
            ))}
          </div>
        )}
      </div>
    </LearnLayout>
  );
}

/* \u2500\u2500 Roadmap Node \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function RoadmapNode({ lesson, idx, t, isDark, onClick }) {
  const skills = lesson.skillIcons || [];
  const isCompleted = lesson.isCompleted;
  const isUnlocked  = lesson.isUnlocked;
  const isLocked    = !isUnlocked && !isCompleted;

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
                <span className={cn('text-[10px] font-bold', isUnlocked ? 'text-white/70' : t.sub)}>B\u00E0i</span>
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
              \u23F1 {lesson.duration}ph
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
              <FaCheckCircle className="text-[10px]" /> \u0110\u00E3 ho\u00E0n th\u00E0nh
            </div>
          )}
          {isUnlocked && !isCompleted && (
            <div className="flex items-center gap-1.5 text-[#6C5CE7] text-xs font-bold">
              <FaPlay className="text-[9px]" />
              B\u1EAFt \u0111\u1EA7u h\u1ECDc
              <FaChevronRight className="text-[9px] ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
          )}
          {isLocked && (
            <p className={cn('text-xs', t.sub)}>\u{1F512} Ho\u00E0n th\u00E0nh b\u00E0i tr\u01B0\u1EDBc \u0111\u1EC3 m\u1EDF kho\u00E1</p>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const filePath = path.join(__dirname, 'client-web', 'src', 'pages', 'TopicDetail.jsx');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Written successfully to:', filePath);
