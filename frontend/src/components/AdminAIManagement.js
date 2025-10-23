import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminAIManagement.css';

const AdminAIManagement = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [aiModels, setAiModels] = useState([
    {
      id: 1,
      name: 'DeepSeek Chat',
      provider: 'DeepSeek',
      status: 'active',
      usage: 85,
      requests: 12456,
      avgResponseTime: 1.2,
      successRate: 98.5,
      cost: 234.56
    },
    {
      id: 2,
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      status: 'standby',
      usage: 12,
      requests: 2341,
      avgResponseTime: 2.1,
      successRate: 99.2,
      cost: 456.78
    },
    {
      id: 3,
      name: 'Hugging Face',
      provider: 'Hugging Face',
      status: 'inactive',
      usage: 3,
      requests: 234,
      avgResponseTime: 0.8,
      successRate: 95.4,
      cost: 12.34
    }
  ]);

  const [buddyStats, setBuddyStats] = useState({
    totalBuddies: 1247,
    activeBuddies: 987,
    totalConversations: 45678,
    averageSessionDuration: 23.5,
    satisfactionRate: 4.7,
    popularPersonalities: [
      { type: 'energetic_coach', count: 345, percentage: 35 },
      { type: 'wise_mentor', count: 295, percentage: 30 },
      { type: 'funny_friend', count: 245, percentage: 25 },
      { type: 'tech_wizard', count: 98, percentage: 10 }
    ]
  });

  const [trainingData, setTrainingData] = useState({
    totalDatasets: 23,
    totalSamples: 125000,
    lastTraining: '2024-12-18',
    nextScheduled: '2024-12-25',
    modelAccuracy: 94.5,
    f1Score: 0.92
  });

  const handleModelToggle = (modelId) => {
    setAiModels(models => 
      models.map(model => {
        if (model.id === modelId) {
          const newStatus = model.status === 'active' ? 'inactive' : 'active';
          return { ...model, status: newStatus };
        }
        return model;
      })
    );
  };

  const renderModelsTab = () => (
    <div className="models-management">
      <h3>🤖 AI Model Yönetimi</h3>
      
      {/* Model Overview */}
      <div className="models-overview">
        <div className="overview-card">
          <div className="card-icon">🧠</div>
          <div className="card-content">
            <h4>Aktif Modeller</h4>
            <p className="card-value">{aiModels.filter(m => m.status === 'active').length}</p>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h4>Toplam İstek</h4>
            <p className="card-value">{aiModels.reduce((sum, m) => sum + m.requests, 0).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <h4>Ort. Yanıt Süresi</h4>
            <p className="card-value">
              {(aiModels.reduce((sum, m) => sum + m.avgResponseTime, 0) / aiModels.length).toFixed(1)}s
            </p>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h4>Toplam Maliyet</h4>
            <p className="card-value">₺{aiModels.reduce((sum, m) => sum + m.cost, 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Model List */}
      <div className="models-list">
        {aiModels.map(model => (
          <div key={model.id} className={`model-card ${model.status}`}>
            <div className="model-header">
              <div className="model-info">
                <h4>{model.name}</h4>
                <p>{model.provider}</p>
              </div>
              <div className="model-status">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={model.status === 'active'}
                    onChange={() => handleModelToggle(model.id)}
                  />
                  <span className="slider"></span>
                </label>
                <span className={`status-badge ${model.status}`}>
                  {model.status === 'active' ? 'Aktif' : 
                   model.status === 'standby' ? 'Beklemede' : 'Pasif'}
                </span>
              </div>
            </div>
            
            <div className="model-stats">
              <div className="stat">
                <span className="label">Kullanım</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${model.usage}%`}}></div>
                </div>
                <span className="value">{model.usage}%</span>
              </div>
              
              <div className="stat">
                <span className="label">İstek Sayısı</span>
                <span className="value">{model.requests.toLocaleString()}</span>
              </div>
              
              <div className="stat">
                <span className="label">Yanıt Süresi</span>
                <span className="value">{model.avgResponseTime}s</span>
              </div>
              
              <div className="stat">
                <span className="label">Başarı Oranı</span>
                <span className="value">{model.successRate}%</span>
              </div>
              
              <div className="stat">
                <span className="label">Maliyet</span>
                <span className="value">₺{model.cost}</span>
              </div>
            </div>
            
            <div className="model-actions">
              <button className="btn-configure">⚙️ Yapılandır</button>
              <button className="btn-test">🧪 Test Et</button>
              <button className="btn-logs">📋 Loglar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Model Configuration */}
      <div className="model-config">
        <h4>⚙️ Model Konfigürasyonu</h4>
        <div className="config-grid">
          <div className="config-item">
            <label>Varsayılan Model</label>
            <select defaultValue="deepseek">
              <option value="deepseek">DeepSeek Chat</option>
              <option value="gpt4">GPT-4 Turbo</option>
              <option value="huggingface">Hugging Face</option>
            </select>
          </div>
          
          <div className="config-item">
            <label>Maksimum Token</label>
            <input type="number" defaultValue="2000" min="100" max="4000" />
          </div>
          
          <div className="config-item">
            <label>Temperature</label>
            <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" />
            <span>0.7</span>
          </div>
          
          <div className="config-item">
            <label>Timeout (saniye)</label>
            <input type="number" defaultValue="30" min="10" max="120" />
          </div>
          
          <div className="config-item">
            <label>Otomatik Yük Dengeleme</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="config-item">
            <label>Hata Durumunda Yedek Model</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        
        <button className="save-config-btn">💾 Konfigürasyonu Kaydet</button>
      </div>
    </div>
  );

  const renderBuddyTab = () => (
    <div className="buddy-management">
      <h3>🤖 AI Study Buddy Yönetimi</h3>
      
      {/* Buddy Stats */}
      <div className="buddy-stats">
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h4>Toplam Buddy</h4>
            <p className="stat-value">{buddyStats.totalBuddies}</p>
            <span className="stat-trend positive">+12% bu ay</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h4>Aktif Sohbetler</h4>
            <p className="stat-value">{buddyStats.activeBuddies}</p>
            <span className="stat-trend">Şu anda</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h4>Ort. Oturum Süresi</h4>
            <p className="stat-value">{buddyStats.averageSessionDuration} dk</p>
            <span className="stat-trend positive">+5 dk</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h4>Memnuniyet</h4>
            <p className="stat-value">{buddyStats.satisfactionRate}/5</p>
            <span className="stat-trend positive">Mükemmel</span>
          </div>
        </div>
      </div>

      {/* Personality Distribution */}
      <div className="personality-distribution">
        <h4>🎭 Kişilik Dağılımı</h4>
        <div className="personality-list">
          {buddyStats.popularPersonalities.map(personality => (
            <div key={personality.type} className="personality-item">
              <div className="personality-info">
                <span className="personality-icon">
                  {personality.type === 'energetic_coach' && '⚡'}
                  {personality.type === 'wise_mentor' && '🦉'}
                  {personality.type === 'funny_friend' && '😄'}
                  {personality.type === 'tech_wizard' && '🤖'}
                </span>
                <span className="personality-name">
                  {personality.type === 'energetic_coach' && 'Enerjik Koç'}
                  {personality.type === 'wise_mentor' && 'Bilge Mentor'}
                  {personality.type === 'funny_friend' && 'Eğlenceli Arkadaş'}
                  {personality.type === 'tech_wizard' && 'Tekno Sihirbaz'}
                </span>
              </div>
              <div className="personality-stats">
                <span className="count">{personality.count} öğrenci</span>
                <div className="percentage-bar">
                  <div 
                    className="percentage-fill"
                    style={{width: `${personality.percentage}%`}}
                  ></div>
                </div>
                <span className="percentage">{personality.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buddy Settings */}
      <div className="buddy-settings">
        <h4>⚙️ Buddy Ayarları</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Otomatik Buddy Ataması</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <label>Duygusal Destek Modu</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <label>Günlük Check-in</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <label>Öğrenme Önerileri</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <label>Maksimum Mesaj Uzunluğu</label>
            <input type="number" defaultValue="500" min="100" max="1000" />
          </div>
          
          <div className="setting-item">
            <label>Yanıt Bekleme Süresi (sn)</label>
            <input type="number" defaultValue="2" min="0" max="5" />
          </div>
        </div>
      </div>

      {/* Conversation Monitoring */}
      <div className="conversation-monitor">
        <h4>👁️ Aktif Sohbet İzleme</h4>
        <div className="monitor-list">
          <div className="monitor-item">
            <div className="student-info">
              <span className="avatar">👤</span>
              <div>
                <p className="student-name">Ahmet Yılmaz</p>
                <p className="buddy-type">Buddy: Enerji (Enerjik Koç)</p>
              </div>
            </div>
            <div className="conversation-stats">
              <span className="duration">15 dk</span>
              <span className="messages">23 mesaj</span>
              <span className="mood positive">😊 Mutlu</span>
            </div>
            <button className="monitor-btn">👁️ İzle</button>
          </div>
          
          <div className="monitor-item">
            <div className="student-info">
              <span className="avatar">👤</span>
              <div>
                <p className="student-name">Ayşe Kaya</p>
                <p className="buddy-type">Buddy: Bilge (Bilge Mentor)</p>
              </div>
            </div>
            <div className="conversation-stats">
              <span className="duration">8 dk</span>
              <span className="messages">12 mesaj</span>
              <span className="mood neutral">😐 Nötr</span>
            </div>
            <button className="monitor-btn">👁️ İzle</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrainingTab = () => (
    <div className="training-management">
      <h3>🎓 Model Eğitimi ve Öğrenme</h3>
      
      {/* Training Overview */}
      <div className="training-overview">
        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h4>Veri Setleri</h4>
            <p className="card-value">{trainingData.totalDatasets}</p>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">📝</div>
          <div className="card-content">
            <h4>Toplam Örnek</h4>
            <p className="card-value">{trainingData.totalSamples.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h4>Model Doğruluğu</h4>
            <p className="card-value">{trainingData.modelAccuracy}%</p>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h4>F1 Skoru</h4>
            <p className="card-value">{trainingData.f1Score}</p>
          </div>
        </div>
      </div>

      {/* Training Schedule */}
      <div className="training-schedule">
        <h4>📅 Eğitim Takvimi</h4>
        <div className="schedule-info">
          <div className="schedule-item">
            <span className="label">Son Eğitim:</span>
            <span className="value">{trainingData.lastTraining}</span>
          </div>
          <div className="schedule-item">
            <span className="label">Sonraki Planlanan:</span>
            <span className="value">{trainingData.nextScheduled}</span>
          </div>
        </div>
        
        <div className="schedule-actions">
          <button className="btn-train-now">🚀 Şimdi Eğit</button>
          <button className="btn-schedule">📅 Zamanla</button>
          <button className="btn-cancel">❌ İptal Et</button>
        </div>
      </div>

      {/* Data Management */}
      <div className="data-management">
        <h4>📚 Veri Yönetimi</h4>
        
        <div className="data-upload">
          <h5>Yeni Veri Seti Yükle</h5>
          <div className="upload-area">
            <input type="file" id="dataset-upload" style={{display: 'none'}} />
            <button 
              className="upload-btn"
              onClick={() => document.getElementById('dataset-upload').click()}
            >
              📁 Dosya Seç
            </button>
            <p>CSV, JSON veya TXT formatında</p>
          </div>
        </div>
        
        <div className="dataset-list">
          <h5>Mevcut Veri Setleri</h5>
          <table>
            <thead>
              <tr>
                <th>Veri Seti Adı</th>
                <th>Kayıt Sayısı</th>
                <th>Tür</th>
                <th>Ekleme Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MEB Müfredat Q&A</td>
                <td>45,000</td>
                <td>Soru-Cevap</td>
                <td>2024-12-01</td>
                <td>
                  <button className="btn-action">👁️</button>
                  <button className="btn-action">✏️</button>
                  <button className="btn-action">🗑️</button>
                </td>
              </tr>
              <tr>
                <td>Öğrenci Diyalogları</td>
                <td>32,000</td>
                <td>Konuşma</td>
                <td>2024-11-15</td>
                <td>
                  <button className="btn-action">👁️</button>
                  <button className="btn-action">✏️</button>
                  <button className="btn-action">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Training Metrics */}
      <div className="training-metrics">
        <h4>📊 Eğitim Metrikleri</h4>
        <div className="metrics-grid">
          <div className="metric-card">
            <h5>Loss Grafiği</h5>
            <div className="metric-chart">
              {/* Chart placeholder */}
              <div style={{height: '200px', background: '#f7fafc', borderRadius: '10px'}}></div>
            </div>
          </div>
          
          <div className="metric-card">
            <h5>Accuracy Grafiği</h5>
            <div className="metric-chart">
              {/* Chart placeholder */}
              <div style={{height: '200px', background: '#f7fafc', borderRadius: '10px'}}></div>
            </div>
          </div>
          
          <div className="metric-card">
            <h5>Validation Metrics</h5>
            <div className="metric-list">
              <div className="metric-item">
                <span>Precision:</span>
                <strong>0.91</strong>
              </div>
              <div className="metric-item">
                <span>Recall:</span>
                <strong>0.93</strong>
              </div>
              <div className="metric-item">
                <span>F1 Score:</span>
                <strong>0.92</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="performance-monitoring">
      <h3>📈 Performans İzleme</h3>
      
      {/* Real-time Metrics */}
      <div className="realtime-metrics">
        <h4>⚡ Canlı Metrikler</h4>
        <div className="metrics-dashboard">
          <div className="metric-display">
            <h5>Anlık İstek/sn</h5>
            <div className="metric-value">23</div>
            <div className="metric-trend positive">↑ 12%</div>
          </div>
          
          <div className="metric-display">
            <h5>Ortalama Yanıt Süresi</h5>
            <div className="metric-value">1.3s</div>
            <div className="metric-trend positive">↓ 0.2s</div>
          </div>
          
          <div className="metric-display">
            <h5>Hata Oranı</h5>
            <div className="metric-value">0.3%</div>
            <div className="metric-trend positive">↓ 0.1%</div>
          </div>
          
          <div className="metric-display">
            <h5>CPU Kullanımı</h5>
            <div className="metric-value">67%</div>
            <div className="metric-trend warning">↑ 5%</div>
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="alert-settings">
        <h4>🚨 Uyarı Ayarları</h4>
        <div className="alert-list">
          <div className="alert-item">
            <div className="alert-info">
              <h5>Yüksek Yanıt Süresi</h5>
              <p>Yanıt süresi 3 saniyeyi geçerse</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="alert-item">
            <div className="alert-info">
              <h5>Yüksek Hata Oranı</h5>
              <p>Hata oranı %2'yi geçerse</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="alert-item">
            <div className="alert-info">
              <h5>Model Offline</h5>
              <p>Herhangi bir model offline olursa</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Usage Analytics */}
      <div className="usage-analytics">
        <h4>📊 Kullanım Analitiği</h4>
        <div className="usage-stats">
          <div className="usage-card">
            <h5>En Çok Kullanılan Özellikler</h5>
            <ol>
              <li>Ders Açıklama - 34%</li>
              <li>Soru Çözümü - 28%</li>
              <li>Ödev Yardımı - 22%</li>
              <li>Quiz Hazırlama - 16%</li>
            </ol>
          </div>
          
          <div className="usage-card">
            <h5>Kullanıcı Dağılımı</h5>
            <ul>
              <li>5. Sınıf: 245 öğrenci</li>
              <li>6. Sınıf: 312 öğrenci</li>
              <li>7. Sınıf: 289 öğrenci</li>
              <li>8. Sınıf: 401 öğrenci</li>
            </ul>
          </div>
          
          <div className="usage-card">
            <h5>Popüler Konular</h5>
            <ol>
              <li>Matematik - Kesirler</li>
              <li>Fen - Işık ve Ses</li>
              <li>Türkçe - Dil Bilgisi</li>
              <li>İngilizce - Grammar</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-ai-management">
      <h2>🤖 AI Yönetim Paneli</h2>
      
      {/* Navigation */}
      <div className="ai-nav">
        <button 
          className={activeTab === 'models' ? 'active' : ''}
          onClick={() => setActiveTab('models')}
        >
          🧠 Modeller
        </button>
        <button 
          className={activeTab === 'buddy' ? 'active' : ''}
          onClick={() => setActiveTab('buddy')}
        >
          🤖 Study Buddy
        </button>
        <button 
          className={activeTab === 'training' ? 'active' : ''}
          onClick={() => setActiveTab('training')}
        >
          🎓 Eğitim
        </button>
        <button 
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          📈 Performans
        </button>
      </div>

      {/* Content */}
      <div className="ai-content">
        {activeTab === 'models' && renderModelsTab()}
        {activeTab === 'buddy' && renderBuddyTab()}
        {activeTab === 'training' && renderTrainingTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </div>
    </div>
  );
};

export default AdminAIManagement;
