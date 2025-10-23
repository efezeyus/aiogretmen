import React, { useState } from 'react';
import './GamificationSystem.css';

const GamificationSystem = () => {
  const [userStats] = useState({
    level: 5,
    experience: 1250,
    experienceToNext: 2000,
    totalPoints: 8500,
    streak: 7,
    badges: [
      { id: 1, name: 'İlk Ders', icon: '🎯', earned: true, description: 'İlk dersini tamamladın!' },
      { id: 2, name: 'Quiz Ustası', icon: '🏆', earned: true, description: '10 quizi %90+ başarıyla tamamladın' },
      { id: 3, name: 'Haftalık Hedef', icon: '📚', earned: false, description: 'Bir hafta boyunca günlük hedefini tutturdun' },
      { id: 4, name: '7 Gün Serisi', icon: '🔥', earned: false, description: '7 gün üst üste çalıştın' },
      { id: 5, name: 'Erken Kuş', icon: '🌅', earned: false, description: 'Sabah 8\'den önce 5 ders tamamladın' },
      { id: 6, name: 'Mükemmeliyetçi', icon: '💯', earned: false, description: 'Bir dersi %100 başarıyla tamamladın' }
    ],
    achievements: [
      { id: 1, name: 'Matematik Dehası', progress: 75, target: 100, icon: '🧮' },
      { id: 2, name: 'Hızlı Öğrenci', progress: 30, target: 50, icon: '⚡' },
      { id: 3, name: 'Sosyal Öğrenci', progress: 5, target: 20, icon: '👥' }
    ]
  });

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Ayşe K.', level: 8, points: 12500, avatar: '👧', isCurrentUser: false },
    { rank: 2, name: 'Mehmet D.', level: 7, points: 11800, avatar: '👦', isCurrentUser: false },
    { rank: 3, name: 'Zeynep S.', level: 7, points: 11200, avatar: '👧', isCurrentUser: false },
    { rank: 15, name: 'Sen', level: 5, points: 8500, avatar: '👦', isCurrentUser: true }
  ]);

  const [recentRewards, setRecentRewards] = useState([
    { id: 1, type: 'points', amount: 100, reason: 'Quiz tamamlama', time: '2 saat önce' },
    { id: 2, type: 'badge', name: 'Quiz Ustası', icon: '🏆', time: '1 gün önce' },
    { id: 3, type: 'level', newLevel: 5, time: '3 gün önce' }
  ]);

  const experiencePercentage = (userStats.experience / userStats.experienceToNext) * 100;

  return (
    <div className="gamification-system">
      {/* Level Progress */}
      <div className="level-progress-card">
        <div className="level-info">
          <div className="level-avatar">
            <span className="level-number">{userStats.level}</span>
          </div>
          <div className="level-details">
            <h3>Seviye {userStats.level}</h3>
            <p>{userStats.experience} / {userStats.experienceToNext} XP</p>
          </div>
        </div>
        <div className="experience-bar">
          <div 
            className="experience-fill" 
            style={{ width: `${experiencePercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h4>Seri</h4>
            <p>{userStats.streak} gün</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h4>Toplam Puan</h4>
            <p>{userStats.totalPoints}</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h4>Rozetler</h4>
            <p>{userStats.badges.filter(b => b.earned).length}/{userStats.badges.length}</p>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="badges-section">
        <h3>Rozetlerim</h3>
        <div className="badges-grid">
          {userStats.badges.map(badge => (
            <div key={badge.id} className={`badge-item ${badge.earned ? 'earned' : 'locked'}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-info">
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
              </div>
              {badge.earned && <div className="badge-check">✓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <h3>Başarılar</h3>
        <div className="achievements-list">
          {userStats.achievements.map(achievement => (
            <div key={achievement.id} className="achievement-item">
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-content">
                <h4>{achievement.name}</h4>
                <div className="achievement-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {achievement.progress}/{achievement.target}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-section">
        <h3>Liderlik Tablosu</h3>
        <div className="leaderboard-list">
          {leaderboard.slice(0, 10).map((user, index) => (
            <div key={index} className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}>
              <div className="rank">{user.rank}</div>
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-info">
                <h4>{user.name}</h4>
                <p>Seviye {user.level}</p>
              </div>
              <div className="user-points">{user.points} puan</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Rewards */}
      <div className="rewards-section">
        <h3>Son Kazanımlar</h3>
        <div className="rewards-list">
          {recentRewards.map(reward => (
            <div key={reward.id} className="reward-item">
              <div className="reward-icon">
                {reward.type === 'points' && '⭐'}
                {reward.type === 'badge' && reward.icon}
                {reward.type === 'level' && '🎉'}
              </div>
              <div className="reward-content">
                <h4>
                  {reward.type === 'points' && `+${reward.amount} puan`}
                  {reward.type === 'badge' && (typeof reward.name === 'string' ? reward.name : JSON.stringify(reward.name))}
                  {reward.type === 'level' && `Seviye ${reward.newLevel}!`}
                </h4>
                <p>
                  {reward.type === 'points' && (typeof reward.reason === 'string' ? reward.reason : JSON.stringify(reward.reason))}
                  {reward.type === 'badge' && 'Yeni rozet kazandın!'}
                  {reward.type === 'level' && 'Seviye atladın!'}
                </p>
              </div>
              <div className="reward-time">{reward.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationSystem; 