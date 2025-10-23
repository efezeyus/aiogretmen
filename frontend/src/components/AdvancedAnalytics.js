import React, { useState } from 'react';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, semester, year
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, comparison

  const [analyticsData] = useState({
    studyTime: {
      total: 2840, // dakika
      daily: [120, 95, 180, 150, 200, 160, 140, 135, 175, 190, 145, 165, 180, 155],
      bySubject: {
        matematik: 850,
        fen_bilimleri: 720,
        turkce: 680,
        ingilizce: 590
      }
    },
    performance: {
      average: 78.5,
      trend: [72, 75, 78, 76, 79, 81, 78, 80, 82, 79, 77, 80, 83, 78],
      bySubject: {
        matematik: 82.3,
        fen_bilimleri: 76.8,
        turkce: 79.1,
        ingilizce: 74.2
      }
    },
    goals: {
      completed: 12,
      total: 18,
      successRate: 66.7,
      byCategory: {
        daily: { completed: 8, total: 10 },
        weekly: { completed: 3, total: 5 },
        monthly: { completed: 1, total: 3 }
      }
    },
    activities: {
      lessons: 45,
      quizzes: 23,
      assignments: 18,
      readings: 32,
      exercises: 67
    },
    strengths: [
      { subject: 'matematik', topic: 'Kesirler', score: 92 },
      { subject: 'turkce', topic: 'Okuma Anlama', score: 88 },
      { subject: 'fen_bilimleri', topic: 'Madde ve Özellikleri', score: 85 }
    ],
    weaknesses: [
      { subject: 'ingilizce', topic: 'Grammar', score: 65 },
      { subject: 'matematik', topic: 'Geometri', score: 72 },
      { subject: 'fen_bilimleri', topic: 'Kimyasal Tepkimeler', score: 68 }
    ],
    studyPatterns: {
      peakHours: [8, 9, 10, 14, 15, 16, 19, 20],
      averageSessionLength: 45,
      consistencyScore: 78.5,
      preferredDays: ['Pazartesi', 'Çarşamba', 'Cuma', 'Cumartesi']
    }
  });

  const subjects = {
    matematik: { name: 'Matematik', color: '#e74c3c', icon: '🔢' },
    fen_bilimleri: { name: 'Fen Bilimleri', color: '#3498db', icon: '🔬' },
    turkce: { name: 'Türkçe', color: '#f39c12', icon: '📚' },
    ingilizce: { name: 'İngilizce', color: '#9b59b6', icon: '🌍' },
    sosyal_bilgiler: { name: 'Sosyal Bilgiler', color: '#1abc9c', icon: '🌍' }
  };

  const timeRanges = {
    week: { name: 'Bu Hafta', days: 7 },
    month: { name: 'Bu Ay', days: 30 },
    semester: { name: 'Bu Dönem', days: 90 },
    year: { name: 'Bu Yıl', days: 365 }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#27ae60';
    if (score >= 80) return '#f39c12';
    if (score >= 70) return '#e67e22';
    return '#e74c3c';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 90) return 'Mükemmel';
    if (score >= 80) return 'İyi';
    if (score >= 70) return 'Orta';
    return 'Geliştirilmeli';
  };

  const generateChartData = (data, type) => {
    if (type === 'line') {
      return data.map((value, index) => ({
        x: index + 1,
        y: value
      }));
    }
    return data;
  };

  const calculateTrend = (data) => {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return ((last - first) / first) * 100;
  };

  const trend = calculateTrend(analyticsData.performance.trend);

  return (
    <div className="advanced-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h2>📊 Gelişmiş Analitik</h2>
          <p>Öğrenme performansınızı detaylı olarak analiz edin</p>
        </div>
        
        <div className="header-controls">
          <div className="control-group">
            <label>Zaman Aralığı:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {Object.entries(timeRanges).map(([key, range]) => (
                <option key={key} value={key}>{range.name}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label>Ders:</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">Tüm Dersler</option>
              {Object.entries(subjects).map(([key, subject]) => (
                <option key={key} value={key}>
                  {subject.icon} {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              Genel Bakış
            </button>
            <button 
              className={`view-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              Detaylı
            </button>
            <button 
              className={`view-btn ${viewMode === 'comparison' ? 'active' : ''}`}
              onClick={() => setViewMode('comparison')}
            >
              Karşılaştırma
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="stat-card study-time">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <h3>Toplam Çalışma Süresi</h3>
            <div className="card-value">{formatTime(analyticsData.studyTime.total)}</div>
            <div className="card-period">{timeRanges[timeRange].name}</div>
          </div>
          <div className="card-trend positive">
            +12.5% geçen döneme göre
          </div>
        </div>

        <div className="stat-card performance">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Ortalama Performans</h3>
            <div className="card-value">{analyticsData.performance.average}%</div>
            <div className="card-label">{getPerformanceLabel(analyticsData.performance.average)}</div>
          </div>
          <div className={`card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% trend
          </div>
        </div>

        <div className="stat-card goals">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Hedef Tamamlama</h3>
            <div className="card-value">{analyticsData.goals.successRate}%</div>
            <div className="card-subtitle">
              {analyticsData.goals.completed}/{analyticsData.goals.total} hedef
            </div>
          </div>
          <div className="card-trend positive">
            +8.3% geçen döneme göre
          </div>
        </div>

        <div className="stat-card consistency">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Tutarlılık Skoru</h3>
            <div className="card-value">{analyticsData.studyPatterns.consistencyScore}%</div>
            <div className="card-subtitle">
              Ortalama {analyticsData.studyPatterns.averageSessionLength}dk seans
            </div>
          </div>
          <div className="card-trend positive">
            +5.2% geçen döneme göre
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="analytics-content">
        {/* Performance Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h3>📈 Performans Trendi</h3>
            <div className="chart-controls">
              <button className="chart-btn active">Günlük</button>
              <button className="chart-btn">Haftalık</button>
              <button className="chart-btn">Aylık</button>
            </div>
          </div>
          
          <div className="chart-container">
            <div className="performance-chart">
              {analyticsData.performance.trend.map((score, index) => (
                <div 
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${score}%`,
                    backgroundColor: getPerformanceColor(score)
                  }}
                  title={`Gün ${index + 1}: ${score}%`}
                >
                  <span className="bar-value">{score}%</span>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {analyticsData.performance.trend.map((_, index) => (
                <span key={index} className="chart-label">G{index + 1}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="subject-performance">
          <h3>📚 Ders Bazında Performans</h3>
          <div className="subject-grid">
            {Object.entries(analyticsData.performance.bySubject).map(([subject, score]) => (
              <div key={subject} className="subject-card">
                <div className="subject-header">
                  <span className="subject-icon">{subjects[subject]?.icon}</span>
                  <span className="subject-name">{subjects[subject]?.name}</span>
                </div>
                
                <div className="subject-score">
                  <div 
                    className="score-circle"
                    style={{ 
                      background: `conic-gradient(${subjects[subject]?.color} ${score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                    }}
                  >
                    <div className="score-value">{score}%</div>
                  </div>
                </div>
                
                <div className="subject-stats">
                  <div className="stat-item">
                    <span className="stat-label">Çalışma Süresi</span>
                    <span className="stat-value">
                      {formatTime(analyticsData.studyTime.bySubject[subject])}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Seviye</span>
                    <span className="stat-value">{getPerformanceLabel(score)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="analysis-section">
          <div className="strengths">
            <h3>💪 Güçlü Yönler</h3>
            <div className="strength-list">
              {analyticsData.strengths.map((strength, index) => (
                <div key={index} className="strength-item">
                  <div className="strength-header">
                    <span className="subject-icon">
                      {subjects[strength.subject]?.icon}
                    </span>
                    <span className="topic-name">{strength.topic}</span>
                    <span className="score-badge" style={{ backgroundColor: getPerformanceColor(strength.score) }}>
                      {strength.score}%
                    </span>
                  </div>
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${strength.score}%`,
                        backgroundColor: subjects[strength.subject]?.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="weaknesses">
            <h3>🔧 Geliştirilmesi Gerekenler</h3>
            <div className="weakness-list">
              {analyticsData.weaknesses.map((weakness, index) => (
                <div key={index} className="weakness-item">
                  <div className="weakness-header">
                    <span className="subject-icon">
                      {subjects[weakness.subject]?.icon}
                    </span>
                    <span className="topic-name">{weakness.topic}</span>
                    <span className="score-badge" style={{ backgroundColor: getPerformanceColor(weakness.score) }}>
                      {weakness.score}%
                    </span>
                  </div>
                  <div className="weakness-bar">
                    <div 
                      className="weakness-fill"
                      style={{ 
                        width: `${weakness.score}%`,
                        backgroundColor: subjects[weakness.subject]?.color
                      }}
                    />
                  </div>
                  <div className="improvement-suggestions">
                    <span className="suggestion-icon">💡</span>
                    <span className="suggestion-text">
                      Bu konuda daha fazla alıştırma yapmanızı öneriyoruz
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Patterns */}
        <div className="patterns-section">
          <h3>📊 Çalışma Alışkanlıkları</h3>
          <div className="patterns-grid">
            <div className="pattern-card">
              <h4>⏰ En Verimli Saatler</h4>
              <div className="peak-hours">
                {analyticsData.studyPatterns.peakHours.map((hour, index) => (
                  <div 
                    key={index}
                    className="hour-indicator"
                    style={{ 
                      backgroundColor: `rgba(52, 152, 219, ${0.3 + (index * 0.1)})`,
                      transform: `scale(${0.8 + (index * 0.05)})`
                    }}
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>

            <div className="pattern-card">
              <h4>📅 Tercih Edilen Günler</h4>
              <div className="preferred-days">
                {analyticsData.studyPatterns.preferredDays.map((day, index) => (
                  <div key={index} className="day-indicator">
                    <span className="day-name">{day}</span>
                    <div className="day-intensity" style={{ height: `${60 + (index * 10)}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="pattern-card">
              <h4>📈 Aktivite Dağılımı</h4>
              <div className="activity-distribution">
                {Object.entries(analyticsData.activities).map(([activity, count]) => (
                  <div key={activity} className="activity-item">
                    <span className="activity-name">
                      {activity === 'lessons' && '📖 Dersler'}
                      {activity === 'quizzes' && '❓ Quizler'}
                      {activity === 'assignments' && '📝 Ödevler'}
                      {activity === 'readings' && '📚 Okumalar'}
                      {activity === 'exercises' && '✏️ Alıştırmalar'}
                    </span>
                    <div className="activity-bar">
                      <div 
                        className="activity-fill"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analyticsData.activities))) * 100}%`,
                          backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
                        }}
                      />
                    </div>
                    <span className="activity-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations-section">
          <h3>💡 Kişiselleştirilmiş Öneriler</h3>
          <div className="recommendations-grid">
            <div className="recommendation-card">
              <div className="recommendation-icon">🎯</div>
              <h4>Hedef Odaklı Çalışma</h4>
              <p>İngilizce Grammar konusunda günde 30 dakika ek çalışma yaparak performansınızı %15 artırabilirsiniz.</p>
              <button className="recommendation-btn">Öneriyi Uygula</button>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-icon">⏰</div>
              <h4>Zaman Yönetimi</h4>
              <p>Sabah 8-10 saatleri arasında çalışma sürenizi artırarak verimliliğinizi %20 yükseltebilirsiniz.</p>
              <button className="recommendation-btn">Öneriyi Uygula</button>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-icon">📚</div>
              <h4>Konu Tekrarı</h4>
              <p>Geometri konusunda haftada 2 kez tekrar yaparak sınav performansınızı iyileştirebilirsiniz.</p>
              <button className="recommendation-btn">Öneriyi Uygula</button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="export-section">
        <h3>📄 Rapor İndirme</h3>
        <div className="export-options">
          <button className="export-btn pdf">
            📄 PDF Raporu İndir
          </button>
          <button className="export-btn excel">
            📊 Excel Verisi İndir
          </button>
          <button className="export-btn share">
            📤 Ebeveynlerle Paylaş
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 