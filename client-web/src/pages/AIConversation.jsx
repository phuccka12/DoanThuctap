import React, { useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axiosInstance from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaMicrophone, FaStop, FaRedo, FaFire, FaTrophy, FaRobot, FaUser, FaHeadphones, FaLightbulb, FaCoins, FaChevronLeft 
} from 'react-icons/fa';
import LoadingCat from '../components/shared/LoadingCat';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AIConversation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [realtimeText, setRealtimeText] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const hasFetchedInitial = useRef(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const stats = user?.gamification_data || { streak: 0, level: 1, coins: 0 };

  const scrollToBottom = (force = false) => {
    if (force || shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    if (!hasFetchedInitial.current) {
        fetchInitialGreeting();
        hasFetchedInitial.current = true;
    }
  }, []);

  const fetchInitialGreeting = async () => {
    setIsProcessing(true);
    try {
      const res = await axiosInstance.get('/ai/start');
      const data = res.data;
      setMessages([{ role: 'ai', text: data.text }]);
      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.play().catch(e => console.error("Audio Play Error:", e));
      }
    } catch (error) {
      setMessages([{ role: 'ai', text: "Hello! Ready for your IELTS practice?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const { status, startRecording, stopRecording } = useReactMediaRecorder({
    audio: true,
    blobPropertyBag: { type: "audio/wav" },
    onStart: () => startRealtimeRecognition(),
    onStop: (blobUrl, blob) => {
      stopRealtimeRecognition();
      handleSendAudio(blob);
    }
  });

  const startRealtimeRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (!event.results[i].isFinal) interimTranscript += event.results[i][0].transcript;
      }
      setRealtimeText(interimTranscript);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRealtimeRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRealtimeText('');
    }
  };

  const handleSendAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const audioFile = new File([audioBlob], "voice.wav", { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("history", JSON.stringify(messages));
      const res = await axiosInstance.post('/ai/conversation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      setMessages(prev => [...prev, 
        { role: 'user', text: data.user_transcript, pitch: data.pitch_data, correction: data.correction },
        { role: 'ai', text: data.ai_response_text }
      ]);
      if (data.ai_audio_url) {
        const audio = new Audio(data.ai_audio_url);
        audio.play();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    fetchInitialGreeting();
  };

  return (
    <div className="h-screen bg-[#08090D] relative flex items-center justify-center p-0 md:p-10 overflow-hidden font-sans select-none">
      
      {/* Immersive Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[160px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* HUMANIZED POPUP WIDGET - WIDER LAYOUT */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl h-full md:h-[90vh] bg-[#14171E] md:rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-20 relative border-none md:border md:border-white/5"
      >
        {/* Minimalist Header */}
        <div className="shrink-0 p-6 px-8 flex items-center justify-between bg-white/[0.02] backdrop-blur-3xl z-30">
          <div className="flex items-center gap-5">
             <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                <FaChevronLeft size={16} />
             </button>
             <div className="relative group">
                {/* Human Avatar instead of Robot */}
                <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                   <span className="text-white font-black text-xl">A</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#14171E] rounded-full shadow-lg" />
             </div>
             <div>
                <h2 className="text-white font-black text-lg tracking-tight">Alex</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">IELTS Specialist</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                <FaFire className="text-indigo-400" />
                <span className="text-indigo-400 font-black text-xs">{stats.streak} Streak</span>
             </div>
             <button onClick={handleReset} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                <FaRedo size={12} />
             </button>
          </div>
        </div>

        {/* Chat Body - Ultra Smooth Scroll */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 md:px-10 py-10 space-y-10 custom-scrollbar overscroll-contain"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {/* Human-like bubbles: softer gradients and clean typography */}
                  <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white/10 border border-white/5 text-slate-50 rounded-bl-none font-medium'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {msg.correction && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="mt-3 bg-emerald-500/10 border border-emerald-500/10 px-4 py-2.5 rounded-2xl text-[11px] text-emerald-300 flex items-start gap-2 shadow-sm">
                      <FaLightbulb className="shrink-0 mt-0.5 text-emerald-400" />
                      <span>{msg.correction}</span>
                    </motion.div>
                  )}

                  {msg.role === 'user' && msg.pitch && msg.pitch.length > 0 && (
                     <div className="w-32 h-8 mt-3 bg-white/5 rounded-full p-1.5 opacity-40 border border-white/5 flex items-center justify-center">
                        <Line 
                            data={{
                               labels: msg.pitch.map((_, i) => i),
                               datasets: [{ data: msg.pitch, borderColor: '#818cf8', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.4 }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false }, tooltip: { enabled: false } } }}
                        />
                     </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-4 bg-white/5 rounded-full w-fit ml-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer - Minimalist & Interactive */}
        <div className="shrink-0 p-8 pb-10 bg-white/[0.03] backdrop-blur-3xl border-t border-white/5">
          <div className="mb-4 h-6 flex items-center justify-center">
             <AnimatePresence>
               {status === 'recording' && realtimeText && (
                  <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-indigo-400 font-medium bg-indigo-400/5 px-4 py-1.5 rounded-full italic">
                    "{realtimeText}..."
                  </motion.p>
               )}
             </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-4">
            {status !== 'recording' ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={startRecording} disabled={isProcessing}
                className="flex-1 h-16 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative z-10 font-black">
                  <FaMicrophone size={16} />
                </div>
                <span className="relative z-10">Bắt đầu trả lời</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="flex-1 h-16 bg-linear-to-r from-rose-500 to-rose-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-rose-500/30 flex items-center justify-center gap-3 relative"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 animate-ping absolute" />
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative z-10">
                  <FaStop />
                </div>
                <span>Dừng & Phân tích</span>
              </motion.button>
            )}
          </div>

          <p className="mt-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-50">
            Powered by IELTS AI Specialist
          </p>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
};

export default AIConversation;