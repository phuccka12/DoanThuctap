/**
 * PlacementTest.jsx
 * Typeform-style: one question per screen, progress bar, 3 sections:
 *   1) Vocab / Grammar  (3 MCQ)
 *   2) Reading           (1 passage + 2 MCQ)
 *   3) Speaking          (mic — Web Speech API pronunciation check)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import LoadingCat from '../components/shared/LoadingCat';

// ─── Question Bank ────────────────────────────────────────────────────────────
const VOCAB_QUESTIONS = [
  {
    id: 'v1', difficulty: 'A1 · Dễ',
    question: 'Choose the correct form: "She ___ to school every day."',
    options: [
      { key: 'a', text: 'go' },
      { key: 'b', text: 'goes' },
      { key: 'c', text: 'going' },
      { key: 'd', text: 'gone' },
    ],
    answer: 'b',
  },
  {
    id: 'v2', difficulty: 'B1 · Trung bình',
    question: 'Choose the correct option: "Despite ___ hard, he failed the exam."',
    options: [
      { key: 'a', text: 'study' },
      { key: 'b', text: 'to study' },
      { key: 'c', text: 'studying' },
      { key: 'd', text: 'studied' },
    ],
    answer: 'c',
  },
  {
    id: 'v3', difficulty: 'C1 · Khó',
    question: '"The board ___ the proposal, citing unforeseen fiscal constraints." — Which word best fills the blank?',
    options: [
      { key: 'a', text: 'acquiesced to' },
      { key: 'b', text: 'expedited' },
      { key: 'c', text: 'vetoed' },
      { key: 'd', text: 'promulgated' },
    ],
    answer: 'a',
  },
];

const READING_PASSAGE = `Scientists warn that Arctic ice is melting at an unprecedented rate, with
summer sea ice potentially disappearing entirely within two decades. This shift
threatens polar ecosystems and accelerates global warming, as ice normally
reflects sunlight back into space. Researchers urge immediate action to curb
greenhouse gas emissions before the damage becomes irreversible.`;

const READING_QUESTIONS = [
  {
    id: 'r1',
    question: 'What is the main idea of the passage?',
    options: [
      { key: 'a', text: 'Polar bears are endangered.' },
      { key: 'b', text: 'Greenhouse gases have no effect on ice.' },
      { key: 'c', text: 'Arctic ice loss accelerates climate change and needs urgent action.' },
      { key: 'd', text: 'Scientists disagree about climate change causes.' },
    ],
    answer: 'c',
  },
  {
    id: 'r2',
    question: 'According to the text, why is sea ice important?',
    options: [
      { key: 'a', text: 'It provides drinking water.' },
      { key: 'b', text: 'It reflects sunlight, helping regulate temperature.' },
      { key: 'c', text: 'It stores carbon dioxide.' },
      { key: 'd', text: 'It is home to most ocean fish.' },
    ],
    answer: 'b',
  },
];

const SPEAKING_SENTENCE = 'The quick brown fox jumps over the lazy dog.';

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Levenshtein distance (normalized) for pronunciation similarity
function levenshtein(a, b) {
  // classic dynamic programming, optimized to O(min(m,n)) space
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  // ensure a is the shorter one to use less memory
  if (la > lb) {
    [a, b] = [b, a];
  }
  const prev = new Array(a.length + 1);
  for (let i = 0; i <= a.length; i++) prev[i] = i;
  for (let j = 1; j <= b.length; j++) {
    let cur = [j];
    const bj = b[j - 1];
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === bj ? 0 : 1;
      cur[i] = Math.min(
        prev[i] + 1,        // deletion
        cur[i - 1] + 1,     // insertion
        prev[i - 1] + cost  // substitution
      );
    }
    for (let k = 0; k < cur.length; k++) prev[k] = cur[k];
  }
  return prev[a.length];
}

function pronunciationScore(expected, heard) {
  // normalize: lowercase, remove punctuation but keep spaces, collapse spaces
  const norm = s => (s || '').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
  const exp = norm(expected);
  const act = norm(heard);
  if (!exp && !act) return 0;
  if (!exp) return 0;
  // compute levenshtein distance on the normalized strings
  const dist = levenshtein(exp, act);
  const maxLen = Math.max(exp.length, act.length || 0);
  if (maxLen === 0) return 0;
  const similarity = 1 - dist / maxLen;
  // clamp to [0,1]
  return Math.max(0, Math.min(1, similarity));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProgressBar({ percent }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 bg-purple-100 z-50">
      <div
        className="h-full bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function SectionBadge({ text }) {
  return (
    <span className="inline-block mb-4 px-3 py-1 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] text-xs font-bold uppercase tracking-wide">
      {text}
    </span>
  );
}

function MCQCard({ question, options, selected, onSelect }) {
  return (
    <div className="mt-6 space-y-3">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 font-medium
            ${selected === opt.key
              ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 text-[#6C5CE7] shadow-md'
              : 'border-purple-100 bg-white text-gray-700 hover:border-[#A29BFE] hover:shadow'
            }`}
        >
          <span className={`mr-3 font-bold ${selected === opt.key ? 'text-[#6C5CE7]' : 'text-gray-400'}`}>
            {opt.key.toUpperCase()}.
          </span>
          {opt.text}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlacementTest() {
  const navigate = useNavigate();

  // ── state ──
  const [screen, setScreen]         = useState('intro');   // intro | v0 | v1 | v2 | reading | r0 | r1 | speaking | submitting
  const [vocabAnswers, setVocab]     = useState(['', '', '']);
  const [readingAnswers, setReading] = useState(['', '']);
  const [speakingScore, setSpeaking] = useState(null);

  // mic state
  const [micStatus, setMicStatus]     = useState('idle');   // idle | listening | done | error
  const [transcript, setTranscript]   = useState('');
  const recognitionRef                = useRef(null);

  // ── total screens for progress ──
  const SCREENS = ['intro', 'v0', 'v1', 'v2', 'reading', 'r0', 'r1', 'speaking'];
  const idx     = SCREENS.indexOf(screen);
  const pct     = idx < 0 ? 100 : Math.round(((idx) / (SCREENS.length)) * 100);

  // ── speaking ──
  const startMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech API. Hãy dùng Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart   = () => setMicStatus('listening');
    rec.onerror   = () => { setMicStatus('error'); };
    rec.onresult  = (e) => {
      const text  = e.results[0][0].transcript;
      setTranscript(text);
      const score = pronunciationScore(SPEAKING_SENTENCE, text);
      setSpeaking(score);
      setMicStatus('done');
    };
    rec.onend = () => { if (micStatus === 'listening') setMicStatus('idle'); };
    rec.start();
  };

  const stopMic = () => {
    recognitionRef.current?.stop();
    setMicStatus('idle');
  };

  // ── submit ──
  const handleSubmit = async () => {
    setScreen('submitting');
    try {
      const res = await axiosInstance.post('/placement/submit', {
        vocab:    vocabAnswers,
        reading:  readingAnswers,
        speaking: { score: speakingScore ?? 0.5 },
      });
      if (res.data.success) {
        navigate('/placement-result', { state: { result: res.data.result } });
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
        setScreen('speaking');
      }
    } catch (err) {
      console.error('[PlacementTest] submit error:', err);
      alert('Không thể kết nối server. Vui lòng thử lại.');
      setScreen('speaking');
    }
  };

  // ── skip speaking (if mic fails) ──
  const skipSpeaking = () => {
    setSpeaking(0.5); // 50% pronunciation score fallback
    handleSubmit();
  };

  // ── nav helpers ──
  const next = (to) => setScreen(to);

  // ───────────────────────────────────────────── RENDER ──────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-violet-50 flex flex-col">
      <ProgressBar percent={pct} />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">

          {/* ── INTRO ── */}
          {screen === 'intro' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white text-4xl shadow-lg">
                🧠
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Kiểm tra trình độ</h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Bài test <strong>khoảng 3 phút</strong>. Gồm <strong>3 phần</strong>:
                Từ vựng · Đọc hiểu · Phát âm. Hệ thống sẽ đề xuất lộ trình phù hợp với bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <div className="flex items-center gap-2 bg-white rounded-2xl border border-purple-100 px-4 py-3 text-sm text-gray-600">
                  📚 <span>3 câu từ vựng</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-2xl border border-purple-100 px-4 py-3 text-sm text-gray-600">
                  📖 <span>1 đoạn đọc hiểu</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-2xl border border-purple-100 px-4 py-3 text-sm text-gray-600">
                  🎤 <span>Thử thách phát âm</span>
                </div>
              </div>
              <button
                onClick={() => next('v0')}
                className="mt-4 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-bold text-lg shadow-md hover:shadow-lg transition animate-pulse hover:animate-none"
              >
                Bắt đầu ngay 🚀
              </button>
            </div>
          )}

          {/* ── VOCAB 0,1,2 ── */}
          {['v0', 'v1', 'v2'].map((s, qi) => screen === s && (
            <div key={s}>
              <SectionBadge text={`Phần 1 · Từ vựng & Ngữ pháp · Câu ${qi + 1}/3`} />
              <span className="text-xs text-gray-400 mb-2 block">{VOCAB_QUESTIONS[qi].difficulty}</span>
              <h2 className="text-xl font-bold text-gray-800 leading-snug">
                {VOCAB_QUESTIONS[qi].question}
              </h2>
              <MCQCard
                question={VOCAB_QUESTIONS[qi].question}
                options={VOCAB_QUESTIONS[qi].options}
                selected={vocabAnswers[qi]}
                onSelect={key => {
                  const copy = [...vocabAnswers];
                  copy[qi] = key;
                  setVocab(copy);
                }}
              />
              <div className="mt-8 flex justify-between">
                {qi > 0
                  ? <button onClick={() => next(['v0','v1','v2'][qi-1])} className="text-gray-500 hover:text-gray-700 text-sm">← Quay lại</button>
                  : <span />
                }
                <button
                  onClick={() => next(qi < 2 ? ['v0','v1','v2'][qi+1] : 'reading')}
                  disabled={!vocabAnswers[qi]}
                  className={`px-7 py-3 rounded-2xl font-semibold text-sm transition
                    ${vocabAnswers[qi]
                      ? 'bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {qi < 2 ? 'Tiếp theo →' : 'Sang phần đọc hiểu →'}
                </button>
              </div>
            </div>
          ))}

          {/* ── READING PASSAGE INTRO ── */}
          {screen === 'reading' && (
            <div>
              <SectionBadge text="Phần 2 · Đọc hiểu" />
              <h2 className="text-xl font-bold text-gray-800 mb-4">Đọc đoạn văn sau:</h2>
              <div className="bg-white border border-purple-100 rounded-2xl p-5 shadow text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {READING_PASSAGE}
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => next('r0')}
                  className="px-7 py-3 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-semibold text-sm shadow hover:shadow-lg transition"
                >
                  Trả lời câu hỏi →
                </button>
              </div>
            </div>
          )}

          {/* ── READING Q 0,1 ── */}
          {['r0', 'r1'].map((s, qi) => screen === s && (
            <div key={s}>
              <SectionBadge text={`Phần 2 · Đọc hiểu · Câu ${qi + 1}/2`} />
              <h2 className="text-xl font-bold text-gray-800 leading-snug">
                {READING_QUESTIONS[qi].question}
              </h2>
              <MCQCard
                question={READING_QUESTIONS[qi].question}
                options={READING_QUESTIONS[qi].options}
                selected={readingAnswers[qi]}
                onSelect={key => {
                  const copy = [...readingAnswers];
                  copy[qi] = key;
                  setReading(copy);
                }}
              />
              <div className="mt-8 flex justify-between">
                <button onClick={() => next(qi === 0 ? 'reading' : 'r0')} className="text-gray-500 hover:text-gray-700 text-sm">← Quay lại</button>
                <button
                  onClick={() => next(qi === 0 ? 'r1' : 'speaking')}
                  disabled={!readingAnswers[qi]}
                  className={`px-7 py-3 rounded-2xl font-semibold text-sm transition
                    ${readingAnswers[qi]
                      ? 'bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {qi === 0 ? 'Tiếp theo →' : 'Sang phần phát âm →'}
                </button>
              </div>
            </div>
          ))}

          {/* ── SPEAKING ── */}
          {screen === 'speaking' && (
            <div>
              <SectionBadge text="Phần 3 · Thử thách AI Speaking 🎤" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đọc to câu sau bằng tiếng Anh:</h2>
              <p className="text-xs text-gray-400 mb-5">Bấm mic → đọc rõ ràng → hệ thống AI sẽ chấm phát âm của bạn ngay lập tức.</p>

              <div className="bg-linear-to-r from-[#6C5CE7]/10 to-[#00CEC9]/10 border border-[#6C5CE7]/20 rounded-2xl p-5 text-center">
                <p className="text-lg font-bold text-[#6C5CE7] italic">
                  "{SPEAKING_SENTENCE}"
                </p>
              </div>

              {/* Mic button */}
              <div className="mt-6 flex flex-col items-center gap-3">
                {micStatus === 'idle' && (
                  <button
                    onClick={startMic}
                    className="w-20 h-20 rounded-full bg-linear-to-br from-[#6C5CE7] to-[#00CEC9] text-white text-3xl flex items-center justify-center shadow-lg hover:shadow-xl transition hover:scale-105"
                  >
                    🎤
                  </button>
                )}
                {micStatus === 'listening' && (
                  <button
                    onClick={stopMic}
                    className="w-20 h-20 rounded-full bg-red-500 text-white text-3xl flex items-center justify-center shadow-lg animate-pulse"
                  >
                    ⏹
                  </button>
                )}
                {micStatus === 'done' && (
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 border-2 border-green-400 text-3xl flex items-center justify-center">
                      ✅
                    </div>
                    <p className="text-sm text-gray-500">Ghi âm xong!</p>
                    {transcript && (
                      <p className="text-xs text-gray-400 italic">Nhận diện: "{transcript}"</p>
                    )}
                    {speakingScore !== null && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <div className="h-2 w-40 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] rounded-full transition-all duration-700"
                            style={{ width: `${Math.round(speakingScore * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#6C5CE7]">{Math.round(speakingScore * 100)}%</span>
                      </div>
                    )}
                  </div>
                )}
                {micStatus === 'error' && (
                  <p className="text-red-500 text-sm">Không nhận được giọng nói. Thử lại?</p>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  {micStatus === 'listening' ? 'Đang nghe... bấm ⏹ để dừng' : 'Bấm 🎤 để bắt đầu ghi âm'}
                </p>
              </div>

              <div className="mt-8 flex justify-between items-center">
                <button onClick={() => next('r1')} className="text-gray-500 hover:text-gray-700 text-sm">← Quay lại</button>

                <div className="flex gap-3">
                  <button
                    onClick={skipSpeaking}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
                  >
                    Bỏ qua phần này
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={micStatus !== 'done' && speakingScore === null}
                    className={`px-7 py-3 rounded-2xl font-semibold text-sm transition
                      ${(micStatus === 'done' || speakingScore !== null)
                        ? 'bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Nộp bài & xem kết quả 🎯
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUBMITTING ── */}
          {screen === 'submitting' && (
            <div className="text-center space-y-6 py-12">
              <LoadingCat size={200} text="AI đang chấm bài của bạn... Chờ chút nhé! 🧠" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
