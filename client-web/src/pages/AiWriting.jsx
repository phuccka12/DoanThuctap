import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const clamp10 = (n) => Math.max(0, Math.min(10, Number(n || 0)));

export default function AIWriting() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  // Đếm số từ
  const words = useMemo(() => {
    const t = answer.trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }, [answer]);

  const handleCheck = async () => {
    setErr('');
    setResult(null);

    if (!prompt.trim()) return setErr('Vui lòng nhập đề bài (Topic).');
    if (!answer.trim()) return setErr('Vui lòng nhập bài làm của bạn.');

    setLoading(true);
    try {
      // Gọi API Python (Port 5000)
      const payload = { 
          text: answer.trim(), 
          topic: prompt.trim() 
      };
      
      const res = await axios.post('http://127.0.0.1:5000/api/writing/check', payload);
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setErr('Không kết nối được server Python (Kiểm tra Port 5000).');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.better_version) {
      navigator.clipboard.writeText(result.better_version);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Cấu hình Biểu đồ Radar (Khớp với keys mới: GRA, LR, CC, TR)
  const chartData = useMemo(() => {
    if (!result || !result.radar_chart) return null;
    const { GRA, LR, CC, TR } = result.radar_chart;
    
    return {
      labels: ['Grammar (GRA)', 'Lexical (LR)', 'Coherence (CC)', 'Task Response (TR)'],
      datasets: [{
        label: 'Band Score',
        data: [clamp10(GRA), clamp10(LR), clamp10(CC), clamp10(TR)],
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderColor: '#0891b2',
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        borderWidth: 2,
        pointRadius: 5,
      }],
    };
  }, [result]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0, max: 9,
        ticks: { stepSize: 1, backdropColor: 'transparent', color: '#0891b2' },
        grid: { color: '#cffafe' },
        angleLines: { color: '#cffafe' },
        pointLabels: { color: '#155e75', font: { size: 11, weight: '700' } }
      },
    },
  }), []);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', padding: '3rem 1rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#0e7490', marginBottom: '0.5rem' }}>
            ✍️ AI IELTS WRITING MENTOR
          </h1>
          <p style={{ color: '#0891b2', fontSize: '1.2rem' }}>Chấm điểm gắt gao - Phân tích chuyên sâu - Gợi ý từ vựng</p>
        </div>

        {/* INPUT SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            
            {/* Topic Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#0e7490', marginBottom: '0.5rem' }}>TOPIC / QUESTION:</label>
              <input 
                value={prompt} onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Ex: Some people say that music is a good way of bringing people together..." 
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #cffafe', fontSize: '16px', outline: 'none' }} 
              />
            </div>

            {/* Essay Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 'bold', color: '#0e7490' }}>YOUR ESSAY:</label>
                <span style={{ background: '#ecfeff', padding: '2px 10px', borderRadius: '10px', color: '#0891b2', fontWeight: 'bold' }}>{words} words</span>
              </div>
              <textarea 
                rows={10} value={answer} onChange={(e) => setAnswer(e.target.value)} 
                placeholder="Paste your essay here..." 
                style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #cffafe', fontSize: '16px', outline: 'none', resize: 'vertical', minHeight: '200px' }} 
              />
            </div>

            {/* Error Message */}
            {err && <div style={{ color: '#e74c3c', background: '#fadbd8', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold', textAlign: 'center' }}>⚠️ {err}</div>}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleCheck} disabled={loading} style={{ flex: 2, background: loading ? '#95a5a6' : '#0891b2', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
                {loading ? '⏳ ĐANG PHÂN TÍCH (SẼ HƠI LÂU)...' : '🚀 CHẤM ĐIỂM NGAY'}
              </button>
              <button onClick={() => { setPrompt(''); setAnswer(''); setResult(null); }} style={{ flex: 1, background: 'white', color: '#e74c3c', border: '2px solid #fadbd8', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                XÓA
              </button>
            </div>
          </div>
        </div>

        {/* --- RESULT SECTION --- */}
        {result && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            
            {/* 1. OVERALL & RADAR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Score Card */}
              <div style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)', borderRadius: '20px', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(6,182,212,0.3)' }}>
                <h3 style={{ margin: 0, opacity: 0.9 }}>OVERALL BAND</h3>
                <h1 style={{ fontSize: '5rem', margin: '10px 0', fontWeight: '900' }}>{result.overall_score?.replace('Band ', '') || '?'}</h1>
                <div style={{ fontSize: '14px', background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px' }}>Strict Assessment</div>
              </div>

              {/* Chart */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', border: '1px solid #cffafe', height: '300px' }}>
                <Radar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* 2. SYSTEM FEEDBACK (New Feature) */}
            {result.system_feedback && (
              <div style={{ background: '#fff3cd', borderLeft: '5px solid #ffc107', padding: '20px', borderRadius: '10px', marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0, color: '#d35400' }}>🤖 BÁO CÁO KỸ THUẬT (SYSTEM REPORT)</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#5e480e' }}>
                  {result.system_feedback.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '5px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. DETAILED ANALYSIS (4 Criteria) */}
            {result.detailed_analysis && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                 <AnalysisBox title="Task Response (TR)" content={result.detailed_analysis.task_response} color="#2ecc71" />
                 <AnalysisBox title="Coherence & Cohesion (CC)" content={result.detailed_analysis.coherence_cohesion} color="#3498db" />
                 <AnalysisBox title="Lexical Resource (LR)" content={result.detailed_analysis.lexical_resource} color="#9b59b6" />
                 <AnalysisBox title="Grammar Accuracy (GRA)" content={result.detailed_analysis.grammar_accuracy} color="#e74c3c" />
              </div>
            )}

            {/* 4. VOCAB CHALLENGE (New Feature) */}
            {result.topic_vocab_suggestion && result.topic_vocab_suggestion.length > 0 && (
              <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '2px solid #e0f2fe' }}>
                <h3 style={{ color: '#0e7490', borderBottom: '2px solid #cffafe', paddingBottom: '10px' }}>💡 TỪ VỰNG NÂNG CAO (NÊN DÙNG)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  {result.topic_vocab_suggestion.map((vocab, idx) => (
                    <div key={idx} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803d' }}>{vocab.word}</div>
                      <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#555', margin: '5px 0' }}>{vocab.meaning}</div>
                      <div style={{ fontSize: '13px', color: '#166534', background: 'rgba(21, 128, 61, 0.1)', padding: '5px', borderRadius: '5px' }}>Context: {vocab.context}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. BETTER VERSION */}
            {result.better_version && (
              <div style={{ background: 'linear-gradient(to right, #ffffff, #f0fdfa)', borderRadius: '20px', padding: '2rem', border: '2px solid #14b8a6', boxShadow: '0 10px 30px rgba(20, 184, 166, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#0f766e' }}>✨ BÀI MẪU BAND 9.0 (BETTER VERSION)</h3>
                  <button onClick={handleCopy} style={{ background: copied ? '#14b8a6' : 'white', color: copied ? 'white' : '#14b8a6', border: '1px solid #14b8a6', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copied ? 'Đã Copy!' : 'Copy Bài Mẫu'}
                  </button>
                </div>
                <p style={{ lineHeight: '1.8', color: '#333', whiteSpace: 'pre-line' }}>{result.better_version}</p>
              </div>
            )}

          </div>
        )}

      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// Component con để hiển thị từng ô phân tích
const AnalysisBox = ({ title, content, color }) => (
  <div style={{ background: 'white', borderRadius: '15px', padding: '1.5rem', borderTop: `5px solid ${color}`, boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
    <h4 style={{ margin: '0 0 10px 0', color: color, textTransform: 'uppercase' }}>{title}</h4>
    <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>{content}</p>
  </div>
);