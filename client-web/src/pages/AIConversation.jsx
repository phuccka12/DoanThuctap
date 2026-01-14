import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import {
  FaMicrophone,
  FaStop,
  FaRedo,
  FaFire,
  FaTrophy,
  FaComments,
  FaRobot,
  FaUser,
  FaCrown,
  FaStar,
  FaGraduationCap,
  FaHeadphones
} from 'react-icons/fa';

const AIConversation = () => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your IELTS Examiner. Let's talk about your hobbies. Do you have any hobbies?" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Theme colors
  const themeColors = useMemo(() => ({
    light: {
      page: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
      card: 'bg-white',
      border: 'border-indigo-200',
      text: 'text-slate-800',
      sub: 'text-slate-600',
      chatBg: 'bg-gradient-to-br from-slate-50 to-indigo-50',
      userBubble: 'bg-gradient-to-br from-indigo-600 to-purple-600',
      aiBubble: 'bg-white border-indigo-200',
      hover: 'hover:bg-indigo-50',
    },
    dark: {
      page: 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900',
      card: 'bg-slate-800/50',
      border: 'border-slate-700',
      text: 'text-white',
      sub: 'text-slate-300',
      chatBg: 'bg-slate-800/30',
      userBubble: 'bg-gradient-to-br from-indigo-600 to-purple-600',
      aiBubble: 'bg-slate-700/50 border-slate-600',
      hover: 'hover:bg-slate-700',
    }
  }), []);

  const theme = isDark ? themeColors.dark : themeColors.light;

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

      const res = await axios.post('http://127.0.0.1:5000/api/speaking/conversation', formData, {
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
      alert("Lỗi kết nối Server! Xem Console.");
    }
    setIsProcessing(false);
  };

  const handleReset = () => {
    setMessages([{ role: 'ai', text: "Let's start over. Tell me about your hometown?" }]);
  };

  return (
    <div className={cn("min-h-screen p-6 transition-colors duration-300", theme.page)}>
      <div className="max-w-5xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className={cn(
          "rounded-3xl border p-6 mb-4 relative overflow-hidden",
          theme.card,
          theme.border
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-full h-2",
            "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          )} />
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={cn("text-3xl font-bold mb-1", theme.text)}>
                <FaComments className="inline mr-3 text-indigo-500" />
                IELTS Speaking Practice
              </h1>
              <p className={theme.sub}>Real-time conversation with AI Examiner</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm",
                isDark ? "bg-gradient-to-r from-orange-500/20 to-red-500/20" : "bg-gradient-to-r from-orange-100 to-red-100"
              )}>
                <FaFire className="text-orange-500 text-lg" />
                <span className={theme.text}>10 Day Streak</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm",
                isDark ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20" : "bg-gradient-to-r from-yellow-100 to-amber-100"
              )}>
                <FaTrophy className="text-yellow-500 text-lg" />
                <span className={theme.text}>Level 18</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className={cn(
          "flex-1 rounded-3xl border p-6 mb-4 overflow-hidden flex flex-col",
          theme.card,
          theme.border
        )}>
          {/* Messages Area */}
          <div className={cn(
            "flex-1 overflow-y-auto rounded-2xl p-6 space-y-4",
            theme.chatBg
          )}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#4F46E5 #1E293B' : '#A5B4FC #E0E7FF'
          }}>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-end gap-3 animate-fadeIn",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* AI Avatar */}
                {msg.role === 'ai' && (
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md",
                    isDark 
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600" 
                      : "bg-gradient-to-br from-indigo-500 to-purple-500"
                  )}>
                    <FaRobot className="text-white text-lg" />
                  </div>
                )}
                
                {/* Message Bubble */}
                <div className={cn(
                  "max-w-[75%] px-5 py-3 rounded-2xl text-base shadow-lg leading-relaxed transition-all duration-300 hover:scale-[1.02]",
                  msg.role === 'user' 
                    ? cn(theme.userBubble, "text-white rounded-br-none") 
                    : cn(theme.aiBubble, theme.text, "border rounded-bl-none")
                )}>
                  <p>{msg.text}</p>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/20">
                      <FaHeadphones className={cn("text-xs", isDark ? "text-indigo-400" : "text-indigo-500")} />
                      <span className={cn("text-xs", theme.sub)}>Listen & Respond</span>
                    </div>
                  )}
                </div>
                
                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md",
                    isDark 
                      ? "bg-gradient-to-br from-purple-600 to-pink-600" 
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  )}>
                    <FaUser className="text-white text-sm" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isProcessing && (
              <div className="flex items-center gap-3 ml-14 animate-fadeIn">
                <div className="flex gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    isDark ? "bg-indigo-400" : "bg-indigo-500"
                  )} style={{ animationDelay: '0ms' }} />
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    isDark ? "bg-purple-400" : "bg-purple-500"
                  )} style={{ animationDelay: '150ms' }} />
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    isDark ? "bg-pink-400" : "bg-pink-500"
                  )} style={{ animationDelay: '300ms' }} />
                </div>
                <span className={cn("text-sm italic", theme.sub)}>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Control Panel */}
          <div className="mt-4 space-y-3">
            {/* Status Badge */}
            <div className="flex justify-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm",
                status === 'recording' 
                  ? isDark ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"
                  : isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              )}>
                {status === 'recording' ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Recording...
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Ready to speak
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {status !== 'recording' ? (
                <button 
                  onClick={startRecording} 
                  disabled={isProcessing}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-300",
                    "flex items-center justify-center gap-3",
                    isProcessing 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-105"
                  )}
                >
                  <FaMicrophone className="text-xl" />
                  Press to Speak
                </button>
              ) : (
                <button 
                  onClick={stopRecording} 
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold text-lg text-white shadow-lg",
                    "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
                    "animate-pulse transition-all duration-300 hover:scale-105",
                    "flex items-center justify-center gap-3"
                  )}
                >
                  <FaStop className="text-xl" />
                  Stop & Send
                </button>
              )}

              <button 
                onClick={handleReset} 
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105",
                  isDark 
                    ? "bg-slate-700 hover:bg-slate-600 text-slate-300" 
                    : "bg-slate-200 hover:bg-slate-300 text-slate-600",
                  "shadow-md"
                )}
                title="New Topic"
              >
                <FaRedo className="text-xl" />
              </button>
            </div>

            {/* Tips Section */}
            <div className={cn(
              "rounded-xl p-4 flex items-start gap-3",
              isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-200"
            )}>
              <FaGraduationCap className={cn("text-xl mt-0.5", isDark ? "text-indigo-400" : "text-indigo-600")} />
              <div>
                <p className={cn("font-semibold text-sm mb-1", theme.text)}>Pro Tip</p>
                <p className={cn("text-xs", theme.sub)}>
                  Speak naturally and clearly. The AI examiner will respond with follow-up questions just like a real IELTS test!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(
            "rounded-2xl border p-4 text-center",
            theme.card,
            theme.border
          )}>
            <div className={cn("text-2xl font-bold", theme.text)}>
              {messages.filter(m => m.role === 'user').length}
            </div>
            <div className={cn("text-xs", theme.sub)}>Your Responses</div>
          </div>
          <div className={cn(
            "rounded-2xl border p-4 text-center",
            theme.card,
            theme.border
          )}>
            <div className="text-2xl font-bold">
              <FaStar className={cn("inline", isDark ? "text-yellow-400" : "text-yellow-500")} />
            </div>
            <div className={cn("text-xs", theme.sub)}>Active Session</div>
          </div>
          <div className={cn(
            "rounded-2xl border p-4 text-center",
            theme.card,
            theme.border
          )}>
            <div className="text-2xl font-bold">
              <FaCrown className={cn("inline", isDark ? "text-purple-400" : "text-purple-500")} />
            </div>
            <div className={cn("text-xs", theme.sub)}>Pro Mode</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConversation;