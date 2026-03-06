import React, { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

/**
 * ReadingNode — displays a reading passage with MCQ / True-False questions.
 * node.data expected shape:
 *   { passageId?, passage?, title?, questions: [{ _id, text, type, options, answer }] }
 */
export default function ReadingNode({ node, nodeIdx, onComplete }) {
  const data      = node.data || {};
  const passage   = data.passage || '';
  const title     = node.title  || data.title || 'Bài Đọc';
  const questions = data.questions || [];

  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results,   setResults]   = useState({});

  const handleSelect = (qIdx, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const handleSubmit = () => {
    if (questions.length === 0) {
      onComplete(nodeIdx, { score: 100 });
      return;
    }
    // Grade answers
    let correct = 0;
    const res = {};
    questions.forEach((q, i) => {
      const userAns = (answers[i] ?? '').toString().toLowerCase().trim();
      const correct_ans = (q.answer ?? q.correct_answer ?? '').toString().toLowerCase().trim();
      const isOk = userAns === correct_ans || userAns === correct_ans.charAt(0);
      res[i] = isOk;
      if (isOk) correct++;
    });
    setResults(res);
    setSubmitted(true);
    const score = Math.round((correct / questions.length) * 100);
    onComplete(nodeIdx, { score, answers });
  };

  return (
    <div className="space-y-6">
      {/* Passage */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📖</span>
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{passage}</p>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-5">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Câu hỏi</h3>
          {questions.map((q, i) => (
            <QuestionBlock
              key={i}
              q={q}
              idx={i}
              userAnswer={answers[i]}
              result={submitted ? results[i] : null}
              submitted={submitted}
              onSelect={(v) => handleSelect(i, v)}
            />
          ))}

          {!submitted && (
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all"
            >
              Kiểm tra đáp án
            </button>
          )}
          {submitted && (
            <ScoreSummary correct={Object.values(results).filter(Boolean).length} total={questions.length} />
          )}
        </div>
      )}

      {/* If no questions, just mark done */}
      {questions.length === 0 && (
        <button
          onClick={() => onComplete(nodeIdx, { score: 100 })}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm"
        >
          Đã đọc xong ✓
        </button>
      )}
    </div>
  );
}

function QuestionBlock({ q, idx, userAnswer, result, submitted, onSelect }) {
  const type    = q.type || 'multiple_choice';
  const options = q.options || [];

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      !submitted ? 'border-white/10' :
      result ? 'border-emerald-500/40 bg-emerald-900/10' : 'border-red-500/40 bg-red-900/10'
    }`}>
      <p className="text-sm font-semibold mb-3">{idx + 1}. {q.text || q.question}</p>

      {/* True / False */}
      {type === 'true_false' && (
        <div className="flex gap-3">
          {['True', 'False'].map(opt => (
            <OptionBtn key={opt} label={opt} value={opt.toLowerCase()}
              selected={userAnswer === opt.toLowerCase()} submitted={submitted}
              correct={q.answer?.toLowerCase() === opt.toLowerCase() && submitted}
              wrong={submitted && userAnswer === opt.toLowerCase() && q.answer?.toLowerCase() !== opt.toLowerCase()}
              onSelect={onSelect} />
          ))}
        </div>
      )}

      {/* Multiple choice */}
      {(type === 'multiple_choice' || options.length > 0) && type !== 'true_false' && (
        <div className="space-y-2">
          {options.map((opt, oi) => {
            const val = (opt.value ?? opt.text ?? opt ?? '').toString();
            const label = opt.label ?? opt.text ?? opt ?? '';
            const isSelected = userAnswer === val;
            const isCorrect  = submitted && (q.answer === val || q.correct_answer === val);
            const isWrong    = submitted && isSelected && !isCorrect;
            return (
              <OptionBtn key={oi} label={typeof label === 'string' ? label : JSON.stringify(label)}
                value={val} selected={isSelected} submitted={submitted}
                correct={isCorrect} wrong={isWrong} onSelect={onSelect} />
            );
          })}
        </div>
      )}

      {/* Fill blank / Short answer */}
      {(type === 'fill_blank' || type === 'short_answer') && (
        <input
          type="text"
          value={userAnswer || ''}
          onChange={e => !submitted && onSelect(e.target.value)}
          disabled={submitted}
          placeholder="Nhập câu trả lời…"
          className={`w-full bg-white/5 border rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all
            ${submitted ? (result ? 'border-emerald-500/50 text-emerald-300' : 'border-red-500/50 text-red-300') : 'border-white/20'}`}
        />
      )}

      {/* Show correct answer after submission */}
      {submitted && !result && (
        <p className="mt-2 text-xs text-emerald-400">Đáp án đúng: <strong>{q.answer ?? q.correct_answer}</strong></p>
      )}
    </div>
  );
}

function OptionBtn({ label, value, selected, submitted, correct, wrong, onSelect }) {
  let cls = 'w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ';
  if (wrong)          cls += 'border-red-500/60 bg-red-900/20 text-red-300';
  else if (correct)   cls += 'border-emerald-500/60 bg-emerald-900/20 text-emerald-300';
  else if (selected)  cls += 'border-indigo-500/60 bg-indigo-900/20 text-indigo-300';
  else                cls += 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10';

  return (
    <button onClick={() => !submitted && onSelect(value)} className={cls} disabled={submitted}>
      <span className="flex items-center gap-2">
        {submitted && correct && <FaCheck className="text-emerald-400 text-xs shrink-0" />}
        {submitted && wrong   && <FaTimes className="text-red-400  text-xs shrink-0" />}
        {label}
      </span>
    </button>
  );
}

function ScoreSummary({ correct, total }) {
  const pct = Math.round((correct / total) * 100);
  return (
    <div className={`rounded-xl p-4 text-center border
      ${pct >= 70 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
      <p className="font-bold text-lg">{pct >= 70 ? '🎉' : '💪'} {correct}/{total} câu đúng ({pct}%)</p>
      <p className="text-sm text-gray-400 mt-0.5">{pct >= 70 ? 'Xuất sắc! Tiếp tục nhé.' : 'Ôn luyện thêm để làm tốt hơn!'}</p>
    </div>
  );
}
