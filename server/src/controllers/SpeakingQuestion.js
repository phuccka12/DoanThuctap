const SpeakingQuestion = require('../models/SpeakingQuestion');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const axios = require('axios');

const AI_SERVICE_URL = 'http://127.0.0.1:5000';

// ─── Admin: Stats ──────────────────────────────────────────────────────────────
exports.getSpeakingStats = async (req, res) => {
  try {
    const [total, active, byPart, byDifficulty, byCefr] = await Promise.all([
      SpeakingQuestion.countDocuments(),
      SpeakingQuestion.countDocuments({ is_active: true }),
      SpeakingQuestion.aggregate([
        { $group: { _id: '$part', count: { $sum: 1 } } }
      ]),
      SpeakingQuestion.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
      ]),
      SpeakingQuestion.aggregate([
        { $group: { _id: '$cefr_level', count: { $sum: 1 } } }
      ])
    ]);
    res.json({ message: 'OK', data: { total, active, byPart, byDifficulty, byCefr } });
  } catch (error) {
    console.error('Error getting speaking stats:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── Admin: Tạo mới ────────────────────────────────────────────────────────────
exports.createSpeakingQuestion = async (req, res) => {
  try {
    const { topic_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(topic_id)) {
      return res.status(400).json({ message: 'Topic ID không hợp lệ' });
    }
    const topic = await Topic.findById(topic_id);
    if (!topic) return res.status(404).json({ message: 'Không tìm thấy chủ đề' });

    const question = new SpeakingQuestion({
      ...req.body,
      created_by: req.user?._id
    });
    await question.save();
    await question.populate('topic_id', 'name level');

    res.status(201).json({ message: 'Tạo câu hỏi speaking thành công', data: question });
  } catch (error) {
    console.error('Error creating speaking question:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo câu hỏi speaking' });
  }
};

// ─── Admin: Danh sách ──────────────────────────────────────────────────────────
exports.getAllSpeakingQuestionsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, topic_id, part, difficulty, cefr_level, is_active, search } = req.query;
    const query = {};

    if (topic_id) query.topic_id = topic_id;
    if (part) query.part = part;
    if (difficulty) query.difficulty = difficulty;
    if (cefr_level) query.cefr_level = cefr_level;
    if (is_active !== undefined) query.is_active = is_active === 'true';
    if (search) query.question = { $regex: search, $options: 'i' };

    const [questions, count] = await Promise.all([
      SpeakingQuestion.find(query)
        .populate('topic_id', 'name level')
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      SpeakingQuestion.countDocuments(query)
    ]);

    res.json({
      message: 'Lấy danh sách câu hỏi speaking thành công',
      data: {
        questions,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
  } catch (error) {
    console.error('Error getting speaking questions:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách câu hỏi speaking' });
  }
};

// ─── Admin: Chi tiết ───────────────────────────────────────────────────────────
exports.getSpeakingQuestionById = async (req, res) => {
  try {
    const question = await SpeakingQuestion.findById(req.params.id)
      .populate('topic_id', 'name level cover_image')
      .populate('created_by', 'name email');
    if (!question) return res.status(404).json({ message: 'Không tìm thấy câu hỏi speaking' });
    res.json({ message: 'OK', data: question });
  } catch (error) {
    console.error('Error getting speaking question:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin câu hỏi speaking' });
  }
};

// ─── Admin: Cập nhật ───────────────────────────────────────────────────────────
exports.updateSpeakingQuestion = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.topic_id) {
      if (!mongoose.Types.ObjectId.isValid(updateData.topic_id)) {
        return res.status(400).json({ message: 'Topic ID không hợp lệ' });
      }
      const topic = await Topic.findById(updateData.topic_id);
      if (!topic) return res.status(404).json({ message: 'Không tìm thấy chủ đề' });
    }

    const question = await SpeakingQuestion.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true }
    ).populate('topic_id', 'name level');

    if (!question) return res.status(404).json({ message: 'Không tìm thấy câu hỏi speaking' });
    res.json({ message: 'Cập nhật thành công', data: question });
  } catch (error) {
    console.error('Error updating speaking question:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật câu hỏi speaking' });
  }
};

