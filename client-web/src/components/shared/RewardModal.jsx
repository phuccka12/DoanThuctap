import React from 'react';
import { cn } from "../../utils/dashboardTheme";
import { 
  FaCheckCircle, FaAward, FaArrowRight, FaGem, 
  FaArrowUp, FaTimes 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const RewardModal = ({ 
  isOpen, 
  onClose, 
  title = "HOÀN THÀNH XUẤT SẮC!", 
  subtitle = "Bạn đã làm rất tốt, tiếp tục phát huy nhé!",
  primaryStat = { label: "Điểm số", value: 0 },
  secondaryStat,  // optional { label: "Chính xác", value: "80%" }
  reward = { coins: 0, exp: 0 },
  theme: t
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "w-full max-w-lg rounded-[40px] border p-12 text-center relative overflow-hidden shadow-2xl z-10",
            t.card, t.border
          )}
        >
          {/* Decorative Sparks */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 0], 
                opacity: [0, 1, 0],
                x: Math.cos(i * 60 * Math.PI / 180) * 150,
                y: Math.sin(i * 60 * Math.PI / 180) * 150
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeOut" 
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-indigo-500"
            />
          ))}

          {/* Glow Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] -mt-32" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mb-16" />

          <button 
            onClick={onClose}
            className={cn("absolute top-8 right-8 p-3 rounded-2xl transition-all hover:bg-slate-500/10", t.sub)}
          >
            <FaTimes />
          </button>

          <div className="relative space-y-8">
             {/* Header Icon */}
             <div className="flex justify-center">
                <motion.div 
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 12, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="relative"
                >
                   <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#6C5CE7] to-[#a78bfa] flex items-center justify-center text-white shadow-2xl">
                      <FaAward size={40} />
                   </div>
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 0.5 }}
                     className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white border-4 border-white shadow-lg"
                   >
                      <FaCheckCircle size={16} />
                   </motion.div>
                </motion.div>
             </div>

             {/* Title */}
             <div>
                <h2 className={cn("text-3xl font-black mb-2 tracking-tight", t.text)}>
                  {title}
                </h2>
                <p className={cn("text-sm font-bold opacity-60", t.sub)}>
                  {subtitle}
                </p>
             </div>

             {/* Stats Grid */}
             <div className={cn("grid gap-4", secondaryStat ? "grid-cols-2" : "grid-cols-1")}>
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn("p-6 rounded-[32px] border", t.card)}
                >
                   <div className="flex flex-col items-center">
                      <span className="text-4xl font-black text-[#6C5CE7] mb-1">
                        {primaryStat.value}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{primaryStat.label}</span>
                   </div>
                </motion.div>
                {secondaryStat && (
                   <motion.div 
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.3 }}
                     className={cn("p-6 rounded-[32px] border", t.card)}
                   >
                      <div className="flex flex-col items-center">
                         <span className="text-4xl font-black text-emerald-500 mb-1">
                           {secondaryStat.value}
                         </span>
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{secondaryStat.label}</span>
                      </div>
                   </motion.div>
                )}
             </div>

             {/* Rewards */}
             {reward && (reward.coins > 0 || reward.exp > 0) && (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4 }}
               className={cn("rounded-3xl p-6 border bg-linear-to-br from-[#6C5CE7]/5 to-transparent flex items-center justify-center gap-8", t.border)}
             >
                {reward.coins > 0 && (
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-500">
                         <FaGem size={18} />
                      </div>
                      <div className="text-left">
                         <p className="text-[10px] font-black opacity-40 uppercase">Coins</p>
                         <p className={cn("text-lg font-black", t.text)}>+{reward.coins}</p>
                      </div>
                   </div>
                )}
                {reward.coins > 0 && reward.exp > 0 && <div className="w-px h-8 bg-slate-500/10" />}
                {reward.exp > 0 && (
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-400/10 flex items-center justify-center text-[#6C5CE7]">
                         <FaArrowUp size={18} />
                      </div>
                      <div className="text-left">
                         <p className="text-[10px] font-black opacity-40 uppercase">Pet EXP</p>
                         <p className={cn("text-lg font-black", t.text)}>+{reward.exp}</p>
                      </div>
                   </div>
                )}
             </motion.div>
             )}

             {/* Action */}
             <motion.button 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.5 }}
               onClick={onClose}
               className="w-full py-5 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#a78bfa] text-white font-black text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 group active:scale-95"
             >
                XÁC NHẬN PHẦN THƯỞNG
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
             </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RewardModal;
