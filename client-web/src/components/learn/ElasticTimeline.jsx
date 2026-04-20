import React, { useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { 
  FaBrain, FaFire, FaSnowflake, FaCheckCircle, 
  FaArrowRight, FaLock, FaGraduationCap, FaCircle,
  FaPlus, FaLightbulb, FaRocket, FaSpinner
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../utils/axiosConfig';

const MotionDiv = motion.div;
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const SKILL_TO_TYPE = {
  reading: 'reading',
  listening: 'listening',
  speaking: 'speaking',
  writing: 'writing',
  vocabulary: 'vocabulary',
  grammar: 'grammar',
  quiz: 'topic',
};

function getRouteByType(type, id) {
  switch (type) {
    case 'topic': return id ? `/learn/topics/${id}` : '/learn';
    case 'lesson': return id ? `/learn/lessons/${id}` : '/learn';
    case 'reading': return id ? `/reading/${id}` : '/reading';
    case 'speaking': return id ? `/speaking-practice/${id}` : '/speaking-practice';
    case 'writing': return id ? `/ai-writing/${id}` : '/writing-scenarios';
    case 'listening': return id ? `/ai-listening/${id}` : '/ai-listening';
    case 'vocabulary': return id ? `/vocabulary/${id}/learn` : '/vocabulary';
    case 'grammar': return id ? `/grammar/${id}` : '/grammar';
    case 'story': return id ? `/stories/${id}` : '/stories';
    default: return '/learn';
  }
}

function getDisplayTasks(day) {
  if (Array.isArray(day.tasks) && day.tasks.length > 0) return day.tasks;

  const itemId = day.topicId || day.lessonId || day.itemId || null;
  if (!itemId && !day.skill) return [];

  const type = day.itemType || (day.topicId ? 'topic' : (day.lessonId ? 'lesson' : SKILL_TO_TYPE[day.skill] || 'topic'));
  const name = day.topic?.name || day.lesson?.title || 'Bài học AI';

  return [{
    type,
    itemId,
    name,
    title: name,
    status: day.status || 'pending',
    weight: 2,
  }];
}

/**
 * ElasticTimeline - Giao diện lộ trình học tập "Dòng chảy" V4.0
 * Thay thế cho WeekPlan truyền thống, tập trung vào sự kết nối và trực quan.
 */
export default function ElasticTimeline({ plan, onRegenerate, planLoading, isDark, t, navigate }) {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
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

  const planDetailRows = [...(plan.dayItems || [])]
    .sort((a, b) => (a.dayIndex ?? 0) - (b.dayIndex ?? 0))
    .map((day, idx) => {
      const tasks = getDisplayTasks(day);
      const firstTask = tasks[0];
      const dayIdx = Number.isInteger(day.dayIndex) ? day.dayIndex : idx;
      return {
        dayLabel: DAY_LABELS[dayIdx] || `Ngày ${dayIdx + 1}`,
        skill: day.skill || firstTask?.type || 'general',
        taskName: firstTask?.name || firstTask?.title || day.topic?.name || 'Ôn tập linh hoạt',
      };
    });

  const weakSkills = Object.entries(plan.metadata?.skillMastery || {})
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([k]) => k);

  const introSummary = weakSkills.length > 0
    ? `Tuần này ưu tiên cải thiện ${weakSkills.join(' & ')} dựa trên dữ liệu học gần nhất của bạn.`
    : 'Lộ trình 7 ngày được chia theo kỹ năng để bạn tiến đều và không quá tải.';

  const fetchBonusTasks = async () => {
    setLoadingBonus(true);
    setShowBonus(true);
    try {
      const resp = await axiosInstance.get('/learn/bonus-tasks');
      if (resp.data.success) {
        setBonusTasks(resp.data.data);
      }
    } catch (err) {
      console.error('Fetch bonus error:', err);
    } finally {
      setLoadingBonus(false);
    }
  };

  const handleTimelineMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragStartScrollLeftRef.current = el.scrollLeft;
  };

  const handleTimelineMouseMove = (e) => {
    const el = scrollRef.current;
    if (!el || !isDraggingRef.current) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.2;
    el.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  const stopTimelineDragging = () => {
    isDraggingRef.current = false;
  };

  const handleTimelineWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    // Convert vertical wheel to horizontal movement for easier desktop navigation
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
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
              <div className="w-px h-10 bg-white/10" />
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

        {/* Plan Detail Intro */}
        {planDetailRows.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-linear-to-r from-[#6C5CE7]/10 to-[#00CEC9]/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/20">
                 <FaGraduationCap className="text-[#6C5CE7]" />
              </div>
              <div className="flex-1">
                <p className={cn("text-xs font-bold uppercase text-[#6C5CE7] mb-1 tracking-widest")}>Giới thiệu lộ trình tuần này</p>
                <p className={cn("text-sm leading-relaxed mb-3", t.text)}>{introSummary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {planDetailRows.map((row, i) => (
                    <div
                      key={`${row.dayLabel}-${i}`}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs",
                        isDark ? "bg-white/5 border-white/10" : "bg-white/60 border-[#6C5CE7]/15"
                      )}
                    >
                      <div className="font-bold text-[#6C5CE7] mb-0.5">{row.dayLabel} • {String(row.skill).toUpperCase()}</div>
                      <div className={cn("truncate", t.text)}>{row.taskName}</div>
                    </div>
                  ))}
                </div>
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
          <MotionDiv 
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
                    <MotionDiv 
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
                    </MotionDiv>
                  ))}
                  {bonusTasks.length === 0 && <p className="col-span-4 text-center py-6 opacity-40 italic">Chưa tìm được bài mới phù hợp...</p>}
                </div>
              )}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* ── The Fluid Timeline ──────────────────────────────────────── */}
      <div 
        ref={scrollRef}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={stopTimelineDragging}
        onMouseLeave={stopTimelineDragging}
        onWheel={handleTimelineWheel}
        className="flex gap-6 overflow-x-auto pb-8 pt-4 no-scrollbar snap-x cursor-grab active:cursor-grabbing select-none"
        style={{ userSelect: 'none' }}
      >
        {plan.dayItems.map((day, idx) => {
          const dayIdx = Number.isInteger(day.dayIndex) ? day.dayIndex : idx;
          const isToday = dayIdx === todayIdx;
          const isDone = day.status === 'completed';
          const isFuture = dayIdx > todayIdx;
          const displayTasks = getDisplayTasks(day);
          
          // Tính toán "Nhiệt độ" (Energy Level)
          const load = displayTasks.reduce((acc, t) => acc + (t.weight || 2), 0) || 0;
          const isHeavy = load > 5;
          
          return (
            <MotionDiv 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-none w-72 snap-center"
            >
              <div className={cn(
                "relative group flex flex-col h-full rounded-4xl border transition-all duration-500",
                isToday 
                  ? "ring-4 ring-[#6C5CE7]/20 border-[#6C5CE7] shadow-2xl scale-[1.02]" 
                  : "border-white/5 hover:border-white/20",
                isDark ? "bg-gray-900/60" : "bg-white",
                isDone && "bg-emerald-500/5 border-emerald-500/30"
              )}>
                
                {/* Connection Line */}
                {idx < totalCount - 1 && (
                  <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-linear-to-r from-white/10 to-white/5 hidden lg:block" />
                )}

                {/* Card Header */}
                <div className="p-5 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <span className={cn(
                       "text-sm font-black uppercase tracking-tighter opacity-50",
                       isToday && "opacity-100 text-[#6C5CE7]"
                     )}>Thứ {dayIdx + 2 === 8 ? 'CN' : dayIdx + 2}</span>
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
                  {displayTasks.length > 0 ? (
                    displayTasks.map((task, tIdx) => (
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
                        {tIdx < displayTasks.length - 1 && (
                          <div className="absolute -bottom-3 left-7 w-0.5 h-3 bg-linear-to-b from-[#6C5CE7]/40 to-transparent" />
                        )}
                      </div>
                    ))
                  ) : (
                    /* Empty State */
                    <div className="flex-1 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center opacity-30 italic text-xs">
                       Nghỉ ngơi
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 mt-auto">
                    {(() => {
                      const firstPending = displayTasks.find(t => t.status !== 'completed');
                      const firstTask = firstPending || displayTasks[0];
                      
                      let dest = null;
                      if (firstTask) {
                        const type = firstTask.type;
                        const id = firstTask.itemId;
                        dest = getRouteByType(type, id);
                      }

                      const isPast = dayIdx < todayIdx;
                      const actionLabel = isDone ? 'Hoàn thành' : (isToday ? 'Bắt đầu' : (isPast ? 'Làm bù' : 'Chưa đến lúc'));

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
                                : isPast
                                  ? "bg-amber-500/10 border border-amber-400/30 text-amber-300 hover:bg-amber-500/20"
                                  : "bg-white/5 border border-white/10 text-gray-500 opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isDone ? <FaCheckCircle /> : actionLabel}
                          {!isDone && isToday && <FaArrowRight className="text-xs" />}
                        </button>
                      );
                    })()}
                </div>
              </div>
            </MotionDiv>
          );
        })}
      </div>
    </div>
  );
}
