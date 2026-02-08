const Topic = require('../models/Topic');

// Admin: Tạo topic mới
exports.createTopic = async (req, res) => {
  try {
    const { name, cover_image, level, is_active } = req.body;

    // Kiểm tra trùng tên
    const existingTopic = await Topic.findOne({ name });
    if (existingTopic) {
      return res.status(400).json({
        message: 'Tên chủ đề đã tồn tại'
      });
    }

    const topic = new Topic({
      name,
      cover_image,
      level,
      is_active
    });

    await topic.save();

    res.status(201).json({
      message: 'Tạo chủ đề thành công',
      data: topic
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo chủ đề'
    });
  }
};

// Admin: Lấy danh sách topics (có phân trang và search)
exports.getAllTopicsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, level, is_active } = req.query;
    
    const query = {};
    
    // Search by name
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by level
    if (level) {
      query.level = level;
    }
    
    // Filter by is_active
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    // Use aggregation to include lesson count
    const topics = await Topic.aggregate([
      { $match: query },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'topic',
          as: 'lessons'
        }
      },
      {
        $addFields: {
          lesson_count: { $size: '$lessons' }
        }
      },
      {
        $project: {
          lessons: 0 // Remove lessons array, only keep count
        }
      }
    ]);

    const count = await Topic.countDocuments(query);

    res.json({
      message: 'Lấy danh sách chủ đề thành công',
      data: {
        topics,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách chủ đề'
    });
  }
};

// Admin: Lấy chi tiết topic
exports.getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({
        message: 'Không tìm thấy chủ đề'
      });
    }

    res.json({
      message: 'Lấy thông tin chủ đề thành công',
      data: topic
    });
  } catch (error) {
    console.error('Error getting topic:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin chủ đề'
    });
  }
};

// Admin: Cập nhật topic
exports.updateTopic = async (req, res) => {
  try {
    const { name, cover_image, level, is_active, nodes } = req.body;
    
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({
        message: 'Không tìm thấy chủ đề'
      });
    }

    // Kiểm tra trùng tên (nếu đổi tên)
    if (name && name !== topic.name) {
      const existingTopic = await Topic.findOne({ name });
      if (existingTopic) {
        return res.status(400).json({
          message: 'Tên chủ đề đã tồn tại'
        });
      }
    }

    // Update fields
    if (name !== undefined) topic.name = name;
    if (cover_image !== undefined) topic.cover_image = cover_image;
    if (level !== undefined) topic.level = level;
    if (is_active !== undefined) topic.is_active = is_active;
    if (nodes !== undefined) topic.nodes = nodes; // Support CourseBuilder

    await topic.save();

    res.json({
      message: 'Cập nhật chủ đề thành công',
      data: topic
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật chủ đề'
    });
  }
};

// Admin: Xóa topic
exports.deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({
        message: 'Không tìm thấy chủ đề'
      });
    }

    await Topic.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Xóa chủ đề thành công'
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa chủ đề'
    });
  }
};

// Public: Lấy danh sách topics active
exports.getPublicTopics = async (req, res) => {
  try {
    const topics = await Topic.find({ is_active: true })
      .select('name cover_image level')
      .sort({ created_at: -1 });

    res.json({
      message: 'Lấy danh sách chủ đề thành công',
      data: topics
    });
  } catch (error) {
    console.error('Error getting public topics:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách chủ đề'
    });
  }
};
