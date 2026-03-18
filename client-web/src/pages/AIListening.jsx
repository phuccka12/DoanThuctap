import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../context/AuthContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import {
  FiHeadphones, FiPlay, FiPause, FiChevronRight, FiChevronLeft,
  FiCheck, FiX, FiRefreshCw, FiList, FiVolume2, FiClock,
  FiAward, FiBookOpen, FiArrowLeft, FiTag, FiZap, FiStar,
  FiAlertTriangle, FiSkipForward,
} from 'react-icons/fi';
import { FaCoins, FaHeart } from 'react-icons/fa';
import { dashboardRefreshEmitter } from '../utils/dashboardRefresh';
import LearnLayout from '../components/learn/LearnLayout';
import SharedTopicCard from '../components/shared/TopicCard';
import LoadingCat from '../components/shared/LoadingCat';
import { motion } from 'framer-motion';

import axiosInstance from '../utils/axiosConfig';

// ─── Phase constants ──────────────────────────────────────────────────────────
const PHASE = {
  TOPICS:   'topics',
  LIST:     'list',
  LISTEN:   'listen',
  PRACTICE: 'practice',
  RESULT:   'result',
  REVIEW:   'review',
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

// ─── Helpers ────────────────────────────────────────────────────────────────
const LEVEL_META = {
  beginner:     { label: 'Sơ cấp',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  intermediate: { label: 'Trung cấp', color: 'bg-amber-500/20  text-amber-300  border-amber-500/30'   },
  advanced:     { label: 'Nâng cao',  color: 'bg-rose-500/20   text-rose-300   border-rose-500/30'    },
};

function LevelBadge({ level }) {
  const m = LEVEL_META[level] || { label: level, color: 'bg-gray-700 text-gray-300 border-gray-600' };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.color}`}>
      {m.label}
    </span>
  );
}

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ScoreRing({ pct, size = 96 }) {
  const r = 40, circ = 2 * Math.PI * r;
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#374151" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="50" y="54" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
        {pct}%
      </text>
    </svg>
  );
}

// ─── Per-user localStorage topic progress ─────────────────────────────────────
function useListeningProgress(userId) {
  const key = userId ? `listening_topic_progress_${userId}` : 'listening_topic_progress';
  const load = () => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  };
  const save = (topicId, data) => {
    const existing = load();
    const prev = existing[topicId];
    if (!prev || data.pct >= prev.pct) {
      existing[topicId] = { ...data, completedAt: Date.now() };
      try { localStorage.setItem(key, JSON.stringify(existing)); } catch (_) {}
    }
    return existing;
  };
  return { load, save };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Topics Phase
// ═══════════════════════════════════════════════════════════════════════════════
function TopicsPhase({ onSelect, onBrowseAll, progress }) {
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;
  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    axiosInstance.get('/listening/topics')
      .then(r => {
        const list = r.data?.data?.topics || r.data?.data || [];
        setTopics(list);
      })
      .catch(() => { setTopics([]); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const doneCount  = topics.filter(t => !!progress[t._id]).length;
  const totalCount = topics.length;
  const overallPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner Redesigned for Sync */}
      <div className="glass-panel p-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500" />
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-linear-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20 rotate-3">
              <FiHeadphones size={36} className="text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Luyện nghe IELTS</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-widest">
                  <FiList /> {totalCount} chủ đề
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                  <FiCheck /> {doneCount} Hoàn thành
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-64 space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ tổng</span>
              <span className="text-cyan-400 font-black text-xs">{overallPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${overallPct}%` }}
                 className="h-full bg-linear-to-r from-cyan-500 to-blue-500"
               />
            </div>
          </div>
        </div>
      </div>

      {/* Topic grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingCat size={180} text="Đang tải chủ đề bài nghe..." />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FiHeadphones size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-medium text-gray-300">
            {error ? 'Không thể tải chủ đề' : 'Chưa có chủ đề nào'}
          </p>
          <p className="text-sm mt-1 mb-6">
            {error ? 'Vui lòng thử lại sau' : 'Admin cần gắn topic cho bài nghe trước'}
          </p>
          <button onClick={onBrowseAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all">
            <FiList size={15} /> Xem tất cả bài nghe
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => {
            const prog = progress[topic._id];
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
                countLabel={topic.passageCount ? `${topic.passageCount} bài nghe` : ''}
                fallbackIcon="🎧"
                onClick={() => onSelect(topic)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Passage List Phase
// ═══════════════════════════════════════════════════════════════════════════════
function ListPhase({ topic, onSelect, onBack }) {
  const [passages,    setPassages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [levelFilter, setLevelFilter] = useState('');

  const fetchPassages = useCallback((level) => {
    setLoading(true);
    const params = { limit: 30 };
    if (topic?._id) params.topic = topic._id;
    if (level)      params.level = level;
    axiosInstance.get('/listening', { params })
      .then(r => {
        const d = r.data?.data || r.data;
        setPassages(d?.passages || d?.docs || []);
      })
      .catch(() => setPassages([]))
      .finally(() => setLoading(false));
  }, [topic]);

  useEffect(() => { fetchPassages(''); }, [fetchPassages]);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <FiArrowLeft size={15} /> Tất cả chủ đề
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/20 rounded-xl">
            <FiHeadphones size={22} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{topic?.name || 'Bài nghe'}</h2>
            <p className="text-gray-500 text-sm">{passages.length} bài nghe trong chủ đề này</p>
          </div>
        </div>
      </div>

      {/* Level filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: '',             label: 'Tất cả' },
          { val: 'beginner',     label: 'Sơ cấp' },
          { val: 'intermediate', label: 'Trung cấp' },
          { val: 'advanced',     label: 'Nâng cao' },
        ].map(o => (
          <button key={o.val}
            onClick={() => { setLevelFilter(o.val); fetchPassages(o.val); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all
              ${levelFilter === o.val
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-purple-500/50'}`}>
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingCat size={140} text="Đang tải danh sách bài nghe..." />
        </div>
      ) : passages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FiHeadphones size={40} className="mx-auto mb-3 text-gray-600" />
          <p>Không có bài nghe nào trong chủ đề này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {passages.map(p => (
            <button key={p._id} onClick={() => onSelect(p)}
              className="w-full text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 hover:border-purple-500/40 rounded-2xl p-4 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-purple-600/15 group-hover:bg-purple-600/25 rounded-xl shrink-0 transition-all">
                  <FiHeadphones size={20} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm leading-snug truncate group-hover:text-purple-200 transition-colors">
                    {p.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    <LevelBadge level={p.level} />
                    <span className="text-gray-500 text-xs capitalize">{p.section?.replace('section', 'Phần ')}</span>
                    {p.duration_sec > 0 && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <FiClock size={10} /> {formatDuration(p.duration_sec)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <FiList size={10} /> {p.questions?.length ?? 0} câu hỏi
                    </span>
                  </div>
                </div>
                <FiChevronRight size={18} className="text-gray-600 group-hover:text-purple-400 shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Listen Phase (Audio với Speed Control)
// ═══════════════════════════════════════════════════════════════════════════════
function ListenPhase({ passage, onReady, onBack }) {
  const audioRef       = useRef(null);
  const [playing,      setPlaying]      = useState(false);
  const [current,      setCurrent]      = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [speed,        setSpeed]        = useState(1);
  const [listenCount,  setListenCount]  = useState(0);
  const [finished,     setFinished]     = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const onEnded = () => {
    setPlaying(false);
    setListenCount(c => c + 1);
    setFinished(true);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <FiArrowLeft size={15} /> Chọn bài khác
        </button>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-600/20 rounded-xl shrink-0">
            <FiHeadphones size={24} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">{passage.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <LevelBadge level={passage.level} />
              {passage.duration_sec > 0 && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <FiClock size={11} /> {formatDuration(passage.duration_sec)}
                </span>
              )}
              {(passage.topics || []).map(t => (
                <span key={t._id || t} className="flex items-center gap-1 text-gray-500 text-xs">
                  <FiTag size={10} /> {t.name || t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player card */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 space-y-5">
        <audio ref={audioRef} src={passage.audio_url}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={onEnded} />

        <div className="flex items-center gap-5">
          <button onClick={toggle}
            className="shrink-0 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all shadow-lg shadow-purple-500/30">
            {playing ? <FiPause size={22} /> : <FiPlay size={22} className="ml-1" />}
          </button>
          <div className="flex-1 space-y-2">
            <div className="w-full h-2.5 bg-gray-700 rounded-full cursor-pointer relative" onClick={seek}>
              <div className="h-full bg-linear-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${pct}%` }} />
              {duration > 0 && (
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow pointer-events-none"
                  style={{ left: `calc(${pct}% - 7px)` }} />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDuration(Math.round(current)) || '0:00'}</span>
              <span>{formatDuration(Math.round(duration)) || '—'}</span>
            </div>
          </div>
          <FiVolume2 size={18} className="text-gray-400 shrink-0" />
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 text-xs mr-1">Tốc độ:</span>
          {SPEEDS.map(s => (
            <button key={s} onClick={() => changeSpeed(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                ${speed === s
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-purple-500/50'}`}>
              {s}x
            </button>
          ))}
          {listenCount > 0 && (
            <span className="ml-auto text-xs text-gray-500">Đã nghe {listenCount} lần</span>
          )}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-sm">
        🎧 Nghe ít nhất một lần trước khi làm bài. Bạn có thể nghe lại bất cứ lúc nào trong khi làm bài.
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm font-medium transition-all">
          ← Quay lại
        </button>
        <button onClick={onReady}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
          {finished || listenCount > 0
            ? <><FiZap size={16} /> Bắt đầu làm bài</>
            : <><FiSkipForward size={16} /> Bỏ qua, làm bài luôn</>}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Practice Phase
// ═══════════════════════════════════════════════════════════════════════════════
function PracticePhase({ passage, onSubmit, onBack }) {
  const audioRef     = useRef(null);
  const [answers,    setAnswers]    = useState({});
  const [playing,    setPlaying]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [speed,      setSpeed]      = useState(1);
  const [current,    setCurrent]    = useState(0);
  const [duration,   setDuration]   = useState(0);

  // ── Timer Logic ──
  const startTimeRef = useRef(null);
  useEffect(() => {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
  }, []);

  const setAnswer = (qId, val) => setAnswers(a => ({ ...a, [qId]: val }));

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      const payload = {
        answers: passage.questions.map(q => ({
          questionId: q._id,
          answer: answers[q._id] || '',
        })),
        timeSpentSec: Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      };
      const r = await axiosInstance.post(`/listening/${passage._id}/submit`, payload);
      dashboardRefreshEmitter.emit();
      onSubmit(r.data?.data || r.data);
    } catch {
      setError('Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const total    = passage.questions?.length || 0;
  const answered = passage.questions?.filter(q => answers[q._id]?.trim()).length || 0;
  const pct      = duration ? (current / duration) * 100 : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Sticky mini audio player */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 sticky top-4 z-10">
        <audio ref={audioRef} src={passage.audio_url}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setPlaying(false)} />
        <div className="flex items-center gap-3">
          <button onClick={toggle}
            className="shrink-0 w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all">
            {playing ? <FiPause size={16} /> : <FiPlay size={16} className="ml-0.5" />}
          </button>
          <div className="flex-1 space-y-1">
            <div className="w-full h-1.5 bg-gray-700 rounded-full cursor-pointer" onClick={seek}>
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDuration(Math.round(current)) || '0:00'}</span>
              <span>{formatDuration(Math.round(duration)) || '—'}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {SPEEDS.map(s => (
              <button key={s} onClick={() => changeSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-xs border transition-all
                  ${speed === s ? 'bg-purple-600 border-purple-500 text-white' : 'border-gray-600 text-gray-500 hover:border-gray-500'}`}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-400 px-1">
        <span>{answered} / {total} đã trả lời</span>
        <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Questions */}
      {(passage.questions || []).map((q, qi) => (
        <div key={q._id || qi} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 space-y-4">
          <p className="text-white font-medium text-sm">
            <span className="text-purple-400 font-bold mr-2">Q{qi + 1}.</span>{q.question}
          </p>

          {q.type === 'multiple_choice' && (
            <div className="space-y-2">
              {(q.options || []).map((opt, oi) => {
                const label    = String.fromCharCode(65 + oi);
                const selected = answers[q._id] === opt || answers[q._id] === label;
                return (
                  <button key={oi} onClick={() => setAnswer(q._id, opt || label)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm
                      ${selected ? 'bg-purple-600/20 border-purple-500/50 text-white' : 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600'}`}>
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-all
                      ${selected ? 'bg-purple-600 border-purple-500 text-white' : 'border-gray-600 text-gray-500'}`}>
                      {label}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'true_false' && (
            <div className="flex gap-3">
              {['true', 'false'].map(v => (
                <button key={v} onClick={() => setAnswer(q._id, v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${answers[q._id] === v
                      ? v === 'true' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' : 'bg-red-600/20 border-red-500/50 text-red-300'
                      : 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600'}`}>
                  {v === 'true' ? '✓ Đúng' : '✗ Sai'}
                </button>
              ))}
            </div>
          )}

          {(q.type === 'fill_blank' || q.type === 'matching') && (
            <input type="text" value={answers[q._id] || ''}
              onChange={e => setAnswer(q._id, e.target.value)}
              placeholder={q.type === 'fill_blank' ? 'Điền vào chỗ trống…' : 'Nhập đáp án nối…'}
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none transition-colors" />
          )}
        </div>
      ))}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <div className="flex gap-3 pb-6">
        <button onClick={onBack} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm font-medium transition-all">
          ← Quay lại
        </button>
        <button onClick={handleSubmit} disabled={submitting || answered === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20">
          {submitting ? <LoadingCat size={40} /> : <FiCheck size={16} />}
          {submitting ? 'Đang nộp bài…' : `Nộp bài (${answered}/${total})`}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5 — Result Phase (Gamification)
// ═══════════════════════════════════════════════════════════════════════════════
function ResultPhase({ result, onReview, onRetry, onBack }) {
  const { percent, band, correct, total, details, reward } = result;
  const stars = percent >= 90 ? 3 : percent >= 60 ? 2 : 1;
  const msg   = percent >= 80 ? '🎉 Xuất sắc!' : percent >= 50 ? '👍 Khá tốt!' : '💪 Cần cố gắng thêm!';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Score card */}
      <div className="bg-linear-to-br from-purple-900/60 to-blue-900/60 border border-purple-500/30 rounded-2xl p-8">
        <div className="flex flex-col items-center">
          <p className="text-xl font-bold text-white mb-1">{msg}</p>
          <div className="flex gap-1 mb-5">
            {[1,2,3].map(n => (
              <FiStar key={n} size={24}
                className={n <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
            ))}
          </div>
          <ScoreRing pct={percent} size={100} />
          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="text-emerald-400"><strong className="text-white text-lg">{correct}</strong> đúng</span>
            <span className="text-gray-400">/ {total} câu</span>
            <span className="text-purple-400">Band IELTS: <strong className="text-white">{band}</strong></span>
          </div>
        </div>
      </div>

      {/* Gamification reward */}
      {reward && (
        <div className="grid grid-cols-2 gap-3">
          <div className={`flex items-center gap-3 rounded-2xl p-4 border ${
            reward.coinsEarned > 0 ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-gray-800/60 border-gray-700/40'}`}>
            <FaCoins size={24} className="text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Xu kiếm được</p>
              <p className="text-white font-bold text-lg">+{reward.coinsEarned} 🪙</p>
              {reward.capReached && <p className="text-xs text-yellow-500">Đã đạt giới hạn ngày</p>}
            </div>
          </div>
          <div className={`flex items-center gap-3 rounded-2xl p-4 border ${
            reward.hpChange < 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
            <FaHeart size={24} className={reward.hpChange < 0 ? 'text-red-400' : 'text-emerald-400'} />
            <div>
              <p className="text-xs text-gray-400">Thú cưng HP</p>
              <p className={`font-bold text-lg ${reward.hpChange < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {reward.hpChange < 0 ? reward.hpChange : '+HP 😊'}
              </p>
              <p className="text-xs text-gray-500">Đói: {reward.petAfter?.hunger ?? '?'}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer breakdown */}
      <div className="space-y-2">
        <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Kết quả từng câu</h3>
        {(details || []).map((d, i) => (
          <div key={i}
            className={`rounded-xl p-3.5 border flex items-start gap-3
              ${d.isCorrect ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-red-900/15 border-red-500/25'}`}>
            <div className={`mt-0.5 shrink-0 ${d.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {d.isCorrect ? <FiCheck size={15} /> : <FiX size={15} />}
            </div>
            <div className="flex-1 text-sm">
              <p className="text-gray-200 font-medium">Q{i + 1}. {d.question}</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Bạn trả lời: <span className={d.isCorrect ? 'text-emerald-300' : 'text-red-300'}>{d.userAnswer || '(chưa trả lời)'}</span>
              </p>
              {d.hasTypo && (
                <p className="text-yellow-400 text-xs mt-0.5 flex items-center gap-1">
                  <FiAlertTriangle size={11} /> Lỗi đánh máy nhỏ — từ đúng: <strong>{d.correctAnswer}</strong>
                </p>
              )}
              {!d.isCorrect && !d.hasTypo && (
                <p className="text-gray-400 text-xs mt-0.5">
                  Đáp án đúng: <span className="text-emerald-300">{d.correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        <button onClick={onBack}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm font-medium transition-all">
          <FiArrowLeft size={15} /> Về danh sách
        </button>
        <button onClick={onRetry}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm font-medium transition-all">
          <FiRefreshCw size={15} /> Làm lại
        </button>
        <button onClick={onReview}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
          <FiBookOpen size={15} /> Xem Transcript
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6 — Transcript Review Phase
// ═══════════════════════════════════════════════════════════════════════════════
function ReviewPhase({ passage, result, onDone }) {
  const audioRef   = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed,    setSpeed]    = useState(1);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  // Highlight keywords from questions in transcript
  const keywords = (result.details || [])
    .flatMap(d => d.correctAnswer ? [d.correctAnswer.toLowerCase()] : [])
    .filter(Boolean);

  const highlightTranscript = (text) => {
    if (!text || keywords.length === 0) return text;
    const regex = new RegExp(
      `(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    );
    return text.split(regex).map((part, i) =>
      keywords.some(k => k.toLowerCase() === part.toLowerCase())
        ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5 not-italic">{part}</mark>
        : part
    );
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <FiBookOpen className="text-purple-400" /> Xem lại lời thoại
        </h2>
        <p className="text-gray-500 text-sm">Từ khoá của câu hỏi được bôi vàng trong transcript</p>
      </div>

      {/* Mini player */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
        <audio ref={audioRef} src={passage.audio_url}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setPlaying(false)} />
        <div className="flex items-center gap-3">
          <button onClick={toggle}
            className="shrink-0 w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all">
            {playing ? <FiPause size={16} /> : <FiPlay size={16} className="ml-0.5" />}
          </button>
          <div className="flex-1 space-y-1">
            <div className="w-full h-1.5 bg-gray-700 rounded-full cursor-pointer" onClick={seek}>
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDuration(Math.round(current)) || '0:00'}</span>
              <span>{formatDuration(Math.round(duration)) || '—'}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {SPEEDS.map(s => (
              <button key={s} onClick={() => changeSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-xs border transition-all
                  ${speed === s ? 'bg-purple-600 border-purple-500 text-white' : 'border-gray-600 text-gray-500 hover:border-gray-500'}`}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transcript */}
      {result.transcript ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {highlightTranscript(result.transcript)}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center text-gray-500">
          <FiBookOpen size={36} className="mx-auto mb-2 text-gray-600" />
          <p>Bài này chưa có transcript</p>
        </div>
      )}

      {/* Q&A reference */}
      <div className="space-y-2">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Đáp án tham khảo</h3>
        {(result.details || []).map((d, i) => (
          <div key={i} className={`rounded-xl p-3 border flex items-start gap-2 text-sm
            ${d.isCorrect ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
            <span className={`mt-0.5 ${d.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {d.isCorrect ? <FiCheck size={14} /> : <FiX size={14} />}
            </span>
            <div>
              <p className="text-gray-300">{d.question}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Đáp án: <span className="text-emerald-300">{d.correctAnswer}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pb-6">
        <button onClick={onDone}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20">
          ✅ Hoàn thành — Về chọn chủ đề
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT — AIListening
// ═══════════════════════════════════════════════════════════════════════════════
export default function AIListening() {
  const { isDark } = useTheme();
  const { user }   = useAuth();

  const { load: loadProgress, save: saveProgress } = useListeningProgress(user?._id);

  const [phase,    setPhase]    = useState(PHASE.TOPICS);
  const [topic,    setTopic]    = useState(null);
  const [passage,  setPassage]  = useState(null);
  const [result,   setResult]   = useState(null);
  const [progress, setProgress] = useState(() => loadProgress());

  // Step 1 → 2
  const handleSelectTopic = (t) => { setTopic(t); setPhase(PHASE.LIST); };

  // Fallback: không có topics → vào thẳng LIST không lọc topic
  const handleBrowseAll = () => { setTopic(null); setPhase(PHASE.LIST); };

  // Step 2 → 3: fetch full passage
  const handleSelectPassage = async (preview) => {
    try {
      const r = await authAxios.get(`/listening/${preview._id}`);
      setPassage(r.data?.data || r.data);
    } catch {
      setPassage(preview);
    }
    setPhase(PHASE.LISTEN);
  };

  // Step 3 → 4
  const handleReady = () => setPhase(PHASE.PRACTICE);

  // Step 4 → 5: save progress
  const handleSubmitResult = (res) => {
    setResult(res);
    setPhase(PHASE.RESULT);
    if (topic?._id) {
      const updated = saveProgress(topic._id, {
        pct:   res.percent,
        stars: res.percent >= 90 ? 3 : res.percent >= 60 ? 2 : 1,
        band:  res.band,
      });
      setProgress({ ...updated });
    }
  };

  // Step 5 → 6
  const handleGoReview = () => setPhase(PHASE.REVIEW);

  // Retry (back to listen)
  const handleRetry = () => { setResult(null); setPhase(PHASE.LISTEN); };

  // Back to passage list
  const handleBackList = () => { setPassage(null); setResult(null); setPhase(PHASE.LIST); };

  // Back to topics
  const handleBackTopics = () => { setTopic(null); setPassage(null); setResult(null); setPhase(PHASE.TOPICS); };

  // Step indicator
  const STEP_LABELS = ['Chủ đề', 'Bài nghe', 'Nghe', 'Làm bài', 'Kết quả', 'Transcript'];
  const STEP_PHASES = [PHASE.TOPICS, PHASE.LIST, PHASE.LISTEN, PHASE.PRACTICE, PHASE.RESULT, PHASE.REVIEW];
  const phaseIndex  = STEP_PHASES.indexOf(phase);

  return (
    <LearnLayout>
      <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-gray-950' : 'bg-gray-100'}`}>
        <div className="max-w-4xl mx-auto space-y-8">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${i < phaseIndex  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : i === phaseIndex ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-gray-600 border border-gray-700/50'}`}>
                {i < phaseIndex
                  ? <FiCheck size={10} />
                  : <span className="w-3 text-center leading-none">{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-4 h-px ${i < phaseIndex ? 'bg-emerald-600/50' : 'bg-gray-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Phase content */}
        {phase === PHASE.TOPICS && (
          <TopicsPhase onSelect={handleSelectTopic} onBrowseAll={handleBrowseAll} progress={progress} />
        )}
        {phase === PHASE.LIST && (
          <ListPhase topic={topic} onSelect={handleSelectPassage} onBack={handleBackTopics} />
        )}
        {phase === PHASE.LISTEN && passage && (
          <ListenPhase passage={passage} onReady={handleReady} onBack={handleBackList} />
        )}
        {phase === PHASE.PRACTICE && passage && (
          <PracticePhase passage={passage} onSubmit={handleSubmitResult} onBack={() => setPhase(PHASE.LISTEN)} />
        )}
        {phase === PHASE.RESULT && result && (
          <ResultPhase result={result} onReview={handleGoReview} onRetry={handleRetry} onBack={handleBackList} />
        )}
        {phase === PHASE.REVIEW && result && (
          <ReviewPhase passage={passage} result={result} onDone={handleBackTopics} />
        )}
        </div>
      </div>
    </LearnLayout>
  );
}
