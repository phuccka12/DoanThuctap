import React from 'react';
import { cn, theme as lightTheme, darkTheme } from '../../utils/dashboardTheme';
import { FaBook, FaBolt, FaLightbulb, FaArrowRight, FaClock, FaStar } from 'react-icons/fa';

/**
 * Reusable Lesson Introduction Page
 * @param {Object} props
 * @param {string} props.title - Title of the lesson/topic
 * @param {string} props.description - Brief description
 * @param {string} props.level - beginner | intermediate | advanced
 * @param {string} props.type - grammar | lesson | story | skill
 * @param {Array}  props.stats - [{ icon: <Icon/>, label: '3 Stages', sub: 'Hook, Theory, Arena' }]
 * @param {string} props.tip - A random tip or encouraging message
 * @param {Function} props.onStart - Callback to begin
 * @param {boolean} props.isDark - Theme mode
 * @param {Object} props.theme - Theme object (t)
 */
const LessonIntro = ({ 
  title, 
  description, 
  level = 'intermediate', 
  type = 'lesson',
  stats = [], 
  tip, 
  onStart, 
  onBack,
  isDark = false, 
  theme: t = null
}) => {
  // Use provided theme or fall back to system theme
  const activeTheme = t || (isDark ? darkTheme : lightTheme);
  const LEVEL_META = {
    beginner:     { label: 'Sơ cấp',   color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    intermediate: { label: 'Trung cấp', color: 'text-amber-400   bg-amber-500/15   border-amber-500/30' },
    advanced:     { label: 'Nâng cao',  color: 'text-rose-400    bg-rose-500/15    border-rose-500/30' },
  };

  const TYPE_ICON = {
    grammar: '📘',
    lesson:  '🎓',
    story:   '📖',
    skill:   '🎯',
  };

  const lm = LEVEL_META[level] || LEVEL_META.intermediate;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className={cn(
        'rounded-3xl border overflow-hidden', 
        isDark ? 'bg-[#1C1E28] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
      )}>
        {/* Simple Header */}
        <div className={cn(
          'p-8 text-center border-b',
          isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
        )}>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-4">
              <span className="text-lg">{TYPE_ICON[type]}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {type === 'grammar' ? 'Ngữ pháp' : type === 'story' ? 'Truyện RPG' : 'Bài học'}
              </span>
            </div>
            
            <h1 className={cn('text-3xl md:text-4xl font-black leading-tight mb-3', activeTheme.text)}>
              {title}
            </h1>
            
            <div className={cn('inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border', lm.color)}>
              {lm.label}
            </div>
        </div>

        {/* Short & Sweet Summary */}
        <div className="p-8 md:p-10 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <p className={cn('text-base md:text-lg font-medium leading-relaxed opacity-80', activeTheme.text)}>
              {description || 'Khám phá kiến thức mới mẻ trong bài học này.'}
            </p>
          </div>

          {/* Compact Stats Info */}
          {stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    'p-4 rounded-2xl border flex items-center gap-3', 
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                  )}
                >
                  <div className="text-xl shrink-0">{s.icon}</div>
                  <div className="min-w-0">
                    <p className={cn('text-[10px] font-black uppercase tracking-tighter opacity-40 leading-none mb-1', activeTheme.text)}>{s.label}</p>
                    <p className={cn('text-[11px] font-bold truncate leading-none', activeTheme.sub)}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Tip - Minimalist version */}
          {tip && (
            <div className={cn(
              'p-4 rounded-2xl border flex items-start gap-3', 
              isDark ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'
            )}>
              <FaLightbulb className="text-indigo-500 shrink-0 mt-0.5" size={14} />
              <p className={cn('text-xs font-medium leading-normal', activeTheme.text)}>
                {tip}
              </p>
            </div>
          )}

          {/* Action */}
          <div className="flex flex-col items-center pt-2">
            <button
              onClick={onStart}
              className="group w-full md:w-64 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              BẮT ĐẦU
              <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {onBack && (
              <button 
                onClick={onBack}
                className={cn('text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-4 hover:opacity-100 transition-opacity')}
              >
                Quay lại
              </button>
            )}
            {!onBack && (
              <p className={cn('text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mt-4')}>
                Sẵn sàng học chưa?
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonIntro;