// ─── Admin: Xóa ────────────────────────────────────────────────────────────────
exports.deleteSpeakingQuestion = async (req, res) => {
  try {
    const question = await SpeakingQuestion.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Không tìm thấy câu hỏi speaking' });
    res.json({ message: 'Xóa câu hỏi speaking thành công' });
  } catch (error) {
    console.error('Error deleting speaking question:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa câu hỏi speaking' });
  }
};

// ─── Admin: Bulk Delete ────────────────────────────────────────────────────────
exports.bulkDeleteSpeakingQuestions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });
    }
    const result = await SpeakingQuestion.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Đã xóa ${result.deletedCount} câu hỏi` });
  } catch (error) {
    console.error('Error bulk deleting speaking questions:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa hàng loạt' });
  }
};

// ─── Admin: AI Generate Sample Answer ─────────────────────────────────────────
exports.generateSampleAnswer = async (req, res) => {
  try {
    const { question, part, cefr_level, difficulty, keywords, follow_up_questions } = req.body;
    if (!question) return res.status(400).json({ message: 'Thiếu câu hỏi' });

    const response = await axios.post(`${AI_SERVICE_URL}/api/speaking/generate-sample`, {
      question, part, cefr_level, difficulty, keywords, follow_up_questions
    }, { timeout: 60000 });

    res.json({ message: 'OK', data: response.data });
  } catch (error) {
    console.error('Error generating sample answer:', error.message);
    res.status(500).json({ message: 'AI Service không phản hồi. Vui lòng thử lại.' });
  }
};

// ─── Public: Lấy danh sách active ─────────────────────────────────────────────
exports.getPublicSpeakingQuestions = async (req, res) => {
  try {
    const { topic_id, part, difficulty } = req.query;
    const query = { is_active: true };
    if (topic_id) {
      if (!mongoose.Types.ObjectId.isValid(topic_id)) {
        return res.status(400).json({ message: 'Topic ID không hợp lệ' });
      }
      query.topic_id = topic_id;
    }
    if (part) query.part = part;
    if (difficulty) query.difficulty = difficulty;

    const questions = await SpeakingQuestion.find(query)
      .populate('topic_id', 'name level cover_image')
      .sort({ createdAt: -1 });

    res.json({ message: 'OK', data: questions });
  } catch (error) {
    console.error('Error getting public speaking questions:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách câu hỏi speaking' });
  }
};

// ─── Public: Lấy 1 câu hỏi ngẫu nhiên (cho AI Coach) ─────────────────────────
exports.getRandomSpeakingQuestion = async (req, res) => {
  try {
    const { part, difficulty, exclude_id } = req.query;
    const query = { is_active: true };
    if (part) query.part = part;
    if (difficulty) query.difficulty = difficulty;
    // Loại trừ câu hỏi vừa hiển thị để tránh lặp
    if (exclude_id && mongoose.Types.ObjectId.isValid(exclude_id)) {
      query._id = { $ne: new mongoose.Types.ObjectId(exclude_id) };
    }

    const count = await SpeakingQuestion.countDocuments(query);
    if (count === 0) return res.status(404).json({ message: 'Không có câu hỏi nào phù hợp' });

    const randomSkip = Math.floor(Math.random() * count);
    const questions = await SpeakingQuestion.find(query)
      .populate('topic_id', 'name level')
      .skip(randomSkip)
      .limit(1);

    const question = questions.length > 0 ? questions[0] : null;
    res.json({ message: 'OK', data: question });
  } catch (error) {
    console.error('Error getting random speaking question:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy câu hỏi ngẫu nhiên' });
  }
};