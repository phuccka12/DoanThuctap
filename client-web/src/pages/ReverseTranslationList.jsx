import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import LearnLayout from '../components/learn/LearnLayout';
import reverseTranslationService from '../services/reverseTranslationService';
import { FaLanguage, FaFire, FaCoins } from 'react-icons/fa';

const LEVEL_META = {
  beginner:     { label: 'Cơ bản',    color: 'bg-emerald-500/15 text-emerald-600 border border-emerald-400/40' },
  intermediate: { label: 'Trung cấp', color: 'bg-amber-500/15   text-amber-600   border border-amber-400/40'   },
  advanced:     { label: 'Nâng cao',  color: 'bg-rose-500/15    text-rose-600    border border-rose-400/40'    },
};

const FILTER_OPTIONS = [
  { value: '',             label: 'Tất cả' },
  { value: 'beginner',     label: 'Cơ bản' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced',     label: 'Nâng cao' },
];

export default function ReverseTranslationList() {
  const navigate       = useNavigate();
  const { isDark }     = useTheme();
  const t              = isDark ? darkTheme : theme;
  const [sets, setSets]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    reverseTranslationService.listSets()
      .then(data => setSets(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? sets.filter(s => s.level === filter) : sets;

  return (
    <LearnLayout breadcrumbs={[{ label: 'Dịch ngược' }]}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center">
            <FaLanguage className="text-[#6C5CE7] text-xl" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-black', t.text)}>Dịch ngược</h1>
            <p className={cn('text-sm', t.sub)}>Contextual Chunking — Nhớ từ vựng theo ngữ cảnh</p>
          </div>
        </div>
      </div>

      {/* ── Filter pills ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold border transition-all',
              filter === opt.value
                ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-md'
                : cn('border', t.border, t.text, t.hover,
                     isDark ? 'bg-white/5' : 'bg-white/80')
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center">
              <FaLanguage className="text-[#6C5CE7] text-2xl" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-[#6C5CE7]/30 animate-ping" />
          </div>
          <p className={cn('text-sm font-medium', t.sub)}>Đang tải bộ đề…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn('text-center py-20 rounded-3xl border', t.card, t.border)}>
          <p className="text-4xl mb-3">📭</p>
          <p className={cn('font-medium', t.sub)}>Chưa có bộ đề nào ở cấp này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(set => {
            const lvl = LEVEL_META[set.level];
            return (
              <button
                key={set._id}
                onClick={() => navigate(`/reverse-translation/${set._id}`)}
                className={cn(
                  'rounded-3xl border p-5 text-left transition-all duration-200 group',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  t.card, t.border
                )}
              >
                {/* Cover image */}
                {set.sourceLesson?.cover_image && (
                  <img
                    src={set.sourceLesson.cover_image}
                    alt=""
                    className="w-full h-28 object-cover rounded-2xl mb-3"
                  />
                )}

                {/* Title + level */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className={cn(
                    'text-base font-black leading-tight group-hover:text-[#6C5CE7] transition-colors',
                    t.text
                  )}>
                    {set.title}
                  </h3>
                  {lvl && (
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0', lvl.color)}>
                      {lvl.label}
                    </span>
                  )}
                </div>

                {/* Description */}
                {set.description && (
                  <p className={cn('text-sm line-clamp-2 mb-3', t.sub)}>{set.description}</p>
                )}

                {/* Meta row */}
                <div className={cn('flex items-center gap-3 text-xs font-medium flex-wrap', t.sub)}>
                  <span>📝 {set.sentenceCount ?? set.items?.length ?? 0} câu</span>
                  {set.rewardCoins > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <FaCoins className="text-[10px]" />+{set.rewardCoins} hoàn thành
                    </span>
                  )}
                  {set.sourceLesson?.title && (
                    <span className="truncate max-w-[140px]">📖 {set.sourceLesson.title}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </LearnLayout>
  );
}
