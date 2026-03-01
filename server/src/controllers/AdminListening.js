const ListeningPassage = require('../models/ListeningPassage');

// ── GET all (admin) ──────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, level, section, is_active } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (level)  query.level = level;
    if (section) query.section = section;
    if (is_active !== undefined) query.is_active = is_active === 'true';

    const [passages, total] = await Promise.all([
      ListeningPassage.find(query)
        .populate('topics', 'name')
        .populate('created_by', 'user_name email')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ListeningPassage.countDocuments(query),
    ]);

    res.json({
      message: 'OK',
      data: { passages, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) },
    });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── GET one ──────────────────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const passage = await ListeningPassage.findById(req.params.id)
      .populate('topics', 'name')
      .populate('created_by', 'user_name email');
    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });
    res.json({ message: 'OK', data: passage });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── GET stats ────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [total, active, byLevel] = await Promise.all([
      ListeningPassage.countDocuments(),
      ListeningPassage.countDocuments({ is_active: true }),
      ListeningPassage.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]),
    ]);
    res.json({ message: 'OK', data: { total, active, inactive: total - active, byLevel } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, audio_url, duration_sec, transcript, level, section, topics, questions } = req.body;

    if (!title || !audio_url) {
      return res.status(400).json({ message: 'Tiêu đề và file audio là bắt buộc' });
    }

    const passage = await ListeningPassage.create({
      title, audio_url, duration_sec, transcript, level, section,
      topics: topics || [],
      questions: questions || [],
      created_by: req.userId,
    });

    res.status(201).json({ message: 'Tạo bài nghe thành công', data: passage });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const passage = await ListeningPassage.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });
    res.json({ message: 'Cập nhật thành công', data: passage });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── TOGGLE active ────────────────────────────────────────────────────────────
exports.toggleActive = async (req, res) => {
  try {
    const passage = await ListeningPassage.findById(req.params.id);
    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });
    passage.is_active = !passage.is_active;
    await passage.save();
    res.json({ message: `Đã ${passage.is_active ? 'kích hoạt' : 'ẩn'} bài nghe`, data: { is_active: passage.is_active } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const passage = await ListeningPassage.findByIdAndDelete(req.params.id);
    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });
    res.json({ message: 'Đã xoá bài nghe' });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
