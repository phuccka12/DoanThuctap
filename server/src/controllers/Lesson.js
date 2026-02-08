const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');

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
