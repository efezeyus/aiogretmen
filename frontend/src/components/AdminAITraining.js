import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import './AdminAITraining.css';

const AdminAITraining = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [selectedModel, setSelectedModel] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [showTrainModal, setShowTrainModal] = useState(false);

  const [models, setModels] = useState([
    {
      id: 'model-001',
      name: 'YapayZeka-Ogretmen-v2.1',
      type: 'Fine-tuned GPT',
      baseModel: 'gpt-3.5-turbo',
      status: 'active',
      accuracy: 94.5,
      loss: 0.023,
      trainingData: 125000,
      parameters: '175B',
      lastTrained: '2024-12-18',
      version: '2.1',
      specialization: 'Matematik & Fen',
      performance: {
        accuracy: 94.5,
        f1Score: 0.92,
        precision: 0.93,
        recall: 0.91
      }
    },
    {
      id: 'model-002',
      name: 'YapayZeka-Dil-v1.5',
      type: 'Fine-tuned BERT',
      baseModel: 'bert-base-turkish',
      status: 'training',
      accuracy: 88.2,
      loss: 0.087,
      trainingData: 85000,
      parameters: '110M',
      lastTrained: '2024-12-20',
      version: '1.5',
      specialization: 'Türkçe & İngilizce',
      performance: {
        accuracy: 88.2,
        f1Score: 0.86,
        precision: 0.87,
        recall: 0.85
      },
      trainingProgress: 67
    },
    {
      id: 'model-003',
      name: 'YapayZeka-Vision-v1.0',
      type: 'Computer Vision',
      baseModel: 'CLIP',
      status: 'testing',
      accuracy: 91.3,
      loss: 0.045,
      trainingData: 50000,
      parameters: '400M',
      lastTrained: '2024-12-19',
      version: '1.0',
      specialization: 'Görsel Tanıma',
      performance: {
        accuracy: 91.3,
        f1Score: 0.89,
        precision: 0.90,
        recall: 0.88
      }
    }
  ]);

  const [trainingStats] = useState({
    totalModels: 12,
    activeModels: 8,
    totalTrainingHours: 3456,
    datasetSize: '2.5TB',
    avgAccuracy: 92.3,
    computeUsage: '85%'
  });

  const [datasets] = useState([
    {
      id: 1,
      name: 'MEB Müfredat Dataset',
      size: '500GB',
      samples: 1250000,
      type: 'text',
      quality: 95,
      lastUpdated: '2024-12-15'
    },
    {
      id: 2,
      name: 'Öğrenci Sohbet Logları',
      size: '350GB',
      samples: 850000,
      type: 'conversation',
      quality: 88,
      lastUpdated: '2024-12-18'
    },
    {
      id: 3,
      name: 'Eğitim Videoları Transcript',
      size: '200GB',
      samples: 450000,
      type: 'multimodal',
      quality: 92,
      lastUpdated: '2024-12-10'
    }
  ]);

  const [trainingQueue] = useState([
    {
      id: 1,
      model: 'YapayZeka-Sosyal-v1.0',
      priority: 'high',
      estimatedTime: '6 saat',
      dataset: 'Sosyal Bilgiler Dataset',
      status: 'queued'
    },
    {
      id: 2,
      model: 'YapayZeka-Muzik-v0.5',
      priority: 'medium',
      estimatedTime: '4 saat',
      dataset: 'Müzik Teorisi Dataset',
      status: 'queued'
    }
  ]);

  // Training metrics data
  const [metricsData] = useState({
    labels: ['Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5'],
    datasets: [
      {
        label: 'Training Loss',
        data: [0.85, 0.62, 0.45, 0.32, 0.23],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4
      },
      {
        label: 'Validation Loss',
        data: [0.88, 0.65, 0.48, 0.35, 0.26],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4
      }
    ]
  });

  // Model comparison data
  const [comparisonData] = useState({
    labels: ['Accuracy', 'F1 Score', 'Precision', 'Recall', 'Speed'],
    datasets: [
      {
        label: 'YapayZeka-Ogretmen-v2.1',
        data: [94.5, 92, 93, 91, 85],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
      },
      {
        label: 'YapayZeka-Dil-v1.5',
        data: [88.2, 86, 87, 85, 92],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
      }
    ]
  });

  useEffect(() => {
    // Simulate training progress
    const interval = setInterval(() => {
      setModels(prev => prev.map(model => {
        if (model.status === 'training' && model.trainingProgress < 100) {
          return {
            ...model,
            trainingProgress: Math.min(100, model.trainingProgress + Math.random() * 2)
          };
        }
        return model;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'training': return '#ff9800';
      case 'testing': return '#2196f3';
      case 'inactive': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'training': return 'Eğitiliyor';
      case 'testing': return 'Test Ediliyor';
      case 'inactive': return 'Pasif';
      default: return '';
    }
  };

  const handleStartTraining = (model) => {
    setTrainingStatus('preparing');
    setTimeout(() => {
      setTrainingStatus('training');
      setModels(prev => prev.map(m => 
        m.id === model.id ? { ...m, status: 'training', trainingProgress: 0 } : m
      ));
    }, 2000);
  };

  const handleStopTraining = (model) => {
    if (window.confirm('Eğitimi durdurmak istediğinizden emin misiniz?')) {
      setTrainingStatus('idle');
      setModels(prev => prev.map(m => 
        m.id === model.id ? { ...m, status: 'testing' } : m
      ));
    }
  };

  const handleDeployModel = (model) => {
    alert(`${model.name} modeli deploy ediliyor...`);
  };

  return (
    <div className="admin-ai-training">
      {/* Header */}
      <div className="training-header">
        <div className="header-left">
          <h2>🤖 AI Model Eğitimi</h2>
          <p>Model geliştirme, eğitim ve performans takibi</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-train"
            onClick={() => setShowTrainModal(true)}
          >
            🚀 Yeni Model Eğit
          </button>
          <button className="btn-dataset">
            📊 Dataset Yönetimi
          </button>
          <button className="btn-compute">
            💻 Compute Kaynakları
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="training-stats">
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{trainingStats.totalModels}</div>
            <div className="stat-label">Toplam Model</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{trainingStats.activeModels}</div>
            <div className="stat-label">Aktif Model</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{trainingStats.totalTrainingHours}</div>
            <div className="stat-label">Eğitim Saati</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <div className="stat-value">{trainingStats.datasetSize}</div>
            <div className="stat-label">Dataset Boyutu</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">%{trainingStats.avgAccuracy}</div>
            <div className="stat-label">Ort. Doğruluk</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💻</div>
          <div className="stat-content">
            <div className="stat-value">{trainingStats.computeUsage}</div>
            <div className="stat-label">GPU Kullanımı</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="training-tabs">
        <button
          className={`tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🤖 Modeller
        </button>
        <button
          className={`tab ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          🎯 Eğitim
        </button>
        <button
          className={`tab ${activeTab === 'datasets' ? 'active' : ''}`}
          onClick={() => setActiveTab('datasets')}
        >
          📊 Veri Setleri
        </button>
        <button
          className={`tab ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          🧪 Deneyler
        </button>
        <button
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          📈 Metrikler
        </button>
      </div>

      {/* Content */}
      <div className="training-content">
        {activeTab === 'models' && (
          <div className="models-view">
            <div className="models-grid">
              {models.map(model => (
                <div key={model.id} className="model-card">
                  <div className="model-header">
                    <h3>{model.name}</h3>
                    <span 
                      className="model-status"
                      style={{ backgroundColor: getStatusColor(model.status) }}
                    >
                      {getStatusLabel(model.status)}
                    </span>
                  </div>

                  <div className="model-info">
                    <div className="info-row">
                      <span className="label">Tip:</span>
                      <span className="value">{model.type}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Temel Model:</span>
                      <span className="value">{model.baseModel}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Parametre:</span>
                      <span className="value">{model.parameters}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Uzmanlık:</span>
                      <span className="value">{model.specialization}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Versiyon:</span>
                      <span className="value">v{model.version}</span>
                    </div>
                  </div>

                  {model.status === 'training' && (
                    <div className="training-progress">
                      <div className="progress-header">
                        <span>Eğitim İlerlemesi</span>
                        <span>{model.trainingProgress?.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${model.trainingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="model-metrics">
                    <div className="metric">
                      <span className="metric-label">Doğruluk</span>
                      <span className="metric-value">{model.accuracy}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Loss</span>
                      <span className="metric-value">{model.loss}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">F1 Score</span>
                      <span className="metric-value">{model.performance.f1Score}</span>
                    </div>
                  </div>

                  <div className="model-actions">
                    {model.status === 'active' && (
                      <>
                        <button className="btn-action view">
                          📊 Detaylar
                        </button>
                        <button className="btn-action retrain">
                          🔄 Yeniden Eğit
                        </button>
                        <button className="btn-action export">
                          📥 İndir
                        </button>
                      </>
                    )}
                    {model.status === 'training' && (
                      <>
                        <button 
                          className="btn-action monitor"
                          onClick={() => setSelectedModel(model)}
                        >
                          📊 İzle
                        </button>
                        <button 
                          className="btn-action stop"
                          onClick={() => handleStopTraining(model)}
                        >
                          ⏹️ Durdur
                        </button>
                      </>
                    )}
                    {model.status === 'testing' && (
                      <>
                        <button className="btn-action test">
                          🧪 Test Et
                        </button>
                        <button 
                          className="btn-action deploy"
                          onClick={() => handleDeployModel(model)}
                        >
                          🚀 Deploy
                        </button>
                      </>
                    )}
                  </div>

                  <div className="model-footer">
                    <span className="training-data">
                      📊 {(model.trainingData / 1000).toFixed(0)}K veri
                    </span>
                    <span className="last-trained">
                      📅 {model.lastTrained}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="training-view">
            <div className="training-grid">
              <div className="training-section">
                <h3>🎯 Aktif Eğitimler</h3>
                <div className="active-trainings">
                  {models.filter(m => m.status === 'training').map(model => (
                    <div key={model.id} className="training-item">
                      <div className="training-info">
                        <h4>{model.name}</h4>
                        <div className="training-details">
                          <span>Epoch: 5/10</span>
                          <span>Batch: 2,456/10,000</span>
                          <span>ETA: 2 saat 15 dk</span>
                        </div>
                      </div>
                      <div className="training-chart">
                        <div style={{ height: '200px' }}>
                          <Line 
                            data={metricsData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: true } }
                            }} 
                          />
                        </div>
                      </div>
                      <div className="training-controls">
                        <button className="btn-pause">⏸️ Duraklat</button>
                        <button className="btn-stop">⏹️ Durdur</button>
                        <button className="btn-logs">📋 Loglar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="training-section">
                <h3>🕐 Eğitim Kuyruğu</h3>
                <div className="training-queue">
                  {trainingQueue.map(item => (
                    <div key={item.id} className="queue-item">
                      <div className="queue-info">
                        <h4>{item.model}</h4>
                        <span className={`priority ${item.priority}`}>
                          {item.priority === 'high' ? '🔴' : '🟡'} {item.priority}
                        </span>
                      </div>
                      <div className="queue-details">
                        <span>Dataset: {item.dataset}</span>
                        <span>Tahmini: {item.estimatedTime}</span>
                      </div>
                      <div className="queue-actions">
                        <button className="btn-start">▶️ Başlat</button>
                        <button className="btn-remove">❌ Kaldır</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="training-section">
                <h3>💻 Kaynak Kullanımı</h3>
                <div className="resource-monitor">
                  <div className="resource-item">
                    <span className="resource-label">GPU Kullanımı</span>
                    <div className="resource-bar">
                      <div className="resource-fill gpu" style={{ width: '85%' }}></div>
                    </div>
                    <span className="resource-value">85%</span>
                  </div>
                  <div className="resource-item">
                    <span className="resource-label">CPU Kullanımı</span>
                    <div className="resource-bar">
                      <div className="resource-fill cpu" style={{ width: '62%' }}></div>
                    </div>
                    <span className="resource-value">62%</span>
                  </div>
                  <div className="resource-item">
                    <span className="resource-label">Bellek Kullanımı</span>
                    <div className="resource-bar">
                      <div className="resource-fill memory" style={{ width: '78%' }}></div>
                    </div>
                    <span className="resource-value">78%</span>
                  </div>
                  <div className="resource-item">
                    <span className="resource-label">Disk I/O</span>
                    <div className="resource-bar">
                      <div className="resource-fill disk" style={{ width: '45%' }}></div>
                    </div>
                    <span className="resource-value">450 MB/s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="datasets-view">
            <div className="datasets-header">
              <h3>📊 Veri Setleri</h3>
              <button className="btn-upload-dataset">
                📤 Yeni Dataset Yükle
              </button>
            </div>

            <div className="datasets-grid">
              {datasets.map(dataset => (
                <div key={dataset.id} className="dataset-card">
                  <div className="dataset-header">
                    <h4>{dataset.name}</h4>
                    <span className="dataset-type">{dataset.type}</span>
                  </div>
                  <div className="dataset-stats">
                    <div className="stat">
                      <span className="stat-label">Boyut</span>
                      <span className="stat-value">{dataset.size}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Örnek</span>
                      <span className="stat-value">{dataset.samples.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Kalite</span>
                      <span className="stat-value">{dataset.quality}%</span>
                    </div>
                  </div>
                  <div className="dataset-quality">
                    <div className="quality-bar">
                      <div 
                        className="quality-fill"
                        style={{ 
                          width: `${dataset.quality}%`,
                          backgroundColor: dataset.quality > 90 ? '#4caf50' : '#ff9800'
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="dataset-actions">
                    <button className="btn-view">👁️ İncele</button>
                    <button className="btn-process">⚙️ İşle</button>
                    <button className="btn-download">📥 İndir</button>
                  </div>
                  <div className="dataset-footer">
                    <span>Son güncelleme: {dataset.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="data-augmentation">
              <h3>🔧 Veri Artırma Araçları</h3>
              <div className="augmentation-tools">
                <button className="tool-btn">
                  <span className="tool-icon">🔄</span>
                  <span>Veri Çoğaltma</span>
                </button>
                <button className="tool-btn">
                  <span className="tool-icon">🎭</span>
                  <span>Sentetik Veri</span>
                </button>
                <button className="tool-btn">
                  <span className="tool-icon">🧹</span>
                  <span>Veri Temizleme</span>
                </button>
                <button className="tool-btn">
                  <span className="tool-icon">🏷️</span>
                  <span>Otomatik Etiketleme</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experiments' && (
          <div className="experiments-view">
            <h3>🧪 Model Deneyleri</h3>
            
            <div className="experiment-controls">
              <button className="btn-new-experiment">
                ➕ Yeni Deney Başlat
              </button>
              <button className="btn-compare">
                📊 Modelleri Karşılaştır
              </button>
            </div>

            <div className="experiments-table">
              <table>
                <thead>
                  <tr>
                    <th>Deney ID</th>
                    <th>Model</th>
                    <th>Parametreler</th>
                    <th>Doğruluk</th>
                    <th>F1 Score</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#EXP-001</td>
                    <td>YapayZeka-v2.2-beta</td>
                    <td>lr=0.001, batch=32</td>
                    <td>95.2%</td>
                    <td>0.94</td>
                    <td><span className="status completed">Tamamlandı</span></td>
                    <td>20.12.2024</td>
                    <td>
                      <button className="btn-table-action">📊</button>
                      <button className="btn-table-action">📋</button>
                      <button className="btn-table-action">🚀</button>
                    </td>
                  </tr>
                  <tr>
                    <td>#EXP-002</td>
                    <td>YapayZeka-v2.2-alpha</td>
                    <td>lr=0.0001, batch=64</td>
                    <td>93.8%</td>
                    <td>0.92</td>
                    <td><span className="status running">Devam Ediyor</span></td>
                    <td>21.12.2024</td>
                    <td>
                      <button className="btn-table-action">📊</button>
                      <button className="btn-table-action">⏹️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="model-comparison">
              <h4>📊 Model Karşılaştırma</h4>
              <div style={{ height: '300px' }}>
                <Radar 
                  data={comparisonData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-view">
            <h3>📈 Performans Metrikleri</h3>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>📊 Model Doğruluk Trendi</h4>
                <div style={{ height: '250px' }}>
                  <Line 
                    data={{
                      labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                      datasets: [{
                        label: 'Ortalama Doğruluk',
                        data: [88.5, 89.2, 90.1, 91.3, 92.8, 94.5],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.4
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: 85,
                          max: 100
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <h4>🎯 Model Kullanım Dağılımı</h4>
                <div style={{ height: '250px' }}>
                  <Doughnut 
                    data={{
                      labels: ['Matematik', 'Fen', 'Türkçe', 'İngilizce', 'Diğer'],
                      datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.8)',
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 206, 86, 0.8)',
                          'rgba(75, 192, 192, 0.8)',
                          'rgba(153, 102, 255, 0.8)'
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <h4>⚡ İstek/Yanıt Süreleri</h4>
                <div style={{ height: '250px' }}>
                  <Bar 
                    data={{
                      labels: ['GPT', 'BERT', 'CLIP', 'Custom'],
                      datasets: [{
                        label: 'Ortalama Yanıt Süresi (ms)',
                        data: [125, 85, 95, 110],
                        backgroundColor: 'rgba(153, 102, 255, 0.8)'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <h4>🔍 Hata Analizi</h4>
                <div className="error-breakdown">
                  <div className="error-item">
                    <span className="error-type">Anlama Hatası</span>
                    <div className="error-bar">
                      <div className="error-fill" style={{ width: '15%' }}></div>
                    </div>
                    <span className="error-percentage">15%</span>
                  </div>
                  <div className="error-item">
                    <span className="error-type">Bağlam Kaybı</span>
                    <div className="error-bar">
                      <div className="error-fill" style={{ width: '8%' }}></div>
                    </div>
                    <span className="error-percentage">8%</span>
                  </div>
                  <div className="error-item">
                    <span className="error-type">Yanlış Sınıflandırma</span>
                    <div className="error-bar">
                      <div className="error-fill" style={{ width: '5%' }}></div>
                    </div>
                    <span className="error-percentage">5%</span>
                  </div>
                  <div className="error-item">
                    <span className="error-type">Diğer</span>
                    <div className="error-bar">
                      <div className="error-fill" style={{ width: '3%' }}></div>
                    </div>
                    <span className="error-percentage">3%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="performance-insights">
              <h4>💡 Performans İçgörüleri</h4>
              <div className="insights-grid">
                <div className="insight-card positive">
                  <span className="insight-icon">📈</span>
                  <span className="insight-text">Model doğruluğu son 30 günde %2.3 arttı</span>
                </div>
                <div className="insight-card warning">
                  <span className="insight-icon">⚠️</span>
                  <span className="insight-text">İngilizce modelinde performans düşüşü tespit edildi</span>
                </div>
                <div className="insight-card info">
                  <span className="insight-icon">💡</span>
                  <span className="insight-text">Yeni veri seti ile %5 iyileştirme potansiyeli</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Training Modal */}
      {showTrainModal && (
        <div className="modal-overlay" onClick={() => setShowTrainModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚀 Yeni Model Eğitimi</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTrainModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-section">
                  <h4>Model Bilgileri</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Model Adı</label>
                      <input 
                        type="text" 
                        placeholder="Örn: YapayZeka-Matematik-v3.0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Model Tipi</label>
                      <select required>
                        <option value="">Seçiniz</option>
                        <option value="nlp">NLP (Doğal Dil İşleme)</option>
                        <option value="vision">Computer Vision</option>
                        <option value="multimodal">Multimodal</option>
                        <option value="custom">Özel</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Temel Model</label>
                      <select required>
                        <option value="">Seçiniz</option>
                        <option value="gpt">GPT-3.5 Turbo</option>
                        <option value="bert">BERT Turkish</option>
                        <option value="clip">CLIP</option>
                        <option value="custom">Sıfırdan</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Uzmanlık Alanı</label>
                      <select required>
                        <option value="">Seçiniz</option>
                        <option value="math">Matematik</option>
                        <option value="science">Fen Bilimleri</option>
                        <option value="language">Dil</option>
                        <option value="general">Genel</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Eğitim Parametreleri</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Learning Rate</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        defaultValue="0.001"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch Size</label>
                      <select defaultValue="32">
                        <option value="16">16</option>
                        <option value="32">32</option>
                        <option value="64">64</option>
                        <option value="128">128</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Epoch Sayısı</label>
                      <input 
                        type="number" 
                        min="1"
                        max="100"
                        defaultValue="10"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Validation Split</label>
                      <input 
                        type="number" 
                        min="0.1"
                        max="0.5"
                        step="0.05"
                        defaultValue="0.2"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Veri Seti Seçimi</h4>
                  <div className="dataset-selection">
                    {datasets.map(dataset => (
                      <label key={dataset.id} className="dataset-option">
                        <input type="checkbox" name="datasets" value={dataset.id} />
                        <span className="dataset-info">
                          <strong>{dataset.name}</strong>
                          <small>{dataset.size} - {dataset.samples.toLocaleString()} örnek</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h4>Gelişmiş Ayarlar</h4>
                  <div className="advanced-settings">
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>Early Stopping</span>
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>Gradient Clipping</span>
                    </label>
                    <label>
                      <input type="checkbox" />
                      <span>Mixed Precision Training</span>
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>Model Checkpointing</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    🚀 Eğitimi Başlat
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowTrainModal(false)}
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAITraining;
