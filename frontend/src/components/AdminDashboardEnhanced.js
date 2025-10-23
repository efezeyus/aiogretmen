import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
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
  ArcElement
} from 'chart.js';
import './AdminDashboardEnhanced.css';

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
  ArcElement
);

const AdminDashboardEnhanced = () => {
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 456,
    cpuUsage: 45,
    memoryUsage: 62,
    requestsPerSecond: 124,
    activeAISessions: 23,
    todayRevenue: 12450,
    newSignups: 34
  });

  const [performanceData] = useState({
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'CPU Kullanımı (%)',
        data: [30, 35, 45, 65, 55, 45, 40],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4
      },
      {
        label: 'Bellek Kullanımı (%)',
        data: [50, 52, 58, 70, 65, 60, 55],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4
      }
    ]
  });

  const [userActivityData] = useState({
    labels: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    datasets: [
      {
        label: 'Aktif Kullanıcılar',
        data: [1200, 1900, 1500, 2000, 2300, 1800, 1600],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  });

  const [userDistribution] = useState({
    labels: ['Öğrenci', 'Öğretmen', 'Veli', 'Admin'],
    datasets: [
      {
        data: [65, 20, 12, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  });

  const [aiUsageData] = useState({
    labels: ['DeepSeek', 'GPT-4', 'Claude', 'Llama', 'Diğer'],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(201, 203, 207, 0.8)'
        ]
      }
    ]
  });

  const [alerts] = useState([
    { id: 1, type: 'critical', message: 'Disk alanı kritik seviyede (%92)', time: '5 dakika önce' },
    { id: 2, type: 'warning', message: 'API rate limit yaklaşıyor', time: '15 dakika önce' },
    { id: 3, type: 'info', message: 'Yeni güncelleme mevcut', time: '1 saat önce' }
  ]);

  const [topContent] = useState([
    { id: 1, title: '5. Sınıf Matematik - Kesirler', views: 3456, rating: 4.8 },
    { id: 2, title: '7. Sınıf Fen - Hücre', views: 2890, rating: 4.9 },
    { id: 3, title: '6. Sınıf İngilizce - Present Continuous', views: 2345, rating: 4.7 }
  ]);

  const [revenueData] = useState({
    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
    datasets: [
      {
        label: 'Gelir (₺)',
        data: [45000, 52000, 48000, 61000, 72000, 85000],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        cpuUsage: Math.min(100, Math.max(0, prev.cpuUsage + Math.floor(Math.random() * 10) - 5)),
        memoryUsage: Math.min(100, Math.max(0, prev.memoryUsage + Math.floor(Math.random() * 6) - 3)),
        requestsPerSecond: Math.max(0, prev.requestsPerSecond + Math.floor(Math.random() * 20) - 10),
        activeAISessions: Math.max(0, prev.activeAISessions + Math.floor(Math.random() * 6) - 3),
        todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 100),
        newSignups: prev.newSignups + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  return (
    <div className="admin-dashboard-enhanced">
      {/* Real-time Stats Row */}
      <div className="realtime-stats-row">
        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">👥</span>
            <span className="stat-label">Aktif Kullanıcı</span>
          </div>
          <div className="stat-value">{realTimeData.activeUsers}</div>
          <div className="stat-trend positive">↑ %12</div>
        </div>
        
        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">💻</span>
            <span className="stat-label">CPU Kullanımı</span>
          </div>
          <div className="stat-value">{realTimeData.cpuUsage}%</div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: `${realTimeData.cpuUsage}%`}}></div>
          </div>
        </div>

        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">🧠</span>
            <span className="stat-label">Bellek Kullanımı</span>
          </div>
          <div className="stat-value">{realTimeData.memoryUsage}%</div>
          <div className="stat-progress">
            <div className="progress-bar warning" style={{width: `${realTimeData.memoryUsage}%`}}></div>
          </div>
        </div>

        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">⚡</span>
            <span className="stat-label">İstek/Saniye</span>
          </div>
          <div className="stat-value">{realTimeData.requestsPerSecond}</div>
          <div className="stat-sparkline">📈</div>
        </div>

        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">🤖</span>
            <span className="stat-label">AI Oturumları</span>
          </div>
          <div className="stat-value">{realTimeData.activeAISessions}</div>
          <div className="stat-badge active">Aktif</div>
        </div>

        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Bugünkü Gelir</span>
          </div>
          <div className="stat-value">₺{realTimeData.todayRevenue.toLocaleString()}</div>
          <div className="stat-trend positive">↑ %25</div>
        </div>

        <div className="realtime-stat-card">
          <div className="stat-header">
            <span className="stat-icon">🆕</span>
            <span className="stat-label">Yeni Kayıt</span>
          </div>
          <div className="stat-value">{realTimeData.newSignups}</div>
          <div className="stat-subtext">Bugün</div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <h3>⚠️ Sistem Uyarıları</h3>
        <div className="alerts-container">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.type}`}>
              <span className="alert-icon">
                {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card large">
          <h3>📊 Sistem Performansı</h3>
          <div className="chart-container" style={{height: '300px'}}>
            <Line data={performanceData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>👥 Kullanıcı Dağılımı</h3>
          <div className="chart-container" style={{height: '250px'}}>
            <Doughnut data={userDistribution} options={pieOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>🤖 AI Model Kullanımı</h3>
          <div className="chart-container" style={{height: '250px'}}>
            <Pie data={aiUsageData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-card large">
          <h3>📈 Haftalık Aktivite</h3>
          <div className="chart-container" style={{height: '300px'}}>
            <Bar data={userActivityData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card large">
          <h3>💰 Aylık Gelir Trendi</h3>
          <div className="chart-container" style={{height: '300px'}}>
            <Line data={revenueData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <h4>🎯 Hedef Tamamlama</h4>
          <div className="circular-progress">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className="circle"
                strokeDasharray="85, 100"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">85%</text>
            </svg>
          </div>
        </div>

        <div className="quick-stat-card">
          <h4>📚 En Popüler İçerikler</h4>
          <div className="top-content-list">
            {topContent.map(content => (
              <div key={content.id} className="content-item">
                <div className="content-info">
                  <span className="content-title">{content.title}</span>
                  <span className="content-stats">
                    👁️ {content.views} • ⭐ {content.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-stat-card">
          <h4>🌍 Kullanıcı Konumları</h4>
          <div className="location-stats">
            <div className="location-item">
              <span className="location-flag">🇹🇷</span>
              <span className="location-name">Türkiye</span>
              <span className="location-count">78%</span>
            </div>
            <div className="location-item">
              <span className="location-flag">🇩🇪</span>
              <span className="location-name">Almanya</span>
              <span className="location-count">12%</span>
            </div>
            <div className="location-item">
              <span className="location-flag">🇳🇱</span>
              <span className="location-name">Hollanda</span>
              <span className="location-count">6%</span>
            </div>
            <div className="location-item">
              <span className="location-flag">🌐</span>
              <span className="location-name">Diğer</span>
              <span className="location-count">4%</span>
            </div>
          </div>
        </div>

        <div className="quick-stat-card">
          <h4>⏰ Aktif Saatler</h4>
          <div className="activity-heatmap">
            <div className="heatmap-row">
              <span className="hour-label">Sabah</span>
              <div className="heat-blocks">
                <div className="heat-block low"></div>
                <div className="heat-block medium"></div>
                <div className="heat-block high"></div>
                <div className="heat-block high"></div>
              </div>
            </div>
            <div className="heatmap-row">
              <span className="hour-label">Öğlen</span>
              <div className="heat-blocks">
                <div className="heat-block high"></div>
                <div className="heat-block high"></div>
                <div className="heat-block medium"></div>
                <div className="heat-block medium"></div>
              </div>
            </div>
            <div className="heatmap-row">
              <span className="hour-label">Akşam</span>
              <div className="heat-blocks">
                <div className="heat-block high"></div>
                <div className="heat-block high"></div>
                <div className="heat-block high"></div>
                <div className="heat-block medium"></div>
              </div>
            </div>
            <div className="heatmap-row">
              <span className="hour-label">Gece</span>
              <div className="heat-blocks">
                <div className="heat-block medium"></div>
                <div className="heat-block low"></div>
                <div className="heat-block low"></div>
                <div className="heat-block low"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="live-feed-section">
        <h3>🔴 Canlı Aktivite Akışı</h3>
        <div className="live-feed-container">
          <div className="feed-item">
            <span className="feed-time">Şimdi</span>
            <span className="feed-icon">👤</span>
            <span className="feed-text">Yeni kullanıcı kaydı: <strong>Zeynep Kaya</strong></span>
          </div>
          <div className="feed-item">
            <span className="feed-time">2dk önce</span>
            <span className="feed-icon">📚</span>
            <span className="feed-text">Ahmet Yılmaz <strong>Matematik Dersi</strong> tamamladı</span>
          </div>
          <div className="feed-item">
            <span className="feed-time">5dk önce</span>
            <span className="feed-icon">🤖</span>
            <span className="feed-text">AI oturumu başlatıldı: <strong>İngilizce Konuşma Pratiği</strong></span>
          </div>
          <div className="feed-item">
            <span className="feed-time">8dk önce</span>
            <span className="feed-icon">✅</span>
            <span className="feed-text">Quiz tamamlandı: <strong>7. Sınıf Fen</strong> - Puan: 85/100</span>
          </div>
          <div className="feed-item">
            <span className="feed-time">10dk önce</span>
            <span className="feed-icon">💳</span>
            <span className="feed-text">Ödeme alındı: <strong>Premium Plan</strong> - ₺299</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardEnhanced;
