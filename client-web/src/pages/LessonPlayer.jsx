import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getLessonById, completeLesson, getLessonsForTopic } from '../services/learningService';
import CompletionModal from '../components/learn/CompletionModal';
import ReadingNode   from '../components/learn/nodes/ReadingNode';
import ListeningNode from '../components/learn/nodes/ListeningNode';
import VocabNode     from '../components/learn/nodes/VocabNode';
import QuizNode      from '../components/learn/nodes/QuizNode';
import WritingNode   from '../components/learn/nodes/WritingNode';
import {
  FaTimes, FaSpinner, FaChevronRight, FaChevronLeft,
  FaCheckCircle, FaBookOpen, FaHeadphones,
  FaFont, FaEdit, FaMicrophone, FaVideo, FaPuzzlePiece,
} from 'react-icons/fa';

// ─── Node type meta ──────────────────────────────────────────────────────────
const NODE_META = {
  reading:    { label: 'Đọc hiểu',   icon: '📖', color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-400/30'     },
  listening:  { label: 'Nghe',       icon: '🎧', color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-400/30' },
  vocabulary: { label: 'Từ vựng',    icon: '📝', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30'},
  quiz:       { label: 'Quiz',       icon: '🧩', color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-400/30' },
  writing:    { label: 'Viết',       icon: '✍️',  color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-400/30' },
  speaking:   { label: 'Nói',        icon: '🎙️', color: 'text-rose-400',    bg: 'bg-rose-500/15 border-rose-400/30'     },
  video:      { label: 'Video',      icon: '🎬', color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-400/30'       },
};

function getNodeMeta(type = '') {
  const tp = type.toLowerCase();
  if (tp.includes('read'))                                  return NODE_META.reading;
  if (tp.includes('listen') || tp.includes('audio'))       return NODE_META.listening;
  if (tp.includes('vocab'))                                 return NODE_META.vocabulary;
  if (tp.includes('quiz') || tp.includes('grammar'))       return NODE_META.quiz;
  if (tp.includes('writ') || tp.includes('essay'))         return NODE_META.writing;
  if (tp.includes('speak') || tp.includes('role'))         return NODE_META.speaking;
  if (tp.includes('video'))                                 return NODE_META.video;
  return { label: type || 'Học', icon: '📚', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-400/20' };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate     = useNavigate();
  const { isDark }   = useTheme();
  const t            = isDark ? darkTheme : theme;

  const [lesson,       setLesson]       = useState(null);
  const [nodes,        setNodes]        = useState([]);
  const [topicLessons, setTopicLessons] = useState([]);
  const [current,      setCurrent]      = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const [nodeAnswers,    setNodeAnswers]    = useState({});
  const [nodeScores,     setNodeScores]     = useState({});
  const [completedNodes, setCompletedNodes] = useState(new Set());

  const [showModal, setShowModal] = useState(false);
  const [reward,    setReward]    = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setLoading(true);
    getLessonById(lessonId)
      .then(async r => {
        const les = r.data.data.lesson;
        setLesson(les);
        setNodes(les?.nodes || []);
        const topicId = les?.topic_id?._id || les?.topic_id;
        if (topicId) {
          try {
            const tr = await getLessonsForTopic(topicId);
            setTopicLessons(tr.data.data.lessons || []);
          } catch { /* ok */ }
        }
      })
      .catch(() => navigate('/learn'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleNodeComplete = useCallback((nodeIdx, { score = 0, answers = {} } = {}) => {
    setNodeAnswers(prev => ({ ...prev, [nodeIdx]: answers }));
    setNodeScores(prev  => ({ ...prev, [nodeIdx]: score  }));
    setCompletedNodes(prev => new Set([...prev, nodeIdx]));
  }, []);

  const isLastNode = current === nodes.length - 1;

  const submitLesson = useCallback(async () => {
    setSubmitting(true);
    try {
      const scores   = Object.values(nodeScores);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
      const elapsed  = Math.round((Date.now() - startTime) / 1000);
      const res = await completeLesson(lessonId, {
        score:          avgScore,
        completedNodes: [...completedNodes].map(String),
        timeSpentSec:   elapsed,
      });
      setReward(res.data.data.reward);
      setShowModal(true);
    } catch (err) {
      console.error('[LessonPlayer] submitLesson:', err);
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, nodeScores, completedNodes, startTime]);

  // ── Auto-submit when ALL nodes are completed (e.g. single-node lessons) ──
  const autoSubmitRef = useRef(false);
  useEffect(() => {
    if (
      nodes.length > 0 &&
      completedNodes.size >= nodes.length &&
      !showModal &&
      !submitting &&
      !autoSubmitRef.current
    ) {
      autoSubmitRef.current = true;
      submitLesson();
    }
  }, [completedNodes.size, nodes.length, showModal, submitting, submitLesson]);

  const handleNext = async () => {
    if (!isLastNode) {
      setCurrent(c => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await submitLesson();
  };

  // Next lesson in this topic
  const myIdx      = topicLessons.findIndex(l => l._id === lessonId);
  const nextLesson = myIdx >= 0 ? topicLessons[myIdx + 1] || null : null;
  const topicId    = lesson?.topic_id?._id || lesson?.topic_id;
  const progressPct = nodes.length ? Math.round((completedNodes.size / nodes.length) * 100) : 0;

  // ── Loading state
  if (loading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', t.page)}>
        <div className="text-center">
          <FaSpinner className="text-[#6C5CE7] text-4xl animate-spin mx-auto mb-3" />
          <p className={cn('text-sm', t.sub)}>Đang tải bài học…</p>
        </div>
      </div>
    );
  }

  if (!lesson || nodes.length === 0) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center text-center px-6', t.page)}>
        <div>
          <div className="text-6xl mb-4">😶</div>
          <p className={cn('font-bold mb-2 text-lg', t.text)}>Bài học chưa có nội dung</p>
          <p className={cn('text-sm mb-6', t.sub)}>Admin chưa thêm hoạt động cho bài học này.</p>
          <button onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-[#6C5CE7] hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const node        = nodes[current];
  const currentMeta = getNodeMeta(node.type || node.node_type || '');

  return (
    <div className={cn('min-h-screen flex flex-col', t.page)}>

      {/* STICKY TOP HEADER */}
      <header className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-xl shadow-sm',
        isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-black/8'
      )}>
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3 h-14">
          {/* Exit */}
          <button
            onClick={() => {
              if (completedNodes.size === 0 || window.confirm('Thoát? Tiến độ chưa được lưu.'))
                navigate(topicId ? `/learn/topics/${topicId}` : '/learn', { state: { refresh: true } });
            }}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 hover:scale-105',
              isDark ? 'bg-white/5 hover:bg-white/15 text-gray-300' : 'bg-black/5 hover:bg-black/10 text-gray-600'
            )}
          >
            <FaTimes className="text-sm" />
          </button>

          <div className="flex-1 min-w-0">
            <p className={cn('text-xs truncate', t.sub)}>{lesson?.topic_id?.name || 'Bài học'}</p>
            <p className={cn('text-sm font-bold truncate leading-tight', t.text)}>{lesson.title}</p>
          </div>

          {/* Progress pill - desktop */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="w-40">
              <div className="flex justify-between text-[10px] mb-1">
                <span className={t.sub}>{completedNodes.size}/{nodes.length} hoạt động</span>
                <span className="font-bold text-[#6C5CE7]">{progressPct}%</span>
              </div>
              <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step count button - mobile */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className={cn(
              'lg:hidden w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all',
              isDark ? 'bg-[#6C5CE7]/20 text-[#A29BFE] hover:bg-[#6C5CE7]/30' : 'bg-[#A29BFE]/20 text-[#6C5CE7] hover:bg-[#A29BFE]/30'
            )}
          >
            {current + 1}/{nodes.length}
          </button>
        </div>

        {/* Mobile thin progress bar */}
        <div className="sm:hidden h-1">
          <div
            className="h-full bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

        {/* Main activity area */}
        <main className="min-w-0 flex flex-col gap-4">
          {/* Activity type badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border',
              currentMeta.bg, currentMeta.color
            )}>
              <span>{currentMeta.icon}</span>
              {currentMeta.label}
            </span>
            <span className={cn('text-xs', t.sub)}>
              Hoạt động {current + 1} / {nodes.length}
            </span>
            {completedNodes.has(current) && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                <FaCheckCircle className="text-[10px]" /> Đã hoàn thành
              </span>
            )}
          </div>

          {/* Node card */}
          <NodeRenderer
            node={node}
            nodeIdx={current}
            isDone={completedNodes.has(current)}
            onComplete={handleNodeComplete}
            t={t}
            isDark={isDark}
          />

          {/* Footer navigation */}
          <div className={cn(
            'sticky bottom-4 rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-lg flex justify-between items-center gap-3',
            isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-black/8'
          )}>
            <button
              onClick={() => { setCurrent(c => Math.max(0, c - 1)); window.scrollTo({ top: 0 }); }}
              disabled={current === 0}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all font-medium',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-black/5 hover:bg-black/10 text-gray-600'
              )}
            >
              <FaChevronLeft className="text-xs" /> Trước
            </button>

            <button
              onClick={handleNext}
              disabled={submitting}
              className={cn(
                'flex-1 max-w-xs py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2',
                'transition-all text-white shadow-lg active:scale-95 disabled:opacity-60',
                isLastNode
                  ? 'bg-linear-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25'
                  : 'bg-linear-to-r from-[#6C5CE7] to-[#a855f7] shadow-[#6C5CE7]/25'
              )}
            >
              {submitting
                ? <><FaSpinner className="animate-spin" /> Đang xử lý…</>
                : isLastNode
                  ? <>🎉 Nộp bài</>
                  : <>Tiếp theo <FaChevronRight className="text-xs" /></>
              }
            </button>
          </div>
        </main>

        {/* STEP SIDEBAR */}
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside className={cn(
            'lg:block',
            sidebarOpen
              ? 'fixed right-0 top-0 bottom-0 w-72 z-50 p-4 overflow-y-auto shadow-2xl lg:static lg:shadow-none lg:p-0'
              : 'hidden lg:block',
            isDark ? 'bg-gray-900' : 'bg-white'
          )}>
            {/* Mobile close */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <p className={cn('font-bold text-sm', t.text)}>Các hoạt động</p>
              <button onClick={() => setSidebarOpen(false)}
                className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'hover:bg-white/10' : 'hover:bg-black/5')}>
                <FaTimes className={cn('text-sm', t.sub)} />
              </button>
            </div>

            <div className={cn('rounded-2xl border p-4 sticky top-20', t.border, t.card)}>
              <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-3', t.sub)}>
                DANH SÁCH HOẠT ĐỖNG
              </p>

              {/* Mini progress */}
              <div className="flex items-center gap-2 mb-4">
                <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className={cn('text-[10px] font-bold', t.sub)}>{progressPct}%</span>
              </div>

              <div className="space-y-1.5">
                {nodes.map((n, i) => {
                  const meta  = getNodeMeta(n.type || n.node_type || '');
                  const isDone = completedNodes.has(i);
                  const isAct  = i === current;

                  return (
                    <button
                      key={i}
                      onClick={() => { setCurrent(i); setSidebarOpen(false); window.scrollTo({ top: 0 }); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                        isAct
                          ? 'bg-[#6C5CE7]/15 border border-[#6C5CE7]/40'
                          : isDone
                            ? cn('border', isDark ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-emerald-50 border-emerald-200')
                            : cn('border border-transparent', t.hover)
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                        isAct   ? 'bg-[#6C5CE7] text-white'
                        : isDone ? 'bg-emerald-500 text-white'
                        : isDark  ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                      )}>
                        {isDone ? <FaCheckCircle /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs font-semibold truncate',
                          isAct ? 'text-[#6C5CE7]' : isDone ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : t.text
                        )}>
                          {n.title || `Hoạt động ${i + 1}`}
                        </p>
                        <p className={cn('text-[10px]', isAct ? 'text-[#A29BFE]' : t.sub)}>
                          {meta.icon} {meta.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </>
      </div>

      {/* COMPLETION MODAL */}
      {showModal && (
        <CompletionModal
          reward={reward}
          lesson={lesson}
          nodeScores={nodeScores}
          totalNodes={nodes.length}
          nextLesson={nextLesson}
          onClose={() => navigate(topicId ? `/learn/topics/${topicId}` : '/learn', { state: { refresh: true } })}
          onNextLesson={() => nextLesson && navigate(`/learn/lessons/${nextLesson._id}`, { state: { refresh: true } })}
        />
      )}
    </div>
  );
}

// ── NodeRenderer
function NodeRenderer({ node, nodeIdx, isDone, onComplete, t, isDark }) {
  const type = (node.type || node.node_type || '').toLowerCase();
  const common = { node, nodeIdx, onComplete };

  if (type.includes('read'))                              return <ReadingNode   {...common} />;
  if (type.includes('listen') || type.includes('audio')) return <ListeningNode {...common} />;
  if (type.includes('vocab'))                             return <VocabNode     {...common} />;
  if (type.includes('quiz') || type.includes('grammar')) return <QuizNode      {...common} />;
  if (type.includes('writ') || type.includes('essay'))   return <WritingNode   {...common} />;

  // Speaking / roleplay / ai_roleplay → fallback interactive card (auto-completes on click)
  const isSpeakType = type.includes('speak') || type.includes('role') || type.includes('ai_');
  const cardLabel   = isSpeakType ? '🎙️ Luyện nói / Roleplay' : (node.type || 'Hoạt động');
  const btnLabel    = isSpeakType ? '🎙️ Đã luyện tập xong ✓' : 'Đã xem ✓';

  return (
    <div className={cn('rounded-2xl border p-6', t.border, t.card)}>
      <span className={cn(
        'inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-4',
        isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-500'
      )}>
        {cardLabel}
      </span>
      <h2 className={cn('text-xl font-bold mb-3', t.text)}>{node.title || 'Nội dung bài học'}</h2>
      {node.data?.content  && <p className={cn('leading-relaxed whitespace-pre-wrap mb-4', t.sub)}>{node.data.content}</p>}
      {node.data?.text     && <p className={cn('leading-relaxed whitespace-pre-wrap mb-4', t.sub)}>{node.data.text}</p>}
      {node.data?.prompt   && (
        <div className={cn('rounded-xl border p-4 mb-4 text-sm leading-relaxed', isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-indigo-50 border-indigo-100 text-slate-700')}>
          <p className={cn('text-xs font-bold uppercase tracking-wide mb-2', isDark ? 'text-indigo-300' : 'text-indigo-500')}>Chủ đề</p>
          {node.data.prompt}
        </div>
      )}
      {node.data?.videoUrl && <video controls src={node.data.videoUrl} className="w-full mt-2 rounded-xl mb-4" />}
      {isDone
        ? <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
            <FaCheckCircle /> Đã hoàn thành
          </div>
        : <button
            onClick={() => onComplete(nodeIdx, { score: 100 })}
            className="mt-2 px-6 py-2.5 bg-[#6C5CE7] hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all">
            {btnLabel}
          </button>
      }
    </div>
  );
}
