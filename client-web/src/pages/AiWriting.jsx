import React, { useMemo, useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import {
  FaPenFancy,
  FaTrash,
  FaCopy,
  FaBolt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaChartPie,
  FaTrophy,
  FaStar,
  FaFire,
  FaGraduationCap,
  FaRocket,
  FaBook,
  FaMedal,
  FaHeart,
} from "react-icons/fa";

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

const cn = (...c) => c.filter(Boolean).join(" ");
const clamp10 = (n) => Math.max(0, Math.min(10, Number(n || 0)));

const themeLight = {
  page: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
  card: "bg-white",
  border: "border-indigo-100",
  text: "text-slate-800",
  sub: "text-slate-500",
  input: "bg-white border-indigo-200 text-slate-800 placeholder-slate-400",
  hover: "hover:bg-indigo-50",
  soft: "bg-indigo-100/30",
  accent: "from-indigo-500 to-purple-500",
};

const themeDark = {
  page: "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950",
  card: "bg-slate-900",
  border: "border-slate-800",
  text: "text-white",
  sub: "text-slate-400",
  input: "bg-slate-800 border-slate-700 text-white placeholder-slate-500",
  hover: "hover:bg-slate-800",
  soft: "bg-white/5",
  accent: "from-indigo-500 to-purple-500",
};

function StatPill({ label, value, tone = "default" }) {
  const toneCls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
      : tone === "warn"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
      : "bg-indigo-500/10 text-indigo-500 border-indigo-500/30";

  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all hover:scale-105", toneCls)}>
      <span className="opacity-80">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function Badge({ icon: Icon, text, color = "indigo" }) {
  const colorCls = {
    indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/30",
  }[color];

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold", colorCls)}>
      <Icon className="text-sm" />
      <span>{text}</span>
    </div>
  );
}

function Alert({ children, type = "error" }) {
  const cls =
    type === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-100";
  const Icon = type === "error" ? FaExclamationTriangle : FaLightbulb;

  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border p-4 text-sm", cls)}>
      <Icon className="mt-0.5 shrink-0 opacity-90" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg">
          {icon}
        </div>
        <div>
          <div className="text-lg font-black">{title}</div>
          {sub ? <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ progress, size = 120 }) {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          {progress}%
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</div>
      </div>
    </div>
  );
}

