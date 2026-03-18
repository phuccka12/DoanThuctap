const WritingScenario = require('../models/WritingScenario');
const Topic = require('../models/Topic');
const WritingScenarioProgress = require('../models/WritingScenarioProgress');
const WritingScenarioSubmission = require('../models/WritingScenarioSubmission');
const Pet = require('../models/Pet');
const economyService = require('../services/economyService');

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

// User: Get all active scenarios
exports.getAllScenariosUser = async (req, res) => {
  try {
    const { search, scenario_type } = req.query;
    const query = { is_active: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (scenario_type) {
      query.scenario_type = scenario_type;
    }
    
    const scenarios = await WritingScenario.find(query)
      .select('-forbidden_words -rubric.tone_match.description -rubric.vocabulary.description -rubric.creativity.description -rubric.grammar.description')
      .populate('topics', 'name level icon_image_url')
      .sort({ created_at: -1 });
    
    res.json({
      message: 'Lấy danh sách scenarios thành công',
      data: { scenarios }
    });
  } catch (error) {
    console.error('Error getting scenarios (user):', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách scenarios'
    });
  }
};

// User: Get all scenarios with progress
exports.getAllScenariosUser = async (req, res) => {
  try {
    const { search, scenario_type } = req.query;
    const query = { is_active: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (scenario_type) {
      query.scenario_type = scenario_type;
    }
    
    const scenarios = await WritingScenario.find(query)
      .select('-forbidden_words -rubric.tone_match.description -rubric.vocabulary.description -rubric.creativity.description -rubric.grammar.description')
      .populate('topics', 'name level icon_image_url')
      .sort({ created_at: -1 })
      .lean();

    // Get user progress if logged in
    let progressData = [];
    if (req.userId) {
      progressData = await WritingScenarioProgress.find({ userId: req.userId }).lean();
    }

    const progressMap = progressData.reduce((acc, p) => {
      acc[p.scenarioId.toString()] = p;
      return acc;
    }, {});

    const enrichedScenarios = scenarios.map(s => ({
      ...s,
      userProgress: progressMap[s._id.toString()] || null
    }));
    
    res.json({ 
      message: 'Lấy danh sách scenarios thành công',
      data: { scenarios: enrichedScenarios }
    });
  } catch (error) {
    console.error('Error getting scenarios (user):', error);
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

// ─── optional Gemini AI ───────────────────────────────────────────────────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (_) { /* package not installed — AI evaluation disabled */ }

// ... (các hàm khác giữ nguyên)

// Evaluate submission with AI
exports.evaluateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, timeSpentSec = 0 } = req.body;
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        message: 'Bài viết quá ngắn để đánh giá'
      });
    }

    const scenario = await WritingScenario.findById(id);
    if (!scenario) {
      return res.status(404).json({
        message: 'Không tìm thấy scenario'
      });
    }

    // 🟢 KIỂM TRA QUOTA & QUYỀN TRUY CẬP
    const aiService = require('../services/aiService');
    const quota = await aiService.checkQuota(req.userId, 'writing');
    if (!quota.allowed) {
        return res.status(403).json({ 
            message: quota.reason, 
            code: 'QUOTA_EXCEEDED',
            limitReached: true 
        });
    }

    // Increment usage count for the scenario itself
    scenario.usage_count += 1;
    await scenario.save();
    
    // Ghi nhận lượt sử dụng AI
    await aiService.incrementUsage(req.userId, 'writing');

    if (!genAI) {
      return res.status(500).json({
        message: 'AI Evaluation chưa được cấu hình (Thiếu API Key)'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `
      Bạn là một AI đóng vai Persona để chấm điểm bài viết của học sinh.
      
      # CONTEXT (Bối cảnh):
      - Bối cảnh: ${scenario.context_description}
      - Tình huống: ${scenario.situation_prompt}
      - Loại bài viết: ${scenario.scenario_type}
      
      # AI PERSONA (Người nhận bài/Chấm bài):
      - Vai trò: ${scenario.ai_persona.role}
      - Tính cách: ${scenario.ai_persona.personality}
      - Phong cách phản hồi: ${scenario.ai_persona.feedback_style}
      - Template phản hồi: ${scenario.ai_persona.response_template || '{{feedback}} Score: {{score}}/10'}
      
      # GAME RULES (Luật chơi):
      - Từ cấm (Forbidden): ${scenario.forbidden_words.join(', ') || 'Không có'}
      - Từ bắt buộc (Required): ${scenario.required_keywords.join(', ') || 'Không có'}
      - Tone mục tiêu: ${scenario.target_tone} (Intensity: ${scenario.tone_intensity}/10)
      
      # RUBRIC (Tiêu chí chấm điểm - Trọng số):
      - Tone Match: ${scenario.rubric.tone_match.weight}% (${scenario.rubric.tone_match.description})
      - Vocabulary (Keywords): ${scenario.rubric.vocabulary.weight}% (${scenario.rubric.vocabulary.description})
      - Creativity: ${scenario.rubric.creativity.weight}% (${scenario.rubric.creativity.description})
      - Grammar: ${scenario.rubric.grammar.weight}% (${scenario.rubric.grammar.description})
      
      # USER SUBMISSION (Bài viết của bạn):
      "${text}"
      
      # YÊU CẦU:
      1. Đánh giá bài viết dựa trên các tiêu chí trên.
      2. Phân tích điểm mạnh, điểm yếu và gợi ý sửa lỗi bằng TIẾNG VIỆT.
      3. RIÊNG phần "better_version" PHẢI LÀ TIẾNG ANH (vì người dùng đang học tiếng Anh).
      4. Phải sử dụng "Template phản hồi" để tạo ra nội dung cho trường "persona_feedback". Thay thế {{score}} bằng điểm overall, {{feedback}} bằng nhận xét chung, {{encouragement}} bằng lời động viên.
      5. Toàn bộ nhận xét (feedback, suggestions) phải đúng phong cách và tính cách của Persona.
      6. Trả về JSON theo định dạng sau:
      {
        "overall_score": 0-100,
        "radar_chart": {
          "tone": 0-10,
          "vocab": 0-10,
          "creativity": 0-10,
          "grammar": 0-10
        },
        "persona_feedback": "Nội dung phản hồi theo đúng TEMPLATE và VĂN PHONG của Persona (Tiếng Việt)",
        "detailed_analysis": {
          "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
          "cons": ["Điểm yếu 1", "Điểm yếu 2"],
          "suggestions": ["Gợi ý sửa 1", "Gợi ý sửa 2"]
        },
        "better_version": "Bản viết hay hơn hoàn toàn bằng TIẾNG ANH"
      }
    `;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (aiError) {
      console.error('Gemini AI Error:', aiError);
      
      // Handle Service Unavailable (503)
      if (aiError.status === 503 || aiError.message?.includes('503')) {
        return res.status(503).json({
          message: 'Dịch vụ AI đang bận (503). Ní vui lòng đợi vài giây rồi thử lại nhé! 🧘‍♂️'
        });
      }

      // Handle Quota (429)
      if (aiError.status === 429 || aiError.message?.includes('429')) {
        return res.status(429).json({
          message: 'Hết lượt sử dụng AI miễn phí (429). Ní vui lòng đợi 1 phút nhé! ⏳'
        });
      }

      throw aiError; // Pass to general catch
    }

    const response = await result.response;
    const responseText = response.text();
    
    // Parse JSON from AI response
    let evaluation;
    try {
      // Clean up common AI JSON mistakes
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Remove trailing commas before closing braces/brackets
        jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1');
        
        try {
          evaluation = JSON.parse(jsonStr);
        } catch (innerError) {
          console.error('Initial JSON parse failed, attempting loose parse:', innerError);
          // Fallback: try to fix common quote issues or other minor syntax errors if possible
          // For now, if it fails, throw to the outer catch
          throw innerError;
        }
      } else {
        throw new Error('AI response does not contain a JSON object');
      }
    } catch (parseError) {
      console.error('Error parsing AI evaluation (Final):', parseError);
      return res.status(500).json({
        message: 'AI trả về định dạng không hợp lệ. Ní thử nộp lại hoặc chỉnh sửa nội dung bài viết một chút nhé!'
      });
    }

    // Update scenario average score
    const totalCompletions = (scenario.completion_count || 0) + 1;
    scenario.average_score = (((scenario.average_score || 0) * (scenario.completion_count || 0)) + (evaluation.overall_score || 0)) / totalCompletions;
    scenario.completion_count = totalCompletions;
    await scenario.save();

    // ── AWARD COINS & EXP ──────────────────
    let rewardResult = { earned: 0, expGain: 0, pet: null };
    const scoreNum = evaluation.overall_score || 0;
    
    if (req.userId) {
      // Determine base coins based on difficulty (5-10 range)
      const baseCoins = await economyService.getNum('economy_reward_writing', 30);
      const earnAmount = Math.round(baseCoins * (scoreNum / 100));

      if (earnAmount > 0) {
        try {
          const coinResult = await economyService.earnCoins(req.userId, 'writing_scenario', earnAmount);
          rewardResult.earned = coinResult.earned;
          rewardResult.pet = coinResult.pet;
        } catch (coinErr) {
          console.error('Error awarding coins:', coinErr);
        }
      }

      // Award Pet EXP
      try {
        const pet = rewardResult.pet || await Pet.findOne({ user: req.userId });
        if (pet) {
          const petState = await economyService.getPetState(pet);
          const buffMult = await economyService.getPetBuffMultiplier(pet, 'writing');
          const baseExp = await economyService.getNum('economy_reward_exp_writing', 50); 
          const expGain = petState.expLocked ? 0 : Math.round(baseExp * (scoreNum / 100) * petState.expMultiplier * buffMult);

          if (expGain > 0) {
            pet.growthPoints += expGain;
            const expNeeded = await economyService.getExpNeeded(pet);
            while (pet.growthPoints >= expNeeded) {
              pet.growthPoints -= expNeeded;
              pet.level += 1;
            }
            await pet.save();
            rewardResult.expGain = expGain;
            rewardResult.pet = pet;
          }
        }
      } catch (petErr) {
        console.error('Error awarding pet exp:', petErr);
      }

      // Save User Progress
      try {
        let progress = await WritingScenarioProgress.findOne({ userId: req.userId, scenarioId: id });
        if (!progress) {
          progress = new WritingScenarioProgress({
            userId: req.userId,
            scenarioId: id,
            bestScore: scoreNum,
            isCompleted: scoreNum >= 50, 
            attempts: 1,
            timeSpentSec: timeSpentSec,
            lastSubmissionText: text,
            rewarded: true, 
            coinsEarned: rewardResult.earned,
            expEarned: rewardResult.expGain,
            completedAt: scoreNum >= 50 ? new Date() : null
          });
        } else {
          progress.attempts += 1;
          if (scoreNum > (progress.bestScore || 0)) {
            progress.bestScore = scoreNum;
          }
          if (scoreNum >= 50) {
            progress.isCompleted = true;
            if (!progress.completedAt) progress.completedAt = new Date();
          }
          progress.lastSubmissionText = text;
          progress.coinsEarned += rewardResult.earned;
          progress.expEarned += rewardResult.expGain;
          progress.timeSpentSec = (progress.timeSpentSec || 0) + timeSpentSec;
        }
        await progress.save();

        // ── SAVE SUBMISSION HISTORY ──────────
        try {
          await WritingScenarioSubmission.create({
            userId: req.userId,
            scenarioId: id,
            content: text,
            evaluation: evaluation,
            reward: {
              coins: rewardResult.earned,
              exp: rewardResult.expGain
            }
          });
        } catch (historyErr) {
          console.error('Error saving submission history:', historyErr);
        }
      } catch (progErr) {
        console.error('Error saving progress:', progErr);
      }
    }

    const petDoc = rewardResult.pet || (req.userId ? await Pet.findOne({ user: req.userId }).lean() : null);
    const petState = petDoc ? await economyService.getPetState(petDoc) : null;

    res.json({
      message: 'Đánh giá hoàn tất',
      data: {
        evaluation,
        reward: {
          coins: rewardResult.earned,
          exp: rewardResult.expGain,
          petState,
          pet: petDoc ? { 
            coins: petDoc.coins, 
            level: petDoc.level, 
            growthPoints: petDoc.growthPoints,
            petType: petDoc.petType 
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Error evaluating submission:', error);
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({
        message: 'Hết lượt sử dụng AI miễn phí (429). Ní vui lòng đợi khoảng 1 phút nhé! ⏳'
      });
    }

    res.status(500).json({
      message: 'Lỗi server khi đánh giá bài viết. Ní thử lại sau nhé!'
    });
  }
};

// User: Get submission history for a specific scenario
exports.getScenarioHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.userId) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để xem lịch sử' });
    }

    const submissions = await WritingScenarioSubmission.find({
      userId: req.userId,
      scenarioId: id
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 attempts

    res.json({
      message: 'Lấy lịch sử bài viết thành công',
      data: submissions
    });
  } catch (error) {
    console.error('Error getting scenario history:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy lịch sử bài viết'
    });
  }
};

module.exports = exports;
