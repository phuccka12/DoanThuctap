const WritingPrompt = require('../models/WritingPrompt');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');

// Admin: Tạo writing prompt mới
exports.createWritingPrompt = async (req, res) => {
  try {
    const { topic_id, type, prompt, image_url, ideas, min_words, max_words, model_essay, difficulty, is_active } = req.body;

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

    const writingPrompt = new WritingPrompt({
      topic_id,
      type,
      prompt,
      image_url,
      ideas,
      min_words,
      max_words,
      model_essay,
      difficulty,
      is_active
    });

    await writingPrompt.save();

    res.status(201).json({
      message: 'Tạo đề bài writing thành công',
      data: writingPrompt
    });
  } catch (error) {
    console.error('Error creating writing prompt:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo đề bài writing'
    });
  }
};

// Admin: Lấy danh sách writing prompts
exports.getAllWritingPromptsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, topic_id, type, difficulty, is_active } = req.query;
    
    const query = {};
    
    if (topic_id) {
      query.topic_id = topic_id;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    const prompts = await WritingPrompt.find(query)
      .populate('topic_id', 'name level')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await WritingPrompt.countDocuments(query);

    res.json({
      message: 'Lấy danh sách đề bài writing thành công',
      data: {
        prompts,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
  } catch (error) {
    console.error('Error getting writing prompts:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đề bài writing'
    });
  }
};

// Admin: Lấy chi tiết writing prompt
exports.getWritingPromptById = async (req, res) => {
  try {
    const prompt = await WritingPrompt.findById(req.params.id)
      .populate('topic_id', 'name level cover_image');
    
    if (!prompt) {
      return res.status(404).json({
        message: 'Không tìm thấy đề bài writing'
      });
    }

    res.json({
      message: 'Lấy thông tin đề bài writing thành công',
      data: prompt
    });
  } catch (error) {
    console.error('Error getting writing prompt:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin đề bài writing'
    });
  }
};

// Admin: Cập nhật writing prompt
exports.updateWritingPrompt = async (req, res) => {
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

    const prompt = await WritingPrompt.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('topic_id', 'name level');
    
    if (!prompt) {
      return res.status(404).json({
        message: 'Không tìm thấy đề bài writing'
      });
    }

    res.json({
      message: 'Cập nhật đề bài writing thành công',
      data: prompt
    });
  } catch (error) {
    console.error('Error updating writing prompt:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật đề bài writing'
    });
  }
};

// Admin: Xóa writing prompt
exports.deleteWritingPrompt = async (req, res) => {
  try {
    const prompt = await WritingPrompt.findByIdAndDelete(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({
        message: 'Không tìm thấy đề bài writing'
      });
    }

    res.json({
      message: 'Xóa đề bài writing thành công'
    });
  } catch (error) {
    console.error('Error deleting writing prompt:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa đề bài writing'
    });
  }
};

// Public: Lấy danh sách writing prompts active
exports.getPublicWritingPrompts = async (req, res) => {
  try {
    const { topic_id, type, difficulty } = req.query;
    
    const query = { is_active: true };
    
    if (topic_id) {
      if (!mongoose.Types.ObjectId.isValid(topic_id)) {
        return res.status(400).json({
          message: 'Topic ID không hợp lệ'
        });
      }
      query.topic_id = topic_id;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const prompts = await WritingPrompt.find(query)
      .populate('topic_id', 'name level cover_image')
      .select('-model_essay') // Không trả model essay cho public
      .sort({ createdAt: -1 });

    res.json({
      message: 'Lấy danh sách đề bài writing thành công',
      data: prompts
    });
  } catch (error) {
    console.error('Error getting public writing prompts:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách đề bài writing'
    });
  }
};