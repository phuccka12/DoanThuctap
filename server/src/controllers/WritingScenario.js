const WritingScenario = require('../models/WritingScenario');
const Topic = require('../models/Topic');

/**
 * Writing Scenario Controller
 * Manages gamified writing scenarios (simulation-based learning)
 */

// Admin: Get all scenarios
exports.getAllScenariosAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, level, scenario_type, is_active } = req.query;
    
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (level) {
      query.level = level;
    }
    
    if (scenario_type) {
      query.scenario_type = scenario_type;
    }
    
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    
    const scenarios = await WritingScenario.find(query)
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const count = await WritingScenario.countDocuments(query);
    
    res.json({
      message: 'Lấy danh sách scenarios thành công',
      data: {
        scenarios,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count
      }
    });
  } catch (error) {
    console.error('Error getting scenarios:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách scenarios'
    });
  }
};

// Admin: Get statistics
exports.getScenarioStats = async (req, res) => {
  try {
    const total = await WritingScenario.countDocuments();
    const active = await WritingScenario.countDocuments({ is_active: true });
    const inactive = await WritingScenario.countDocuments({ is_active: false });
    
    const byType = await WritingScenario.aggregate([
      { $group: { _id: '$scenario_type', count: { $sum: 1 } } }
    ]);
    
    const byLevel = await WritingScenario.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);
    
    const avgUsage = await WritingScenario.aggregate([
      { $group: { _id: null, avg: { $avg: '$usage_count' } } }
    ]);
    
    res.json({
      message: 'Lấy thống kê thành công',
      data: {
        total,
        active,
        inactive,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byLevel: byLevel.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        avgUsage: Math.round(avgUsage[0]?.avg || 0)
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê'
    });
  }
};

// Admin: Create scenario
exports.createScenario = async (req, res) => {
  try {
    const scenarioData = {
      ...req.body,
      created_by: req.userId || req.user?._id
    };
    
    const scenario = await WritingScenario.create(scenarioData);
    const populatedScenario = await WritingScenario.findById(scenario._id)
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email');
    
    res.status(201).json({
      message: 'Tạo scenario thành công',
      data: populatedScenario
    });
  } catch (error) {
    console.error('Error creating scenario:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      message: 'Lỗi server khi tạo scenario'
    });
  }
};

// Admin: Update scenario
exports.updateScenario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const scenario = await WritingScenario.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email');
    
    if (!scenario) {
      return res.status(404).json({
        message: 'Không tìm thấy scenario'
      });
    }
    
    res.json({
      message: 'Cập nhật scenario thành công',
      data: scenario
    });
  } catch (error) {
    console.error('Error updating scenario:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      message: 'Lỗi server khi cập nhật scenario'
    });
  }
};

// Admin: Delete scenario
exports.deleteScenario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const scenario = await WritingScenario.findByIdAndDelete(id);
    
    if (!scenario) {
      return res.status(404).json({
        message: 'Không tìm thấy scenario'
      });
    }
    
    res.json({
      message: 'Xóa scenario thành công'
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa scenario'
    });
  }
};

// Admin: Bulk delete
exports.bulkDeleteScenarios = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Danh sách ID không hợp lệ'
      });
    }
    
    const result = await WritingScenario.deleteMany({
      _id: { $in: ids }
    });
    
    res.json({
      message: `Đã xóa ${result.deletedCount} scenarios`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa hàng loạt'
    });
  }
};

// Admin: Get single scenario
exports.getScenarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const scenario = await WritingScenario.findById(id)
      .populate('topics', 'name level icon_image_url')
      .populate('created_by', 'username email');
    
    if (!scenario) {
      return res.status(404).json({
        message: 'Không tìm thấy scenario'
      });
    }
    
    res.json({
      message: 'Lấy thông tin scenario thành công',
      data: scenario
    });
  } catch (error) {
    console.error('Error getting scenario:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin scenario'
    });
  }
};

// Validate user submission (real-time)
exports.validateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    const scenario = await WritingScenario.findById(id);
    
    if (!scenario) {
      return res.status(404).json({
        message: 'Không tìm thấy scenario'
      });
    }
    
    const violations = [];
    const warnings = [];
    
    // Check forbidden words
    if (scenario.forbidden_words && scenario.forbidden_words.length > 0) {
      const textLower = text.toLowerCase();
      scenario.forbidden_words.forEach(word => {
        if (textLower.includes(word.toLowerCase())) {
          violations.push({
            type: 'forbidden_word',
            word: word,
            message: `Cấm dùng từ "${word}"!`
          });
        }
      });
    }
    
    // Check required keywords
    const missingKeywords = [];
    if (scenario.required_keywords && scenario.required_keywords.length > 0) {
      const textLower = text.toLowerCase();
      scenario.required_keywords.forEach(keyword => {
        if (!textLower.includes(keyword.toLowerCase())) {
          missingKeywords.push(keyword);
        }
      });
      
      if (missingKeywords.length > 0) {
        warnings.push({
          type: 'missing_keywords',
          keywords: missingKeywords,
          message: `Chưa dùng các từ bắt buộc: ${missingKeywords.join(', ')}`
        });
      }
    }
    
    // Check word count
    const wordCount = text.trim().split(/\s+/).length;
    if (scenario.word_limit) {
      if (wordCount < scenario.word_limit.min) {
        warnings.push({
          type: 'word_count_low',
          current: wordCount,
          min: scenario.word_limit.min,
          message: `Quá ngắn! Cần ít nhất ${scenario.word_limit.min} từ.`
        });
      } else if (wordCount > scenario.word_limit.max) {
        warnings.push({
          type: 'word_count_high',
          current: wordCount,
          max: scenario.word_limit.max,
          message: `Quá dài! Tối đa ${scenario.word_limit.max} từ.`
        });
      }
    }
    
    res.json({
      valid: violations.length === 0,
      violations,
      warnings,
      word_count: wordCount
    });
  } catch (error) {
    console.error('Error validating submission:', error);
    res.status(500).json({
      message: 'Lỗi server khi kiểm tra'
    });
  }
};

module.exports = exports;
