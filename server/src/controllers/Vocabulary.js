const Vocabulary = require('../models/Vocabulary');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Vocabulary Controller
 * Handles vocabulary bank CRUD operations, search, filtering, and CSV import
 */

// GET /api/admin/vocab - Get all vocabularies with pagination & filters
exports.getVocabularies = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      level = '', 
      topic = '',
      tags = '',
      part_of_speech = '',
      has_media = ''
    } = req.query;

    const query = { is_active: true };

    // Text search
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } },
        { example: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (level) query.level = level;
    if (topic) query.topics = topic;
    if (part_of_speech) query.part_of_speech = part_of_speech;
    if (tags) query.tags = { $in: tags.split(',') };
    
    if (has_media === 'true') {
      query.$or = [
        { imageUrl: { $exists: true, $ne: null } },
        { audioUrl: { $exists: true, $ne: null } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [vocabularies, total] = await Promise.all([
      Vocabulary.find(query)
        .populate('topics', 'name')
        .populate('created_by', 'name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vocabulary.countDocuments(query)
    ]);

    res.json({
      data: vocabularies,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching vocabularies:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/admin/vocab/stats - Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const stats = await Vocabulary.getStats();
    
    // Get top tags
    const topTags = await Vocabulary.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get vocabulary count by topics
    const topicStats = await Vocabulary.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$topics' },
      { $group: { _id: '$topics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: '_id',
          as: 'topicInfo'
        }
      },
      { $unwind: '$topicInfo' },
      {
        $project: {
          topicId: '$_id',
          topicName: '$topicInfo.name',
          count: 1
        }
      }
    ]);
    
    res.json({
      data: {
        ...stats,
        topTags: topTags.map(t => ({ tag: t._id, count: t.count })),
        topicStats: topicStats
      }
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/admin/vocab/:id - Get single vocabulary
exports.getVocabularyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vocabulary = await Vocabulary.findById(id)
      .populate('topics', 'name cover_image')
      .populate('created_by', 'name email');
    
    if (!vocabulary) {
      return res.status(404).json({ message: 'Không tìm thấy từ vựng' });
    }
    
    res.json({ data: vocabulary });
  } catch (err) {
    console.error('Error fetching vocabulary:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// POST /api/admin/vocab - Create new vocabulary
exports.createVocabulary = async (req, res) => {
  try {
    const {
      word,
      part_of_speech,
      pronunciation,
      meaning,
      example,
      synonyms,
      antonyms,
      imageUrl,
      audioUrl,
      level,
      topics,
      tags,
      notes
    } = req.body;

    // Validation
    if (!word || !meaning) {
      return res.status(400).json({ 
        message: 'Word và Meaning là bắt buộc' 
      });
    }

    // Check duplicate
    const duplicate = await Vocabulary.findDuplicate(word, part_of_speech);
    if (duplicate) {
      return res.status(400).json({ 
        message: `Từ "${word}" (${part_of_speech}) đã tồn tại trong kho` 
      });
    }

    const vocabulary = new Vocabulary({
      word,
      part_of_speech,
      pronunciation,
      meaning,
      example,
      synonyms: Array.isArray(synonyms) ? synonyms : [],
      antonyms: Array.isArray(antonyms) ? antonyms : [],
      imageUrl,
      audioUrl,
      level,
      topics: Array.isArray(topics) ? topics : [],
      tags: Array.isArray(tags) ? tags : [],
      notes,
      created_by: req.userId || req.user?._id // Support both req.userId and req.user._id
    });

    await vocabulary.save();
    
    await vocabulary.populate('topics', 'name');

    res.status(201).json({
      message: 'Tạo từ vựng thành công',
      data: vocabulary
    });
  } catch (err) {
    console.error('Error creating vocabulary:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// PUT /api/admin/vocab/:id - Update vocabulary
exports.updateVocabulary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vocabulary = await Vocabulary.findById(id);
    if (!vocabulary) {
      return res.status(404).json({ message: 'Không tìm thấy từ vựng' });
    }

    // Check duplicate if word/part_of_speech changed
    if (updateData.word || updateData.part_of_speech) {
      const wordToCheck = updateData.word || vocabulary.word;
      const posToCheck = updateData.part_of_speech || vocabulary.part_of_speech;
      
      const duplicate = await Vocabulary.findDuplicate(wordToCheck, posToCheck, id);
      if (duplicate) {
        return res.status(400).json({ 
          message: `Từ "${wordToCheck}" (${posToCheck}) đã tồn tại` 
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        vocabulary[key] = updateData[key];
      }
    });

    await vocabulary.save();
    await vocabulary.populate('topics', 'name');

    res.json({
      message: 'Cập nhật từ vựng thành công',
      data: vocabulary
    });
  } catch (err) {
    console.error('Error updating vocabulary:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// DELETE /api/admin/vocab/:id - Delete vocabulary (soft delete)
exports.deleteVocabulary = async (req, res) => {
  try {
    const { id } = req.params;

    const vocabulary = await Vocabulary.findById(id);
    if (!vocabulary) {
      return res.status(404).json({ message: 'Không tìm thấy từ vựng' });
    }

    // Soft delete
    vocabulary.is_active = false;
    await vocabulary.save();

    res.json({ 
      message: 'Xóa từ vựng thành công' 
    });
  } catch (err) {
    console.error('Error deleting vocabulary:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// DELETE /api/admin/vocab - Bulk delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs array is required' });
    }

    await Vocabulary.updateMany(
      { _id: { $in: ids } },
      { is_active: false }
    );

    res.json({ 
      message: `Đã xóa ${ids.length} từ vựng` 
    });
  } catch (err) {
    console.error('Error bulk deleting:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// POST /api/admin/vocab/import - Import from CSV
exports.importCSV = async (req, res) => {
  try {
    const { csvData } = req.body; // Array of objects or CSV string

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }

    let records = [];

    // If csvData is string, parse it
    if (typeof csvData === 'string') {
      const stream = Readable.from([csvData]);
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => records.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (Array.isArray(csvData)) {
      records = csvData;
    } else {
      return res.status(400).json({ message: 'Invalid CSV format' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      try {
        // Validate required fields
        if (!row.word || !row.meaning) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Missing word or meaning'
          });
          continue;
        }

        // Check duplicate
        const duplicate = await Vocabulary.findDuplicate(
          row.word, 
          row.part_of_speech || 'other'
        );
        
        if (duplicate) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            word: row.word,
            error: 'Duplicate entry'
          });
          continue;
        }

        // Parse and validate topics (support both ObjectId and topic names)
        let topicIds = [];
        if (row.topics) {
          const topicStrings = row.topics.split('|').map(t => t.trim()).filter(t => t);
          
          for (const topicStr of topicStrings) {
            // Check if it's a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(topicStr) && topicStr.length === 24) {
              topicIds.push(topicStr);
            } else {
              // Try to find topic by name
              const topic = await Topic.findOne({ 
                name: new RegExp(`^${topicStr}$`, 'i') // Case-insensitive match
              });
              
              if (topic) {
                topicIds.push(topic._id);
                console.log(`✅ Matched topic name "${topicStr}" to ID: ${topic._id}`);
              } else {
                console.warn(`⚠️ Topic not found: "${topicStr}" for word: ${row.word}`);
              }
            }
          }
        }

        // Create vocabulary
        const vocabulary = new Vocabulary({
          word: row.word,
          part_of_speech: row.part_of_speech || 'other',
          pronunciation: row.pronunciation,
          meaning: row.meaning,
          example: row.example,
          synonyms: row.synonyms ? row.synonyms.split(',').map(s => s.trim()) : [],
          antonyms: row.antonyms ? row.antonyms.split(',').map(a => a.trim()) : [],
          imageUrl: row.imageUrl,
          audioUrl: row.audioUrl,
          level: row.level || 'beginner',
          topics: topicIds,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          notes: row.notes,
          created_by: req.userId || req.user?._id // Support both req.userId and req.user._id
        });

        await vocabulary.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          word: row.word,
          error: err.message
        });
      }
    }

    res.json({
      message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
      data: results
    });
  } catch (err) {
    console.error('Error importing CSV:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/admin/vocab/export - Export to CSV format
exports.exportCSV = async (req, res) => {
  try {
    const vocabularies = await Vocabulary.find({ is_active: true })
      .populate('topics', 'name') // Populate topics to get names
      .sort({ word: 1 })
      .lean();

    const csvData = vocabularies.map(v => ({
      word: v.word,
      part_of_speech: v.part_of_speech,
      pronunciation: v.pronunciation || '',
      meaning: v.meaning,
      example: v.example || '',
      synonyms: v.synonyms?.join(', ') || '',
      antonyms: v.antonyms?.join(', ') || '',
      imageUrl: v.imageUrl || '',
      audioUrl: v.audioUrl || '',
      level: v.level,
      topics: v.topics?.map(t => t._id).join('|') || '', // Export topic IDs with | delimiter
      tags: v.tags?.join(', ') || '',
      notes: v.notes || ''
    }));

    res.json({
      data: csvData,
      count: csvData.length
    });
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
