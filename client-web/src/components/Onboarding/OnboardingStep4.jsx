import React, { useState } from "react";
import { FaClock, FaRegClock, FaBolt } from "react-icons/fa";

/**
 * OnboardingStep4 - Màn 4: Thời gian học mỗi ngày
 * Design theo style Dashboard - Professional & Clean
 */

const OPTIONS = [
  {
    id: "busy",
    icon: <FaClock />,
    title: "15-20 phút/ngày",
    subtitle: "Phù hợp cho người bận rộn, học tranh thủ giữa các công việc",
    color: "from-[#55EFC4] to-[#00B894]",
  },
  {
    id: "moderate",
    icon: <FaRegClock />,
    title: "30-45 phút/ngày",
    subtitle: "Tiến độ đều đặn, cân bằng giữa học tập và cuộc sống",
    color: "from-[#74B9FF] to-[#0984E3]",
  },
  {
    id: "intensive",
    icon: <FaBolt />,
    title: "60+ phút/ngày",
    subtitle: "Học cường độ cao, phù hợp cho mục tiêu thi gấp hoặc nâng band nhanh",
    color: "from-[#FD79A8] to-[#E84393]",
  },
];

export default function OnboardingStep4({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(id) {
    setSelected(id);
  }

  function handleNext() {
    if (selected && onNext) {
      onNext({ timeCommitment: selected });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-[#FDCB6E] to-[#E17055] shadow-lg mb-6">
            <FaClock className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Thời gian học mỗi ngày
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chọn thời lượng phù hợp với lịch trình của bạn để tối ưu hiệu quả học tập
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
        <div className="mt-10 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-8 py-4 rounded-xl font-semibold text-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleNext}
            disabled={!selected}
            className={`
              px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300
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
  );
}
