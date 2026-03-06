import React, { useEffect, useState } from 'react';
import { FaTimes, FaStar, FaArrowRight, FaListAlt, FaHome } from 'react-icons/fa';
import { PixelSprite } from '../PixelSprite';

/**
 * CompletionModal — shown when a lesson is fully completed.
 * Props:
 *   reward       — { coins, exp, pet: { petType, egg_type, level, coins }, petState }
 *   lesson       — current lesson document
 *   nextLesson   — next lesson in topic (or null)
 *   nodeScores   — { 0: score, 1: score, ... }
 *   totalNodes   — number
 *   onClose      — navigate back to topic roadmap
 *   onNextLesson — navigate to next lesson
 */
export default function CompletionModal({ reward = {}, lesson, nextLesson, nodeScores = {}, totalNodes, onClose, onNextLesson }) {
  const [showCoins, setShowCoins] = useState(false);
  const [coinCount, setCoinCount] = useState(0);
  const [visible,   setVisible]   = useState(false);

  const coins     = reward?.coins  ?? 0;
  const exp       = reward?.exp    ?? 0;
  const petInfo   = reward?.pet;
  const petState  = reward?.petState;
  const scores    = Object.values(nodeScores);
  const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const stars     = avgScore >= 90 ? 3 : avgScore >= 70 ? 2 : 1;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setShowCoins(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!showCoins || !coins) return;
    let i = 0;
    const iv = setInterval(() => {
      i += Math.ceil(coins / 28);
      setCoinCount(Math.min(i, coins));
      if (i >= coins) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [showCoins, coins]);

  const petType       = petInfo?.petType || 'cat';
  const petBasePath   = `/pets/${petType}/`;
  const petTint       = petInfo?.egg_type || null;
  const isCelebrating = petState?.status !== 'dying';

  const greetMsg = avgScore >= 90 ? '🎉 Xuất sắc!' : avgScore >= 70 ? '🎊 Tốt lắm!' : '💪 Cố gắng thêm!';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      {showCoins && coins > 0 && <CoinParticles />}

      <div
        className={`relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl shadow-2xl shadow-black/70 overflow-hidden transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Top glow band */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#6C5CE7] via-[#a855f7] to-[#00CEC9]" />

        {/* Background decoration */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-900/25 via-purple-900/10 to-transparent pointer-events-none" />

        <div className="relative p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <FaTimes className="text-xs" />
          </button>

          {/* ── Pet + Stars ── */}
          <div className="flex flex-col items-center mb-5">
            <div className={`relative ${isCelebrating ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.7s', animationIterationCount: 3 }}>
              <PixelSprite frames={[0,1,2,3,4,5,6,7,8,9,10,11]} fps={12} size={90} basePath={petBasePath} tint={petTint} />
              {isCelebrating && (
                <div className="absolute -top-2 -right-2 text-xl animate-spin" style={{ animationDuration: '2s' }}>✨</div>
              )}
            </div>

            <div className="flex gap-1.5 mt-3">
              {[1, 2, 3].map(s => (
                <FaStar
                  key={s}
                  className={`text-2xl transition-all duration-500 ${s <= stars ? 'text-yellow-400 drop-shadow-[0_0_10px_#facc15]' : 'text-gray-700'}`}
                  style={{ transitionDelay: `${(s - 1) * 180}ms` }}
                />
              ))}
            </div>
          </div>

          {/* ── Title ── */}
          <h2 className="text-xl font-bold text-center text-white mb-0.5">{greetMsg}</h2>
          {lesson?.title && (
            <p className="text-gray-400 text-xs text-center mb-5 line-clamp-1 px-4">
              ✅ {lesson.title}
            </p>
          )}

          {/* ── Score summary ── */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard label="Điểm TB" value={`${avgScore}%`} color="text-indigo-400" />
            <StatCard label="Hoạt động" value={`${scores.length}/${totalNodes}`} color="text-purple-400" />
            <StatCard label="Pet" value={petState?.status === 'happy' ? '😊 Vui' : petState?.status === 'dying' ? '😰 Yếu' : '😐 Ổn'} color="text-emerald-400" />
          </div>

          {/* ── Rewards ── */}
          <div className={`rounded-2xl border p-4 mb-5 transition-all duration-700 ${showCoins ? 'border-yellow-500/40 bg-yellow-900/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Phần thưởng nhận được</p>
            <div className="flex justify-around">
              <RewardItem icon="🪙" label="Coins" value={`+${coinCount}`} highlight={showCoins && coins > 0} />
              <RewardItem icon="⚡" label="EXP Pet" value={`+${exp}`} highlight={showCoins && exp > 0} />
              {petInfo?.level && <RewardItem icon="🐾" label="Cấp độ" value={`Lv.${petInfo.level}`} highlight={false} />}
            </div>
            {petState?.expLocked && (
              <p className="text-xs text-red-400 text-center mt-2">⚠️ Pet đang yếu — EXP bị khóa. Hãy cho pet ăn!</p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-col gap-2.5">
            {/* Next lesson — primary CTA */}
            {nextLesson && (
              <button
                onClick={onNextLesson}
                className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#6C5CE7] to-[#a855f7] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6C5CE7]/25 active:scale-95"
              >
                Bài tiếp theo
                <FaArrowRight />
                <span className="text-xs font-normal opacity-80 ml-1 truncate max-w-32">{nextLesson.title}</span>
              </button>
            )}

            {/* Back to roadmap */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/8 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-white/10 active:scale-95"
            >
              <FaListAlt className="text-xs" />
              {nextLesson ? 'Về lộ trình' : 'Hoàn thành ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function RewardItem({ icon, label, value, highlight }) {
  return (
    <div className={`text-center transition-all duration-500 ${highlight ? 'scale-110' : ''}`}>
      <p className="text-2xl">{icon}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

// Floating coin animation via CSS keyframes
function CoinParticles() {
  const coins = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {coins.map(i => (
        <span
          key={i}
          className="absolute text-xl animate-bounce"
          style={{
            left:              `${10 + Math.random() * 80}%`,
            top:               `-${10 + i * 8}px`,
            animationDuration: `${0.8 + Math.random() * 0.6}s`,
            animationDelay:    `${i * 0.08}s`,
            transform:         `translateY(0)`,
            animation:         `coinFall ${0.8 + Math.random() * 0.8}s ease-in ${i * 0.08}s forwards`,
          }}
        >
          🪙
        </span>
      ))}
      <style>{`
        @keyframes coinFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
