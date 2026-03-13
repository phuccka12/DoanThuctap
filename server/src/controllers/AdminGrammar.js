const GrammarLesson = require('../models/GrammarLesson');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-2.0-flash';

// ── Helpers ──────────────────────────────────────────────────────────────────
function paginationMeta(total, page, limit) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/grammar — danh sách bài ngữ pháp
// ══════════════════════════════════════════════════════════════════════════════
exports.getList = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', level = '' } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (level)  query.level = level;

    const [lessons, total] = await Promise.all([
      GrammarLesson.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('title description level is_active is_published created_at hook.questions minigames')
        .lean(),
      GrammarLesson.countDocuments(query),
    ]);

    // Attach lightweight counts and strip heavy arrays
    const rows = lessons.map(l => ({
      ...l,
      hookCount:     l.hook?.questions?.length ?? 0,
      minigameCount: l.minigames?.length ?? 0,
      hook:          undefined,
      minigames:     undefined,
    }));

    res.json({ message: 'OK', data: { lessons: rows, pagination: paginationMeta(total, Number(page), Number(limit)) } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/grammar/:id
// ══════════════════════════════════════════════════════════════════════════════
exports.getOne = async (req, res) => {
  try {
    const lesson = await GrammarLesson.findById(req.params.id).lean();
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài' });
    res.json({ message: 'OK', data: lesson });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/grammar — tạo mới
// ══════════════════════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const { title, description, level, hook, theory, minigames } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Tên bài là bắt buộc' });

    const lesson = await GrammarLesson.create({
      title: title.trim(),
      description: description?.trim() || '',
      level: level || 'intermediate',
      hook:     hook     || { questions: [] },
      theory:   theory   || { mainCard: '', subCards: [] },
      minigames: minigames || [],
      created_by: req.userId,
    });

    res.status(201).json({ message: 'Tạo bài thành công', data: lesson });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/admin/grammar/:id — cập nhật
// ══════════════════════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const { title, description, level, hook, theory, minigames, is_active, is_published } = req.body;
    const lesson = await GrammarLesson.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, level, hook, theory, minigames, is_active, is_published } },
      { new: true, runValidators: true }
    );
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài' });
    res.json({ message: 'Cập nhật thành công', data: lesson });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/grammar/:id
// ══════════════════════════════════════════════════════════════════════════════
exports.remove = async (req, res) => {
  try {
    const lesson = await GrammarLesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài' });
    res.json({ message: 'Đã xoá bài học' });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/grammar/ai-generate — Gemini tự động soạn bài
// ══════════════════════════════════════════════════════════════════════════════
exports.aiGenerate = async (req, res) => {
  const { topic: grammarTopic } = req.body;

  if (!grammarTopic?.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập chủ đề ngữ pháp' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY trong .env' });
  }

  const prompt = `Bạn là giáo viên tiếng Anh chuyên nghiệp đang soạn bài ngữ pháp cho học sinh Việt Nam.
Soạn bài ngữ pháp đầy đủ cho chủ đề: "${grammarTopic.trim()}"

Trả về ĐÚNG định dạng JSON sau (không markdown, không \`\`\`, chỉ JSON thuần):
{
  "title": "Tên bài ngắn gọn (VD: Thì hiện tại hoàn thành)",
  "description": "Mô tả 1-2 câu về bài học",
  "level": "beginner|intermediate|advanced",
  "hook": {
    "questions": [
      {
        "text": "Câu hỏi mồi đặt vấn đề bằng tiếng Việt",
        "optionA": "Đáp án A (tiếng Anh)",
        "optionB": "Đáp án B (tiếng Anh)",
        "correct": "A"
      },
      {
        "text": "Câu hỏi mồi thứ 2",
        "optionA": "Đáp án A",
        "optionB": "Đáp án B",
        "correct": "B"
      }
    ]
  },
  "theory": {
    "mainCard": "**Công thức:** S + have/has + V3/Ved\\n\\n**Ví dụ:** I have studied English for 3 years.",
    "subCards": [
      {
        "title": "Dấu hiệu nhận biết",
        "content": "Liệt kê các từ/cụm từ như: already, yet, ever, never, just, for, since..."
      },
      {
        "title": "Cách dùng",
        "content": "Mô tả chi tiết khi nào dùng thì này, có ví dụ minh họa cụ thể"
      },
      {
        "title": "Lỗi sai thường gặp",
        "content": "❌ Sai: I have went... ✅ Đúng: I have gone... Giải thích lý do"
      }
    ]
  },
  "minigames": [
    {
      "type": "multiple_choice",
      "question": "Câu hỏi trắc nghiệm hoàn chỉnh liên quan đến ${grammarTopic.trim()}",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct": 0
    },
    {
      "type": "multiple_choice",
      "question": "Câu trắc nghiệm thứ 2",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct": 2
    },
    {
      "type": "error_detection",
      "sentence": "Câu tiếng Anh có đúng 1 lỗi sai ngữ pháp liên quan đến ${grammarTopic.trim()}",
      "errorWord": "từ bị sai",
      "correction": "từ đúng",
      "explanation": "Giải thích ngắn gọn tại sao sai"
    },
    {
      "type": "word_order",
      "words": ["từ1", "từ2", "từ3", "từ4", "từ5"],
      "correct": "Câu hoàn chỉnh đúng ngữ pháp khi xếp lại"
    }
  ]
}

Yêu cầu:
- Nội dung PHẢI liên quan đúng chủ đề "${grammarTopic.trim()}"
- Ví dụ thực tế, dễ hiểu cho học sinh IELTS Việt Nam
- mainCard dùng **bold** cho công thức chính, \\n\\n để xuống dòng
- Câu minigame phải rõ ràng, có đáp án chắc chắn`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 3000 } },
      { timeout: 35000 },
    );

    const raw = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, s => s.replace(/```json\n?|```\n?/g, '')).trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Thử extract JSON từ raw
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
      }
      if (!parsed) {
        console.error('[aiGenerate grammar] parse fail, raw:', raw.substring(0, 300));
        return res.status(500).json({ message: 'AI trả về dữ liệu không hợp lệ, thử lại' });
      }
    }

    res.json({ message: 'Soạn bài thành công', data: parsed });
  } catch (err) {
    console.error('[aiGenerate grammar] error:', err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ message: 'Lỗi khi gọi Gemini AI', error: err.message });
  }
};
