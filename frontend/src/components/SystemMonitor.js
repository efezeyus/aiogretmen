import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './SystemMonitor.css';

const SystemMonitor = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [aiModels, setAiModels] = useState(null);
  const [learningStats, setLearningStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSystemData();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Sistem sağlık durumu
      const healthResponse = await api.get('/system/health');
      setSystemHealth(healthResponse.data);
      
      // AI modelleri
      const modelsResponse = await api.get('/system/ai-models');
      setAiModels(modelsResponse.data);
      
      // Öğrenme istatistikleri
      const statsResponse = await api.get('/system/learning-stats');
      setLearningStats(statsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('System data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerLearningCycle = async () => {
    try {
      const response = await api.post('/system/trigger-learning');
      if (response.data.success) {
        alert('Öğrenme döngüsü başarıyla tetiklendi!');
        fetchSystemData();
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return '#48bb78';
      case 'inactive':
      case 'degraded':
        return '#f59e0b';
      case 'error':
        return '#f56565';
      default:
        return '#718096';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return '✅';
      case 'inactive':
        return '⚠️';
      case 'error':
        return '❌';
      case 'degraded':
        return '⚡';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="system-monitor loading">
        <div className="loading-spinner">⚙️ Sistem bilgileri yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-monitor error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>Sistem bilgileri yüklenemedi: {error}</p>
          <button onClick={fetchSystemData}>Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="system-monitor">
      <div className="monitor-header">
        <h1>🖥️ Sistem Durumu Monitörü</h1>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchSystemData}>
            🔄 Yenile
          </button>
          <span className="last-update">
            Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
          </span>
        </div>
      </div>

      {/* Genel Sistem Durumu */}
      {systemHealth && (
        <div className="monitor-section">
          <h2>Genel Durum</h2>
          <div className="overall-status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(systemHealth.status) }}
            >
              {getStatusIcon(systemHealth.status)}
            </div>
            <div className="status-info">
              <h3>{systemHealth.status.toUpperCase()}</h3>
              <p>Versiyon: {systemHealth.version}</p>
              <p>Zaman: {new Date(systemHealth.timestamp).toLocaleString('tr-TR')}</p>
            </div>
          </div>

          {/* Servis Durumları */}
          <div className="services-grid">
            {Object.entries(systemHealth.services).map(([service, info]) => (
              <div key={service} className="service-card">
                <div className="service-header">
                  <span className="service-icon">
                    {getStatusIcon(info.status)}
                  </span>
                  <h4>{service.toUpperCase()}</h4>
                </div>
                <div className="service-status">
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: getStatusColor(info.status),
                      color: 'white'
                    }}
                  >
                    {info.status}
                  </span>
                </div>
                {info.reason && (
                  <p className="service-reason">{info.reason}</p>
                )}
                {info.error && (
                  <p className="service-error">Hata: {info.error}</p>
                )}
                {info.model && (
                  <p className="service-detail">Model: {info.model}</p>
                )}
                {info.database && (
                  <p className="service-detail">Database: {info.database}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Modelleri */}
      {aiModels && (
        <div className="monitor-section">
          <h2>🤖 AI Modelleri</h2>
          <div className="ai-models-info">
            <div className="current-model">
              <h3>Aktif Model</h3>
              <p className="model-name">{aiModels.current_model}</p>
              <p className="model-provider">Provider: {aiModels.current_provider}</p>
            </div>
            
            <div className="available-models">
              <h3>Mevcut Modeller</h3>
              {Object.entries(aiModels.available_models).map(([provider, info]) => (
                <div key={provider} className="model-provider">
                  <h4>{provider.toUpperCase()}</h4>
                  <span className={`status ${info.status}`}>
                    {info.status === 'active' ? '🟢' : '🔴'} {info.status}
                  </span>
                  {info.models && (
                    <ul>
                      {info.models.map(model => (
                        <li key={model}>{model}</li>
                      ))}
                    </ul>
                  )}
                  {info.model && <p>Model: {info.model}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Öğrenme İstatistikleri */}
      {learningStats && (
        <div className="monitor-section">
          <h2>📊 Öğrenme İstatistikleri</h2>
          
          {learningStats.performance && (
            <div className="performance-stats">
              <h3>Son 7 Günlük Performans</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Toplam Etkileşim</span>
                  <span className="stat-value">
                    {learningStats.performance.overall?.total_interactions || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pozitif Geri Bildirim</span>
                  <span className="stat-value">
                    {Math.round((learningStats.performance.overall?.avg_positive_feedback || 0) * 100)}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ortalama Güven</span>
                  <span className="stat-value">
                    {Math.round((learningStats.performance.overall?.avg_confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Yanıt Süresi</span>
                  <span className="stat-value">
                    {(learningStats.performance.overall?.avg_response_time || 0).toFixed(2)}s
                  </span>
                </div>
              </div>

              {/* İyileştirme Alanları */}
              {learningStats.performance.overall?.improvement_areas?.length > 0 && (
                <div className="improvement-areas">
                  <h4>⚡ İyileştirme Alanları</h4>
                  <ul>
                    {learningStats.performance.overall.improvement_areas.map((area, idx) => (
                      <li key={idx}>
                        <strong>{area.subject} - {area.grade}. Sınıf:</strong>
                        <span> Memnuniyet %{Math.round(area.current_satisfaction * 100)}</span>
                        <p className="recommendation">{area.recommendation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Son İyileştirme Döngüsü */}
          {learningStats.last_improvement_cycle && (
            <div className="last-cycle">
              <h3>Son İyileştirme Döngüsü</h3>
              <p>Tarih: {new Date(learningStats.last_improvement_cycle.timestamp).toLocaleString('tr-TR')}</p>
              <p>Oluşturulan Eğitim Verisi: {learningStats.last_improvement_cycle.training_data_generated}</p>
              
              {learningStats.last_improvement_cycle.action_items?.length > 0 && (
                <div className="action-items">
                  <h4>Eylem Öğeleri</h4>
                  {learningStats.last_improvement_cycle.action_items.map((item, idx) => (
                    <div key={idx} className={`action-item priority-${item.priority}`}>
                      <span className="priority">{item.priority.toUpperCase()}</span>
                      <strong>{item.action}</strong>
                      <p>{item.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manuel Tetikleme */}
          <div className="manual-trigger">
            <button 
              className="trigger-btn"
              onClick={triggerLearningCycle}
            >
              🔄 Öğrenme Döngüsünü Manuel Tetikle
            </button>
            <p className="trigger-info">
              Otomatik döngü her {learningStats.learning_parameters?.learning_interval_days || 7} günde bir çalışır.
            </p>
          </div>
        </div>
      )}

      {/* Sistem Özellikleri */}
      <div className="monitor-section">
        <h2>⚙️ Sistem Özellikleri</h2>
        <div className="features-grid">
          <div className="feature-item active">
            <span className="feature-icon">🧠</span>
            <span className="feature-name">Auto Learning</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">📊</span>
            <span className="feature-name">Adaptive Learning</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">🔍</span>
            <span className="feature-name">RAG (Retrieval Augmented Generation)</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">🎤</span>
            <span className="feature-name">Voice Integration</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">👁️</span>
            <span className="feature-name">Computer Vision</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">🏆</span>
            <span className="feature-name">Gamification</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">🔗</span>
            <span className="feature-name">Blockchain Certificates</span>
          </div>
          <div className="feature-item active">
            <span className="feature-icon">😊</span>
            <span className="feature-name">Emotion Detection</span>
          </div>
        </div>
      </div>

      {/* Açıklama */}
      <div className="monitor-footer">
        <p>
          Bu monitör, Yapay Zeka Öğretmen sisteminin tüm bileşenlerinin durumunu gösterir.
          Sistem otomatik olarak kendini geliştirir ve öğrenci etkileşimlerinden öğrenir.
        </p>
        <p>
          <strong>DeepSeek AI</strong> ana dil modeli olarak kullanılmaktadır.
          Sistem, öğrenci geri bildirimlerini analiz ederek sürekli iyileştirilmektedir.
        </p>
      </div>
    </div>
  );
};

export default SystemMonitor;
