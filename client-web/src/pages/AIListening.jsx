import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import {
  FiHeadphones, FiPlay, FiPause, FiChevronRight, FiChevronLeft,
  FiCheck, FiX, FiRefreshCw, FiList, FiVolume2, FiClock,
  FiAward, FiBookOpen, FiArrowLeft
} from 'react-icons/fi';

const API_BASE = 'http://localhost:3001/api';

const authAxios = axios.create({ baseURL: API_BASE });
authAxios.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const LEVEL_COLORS = {
  beginner:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  intermediate: 'bg-amber-500/20  text-amber-300  border-amber-500/30',
  advanced:     'bg-rose-500/20   text-rose-300   border-rose-500/30',
};

const LEVEL_LABELS = {
  beginner:     'Sơ cấp',
  intermediate: 'Trung cấp',
  advanced:     'Nâng cao',
};

function LevelBadge({ level }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${LEVEL_COLORS[level] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {LEVEL_LABELS[level] || level}
    </span>
  );
}

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [current, setCurrent]     = useState(0);
  const [duration, setDuration]   = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const onTimeUpdate = () => setCurrent(audioRef.current?.currentTime || 0);
  const onLoaded     = () => setDuration(audioRef.current?.duration   || 0);
  const onEnded      = () => setPlaying(false);

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 flex items-center gap-5">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoaded}
        onEnded={onEnded}
      />
      {/* Play/Pause */}
      <button
        onClick={toggle}
        className="shrink-0 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all shadow-lg shadow-purple-500/30"
      >
        {playing ? <FiPause size={20} /> : <FiPlay size={20} className="ml-0.5" />}
      </button>

      {/* Progress bar */}
      <div className="flex-1 space-y-1">
        <div
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
          onClick={seek}
        >
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatDuration(Math.round(current)) || '0:00'}</span>
          <span>{formatDuration(Math.round(duration)) || '—'}</span>
        </div>
      </div>

      <FiVolume2 size={18} className="text-gray-400 shrink-0" />
    </div>
  );
}

