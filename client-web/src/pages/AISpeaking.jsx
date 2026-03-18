import React, { useState, useMemo } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axiosInstance from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import {
  FaMicrophone, FaStop, FaPaperPlane, FaFire, FaTrophy, FaStar,
  FaChartLine, FaComments, FaBookReader, FaVolumeUp, FaSpellCheck,
  FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaRocket, FaMedal,
  FaCoins, FaChevronLeft
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const AISpeaking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  const stats = user?.gamification_data || { streak: 0, level: 1, coins: 0 };

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    blobPropertyBag: { type: "audio/wav" },
    onStop: (blobUrl, blob) => {
      const file = new File([blob], "recording.wav", { type: "audio/wav" });
      setAudioFile(file);
    }
  });

  const handleCheck = async () => {
    if (!audioFile && !mediaBlobUrl) {
      alert("Chưa có file ghi âm! Hãy nói lại.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let fileToSend = audioFile;
      if (!fileToSend && mediaBlobUrl) {
        const response = await fetch(mediaBlobUrl);
        const blob = await response.blob();
        fileToSend = new File([blob], "recording.wav", { type: "audio/wav" });
      }

      const formData = new FormData();
      formData.append("audio", fileToSend);

      const res = await axiosInstance.post('/ai/speaking', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(res.data);
    } catch (error) {
      console.error("❌ Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const radarData = useMemo(() => {
    if (!result?.radar_chart) return null;
    return {
      labels: ['Fluency', 'Lexical', 'Grammar', 'Pronunciation'],
      datasets: [{
        label: 'Your Score',
        data: [
          result.radar_chart.Fluency || 0,
          result.radar_chart.Lexical || 0,
          result.radar_chart.Grammar || 0,
          result.radar_chart.Pronunciation || 0
        ],
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
      }]
    };
  }, [result]);

  return (
    <div className="min-h-screen bg-[#0F1117] relative flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[100px] animate-float-delayed" />

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col z-10">
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
            <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FaMicrophone className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Coach Phát âm AI</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Master your IELTS Speaking</p>
            </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
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

        {/* Main Recording Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 mb-8 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500 via-pink-500 to-rose-500" />
          
          <div className="mb-8">
            <div className={cn(
              "w-44 h-44 rounded-full flex items-center justify-center relative transition-all duration-500 shadow-2xl",
              status === 'recording' ? "bg-linear-to-br from-rose-500 to-pink-600 scale-110" : "bg-white/5 border border-white/10"
            )}>
              {status === 'recording' && (
                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
              )}
              <FaMicrophone className={cn("text-6xl transition-colors", status === 'recording' ? "text-white" : "text-purple-500/50")} />
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <h2 className="text-xl font-black text-white">Sẵn sàng phân tích giọng nói?</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Hãy nói một đoạn ngắn để AI đánh giá các tiêu chí IELTS: Phát âm, Từ vựng, Ngữ pháp và Độ trôi chảy.</p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center w-full max-w-md">
            {status !== 'recording' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="flex-1 min-w-[200px] py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3"
              >
                <FaMicrophone /> Bắt đầu ghi âm
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="flex-1 min-w-[200px] py-4 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 animate-pulse flex items-center justify-center gap-3"
              >
                <FaStop /> Dừng ghi âm
              </motion.button>
            )}
          </div>

          {/* Feedback Button (Post-Recording) */}
          <AnimatePresence>
            {(status === 'stopped' || mediaBlobUrl) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-8 w-full max-w-lg space-y-4"
              >
                <div className="glass-panel p-4 flex flex-col items-center">
                  <audio src={mediaBlobUrl} controls className="w-full h-10 mb-4 brightness-90 contrast-125 invert opacity-70" />
                  {loading ? (
                    <div className="py-2">
                       <LoadingCat size={150} text="Chờ một chút để AI phân tích..." />
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheck}
                      disabled={loading}
                      className="w-full py-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                    >
                      <FaPaperPlane />
                      Nhận xét ngay
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Overall Band */}
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                  <FaTrophy className="text-5xl text-yellow-500 mb-4" />
                  <h3 className="text-6xl font-black text-white mb-2 tracking-tighter">{result.overall_score || "0.0"}</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Overall Band Score</p>
                </div>

                {/* Radar Chart */}
                <div className="glass-card p-6 flex flex-col items-center justify-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FaChartLine className="text-purple-500" /> Biểu đồ kỹ năng
                  </h4>
                  <div className="w-full max-w-[280px]">
                    {radarData && <Radar 
                      data={radarData} 
                      options={{
                        scales: { r: { 
                          min: 0, max: 9, 
                          ticks: { display: false },
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          angleLines: { color: 'rgba(255,255,255,0.05)' },
                          pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 10, weight: 'bold' } }
                        }},
                        plugins: { legend: { display: false } }
                      }} 
                    />}
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="glass-card p-8 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <FaComments className="text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight">Văn bản ghi âm</h3>
                </div>
                <div className="relative">
                  <p className="text-slate-300 italic text-lg leading-relaxed bg-white/5 p-8 rounded-3xl border border-white/5">
                    "{result.transcript_display || result.transcript}"
                  </p>
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FaVolumeUp className="text-white" />
                  </div>
                </div>
              </div>

              {/* Mistakes Section */}
              {result.mistakes_timeline?.length > 0 && (
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                      <FaExclamationTriangle className="text-rose-400" />
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">Các điểm cần cải thiện</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.mistakes_timeline.map((item, idx) => (
                      <div key={idx} className="glass-panel p-5 border-l-4 border-l-rose-500/50 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-rose-400 font-black text-lg">{item.word}</span>
                          <span className="text-[10px] font-black bg-rose-500/10 text-rose-300 px-3 py-1 rounded-full uppercase tracking-widest">Error</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-3 font-medium leading-relaxed">{item.error}</p>
                        <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                          <FaLightbulb className="text-emerald-500 mt-1 shrink-0" />
                          <p className="text-emerald-400 text-xs font-bold leading-relaxed">{item.fix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Band 9.0 Content */}
              {result.better_version && (
                <div className="glass-card p-8 bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-linear-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <FaMedal className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">Phiên bản Band 9.0 mẫu</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Học hỏi cách diễn đạt thượng đẳng</p>
                    </div>
                  </div>
                  <p className="text-slate-200 italic leading-relaxed bg-white/5 p-8 rounded-3xl border border-white/5 shadow-inner">
                    {result.better_version}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AISpeaking;