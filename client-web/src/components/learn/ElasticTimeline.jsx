import React, { useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { 
  FaBrain, FaFire, FaSnowflake, FaCheckCircle, 
  FaArrowRight, FaLock, FaGraduationCap, FaCircle,
  FaPlus, FaLightbulb, FaRocket, FaSpinner
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

/**
 * ElasticTimeline - Giao diện lộ trình học tập "Dòng chảy" V4.0
 * Thay thế cho WeekPlan truyền thống, tập trung vào sự kết nối và trực quan.
 */
export default function ElasticTimeline({ plan, onRegenerate, planLoading, isDark, t, navigate }) {
  const scrollRef = useRef(null);
  const [bonusTasks, setBonusTasks] = useState([]);
  const [loadingBonus, setLoadingBonus] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  
  if (!plan || !plan.dayItems) return null;

  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  // Tính toán tiến độ tổng thể
  const doneCount = plan.dayItems.filter(i => i.status === 'completed').length;
  const totalCount = plan.dayItems.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  const fetchBonusTasks = async () => {
    setLoadingBonus(true);
    setShowBonus(true);
    try {
      const resp = await axios.get('/api/learn/bonus-tasks');
      if (resp.data.success) {
        setBonusTasks(resp.data.data);
      }
    } catch (err) {
      console.error('Fetch bonus error:', err);
    } finally {
      setLoadingBonus(false);
    }
  };

  return (
    <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* ── Header: AI Strategic Insight ────────────────────────────── */}
      <div className={cn(
        "relative p-6 rounded-[2.5rem] border overflow-hidden shadow-2xl",
        isDark ? "bg-gray-900/40 border-white/10" : "bg-white border-purple-100"
      )}>
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-[#6C5CE7]/15 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-[#00CEC9]/10 blur-[120px] rounded-full" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#6C5CE7] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30">
                <FaBrain className="text-white text-3xl animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className={cn("text-2xl font-black tracking-tight", t.text)}>Dòng chảy học tập AI</h2>
                <span className="px-3 py-1 rounded-full bg-[#6C5CE7] text-white text-[10px] font-black tracking-widest uppercase shadow-sm">v4.0 Elastic</span>
              </div>
              <p className={cn("text-sm opacity-70", t.sub)}>
                Chiến lược: <span className="text-[#6C5CE7] font-bold">Rolling Horizon</span> • 
                Độ nhạy: <span className="text-[#00CEC9] font-bold">Semantic Depth</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Study More Button */}
            <button 
              onClick={fetchBonusTasks}
              className={cn(
                "hidden sm:flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all",
                "bg-linear-to-r from-orange-400 to-rose-400 text-white shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
              )}
            >
              <FaRocket className="text-xs" /> Học thêm ngay
            </button>

            {/* Progress Widget */}
            <div className="flex items-center gap-8 px-6 py-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Tiến độ</p>
                <p className="text-xl font-black text-[#6C5CE7]">{progressPct}%</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Đã xong</p>
                <p className={cn("text-xl font-black", t.text)}>{doneCount}/{totalCount}</p>
              </div>
              <button 
                onClick={onRegenerate}
                disabled={planLoading}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-[#6C5CE7]/20 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
              >
                 <FaBrain className={cn("text-xl", planLoading ? "animate-spin" : "text-[#6C5CE7]")} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Mentor Strategic Insight */}
        {plan.metadata?.phase_explanation && (
          <div className="mt-6 p-4 rounded-2xl bg-linear-to-r from-[#6C5CE7]/10 to-[#00CEC9]/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/20">
                 <FaGraduationCap className="text-[#6C5CE7]" />
              </div>
              <div className="flex-1">
                <p className={cn("text-xs font-bold uppercase text-[#6C5CE7] mb-1 tracking-widest")}>Phân tích chiến lược</p>
                <p className={cn("text-sm leading-relaxed", t.text)}>{plan.metadata.phase_explanation}</p>
              </div>
              <button 
                onClick={fetchBonusTasks}
                className="sm:hidden p-3 rounded-xl bg-orange-500 text-white"
              >
                <FaRocket />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bonus Tasks Panel (Active Learning) ──────────────────── */}
      <AnimatePresence>
        {showBonus && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "p-6 rounded-[2.5rem] border bg-linear-to-br transition-all duration-500",
              isDark ? "from-orange-900/20 to-rose-900/10 border-orange-500/20" : "from-orange-50 to-rose-50 border-orange-100"
            )}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <FaLightbulb />
                  </div>
                  <div>
                    <h3 className={cn("font-black text-lg", t.text)}>Bứt phá giới hạn (Active Learning)</h3>
                    <p className="text-xs opacity-60">AI đề xuất học thêm dựa trên sở thích của ní</p>
                  </div>
                </div>
                <button onClick={() => setShowBonus(false)} className="text-xs font-bold opacity-40 hover:opacity-100">Đóng ✕</button>
              </div>

              {loadingBonus ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                   <FaSpinner className="animate-spin text-2xl mb-2 text-orange-500" />
                   <p className="text-sm font-bold animate-pulse uppercase tracking-widest">AI đang tìm bài học lực nhất...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {bonusTasks.map((task, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate(task.type === 'topic' ? `/learn/topics/${task.id}` : `/reading/${task.id}`)}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-xl",
                        isDark ? "bg-white/5 border-white/10 hover:border-orange-500/40" : "bg-white border-orange-200 hover:border-orange-400"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                         <span className="text-2xl">{task.icon}</span>
                         <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-tighter border border-orange-500/20">
                           {task.type}
                         </span>
                      </div>
                      <h4 className={cn("text-sm font-bold mb-1 line-clamp-1", t.text)}>{task.name}</h4>
                      <p className="text-[10px] opacity-60 italic">{task.reason}</p>
                    </motion.div>
                  ))}
                  {bonusTasks.length === 0 && <p className="col-span-4 text-center py-6 opacity-40 italic">Chưa tìm được bài mới phù hợp...</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The Fluid Timeline ──────────────────────────────────────── */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-8 pt-4 no-scrollbar snap-x cursor-grab active:cursor-grabbing"
      >
        {plan.dayItems.map((day, idx) => {
          const isToday = idx === todayIdx;
          const isDone = day.status === 'completed';
          const isFuture = idx > todayIdx;
          
          // Tính toán "Nhiệt độ" (Energy Level)
          const load = day.tasks?.reduce((acc, t) => acc + (t.weight || 2), 0) || 0;
          const isHeavy = load > 5;
          
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-none w-72 snap-center"
            >
              <div className={cn(
                "relative group flex flex-col h-full rounded-[2rem] border transition-all duration-500",
                isToday 
                  ? "ring-4 ring-[#6C5CE7]/20 border-[#6C5CE7] shadow-2xl scale-[1.02]" 
                  : "border-white/5 hover:border-white/20",
                isDark ? "bg-gray-900/60" : "bg-white",
                isDone && "bg-emerald-500/5 border-emerald-500/30"
              )}>
                
                {/* Connection Line */}
                {idx < totalCount - 1 && (
                  <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-linear-to-r from-white/10 to-white/5 hidden lg:block" />
                )}

                {/* Card Header */}
                <div className="p-5 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <span className={cn(
                       "text-sm font-black uppercase tracking-tighter opacity-50",
                       isToday && "opacity-100 text-[#6C5CE7]"
                     )}>Thứ {idx + 2 === 8 ? 'CN' : idx + 2}</span>
                     {isToday && (
                       <span className="px-2 py-0.5 rounded-md bg-[#6C5CE7] text-white text-[8px] font-black uppercase">Today</span>
                     )}
                  </div>
                  {isHeavy ? (
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-1 rounded-lg">
                      <FaFire className="animate-bounce" /> Nặng
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded-lg">
                      <FaSnowflake /> Nhẹ
                    </div>
                  )}
                </div>

                {/* Card Body: Task Chain */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  {day.tasks && day.tasks.map((task, tIdx) => (
                    <div 
                      key={tIdx}
                      className={cn(
                        "relative p-4 rounded-2xl border transition-all duration-300",
                        isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100",
                        isToday && "hover:bg-[#6C5CE7]/5 hover:border-[#6C5CE7]/30",
                        task.status === 'completed' && (isDark ? "bg-emerald-900/20 border-emerald-500/20" : "bg-emerald-50 border-emerald-100")
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm",
                          task.status === 'completed' ? "bg-emerald-500 text-white" : (idx % 2 === 0 ? "bg-[#6C5CE7]/20 text-[#6C5CE7]" : "bg-[#00CEC9]/20 text-[#00CEC9]")
                        )}>
                           {task.status === 'completed' ? <FaCheckCircle className="text-[10px]" /> : <FaCircle className="text-[6px]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-black uppercase opacity-40 mb-0.5 tracking-widest")}>{task.type || 'Học tập'}</p>
                          <p className={cn("text-sm font-bold truncate", task.status === 'completed' ? "text-emerald-500 line-through opacity-60" : t.text)}>
                            {task.name || 'Bài học AI'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Linking Indicator and Chain */}
                      {tIdx < day.tasks.length - 1 && (
                        <div className="absolute -bottom-3 left-7 w-[2px] h-3 bg-linear-to-b from-[#6C5CE7]/40 to-transparent" />
                      )}
                    </div>
                  ))}

                  {/* Empty State / Add task placeholder */}
                  {(!day.tasks || day.tasks.length === 0) && (
                    <div className="flex-1 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center opacity-30 italic text-xs">
                       Nghỉ ngơi
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 mt-auto">
                    {(() => {
                      const firstPending = day.tasks?.find(t => t.status !== 'completed');
                      const firstTask = firstPending || (day.tasks && day.tasks[0]);
                      
                      let dest = null;
                      if (firstTask) {
                        const type = firstTask.type;
                        const id = firstTask.itemId;
                        switch (type) {
                          case 'topic': dest = `/learn/topics/${id}`; break;
                          case 'reading': dest = `/reading/${id}`; break;
                          case 'speaking': dest = `/speaking-practice/${id}`; break;
                          case 'writing': dest = `/ai-writing/${id}`; break;
                          case 'listening': dest = `/ai-listening/${id}`; break;
                          case 'vocabulary': dest = `/vocabulary/learn`; break; // or specific topic if available
                          case 'grammar': dest = `/grammar/${id}`; break;
                          case 'story': dest = `/stories/${id}`; break;
                          default: dest = `/learn/topics/${id}`;
                        }
                      }

                      return (
                        <button 
                          onClick={() => dest && navigate(dest)}
                          disabled={isFuture && !isToday}
                          className={cn(
                            "w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-all",
                            isDone 
                              ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg" 
                              : isToday
                                ? "bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-[#6C5CE7]/30 shadow-xl hover:scale-[1.05]"
                                : "bg-white/5 border border-white/10 text-gray-500 opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isDone ? <FaCheckCircle /> : isToday ? 'Bắt đầu' : 'Chưa đến lúc'}
                          {!isDone && isToday && <FaArrowRight className="text-xs" />}
                        </button>
                      );
                    })()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
