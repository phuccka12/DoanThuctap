const User = require('../models/User');
const LessonProgress = require('../models/LessonProgress');
const CoinLog = require('../models/CoinLog');
const Pet = require('../models/Pet');
const mongoose = require('mongoose');
const WritingScenarioProgress = require('../models/WritingScenarioProgress');
const WritingPrompt = require('../models/WritingPrompt');
const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');

// Helper to get start and end of today
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Get today's practice tasks with Smart Navigation (Daily Quests + Recommended Lessons)
exports.getTodayTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { start, end } = getTodayRange();
    const Lesson = require('../models/Lesson');
    const Topic = require('../models/Topic');
    const UserPlan = require('../models/UserPlan');

    // ─── CALCULATE TODAY'S PROGRESS ───────────────────────────────────────────
    
    // 1. Count completed lessons TODAY
    const lessonsTodayCount = await LessonProgress.countDocuments({
      userId,
      completedAt: { $gte: start, $lte: end },
      score: { $gt: 0 }
    });

    // 2. Coins earned TODAY
    const coinsAgg = await CoinLog.aggregate([
      { $match: { 
        user: new mongoose.Types.ObjectId(userId), 
        timestamp: { $gte: start, $lte: end }, 
        amount: { $gt: 0 } 
      } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const coinsToday = coinsAgg.length > 0 ? coinsAgg[0].total : 0;

    // 3. Time spent TODAY (in seconds)
    // Use completedAt for LessonProgress and updatedAt for WritingScenarioProgress
    const lessonTimeAgg = await LessonProgress.aggregate([
      { $match: { 
        userId: new mongoose.Types.ObjectId(userId), 
        completedAt: { $gte: start, $lte: end } 
      } },
      { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSec' } } }
    ]);
    const writingTimeAgg = await WritingScenarioProgress.aggregate([
      { $match: { 
        userId: new mongoose.Types.ObjectId(userId), 
        updatedAt: { $gte: start, $lte: end } 
      } },
      { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSec' } } }
    ]);
    const timeSpentSecToday = (lessonTimeAgg[0]?.totalSeconds || 0) + (writingTimeAgg[0]?.totalSeconds || 0);

    // ─── SYNC WITH AI USER PLAN ──────────────────────────────────────────────
    
    const now = new Date();
    let dayIndex = now.getDay(); // 0=Sun, 1=Mon...
    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to 0=Mon, 6=Sun

    const activePlan = await UserPlan.findOne({ userId, status: 'active' }).lean();
    let aiRecommendedTask = null;

    if (activePlan && activePlan.dayItems) {
      const todayItem = activePlan.dayItems.find(item => item.dayIndex === dayIndex);
      if (todayItem) {
        let url = '/learn';
        let title = 'Tiếp tục lộ trình';
        let subtitle = 'Học theo kế hoạch AI';
        let currentProgress = 0;

        // Calculate actual progress for this specific item today
        if (todayItem.itemType === 'writing') {
            const wp = await WritingScenarioProgress.findOne({ 
                userId, 
                scenarioId: todayItem.itemId,
                updatedAt: { $gte: start, $lte: end }
            });
            if (wp) currentProgress = wp.bestScore || 100;
        } else if (['reading', 'listening', 'speaking'].includes(todayItem.itemType)) {
            const lp = await LessonProgress.findOne({
                userId,
                $or: [
                    { passageId: todayItem.itemId },
                    { speakingId: todayItem.itemId }
                ],
                completedAt: { $gte: start, $lte: end }
            });
            if (lp) currentProgress = lp.score || 100;
        } else if (todayItem.itemType === 'topic' || todayItem.itemType === 'lesson') {
            const lp = await LessonProgress.findOne({
                userId,
                lessonId: todayItem.itemId,
                completedAt: { $gte: start, $lte: end }
            });
            if (lp) currentProgress = lp.score || 100;
        }

        switch (todayItem.itemType) {
          case 'topic':
            url = `/learn/topics/${todayItem.itemId}`;
            title = 'Chủ đề hôm nay';
            subtitle = 'Mở rộng kiến thức tổng quát';
            break;
          case 'reading':
            url = '/reading';
            title = 'Luyện kỹ năng Đọc';
            subtitle = 'Nâng cao khả năng đọc hiểu';
            break;
          case 'speaking':
            url = '/speaking-practice';
            title = 'Luyện kỹ năng Nói';
            subtitle = 'Cải thiện phát âm và phản xạ';
            break;
          case 'writing':
            url = '/writing-scenarios';
            title = 'Luyện kỹ năng Viết';
            subtitle = 'Viết essay và nhận feedback AI';
            break;
          case 'listening':
            url = '/ai-listening';
            title = 'Luyện kỹ năng Nghe';
            subtitle = 'Thử thách nghe hiểu từ AI';
            break;
          case 'vocabulary':
            url = todayItem.topicId ? `/vocabulary/${todayItem.topicId}/learn` : '/vocabulary';
            title = 'Học từ vựng mới';
            subtitle = 'Mở rộng vốn từ vựng IELTS';
            // Simple check for vocab: if they earned any vocab coins today
            const vocabCoin = await CoinLog.findOne({ user: userId, source: 'vocab', timestamp: { $gte: start, $lte: end } });
            if (vocabCoin) currentProgress = 100;
            break;
          case 'grammar':
            url = `/grammar/${todayItem.itemId}`;
            title = 'Ngữ pháp trọng tâm';
            subtitle = 'Củng cố nền tảng ngữ pháp';
            break;
          case 'story':
            url = `/stories/${todayItem.itemId}/parts/1`;
            title = 'Đọc truyện tiếng Anh';
            subtitle = 'Thư giãn và học từ vựng';
            break;
        }

        aiRecommendedTask = {
          id: 'ai-plan',
          title,
          subtitle,
          type: todayItem.itemType,
          actionUrl: url,
          actionText: currentProgress >= 80 ? 'Hoàn thành' : 'Bắt đầu ngay',
          percent: Math.min(100, currentProgress)
        };
      }
    }

    // ─── FIND USER'S ACTIVE LESSON (In Progress - Fallback or Secondary) ─────
    
    const inProgressLesson = await LessonProgress.findOne({
      userId,
      rewarded: false, 
      score: { $lt: 100 }
    })
    .sort({ updated_at: -1 })
    .populate('lessonId', 'title topic_id duration')
    .populate({
      path: 'lessonId',
      populate: { path: 'topic_id', select: 'name slug' }
    });

    let recommendedLesson = null;
    if (inProgressLesson && inProgressLesson.lessonId) {
      recommendedLesson = {
        id: inProgressLesson.lessonId._id,
        title: inProgressLesson.lessonId.title,
        topicName: inProgressLesson.lessonId.topic_id?.name || 'Bài học',
        topicSlug: inProgressLesson.lessonId.topic_id?.slug,
        progress: inProgressLesson.score || 0,
        type: 'continue',
        actionText: 'Tiếp tục bài học',
        actionUrl: `/learn/lessons/${inProgressLesson.lessonId._id}`, // Fixed URL: /lessons/
        duration: inProgressLesson.lessonId.duration || 15,
        completedNodes: inProgressLesson.completedNodes?.length || 0
      };
    }

    // ─── BUILD TASK ARRAY ────────────────────────────────────────────────────
    
    const tasks = [];

    // Prioritise AI Plan Task if exists
    if (aiRecommendedTask) {
      tasks.push(aiRecommendedTask);
    }
    
    // Traditional Lesson Task
    tasks.push({
      id: 1,
      title: recommendedLesson 
        ? (inProgressLesson ? `Đang học: ${recommendedLesson.title}` : `Bắt đầu: ${recommendedLesson.title}`)
        : 'Cố gắng hoàn thành 1 bài học',
      type: 'lesson',
      completed: lessonsTodayCount >= 1,
      progress: recommendedLesson 
        ? (inProgressLesson ? inProgressLesson.score : 0)
        : (lessonsTodayCount >= 1 ? 100 : 0),
      dueTime: '23:59',
      subtitle: recommendedLesson 
        ? `${recommendedLesson.topicName} • ${recommendedLesson.duration} phút`
        : 'Luyện tập mỗi ngày',
      actionUrl: recommendedLesson?.actionUrl || '/learn',
      actionText: recommendedLesson?.actionText || 'Xem danh sách',
      lessonId: recommendedLesson?.id,
      lessonType: recommendedLesson?.type 
    });
    
    // Challenge Tasks
    tasks.push({
      id: 2,
      title: 'Thử thách kiếm Coins',
      type: 'coins',
      completed: coinsToday >= 50,
      progress: Math.min(100, Math.floor((coinsToday / 50) * 100)),
      dueTime: '23:59',
      subtitle: `${Math.min(coinsToday, 50)}/50 Coins nhặt được`,
      reward: '🎁 +10 bonus coins'
    });
    
    tasks.push({
      id: 3,
      title: 'Học tập chuyên cần',
      type: 'time',
      completed: timeSpentSecToday >= 900,
      progress: Math.min(100, Math.floor((timeSpentSecToday / 900) * 100)),
      dueTime: '23:59',
      subtitle: `${Math.floor(timeSpentSecToday / 60)}/15 phút học tập`,
      reward: '🏅 +5 Pet EXP'
    });

    res.json({ 
      success: true, 
      tasks,
      summary: {
        lessonsCompletedToday: lessonsTodayCount,
        coinsEarnedToday: coinsToday,
        minutesSpentToday: Math.floor(timeSpentSecToday / 60),
        recommendedLesson: recommendedLesson ? {
          id: recommendedLesson.id,
          title: recommendedLesson.title,
          actionUrl: recommendedLesson.actionUrl
        } : null,
        aiPlanActive: !!aiRecommendedTask
      }
    });
  } catch (error) {
    console.error('Error getting today tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get time spent analytics (Real data from DB)
exports.getTimeSpent = async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days) + 1);
    startDate.setHours(0, 0, 0, 0);

    // 1. Fetch data
    const [lProgs, wProgs, user] = await Promise.all([
      LessonProgress.find({ userId, completedAt: { $gte: startDate } }).populate('lessonId', 'type'),
      WritingScenarioProgress.find({ userId, updatedAt: { $gte: startDate } }),
      User.findById(userId).select('vocab_progress')
    ]);

    // 2. Initialize counters
    const statsByDay = {};
    const skillBreakdown = {
      writing: 0,
      speaking: 0,
      reading: 0,
      listening: 0,
      lessons: 0,
      translation: 0 // Dịch ngược
    };

    // 3. Process LessonProgress
    lProgs.forEach(lp => {
      const dateKey = lp.completedAt.toISOString().split('T')[0];
      if (!statsByDay[dateKey]) statsByDay[dateKey] = 0;
      statsByDay[dateKey] += (lp.timeSpentSec || 0);

      const time = (lp.timeSpentSec || 0);
      if (lp.storyId) skillBreakdown.translation += time;
      else if (lp.passageId) {
        if (lp.passageType === 'reading') skillBreakdown.reading += time;
        else skillBreakdown.listening += time;
      } else if (lp.speakingId) skillBreakdown.speaking += time;
      else if (lp.lessonId) {
        const type = lp.lessonId.type || 'lessons';
        if (skillBreakdown.hasOwnProperty(type)) skillBreakdown[type] += time;
        else skillBreakdown.lessons += time;
      } else {
        skillBreakdown.lessons += time;
      }
    });

    // 4. Process Writing
    wProgs.forEach(wp => {
      const dateKey = wp.updatedAt.toISOString().split('T')[0];
      if (!statsByDay[dateKey]) statsByDay[dateKey] = 0;
      statsByDay[dateKey] += (wp.timeSpentSec || 0);
      skillBreakdown.writing += (wp.timeSpentSec || 0);
    });

    // 5. Process Vocabulary
    let totalVocab = 0;
    if (user?.vocab_progress) {
      for (const [topicId, words] of user.vocab_progress) {
        totalVocab += words.length;
      }
    }

    // 6. Format heatmap
    const activityHeatmap = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const key = d.toISOString().split('T')[0];
        activityHeatmap.push({
            day: dayNames[d.getDay()],
            minutes: Math.round((statsByDay[key] || 0) / 60)
        });
    }

    // 7. Format breakdown (Frontend compatible)
    const breakdown = [
      { label: 'Writing',      value: Math.round(skillBreakdown.writing / 60), color: '#6366F1' },
      { label: 'Speaking',     value: Math.round(skillBreakdown.speaking / 60), color: '#8B5CF6' },
      { label: 'Reading',      value: Math.round(skillBreakdown.reading / 60), color: '#06B6D4' },
      { label: 'Listening',     value: Math.round(skillBreakdown.listening / 60), color: '#3B82F6' },
      { label: 'Lessons',       value: Math.round(skillBreakdown.lessons / 60), color: '#10B981' },
      { label: 'Translation',   value: Math.round(skillBreakdown.translation / 60), color: '#F59E0B' },
      { label: 'Vocabulary',    value: totalVocab, color: '#EC4899', isCount: true }
    ];

    res.json({
      success: true,
      data: {
        total: Math.round(Object.values(statsByDay).reduce((a, b) => a + b, 0) / 60),
        breakdown,
        activityHeatmap: activityHeatmap.reverse()
      }
    });
  } catch (error) {
    console.error('getTimeSpent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get latest scores
exports.getLatestScores = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const userId = req.userId;

    // Fetch latest completed lessons from DB
    const recentProgress = await LessonProgress.find({ 
      userId, 
      score: { $gt: 0 } // Only show results where they actually scored something
    })
    .sort({ updated_at: -1 })
    .limit(parseInt(limit))
    .populate({
      path: 'lessonId',
      select: 'title type',
      populate: {
        path: 'topic_id',
        select: 'name'
      }
    });

    const scores = recentProgress.map((prog, index) => {
      // Determine type based on lesson or fallback to 'Practice'
      let type = 'Practice';
      let title = 'Bài tập tổng hợp';
      
      if (prog.lessonId) {
        title = prog.lessonId.title;
        // Guess type from title or topic if not explicitly set
        if (title.toLowerCase().includes('write') || title.toLowerCase().includes('viết')) type = 'Writing';
        else if (title.toLowerCase().includes('speak') || title.toLowerCase().includes('nói')) type = 'Speaking';
        else if (title.toLowerCase().includes('read') || title.toLowerCase().includes('đọc')) type = 'Reading';
        else if (title.toLowerCase().includes('listen') || title.toLowerCase().includes('nghe')) type = 'Listening';
        else if (title.toLowerCase().includes('vocab') || title.toLowerCase().includes('từ vựng')) type = 'Vocabulary';
      }

      return {
        id: prog._id || index,
        type: type,
        score: parseFloat((prog.score / 10).toFixed(1)), // Trả về dạng band mốc 10 hoặc để nguyên score tùy frontend. Đồ án dùng thang IELTS 0-9.0? Nếu DB lưu 0-100 thì /10 sẽ ra 0-10.
        rawScore: prog.score,
        date: prog.updated_at || prog.completedAt || new Date(),
        topic: title
      };
    });

    res.json({ success: true, scores });
  } catch (error) {
    console.error('Error getting latest scores:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reminders (Can be based on user study habits, for now a dynamic generated list)
exports.getReminders = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('learning_preferences gamification_data');
    
    // Tạo nhắc nhở dựa trên user data
    const streak = user?.gamification_data?.streak || 0;
    
    const reminders = [
      {
        id: 1,
        title: 'Giữ vững chuỗi điểm danh',
        time: 'Hằng ngày',
        active: streak > 0,
        type: 'daily',
        description: `Bạn đang có chuỗi ${streak} ngày học liên tiếp!`
      },
      {
        id: 2,
        title: 'Ôn tập từ vựng',
        time: '8:00 PM',
        active: true,
        type: 'daily'
      }
    ];

    res.json({ success: true, reminders });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user goals/progress
exports.getUserGoals = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    // Lấy thông tin đầu vào và mục tiêu thực tế của User
    const currentBand = user?.current_band || 4.0;
    const targetBand = user?.learning_preferences?.target_band || 6.5;
    
    // Tính toán % tiến trình (giả lập dựa trên mốc band điểm)
    let percent = 0;
    if (targetBand > currentBand) {
      // Ví dụ: mới tạo tài khoản progress = 10%. Cứ làm bài tập tăng dần.
      percent = Math.min(100, Math.floor(((currentBand) / targetBand) * 100));
    } else {
      percent = 100;
    }

    const goals = {
      current: currentBand,
      target: targetBand,
      label: 'Mục tiêu band điểm IELTS',
      progressPercent: percent,
      breakdown: {
        writing: currentBand,
        speaking: currentBand,
        vocabulary: currentBand
      }
    };

    res.json({ success: true, data: goals });
  } catch (error) {
    console.error('Error getting user goals:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get full dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.userId; // properly injected by auth middleware

    const dashboardData = {
      message: "Call individual endpoints instead for better performance.",
      deprecated: true
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
