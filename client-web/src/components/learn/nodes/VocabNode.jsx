import React, { useState } from 'react';
import { FaCheck, FaTimes, FaVolumeUp } from 'react-icons/fa';

/**
 * VocabNode — flashcard carousel + fill-in quiz.
 * node.data.words: [{ word, meaning, pronunciation, part_of_speech, example, imageUrl, audioUrl }]
 */
export default function VocabNode({ node, nodeIdx, onComplete }) {
  const data  = node.data || {};
  const words = data.words || data.vocabulary || [];
  const title = node.title || 'Từ Vựng';

  const [phase,    setPhase]    = useState('cards');  // 'cards' | 'quiz'
  const [cardIdx,  setCardIdx]  = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [quizIdx,  setQuizIdx]  = useState(0);
  const [answers,  setAnswers]  = useState({});
  const [input,    setInput]    = useState('');
  const [checked,  setChecked]  = useState(false);
  const [correct,  setCorrect]  = useState(0);
  const [done,     setDone]     = useState(false);

  if (words.length === 0) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500">Chưa có từ vựng nào trong node này.</p>
        <button onClick={() => onComplete(nodeIdx, { score: 100 })} className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm">OK</button>
      </div>
    );
  }

  // ── PHASE 1: Flashcards ────────────────────────────────────────────────────
  if (phase === 'cards') {
    const w = words[cardIdx];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <h2 className="font-bold text-lg">{title}</h2>
          <span className="text-gray-500 text-sm ml-auto">{cardIdx + 1} / {words.length}</span>
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(f => !f)}
          className={`cursor-pointer select-none rounded-3xl border border-white/10 p-8 text-center transition-all duration-300 min-h-48 flex flex-col items-center justify-center
            ${flipped ? 'bg-indigo-900/30 border-indigo-500/30' : 'bg-gray-900'}`}
        >
          {!flipped ? (
            <>
              {w.imageUrl && <img src={w.imageUrl} alt={w.word} className="w-28 h-28 object-cover rounded-xl mb-4 mx-auto" />}
              <p className="text-3xl font-bold mb-2">{w.word}</p>
              {w.pronunciation && <p className="text-indigo-400 text-sm">{w.pronunciation}</p>}
              {w.part_of_speech && <p className="text-gray-500 text-xs mt-1 italic">{w.part_of_speech}</p>}
              <p className="text-gray-600 text-xs mt-4">Nhấn để xem nghĩa</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold mb-2 text-indigo-300">{w.meaning}</p>
              {w.example && <p className="text-gray-400 text-sm italic mt-2">"{w.example}"</p>}
              {w.audioUrl && (
                <button
                  onClick={e => { e.stopPropagation(); new Audio(w.audioUrl).play(); }}
                  className="mt-3 flex items-center gap-2 text-xs text-gray-400 hover:text-white"
                >
                  <FaVolumeUp /> Nghe phát âm
                </button>
              )}
            </>
          )}
        </div>

        {/* Card navigation */}
        <div className="flex gap-3">
          {cardIdx > 0 && (
            <button onClick={() => { setCardIdx(c => c - 1); setFlipped(false); }}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all">
              ← Trước
            </button>
          )}
          {cardIdx < words.length - 1 ? (
            <button onClick={() => { setCardIdx(c => c + 1); setFlipped(false); }}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition-all">
              Tiếp →
            </button>
          ) : (
            <button onClick={() => setPhase('quiz')}
              className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-bold transition-all">
              🧩 Làm bài kiểm tra
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE 2: Fill-in quiz ──────────────────────────────────────────────────
  if (phase === 'quiz' && !done) {
    const w = words[quizIdx];
    const isCorrectAnswer = input.trim().toLowerCase() === w.word.toLowerCase();

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧩</span>
          <h2 className="font-bold text-lg">Kiểm tra từ vựng</h2>
          <span className="text-gray-500 text-sm ml-auto">{quizIdx + 1} / {words.length}</span>
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Nhập từ tiếng Anh có nghĩa là:</p>
          <p className="text-2xl font-bold mb-1">{w.meaning}</p>
          {w.example && <p className="text-gray-500 text-xs italic">"...{w.example.replace(w.word, '___')}..."</p>}
        </div>

        <div>
          <input
            type="text"
            value={input}
            onChange={e => !checked && setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !checked && handleCheck()}
            disabled={checked}
            placeholder="Nhập từ tiếng Anh…"
            className={`w-full bg-white/5 border rounded-xl px-5 py-3 text-sm outline-none transition-all
              ${checked
                ? isCorrectAnswer ? 'border-emerald-500/60 text-emerald-300' : 'border-red-500/60 text-red-300'
                : 'border-white/20 focus:border-indigo-500'}`}
          />

          {checked && !isCorrectAnswer && (
            <p className="mt-2 text-xs text-emerald-400">Đáp án đúng: <strong>{w.word}</strong></p>
          )}
        </div>

        {!checked ? (
          <button
            onClick={handleCheck}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm"
          >
            Kiểm tra
          </button>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-xl p-3 text-center text-sm font-bold flex items-center justify-center gap-2
              ${isCorrectAnswer ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
              {isCorrectAnswer ? <><FaCheck /> Chính xác!</> : <><FaTimes /> Sai rồi</>}
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm"
            >
              {quizIdx < words.length - 1 ? 'Từ tiếp theo →' : '🎉 Hoàn thành'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── PHASE 3: Done ──────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((correct / words.length) * 100);
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">{pct >= 70 ? '🎉' : '📚'}</div>
        <p className="text-xl font-bold mb-2">{correct}/{words.length} từ đúng ({pct}%)</p>
        <p className="text-gray-400 text-sm">{pct >= 70 ? 'Tuyệt vời! Hãy tiếp tục nhé.' : 'Hãy ôn lại những từ bạn còn nhớ chưa chắc.'}</p>
      </div>
    );
  }

  function handleCheck() {
    const w   = words[quizIdx];
    const ok  = input.trim().toLowerCase() === w.word.toLowerCase();
    if (ok) setCorrect(c => c + 1);
    setChecked(true);
  }

  function handleNext() {
    if (quizIdx < words.length - 1) {
      setQuizIdx(i => i + 1);
      setInput('');
      setChecked(false);
    } else {
      const finalCorrect = correct + (input.trim().toLowerCase() === words[quizIdx].word.toLowerCase() ? 0 : 0);
      setDone(true);
      onComplete(nodeIdx, { score: Math.round((correct / words.length) * 100) });
    }
  }
}
