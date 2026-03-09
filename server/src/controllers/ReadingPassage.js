const ReadingPassage = require('../models/ReadingPassage');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');

/**
 * Reading Passage Controller
 * Manages CRUD operations for reading passages
 */

// Admin: Get all reading passages (with pagination and filters)
exports.getAllReadingPassagesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, level, topic, is_active } = req.query;
    
    const query = {};
    
    // Search in title, passage, tags
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by level
    if (level) {
      query.level = level;
    }
    
    // Filter by topic
    if (topic) {
      query.topics = topic;
    }
    
    // Filter by active status
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    
    const passages = await ReadingPassage.find(query)
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const count = await ReadingPassage.countDocuments(query);
    
    res.json({
      message: 'Lấy danh sách bài đọc thành công',
      data: {
        passages,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
  } catch (error) {
    console.error('Error getting reading passages:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách bài đọc'
    });
  }
};

// Admin: Get statistics
exports.getReadingPassageStats = async (req, res) => {
  try {
    const total = await ReadingPassage.countDocuments();
    const active = await ReadingPassage.countDocuments({ is_active: true });
    const inactive = await ReadingPassage.countDocuments({ is_active: false });
    
    const byLevel = await ReadingPassage.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);
    
    const avgWordCount = await ReadingPassage.aggregate([
      { $group: { _id: null, avg: { $avg: '$word_count' } } }
    ]);
    
    const avgQuestions = await ReadingPassage.aggregate([
      { $project: { questionCount: { $size: { $ifNull: ['$questions', []] } } } },
      { $group: { _id: null, avg: { $avg: '$questionCount' } } }
    ]);
    
    res.json({
      message: 'Lấy thống kê thành công',
      data: {
        total,
        active,
        inactive,
        byLevel: byLevel.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        avgWordCount: Math.round(avgWordCount[0]?.avg || 0),
        avgQuestions: Math.round(avgQuestions[0]?.avg || 0)
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê'
    });
  }
};

// Admin: Create reading passage
exports.createReadingPassage = async (req, res) => {
  try {
    const passageData = {
      ...req.body,
      created_by: req.userId || req.user?._id
    };
    
    // Calculate word_count if passage is provided (since pre-save hook is disabled)
    if (passageData.passage && !passageData.word_count) {
      passageData.word_count = passageData.passage.trim().split(/\s+/).length;
    }
    
    const passage = await ReadingPassage.create(passageData);
    const populatedPassage = await ReadingPassage.findById(passage._id)
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email');
    
    res.status(201).json({
      message: 'Tạo bài đọc thành công',
      data: populatedPassage
    });
  } catch (error) {
    console.error('Error creating reading passage:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      message: 'Lỗi server khi tạo bài đọc'
    });
  }
};

// Admin: Update reading passage
exports.updateReadingPassage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Calculate word_count if passage is modified (since pre-save hook is disabled)
    if (req.body.passage && !req.body.word_count) {
      req.body.word_count = req.body.passage.trim().split(/\s+/).length;
    }
    
    const passage = await ReadingPassage.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email');
    
    if (!passage) {
      return res.status(404).json({
        message: 'Không tìm thấy bài đọc'
      });
    }
    
    res.json({
      message: 'Cập nhật bài đọc thành công',
      data: passage
    });
  } catch (error) {
    console.error('Error updating reading passage:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      message: 'Lỗi server khi cập nhật bài đọc'
    });
  }
};

// Admin: Delete reading passage
exports.deleteReadingPassage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const passage = await ReadingPassage.findByIdAndDelete(id);
    
    if (!passage) {
      return res.status(404).json({
        message: 'Không tìm thấy bài đọc'
      });
    }
    
    res.json({
      message: 'Xóa bài đọc thành công'
    });
  } catch (error) {
    console.error('Error deleting reading passage:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa bài đọc'
    });
  }
};

// Admin: Bulk delete
exports.bulkDeleteReadingPassages = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Danh sách ID không hợp lệ'
      });
    }
    
    const result = await ReadingPassage.deleteMany({
      _id: { $in: ids }
    });
    
    res.json({
      message: `Đã xóa ${result.deletedCount} bài đọc`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa hàng loạt'
    });
  }
};

