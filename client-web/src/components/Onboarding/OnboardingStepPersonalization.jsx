import React, { useState } from "react";
import { FaUserGraduate, FaLightbulb, FaCheck } from "react-icons/fa";

const MAJOR_OPTIONS = [
  "Khoa học Máy tính & AI",
  "Kinh doanh & Tài chính",
  "Y sinh & Chăm sóc sức khỏe",
  "Kỹ thuật & Công nghệ cao",
  "Ngôn ngữ & Truyền thông",
  "Nghệ thuật & Sáng tạo",
  "Lao động phổ thông / Nghề",
  "Học sinh / Sinh viên tự do"
];

const INTEREST_OPTIONS = [
  "Công nghệ thông tin / AI",
  "Blockchain / Crypto",
  "Du lịch / Văn hóa",
  "Âm nhạc / Điện ảnh",
  "Khởi nghiệp / Kinh doanh",
  "Khoa học / Khám phá vũ trụ",
  "Tâm lý học / Phát triển bản thân",
  "Ẩm thực / Đời sống"
];

export default function OnboardingStepPersonalization({ onNext, onBack }) {
  const [major, setMajor] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext({ major, interests: selectedInterests });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] shadow-lg mb-6">
            <FaUserGraduate className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Cá nhân hóa lộ trình
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cung cấp thêm thông tin để AI thiết kế bài học sát với chuyên môn và sở thích của bạn
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Chuyên ngành */}
          <div className="bg-white p-8 rounded-2xl border-2 border-purple-100 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaUserGraduate className="text-[#6C5CE7]" />
              Chuyên ngành của bạn
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {MAJOR_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMajor(m)}
                  className={`px-4 py-3 rounded-xl text-left transition-all duration-300 border-2 ${
                    major === m 
                    ? "border-[#6C5CE7] bg-[#6C5CE7]/5 shadow-md" 
                    : "border-gray-100 hover:border-purple-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${major === m ? "text-[#6C5CE7]" : "text-gray-700"}`}>{m}</span>
                    {major === m && <FaCheck className="text-[#6C5CE7]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sở thích */}
          <div className="bg-white p-8 rounded-2xl border-2 border-purple-100 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaLightbulb className="text-[#00CEC9]" />
              Sở thích / Quan tâm
            </h3>
            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((inter) => {
                const isSelected = selectedInterests.includes(inter);
                return (
                  <button
                    key={inter}
                    onClick={() => toggleInterest(inter)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-300 border-2 ${
                      isSelected
                      ? "border-[#00CEC9] bg-[#00CEC9] text-white shadow-lg"
                      : "border-gray-100 hover:border-[#00CEC9]/50 text-gray-600"
                    }`}
                  >
                    {inter}
                  </button>
                );
              })}
            </div>
            <p className="mt-6 text-sm text-gray-400 italic">
              * Gợi ý: Chọn những thứ bạn hay đọc tin tức hàng ngày
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-8 py-4 rounded-xl font-semibold text-lg text-gray-600 hover:text-gray-800 transition-all"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleNext}
            className="px-12 py-4 rounded-xl font-black text-lg bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
