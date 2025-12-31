const SpeakingQuestion = require('../models/SpeakingQuestion');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');

// Admin: Tạo speaking question mới
exports.createSpeakingQuestion = async (req, res) => {
  try {
    const { topic_id, part, question, keywords, difficulty, is_active } = req.body;

    // Kiểm tra topic tồn tại
    if (!mongoose.Types.ObjectId.isValid(topic_id)) {
      return res.status(400).json({
        message: 'Topic ID không hợp lệ'
      });
    }

    const topic = await Topic.findById(topic_id);
    if (!topic) {
      return res.status(404).json({
        message: 'Không tìm thấy chủ đề'
      });
    }

    const speakingQuestion = new SpeakingQuestion({
      topic_id,
      part,
      question,
      keywords,
      difficulty,
      is_active
    });

    await speakingQuestion.save();

    res.status(201).json({
      message: 'Tạo câu hỏi speaking thành công',
      data: speakingQuestion
    });
  } catch (error) {
    console.error('Error creating speaking question:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo câu hỏi speaking'
    });
  }
};

// Admin: Lấy danh sách speaking questions
exports.getAllSpeakingQuestionsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, topic_id, part, difficulty, is_active } = req.query;
    
    const query = {};
    
    if (topic_id) {
      query.topic_id = topic_id;
    }
    
    if (part) {
      query.part = part;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    const questions = await SpeakingQuestion.find(query)
      .populate('topic_id', 'name level')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await SpeakingQuestion.countDocuments(query);

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
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách câu hỏi speaking'
    });
  }
};

// Admin: Lấy chi tiết speaking question
exports.getSpeakingQuestionById = async (req, res) => {
  try {
    const question = await SpeakingQuestion.findById(req.params.id)
      .populate('topic_id', 'name level cover_image');
    
    if (!question) {
      return res.status(404).json({
        message: 'Không tìm thấy câu hỏi speaking'
      });
    }

    res.json({
      message: 'Lấy thông tin câu hỏi speaking thành công',
      data: question
    });
  } catch (error) {
    console.error('Error getting speaking question:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin câu hỏi speaking'
    });
  }
};

// Admin: Cập nhật speaking question
exports.updateSpeakingQuestion = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Kiểm tra topic nếu có thay đổi
    if (updateData.topic_id) {
      if (!mongoose.Types.ObjectId.isValid(updateData.topic_id)) {
        return res.status(400).json({
          message: 'Topic ID không hợp lệ'
        });
      }

      const topic = await Topic.findById(updateData.topic_id);
      if (!topic) {
        return res.status(404).json({
          message: 'Không tìm thấy chủ đề'
        });
      }
    }

    const question = await SpeakingQuestion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('topic_id', 'name level');
    
    if (!question) {
      return res.status(404).json({
        message: 'Không tìm thấy câu hỏi speaking'
      });
    }

    res.json({
      message: 'Cập nhật câu hỏi speaking thành công',
      data: question
    });
  } catch (error) {
    console.error('Error updating speaking question:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật câu hỏi speaking'
    });
  }
};

// Admin: Xóa speaking question
exports.deleteSpeakingQuestion = async (req, res) => {
  try {
    const question = await SpeakingQuestion.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        message: 'Không tìm thấy câu hỏi speaking'
      });
    }

    res.json({
      message: 'Xóa câu hỏi speaking thành công'
    });
  } catch (error) {
    console.error('Error deleting speaking question:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa câu hỏi speaking'
    });
  }
};

// Public: Lấy danh sách speaking questions active
exports.getPublicSpeakingQuestions = async (req, res) => {
  try {
    const { topic_id, part, difficulty } = req.query;
    
    const query = { is_active: true };
    
    if (topic_id) {
      if (!mongoose.Types.ObjectId.isValid(topic_id)) {
        return res.status(400).json({
          message: 'Topic ID không hợp lệ'
        });
      }
      query.topic_id = topic_id;
    }
    
    if (part) {
      query.part = part;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const questions = await SpeakingQuestion.find(query)
      .populate('topic_id', 'name level cover_image')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Lấy danh sách câu hỏi speaking thành công',
      data: questions
    });
  } catch (error) {
    console.error('Error getting public speaking questions:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách câu hỏi speaking'
    });
  }
};