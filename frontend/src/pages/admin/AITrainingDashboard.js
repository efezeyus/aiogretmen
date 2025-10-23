import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AITrainingDashboard.css';

/**
 * AI TRAINING DASHBOARD
 * Kendi yapay zeka modelimizi eğitme ve izleme paneli
 */

const AITrainingDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [models, setModels] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // İstatistikleri al
      const statsRes = await api.get('/ai-training/training/statistics');
      if (statsRes) setStats(statsRes);

      // Modelleri al
      const modelsRes = await api.get('/ai-training/training/models');
      if (modelsRes?.models) setModels(Object.values(modelsRes.models));

      // Önerileri al
      const recsRes = await api.get('/ai-training/training/recommendations');
      if (recsRes?.recommendations) setRecommendations(recsRes.recommendations);

      console.log('✅ AI Training data yüklendi');
    } catch (error) {
      console.error('AI Training yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectData = async () => {
    if (!window.confirm('Öğrenci etkileşimlerinden eğitim verisi toplanacak. Devam edilsin mi?')) {
      return;
    }

    setCollecting(true);
    try {
      const response = await api.post('/ai-training/training/collect-data');
      
      if (response?.success) {
        alert(`✅ ${response.collected_examples} eğitim örneği toplandı!`);
        loadData();
      }
    } catch (error) {
      alert('❌ Veri toplama hatası: ' + error.message);
    } finally {
      setCollecting(false);
    }
  };

  const handleGenerateDataset = async (grade, subject) => {
    try {
      const response = await api.post(
        `/ai-training/training/generate-meb-dataset?grade=${grade}&subject=${subject}`
      );
      
      if (response?.success) {
        alert(`✅ MEB dataset oluşturuldu!\n${response.file_path}`);
      }
    } catch (error) {
      alert('❌ Dataset oluşturma hatası: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">AI Training Dashboard yükleniyor...</div>;
  }

  return (
    <div className="ai-training-dashboard">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/admin')}>
          ← Admin Dashboard
        </button>
        <h1>🤖 AI Model Eğitim Merkezi</h1>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.total_interactions || 0}</div>
            <div className="stat-label">Toplam Etkileşim</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.by_grade?.length || 0}</div>
            <div className="stat-label">Aktif Sınıf</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.by_subject?.length || 0}</div>
            <div className="stat-label">Aktif Ders</div>
          </div>
        </div>

        <div className={`stat-card ${stats?.training_data_available ? 'ready' : 'not-ready'}`}>
          <div className="stat-icon">{stats?.training_data_available ? '✅' : '⏳'}</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.training_data_available ? 'Hazır' : 'Bekliyor'}</div>
            <div className="stat-label">Eğitim Durumu</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="training-actions">
        <button 
          className="action-btn primary"
          onClick={handleCollectData}
          disabled={collecting}
        >
          {collecting ? '⏳ Toplanuyor...' : '📥 Eğitim Verisi Topla'}
        </button>
        
        <button 
          className="action-btn"
          onClick={() => handleGenerateDataset(5, 'matematik')}
        >
          📄 5. Sınıf Matematik Dataset Oluştur
        </button>
        
        <button 
          className="action-btn"
          onClick={() => handleGenerateDataset(6, 'matematik')}
        >
          📄 6. Sınıf Matematik Dataset Oluştur
        </button>
      </div>

      {/* Models */}
      <div className="models-section">
        <h2>🤖 AI Modeller</h2>
        <div className="models-grid">
          {models.map((model, index) => (
            <div key={index} className="model-card">
              <div className="model-header">
                <h3>{model.name}</h3>
                <span className="model-status">
                  {model.last_trained ? '✅ Eğitildi' : '⏳ Bekliyor'}
                </span>
              </div>
              <p className="model-description">{model.description}</p>
              <div className="model-stats">
                <div className="model-stat">
                  <span>Eğitim Örneği:</span>
                  <strong>{model.training_examples}</strong>
                </div>
                <div className="model-stat">
                  <span>Doğruluk:</span>
                  <strong>%{Math.round(model.accuracy * 100)}</strong>
                </div>
              </div>
              {model.last_trained && (
                <div className="model-date">
                  Son Eğitim: {new Date(model.last_trained).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>💡 Eğitim Önerileri</h2>
        <div className="recommendations-list">
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="rec-number">{index + 1}</span>
              <span className="rec-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Charts */}
      {stats && (
        <div className="distribution-section">
          <div className="distribution-card">
            <h3>📊 Ders Bazlı Dağılım</h3>
            <div className="distribution-list">
              {stats.by_subject?.map((item, index) => (
                <div key={index} className="distribution-item">
                  <span className="dist-label">{item.subject}</span>
                  <div className="dist-bar">
                    <div 
                      className="dist-fill" 
                      style={{ width: `${(item.interactions / stats.total_interactions) * 100}%` }}
                    ></div>
                  </div>
                  <span className="dist-value">{item.interactions}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="distribution-card">
            <h3>🎓 Sınıf Bazlı Dağılım</h3>
            <div className="distribution-list">
              {stats.by_grade?.map((item, index) => (
                <div key={index} className="distribution-item">
                  <span className="dist-label">{item.grade}. Sınıf</span>
                  <div className="dist-bar">
                    <div 
                      className="dist-fill" 
                      style={{ width: `${(item.interactions / stats.total_interactions) * 100}%` }}
                    ></div>
                  </div>
                  <span className="dist-value">{item.interactions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITrainingDashboard;
