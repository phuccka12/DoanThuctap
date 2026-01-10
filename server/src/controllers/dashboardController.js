const User = require('../models/User');

// Get today's practice tasks
exports.getTodayTasks = async (req, res) => {
  try {
    // Mock data - bạn có thể thay đổi theo database của bạn
    const tasks = [
      {
        id: 1,
        title: 'Complete Writing Task',
        type: 'writing',
        completed: false,
        dueTime: '10:00 AM'
      },
      {
        id: 2,
        title: 'Speaking Practice',
        type: 'speaking',
        completed: false,
        dueTime: '2:00 PM'
      },
      {
        id: 3,
        title: 'Vocabulary Review',
        type: 'vocabulary',
        completed: true,
        dueTime: '5:00 PM'
      }
    ];

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error getting today tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get time spent analytics
exports.getTimeSpent = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Mock data - thay đổi theo database
    const data = {
      total: 245, // minutes
      breakdown: [
        { day: 'Mon', minutes: 45 },
        { day: 'Tue', minutes: 30 },
        { day: 'Wed', minutes: 60 },
        { day: 'Thu', minutes: 40 },
        { day: 'Fri', minutes: 50 },
        { day: 'Sat', minutes: 20 },
        { day: 'Sun', minutes: 0 }
      ]
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting time spent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get latest scores
exports.getLatestScores = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    // Mock data
    const scores = [
      {
        id: 1,
        type: 'Writing',
        score: 7.5,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Technology and Education'
      },
      {
        id: 2,
        type: 'Speaking',
        score: 8.0,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Travel Experience'
      },
      {
        id: 3,
        type: 'Writing',
        score: 7.0,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Environmental Issues'
      }
    ];

    res.json({ success: true, scores: scores.slice(0, parseInt(limit)) });
  } catch (error) {
    console.error('Error getting latest scores:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reminders
exports.getReminders = async (req, res) => {
  try {
    // Mock data
    const reminders = [
      {
        id: 1,
        title: 'Practice speaking daily',
        time: '09:00 AM',
        active: true,
        type: 'daily'
      },
      {
        id: 2,
        title: 'Review vocabulary',
        time: '08:00 PM',
        active: true,
        type: 'daily'
      },
      {
        id: 3,
        title: 'Weekly writing test',
        time: 'Saturday 10:00 AM',
        active: false,
        type: 'weekly'
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
    const userId = req.user?._id;
    
    // Mock data - có thể lấy từ database User
    const goals = {
      current: 65,
      target: 100,
      label: 'This month',
      breakdown: {
        writing: 20,
        speaking: 25,
        vocabulary: 20
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
    const userId = req.user?._id;
    
    // Có thể gọi tất cả các hàm trên và kết hợp
    const dashboardData = {
      user: req.user,
      tasks: [],
      analytics: {},
      scores: [],
      reminders: [],
      goals: {}
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
