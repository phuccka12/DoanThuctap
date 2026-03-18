/**
 * GrammarLesson.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 4-Stage Grammar Journey:
 *   Stage 1 – Hook (câu hỏi mồi, không tính điểm)
 *   Stage 2 – Theory (thẻ lý thuyết, vuốt ngang)
 *   Stage 3 – Arena  (mini-games, tính HP pet)
 *   Stage 4 – Glory  (kết quả, thưởng, ôn sai)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import LearnLayout from '../components/learn/LearnLayout';
import { getGrammarLesson, completeGrammarLesson } from '../services/learningService';
import ReactMarkdown from 'react-markdown';
import {
  FaArrowRight, FaArrowLeft, FaCheck, FaTimes, FaHeart,
  FaTrophy, FaFire, FaStar, FaRedo, FaBook,
  FaSpinner, FaChevronRight, FaCheckCircle, FaCoins,
  FaBolt, FaLightbulb, FaExclamationTriangle,
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// ─── Helpers ────────────────────────────────────────────────────────────────
const STAGE = { HOOK: 1, THEORY: 2, ARENA: 3, GLORY: 4 };

const LEVEL_COLOR = {
  beginner:     'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  intermediate: 'text-amber-400   bg-amber-500/15   border-amber-500/30',
  advanced:     'text-rose-400    bg-rose-500/15    border-rose-500/30',
};
const LEVEL_LABEL = { beginner: 'Sơ cấp', intermediate: 'Trung cấp', advanced: 'Nâng cao' };

const MAX_HP = 5;

// ── Progress bar at top ──────────────────────────────────────────────────────
function StageBar({ stage, isDark }) {
  const stages = [
    { num: 1, icon: '🎣', label: 'Mồi nhử' },
    { num: 2, icon: '📖', label: 'Khai sáng' },
    { num: 3, icon: '⚔️', label: 'Đấu trường' },
    { num: 4, icon: '🏆', label: 'Vinh danh' },
  ];
  return (
    <div className="flex items-center justify-between mb-8 relative">
      {/* connector line */}
      <div className={cn('absolute top-4 left-0 right-0 h-0.5', isDark ? 'bg-white/10' : 'bg-slate-200')} />
      <div
        className="absolute top-4 left-0 h-0.5 bg-purple-500 transition-all duration-500"
        style={{ width: `${((stage - 1) / 3) * 100}%` }}
      />
      {stages.map(s => (
        <div key={s.num} className="relative z-10 flex flex-col items-center gap-1">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
            stage > s.num
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
              : stage === s.num
                ? 'bg-purple-600 text-white ring-4 ring-purple-500/30 shadow-lg'
                : isDark ? 'bg-white/10 text-gray-500' : 'bg-slate-100 text-slate-400'
          )}>
            {stage > s.num ? <FaCheck size={10} /> : s.icon}
          </div>
          <span className={cn('text-xs hidden sm:block', stage >= s.num
            ? isDark ? 'text-purple-300' : 'text-purple-700'
            : isDark ? 'text-gray-600' : 'text-slate-400'
          )}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── HP Bar ───────────────────────────────────────────────────────────────────
function HpBar({ hp, isDark }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-rose-400">HP</span>
      {Array.from({ length: MAX_HP }).map((_, i) => (
        <FaHeart
          key={i}
          size={14}
          className={cn('transition-all duration-300', i < hp ? 'text-rose-500' : isDark ? 'text-white/15' : 'text-slate-200')}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — Hook  (one sub-component per question to force state reset)
// ─────────────────────────────────────────────────────────────────────────────

/** Single question card — state is fully fresh each time key changes */
function HookQuestion({ q, qIdx, total, isDark, t, onNext, isLast }) {
  const [chosen,   setChosen]   = useState(null);
  const [revealed, setReveal]   = useState(false);
  const [going,    setGoing]    = useState(false); // prevent double-click

  const pick = (opt) => {
    if (revealed) return;
    setChosen(opt);
    setReveal(true);
  };

  const handleNext = () => {
    if (going) return;
    setGoing(true);
    onNext(chosen);
  };

  const isRight = chosen === q.correct;

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', t.sub)}>Câu {qIdx + 1} / {total}</span>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full transition-colors', i <= qIdx ? 'bg-purple-500' : isDark ? 'bg-white/20' : 'bg-slate-200')} />
          ))}
        </div>
      </div>

      {/* No-penalty badge */}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs border', isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700')}>
        <FaExclamationTriangle size={12} />
        Bước khởi động — sai cũng không trừ điểm, cứ thoải mái!
      </div>

      {/* Question */}
      <div className={cn('rounded-2xl border p-6', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
        <p className={cn('text-lg font-semibold mb-6 leading-relaxed', t.text)}>{q.text}</p>

        <div className="space-y-3">
          {[{ opt: 'A', text: q.optionA }, { opt: 'B', text: q.optionB }].map(({ opt, text }) => {
            let style = isDark
              ? 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/50 hover:bg-white/10'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50';

            if (revealed) {
              if (opt === q.correct) {
                style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
              } else if (opt === chosen) {
                style = 'bg-rose-500/20 border-rose-500 text-rose-300';
              } else {
                style = isDark ? 'bg-white/5 border-white/10 text-gray-500 opacity-50' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
              }
            }

            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={revealed}
                className={cn('w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200 font-medium', style)}
              >
                <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                  revealed && opt === q.correct ? 'bg-emerald-500 text-white' :
                  revealed && opt === chosen     ? 'bg-rose-500 text-white' :
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                )}>{opt}</span>
                <span className="flex-1">{text}</span>
                {revealed && opt === q.correct && <FaCheck className="text-emerald-400 shrink-0" />}
                {revealed && opt === chosen && opt !== q.correct && <FaTimes className="text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Reveal feedback */}
        {revealed && (
          <div className={cn('mt-4 flex items-start gap-3 rounded-xl p-4 border',
            isRight
              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
          )}>
            <FaLightbulb size={16} className="shrink-0 mt-0.5" />
            <span className="text-sm">
              {isRight
                ? '✅ Chính xác! Tiếp tục để hiểu tại sao bạn đúng...'
                : `❓ Đáp án đúng là ${q.correct}. Đừng lo — phần tiếp theo sẽ giải thích rõ!`
              }
            </span>
          </div>
        )}
      </div>

      {revealed && (
        <button
          onClick={handleNext}
          disabled={going}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          {isLast ? 'Xem lý thuyết ngay 🚀' : 'Câu tiếp theo'} <FaArrowRight />
        </button>
      )}
    </div>
  );
}

function StageHook({ lesson, isDark, t, onComplete }) {
  const questions = lesson.hook?.questions || [];
  const [qIdx,    setQIdx]    = useState(0);
  // Use ref so handleNext always reads latest answers without stale closure
  const answersRef = useRef([]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <FaLightbulb className="text-4xl text-yellow-400" />
        <p className={cn('text-base', t.sub)}>Bài này không có câu hỏi mồi. Đi thẳng tới lý thuyết!</p>
        <button
          onClick={() => onComplete([])}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Tiếp tục <FaArrowRight />
        </button>
      </div>
    );
  }

  const q      = questions[qIdx];
  const isLast = qIdx === questions.length - 1;

  // Called by HookQuestion when user taps next — always uses latest ref values
  const handleNext = (chosen) => {
    const record     = { q: q.text, chosen, correct: q.correct, isRight: chosen === q.correct };
    const newAnswers = [...answersRef.current, record];
    answersRef.current = newAnswers;

    if (isLast) {
      onComplete(newAnswers);
    } else {
      setQIdx(prev => prev + 1);   // triggers key change → fresh HookQuestion
    }
  };

  return (
    // key={qIdx} forces HookQuestion to unmount/remount → all local state (chosen, revealed) reset completely
    <HookQuestion
      key={qIdx}
      q={q}
      qIdx={qIdx}
      total={questions.length}
      isDark={isDark}
      t={t}
      isLast={isLast}
      onNext={handleNext}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — Theory Cards
// ─────────────────────────────────────────────────────────────────────────────
function StageTheory({ lesson, isDark, t, onComplete }) {
  const theory   = lesson.theory || {};
  const subCards = theory.subCards || [];
  const [cardIdx, setCardIdx] = useState(-1); // -1 = main card

  const total = 1 + subCards.length;
  const isLast = cardIdx === subCards.length - 1;

  return (
    <div className="space-y-6">
      {/* Tab dots */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCardIdx(-1)}
          className={cn('w-3 h-3 rounded-full transition-all duration-200', cardIdx === -1 ? 'bg-purple-500 scale-125' : isDark ? 'bg-white/20' : 'bg-slate-300')}
        />
        {subCards.map((_, i) => (
          <button
            key={i}
            onClick={() => setCardIdx(i)}
            className={cn('w-3 h-3 rounded-full transition-all duration-200', cardIdx === i ? 'bg-purple-500 scale-125' : isDark ? 'bg-white/20' : 'bg-slate-300')}
          />
        ))}
        <span className={cn('text-xs ml-2', t.sub)}>
          {cardIdx === -1 ? '📌 Thẻ chính' : `💡 Thẻ ${cardIdx + 1} / ${subCards.length}`}
        </span>
      </div>

      {/* Main Card */}
      {cardIdx === -1 && (
        <div className={cn(
          'rounded-2xl border-2 border-purple-500/40 p-6 relative overflow-hidden',
          isDark ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/30' : 'bg-gradient-to-br from-purple-50 to-indigo-50'
        )}>
          {/* glow orb */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📌</span>
            <span className={cn('text-xs font-bold uppercase tracking-widest', isDark ? 'text-purple-300' : 'text-purple-700')}>Công thức chính</span>
          </div>
          <div className={cn('prose prose-sm max-w-none', isDark ? 'prose-invert' : '')}>
            <ReactMarkdown
              components={{
                strong: ({ children }) => (
                  <strong className={cn('text-lg font-bold', isDark ? 'text-purple-200' : 'text-purple-800')}>{children}</strong>
                ),
                p: ({ children }) => <p className={cn('text-base leading-relaxed', t.text)}>{children}</p>,
                code: ({ children }) => (
                  <code className={cn('px-2 py-0.5 rounded text-sm font-mono', isDark ? 'bg-white/10 text-yellow-300' : 'bg-purple-100 text-purple-800')}>{children}</code>
                ),
              }}
            >
              {theory.mainCard || '*Bài này chưa có thẻ lý thuyết*'}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Sub Cards */}
      {cardIdx >= 0 && subCards[cardIdx] && (
        <div className={cn(
          'rounded-2xl border p-6',
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💡</span>
            <h3 className={cn('font-bold text-base', t.text)}>{subCards[cardIdx].title}</h3>
          </div>
          <p className={cn('text-sm leading-relaxed whitespace-pre-line', t.sub)}>{subCards[cardIdx].content}</p>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex items-center gap-3">
        {cardIdx > -1 && (
          <button
            onClick={() => setCardIdx(i => i - 1)}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              isDark ? 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            )}
          >
            <FaArrowLeft /> Trước
          </button>
        )}
        <div className="flex-1" />
        {!isLast ? (
          <button
            onClick={() => setCardIdx(i => i + 1)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Tiếp <FaArrowRight />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30"
          >
            Hiểu rồi, Thực hành thôi! 🚀
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — Arena (Minigames)
// ─────────────────────────────────────────────────────────────────────────────
function MultipleChoice({ mg, onAnswer }) {
  const [chosen, setChosen] = useState(null);
  const [locked, setLocked] = useState(false);
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const pick = (idx) => {
    if (locked) return;
    setChosen(idx);
    setLocked(true);
    setTimeout(() => onAnswer(idx === mg.correct, { chosen: idx, correct: mg.correct }), 900);
  };

  return (
    <div className="space-y-3">
      <p className={cn('text-base font-semibold', t.text)}>{mg.question}</p>
      <div className="space-y-2.5">
        {(mg.options || []).map((opt, idx) => {
          let style = isDark
            ? 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/50'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-300';
          if (locked) {
            if (idx === mg.correct) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
            else if (idx === chosen) style = 'bg-rose-500/20 border-rose-500 text-rose-300';
            else style = isDark ? 'bg-white/5 border-white/10 text-gray-600 opacity-40' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-40';
          }
          return (
            <button
              key={idx}
              onClick={() => pick(idx)}
              className={cn('w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium', style)}
            >
              <span className={cn('w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0',
                locked && idx === mg.correct ? 'bg-emerald-500 text-white' :
                locked && idx === chosen ? 'bg-rose-500 text-white' :
                isDark ? 'bg-white/10' : 'bg-slate-200'
              )}>{String.fromCharCode(65 + idx)}</span>
              {opt}
              {locked && idx === mg.correct && <FaCheck className="ml-auto text-emerald-400" size={12} />}
              {locked && idx === chosen && idx !== mg.correct && <FaTimes className="ml-auto text-rose-400" size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ErrorDetection({ mg, onAnswer }) {
  const [revealed, setReveal] = useState(false);
  const [input,    setInput]  = useState('');
  const [checked,  setChecked] = useState(false);
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const check = () => {
    if (!input.trim()) return;
    const isRight = input.trim().toLowerCase() === mg.correction?.toLowerCase();
    setChecked(true);
    setTimeout(() => onAnswer(isRight, { input, correct: mg.correction }), 900);
  };

  // Highlight the error word in sentence
  const parts = mg.sentence ? mg.sentence.split(new RegExp(`(${mg.errorWord})`, 'gi')) : [];

  return (
    <div className="space-y-4">
      <div className={cn('rounded-xl border p-4 text-sm leading-relaxed', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
        {parts.length > 1
          ? parts.map((p, i) =>
              p.toLowerCase() === mg.errorWord?.toLowerCase()
                ? <span key={i} className="bg-rose-500/30 text-rose-300 border-b-2 border-rose-500 px-0.5">{p}</span>
                : <span key={i} className={t.text}>{p}</span>
            )
          : <span className={t.text}>{mg.sentence}</span>
        }
      </div>
      <p className={cn('text-sm', t.sub)}>🔍 Tìm và sửa lỗi sai trong câu trên. Từ sai là: <strong className="text-rose-400">"{mg.errorWord}"</strong></p>
      <div className="flex gap-2">
        <input
          className={cn('flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors', t.input)}
          placeholder="Nhập từ đúng..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          disabled={checked}
        />
        <button
          onClick={check}
          disabled={checked || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Kiểm tra
        </button>
      </div>
      {mg.explanation && (
        <button
          onClick={() => setReveal(v => !v)}
          className={cn('text-xs flex items-center gap-1', isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700')}
        >
          <FaLightbulb size={11} /> {revealed ? 'Ẩn gợi ý' : 'Xem giải thích'}
        </button>
      )}
      {revealed && (
        <div className={cn('text-xs rounded-lg p-3 border', isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700')}>
          {mg.explanation}
        </div>
      )}
    </div>
  );
}

function WordOrder({ mg, onAnswer }) {
  const [words,   setWords]   = useState(() => [...(mg.words || [])].sort(() => Math.random() - 0.5));
  const [placed,  setPlaced]  = useState([]);
  const [checked, setChecked] = useState(false);
  const [isRight, setIsRight] = useState(false);
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const placeWord = (w, idx) => {
    if (checked) return;
    setWords(prev => prev.filter((_, i) => i !== idx));
    setPlaced(prev => [...prev, w]);
  };

  const removeWord = (w, idx) => {
    if (checked) return;
    setPlaced(prev => prev.filter((_, i) => i !== idx));
    setWords(prev => [...prev, w]);
  };

  const check = () => {
    const formed = placed.join(' ');
    const right  = formed.toLowerCase().trim() === (mg.correct || '').toLowerCase().trim();
    setIsRight(right);
    setChecked(true);
    setTimeout(() => onAnswer(right, { formed, correct: mg.correct }), 1000);
  };

  const reset = () => {
    setWords([...(mg.words || [])].sort(() => Math.random() - 0.5));
    setPlaced([]);
    setChecked(false);
  };

  return (
    <div className="space-y-4">
      <p className={cn('text-sm font-medium', t.sub)}>🔤 Sắp xếp các từ thành câu đúng</p>

      {/* Drop zone */}
      <div className={cn('min-h-14 rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors',
        placed.length === 0
          ? isDark ? 'border-white/15' : 'border-slate-300'
          : checked
            ? isRight ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'
            : isDark ? 'border-purple-500/40 bg-white/5' : 'border-purple-300 bg-purple-50'
      )}>
        {placed.length === 0
          ? <span className={cn('text-xs self-center', isDark ? 'text-gray-600' : 'text-slate-400')}>Nhấn các từ bên dưới để xếp vào đây...</span>
          : placed.map((w, i) => (
            <button
              key={i}
              onClick={() => removeWord(w, i)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                checked
                  ? isRight ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  : isDark ? 'bg-purple-600/30 text-purple-200 hover:bg-purple-600/50' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              )}
            >{w}</button>
          ))
        }
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <button
            key={i}
            onClick={() => placeWord(w, i)}
            disabled={checked}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              isDark
                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-purple-500/40'
                : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50'
            )}
          >{w}</button>
        ))}
      </div>

      {checked && !isRight && (
        <div className={cn('text-xs rounded-lg p-3 border', isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}>
          ✅ Câu đúng: <strong>{mg.correct}</strong>
        </div>
      )}

      <div className="flex gap-3">
        {!checked && (
          <>
            <button
              onClick={reset}
              className={cn('flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-colors',
                isDark ? 'border-white/10 text-gray-400 hover:border-white/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              <FaRedo size={11} /> Reset
            </button>
            <button
              onClick={check}
              disabled={placed.length === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Kiểm tra câu
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StageArena({ lesson, isDark, t, onComplete }) {
  const minigames = lesson.minigames || [];
  const [mgIdx,    setMgIdx]   = useState(0);
  const [hp,       setHp]      = useState(MAX_HP);
  const [results,  setResults] = useState([]);
  const [feedback, setFeedback] = useState(null); // { right: bool } | null
  const [waiting,  setWaiting] = useState(false);

  if (minigames.length === 0) {
    return (
      <div className="text-center py-16">
        <p className={cn('text-base', t.sub)}>Bài này chưa có mini-game. Tiếp tục nhận thưởng!</p>
        <button
          onClick={() => onComplete({ results: [], hp: MAX_HP })}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Tiếp tục <FaArrowRight className="inline ml-1" />
        </button>
      </div>
    );
  }

  const mg     = minigames[mgIdx];
  const isLast = mgIdx === minigames.length - 1;

  const handleAnswer = (isRight, detail) => {
    const newHp      = isRight ? hp : Math.max(0, hp - 1);
    const newResults = [...results, { mg, isRight, detail }];
    setHp(newHp);
    setResults(newResults);
    setFeedback({ isRight });
    setWaiting(true);
  };

  const advance = () => {
    setFeedback(null);
    setWaiting(false);
    if (isLast) {
      onComplete({ results: [...results], hp });
    } else {
      setMgIdx(i => i + 1);
    }
  };

  const gameType = {
    multiple_choice: 'Trắc nghiệm',
    error_detection: 'Tìm lỗi sai',
    word_order:      'Sắp xếp câu',
  }[mg.type] || mg.type;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border', isDark ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-700')}>
            Game {mgIdx + 1} / {minigames.length}
          </span>
          <span className={cn('text-xs', t.sub)}>{gameType}</span>
        </div>
        <HpBar hp={hp} isDark={isDark} />
      </div>

      {/* Progress */}
      <div className={cn('w-full h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-200')}>
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${((mgIdx) / minigames.length) * 100}%` }}
        />
      </div>

      {/* Game card — key=mgIdx forces full remount on each new game so state is always fresh */}
      <div className={cn('rounded-2xl border p-6', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
        {mg.type === 'multiple_choice' && <MultipleChoice key={mgIdx} mg={mg} onAnswer={handleAnswer} />}
        {mg.type === 'error_detection' && <ErrorDetection key={mgIdx} mg={mg} onAnswer={handleAnswer} />}
        {mg.type === 'word_order'      && <WordOrder      key={mgIdx} mg={mg} onAnswer={handleAnswer} />}
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div className={cn(
          'flex items-center justify-between rounded-xl border p-4',
          feedback.isRight
            ? isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            : isDark ? 'bg-rose-500/15 border-rose-500/30' : 'bg-rose-50 border-rose-200'
        )}>
          <div className="flex items-center gap-2">
            {feedback.isRight
              ? <><FaCheckCircle className="text-emerald-400" /> <span className={cn('text-sm font-semibold', isDark ? 'text-emerald-300' : 'text-emerald-700')}>Chính xác! +10 EXP 🎉</span></>
              : <><FaTimes className="text-rose-400" /> <span className={cn('text-sm font-semibold', isDark ? 'text-rose-300' : 'text-rose-700')}>Sai rồi! Pet mất 1 HP 💔</span></>
            }
          </div>
          <button
            onClick={advance}
            className={cn('flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
              feedback.isRight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            )}
          >
            {isLast ? 'Xem kết quả' : 'Tiếp'} <FaArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4 — Glory (results + review)
// ─────────────────────────────────────────────────────────────────────────────
function StageGlory({ lesson, hookAnswers, arenaResult, isDark, t, onReplay, onBack }) {
  const { results = [], hp = MAX_HP } = arenaResult || {};

  const totalGames = results.length;
  const correct    = results.filter(r => r.isRight).length;
  const wrong      = totalGames - correct;
  const pct        = totalGames ? Math.round((correct / totalGames) * 100) : 100;
  const isPerfect  = pct === 100 && totalGames > 0;

  const exp   = correct * 10 + (isPerfect ? 20 : 0);
  const coins = correct * 5  + (isPerfect ? 15 : 0);

  const emoji = pct >= 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 40 ? '👍' : '💪';
  const msg   = pct >= 100 ? 'Hoàn hảo tuyệt đối!' : pct >= 70 ? 'Làm tốt lắm!' : pct >= 40 ? 'Đang tiến bộ!' : 'Cần luyện thêm!';

  const wrongItems = results.filter(r => !r.isRight);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={cn(
        'rounded-2xl p-6 text-center border relative overflow-hidden',
        isPerfect
          ? isDark ? 'bg-gradient-to-br from-yellow-900/40 to-amber-900/30 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
          : isDark ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
      )}>
        {isPerfect && <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['🎉','✨','🌟','💫','⭐'].map((e, i) => (
            <span key={i} className="absolute text-xl animate-bounce" style={{ left: `${15 + i * 18}%`, top: `${10 + (i % 2) * 30}%`, animationDelay: `${i * 0.15}s` }}>{e}</span>
          ))}
        </div>}
        <div className="text-5xl mb-2">{emoji}</div>
        <h2 className={cn('text-2xl font-bold mb-1', t.text)}>{msg}</h2>
        <p className={cn('text-sm', t.sub)}>{lesson.title}</p>
        {isPerfect && (
          <div className={cn('inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-bold border',
            isDark ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800'
          )}>
            <FaBolt /> PERFECT COMBO!
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Độ chính xác', value: `${pct}%`, icon: FaStar,   color: 'text-yellow-400', bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50' },
          { label: 'EXP nhận được', value: `+${exp}`, icon: FaBolt,   color: 'text-purple-400', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50' },
          { label: 'Coins nhận được', value: `+${coins}`,icon: FaCoins, color: 'text-amber-400', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl p-4 text-center', s.bg, isDark ? 'border border-white/10' : 'border border-slate-100')}>
            <s.icon className={cn('text-xl mx-auto mb-1.5', s.color)} />
            <p className={cn('text-xl font-bold', t.text)}>{s.value}</p>
            <p className={cn('text-xs', t.sub)}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* HP remaining */}
      <div className={cn('flex items-center justify-between rounded-xl border p-4', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
        <div>
          <p className={cn('text-sm font-semibold', t.text)}>Pet của bạn</p>
          <p className={cn('text-xs mt-0.5', t.sub)}>{hp >= MAX_HP ? '🥰 Khoẻ mạnh bình thường!' : hp > 2 ? '😅 Bị thương nhẹ' : '😢 Cần hồi phục HP'}</p>
        </div>
        <HpBar hp={hp} isDark={isDark} />
      </div>

      {/* Wrong review */}
      {wrongItems.length > 0 && (
        <div className="space-y-2">
          <h3 className={cn('text-sm font-bold flex items-center gap-2', t.text)}>
            <FaExclamationTriangle className="text-rose-400" size={14} />
            Ôn lại câu sai ({wrongItems.length} câu)
          </h3>
          {wrongItems.map((item, i) => (
            <div key={i} className={cn('rounded-xl border p-4 text-sm space-y-1', isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200')}>
              {item.mg.type === 'multiple_choice' && (
                <>
                  <p className={cn('font-medium', t.text)}>{item.mg.question}</p>
                  <p className={cn('text-xs', isDark ? 'text-rose-400' : 'text-rose-600')}>❌ Bạn chọn: {item.mg.options?.[item.detail?.chosen] || '?'}</p>
                  <p className={cn('text-xs', isDark ? 'text-emerald-400' : 'text-emerald-600')}>✅ Đáp án đúng: {item.mg.options?.[item.mg.correct]}</p>
                </>
              )}
              {item.mg.type === 'error_detection' && (
                <>
                  <p className={cn('font-medium', t.text)}>{item.mg.sentence}</p>
                  <p className={cn('text-xs', isDark ? 'text-rose-400' : 'text-rose-600')}>❌ Bạn nhập: "{item.detail?.input}"</p>
                  <p className={cn('text-xs', isDark ? 'text-emerald-400' : 'text-emerald-600')}>✅ Đúng: "{item.mg.correction}"</p>
                  {item.mg.explanation && <p className={cn('text-xs', t.sub)}>💡 {item.mg.explanation}</p>}
                </>
              )}
              {item.mg.type === 'word_order' && (
                <>
                  <p className={cn('text-xs', isDark ? 'text-rose-400' : 'text-rose-600')}>❌ Bạn xếp: "{item.detail?.formed}"</p>
                  <p className={cn('text-xs', isDark ? 'text-emerald-400' : 'text-emerald-600')}>✅ Câu đúng: "{item.mg.correct}"</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            isDark ? 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
          )}
        >
          <FaArrowLeft size={12} /> Về danh sách
        </button>
        <button
          onClick={onReplay}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold transition-colors"
        >
          <FaRedo size={13} /> Học lại
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: GrammarLesson
// ─────────────────────────────────────────────────────────────────────────────
export default function GrammarLesson() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const t           = isDark ? darkTheme : theme;

  const [lesson,    setLesson]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [stage,     setStage]     = useState(STAGE.HOOK);
  const [hookAns,   setHookAns]   = useState([]);
  const [arenaRes,  setArenaRes]  = useState(null);
  const [submittedComplete, setSubmittedComplete] = useState(false);

  useEffect(() => {
    setLoading(true);
    getGrammarLesson(id)
      .then(r => setLesson(r.data?.data || r.data))
      .catch(() => navigate('/grammar'))
      .finally(() => setLoading(false));
  }, [id]);

  // When user reaches Glory stage, persist completion (so lobby shows progress)
  useEffect(() => {
    if (stage === STAGE.GLORY && arenaRes && !submittedComplete) {
      (async () => {
        try {
          // compute score from arena results: percent correct
          const results = arenaRes.results || [];
          const total = results.length;
          const correct = results.filter(r => r.isRight).length;
          const score = total ? Math.round((correct / total) * 100) : 100;
          await completeGrammarLesson(id, { score, completedNodes: results.map((r, i) => String(i)) });
          setSubmittedComplete(true);
        } catch (err) {
          console.error('[GrammarLesson] completeGrammar:', err);
        }
      })();
    }
  }, [stage, arenaRes, submittedComplete, id]);

  const replay = () => {
    setStage(STAGE.HOOK);
    setHookAns([]);
    setArenaRes(null);
  };

  if (loading) {
    return (
      <LearnLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingCat size={250} text="Đang chuẩn bị bài học ngữ pháp..." />
        </div>
      </LearnLayout>
    );
  }

  if (!lesson) return null;

  const lmColor = LEVEL_COLOR[lesson.level] || LEVEL_COLOR.intermediate;
  const lmLabel = LEVEL_LABEL[lesson.level] || lesson.level;

  return (
    <LearnLayout breadcrumbs={[
      { label: 'Ngữ pháp', path: '/grammar' },
      { label: lesson.title },
    ]}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Lesson header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', lmColor)}>{lmLabel}</span>
            </div>
            <h1 className={cn('text-xl font-bold', t.text)}>{lesson.title}</h1>
            {lesson.description && <p className={cn('text-sm mt-0.5', t.sub)}>{lesson.description}</p>}
          </div>
          <button
            onClick={() => navigate('/grammar')}
            className={cn('p-2 rounded-xl border shrink-0 transition-colors', isDark ? 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300')}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Stage progress bar */}
        <StageBar stage={stage} isDark={isDark} />

        {/* Stage content */}
        {stage === STAGE.HOOK && (
          <StageHook
            lesson={lesson}
            isDark={isDark}
            t={t}
            onComplete={(answers) => { setHookAns(answers); setStage(STAGE.THEORY); }}
          />
        )}
        {stage === STAGE.THEORY && (
          <StageTheory
            lesson={lesson}
            isDark={isDark}
            t={t}
            onComplete={() => setStage(STAGE.ARENA)}
          />
        )}
        {stage === STAGE.ARENA && (
          <StageArena
            lesson={lesson}
            isDark={isDark}
            t={t}
            onComplete={(res) => { setArenaRes(res); setStage(STAGE.GLORY); }}
          />
        )}
        {stage === STAGE.GLORY && (
          <StageGlory
            lesson={lesson}
            hookAnswers={hookAns}
            arenaResult={arenaRes}
            isDark={isDark}
            t={t}
            onReplay={replay}
            onBack={() => navigate('/grammar')}
          />
        )}
      </div>
    </LearnLayout>
  );
}
