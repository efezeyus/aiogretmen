/**
 * Gamification Service
 * -------------------
 * Frontend gamification and achievement service
 */

import apiService from './api';

const gamificationService = {
  /**
   * Kullanıcı profilini al
   */
  async getUserProfile(userId) {
    try {
      const response = await apiService.get(`/gamification/profile/${userId}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Kullanıcı başarılarını al
   */
  async getUserAchievements(userId) {
    try {
      const response = await apiService.get(`/gamification/achievements/${userId}`);
      return {
        success: true,
        data: response.achievements || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Liderlik tablosunu al
   */
  async getLeaderboard(options = {}) {
    try {
      const params = {
        category: options.category || 'overall',
        period: options.period || 'weekly',
        limit: options.limit || 10
      };
      const response = await apiService.get('/gamification/leaderboard', params);
      return {
        success: true,
        data: response.leaderboard || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Puan ekle
   */
  async addPoints(userId, points, reason) {
    try {
      const response = await apiService.post('/gamification/add-points', {
        user_id: userId,
        points: points,
        reason: reason
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Rozet kazan
   */
  async earnBadge(userId, badgeId) {
    try {
      const response = await apiService.post('/gamification/earn-badge', {
        user_id: userId,
        badge_id: badgeId
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Günlük streak kontrolü
   */
  async checkStreak(userId) {
    try {
      const response = await apiService.get(`/gamification/streak/${userId}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { current_streak: 0, best_streak: 0 }
      };
    }
  },

  /**
   * Günlük hedefleri al
   */
  async getDailyGoals(userId) {
    try {
      const response = await apiService.get(`/gamification/daily-goals/${userId}`);
      return {
        success: true,
        data: response.goals || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Hedefe ulaş
   */
  async completeGoal(userId, goalId) {
    try {
      const response = await apiService.post('/gamification/complete-goal', {
        user_id: userId,
        goal_id: goalId
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default gamificationService;

