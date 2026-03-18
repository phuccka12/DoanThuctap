import React, { useMemo, useState } from "react";
import axiosInstance from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaPenFancy, FaTrash, FaCopy, FaBolt, FaCheckCircle, 
  FaExclamationTriangle, FaLightbulb, FaChartPie, FaTrophy, 
  FaStar, FaFire, FaGraduationCap, FaRocket, FaBook, FaMedal, 
  FaHeart, FaCoins, FaChevronRight, FaChevronLeft
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
    try {
      const res = await axiosInstance.post("/ai/writing", {
        text: answer.trim(),
        topic: prompt.trim(),
        task: taskType,
      });
      setResult(res.data);
    } catch (e) {
      setErr("Lỗi kết nối máy chủ AI. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!result?.radar_chart) return null;
    const { GRA, LR, CC, TR } = result.radar_chart;
    return {
      labels: ["Ngữ pháp", "Từ vựng", "Gắn kết", "Trả lời Task"],
      datasets: [{
        data: [GRA, LR, CC, TR].map(v => Math.max(0, Math.min(9, v))),
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
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      taskType === "task1" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >Task 1</button>
                  <button 
                    onClick={() => setTaskType("task2")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      taskType === "task2" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
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

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <FaPenFancy className="text-blue-400" /> Bài viết của bạn
                </div>
                <textarea 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Bắt đầu viết bài essay của bạn tại đây..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200 text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[350px] leading-relaxed custom-scrollbar"
                />
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
                  className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingCat size={40} text={null} />
                      <span>AI đang chấm bài...</span>
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
                        {result.overall_score?.replace("Band ", "") || "0.0"}
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
                              scales: { r: { 
                                min: 0, max: 9, ticks: { display: false },
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                angleLines: { color: 'rgba(255,255,255,0.05)' },
                                pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 9, weight: 'bold' } }
                              }},
                              plugins: { legend: { display: false } }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-scores Cards */}
                {result.detailed_analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { l: "Task Response", c: result.detailed_analysis.task_response, i: FaCheckCircle, cl: "text-emerald-400", bg: "bg-emerald-500" },
                      { l: "Coherence", c: result.detailed_analysis.coherence_cohesion, i: FaRocket, cl: "text-blue-400", bg: "bg-blue-500" },
                      { l: "Lexical Res.", c: result.detailed_analysis.lexical_resource, i: FaBook, cl: "text-purple-400", bg: "bg-purple-500" },
                      { l: "Grammar Acc.", c: result.detailed_analysis.grammar_accuracy, i: FaMedal, cl: "text-indigo-400", bg: "bg-indigo-500" },
                    ].map((s, idx) => (
                      <div key={idx} className="glass-panel p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`text-[10px] font-black uppercase tracking-widest ${s.cl}`}>{s.l}</div>
                          <s.i className={s.cl} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight line-clamp-3">{s.c}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Better Version */}
                {result.better_version && (
                  <div className="glass-card p-8 border-indigo-500/20 bg-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <FaStar className="text-white" />
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight">Mô phỏng Band 9.0</h3>
                      </div>
                      <button 
                        onClick={async () => {
                          await navigator.clipboard.writeText(result.better_version);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          copied ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {copied ? 'Đã copy!' : 'Copy bài mẫu'}
                      </button>
                    </div>
                    <p className="text-slate-300 italic text-sm leading-relaxed p-6 bg-black/20 rounded-2xl border border-white/5 whitespace-pre-line">
                      {result.better_version}
                    </p>
                  </div>
                )}
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

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default AiWriting;
