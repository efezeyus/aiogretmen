import React, { useState, useEffect } from 'react';
import './ServiceMonitor.css';

const ServiceMonitor = () => {
  const [services, setServices] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchServiceStatus();
    
    const interval = autoRefresh ? setInterval(() => {
      fetchServiceStatus();
    }, 10000) : null; // Her 10 saniyede bir güncelle

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchServiceStatus = async () => {
    try {
      // Backend health check
      const healthResponse = await fetch('http://localhost:8000/health');
      const healthData = await healthResponse.json();
      
      // System health check
      const systemResponse = await fetch('http://localhost:8000/api/system/health');
      const systemData = await systemResponse.json();
      
      setSystemHealth(healthData);
      setServices(systemData.services || {});
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Servis durumu yükleme hatası:', error);
      setServices({});
      setSystemHealth({ status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return '#4caf50';
      case 'inactive':
      case 'degraded':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return '✅';
      case 'inactive':
      case 'degraded':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const serviceList = [
    {
      id: 'openai',
      name: 'OpenAI (GPT-4o)',
      icon: '🤖',
      description: 'AI Sohbet Servisi'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      icon: '🧠',
      description: 'Alternatif AI Servisi'
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      icon: '🗄️',
      description: 'Veritabanı'
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      icon: '🐘',
      description: 'İlişkisel Veritabanı'
    },
    {
      id: 'redis',
      name: 'Redis',
      icon: '⚡',
      description: 'Cache Servisi'
    },
    {
      id: 'elasticsearch',
      name: 'Elasticsearch',
      icon: '🔍',
      description: 'Arama Motoru'
    }
  ];

  return (
    <div className="service-monitor">
      <div className="monitor-header">
        <div>
          <h1>🔧 Servis Monitörü</h1>
          <p className="subtitle">aiogretmen.com - Sistem Durumu</p>
        </div>
        <div className="header-actions">
          <div className="auto-refresh">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Otomatik Yenile
            </label>
          </div>
          <button className="btn btn-refresh" onClick={fetchServiceStatus}>
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* Genel Durum */}
      <div className="overall-status">
        <div className={`status-card ${systemHealth.status}`}>
          <div className="status-icon-large">
            {getStatusIcon(systemHealth.status)}
          </div>
          <div className="status-info">
            <h2>Sistem Durumu</h2>
            <p className="status-label">{systemHealth.status === 'healthy' ? 'SAĞLIKLI' : 'SORUNLU'}</p>
            <p className="last-update">
              Son Güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </p>
          </div>
        </div>
      </div>

      {/* Servis Kartları */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Servisler kontrol ediliyor...</p>
        </div>
      ) : (
        <div className="services-grid">
          {serviceList.map((service) => {
            const serviceData = services[service.id] || {};
            const status = serviceData.status || 'unknown';
            
            return (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <div className="service-icon">{service.icon}</div>
                  <div className="service-title">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                  </div>
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(status) }}
                    title={status}
                  >
                    {getStatusIcon(status)}
                  </div>
                </div>

                <div className="service-details">
                  <div className="detail-row">
                    <span className="detail-label">Durum:</span>
                    <span className={`detail-value status-${status}`}>
                      {status === 'active' ? 'Aktif' : 
                       status === 'error' ? 'Hata' : 
                       status === 'inactive' ? 'Pasif' : 'Bilinmiyor'}
                    </span>
                  </div>

                  {serviceData.model && (
                    <div className="detail-row">
                      <span className="detail-label">Model:</span>
                      <span className="detail-value">{serviceData.model}</span>
                    </div>
                  )}

                  {serviceData.api_key_set !== undefined && (
                    <div className="detail-row">
                      <span className="detail-label">API Key:</span>
                      <span className="detail-value">
                        {serviceData.api_key_set ? '✅ Ayarlandı' : '❌ Eksik'}
                      </span>
                    </div>
                  )}

                  {serviceData.error && (
                    <div className="detail-row error-row">
                      <span className="detail-label">Hata:</span>
                      <span className="detail-value error-message">
                        {serviceData.error}
                      </span>
                    </div>
                  )}

                  {serviceData.reason && (
                    <div className="detail-row">
                      <span className="detail-label">Sebep:</span>
                      <span className="detail-value">{serviceData.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sistem Bilgileri */}
      <div className="system-info">
        <h3>Sistem Bilgileri</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Backend Versiyonu:</span>
            <span className="info-value">{systemHealth.version || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Environment:</span>
            <span className="info-value">{systemHealth.environment || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Timestamp:</span>
            <span className="info-value">
              {systemHealth.timestamp ? 
                new Date(systemHealth.timestamp * 1000).toLocaleString('tr-TR') : 
                'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceMonitor;
