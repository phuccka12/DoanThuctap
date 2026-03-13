const ListeningPassage = require('../models/ListeningPassage');
const { rewardExercise } = require('../utils/rewardHelper');
const Pet = require('../models/Pet');

// ─── Levenshtein Distance ─────────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i || j));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ─── Sanitize string ──────────────────────────────────────────────────────────
function sanitize(str) {
  return (str || '').toLowerCase().trim().replace(/[.,!?;:'"()]/g, '');
}

// ─── Grade single answer (cấp 1 + cấp 2) ────────────────────────────────────
function gradeAnswer(question, userRaw) {
  const type    = question.type;
  const correct = sanitize(question.answer);
  const user    = sanitize(userRaw);

  if (!user) return { isCorrect: false, hasTypo: false };

  if (type === 'multiple_choice' || type === 'true_false') {
    // Cấp 1: Exact match
    const isCorrect = user === correct || user === correct.charAt(0);
    return { isCorrect, hasTypo: false };
  }

  if (type === 'fill_blank' || type === 'matching') {
    // Cấp 2: Heuristic matching
    if (user === correct) return { isCorrect: true,  hasTypo: false };
    const dist = levenshtein(user, correct);
    if (dist === 0) return { isCorrect: true,  hasTypo: false };
    if (dist === 1) return { isCorrect: true,  hasTypo: true  }; // typo châm chước
    return { isCorrect: false, hasTypo: false };
  }

  // Fallback
  const isCorrect = user === correct;
  return { isCorrect, hasTypo: false };
}

// ── GET danh sách topics có bài nghe ─────────────────────────────────────────
exports.getTopics = async (req, res) => {
  try {
    const rows = await ListeningPassage.aggregate([
      { $match: { is_active: true } },
      { $unwind: { path: '$topics', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$topics', passageCount: { $sum: 1 } } },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: '_id',
          as: 'topicDoc',
        },
      },
      { $unwind: { path: '$topicDoc', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: '$topicDoc._id',
          name: '$topicDoc.name',
          passageCount: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ message: 'OK', data: { topics: rows } });
  } catch (e) {
    console.error('[getTopics error]', e);
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── GET danh sách bài nghe cho user ─────────────────────────────────────────
exports.getList = async (req, res) => {
  try {
    const { level, section, topic, page = 1, limit = 12 } = req.query;
    const query = { is_active: true };
    if (level)   query.level = level;
    if (section) query.section = section;
    if (topic)   query.topics = topic;

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
      const submitted  = answers.find(a => String(a.questionId) === String(q._id));
      const userRaw    = submitted?.answer || '';
      const { isCorrect, hasTypo } = gradeAnswer(q, userRaw);
      if (isCorrect) correct++;

      return {
        questionId:    q._id,
        question:      q.question,
        type:          q.type,
        userAnswer:    userRaw,
        correctAnswer: q.answer,
        isCorrect,
        hasTypo,
      };
    });

    const total   = passage.questions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    // IELTS band estimate (0–9)
    const band    = total > 0 ? Math.round((correct / total) * 9 * 10) / 10 : 0;

    // ── Gamification: Coins + Pet HP ────────────────────────────────────────
    let reward = null;
    const userId = req.userId;
    if (userId) {
      try {
        // Tính số coin theo accuracy
        const coinAmount = Math.round((percent / 100) * 20); // tối đa 20 coins / bài
        const coinResult = await rewardExercise(userId, 'listening', { customAmount: coinAmount });

        // Pet HP: mất HP tỉ lệ với số câu sai
        const wrongCount = total - correct;
        let hpChange = 0;
        let petAfter = null;
        if (wrongCount > 0 && total > 0) {
          const pet = await Pet.findOne({ user: userId });
          if (pet) {
            const damage = Math.round((wrongCount / total) * 15); // tối đa -15 HP
            pet.hunger = Math.min(100, pet.hunger + damage);      // hunger tăng = HP giảm
            await pet.save();
            hpChange  = -damage;
            petAfter  = { hunger: pet.hunger, coins: pet.coins };
          }
        } else {
          // Tất cả đúng: thêm happiness
          const pet = await Pet.findOne({ user: userId });
          if (pet) {
            pet.happiness = Math.min(100, pet.happiness + 5);
            await pet.save();
            petAfter = { hunger: pet.hunger, coins: pet.coins, happiness: pet.happiness };
          }
        }

        reward = {
          coinsEarned:  coinResult.earned,
          totalToday:   coinResult.totalToday,
          capReached:   coinResult.capReached,
          hpChange,
          petAfter,
        };
      } catch (e) {
        console.error('Gamification error:', e.message);
      }
    }

    res.json({
      message: 'Nộp bài thành công',
      data: {
        percent,
        band,
        correct,
        total,
        transcript: passage.transcript,
        details,
        reward,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