// ─── Passage Card (list view) ─────────────────────────────────────────────────
function PassageCard({ p, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/60 hover:border-purple-500/40 rounded-2xl p-5 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="p-3 bg-purple-600/20 group-hover:bg-purple-600/30 rounded-xl shrink-0 transition-all">
            <FiHeadphones size={22} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base leading-snug line-clamp-2 group-hover:text-purple-200 transition-colors">
              {p.title}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <LevelBadge level={p.level} />
              <span className="text-gray-500 text-xs capitalize">{p.section?.replace('section', 'Section ')}</span>
              {p.duration_sec > 0 && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <FiClock size={11} /> {formatDuration(p.duration_sec)}
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <FiList size={11} /> {p.questions?.length ?? 0} câu hỏi
              </span>
            </div>
          </div>
        </div>
        <FiChevronRight size={18} className="text-gray-500 group-hover:text-purple-400 shrink-0 transition-colors mt-1" />
      </div>
    </button>
  );
}

// ─── Practice View ───────────────────────────────────────────────────────────
function PracticeView({ passageId, onBack }) {
  const [passage,    setPassage]   = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [answers,    setAnswers]   = useState({});   // { [questionId]: string }
  const [submitting, setSubmitting]= useState(false);
  const [result,     setResult]    = useState(null);
  const [error,      setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await authAxios.get(`/listening/${passageId}`);
        if (!cancelled) setPassage(r.data?.data || r.data);
      } catch (e) {
        if (!cancelled) setError('Không thể tải bài nghe. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [passageId]);

  const setAnswer = (qId, val) => setAnswers((a) => ({ ...a, [qId]: val }));

  const handleSubmit = async () => {
    if (!passage) return;
    setSubmitting(true);
    try {
      const payload = passage.questions.map((q) => ({
        questionId: q._id,
        answer: answers[q._id] || '',
      }));
      const r = await authAxios.post(`/listening/${passageId}/submit`, { answers: payload });
      setResult(r.data?.data || r.data);
    } catch (e) {
      setError('Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
      <FiRefreshCw size={22} className="animate-spin" /> Đang tải bài nghe…
    </div>
  );

  if (error && !passage) return (
    <div className="text-center py-24 text-red-400">
      <p>{error}</p>
      <button onClick={onBack} className="mt-4 underline text-gray-400 hover:text-white">Quay lại</button>
    </div>
  );

  // ── Results screen ────────────────────────────────────────────────────────
  if (result) {
    const { score, band, total, correct, details, transcript } = result;
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Score card */}
        <div className="bg-linear-to-br from-purple-900/60 to-blue-900/60 border border-purple-500/30 rounded-2xl p-8 text-center">
          <FiAward size={48} className="text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-300 text-sm mb-1">Điểm của bạn</p>
          <p className="text-6xl font-bold text-white mb-2">{band}</p>
          <p className="text-gray-400 text-sm">Thang điểm IELTS Band</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <span className="text-emerald-400"><strong className="text-white">{correct}</strong> đúng</span>
            <span className="text-gray-400">trên tổng <strong className="text-white">{total}</strong> câu</span>
            <span className="text-purple-400">Điểm thô: <strong className="text-white">{score}</strong>%</span>
          </div>
        </div>

        {/* Q&A breakdown */}
        <div className="space-y-3">
          <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Xem lại đáp án</h3>
          {(details || []).map((d, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${d.correct ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${d.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {d.correct ? <FiCheck size={16} /> : <FiX size={16} />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="text-gray-200 font-medium mb-1">Q{i + 1}. {d.question}</p>
                  <p className="text-gray-400">Câu trả lời của bạn: <span className={d.correct ? 'text-emerald-300' : 'text-red-300'}>{d.userAnswer || '(chưa trả lời)'}</span></p>
                  {!d.correct && <p className="text-gray-400">Đáp án đúng: <span className="text-emerald-300">{d.correctAnswer}</span></p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold">
              <FiBookOpen size={16} /> Transcript (Lời thoại)
            </div>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm font-medium transition-all"
          >
            <FiArrowLeft size={15} /> Về danh sách
          </button>
          <button
            onClick={() => { setResult(null); setAnswers({}); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <FiRefreshCw size={15} /> Làm lại
          </button>
        </div>
      </div>
    );
  }

  // ── Practice screen ───────────────────────────────────────────────────────
  const answered = passage?.questions?.filter((q) => answers[q._id]?.trim()).length || 0;
  const total    = passage?.questions?.length || 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back + title */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <FiArrowLeft size={15} /> Quay lại danh sách
        </button>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-600/20 rounded-xl shrink-0">
            <FiHeadphones size={24} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">{passage.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <LevelBadge level={passage.level} />
              <span className="text-gray-500 text-xs capitalize">{passage.section?.replace('section', 'Section ')}</span>
              {passage.duration_sec > 0 && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <FiClock size={11} /> {formatDuration(passage.duration_sec)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audio player */}
      {passage.audio_url && <AudioPlayer src={passage.audio_url} />}

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-sm">
        🎧 Nghe audio và trả lời các câu hỏi bên dưới. Bạn có thể nghe lại nhiều lần tuỳ ý.
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{answered} / {total} đã trả lời</span>
          <div className="w-40 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Questions */}
      {passage.questions?.length === 0 && (
        <p className="text-gray-500 text-center py-6">Bài nghe này chưa có câu hỏi.</p>
      )}

      {(passage.questions || []).map((q, qi) => (
        <div key={q._id || qi} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 space-y-4">
          <p className="text-white font-medium">
            <span className="text-purple-400 mr-2">Q{qi + 1}.</span>{q.question}
          </p>

          {/* Multiple choice */}
          {q.type === 'multiple_choice' && (
            <div className="space-y-2">
              {(q.options || []).map((opt, oi) => {
                const label = String.fromCharCode(65 + oi);
                const selected = answers[q._id] === opt || answers[q._id] === label;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswer(q._id, opt || label)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm
                      ${selected
                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                        : 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600'
                      }`}
                  >
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

          {/* Fill blank / matching */}
          {(q.type === 'fill_blank' || q.type === 'matching') && (
            <input
              type="text"
              value={answers[q._id] || ''}
              onChange={(e) => setAnswer(q._id, e.target.value)}
              placeholder={q.type === 'fill_blank' ? 'Nhập câu trả lời…' : 'Nhập đáp án nối…'}
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none transition-colors"
            />
          )}
        </div>
      ))}

      {/* Submit */}
      {total > 0 && (
        <div className="flex justify-end pb-6">
          <button
            onClick={handleSubmit}
            disabled={submitting || answered === 0}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            {submitting ? <FiRefreshCw size={16} className="animate-spin" /> : <FiCheck size={16} />}
            {submitting ? 'Đang nộp bài…' : `Nộp bài (${answered}/${total})`}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIListening() {
  const [passages,    setPassages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);

  const [levelFilter,   setLevelFilter]   = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Selected passage id for practice
  const [activeId, setActiveId] = useState(null);

  const fetchList = async (pg = 1, level = levelFilter, section = sectionFilter) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 9 };
      if (level)   params.level   = level;
      if (section) params.section = section;
      const r = await authAxios.get('/listening', { params });
      const d = r.data?.data || r.data;
      setPassages(d?.passages || d?.docs || []);
      setTotalPages(d?.totalPages || 1);
      setTotal(d?.total || 0);
      setPage(pg);
    } catch (e) {
      console.error('Failed to fetch listening list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(1); }, []);

  const handleFilter = (level, section) => {
    setLevelFilter(level);
    setSectionFilter(section);
    fetchList(1, level, section);
  };

  // ─── If a passage is selected, show PracticeView ────────────────────────
  if (activeId) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <PracticeView passageId={activeId} onBack={() => setActiveId(null)} />
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-2xl mb-4">
            <FiHeadphones size={32} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Luyện nghe IELTS</h1>
          <p className="text-gray-400">Chọn bài nghe và trả lời câu hỏi để luyện tập</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Level */}
          {[
            { val: '',             label: 'Tất cả cấp độ' },
            { val: 'beginner',     label: 'Sơ cấp'        },
            { val: 'intermediate', label: 'Trung cấp'     },
            { val: 'advanced',     label: 'Nâng cao'      },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => handleFilter(opt.val, sectionFilter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border
                ${levelFilter === opt.val
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'}`}
            >
              {opt.label}
            </button>
          ))}

          <div className="w-px bg-gray-700 mx-1 self-stretch" />

          {/* Section */}
          {[
            { val: '',         label: 'Tất cả phần' },
            { val: 'section1', label: 'Phần 1'      },
            { val: 'section2', label: 'Phần 2'      },
            { val: 'section3', label: 'Phần 3'      },
            { val: 'section4', label: 'Phần 4'      },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => handleFilter(levelFilter, opt.val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border
                ${sectionFilter === opt.val
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500/50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-gray-500 text-sm text-center">Có {total} bài nghe</p>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <FiRefreshCw size={22} className="animate-spin" /> Đang tải danh sách…
          </div>
        ) : passages.length === 0 ? (
          <div className="text-center py-24">
            <FiHeadphones size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">Không tìm thấy bài nghe nào</p>
            <p className="text-gray-500 text-sm mt-1">Hãy thử bỏ bộ lọc đang chọn</p>
            <button
              onClick={() => handleFilter('', '')}
              className="mt-4 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm transition-all"
            >
              Xoá bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 gap-4">
            {passages.map((p) => (
              <PassageCard key={p._id} p={p} onClick={() => setActiveId(p._id)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => fetchList(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-xl text-sm transition-all"
            >
              <FiChevronLeft size={16} /> Trước
            </button>
            <span className="text-gray-500 text-sm">Trang {page} / {totalPages}</span>
            <button
              onClick={() => fetchList(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-xl text-sm transition-all"
            >
              Tiếp <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
