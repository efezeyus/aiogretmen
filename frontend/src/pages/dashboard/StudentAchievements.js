import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentAchievements.css';

const StudentAchievements = () => {
  const navigate = useNavigate();

  const achievements = [
    {
      id: 'first_login',
      title: 'İlk Adım',
      description: 'Platforma ilk kez giriş yaptın!',
      icon: '🎯',
      earned: true,
      earnedDate: '2024-09-15',
      xp: 10,
      rarity: 'common'
    },
    {
      id: 'complete_10_lessons',
      title: 'Öğrenme Tutkunu',
      description: '10 ders tamamladın',
      icon: '📚',
      earned: true,
      earnedDate: '2024-09-28',
      xp: 100,
      rarity: 'rare'
    },
    {
      id: 'perfect_quiz',
      title: 'Mükemmellik',
      description: 'Bir quizde %100 başarı elde ettin',
      icon: '⭐',
      earned: true,
      earnedDate: '2024-10-01',
      xp: 50,
      rarity: 'epic'
    },
    {
      id: 'math_master_5',
      title: '5. Sınıf Matematik Ustası',
      description: '5. sınıf matematik müfredatını tamamladın',
      icon: '🏆',
      earned: false,
      progress: 35,
      xp: 500,
      rarity: 'legendary'
    },
    {
      id: 'daily_streak_7',
      title: 'Haftalık Disiplin',
      description: '7 gün üst üste giriş yaptın',
      icon: '🔥',
      earned: true,
      earnedDate: '2024-09-30',
      xp: 75,
      rarity: 'epic'
    },
    {
      id: 'help_friend',
      title: 'Yardımsever',
      description: 'Bir arkadaşına yardım ettin',
      icon: '🤝',
      earned: false,
      progress: 0,
      xp: 30,
      rarity: 'rare'
    }
  ];

  const badges = [
    { icon: '🥉', name: 'Bronz Rozet', count: 5 },
    { icon: '🥈', name: 'Gümüş Rozet', count: 3 },
    { icon: '🥇', name: 'Altın Rozet', count: 1 },
    { icon: '💎', name: 'Elmas Rozet', count: 0 }
  ];

  const stats = {
    totalAchievements: achievements.length,
    earnedAchievements: achievements.filter(a => a.earned).length,
    totalXP: achievements.filter(a => a.earned).reduce((sum, a) => sum + a.xp, 0),
    completionPercentage: Math.round((achievements.filter(a => a.earned).length / achievements.length) * 100)
  };

  const getRarityClass = (rarity) => {
    const classes = {
      'common': 'rarity-common',
      'rare': 'rarity-rare',
      'epic': 'rarity-epic',
      'legendary': 'rarity-legendary'
    };
    return classes[rarity] || 'rarity-common';
  };

  return (
    <div className="student-achievements">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard
        </button>
        <h1>🏆 Başarılarım</h1>
      </div>

      {/* Stats Summary */}
      <div className="achievement-stats">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div>
            <div className="stat-value">{stats.earnedAchievements}/{stats.totalAchievements}</div>
            <div className="stat-label">Kazanılan Başarı</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div>
            <div className="stat-value">{stats.totalXP} XP</div>
            <div className="stat-label">Toplam Puan</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-value">%{stats.completionPercentage}</div>
            <div className="stat-label">Tamamlanma</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="badges-section">
        <h2>🎖️ Rozetlerim</h2>
        <div className="badges-grid">
          {badges.map((badge, index) => (
            <div key={index} className="badge-card">
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{badge.name}</div>
              <div className="badge-count">×{badge.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`achievement-card ${achievement.earned ? 'earned' : 'locked'} ${getRarityClass(achievement.rarity)}`}
          >
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-content">
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
              
              {achievement.earned ? (
                <div className="achievement-earned">
                  <span className="earned-badge">✅ Kazanıldı</span>
                  <span className="earned-date">{new Date(achievement.earnedDate).toLocaleDateString('tr-TR')}</span>
                </div>
              ) : achievement.progress !== undefined ? (
                <div className="achievement-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${achievement.progress}%` }}></div>
                  </div>
                  <div className="progress-text">%{achievement.progress}</div>
                </div>
              ) : (
                <div className="achievement-locked">
                  <span className="locked-icon">🔒</span>
                  <span>Henüz Kazanılmadı</span>
                </div>
              )}
              
              <div className="achievement-xp">
                +{achievement.xp} XP
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentAchievements;

