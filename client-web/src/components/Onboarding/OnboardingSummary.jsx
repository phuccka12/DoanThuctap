import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaCalendarAlt, FaBullseye, FaChartLine, FaStar } from "react-icons/fa";

/**
 * OnboardingSummary - Màn hình tổng kết
 * Design theo style Dashboard - Professional & Clean
 */

const GOAL_LABELS = {
  study_abroad: "Du học / Định cư",
  career: "Công việc / Thăng tiến",
  graduation: "Xét tốt nghiệp",
  passion: "Đam mê ngôn ngữ",
  other: "Mục tiêu khác",
};

const BACKGROUND_LABELS = {
  stranger: "Mới bắt đầu",
  old_friend: "Cơ bản",
  learning: "Trung bình",
  close_friend: "Khá tốt",
};

const PAIN_POINT_LABELS = {
  writing: "Writing (Viết)",
  speaking: "Speaking (Nói)",
  listening: "Listening (Nghe)",
  all: "Tất cả kỹ năng",
};

const TIME_LABELS = {
  busy: "15-20 phút/ngày",
  moderate: "30-45 phút/ngày",
  intensive: "60+ phút/ngày",
};

export default function OnboardingSummary({ data, userName }) {
  const navigate = useNavigate();

  // Calculate suggested band and timeline based on data
  const suggestedBand = data.background === "close_friend" ? "7.0-7.5" : data.background === "learning" ? "6.5-7.0" : "6.0-6.5";
  const timeline = data.timeCommitment === "intensive" ? "2-3 tháng" : data.timeCommitment === "moderate" ? "3-4 tháng" : "4-6 tháng";
  const focusArea = PAIN_POINT_LABELS[data.painPoint] || "Tổng hợp";

  function handleStart() {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Celebration Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] shadow-xl mb-6 animate-bounce">
            <FaTrophy className="text-5xl text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">
            Hoàn thành!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chúng tôi đã tạo lộ trình học tập dành riêng cho <span className="font-bold text-[#6C5CE7]">{userName}</span>
          </p>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Goal Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-start gap-4">
              <div className="flex-none w-14 h-14 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] flex items-center justify-center text-white text-2xl shadow-md">
                <FaBullseye />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-semibold mb-1">MỤC TIÊU</div>
                <div className="text-xl font-bold text-gray-800">
                  {GOAL_LABELS[data.goal]}
                </div>
                <div className="text-sm text-[#6C5CE7] font-semibold mt-2">
                  Target: Band {suggestedBand}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-start gap-4">
              <div className="flex-none w-14 h-14 rounded-xl bg-gradient-to-r from-[#00CEC9] to-[#0984E3] flex items-center justify-center text-white text-2xl shadow-md">
                <FaCalendarAlt />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-semibold mb-1">THỜI GIAN</div>
                <div className="text-xl font-bold text-gray-800">
                  {timeline}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {TIME_LABELS[data.timeCommitment]}
                </div>
              </div>
            </div>
          </div>

          {/* Focus Area Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-start gap-4">
              <div className="flex-none w-14 h-14 rounded-xl bg-gradient-to-r from-[#FD79A8] to-[#E84393] flex items-center justify-center text-white text-2xl shadow-md">
                <FaChartLine />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-semibold mb-1">TRỌNG TÂM</div>
                <div className="text-xl font-bold text-gray-800">
                  {focusArea}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Ưu tiên cải thiện
                </div>
              </div>
            </div>
          </div>

          {/* Level Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-start gap-4">
              <div className="flex-none w-14 h-14 rounded-xl bg-gradient-to-r from-[#FDCB6E] to-[#E17055] flex items-center justify-center text-white text-2xl shadow-md">
                <FaStar />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-semibold mb-1">TRÌNH ĐỘ</div>
                <div className="text-xl font-bold text-gray-800">
                  {BACKGROUND_LABELS[data.background]}
                </div>
                {data.assessmentCompleted && (
                  <div className="text-sm text-gray-600 mt-2">
                    Đánh giá: {data.score}/{data.totalQuestions} đúng
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-[#A29BFE]/10 to-[#00CEC9]/10 rounded-xl p-6 border-2 border-[#A29BFE]/20 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-none text-3xl">💡</div>
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">
                <span className="font-bold text-[#6C5CE7]">AI Coach</span> sẽ đồng hành cùng bạn trong suốt hành trình học tập. 
                Hệ thống sẽ tự động điều chỉnh lộ trình dựa trên tiến độ và kết quả của bạn để đảm bảo hiệu quả tối ưu.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-3 px-12 py-5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white text-xl font-bold shadow-2xl hover:shadow-[#6C5CE7]/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Bắt đầu học ngay</span>
            <FaTrophy className="text-2xl" />
          </button>

          <p className="text-sm text-gray-500 mt-5">
            Bạn có thể thay đổi cài đặt này bất cứ lúc nào trong phần Hồ sơ
          </p>
        </div>
      </div>
    </div>
  );
}
