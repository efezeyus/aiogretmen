import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Scatter, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import './AdminReportingCenter.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const AdminReportingCenter = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('performance');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [reports] = useState([
    {
      id: 1,
      name: 'Aylık Performans Raporu',
      type: 'performance',
      lastGenerated: '2024-12-20',
      schedule: 'Aylık',
      format: 'PDF',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Öğrenci İlerleme Analizi',
      type: 'student',
      lastGenerated: '2024-12-21',
      schedule: 'Haftalık',
      format: 'Excel',
      size: '1.8 MB',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Finansal Özet',
      type: 'financial',
      lastGenerated: '2024-12-15',
      schedule: 'Aylık',
      format: 'PDF',
      size: '3.2 MB',
      status: 'generating'
    }
  ]);

  const [dashboardWidgets] = useState([
    { id: 1, type: 'kpi', title: 'Toplam Kullanıcı', value: '15,678', trend: '+12%' },
    { id: 2, type: 'kpi', title: 'Aylık Gelir', value: '₺456,789', trend: '+8%' },
    { id: 3, type: 'kpi', title: 'Ders Tamamlanma', value: '%78', trend: '+5%' },
    { id: 4, type: 'kpi', title: 'Memnuniyet', value: '4.8/5', trend: '+0.2' }
  ]);

  const [reportTemplates] = useState([
    {
      id: 1,
      name: 'Genel Performans',
      icon: '📊',
      description: 'Platform geneli performans metrikleri',
      fields: ['Kullanıcı aktivitesi', 'Sistem performansı', 'AI kullanımı']
    },
    {
      id: 2,
      name: 'Öğrenci Analizi',
      icon: '🎓',
      description: 'Detaylı öğrenci performans ve ilerleme raporu',
      fields: ['İlerleme', 'Başarı oranları', 'Zayıf noktalar']
    },
    {
      id: 3,
      name: 'Finansal Rapor',
      icon: '💰',
      description: 'Gelir, gider ve finansal projeksiyonlar',
      fields: ['Gelir analizi', 'Abonelik metrikleri', 'Tahminler']
    },
    {
      id: 4,
      name: 'İçerik Performansı',
      icon: '📚',
      description: 'Ders ve içerik etkileşim analitiği',
      fields: ['En popüler dersler', 'Tamamlanma oranları', 'Geri bildirimler']
    }
  ]);

  // Sample data for charts
  const [performanceData] = useState({
    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
    datasets: [
      {
        label: 'Aktif Kullanıcı',
        data: [12000, 13500, 13200, 14800, 15200, 15678],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4
      },
      {
        label: 'Tamamlanan Ders',
        data: [8500, 9200, 9800, 10500, 11200, 12000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4
      }
    ]
  });

  const [subjectDistribution] = useState({
    labels: ['Matematik', 'Fen', 'Türkçe', 'İngilizce', 'Sosyal'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ]
      }
    ]
  });

  const [gradePerformance] = useState({
    labels: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'],
    datasets: [
      {
        label: 'Ortalama Başarı %',
        data: [82, 78, 75, 79],
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      }
    ]
  });

  const [studentProgress] = useState({
    labels: ['Çok Başarılı', 'Başarılı', 'Orta', 'Gelişmeli'],
    datasets: [
      {
        label: 'Öğrenci Dağılımı',
        data: [25, 45, 20, 10],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(139, 195, 74, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(244, 67, 54, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  });

  const [engagementData] = useState({
    labels: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    datasets: [
      {
        label: 'Ortalama Çalışma Süresi (dk)',
        data: [45, 52, 48, 55, 50, 35, 30],
        backgroundColor: 'rgba(103, 58, 183, 0.8)'
      }
    ]
  });

  const [skillsRadar] = useState({
    labels: ['Matematik', 'Mantık', 'Okuma', 'Yazma', 'Problem Çözme', 'Yaratıcılık'],
    datasets: [
      {
        label: 'Ortalama',
        data: [85, 78, 82, 75, 88, 72],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
      },
      {
        label: 'Hedef',
        data: [90, 85, 85, 80, 90, 80],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
      }
    ]
  });

  const [scheduledReports] = useState([
    {
      id: 1,
      name: 'Haftalık Özet',
      frequency: 'Her Pazartesi',
      recipients: ['admin@yapayzekaogretmen.com'],
      nextRun: '2024-12-25',
      status: 'active'
    },
    {
      id: 2,
      name: 'Aylık Detaylı Rapor',
      frequency: 'Her ayın 1\'i',
      recipients: ['admin@yapayzekaogretmen.com', 'muhasebe@yapayzekaogretmen.com'],
      nextRun: '2025-01-01',
      status: 'active'
    }
  ]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  const handleGenerateReport = (template) => {
    alert(`${template.name} raporu oluşturuluyor...`);
  };

  const handleExportData = (format) => {
    alert(`Veri ${format} formatında dışa aktarılıyor...`);
  };

  const handleScheduleReport = (data) => {
    alert('Rapor zamanlaması oluşturuldu!');
    setShowScheduleModal(false);
  };

  return (
    <div className="admin-reporting-center">
      {/* Header */}
      <div className="reporting-header">
        <div className="header-left">
          <h2>📊 Raporlama Merkezi</h2>
          <p>Detaylı analizler, özel raporlar ve veri görselleştirme</p>
        </div>
        <div className="header-actions">
          <div className="date-range-picker">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span>-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button className="btn-generate">
            📄 Rapor Oluştur
          </button>
          <button className="btn-export">
            📥 Dışa Aktar
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-row">
        {dashboardWidgets.map(widget => (
          <div key={widget.id} className="widget-card">
            <h4>{widget.title}</h4>
            <div className="widget-value">{widget.value}</div>
            <div className={`widget-trend ${widget.trend.startsWith('+') ? 'positive' : 'negative'}`}>
              {widget.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="reporting-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Raporlar
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Şablonlar
        </button>
        <button
          className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          ⏰ Zamanlanmış
        </button>
        <button
          className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          🛠️ Özel Rapor
        </button>
      </div>

      {/* Content */}
      <div className="reporting-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            <div className="charts-grid">
              <div className="chart-card large">
                <div className="chart-header">
                  <h3>📈 Platform Performansı</h3>
                  <div className="chart-actions">
                    <button className="btn-chart-action">🔄</button>
                    <button className="btn-chart-action">⬇️</button>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <Line data={performanceData} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>📚 Ders Dağılımı</h3>
                </div>
                <div style={{ height: '250px' }}>
                  <Pie data={subjectDistribution} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>🎓 Sınıf Performansı</h3>
                </div>
                <div style={{ height: '250px' }}>
                  <Bar data={gradePerformance} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>📊 Öğrenci Başarı Dağılımı</h3>
                </div>
                <div style={{ height: '250px' }}>
                  <Doughnut data={studentProgress} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>📅 Haftalık Aktivite</h3>
                </div>
                <div style={{ height: '250px' }}>
                  <Bar data={engagementData} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>🎯 Beceri Analizi</h3>
                </div>
                <div style={{ height: '250px' }}>
                  <Radar data={skillsRadar} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="insights-section">
              <h3>💡 Öne Çıkan İçgörüler</h3>
              <div className="insights-grid">
                <div className="insight-card positive">
                  <span className="insight-icon">📈</span>
                  <div className="insight-content">
                    <h4>Kullanıcı Artışı</h4>
                    <p>Son 30 günde %12 kullanıcı artışı kaydedildi</p>
                  </div>
                </div>
                <div className="insight-card warning">
                  <span className="insight-icon">⚠️</span>
                  <div className="insight-content">
                    <h4>Düşük Katılım</h4>
                    <p>Cumartesi ve Pazar günleri aktivite %40 düşük</p>
                  </div>
                </div>
                <div className="insight-card info">
                  <span className="insight-icon">💡</span>
                  <div className="insight-content">
                    <h4>En Popüler Ders</h4>
                    <p>5. Sınıf Matematik en çok tamamlanan ders</p>
                  </div>
                </div>
                <div className="insight-card success">
                  <span className="insight-icon">🎯</span>
                  <div className="insight-content">
                    <h4>Hedef Başarısı</h4>
                    <p>Q4 hedeflerinin %92'si tamamlandı</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-view">
            <div className="reports-header">
              <h3>📄 Oluşturulan Raporlar</h3>
              <div className="reports-filters">
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="all">Tüm Raporlar</option>
                  <option value="performance">Performans</option>
                  <option value="student">Öğrenci</option>
                  <option value="financial">Finansal</option>
                  <option value="content">İçerik</option>
                </select>
                <input 
                  type="text" 
                  placeholder="🔍 Rapor ara..."
                  className="search-input"
                />
              </div>
            </div>

            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className="report-item">
                  <div className="report-icon">
                    {report.format === 'PDF' ? '📄' : '📊'}
                  </div>
                  <div className="report-info">
                    <h4>{report.name}</h4>
                    <div className="report-meta">
                      <span>📅 {report.lastGenerated}</span>
                      <span>🔄 {report.schedule}</span>
                      <span>💾 {report.size}</span>
                    </div>
                  </div>
                  <div className="report-status">
                    {report.status === 'completed' ? (
                      <span className="status-badge completed">✅ Hazır</span>
                    ) : (
                      <span className="status-badge generating">⏳ Oluşturuluyor</span>
                    )}
                  </div>
                  <div className="report-actions">
                    <button className="btn-action view">👁️ Görüntüle</button>
                    <button className="btn-action download">📥 İndir</button>
                    <button className="btn-action share">📤 Paylaş</button>
                    <button className="btn-action delete">🗑️ Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-view">
            <h3>📋 Rapor Şablonları</h3>
            <div className="templates-grid">
              {reportTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-icon">{template.icon}</div>
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-fields">
                    <h5>İçerik:</h5>
                    <ul>
                      {template.fields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    className="btn-use-template"
                    onClick={() => handleGenerateReport(template)}
                  >
                    📊 Bu Şablonu Kullan
                  </button>
                </div>
              ))}
            </div>

            <div className="custom-template-section">
              <h4>🛠️ Özel Şablon Oluştur</h4>
              <button className="btn-create-template">
                ➕ Yeni Şablon Oluştur
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="scheduled-view">
            <div className="scheduled-header">
              <h3>⏰ Zamanlanmış Raporlar</h3>
              <button 
                className="btn-schedule"
                onClick={() => setShowScheduleModal(true)}
              >
                ➕ Yeni Zamanlama
              </button>
            </div>

            <div className="scheduled-list">
              {scheduledReports.map(schedule => (
                <div key={schedule.id} className="schedule-item">
                  <div className="schedule-info">
                    <h4>{schedule.name}</h4>
                    <div className="schedule-details">
                      <span>📅 {schedule.frequency}</span>
                      <span>📧 {schedule.recipients.length} alıcı</span>
                      <span>⏭️ Sonraki: {schedule.nextRun}</span>
                    </div>
                  </div>
                  <div className="schedule-status">
                    <label className="switch">
                      <input type="checkbox" defaultChecked={schedule.status === 'active'} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="schedule-actions">
                    <button className="btn-action edit">✏️ Düzenle</button>
                    <button className="btn-action test">🧪 Test Et</button>
                    <button className="btn-action delete">🗑️ Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="custom-report-view">
            <h3>🛠️ Özel Rapor Oluşturucu</h3>
            
            <div className="report-builder">
              <div className="builder-section">
                <h4>📊 Veri Kaynağı Seçimi</h4>
                <div className="data-sources">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Kullanıcı Verileri</span>
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Ders Performansı</span>
                  </label>
                  <label>
                    <input type="checkbox" />
                    <span>Finansal Veriler</span>
                  </label>
                  <label>
                    <input type="checkbox" />
                    <span>AI Kullanım İstatistikleri</span>
                  </label>
                  <label>
                    <input type="checkbox" />
                    <span>İçerik Analitiği</span>
                  </label>
                </div>
              </div>

              <div className="builder-section">
                <h4>📈 Görselleştirme Türleri</h4>
                <div className="visualization-types">
                  <div className="viz-option">
                    <input type="checkbox" id="line-chart" defaultChecked />
                    <label htmlFor="line-chart">
                      <span className="viz-icon">📈</span>
                      <span>Çizgi Grafik</span>
                    </label>
                  </div>
                  <div className="viz-option">
                    <input type="checkbox" id="bar-chart" defaultChecked />
                    <label htmlFor="bar-chart">
                      <span className="viz-icon">📊</span>
                      <span>Çubuk Grafik</span>
                    </label>
                  </div>
                  <div className="viz-option">
                    <input type="checkbox" id="pie-chart" />
                    <label htmlFor="pie-chart">
                      <span className="viz-icon">🥧</span>
                      <span>Pasta Grafik</span>
                    </label>
                  </div>
                  <div className="viz-option">
                    <input type="checkbox" id="table" />
                    <label htmlFor="table">
                      <span className="viz-icon">📋</span>
                      <span>Tablo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="builder-section">
                <h4>⚙️ Rapor Ayarları</h4>
                <div className="report-settings">
                  <div className="setting-item">
                    <label>Rapor Adı</label>
                    <input type="text" placeholder="Özel Performans Raporu" />
                  </div>
                  <div className="setting-item">
                    <label>Format</label>
                    <select>
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                      <option>JSON</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Dil</label>
                    <select>
                      <option>Türkçe</option>
                      <option>İngilizce</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="builder-actions">
                <button className="btn-preview">👁️ Önizle</button>
                <button className="btn-generate-custom">📊 Rapor Oluştur</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="export-options">
        <h4>📤 Dışa Aktarma Seçenekleri</h4>
        <div className="export-buttons">
          <button onClick={() => handleExportData('PDF')}>
            📄 PDF
          </button>
          <button onClick={() => handleExportData('Excel')}>
            📊 Excel
          </button>
          <button onClick={() => handleExportData('CSV')}>
            📋 CSV
          </button>
          <button onClick={() => handleExportData('JSON')}>
            🔧 JSON
          </button>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⏰ Rapor Zamanla</h3>
              <button 
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleScheduleReport(new FormData(e.target));
              }}>
                <div className="form-group">
                  <label>Rapor Adı</label>
                  <input type="text" required placeholder="Haftalık Özet Raporu" />
                </div>

                <div className="form-group">
                  <label>Rapor Şablonu</label>
                  <select required>
                    <option value="">Seçiniz</option>
                    {reportTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tekrar Sıklığı</label>
                  <select required>
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">3 Aylık</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Gönderim Zamanı</label>
                  <input type="time" defaultValue="09:00" />
                </div>

                <div className="form-group">
                  <label>Alıcılar (virgülle ayırın)</label>
                  <textarea 
                    rows="3"
                    placeholder="admin@yapayzekaogretmen.com, rapor@yapayzekaogretmen.com"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    ✅ Zamanlamayı Oluştur
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowScheduleModal(false)}
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

export default AdminReportingCenter;
