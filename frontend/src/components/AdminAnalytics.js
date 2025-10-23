import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import './AdminAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Genel İstatistikler
  const [generalStats] = useState({
    totalStudents: 2534,
    activeStudents: 2187,
    totalTeachers: 156,
    totalLessons: 342,
    completedLessons: 28947,
    avgCompletionRate: 87,
    avgQuizScore: 78,
    totalStudyHours: 156789
  });

  // Performans Metrikleri
  const [performanceMetrics] = useState({
    dailyActiveUsers: 1876,
    weeklyActiveUsers: 2234,
    monthlyActiveUsers: 2489,
    avgSessionDuration: 45, // dakika
    bounceRate: 12,
    retentionRate: 89
  });

  // Öğrenci Başarı Dağılımı
  const successDistributionData = {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [{
      label: 'Öğrenci Sayısı',
      data: [45, 123, 456, 789, 1121],
      backgroundColor: [
        '#ff6384',
        '#ff9f40',
        '#ffcd56',
        '#4bc0c0',
        '#36a2eb'
      ]
    }]
  };

  // Aylık Kullanım Trendi
  const monthlyUsageData = {
    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
    datasets: [
      {
        label: 'Aktif Öğrenci',
        data: [1850, 1920, 2050, 2180, 2350, 2534],
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4
      },
      {
        label: 'Tamamlanan Ders',
        data: [3450, 3890, 4230, 4780, 5120, 5670],
        borderColor: '#4bc0c0',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Ders Bazlı Performans
  const subjectPerformanceData = {
    labels: ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce'],
    datasets: [{
      label: 'Ortalama Başarı %',
      data: [82, 78, 85, 76, 88],
      backgroundColor: '#667eea',
      borderColor: '#764ba2',
      borderWidth: 2
    }]
  };

  // Sınıf Bazlı Dağılım
  const gradeDistributionData = {
    labels: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'],
    datasets: [{
      label: 'Öğrenci Sayısı',
      data: [320, 298, 315, 342, 289, 276, 345, 349],
      backgroundColor: 'rgba(102, 126, 234, 0.8)'
    }]
  };

  // Günlük Aktif Kullanıcı Saati
  const hourlyActivityData = {
    labels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
    datasets: [{
      label: 'Aktif Kullanıcı',
      data: [45, 23, 12, 34, 156, 234, 189, 267, 345, 456, 234, 123],
      borderColor: '#f06292',
      backgroundColor: 'rgba(240, 98, 146, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Quiz Performans Trendi
  const quizPerformanceData = {
    labels: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    datasets: [
      {
        label: 'Ortalama Puan',
        data: [75, 78, 82, 79, 85, 88, 84],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Katılım Sayısı',
        data: [234, 256, 278, 267, 312, 189, 145],
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  const multiAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const handleExport = () => {
    alert(`${exportFormat.toUpperCase()} formatında rapor hazırlanıyor...`);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  return (
    <div className="admin-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h2>📊 Analitik Dashboard</h2>
          <p>Sistem geneli performans metrikleri ve raporlar</p>
        </div>
        <div className="header-actions">
          <select 
            className="time-range-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="day">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="quarter">Bu Çeyrek</option>
            <option value="year">Bu Yıl</option>
          </select>
          
          <select
            className="export-format-select"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          
          <button className="btn-export" onClick={handleExport}>
            📤 Rapor İndir
          </button>
        </div>
      </div>

      {/* Genel İstatistikler */}
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(generalStats.totalStudents)}</div>
            <div className="stat-label">Toplam Öğrenci</div>
            <div className="stat-change positive">+12.5%</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(generalStats.activeStudents)}</div>
            <div className="stat-label">Aktif Öğrenci</div>
            <div className="stat-change positive">+8.3%</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(generalStats.completedLessons)}</div>
            <div className="stat-label">Tamamlanan Ders</div>
            <div className="stat-change positive">+23.7%</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">%{generalStats.avgCompletionRate}</div>
            <div className="stat-label">Ortalama Tamamlama</div>
            <div className="stat-change positive">+5.2%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">%{generalStats.avgQuizScore}</div>
            <div className="stat-label">Ortalama Quiz Skoru</div>
            <div className="stat-change negative">-2.1%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(generalStats.totalStudyHours)}</div>
            <div className="stat-label">Toplam Çalışma Saati</div>
            <div className="stat-change positive">+18.9%</div>
          </div>
        </div>
      </div>

      {/* Performans Metrikleri */}
      <div className="performance-metrics">
        <h3>🚀 Performans Metrikleri</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">Günlük Aktif Kullanıcı</div>
            <div className="metric-value">{formatNumber(performanceMetrics.dailyActiveUsers)}</div>
            <div className="metric-chart">
              <div className="mini-bar" style={{height: '80%'}}></div>
              <div className="mini-bar" style={{height: '65%'}}></div>
              <div className="mini-bar" style={{height: '90%'}}></div>
              <div className="mini-bar" style={{height: '75%'}}></div>
              <div className="mini-bar" style={{height: '85%'}}></div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Haftalık Aktif Kullanıcı</div>
            <div className="metric-value">{formatNumber(performanceMetrics.weeklyActiveUsers)}</div>
            <div className="metric-trend positive">↑ 15.3%</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Aylık Aktif Kullanıcı</div>
            <div className="metric-value">{formatNumber(performanceMetrics.monthlyActiveUsers)}</div>
            <div className="metric-trend positive">↑ 8.7%</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Ortalama Oturum Süresi</div>
            <div className="metric-value">{formatDuration(performanceMetrics.avgSessionDuration)}</div>
            <div className="metric-trend positive">↑ 12.5%</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Hemen Çıkma Oranı</div>
            <div className="metric-value">%{performanceMetrics.bounceRate}</div>
            <div className="metric-trend positive">↓ 3.2%</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Kullanıcı Tutma Oranı</div>
            <div className="metric-value">%{performanceMetrics.retentionRate}</div>
            <div className="metric-trend positive">↑ 5.8%</div>
          </div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="charts-grid">
        {/* Aylık Kullanım Trendi */}
        <div className="chart-container large">
          <h3>📈 Aylık Kullanım Trendi</h3>
          <div className="chart-wrapper">
            <Line data={monthlyUsageData} options={chartOptions} />
          </div>
        </div>

        {/* Öğrenci Başarı Dağılımı */}
        <div className="chart-container medium">
          <h3>🎯 Öğrenci Başarı Dağılımı</h3>
          <div className="chart-wrapper">
            <Doughnut data={successDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Ders Bazlı Performans */}
        <div className="chart-container medium">
          <h3>📚 Ders Bazlı Performans</h3>
          <div className="chart-wrapper">
            <Bar data={subjectPerformanceData} options={chartOptions} />
          </div>
        </div>

        {/* Sınıf Bazlı Dağılım */}
        <div className="chart-container large">
          <h3>🎓 Sınıf Bazlı Öğrenci Dağılımı</h3>
          <div className="chart-wrapper">
            <Bar data={gradeDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Günlük Aktif Kullanıcı Saati */}
        <div className="chart-container large">
          <h3>⏰ Günlük Aktivite Dağılımı</h3>
          <div className="chart-wrapper">
            <Line data={hourlyActivityData} options={chartOptions} />
          </div>
        </div>

        {/* Quiz Performans Trendi */}
        <div className="chart-container large">
          <h3>📝 Quiz Performans Trendi</h3>
          <div className="chart-wrapper">
            <Line data={quizPerformanceData} options={multiAxisOptions} />
          </div>
        </div>
      </div>

      {/* Detaylı Raporlar */}
      <div className="detailed-reports">
        <h3>📑 Detaylı Raporlar</h3>
        <div className="reports-grid">
          <div className="report-card">
            <div className="report-icon">📊</div>
            <h4>Öğrenci Performans Raporu</h4>
            <p>Öğrenci bazlı detaylı performans analizi</p>
            <button className="btn-view-report">Görüntüle</button>
          </div>

          <div className="report-card">
            <div className="report-icon">📈</div>
            <h4>Ders İlerleme Raporu</h4>
            <p>Ders tamamlama ve ilerleme istatistikleri</p>
            <button className="btn-view-report">Görüntüle</button>
          </div>

          <div className="report-card">
            <div className="report-icon">🎯</div>
            <h4>Quiz Analiz Raporu</h4>
            <p>Quiz performans ve soru bazlı analiz</p>
            <button className="btn-view-report">Görüntüle</button>
          </div>

          <div className="report-card">
            <div className="report-icon">👥</div>
            <h4>Kullanıcı Davranış Raporu</h4>
            <p>Kullanıcı etkileşim ve davranış analizi</p>
            <button className="btn-view-report">Görüntüle</button>
          </div>
        </div>
      </div>

      {/* En Çok İzlenen Dersler */}
      <div className="popular-lessons">
        <h3>🔥 En Popüler Dersler</h3>
        <div className="lessons-table">
          <table>
            <thead>
              <tr>
                <th>Ders Adı</th>
                <th>Öğretmen</th>
                <th>Öğrenci Sayısı</th>
                <th>Tamamlanma Oranı</th>
                <th>Ortalama Puan</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>5. Sınıf Matematik - Kesirler</td>
                <td>Ayşe Öğretmen</td>
                <td>342</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '87%'}}></div>
                    <span>87%</span>
                  </div>
                </td>
                <td>85</td>
                <td className="trend positive">↑ 12%</td>
              </tr>
              <tr>
                <td>7. Sınıf Fen - Kuvvet ve Enerji</td>
                <td>Mehmet Öğretmen</td>
                <td>298</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '82%'}}></div>
                    <span>82%</span>
                  </div>
                </td>
                <td>78</td>
                <td className="trend positive">↑ 8%</td>
              </tr>
              <tr>
                <td>6. Sınıf Türkçe - Anlatım Bozuklukları</td>
                <td>Fatma Öğretmen</td>
                <td>276</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '75%'}}></div>
                    <span>75%</span>
                  </div>
                </td>
                <td>72</td>
                <td className="trend negative">↓ 3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
