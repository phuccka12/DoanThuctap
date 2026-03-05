import React, { useState } from "react";
import { FaArrowRight, FaCheckCircle } from "react-icons/fa";
import { PixelEgg } from "../PixelSprite";

/**
 * OnboardingStep6 - Chọn trứng bí ẩn
 * Ba loại trứng: Lửa / Băng / Lá
 * onNext(egg_type) — gửi lựa chọn lên Onboarding.jsx
 */

const EGGS = [
  {
    id: "fire",
    label: "Trứng Lửa",
    tagline: "Năng lượng & Dũng cảm",
    description: "Bên trong ẩn chứa một sinh linh rực rỡ, mạnh mẽ và đầy nhiệt huyết.",
    gradient: "from-red-500/20 to-orange-500/20",
    border: "border-red-400",
    glow: "shadow-red-400/40",
    textAccent: "text-red-400",
    bg: "bg-red-500/10",
    dotColor: "bg-red-400",
  },
  {
    id: "ice",
    label: "Trứng Băng",
    tagline: "Bình tĩnh & Thông minh",
    description: "Trong vỏ màu xanh lạnh lẽo là trí tuệ sắc bén và tâm hồn điềm tĩnh.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-400",
    glow: "shadow-blue-400/40",
    textAccent: "text-blue-400",
    bg: "bg-blue-500/10",
    dotColor: "bg-blue-400",
  },
  {
    id: "leaf",
    label: "Trứng Lá",
    tagline: "Kiên nhẫn & Bền bỉ",
    description: "Bao phủ bởi sắc xanh của thiên nhiên, sinh linh này sẽ đồng hành cùng bạn mọi hành trình.",
    gradient: "from-green-500/20 to-emerald-500/20",
    border: "border-green-400",
    glow: "shadow-green-400/40",
    textAccent: "text-green-400",
    bg: "bg-green-500/10",
    dotColor: "bg-green-400",
  },
];

export default function OnboardingStep6({ onNext, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [hovering, setHovering] = useState(null);

  const handleConfirm = () => {
    if (!selected) return;
    onNext(selected);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10
                    bg-linear-to-br from-[#071029] via-[#08132a] to-[#0b1b2f]">

      {/* Sparkle decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-pulse"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Pixel egg ở header cũng animate */}
          <div className="flex justify-center mb-4">
            <PixelEgg tint={selected || 'fire'} size={72} wiggle />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Chọn người bạn đồng hành của bạn!
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Mỗi quả trứng ẩn chứa một sức mạnh bí ẩn. Hãy lắng nghe trực giác — bạn chọn quả nào?
          </p>
        </div>

        {/* Egg Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {EGGS.map((egg) => {
            const isSelected = selected === egg.id;
            const isHovering = hovering === egg.id;

            return (
              <button
                key={egg.id}
                onClick={() => setSelected(egg.id)}
                onMouseEnter={() => setHovering(egg.id)}
                onMouseLeave={() => setHovering(null)}
                className={`
                  relative flex flex-col items-center p-6 rounded-2xl border-2 text-left
                  transition-all duration-300 cursor-pointer select-none
                  bg-linear-to-br ${egg.gradient}
                  ${isSelected
                    ? `${egg.border} shadow-lg ${egg.glow} scale-105`
                    : isHovering
                    ? `${egg.border} border-opacity-60 shadow-md scale-[1.02]`
                    : "border-gray-700/50 hover:border-gray-600"}
                `}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className={`absolute top-3 right-3 ${egg.textAccent}`}>
                    <FaCheckCircle size={20} />
                  </div>
                )}

                {/* Pixel egg — wiggle khi selected/hover */}
                <div className="mb-3">
                  <PixelEgg
                    tint={egg.id}
                    size={isSelected ? 80 : isHovering ? 72 : 64}
                    wiggle={isSelected || isHovering}
                  />
                </div>

                {/* Label */}
                <h3 className={`text-lg font-bold mb-1 ${egg.textAccent}`}>
                  {egg.label}
                </h3>
                <p className="text-white/80 text-sm font-medium mb-3">
                  {egg.tagline}
                </p>
                <p className="text-gray-400 text-xs leading-relaxed text-center">
                  {egg.description}
                </p>

                {/* Bottom dot indicator */}
                <div className={`
                  mt-4 w-2 h-2 rounded-full transition-all duration-300
                  ${isSelected ? `${egg.dotColor} scale-150` : "bg-gray-600"}
                `} />
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className={`
              flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-base
              transition-all duration-300
              ${selected
                ? "bg-linear-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-lg shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/50"
                : "bg-gray-700 text-gray-500 cursor-not-allowed opacity-60"}
            `}
          >
            <span>
              {selected
                ? `Chọn ${EGGS.find((e) => e.id === selected)?.label} này!`
                : "Hãy chọn một quả trứng"}
            </span>
            <FaArrowRight />
          </button>

          {selected && (
            <p className="text-gray-500 text-xs animate-fade-in">
              Bạn sẽ ấp nở trứng này trên Dashboard sau khi hoàn thành onboarding ✨
            </p>
          )}

          {onSkip && (
            <button
              onClick={() => onSkip()}
              className="text-gray-600 text-sm hover:text-gray-400 transition-colors mt-1"
            >
              Bỏ qua, cho tôi ngẫu nhiên
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease forwards; }
      `}</style>
    </div>
  );
}
