const Lesson = require('../models/Lesson');
const Topic  = require('../models/Topic');
const { embedText, buildLessonText } = require('../services/embeddingService');
const axios  = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-2.0-flash';

/** Fire-and-forget: embed a lesson and save its vector. */
async function embedLessonAsync(lesson) {
  try {
    const text      = buildLessonText(lesson);
    const embedding = await embedText(text);
    await Lesson.findByIdAndUpdate(lesson._id, { embedding });
  } catch (e) {
    console.warn('[LessonEmbed] failed for', lesson._id, e.message);
  }
}

// GET /api/admin/topics/:topicId/lessons - Get all lessons for a topic
exports.getLessonsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    // Verify topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Không tìm thấy chủ đề' });
    }

    // Get lessons sorted by order
    const lessons = await Lesson.find({ topic_id: topicId })
      .sort({ order: 1 })
      .lean();

    res.json({
      message: 'Lấy danh sách bài học thành công',
      data: {
        topic: {
          _id: topic._id,
          name: topic.name,
          cover_image: topic.cover_image
        },
        lessons
      }
    });
  } catch (err) {
    console.error('Error getting lessons:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// POST /api/admin/topics/:topicId/lessons - Create new lesson
exports.createLesson = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, description, level, duration } = req.body;

    // Verify topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Không tìm thấy chủ đề' });
    }

    // Get highest order number
    const lastLesson = await Lesson.findOne({ topic_id: topicId })
      .sort({ order: -1 })
      .limit(1);

    const newOrder = lastLesson ? lastLesson.order + 1 : 1;

    // Create lesson
    const lesson = new Lesson({
      topic_id: topicId,
      title,
      description,
      level: level || 'beginner',
      duration: duration || 15,
      order: newOrder,
      nodes: []
    });

    await lesson.save();
    // Embed lesson async (non-blocking)
    embedLessonAsync(lesson);

    res.status(201).json({
      message: 'Tạo bài học thành công',
      data: lesson
    });
  } catch (err) {
    console.error('Error creating lesson:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/admin/lessons/:id - Get single lesson
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('topic_id', 'name cover_image');

    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    res.json({
      message: 'Lấy bài học thành công',
      data: lesson
    });
  } catch (err) {
    console.error('Error getting lesson:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// PUT /api/admin/lessons/:id - Update lesson
exports.updateLesson = async (req, res) => {
  try {
    const { title, description, level, duration, cover_image, is_active, is_published, nodes } = req.body;

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    // Update fields
    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (level !== undefined) lesson.level = level;
    if (duration !== undefined) lesson.duration = duration;
    if (cover_image !== undefined) lesson.cover_image = cover_image;
    if (is_active !== undefined) lesson.is_active = is_active;
    if (is_published !== undefined) lesson.is_published = is_published;
    if (nodes !== undefined) lesson.nodes = nodes; // Update Builder data

    await lesson.save();
    // Re-embed when nodes or title change
    if (nodes !== undefined || title !== undefined) embedLessonAsync(lesson);

    res.json({
      message: 'Cập nhật bài học thành công',
      data: lesson
    });
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// PUT /api/admin/topics/:topicId/lessons/reorder - Reorder lessons
exports.reorderLessons = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { lessonIds } = req.body; // Array of lesson IDs in new order

    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({ message: 'lessonIds phải là mảng' });
    }

    // Update order for each lesson
    const updatePromises = lessonIds.map((lessonId, index) =>
      Lesson.findByIdAndUpdate(lessonId, { order: index + 1 })
    );

    await Promise.all(updatePromises);

    res.json({
      message: 'Sắp xếp lại bài học thành công'
    });
  } catch (err) {
    console.error('Error reordering lessons:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// DELETE /api/admin/lessons/:id - Delete lesson
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    await lesson.deleteOne();

    res.json({
      message: 'Xóa bài học thành công'
    });
  } catch (err) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// POST /api/admin/lessons/ai-generate - AI auto-generate lesson content
exports.aiGenerateLesson = async (req, res) => {
  const { topic: lessonTopic } = req.body;

  if (!lessonTopic || !lessonTopic.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập chủ đề bài học' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY trong .env' });
  }

  const prompt = `Bạn là một giáo viên tiếng Anh chuyên nghiệp đang soạn tài liệu dạy học.
Hãy soạn nội dung bài học đầy đủ cho chủ đề: "${lessonTopic.trim()}"

Trả về ĐÚNG JSON sau (không có markdown, không có \`\`\`):
{
  "title": "Tên bài học ngắn gọn",
  "description": "Mô tả 1-2 câu về bài học",
  "level": "beginner|intermediate|advanced",
  "hook": {
    "questions": [
      {
        "text": "Câu hỏi mồi đặt vấn đề (tiếng Việt, 1 câu)",
        "optionA": "Đáp án A",
        "optionB": "Đáp án B",
        "correct": "A|B"
      },
      {
        "text": "Câu hỏi mồi thứ 2",
        "optionA": "Đáp án A",
        "optionB": "Đáp án B",
        "correct": "A|B"
      }
    ]
  },
  "theory": {
    "mainCard": "Công thức / Quy tắc chính (dùng Markdown đơn giản, ví dụ: **S + have/has + V3**)",
    "subCards": [
      { "title": "Tiêu đề lưu ý 1", "content": "Nội dung giải thích chi tiết, ví dụ minh họa" },
      { "title": "Tiêu đề lưu ý 2", "content": "Nội dung giải thích, ví dụ" },
      { "title": "Lỗi sai thường gặp", "content": "Mô tả lỗi và cách sửa" }
    ]
  },
  "minigames": [
    {
      "type": "multiple_choice",
      "question": "Câu hỏi trắc nghiệm hoàn chỉnh",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct": 0
    },
    {
      "type": "multiple_choice",
      "question": "Câu hỏi trắc nghiệm thứ 2",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct": 1
    },
    {
      "type": "error_detection",
      "sentence": "Câu tiếng Anh có 1 lỗi sai",
      "errorWord": "từ sai",
      "correction": "từ đúng",
      "explanation": "Giải thích ngắn gọn lỗi sai"
    },
    {
      "type": "word_order",
      "words": ["các", "từ", "bị", "xáo", "trộn"],
      "correct": "Câu đúng hoàn chỉnh khi sắp xếp lại"
    }
  ]
}

Lưu ý:
- Nội dung phải liên quan đúng chủ đề "${lessonTopic.trim()}"
- Ví dụ phải thực tế, dễ hiểu cho học sinh Việt Nam
- Câu hỏi minigame phải hoàn chỉnh, có đáp án rõ ràng`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      },
      { timeout: 30000 }
    );

    const raw = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('[aiGenerateLesson] JSON parse error:', parseErr.message, '\nRaw:', clean.substring(0, 200));
      return res.status(500).json({ message: 'AI trả về dữ liệu không hợp lệ, thử lại', raw: clean.substring(0, 300) });
    }

    res.json({ message: 'Soạn bài thành công', data: parsed });
  } catch (err) {
    console.error('[aiGenerateLesson] error:', err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ message: 'Lỗi khi gọi Gemini AI', error: err.message });
  }
};
