import React, { useState, useEffect } from 'react';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Sistem Güncellemesi',
      message: 'Yeni özellikler eklendi ve performans iyileştirmeleri yapıldı.',
      type: 'system',
      recipients: 'all',
      recipientCount: 2534,
      sentDate: '2025-01-02T10:00:00Z',
      status: 'sent',
      readRate: 78,
      clickRate: 45
    },
    {
      id: 2,
      title: 'Matematik Dersi Yeni Konu',
      message: '5. Sınıf Matematik dersine Kesirler konusu eklendi.',
      type: 'lesson',
      recipients: 'grade-5',
      recipientCount: 342,
      sentDate: '2025-01-01T14:30:00Z',
      status: 'sent',
      readRate: 92,
      clickRate: 67
    }
  ]);

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Hoş Geldin Mesajı',
      content: 'Merhaba {name}, Yapay Zeka Öğretmen platformuna hoş geldin!',
      type: 'welcome',
      variables: ['name']
    },
    {
      id: 2,
      name: 'Ders Hatırlatması',
      content: '{name}, bugün {lesson} dersin var. Hazır mısın?',
      type: 'reminder',
      variables: ['name', 'lesson']
    }
  ]);

  const [scheduledNotifications, setScheduledNotifications] = useState([
    {
      id: 1,
      title: 'Haftalık Performans Raporu',
      scheduledDate: '2025-01-05T09:00:00Z',
      frequency: 'weekly',
      recipients: 'parents',
      status: 'scheduled'
    }
  ]);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sent');
  const [selectedRecipients, setSelectedRecipients] = useState('all');
  const [notificationPreview, setNotificationPreview] = useState(false);

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'general',
    recipients: 'all',
    sendNow: true,
    scheduledDate: '',
    attachments: [],
    priority: 'normal'
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    type: 'general',
    variables: []
  });

  const [notificationStats] = useState({
    totalSent: 15678,
    avgReadRate: 82,
    avgClickRate: 45,
    totalScheduled: 24,
    activeTemplates: 12
  });

  const recipientGroups = [
    { value: 'all', label: 'Tüm Kullanıcılar', count: 2534 },
    { value: 'students', label: 'Öğrenciler', count: 2187 },
    { value: 'teachers', label: 'Öğretmenler', count: 156 },
    { value: 'parents', label: 'Veliler', count: 191 },
    { value: 'grade-5', label: '5. Sınıf', count: 342 },
    { value: 'grade-6', label: '6. Sınıf', count: 298 },
    { value: 'grade-7', label: '7. Sınıf', count: 315 },
    { value: 'grade-8', label: '8. Sınıf', count: 289 }
  ];

  const notificationTypes = [
    { value: 'general', label: 'Genel Duyuru', icon: '📢' },
    { value: 'system', label: 'Sistem Bildirimi', icon: '⚙️' },
    { value: 'lesson', label: 'Ders Bildirimi', icon: '📚' },
    { value: 'reminder', label: 'Hatırlatma', icon: '⏰' },
    { value: 'achievement', label: 'Başarı', icon: '🏆' },
    { value: 'alert', label: 'Uyarı', icon: '⚠️' }
  ];

  const handleSendNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Lütfen başlık ve mesaj alanlarını doldurun.');
      return;
    }

    const recipientGroup = recipientGroups.find(g => g.value === newNotification.recipients);
    const notification = {
      ...newNotification,
      id: Date.now(),
      recipientCount: recipientGroup?.count || 0,
      sentDate: newNotification.sendNow ? new Date().toISOString() : newNotification.scheduledDate,
      status: newNotification.sendNow ? 'sent' : 'scheduled',
      readRate: 0,
      clickRate: 0
    };

    if (newNotification.sendNow) {
      setNotifications([notification, ...notifications]);
    } else {
      setScheduledNotifications([notification, ...scheduledNotifications]);
    }

    setShowNotificationModal(false);
    setNewNotification({
      title: '',
      message: '',
      type: 'general',
      recipients: 'all',
      sendNow: true,
      scheduledDate: '',
      attachments: [],
      priority: 'normal'
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      alert('Lütfen şablon adı ve içeriği doldurun.');
      return;
    }

    const variables = newTemplate.content.match(/\{(\w+)\}/g)?.map(v => v.slice(1, -1)) || [];
    const template = {
      ...newTemplate,
      id: Date.now(),
      variables
    };

    setTemplates([...templates, template]);
    setShowTemplateModal(false);
    setNewTemplate({
      name: '',
      content: '',
      type: 'general',
      variables: []
    });
  };

  const handleDeleteNotification = (id) => {
    if (window.confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    return notificationTypes.find(t => t.value === type)?.icon || '📢';
  };

  const getTypeLabel = (type) => {
    return notificationTypes.find(t => t.value === type)?.label || 'Genel';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'normal': return '#2196f3';
      case 'low': return '#9e9e9e';
      default: return '#2196f3';
    }
  };

  return (
    <div className="admin-notifications">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-left">
          <h2>🔔 Bildirim Yönetimi</h2>
          <p>Sistem bildirimleri ve toplu mesajlaşma</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-new-notification"
            onClick={() => setShowNotificationModal(true)}
          >
            ➕ Yeni Bildirim
          </button>
          <button 
            className="btn-new-template"
            onClick={() => setShowTemplateModal(true)}
          >
            📋 Şablon Oluştur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="notification-stats">
        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-value">{notificationStats.totalSent.toLocaleString('tr-TR')}</div>
            <div className="stat-label">Toplam Gönderim</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-value">%{notificationStats.avgReadRate}</div>
            <div className="stat-label">Ortalama Okuma</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👆</div>
          <div className="stat-content">
            <div className="stat-value">%{notificationStats.avgClickRate}</div>
            <div className="stat-label">Ortalama Tıklama</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{notificationStats.totalScheduled}</div>
            <div className="stat-label">Planlanmış</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{notificationStats.activeTemplates}</div>
            <div className="stat-label">Aktif Şablon</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="notification-tabs">
        <button 
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Gönderilen
        </button>
        <button 
          className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          📅 Planlanmış
        </button>
        <button 
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Şablonlar
        </button>
      </div>

      {/* Content */}
      <div className="notification-content">
        {activeTab === 'sent' && (
          <div className="sent-notifications">
            <div className="notifications-list">
              {notifications.map(notification => (
                <div key={notification.id} className="notification-card">
                  <div className="notification-header">
                    <div className="notification-title">
                      <span className="type-icon">{getTypeIcon(notification.type)}</span>
                      <h3>{notification.title}</h3>
                    </div>
                    <span className={`status-badge ${notification.status}`}>
                      {notification.status === 'sent' ? 'Gönderildi' : 'Planlandı'}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  <div className="notification-meta">
                    <div className="meta-item">
                      <span className="meta-label">Alıcılar:</span>
                      <span className="meta-value">
                        {recipientGroups.find(g => g.value === notification.recipients)?.label} 
                        ({notification.recipientCount})
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Tarih:</span>
                      <span className="meta-value">{formatDate(notification.sentDate)}</span>
                    </div>
                  </div>

                  <div className="notification-stats-row">
                    <div className="stat-item">
                      <span className="stat-icon">👁️</span>
                      <span className="stat-text">%{notification.readRate} okuma</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">👆</span>
                      <span className="stat-text">%{notification.clickRate} tıklama</span>
                    </div>
                  </div>

                  <div className="notification-actions">
                    <button className="action-btn view" title="Detaylar">
                      👁️
                    </button>
                    <button className="action-btn resend" title="Tekrar Gönder">
                      🔄
                    </button>
                    <button 
                      className="action-btn delete" 
                      title="Sil"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="scheduled-notifications">
            {scheduledNotifications.length > 0 ? (
              <div className="notifications-list">
                {scheduledNotifications.map(notification => (
                  <div key={notification.id} className="notification-card scheduled">
                    <div className="notification-header">
                      <h3>{notification.title}</h3>
                      <span className="frequency-badge">{notification.frequency}</span>
                    </div>
                    
                    <div className="notification-meta">
                      <div className="meta-item">
                        <span className="meta-label">Planlanan Tarih:</span>
                        <span className="meta-value">{formatDate(notification.scheduledDate)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Alıcılar:</span>
                        <span className="meta-value">
                          {recipientGroups.find(g => g.value === notification.recipients)?.label}
                        </span>
                      </div>
                    </div>

                    <div className="notification-actions">
                      <button className="action-btn edit" title="Düzenle">
                        ✏️
                      </button>
                      <button className="action-btn pause" title="Duraklat">
                        ⏸️
                      </button>
                      <button className="action-btn delete" title="İptal Et">
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>📅 Planlanmış bildirim bulunmuyor.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="notification-templates">
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <h4>{template.name}</h4>
                    <span className="template-type">{getTypeLabel(template.type)}</span>
                  </div>
                  
                  <p className="template-content">{template.content}</p>
                  
                  {template.variables.length > 0 && (
                    <div className="template-variables">
                      <span className="variables-label">Değişkenler:</span>
                      {template.variables.map((variable, index) => (
                        <span key={index} className="variable-tag">{`{${variable}}`}</span>
                      ))}
                    </div>
                  )}

                  <div className="template-actions">
                    <button className="action-btn use" title="Kullan">
                      📤 Kullan
                    </button>
                    <button className="action-btn edit" title="Düzenle">
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete" 
                      title="Sil"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Notification Modal */}
      {showNotificationModal && (
        <div className="modal-overlay">
          <div className="notification-modal">
            <div className="modal-header">
              <h3>Yeni Bildirim</h3>
              <button 
                className="modal-close"
                onClick={() => setShowNotificationModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Bildirim Tipi</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                  >
                    {notificationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Öncelik</label>
                  <select
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                  >
                    <option value="low">Düşük</option>
                    <option value="normal">Normal</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Başlık</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="Bildirim başlığı..."
                />
              </div>

              <div className="form-group">
                <label>Mesaj</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  placeholder="Bildirim mesajı..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Alıcılar</label>
                <select
                  value={newNotification.recipients}
                  onChange={(e) => setNewNotification({...newNotification, recipients: e.target.value})}
                >
                  {recipientGroups.map(group => (
                    <option key={group.value} value={group.value}>
                      {group.label} ({group.count} kişi)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newNotification.sendNow}
                    onChange={(e) => setNewNotification({...newNotification, sendNow: e.target.checked})}
                  />
                  Hemen Gönder
                </label>
              </div>

              {!newNotification.sendNow && (
                <div className="form-group">
                  <label>Planlanan Tarih ve Saat</label>
                  <input
                    type="datetime-local"
                    value={newNotification.scheduledDate}
                    onChange={(e) => setNewNotification({...newNotification, scheduledDate: e.target.value})}
                  />
                </div>
              )}

              <div className="form-actions">
                <button 
                  className="btn-preview"
                  onClick={() => setNotificationPreview(true)}
                >
                  👁️ Önizle
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowNotificationModal(false)}
              >
                İptal
              </button>
              <button 
                className="btn-send"
                onClick={handleSendNotification}
              >
                {newNotification.sendNow ? '📤 Gönder' : '📅 Planla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="template-modal">
            <div className="modal-header">
              <h3>Yeni Şablon</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTemplateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Şablon Adı</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Örn: Haftalık Rapor"
                />
              </div>

              <div className="form-group">
                <label>Şablon Tipi</label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>İçerik</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  placeholder="Mesaj içeriği... Değişkenler için {isim}, {ders} gibi kullanın."
                  rows="6"
                />
                <small className="form-help">
                  Değişkenler için süslü parantez kullanın: {'{isim}'}, {'{ders}'}, {'{tarih}'}
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowTemplateModal(false)}
              >
                İptal
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveTemplate}
              >
                💾 Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preview */}
      {notificationPreview && (
        <div className="modal-overlay">
          <div className="preview-modal">
            <div className="modal-header">
              <h3>Bildirim Önizleme</h3>
              <button 
                className="modal-close"
                onClick={() => setNotificationPreview(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="preview-device">
                <div className="device-header">
                  <span className="app-name">Yapay Zeka Öğretmen</span>
                  <span className="time">09:41</span>
                </div>
                <div className="notification-preview">
                  <div className="preview-icon">{getTypeIcon(newNotification.type)}</div>
                  <div className="preview-content">
                    <h4>{newNotification.title}</h4>
                    <p>{newNotification.message}</p>
                    <span className="preview-time">Şimdi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-close"
                onClick={() => setNotificationPreview(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
