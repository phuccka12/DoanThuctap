/**
 * SharedTopicCard — card chủ đề dùng chung cho Speaking, Reading, Listening
 * Design giống StoryLobby: cover h-40, level badge overlay, nút action,
 * progress bar, dark-aware.
 */
import React from 'react';
import { cn } from '../../utils/dashboardTheme';
import { FaPlay, FaRedo, FaStar, FaBook } from 'react-icons/fa';

// ─── Level metadata ──────────────────────────────────────────────────────────
export const LEVEL_META_CARD = {
  beginner:     { label: 'Cơ bản',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  intermediate: { label: 'Trung cấp', color: 'bg-amber-500/20   text-amber-300   border-amber-500/30'  },
  advanced:     { label: 'Nâng cao',  color: 'bg-rose-500/20    text-rose-300    border-rose-500/30'   },
  A1: { label: 'A1', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  A2: { label: 'A2', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  B1: { label: 'B1', color: 'bg-amber-500/20   text-amber-300   border-amber-500/30'  },
  B2: { label: 'B2', color: 'bg-amber-500/20   text-amber-300   border-amber-500/30'  },
  C1: { label: 'C1', color: 'bg-rose-500/20    text-rose-300    border-rose-500/30'   },
  C2: { label: 'C2', color: 'bg-rose-500/20    text-rose-300    border-rose-500/30'   },
};

/**
 * @param {object}  props.topic        — { name, level, cover_image, description }
 * @param {boolean} props.isDark
 * @param {object}  props.t            — theme tokens (card, border, text, sub)
 * @param {boolean} props.done         — đã hoàn thành / đã làm
 * @param {number}  props.pct          — % tiến độ 0–100
 * @param {string}  props.countLabel   — vd "12 câu hỏi", "5 bài đọc"
 * @param {string}  props.fallbackIcon — emoji khi không có cover
 * @param {function} props.onClick
 */
export default function SharedTopicCard({
  topic, isDark, t, done = false, pct = 0,
  countLabel = '', fallbackIcon = '📚', onClick,
}) {
  const meta = LEVEL_META_CARD[topic?.level] || LEVEL_META_CARD.beginner;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col cursor-pointer rounded-2xl overflow-hidden',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        isDark
          ? 'bg-white/5 border border-white/10 hover:border-purple-500/50 hover:shadow-purple-500/10'
          : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-indigo-100',
      )}
    >
      {/* ── Cover ── */}
      <div className={cn(
        'relative h-40 overflow-hidden',
        isDark
          ? 'bg-linear-to-br from-purple-600/30 to-indigo-700/30'
          : 'bg-linear-to-br from-indigo-100 to-purple-100',
      )}>
        {topic?.cover_image ? (
          <img
            src={topic.cover_image}
            alt={topic.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            <span className="opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300 inline-block">
              {fallbackIcon}
            </span>
          </div>
        )}

        {/* Level badge — top right */}
        <span className={cn(
          'absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm border',
          meta.color,
        )}>
          {meta.label}
        </span>

        {/* Done crown — top left */}
        {done && (
          <div className="absolute top-3 left-3 bg-yellow-400/90 text-yellow-900 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow">
            ✓
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className={cn(
          'font-bold text-sm leading-snug line-clamp-2 transition-colors',
          isDark
            ? 'text-white group-hover:text-purple-300'
            : 'text-slate-800 group-hover:text-indigo-600',
        )}>
          {topic?.name}
        </h3>

        {topic?.description && (
          <p className={cn('text-xs line-clamp-2', isDark ? 'text-gray-400' : 'text-slate-500')}>
            {topic.description}
          </p>
        )}

        {/* Count label */}
        {countLabel && (
          <span className={cn('text-xs font-semibold', isDark ? 'text-indigo-300' : 'text-indigo-600')}>
            {countLabel}
          </span>
        )}

        {/* Progress bar */}
        <div className="mt-auto pt-2">
          <div className="flex justify-between items-center mb-1">
            <span className={cn('text-[10px]', isDark ? 'text-gray-500' : 'text-slate-400')}>
              Tiến độ
            </span>
            <span className={cn('text-[10px] font-semibold', done ? 'text-emerald-400' : (isDark ? 'text-gray-500' : 'text-slate-400'))}>
              {pct}%
            </span>
          </div>
          <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                done ? 'bg-yellow-400' : 'bg-purple-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Action button ── */}
      <div className="px-4 pb-4">
        <button
          onClick={e => { e.stopPropagation(); onClick && onClick(); }}
          className={cn(
            'w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all',
            done
              ? isDark
                ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/25'
                : 'bg-yellow-50 text-yellow-600 border border-yellow-300 hover:bg-yellow-100'
              : pct > 0
              ? isDark
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
              : isDark
                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/25'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20',
          )}
        >
          {done
            ? <><FaRedo size={10} /> Làm lại</>
            : pct > 0
            ? <><FaPlay size={10} /> Tiếp tục</>
            : <><FaPlay size={10} /> Bắt đầu</>
          }
        </button>
      </div>
    </div>
  );
}