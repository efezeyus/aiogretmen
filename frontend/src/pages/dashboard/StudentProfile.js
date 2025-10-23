import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: localStorage.getItem('userName') || 'Öğrenci',
    email: localStorage.getItem('userEmail') || '',
    grade: localStorage.getItem('userGrade') || '5',
    phone: '',
    avatar: '🎓',
    bio: '',
    learningStyle: 'görsel',
    interests: [],
    goals: []
  });

  const [stats, setStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalQuizzes: 0,
    averageScore: 0,
    totalStudyTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    badges: 0
  });

  useEffect(() => {
    loadProfileData();
    loadStatistics();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await api.get('/student/profile');
      if (response.success && response.data) {
        setProfile(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/student/statistics');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/student/profile', profile);
      if (response.success) {
        alert('✅ Profil başarıyla güncellendi!');
        setEditMode(false);
        // LocalStorage'ı güncelle
        localStorage.setItem('userName', profile.name);
      }
    } catch (error) {
      alert('❌ Profil güncellenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-profile">
      <div className="profile-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard'a Dön
        </button>
        <h1>👤 Profilim</h1>
        <button 
          className={`btn ${editMode ? 'btn-save' : 'btn-edit'}`}
          onClick={() => editMode ? handleSave() : setEditMode(true)}
          disabled={loading}
        >
          {editMode ? '💾 Kaydet' : '✏️ Düzenle'}
        </button>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-icon">{profile.avatar}</div>
            {editMode && (
              <div className="avatar-selector">
                {['🎓', '👦', '👧', '🧑', '🎯', '⭐', '🚀', '🦉'].map(emoji => (
                  <button
                    key={emoji}
                    className={`avatar-option ${profile.avatar === emoji ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, avatar: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="profile-info">
            {editMode ? (
              <>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="profile-input"
                  placeholder="Adınız"
                />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="profile-input"
                  placeholder="Email"
                />
                <select
                  value={profile.grade}
                  onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                  className="profile-select"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <option key={g} value={g}>{g}. Sınıf</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <h2>{profile.name}</h2>
                <p>{profile.email}</p>
                <p className="grade-badge">{profile.grade}. Sınıf</p>
              </>
            )}
          </div>

          <div className="profile-stats-mini">
            <div className="stat-mini">
              <div className="stat-value">Level {stats.level}</div>
              <div className="stat-label">Seviye</div>
            </div>
            <div className="stat-mini">
              <div className="stat-value">{stats.totalXP}</div>
              <div className="stat-label">XP</div>
            </div>
            <div className="stat-mini">
              <div className="stat-value">{stats.badges}</div>
              <div className="stat-label">Rozet</div>
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="preferences-card">
          <h3>🎨 Öğrenme Tercihleri</h3>
          <div className="preference-group">
            <label>Öğrenme Stili</label>
            <select
              value={profile.learningStyle}
              onChange={(e) => setProfile({ ...profile, learningStyle: e.target.value })}
              disabled={!editMode}
              className="preference-select"
            >
              <option value="görsel">🎨 Görsel (Video, Şema)</option>
              <option value="işitsel">🎧 İşitsel (Sesli Anlatım)</option>
              <option value="dokunsal">🔬 Dokunsal (Pratik, Deney)</option>
            </select>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-details">
              <div className="stat-value">{stats.completedLessons}/{stats.totalLessons}</div>
              <div className="stat-label">Tamamlanan Dersler</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-details">
              <div className="stat-value">{stats.totalQuizzes}</div>
              <div className="stat-label">Çözülen Quiz</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <div className="stat-value">%{stats.averageScore}</div>
              <div className="stat-label">Ortalama Başarı</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-details">
              <div className="stat-value">{Math.floor(stats.totalStudyTime / 60)}h</div>
              <div className="stat-label">Toplam Çalışma</div>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">🔥</div>
            <div className="stat-details">
              <div className="stat-value">{stats.currentStreak} gün</div>
              <div className="stat-label">Mevcut Seri</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-details">
              <div className="stat-value">{stats.longestStreak} gün</div>
              <div className="stat-label">En Uzun Seri</div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="activity-timeline">
          <h3>📅 Son Aktiviteler</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon">📚</div>
              <div className="timeline-content">
                <div className="timeline-title">Matematik - Kesirler</div>
                <div className="timeline-time">2 saat önce</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">📝</div>
              <div className="timeline-content">
                <div className="timeline-title">Fen Bilimleri Quiz</div>
                <div className="timeline-time">5 saat önce</div>
                <div className="timeline-score">Başarı: %85</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">🏆</div>
              <div className="timeline-content">
                <div className="timeline-title">Yeni Rozet Kazandın!</div>
                <div className="timeline-time">1 gün önce</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

