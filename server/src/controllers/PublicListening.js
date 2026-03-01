const ListeningPassage = require('../models/ListeningPassage');

// ── GET danh sách bài nghe cho user ─────────────────────────────────────────
exports.getList = async (req, res) => {
  try {
    const { level, section, page = 1, limit = 12 } = req.query;
    const query = { is_active: true };
    if (level)   query.level = level;
    if (section) query.section = section;

    const [passages, total] = await Promise.all([
      ListeningPassage.find(query)
        .select('title audio_url duration_sec level section topics questions created_at')
        .populate('topics', 'name')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ListeningPassage.countDocuments(query),
    ]);

    // Ẩn đáp án khi trả về cho user
    const safe = passages.map(p => {
      const obj = p.toObject();
      obj.questions = obj.questions.map(q => ({
        _id: q._id,
        order: q.order,
        type: q.type,
        question: q.question,
        options: q.options,
        // KHÔNG trả answer
      }));
      return obj;
    });

    res.json({ message: 'OK', data: { passages: safe, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── GET chi tiết 1 bài (không có đáp án) ────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const passage = await ListeningPassage.findOne({ _id: req.params.id, is_active: true })
      .populate('topics', 'name');
    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });

    const obj = passage.toObject();
    obj.questions = obj.questions.map(q => ({
      _id: q._id,
      order: q.order,
      type: q.type,
      question: q.question,
      options: q.options,
    }));
    // Ẩn transcript cho đến khi làm xong
    delete obj.transcript;

    res.json({ message: 'OK', data: obj });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── POST nộp bài — chấm điểm ────────────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    const { answers } = req.body;
    // answers: [{ questionId, answer }]

    const passage = await ListeningPassage.findOne({ _id: req.params.id, is_active: true });
    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp câu trả lời' });
    }

    let correct = 0;
    const details = passage.questions.map(q => {
      const submitted = answers.find(a => String(a.questionId) === String(q._id));
      const userAnswer = submitted?.answer?.trim().toLowerCase() || '';
      const correctAnswer = q.answer.trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correct++;

      return {
        questionId: q._id,
        question:   q.question,
        userAnswer: submitted?.answer || '',
        correct:    q.answer,
        isCorrect,
      };
    });

    const total    = passage.questions.length;
    const score    = total > 0 ? Math.round((correct / total) * 9 * 10) / 10 : 0; // Scale to IELTS band
    const percent  = total > 0 ? Math.round((correct / total) * 100) : 0;

    res.json({
      message: 'Nộp bài thành công',
      data: {
        score,        // IELTS band estimate
        percent,
        correct,
        total,
        transcript: passage.transcript, // Trả transcript sau khi nộp
        details,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
