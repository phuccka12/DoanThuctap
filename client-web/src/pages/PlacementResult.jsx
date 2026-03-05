/**
 * PlacementResult.jsx
 * Celebration screen after placement test:
 *   - Confetti burst
 *   - CEFR level badge
 *   - IELTS estimate
 *   - Coins awarded
 *   - CTA: create learning path + get pet
 */
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Tiny canvas confetti ───────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6C5CE7', '#00CEC9', '#A29BFE', '#FD79A8', '#FDCB6E', '#55EFC4'];
    particles.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: 4 + Math.random() * 6,
      d: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: Math.random() * Math.PI * 2,
      tiltSpeed: 0.05 + Math.random() * 0.1,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach(p => {
        p.tiltAngle += p.tiltSpeed;
        p.y  += p.d;
        p.x  += Math.sin(p.tiltAngle) * 1.5;
        p.tilt = Math.sin(p.tiltAngle) * 10;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 5);
        ctx.stroke();
      });
      particles.current = particles.current.filter(p => p.y < canvas.height + 20);
      frame++;
      if (frame < 300 && particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// ─── Level meta ───────────────────────────────────────────────────────────────
const LEVEL_META = {
  'A1': { emoji: '🌱', color: 'from-[#55EFC4] to-[#00B894]', label: 'Mới bắt đầu (A1)',  text: 'Đừng lo — mọi cao thủ đều xuất phát từ A1. Lộ trình của bạn sẽ xây dựng từ nền tảng vững chắc.' },
  'A2': { emoji: '📗', color: 'from-[#55EFC4] to-[#00B894]', label: 'Cơ bản (A2)',        text: 'Bạn đã có nền tảng. Với lộ trình đúng, bạn sẽ lên B1 trong vài tháng!' },
  'B1': { emoji: '🚀', color: 'from-[#74B9FF] to-[#0984E3]', label: 'Trung cấp (B1)',     text: 'Tiềm năng đạt IELTS 5.5–6.5 rất cao. Chỉ cần rèn thêm Speaking & Writing là xong!' },
  'B2': { emoji: '⚡', color: 'from-[#A29BFE] to-[#6C5CE7]', label: 'Trên trung cấp (B2)', text: 'Gần đích rồi! IELTS 6.5–7.5 hoàn toàn trong tầm tay. Tiếp tục nào!' },
  'C1': { emoji: '🏆', color: 'from-[#FD79A8] to-[#E84393]', label: 'Nâng cao (C1)',      text: 'Cao thủ rồi đó! IELTS 7.5–8.5 là mục tiêu hoàn toàn khả thi của bạn.' },
  'C2': { emoji: '👑', color: 'from-[#FDCB6E] to-[#E17055]', label: 'Thông thạo (C2)',    text: 'Đỉnh của đỉnh! Hãy nhắm tới IELTS 8.5+ và trở thành giảng viên.' },
};

function getMeta(band) {
  return LEVEL_META[band] || LEVEL_META['B1'];
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-gray-600">
        <span>{label}</span>
        <span className="font-bold">{value}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlacementResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchUserInfo } = useAuth();

  const result = location.state?.result;
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealed, setRevealed]         = useState(false);

  useEffect(() => {
    if (!result) { navigate('/dashboard'); return; }
    // Reload user so context reflects new placement_test_completed + coins
    fetchUserInfo().catch(() => {});
    // Small delay then burst confetti
    const t = setTimeout(() => { setShowConfetti(true); setRevealed(true); }, 400);
    return () => clearTimeout(t);
  }, []);

  if (!result) return null;

  const meta      = getMeta(result.band);
  const totalPct  = result.totalScore;

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      <Confetti active={showConfetti} />

      <div
        className={`w-full max-w-xl transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div
            className={`w-28 h-28 mx-auto rounded-3xl bg-linear-to-br ${meta.color} flex items-center justify-center text-6xl shadow-xl mb-5`}
          >
            {meta.emoji}
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Tuyệt vời! 🎉
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Trình độ của bạn đang ở mức
          </p>
          <div
            className={`inline-block mt-3 px-6 py-2 rounded-full bg-linear-to-r ${meta.color} text-white font-bold text-xl shadow`}
          >
            {meta.label}
          </div>
          <p className="text-gray-500 text-sm mt-3 max-w-sm mx-auto">{meta.text}</p>
        </div>

        {/* ── Score breakdown ── */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow p-5 mb-5 space-y-4">
          <h3 className="text-base font-bold text-gray-700 mb-2">Chi tiết điểm số</h3>
          {/* Big score ring substitute */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-linear-to-r from-[#6C5CE7]/10 to-[#00CEC9]/10 border border-[#6C5CE7]/20 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white font-bold text-2xl shadow">
              {totalPct}
            </div>
            <div>
              <div className="text-sm text-gray-500">Tổng điểm</div>
              <div className="text-lg font-bold text-gray-800">{totalPct}/100</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-gray-400">IELTS ước tính</div>
              <div className="text-base font-bold text-[#6C5CE7]">{result.ieltsEstimate}</div>
            </div>
          </div>

          <ScoreBar label="Từ vựng & Ngữ pháp" value={result.vocabScore}    max={40} color="from-[#6C5CE7] to-[#A29BFE]" />
          <ScoreBar label="Đọc hiểu"            value={result.readingScore}  max={35} color="from-[#00CEC9] to-[#74B9FF]" />
          <ScoreBar label="Phát âm (Speaking)"   value={result.speakingScore} max={25} color="from-[#FD79A8] to-[#A29BFE]" />
        </div>

        {/* ── Coins reward ── */}
        <div className="bg-white rounded-3xl border border-yellow-200 shadow p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#FDCB6E] to-[#E17055] flex items-center justify-center text-3xl shadow">
            🪙
          </div>
          <div>
            <div className="text-base font-bold text-gray-800">Thưởng nóng!</div>
            <div className="text-sm text-gray-500">
              Bạn nhận được <span className="text-yellow-600 font-bold">+{result.coinsAwarded} Coins</span> làm vốn khởi nghiệp nuôi thú cưng! 🐾
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-bold text-base shadow-lg hover:shadow-xl transition hover:scale-[1.02] active:scale-95"
        >
          🗺️ Tạo lộ trình {result.band} của tôi &amp; Nhận Thú cưng →
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Hệ thống đã tự động cập nhật lộ trình dành riêng cho bạn.
        </p>
      </div>
    </div>
  );
}