// Admin: Import from CSV
exports.importReadingPassagesFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Vui lòng upload file CSV'
      });
    }
    
    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        let successCount = 0;
        
        for (let i = 0; i < results.length; i++) {
          try {
            const row = results[i];
            
            // Parse topics (support both names and ObjectIDs)
            let topicIds = [];
            if (row.topics) {
              const topicStrings = row.topics.split('|').map(t => t.trim()).filter(t => t);
              
              for (const topicStr of topicStrings) {
                if (mongoose.Types.ObjectId.isValid(topicStr) && topicStr.length === 24) {
                  topicIds.push(topicStr);
                } else {
                  const topic = await Topic.findOne({ 
                    name: new RegExp(`^${topicStr}$`, 'i')
                  });
                  if (topic) {
                    topicIds.push(topic._id);
                  }
                }
              }
            }
            
            // Parse questions (JSON format)
            let questions = [];
            if (row.questions) {
              try {
                questions = JSON.parse(row.questions);
              } catch (e) {
                console.warn(`Row ${i + 1}: Invalid questions JSON`);
              }
            }
            
            // Parse tags
            const tags = row.tags ? row.tags.split('|').map(t => t.trim()).filter(t => t) : [];
            
            const passageData = {
              title: row.title,
              passage: row.passage,
              level: row.level || 'beginner',
              topics: topicIds,
              questions: questions,
              source: row.source,
              tags: tags,
              image_url: row.image_url,
              audio_url: row.audio_url,
              estimated_time: parseInt(row.estimated_time) || 5,
              difficulty_score: parseInt(row.difficulty_score) || 5,
              is_active: row.is_active === 'false' ? false : true,
              created_by: req.userId || req.user?._id
            };
            
            await ReadingPassage.create(passageData);
            successCount++;
          } catch (err) {
            errors.push({
              row: i + 1,
              data: results[i],
              error: err.message
            });
          }
        }
        
        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          message: `Import hoàn tất: ${successCount} thành công, ${errors.length} thất bại`,
          success: successCount,
          failed: errors.length,
          errors: errors.slice(0, 5) // Return first 5 errors
        });
      });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({
      message: 'Lỗi server khi import CSV'
    });
  }
};

// Admin: Export to CSV
exports.exportReadingPassagesToCSV = async (req, res) => {
  try {
    const passages = await ReadingPassage.find({ is_active: true })
      .populate('topics', 'name')
      .sort({ created_at: -1 });
    
    const csvData = passages.map(p => ({
      title: p.title,
      passage: p.passage,
      level: p.level,
      cefr_level: p.cefr_level,
      content_type: p.content_type,
      genre: p.genre || '',
      topics: p.topics.map(t => t.name).join('|'),
      questions: JSON.stringify(p.questions),
      word_count: p.word_count,
      estimated_time: p.estimated_time,
      source: p.source || '',
      tags: p.tags.join('|'),
      image_url: p.image_url || '',
      audio_url: p.audio_url || '',
      difficulty_score: p.difficulty_score,
      ai_generated: p.ai_generated || false,
      is_active: p.is_active
    }));
    
    res.json({
      message: 'Export thành công',
      data: csvData
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      message: 'Lỗi server khi export CSV'
    });
  }
};

// ============ AI FEATURES ============

// AI Generate Text
exports.generatePassageWithAI = async (req, res) => {
  try {
    const { prompt, content_type, cefr_level, word_count, tone } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        message: 'Prompt is required'
      });
    }
    
    // Call Python AI Service
    const axios = require('axios');
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate-text`, {
        prompt,
        content_type: content_type || 'article',
        cefr_level: cefr_level || 'B1',
        word_count: word_count || 200,
        tone: tone || 'neutral'
      }, {
        timeout: 30000 // 30s timeout
      });
      
      res.json({
        message: 'AI generated text successfully',
        data: {
          generated_text: aiResponse.data.text,
          word_count: aiResponse.data.word_count,
          tokens_used: aiResponse.data.tokens_used
        }
      });
    } catch (aiError) {
      console.error('AI Service Error:', aiError.message);
      
      // Fallback: Return template
      const template = `Dear [Recipient],

