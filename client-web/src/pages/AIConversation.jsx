import React, { useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axios from 'axios';

const AIConversation = () => {
  // State lưu lịch sử trò chuyện
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your IELTS Examiner. Let's talk about your hobbies. Do you have any hobbies?" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ref để cuộn
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Cấu hình ghi âm
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

      // Gọi API Python
      const res = await axios.post('http://127.0.0.1:5000/api/speaking/conversation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = res.data;

      // Cập nhật Chat
      const newMessages = [
        ...messages,
        { role: 'user', text: data.user_transcript },
        { role: 'ai', text: data.ai_response_text }
      ];
      setMessages(newMessages);

      // Auto Play Audio
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
    <div className="max-w-2xl mx-auto p-4 h-[90vh] flex flex-col font-sans">
      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-700 tracking-tight">
          🗣️ IELTS SPEAKING <span className="text-blue-600">PART 1 & 3</span>
        </h1>
        <p className="text-slate-500 text-sm">Real-time Conversation with AI Examiner</p>
      </div>
      
      {/* KHUNG CHAT (Màn hình chính) */}
      <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner mb-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {/* Avatar AI */}
            {msg.role === 'ai' && (
              <div className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full mr-2 shadow-sm text-lg">
                🤖
              </div>
            )}
            
            {/* Bong bóng tin nhắn */}
            <div className={`
              max-w-[75%] px-5 py-3 rounded-2xl text-base shadow-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}
            `}>
              {msg.text}
            </div>
            
            {/* Avatar User */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full ml-2 text-lg">
                👤
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-slate-400 text-sm italic ml-12">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse delay-75">●</span>
            <span className="animate-pulse delay-150">●</span>
            <span>AI đang suy nghĩ...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* KHU VỰC ĐIỀU KHIỂN */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex w-full gap-3">
          {status !== 'recording' ? (
            <button 
              onClick={startRecording} 
              disabled={isProcessing}
              className={`flex-1 py-4 rounded-full font-bold text-lg text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:shadow-green-500/30'}
              `}
            >
              🎙️ BẤM ĐỂ TRẢ LỜI
            </button>
          ) : (
            <button 
              onClick={stopRecording} 
              className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-red-500/30 animate-pulse transition-all flex items-center justify-center gap-2"
            >
              ⏹️ NÓI XONG (GỬI)
            </button>
          )}

          <button 
            onClick={handleReset} 
            className="w-14 h-14 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors"
            title="Đổi chủ đề"
          >
            🔄
          </button>
        </div>
        
        <p className={`text-sm font-medium ${status === 'recording' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
          {status === 'recording' ? "🔴 Đang nghe bạn nói..." : "💤 Sẵn sàng"}
        </p>
      </div>
    </div>
  );
};

export default AIConversation;