import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoryById, completeStoryPart, submitPartTranslations } from '../services/storyService';
import { dashboardRefreshEmitter } from '../utils/dashboardRefresh';
import {
  FaSpinner, FaStar, FaCoins, FaBolt, FaChevronRight,
  FaCheck, FaUndo, FaArrowRight, FaHome,
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';
import LearnLayout from '../components/learn/LearnLayout';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/dashboardTheme';

// ─── Phase enum ──────────────────────────────────────────────────────────────────
const PHASE = { READING: 'reading', GRADING: 'grading', REVERSE: 'reverse', COMPLETE: 'complete' };

// ─── Score helpers ────────────────────────────────────────────────────────────────
const scoreColor   = n => n >= 8 ? 'text-emerald-500' : n >= 5 ? 'text-amber-500' : 'text-rose-500';
const scoreBgLight = n =>
  n >= 8 ? 'bg-emerald-50 border-emerald-200' :
  n >= 5 ? 'bg-amber-50  border-amber-200'    :
           'bg-rose-50   border-rose-200';
const scoreBgDark  = n =>
  n >= 8 ? 'bg-emerald-500/10 border-emerald-500/25' :
  n >= 5 ? 'bg-amber-500/10  border-amber-500/25'    :
           'bg-rose-500/10   border-rose-500/25';
const scoreBg  = (n, isDark) => isDark ? scoreBgDark(n) : scoreBgLight(n);
const barColor = n => n >= 8 ? 'bg-emerald-400' : n >= 5 ? 'bg-amber-400' : 'bg-rose-400';

// ─── HintTooltip ──────────────────────────────────────────────────────────────────
function HintTooltip({ word, hint }) {
  const [show, setShow] = useState(false);
  const { isDark } = useTheme();
  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={cn(
          'underline decoration-dotted cursor-help font-semibold',
          isDark ? 'decoration-yellow-400 text-yellow-300' : 'decoration-indigo-400 text-indigo-600'
        )}
      >
        {word}
      </span>
      {show && (
        <span className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
          'px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-xl pointer-events-none',
          isDark
            ? 'bg-[#2A2545] border border-yellow-400/30 text-yellow-300'
            : 'bg-indigo-600 text-white'
        )}>
          {hint}
          <span className={cn(
            'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent',
            isDark ? 'border-t-[#2A2545]' : 'border-t-indigo-600'
          )} />
        </span>
      )}
    </span>
  );
}

// ─── ViText ───────────────────────────────────────────────────────────────────────
function ViText({ text, hints = [] }) {
  if (!hints.length) return <span>{text}</span>;
  const sorted = [...hints].sort((a, b) => b.word.length - a.word.length);
  let parts = [{ type: 'text', value: text }];
  sorted.forEach(({ word, hint }) => {
    parts = parts.flatMap(part => {
      if (part.type !== 'text') return [part];
      const idx = part.value.indexOf(word);
      if (idx === -1) return [part];
      const out = [];
      if (idx > 0) out.push({ type: 'text', value: part.value.slice(0, idx) });
      out.push({ type: 'hint', word, hint });
      const after = part.value.slice(idx + word.length);
      if (after) out.push({ type: 'text', value: after });
      return out;
    });
  });
  return (
    <span>
      {parts.map((p, i) =>
        p.type === 'hint'
          ? <HintTooltip key={i} word={p.word} hint={p.hint} />
          : <span key={i}>{p.value}</span>
      )}
    </span>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, isDark }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={cn('w-20 shrink-0', isDark ? 'text-gray-400' : 'text-slate-500')}>{label}</span>
      <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor(value))}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className={cn('w-5 text-right font-bold', scoreColor(value))}>{value}</span>
    </div>
  );
}

