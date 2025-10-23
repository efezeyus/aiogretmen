import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedSubject, setSelectedSubject] = useState('all');
  
  const [learningData] = useState({
    totalStudyTime: 2840, // dakika
    averageSessionTime: 35,
    totalLessons: 47,
    completedQuizzes: 23,
    averageScore: 87,
    weeklyProgress: [
      { day: 'Pzt', time: 45, lessons: 2, score: 92 },
      { day: 'Sal', time: 60, lessons: 3, score: 88 },
      { day: 'Çar', time: 30, lessons: 1, score: 95 },
      { day: 'Per', time: 75, lessons: 4, score: 85 },
      { day: 'Cum', time: 50, lessons: 2, score: 90 },
      { day: 'Cmt', time: 90, lessons: 5, score: 87 },
      { day: 'Paz', time: 40, lessons: 2, score: 93 }
    ],
    subjectPerformance: [
      { subject: 'Matematik', progress: 85, time: 1200, score: 92 },
      { subject: 'Türkçe', progress: 72, time: 800, score: 88 },
      { subject: 'Fen Bilimleri', progress: 68, time: 600, score: 85 },
      { subject: 'Sosyal Bilgiler', progress: 45, time: 400, score: 78 }
    ],
    learningStrengths: [
      { area: 'Problem Çözme', strength: 95, icon: '🧮' },
      { area: 'Analitik Düşünme', strength: 88, icon: '🔍' },
      { area: 'Hafıza', strength: 82, icon: '🧠' },
      { area: 'Hızlı Öğrenme', strength: 78, icon: '⚡' }
    ],
    areasForImprovement: [
      { area: 'Dikkat Süresi', current: 65, target: 85, icon: '⏰' },
      { area: 'Kritik Düşünme', current: 72, target: 90, icon: '💭' },
      { area: 'Yaratıcılık', current: 68, target: 80, icon: '🎨' }
    ]
  });

  const [recentActivities] = useState([
    { id: 1, type: 'lesson', title: 'Doğal Sayılar', subject: 'Matematik', time: '2 saat önce', score: 95 },
    { id: 2, type: 'quiz', title: 'Kesirler Testi', subject: 'Matematik', time: '1 gün önce', score: 88 },
    { id: 3, type: 'lesson', title: 'Cümle Yapısı', subject: 'Türkçe', time: '2 gün önce', score: 92 },
    { id: 4, type: 'quiz', title: 'Maddenin Halleri', subject: 'Fen Bilimleri', time: '3 gün önce', score: 85 }
  ]);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const getWeeklyTotal = () => {
    return learningData.weeklyProgress.reduce((sum, day) => sum + day.time, 0);
  };

  const getAverageWeeklyScore = () => {
    const scores = learningData.weeklyProgress.map(day => day.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Öğrenme Analizi</h1>
          <p>Performansınızı detaylı olarak inceleyin ve gelişim alanlarınızı keşfedin</p>
        </div>
        
        <div className="header-controls">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="quarter">Bu Çeyrek</option>
            <option value="year">Bu Yıl</option>
          </select>
          
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-selector"
          >
            <option value="all">Tüm Dersler</option>
            <option value="math">Matematik</option>
            <option value="turkish">Türkçe</option>
            <option value="science">Fen Bilimleri</option>
            <option value="social">Sosyal Bilgiler</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="overview-stats">
        <div className="stat-card primary">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Toplam Çalışma</h3>
            <p className="stat-value">{formatTime(learningData.totalStudyTime)}</p>
            <span className="stat-change">+15% geçen haftaya göre</span>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Tamamlanan Ders</h3>
            <p className="stat-value">{learningData.totalLessons}</p>
            <span className="stat-change">+3 bu hafta</span>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Ortalama Başarı</h3>
            <p className="stat-value">%{learningData.averageScore}</p>
            <span className="stat-change">+5% artış</span>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Ortalama Seans</h3>
            <p className="stat-value">{learningData.averageSessionTime}dk</p>
            <span className="stat-change">+8dk artış</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Weekly Activity Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Haftalık Aktivite Grafiği</h3>
            <div className="chart-summary">
              <span>Toplam: {formatTime(getWeeklyTotal())}</span>
              <span>Ortalama: %{getAverageWeeklyScore()}</span>
            </div>
          </div>
          <div className="chart-content">
            <div className="weekly-chart">
              {learningData.weeklyProgress.map((day, index) => (
                <div key={index} className="chart-day">
                  <div className="day-bars">
                    <div 
                      className="time-bar" 
                      style={{ height: `${(day.time / 120) * 100}%` }}
                      title={`${day.time} dakika`}
                    />
                    <div 
                      className="score-bar" 
                      style={{ height: `${day.score}%` }}
                      title={`%${day.score} başarı`}
                    />
                  </div>
                  <span className="day-label">{day.day}</span>
                  <div className="day-stats">
                    <small>{day.lessons} ders</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ders Performansı</h3>
          </div>
          <div className="chart-content">
            <div className="subject-performance">
              {learningData.subjectPerformance.map((subject, index) => (
                <div key={index} className="subject-item">
                  <div className="subject-info">
                    <h4>{subject.subject}</h4>
                    <div className="subject-stats">
                      <span>İlerleme: %{subject.progress}</span>
                      <span>Süre: {formatTime(subject.time)}</span>
                      <span>Başarı: %{subject.score}</span>
                    </div>
                  </div>
                  <div className="subject-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Analysis */}
      <div className="analysis-section">
        <div className="analysis-grid">
          {/* Strengths */}
          <div className="analysis-card strengths">
            <h3>💪 Güçlü Yönleriniz</h3>
            <div className="strengths-list">
              {learningData.learningStrengths.map((strength, index) => (
                <div key={index} className="strength-item">
                  <div className="strength-icon">{strength.icon}</div>
                  <div className="strength-content">
                    <h4>{strength.area}</h4>
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ width: `${strength.strength}%` }}
                      />
                      <span className="strength-value">%{strength.strength}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="analysis-card improvements">
            <h3>🎯 Gelişim Alanları</h3>
            <div className="improvements-list">
              {learningData.areasForImprovement.map((area, index) => (
                <div key={index} className="improvement-item">
                  <div className="improvement-icon">{area.icon}</div>
                  <div className="improvement-content">
                    <h4>{area.area}</h4>
                    <div className="improvement-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill current" 
                          style={{ width: `${area.current}%` }}
                        />
                        <div 
                          className="progress-fill target" 
                          style={{ width: `${area.target - area.current}%` }}
                        />
                      </div>
                      <div className="progress-labels">
                        <span>Mevcut: %{area.current}</span>
                        <span>Hedef: %{area.target}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-section">
        <h3>📝 Son Aktiviteler</h3>
        <div className="activities-list">
          {recentActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'lesson' ? '📖' : '✅'}
              </div>
              <div className="activity-content">
                <h4>{typeof activity.title === 'string' ? activity.title : JSON.stringify(activity.title)}</h4>
                <p>{typeof activity.subject === 'string' ? activity.subject : JSON.stringify(activity.subject)} • {activity.time}</p>
              </div>
              <div className="activity-score">
                %{activity.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="recommendations-section">
        <h3>🤖 AI Önerileri</h3>
        <div className="recommendations-grid">
          <div className="recommendation-card">
            <div className="recommendation-icon">🎯</div>
            <h4>Odaklanma Sürenizi Artırın</h4>
            <p>Dikkat süreniz %65'te. Hedef: %85. Günlük 45 dakikalık seanslar önerilir.</p>
          </div>
          
          <div className="recommendation-card">
            <div className="recommendation-icon">📈</div>
            <h4>Matematik Performansınız Mükemmel</h4>
            <p>%92 başarı oranınızla matematikte çok iyi gidiyorsunuz. Bu momentumu koruyun!</p>
          </div>
          
          <div className="recommendation-card">
            <div className="recommendation-icon">🔄</div>
            <h4>Tekrar Zamanı</h4>
            <p>Fen Bilimleri konularını tekrar etmeniz önerilir. Son 3 günde öğrendiklerinizi pekiştirin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 