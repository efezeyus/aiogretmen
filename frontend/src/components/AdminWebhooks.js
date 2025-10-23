import React, { useState } from 'react';
import './AdminWebhooks.css';

const AdminWebhooks = () => {
  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      name: 'Yeni Kullanıcı Bildirimi',
      url: 'https://api.example.com/webhooks/new-user',
      description: 'Yeni kullanıcı kaydı olduğunda bildirim gönder',
      events: ['user.created', 'user.verified'],
      status: 'active',
      secret: 'whsec_1234567890abcdef',
      retryCount: 3,
      timeout: 30,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'CustomValue'
      },
      created: '2024-12-15',
      lastTriggered: '2024-12-21 14:30',
      successRate: 98.5,
      totalCalls: 1234,
      failedCalls: 18
    },
    {
      id: 2,
      name: 'Ders Tamamlama Entegrasyonu',
      url: 'https://lms.school.com/api/course-completion',
      description: 'Öğrenci ders tamamladığında LMS sistemine bildir',
      events: ['lesson.completed', 'quiz.passed'],
      status: 'active',
      secret: 'whsec_abcdef1234567890',
      retryCount: 5,
      timeout: 45,
      headers: {
        'Authorization': 'Bearer token123'
      },
      created: '2024-11-20',
      lastTriggered: '2024-12-21 10:15',
      successRate: 99.2,
      totalCalls: 5678,
      failedCalls: 45
    },
    {
      id: 3,
      name: 'Ödeme Sistemi Webhook',
      url: 'https://payment.gateway.com/webhook',
      description: 'Ödeme durumu değişikliklerini takip et',
      events: ['payment.completed', 'payment.failed', 'subscription.renewed'],
      status: 'inactive',
      secret: 'whsec_payment123456',
      retryCount: 10,
      timeout: 60,
      headers: {},
      created: '2024-10-05',
      lastTriggered: '2024-12-20 18:45',
      successRate: 95.3,
      totalCalls: 890,
      failedCalls: 42
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    description: '',
    events: [],
    retryCount: 3,
    timeout: 30,
    headers: {},
    secret: ''
  });

  const [newHeader, setNewHeader] = useState({ key: '', value: '' });

  const availableEvents = [
    { category: 'Kullanıcı', events: [
      { value: 'user.created', label: 'Kullanıcı Oluşturuldu' },
      { value: 'user.updated', label: 'Kullanıcı Güncellendi' },
      { value: 'user.deleted', label: 'Kullanıcı Silindi' },
      { value: 'user.verified', label: 'Kullanıcı Doğrulandı' },
      { value: 'user.login', label: 'Kullanıcı Giriş Yaptı' }
    ]},
    { category: 'Ders', events: [
      { value: 'lesson.created', label: 'Ders Oluşturuldu' },
      { value: 'lesson.started', label: 'Ders Başlatıldı' },
      { value: 'lesson.completed', label: 'Ders Tamamlandı' },
      { value: 'lesson.updated', label: 'Ders Güncellendi' }
    ]},
    { category: 'Quiz', events: [
      { value: 'quiz.started', label: 'Quiz Başlatıldı' },
      { value: 'quiz.completed', label: 'Quiz Tamamlandı' },
      { value: 'quiz.passed', label: 'Quiz Geçildi' },
      { value: 'quiz.failed', label: 'Quiz Başarısız' }
    ]},
    { category: 'Ödeme', events: [
      { value: 'payment.completed', label: 'Ödeme Tamamlandı' },
      { value: 'payment.failed', label: 'Ödeme Başarısız' },
      { value: 'payment.refunded', label: 'Ödeme İade Edildi' },
      { value: 'subscription.created', label: 'Abonelik Oluşturuldu' },
      { value: 'subscription.renewed', label: 'Abonelik Yenilendi' },
      { value: 'subscription.cancelled', label: 'Abonelik İptal Edildi' }
    ]},
    { category: 'Sertifika', events: [
      { value: 'certificate.generated', label: 'Sertifika Oluşturuldu' },
      { value: 'certificate.verified', label: 'Sertifika Doğrulandı' },
      { value: 'certificate.revoked', label: 'Sertifika İptal Edildi' }
    ]}
  ];

  const [webhookLogs] = useState([
    {
      id: 1,
      timestamp: '2024-12-21 14:30:45',
      event: 'user.created',
      status: 'success',
      statusCode: 200,
      duration: '245ms',
      payload: { userId: 123, email: 'test@example.com' },
      response: { success: true, message: 'Webhook received' }
    },
    {
      id: 2,
      timestamp: '2024-12-21 14:28:12',
      event: 'lesson.completed',
      status: 'failed',
      statusCode: 500,
      duration: '1234ms',
      payload: { lessonId: 456, userId: 789 },
      response: { error: 'Internal server error' },
      retryCount: 3
    },
    {
      id: 3,
      timestamp: '2024-12-21 14:25:33',
      event: 'payment.completed',
      status: 'success',
      statusCode: 201,
      duration: '567ms',
      payload: { amount: 99.99, currency: 'TRY' },
      response: { success: true, transactionId: 'tx_123' }
    }
  ]);

  const generateSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let secret = 'whsec_';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const handleCreateWebhook = () => {
    const webhook = {
      id: webhooks.length + 1,
      ...newWebhook,
      secret: generateSecret(),
      status: 'active',
      created: new Date().toISOString().split('T')[0],
      lastTriggered: 'Henüz tetiklenmedi',
      successRate: 0,
      totalCalls: 0,
      failedCalls: 0
    };

    setWebhooks([...webhooks, webhook]);
    setShowCreateModal(false);
    setNewWebhook({
      name: '',
      url: '',
      description: '',
      events: [],
      retryCount: 3,
      timeout: 30,
      headers: {},
      secret: ''
    });
    setNewHeader({ key: '', value: '' });
  };

  const handleDeleteWebhook = (id) => {
    if (window.confirm('Bu webhook\'u silmek istediğinizden emin misiniz?')) {
      setWebhooks(webhooks.filter(wh => wh.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setWebhooks(webhooks.map(wh => 
      wh.id === id 
        ? { ...wh, status: wh.status === 'active' ? 'inactive' : 'active' }
        : wh
    ));
  };

  const handleAddHeader = () => {
    if (newHeader.key && newHeader.value) {
      setNewWebhook({
        ...newWebhook,
        headers: {
          ...newWebhook.headers,
          [newHeader.key]: newHeader.value
        }
      });
      setNewHeader({ key: '', value: '' });
    }
  };

  const handleRemoveHeader = (key) => {
    const headers = { ...newWebhook.headers };
    delete headers[key];
    setNewWebhook({ ...newWebhook, headers });
  };

  const handleTestWebhook = (webhook) => {
    setSelectedWebhook(webhook);
    setShowTestModal(true);
  };

  const filteredWebhooks = activeTab === 'all' 
    ? webhooks 
    : webhooks.filter(wh => wh.status === activeTab);

  return (
    <div className="admin-webhooks">
      {/* Header */}
      <div className="webhooks-header">
        <div className="header-left">
          <h2>🔗 Webhook Yönetimi</h2>
          <p>Sistem olaylarını dış servislere iletin</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">➕</span>
            Yeni Webhook
          </button>
          <button className="btn-docs">
            <span className="btn-icon">📚</span>
            Dokümantasyon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="webhook-stats">
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <div className="stat-value">{webhooks.length}</div>
            <div className="stat-label">Toplam Webhook</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{webhooks.filter(w => w.status === 'active').length}</div>
            <div className="stat-label">Aktif</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {webhooks.reduce((acc, w) => acc + w.totalCalls, 0).toLocaleString()}
            </div>
            <div className="stat-label">Toplam Çağrı</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">
              {(webhooks.reduce((acc, w) => acc + w.successRate, 0) / webhooks.length).toFixed(1)}%
            </div>
            <div className="stat-label">Başarı Oranı</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="webhook-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tümü ({webhooks.length})
        </button>
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Aktif ({webhooks.filter(w => w.status === 'active').length})
        </button>
        <button 
          className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          Pasif ({webhooks.filter(w => w.status === 'inactive').length})
        </button>
      </div>

      {/* Webhooks List */}
      <div className="webhooks-list">
        {filteredWebhooks.map(webhook => (
          <div key={webhook.id} className={`webhook-card ${webhook.status}`}>
            <div className="webhook-header">
              <div className="webhook-info">
                <h3>{webhook.name}</h3>
                <p>{webhook.description}</p>
                <div className="webhook-url">
                  <span className="url-label">URL:</span>
                  <code>{webhook.url}</code>
                </div>
              </div>
              <div className="webhook-status">
                <button 
                  className={`status-toggle ${webhook.status}`}
                  onClick={() => handleToggleStatus(webhook.id)}
                >
                  {webhook.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                </button>
              </div>
            </div>

            <div className="webhook-events">
              <span className="events-label">Olaylar:</span>
              <div className="event-badges">
                {webhook.events.map(event => (
                  <span key={event} className="event-badge">
                    {event}
                  </span>
                ))}
              </div>
            </div>

            <div className="webhook-stats-row">
              <div className="stat-item">
                <span className="stat-label">Son Tetiklenme:</span>
                <span className="stat-value">{webhook.lastTriggered}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Toplam Çağrı:</span>
                <span className="stat-value">{webhook.totalCalls.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Başarı Oranı:</span>
                <span className={`stat-value ${webhook.successRate > 95 ? 'success' : webhook.successRate > 80 ? 'warning' : 'error'}`}>
                  {webhook.successRate}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Başarısız:</span>
                <span className="stat-value error">{webhook.failedCalls}</span>
              </div>
            </div>

            <div className="webhook-actions">
              <button 
                className="btn-action"
                onClick={() => handleTestWebhook(webhook)}
              >
                🧪 Test Et
              </button>
              <button 
                className="btn-action"
                onClick={() => {
                  setSelectedWebhook(webhook);
                  setShowLogsModal(true);
                }}
              >
                📋 Loglar
              </button>
              <button className="btn-action">
                ✏️ Düzenle
              </button>
              <button 
                className="btn-action danger"
                onClick={() => handleDeleteWebhook(webhook.id)}
              >
                🗑️ Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔗 Yeni Webhook Oluştur</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h4>📝 Temel Bilgiler</h4>
                
                <div className="form-group">
                  <label>Webhook Adı *</label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    placeholder="Örn: Yeni Kullanıcı Bildirimi"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Açıklama</label>
                  <textarea
                    value={newWebhook.description}
                    onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                    placeholder="Bu webhook'un amacını açıklayın"
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Webhook URL *</label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://api.example.com/webhook"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>📡 Olaylar</h4>
                <div className="events-selection">
                  {availableEvents.map(category => (
                    <div key={category.category} className="event-category">
                      <h5>{category.category}</h5>
                      <div className="event-options">
                        {category.events.map(event => (
                          <label key={event.value} className="event-checkbox">
                            <input
                              type="checkbox"
                              checked={newWebhook.events.includes(event.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewWebhook({
                                    ...newWebhook,
                                    events: [...newWebhook.events, event.value]
                                  });
                                } else {
                                  setNewWebhook({
                                    ...newWebhook,
                                    events: newWebhook.events.filter(ev => ev !== event.value)
                                  });
                                }
                              }}
                            />
                            <span>{event.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h4>⚙️ Ayarlar</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Yeniden Deneme Sayısı</label>
                    <input
                      type="number"
                      value={newWebhook.retryCount}
                      onChange={(e) => setNewWebhook({ ...newWebhook, retryCount: parseInt(e.target.value) })}
                      min="0"
                      max="10"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Timeout (saniye)</label>
                    <input
                      type="number"
                      value={newWebhook.timeout}
                      onChange={(e) => setNewWebhook({ ...newWebhook, timeout: parseInt(e.target.value) })}
                      min="1"
                      max="300"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>🔒 HTTP Headers</h4>
                
                <div className="headers-list">
                  {Object.entries(newWebhook.headers).map(([key, value]) => (
                    <div key={key} className="header-item">
                      <span className="header-key">{key}:</span>
                      <span className="header-value">{value}</span>
                      <button 
                        className="btn-remove-header"
                        onClick={() => handleRemoveHeader(key)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-header">
                  <input
                    type="text"
                    value={newHeader.key}
                    onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                    placeholder="Header Key"
                    className="form-input"
                  />
                  <input
                    type="text"
                    value={newHeader.value}
                    onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                    placeholder="Header Value"
                    className="form-input"
                  />
                  <button 
                    className="btn-add-header"
                    onClick={handleAddHeader}
                  >
                    ➕
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  İptal
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                >
                  🔗 Webhook Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && selectedWebhook && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🧪 Webhook Test: {selectedWebhook.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTestModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="test-info">
                <p>Bu webhook'u test etmek için aşağıdan bir olay seçin ve test payload'ını düzenleyin.</p>
              </div>

              <div className="form-group">
                <label>Test Olayı</label>
                <select className="form-select">
                  {selectedWebhook.events.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Test Payload</label>
                <textarea
                  className="form-textarea code"
                  rows="10"
                  defaultValue={JSON.stringify({
                    event: selectedWebhook.events[0],
                    timestamp: new Date().toISOString(),
                    data: {
                      userId: 123,
                      email: "test@example.com",
                      action: "test"
                    }
                  }, null, 2)}
                />
              </div>

              <div className="test-actions">
                <button className="btn-primary">
                  🚀 Test Gönder
                </button>
              </div>

              <div className="test-result">
                <h4>📤 İstek</h4>
                <pre className="code-block">
                  POST {selectedWebhook.url}
                  {'\n'}
                  Headers:
                  {Object.entries(selectedWebhook.headers).map(([k, v]) => `\n  ${k}: ${v}`).join('')}
                  {'\n\n'}
                  Body: (yukarıdaki payload)
                </pre>

                <h4>📥 Yanıt</h4>
                <pre className="code-block success">
                  Status: 200 OK
                  Duration: 234ms
                  {'\n\n'}
                  {JSON.stringify({ success: true, message: "Test webhook received" }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && selectedWebhook && (
        <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Webhook Logları: {selectedWebhook.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLogsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="logs-filters">
                <select className="filter-select">
                  <option value="all">Tüm Loglar</option>
                  <option value="success">Başarılı</option>
                  <option value="failed">Başarısız</option>
                </select>
                <select className="filter-select">
                  <option value="all">Tüm Olaylar</option>
                  {selectedWebhook.events.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                </select>
                <input 
                  type="date" 
                  className="date-filter"
                />
              </div>

              <div className="logs-table">
                <table>
                  <thead>
                    <tr>
                      <th>Zaman</th>
                      <th>Olay</th>
                      <th>Durum</th>
                      <th>HTTP Kodu</th>
                      <th>Süre</th>
                      <th>Deneme</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.timestamp}</td>
                        <td>
                          <span className="event-name">{log.event}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${log.status}`}>
                            {log.status === 'success' ? '✅ Başarılı' : '❌ Başarısız'}
                          </span>
                        </td>
                        <td>
                          <span className={`http-code ${log.statusCode < 400 ? 'success' : 'error'}`}>
                            {log.statusCode}
                          </span>
                        </td>
                        <td>{log.duration}</td>
                        <td>{log.retryCount || '-'}</td>
                        <td>
                          <button 
                            className="btn-table-action"
                            onClick={() => {
                              alert(`Payload:\n${JSON.stringify(log.payload, null, 2)}\n\nResponse:\n${JSON.stringify(log.response, null, 2)}`);
                            }}
                          >
                            👁️
                          </button>
                          <button className="btn-table-action">
                            🔄
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWebhooks;
