import React, { useMemo, useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import axiosInstance from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaPenFancy, FaTrash, FaCopy, FaBolt, FaCheckCircle,
  FaExclamationTriangle, FaLightbulb, FaChartPie, FaTrophy,
  FaStar, FaFire, FaGraduationCap, FaRocket, FaBook, FaMedal,
  FaHeart, FaCoins, FaChevronRight, FaChevronLeft, FaTimes
} from "react-icons/fa";
import LoadingCat from '../components/shared/LoadingCat';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const AiWriting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taskType, setTaskType] = useState("task2");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showModel, setShowModel] = useState(false);

  const stats = user?.gamification_data || { streak: 0, level: 1, coins: 0 };
  const minWords = taskType === "task1" ? 150 : 250;

  const words = useMemo(() => {
    const text = answer.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [answer]);

  const wordPct = Math.max(0, Math.min(100, Math.round((words / minWords) * 100)));

  const handleCheck = async () => {
    if (!prompt.trim() || !answer.trim()) {
      setErr("Vui lòng nhập chủ đề và nội dung bài viết.");
      return;
    }
    setLoading(true);
    setErr("");
    setResult(null);
    setProgress(0);

    try {
      // 1. Start Evaluation
      const res = await axiosInstance.post("/ai/writing/evaluate", {
        text: answer.trim(),
        topic: prompt.trim(),
        task: taskType,
      });

      const tid = res.data.task_id;
      setTaskId(tid);

      // 2. Start Polling
      const poll = setInterval(async () => {
        try {
          const statusRes = await axiosInstance.get(`/ai/writing/status/${tid}`);
          const task = statusRes.data;

          setProgress(task.progress || 0);

          if (task.status === "completed") {
            setResult(task.result);
            setLoading(false);
            clearInterval(poll);
          } else if (task.status === "failed") {
            setErr("Lỗi xử lý bài viết: " + task.error);
            setLoading(false);
            clearInterval(poll);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);

    } catch (e) {
      setErr("Lỗi kết nối máy chủ AI. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  const handleGenerateModel = async () => {
    if (!result || isGeneratingModel) return;
    setIsGeneratingModel(true);
    let fullText = "";
    try {
      const response = await fetch(`${axiosInstance.defaults.baseURL}/ai/writing/model-essay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic: prompt, essay: answer })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        setResult(prev => ({
          ...prev,
          ai_eyes: { ...prev.ai_eyes, model_essay: fullText }
        }));
      }
    } catch (e) {
      console.error("Stream error", e);
    } finally {
      setIsGeneratingModel(false);
    }
  };
  const HighlightTooltip = ({ h, text, colorClass }) => {
    const [hover, setHover] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const spanRef = useRef(null);

    useEffect(() => {
      if (hover && spanRef.current) {
        const rect = spanRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [hover]);

    return (
      <>
        <span
          ref={spanRef}
          className={`px-1 rounded-sm border-b-2 cursor-help transition-all hover:bg-opacity-40 ${colorClass}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {text}
        </span>

        {hover && ReactDOM.createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: coords.top < 300 ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed', // Sử dụng fixed để chuẩn xác tuyệt đối trên màn hình
              top: coords.top < 300 ? (coords.top - window.scrollY + 30) : (coords.top - window.scrollY - 15),
              left: coords.left - window.scrollX + (coords.width / 2),
              transform: coords.top < 300 ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
              zIndex: 9999,
            }}
            className="w-80 pointer-events-none"
          >
            <div className="bg-[#1A1D26] border border-white/20 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                <div className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  {h.category === 'grammar' ? 'Lỗi ngữ pháp' : h.category === 'vocab' ? 'Gợi ý từ vựng' : 'Lỗi logic'}
                </span>
              </div>

              <p className="text-[13px] text-white/95 font-medium leading-[1.6] mb-4">
                {h.explanation}
              </p>

              {h.suggestion && (
                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FaCheckCircle className="text-emerald-400 text-[10px]" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Đề xuất sửa lỗi:</span>
                  </div>
                  <span className="text-[13px] text-emerald-200 font-bold leading-relaxed">{h.suggestion}</span>
                </div>
              )}

              {/* Mũi tên - Tự động đổi hướng dựa trên vị trí */}
              <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1D26] rotate-45 border-white/20 ${coords.top < 300 ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-r border-b"
                }`} />
            </div>
          </motion.div>,
          document.body
        )}
      </>
    );
  };

  const highlightedContent = useMemo(() => {
    if (!result?.highlights || !answer) return answer;

    const sorted = [...result.highlights].sort((a, b) => a.start - b.start);
    let lastIndex = 0;
    const parts = [];

    sorted.forEach((h, i) => {
      if (h.start > lastIndex) {
        parts.push(answer.substring(lastIndex, h.start));
      }

      const colorClass = h.category === 'grammar' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' :
        h.category === 'vocab' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
          'bg-blue-500/20 border-blue-500/50 text-blue-300';

      parts.push(
        <HighlightTooltip
          key={i}
          h={h}
          text={answer.substring(h.start, h.end)}
          colorClass={colorClass}
        />
      );
      lastIndex = h.end;
    });

    if (lastIndex < answer.length) {
      parts.push(answer.substring(lastIndex));
    }

    return parts;
  }, [result, answer]);

  const chartData = useMemo(() => {
    if (!result?.scoring?.sub_scores) return null;
    const { GRA, LR, CC, TA } = result.scoring.sub_scores;
    return {
      labels: ["Ngữ pháp", "Từ vựng", "Gắn kết", "Trả lời Task"],
      datasets: [{
        data: [GRA, LR, CC, TA].map(v => Math.max(0, Math.min(9, v))),
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        borderColor: "#6366f1",
        borderWidth: 2,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
      }],
    };
  }, [result]);

  return (
    <div className="min-h-screen bg-[#0F1117] relative flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-5%] left-[20%] w-[45%] h-[45%] bg-blue-600/5 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] animate-float" />

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col z-10">
        {/* Unified Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
              title="Quay lại Dashboard"
            >
              <FaChevronLeft />
            </button>
            <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FaPenFancy className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Mentor Writing AI</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Premium IELTS Essay Analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 whitespace-nowrap">
              <FaFire className="text-orange-500" />
              <span className="text-white font-black text-sm">{stats.streak} Ngày</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 whitespace-nowrap">
              <FaTrophy className="text-yellow-500" />
              <span className="text-white font-black text-sm">Level {stats.level}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 whitespace-nowrap">
              <FaCoins className="text-amber-400" />
              <span className="text-white font-black text-sm">{stats.coins} Xu</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left: Input Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card p-8 space-y-8 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
                  <button
                    onClick={() => setTaskType("task1")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${taskType === "task1" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      }`}
                  >Task 1</button>
                  <button
                    onClick={() => setTaskType("task2")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${taskType === "task2" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      }`}
                  >Task 2</button>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`text-xs font-black uppercase tracking-widest ${words >= minWords ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {words} / {minWords} Words
                  </div>
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${wordPct}%` }}
                      className={`h-full ${words >= minWords ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <FaLightbulb className="text-amber-500" /> Chủ đề (Topic)
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Nhập yêu cầu đề bài hoặc dán câu hỏi IELTS vào đây..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200 text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[100px]"
                />
              </div>

              {/* Toolbar & Legend */}
              {result && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ngữ pháp</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Từ vựng</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Logic</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowHighlights(!showHighlights)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHighlights ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400 hover:text-white'
                      }`}
                  >
                    {showHighlights ? 'Ẩn lỗi' : 'Xem lỗi'}
                  </button>
                </div>
              )}

              <div className="relative group min-h-[350px]">
                {result && showHighlights ? (
                  <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200 text-sm min-h-[350px] leading-relaxed whitespace-pre-line relative overflow-y-auto max-h-[500px] custom-scrollbar">
                    {highlightedContent}
                  </div>
                ) : (
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Bắt đầu viết bài essay của bạn tại đây..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200 text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[350px] leading-relaxed custom-scrollbar"
                  />
                )}
              </div>

              <AnimatePresence>
                {err && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-bold">
                      <FaExclamationTriangle /> {err}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4">
                <button
                  onClick={() => { setPrompt(""); setAnswer(""); setResult(null); }}
                  className="p-4 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors"
                >
                  <FaTrash />
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheck}
                  disabled={loading}
                  className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  {loading && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="absolute inset-0 bg-white/10"
                    />
                  )}
                  {loading ? (
                    <div className="flex items-center gap-2 z-10">
                      <span>Đang xử lý: {progress}%</span>
                    </div>
                  ) : (
                    <>
                      <FaBolt />
                      <span>Chấm điểm bài viết</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="glass-panel p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <FaGraduationCap className="text-blue-400 text-xl" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Mẹo viết tốt</p>
                <p className="text-slate-400 text-[10px] leading-relaxed font-bold uppercase tracking-tight">
                  TẬP TRUNG VÀO TÍNH MẠCH LẠC (CC) VÀ SỬ DỤNG TỪ VỰNG HỢP NGỮ CẢNH (LR) ĐỂ ĐẠT BAND CAO NHẤT.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Analysis & Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            {loading ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px]">
                <LoadingCat size={250} text="AI đang phân tích bài viết của bạn..." />
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Result Card */}
                <div className="glass-card p-8 bg-linear-to-br from-blue-600/10 via-indigo-600/5 to-transparent relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="text-center md:text-left flex flex-col items-center md:items-start shrink-0">
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FaTrophy /> Điểm số tổng quát
                      </div>
                      <div className="text-8xl font-black text-white leading-none tracking-tighter">
                        {result.scoring?.overall_band || "0.0"}
                      </div>
                      <div className="mt-4 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        IELTS Band Score
                      </div>
                    </div>

                    <div className="flex-1 w-full flex justify-center">
                      <div className="w-full max-w-[300px]">
                        {chartData && (
                          <Radar
                            data={chartData}
                            options={{
                              scales: {
                                r: {
                                  min: 0, max: 9, ticks: { display: false },
                                  grid: { color: 'rgba(255,255,255,0.05)' },
                                  angleLines: { color: 'rgba(255,255,255,0.05)' },
                                  pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 9, weight: 'bold' } }
                                }
                              },
                              plugins: { legend: { display: false } }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed AI Feedback - Main Section */}
                {result.ai_eyes?.detailed_feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 border-l-4 border-blue-500 bg-linear-to-r from-blue-500/5 to-transparent relative"
                  >
                    <div className="absolute top-4 right-8 text-6xl text-blue-500/10 font-serif">“</div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <FaLightbulb className="text-blue-400" />
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight uppercase">Nhận xét từ Giám khảo AI</h3>
                    </div>
                    <p className="text-slate-300 text-[14px] leading-relaxed whitespace-pre-line font-medium italic opacity-90 relative z-10">
                      {result.ai_eyes.detailed_feedback}
                    </p>
                  </motion.div>
                )}

                {/* Sub-scores Detailed Breakdown */}
                {result.ai_eyes && (
                  <div className="space-y-4">
                    {[
                      {
                        l: "Task Response",
                        v: result.scoring?.sub_scores?.TA || 5.0,
                        c: result.ai_eyes.task_response.critique,
                        details: `Các yêu cầu đã phát hiện: ${result.ai_eyes.task_response.constraints?.join(", ") || "N/A"}`,
                        i: FaCheckCircle, cl: "text-emerald-400", bg: "bg-emerald-500/10"
                      },
                      {
                        l: "Coherence & Cohesion",
                        v: result.scoring?.sub_scores?.CC || 5.0,
                        c: `Chỉ số gắn kết: ${result.cohesion?.cohesion_index || 0.5}. Tìm thấy ${result.discourse_markers?.length || 0} từ nối.`,
                        details: `Tỷ lệ mâu thuẫn logic: ${result.cohesion?.conflict_rate || 0}%.`,
                        i: FaRocket, cl: "text-blue-400", bg: "bg-blue-500/10"
                      },
                      {
                        l: "Lexical Resource",
                        v: result.scoring?.sub_scores?.LR || 5.0,
                        c: `Độ đa dạng từ vựng (MTLD): ${result.stats?.mtld_diversity || 0}.`,
                        details: `Phát hiện ${Object.keys(result.ai_eyes.vocabulary_upgrades || {}).length} gợi ý nâng cấp từ vựng học thuật.`,
                        i: FaBook, cl: "text-purple-400", bg: "bg-purple-500/10"
                      },
                      {
                        l: "Grammar & Accuracy",
                        v: result.scoring?.sub_scores?.GRA || 5.0,
                        c: `Tỷ lệ câu phức: ${Math.round((result.stats?.complex_sentence_ratio || 0) * 100)}%. MLT Index: ${result.stats?.mlt_index || 0}.`,
                        details: `Phát hiện cấu trúc hiếm: ${Object.entries(result.stats?.structures || {}).filter(([k, v]) => k !== 'COMPLEX_STRUCTURE' && v > 0).map(([k, v]) => k).join(", ") || "Không có"}`,
                        i: FaMedal, cl: "text-indigo-400", bg: "bg-indigo-500/10"
                      },
                    ].map((s, idx) => (
                      <div key={idx} className={`glass-panel p-6 border-l-2 ${s.bg} border-opacity-50 space-y-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <s.i className={s.cl} />
                            <div className={`text-sm font-black uppercase tracking-widest ${s.cl}`}>{s.l}</div>
                          </div>
                          <div className="text-xl font-black text-white bg-white/5 px-3 py-1 rounded-lg">Band {s.v}</div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[13px] text-slate-200 leading-relaxed font-medium">{s.c}</p>
                          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.details}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Model Essay Access Button */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 border-amber-500/20 bg-linear-to-br from-amber-500/10 to-transparent flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <FaStar className="text-amber-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Cần một bản mẫu Band 9.0?</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Nghiên cứu cách Phúc AI viết lại bài của bạn</p>
                      </div>
                    </div>

                    {!result.ai_eyes?.model_essay ? (
                      <button
                        onClick={handleGenerateModel}
                        disabled={isGeneratingModel}
                        className="px-8 py-3 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-3"
                      >
                        <FaBolt /> {isGeneratingModel ? "Đang xử lý..." : "Sinh bài mẫu"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowModel(true)}
                        className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                      >
                        <FaBook /> Xem bài mẫu Band 9.0
                      </button>
                    )}
                  </motion.div>
                )}

                {/* --- MODAL POPUP: MODEL ESSAY --- */}
                <AnimatePresence>
                  {showModel && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModel(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] glass-card overflow-hidden flex flex-col border-white/20 shadow-2xl"
                      >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                              <FaStar />
                            </div>
                            <div>
                              <h2 className="text-xl font-black text-white tracking-tight">IELTS Model Essay (Band 9.0)</h2>
                              <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Nội dung được tối ưu bởi Phúc AI</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowModel(false)}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all underline decoration-white/0"
                          >
                            <FaTimes />
                          </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                          <div className="bg-black/40 rounded-3xl border border-white/10 p-8 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none rotate-12">
                              <FaPenFancy className="text-9xl text-white" />
                            </div>
                            <p className="text-slate-200 text-base leading-loose font-medium whitespace-pre-line italic">
                              {result.ai_eyes?.model_essay}
                            </p>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-end gap-3">
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(result.ai_eyes.model_essay);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${copied ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                              }`}
                          >
                            {copied ? 'Đã sao chép!' : 'Copy bài mẫu'}
                          </button>
                          <button
                            onClick={() => setShowModel(false)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all font-bold"
                          > Đóng
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="glass-card p-10 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <FaPenFancy className="text-4xl text-blue-500/30" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-tight">Chưa có kết quả</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest px-8">Hãy hoàn thành bài viết của bạn rồi nhấn nút "Chấm điểm" ở bên trái.</p>
                  </div>
                </div>

                <div className="glass-panel p-8 space-y-6">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gợi ý chủ đề nhanh</div>
                  <div className="space-y-3">
                    {[
                      "Discuss the impact of social media on modern communication.",
                      "Is technology making us more alone?",
                      "Should university education be free for everyone?"
                    ].map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(t)}
                        className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-slate-400 hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center justify-between group"
                      >
                        {t}
                        <FaChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default AiWriting;
