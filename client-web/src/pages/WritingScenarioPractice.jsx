import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import writingScenarioService from '../services/writingScenarioService';
import { cn, theme as lightTheme, darkTheme } from "../utils/dashboardTheme";
import { 
  FaRocket, FaStar, FaLightbulb, FaCheck, FaExclamationTriangle, 
  FaInfoCircle, FaSpinner, FaRobot, FaChartLine, FaMagic, 
  FaArrowLeft, FaHistory, FaBan, FaAward, FaShieldAlt, FaCheckCircle
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
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

import { dashboardRefreshEmitter } from '../utils/dashboardRefresh';
import WritingRewardModal from '../components/dashboard/WritingRewardModal';

const WritingScenarioPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  
  const [scenario, setScenario] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState({ valid: true, violations: [], warnings: [], word_count: 0 });
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [activeTab, setActiveTab] = useState("writing-scenarios");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [activeSeconds, setActiveSeconds] = useState(0);
  
  const validationTimeout = useRef(null);
  const t = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    fetchScenario();
    fetchHistory();
    setStartTime(Date.now());
  }, [id]);

  // Timer to track active study time
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchScenario = async () => {
    try {
      setLoading(true);
      const res = await writingScenarioService.getScenarioById(id);
      setScenario(res.data);
    } catch (err) {
      console.error('Error fetching scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await writingScenarioService.getSubmissionHistory(id);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (err) { console.error("Logout error:", err); }
  };

  // Real-time validation
  useEffect(() => {
    if (text.length > 5 && !evaluating) {
      if (validationTimeout.current) clearTimeout(validationTimeout.current);
      validationTimeout.current = setTimeout(async () => {
        try {
          const res = await writingScenarioService.validateSubmission(id, text);
          setValidation(res);
        } catch (err) {
          console.error('Validation error:', err);
        }
      }, 1000);
    }
  }, [text, id]);

  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      setError(null);
      // Assuming 'text' is the submissionText and 'activeSeconds' is timeSpentRef.current
      const res = await writingScenarioService.evaluateSubmission(id, text, activeSeconds);
      dashboardRefreshEmitter.emit();
      const evalData = res.evaluation;
      const rewardData = res.reward;
      
      setEvaluation(evalData);
      setCurrentReward(rewardData);
      setIsRewardModalOpen(true);
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi chấm bài. Ní thử lại sau nhé!');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center", t.page)}>
      <LoadingCat size={300} text="Đang chuẩn bị kịch bản..." />
    </div>
  );

  const renderEvaluationView = (evalData, isHistory = false) => {
    if (!evalData) return null;

    const chartData = {
      labels: ['Tone', 'Vocab', 'Creativity', 'Grammar'],
      datasets: [{
        label: 'Score',
        data: [
          evalData.radar_chart?.tone || 0, 
          evalData.radar_chart?.vocab || 0, 
          evalData.radar_chart?.creativity || 0, 
          evalData.radar_chart?.grammar || 0
        ],
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        borderColor: '#6C5CE7',
        pointBackgroundColor: '#6C5CE7',
        pointBorderColor: '#fff',
      }]
    };

    const chartOptions = {
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { display: false, stepSize: 2 },
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            angleLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            pointLabels: { color: isDark ? '#94a3b8' : '#64748b', font: { weight: 'bold', size: 10 } }
          }
        },
        plugins: { legend: { display: false } }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center justify-between">
           <button onClick={() => isHistory ? setSelectedSubmission(null) : setEvaluation(null)} className={cn("flex items-center gap-2 text-xs font-black hover:text-[#6C5CE7] transition-all", t.sub)}>
              <FaArrowLeft /> {isHistory ? 'QUAY LẠI LỊCH SỬ' : 'THỬ LẠI'}
           </button>
           <div className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest", isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
              {isHistory ? 'Xem lại bài viết' : 'Nhiệm vụ hoàn thành'}
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Score Card */}
          <div className="lg:col-span-4 space-y-6">
             <div className={cn("rounded-3xl p-8 border text-center relative overflow-hidden", t.card)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative">
                   <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#a78bfa] p-1 shadow-2xl mb-4">
                      <div className={cn("w-full h-full rounded-full flex flex-col items-center justify-center", isDark ? "bg-[#1C1E28]" : "bg-white")}>
                         <span className="text-4xl font-black text-[#6C5CE7]">{evalData.overall_score}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Overall</span>
                      </div>
                   </div>
                   <h2 className={cn("text-xl font-black mb-1", t.text)}>
                      {evalData.overall_score >= 80 ? 'XUẤS SẮC!' : 'KHÁ TỐT!'}
                   </h2>
                   <p className={cn("text-xs font-medium", t.sub)}>Ní đã làm rất tốt nhiệm vụ này.</p>
                </div>
             </div>

             <div className={cn("rounded-3xl p-6 border", t.card)}>
                <div className="h-56">
                  <Radar data={chartData} options={chartOptions} />
                </div>
             </div>
          </div>

          {/* Right: Feedback & Better Version */}
          <div className="lg:col-span-8 space-y-6">
             <div className={cn("rounded-3xl p-8 border", t.card)}>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-[#6C5CE7]">
                      <FaRobot size={24} />
                   </div>
                   <div>
                      <h4 className={cn("text-[10px] font-black uppercase tracking-widest", t.sub)}>Phản hồi từ AI</h4>
                      <p className={cn("text-sm font-black", t.text)}>Persona Perspective</p>
                   </div>
                </div>
                <div className={cn("relative p-6 rounded-2xl italic text-sm leading-relaxed border border-indigo-500/10", isDark ? "bg-white/5 shadow-inner" : "bg-indigo-50/50")}>
                   <span className="absolute -top-3 left-6 text-4xl text-indigo-500 opacity-20 font-serif">"</span>
                   {evalData.persona_feedback}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn("p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5")}>
                   <h5 className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-4">Điểm mạnh</h5>
                   <ul className="space-y-3">
                      {evalData.detailed_analysis?.pros?.map((p, i) => (
                         <li key={i} className={cn("text-xs flex items-start gap-2", t.text)}>
                            <span className="text-emerald-500 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                            {p}
                         </li>
                      ))}
                   </ul>
                </div>
                <div className={cn("p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5")}>
                   <h5 className="text-rose-500 font-black text-[10px] uppercase tracking-widest mb-4">Cần cải thiện</h5>
                   <ul className="space-y-3">
                      {evalData.detailed_analysis?.cons?.map((c, i) => (
                         <li key={i} className={cn("text-xs flex items-start gap-2", t.text)}>
                            <span className="text-rose-500 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                            {c}
                         </li>
                      ))}
                   </ul>
                </div>
             </div>

             <div className={cn("rounded-3xl p-8 border", t.card)}>
                <h5 className={cn("text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2", t.text)}>
                   <FaMagic className="text-[#6C5CE7]" /> Phiên bản đề xuất
                </h5>
                <div className={cn("p-6 rounded-2xl border text-sm leading-relaxed", isDark ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100")}>
                   {evalData.better_version}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <header className="flex items-center justify-between">
           <button onClick={() => setShowHistory(false)} className={cn("flex items-center gap-2 text-xs font-black hover:text-[#6C5CE7] transition-all", t.sub)}>
              <FaArrowLeft /> QUAY LẠI CỬA SỔ VIẾT
           </button>
           <h2 className={cn("text-sm font-black uppercase tracking-widest", t.text)}>Lịch sử nộp bài</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.length > 0 ? history.map((sub) => (
            <div 
              key={sub._id} 
              onClick={() => setSelectedSubmission(sub)}
              className={cn("p-6 rounded-3xl border cursor-pointer hover:border-[#6C5CE7] transition-all group", t.card)}
            >
               <div className="flex items-center justify-between mb-4">
                  <div className={cn("px-3 py-1 rounded-lg bg-indigo-500/10 text-[#6C5CE7] text-[10px] font-black")}>
                    {new Date(sub.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="text-lg font-black text-[#6C5CE7]">
                    {sub.evaluation?.overall_score || 0}
                  </div>
               </div>
               <p className={cn("text-[10px] line-clamp-3 leading-relaxed mb-4", t.sub)}>
                 {sub.content}
               </p>
               <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Xem chi tiết</span>
                  <FaRocket className="text-[#6C5CE7] opacity-0 group-hover:opacity-100" size={10} />
               </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center">
               <p className={cn("text-xs font-bold opacity-30")}>Chưa có bài viết nào trong lịch sử.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    return renderEvaluationView(evaluation);
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", t.page)}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex gap-5">
           <DashboardSidebar active={activeTab} setActive={setActiveTab} onLogout={handleLogout} theme={t} />

           <div className="flex-1 min-w-0 space-y-6">
              <DashboardTopbar user={user} theme={t} />

               {selectedSubmission ? renderEvaluationView(selectedSubmission.evaluation, true) :
                evaluation ? renderResult() : 
                showHistory ? renderHistoryView() : (
                 <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)]">
                    {/* Left Panel: Context & HUD */}
                    <aside className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                       <div className={cn("rounded-3xl p-6 border", t.card)}>
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <FaLightbulb className="text-amber-500" />
                                <h3 className={cn("text-[10px] font-black uppercase tracking-widest", t.text)}>Nhiệm vụ</h3>
                             </div>
                             <button 
                                onClick={() => setShowHistory(true)}
                                className={cn("px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest hover:bg-[#6C5CE7] hover:text-white transition-all", t.sub)}
                             >
                                <FaHistory className="inline mr-1" /> Lịch sử
                             </button>
                          </div>
                         <p className={cn("text-xs leading-relaxed mb-4", t.sub)}>{scenario.context_description}</p>
                         <div className={cn("p-4 rounded-xl border italic text-xs leading-relaxed", isDark ? "bg-white/5 border-white/5" : "bg-indigo-50/50 border-indigo-100")}>
                            "{scenario.situation_prompt}"
                         </div>
                      </div>

                      <div className={cn("rounded-3xl p-6 border", t.card)}>
                         <div className="flex items-center gap-2 mb-6">
                            <FaShieldAlt className="text-[#6C5CE7]" />
                            <h3 className={cn("text-[10px] font-black uppercase tracking-widest", t.text)}>Keywords (HUD)</h3>
                         </div>
                         <div className="space-y-2">
                            {scenario.required_keywords.map(kw => {
                               const isUsed = text.toLowerCase().includes(kw.toLowerCase());
                               return (
                                 <div key={kw} className={cn(
                                   "flex items-center justify-between p-3.5 rounded-xl border-2 transition-all duration-300",
                                   isUsed 
                                     ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-500" 
                                     : cn(t.border, t.sub, "opacity-50")
                                 )}>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{kw}</span>
                                    {isUsed && <FaCheckCircle size={14} className="animate-in zoom-in" />}
                                 </div>
                               );
                            })}
                         </div>

                         {validation.violations.length > 0 && (
                           <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-in slide-in-from-top-2">
                              <div className="flex items-center gap-2 font-black text-[10px] mb-1">
                                 <FaBan size={10} /> CẢNH BÁO TỪ CẤM
                              </div>
                              {validation.violations.map((v, i) => (
                                <p key={i} className="text-[10px] font-bold">{v.message}</p>
                              ))}
                           </div>
                         )}
                      </div>

                      <div className={cn("rounded-3xl p-6 border bg-linear-to-br from-[#6C5CE7]/5 to-transparent", t.card)}>
                         <h3 className={cn("text-[10px] font-black uppercase tracking-widest mb-3", t.text)}>Target Tone</h3>
                         <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-[#6C5CE7] text-white rounded-lg text-[10px] font-black uppercase">{scenario.target_tone}</span>
                            <span className={cn("text-[10px] font-black opacity-40")}>{scenario.tone_intensity}/10 Intensive</span>
                         </div>
                      </div>
                   </aside>

                   {/* Right Panel: Editor */}
                   <div className="lg:col-span-8 flex flex-col space-y-4">
                      <div className={cn("flex-1 rounded-3xl border flex flex-col overflow-hidden shadow-2xl relative", t.card, validation.violations.length > 0 && "border-rose-500/30")}>
                         {/* Header Mockup */}
                         <div className={cn("px-6 py-3 border-b flex items-center justify-between", t.border)}>
                            <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                               <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                               <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-30")}>
                               {scenario.scenario_type.toUpperCase()} INTERFACE
                            </span>
                         </div>
                         
                         <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={`✍️ Nhập văn bản tại đây...\n\n- Yêu cầu ít nhất ${scenario.word_limit.min} từ.\n- Nhớ sử dụng các từ khóa bắt buộc bên trái.`}
                            className="flex-1 w-full p-8 bg-transparent outline-none resize-none font-medium text-sm leading-relaxed placeholder:opacity-20 transition-all duration-300"
                         />

                         {/* Footer progress */}
                         <div className={cn("px-8 py-4 border-t flex flex-col gap-4", t.border)}>
                            {error && (
                               <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                                  <FaBan /> {error}
                               </div>
                            )}

                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="text-[10px] font-black uppercase tracking-widest">
                                     <span className={cn(text.trim().split(/\s+/).length < scenario.word_limit.min ? "text-amber-500" : "text-emerald-500")}>
                                        {text.trim() === '' ? 0 : text.trim().split(/\s+/).length}
                                     </span>
                                     <span className="opacity-30"> / {scenario.word_limit.min}-{scenario.word_limit.max} WORDS</span>
                                  </div>
                               </div>
                               <button 
                                  disabled={evaluating || text.trim().split(/\s+/).length < 20}
                                  onClick={handleEvaluate}
                                  className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] transition-all transform active:scale-95 shadow-lg",
                                    evaluating || text.trim().split(/\s+/).length < 20
                                      ? "bg-slate-300 text-white cursor-not-allowed opacity-50 shadow-none"
                                      : "bg-linear-to-r from-[#6C5CE7] to-[#a78bfa] text-white shadow-indigo-500/20"
                                  )}
                               >
                                  {evaluating ? <div className="flex items-center gap-2"><LoadingCat size={40} text={null} /> <span>ĐANG CHẤM...</span></div> : <><FaRocket className="text-[10px]" /> NỘP BÀI</>}
                               </button>
                            </div>
                         </div>
                      </div>
                      
                      <div className="text-center">
                         <p className={cn("text-[8px] font-black uppercase tracking-[0.4em] opacity-20")}>
                            AI Analysis powered by Gemini 2.0 Flash
                         </p>
                      </div>
                   </div>
                </main>
              )}
           </div>
        </div>
      </div>

      <WritingRewardModal 
        isOpen={isRewardModalOpen} 
        onClose={() => setIsRewardModalOpen(false)}
        evaluation={evaluation}
        reward={currentReward}
        theme={t}
      />
    </div>
  );
};

export default WritingScenarioPractice;
