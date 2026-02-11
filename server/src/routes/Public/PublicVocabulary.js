const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/authMiddleware');
const Vocabulary = require('../../models/Vocabulary');
const Topic = require('../../models/Topic');

/**
 * Public/User Vocabulary Routes
 * Base path: /api/vocabularies
 * For user flashcard and learning features
 */

// GET /api/vocabularies - Get all active vocabularies for user
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      level = '', 
      topic = '',
      search = ''
    } = req.query;

    const query = { is_active: true };

    // Filters
    if (level) query.level = level;
    if (topic) query.topics = topic;
    
    // Search
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const vocabularies = await Vocabulary.find(query)
      .populate('topics', 'name slug')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vocabulary.countDocuments(query);

    res.json({
      data: vocabularies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching vocabularies:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/vocabularies/:id - Get single vocabulary
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vocabulary = await Vocabulary.findById(id)
      .populate('topics', 'name slug cover_image');
    
    if (!vocabulary || !vocabulary.is_active) {
      return res.status(404).json({ message: 'Không tìm thấy từ vựng' });
    }
    
    res.json({ data: vocabulary });
  } catch (err) {
    console.error('Error fetching vocabulary:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;
