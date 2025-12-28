import React, { useState, useEffect } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import axios from 'axios';

const AISpeaking = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  // Cấu hình ghi âm
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ 
    audio: true,
    blobPropertyBag: { type: "audio/wav" },
    onStop: (blobUrl, blob) => {
      console.log("🛑 Đã dừng ghi âm.");
      const file = new File([blob], "recording.wav", { type: "audio/wav" });
      setAudioFile(file);
    }
  });

  const handleCheck = async () => {
    if (!audioFile && !mediaBlobUrl) return alert("Chưa có file ghi âm! Hãy nói lại.");
    
    setLoading(true);
    setResult(null);

    try {
      let fileToSend = audioFile;
      if (!fileToSend && mediaBlobUrl) {
        const response = await fetch(mediaBlobUrl);
        const blob = await response.blob();
        fileToSend = new File([blob], "recording.wav", { type: "audio/wav" });
      }

      const formData = new FormData();
      formData.append("audio", fileToSend);

      console.log("🚀 Đang gửi file sang Python...");
      
      const res = await axios.post('http://127.0.0.1:5000/api/speaking/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("✅ Dữ liệu Python trả về:", res.data); // Xem kỹ log này nếu lỗi
      setResult(res.data);

    } catch (error) {
      console.error("❌ Lỗi:", error);
      alert("Lỗi kết nối Server! Xem Console (F12) để biết chi tiết.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial', textAlign: 'center' }}>
      <h1 style={{ color: '#8e44ad' }}>🎙️ AI IELTS SPEAKING COACH</h1>

      {/* --- PHẦN ĐIỀU KHIỂN --- */}
      <div style={{ margin: '20px 0', padding: '30px', border: '2px dashed #bdc3c7', borderRadius: '15px', backgroundColor: '#f9f9f9' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: status === 'recording' ? 'red' : '#333' }}>
          {status === 'idle' && "💤 Sẵn sàng - Hãy bấm ghi âm"}
          {status === 'recording' && "🔴 Đang nghe bạn nói..."}
          {status === 'stopped' && "✅ Đã thu âm xong"}
        </p>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
          <button onClick={startRecording} disabled={status === 'recording'}
            style={{ padding: '12px 25px', background: status === 'recording' ? '#ccc' : '#2ecc71', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
            🎙️ Bắt đầu
          </button>
          <button onClick={stopRecording} disabled={status !== 'recording'}
            style={{ padding: '12px 25px', background: status !== 'recording' ? '#ccc' : '#e74c3c', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⏹️ Dừng lại
          </button>
        </div>

        {(status === 'stopped' || mediaBlobUrl) && (
          <div style={{ marginTop: '20px' }}>
            <audio src={mediaBlobUrl} controls style={{ width: '100%', maxWidth: '400px' }} />
            <br />
            <button onClick={handleCheck} disabled={loading}
              style={{ 
                marginTop: '20px', padding: '15px 40px', 
                background: loading ? '#95a5a6' : '#3498db', 
                color: 'white', border: 'none', borderRadius: '8px', 
                fontSize: '18px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
              {loading ? '⏳ AI ĐANG MỔ BĂNG...' : '🚀 CHẤM ĐIỂM NGAY'}
            </button>
          </div>
        )}
      </div>

      {/* --- PHẦN HIỂN THỊ KẾT QUẢ (QUAN TRỌNG NHẤT) --- */}
      {result && (
        <div style={{ textAlign: 'left', marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px', animation: 'fadeIn 0.5s' }}>
          
          {/* 1. Transcript & Overall Score */}
          <div style={{ background: '#dff9fb', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#2c3e50', textAlign: 'center' }}>
                {result.overall_score || "Đang chấm..."}
            </h2>
            <hr style={{ opacity: 0.2 }} />
            <strong>🗣️ Transcript (AI nghe được):</strong>
            <p style={{ fontStyle: 'italic', fontSize: '18px', color: '#555' }}>
                "{result.transcript_display || result.transcript}" 
            </p>
          </div>

          {/* 2. Điểm thành phần (Radar Chart Data) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {/* Box điểm */}
            {['Fluency', 'Lexical', 'Grammar', 'Pronunciation'].map((criteria) => (
                <div key={criteria} style={{ background: '#ecf0f1', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}>{criteria}</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2980b9' }}>
                        {result.radar_chart ? result.radar_chart[criteria] : "?"}/9.0
                    </div>
                </div>
            ))}
          </div>

          {/* 3. Phân tích chi tiết (Mistakes Timeline) */}
          {result.mistakes_timeline && result.mistakes_timeline.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#c0392b', borderBottom: '2px solid #c0392b', paddingBottom: '5px' }}>❌ Timeline Lỗi (Chi tiết):</h3>
              {result.mistakes_timeline.map((item, idx) => (
                <div key={idx} style={{ 
                    padding: '12px', borderLeft: '4px solid #e74c3c', 
                    background: '#fff', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ color: '#c0392b', fontWeight: 'bold', fontSize: '18px' }}>{item.word}</span> 
                    <span style={{ fontSize: '12px', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Lỗi</span>
                  </div>
                  <div style={{ color: '#555' }}>Problem: {item.error}</div>
                  <div style={{ color: '#27ae60', fontWeight: 'bold' }}>💡 Fix: {item.fix}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>
                🎉 Quá đỉnh! Không phát hiện lỗi nghiêm trọng nào.
            </p>
          )}

          {/* 4. Nhận xét chi tiết (Feedback Text) */}
          {result.detailed_feedback && (
             <div style={{ background: '#fef9e7', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <h3 style={{ color: '#d35400', marginTop: 0 }}>💡 Nhận xét của Giám khảo:</h3>
                <p><strong>🧠 Ngữ pháp & Từ vựng:</strong> {result.detailed_feedback.vocab_grammar}</p>
                <p><strong>🗣️ Phát âm:</strong> {result.detailed_feedback.pronunciation}</p>
                <p><strong>🌊 Độ trôi chảy:</strong> {result.detailed_feedback.fluency}</p>
             </div>
          )}

          {/* 5. Better Version */}
          {result.better_version && (
             <div style={{ background: '#e8f8f5', padding: '20px', borderRadius: '10px', border: '1px solid #1abc9c' }}>
                <h3 style={{ color: '#16a085', marginTop: 0 }}>✨ Phiên bản Band 9.0 (Tham khảo):</h3>
                <p style={{ fontStyle: 'italic', fontSize: '16px' }}>{result.better_version}</p>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AISpeaking;