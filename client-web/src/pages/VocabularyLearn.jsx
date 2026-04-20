import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getTopicWords, completeVocabSession, getAiFill } from '../services/vocabService';
import {
  FaVolumeUp, FaArrowRight, FaArrowLeft, FaRedo, FaTimes,
  FaCheck, FaFire, FaStar, FaTrophy, FaCoins, FaBolt,
  FaHeart, FaRegSmile, FaGrinStars,
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';


// ─── Phases ──────────────────────────────────────────────────────────────────
const PHASE = { FLASHCARD: 'flashcard', PRACTICE: 'practice', GAME: 'game', RESULT: 'result' };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(word) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated progress bar at top */
function TopBar({ phase, t, onExit, topicName }) {
  const phases = [PHASE.FLASHCARD, PHASE.PRACTICE, PHASE.GAME, PHASE.RESULT];
  const idx    = phases.indexOf(phase);
  const labels = ['📖 Flashcard', '✍️ Luyện tập', '⚡ Mini-Game', '🏆 Kết quả'];

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 border-b', t.card, t.border)}>
      <button onClick={onExit} className={cn('p-2 rounded-lg hover:bg-white/10 transition', t.sub)}>
        <FaTimes />
      </button>
      <div className="flex-1">
        <div className="flex gap-1 mb-1">
          {phases.map((p, i) => (
            <div
              key={p}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                i <= idx ? 'bg-linear-to-r from-purple-500 to-blue-500' : 'bg-gray-700/40',
              )}
            />
          ))}
        </div>
        <p className={cn('text-xs', t.sub)}>
          {topicName} · {labels[idx]}
        </p>
      </div>
      <span className={cn('text-xs font-semibold px-2 py-1 rounded-full bg-purple-500/15 text-purple-400')}>
        {idx + 1}/4
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — Flashcard
// ═══════════════════════════════════════════════════════════════════════════════
function FlashcardPhase({ words, t, onComplete }) {
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({}); // wordId → 'hard'|'good'|'easy'

  const card = words[idx];
  const done = idx >= words.length;

  if (done) {
    const hardCount = Object.values(ratings).filter(r => r === 'hard').length;
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4">
        <div className="text-6xl">🎉</div>
        <h2 className={cn('text-2xl font-black text-center', t.text)}>
          Đã xem qua {words.length} từ!
        </h2>
        <p className={cn('text-sm text-center', t.sub)}>
          {hardCount > 0
            ? `Có ${hardCount} từ khó — bạn sẽ gặp lại chúng ở phần luyện tập.`
            : 'Bạn đã nắm vững tất cả! Tiếp tục luyện tập nhé.'}
        </p>
        <button
          onClick={() => onComplete(ratings)}
          className="px-8 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition"
        >
          Tiếp tục → Luyện tập
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 px-4 py-8 gap-6">
      {/* Counter */}
      <p className={cn('text-sm', t.sub)}>{idx + 1} / {words.length}</p>

      {/* Card */}
      <div
        className="w-full max-w-md cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => { setFlipped(f => !f); if (!flipped) speak(card.word); }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            height: '220px',
          }}
        >
          {/* Front */}
          <div
            className={cn(
              'absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-3 p-6 backface-hidden',
              t.card, t.border,
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className={cn('text-4xl font-black', t.text)}>{card.word}</span>
            {card.pronunciation && (
              <span className={cn('text-sm italic', t.sub)}>/{card.pronunciation}/</span>
            )}
            <button
              onClick={e => { e.stopPropagation(); speak(card.word); }}
              className={cn('p-2 rounded-lg hover:bg-blue-500/15 hover:text-blue-400 transition', t.sub)}
            >
              <FaVolumeUp />
            </button>
            <p className={cn('text-xs mt-2', t.sub)}>Nhấn để lật thẻ →</p>
          </div>

          {/* Back */}
          <div
            className={cn(
              'absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-3 p-6 text-center',
              'bg-linear-to-br from-purple-900/30 to-blue-900/30', t.border,
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className={cn('text-base font-bold', t.text)}>{card.meaning}</span>
            {card.example && (
              <p className={cn('text-xs italic border-l-2 border-purple-500/40 pl-2 text-left w-full', t.sub)}>
                {card.example}
              </p>
            )}
            {card.synonyms?.length > 0 && (
              <p className={cn('text-xs', t.sub)}>
                Syn: {card.synonyms.slice(0, 3).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons (only shown when flipped) */}
      {flipped && (
        <div className="flex gap-3">
          {[
            { key: 'hard', label: '😓 Khó',  cls: 'bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border-rose-500/30' },
            { key: 'good', label: '😊 Được',  cls: 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border-amber-500/30' },
            { key: 'easy', label: '😎 Dễ',   cls: 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border-emerald-500/30' },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => {
                setRatings(prev => ({ ...prev, [card._id]: r.key }));
                setFlipped(false);
                setIdx(i => i + 1);
              }}
              className={cn('px-4 py-2 rounded-xl border font-medium text-sm transition', r.cls)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Navigation row — luôn hiển thị */}
      <div className="flex items-center gap-4">
        {idx > 0 && (
          <button
            onClick={() => { setFlipped(false); setIdx(i => i - 1); }}
            className={cn('text-xs flex items-center gap-1 hover:text-purple-400 transition', t.sub)}
          >
            <FaArrowLeft /> Từ trước
          </button>
        )}
        {!flipped && (
          <button
            onClick={() => {
              setRatings(prev => ({ ...prev, [card._id]: 'good' }));
              setIdx(i => i + 1);
            }}
            className={cn('text-xs flex items-center gap-1 hover:text-purple-400 transition', t.sub)}
          >
            Bỏ qua <FaArrowRight />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Practice (MCQ + Fill-in)
// ═══════════════════════════════════════════════════════════════════════════════
function PracticePhase({ words, t, onComplete }) {
  // Build 2 types of questions: MCQ & Fill-in, alternating
  const [questions, setQuestions] = useState([]);
  const [qIdx,      setQIdx]      = useState(0);
  const [selected,  setSelected]  = useState(null);   // for MCQ
  const [fillInput, setFillInput] = useState('');     // for fill-in
  const [result,    setResult]    = useState(null);   // 'correct'|'wrong'
  const [score,     setScore]     = useState({ correct: 0, wrong: 0 });
  const [petHp,     setPetHp]     = useState(100);
  const [loadingAI, setLoadingAI] = useState(false);
  const [sentence,  setSentence]  = useState('');
  const [aiNotice,  setAiNotice]  = useState(null);
  const inputRef = useRef();

  // Build question list (up to 10, mix MCQ + fill-in)
  useEffect(() => {
    if (!words.length) return;
    const pool = shuffle(words).slice(0, Math.min(words.length, 10));
    const qs   = pool.map((w, i) => ({
      type:    i % 2 === 0 ? 'mcq' : 'fill',
      word:    w,
      choices: buildChoices(w, words),
    }));
    setQuestions(qs);
  }, [words]);

  function buildChoices(target, all) {
    const others = shuffle(all.filter(w => w._id !== target._id)).slice(0, 3);
    return shuffle([target, ...others]);
  }

  const q = questions[qIdx];

  // Load AI fill sentence when entering a fill question
  useEffect(() => {
    if (!q || q.type !== 'fill') return;
    setAiNotice(null);
    if (q.word.example) {
      setSentence(q.word.example.replace(new RegExp(`\\b${q.word.word}\\b`, 'gi'), '___'));
      return;
    }
    setLoadingAI(true);
    getAiFill(q.word.word, q.word.meaning, q.word.example)
      .then(d => setSentence(d.sentence || `___ means "${q.word.meaning}".`))
      .catch((err) => {
        const data = err?.response?.data || {};
        if (data?.code === 'QUOTA_EXCEEDED' || err?.response?.status === 403) {
          setAiNotice({
            type: 'quota',
            message: data?.message || 'Bạn đã hết lượt AI Fill trong ngày. Hệ thống đang chuyển sang chế độ câu mẫu cơ bản.',
          });
        }
        setSentence(`___ means "${q.word.meaning}".`);
      })
      .finally(() => setLoadingAI(false));
  }, [qIdx, q]);

  const handleAnswer = (isCorrect) => {
    setResult(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) setPetHp(hp => Math.max(0, hp - 10));
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong:   s.wrong   + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    setResult(null);
    setSelected(null);
    setFillInput('');
    setSentence('');
    if (qIdx + 1 >= questions.length) {
      onComplete(score.correct + (result === 'correct' ? 0 : 0), questions.length, score.wrong);
    } else {
      setQIdx(i => i + 1);
    }
  };

  if (!questions.length) return (
    <div className="flex items-center justify-center flex-1">
      <LoadingCat size={120} text="Đang tải câu hỏi..." />
    </div>
  );

  if (qIdx >= questions.length) return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4">
      <div className="text-6xl">✍️</div>
      <h2 className={cn('text-xl font-black text-center', t.text)}>Hoàn thành luyện tập!</h2>
      <p className={cn('text-sm', t.sub)}>{score.correct}/{questions.length} câu đúng</p>
      <button
        onClick={() => onComplete(score.correct, questions.length, score.wrong)}
        className="px-8 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg transition hover:opacity-90"
      >
        Tiếp tục → Mini-Game ⚡
      </button>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 px-4 py-6 gap-5 max-w-lg mx-auto w-full">
      {/* Pet HP bar */}
      <div className="flex items-center gap-2">
        <FaHeart className="text-rose-400 text-sm" />
        <div className="flex-1 h-2 rounded-full bg-gray-700/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-rose-500 to-pink-400 transition-all duration-500"
            style={{ width: `${petHp}%` }}
          />
        </div>
        <span className={cn('text-xs', t.sub)}>{petHp}/100</span>
        {/* Score */}
        <span className="ml-3 text-xs text-emerald-400 font-semibold">✓ {score.correct}</span>
        <span className="text-xs text-rose-400 font-semibold">✗ {score.wrong}</span>
      </div>

      {/* Progress */}
      <p className={cn('text-xs', t.sub)}>{qIdx + 1} / {questions.length}</p>

      {/* Question card */}
      <div className={cn('rounded-2xl border p-5 space-y-4', t.card, t.border)}>
        {aiNotice && (
          <div className="rounded-xl border px-3 py-2 text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 flex items-center justify-between gap-3">
            <span>{aiNotice.message}</span>
            <button
              onClick={() => window.location.assign('/pricing')}
              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 font-semibold whitespace-nowrap"
            >
              Nâng cấp
            </button>
          </div>
        )}

        {q.type === 'mcq' ? (
          <>
            <p className={cn('text-xs uppercase tracking-wide font-semibold text-purple-400')}>
              Chọn nghĩa đúng của từ:
            </p>
            <p className={cn('text-2xl font-black', t.text)}>{q.word.word}</p>
            {q.word.pronunciation && (
              <p className={cn('text-xs italic -mt-2', t.sub)}>/{q.word.pronunciation}/</p>
            )}
            <div className="grid grid-cols-1 gap-2">
              {q.choices.map(ch => {
                let cls = cn(
                  'text-left px-4 py-3 rounded-xl border text-sm transition font-medium',
                  t.border,
                );
                if (result) {
                  if (ch._id === q.word._id)
                    cls += ' border-emerald-500 bg-emerald-500/15 text-emerald-300';
                  else if (ch._id === selected?._id)
                    cls += ' border-rose-500 bg-rose-500/15 text-rose-300';
                  else
                    cls += cn(' opacity-50', t.sub);
                } else {
                  cls += cn(' hover:border-purple-500 hover:bg-purple-500/10 cursor-pointer', t.sub, t.text);
                }
                return (
                  <button
                    key={ch._id}
                    disabled={!!result}
                    className={cls}
                    onClick={() => {
                      if (result) return;
                      setSelected(ch);
                      handleAnswer(ch._id === q.word._id);
                    }}
                  >
                    {ch.meaning}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className={cn('text-xs uppercase tracking-wide font-semibold text-blue-400')}>
              Điền từ thích hợp:
            </p>
            {loadingAI ? (
              <div className="flex items-center gap-2 py-4">
                <LoadingCat size={60} />
                <span className={cn('text-sm', t.sub)}>AI đang tạo câu...</span>
              </div>
            ) : (
              <p className={cn('text-base leading-relaxed', t.text)}>
                {sentence.split('___').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={cn(
                        'inline-block border-b-2 px-1 min-w-16 text-center font-bold',
                        result === 'correct' ? 'border-emerald-400 text-emerald-400' :
                        result === 'wrong'   ? 'border-rose-400 text-rose-400' :
                        'border-purple-400 text-purple-300',
                      )}>
                        {result ? q.word.word : (fillInput || '...')}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </p>
            )}
            <p className={cn('text-xs', t.sub)}>Nghĩa: {q.word.meaning}</p>
            {!result && (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={fillInput}
                  onChange={e => setFillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && fillInput.trim()) {
                      handleAnswer(fillInput.trim().toLowerCase() === q.word.word.toLowerCase());
                    }
                  }}
                  placeholder="Nhập từ..."
                  className={cn(
                    'flex-1 px-4 py-2 rounded-xl border text-sm outline-none',
                    'bg-gray-700/30 focus:border-purple-500', t.border, t.text,
                  )}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (fillInput.trim())
                      handleAnswer(fillInput.trim().toLowerCase() === q.word.word.toLowerCase());
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition"
                >
                  OK
                </button>
              </div>
            )}
          </>
        )}

        {/* Feedback */}
        {result && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            result === 'correct' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300',
          )}>
            {result === 'correct' ? <FaCheck /> : <FaTimes />}
            {result === 'correct' ? '+10 coins! Chính xác! 🎉' : `Sai rồi! Đáp án: "${q.word.word}" — ${q.word.meaning}`}
          </div>
        )}
      </div>

      {result && (
        <button
          onClick={handleNext}
          className="self-end px-6 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl transition hover:opacity-90 flex items-center gap-2"
        >
          {qIdx + 1 < questions.length ? 'Tiếp theo' : 'Xem kết quả'} <FaArrowRight />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — Match Game
// ═══════════════════════════════════════════════════════════════════════════════
function GamePhase({ words, t, onComplete }) {
  const GAME_WORDS  = 6; // pairs
  const GAME_TIME   = 60;

  const [pairs,     setPairs]     = useState([]);
  const [selected,  setSelected]  = useState([]); // [{ id, side }]
  const [matched,   setMatched]   = useState(new Set());
  const [wrong,     setWrong]     = useState([]);
  const [timeLeft,  setTimeLeft]  = useState(GAME_TIME);
  const [combo,     setCombo]     = useState(0);
  const [maxCombo,  setMaxCombo]  = useState(0);
  const [score,     setScore]     = useState(0);
  const [done,      setDone]      = useState(false);
  const timerRef = useRef();

  useEffect(() => {
    const pool = shuffle(words).slice(0, GAME_WORDS);
    setPairs(pool);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setDone(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Check all matched
  useEffect(() => {
    if (pairs.length > 0 && matched.size === pairs.length) {
      clearInterval(timerRef.current);
      setTimeout(() => setDone(true), 600);
    }
  }, [matched, pairs]);

  const leftCards  = pairs.map(p => ({ id: p._id, text: p.word,    side: 'L' }));
  const rightCards = shuffle(pairs.map(p => ({ id: p._id, text: p.meaning, side: 'R' })));

  const handleSelect = (card) => {
    if (matched.has(card.id)) return;
    if (wrong.some(w => w.id === card.id && w.side === card.side)) return;

    if (selected.length === 0) {
      setSelected([card]);
      return;
    }
    const first = selected[0];
    if (first.id === card.id && first.side !== card.side) {
      // Match!
      setMatched(s => new Set([...s, card.id]));
      setSelected([]);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setScore(s => s + 10 + newCombo * 2);
    } else if (first.side === card.side) {
      setSelected([card]); // swap same side selection
    } else {
      // Wrong
      setWrong([first, card]);
      setCombo(0);
      setTimeout(() => {
        setWrong([]);
        setSelected([]);
      }, 800);
    }
  };

  const cardStyle = (card) => {
    const isMatched  = matched.has(card.id);
    const isSelected = selected.some(s => s.id === card.id && s.side === card.side);
    const isWrong    = wrong.some(w => w.id === card.id && w.side === card.side);
    return cn(
      'px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer text-center',
      isMatched  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 opacity-60 cursor-default scale-95' :
      isWrong    ? 'border-rose-500 bg-rose-500/20 text-rose-300 scale-95 animate-shake' :
      isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-200 scale-105 shadow-lg shadow-purple-500/20' :
                   cn('hover:border-purple-400 hover:bg-purple-500/10 hover:scale-102', t.border, t.text),
    );
  };

  // Khi done → hiện màn hình kết quả với nút bấm (tránh stale closure trong useEffect)
  if (done) {
    const pct = pairs.length > 0 ? Math.round(matched.size / pairs.length * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-5 px-4">
        <div className="text-7xl">{pct === 100 ? '⚡' : pct >= 50 ? '🎮' : '😅'}</div>
        <h2 className={cn('text-xl font-black text-center', t.text)}>
          {pct === 100 ? 'Hoàn hảo! Nối hết rồi!' : `Nối được ${matched.size}/${pairs.length} cặp`}
        </h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-amber-400">{score}</p>
            <p className={cn('text-xs', t.sub)}>Điểm</p>
          </div>
          <div>
            <p className="text-2xl font-black text-purple-400">×{maxCombo}</p>
            <p className={cn('text-xs', t.sub)}>Combo</p>
          </div>
        </div>
        <button
          onClick={() => onComplete(matched.size, score, maxCombo)}
          className="px-8 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg transition hover:opacity-90 flex items-center gap-2 text-base"
        >
          <FaTrophy /> Xem kết quả
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-4 py-5 gap-4 max-w-lg mx-auto w-full">
      {/* Timer + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'text-lg font-black tabular-nums',
            timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-blue-400',
          )}>
            ⏱ {timeLeft}s
          </div>
          <div className="w-24 h-1.5 rounded-full bg-gray-700/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {combo >= 2 && (
            <span className="text-amber-400 font-bold text-sm animate-bounce">
              🔥 Combo ×{combo}
            </span>
          )}
          <span className={cn('font-bold text-sm', t.text)}>{score} điểm</span>
        </div>
      </div>

      <p className={cn('text-xs text-center', t.sub)}>
        Chọn từ ở cột trái rồi chọn nghĩa tương ứng ở cột phải
      </p>

      {/* Match grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {leftCards.map(card => (
            <button key={card.id + 'L'} onClick={() => handleSelect(card)} className={cardStyle(card)}>
              {card.text}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rightCards.map(card => (
            <button key={card.id + 'R'} onClick={() => handleSelect(card)} className={cardStyle(card)}>
              {card.text}
            </button>
          ))}
        </div>
      </div>

      {/* Matched count */}
      <p className={cn('text-center text-xs', t.sub)}>
        {matched.size} / {pairs.length} cặp đã ghép
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — Result
// ═══════════════════════════════════════════════════════════════════════════════
function ResultPhase({ summary, t, topicName, onReplay, onExit }) {
  const { practiceCorrect, practiceTotal, gameScore, gameCombo, coinsEarned, expEarned, accuracy, petHp } = summary;
  const stars = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1;

  return (
    /* Overlay */
    <div className="fixed inset-0 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 2147483647 }}>

      {/* Modal card */}
      <div
        className={cn(
          'relative w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden',
          'animate-[fadeInUp_0.35s_ease-out]',
          t.card, t.border,
        )}
        style={{ animation: 'fadeInUp 0.35s ease-out' }}
      >
        {/* Gradient header */}
        <div className="bg-linear-to-r from-purple-600 via-blue-600 to-indigo-600 px-6 pt-8 pb-10 flex flex-col items-center gap-3">
          {/* Stars */}
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <FaStar
                key={i}
                className={cn(
                  'text-4xl drop-shadow transition-all',
                  i <= stars ? 'text-amber-300 scale-110' : 'text-white/20',
                )}
                style={i <= stars ? { filter: 'drop-shadow(0 0 8px #fbbf24)' } : {}}
              />
            ))}
          </div>
          <h2 className="text-2xl font-black text-white text-center">
            {accuracy >= 90 ? '🏆 Xuất sắc!' : accuracy >= 60 ? '🎉 Tốt lắm!' : '💪 Cố lên!'}
          </h2>
          <p className="text-white/70 text-sm text-center">{topicName}</p>
        </div>

        {/* Stats — float over the header bottom */}
        <div className={cn('mx-5 -mt-5 rounded-2xl border shadow-lg p-4 space-y-3', t.card, t.border)}>
          {[
            { icon: <FaCheck />, iconCls: 'text-emerald-400', label: 'Độ chính xác',    val: `${accuracy}%`,           valCls: 'text-emerald-400' },
            { icon: <FaCoins />, iconCls: 'text-amber-400',   label: 'Coins kiếm được', val: `+${coinsEarned} 🪙`,     valCls: 'text-amber-400'  },
            { icon: <FaBolt  />, iconCls: 'text-blue-400',    label: 'EXP nhận được',   val: `+${expEarned} ⚡`,       valCls: 'text-blue-400'   },
            { icon: <FaFire  />, iconCls: 'text-orange-400',  label: 'Combo cao nhất',  val: `×${gameCombo}`,          valCls: 'text-orange-400' },
            { icon: <FaHeart />, iconCls: 'text-rose-400',    label: 'HP thú cưng',     val: `${petHp ?? 100}/100 ❤️`, valCls: petHp < 30 ? 'text-rose-500 font-black' : 'text-rose-300' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <div className={cn('flex items-center gap-2 text-sm', s.iconCls)}>
                {s.icon}
                <span className={cn('text-sm', t.sub)}>{s.label}</span>
              </div>
              <span className={cn('font-bold text-sm', s.valCls)}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-5 py-5">
          <button
            onClick={onReplay}
            className={cn(
              'flex-1 py-3 rounded-xl border font-bold text-sm transition',
              'flex items-center justify-center gap-2',
              t.border, t.text, 'hover:bg-white/10 active:scale-95',
            )}
          >
            <FaRedo /> Chơi lại
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:opacity-90 active:scale-95 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
          >
            <FaTrophy /> Hoàn thành
          </button>
        </div>
      </div>

      {/* Keyframe */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VocabularyLearn() {
  const { topicId } = useParams();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const t           = isDark ? darkTheme : theme;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [phase,   setPhase]   = useState(PHASE.FLASHCARD);
  const [summary, setSummary] = useState({
    practiceCorrect: 0, practiceTotal: 0, practiceWrong: 0,
    gameScore: 0, gameCombo: 0,
    coinsEarned: 0, expEarned: 0, accuracy: 0, petHp: 100,
  });
  // Ref để đọc summary mới nhất trong async callback (tránh stale closure)
  const summaryRef = useRef({
    practiceCorrect: 0, practiceTotal: 0, practiceWrong: 0,
    gameScore: 0, gameCombo: 0,
    coinsEarned: 0, expEarned: 0, accuracy: 0, petHp: 100,
  });
  const setSummarySync = (updater) => {
    setSummary(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      summaryRef.current = next;
      return next;
    });
  };
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    sessionStartRef.current = Date.now();
    getTopicWords(topicId)
      .then(d => setData(d))
      .catch(() => setError('Không tải được từ vựng'))
      .finally(() => setLoading(false));
  }, [topicId]);

  const handleFlashcardDone = useCallback(() => {
    setPhase(PHASE.PRACTICE);
  }, []);

  const handlePracticeDone = useCallback(async (correct, total, wrongCount) => {
    setSummarySync(s => ({ ...s, practiceCorrect: correct, practiceTotal: total, practiceWrong: wrongCount }));
    setPhase(PHASE.GAME);
  }, []);

  const handleGameDone = useCallback((matchedCount, gameScore, maxCombo) => {
    // Hiện modal NGAY — không await API
    const wordIds  = (data?.words || []).map(w => w._id);
    const correctQ = summaryRef.current.practiceCorrect;
    const totalQ   = summaryRef.current.practiceTotal || wordIds.length || 1;
    const wrongQ   = summaryRef.current.practiceWrong;
    const accuracy = Math.round((correctQ / totalQ) * 100);

    // Cập nhật summary ngay để modal có dữ liệu
    setSummarySync(s => ({
      ...s,
      gameScore, gameCombo: maxCombo, accuracy,
    }));
    setPhase(PHASE.RESULT);

    // Gọi API save ở background
    completeVocabSession(topicId, {
      correctCount: correctQ,
      totalCount:   totalQ,
      wordIds,
      wrongCount:   wrongQ,
      timeSpentSec: Math.max(0, Math.round((Date.now() - (sessionStartRef.current || Date.now())) / 1000)),
    }).then(result => {
      console.log('[VocabLearn] saved:', result);
      setSummarySync(s => ({
        ...s,
        coinsEarned: result.coinsEarned || 0,
        expEarned:   result.expEarned   || 0,
        petHp:       result.pet?.hp ?? 100,
      }));
    }).catch(err => {
      console.error('[VocabLearn] save error:', err?.response?.data || err?.message);
    });
  }, [topicId, data]);

  const handleReplay = () => {
    sessionStartRef.current = Date.now();
    const init = { practiceCorrect: 0, practiceTotal: 0, practiceWrong: 0, gameScore: 0, gameCombo: 0, coinsEarned: 0, expEarned: 0, accuracy: 0, petHp: 100 };
    summaryRef.current = init;
    setSummary(init);
    setPhase(PHASE.FLASHCARD);
  };

  // ⚠️ useMemo PHẢI ở đây — trước mọi early return, để không vi phạm Rules of Hooks
  // Khi data chưa load, words = [] → useMemo trả về [] → không ảnh hưởng gì
  const words         = data?.words || [];
  const topicName     = data?.topic?.name || 'Từ Vựng';
  const shuffledWords = useMemo(() => shuffle(words), [words]);

  // DEBUG: log phase transitions to help confirm modal should appear
  useEffect(() => {
    console.log('[VocabLearn] phase ->', phase);
  }, [phase]);

  if (loading) return (
    <div className={cn('min-h-screen flex items-center justify-center', t.page)}>
      <LoadingCat size={250} text="Đang chuẩn bị bài học cho bạn..." />
    </div>
  );

  if (error) return (
    <div className={cn('min-h-screen flex flex-col items-center justify-center gap-4', t.page)}>
      <p className="text-red-400">{error}</p>
      <button onClick={() => navigate(`/vocabulary/${topicId}`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
        Quay lại
      </button>
    </div>
  );

  if (!data?.words?.length) return (
    <div className={cn('min-h-screen flex flex-col items-center justify-center gap-4', t.page)}>
      <p className={t.sub}>Chủ đề này chưa có từ vựng nào.</p>
      <button onClick={() => navigate('/vocabulary')} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
        Quay lại
      </button>
    </div>
  );

  return (
    <div className={cn('min-h-screen flex flex-col', t.page)}>
      <TopBar
        phase={phase}
        t={t}
        topicName={topicName}
        onExit={() =>
          phase === PHASE.RESULT
            ? navigate('/vocabulary', { state: { refresh: true } })
            : navigate(`/vocabulary/${topicId}`)
        }
      />

      <div className="flex flex-col flex-1">
        {phase === PHASE.FLASHCARD && (
          <FlashcardPhase words={shuffledWords} t={t} onComplete={handleFlashcardDone} />
        )}
        {phase === PHASE.PRACTICE && (
          <PracticePhase words={words} t={t} onComplete={handlePracticeDone} />
        )}
        {phase === PHASE.GAME && (
          <GamePhase words={words} t={t} onComplete={handleGameDone} />
        )}
      </div>

      {/* Modal kết quả — nằm ngoài mọi container để fixed inset-0 không bị clipped */}
      {phase === PHASE.RESULT && (
        <ResultPhase
          summary={summary}
          t={t}
          topicName={topicName}
          onReplay={handleReplay}
          onExit={() => navigate('/vocabulary', { state: { refresh: true } })}
        />
      )}
    </div>
  );
}