// ─── SentenceRow ──────────────────────────────────────────────────────────────────
function SentenceRow({ sentence, isActive, gradeResult, answer, onAnswerChange, onSubmitSingle }) {
  const inputRef = useRef(null);
  const { isDark } = useTheme();
  useEffect(() => { if (isActive && inputRef.current) inputRef.current.focus(); }, [isActive]);

  return (
    <div className={cn(
      'transition-all duration-300 rounded-2xl border p-5',
      isActive
        ? isDark
          ? 'border-yellow-400/50 bg-yellow-400/5 shadow-lg shadow-yellow-400/10'
          : 'border-indigo-300 bg-white shadow-md shadow-indigo-100'
        : isDark
          ? 'border-white/5 opacity-35 pointer-events-none'
          : 'border-slate-200 bg-slate-50/60 opacity-55 pointer-events-none'
    )}>
      <div className={cn('text-base font-semibold mb-3 leading-relaxed', isDark ? 'text-white' : 'text-slate-800')}>
        <ViText text={sentence.vi} hints={sentence.hints || []} />
      </div>

      {!gradeResult ? (
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmitSingle?.()}
          placeholder="Nhập bản dịch tiếng Anh…"
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition border',
            isDark
              ? 'bg-[#1A1830] border-white/10 text-white placeholder-gray-500 focus:border-yellow-400/50'
              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
          )}
        />
      ) : (
        <div className={cn('rounded-xl border p-4 mt-1 space-y-3', scoreBg(gradeResult.total, isDark))}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn('text-xs mb-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>Câu của bạn:</p>
              <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-800')}>
                {gradeResult.userAnswer || <span className="italic text-slate-400">Không có câu trả lời</span>}
              </p>
            </div>
            <span className={cn('text-2xl font-black shrink-0', scoreColor(gradeResult.total))}>
              {gradeResult.total}<span className="text-xs font-normal opacity-60">/10</span>
            </span>
          </div>
          <div className="space-y-1.5">
            <ScoreBar label="Từ vựng"   value={gradeResult.vocabulary}  isDark={isDark} />
            <ScoreBar label="Ngữ pháp"  value={gradeResult.grammar}     isDark={isDark} />
            <ScoreBar label="Tự nhiên"  value={gradeResult.naturalness} isDark={isDark} />
          </div>
          {gradeResult.feedback && (
            <p className={cn('text-xs pt-2 border-t leading-relaxed', isDark ? 'text-gray-300 border-white/10' : 'text-slate-600 border-slate-200')}>
              {gradeResult.feedback}
            </p>
          )}
          {gradeResult.suggestion && gradeResult.suggestion !== sentence.en_sample && (
            <p className={cn('text-xs', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
              <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Gợi ý: </span>
              {gradeResult.suggestion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ReverseSentenceRow ───────────────────────────────────────────────────────────
function ReverseSentenceRow({ sentence, isActive, answer, onAnswerChange, submitted }) {
  const inputRef = useRef(null);
  const { isDark } = useTheme();
  useEffect(() => { if (isActive && inputRef.current) inputRef.current.focus(); }, [isActive]);

  return (
    <div className={cn(
      'transition-all duration-300 rounded-2xl border p-5',
      isActive
        ? isDark
          ? 'border-indigo-400/50 bg-indigo-400/5 shadow-lg shadow-indigo-400/10'
          : 'border-indigo-300 bg-white shadow-md shadow-indigo-100'
        : isDark
          ? submitted ? 'border-white/10 opacity-70' : 'border-white/5 opacity-30 pointer-events-none'
          : submitted ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200 bg-slate-50/60 opacity-50 pointer-events-none'
    )}>
      <div className={cn('text-base font-semibold mb-1', isDark ? 'text-indigo-200' : 'text-indigo-700')}>
        {sentence.en_sample}
      </div>
      {submitted && (
        <div className={cn('text-xs mb-2 italic', isDark ? 'text-gray-400' : 'text-slate-500')}>
          Mẫu: <span className={cn('not-italic font-medium', isDark ? 'text-white' : 'text-slate-700')}>{sentence.vi}</span>
        </div>
      )}
      {!submitted ? (
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          placeholder="Dịch sang tiếng Việt…"
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition border',
            isDark
              ? 'bg-[#1A1830] border-indigo-400/30 text-white placeholder-gray-500 focus:border-indigo-400/60'
              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
          )}
        />
      ) : (
        <div className={cn('px-4 py-2.5 rounded-xl text-sm border', isDark ? 'bg-white/5 text-white border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200')}>
          {answer || <span className="italic text-slate-400">Không có câu trả lời</span>}
        </div>
      )}
    </div>
  );
}

// ─── CompletionScreen ─────────────────────────────────────────────────────────────
function CompletionScreen({ reward, nextPartNum, storyId, onReplay, navigate }) {
  const [show, setShow] = useState(false);
  const { isDark } = useTheme();
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center text-center px-6 transition-all duration-700',
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
      isDark ? 'bg-[#0F1117]' : 'bg-gradient-to-b from-white to-indigo-50'
    )}>
      <div className="text-7xl mb-4 animate-bounce">🎉</div>
      <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2">
        Xuất sắc!
      </h2>
      <p className={cn('text-sm mb-8', isDark ? 'text-gray-400' : 'text-slate-500')}>
        Bạn đã hoàn thành phần này thành công.
      </p>

      <div className="flex gap-4 mb-8 flex-wrap justify-center">
        {reward?.coins > 0 && (
          <div className={cn('flex flex-col items-center gap-1 rounded-2xl px-6 py-4 border',
            isDark ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-yellow-50 border-yellow-200')}>
            <FaCoins className="text-yellow-500 text-2xl" />
            <span className="text-yellow-500 font-black text-xl">+{reward.coins}</span>
            <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-slate-500')}>Xu</span>
          </div>
        )}
        {reward?.exp > 0 && (
          <div className={cn('flex flex-col items-center gap-1 rounded-2xl px-6 py-4 border',
            isDark ? 'bg-purple-400/10 border-purple-400/30' : 'bg-purple-50 border-purple-200')}>
            <FaBolt className="text-purple-500 text-2xl" />
            <span className="text-purple-500 font-black text-xl">+{reward.exp}</span>
            <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-slate-500')}>EXP thú cưng</span>
          </div>
        )}
      </div>

      {reward?.petState && (
        <div className={cn('mb-6 text-sm', isDark ? 'text-gray-300' : 'text-slate-600')}>
          Thú cưng đạt{' '}
          <span className={cn('font-bold', isDark ? 'text-purple-300' : 'text-purple-600')}>
            cấp {reward.petState.level}
          </span>
          {reward.petState.growthPoints !== undefined && (
            <span className={cn('ml-2', isDark ? 'text-gray-500' : 'text-slate-400')}>
              ({reward.petState.growthPoints} EXP tích lũy)
            </span>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onReplay}
          className={cn(
            'px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition border font-medium',
            isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
          )}
        >
          <FaUndo /> Chơi lại
        </button>
        {nextPartNum && (
          <button
            onClick={() => navigate(`/stories/${storyId}/parts/${nextPartNum}`)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-200"
          >
            Phần tiếp theo <FaArrowRight />
          </button>
        )}
        <button
          onClick={() => navigate('/stories')}
          className={cn(
            'px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition border font-medium',
            isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
          )}
        >
          <FaHome /> Sảnh chờ
        </button>
      </div>
    </div>
  );
}

// ─── Main StoryReader ─────────────────────────────────────────────────────────────
export default function StoryReader() {
  const { storyId, partNum } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [story,        setStory]        = useState(null);
  const [part,         setPart]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [phase,        setPhase]        = useState(PHASE.READING);
  const [activeIndex,  setActiveIndex]  = useState(0);
  const [answers,      setAnswers]      = useState({});
  const [gradeResults, setGradeResults] = useState(null);
  const [grading,      setGrading]      = useState(false);
  const [partScore,    setPartScore]    = useState(0);

  const [revAnswers,   setRevAnswers]   = useState({});
  const [revSubmitted, setRevSubmitted] = useState({});
  const [revIndex,     setRevIndex]     = useState(0);

  const [completing,   setCompleting]   = useState(false);
  const [completeError, setCompleteError] = useState(null);
  const [reward,       setReward]       = useState(null);
  const [nextPart,     setNextPart]     = useState(null);

  // ── Timer Logic ──
  const startTimeRef = useRef(null);
  useEffect(() => {
    if (phase === PHASE.READING && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  useEffect(() => {
    setLoading(true); setError('');
    setPhase(PHASE.READING); setActiveIndex(0);
    setAnswers({}); setGradeResults(null);
    setPartScore(0); setCompleteError(null);
    setRevAnswers({}); setRevSubmitted({}); setRevIndex(0);
    setReward(null);

    getStoryById(storyId)
      .then(r => {
        const s = r.data.data;
        setStory(s);
        const p = s.parts?.find(pt => pt.part_number === Number(partNum));
        if (!p) { setError('Không tìm thấy phần này'); return; }
        if (!p.isUnlocked) { setError('Phần này chưa được mở khóa. Hãy hoàn thành phần trước!'); return; }
        setPart(p);
        setNextPart(Number(partNum) < s.total_parts ? Number(partNum) + 1 : null);
      })
      .catch(() => setError('Không tải được câu chuyện'))
      .finally(() => setLoading(false));
  }, [storyId, partNum]);

  const breadcrumbs = [
    { label: 'Câu chuyện', to: '/stories' },
    { label: story?.title ? `${story.title} · Phần ${partNum}` : `Phần ${partNum}` },
  ];

  const handleGradeAll = async () => {
    if (!part) return;
    const sentenceList = [...(part.sentences || [])].sort((a, b) => a.order - b.order);
    const answersArr   = sentenceList.map(s => ({ order: s.order, answer: answers[s.order] || '' }));
    setGrading(true); setPhase(PHASE.GRADING);
    try {
      const r = await submitPartTranslations(storyId, partNum, answersArr);
      setGradeResults(r.data.data.results);
      setPartScore(r.data.data.partScore);
    } catch (e) { 
      console.error(e); 
      const msg = e.response?.data?.message || 'Lỗi khi chấm điểm bài dịch. Vui lòng thử lại sau!';
      alert(msg);
      setPhase(PHASE.READING); // Quay lại phase cũ nếu lỗi
    } finally { 
      setGrading(false); 
    }
  };

  const handleStartReverse = () => {
    setPhase(PHASE.REVERSE); setRevIndex(0);
    setRevAnswers({}); setRevSubmitted({});
  };

  const handleRevSubmit = order => {
    setRevSubmitted(prev => ({ ...prev, [order]: true }));
    const sents = [...(part.sentences || [])].sort((a, b) => a.order - b.order);
    if (revIndex < sents.length - 1) setRevIndex(i => i + 1);
    else handleComplete();
  };

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError(null);
    try {
      const timeSec = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      const r = await completeStoryPart(storyId, partNum, { partScore, timeSpentSec: timeSec });
      dashboardRefreshEmitter.emit();
      setReward(r.data.data.reward);
      setPhase(PHASE.COMPLETE);
    } catch (e) {
      console.error('[StoryReader] completeStoryPart failed:', e);
      const msg = e?.response?.data?.message || 'Lỗi khi lưu tiến trình. Vui lòng thử lại.';
      setCompleteError(msg);
    } finally {
      setCompleting(false);
    }
  };

  const handleReplay = () => {
    setPhase(PHASE.READING); setActiveIndex(0);
    setAnswers({}); setGradeResults(null);
    setGrading(false); setPartScore(0);
    setRevAnswers({}); setRevSubmitted({}); setRevIndex(0);
    setReward(null); setCompleteError(null);
  };

  // ── Design tokens ─────────────────────────────────────────────────────────────
  const pageBg   = isDark ? 'bg-[#0F1117]' : 'bg-gray-50';
  const topBarBg = isDark ? 'bg-[#0F1117]/90 border-white/8' : 'bg-white/95 border-slate-200';
  const divider  = isDark ? 'border-white/8' : 'border-slate-200';

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <LearnLayout breadcrumbs={breadcrumbs}>
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <LoadingCat size={250} text="Đang tải nội dung câu chuyện..." />
      </div>
    </LearnLayout>
  );

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) return (
    <LearnLayout breadcrumbs={breadcrumbs}>
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 ${pageBg}`}>
        <div className="text-5xl">🔒</div>
        <p className={cn('font-semibold text-lg', isDark ? 'text-white' : 'text-slate-800')}>{error}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/stories/${storyId}/parts/1`)} className="text-indigo-500 text-sm underline">
            Bắt đầu từ đầu
          </button>
          <button onClick={() => navigate('/stories')} className={cn('text-sm underline', isDark ? 'text-gray-400' : 'text-slate-500')}>
            ← Sảnh chờ
          </button>
        </div>
      </div>
    </LearnLayout>
  );

  // ── Complete ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.COMPLETE) {
    return (
      <LearnLayout breadcrumbs={breadcrumbs}>
        <CompletionScreen
          reward={reward} nextPartNum={nextPart}
          storyId={storyId} onReplay={handleReplay} navigate={navigate}
        />
      </LearnLayout>
    );
  }

  const sentences = [...(part?.sentences || [])].sort((a, b) => a.order - b.order);

  // ── Reverse Phase ─────────────────────────────────────────────────────────────
  if (phase === PHASE.REVERSE) return (
    <LearnLayout breadcrumbs={breadcrumbs}>
      <div className={`min-h-screen ${pageBg}`}>
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className={cn('flex items-center gap-3 mb-8 pb-4 border-b', divider)}>
            <button
              onClick={() => navigate('/stories')}
              className={cn('text-sm font-medium transition shrink-0', isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}
            >← Sảnh</button>
            <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((revIndex + 1) / sentences.length) * 100}%` }} />
            </div>
            <span className={cn('text-xs shrink-0 font-medium', isDark ? 'text-gray-400' : 'text-slate-500')}>
              {revIndex + 1}/{sentences.length}
            </span>
          </div>

          {/* Badge */}
          <div className="text-center mb-8">
            <span className={cn(
              'inline-block px-4 py-1.5 rounded-full text-sm font-semibold border',
              isDark ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            )}>
              🔄 Dịch ngược: EN → VI
            </span>
            <p className={cn('text-xs mt-2', isDark ? 'text-gray-500' : 'text-slate-400')}>
              Đọc câu tiếng Anh và dịch lại sang tiếng Việt
            </p>
          </div>

          <div className="space-y-4">
            {sentences.map((s, idx) => (
              <ReverseSentenceRow
                key={s.order} sentence={s}
                isActive={idx === revIndex}
                answer={revAnswers[s.order] || ''}
                onAnswerChange={v => setRevAnswers(prev => ({ ...prev, [s.order]: v }))}
                submitted={!!revSubmitted[s.order]}
              />
            ))}
          </div>

          {!revSubmitted[sentences[revIndex]?.order] && !completing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleRevSubmit(sentences[revIndex].order)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                {revIndex < sentences.length - 1
                  ? <><FaChevronRight /> Tiếp theo</>
                  : <><FaCheck /> Hoàn thành</>}
              </button>
            </div>
          )}

          {completing && (
            <div className="mt-6 flex flex-col items-center justify-end gap-3">
              <LoadingCat size={80} />
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-500')}>Đang lưu tiến trình…</span>
            </div>
          )}

          {completeError && !completing && (
            <div className={cn('mt-6 p-4 rounded-xl border flex items-start gap-3',
              isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            )}>
              <span className="text-lg shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{completeError}</p>
              </div>
              <button
                onClick={handleComplete}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-semibold border transition',
                  isDark ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30' : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                )}
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </LearnLayout>
  );

  // ── Grading Phase ─────────────────────────────────────────────────────────────
  if (phase === PHASE.GRADING) return (
    <LearnLayout>
      <div className={`min-h-screen ${pageBg}`}>
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className={cn('flex items-center gap-3 mb-8 pb-4 border-b', divider)}>
            <button
              onClick={() => navigate('/stories')}
              className={cn('text-sm font-medium transition', isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}
            >← Sảnh</button>
            <h2 className={cn('font-bold text-lg flex-1', isDark ? 'text-white' : 'text-slate-800')}>
              Kết quả chấm điểm
            </h2>
            {gradeResults && (
              <span className={cn('text-xl font-black', scoreColor(partScore))}>
                {partScore}<span className="text-sm font-normal opacity-60">/10</span>
              </span>
            )}
          </div>

          {!gradeResults ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <LoadingCat size={200} text="AI đang thẩm định bài dịch của bạn..." />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {gradeResults.map(r => (
                  <div key={r.order} className={cn('rounded-2xl border p-5', scoreBg(r.grade.total, isDark))}>
                    <div className={cn('text-xs font-bold uppercase tracking-wide mb-1', isDark ? 'text-gray-500' : 'text-slate-400')}>
                      Câu {r.order}
                    </div>
                    <div className={cn('font-semibold mb-4 text-base', isDark ? 'text-white' : 'text-slate-800')}>
                      {r.vi}
                    </div>
                    <div className="space-y-2 mb-4">
                      <ScoreBar label="Từ vựng"  value={r.grade.vocabulary}  isDark={isDark} />
                      <ScoreBar label="Ngữ pháp" value={r.grade.grammar}     isDark={isDark} />
                      <ScoreBar label="Tự nhiên" value={r.grade.naturalness} isDark={isDark} />
                    </div>
                    <div className={cn('flex items-start justify-between gap-2 text-sm border-t pt-3', isDark ? 'border-white/10' : 'border-slate-200/70')}>
                      <div>
                        <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Câu của bạn: </span>
                        <span className={cn('font-medium', isDark ? 'text-white' : 'text-slate-800')}>
                          {r.userAnswer || <span className="italic text-slate-400">Trống</span>}
                        </span>
                      </div>
                      <span className={cn('font-black text-xl shrink-0', scoreColor(r.grade.total))}>
                        {r.grade.total}/10
                      </span>
                    </div>
                    {r.grade.feedback && (
                      <p className={cn('text-xs mt-2 leading-relaxed', isDark ? 'text-gray-400' : 'text-slate-500')}>
                        {r.grade.feedback}
                      </p>
                    )}
                    {r.grade.suggestion && r.grade.suggestion !== r.en_sample && (
                      <p className={cn('text-xs mt-1', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                        <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Gợi ý: </span>
                        {r.grade.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleStartReverse}
                  className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                  🔄 Dịch ngược <FaArrowRight />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </LearnLayout>
  );

  // ── Reading / VI→EN Phase ─────────────────────────────────────────────────────
  const canSubmit   = sentences.some(s => (answers[s.order] || '').trim());
  const allAnswered = sentences.every(s => (answers[s.order] || '').trim());

  return (
    <LearnLayout>
      <div className={`min-h-screen ${pageBg}`}>

        {/* Sticky top bar */}
        <div className={cn('sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-sm', topBarBg)}>
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate('/stories')}
              className={cn('text-sm font-medium transition shrink-0', isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}
            >← Sảnh</button>
            <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((activeIndex + 1) / sentences.length) * 100}%` }} />
            </div>
            <span className={cn('text-xs shrink-0 font-medium', isDark ? 'text-gray-400' : 'text-slate-500')}>
              {activeIndex + 1}/{sentences.length}
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Story header */}
          <div className="mb-8">
            <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', isDark ? 'text-indigo-400' : 'text-indigo-500')}>
              {story?.title} · Phần {partNum}
            </p>
            <h2 className={cn('text-2xl font-black mb-2', isDark ? 'text-white' : 'text-slate-900')}>
              {part?.title}
            </h2>
            <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-slate-500')}>
              🖊️ Dịch từng câu sang tiếng Anh. Rê chuột vào từ{' '}
              <span className={cn('underline decoration-dotted font-semibold', isDark ? 'decoration-yellow-400 text-yellow-300' : 'decoration-indigo-400 text-indigo-600')}>
                gợi ý
              </span>{' '}để xem nghĩa.
            </p>
          </div>

          {/* Sentence rows */}
          <div className="space-y-4">
            {sentences.map((s, idx) => (
              <div key={s.order} onClick={() => idx <= activeIndex && setActiveIndex(idx)}>
                <SentenceRow
                  sentence={s}
                  isActive={idx === activeIndex}
                  gradeResult={null}
                  answer={answers[s.order] || ''}
                  onAnswerChange={v => setAnswers(prev => ({ ...prev, [s.order]: v }))}
                  onSubmitSingle={() => {
                    if (idx < sentences.length - 1)
                      setActiveIndex(i => Math.min(i + 1, sentences.length - 1));
                  }}
                />
              </div>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="mt-8 flex justify-between items-center gap-3">
            <button
              onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium transition border disabled:opacity-30',
                isDark
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
              )}
            >← Câu trước</button>

            {activeIndex < sentences.length - 1 ? (
              <button
                onClick={() => setActiveIndex(i => Math.min(i + 1, sentences.length - 1))}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                Câu tiếp theo <FaChevronRight />
              </button>
            ) : (
              <button
                onClick={handleGradeAll}
                disabled={!canSubmit}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-40"
              >
                <FaStar /> Chấm điểm
              </button>
            )}
          </div>

          {activeIndex === sentences.length - 1 && !allAnswered && canSubmit && (
            <p className={cn('text-center text-xs mt-3', isDark ? 'text-gray-500' : 'text-slate-400')}>
              Bạn chưa điền hết — nhấn "Chấm điểm" để nộp bài với các câu đã có.
            </p>
          )}
        </div>
      </div>
    </LearnLayout>
  );
}
