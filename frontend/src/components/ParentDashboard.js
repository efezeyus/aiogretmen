import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState(0);
  
  const [children] = useState([
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      grade: '5. Sınıf',
      avatar: '👦',
      todayMinutes: 0,
      weeklyMinutes: 0,
      weeklyGoal: 210,
      lastActive: 'Bugün 14:30',
      overallProgress: 7,
      totalLessons: 27,
      avgQuizScore: 100
    }
  ]);

  const [weeklyData] = useState([
    { day: 'Pzt', minutes: 0 },
    { day: 'Sal', minutes: 0 },
    { day: 'Çar', minutes: 0 },
    { day: 'Per', minutes: 0 },
    { day: 'Cum', minutes: 0 },
    { day: 'Cmt', minutes: 0 },
    { day: 'Paz', minutes: 0 }
  ]);

  const [recentActivities] = useState([
    {
      id: 1,
      type: 'lesson',
      title: 'Doğal Sayıları Okuma ve Yazma',
      course: '5. Sınıf Matematik',
      date: 'Bugün 14:30',
      score: 100,
      duration: 40
    }
  ]);

  const [upcomingTasks] = useState([
    {
      id: 1,
      title: 'Doğal Sayılar Ödevi',
      course: '5. Sınıf Matematik',
      dueDate: 'Yarın',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    // Check if user is logged in
    const userType = localStorage.getItem('userType');
    if (userType !== 'parent') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const currentChild = children[selectedChild];

  return (
    <div className="parent-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>🎓 Yapay Zeka Öğretmen - Veli Paneli</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">Veli Yılmaz</span>
              <span className="user-role">Veli</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="container">
          {/* Child Selector */}
          {children.length > 1 && (
            <div className="child-selector">
              {children.map((child, index) => (
                <button
                  key={child.id}
                  className={`child-tab ${selectedChild === index ? 'active' : ''}`}
                  onClick={() => setSelectedChild(index)}
                >
                  <span className="child-avatar">{child.avatar}</span>
                  <span>{child.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Child Overview */}
          <div className="child-overview">
            <div className="overview-header">
              <div className="child-info">
                <span className="child-avatar-large">{currentChild.avatar}</span>
                <div>
                  <h2>{currentChild.name}</h2>
                  <p>{currentChild.grade} • Son aktif: {currentChild.lastActive}</p>
                </div>
              </div>
              <button className="btn-settings">
                Ayarlar
              </button>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h3>Bugünkü Çalışma</h3>
                  <p className="stat-value">{currentChild.todayMinutes} dk</p>
                  <p className="stat-label">Hedef: 30 dk</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Haftalık Toplam</h3>
                  <p className="stat-value">{currentChild.weeklyMinutes} dk</p>
                  <p className="stat-label">Hedef: {currentChild.weeklyGoal} dk</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>Genel İlerleme</h3>
                  <p className="stat-value">{currentChild.overallProgress}/{currentChild.totalLessons}</p>
                  <p className="stat-label">Tamamlanan ders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <h3>Quiz Ortalaması</h3>
                  <p className="stat-value">%{currentChild.avgQuizScore}</p>
                  <p className="stat-label">Başarı oranı</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="weekly-activity">
            <h3>Haftalık Çalışma Grafiği</h3>
            <div className="activity-chart">
              {weeklyData.map((day, index) => (
                <div key={index} className="chart-bar">
                  <div className="bar-fill" style={{height: `${(day.minutes / 60) * 100}%`}}>
                    {day.minutes > 0 && <span>{day.minutes}dk</span>}
                  </div>
                  <span className="bar-label">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Recent Activities */}
            <div className="recent-activities">
              <h3>Son Aktiviteler</h3>
              <div className="activities-list">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'lesson' ? '📖' : '✅'}
                    </div>
                    <div className="activity-details">
                      <h4>{typeof activity.title === 'string' ? activity.title : JSON.stringify(activity.title)}</h4>
                      <p>{typeof activity.course === 'string' ? activity.course : JSON.stringify(activity.course)}</p>
                      <div className="activity-meta">
                        <span>{activity.date}</span>
                        {activity.score && <span className="score">%{activity.score}</span>}
                        {activity.duration && <span>{activity.duration} dk</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="upcoming-tasks">
              <h3>Yaklaşan Görevler</h3>
              <div className="tasks-list">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-status">
                      <input type="checkbox" disabled={task.status === 'completed'} />
                    </div>
                    <div className="task-details">
                      <h4>{task.title}</h4>
                      <p>{task.course}</p>
                      <span className="due-date">Son tarih: {task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher Feedback */}
          <div className="teacher-feedback">
            <h3>AI Öğretmen Değerlendirmesi</h3>
            <div className="feedback-card">
              <div className="feedback-avatar">🤖</div>
              <div className="feedback-content">
                <p>
                  Ahmet bugün matematik dersinde harika bir performans gösterdi! 
                  Doğal sayıları okuma ve yazma konusunu %100 başarıyla tamamladı. 
                  Görsel öğrenme stiline uygun materyaller çok işe yaradı. 
                  Düzenli çalışma alışkanlığı kazanması için günlük 30 dakika 
                  hedefini hatırlatmanızı öneririm.
                </p>
                <div className="feedback-actions">
                  <button className="btn-detail">Detaylı Rapor</button>
                  <button className="btn-contact">Öğretmenle İletişim</button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="parent-actions">
            <Link to="/parent/reports" className="action-card">
              <span className="action-icon">📊</span>
              <h4>Detaylı Raporlar</h4>
              <p>Aylık ve dönemlik performans raporları</p>
            </Link>
            <Link to="/parent/settings" className="action-card">
              <span className="action-icon">⚙️</span>
              <h4>Çalışma Ayarları</h4>
              <p>Hedefler ve bildirim tercihleri</p>
            </Link>
            <Link to="/parent/subscription" className="action-card">
              <span className="action-icon">💳</span>
              <h4>Abonelik Yönetimi</h4>
              <p>Plan detayları ve faturalar</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard; 