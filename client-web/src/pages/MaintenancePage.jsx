import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Gọi endpoint đi QUA maintenance middleware (không trong PUBLIC_BYPASS)
// Nếu maintenance OFF → 200 → server sống lại
// Nếu maintenance ON  → 503 → vẫn đang bảo trì
async function checkMaintenanceStatus() {
  try {
    const res = await fetch(`${API_URL}/maintenance/status`);
    // 200 = bảo trì đã tắt, 503 = vẫn đang bảo trì
    return res.status !== 503;
  } catch {
    return false; // network error → coi như vẫn đang bảo trì
  }
}

export default function MaintenancePage() {
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Animate dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(t);
  }, []);

  // Kiểm tra ngay khi vào trang
  useEffect(() => {
    checkMaintenanceStatus().then(maintenanceOff => {
      if (maintenanceOff) window.location.href = '/';
    });
  }, []);

  // Auto-retry mỗi 30 giây + countdown hiển thị
  useEffect(() => {
    let secs = 30;
    const tick = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        secs = 30;
        setCountdown(30);
        checkMaintenanceStatus().then(maintenanceOff => {
          if (maintenanceOff) window.location.href = '/';
        });
      }
    }, 1_000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-125 h-75 bg-orange-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-red-600/6 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg mx-auto">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
              <span className="text-5xl">🚧</span>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-3xl border border-orange-500/20 animate-ping" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
          Đang bảo trì
          <span className="text-orange-400">{dots}</span>
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-8">
          Hệ thống đang được nâng cấp để mang lại trải nghiệm tốt hơn cho bạn.
          <br className="hidden sm:block"/>
          Vui lòng quay lại sau ít phút.
        </p>

        {/* Status card */}
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 mb-8 text-left space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Trạng thái hệ thống</span>
            <span className="flex items-center gap-2 text-orange-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block"/>
              Đang bảo trì
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tự động kiểm tra lại</span>
            <span className="text-gray-400">{countdown}s nữa</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Dữ liệu của bạn</span>
            <span className="text-emerald-400 font-medium">✓ An toàn</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={async () => {
              const maintenanceOff = await checkMaintenanceStatus();
              if (maintenanceOff) window.location.href = '/';
              else setCountdown(30);
            }}
            className="px-5 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-sm font-medium transition-colors"
          >
            🔄 Thử lại ngay
          </button>
          <a
            href="mailto:support@ieltsai.vn"
            className="px-5 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            📧 Liên hệ hỗ trợ
          </a>
        </div>

        <p className="mt-8 text-xs text-gray-700">
          IELTS AI — Hệ thống luyện thi thông minh
        </p>
      </div>
    </div>
  );
}
