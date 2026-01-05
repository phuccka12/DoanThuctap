import axiosInstance from '../utils/axiosConfig';

const API_URL = 'http://localhost:3000/api';

// Dashboard API Service
const dashboardService = {
  // Get all dashboard data
  getDashboardData: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get user profile with statistics
  getUserProfile: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/auth/me`);
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get today's practice tasks
  getTodayTasks: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/practice/today`);
      return response.data.tasks || [];
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      return [];
    }
  },

  // Get time spent analytics
  getTimeSpent: async (period = 'week') => {
    try {
      const response = await axiosInstance.get(`${API_URL}/analytics/time-spent`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching time spent:', error);
      return { total: 0, breakdown: [] };
    }
  },

  // Get latest scores
  getLatestScores: async (limit = 3) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/scores/latest`, {
        params: { limit }
      });
      return response.data.scores || [];
    } catch (error) {
      console.error('Error fetching latest scores:', error);
      return [];
    }
  },

  // Get reminders
  getReminders: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/reminders`);
      return response.data.reminders || [];
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  },

  // Get user progress/goals
  getUserGoals: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/user/goals/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      return { current: 0, target: 100, label: "This month" };
    }
  },

  // Update placement test status
  updatePlacementTestStatus: async (completed = true) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/user/placement-test`, {
        completed
      });
      return response.data;
    } catch (error) {
      console.error('Error updating placement test status:', error);
      throw error;
    }
  }
};

export default dashboardService;
