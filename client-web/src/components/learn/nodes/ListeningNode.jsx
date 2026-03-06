import React, { useState, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaCheck, FaTimes } from 'react-icons/fa';

/**
 * ListeningNode — audio player + MCQ questions.
 * node.data expected:
 *   { audioUrl?, title?, transcript?, questions: [...] }
 */
export default function ListeningNode({ node, nodeIdx, onComplete }) {
  const data      = node.data || {};
  const audioUrl  = data.audioUrl || data.audio_url || '';
  const title     = node.title || data.title || 'Bài Nghe';
  const transcript = data.transcript || '';
  const questions  = data.questions || [];

  const [playing,    setPlaying]    = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [showTrans,  setShowTrans]  = useState(false);
  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [results,    setResults]    = useState({});
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
  };

  const handleSeek = (e) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * a.duration;
  };

  const handleSubmit = () => {
    if (questions.length === 0) { onComplete(nodeIdx, { score: 100 }); return; }
    let correct = 0;
    const res = {};
    questions.forEach((q, i) => {
      const ua  = (answers[i] ?? '').toString().toLowerCase().trim();
      const ca  = (q.answer ?? q.correct_answer ?? '').toString().toLowerCase().trim();
      const ok  = ua === ca || ua === ca.charAt(0);
      res[i]    = ok;
      if (ok) correct++;
    });
    setResults(res);
    setSubmitted(true);
    onComplete(nodeIdx, { score: Math.round((correct / questions.length) * 100), answers });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎧</span>
          <h2 className="font-bold text-lg">{title}</h2>
        </div>

        {/* Audio player */}
        {audioUrl ? (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setPlaying(false)}
            />
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 transition-all"
              >
                {playing ? <FaPause /> : <FaPlay className="ml-0.5" />}
              </button>
              {/* Progress bar */}
              <div
                className="flex-1 h-2 rounded-full bg-white/10 cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <FaVolumeUp className="text-gray-500 text-sm" />
            </div>

            {/* Transcript toggle */}
            {transcript && (
              <button
                onClick={() => setShowTrans(s => !s)}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
              >
                {showTrans ? '▲ Ẩn transcript' : '▼ Xem transcript'}
              </button>
            )}
            {showTrans && transcript && (
              <p className="mt-3 text-gray-400 text-sm leading-relaxed border-l-2 border-indigo-500/40 pl-3">{transcript}</p>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-600">
            <FaVolumeUp className="text-4xl mx-auto mb-2" />
            <p className="text-sm">File audio chưa được tải lên.</p>
          </div>
        )}
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-5">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Câu hỏi</h3>
          {questions.map((q, i) => {
            const options   = q.options || [];
            const selected  = answers[i];
            const isCorrect = submitted && (q.answer === selected || q.correct_answer === selected);
            const isWrong   = submitted && selected && !isCorrect;
            return (
              <div key={i} className={`rounded-xl border p-4 ${
                !submitted ? 'border-white/10' :
                isCorrect  ? 'border-emerald-500/30 bg-emerald-900/10' :
                             'border-red-500/30 bg-red-900/10'}`}>
                <p className="text-sm font-semibold mb-3">{i + 1}. {q.text || q.question}</p>
                <div className="space-y-2">
                  {options.map((opt, oi) => {
                    const val  = (opt.value ?? opt ?? '').toString();
                    const lbl  = opt.label ?? opt.text ?? opt ?? '';
                    const sel  = selected === val;
                    const cor  = submitted && (q.answer === val || q.correct_answer === val);
                    const wrng = submitted && sel && !cor;
                    return (
                      <button
                        key={oi}
                        disabled={submitted}
                        onClick={() => !submitted && setAnswers(p => ({ ...p, [i]: val }))}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all flex items-center gap-2
                          ${wrng ? 'border-red-500/60 bg-red-900/20 text-red-300' :
                            cor  ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-300' :
                            sel  ? 'border-indigo-500/60 bg-indigo-900/20 text-indigo-300' :
                                   'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}
                      >
                        {submitted && cor  && <FaCheck className="text-emerald-400 text-xs shrink-0" />}
                        {submitted && wrng && <FaTimes className="text-red-400  text-xs shrink-0" />}
                        {typeof lbl === 'string' ? lbl : JSON.stringify(lbl)}
                      </button>
                    );
                  })}
                </div>
                {submitted && !isCorrect && (
                  <p className="mt-2 text-xs text-emerald-400">Đáp án: <strong>{q.answer ?? q.correct_answer}</strong></p>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all">
              Kiểm tra đáp án
            </button>
          ) : (
            <div className={`rounded-xl p-4 text-center border ${
              Object.values(results).filter(Boolean).length >= questions.length * 0.7
                ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
              <p className="font-bold">{Object.values(results).filter(Boolean).length}/{questions.length} câu đúng</p>
            </div>
          )}
        </div>
      )}

      {questions.length === 0 && audioUrl && (
        <button
          onClick={() => onComplete(nodeIdx, { score: 100 })}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm"
        >
          Đã nghe xong ✓
        </button>
      )}
    </div>
  );
}
