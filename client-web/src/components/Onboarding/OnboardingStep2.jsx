import React, { useState } from "react";
import { FaSeedling, FaBook, FaUserGraduate, FaFire } from "react-icons/fa";

/**
 * OnboardingStep2 - Màn 2: Trình độ hiện tại
 * Design theo style Dashboard - Professional & Clean
 */

const OPTIONS = [
  {
    id: "stranger",
    icon: <FaSeedling />,
    title: "Bắt đầu từ số 0 (Zero to Hero)",
    subtitle: "Xây dựng lại từ đầu với lộ trình thích nghi chậm và chắc",
    color: "from-[#55EFC4] to-[#00B894]",
  },
  {
    id: "old_friend",
    icon: <FaBook />,
    title: "Nền tảng vững chắc (Foundation)",
    subtitle: "Lấp đầy các lỗ hổng kiến thức và củng cố tư duy cơ bản",
    color: "from-[#74B9FF] to-[#0984E3]",
  },
  {
    id: "learning",
    icon: <FaUserGraduate />,
    title: "Tự tin bứt phá (Intermediate)",
    subtitle: "Tăng tốc độ phản xạ và mở rộng vốn từ vựng chuyên sâu",
    color: "from-[#A29BFE] to-[#6C5CE7]",
  },
  {
    id: "close_friend",
    icon: <FaFire />,
    title: "Chinh phục đỉnh cao (Advanced)",
    subtitle: "Tinh chỉnh các kỹ năng để đạt band điểm mục tiêu cao nhất",
    color: "from-[#FD79A8] to-[#E84393]",
  },
];

export default function OnboardingStep2({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(id) {
    setSelected(id);
  }

  function handleNext() {
    if (selected && onNext) {
      onNext({ background: selected, wantsPlacement: false });
    }
  }

  function handleUnsure() {
    // User explicitly requests the placement test later
    if (onNext) {
      onNext({ background: null, wantsPlacement: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] shadow-lg mb-6">
            <FaUserGraduate className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Trình độ hiện tại của bạn
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Đánh giá mức độ tiếng Anh hiện tại để chúng tôi tạo lộ trình phù hợp
          </p>
        </div>

        {/* Card Options */}
        <div className="grid gap-4">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`
                  group relative w-full bg-white rounded-xl p-6 
                  transition-all duration-300 text-left
                  border-2 hover:shadow-xl
                  ${isSelected
                    ? "border-[#6C5CE7] shadow-lg shadow-[#6C5CE7]/20 scale-[1.02]"
                    : "border-purple-100 hover:border-[#A29BFE] shadow-md"
                  }
                `}
              >
                <div className="flex items-center gap-5">
                  {/* Icon */}
                  <div className={`
                    flex-none w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl
                    bg-gradient-to-r ${opt.color} shadow-md
                    transition-transform duration-300
                    ${isSelected ? "scale-110" : "group-hover:scale-105"}
                  `}>
                    {opt.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-gray-800 mb-1">
                      {opt.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {opt.subtitle}
                    </div>
                  </div>

                  {/* Check Icon */}
                  <div className="flex-none">
                    {isSelected ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-[#A29BFE] transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-8 py-4 rounded-xl font-semibold text-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
          >
            ← Quay lại
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUnsure}
              className="px-4 py-3 rounded-xl font-semibold text-sm bg-white border border-purple-100 text-gray-700 hover:shadow-md transition"
            >
              🤔 Tôi không chắc — kiểm tra giúp tôi
            </button>

            <button
              onClick={handleNext}
              disabled={!selected}
              className={`
                px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                ${selected
                  ? "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
