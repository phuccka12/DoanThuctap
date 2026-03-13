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
    const [total, active, byLevelArr, bySectionArr, questionStats] = await Promise.all([
      ListeningPassage.countDocuments(),
      ListeningPassage.countDocuments({ is_active: true }),
      ListeningPassage.aggregate([{ $group: { _id: '$level',   count: { $sum: 1 } } }]),
      ListeningPassage.aggregate([{ $group: { _id: '$section', count: { $sum: 1 } } }]),
      ListeningPassage.aggregate([
        { $project: { questionCount: { $size: { $ifNull: ['$questions', []] } } } },
        { $group: { _id: null, total: { $sum: '$questionCount' }, avg: { $avg: '$questionCount' } } },
      ]),
    ]);

    // Convert arrays to objects for easier consumption
    const byLevel   = {};
    byLevelArr.forEach(({ _id, count }) => { if (_id) byLevel[_id]   = count; });
    const bySection = {};
    bySectionArr.forEach(({ _id, count }) => { if (_id) bySection[_id] = count; });

    const totalQuestions = questionStats[0]?.total ?? 0;
    const avgQuestions   = questionStats[0]?.avg   ?? 0;

    res.json({
      message: 'OK',
      data: {
        total, active, inactive: total - active,
        byLevel, bySection,
        totalQuestions, avgQuestions: Math.round(avgQuestions * 10) / 10,
      },
    });
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

// ── DUPLICATE ────────────────────────────────────────────────────────────────
exports.duplicate = async (req, res) => {
  try {
    const original = await ListeningPassage.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ message: 'Không tìm thấy bài nghe' });

    const { _id, created_at, updated_at, ...rest } = original;
    const copy = await ListeningPassage.create({
      ...rest,
      title: `${rest.title} (Bản sao)`,
      is_active: false,
      created_by: req.userId,
    });
    res.status(201).json({ message: 'Đã nhân đôi bài nghe', data: copy });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── BULK DELETE ──────────────────────────────────────────────────────────────
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });

    const result = await ListeningPassage.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Đã xoá ${result.deletedCount} bài nghe` });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ── BULK TOGGLE ──────────────────────────────────────────────────────────────
exports.bulkToggle = async (req, res) => {
  try {
    const { ids, is_active } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });

    await ListeningPassage.updateMany({ _id: { $in: ids } }, { is_active: !!is_active });
    res.json({ message: `Đã cập nhật ${ids.length} bài nghe` });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};
