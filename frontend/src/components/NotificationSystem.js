import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'reminder',
      title: 'Matematik Dersi Hatırlatması',
      message: 'Bugün matematik dersiniz var. 15 dakika sonra başlayacak.',
      priority: 'high',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 dakika önce
      read: false,
      action: 'start_lesson',
      data: { lessonId: 'math_101' }
    },
    {
      id: 2,
      type: 'achievement',
      title: 'Yeni Rozet Kazandınız! 🏆',
      message: '7 günlük çalışma serisi tamamladınız. "Azimli Öğrenci" rozetini kazandınız!',
      priority: 'medium',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
      read: false,
      action: 'view_badge',
      data: { badgeId: 'streak_7' }
    },
    {
      id: 3,
      type: 'recommendation',
      title: 'Kişiselleştirilmiş Öneri',
      message: 'Kesirler konusunda zorlanıyorsunuz. Bu konuya odaklanmanızı öneriyoruz.',
      priority: 'medium',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 saat önce
      read: true,
      action: 'practice_topic',
      data: { topic: 'fractions' }
    },
    {
      id: 4,
      type: 'social',
      title: 'Arkadaşınız Çevrimiçi',
      message: 'Ahmet arkadaşınız çevrimiçi. Birlikte çalışmak ister misiniz?',
      priority: 'low',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 saat önce
      read: false,
      action: 'join_study_session',
      data: { friendId: 'ahmet_123' }
    },
    {
      id: 5,
      type: 'system',
      title: 'Sistem Güncellemesi',
      message: 'Yeni özellikler eklendi: Sesli asistan ve gelişmiş quiz sistemi.',
      priority: 'low',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 saat önce
      read: true,
      action: 'view_changelog',
      data: { version: '2.1.0' }
    }
  ]);

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    soundEnabled: true,
    reminderTime: 15, // dakika
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    notificationTypes: {
      reminders: true,
      achievements: true,
      recommendations: true,
      social: true,
      system: false
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, high_priority

  useEffect(() => {
    // Push notification izni iste
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Otomatik bildirim temizleme (7 gün sonra)
    const cleanOldNotifications = () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(notification => notification.timestamp > weekAgo)
      );
    };

    cleanOldNotifications();
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    
    switch (notification.action) {
      case 'start_lesson':
        window.location.href = `/student/lesson/${notification.data.lessonId}`;
        break;
      case 'view_badge':
        window.location.href = '/student/gamification';
        break;
      case 'practice_topic':
        window.location.href = `/student/quiz?topic=${notification.data.topic}`;
        break;
      case 'join_study_session':
        window.location.href = '/student/social';
        break;
      case 'view_changelog':
        // Changelog modal'ını aç
        break;
      default:
        console.log('Bilinmeyen eylem:', notification.action);
    }
  };

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Bildirimi', {
        body: 'Bu bir test bildirimidir.',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reminder': return '⏰';
      case 'achievement': return '🏆';
      case 'recommendation': return '💡';
      case 'social': return '👥';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'high_priority') return notification.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  return (
    <div className="notification-system">
      {/* Header */}
      <div className="notification-header">
        <div className="header-left">
          <h2>🔔 Bildirimler</h2>
          <div className="notification-stats">
            <span className="stat-item">
              <span className="stat-number">{unreadCount}</span>
              <span className="stat-label">Okunmamış</span>
            </span>
            {highPriorityCount > 0 && (
              <span className="stat-item high-priority">
                <span className="stat-number">{highPriorityCount}</span>
                <span className="stat-label">Önemli</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Tümünü Okundu İşaretle
          </button>
          <button 
            className="action-btn settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Ayarlar
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="notification-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tümü ({notifications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Okunmamış ({unreadCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'high_priority' ? 'active' : ''}`}
          onClick={() => setFilter('high_priority')}
        >
          Önemli ({highPriorityCount})
        </button>
      </div>

      {/* Bildirimler Listesi */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <h3>Bildirim Yok</h3>
            <p>Şu anda görüntülenecek bildiriminiz bulunmuyor.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.priority}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <div className="notification-meta">
                    <span className="timestamp">{formatTimeAgo(notification.timestamp)}</span>
                    <span 
                      className="priority-indicator"
                      style={{ backgroundColor: getPriorityColor(notification.priority) }}
                    >
                      {notification.priority === 'high' ? 'Yüksek' : 
                       notification.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </div>
                </div>
                
                <p className="notification-message">{typeof notification.message === 'string' ? notification.message : JSON.stringify(notification.message)}</p>
                
                <div className="notification-actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => handleNotificationAction(notification)}
                  >
                    Görüntüle
                  </button>
                  {!notification.read && (
                    <button 
                      className="action-btn secondary"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Okundu İşaretle
                    </button>
                  )}
                  <button 
                    className="action-btn delete"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ayarlar Paneli */}
      {showSettings && (
        <div className="notification-settings">
          <h3>🔧 Bildirim Ayarları</h3>
          
          <div className="settings-section">
            <h4>Genel Ayarlar</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    pushNotifications: e.target.checked
                  }))}
                />
                Push Bildirimleri
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emailNotifications: e.target.checked
                  }))}
                />
                E-posta Bildirimleri
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    soundEnabled: e.target.checked
                  }))}
                />
                Ses Efektleri
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h4>Hatırlatma Süresi</h4>
            <div className="setting-item">
              <label>Ders başlamadan kaç dakika önce hatırlat:</label>
              <select
                value={settings.reminderTime}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  reminderTime: parseInt(e.target.value)
                }))}
              >
                <option value={5}>5 dakika</option>
                <option value={10}>10 dakika</option>
                <option value={15}>15 dakika</option>
                <option value={30}>30 dakika</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h4>Sessiz Saatler</h4>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    quietHours: {
                      ...prev.quietHours,
                      enabled: e.target.checked
                    }
                  }))}
                />
                Sessiz saatleri etkinleştir
              </label>
            </div>
            
            {settings.quietHours.enabled && (
              <div className="quiet-hours-inputs">
                <div className="time-input">
                  <label>Başlangıç:</label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        start: e.target.value
                      }
                    }))}
                  />
                </div>
                <div className="time-input">
                  <label>Bitiş:</label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        end: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="settings-section">
            <h4>Bildirim Türleri</h4>
            {Object.entries(settings.notificationTypes).map(([type, enabled]) => (
              <div key={type} className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationTypes: {
                        ...prev.notificationTypes,
                        [type]: e.target.checked
                      }
                    }))}
                  />
                  {type === 'reminders' && 'Hatırlatmalar'}
                  {type === 'achievements' && 'Başarılar'}
                  {type === 'recommendations' && 'Öneriler'}
                  {type === 'social' && 'Sosyal'}
                  {type === 'system' && 'Sistem'}
                </label>
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button 
              className="test-notification-btn"
              onClick={sendTestNotification}
            >
              Test Bildirimi Gönder
            </button>
            <button 
              className="save-settings-btn"
              onClick={() => setShowSettings(false)}
            >
              Ayarları Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem; 