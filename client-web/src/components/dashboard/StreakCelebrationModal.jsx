import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaTrophy, FaStar, FaArrowRight, FaTimes } from 'react-icons/fa';
import { cn } from "../../utils/dashboardTheme";

const StreakCelebrationModal = ({ isOpen, onClose, streak, theme: t }) => {
  if (!isOpen) return null;

  const getMilestoneInfo = (s) => {
    if (s >= 30) return { title: "HUYỀN THOẠI!", color: "from-indigo-600 to-purple-700", icon: "💎", medal: "KIM CƯƠNG" };
    if (s >= 14) return { title: "XUẤT SẮC!", color: "from-yellow-400 to-orange-500", icon: "🥇", medal: "VÀNG" };
    if (s >= 7) return { title: "TUYỆT VỜI!", color: "from-slate-300 to-slate-500", icon: "🥈", medal: "BẠC" };
    return { title: "CHÚC MỪNG!", color: "from-orange-400 to-red-500", icon: "🔥", medal: "ĐỒNG" };
  };

  const info = getMilestoneInfo(streak);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className={cn(
            "w-full max-w-md rounded-[40px] border p-10 text-center relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-10",
            t.card, t.border
          )}
        >
          {/* Confetti-like particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: [-20, -150], 
                x: [0, (i % 2 === 0 ? 1 : -1) * (Math.random() * 100 + 50)],
                opacity: [0, 1, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                delay: i * 0.1,
                ease: "easeOut" 
              }}
              className={cn(
                "absolute bottom-1/2 left-1/2 w-3 h-3 rounded-sm",
                ["bg-orange-400", "bg-yellow-400", "bg-indigo-400", "bg-emerald-400"][i % 4]
              )}
            />
          ))}

          {/* Main Visual */}
          <div className="relative mb-8 pt-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className={cn(
                "w-32 h-32 mx-auto rounded-[40px] bg-gradient-to-br flex items-center justify-center text-white shadow-2xl relative z-10",
                info.color
              )}
            >
              <div className="text-6xl">{info.icon}</div>
              
              {/* Floating Mini Stars */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                  className="absolute text-yellow-400"
                  style={{ 
                    top: i === 0 ? '-10%' : '20%', 
                    left: i === 1 ? '-10%' : '90%',
                    right: i === 2 ? '-10%' : 'auto'
                  }}
                >
                  <FaStar size={20 + i * 4} />
                </motion.div>
              ))}
            </motion.div>
            
            {/* Halo Effect */}
            <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-30", info.color.replace('from-', 'bg-'))} />
          </div>

          {/* Text Content */}
          <div className="space-y-4 relative z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white mb-2 inline-block shadow-sm",
                info.color
              )}>
                MỐC {info.medal} ĐẠT ĐƯỢC
              </span>
              <h2 className={cn("text-4xl font-black tracking-tight leading-none mb-2", t.text)}>
                {info.title}
              </h2>
              <p className={cn("text-lg font-bold opacity-70", t.sub)}>
                Bạn đã duy trì chuỗi <span className="text-orange-500">{streak} ngày</span> học tập liên tiếp!
              </p>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="py-4"
            >
              <p className={cn("text-sm font-medium italic", t.sub)}>
                "{streak >= 7 ? "Thói quen của những nhà vô địch!" : "Sự khởi đầu tuyệt vời cho hành trình chinh phục IELTS!"}"
              </p>
            </motion.div>

            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              className={cn(
                "w-full py-5 rounded-3xl text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-3 group active:scale-95 bg-gradient-to-r",
                info.color
              )}
            >
              TIẾP TỤC CHINH PHỤC
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors p-2"
          >
            <FaTimes />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StreakCelebrationModal;
