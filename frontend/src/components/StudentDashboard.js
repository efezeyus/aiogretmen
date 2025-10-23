import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  
  // Öğrenci verileri
  const studentData = {
    name: localStorage.getItem('userName') || 'Ahmet Yılmaz',
    grade: '5. Sınıf',
    level: 15,
    xp: 3250,
    xpNeeded: 4000,
    todayMinutes: 45,
    weeklyGoal: 210,
    weeklyProgress: 135,
    streak: 7,
    totalPoints: 12580,
    rank: 3,
    avatar: '👦',
    coins: 450,
    badges: 12
  };

  // Dersler
  const lessons = [
    { 
      id: 1, 
      name: 'Matematik', 
      icon: '📐', 
      color: '#5c3cfc', 
      progress: 75, 
      completed: 12, 
      total: 16,
      nextLesson: 'Kesirler',
      teacher: 'AI Matematik Öğretmeni',
      schedule: 'Pazartesi, Çarşamba, Cuma'
    },
    { 
      id: 2, 
      name: 'Fen Bilimleri', 
      icon: '🧪', 
      color: '#00BFA6', 
      progress: 60, 
      completed: 8, 
      total: 14,
      nextLesson: 'Maddenin Halleri',
      teacher: 'AI Fen Öğretmeni',
      schedule: 'Salı, Perşembe'
    },
    { 
      id: 3, 
      name: 'Türkçe', 
      icon: '📖', 
      color: '#f39c12', 
      progress: 85, 
      completed: 14, 
      total: 16,
      nextLesson: 'Okuma Anlama',
      teacher: 'AI Türkçe Öğretmeni',
      schedule: 'Her gün'
    },
    { 
      id: 4, 
      name: 'Sosyal Bilgiler', 
      icon: '🌍', 
      color: '#e67e22', 
      progress: 45, 
      completed: 6, 
      total: 12,
      nextLesson: 'Coğrafi Bölgeler',
      teacher: 'AI Sosyal Öğretmeni',
      schedule: 'Salı, Perşembe'
    },
    { 
      id: 5, 
      name: 'İngilizce', 
      icon: '🇬🇧', 
      color: '#3498db', 
      progress: 90, 
      completed: 18, 
      total: 20,
      nextLesson: 'Present Continuous',
      teacher: 'AI İngilizce Öğretmeni',
      schedule: 'Pazartesi, Çarşamba, Cuma'
    },
    {
      id: 6,
      name: 'Müzik',
      icon: '🎵',
      color: '#9b59b6',
      progress: 55,
      completed: 5,
      total: 10,
      nextLesson: 'Nota Okuma',
      teacher: 'AI Müzik Öğretmeni',
      schedule: 'Perşembe'
    }
  ];

  // Bugünkü görevler
  const todayTasks = [
    { id: 1, title: 'Matematik: Kesirler Konusu', time: '14:00', duration: '30 dk', completed: false, type: 'lesson', points: 50 },
    { id: 2, title: 'Quiz: Maddenin Halleri', time: '15:00', duration: '15 dk', completed: false, type: 'quiz', points: 30 },
    { id: 3, title: 'Ödev: İngilizce Alıştırmalar', time: '16:00', duration: '20 dk', completed: true, type: 'homework', points: 40 },
    { id: 4, title: 'Proje: Güneş Sistemi', time: '17:00', duration: '45 dk', completed: false, type: 'project', points: 100 }
  ];

  // Başarımlar
  const achievements = [
    { id: 1, name: 'İlk Ders Başarısı', icon: '🏆', earned: true, description: 'İlk dersini tamamladın!', date: '2024-01-15' },
    { id: 2, name: 'Quiz Ustası', icon: '🎯', earned: true, description: '5 quiz tamamla', progress: '5/5', date: '2024-01-20' },
    { id: 3, name: 'Haftalık Hedef', icon: '📚', earned: true, description: 'Haftalık hedefini tamamla', progress: '7/7', date: '2024-01-22' },
    { id: 4, name: '7 Gün Serisi', icon: '🔥', earned: true, description: '7 gün üst üste çalış', progress: '7/7', date: '2024-01-23' },
    { id: 5, name: 'Erken Kuş', icon: '🌅', earned: false, description: 'Sabah 8\'den önce çalış', progress: '3/5' },
    { id: 6, name: 'Mükemmeliyetçi', icon: '💯', earned: false, description: '100% puan al', progress: '8/10' },
    { id: 7, name: 'Sosyal Öğrenci', icon: '👥', earned: true, description: '5 arkadaş edin', progress: '5/5', date: '2024-01-18' },
    { id: 8, name: 'Problem Çözücü', icon: '🧩', earned: false, description: '50 problem çöz', progress: '35/50' }
  ];

  // Liderlik tablosu
  const leaderboard = [
    { rank: 1, name: 'Ayşe K.', points: 15420, avatar: '👧', level: 18, badges: 15 },
    { rank: 2, name: 'Mehmet D.', points: 13850, avatar: '👦', level: 17, badges: 14 },
    { rank: 3, name: 'Sen', points: 12580, avatar: '👦', level: 15, badges: 12, isCurrentUser: true },
    { rank: 4, name: 'Zeynep S.', points: 11200, avatar: '👧', level: 14, badges: 10 },
    { rank: 5, name: 'Ali Y.', points: 10500, avatar: '👦', level: 13, badges: 9 }
  ];

  // Bildirimler
  const notifications = [
    { id: 1, type: 'achievement', message: 'Tebrikler! "7 Gün Serisi" rozetini kazandın! 🔥', time: '10 dakika önce', unread: true },
    { id: 2, type: 'reminder', message: 'Matematik dersin 30 dakika sonra başlıyor', time: '1 saat önce', unread: true },
    { id: 3, type: 'friend', message: 'Ayşe seni arkadaş olarak ekledi', time: '2 saat önce', unread: false },
    { id: 4, type: 'system', message: 'Yeni özellik: Sesli asistan artık kullanılabilir!', time: '1 gün önce', unread: false }
  ];

  // Arkadaşlar
  const friends = [
    { id: 1, name: 'Ayşe K.', avatar: '👧', status: 'online', studying: 'Matematik' },
    { id: 2, name: 'Mehmet D.', avatar: '👦', status: 'online', studying: 'Fen Bilimleri' },
    { id: 3, name: 'Zeynep S.', avatar: '👧', status: 'offline', lastSeen: '2 saat önce' },
    { id: 4, name: 'Ali Y.', avatar: '👦', status: 'online', studying: 'İngilizce' }
  ];

  // Haftalık ilerleme
  const weeklyData = [
    { day: 'Pzt', minutes: 45, target: 30 },
    { day: 'Sal', minutes: 60, target: 30 },
    { day: 'Çar', minutes: 30, target: 30 },
    { day: 'Per', minutes: 0, target: 30 },
    { day: 'Cum', minutes: 0, target: 30 },
    { day: 'Cmt', minutes: 0, target: 30 },
    { day: 'Paz', minutes: 0, target: 30 }
  ];

  useEffect(() => {
    const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
    
    if (userType !== 'student') {
      navigate('/login');
      return;
    }

    // Saat güncelleme
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const handleStartLesson = (lessonId) => {
    navigate(`/student/lesson/${lessonId}`);
  };

  const handleStartQuiz = (lessonId) => {
    navigate(`/student/quiz/${lessonId}`);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#27ae60';
    if (progress >= 60) return '#f39c12';
    if (progress >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const unreadNotifications = notifications.filter(n => n.unread).length;

  return (
    <div className="student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">🎓 Yapay Zeka Öğretmen</h1>
            <div className="welcome-text">
              Hoş geldin, <strong>{studentData.name}</strong>!
            </div>
          </div>
          
          <div className="header-center">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Ders, konu veya öğretmen ara..." />
            </div>
          </div>
          
          <div className="header-right">
            <div className="time-display">
              <span className="time">{formatTime(currentTime)}</span>
              <span className="date">{formatDate(currentTime)}</span>
            </div>
            
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="icon">🔔</span>
              {unreadNotifications > 0 && (
                <span className="badge">{unreadNotifications}</span>
              )}
            </button>
            
            <div className="user-info">
              <div className="user-avatar">{studentData.avatar}</div>
              <div className="user-details">
                <span className="user-name">{studentData.name}</span>
                <span className="user-level">Seviye {studentData.level}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Çıkış
              </button>
            </div>
          </div>
        </div>
        
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <h3>Bildirimler</h3>
              <button onClick={() => setShowNotifications(false)}>✕</button>
            </div>
            <div className="notifications-list">
              {notifications.map(notification => (
                <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Genel Bakış
        </button>
        <button 
          className={`nav-tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          📚 Derslerim
        </button>
        <button 
          className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Görevler
        </button>
        <button 
          className={`nav-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Başarımlar
        </button>
        <button 
          className={`nav-tab ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          👥 Arkadaşlar
        </button>
        <button 
          className={`nav-tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          📈 İlerleme
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <section className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>Günlük Hedef</h3>
                  <p className="stat-number">{studentData.todayMinutes}/30</p>
                  <span className="stat-label">dakika</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(studentData.todayMinutes / 30) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="stat-card success">
                <div className="stat-icon">🔥</div>
                <div className="stat-content">
                  <h3>Çalışma Serisi</h3>
                  <p className="stat-number">{studentData.streak}</p>
                  <span className="stat-label">gün</span>
                </div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <h3>Deneyim Puanı</h3>
                  <p className="stat-number">{studentData.xp}/{studentData.xpNeeded}</p>
                  <span className="stat-label">XP</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(studentData.xp / studentData.xpNeeded) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="stat-card info">
                <div className="stat-icon">🏅</div>
                <div className="stat-content">
                  <h3>Sıralama</h3>
                  <p className="stat-number">#{studentData.rank}</p>
                  <span className="stat-label">sınıfta</span>
                </div>
              </div>
            </section>

            {/* Today's Schedule */}
            <section className="today-schedule">
              <h2>📅 Bugünkü Program</h2>
              <div className="schedule-timeline">
                {todayTasks.map(task => (
                  <div key={task.id} className={`timeline-item ${task.completed ? 'completed' : ''}`}>
                    <div className="timeline-time">{task.time}</div>
                    <div className="timeline-marker">
                      {task.completed ? '✅' : '⏰'}
                    </div>
                    <div className="timeline-content">
                      <h4>{task.title}</h4>
                      <div className="timeline-meta">
                        <span>{task.duration}</span>
                        <span className="points">+{task.points} puan</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="quick-actions">
              <h2>⚡ Hızlı İşlemler</h2>
              <div className="actions-grid">
                <button className="action-btn" onClick={() => setShowAIAssistant(true)}>
                  <span className="action-icon">🤖</span>
                  <span>AI Asistan</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/student/voice-assistant')}>
                  <span className="action-icon">🎤</span>
                  <span>Sesli Asistan</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/student/study-planner')}>
                  <span className="action-icon">📅</span>
                  <span>Çalışma Planı</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/student/gamification')}>
                  <span className="action-icon">🎮</span>
                  <span>Oyunlar</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/student/quiz')}>
                  <span className="action-icon">❓</span>
                  <span>Quiz Çöz</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/student/practice')}>
                  <span className="action-icon">✏️</span>
                  <span>Alıştırmalar</span>
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === 'lessons' && (
          <section className="lessons-section">
            <h2>📚 Tüm Derslerim</h2>
            <div className="lessons-grid">
              {lessons.map(lesson => (
                <div key={lesson.id} className="lesson-card-detailed">
                  <div className="lesson-header">
                    <div className="lesson-icon" style={{ backgroundColor: lesson.color }}>
                      {lesson.icon}
                    </div>
                    <div className="lesson-info">
                      <h3>{lesson.name}</h3>
                      <p className="lesson-teacher">{lesson.teacher}</p>
                      <p className="lesson-schedule">{lesson.schedule}</p>
                    </div>
                  </div>
                  
                  <div className="lesson-progress-section">
                    <div className="progress-header">
                      <span>İlerleme</span>
                      <span style={{ color: getProgressColor(lesson.progress) }}>
                        {lesson.progress}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${lesson.progress}%`,
                          backgroundColor: getProgressColor(lesson.progress)
                        }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      {lesson.completed}/{lesson.total} ders tamamlandı
                    </p>
                  </div>
                  
                  <div className="lesson-next">
                    <p className="next-label">Sonraki Konu:</p>
                    <p className="next-topic">{lesson.nextLesson}</p>
                  </div>
                  
                  <div className="lesson-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => handleStartLesson(lesson.id)}
                    >
                      Derse Başla
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleStartQuiz(lesson.id)}
                    >
                      Quiz Yap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'tasks' && (
          <section className="tasks-section">
            <h2>📋 Görevlerim</h2>
            <div className="tasks-container">
              <div className="tasks-filters">
                <button className="filter-btn active">Tümü</button>
                <button className="filter-btn">Bugün</button>
                <button className="filter-btn">Bu Hafta</button>
                <button className="filter-btn">Tamamlanan</button>
              </div>
              
              <div className="tasks-list">
                {todayTasks.map(task => (
                  <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                    <div className="task-icon">
                      {task.type === 'lesson' && '📚'}
                      {task.type === 'quiz' && '🎯'}
                      {task.type === 'homework' && '📝'}
                      {task.type === 'project' && '🚀'}
                    </div>
                    <div className="task-content">
                      <h4>{task.title}</h4>
                      <div className="task-meta">
                        <span className="task-time">⏰ {task.time}</span>
                        <span className="task-duration">⏱️ {task.duration}</span>
                        <span className="task-points">🏆 +{task.points} puan</span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className={`task-btn ${task.completed ? 'completed' : ''}`}>
                        {task.completed ? '✅ Tamamlandı' : 'Başla'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'achievements' && (
          <section className="achievements-section">
            <h2>🏆 Başarımlarım</h2>
            <div className="achievements-stats">
              <div className="achievement-stat">
                <span className="stat-value">{achievements.filter(a => a.earned).length}</span>
                <span className="stat-label">Kazanılan</span>
              </div>
              <div className="achievement-stat">
                <span className="stat-value">{achievements.filter(a => !a.earned).length}</span>
                <span className="stat-label">Kilitli</span>
              </div>
              <div className="achievement-stat">
                <span className="stat-value">{studentData.badges}</span>
                <span className="stat-label">Toplam Rozet</span>
              </div>
            </div>
            
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div key={achievement.id} className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}>
                  <div className="achievement-icon">
                    {achievement.icon}
                  </div>
                  <div className="achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    {achievement.progress && !achievement.earned && (
                      <div className="achievement-progress">
                        <span>{achievement.progress}</span>
                        <div className="progress-bar mini">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${(parseInt(achievement.progress.split('/')[0]) / parseInt(achievement.progress.split('/')[1])) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {achievement.date && (
                      <span className="achievement-date">
                        {new Date(achievement.date).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'social' && (
          <section className="social-section">
            <div className="social-grid">
              <div className="leaderboard-container">
                <h2>🏆 Liderlik Tablosu</h2>
                <div className="leaderboard-list">
                  {leaderboard.map(user => (
                    <div key={user.rank} className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}>
                      <div className="rank">#{user.rank}</div>
                      <div className="user-info">
                        <span className="avatar">{user.avatar}</span>
                        <div className="user-details">
                          <span className="name">{user.name}</span>
                          <span className="level">Seviye {user.level}</span>
                        </div>
                      </div>
                      <div className="points-info">
                        <span className="points">{user.points.toLocaleString('tr-TR')} puan</span>
                        <span className="badges">{user.badges} rozet</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="friends-container">
                <h2>👥 Arkadaşlarım</h2>
                <div className="friends-list">
                  {friends.map(friend => (
                    <div key={friend.id} className="friend-item">
                      <div className="friend-avatar">{friend.avatar}</div>
                      <div className="friend-info">
                        <span className="friend-name">{friend.name}</span>
                        <span className={`friend-status ${friend.status}`}>
                          {friend.status === 'online' ? (
                            friend.studying ? `🎯 ${friend.studying} çalışıyor` : '🟢 Çevrimiçi'
                          ) : (
                            `⏰ ${friend.lastSeen}`
                          )}
                        </span>
                      </div>
                      <div className="friend-actions">
                        <button className="friend-btn">💬</button>
                        <button className="friend-btn">🎮</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="add-friend-btn">
                  ➕ Arkadaş Ekle
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'progress' && (
          <section className="progress-section">
            <h2>📈 İlerleme Raporum</h2>
            
            <div className="progress-overview">
              <div className="progress-card">
                <h3>Haftalık Çalışma</h3>
                <div className="weekly-chart">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="day-column">
                      <div className="column-bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            height: `${(day.minutes / 60) * 100}%`,
                            backgroundColor: day.minutes >= day.target ? '#27ae60' : '#e74c3c'
                          }}
                        ></div>
                      </div>
                      <span className="day-label">{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="weekly-stats">
                  <span>Toplam: {studentData.weeklyProgress} dakika</span>
                  <span>Hedef: {studentData.weeklyGoal} dakika</span>
                </div>
              </div>
              
              <div className="progress-card">
                <h3>Ders Bazlı İlerleme</h3>
                <div className="subject-progress">
                  {lessons.map(lesson => (
                    <div key={lesson.id} className="subject-item">
                      <div className="subject-header">
                        <span>{lesson.icon} {lesson.name}</span>
                        <span>{lesson.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${lesson.progress}%`,
                            backgroundColor: lesson.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="stats-summary">
              <div className="summary-card">
                <h3>📊 Genel İstatistikler</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-label">Toplam Çalışma Süresi</span>
                    <span className="stat-value">42 saat 15 dakika</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tamamlanan Ders</span>
                    <span className="stat-value">58 ders</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Çözülen Soru</span>
                    <span className="stat-value">342 soru</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Ortalama Başarı</span>
                    <span className="stat-value">%85</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">En İyi Ders</span>
                    <span className="stat-value">İngilizce (%90)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="modal-overlay" onClick={() => setShowAIAssistant(false)}>
          <div className="ai-assistant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🤖 AI Öğretmen Asistan</h3>
              <button onClick={() => setShowAIAssistant(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="ai-chat">
                <div className="ai-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    Merhaba! Ben senin AI öğretmen asistanınım. Derslerinle ilgili her konuda sana yardımcı olabilirim. Ne öğrenmek istersin?
                  </div>
                </div>
              </div>
              <div className="ai-input">
                <input 
                  type="text" 
                  placeholder="Bir soru sor..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                />
                <button className="send-btn">Gönder</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;