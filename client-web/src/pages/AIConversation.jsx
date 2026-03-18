import React, { useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axiosInstance from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaMicrophone, FaStop, FaRedo, FaFire, FaTrophy, FaComments, 
  FaRobot, FaUser, FaHeadphones, FaLightbulb, FaCoins, FaChevronLeft 
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';

const AIConversation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your IELTS Examiner. Let's talk about your hobbies. Do you have any hobbies?" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const stats = user?.gamification_data || { streak: 0, level: 1, coins: 0 };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const { status, startRecording, stopRecording } = useReactMediaRecorder({
    audio: true,
    blobPropertyBag: { type: "audio/wav" },
    onStop: (blobUrl, blob) => {
      handleSendAudio(blob);
    }
  });

  const handleSendAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const audioFile = new File([audioBlob], "voice_input.wav", { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("history", JSON.stringify(messages));

      const res = await axiosInstance.post('/ai/conversation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = res.data;
      const newMessages = [
        ...messages,
        { role: 'user', text: data.user_transcript },
        { role: 'ai', text: data.ai_response_text }
      ];
      setMessages(newMessages);

      if (data.ai_audio_url) {
        const audio = new Audio(data.ai_audio_url);
        audio.play().catch(e => console.error("Lỗi phát audio:", e));
      }
    } catch (error) {
      console.error("Lỗi hội thoại:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setMessages([{ role: 'ai', text: "Let's start over. Tell me about your hometown?" }]);
  };

  return (
    <div className="min-h-screen bg-[#0F1117] relative flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-float-delayed" />

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col z-10">
        {/* Unified Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
              title="Quay lại Dashboard"
            >
              <FaChevronLeft />
            </button>
            <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FaComments className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Hội thoại IELTS AI</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Speaking Practice • Real-time Feedback</p>
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 glass-card p-4 md:p-8 flex flex-col overflow-hidden relative"
          >
            {/* Subtle top shade */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-[#0F1117]/50 to-transparent pointer-events-none z-10 rounded-t-[2.5rem]" />
            
            <div 
              className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-10"
              style={{ scrollBehavior: 'smooth' }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      msg.role === 'ai' 
                        ? 'bg-linear-to-br from-indigo-500 to-purple-600' 
                        : 'bg-linear-to-br from-slate-700 to-slate-800 border border-white/10'
                    }`}>
                      {msg.role === 'ai' ? <FaRobot className="text-white" /> : <FaUser className="text-slate-300" />}
                    </div>
                    
                    <div className={`max-w-[80%] md:max-w-[70%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-linear-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
                    }`}>
                      {msg.text}
                      {msg.role === 'ai' && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          <FaHeadphones className="animate-pulse" /> Nghe & Phản hồi
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="flex flex-col items-center justify-center py-4"
                >
                  <LoadingCat size={120} text="AI đang trả lời..." />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="mt-4 pt-6 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                <div className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {status === 'recording' ? 'Đang ghi âm...' : 'Sẵn sàng'}
                </span>
              </div>

              <div className="flex-1 flex gap-3 w-full">
                {status !== 'recording' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <FaMicrophone /> Bắt đầu nói
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={stopRecording}
                    className="flex-1 py-4 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 animate-pulse flex items-center justify-center gap-3"
                  >
                    <FaStop /> Dừng & Gửi
                  </motion.button>
                )}

                <button
                  onClick={handleReset}
                  className="w-14 h-14 glass-panel flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-2xl"
                  title="Làm mới chủ đề"
                >
                  <FaRedo />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tip Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 glass-panel p-5 flex items-start gap-4 border-indigo-500/20"
          >
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
              <FaLightbulb className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Mẹo nhỏ</p>
              <p className="text-slate-400 text-xs leading-relaxed">Hãy nói tự nhiên như đang hội thoại với người thật. AI sẽ phản hồi và đưa ra các câu hỏi mở rộng để bạn rèn luyện phản xạ!</p>
            </div>
          </motion.div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default AIConversation;