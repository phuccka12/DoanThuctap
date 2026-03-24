/**
 * SpeakingPractice.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Luồng:
 *   TOPICS → WARMUP → MAIN → FOLLOWUP → RESULT
 *
 * Tầng 1 (Frontend):  Web Speech API → WPM, Hesitation, Rhythm → gửi kèm audio
 * Tầng 2 (Online):    Whisper + Gemini 2.0 (qua Python AI)
 * Tầng 3 (Offline):   N-gram BLEU + WPM score (xử lý trên Python/Node khi AI sập)
 *
 * Dữ liệu thực: bảng SpeakingQuestion (MongoDB)
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import LearnLayout from '../components/learn/LearnLayout';
import {
  getSpeakingTopics, getSpeakingQuestions, getSpeakingWarmup, evaluateSpeaking,
} from '../services/learningService';
import {
  FaMicrophone, FaStop, FaArrowRight, FaArrowLeft, FaStar,
  FaFire, FaTrophy, FaCheck, FaRedo, FaChevronRight, FaLightbulb,
  FaBookOpen, FaVolumeMute, FaVolumeUp, FaSpinner, FaPlay, FaPause, FaMagic, FaHistory,
  FaClock
} from 'react-icons/fa';
import { FiLoader, FiActivity } from 'react-icons/fi';
import LoadingCat from '../components/shared/LoadingCat';
import { dashboardRefreshEmitter } from '../utils/dashboardRefresh';
import SharedTopicCard from '../components/shared/TopicCard';
import LessonIntro from '../components/shared/LessonIntro';
import RewardModal from '../components/shared/RewardModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const PHASE = {
  TOPICS: 'topics',
  INTRO: 'intro',
  WARMUP: 'warmup',
  MAIN: 'main',
  FOLLOWUP: 'followup',
  RESULT: 'result',
};

const HESITATION_WORDS = /\b(um|uh|ah|er|hmm|like|you know|i mean)\b/gi;

const LEVEL_META = {
  beginner: { label: 'Beginner', color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' },
  intermediate: { label: 'Intermediate', color: 'text-amber-500   border-amber-500/30   bg-amber-500/10' },
  advanced: { label: 'Advanced', color: 'text-rose-500    border-rose-500/30    bg-rose-500/10' },
};

const PART_META = {
  free: { label: 'Free', color: 'bg-slate-500/15 text-slate-400', time: 15 },
  p1: { label: 'Part 1', color: 'bg-blue-500/15   text-blue-400', time: 30 },
  p2: { label: 'Part 2', color: 'bg-indigo-500/15 text-indigo-400', time: 45 },
  p3: { label: 'Part 3', color: 'bg-purple-500/15 text-purple-400', time: 40 },
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function getBandColor(score) {
  if (score >= 7.5) return 'text-emerald-400';
  if (score >= 6.0) return 'text-amber-400';
  if (score >= 4.5) return 'text-orange-400';
  return 'text-rose-400';
}

function BandBar({ label, value, isDark }) {
  const pct = Math.round((value / 9) * 100);
  const color = value >= 7.5 ? 'bg-emerald-500' : value >= 6 ? 'bg-amber-500' : value >= 4.5 ? 'bg-orange-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{label}</span>
        <span className={cn('font-bold', getBandColor(value))}>{value?.toFixed(1)}</span>
      </div>
      <div className={cn('w-full h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-200')}>
        <div className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Waveform Visualiser (uses AnalyserNode) ─────────────────────────────────
function Waveform({ isRecording, analyserRef }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!isRecording || !analyserRef?.current) {
        // Idle flat line
        ctx.strokeStyle = 'rgba(139,92,246,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
        return;
      }

      const analyser = analyserRef.current;
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(dataArray);

      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = W / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const x = i * step;
        const y = (dataArray[i] * 0.8 + 0.5) * H;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isRecording, analyserRef]);

  return (
    <canvas ref={canvasRef} width={320} height={60}
      className="w-full h-15 rounded-xl"
      style={{ background: 'rgba(139,92,246,0.05)' }} />
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire, running }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    if (left <= 0) { onExpire?.(); return; }
    const id = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, running, onExpire]);

  const pct = Math.round((left / seconds) * 100);
  const color = left <= 10 ? 'text-rose-400' : left <= 20 ? 'text-amber-400' : 'text-emerald-400';
  const ring = left <= 10 ? 'stroke-rose-400' : left <= 20 ? 'stroke-amber-400' : 'stroke-emerald-400';

  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" strokeWidth="4" className="stroke-white/10" />
        <circle cx="40" cy="40" r="34" fill="none" strokeWidth="4"
          className={ring}
          strokeDasharray={`${2 * Math.PI * 34}`}
          strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear' }} />
      </svg>
      <div className={cn('absolute inset-0 flex items-center justify-center font-bold text-xl', color)}>
        {left}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TOPIC SCORE MODAL (Speaking) — hiện khi bấm vào topic đã làm
// ═══════════════════════════════════════════════════════════════════════════════
function TopicScoreModal({ isDark, t, topic, progress, onRetry, onNewTopic, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShow(true), 60); return () => clearTimeout(id); }, []);

  const { overall, completedAt } = progress;
  const band = overall || 0;
  const emoji = band >= 7.5 ? '🏆' : band >= 6.0 ? '🎉' : '💪';
  const msg = band >= 7.5 ? 'Xuất sắc!' : band >= 6.0 ? 'Tốt lắm!' : 'Cố gắng thêm!';
  const stars = band >= 7.5 ? 3 : band >= 6.0 ? 2 : 1;
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const bandColor = band >= 7.5 ? 'text-emerald-400' : band >= 6.0 ? 'text-amber-400' : 'text-orange-400';
  const barColor = band >= 7.5 ? 'bg-emerald-500' : band >= 6.0 ? 'bg-amber-500' : 'bg-orange-500';
  const pct = Math.round((band / 9) * 100);

  const ICONS = {
    travel: '✈️', food: '🍜', technology: '💻', environment: '🌿',
    education: '📚', health: '💪', culture: '🎭', business: '💼',
    sport: '⚽', music: '🎵', science: '🔬', art: '🎨',
  };
  const getIcon = (name = '') => {
    const key = name.toLowerCase();
    for (const [k, v] of Object.entries(ICONS)) if (key.includes(k)) return v;
    return '🎤';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden text-center transition-all duration-500',
          isDark ? 'bg-[#16181f] border-white/10' : 'bg-white border-slate-200',
          show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8',
        )}>
        {/* Rainbow top strip */}
        <div className="h-2 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Confetti dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <div key={i}
              className={cn('absolute rounded-full opacity-40 animate-bounce',
                ['bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-amber-400', 'bg-emerald-400'][i % 5])}
              style={{
                width: `${6 + (i % 4) * 3}px`, height: `${6 + (i % 4) * 3}px`,
                left: `${(i * 43 + 5) % 95}%`, top: `${(i * 31 + 8) % 55}%`,
                animationDelay: `${(i * 0.18) % 1.2}s`, animationDuration: `${1.3 + (i % 3) * 0.4}s`,
              }} />
          ))}
        </div>

        <div className="relative px-8 pt-8 pb-10">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-4xl border bg-indigo-500/10 border-indigo-500/20">
            {getIcon(topic?.name || '')}
          </div>
          <h2 className={cn('text-xl font-extrabold mb-0.5 truncate', isDark ? 'text-white' : 'text-slate-800')}>
            {topic?.name || 'Speaking'}
          </h2>
          <p className={cn('text-xs mb-5', isDark ? 'text-gray-400' : 'text-slate-500')}>
            Kết quả lần làm gần nhất
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <FaStar key={s} size={28}
                className={s <= stars
                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : (isDark ? 'text-white/15' : 'text-slate-200')} />
            ))}
          </div>

          <p className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-slate-800')}>{emoji} {msg}</p>

          {/* Band card */}
          <div className={cn('rounded-2xl border p-4 mb-5 text-left', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200')}>
            <div className="flex justify-between text-sm mb-2">
              <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Band IELTS</span>
              <span className={cn('font-extrabold text-lg', bandColor)}>{band.toFixed(1)}</span>
            </div>
            <div className={cn('w-full h-2 rounded-full overflow-hidden mb-3', isDark ? 'bg-white/10' : 'bg-slate-200')}>
              <div className={cn('h-full rounded-full transition-all duration-1000', barColor)}
                style={{ width: show ? `${pct}%` : '0%' }} />
            </div>
            {/* Per-criterion scores */}
            {progress.scores && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {[['Fluency', progress.scores.fluency], ['Pronunciation', progress.scores.pronunciation],
                ['Lexical', progress.scores.lexical], ['Grammar', progress.scores.grammar]].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between text-xs">
                    <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>{lbl}</span>
                    <span className={cn('font-semibold', getBandColor(val || 0))}>{val?.toFixed(1) ?? '-'}</span>
                  </div>
                ))}
              </div>
            )}
            {dateStr && (
              <p className={cn('text-xs mt-3', isDark ? 'text-gray-500' : 'text-slate-400')}>
                🕐 Hoàn thành: {dateStr}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={onRetry}
              className="w-full py-3 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
              <FaRedo size={12} /> Làm lại chủ đề này
            </button>
            <button onClick={onNewTopic}
              className={cn('w-full py-3 rounded-2xl border font-semibold text-sm transition-colors flex items-center justify-center gap-2',
                isDark ? 'border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50')}>
              <FaArrowRight size={12} /> Chủ đề khác
            </button>
            <button onClick={onClose}
              className={cn('w-full py-3 rounded-2xl border font-semibold text-sm transition-colors',
                isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHASE 0 — Topic Selection
// ═══════════════════════════════════════════════════════════════════════════════
function TopicsPhase({ isDark, t, onSelect, topicProgress }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreModal, setScoreModal] = useState(null);

  useEffect(() => {
    getSpeakingTopics()
      .then(r => setTopics(r.data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const ICONS = {
    travel: '✈️', food: '🍜', technology: '💻', environment: '🌿',
    education: '📚', health: '💪', culture: '🎭', business: '💼',
    sport: '⚽', music: '🎵', science: '🔬', art: '🎨',
  };
  const getIcon = (name = '') => {
    const key = name.toLowerCase();
    for (const [k, v] of Object.entries(ICONS)) if (key.includes(k)) return v;
    return '🎤';
  };

  const handleTopicClick = (topic) => {
    const prog = topicProgress?.[topic._id];
    if (prog) setScoreModal({ topic, progress: prog });
    else onSelect(topic);
  };

  // ── Stats for banner ──────────────────────────────────────────────────────
  const doneCount = topics.filter(tp => !!topicProgress?.[tp._id]).length;
  const totalCount = topics.length;
  const overallPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <>
      {/* Score modal */}
      {scoreModal && (
        <TopicScoreModal
          isDark={isDark} t={t}
          topic={scoreModal.topic}
          progress={scoreModal.progress}
          onRetry={() => { setScoreModal(null); onSelect(scoreModal.topic); }}
          onNewTopic={() => setScoreModal(null)}
          onClose={() => setScoreModal(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          {/* BG gradient */}
          <div className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-linear-to-br from-[#1a0f40] via-[#2d1569] to-[#0f1722]'
              : 'bg-linear-to-br from-[#6C5CE7] via-[#8B5CF6] to-[#a855f7]',
          )} />
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          {/* Sound wave decoration */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 pointer-events-none">
            {[18, 32, 24, 40, 28, 36, 20, 44, 26, 34].map((h, i) => (
              <div key={i} className="w-1.5 rounded-full bg-white animate-pulse"
                style={{ height: `${h}px`, animationDelay: `${i * 0.12}s`, animationDuration: '1.2s' }} />
            ))}
          </div>

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-2xl">
                    🎤
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Luyện Thi IELTS</p>
                    <h1 className="text-white text-2xl font-black leading-tight">Luyện Speaking AI</h1>
                  </div>
                </div>
                <p className="text-white/75 text-sm max-w-md leading-relaxed">
                  Chọn chủ đề, nói thật tự nhiên rồi để{' '}
                  <span className="font-bold text-white">AI</span> chấm điểm theo 4 tiêu chí IELTS:
                  Fluency, Pronunciation, Lexical, Grammar.
                </p>
              </div>

              {/* Stats chips */}
              <div className="flex flex-wrap md:flex-col gap-2 md:items-end shrink-0">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                  <FaMicrophone className="text-white/80 text-sm" />
                  <span className="text-white font-black text-lg leading-none">{totalCount}</span>
                  <span className="text-white/70 text-xs">chủ đề</span>
                </div>
                {doneCount > 0 && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                    <FaCheck className="text-emerald-300 text-sm" />
                    <span className="text-white font-black text-lg leading-none">{doneCount}</span>
                    <span className="text-white/70 text-xs">hoàn thành</span>
                  </div>
                )}
              </div>
            </div>

            {/* Overall progress bar */}
            {totalCount > 0 && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-white/70 mb-1.5">
                  <span>Tiến độ tổng thể</span>
                  <span className="font-bold text-white">{doneCount} / {totalCount} chủ đề</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-white/90 transition-all duration-700"
                    style={{ width: `${overallPct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TOPIC GRID ──────────────────────────────────────────────────── */}
        <div>
          <h2 className={cn('text-base font-bold mb-4', isDark ? 'text-white' : 'text-slate-700')}>
            Chọn chủ đề luyện nói
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingCat size={200} text="Đang tải danh sách chủ đề..." />
            </div>
          ) : topics.length === 0 ? (
            <div className={cn('text-center py-20 rounded-2xl border',
              isDark ? 'border-white/5 bg-white/3' : 'border-slate-200 bg-slate-50')}>
              <div className="text-4xl mb-3">😕</div>
              <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Chưa có chủ đề nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map(topic => {
                const prog = topicProgress?.[topic._id];
                const done = !!prog;
                const band = prog?.overall || 0;
                const pct = Math.round((band / 9) * 100);

                return (
                  <SharedTopicCard
                    key={topic._id}
                    topic={topic}
                    isDark={isDark}
                    t={t}
                    done={done}
                    pct={pct}
                    countLabel={topic.question_count ? `${topic.question_count} câu hỏi` : ''}
                    fallbackIcon={getIcon(topic.name)}
                    onClick={() => handleTopicClick(topic)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RECORDING PANEL — shared by Warmup, Main, Followup phases
// ═══════════════════════════════════════════════════════════════════════════════
function RecordingPanel({
  isDark, t,
  question, phase, partLabel, timeSec,
  sampleAnswer,
  onResult, onSkip,
  questionId,
}) {
  const [recState, setRecState] = useState('idle');  // idle | prep | recording | processing
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState('');
  const [timerActive, setTimerActive] = useState(false);

  // Tầng 1: Frontend fluency metrics
  const metricsRef = useRef({ wordTimestamps: [], hesitationCount: 0, startTs: 0 });
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  const cleanup = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) { }
    try { mediaRecorderRef.current?.stop(); } catch (_) { }
    try { audioCtxRef.current?.close(); } catch (_) { }
    recognitionRef.current = null;
    mediaRecorderRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(async () => {
    setError('');
    setAudioBlob(null);
    chunksRef.current = [];
    metricsRef.current = { wordTimestamps: [], hesitationCount: 0, startTs: Date.now() };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Web Audio API → Waveform + Volume
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // MediaRecorder → audio file
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start(200);

      // Web Speech API → WPM + Hesitation Tracker
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (ev) => {
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const txt = ev.results[i][0].transcript;
            const matches = txt.match(HESITATION_WORDS) || [];
            metricsRef.current.hesitationCount += matches.length;
            const words = txt.trim().split(/\s+/).filter(Boolean);
            words.forEach(() => {
              metricsRef.current.wordTimestamps.push(Date.now());
            });
          }
        };
        recognitionRef.current.start();
      }

      setRecState('recording');
      setTimerActive(true);
    } catch (e) {
      setError('Không thể truy cập microphone. Hãy cấp quyền và thử lại.');
      console.error(e);
    }
  }, []);

  const stopRecording = useCallback(() => {
    setTimerActive(false);
    setRecState('processing');
    try { recognitionRef.current?.stop(); } catch (_) { }
    try { mediaRecorderRef.current?.stop(); } catch (_) { }
    try { audioCtxRef.current?.close(); } catch (_) { }
    analyserRef.current = null;
  }, []);

  // Submit when audioBlob is ready
  useEffect(() => {
    if (recState !== 'processing' || !audioBlob) return;

    const submit = async () => {
      try {
        // ─ Tính Fluency metrics ─
        const ts = metricsRef.current.wordTimestamps;
        const elapsed = (Date.now() - metricsRef.current.startTs) / 1000 / 60; // minutes
        const wpm = elapsed > 0 ? Math.round(ts.length / elapsed) : 0;

        // Rhythm: std dev of inter-word gaps
        let rhythmStd = 0;
        if (ts.length > 1) {
          const gaps = ts.slice(1).map((t, i) => t - ts[i]);
          const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
          const variance = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
          rhythmStd = Math.sqrt(variance) / 1000; // to seconds
        }

        const frontendData = JSON.stringify({
          wpm,
          hesitation_count: metricsRef.current.hesitationCount,
          rhythm_std: parseFloat(rhythmStd.toFixed(3)),
          duration_sec: parseFloat(((Date.now() - metricsRef.current.startTs) / 1000).toFixed(1)),
          browser_transcript: metricsRef.current.transcript || '',  // Web Speech API fallback
        });

        const form = new FormData();
        form.append('audio', audioBlob, 'recording.webm');
        form.append('question', question);
        form.append('phase', phase);
        form.append('sample_answer', sampleAnswer || '');
        form.append('frontend_data', frontendData);
        if (questionId) form.append('question_id', questionId);

        const duration = parseFloat(((Date.now() - metricsRef.current.startTs) / 1000).toFixed(1));
        form.append('timeSpentSec', duration);

        const res = await evaluateSpeaking(form);
        onResult({
          ...(res.data.evaluation || res.data), // Fallback if backend doesn't wrap it yet
          reward: res.data.reward,
          audioUrl: res.data.audioUrl,
          frontendMetrics: { wpm, hesitationCount: metricsRef.current.hesitationCount, rhythmStd },
        });
      } catch (e) {
        console.error('evaluate error:', e);
        // Phao cứu sinh tầng cuối: tự tạo kết quả từ browser metrics
        const ts = metricsRef.current;
        const elapsed = (Date.now() - ts.startTs) / 1000 / 60;
        const wpmFallback = elapsed > 0 ? Math.round((ts.wordTimestamps?.length || 0) / elapsed) : 0;
        const hesitations = ts.hesitationCount || 0;
        let fluency = 3.0;
        if (wpmFallback >= 110 && wpmFallback <= 160) fluency = 7.5;
        else if (wpmFallback >= 90) fluency = 6.0;
        else if (wpmFallback >= 60) fluency = 5.0;
        else if (wpmFallback > 0) fluency = 4.0;
        fluency = parseFloat(Math.max(3.0, fluency - Math.min(hesitations * 0.4, 2.0)).toFixed(1));
        const overall = parseFloat(((fluency + 5.0 + 5.0 + 5.0) / 4).toFixed(1));

        onResult({
          transcript: ts.transcript || '',
          scores: { fluency, pronunciation: 5.0, lexical: 5.0, grammar: 5.0, overall },
          feedback: {
            fluency: `Tốc độ: ${wpmFallback} WPM. ${wpmFallback >= 110 && wpmFallback <= 160 ? 'Tốt!' : 'Luyện thêm để đạt 110-160 WPM.'}`,
            pronunciation: 'Không thể chấm điểm — máy chủ AI không phản hồi.',
            lexical: 'Không thể chấm điểm — máy chủ AI không phản hồi.',
            grammar: `Phát hiện ${hesitations} từ ngập ngừng. ${hesitations < 3 ? 'Tốt!' : 'Giảm bớt um/uh/ah.'}`,
          },
          mistakes: [],
          follow_up_question: 'Can you tell me more about that?',
          improved_answer: sampleAnswer || '',
          encouragement: '⚠️ AI đang bảo trì — điểm tạm tính từ trình duyệt. Luyện tiếp nhé!',
          source: 'browser-fallback',
          frontendMetrics: { wpm: wpmFallback, hesitationCount: hesitations, rhythmStd: 0 },
        });
        setRecState('idle');
      }
    };

    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, recState]);

  const pm = PART_META[phase] || PART_META.p2;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className={cn('text-xs font-bold px-3 py-1 rounded-full', pm.color)}>{pm.label}</span>
        <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-slate-500')}>
          Thời gian: {timeSec}s
        </span>
      </div>

      {/* Question card */}
      <div className={cn(
        'rounded-2xl border p-6 mb-6',
        isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200 shadow-sm',
      )}>
        <div className="flex items-start gap-3">
          <FaMicrophone className="text-indigo-400 mt-0.5 shrink-0" size={16} />
          <p className={cn('text-lg font-semibold leading-relaxed', isDark ? 'text-white' : 'text-slate-800')}>
            {question}
          </p>
        </div>
      </div>

      {/* Timer + Waveform */}
      <div className="flex items-center gap-6 mb-6">
        <CountdownTimer
          seconds={timeSec}
          running={timerActive}
          onExpire={recState === 'recording' ? stopRecording : undefined}
        />
        <div className="flex-1">
          <Waveform isRecording={recState === 'recording'} analyserRef={analyserRef} />
          <p className={cn('text-xs mt-1 text-center', isDark ? 'text-gray-500' : 'text-slate-400')}>
            {recState === 'idle' && 'Nhấn để bắt đầu ghi âm'}
            {recState === 'recording' && '🔴 Đang ghi âm...'}
            {recState === 'processing' && '⏳ Đang chấm điểm...'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Record / Stop button */}
      {recState === 'processing' ? (
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <LoadingCat size={120} />
          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>AI đang phân tích bài nói...</span>
        </div>
      ) : recState === 'recording' ? (
        <button onClick={stopRecording}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 hover:opacity-90 text-white font-bold flex items-center justify-center gap-2 transition-all">
          <FaStop size={14} /> Dừng & Nộp bài
        </button>
      ) : (
        <button onClick={startRecording}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold flex items-center justify-center gap-2 transition-all animate-pulse hover:animate-none">
          <FaMicrophone size={14} /> Bắt đầu nói
        </button>
      )}

      {/* Skip */}
      {recState === 'idle' && onSkip && (
        <button onClick={onSkip}
          className={cn('w-full mt-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
            isDark ? 'border-white/8 text-gray-500 hover:bg-white/3' : 'border-slate-200 text-slate-400 hover:bg-slate-50')}>
          Bỏ qua câu này
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RESULT PHASE
// ═══════════════════════════════════════════════════════════════════════════════
function ResultPhase({ isDark, t, results, topic, onRestart, onNewTopic }) {
  // results = array of { phase, question, evalResult }
  const overall = useMemo(() => {
    const valids = results.map(r => r.evalResult?.scores?.overall).filter(Boolean);
    if (!valids.length) return 0;
    return parseFloat((valids.reduce((a, b) => a + b, 0) / valids.length).toFixed(1));
  }, [results]);

  const stars = overall >= 7.5 ? 3 : overall >= 5.5 ? 2 : 1;
  const emoji = overall >= 7.5 ? '🏆' : overall >= 5.5 ? '🎉' : '💪';
  const msg = overall >= 7.5 ? 'Xuất sắc!' : overall >= 5.5 ? 'Tốt lắm!' : 'Cố gắng thêm!';

  const [show, setShow] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShow(true), 80); return () => clearTimeout(id); }, []);

  // Confetti dots
  const dots = [...Array(16)].map((_, i) => ({
    size: 6 + (i % 4) * 3,
    left: (i * 41 + 5) % 95,
    top: (i * 27 + 8) % 50,
    delay: (i * 0.16) % 1.2,
    duration: 1.2 + (i % 3) * 0.4,
    color: ['bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-amber-400', 'bg-emerald-400'][i % 5],
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Score card */}
      <div className={cn(
        'relative overflow-hidden rounded-3xl border text-center mb-6 transition-all duration-500',
        isDark ? 'bg-[#16181f] border-white/10' : 'bg-white border-slate-200 shadow-lg',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      )}>
        <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {dots.map((d, i) => (
            <div key={i}
              className={cn('absolute rounded-full opacity-50 animate-bounce', d.color)}
              style={{
                width: d.size, height: d.size, left: `${d.left}%`, top: `${d.top}%`,
                animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s`
              }} />
          ))}
        </div>

        <div className="relative px-8 pt-8 pb-10">
          <div className="text-5xl mb-3 animate-bounce" style={{ animationDuration: '1.5s' }}>{emoji}</div>
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3].map(s => (
              <FaStar key={s} size={28}
                className={s <= stars
                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : isDark ? 'text-white/15' : 'text-slate-200'} />
            ))}
          </div>
          <p className={cn('text-2xl font-extrabold mb-1', isDark ? 'text-white' : 'text-slate-800')}>{msg}</p>
          <p className={cn('text-sm mb-4', isDark ? 'text-gray-400' : 'text-slate-500')}>
            Band tổng thể: <span className={cn('font-bold text-lg', getBandColor(overall))}>{overall}</span> / 9.0
          </p>

          {/* Aggregated scores */}
          {results.length > 0 && results[results.length - 1].evalResult?.scores && (
            <div className={cn('rounded-2xl border p-4 text-left space-y-3 mb-6',
              isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200')}>
              {Object.entries({
                'Trôi chảy': results[results.length - 1].evalResult.scores.fluency,
                'Phát âm': results[results.length - 1].evalResult.scores.pronunciation,
                'Từ vựng': results[results.length - 1].evalResult.scores.lexical,
                'Ngữ pháp': results[results.length - 1].evalResult.scores.grammar,
              }).map(([label, val]) => (
                <BandBar key={label} label={label} value={val} isDark={isDark} />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={onRestart}
              className="w-full py-3 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2">
              <FaRedo size={12} /> Luyện lại chủ đề này
            </button>
            <button onClick={onNewTopic}
              className={cn('w-full py-3 rounded-2xl border font-semibold text-sm transition-colors',
                isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
              Chọn chủ đề khác
            </button>
          </div>
        </div>
      </div>

      {/* Detailed feedback per phase */}
      {results.map((r, idx) => {
        const ev = r.evalResult;
        if (!ev) return null;
        const pm = PART_META[r.phase] || PART_META.p2;
        return (
          <div key={idx}
            className={cn('rounded-2xl border p-5 mb-4',
              isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full', pm.color)}>{pm.label}</span>
              <span className={cn('text-xs truncate flex-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
                {r.question}
              </span>
            </div>

            {ev.transcript && (
              <div className={cn('text-xs rounded-xl p-3 mb-3 italic',
                isDark ? 'bg-white/5 text-gray-300' : 'bg-slate-50 text-slate-600')}>
                📝 "{ev.transcript}"
              </div>
            )}

            {/* Feedback bullets */}
            {ev.feedback && (
              <div className="space-y-2 mb-3">
                {Object.entries(ev.feedback).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <FaChevronRight size={10} className="text-indigo-400 mt-1 shrink-0" />
                    <p className={cn('text-xs', isDark ? 'text-gray-300' : 'text-slate-600')}>{v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Mistakes */}
            {ev.mistakes?.length > 0 && (
              <div className="mb-3">
                <p className={cn('text-xs font-bold mb-1', isDark ? 'text-rose-300' : 'text-rose-500')}>Lỗi phát hiện:</p>
                {ev.mistakes.map((m, mi) => (
                  <div key={mi} className={cn('text-xs rounded-lg px-3 py-2 mb-1',
                    isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600')}>
                    <span className="font-bold">"{m.word}"</span> — {m.error}
                    {m.fix && <span className={isDark ? ' text-emerald-300' : ' text-emerald-600'}> → {m.fix}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Improved answer */}
            {ev.improved_answer && (
              <div className={cn('rounded-xl p-3 border',
                isDark ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                <p className="text-xs font-bold mb-1 flex items-center gap-1">
                  <FaLightbulb size={10} /> Câu trả lời Band 7:
                </p>
                <p className="text-xs italic">{ev.improved_answer}</p>
              </div>
            )}

            {ev.encouragement && (
              <p className={cn('text-xs mt-2 text-center', isDark ? 'text-indigo-300' : 'text-indigo-500')}>
                ✨ {ev.encouragement}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SpeakingPractice() {
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();

  const LS_KEY = user?._id
    ? `speaking_topic_progress_${user._id}`
    : 'speaking_topic_progress'; // fallback khi chưa load user

  const [phase, setPhase] = useState(PHASE.TOPICS);
  const [topic, setTopic] = useState(null);
  const [warmupQ, setWarmupQ] = useState(null);
  const [mainQ, setMainQ] = useState(null);
  const [followupQ, setFollowupQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topicProgress, setTopicProgress] = useState({});
  const [rewardData, setRewardData] = useState(null);
  const [showReward, setShowReward] = useState(false);

  // Handle direct question loading via URL ID
  useEffect(() => {
    if (id && phase === PHASE.TOPICS) {
      setLoading(true);
      axiosInstance.get(`/speaking-questions/${id}`)
        .then(async (res) => {
          const q = res.data.data || res.data;
          const tid = q.topic_id?._id || q.topic_id;

          if (tid) {
            try {
              const [tRes, warmupRes] = await Promise.all([
                axiosInstance.get(`/topics/${tid}`),
                getSpeakingWarmup({ topic_id: tid })
              ]);
              setTopic(tRes.data.data || tRes.data);
              setWarmupQ(warmupRes.data.data);
              setMainQ(q);
              setPhase(PHASE.INTRO);
            } catch (err) {
              console.error('[SpeakingPractice] Error loading topic/warmup context:', err);
            }
          }
        })
        .catch(err => console.error('[SpeakingPractice] Error loading question from ID:', err))
        .finally(() => setLoading(false));
    }
  }, [id, phase]);

  // Load progress từ localStorage khi user đã có
  useEffect(() => {
    try {
      setTopicProgress(JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
    } catch { setTopicProgress({}); }
  }, [LS_KEY]);

  // Collected results from all phases
  const [results, setResults] = useState([]); // [{ phase, question, evalResult }]

  // ── 1. Topic selected → load warmup ──────────────────────────────────────
  const handleSelectTopic = useCallback(async (selectedTopic) => {
    setTopic(selectedTopic);
    setResults([]);
    setLoading(true);
    try {
      let [warmupRes, mainRes] = await Promise.all([
        getSpeakingWarmup({ topic_id: selectedTopic._id }),
        getSpeakingQuestions({ topic_id: selectedTopic._id, part: 'p2', limit: 1 }),
      ]);
      
      const warmupData = warmupRes.data.data;
      setWarmupQ(warmupData);
      
      let mains = mainRes.data.data || [];
      
      // FALLBACK: Nếu không có câu P2, lấy bất kỳ câu nào khác (limited 10 để tìm)
      if (mains.length === 0) {
        const fallbackRes = await getSpeakingQuestions({ topic_id: selectedTopic._id, limit: 10 });
        const allQs = fallbackRes.data.data || [];
        // Lọc bỏ câu warmup nếu lỡ trúng
        mains = allQs.filter(q => q._id !== warmupData?._id);
      }
      
      setMainQ(mains[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    setPhase(PHASE.INTRO);
  }, []);

  // ── 2. Warmup done ────────────────────────────────────────────────────────
  const handleWarmupResult = useCallback((evalResult) => {
    setResults(prev => [...prev, {
      phase: 'p1',
      question: warmupQ?.question || '',
      evalResult,
    }]);
    setPhase(PHASE.MAIN);
  }, [warmupQ]);

  // ── 3. Main done → use follow-up from AI result ───────────────────────────
  const handleMainResult = useCallback((evalResult) => {
    setResults(prev => [...prev, {
      phase: mainQ?.part || 'p2',
      question: mainQ?.question || '',
      evalResult,
    }]);
    // Pick follow-up: from AI response or from question's follow_up_questions
    const aiFollowup = evalResult?.follow_up_question;
    const storedFollowups = mainQ?.follow_up_questions || [];
    const chosen = aiFollowup
      || (storedFollowups.length > 0 ? storedFollowups[Math.floor(Math.random() * storedFollowups.length)] : null)
      || 'Can you expand more on what you just mentioned?';

    setFollowupQ(chosen);
    setPhase(PHASE.FOLLOWUP);
  }, [mainQ]);

  // ── 4. Followup done → save progress → result ────────────────────────────
  const handleFollowupResult = useCallback((evalResult) => {
    const newResults = [...results, {
      phase: 'p3',
      question: followupQ || '',
      evalResult,
    }];
    setResults(newResults);

    // ── Tính overall trung bình từ tất cả phases ──────────────────────────
    const allOveralls = newResults
      .map(r => r.evalResult?.scores?.overall)
      .filter(v => v != null && !isNaN(v));
    const avgOverall = allOveralls.length
      ? parseFloat((allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length).toFixed(1))
      : 0;

    // Per-criterion average
    const avgScore = (key) => {
      const vals = newResults.map(r => r.evalResult?.scores?.[key]).filter(v => v != null && !isNaN(v));
      return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
    };

    if (topic?._id) {
      const progress = {
        overall: avgOverall,
        scores: {
          fluency: avgScore('fluency'),
          pronunciation: avgScore('pronunciation'),
          lexical: avgScore('lexical'),
          grammar: avgScore('grammar'),
        },
        completedAt: new Date().toISOString(),
      };
      const updated = { ...topicProgress, [topic._id]: progress };
      setTopicProgress(updated);
      try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch (_) { }
    }

    if (evalResult?.reward) {
      setRewardData(evalResult.reward);
      setShowReward(true);
    }

    // Notify dashboard to refresh task progress
    dashboardRefreshEmitter.emit();

    setPhase(PHASE.RESULT);
  }, [followupQ, results, topic, topicProgress]);

  // ── Back / Restart ────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    setResults([]);
    setPhase(PHASE.INTRO);
  }, []);

  const handleNewTopic = useCallback(() => {
    setTopic(null);
    setResults([]);
    setWarmupQ(null);
    setMainQ(null);
    setFollowupQ(null);
    setPhase(PHASE.TOPICS);
  }, []);

  // ── Step progress bar ─────────────────────────────────────────────────────
  const STEPS = [
    { key: PHASE.WARMUP, label: 'Khởi Động' },
    { key: PHASE.MAIN, label: 'Phần Chính' },
    { key: PHASE.FOLLOWUP, label: 'Follow-up' },
    { key: PHASE.RESULT, label: 'Kết Quả' },
  ];
  const currentStepIdx = STEPS.findIndex(s => s.key === phase);
  const inSession = phase !== PHASE.TOPICS;

  return (
    <LearnLayout breadcrumbs={[{ label: '🎤 Luyện Speaking' }]}>
      <div className={cn('min-h-screen', t.page)}>

        {/* ── Top Bar ── */}
        <div className={cn('sticky top-0 z-30 border-b', isDark ? 'bg-[#0F1117]/95 border-white/5' : 'bg-white/95 border-slate-200')}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {inSession && (
                <button onClick={phase === PHASE.WARMUP ? handleNewTopic : handleNewTopic}
                  className={cn('p-2 rounded-xl transition-colors',
                    isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-500')}>
                  <FaArrowLeft size={14} />
                </button>
              )}
              <span className={cn('font-bold', isDark ? 'text-white' : 'text-slate-800')}>
                {inSession ? (topic?.name || 'Luyện Speaking') : '🎤 Luyện Speaking'}
              </span>
            </div>

            {/* Step Progress */}
            {inSession && (
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => {
                  const done = i < currentStepIdx;
                  const current = i === currentStepIdx;
                  return (
                    <React.Fragment key={s.key}>
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                        done ? 'bg-indigo-500 border-indigo-500 text-white'
                          : current ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                            : isDark ? 'border-white/15 text-white/30'
                              : 'border-slate-200 text-slate-300',
                      )}>
                        {done ? <FaCheck size={9} /> : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={cn('w-6 h-0.5 rounded', done ? 'bg-indigo-500' : isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Loading overlay ── */}
        {loading && (
          <div className="flex justify-center py-20">
            <FiLoader className="animate-spin text-indigo-400" size={32} />
          </div>
        )}

        {/* ── Phase Rendering ── */}
        {!loading && (
          <>
            {phase === PHASE.TOPICS && (
              <TopicsPhase isDark={isDark} t={t} onSelect={handleSelectTopic} topicProgress={topicProgress} />
            )}

            {phase === PHASE.INTRO && mainQ && (
              <LessonIntro
                title={mainQ.topic_id?.name || topic?.name || 'Luyện Speaking'}
                description={mainQ.question_text || 'Luyện kỹ năng giao tiếp và phát âm với các chủ đề IELTS thực tế.'}
                level={mainQ.level || 'intermediate'}
                type="speaking"
                isDark={isDark}
                stats={[
                  { icon: <FaMicrophone />, label: 'Kỹ năng', sub: 'Speaking' },
                  { icon: <FaClock />, label: 'Thời gian', sub: '15-20 phút' },
                  { icon: <FaTrophy />, label: 'Mục tiêu', sub: 'Fluency' }
                ]}
                onStart={() => setPhase(PHASE.WARMUP)}
                onBack={handleNewTopic}
              />
            )}

            {phase === PHASE.WARMUP && warmupQ && (
              <RecordingPanel
                isDark={isDark} t={t}
                question={warmupQ.question}
                phase="p1"
                timeSec={warmupQ.time_limit_sec || 15}
                sampleAnswer={warmupQ.sample_answer?.text || ''}
                questionId={warmupQ._id}
                onResult={handleWarmupResult}
                onSkip={() => setPhase(PHASE.MAIN)}
              />
            )}

            {phase === PHASE.MAIN && mainQ && (
              <RecordingPanel
                isDark={isDark} t={t}
                question={mainQ.question}
                phase={mainQ.part || 'p2'}
                timeSec={mainQ.time_limit_sec || 45}
                sampleAnswer={mainQ.sample_answer?.text || ''}
                questionId={mainQ._id}
                onResult={handleMainResult}
                onSkip={() => {
                  setFollowupQ('Can you tell me more about an experience related to this topic?');
                  setPhase(PHASE.FOLLOWUP);
                }}
              />
            )}

            {/* Fallback: no main question found */}
            {phase === PHASE.MAIN && !mainQ && (
              <div className="max-w-lg mx-auto px-4 py-12 text-center">
                <div className="text-4xl mb-3">😕</div>
                <p className={isDark ? 'text-gray-300' : 'text-slate-600'}>
                  Không tìm thấy câu hỏi Part 2 cho chủ đề này.
                </p>
                <button onClick={() => setPhase(PHASE.FOLLOWUP)}
                  className="mt-4 px-6 py-2 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:opacity-90">
                  Tiếp tục
                </button>
              </div>
            )}

            {phase === PHASE.FOLLOWUP && followupQ && (
              <RecordingPanel
                isDark={isDark} t={t}
                question={followupQ}
                phase="p3"
                timeSec={30}
                sampleAnswer=""
                onResult={handleFollowupResult}
                onSkip={() => setPhase(PHASE.RESULT)}
              />
            )}

            {phase === PHASE.RESULT && (
              <ResultPhase
                isDark={isDark} t={t}
                results={results}
                topic={topic}
                onRestart={handleRestart}
                onNewTopic={handleNewTopic}
              />
            )}
          </>
        )}
      </div>

      <RewardModal
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        title="HOÀN THÀNH LUYỆN NÓI!"
        subtitle="Bạn đã hoàn thành bài luyện tập xuất sắc!"
        primaryStat={{ 
          label: "Band Overall", 
          value: results.length ? (results.reduce((s, r) => s + (r.evalResult?.scores?.overall || 0), 0) / results.length).toFixed(1) : 0 
        }}
        reward={rewardData}
        theme={t}
      />
    </LearnLayout>
  );
}
