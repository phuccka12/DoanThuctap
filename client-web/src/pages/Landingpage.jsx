import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaCheck,
  FaStar,
  FaMicrophone,
  FaPenFancy,
  FaGamepad,
  FaArrowRight,
  FaGlobe,
  FaEnvelope,
  FaUniversity,
  FaRobot,
  FaRocket,
  FaGraduationCap,
  FaBrain,
} from "react-icons/fa";

import { HiSparkles } from "react-icons/hi2";
import { BsSoundwave } from "react-icons/bs";
import ThemeToggle from "../components/ThemeToggle";
import userBillingService from "../services/userBillingService";

const QUOTA_LABELS = [
  { key: "speaking_checks_per_day", label: "Speaking AI/ngày" },
  { key: "writing_checks_per_day", label: "Writing AI/ngày" },
  { key: "ai_chat_messages_per_day", label: "AI Chat/ngày" },
  { key: "ai_roleplay_sessions_per_day", label: "Roleplay/ngày" },
  { key: "reading_passages_access", label: "Reading" },
];

const formatMoney = (v) =>
  Number(v || 0) === 0
    ? "Miễn phí"
    : `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;

const formatQuotaValue = (key, value) => {
  if (value === -1) return "Không giới hạn";
  if (key === "reading_passages_access") {
    return value === "full" ? "Toàn bộ" : "Hạn chế";
  }
  return String(value ?? "-");
};

const Landingpage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPublicPlans = async () => {
      setPlansLoading(true);
      setPlansError("");
      try {
        const res = await userBillingService.getPublicPlans();
        const apiPlans = Array.isArray(res?.data?.data) ? res.data.data : [];
        const sorted = [...apiPlans].sort((a, b) => {
          const featuredDelta = Number(b?.is_featured) - Number(a?.is_featured);
          if (featuredDelta !== 0) return featuredDelta;
          return Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
        });
        if (mounted) setPlans(sorted);
      } catch (err) {
        if (mounted) {
          setPlans([]);
          setPlansError(
            err?.response?.data?.message ||
              "Không tải được gói học lúc này. Vui lòng thử lại sau.",
          );
        }
      } finally {
        if (mounted) setPlansLoading(false);
      }
    };
    loadPublicPlans();
    return () => {
      mounted = false;
    };
  }, []);

  const planGridClass = useMemo(() => {
    if (plans.length <= 1) return "max-w-md mx-auto grid-cols-1";
    if (plans.length === 2) return "max-w-4xl mx-auto md:grid-cols-2";
    if (plans.length === 3) return "max-w-6xl mx-auto md:grid-cols-3";
    return "max-w-7xl mx-auto md:grid-cols-2 xl:grid-cols-3";
  }, [plans.length]);

  // Generate deterministic random-looking data for visualizations
  const waveHeights1 = useMemo(
    () => [
      40, 70, 30, 80, 50, 90, 20, 60, 45, 75, 35, 85, 55, 95, 25, 65, 40, 70,
      30, 80, 50, 90, 20, 60, 45,
    ],
    [],
  );
  const waveHeights2 = useMemo(
    () => [
      50, 30, 60, 40, 70, 50, 80, 60, 90, 70, 40, 60, 30, 50, 20, 40, 30, 60,
      40, 70, 50, 80, 60, 90, 70,
    ],
    [],
  );
  const waveHeights3 = useMemo(
    () => [
      30, 20, 40, 25, 35, 30, 45, 35, 50, 40, 25, 35, 20, 30, 15, 25, 20, 40,
      25, 45, 35, 50, 40, 55, 45, 25, 35, 20, 30, 15, 25, 20, 40, 25, 45, 35,
      50, 40, 55, 45,
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0118] text-gray-900 dark:text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden transition-colors duration-300">
      {/* ================= HEADER ================= */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 dark:bg-[#0A0118]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5" : "bg-transparent"}`}
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              <FaGraduationCap />
            </div>
            <span className="text-xl font-bold tracking-tight">
              HIDAY ENGLISH
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {[
              { name: "Khóa học", id: "khoa-hoc" },
              { name: "Tính năng", id: "tinh-nang" },
              { name: "Bảng giá", id: "bang-gia" },
            ].map((item) => (
              <a
                key={item.name}
                href={`#${item.id}`}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <div className="scale-75">
              <ThemeToggle />
            </div>
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20 transform hover:-translate-y-0.5"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-pink-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Phiên bản 2.0 đã ra mắt
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Chinh Phục Tiếng Anh Với <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">
                  Trí Tuệ Nhân Tạo
                </span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                Lộ trình cá nhân hóa, sửa lỗi tức thì và hệ thống thú cưng giúp
                bạn duy trì động lực mỗi ngày. Học thông minh hơn, không vất vả
                hơn.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 group"
                >
                  Học Thử Miễn Phí
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-500 hover:text-purple-600 dark:bg-white/5 dark:border-white/10 dark:hover:bg-purple-500/10 dark:hover:border-purple-500 dark:hover:text-purple-300 dark:text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 backdrop-blur-sm shadow-lg dark:shadow-none">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white dark:bg-white dark:text-black flex items-center justify-center text-xs group-hover:bg-purple-400">
                    <FaPlay className="ml-0.5" />
                  </div>
                  Xem Demo
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                    <FaCheck />
                  </div>
                  Không cần thẻ tín dụng
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                    <FaCheck />
                  </div>
                  Hủy bất kỳ lúc nào
                </div>
              </div>
            </div>

            {/* Right Content - Visual Mockup */}
            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-2xl bg-white dark:bg-[#13062D] border border-gray-200 dark:border-white/10 p-6 shadow-2xl dark:shadow-none overflow-hidden group hover:border-purple-500/30 transition-colors">
                {/* Header of Mockup Card */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-lg">
                      A
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        Daily Challenge
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Speaking & Grammar
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold">
                    Active
                  </span>
                </div>

                {/* Waveform Visualization */}
                <div className="h-32 bg-gray-50 dark:bg-[#0A0118] rounded-xl mb-6 flex items-center justify-center relative border border-gray-200 dark:border-white/5">
                  <FaMicrophone className="absolute left-4 text-gray-400 dark:text-gray-500" />
                  <div className="flex items-center justify-center gap-1 h-12">
                    {waveHeights1.map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-purple-500 rounded-full animate-pulse"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Analysis Mockup */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-purple-400">
                    <span>AI Analysis</span>
                    <span>98/100</span>
                  </div>
                  <div className="text-sm text-gray-300 bg-white/5 p-4 rounded-lg border-l-2 border-purple-500 leading-relaxed">
                    "Your pronunciation of{" "}
                    <span className="text-green-400 font-bold border-b border-green-400/30">
                      schedule
                    </span>{" "}
                    was perfect. Try emphasizing the second syllable in{" "}
                    <span className="text-yellow-400 font-bold border-b border-yellow-400/30">
                      development
                    </span>
                    ."
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-[#2A1B45] hover:bg-[#342255] text-purple-300 font-bold rounded-lg transition-colors border border-purple-500/20 text-sm">
                  Bắt đầu bài học tiếp theo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PARTNERS SECTION ================= */}
      <section className="py-10 border-y border-white/5 bg-black/20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">
            Được tin dùng bởi hơn 10,000 học viên
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 text-xl font-bold">
              <FaUniversity /> University
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <FaGlobe /> GlobalSpeak
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <FaGraduationCap /> EdTech
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <FaBrain /> MindSet
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <FaRocket /> FutureLearn
            </div>
          </div>
        </div>
      </section>

      {/* ================= COURSES SECTION ================= */}
      <section id="khoa-hoc" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-bold tracking-wider text-sm uppercase">
              Lộ Trình Học Tập
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              Khóa Học Chuyên Sâu
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Thiết kế lộ trình riêng biệt cho từng mục tiêu, từ mất gốc đến
              chinh phục chứng chỉ quốc tế.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "IELTS Intensive",
                desc: "Chinh phục Band 7.0+ với lộ trình 3 tháng chuyên sâu 4 kỹ năng.",
                icon: <FaGlobe />,
                files: "45 bài học",
                students: "2.5k học viên",
                color: "from-blue-600 to-cyan-500",
              },
              {
                title: "Giao Tiếp Phản Xạ",
                desc: "Tự tin nói chuyện với người nước ngoài chỉ sau 60 ngày thực chiến.",
                icon: <BsSoundwave />,
                files: "30 chủ đề",
                students: "5k học viên",
                color: "from-purple-600 to-pink-500",
              },
              {
                title: "TOEIC Master",
                desc: "Đạt 800+ TOEIC cho người đi làm và sinh viên cần ra trường.",
                icon: <FaCheck />,
                files: "20 đề test",
                students: "3k học viên",
                color: "from-orange-500 to-red-500",
              },
              {
                title: "Tiếng Anh IT",
                desc: "Từ vựng chuyên ngành cho Developer, đọc tài liệu như tiếng mẹ đẻ.",
                icon: <FaRocket />,
                files: "15 module",
                students: "1.2k học viên",
                color: "from-green-500 to-emerald-500",
              },
            ].map((course, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#13062D] border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all hover:-translate-y-1 group shadow-lg dark:shadow-none"
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-linear-to-br ${course.color} flex items-center justify-center text-white text-xl mb-6 shadow-lg`}
                >
                  {course.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                  {course.desc}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-500" /> 4.9/5
                  </div>
                  <div>{course.students}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES OVERVIEW ================= */}
      <section
        id="tinh-nang"
        className="py-24 bg-white/5 border-y border-white/5"
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="md:w-2/3">
              <span className="text-pink-400 font-bold tracking-wider text-sm uppercase">
                Công Nghệ Lõi
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Hệ Sinh Thái AI Toàn Diện
              </h2>
              <p className="text-gray-400 mt-4 max-w-xl">
                Không chỉ là học, đây là trải nghiệm công nghệ giáo dục tiên
                tiến nhất giúp bạn đi đường tắt đến sự thành thạo.
              </p>
            </div>
            <button
              onClick={() => navigate("/register")}
              className="text-white border-b border-purple-500 pb-1 hover:text-purple-400 transition-colors"
            >
              Khám phá tất cả tính năng
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <FaRobot />,
                label: "AI Tutor 1-1",
                desc: "Hỏi đáp 24/7",
              },
              {
                icon: <BsSoundwave />,
                label: "Smart Audio",
                desc: "Luyện nghe thụ động",
              },
              {
                icon: <FaBrain />,
                label: "Flashcards",
                desc: "Ghi nhớ từ vựng lâu",
              },
              {
                icon: <FaGamepad />,
                label: "Gamification",
                desc: "Học mà chơi",
              },
              {
                icon: <FaPenFancy />,
                label: "Sửa lỗi Writing",
                desc: "Chi tiết từng lỗi",
              },
              {
                icon: <FaMicrophone />,
                label: "Nhận diện giọng nói",
                desc: "Chính xác 99%",
              },
              {
                icon: <FaUniversity />,
                label: "Thư viện đề thi",
                desc: "Cập nhật mới nhất",
              },
              {
                icon: <FaRocket />,
                label: "Lộ trình cá nhân",
                desc: "Tối ưu thời gian",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-6 bg-[#0A0118] border border-white/5 rounded-xl hover:bg-white/5 transition-colors flex flex-col items-center text-center gap-3 group"
              >
                <div className="text-3xl text-gray-600 group-hover:text-white transition-colors duration-300">
                  {feat.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-200">{feat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURE 1: WRITING ================= */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Text */}
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">
                <FaPenFancy /> Viết & Ngữ Pháp
              </div>
              <h2 className="text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                Chấm Chữa Bài Viết <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                  Tự Động & Chi Tiết
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Hệ thống AI phân tích ngữ pháp và từ vựng của bạn ngay lập tức.
                Không chỉ chỉ ra lỗi sai, chúng tôi giải thích "tại sao" và đề
                xuất cách diễn đạt tự nhiên hơn như người bản xứ.
              </p>

              <ul className="space-y-4">
                {[
                  "Phát hiện lỗi ngữ pháp phức tạp",
                  "Gợi ý từ vựng nâng cao (C1/C2)",
                  "Chấm điểm IELTS Writing dự đoán",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-500 text-xs">
                      <FaCheck />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Visual */}
            <div className="lg:w-1/2 w-full">
              <div className="relative bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-white/10 p-4 md:p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500 shadow-2xl dark:shadow-none">
                {/* Top Bar */}
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    essay_draft_v2.doc
                  </div>
                </div>

                {/* Document Content */}
                <div className="font-mono text-sm leading-relaxed text-gray-600 dark:text-gray-300 space-y-4 relative">
                  <p>
                    Nowadays, environmental pollution is a{" "}
                    <span className="bg-red-500/20 text-red-600 dark:text-red-400 underline decoration-wavy cursor-pointer">
                      serius
                    </span>{" "}
                    problem facing many countries.{" "}
                    <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500 cursor-pointer">
                      In my opinion
                    </span>
                    , governments should take strong actions to protect nature.
                  </p>

                  {/* AI Suggestion Tooltip Positioned */}
                  <div className="mt-4 md:absolute md:top-12 md:right-0 md:translate-x-4 md:w-64 bg-gray-50 dark:bg-[#2A1B45] border border-purple-500/30 rounded-lg p-3 z-10 shadow-xl">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-purple-600 dark:text-purple-400">
                        <HiSparkles />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 uppercase">
                          AI Suggestion
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Consider using{" "}
                          <span className="text-gray-900 dark:text-white font-semibold">
                            "From my perspective"
                          </span>{" "}
                          instead of "In my opinion" for a more academic tone in
                          IELTS Writing Task 2.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURE 2: SPEAKING ================= */}
      <section className="py-24 relative bg-gray-50 dark:bg-white/5 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            {/* Right Text */}
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">
                <BsSoundwave /> Luyện Nói & Phát Âm
              </div>
              <h2 className="text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                Phương Pháp Shadowing <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
                  Chuẩn Giọng Bản Xứ
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Cải thiện ngữ điệu bằng cách nhại lại giọng người bản xứ. Công
                nghệ nhận diện giọng nói so sánh biểu đồ sóng âm của bạn để chỉ
                ra chính xác chỗ cần nhấn nhá.
              </p>

              <button className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2 hover:gap-4 transition-all group">
                Thử tính năng nói <FaArrowRight />
              </button>
            </div>

            {/* Left Visual */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-white dark:bg-[#0A0118] border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl dark:shadow-none relative overflow-hidden transition-colors">
                {/* Native Speaker Wave */}
                <div className="mb-8">
                  <div className="flex justify-between text-xs text-gray-500 mb-2 font-bold uppercase">
                    <span>Native Speaker</span>
                    <FaMicrophone size={12} />
                  </div>
                  <div className="h-16 flex items-center gap-1 opacity-80">
                    {waveHeights2.map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-full"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* User Wave */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2 font-bold uppercase">
                    <span>Your Recording</span>
                    <span className="text-red-500 dark:text-red-400">
                      Low Intonation
                    </span>
                  </div>
                  <div className="h-16 flex items-center gap-1 opacity-60">
                    {waveHeights3.map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gray-400 dark:bg-gray-600 rounded-full"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Record Button */}
                <div className="flex justify-center mt-8">
                  <button className="w-16 h-16 rounded-full bg-red-500! shadow-lg shadow-red-500/30 flex items-center justify-center text-white! text-2xl hover:scale-110 transition-transform">
                    <FaMicrophone />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURE 3: GAMIFICATION ================= */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Text */}
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase">
                <FaGamepad /> Gamification
              </div>
              <h2 className="text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                Hệ Thống Pet <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-600 to-orange-500 dark:from-pink-400 dark:to-orange-400">
                  Tiến Hóa Cùng Bạn
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Biến việc học thành trò chơi thú vị. Nuôi dưỡng thú cưng ảo của
                bạn lớn lên từng ngày qua mỗi bài học hoàn thành. Động lực học
                tập chưa bao giờ mạnh mẽ đến thế.
              </p>

              <div className="flex gap-4">
                <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm font-bold flex items-center gap-2">
                  <FaStar /> Daily Rewards
                </div>
                <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-600 dark:text-pink-400 text-sm font-bold flex items-center gap-2">
                  <span className="text-lg">❤️</span> Pet Care
                </div>
              </div>
            </div>

            {/* Right Visual - Evolution */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-white dark:bg-[#150a25] rounded-3xl p-8 border border-gray-200 dark:border-white/5 relative overflow-hidden group shadow-2xl dark:shadow-none transition-colors">
                <div className="absolute inset-0 bg-linear-to-br from-pink-500/5 to-purple-500/5 rounded-3xl"></div>

                <div className="flex items-center justify-between relative z-10 px-2 lg:px-4">
                  {/* Level 1 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#201035] flex items-center justify-center text-3xl border border-gray-200 dark:border-white/10 grayscale opacity-50 group-hover:grayscale-0 transition-all duration-500">
                      🥚
                    </div>
                    <div className="text-xs font-bold text-gray-500">
                      LEVEL 1
                    </div>
                  </div>

                  {/* Connector Line */}
                  <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 mx-2 lg:mx-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-linear-to-r from-purple-500 to-pink-500 w-full -translate-x-full group-hover:translate-x-0 transition-transform duration-1000"></div>
                  </div>

                  {/* Current Level */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-600 to-pink-600 p-1 shadow-[0_0_30px_rgba(168,85,247,0.4)] relative scale-110">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#150a25] flex items-center justify-center text-5xl animate-bounce">
                        🐲
                      </div>
                      <div className="absolute -bottom-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-full left-1/2 transform -translate-x-1/2 uppercase tracking-wide">
                        Current
                      </div>
                    </div>
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      LEVEL 25
                    </div>
                  </div>

                  {/* Connector Line */}
                  <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 mx-2 lg:mx-4"></div>

                  {/* Max Level */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#201035] flex items-center justify-center text-3xl border border-gray-200 dark:border-white/10 grayscale opacity-50">
                      🦄
                    </div>
                    <div className="text-xs font-bold text-gray-500">
                      LEVEL 50
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-24 bg-gray-50 dark:bg-[#080214] transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Học Viên Nói Gì Về Chúng Tôi
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Cộng đồng hơn 10,000 người học tiếng Anh thành công
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Minh Anh",
                role: "IELTS 7.5",
                quote:
                  "Tính năng sửa lỗi Writing thực sự cứu cánh cho mình. IELTS Writing của mình tăng từ 5.5 lên 7.0 chỉ sau 3 tháng.",
                color: "bg-pink-500",
              },
              {
                name: "Tuấn Hoàng",
                role: "Học sinh THPT",
                quote:
                  "Con pet của mình siêu dễ thương! Nó giúp mình có động lực vào app học mỗi ngày để cho nó ăn. Rất nghiện!",
                color: "bg-blue-500",
              },
              {
                name: "Lan Chi",
                role: "Nhân viên văn phòng",
                quote:
                  "Shadowing giúp mình tự tin hơn hẳn khi giao tiếp với sếp người nước ngoài. Công nghệ nhận diện giọng nói rất nhạy.",
                color: "bg-green-500",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#13062D] p-8 rounded-2xl border border-gray-200 dark:border-white/5 hover:-translate-y-2 transition-transform duration-300 shadow-lg dark:shadow-none"
              >
                <div className="flex gap-1 text-yellow-500 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <FaStar key={j} />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed h-24">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white font-bold`}
                  >
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRICING SECTION ================= */}
      <section
        id="bang-gia"
        className="py-24 relative border-t border-gray-200 dark:border-white/5"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Bảng Giá Linh Hoạt
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tự động đồng bộ theo các gói admin đang bật trên hệ thống
            </p>

            <div className="mt-7 inline-flex rounded-xl p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              {[
                { id: "monthly", label: "Theo tháng" },
                { id: "yearly", label: "Theo năm" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBillingCycle(opt.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    billingCycle === opt.id
                      ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {plansLoading ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : plansError ? (
            <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400">
              <p className="font-semibold mb-2">Không thể tải gói học</p>
              <p className="text-sm opacity-90">{plansError}</p>
              <button
                onClick={() => navigate("/pricing")}
                className="mt-5 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
              >
                Xem trang bảng giá đầy đủ
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
              <p className="text-gray-700 dark:text-gray-200 font-semibold mb-1">
                Chưa có gói học đang mở bán
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Admin chưa bật gói nào trên hệ thống.
              </p>
            </div>
          ) : (
            <div className={`grid gap-8 ${planGridClass}`}>
              {plans.map((plan, i) => {
                const isPopular =
                  !!plan?.is_featured ||
                  (plans.length > 1 && i === Math.floor(plans.length / 2));
                const monthly = Number(plan?.price_monthly || 0);
                const yearly = Number(plan?.price_yearly || 0);
                const displayPrice =
                  billingCycle === "yearly" && yearly > 0 ? yearly : monthly;
                const savings =
                  monthly > 0 && yearly > 0
                    ? Math.round((1 - yearly / (monthly * 12)) * 100)
                    : 0;

                const accentClass =
                  plan?.color === "gold"
                    ? "from-amber-500 to-yellow-400"
                    : plan?.color === "blue"
                      ? "from-blue-600 to-cyan-500"
                      : plan?.color === "purple"
                        ? "from-purple-600 to-pink-500"
                        : "from-gray-600 to-gray-500";

                const quotaItems = QUOTA_LABELS.filter((q) =>
                  Object.prototype.hasOwnProperty.call(plan?.quota || {}, q.key),
                ).slice(0, 3);

                return (
                  <div
                    key={plan?._id || i}
                    className={`relative bg-white dark:bg-[#13062D] border rounded-2xl p-8 transition-all flex flex-col shadow-lg dark:shadow-none hover:-translate-y-1 ${
                      isPopular
                        ? "border-purple-500/60 ring-1 ring-purple-500/25 md:-translate-y-2"
                        : "border-gray-200 dark:border-white/5 hover:border-purple-500/30"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-purple-600 to-pink-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                        ⭐ Phổ biến nhất
                      </div>
                    )}

                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{plan?.icon || "🎯"}</span>
                        <span className="text-sm font-bold tracking-wider uppercase text-gray-600 dark:text-gray-300">
                          {plan?.name || "Gói học"}
                        </span>
                      </div>
                      {savings > 0 && billingCycle === "yearly" && (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          Tiết kiệm {savings}%
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">
                        {formatMoney(displayPrice)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                        {displayPrice === 0
                          ? ""
                          : billingCycle === "yearly"
                            ? "/năm"
                            : "/tháng"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 min-h-10">
                      {plan?.description || "Gói học được cấu hình bởi quản trị viên"}
                    </p>

                    {quotaItems.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {quotaItems.map((q) => (
                          <span
                            key={q.key}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
                          >
                            {q.label}: {formatQuotaValue(q.key, plan?.quota?.[q.key])}
                          </span>
                        ))}
                      </div>
                    )}

                    <ul className="space-y-3 mb-7 flex-1">
                      {(Array.isArray(plan?.features) ? plan.features : [])
                        .slice(0, 5)
                        .map((feature, idx) => (
                          <li
                            key={`${plan?._id || i}-feature-${idx}`}
                            className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200"
                          >
                            <FaCheck className="text-purple-500 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>

                    <button
                      onClick={() => navigate("/pricing")}
                      className={`w-full py-3 bg-linear-to-r ${accentClass} text-white font-bold rounded-lg transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2`}
                    >
                      Xem chi tiết & đăng ký <FaArrowRight />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-purple-900/10 dark:to-purple-900/20 pointer-events-none"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Sẵn sàng bứt phá tiếng Anh?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Tham gia cùng hàng ngàn người học khác ngay hôm nay. Bắt đầu hành
            trình chinh phục ngôn ngữ với sự hỗ trợ của AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/40 transition-all text-lg"
            >
              Đăng Ký Ngay
            </button>
            <button className="px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 dark:bg-white/5 dark:border-white/10 dark:hover:bg-purple-500/10 dark:hover:border-purple-500 dark:hover:text-purple-300 dark:text-white font-bold rounded-lg transition-all text-lg backdrop-blur-sm shadow-sm dark:shadow-none">
              Liên Hệ Tư Vấn
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-50 dark:bg-[#05010a] pt-20 pb-10 border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  <FaGraduationCap />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  English AI
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-500 text-sm leading-relaxed">
                Nền tảng học tiếng Anh thông minh số 1 Việt Nam. Ứng dụng công
                nghệ AI tiên tiến giúp người Việt tự tin giao tiếp toàn cầu.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">
                Sản Phẩm
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-500">
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Khóa học
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Tính năng
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Bảng giá
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Doanh nghiệp
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">
                Tài Nguyên
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-500">
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Cộng đồng
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Tài liệu miễn phí
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">
                Hỗ Trợ
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-500">
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Điều khoản
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Chính sách bảo mật
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-600">
              © 2026 English AI. All rights reserved.
            </div>
            <div className="flex gap-4 text-gray-500">
              <FaGlobe className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition-colors" />
              <FaEnvelope className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landingpage;
