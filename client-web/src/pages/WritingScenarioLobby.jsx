import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import writingScenarioService from '../services/writingScenarioService';
import { cn, theme as lightTheme, darkTheme } from "../utils/dashboardTheme";
import { 
  FaPenFancy, 
  FaCommentDots, 
  FaEnvelope, 
  FaComments, 
  FaBook, 
  FaHistory, 
  FaPlay,
  FaUserAstronaut,
  FaCheckCircle,
  FaAward,
  FaTrophy,
  FaStar,
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';

const WritingScenarioLobby = () => {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState("writing-scenarios");

  const t = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const res = await writingScenarioService.getAllScenarios({ is_active: true });
      setScenarios(res.data.scenarios || []);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (err) { console.error("Logout error:", err); }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'messenger': return <FaComments className="text-blue-500" />;
      case 'email': return <FaEnvelope className="text-orange-500" />;
      case 'comment': return <FaCommentDots className="text-emerald-500" />;
      case 'diary': return <FaBook className="text-purple-500" />;
      case 'letter': return <FaPenFancy className="text-rose-500" />;
      default: return <FaPenFancy className="text-indigo-500" />;
    }
  };

  const filteredScenarios = filter === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.scenario_type === filter);

  // Stats calculation
  const totalScenarios = scenarios.length;
  const completedScenarios = scenarios.filter(s => s.userProgress?.isCompleted).length;
  const avgScore = scenarios.length > 0 
    ? Math.round(scenarios.reduce((acc, s) => acc + (s.userProgress?.bestScore || 0), 0) / scenarios.length) 
    : 0;
  const totalProgress = totalScenarios > 0 ? Math.round((completedScenarios / totalScenarios) * 100) : 0;

  return (
    <div className={cn("min-h-screen transition-colors duration-300", t.page)}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex gap-5">
          {/* Sidebar */}
          <DashboardSidebar active={activeTab} setActive={setActiveTab} onLogout={handleLogout} theme={t} />

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            <DashboardTopbar user={user} theme={t} />

            <main className="space-y-8">
              {/* Hero Banner Section */}
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <div className={cn(
                  'absolute inset-0',
                  isDark
                    ? 'bg-linear-to-br from-[#1a0a3d] via-[#2d1060] to-[#0f1122]'
                    : 'bg-linear-to-br from-[#6C5CE7] via-[#5B4FD6] to-[#4338CA]',
                )} />
                {/* Glow blobs */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                {/* Decoration icon */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[80px] opacity-10 pointer-events-none select-none rotate-12">✍️</div>

                <div className="relative z-10 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-2xl text-white">
                          <FaPenFancy />
                        </div>
                        <div>
                          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Luyện viết AI</p>
                          <h1 className="text-white text-2xl font-black leading-tight">Writing Scenarios</h1>
                        </div>
                      </div>
                      <p className="text-white/75 text-sm max-w-md leading-relaxed">
                        Thử thách bản thân với các tình huống giao tiếp <span className="font-bold text-white">Thực tế</span>. Nhận ngay phản hồi từ <span className="font-bold text-white">AI Mentor</span> để nâng cấp kỹ năng viết.
                      </p>
                    </div>

                    {/* Stats chips */}
                    <div className="flex flex-wrap md:flex-col gap-2 md:items-end shrink-0">
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20 min-w-[140px]">
                        <FaBook className="text-white/80 text-sm" />
                        <span className="text-white font-black text-lg leading-none">{totalScenarios}</span>
                        <span className="text-white/70 text-xs uppercase tracking-tighter">Nhiệm vụ</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20 min-w-[140px]">
                        <FaTrophy className="text-emerald-300 text-sm" />
                        <span className="text-white font-black text-lg leading-none">{completedScenarios}</span>
                        <span className="text-white/70 text-xs uppercase tracking-tighter">Hoàn thành</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20 min-w-[140px]">
                        <FaStar className="text-amber-300 text-sm" />
                        <span className="text-white font-black text-lg leading-none">{avgScore}%</span>
                        <span className="text-white/70 text-xs uppercase tracking-tighter">Điểm trung bình</span>
                      </div>
                    </div>
                  </div>

                  {/* Overall progress bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-white/70 mb-1.5 font-bold">
                      <span>Tiến độ tổng thể</span>
                      <span className="text-white">{totalProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden border border-white/10">
                      <div
                        className="h-full rounded-full bg-white/90 transition-all duration-1000 ease-out"
                        style={{ width: `${totalProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap gap-2">
                {['all', 'messenger', 'email', 'comment', 'diary', 'letter'].map(item => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={cn(
                      "px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all transform active:scale-95",
                      filter === item 
                        ? "bg-[#6C5CE7] text-white shadow-lg shadow-indigo-500/30" 
                        : cn(t.card, t.sub, "hover:text-[#6C5CE7] border border-transparent hover:border-indigo-400/30")
                    )}
                  >
                    {item === 'all' ? 'Tất cả' : item}
                  </button>
                ))}
              </div>

              {/* Content Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                   <LoadingCat size={250} text="Đang chuẩn bị các nhiệm vụ viết..." />
                </div>
              ) : filteredScenarios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredScenarios.map(scenario => {
                     const progress = scenario.userProgress;
                     const isCompleted = progress?.isCompleted;

                     return (
                       <div 
                         key={scenario._id}
                         className={cn("group relative rounded-3xl border p-6 transition-all duration-300 flex flex-col h-full", t.card, isCompleted && "border-emerald-500/30 bg-emerald-500/5")}
                       >
                         {/* Scenario Icon & Type */}
                         <div className="flex items-center justify-between mb-5">
                           <div className={cn("p-4 rounded-2xl", isDark ? "bg-white/5" : "bg-indigo-50")}>
                             {getIcon(scenario.scenario_type)}
                           </div>
                           <div className="flex items-center gap-2">
                             {isCompleted && (
                               <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-500 text-white">
                                 <FaCheckCircle size={8} /> DONE
                               </div>
                             )}
                             <div className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", isDark ? "border-white/10 text-white/30" : "border-indigo-100 text-indigo-300")}>
                               {scenario.scenario_type}
                             </div>
                           </div>
                         </div>
 
                         {/* Info */}
                         <div className="flex-1">
                            <h3 className={cn("text-lg font-bold mb-2 group-hover:text-[#6C5CE7] transition-colors line-clamp-1", t.text)}>
                              {scenario.title}
                            </h3>
                            <p className={cn("text-xs mb-5 line-clamp-2 leading-relaxed h-8", t.sub)}>
                              {scenario.context_description}
                            </p>
                         </div>
 
                         {/* Progress Bar Section */}
                         <div className="mb-5 space-y-2">
                            <div className="flex items-center justify-between">
                               <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40")}>Tiến độ</span>
                               <span className={cn("text-[10px] font-black", isCompleted ? "text-emerald-500" : "text-[#6C5CE7]")}>
                                  {progress?.bestScore || 0}%
                               </span>
                            </div>
                            <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-indigo-50")}>
                               <div 
                                  className={cn("h-full transition-all duration-1000", isCompleted ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-[#6C5CE7] shadow-[0_0_10px_rgba(108,92,231,0.3)]")}
                                  style={{ width: `${progress?.bestScore || 0}%` }}
                               />
                            </div>
                         </div>

                         {/* Footer Stats */}
                         <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                             <div className={cn("flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg", isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                               <FaUserAstronaut size={10} />
                               {scenario.cefr_level}
                             </div>
                             <div className={cn("text-[10px] font-black uppercase tracking-tighter opacity-60", t.text)}>
                               {scenario.estimated_time} MINS
                             </div>
                           </div>
                           
                           {progress?.bestScore > 0 && (
                             <div className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                               <FaAward size={10} /> {progress.bestScore}
                             </div>
                           )}
                         </div>
 
                         {/* Action Button */}
                         <button
                           onClick={() => navigate(`/writing-scenario/${scenario._id}`)}
                           className={cn(
                             "w-full py-3.5 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95",
                             isCompleted 
                               ? "bg-white/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 shadow-none" 
                               : "bg-linear-to-r from-[#6C5CE7] to-[#a78bfa] text-white shadow-indigo-500/20 hover:shadow-indigo-500/40"
                           )}
                         >
                           {isCompleted ? <><FaHistory size={10} /> LUYỆN TẬP LẠI</> : <><FaPlay size={10} /> BẮT ĐẦU NHIỆM VỤ</>}
                         </button>
                       </div>
                     );
                   })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className={cn("inline-flex p-6 rounded-full mb-6", isDark ? "bg-white/5" : "bg-indigo-50")}>
                    <FaHistory size={48} className="text-slate-500 opacity-20" />
                  </div>
                  <h2 className={cn("text-xl font-bold mb-1", t.text)}>Chưa có nhiệm vụ nào</h2>
                  <p className={cn("text-sm", t.sub)}>Admin đang chuẩn bị thêm kịch bản mới cho ní!</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingScenarioLobby;