I am writing to express my concern regarding [topic]. As a [role], I have noticed that [issue].

I would appreciate it if you could [request].

Thank you for your attention to this matter.

Best regards,
[Your name]`;
      
      res.json({
        message: 'AI service unavailable, returned template',
        data: {
          generated_text: template,
          word_count: template.split(/\s+/).length,
          is_template: true
        }
      });
    }
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({
      message: 'Lỗi server khi generate text'
    });
  }
};

// Scan & Link Vocabulary
exports.scanAndLinkVocabulary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const passage = await ReadingPassage.findById(id);
    if (!passage) {
      return res.status(404).json({
        message: 'Không tìm thấy bài đọc'
      });
    }
    
    // Get all active vocabulary
    const Vocabulary = require('../models/Vocabulary');
    const vocabList = await Vocabulary.find({ is_active: true });
    
    const linked = [];
    const passageText = passage.passage.toLowerCase();
    
    // Find matching words and their positions
    vocabList.forEach(vocab => {
      const word = vocab.word.toLowerCase();
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      
      const positions = [];
      while ((match = regex.exec(passage.passage)) !== null) {
        positions.push({
          start: match.index,
          end: match.index + match[0].length
        });
      }
      
      if (positions.length > 0) {
        linked.push({
          word_id: vocab._id,
          word: vocab.word,
          positions: positions
        });
      }
    });
    
    // Update passage with linked vocabulary
    passage.linked_vocabulary = linked;
    await passage.save();
    
    res.json({
      message: `Đã link ${linked.length} từ vựng`,
      data: {
        passage_id: passage._id,
        linked_count: linked.length,
        linked_vocabulary: linked
      }
    });
  } catch (error) {
    console.error('Error scanning vocabulary:', error);
    res.status(500).json({
      message: 'Lỗi server khi scan từ vựng'
    });
  }
};

// Track Usage
exports.trackPassageUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const passage = await ReadingPassage.findByIdAndUpdate(
      id,
      {
        $inc: { usage_count: 1 },
        last_used_at: new Date()
      },
      { new: true }
    );
    
    if (!passage) {
      return res.status(404).json({
        message: 'Không tìm thấy bài đọc'
      });
    }
    
    res.json({
      message: 'Tracked usage successfully',
      data: {
        usage_count: passage.usage_count
      }
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({
      message: 'Lỗi server khi track usage'
    });
  }
};

// Get Passages for Lesson Builder (with filters)
exports.getPassagesForLessonBuilder = async (req, res) => {
  try {
    const { search, content_type, cefr_level, topic, limit = 20 } = req.query;
    
    const query = { is_active: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (content_type) {
      query.content_type = content_type;
    }
    
    if (cefr_level) {
      query.cefr_level = cefr_level;
    }
    
    if (topic) {
      query.topics = topic;
    }
    
    const passages = await ReadingPassage.find(query)
      .populate('topics', 'name level icon_image_url')
      .populate('linked_vocabulary.word_id', 'word meaning')
      .select('title passage content_type cefr_level word_count estimated_time topics linked_vocabulary vocab_highlights questions image_url')
      .sort({ usage_count: -1, created_at: -1 })
      .limit(parseInt(limit));
    
    res.json({
      message: 'Lấy danh sách bài đọc thành công',
      data: passages
    });
  } catch (error) {
    console.error('Error getting passages for lesson builder:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách bài đọc'
    });
  }
};

// AI Generate với Agentic System
exports.generateWithAI = async (req, res) => {
  try {
    const axios = require('axios');
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    
    const {
      topic,
      cefr_level = 'B1',
      wordCount = 150,
      tone = 'neutral',
      topicHints = '',
      core_vocab = [],
      maxRetries = 3,
      save = false
    } = req.body;
    
    console.log('🤖 Calling Agentic AI Service:', { topic, cefr_level, wordCount });
    
    // Forward request to Python AI service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/agentic/generate-reading`, {
      topic,
      cefr_level,
      wordCount,
      tone,
      topicHints,
      core_vocab,
      maxRetries
    }, {
      timeout: 120000 // 2 minutes timeout
    });
    
    const result = aiResponse.data;
    
    // If save flag is true, persist to database
    if (save && result.status === 'success') {
      const newPassage = new ReadingPassage({
        title: result.title,
        passage: result.passage,
        level: req.body.level || 'intermediate', // basic level
        cefr_level: result.cefr_level,
        content_type: req.body.content_type || 'article',
        genre: req.body.genre || '',
        topics: req.body.topics || [],
        word_count: result.word_count,
        ai_generated: true,
        ai_prompt: JSON.stringify({ topic, cefr_level, wordCount, tone }),
        created_by: req.user._id
      });
      
      await newPassage.save();
      
      result.saved = true;
      result.passage_id = newPassage._id;
      
      console.log('✅ AI generated passage saved:', newPassage._id);
    }
    
    res.json({
      success: true,
      ...result  // Spread result directly into response
    });
    
  } catch (error) {
    console.error('❌ AI Generate Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Lỗi khi generate với AI',
      error: error.response?.data?.error || error.message
    });
  }
};

