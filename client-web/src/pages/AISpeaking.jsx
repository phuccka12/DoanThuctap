import React, { useState, useMemo } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { 
  FaMicrophone, FaStop, FaPaperPlane, FaFire, FaTrophy, FaStar, 
  FaChartLine, FaComments, FaBookReader, FaVolumeUp, FaSpellCheck,
  FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaRocket, FaMedal
} from 'react-icons/fa';
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
  const { isDark } = useTheme();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  // Theme colors
  const themeColors = useMemo(() => ({
    light: {
      page: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50',
      card: 'bg-white',
      border: 'border-purple-200',
      text: 'text-slate-800',
      sub: 'text-slate-600',
      input: 'bg-white border-purple-200 text-slate-800',
      hover: 'hover:bg-purple-50',
      soft: 'bg-purple-50',
      accent: 'text-purple-600',
      recording: 'bg-gradient-to-r from-red-500 to-pink-500',
      ready: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
    dark: {
      page: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      card: 'bg-slate-800/50',
      border: 'border-slate-700',
      text: 'text-white',
      sub: 'text-slate-300',
      input: 'bg-slate-700/50 border-slate-600 text-white',
      hover: 'hover:bg-slate-700',
      soft: 'bg-slate-700/30',
      accent: 'text-purple-400',
      recording: 'bg-gradient-to-r from-red-600 to-pink-600',
      ready: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    }
  }), []);

  const theme = isDark ? themeColors.dark : themeColors.light;

  // Cấu hình ghi âm
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ 
    audio: true,
    blobPropertyBag: { type: "audio/wav" },
    onStop: (blobUrl, blob) => {
      console.log("🛑 Đã dừng ghi âm.");
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

      console.log("🚀 Đang gửi file sang Python...");
      
      const res = await axios.post('http://127.0.0.1:5000/api/speaking/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("✅ Dữ liệu Python trả về:", res.data);
      setResult(res.data);

    } catch (error) {
      console.error("❌ Lỗi:", error);
      alert("Lỗi kết nối Server! Xem Console (F12) để biết chi tiết.");
    }
    setLoading(false);
  };

  // Radar chart configuration
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
        backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(139, 92, 246, 0.2)',
        borderColor: isDark ? 'rgba(168, 85, 247, 1)' : 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: isDark ? 'rgba(168, 85, 247, 1)' : 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: isDark ? 'rgba(168, 85, 247, 1)' : 'rgba(139, 92, 246, 1)',
      }]
    };
  }, [result, isDark]);

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 9,
        ticks: {
          stepSize: 1,
          color: isDark ? '#94a3b8' : '#64748b',
        },
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.3)',
        },
        pointLabels: {
          color: isDark ? '#e2e8f0' : '#334155',
          font: {
            size: 12,
            weight: 'bold',
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: true,
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      idle: { icon: FaCheckCircle, text: 'Ready to Record', color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50' },
      recording: { icon: FaMicrophone, text: 'Recording...', color: 'text-red-500', bg: isDark ? 'bg-red-500/20' : 'bg-red-50' },
      stopped: { icon: FaCheckCircle, text: 'Recording Complete', color: 'text-purple-500', bg: isDark ? 'bg-purple-500/20' : 'bg-purple-50' }
    };

    const config = statusConfig[status] || statusConfig.idle;
    const Icon = config.icon;

    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm",
        config.bg,
        config.color
      )}>
        <Icon className={status === 'recording' ? 'animate-pulse' : ''} />
        {config.text}
      </div>
    );
  };

  // Score card component
  const ScoreCard = ({ label, value, icon: Icon, isDark }) => (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-105",
      isDark 
        ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500" 
        : "bg-gradient-to-br from-white to-purple-50 border-purple-200 hover:border-purple-400"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>{label}</span>
        <Icon className={cn("text-xl", isDark ? "text-purple-400" : "text-purple-500")} />
      </div>
      <div className={cn("text-3xl font-bold", isDark ? "text-white" : "text-slate-800")}>
        {value}<span className="text-lg opacity-60">/9.0</span>
      </div>
      <div className={cn(
        "absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500",
        `w-[${(value / 9) * 100}%]`
      )} style={{ width: `${(value / 9) * 100}%` }} />
    </div>
  );

  // Mistake card component
  const MistakeCard = ({ item, isDark }) => (
    <div className={cn(
      "rounded-xl border-l-4 p-4 mb-3 transition-all duration-300 hover:scale-[1.02]",
      isDark 
        ? "bg-slate-800/50 border-red-500 hover:bg-slate-800" 
        : "bg-white border-red-500 hover:shadow-md"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("font-bold text-lg", isDark ? "text-red-400" : "text-red-600")}>
          {item.word}
        </span>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-semibold",
          isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"
        )}>
          Error
        </span>
      </div>
      <div className={cn("text-sm mb-1", isDark ? "text-slate-300" : "text-slate-600")}>
        <FaExclamationTriangle className="inline mr-2 text-orange-500" />
        {item.error}
      </div>
      <div className={cn("text-sm font-semibold", isDark ? "text-emerald-400" : "text-emerald-600")}>
        <FaLightbulb className="inline mr-2" />
        {item.fix}
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen p-6 transition-colors duration-300", theme.page)}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={cn(
          "rounded-3xl border p-8 mb-6 relative overflow-hidden",
          theme.card,
          theme.border
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-full h-2",
            "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"
          )} />
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={cn("text-4xl font-bold mb-2", theme.text)}>
                <FaMicrophone className="inline mr-3 text-purple-500" />
                IELTS Speaking Coach
              </h1>
              <p className={theme.sub}>Master your speaking skills with AI-powered feedback</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-semibold",
                isDark ? "bg-gradient-to-r from-orange-500/20 to-red-500/20" : "bg-gradient-to-r from-orange-100 to-red-100"
              )}>
                <FaFire className="text-orange-500 text-xl" />
                <span className={theme.text}>7 Day Streak</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-semibold",
                isDark ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20" : "bg-gradient-to-r from-yellow-100 to-amber-100"
              )}>
                <FaTrophy className="text-yellow-500 text-xl" />
                <span className={theme.text}>Level 15</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Section */}
        <div className={cn(
          "rounded-3xl border p-8 mb-6",
          theme.card,
          theme.border
        )}>
          <div className="text-center">
            <StatusBadge status={status} />
            
            <div className="my-8">
              <div className={cn(
                "w-40 h-40 mx-auto rounded-full flex items-center justify-center relative",
                status === 'recording' ? theme.recording : theme.ready,
                "shadow-2xl"
              )}>
                {status === 'recording' && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                )}
                <FaMicrophone className="text-white text-6xl relative z-10" />
              </div>
            </div>

            <div className="flex gap-4 justify-center mb-6">
              <button
                onClick={startRecording}
                disabled={status === 'recording'}
                className={cn(
                  "px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300",
                  status === 'recording' 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-105",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <FaMicrophone className="inline mr-2" />
                Start Recording
              </button>
              
              <button
                onClick={stopRecording}
                disabled={status !== 'recording'}
                className={cn(
                  "px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300",
                  status !== 'recording'
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 hover:scale-105",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <FaStop className="inline mr-2" />
                Stop Recording
              </button>
            </div>

            {(status === 'stopped' || mediaBlobUrl) && (
              <div className={cn("rounded-2xl border p-6", theme.soft, theme.border)}>
                <audio 
                  src={mediaBlobUrl} 
                  controls 
                  className="w-full mb-4"
                  style={{ 
                    borderRadius: '12px',
                    filter: isDark ? 'invert(0.9) hue-rotate(180deg)' : 'none'
                  }}
                />
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  className={cn(
                    "px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300",
                    loading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105",
                    "disabled:opacity-50"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="inline mr-2" />
                      Get Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fadeIn">
            {/* Overall Score */}
            <div className={cn(
              "rounded-3xl border p-8 text-center relative overflow-hidden",
              theme.card,
              theme.border
            )}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full translate-y-32 -translate-x-32" />
              
              <div className="relative z-10">
                <FaTrophy className="text-6xl mx-auto mb-4 text-yellow-500" />
                <h2 className={cn("text-5xl font-bold mb-2", theme.text)}>
                  {result.overall_score || "Band 0.0"}
                </h2>
                <p className={cn("text-lg", theme.sub)}>Overall IELTS Speaking Score</p>
              </div>
            </div>

            {/* Transcript */}
            <div className={cn(
              "rounded-3xl border p-8",
              theme.card,
              theme.border
            )}>
              <div className="flex items-center gap-3 mb-4">
                <FaComments className={cn("text-2xl", theme.accent)} />
                <h3 className={cn("text-2xl font-bold", theme.text)}>Your Speech Transcript</h3>
              </div>
              <p className={cn(
                "text-lg italic leading-relaxed p-6 rounded-2xl",
                isDark ? "bg-slate-700/30" : "bg-purple-50"
              )}>
                "{result.transcript_display || result.transcript}"
              </p>
            </div>

            {/* Scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreCard 
                label="Fluency" 
                value={result.radar_chart?.Fluency || 0} 
                icon={FaChartLine}
                isDark={isDark}
              />
              <ScoreCard 
                label="Lexical Resource" 
                value={result.radar_chart?.Lexical || 0} 
                icon={FaBookReader}
                isDark={isDark}
              />
              <ScoreCard 
                label="Grammar" 
                value={result.radar_chart?.Grammar || 0} 
                icon={FaSpellCheck}
                isDark={isDark}
              />
              <ScoreCard 
                label="Pronunciation" 
                value={result.radar_chart?.Pronunciation || 0} 
                icon={FaVolumeUp}
                isDark={isDark}
              />
            </div>

            {/* Radar Chart */}
            {radarData && (
              <div className={cn(
                "rounded-3xl border p-8",
                theme.card,
                theme.border
              )}>
                <h3 className={cn("text-2xl font-bold mb-6 text-center", theme.text)}>
                  <FaStar className="inline mr-2 text-yellow-500" />
                  Performance Overview
                </h3>
                <div className="max-w-md mx-auto">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            )}

            {/* Mistakes Timeline */}
            {result.mistakes_timeline && result.mistakes_timeline.length > 0 ? (
              <div className={cn(
                "rounded-3xl border p-8",
                theme.card,
                theme.border
              )}>
                <div className="flex items-center gap-3 mb-6">
                  <FaExclamationTriangle className="text-2xl text-red-500" />
                  <h3 className={cn("text-2xl font-bold", theme.text)}>Areas for Improvement</h3>
                </div>
                {result.mistakes_timeline.map((item, idx) => (
                  <MistakeCard key={idx} item={item} isDark={isDark} />
                ))}
              </div>
            ) : (
              <div className={cn(
                "rounded-3xl border p-8 text-center",
                isDark ? "bg-gradient-to-br from-emerald-900/20 to-teal-900/20" : "bg-gradient-to-br from-emerald-50 to-teal-50",
                isDark ? "border-emerald-700" : "border-emerald-200"
              )}>
                <FaRocket className="text-6xl mx-auto mb-4 text-emerald-500" />
                <h3 className={cn("text-2xl font-bold mb-2", theme.text)}>Perfect Performance!</h3>
                <p className={theme.sub}>No significant errors detected. Keep up the great work!</p>
              </div>
            )}

            {/* Detailed Feedback */}
            {result.detailed_feedback && (
              <div className={cn(
                "rounded-3xl border p-8",
                theme.card,
                theme.border
              )}>
                <div className="flex items-center gap-3 mb-6">
                  <FaLightbulb className="text-2xl text-yellow-500" />
                  <h3 className={cn("text-2xl font-bold", theme.text)}>Examiner's Comments</h3>
                </div>
                <div className="space-y-4">
                  <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700/30" : "bg-purple-50")}>
                    <p className={cn("font-semibold mb-2", theme.text)}>
                      <FaBookReader className="inline mr-2 text-purple-500" />
                      Vocabulary & Grammar:
                    </p>
                    <p className={theme.sub}>{result.detailed_feedback.vocab_grammar}</p>
                  </div>
                  <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700/30" : "bg-blue-50")}>
                    <p className={cn("font-semibold mb-2", theme.text)}>
                      <FaVolumeUp className="inline mr-2 text-blue-500" />
                      Pronunciation:
                    </p>
                    <p className={theme.sub}>{result.detailed_feedback.pronunciation}</p>
                  </div>
                  <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700/30" : "bg-green-50")}>
                    <p className={cn("font-semibold mb-2", theme.text)}>
                      <FaChartLine className="inline mr-2 text-green-500" />
                      Fluency:
                    </p>
                    <p className={theme.sub}>{result.detailed_feedback.fluency}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Better Version */}
            {result.better_version && (
              <div className={cn(
                "rounded-3xl border p-8",
                isDark ? "bg-gradient-to-br from-purple-900/20 to-pink-900/20" : "bg-gradient-to-br from-purple-50 to-pink-50",
                isDark ? "border-purple-700" : "border-purple-200"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <FaMedal className="text-2xl text-purple-500" />
                  <h3 className={cn("text-2xl font-bold", theme.text)}>Band 9.0 Reference</h3>
                </div>
                <p className={cn(
                  "text-lg italic leading-relaxed p-6 rounded-2xl",
                  isDark ? "bg-slate-800/50" : "bg-white"
                )}>
                  {result.better_version}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISpeaking;