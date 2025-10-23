/**
 * Notification Service
 * -------------------
 * Frontend notification management service
 */

import apiService from './api';

const notificationService = {
  /**
   * E-posta gönder
   */
  async sendEmail(data) {
    try {
      const response = await apiService.post('/notifications/email', {
        to_email: data.to,
        subject: data.subject,
        body: data.body,
        html: data.html
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
   * SMS gönder
   */
  async sendSMS(data) {
    try {
      const response = await apiService.post('/notifications/sms', {
        to_phone: data.to,
        message: data.message
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
   * Push notification gönder
   */
  async sendPushNotification(data) {
    try {
      const response = await apiService.post('/notifications/push', {
        user_id: data.userId,
        title: data.title,
        body: data.body,
        data: data.data
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
   * Kullanıcıya bildirim gönder (tüm kanallar)
   */
  async notifyUser(userId, notification) {
    try {
      const response = await apiService.post(`/notifications/user/${userId}`, {
        title: notification.title,
        message: notification.message,
        channels: notification.channels || ['email', 'push'],
        data: notification.data
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
   * Bildirim geçmişini al
   */
  async getNotificationHistory(userId, limit = 20) {
    try {
      const response = await apiService.get(`/notifications/history/${userId}`, { limit });
      return {
        success: true,
        data: response.notifications || []
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
   * Bildirimi okundu olarak işaretle
   */
  async markAsRead(notificationId) {
    try {
      const response = await apiService.patch(`/notifications/${notificationId}/read`);
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

export default notificationService;

