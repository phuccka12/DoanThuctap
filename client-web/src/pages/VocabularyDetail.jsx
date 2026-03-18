import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearnLayout from '../components/learn/LearnLayout';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getTopicWords } from '../services/vocabService';
import {
  FaPlay, FaVolumeUp, FaCheckCircle, FaSearch,
  FaArrowLeft, FaBook, FaStar,
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';

const POS_LABEL = {
  noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv',
  pronoun: 'pron', preposition: 'prep', conjunction: 'conj',
  interjection: 'interj', other: '',
};

const POS_COLOR = {
  noun:        'bg-blue-500/15   text-blue-400',
  verb:        'bg-emerald-500/15 text-emerald-400',
  adjective:   'bg-amber-500/15  text-amber-400',
  adverb:      'bg-purple-500/15 text-purple-400',
  preposition: 'bg-rose-500/15   text-rose-400',
};

function speak(word) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  }
}

export default function VocabularyDetail() {
  const { topicId } = useParams();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const t           = isDark ? darkTheme : theme;

  const [data,    setData]    = useState(null);  // { topic, words, total }
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [preview, setPreview] = useState(null);  // word being hovered/expanded

  useEffect(() => {
    setLoading(true);
    getTopicWords(topicId)
      .then(d => setData(d))
      .catch(() => setError('Không tải được danh sách từ vựng'))
      .finally(() => setLoading(false));
  }, [topicId]);

  const filtered = (data?.words || []).filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const learnedCount = (data?.words || []).filter(w => w.learned).length;
  const pct = data?.total ? Math.round(learnedCount / data.total * 100) : 0;

  if (loading) return (
    <LearnLayout breadcrumbs={[{ label: 'Từ Vựng', to: '/vocabulary' }, { label: '...' }]}>
      <div className="flex items-center justify-center py-32">
        <LoadingCat size={250} text="Đang tải danh sách từ..." />
      </div>
    </LearnLayout>
  );

  if (error) return (
    <LearnLayout breadcrumbs={[{ label: 'Từ Vựng', to: '/vocabulary' }]}>
      <div className="text-center py-32">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/vocabulary')} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          Quay lại
        </button>
      </div>
    </LearnLayout>
  );

  const { topic, total } = data;

  return (
    <LearnLayout breadcrumbs={[
      { label: 'Từ Vựng', to: '/vocabulary' },
      { label: topic?.name || 'Chủ đề' },
    ]}>
      <div className="space-y-6">

        {/* Hero */}
        <div className={cn('rounded-2xl border overflow-hidden', t.card, t.border)}>
          {topic?.cover_image && (
            <div className="w-full h-40 overflow-hidden">
              <img src={topic.cover_image} alt={topic.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className={cn('text-2xl font-black mb-1', t.text)}>{topic?.name}</h1>
                {topic?.description && <p className={cn('text-sm mb-4', t.sub)}>{topic.description}</p>}
                <div className="flex gap-4 text-sm">
                  <span className={cn('flex items-center gap-1.5', t.sub)}>
                    <FaBook className="text-purple-400" />{total} từ vựng
                  </span>
                  <span className={cn('flex items-center gap-1.5', t.sub)}>
                    <FaStar className="text-amber-400" />{learnedCount} đã học
                  </span>
                  <span className={cn(
                    'flex items-center gap-1.5',
                    pct === 100 ? 'text-emerald-400 font-bold' : t.sub,
                  )}>
                    {pct === 100 ? <FaCheckCircle /> : null}{pct}% hoàn thành
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 mb-5">
              <div className="w-full h-2 rounded-full bg-gray-700/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-purple-500 to-blue-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            {total > 0 && (
              <button
                onClick={() => navigate(`/vocabulary/${topicId}/learn`)}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/20 text-base"
              >
                <FaPlay /> 🚀 Bắt đầu học
              </button>
            )}
          </div>
        </div>

        {/* Word list */}
        <div className={cn('rounded-2xl border', t.card, t.border)}>
          {/* Header */}
          <div className={cn('flex items-center justify-between gap-3 p-4 border-b', t.border)}>
            <h2 className={cn('font-bold', t.text)}>Danh sách từ vựng</h2>
            <div className="relative flex-1 max-w-xs">
              <FaSearch className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-xs', t.sub)} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm từ..."
                className={cn(
                  'w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none',
                  'bg-gray-700/30', t.border, t.text,
                  'focus:border-purple-500',
                )}
              />
            </div>
          </div>

          {/* Table */}
          <div className="divide-y divide-gray-700/30">
            {filtered.length === 0 ? (
              <p className={cn('text-center py-10 text-sm', t.sub)}>Không tìm thấy từ nào</p>
            ) : filtered.map((w, i) => (
              <div
                key={w._id}
                className={cn(
                  'flex items-start gap-4 px-5 py-3.5 transition-colors cursor-pointer',
                  'hover:bg-white/5',
                  w.learned ? 'opacity-75' : '',
                )}
                onClick={() => setPreview(preview?._id === w._id ? null : w)}
              >
                {/* Index */}
                <span className={cn('text-xs mt-0.5 w-6 shrink-0 text-right', t.sub)}>{i + 1}</span>

                {/* Word + POS */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-bold', t.text)}>{w.word}</span>
                    {w.part_of_speech && w.part_of_speech !== 'other' && (
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded font-medium',
                        POS_COLOR[w.part_of_speech] || 'bg-gray-600/30 text-gray-400',
                      )}>
                        {POS_LABEL[w.part_of_speech] || w.part_of_speech}
                      </span>
                    )}
                    {w.pronunciation && (
                      <span className={cn('text-xs italic', t.sub)}>/{w.pronunciation}/</span>
                    )}
                    {w.learned && <FaCheckCircle className="text-emerald-400 text-xs" />}
                  </div>
                  <p className={cn('text-sm mt-0.5', t.sub)}>{w.meaning}</p>

                  {/* Expanded: example + synonyms */}
                  {preview?._id === w._id && (
                    <div className="mt-2 space-y-1">
                      {w.example && (
                        <p className={cn('text-xs italic border-l-2 border-purple-500/50 pl-2', t.sub)}>
                          {w.example}
                        </p>
                      )}
                      {w.synonyms?.length > 0 && (
                        <p className={cn('text-xs', t.sub)}>
                          <span className="text-purple-400 font-medium">Syn: </span>
                          {w.synonyms.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Speak button */}
                <button
                  onClick={e => { e.stopPropagation(); speak(w.word); }}
                  className={cn('shrink-0 p-2 rounded-lg transition hover:bg-blue-500/20 hover:text-blue-400', t.sub)}
                  title="Nghe phát âm"
                >
                  <FaVolumeUp />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {total > 0 && (
          <div className="flex justify-center pb-6">
          </div>
        )}
      </div>
    </LearnLayout>
  );
}