import React, { useState } from 'react';
import './AdminAPIKeys.css';

const AdminAPIKeys = () => {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: 'Production API Key',
      key: 'sk-prod-4f3a2b1c9d8e7f6a5b4c3d2e1f',
      description: 'Ana üretim ortamı için API anahtarı',
      permissions: ['read', 'write', 'delete'],
      rateLimit: '10000/hour',
      created: '2024-12-15',
      lastUsed: '2024-12-21 14:30',
      status: 'active',
      usage: {
        today: 3456,
        month: 89234,
        total: 456789
      }
    },
    {
      id: 2,
      name: 'Development API Key',
      key: 'sk-dev-8b7c6d5e4f3a2b1c9d8e7f6a5b',
      description: 'Geliştirme ve test için API anahtarı',
      permissions: ['read', 'write'],
      rateLimit: '1000/hour',
      created: '2024-12-10',
      lastUsed: '2024-12-21 10:15',
      status: 'active',
      usage: {
        today: 234,
        month: 5678,
        total: 12345
      }
    },
    {
      id: 3,
      name: 'Mobile App Key',
      key: 'sk-mobile-2e1f4c3d5b6a7f8e9d1c2b3a4f',
      description: 'Mobil uygulama için özel API anahtarı',
      permissions: ['read'],
      rateLimit: '5000/hour',
      created: '2024-11-20',
      lastUsed: '2024-12-20 18:45',
      status: 'inactive',
      usage: {
        today: 0,
        month: 2345,
        total: 34567
      }
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showKey, setShowKey] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  const [newKey, setNewKey] = useState({
    name: '',
    description: '',
    permissions: [],
    rateLimit: '1000/hour',
    expiresIn: 'never',
    ipWhitelist: '',
    allowedDomains: ''
  });

  const [usageStats] = useState({
    totalKeys: 15,
    activeKeys: 12,
    totalRequests: '2.3M',
    averageLatency: '45ms',
    errorRate: '0.02%',
    topEndpoints: [
      { endpoint: '/api/lessons', calls: 45678, percentage: 35 },
      { endpoint: '/api/users', calls: 34567, percentage: 27 },
      { endpoint: '/api/ai/chat', calls: 23456, percentage: 18 },
      { endpoint: '/api/analytics', calls: 12345, percentage: 10 },
      { endpoint: '/api/certificates', calls: 8901, percentage: 7 }
    ]
  });

  const permissions = [
    { value: 'read', label: 'Okuma', icon: '👁️' },
    { value: 'write', label: 'Yazma', icon: '✏️' },
    { value: 'delete', label: 'Silme', icon: '🗑️' },
    { value: 'admin', label: 'Admin', icon: '👑' }
  ];

  const rateLimits = [
    { value: '100/hour', label: '100 istek/saat' },
    { value: '1000/hour', label: '1,000 istek/saat' },
    { value: '5000/hour', label: '5,000 istek/saat' },
    { value: '10000/hour', label: '10,000 istek/saat' },
    { value: 'unlimited', label: 'Sınırsız' }
  ];

  const handleCreateKey = () => {
    const generatedKey = `sk-${newKey.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 24)}`;
    const createdKey = {
      id: apiKeys.length + 1,
      key: generatedKey,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Henüz kullanılmadı',
      status: 'active',
      usage: {
        today: 0,
        month: 0,
        total: 0
      },
      ...newKey
    };

    setApiKeys([...apiKeys, createdKey]);
    setShowCreateModal(false);
    setNewKey({
      name: '',
      description: '',
      permissions: [],
      rateLimit: '1000/hour',
      expiresIn: 'never',
      ipWhitelist: '',
      allowedDomains: ''
    });

    // Show success message
    alert(`API Key başarıyla oluşturuldu: ${generatedKey}`);
  };

  const handleDeleteKey = (keyId) => {
    if (window.confirm('Bu API anahtarını silmek istediğinizden emin misiniz?')) {
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
    }
  };

  const handleToggleStatus = (keyId) => {
    setApiKeys(apiKeys.map(key => 
      key.id === keyId 
        ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' }
        : key
    ));
  };

  const handleRegenerateKey = (keyId) => {
    if (window.confirm('Bu API anahtarını yenilemek istediğinizden emin misiniz? Eski anahtar çalışmayacak.')) {
      setApiKeys(apiKeys.map(key => 
        key.id === keyId 
          ? { ...key, key: `sk-regen-${Math.random().toString(36).substr(2, 24)}` }
          : key
      ));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('API Key panoya kopyalandı!');
  };

  const toggleShowKey = (keyId) => {
    setShowKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const filteredKeys = activeTab === 'all' 
    ? apiKeys 
    : apiKeys.filter(key => key.status === activeTab);

  return (
    <div className="admin-api-keys">
      {/* Header */}
      <div className="api-header">
        <div className="header-left">
          <h2>🔑 API Key Yönetimi</h2>
          <p>API anahtarlarını yönetin ve kullanım istatistiklerini görüntüleyin</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-create-key"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">➕</span>
            Yeni API Key Oluştur
          </button>
          <button className="btn-export">
            <span className="btn-icon">📥</span>
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="api-stats">
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <div className="stat-value">{usageStats.totalKeys}</div>
            <div className="stat-label">Toplam API Key</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{usageStats.activeKeys}</div>
            <div className="stat-label">Aktif Key</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{usageStats.totalRequests}</div>
            <div className="stat-label">Toplam İstek</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{usageStats.averageLatency}</div>
            <div className="stat-label">Ort. Gecikme</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{usageStats.errorRate}</div>
            <div className="stat-label">Hata Oranı</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="api-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tüm Anahtarlar ({apiKeys.length})
        </button>
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Aktif ({apiKeys.filter(k => k.status === 'active').length})
        </button>
        <button 
          className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          Pasif ({apiKeys.filter(k => k.status === 'inactive').length})
        </button>
      </div>

      {/* API Keys Table */}
      <div className="api-keys-table">
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>API Anahtarı</th>
              <th>İzinler</th>
              <th>Rate Limit</th>
              <th>Kullanım</th>
              <th>Son Kullanım</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map(apiKey => (
              <tr key={apiKey.id}>
                <td>
                  <div className="key-info">
                    <div className="key-name">{apiKey.name}</div>
                    <div className="key-description">{apiKey.description}</div>
                  </div>
                </td>
                <td>
                  <div className="key-display">
                    <code className="api-key-text">
                      {showKey[apiKey.id] 
                        ? apiKey.key 
                        : `${apiKey.key.substring(0, 10)}...${apiKey.key.slice(-4)}`}
                    </code>
                    <button 
                      className="btn-icon"
                      onClick={() => toggleShowKey(apiKey.id)}
                      title={showKey[apiKey.id] ? "Gizle" : "Göster"}
                    >
                      {showKey[apiKey.id] ? '🙈' : '👁️'}
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => copyToClipboard(apiKey.key)}
                      title="Kopyala"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td>
                  <div className="permissions">
                    {apiKey.permissions.map(perm => (
                      <span key={perm} className={`permission-badge ${perm}`}>
                        {permissions.find(p => p.value === perm)?.icon} {perm}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="rate-limit">{apiKey.rateLimit}</span>
                </td>
                <td>
                  <div className="usage-info">
                    <div className="usage-stat">
                      <span className="usage-label">Bugün:</span>
                      <span className="usage-value">{apiKey.usage.today.toLocaleString()}</span>
                    </div>
                    <div className="usage-stat">
                      <span className="usage-label">Bu Ay:</span>
                      <span className="usage-value">{apiKey.usage.month.toLocaleString()}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="last-used">{apiKey.lastUsed}</div>
                </td>
                <td>
                  <button 
                    className={`status-toggle ${apiKey.status}`}
                    onClick={() => handleToggleStatus(apiKey.id)}
                  >
                    {apiKey.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                  </button>
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-action"
                      onClick={() => {
                        setSelectedKey(apiKey);
                        setShowDetailsModal(true);
                      }}
                      title="Detaylar"
                    >
                      📊
                    </button>
                    <button 
                      className="btn-action"
                      onClick={() => handleRegenerateKey(apiKey.id)}
                      title="Yenile"
                    >
                      🔄
                    </button>
                    <button 
                      className="btn-action danger"
                      onClick={() => handleDeleteKey(apiKey.id)}
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Usage Analytics */}
      <div className="usage-analytics">
        <h3>📊 Kullanım Analizi</h3>
        <div className="analytics-content">
          <div className="top-endpoints">
            <h4>En Çok Kullanılan Endpoint'ler</h4>
            <div className="endpoint-list">
              {usageStats.topEndpoints.map((endpoint, index) => (
                <div key={index} className="endpoint-item">
                  <div className="endpoint-info">
                    <span className="endpoint-name">{endpoint.endpoint}</span>
                    <span className="endpoint-calls">{endpoint.calls.toLocaleString()} çağrı</span>
                  </div>
                  <div className="endpoint-bar">
                    <div 
                      className="bar-fill"
                      style={{ width: `${endpoint.percentage}%` }}
                    ></div>
                    <span className="bar-percentage">{endpoint.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="usage-chart">
            <h4>Son 7 Gün Kullanım</h4>
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '60%' }}>Pzt</div>
              <div className="chart-bar" style={{ height: '80%' }}>Sal</div>
              <div className="chart-bar" style={{ height: '70%' }}>Çar</div>
              <div className="chart-bar" style={{ height: '90%' }}>Per</div>
              <div className="chart-bar" style={{ height: '100%' }}>Cum</div>
              <div className="chart-bar" style={{ height: '40%' }}>Cmt</div>
              <div className="chart-bar" style={{ height: '30%' }}>Paz</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Yeni API Key Oluştur</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>API Key Adı *</label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="Örn: Production API Key"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  placeholder="Bu API key'in kullanım amacını açıklayın"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>İzinler *</label>
                <div className="permissions-grid">
                  {permissions.map(perm => (
                    <label key={perm.value} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={newKey.permissions.includes(perm.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({
                              ...newKey,
                              permissions: [...newKey.permissions, perm.value]
                            });
                          } else {
                            setNewKey({
                              ...newKey,
                              permissions: newKey.permissions.filter(p => p !== perm.value)
                            });
                          }
                        }}
                      />
                      <span className="permission-label">
                        {perm.icon} {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rate Limit</label>
                  <select
                    value={newKey.rateLimit}
                    onChange={(e) => setNewKey({ ...newKey, rateLimit: e.target.value })}
                    className="form-select"
                  >
                    {rateLimits.map(limit => (
                      <option key={limit.value} value={limit.value}>
                        {limit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Geçerlilik Süresi</label>
                  <select
                    value={newKey.expiresIn}
                    onChange={(e) => setNewKey({ ...newKey, expiresIn: e.target.value })}
                    className="form-select"
                  >
                    <option value="never">Süresiz</option>
                    <option value="30days">30 Gün</option>
                    <option value="90days">90 Gün</option>
                    <option value="1year">1 Yıl</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>IP Whitelist (Opsiyonel)</label>
                <input
                  type="text"
                  value={newKey.ipWhitelist}
                  onChange={(e) => setNewKey({ ...newKey, ipWhitelist: e.target.value })}
                  placeholder="192.168.1.1, 10.0.0.0/24"
                  className="form-input"
                />
                <span className="form-hint">Virgül ile ayırarak birden fazla IP girebilirsiniz</span>
              </div>

              <div className="form-group">
                <label>İzin Verilen Domain'ler (Opsiyonel)</label>
                <input
                  type="text"
                  value={newKey.allowedDomains}
                  onChange={(e) => setNewKey({ ...newKey, allowedDomains: e.target.value })}
                  placeholder="example.com, *.example.com"
                  className="form-input"
                />
                <span className="form-hint">CORS için izin verilen domain'ler</span>
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
                  onClick={handleCreateKey}
                  disabled={!newKey.name || newKey.permissions.length === 0}
                >
                  🔑 API Key Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedKey && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 API Key Detayları: {selectedKey.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-sections">
                <div className="detail-section">
                  <h4>🔑 Anahtar Bilgileri</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">API Key:</span>
                      <code className="detail-value">{selectedKey.key}</code>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Oluşturulma:</span>
                      <span className="detail-value">{selectedKey.created}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Son Kullanım:</span>
                      <span className="detail-value">{selectedKey.lastUsed}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Durum:</span>
                      <span className={`status-badge ${selectedKey.status}`}>
                        {selectedKey.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>📊 Kullanım İstatistikleri</h4>
                  <div className="usage-stats-grid">
                    <div className="usage-stat-card">
                      <div className="usage-stat-value">{selectedKey.usage.today.toLocaleString()}</div>
                      <div className="usage-stat-label">Bugünkü İstek</div>
                    </div>
                    <div className="usage-stat-card">
                      <div className="usage-stat-value">{selectedKey.usage.month.toLocaleString()}</div>
                      <div className="usage-stat-label">Aylık İstek</div>
                    </div>
                    <div className="usage-stat-card">
                      <div className="usage-stat-value">{selectedKey.usage.total.toLocaleString()}</div>
                      <div className="usage-stat-label">Toplam İstek</div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>🔒 Güvenlik Ayarları</h4>
                  <div className="security-settings">
                    <div className="setting-item">
                      <span className="setting-label">İzinler:</span>
                      <div className="permissions">
                        {selectedKey.permissions.map(perm => (
                          <span key={perm} className={`permission-badge ${perm}`}>
                            {permissions.find(p => p.value === perm)?.icon} {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="setting-item">
                      <span className="setting-label">Rate Limit:</span>
                      <span className="setting-value">{selectedKey.rateLimit}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>📝 İstek Logları</h4>
                  <div className="logs-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Zaman</th>
                          <th>Endpoint</th>
                          <th>Method</th>
                          <th>Durum</th>
                          <th>Süre</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>14:30:45</td>
                          <td>/api/lessons</td>
                          <td><span className="method get">GET</span></td>
                          <td><span className="status success">200</span></td>
                          <td>45ms</td>
                          <td>192.168.1.1</td>
                        </tr>
                        <tr>
                          <td>14:28:12</td>
                          <td>/api/users/123</td>
                          <td><span className="method post">POST</span></td>
                          <td><span className="status success">201</span></td>
                          <td>123ms</td>
                          <td>192.168.1.1</td>
                        </tr>
                        <tr>
                          <td>14:25:33</td>
                          <td>/api/ai/chat</td>
                          <td><span className="method post">POST</span></td>
                          <td><span className="status error">500</span></td>
                          <td>2341ms</td>
                          <td>192.168.1.2</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAPIKeys;
