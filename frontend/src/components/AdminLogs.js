import React, { useState } from 'react';
import './AdminLogs.css';

const AdminLogs = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');

  const [activityLogs] = useState([
    {
      id: 1,
      user: 'Ahmet Yılmaz',
      userType: 'student',
      action: 'login',
      details: 'Sisteme giriş yaptı',
      ip: '192.168.1.100',
      device: 'Chrome / Windows',
      timestamp: '2025-01-02T10:30:00Z',
      status: 'success'
    },
    {
      id: 2,
      user: 'Admin',
      userType: 'admin',
      action: 'user_update',
      details: 'Ayşe Kaya kullanıcısının bilgilerini güncelledi',
      ip: '10.0.0.1',
      device: 'Safari / macOS',
      timestamp: '2025-01-02T10:25:00Z',
      status: 'success'
    },
    {
      id: 3,
      user: 'Sistem',
      userType: 'system',
      action: 'backup',
      details: 'Otomatik yedekleme tamamlandı (2.4 GB)',
      ip: 'localhost',
      device: 'Server',
      timestamp: '2025-01-02T03:00:00Z',
      status: 'success'
    },
    {
      id: 4,
      user: 'Mehmet Öğretmen',
      userType: 'teacher',
      action: 'content_upload',
      details: 'Yeni ders materyali yükledi: Matematik - Kesirler.pdf',
      ip: '192.168.1.45',
      device: 'Firefox / Windows',
      timestamp: '2025-01-01T14:20:00Z',
      status: 'success'
    },
    {
      id: 5,
      user: 'Zeynep Öğrenci',
      userType: 'student',
      action: 'quiz_complete',
      details: '5. Sınıf Matematik Quiz - Puan: 85/100',
      ip: '192.168.1.78',
      device: 'Mobile / iOS',
      timestamp: '2025-01-01T11:45:00Z',
      status: 'success'
    },
    {
      id: 6,
      user: 'Hacker Test',
      userType: 'unknown',
      action: 'login_failed',
      details: 'Başarısız giriş denemesi (5. deneme)',
      ip: '45.67.89.123',
      device: 'Unknown',
      timestamp: '2025-01-01T02:15:00Z',
      status: 'failed'
    }
  ]);

  const [systemLogs] = useState([
    {
      id: 1,
      level: 'info',
      service: 'API Gateway',
      message: 'Service started successfully',
      details: 'All endpoints are operational',
      timestamp: '2025-01-02T00:00:00Z'
    },
    {
      id: 2,
      level: 'warning',
      service: 'Database',
      message: 'High memory usage detected',
      details: 'Memory usage: 85% - Consider scaling',
      timestamp: '2025-01-02T08:30:00Z'
    },
    {
      id: 3,
      level: 'error',
      service: 'Email Service',
      message: 'Failed to send email',
      details: 'SMTP connection timeout - Retrying...',
      timestamp: '2025-01-02T09:15:00Z'
    },
    {
      id: 4,
      level: 'critical',
      service: 'Payment Gateway',
      message: 'Payment processing failed',
      details: 'Unable to connect to payment provider',
      timestamp: '2025-01-01T22:45:00Z'
    }
  ]);

  const [auditLogs] = useState([
    {
      id: 1,
      user: 'Admin',
      resource: 'User Permissions',
      action: 'UPDATE',
      oldValue: 'teacher',
      newValue: 'admin',
      target: 'user:123',
      timestamp: '2025-01-02T10:00:00Z'
    },
    {
      id: 2,
      user: 'System',
      resource: 'Database',
      action: 'BACKUP',
      details: 'Daily backup completed',
      size: '2.4 GB',
      timestamp: '2025-01-02T03:00:00Z'
    },
    {
      id: 3,
      user: 'Admin',
      resource: 'System Settings',
      action: 'UPDATE',
      setting: 'maintenance_mode',
      oldValue: 'false',
      newValue: 'true',
      timestamp: '2025-01-01T23:00:00Z'
    }
  ]);

  const actionTypes = [
    { value: 'login', label: 'Giriş', icon: '🔐' },
    { value: 'logout', label: 'Çıkış', icon: '🚪' },
    { value: 'user_update', label: 'Kullanıcı Güncelleme', icon: '👤' },
    { value: 'content_upload', label: 'İçerik Yükleme', icon: '📤' },
    { value: 'quiz_complete', label: 'Quiz Tamamlama', icon: '✅' },
    { value: 'payment', label: 'Ödeme', icon: '💳' },
    { value: 'system', label: 'Sistem', icon: '⚙️' }
  ];

  const logLevels = [
    { value: 'info', label: 'Bilgi', color: '#2196f3' },
    { value: 'warning', label: 'Uyarı', color: '#ff9800' },
    { value: 'error', label: 'Hata', color: '#f44336' },
    { value: 'critical', label: 'Kritik', color: '#d32f2f' }
  ];

  const getActionIcon = (action) => {
    return actionTypes.find(a => a.value === action)?.icon || '📝';
  };

  const getActionLabel = (action) => {
    return actionTypes.find(a => a.value === action)?.label || action;
  };

  const getLogLevelColor = (level) => {
    return logLevels.find(l => l.value === level)?.color || '#666';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'admin': return '#d32f2f';
      case 'teacher': return '#1976d2';
      case 'student': return '#388e3c';
      case 'parent': return '#f57c00';
      case 'system': return '#7b1fa2';
      default: return '#666';
    }
  };

  const exportLogs = (format) => {
    console.log(`Exporting logs as ${format}...`);
    alert(`Loglar ${format} formatında indiriliyor...`);
  };

  return (
    <div className="admin-logs">
      {/* Header */}
      <div className="logs-header">
        <div className="header-left">
          <h2>📋 Sistem Logları</h2>
          <p>Aktivite, sistem ve denetim logları</p>
        </div>
        <div className="header-actions">
          <select
            className="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="custom">Özel Tarih</option>
          </select>
          <button 
            className="btn-export"
            onClick={() => exportLogs('CSV')}
          >
            📥 CSV İndir
          </button>
          <button 
            className="btn-export"
            onClick={() => exportLogs('PDF')}
          >
            📄 PDF İndir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="logs-tabs">
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          👥 Aktivite Logları
        </button>
        <button
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ Sistem Logları
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          🔍 Denetim Logları
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Güvenlik Logları
        </button>
      </div>

      {/* Content */}
      <div className="logs-content">
        {/* Filters */}
        <div className="logs-filters">
          <input
            type="text"
            placeholder="🔍 Log ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tüm Tipler</option>
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tüm Kullanıcılar</option>
            <option value="admin">Yöneticiler</option>
            <option value="teacher">Öğretmenler</option>
            <option value="student">Öğrenciler</option>
            <option value="system">Sistem</option>
          </select>

          <button className="btn-refresh">
            🔄 Yenile
          </button>
        </div>

        {/* Activity Logs */}
        {activeTab === 'activity' && (
          <div className="activity-logs">
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Zaman</th>
                    <th>Kullanıcı</th>
                    <th>İşlem</th>
                    <th>Detaylar</th>
                    <th>IP / Cihaz</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map(log => (
                    <tr key={log.id} className={log.status === 'failed' ? 'failed' : ''}>
                      <td className="timestamp">{formatDate(log.timestamp)}</td>
                      <td className="user">
                        <span 
                          className="user-badge"
                          style={{ color: getUserTypeColor(log.userType) }}
                        >
                          {log.user}
                        </span>
                      </td>
                      <td className="action">
                        <span className="action-icon">{getActionIcon(log.action)}</span>
                        {getActionLabel(log.action)}
                      </td>
                      <td className="details">{log.details}</td>
                      <td className="meta">
                        <div>{log.ip}</div>
                        <div className="device">{log.device}</div>
                      </td>
                      <td className="status">
                        <span className={`status-badge ${log.status}`}>
                          {log.status === 'success' ? '✅' : '❌'} {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Logs */}
        {activeTab === 'system' && (
          <div className="system-logs">
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Zaman</th>
                    <th>Seviye</th>
                    <th>Servis</th>
                    <th>Mesaj</th>
                    <th>Detaylar</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.map(log => (
                    <tr key={log.id}>
                      <td className="timestamp">{formatDate(log.timestamp)}</td>
                      <td className="level">
                        <span 
                          className="level-badge"
                          style={{ backgroundColor: getLogLevelColor(log.level) }}
                        >
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="service">{log.service}</td>
                      <td className="message">{log.message}</td>
                      <td className="details">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === 'audit' && (
          <div className="audit-logs">
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Zaman</th>
                    <th>Kullanıcı</th>
                    <th>Kaynak</th>
                    <th>İşlem</th>
                    <th>Değişiklik</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="timestamp">{formatDate(log.timestamp)}</td>
                      <td className="user">{log.user}</td>
                      <td className="resource">{log.resource}</td>
                      <td className="action">
                        <span className="action-badge">{log.action}</span>
                      </td>
                      <td className="changes">
                        {log.oldValue && log.newValue ? (
                          <div className="value-change">
                            <span className="old-value">{log.oldValue}</span>
                            <span className="arrow">→</span>
                            <span className="new-value">{log.newValue}</span>
                          </div>
                        ) : (
                          <span>{log.details || log.setting}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Logs */}
        {activeTab === 'security' && (
          <div className="security-logs">
            <div className="security-alerts">
              <div className="alert-card critical">
                <div className="alert-icon">🚨</div>
                <div className="alert-content">
                  <h4>Kritik Güvenlik Uyarısı</h4>
                  <p>Son 24 saatte 15 başarısız giriş denemesi tespit edildi.</p>
                  <div className="alert-meta">
                    <span>IP: 45.67.89.123</span>
                    <span>Son deneme: 10 dakika önce</span>
                  </div>
                </div>
              </div>

              <div className="alert-card warning">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h4>Şüpheli Aktivite</h4>
                  <p>Bir kullanıcı 5 farklı IP adresinden giriş yaptı.</p>
                  <div className="alert-meta">
                    <span>Kullanıcı: user@example.com</span>
                    <span>Lokasyon: TR, US, DE, FR, JP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="security-stats">
              <div className="stat-card">
                <h4>Güvenlik Özeti</h4>
                <div className="stat-item">
                  <span>Başarılı Girişler:</span>
                  <span className="stat-value success">1,234</span>
                </div>
                <div className="stat-item">
                  <span>Başarısız Girişler:</span>
                  <span className="stat-value error">45</span>
                </div>
                <div className="stat-item">
                  <span>Bloklanmış IP:</span>
                  <span className="stat-value">12</span>
                </div>
                <div className="stat-item">
                  <span>2FA Kullanım:</span>
                  <span className="stat-value">%78</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      <div className="log-pagination">
        <button className="pagination-btn">⬅️ Önceki</button>
        <span className="page-info">Sayfa 1 / 10</span>
        <button className="pagination-btn">Sonraki ➡️</button>
      </div>
    </div>
  );
};

export default AdminLogs;
