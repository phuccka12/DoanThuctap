import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import LearnLayout from '../components/learn/LearnLayout';
import reverseTranslationService from '../services/reverseTranslationService';
import { FaCoins, FaFire, FaLanguage, FaLightbulb, FaCheckCircle, FaArrowRight, FaFlag } from 'react-icons/fa';

/* ─── Màu trạng thái câu ─────────────────────────────────────────────────── */
const STATUS_STYLE = {
  correct: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  partial: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  wrong:   'text-red-700 bg-red-50 border-red-200',
  pending: 'text-slate-700 bg-white border-slate-200',
};

const STATUS_ICON = { correct: '✅', partial: '⚠️', wrong: '❌', pending: '○' };

/* ─── Hint cost map ──────────────────────────────────────────────────────── */
const HINT_COSTS = { first_letter: 5, grammar: 10, view_passage: 15 };
const HINT_LABELS = {
  first_letter: '🔤 Chữ cái đầu (-5 🪙)',
  grammar:      '📐 Gợi ý ngữ pháp (-10 🪙)',
  view_passage: '📖 Xem bài đọc gốc (-15 🪙)',
};

/* ═══════════════════════════════════════════════════════════════════════════
   ReverseTranslationPlayer — main page
   Props (via URL): setId
═══════════════════════════════════════════════════════════════════════════ */
export default function ReverseTranslationPlayer() {
  const { setId } = useParams();
  const navigate  = useNavigate();
  const { isDark } = useTheme();
  const t          = isDark ? darkTheme : theme;

  /* ── state ─────────────────────────────────────────────────────────────── */
  const [loading, setLoading]   = useState(true);
  const [set, setSet]           = useState(null);       // ReverseTranslationSet
  const [session, setSession]   = useState(null);       // ReverseTranslationSession
  const [answers, setAnswers]   = useState({});         // { [itemId]: string }
  const [results, setResults]   = useState({});         // { [itemId]: gradeResult }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [combo, setCombo]       = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [grading, setGrading]   = useState(false);

  // Hint modal
  const [hintModal, setHintModal]     = useState(false);
  const [hintItemId, setHintItemId]   = useState(null);
  const [hintContent, setHintContent] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

  // Feedback flash
  const [flash, setFlash] = useState(null); // { type:'correct'|'wrong'|'combo', msg }

  // Shake animation flag
  const [shake, setShake] = useState(false);

  // Summary
  const [summary, setSummary] = useState(null);

  const textareaRef = useRef(null);

  /* ── Load bộ đề + start/resume session ───────────────────────────────────*/
  useEffect(() => {
    const init = async () => {
      try {
        const [setData, sessionData] = await Promise.all([
          reverseTranslationService.getSet(setId),
          reverseTranslationService.startSession(setId),
        ]);
        setSet(setData);
        setSession(sessionData);

        // Restore progress từ session (nếu resume)
        const restoredResults = {};
        const restoredAnswers = {};
        let lastIdx = 0;
        sessionData.results?.forEach((r, i) => {
          if (r.status !== 'pending') {
            restoredResults[r.itemId] = r;
            restoredAnswers[r.itemId] = r.userAnswer || '';
            lastIdx = i + 1;
          }
        });
        setResults(restoredResults);
        setAnswers(restoredAnswers);
        setCurrentIdx(Math.min(lastIdx, (setData.items?.length ?? 1) - 1));
        setCombo(sessionData.currentCombo || 0);
        setTotalCoins(sessionData.totalCoinsEarned || 0);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [setId]);

  // Focus textarea khi chuyển câu
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentIdx]);

  /* ── Nộp câu hiện tại ─────────────────────────────────────────────────── */
  const handleGrade = async () => {
    if (!session || grading) return;
    const item = set.items[currentIdx];
    if (!item) return;
    const answer = answers[item._id] || '';
    if (!answer.trim()) {
      setFlash({ type: 'wrong', msg: 'Bạn chưa nhập bản dịch 😅' });
      setTimeout(() => setFlash(null), 2000);
      return;
    }

    setGrading(true);
    try {
      const data = await reverseTranslationService.gradeItem(session._id, item._id, answer);
      const r = data.result;

      setResults(prev => ({ ...prev, [item._id]: r }));
      setCombo(data.session.currentCombo);
      setTotalCoins(data.session.totalCoinsEarned);

      if (r.status === 'correct') {
        const mult = r.comboMultiplier > 1 ? ` COMBO x${r.comboMultiplier}!` : '';
        setFlash({ type: 'correct', msg: `+${r.coinsEarned} 🪙${mult}` });
      } else if (r.status === 'partial') {
        setFlash({ type: 'partial', msg: '⚠️ Gần đúng rồi! Nhìn feedback nhé' });
      } else {
        setFlash({ type: 'wrong', msg: '❌ Sai rồi — con pet đang đói hơn nè 😢' });
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setTimeout(() => setFlash(null), 3000);

      // Nếu đúng / partial → tự chuyển câu tiếp sau 1.2s
      if (r.status !== 'wrong') {
        setTimeout(() => {
          if (currentIdx < set.items.length - 1) {
            setCurrentIdx(i => i + 1);
          }
        }, 1200);
      }
    } catch (err) {
      console.error('Grade error:', err?.response?.data || err.message);
      setFlash({ type: 'wrong', msg: err?.response?.data?.message || 'Lỗi kết nối' });
      setTimeout(() => setFlash(null), 3000);
    } finally {
      setGrading(false);
    }
  };

  /* ── Mua hint ─────────────────────────────────────────────────────────── */
  const openHintModal = (itemId) => {
    setHintItemId(itemId);
    setHintContent(null);
    setHintModal(true);
  };

  const handleBuyHint = async (hintType) => {
    if (!session || hintLoading) return;
    setHintLoading(true);
    try {
      const data = await reverseTranslationService.buyHint(session._id, hintItemId, hintType);
      setHintContent({ type: hintType, content: data.hintContent, cost: data.cost });
    } catch (err) {
      setHintContent({ type: 'error', content: err?.response?.data?.message || 'Lỗi', cost: 0 });
    } finally {
      setHintLoading(false);
    }
  };

  /* ── Hoàn thành session ───────────────────────────────────────────────── */
  const handleComplete = async () => {
    if (!session) return;
    try {
      const data = await reverseTranslationService.completeSession(session._id);
      setSummary(data);
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const allAnswered = set && set.items.every(item => results[item._id] && results[item._id].status !== 'pending');

  /* ─── LOADING ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <LearnLayout breadcrumbs={[{ label: 'Dịch ngược', to: '/reverse-translation' }, { label: 'Đang tải…' }]}>
        <div className="flex flex-col items-center justify-center min-h-64 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center">
              <FaLanguage className="text-[#6C5CE7] text-2xl" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-[#6C5CE7]/30 animate-ping" />
          </div>
          <p className={cn('text-sm font-medium', t.sub)}>Đang tải bộ đề...</p>
        </div>
      </LearnLayout>
    );
  }

  if (!set || !session) {
    return (
      <LearnLayout breadcrumbs={[{ label: 'Dịch ngược', to: '/reverse-translation' }]}>
        <div className={cn('rounded-3xl border p-10 text-center', t.card, t.border)}>
          <p className="text-3xl mb-3">😕</p>
          <p className={cn('font-medium mb-4', t.text)}>Không tìm thấy bộ đề.</p>
          <button
            onClick={() => navigate('/reverse-translation')}
            className="px-5 py-2.5 bg-[#6C5CE7] text-white font-bold rounded-2xl hover:bg-[#5a4cc9] transition-all"
          >
            Quay lại danh sách
          </button>
        </div>
      </LearnLayout>
    );
  }

  /* ─── SUMMARY SCREEN ─────────────────────────────────────────────────── */
  if (summary) {
    const trophy = summary.avgScore >= 75 ? '🏆' : summary.avgScore >= 50 ? '🎯' : '💪';
    return (
      <LearnLayout breadcrumbs={[{ label: 'Dịch ngược', to: '/reverse-translation' }, { label: set.title }]}>
        <div className="max-w-md mx-auto">
          <div className={cn('rounded-3xl border p-8 text-center', t.card, t.border)}>
            <div className="text-6xl mb-4">{trophy}</div>
            <h2 className={cn('text-2xl font-black mb-1', t.text)}>Kết quả luyện tập</h2>
            <p className={cn('text-sm mb-6', t.sub)}>{set.title}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/20' : 'bg-indigo-50 border-indigo-100')}>
                <p className="text-xs text-[#6C5CE7] font-bold uppercase tracking-wider">Điểm TB</p>
                <p className="text-3xl font-black text-[#6C5CE7]">{summary.avgScore}</p>
              </div>
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100')}>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Coin thực nhận</p>
                <p className="text-3xl font-black text-amber-500">+{summary.netCoins} 🪙</p>
              </div>
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100')}>
                <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Thưởng hoàn thành</p>
                <p className="text-2xl font-black text-emerald-500">+{summary.bonusCoins} 🪙</p>
              </div>
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100')}>
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Tiêu cho Hints</p>
                <p className="text-2xl font-black text-red-500">-{summary.totalCoinsSpentOnHints} 🪙</p>
              </div>
            </div>

            {summary.petState && (
              <div className={cn('rounded-2xl px-4 py-3 mb-5 text-sm font-medium border', {
                'bg-emerald-50 border-emerald-200 text-emerald-700':  summary.petState.status === 'happy',
                'bg-red-50 border-red-200 text-red-600':              summary.petState.status === 'dying',
                'bg-amber-50 border-amber-200 text-amber-700':        summary.petState.status === 'warning',
                [cn('border', t.border, t.sub)]:                      summary.petState.status === 'neutral',
              })}>
                {summary.petState.status === 'happy'   && '🐾 Pet đang vui! EXP buff đang kích hoạt.'}
                {summary.petState.status === 'dying'   && '⚠️ Pet đang hấp hối! Hãy cho nó ăn ngay.'}
                {summary.petState.status === 'warning' && '⚡ Pet hơi đói rồi đó, cho ăn thêm nhé.'}
                {summary.petState.status === 'neutral' && '😐 Pet ổn, tiếp tục học thêm nhé!'}
              </div>
            )}

            <button
              onClick={() => navigate('/reverse-translation')}
              className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5a4cc9] text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </LearnLayout>
    );
  }

  /* ─── MAIN PLAYER ────────────────────────────────────────────────────── */
  const sortedItems   = [...set.items].sort((a, b) => a.order - b.order);
  const currentItem   = sortedItems[currentIdx];
  const currentResult = currentItem ? results[currentItem._id] : null;

  return (
    <LearnLayout breadcrumbs={[{ label: 'Dịch ngược', to: '/reverse-translation' }, { label: set.title }]}>

      {/* ── Flash feedback (fixed overlay) ──────────────────────────────── */}
      {flash && (
        <div className={cn(
          'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl font-black text-white text-sm animate-bounce',
          flash.type === 'correct' ? 'bg-emerald-500' :
          flash.type === 'partial' ? 'bg-amber-500'   : 'bg-red-500'
        )}>
          {flash.msg}
        </div>
      )}

      {/* ── Session topbar strip ─────────────────────────────────────────── */}
      <div className={cn('flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-2xl border', t.card, t.border)}>

        {/* Left: title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center shrink-0">
            <FaLanguage className="text-[#6C5CE7] text-sm" />
          </div>
          <span className={cn('text-sm font-black truncate', t.text)}>{set.title}</span>
        </div>

        {/* Right: combo + coins + progress */}
        <div className="flex items-center gap-2 shrink-0">
          {combo >= 2 && (
            <div className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-xl border animate-pulse',
              isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
            )}>
              <FaFire className="text-orange-500 text-xs" />
              <span className="text-xs font-black text-orange-500">Combo x{combo >= 4 ? 3 : 2}</span>
            </div>
          )}
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border',
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          )}>
            <FaCoins className="text-amber-500 text-xs" />
            <span className="text-xs font-black text-amber-500">{totalCoins}</span>
          </div>
          <span className={cn('text-xs font-bold', t.sub)}>
            {sortedItems.filter(i => results[i._id] && results[i._id].status !== 'pending').length}
            /{sortedItems.length}
          </span>
        </div>
      </div>

      {/* ── Main flex layout ─────────────────────────────────────────────── */}
      <div className={cn('flex gap-4', shake ? 'animate-[shake_0.4s_ease-in-out]' : '')}>

        {/* Left: Sentence list (Spotlight view) */}
        <div className="hidden lg:flex flex-col gap-1.5 w-56 shrink-0">
          <p className={cn('text-xs font-bold uppercase tracking-wider mb-1 px-2', t.sub)}>Danh sách câu</p>
          {sortedItems.map((item, idx) => {
            const r         = results[item._id];
            const isCurrent = idx === currentIdx;
            const isDone    = r && r.status !== 'pending';
            const isFuture  = idx > currentIdx && !isDone;
            return (
              <button
                key={item._id}
                onClick={() => !isFuture && setCurrentIdx(idx)}
                className={cn(
                  'flex items-start gap-2 p-2.5 rounded-2xl border text-left transition-all duration-300',
                  isCurrent
                    ? 'bg-yellow-50 border-yellow-300 shadow-[0_0_0_2px_#FDE68A] scale-[1.02]'
                    : isDone
                      ? cn(STATUS_STYLE[r.status], 'cursor-pointer hover:opacity-90')
                      : cn('border opacity-30 cursor-not-allowed', t.card, t.border)
                )}
              >
                <span className="text-sm shrink-0 mt-0.5">
                  {isCurrent ? '💡' : isDone ? STATUS_ICON[r.status] : STATUS_ICON['pending']}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-xs font-bold truncate', isCurrent ? 'text-yellow-800 font-black' : t.text)}>
                    Câu {idx + 1}
                  </p>
                  <p className={cn('text-[11px] line-clamp-2 leading-tight mt-0.5', t.sub)}>{item.vnText}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main editor */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {currentItem && (
            <div className={cn('rounded-3xl border p-5 flex flex-col gap-4', t.card, t.border)}>

              {/* Spotlight card */}
              <div className="rounded-2xl bg-yellow-50 border-2 border-yellow-300 p-4 shadow-[0_0_20px_rgba(253,230,138,0.5)]">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-black text-yellow-600 bg-yellow-200 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    💡 Câu {currentIdx + 1} / {sortedItems.length}
                  </span>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-lg',
                    currentItem.difficulty === 'hard'   ? 'bg-red-100 text-red-600' :
                    currentItem.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  )}>
                    {currentItem.difficulty}
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-800 leading-relaxed">{currentItem.vnText}</p>

                {/* Required word badges */}
                {currentItem.requiredWords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {currentItem.requiredWords.map((w, i) => (
                      <span key={i} className="text-[11px] font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20 px-2 py-0.5 rounded-lg">
                        🔑 {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Translation textarea */}
              <div>
                <label className={cn('text-xs font-bold mb-1.5 block uppercase tracking-wider', t.sub)}>
                  Bản dịch của bạn (Tiếng Anh)
                </label>
                <textarea
                  ref={textareaRef}
                  value={answers[currentItem._id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [currentItem._id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGrade(); }}
                  disabled={grading || (currentResult && currentResult.status === 'correct')}
                  placeholder="Nhập bản dịch của bạn ở đây... (Ctrl+Enter để nộp)"
                  className={cn(
                    'w-full min-h-[100px] rounded-2xl border-2 p-4 text-sm font-medium resize-none outline-none transition-all',
                    currentResult?.status === 'correct'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : cn(t.input, 'focus:border-[#6C5CE7]')
                  )}
                />
              </div>

              {/* AI Feedback */}
              {currentResult && currentResult.status !== 'pending' && (
                <div className={cn('rounded-2xl p-4 border', STATUS_STYLE[currentResult.status])}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{STATUS_ICON[currentResult.status]}</span>
                    <span className="text-sm font-black">
                      {currentResult.status === 'correct' ? 'Xuất sắc!' :
                       currentResult.status === 'partial' ? 'Gần đúng rồi!' : 'Chưa đúng — thử lại nha!'}
                    </span>
                    <span className="ml-auto text-xs font-bold">{currentResult.aiScore}/100</span>
                  </div>
                  {currentResult.aiFeedback && (
                    <p className="text-sm leading-relaxed">{currentResult.aiFeedback}</p>
                  )}
                  {currentResult.aiNaturalness && (
                    <p className="text-xs mt-2 italic opacity-70">
                      💬 <strong>Tự nhiên hơn:</strong> {currentResult.aiNaturalness}
                    </p>
                  )}
                  {currentResult.missingWords?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      <span className="text-xs font-bold">Thiếu từ:</span>
                      {currentResult.missingWords.map((w, i) => (
                        <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                          ❌ {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Submit */}
                {(!currentResult || currentResult.status === 'wrong') && (
                  <button
                    onClick={handleGrade}
                    disabled={grading}
                    className="flex items-center gap-2 px-6 py-3 bg-[#6C5CE7] hover:bg-[#5a4cc9] text-white font-bold rounded-2xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
                  >
                    {grading ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang chấm...</>
                    ) : (
                      <><FaLanguage /> Nộp bài AI chấm</>
                    )}
                  </button>
                )}

                {/* Hint */}
                {(!currentResult || currentResult.status !== 'correct') && (
                  <button
                    onClick={() => openHintModal(currentItem._id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 border font-bold rounded-2xl transition-all',
                      isDark
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    )}
                  >
                    <FaLightbulb /> Mua Gợi ý
                  </button>
                )}

                {/* Next */}
                {currentResult && currentResult.status !== 'pending' && currentIdx < sortedItems.length - 1 && (
                  <button
                    onClick={() => setCurrentIdx(i => i + 1)}
                    className={cn(
                      'ml-auto flex items-center gap-1.5 px-5 py-3 font-bold rounded-2xl transition-all',
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    )}
                  >
                    Câu tiếp <FaArrowRight className="text-xs" />
                  </button>
                )}

                {/* Complete */}
                {allAnswered && (
                  <button
                    onClick={handleComplete}
                    className="ml-auto flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-md transition-all"
                  >
                    <FaFlag /> Nộp toàn bộ & Nhận thưởng
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ Hint Modal ════════════════════════════════════════════════════════ */}
      {hintModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-3xl shadow-2xl border p-6 w-full max-w-md', t.card, t.border)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn('text-lg font-black flex items-center gap-2', t.text)}>
                <FaLightbulb className="text-amber-500" /> Mua Gợi ý
              </h3>
              <button
                onClick={() => { setHintModal(false); setHintContent(null); }}
                className={cn('text-xl transition-colors', t.sub, t.hover, 'rounded-xl p-1')}
              >
                ✕
              </button>
            </div>

            {!hintContent ? (
              <div className="flex flex-col gap-3">
                <p className={cn('text-sm', t.sub)}>Chọn loại gợi ý. Xu sẽ bị trừ ngay khi mua.</p>
                {Object.entries(HINT_LABELS).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => handleBuyHint(type)}
                    disabled={hintLoading}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-2xl border font-medium transition-all disabled:opacity-50',
                      isDark
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    <span>{label}</span>
                    {hintLoading && <span className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-600 rounded-full animate-spin" />}
                  </button>
                ))}
              </div>
            ) : hintContent.type === 'error' ? (
              <p className="text-red-500 text-sm">{hintContent.content}</p>
            ) : (
              <div className="mt-2">
                <p className={cn('text-xs mb-2', t.sub)}>Đã dùng <strong>{hintContent.cost} 🪙</strong></p>

                {hintContent.type === 'first_letter' && (
                  <div>
                    <p className={cn('text-sm font-bold mb-2', t.text)}>Chữ cái đầu từng từ:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {Array.isArray(hintContent.content)
                        ? hintContent.content.map((l, i) => (
                            <span key={i} className="w-8 h-8 flex items-center justify-center bg-[#6C5CE7]/10 text-[#6C5CE7] font-black rounded-lg border border-[#6C5CE7]/20 text-sm">
                              {l}
                            </span>
                          ))
                        : <span className={cn('text-sm', t.sub)}>{hintContent.content}</span>
                      }
                    </div>
                  </div>
                )}

                {hintContent.type === 'grammar' && (
                  <div>
                    <p className={cn('text-sm font-bold mb-2', t.text)}>📐 Gợi ý ngữ pháp:</p>
                    <p className={cn(
                      'text-sm rounded-2xl p-3 leading-relaxed border',
                      isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-800'
                    )}>
                      {hintContent.content}
                    </p>
                  </div>
                )}

                {hintContent.type === 'view_passage' && (
                  <div>
                    <p className={cn('text-sm font-bold mb-2', t.text)}>📖 Bài đọc nguồn:</p>
                    {typeof hintContent.content === 'object' && hintContent.content.title ? (
                      <div className={cn('rounded-2xl p-3 max-h-52 overflow-y-auto border', t.border, isDark ? 'bg-white/5' : 'bg-slate-50')}>
                        <p className={cn('font-bold mb-2', t.text)}>{hintContent.content.title}</p>
                        {hintContent.content.nodes?.map((n, i) => (
                          n.type === 'text' || n.type === 'reading' ? (
                            <p key={i} className={cn('text-sm mb-2', t.sub)}>{n.content || n.text || ''}</p>
                          ) : null
                        ))}
                      </div>
                    ) : (
                      <p className={cn('text-sm', t.sub)}>{hintContent.content}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setHintModal(false); setHintContent(null); }}
                  className="mt-4 w-full py-2.5 bg-[#6C5CE7] hover:bg-[#5a4cc9] text-white font-bold rounded-2xl transition-all"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%,100%{ transform: translateX(0) }
          20%    { transform: translateX(-8px) }
          40%    { transform: translateX(8px) }
          60%    { transform: translateX(-6px) }
          80%    { transform: translateX(6px) }
        }
        .animate-\\[shake_0\\.4s_ease-in-out\\] { animation: shake 0.4s ease-in-out; }
      `}</style>
    </LearnLayout>
  );
}
