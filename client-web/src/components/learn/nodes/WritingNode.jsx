import React, { useState } from 'react';
import { FaEdit } from 'react-icons/fa';

/**
 * WritingNode — writing prompt editor.
 * node.data: { prompt, minWords, maxWords, modelEssay? }
 */
export default function WritingNode({ node, nodeIdx, onComplete }) {
  const data       = node.data || {};
  const prompt     = data.prompt || data.content || 'Viết bài theo chủ đề:';
  const minWords   = data.minWords   || data.min_words   || 50;
  const maxWords   = data.maxWords   || data.max_words   || 500;
  const title      = node.title || 'Bài Viết';

  const [text,      setText]      = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showEssay, setShowEssay] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tooShort  = wordCount < minWords;
  const tooLong   = wordCount > maxWords;
  const isReady   = !tooShort && !tooLong;

  const handleSubmit = () => {
    setSubmitted(true);
    // Score heuristic: 70 base if meets word count + bonus for longer text
    const score = isReady ? Math.min(100, 70 + Math.round((wordCount / maxWords) * 30)) : 40;
    onComplete(nodeIdx, { score, answers: { text } });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">✍️</span>
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{prompt}</p>
        <p className="text-xs text-gray-500 mt-2">Yêu cầu: {minWords}–{maxWords} từ</p>
      </div>

      {/* Editor */}
      {!submitted ? (
        <>
          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              placeholder="Bắt đầu viết tại đây…"
              className="w-full bg-gray-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500/60 resize-none transition-all leading-relaxed"
            />
            {/* Word count */}
            <div className={`absolute bottom-3 right-4 text-xs font-bold
              ${tooShort ? 'text-yellow-500' : tooLong ? 'text-red-500' : 'text-emerald-400'}`}>
              {wordCount} / {minWords}–{maxWords} từ
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || tooShort}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
          >
            {tooShort ? `Viết thêm ${minWords - wordCount} từ nữa…` : 'Nộp bài ✓'}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          {/* Submitted summary */}
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <FaEdit className="text-emerald-400" />
              <span className="font-bold text-emerald-400">Bài viết đã nộp ({wordCount} từ)</span>
            </div>
            <p className="text-gray-400 text-sm line-clamp-4 leading-relaxed">{text}</p>
          </div>

          {/* Model essay reveal */}
          {data.modelEssay && (
            <div>
              <button
                onClick={() => setShowEssay(s => !s)}
                className="text-xs text-indigo-400 hover:text-indigo-300 mb-2"
              >
                {showEssay ? '▲ Ẩn bài mẫu' : '▼ Xem bài mẫu tham khảo'}
              </button>
              {showEssay && (
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bài mẫu</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{data.modelEssay}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