function AnalysisCard({ title, content, colorClass, icon: Icon, isDark }) {
  return (
    <div className={cn(
      "rounded-3xl border p-6 shadow-md transition-all hover:shadow-xl hover:scale-[1.02]",
      isDark ? "border-slate-800 bg-slate-900" : "border-indigo-100 bg-white"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("text-xs font-black uppercase tracking-widest", colorClass)}>{title}</div>
        {Icon && <Icon className={cn("text-2xl", colorClass)} />}
      </div>
      <p className={cn("text-sm leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>{content}</p>
    </div>
  );
}

function TipCard({ icon: Icon, title, description, isDark }) {
  return (
    <div className={cn(
      "flex gap-4 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02]",
      isDark 
        ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700" 
        : "bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200"
    )}>
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
        <Icon className="text-xl" />
      </div>
      <div>
        <div className={cn("font-bold text-sm mb-1", isDark ? "text-white" : "text-slate-800")}>{title}</div>
        <div className={cn("text-xs leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>{description}</div>
      </div>
    </div>
  );
}

export default function AIWriting() {
  const { isDark } = useTheme();
  const t = isDark ? themeDark : themeLight;

  const [taskType, setTaskType] = useState("task2"); // task1 | task2
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const minWords = taskType === "task1" ? 150 : 250;

  const words = useMemo(() => {
    const text = answer.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [answer]);

  const wordPct = useMemo(() => {
    if (!minWords) return 0;
    return Math.max(0, Math.min(100, Math.round((words / minWords) * 100)));
  }, [words, minWords]);

  const handleCheck = async () => {
    setErr("");
    setResult(null);

    if (!prompt.trim()) return setErr("Please enter your topic/question.");
    if (!answer.trim()) return setErr("Please enter your essay.");

    setLoading(true);
    try {
      const payload = {
        text: answer.trim(),
        topic: prompt.trim(),
        task: taskType,
      };

      const res = await axios.post("http://127.0.0.1:5000/api/writing/check", payload);
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setErr("Cannot connect to Python server (Check Port 5000).");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setAnswer("");
    setResult(null);
    setErr("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!result?.better_version) return;
    try {
      await navigator.clipboard.writeText(result.better_version);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Cannot copy. Browser is blocking clipboard access.");
    }
  };

  const chartData = useMemo(() => {
    if (!result?.radar_chart) return null;
    const { GRA, LR, CC, TR } = result.radar_chart;

    const border = "#6C5CE7";
    const fill = "rgba(0, 206, 201, 0.18)";

    return {
      labels: ["Grammar (GRA)", "Lexical (LR)", "Coherence (CC)", "Task Response (TR)"],
      datasets: [
        {
          label: "Band Score",
          data: [clamp10(GRA), clamp10(LR), clamp10(CC), clamp10(TR)],
          backgroundColor: fill,
          borderColor: border,
          pointBackgroundColor: "#00CEC9",
          pointBorderColor: "#fff",
          borderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  }, [result]);

  const chartOptions = useMemo(() => {
    const grid = isDark ? "rgba(255,255,255,0.10)" : "rgba(124,58,237,0.12)";
    const ticks = isDark ? "rgba(255,255,255,0.75)" : "rgba(30,41,59,0.75)";
    const labels = isDark ? "rgba(255,255,255,0.85)" : "rgba(30,41,59,0.9)";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 9,
          ticks: { stepSize: 1, backdropColor: "transparent", color: ticks },
          grid: { color: grid },
          angleLines: { color: grid },
          pointLabels: { color: labels, font: { size: 11, weight: "700" } },
        },
      },
    };
  }, [isDark]);

  const overallBand = useMemo(() => {
    const raw = result?.overall_score || "";
    return raw.replace("Band ", "") || "?";
  }, [result]);

  const wordTone = words >= minWords ? "good" : words >= minWords * 0.75 ? "warn" : "default";

  return (
    <div className={cn("min-h-screen", t.page)}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* TOP BAR - Duolingo/Grammarly Style Header */}
        <div className={cn("rounded-3xl border p-5 md:p-6 shadow-xl relative overflow-hidden", t.card, t.border)}>
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="text-sm font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
                  ✨ AI Coach
                </div>
                {/* Streak indicator - Duolingo style */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 shadow-sm">
                  <FaFire className="text-orange-500 animate-bounce" />
                  <span className="text-xs font-black text-orange-500">5 Day Streak</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
                  <FaStar className="text-emerald-500" />
                  <span className="text-xs font-black text-emerald-500">Level 12</span>
                </div>
              </div>
              
              <div className={cn("text-3xl md:text-4xl font-black", t.text)}>
                AI IELTS Writing Mentor <span className="inline-block animate-pulse">✨</span>
              </div>
              <div className={cn("mt-2 text-sm md:text-base", t.sub)}>
                Master your writing skills with AI-powered feedback - Just like Grammarly, but smarter! 🚀
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              
              {/* Achievement badges */}
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer" title="Writing Master">
                  <FaTrophy className="text-white text-lg" />
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer" title="Grammar Hero">
                  <FaMedal className="text-white text-lg" />
                </div>
              </div>
              
              <div className={cn(
                "hidden lg:flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-sm",
                isDark 
                  ? "bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700"
                  : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
              )}>
                <FaChartPie className={cn("text-base", isDark ? "text-indigo-400" : "text-indigo-600")} />
                <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-700")}>Strict Mode</span>
              </div>
              
              <button
                onClick={handleReset}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold shadow-sm transition hover:scale-105 active:scale-95",
                  t.border,
                  t.card,
                  isDark ? "text-gray-200 hover:bg-slate-800" : "text-slate-700 hover:bg-purple-50"
                )}
              >
                <FaTrash />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Learning Tips Section - Duolingo Style */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <TipCard 
            icon={FaLightbulb}
            title="💡 Pro Tip"
            description="Use topic-specific vocabulary to boost your Lexical Resource score instantly"
            isDark={isDark}
          />
          <TipCard 
            icon={FaRocket}
            title="🎯 Quick Win"
            description="Start each body paragraph with a clear topic sentence for better CC score"
            isDark={isDark}
          />
          <TipCard 
            icon={FaGraduationCap}
            title="📚 Study Hack"
            description="Aim for 250+ words in Task 2 to avoid Task Response penalties"
            isDark={isDark}
          />
        </div>

        {/* MAIN GRID */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          {/* LEFT: INPUT */}
          <div className={cn("rounded-3xl border p-5 md:p-6 shadow-lg", t.card, t.border)}>
            <SectionTitle
              icon={<FaPenFancy />}
              title="Your Writing"
              sub="Choose task type, paste topic & your essay, then get instant feedback"
            />

            {/* Task switch + word meter */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="inline-flex rounded-2xl border overflow-hidden shadow-md"
                   style={{ borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(124,58,237,0.16)" }}>
                <button
                  onClick={() => setTaskType("task1")}
                  className={cn(
                    "px-5 py-3 text-sm font-extrabold transition-all duration-300",
                    taskType === "task1"
                      ? "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-lg scale-105"
                      : isDark
                      ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                      : "bg-white text-slate-700 hover:bg-purple-50"
                  )}
                >
                  📊 Task 1
                </button>
                <button
                  onClick={() => setTaskType("task2")}
                  className={cn(
                    "px-5 py-3 text-sm font-extrabold transition-all duration-300",
                    taskType === "task2"
                      ? "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-lg scale-105"
                      : isDark
                      ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                      : "bg-white text-slate-700 hover:bg-purple-50"
                  )}
                >
                  ✍️ Task 2
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <StatPill label="Words" value={words} tone={wordTone} />
                <StatPill label="Target" value={`${minWords}+`} />
              </div>
            </div>

            {/* Word progress - Enhanced with Grammarly-style design */}
            <div className={cn("mt-4 rounded-2xl border p-5 shadow-md", isDark ? "border-gray-800 bg-gradient-to-br from-slate-800 to-slate-900" : "border-purple-100 bg-gradient-to-br from-white to-purple-50")}>
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-2">
                  <FaBook className={cn("text-lg", words >= minWords ? "text-emerald-500" : "text-amber-500")} />
                  <span className={cn("font-bold", t.text)}>
                    Word Count Progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {words >= minWords ? (
                    <FaCheckCircle className="text-emerald-500 animate-bounce" />
                  ) : (
                    <FaHeart className="text-rose-500 animate-pulse" />
                  )}
                  <span className={cn("font-black text-lg", words >= minWords ? "text-emerald-500" : "text-amber-500")}>
                    {words}/{minWords}
                  </span>
                </div>
              </div>
              <div className={cn("h-3 rounded-full overflow-hidden shadow-inner", isDark ? "bg-white/10" : "bg-purple-200/50")}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{
                    width: `${wordPct}%`,
                    background: words >= minWords 
                      ? "linear-gradient(to right, #10b981, #34d399)" 
                      : "linear-gradient(to right, #f59e0b, #fbbf24)",
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <FaStar className={cn("text-sm mt-0.5", words >= minWords ? "text-emerald-500" : "text-amber-500")} />
                <div className={cn("text-xs leading-relaxed", t.sub)}>
                  {words >= minWords 
                    ? "✨ Great! You've reached the minimum word count. Keep going!" 
                    : `💪 ${minWords - words} more words to reach the recommended minimum for Task ${taskType === 'task1' ? '1' : '2'}`}
                </div>
              </div>
            </div>

            {/* Topic */}
            <div className="mt-5">
              <label className={cn("text-sm font-black flex items-center gap-2", t.text)}>
                <FaLightbulb className="text-amber-500" />
                TOPIC / QUESTION
              </label>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Some people say that music is a good way of bringing people of different cultures together..."
                className={cn(
                  "mt-2 w-full rounded-2xl border px-4 py-4 outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent transition-all shadow-sm hover:shadow-md",
                  t.input
                )}
              />
            </div>

            {/* Essay */}
            <div className="mt-5">
              <label className={cn("text-sm font-black flex items-center gap-2", t.text)}>
                <FaPenFancy className="text-purple-500" />
                YOUR ESSAY
              </label>
              <textarea
                rows={12}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={`✍️ Start writing your essay here... Remember to:
• Write clear topic sentences
• Use linking words (However, Moreover, In addition...)
• Include relevant examples
• Check your grammar and spelling`}
                className={cn(
                  "mt-2 w-full rounded-2xl border px-4 py-4 outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent transition-all resize-y min-h-[280px] shadow-sm hover:shadow-md",
                  t.input
                )}
              />
            </div>

            {/* Error */}
            {err ? (
              <div className="mt-4">
                <Alert type="error">{err}</Alert>
              </div>
            ) : null}

            {/* Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCheck}
                disabled={loading}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white font-extrabold shadow-xl transition-all transform",
                  loading 
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-[#6C5CE7] via-purple-600 to-[#00CEC9] hover:shadow-2xl hover:scale-105 active:scale-95"
                )}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Your Essay...</span>
                  </>
                ) : (
                  <>
                    <FaBolt className="text-xl" />
                    <span>🚀 Check My Writing</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className={cn(
                  "sm:w-[180px] inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 font-extrabold shadow-md transition-all hover:scale-105 active:scale-95",
                  isDark ? "border-gray-700 text-gray-200 hover:bg-gray-800" : "border-purple-300 text-slate-700 hover:bg-purple-50"
                )}
              >
                <FaTrash />
                Clear All
              </button>
            </div>
          </div>

          {/* RIGHT: RESULT / INSIGHTS */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className={cn("rounded-3xl border p-5 md:p-6 shadow-lg", t.card, t.border)}>
              <SectionTitle
                icon={<FaChartPie />}
                title="Results"
                sub={result ? "Overall score + detailed breakdown" : "No results yet. Submit your essay to see analysis."}
              />

              {/* Score + chart */}
              {result ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
                       style={{ background: "linear-gradient(135deg, #6C5CE7, #00CEC9)" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative z-10">
                      <div className="text-xs font-black tracking-widest opacity-90 flex items-center gap-2">
                        <FaTrophy /> OVERALL BAND SCORE
                      </div>
                      <div className="mt-3 text-7xl font-black leading-none">{overallBand}</div>
                      <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white/20 px-4 py-2 rounded-xl">
                        <FaCheckCircle />
                        Strict Assessment Mode
                      </div>
                    </div>
                  </div>

                  <div className={cn("rounded-3xl border p-5 h-[280px]", isDark ? "border-gray-800 bg-white/5" : "border-purple-100 bg-white shadow-md")}>
                    {chartData ? <Radar data={chartData} options={chartOptions} /> : null}
                  </div>
                </div>
              ) : (
                <div className={cn("mt-5 rounded-3xl border p-5", isDark ? "border-gray-800 bg-white/5" : "border-purple-100 bg-[#A29BFE]/10")}>
                  <div className={cn("text-sm font-semibold mb-3 flex items-center gap-2", t.text)}>
                    <FaLightbulb className="text-amber-500" />
                    Quick Tips:
                  </div>
                  <ul className={cn("text-sm leading-relaxed space-y-2", t.sub)}>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Task 2: Write 4 paragraphs (Intro, 2 Body, Conclusion)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Use clear topic sentences at the start of each body paragraph</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Add 2-3 topic-specific collocations to boost LR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Proofread for grammar errors before submitting</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* SYSTEM REPORT */}
            {result?.system_feedback?.length ? (
              <div className={cn("rounded-3xl border p-5 md:p-6 shadow-lg", t.card, t.border)}>
                <SectionTitle icon={<FaLightbulb />} title="System Report" sub="Technical notes from the system" />
                <div className="mt-4">
                  <Alert type="warn">
                    <ul className="list-disc pl-5 space-y-2">
                      {result.system_feedback.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </Alert>
                </div>
              </div>
            ) : null}

            {/* COPY BETTER VERSION */}
            {result?.better_version ? (
              <div className={cn("rounded-3xl border p-5 md:p-6 shadow-lg", t.card, t.border)}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className={cn("text-base font-extrabold flex items-center gap-2", t.text)}>
                      <FaStar className="text-yellow-500" />
                      Band 9.0 Model Essay
                    </div>
                    <div className={cn("text-sm mt-1", t.sub)}>Compare structure and expression with your essay</div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-extrabold text-sm transition shadow-sm hover:scale-105",
                      copied
                        ? "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white border-transparent"
                        : isDark
                        ? "border-gray-700 text-gray-200 hover:bg-gray-800"
                        : "border-purple-200 text-slate-700 hover:bg-purple-50"
                    )}
                  >
                    <FaCopy />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

              <div className={cn(
                "rounded-2xl border p-4 whitespace-pre-line text-sm leading-relaxed",
                isDark ? "border-gray-800 bg-white/5 text-gray-100" : "border-purple-100 bg-purple-50 text-slate-700"
              )}>
                  {result.better_version}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* BELOW: DETAIL SECTIONS */}
        {result ? (
          <div className="mt-6 space-y-6">
            {/* Detailed analysis */}
            {result.detailed_analysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <AnalysisCard
                  title="Task Response (TR)"
                  content={result.detailed_analysis.task_response}
                  colorClass="text-emerald-600"
                  icon={FaCheckCircle}
                  isDark={isDark}
                />
                <AnalysisCard
                  title="Coherence & Cohesion (CC)"
                  content={result.detailed_analysis.coherence_cohesion}
                  colorClass="text-sky-600"
                  icon={FaRocket}
                  isDark={isDark}
                />
                <AnalysisCard
                  title="Lexical Resource (LR)"
                  content={result.detailed_analysis.lexical_resource}
                  colorClass="text-purple-600"
                  icon={FaBook}
                  isDark={isDark}
                />
                <AnalysisCard
                  title="Grammar Accuracy (GRA)"
                  content={result.detailed_analysis.grammar_accuracy}
                  colorClass="text-rose-600"
                  icon={FaGraduationCap}
                  isDark={isDark}
                />
              </div>
            ) : null}

            {/* Vocab suggestions */}
            {result.topic_vocab_suggestion?.length ? (
              <div className={cn("rounded-3xl border p-5 md:p-6 shadow-lg", t.card, t.border)}>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <div className={cn("text-base font-extrabold flex items-center gap-2", t.text)}>
                      <FaBook className="text-indigo-500" />
                      Advanced Vocabulary Suggestions
                    </div>
                    <div className={cn("text-sm mt-1", t.sub)}>Use these words in the right context to boost your LR score</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#00CEC9] bg-[#00CEC9]/10 px-3 py-1.5 rounded-xl border border-[#00CEC9]/20">
                    <FaStar />
                    Vocabulary Booster
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.topic_vocab_suggestion.map((vocab, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-3xl border p-5 transition-all shadow-md hover:shadow-xl hover:scale-[1.02]",
                        isDark ? "border-gray-800 bg-gradient-to-br from-slate-800 to-slate-900" : "border-purple-100 bg-gradient-to-br from-white to-purple-50"
                      )}
                    >
                      <div className={cn("text-lg font-black flex items-center gap-2", isDark ? "text-white" : "text-slate-800")}>
                        <FaStar className="text-amber-500 text-sm" />
                        {vocab.word}
                      </div>
                      <div className={cn("mt-1 text-sm italic", t.sub)}>{vocab.meaning}</div>
                      <div className={cn("mt-3 text-xs leading-relaxed rounded-2xl border p-3", isDark ? "border-gray-800 bg-black/20 text-gray-200" : "border-purple-100 bg-purple-100 text-slate-700")}>
                        <span className="font-extrabold">Example:</span> {vocab.context}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
