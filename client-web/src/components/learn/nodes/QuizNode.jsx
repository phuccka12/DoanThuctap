import React, { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

/**
 * QuizNode — MCQ / True-False quiz.
 * node.data.questions: [{ text, type, options, answer }]
 */
export default function QuizNode({ node, nodeIdx, onComplete }) {
  const data      = node.data || {};
  const questions = data.questions || data.items || [];
  const title     = node.title || 'Quiz';

  const [qIdx,      setQIdx]      = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [checked,   setChecked]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score,     setScore]     = useState(0);

  if (questions.length === 0) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500">Chưa có câu hỏi quiz nào.</p>
        <button onClick={() => onComplete(nodeIdx, { score: 100 })} className="mt-4 px-6 py-2.5 bg-indigo-600 rounded-xl font-bold text-sm">OK</button>
      </div>
    );
  }

  const q       = questions[qIdx];
  const options = q.options || [];
  const chosen  = answers[qIdx];
  const correctAns = q.answer ?? q.correct_answer ?? '';
  const isOk    = checked && (chosen === correctAns || (chosen ?? '').toString().toLowerCase() === correctAns.toString().toLowerCase());

  const handleSelect = (val) => {
    if (checked) return;
    setAnswers(prev => ({ ...prev, [qIdx]: val }));
  };

  const handleCheck = () => {
    if (!chosen && chosen !== false) return;
    setChecked(true);
    if (
      chosen === correctAns ||
      (chosen ?? '').toString().toLowerCase() === correctAns.toString().toLowerCase()
    ) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (qIdx < questions.length - 1) {
      setQIdx(i => i + 1);
      setChecked(false);
    } else {
      setSubmitted(true);
      const finalScore = score + (isOk ? 0 : 0); // score already updated
      onComplete(nodeIdx, { score: Math.round((score / questions.length) * 100) });
    }
  };

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">{pct >= 70 ? '🎯' : '💪'}</div>
        <p className="text-xl font-bold mb-2">{score}/{questions.length} câu đúng ({pct}%)</p>
        <p className="text-gray-400 text-sm">{pct >= 70 ? 'Xuất sắc!' : 'Hãy ôn thêm để cải thiện nhé!'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🧩</span>
        <h2 className="font-bold text-lg">{title}</h2>
        <span className="text-gray-500 text-sm ml-auto">{qIdx + 1} / {questions.length}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {questions.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all
            ${i < qIdx ? 'bg-emerald-500' : i === qIdx ? 'bg-indigo-500' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Question */}
      <div className={`bg-gray-900 border rounded-2xl p-5 transition-all
        ${checked ? (isOk ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-red-500/30 bg-red-900/10') : 'border-white/10'}`}>
        <p className="font-semibold text-base mb-4">{q.text || q.question}</p>

        {/* True / False */}
        {(q.type === 'true_false' || !options.length) && q.type === 'true_false' && (
          <div className="flex gap-3">
            {['True', 'False'].map(opt => {
              const val  = opt.toLowerCase();
              const sel  = chosen === val;
              const cor  = checked && correctAns.toLowerCase() === val;
              const wrng = checked && sel && !cor;
              return (
                <button key={opt} disabled={checked} onClick={() => handleSelect(val)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all
                    ${wrng ? 'border-red-500/60 bg-red-900/20 text-red-300' :
                      cor  ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-300' :
                      sel  ? 'border-indigo-500/60 bg-indigo-900/20 text-indigo-300' :
                             'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                  {checked && cor  && <FaCheck className="text-xs" />}
                  {checked && wrng && <FaTimes className="text-xs" />}
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* MCQ */}
        {options.length > 0 && (
          <div className="space-y-2">
            {options.map((opt, oi) => {
              const val  = (opt.value ?? opt.text ?? opt ?? '').toString();
              const lbl  = opt.label ?? opt.text ?? opt ?? '';
              const sel  = chosen === val;
              const cor  = checked && (correctAns === val || correctAns.toString().toLowerCase() === val.toLowerCase());
              const wrng = checked && sel && !cor;
              return (
                <button key={oi} disabled={checked} onClick={() => handleSelect(val)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all flex items-center gap-2
                    ${wrng ? 'border-red-500/60 bg-red-900/20 text-red-300' :
                      cor  ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-300' :
                      sel  ? 'border-indigo-500/60 bg-indigo-900/20 text-indigo-300' :
                             'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                  {checked && cor  && <FaCheck className="text-emerald-400 text-xs shrink-0" />}
                  {checked && wrng && <FaTimes className="text-red-400  text-xs shrink-0" />}
                  {typeof lbl === 'string' ? lbl : JSON.stringify(lbl)}
                </button>
              );
            })}
          </div>
        )}

        {checked && !isOk && (
          <p className="mt-3 text-xs text-emerald-400">Đáp án đúng: <strong>{correctAns}</strong></p>
        )}
      </div>

      {!checked ? (
        <button
          onClick={handleCheck}
          disabled={chosen === undefined || chosen === null}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
        >
          Kiểm tra
        </button>
      ) : (
        <button onClick={handleNext} className={`w-full py-3 rounded-xl font-bold text-sm transition-all
          ${qIdx === questions.length - 1
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'bg-indigo-600 hover:bg-indigo-500'}`}>
          {qIdx === questions.length - 1 ? '🎉 Hoàn thành' : 'Câu tiếp →'}
        </button>
      )}
    </div>
  );
}
