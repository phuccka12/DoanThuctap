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
    const UserPlan = require('../models/UserPlan');

    // ─── 1. PROGRESS STATS ────────────────────────────────────────────────────
    const lessonsTodayCount = await LessonProgress.countDocuments({
      userId, completedAt: { $gte: start, $lte: end }, score: { $gt: 0 }
    });
    const coinsAgg = await CoinLog.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), timestamp: { $gte: start, $lte: end }, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const coinsToday = coinsAgg[0]?.total || 0;
    
    const lessonTimeAgg = await LessonProgress.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), completedAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSec' } } }
    ]);
    const writingTimeAgg = await WritingScenarioProgress.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), updatedAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSec' } } }
    ]);

    // Inclusion of Heartbeat time from Pet model
    const pet = await Pet.findOne({ user: userId }).lean();
    const todayStr = start.toISOString().split('T')[0];
    const heartbeatSec = (pet && pet.studyTimeDate === todayStr) ? (pet.studyTimeToday || 0) : 0;

    const timeSpentSecToday = (lessonTimeAgg[0]?.totalSeconds || 0) + (writingTimeAgg[0]?.totalSeconds || 0) + heartbeatSec;

    // ─── 2. AI PLAN TASKS ─────────────────────────────────────────────────────
    const now = new Date();
    let dayIndex = now.getDay(); 
    dayIndex = (dayIndex === 0 ? 6 : dayIndex - 1); // 0=Mon...6=Sun

    const activePlan = await UserPlan.findOne({ userId, status: 'active' }).lean();
    const aiTasks = [];

    // Local Helper: Progress
    const getTaskProgress = async (type, itemId) => {
      if (type === 'writing') {
        if (!itemId) return 0;
        const wp = await WritingScenarioProgress.findOne({ userId, scenarioId: itemId, updatedAt: { $gte: start, $lte: end } });
        return wp ? (wp.bestScore || 100) : 0;

      } else if (type === 'listening') {
        // First try specific passage match (if itemId is a specific passage)
        if (itemId) {
          const lp = await LessonProgress.findOne({ userId, passageId: itemId, completedAt: { $gte: start, $lte: end } });
          if (lp) return lp.score || 100;
        }
        // Fallback: any listening done today (covers generic "listening" tasks)
        const anyLp = await LessonProgress.findOne({ userId, passageType: 'listening', completedAt: { $gte: start, $lte: end } });
        return anyLp ? (anyLp.score || 100) : 0;

      } else if (type === 'reading') {
        if (itemId) {
          const lp = await LessonProgress.findOne({ userId, passageId: itemId, completedAt: { $gte: start, $lte: end } });
          if (lp) return lp.score || 100;
        }
        // Fallback: any reading done today
        const anyLp = await LessonProgress.findOne({ userId, passageType: 'reading', completedAt: { $gte: start, $lte: end } });
        return anyLp ? (anyLp.score || 100) : 0;

      } else if (type === 'speaking') {
        if (itemId) {
          const lp = await LessonProgress.findOne({ userId, speakingId: itemId, completedAt: { $gte: start, $lte: end } });
          if (lp) return lp.score || 100;
        }
        // Fallback: any speaking done today
        const anyLp = await LessonProgress.findOne({ userId, speakingId: { $ne: null }, completedAt: { $gte: start, $lte: end } });
        return anyLp ? (anyLp.score || 100) : 0;

      } else if (type === 'topic' || type === 'lesson') {
        if (!itemId) return 0;
        const lp = await LessonProgress.findOne({ userId, lessonId: itemId, completedAt: { $gte: start, $lte: end } });
        return lp ? (lp.score || 100) : 0;
      }
      return 0;
    };


    // Local Helper: Info Mapping
    const getTaskInfo = (type, itemId, nameHint) => {
      let url = '/learn';
      let title = nameHint || 'Bài tập gợi ý';
      let subtitle = 'Nhiệm vụ từ AI';
      switch (type) {
        case 'topic': url = itemId ? `/learn/topics/${itemId}` : '/learn'; title = nameHint || 'Chủ đề hôm nay'; break;
        case 'reading': url = '/reading'; break;
        case 'speaking': url = '/speaking-practice'; break;
        case 'writing': url = '/writing-scenarios'; break;
        case 'listening': url = '/ai-listening'; break;
        case 'vocabulary': url = itemId ? `/vocabulary/${itemId}/learn` : '/vocabulary'; break;
        case 'grammar': url = itemId ? `/grammar/${itemId}` : '/grammar'; break;
        case 'story': url = itemId ? `/stories/${itemId}/parts/1` : '/stories'; break;
      }
      return { url, title, subtitle };
    };

    if (activePlan && activePlan.dayItems) {
      const todayItem = activePlan.dayItems.find(item => item.dayIndex === dayIndex);
      if (todayItem) {
        if (todayItem.tasks && todayItem.tasks.length > 0) {
          for (const t of todayItem.tasks) {
            const prog = await getTaskProgress(t.type, t.itemId);
            const info = getTaskInfo(t.type, t.itemId, t.name || t.title);
            aiTasks.push({ id: `ai-${t.itemId || Math.random()}`, title: info.title, subtitle: info.subtitle, type: t.type, actionUrl: info.url, actionText: prog >= 80 ? 'Hoàn thành ✅' : 'Bắt đầu ngay', progress: Math.min(100, prog), reward: t.reward || null });
          }
        } else {
          const prog = await getTaskProgress(todayItem.itemType, todayItem.itemId);
          const info = getTaskInfo(todayItem.itemType, todayItem.itemId, null);
          aiTasks.push({ id: 'ai-plan-legacy', title: info.title, subtitle: info.subtitle, type: todayItem.itemType, actionUrl: info.url, actionText: prog >= 80 ? 'Hoàn thành ✅' : 'Bắt đầu', progress: Math.min(100, prog) });
        }
      }
    }

    // ─── 3. ASSEMBLE TASKS ────────────────────────────────────────────────────
    const tasks = [];
    if (aiTasks.length > 0) {
      tasks.push(...aiTasks);
    } else {
      // Fallback: Current lesson in progress
      const inProgress = await LessonProgress.findOne({ userId, rewarded: false, score: { $lt: 100 } })
        .sort({ updated_at: -1 }).populate({ path: 'lessonId', populate: { path: 'topic_id' } });
      if (inProgress && inProgress.lessonId) {
        tasks.push({
          id: 'lesson-rec',
          title: `Tiếp tục: ${inProgress.lessonId.title}`,
          type: 'lesson',
          progress: inProgress.score,
          subtitle: inProgress.lessonId.topic_id?.name || 'Bài học',
          actionUrl: `/learn/lessons/${inProgress.lessonId._id}`,
          actionText: 'Học ngay'
        });
      }
    }

    // Quests Pool
    const listeningTodayCount = await LessonProgress.countDocuments({ userId, completedAt: { $gte: start, $lte: end }, passageType: 'listening' });
    const speakingTodayCount = await LessonProgress.countDocuments({ userId, completedAt: { $gte: start, $lte: end }, speakingId: { $ne: null } });
    
    const questPool = [
      { id: 'q1', type: 'lesson', title: 'Hoàn thành 1 bài học', target: 1, current: lessonsTodayCount, url: '/learn' },
      { id: 'q2', type: 'coins', title: 'Tích luỹ 50 Coins', target: 50, current: coinsToday, url: '/learn' },
      { id: 'q3', type: 'time', title: '15 phút chuyên cần', target: 15, current: Math.floor(timeSpentSecToday/60), url: '/learn' },
      { id: 'q4', type: 'listening', title: 'Luyện Tai Siêu Đẳng', target: 1, current: listeningTodayCount, url: '/ai-listening' },
      { id: 'q5', type: 'speaking', title: 'Luyện Giọng Bản Xứ', target: 1, current: speakingTodayCount, url: '/speaking-practice' }
    ];

    const hashBase = userId.toString() + start.toDateString();
    let hash = 0;
    for (let i = 0; i < hashBase.length; i++) hash = Math.imul(31, hash) + hashBase.charCodeAt(i) | 0;
    const rng1 = Math.abs(hash) % questPool.length;
    const rng2 = (rng1 + 1) % questPool.length;

    [questPool[rng1], questPool[rng2]].forEach(q => {
      tasks.push({
        id: q.id, title: q.title, type: q.type, completed: q.current >= q.target,
        progress: Math.min(100, Math.floor((q.current / q.target) * 100)),
        subtitle: `${q.current}/${q.target}`, actionUrl: q.url, actionText: 'Thử thách'
      });
    });

    return res.json({ 
      success: true, 
      tasks,
      summary: {
        lessonsCompletedToday: lessonsTodayCount,
        coinsEarnedToday: coinsToday,
        minutesSpentToday: Math.floor(timeSpentSecToday / 60),
        aiPlanActive: aiTasks.length > 0
      }
    });
  } catch (error) {
    console.error('getTodayTasks Error:', error);
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
      } else if (prog.speakingId) {
        type = 'Speaking';
        title = 'Luyện Nói (IELTS Speaking)';
      } else if (prog.passageId) {
        type = prog.passageType === 'reading' ? 'Reading' : 'Listening';
        title = prog.passageType === 'reading' ? 'Luyện Đọc (IELTS Reading)' : 'Luyện Nghe (IELTS Listening)';
      } else if (prog.vocabId || prog.topicId) {
        type = 'Vocabulary';
        title = 'Luyện Từ vựng';
      } else if (prog.scenarioId) {
        type = 'Writing';
        title = 'Luyện Viết (IELTS Writing)';
      } else if (prog.storyId) {
        type = 'Translation';
        title = 'Dịch ngược câu chuyện';
      }

      return {
        id: prog._id || index,
        type: type,
        score: parseFloat((prog.score / 10).toFixed(1)), // Trả về dạng band mốc 10
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

// ─── HEARTBEAT (Real-time study time tracking) ──────────────────────────────
exports.heartbeat = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    // Use ISO string but convert to YYYY-MM-DD in local-date context if possible, 
    // but here we use a simple approach for consistency with getTodayTasks helper.
    const start = new Date();
    start.setHours(0,0,0,0);
    const todayStr = start.toISOString().split('T')[0];

    // Increment 60 seconds (default heartbeat interval)
    const pet = await Pet.findOne({ user: userId });
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    if (pet.studyTimeDate !== todayStr) {
      pet.studyTimeToday = 60;
      pet.studyTimeDate = todayStr;
    } else {
      pet.studyTimeToday += 60;
    }

    await pet.save();
    return res.json({ success: true, studyTimeToday: pet.studyTimeToday });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
