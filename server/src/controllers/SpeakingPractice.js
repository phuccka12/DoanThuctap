/**
 * SpeakingPractice Controller
 * Lấy dữ liệu từ SpeakingQuestion model và Topic model để phục vụ
 * trang luyện nói mới (SpeakingPractice.jsx).
 * Chấm điểm: proxy qua Python AI service (app.py).
 */
const SpeakingQuestion = require('../models/SpeakingQuestion');
const Topic            = require('../models/Topic');
const mongoose         = require('mongoose');
const axios            = require('axios');
const FormData         = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

// ─── GET /api/speaking-practice/topics ────────────────────────────────────────
// Trả về danh sách topic kèm số lượng câu hỏi speaking theo topic
exports.getTopics = async (req, res) => {
  try {
    // Aggregate: group SpeakingQuestion theo topic_id → đếm
    const counts = await SpeakingQuestion.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$topic_id', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach(c => { countMap[String(c._id)] = c.count; });

    // Lấy topics có câu hỏi
    const topicIds = counts.map(c => c._id).filter(Boolean);
    const topics = await Topic.find({ _id: { $in: topicIds } })
      .select('name level cover_image description')
      .lean();

    const result = topics.map(t => ({
      ...t,
      question_count: countMap[String(t._id)] || 0,
    })).sort((a, b) => b.question_count - a.question_count);

    res.json({ message: 'OK', data: result });
  } catch (e) {
    console.error('getTopics error:', e);
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─── GET /api/speaking-practice/questions ─────────────────────────────────────
// Trả về câu hỏi theo topic, part, difficulty
// Query: topic_id, part (free|p1|p2|p3), difficulty, limit
exports.getQuestions = async (req, res) => {
  try {
    const { topic_id, part, difficulty, limit = 10 } = req.query;
    const query = { is_active: true };

    if (topic_id && mongoose.Types.ObjectId.isValid(topic_id)) {
      query.topic_id = topic_id;
    }
    if (part)       query.part = part;
    if (difficulty) query.difficulty = difficulty;

    const questions = await SpeakingQuestion.find(query)
      .populate('topic_id', 'name level cover_image')
      .sort({ part: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ message: 'OK', data: questions });
  } catch (e) {
    console.error('getQuestions error:', e);
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─── GET /api/speaking-practice/warmup ────────────────────────────────────────
// Trả về 1 câu hỏi "free" / dễ để warm-up theo topic
exports.getWarmup = async (req, res) => {
  try {
    const { topic_id } = req.query;
    const query = { is_active: true, part: { $in: ['free', 'p1'] }, difficulty: 'easy' };
    if (topic_id && mongoose.Types.ObjectId.isValid(topic_id)) {
      query.topic_id = topic_id;
    }

    // Lấy ngẫu nhiên 1 câu
    const count = await SpeakingQuestion.countDocuments(query);
    const skip  = count > 0 ? Math.floor(Math.random() * count) : 0;
    const q = await SpeakingQuestion.findOne(query)
      .skip(skip)
      .populate('topic_id', 'name')
      .lean();

    // Fallback: nếu không có câu easy → lấy bất kỳ
    if (!q) {
      const fallbackQ = { question: 'Tell me something you enjoy doing in your free time.', follow_up_questions: [] };
      return res.json({ message: 'OK', data: fallbackQ });
    }

    res.json({ message: 'OK', data: q });
  } catch (e) {
    console.error('getWarmup error:', e);
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─── POST /api/speaking-practice/evaluate ─────────────────────────────────────
// Nhận: multipart/form-data: audio, question, phase, sample_answer, frontend_data
// Proxy sang Python AI app.py → /api/speaking-practice/evaluate
exports.evaluate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Thiếu file audio' });
    }

    const form = new FormData();
    form.append('audio',         req.file.buffer, {
      filename:    req.file.originalname || 'recording.webm',
      contentType: req.file.mimetype     || 'audio/webm',
    });
    form.append('question',      req.body.question      || '');
    form.append('phase',         req.body.phase         || 'main');
    form.append('sample_answer', req.body.sample_answer || '');
    form.append('frontend_data', req.body.frontend_data || '{}');

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/speaking-practice/evaluate`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120_000,
      },
    );

    // Increment times_attempted for the question if question_id provided
    if (req.body.question_id && mongoose.Types.ObjectId.isValid(req.body.question_id)) {
      SpeakingQuestion.findByIdAndUpdate(req.body.question_id, {
        $inc: { times_attempted: 1 },
      }).catch(() => {});
    }

    res.json(response.data);
  } catch (e) {
    console.error('evaluate error:', e.message);

    // ── Phao Cứu Sinh Tầng Node ──────────────────────────────────────────────
    // Khi Python AI offline hoàn toàn → tự tính điểm từ frontend_data
    if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT' || e.response?.status >= 500) {
      try {
        let feData = {};
        try { feData = JSON.parse(req.body.frontend_data || '{}'); } catch (_) {}

        const wpm              = parseFloat(feData.wpm || 0);
        const hesitationCount  = parseInt(feData.hesitation_count || 0);
        const transcript       = (feData.browser_transcript || '').toLowerCase().trim();
        const sampleAnswer     = (req.body.sample_answer || '').toLowerCase().trim();

        const transcriptWords  = transcript.match(/\b\w+\b/g) || [];
        const sampleWords      = sampleAnswer.match(/\b\w+\b/g) || [];

        // ==========================================
        // 1. FLUENCY (Độ trôi chảy & Nhịp điệu)
        // ==========================================
        let fluency = 3.0;
        if (wpm >= 110 && wpm <= 160) fluency = 8.0;
        else if (wpm >= 90)           fluency = 6.5;
        else if (wpm >= 60)           fluency = 5.0;
        else if (wpm > 0)             fluency = 4.0;
        
        // Phạt ngập ngừng (hesitation) cứng rắn hơn
        fluency = Math.max(3.0, fluency - (hesitationCount * 0.5));
        
        // ==========================================
        // 2. PRONUNCIATION (Chấm phát âm bằng Soundex)
        // ==========================================
        // Hàm tạo mã ngữ âm Soundex (Chuyển chữ thành âm thanh)
        const getSoundex = (word) => {
          if (!word) return '';
          let codes = { b:1, f:1, p:1, v:1, c:2, g:2, j:2, k:2, q:2, s:2, x:2, z:2, d:3, t:3, l:4, m:5, n:5, r:6 };
          let res = word[0];
          for (let i = 1; i < word.length; i++) {
            let c = codes[word[i]];
            if (c && c !== codes[word[i-1]]) res += c;
          }
          return (res + '000').substring(0, 4).toUpperCase();
        };

        let pron = 3.0;
        if (transcriptWords.length > 0 && sampleWords.length > 0) {
          const sampleSounds = sampleWords.map(getSoundex);
          const userSounds = transcriptWords.map(getSoundex);
          
          // Đếm số lượng "âm thanh" trùng khớp (Không cần trùng mặt chữ)
          let matchedSounds = 0;
          userSounds.forEach(sound => {
            if (sampleSounds.includes(sound)) matchedSounds++;
          });
          
          const soundAccuracy = matchedSounds / Math.max(sampleSounds.length, transcriptWords.length);
          pron = Math.max(3.0, Math.min(9.0, soundAccuracy * 9.0 + 1.5)); // +1.5 là điểm bù trừ châm chước
        }

        // ==========================================
        // 3. LEXICAL RESOURCE (TTR - Đa dạng từ vựng + N-gram)
        // ==========================================
        let lexical = 3.0;
        let grammar = 3.0;

        if (transcript && sampleAnswer) {
          const { unigramScore, bigramScore } = computeNgramSimilarity(sampleAnswer, transcript);
          
          // Tính TTR (Type-Token Ratio) để xem User có bị lặp từ không
          const uniqueWords = new Set(transcriptWords).size;
          const ttr = transcriptWords.length > 0 ? (uniqueWords / transcriptWords.length) : 0;
          
          // Điểm Lexical = Độ khớp từ vựng (Unigram) kết hợp với độ phong phú (TTR)
          const lexicalRaw = (unigramScore * 0.7 + ttr * 0.3) * 9.0;
          lexical = Math.max(3.0, Math.min(9.0, lexicalRaw + 1.0)); // Thưởng 1.0 vì dám nói
          
          // Điểm Grammar = Thuật toán BLEU Bigram (Bắt lỗi sai cấu trúc)
          grammar = Math.max(3.0, Math.min(9.0, bigramScore * 9.0 + 1.0)); 
        }

        // ==========================================
        // 4. LÀM TRÒN VÀ TỔNG HỢP 
        // ==========================================
        fluency = parseFloat(fluency.toFixed(1));
        pron    = parseFloat(pron.toFixed(1));
        lexical = parseFloat(lexical.toFixed(1));
        grammar = parseFloat(grammar.toFixed(1));
        
        const overall = parseFloat(((fluency + grammar + lexical + pron) / 4).toFixed(1));

        return res.json({
          transcript,
          scores: { fluency, pronunciation: pron, lexical, grammar, overall },
          feedback: {
            fluency:       `Tốc độ: ${Math.round(wpm)} WPM. ${hesitationCount > 0 ? `Bị vấp ${hesitationCount} lần.` : 'Rất trôi chảy!'}`,
            pronunciation: `Phân tích ngữ âm cục bộ (Soundex) đạt mức Band ${pron}.`,
            lexical:       `Chỉ số đa dạng từ vựng (TTR): ${Math.round((new Set(transcriptWords).size / Math.max(1, transcriptWords.length)) * 100)}%.`,
            grammar:       `Phân tích cấu trúc câu (N-gram Bigram) đạt Band ${grammar}.`,
          },
          mistakes: [],
          follow_up_question: 'Can you elaborate on your point?',
          improved_answer: sampleAnswer || 'No sample answer provided.',
          encouragement: '🚀 Chế độ Offline NLP: Điểm được tính toán bằng các thuật toán ngôn ngữ học cục bộ (Soundex & N-gram).',
          source: 'node-offline-advanced',
        });
      } catch (fallbackErr) {
        console.error('Node fallback MAX LEVEL error:', fallbackErr.message);
      }
    }

    