// ── USER-FACING: list passages for practice ──────────────────────────────────
// ── USER-FACING: get topics that have reading passages ───────────────────────
exports.getReadingTopics = async (req, res) => {
  try {
    // Aggregate: find all topic IDs that have at least 1 active passage
    const rows = await ReadingPassage.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$topics' },
      { $group: { _id: '$topics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (!rows.length) {
      return res.json({ success: true, data: { topics: [], uncategorized: 0 } });
    }

    const topicIds = rows.filter(r => r._id).map(r => r._id);
    const topics   = await Topic.find({ _id: { $in: topicIds } })
      .select('name icon_name cover_image level description')
      .lean();

    const countMap = {};
    rows.forEach(r => { if (r._id) countMap[r._id.toString()] = r.count; });

    const result = topics.map(t => ({
      ...t,
      passage_count: countMap[t._id.toString()] || 0,
    })).sort((a, b) => b.passage_count - a.passage_count);

    // Count passages with no topic
    const uncategorized = await ReadingPassage.countDocuments({
      is_active: true,
      $or: [{ topics: { $exists: false } }, { topics: { $size: 0 } }],
    });

    res.json({ success: true, data: { topics: result, uncategorized } });
  } catch (err) {
    console.error('getReadingTopics error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getPassagesForPractice = async (req, res) => {
  try {
    const { search, level, cefr_level, topic, uncategorized, page = 1, limit = 12 } = req.query;
    const query = { is_active: true };

    if (search) query.$text = { $search: search };
    if (level)      query.level      = level;
    if (cefr_level) query.cefr_level = cefr_level;
    if (topic)      query.topics = topic;
    if (uncategorized === '1') {
      query.$or = [{ topics: { $exists: false } }, { topics: { $size: 0 } }];
    }

    const passages = await ReadingPassage.find(query)
      .populate('topics', 'name level')
      .select('title passage cefr_level level word_count estimated_time image_url vocab_highlights questions usage_count')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Strip HTML from passage preview
    const clean = passages.map(p => ({
      ...p,
      passage_preview: (p.passage || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 200),
    }));

    const total = await ReadingPassage.countDocuments(query);

    res.json({
      success: true,
      data: {
        passages: clean,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (err) {
    console.error('getPassagesForPractice error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── USER-FACING: get single passage for practice ─────────────────────────────
exports.getPassageForPractice = async (req, res) => {
  try {
    const passage = await ReadingPassage.findOne({ _id: req.params.id, is_active: true })
      .populate('topics', 'name level')
      .lean();

    if (!passage) return res.status(404).json({ message: 'Không tìm thấy bài đọc' });

    // Strip HTML from passage text
    passage.passage = (passage.passage || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    res.json({ success: true, data: passage });
  } catch (err) {
    console.error('getPassageForPractice error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
