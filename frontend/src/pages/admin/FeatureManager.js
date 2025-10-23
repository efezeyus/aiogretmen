import React, { useState, useEffect } from 'react';
import './FeatureManager.css';

const FeatureManager = () => {
  const [features, setFeatures] = useState([
    {
      id: 1,
      name: 'AI Destekli Öğrenme',
      key: 'ai_learning',
      enabled: true,
      description: 'DeepSeek AI ile güçlendirilmiş kişiselleştirilmiş eğitim',
      settings: {
        model: 'deepseek-chat',
        maxTokens: 4000,
        temperature: 0.7
      }
    },
    {
      id: 2,
      name: 'Gamification',
      key: 'gamification',
      enabled: true,
      description: 'Oyunlaştırılmış öğrenme deneyimi',
      settings: {
        pointsEnabled: true,
        badgesEnabled: true,
        leaderboardEnabled: true
      }
    },
    {
      id: 3,
      name: 'Blockchain Sertifikalar',
      key: 'blockchain_certificates',
      enabled: false,
      description: 'NFT tabanlı başarı sertifikaları',
      settings: {
        network: 'polygon',
        contractAddress: ''
      }
    },
    {
      id: 4,
      name: 'Sesli Asistan',
      key: 'voice_assistant',
      enabled: true,
      description: 'Sesli komutlarla öğrenme',
      settings: {
        language: 'tr-TR',
        speechRate: 1.0
      }
    },
    {
      id: 5,
      name: 'Bilgisayar Görüsü',
      key: 'computer_vision',
      enabled: true,
      description: 'El yazısı tanıma ve görsel analiz',
      settings: {
        handwritingEnabled: true,
        ocrEnabled: true
      }
    },
    {
      id: 6,
      name: 'Adaptif Öğrenme',
      key: 'adaptive_learning',
      enabled: true,
      description: 'Öğrenci seviyesine göre otomatik ayarlanan içerik',
      settings: {
        difficultyAdjustment: true,
        personalizedPath: true
      }
    },
    {
      id: 7,
      name: 'Çoklu Dil Desteği',
      key: 'translation',
      enabled: true,
      description: '20+ dilde eğitim içeriği',
      settings: {
        languages: ['tr', 'en', 'de', 'fr', 'es']
      }
    },
    {
      id: 8,
      name: 'Veli Paneli',
      key: 'parent_dashboard',
      enabled: true,
      description: 'Gerçek zamanlı ilerleme takibi',
      settings: {
        realTimeNotifications: true,
        weeklyReports: true
      }
    }
  ]);

  const [editingFeature, setEditingFeature] = useState(null);
  const [showSettings, setShowSettings] = useState(null);

  const toggleFeature = async (featureId) => {
    setFeatures(features.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ));
    
    // API call to update feature status
    try {
      // await updateFeatureStatus(featureId, !feature.enabled);
      console.log('Feature toggled:', featureId);
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const updateFeatureSettings = (featureId, newSettings) => {
    setFeatures(features.map(feature => 
      feature.id === featureId 
        ? { ...feature, settings: { ...feature.settings, ...newSettings } }
        : feature
    ));
  };

  const saveSettings = async (feature) => {
    try {
      // await saveFeatureSettings(feature.id, feature.settings);
      console.log('Settings saved for:', feature.name);
      setShowSettings(null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="feature-manager">
      <div className="feature-header">
        <h2>Özellik Yönetimi</h2>
        <p>Sistem özelliklerini buradan açıp kapatabilir ve yapılandırabilirsiniz.</p>
      </div>

      <div className="features-grid">
        {features.map(feature => (
          <div key={feature.id} className={`feature-card ${feature.enabled ? 'enabled' : 'disabled'}`}>
            <div className="feature-header-card">
              <h3>{feature.name}</h3>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={feature.enabled}
                  onChange={() => toggleFeature(feature.id)}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <p className="feature-description">{feature.description}</p>
            
            <div className="feature-status">
              <span className={`status-badge ${feature.enabled ? 'active' : 'inactive'}`}>
                {feature.enabled ? 'Aktif' : 'Pasif'}
              </span>
              <span className="feature-key">{feature.key}</span>
            </div>

            <button 
              className="settings-btn"
              onClick={() => setShowSettings(feature.id)}
            >
              ⚙️ Ayarlar
            </button>

            {showSettings === feature.id && (
              <div className="settings-modal">
                <div className="settings-content">
                  <h4>{feature.name} Ayarları</h4>
                  
                  {Object.entries(feature.settings).map(([key, value]) => (
                    <div key={key} className="setting-item">
                      <label>{key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                      {typeof value === 'boolean' ? (
                        <input 
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateFeatureSettings(feature.id, { [key]: e.target.checked })}
                        />
                      ) : Array.isArray(value) ? (
                        <div className="array-input">
                          {value.join(', ')}
                        </div>
                      ) : (
                        <input 
                          type="text"
                          value={value}
                          onChange={(e) => updateFeatureSettings(feature.id, { [key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                  
                  <div className="settings-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => saveSettings(feature)}
                    >
                      Kaydet
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowSettings(null)}
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="feature-info">
        <h3>📌 Önemli Notlar</h3>
        <ul>
          <li>Özellikleri kapatmak sistem performansını artırabilir</li>
          <li>Blockchain özelliği için Web3 cüzdan bağlantısı gereklidir</li>
          <li>AI modeli değişiklikleri yeni oturumlarda geçerli olur</li>
          <li>Veli paneli kapatıldığında veliler sisteme erişemez</li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureManager;
