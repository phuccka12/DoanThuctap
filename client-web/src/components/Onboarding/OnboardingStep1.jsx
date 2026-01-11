import React, { useState } from "react";
import { FaGlobeAmericas, FaBriefcase, FaGraduationCap, FaHeart, FaRocket } from "react-icons/fa";

/**
 * OnboardingStep1 - Màn 1: Mục tiêu học tập
 * Design theo style Dashboard - Professional & Clean
 */

const OPTIONS = [
  {
    id: "study_abroad",
    icon: <FaGlobeAmericas />,
    title: "Du học / Định cư",
    subtitle: "Chuẩn bị IELTS Academic cho các kỳ thi quan trọng",
    color: "from-[#6C5CE7] to-[#00CEC9]",
  },
  {
    id: "career",
    icon: <FaBriefcase />,
    title: "Công việc / Thăng tiến",
    subtitle: "Nâng cao tiếng Anh chuyên nghiệp trong môi trường làm việc",
    color: "from-[#A29BFE] to-[#6C5CE7]",
  },
  {
    id: "graduation",
    icon: <FaGraduationCap />,
    title: "Xét tốt nghiệp",
    subtitle: "Đạt chứng chỉ đầu ra theo yêu cầu của trường",
    color: "from-[#00CEC9] to-[#0984E3]",
  },
  {
    id: "passion",
    icon: <FaHeart />,
    title: "Đam mê ngôn ngữ",
    subtitle: "Học để giao tiếp, xem phim, đọc sách tiếng Anh tự nhiên",
    color: "from-[#FD79A8] to-[#E17055]",
  },
  {
    id: "other",
    icon: <FaRocket />,
    title: "Mục tiêu khác",
    subtitle: "Nâng cao trình độ tiếng Anh toàn diện và đa dạng",
    color: "from-[#FDCB6E] to-[#E17055]",
  },
];

export default function OnboardingStep1({ onNext }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(id) {
    setSelected(id);
  }

  function handleNext() {
    if (selected && onNext) {
      onNext({ goal: selected });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] shadow-lg mb-6">
            <FaGraduationCap className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Mục tiêu học tập của bạn
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hãy cho chúng tôi biết lý do bạn muốn học IELTS để tạo lộ trình phù hợp nhất
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

        {/* Next Button */}
        <div className="mt-10 flex justify-end">
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
