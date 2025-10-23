import React, { useState } from 'react';
import './LearningTracker.css';

const LearningTracker = () => {
  const [learningGoals, setLearningGoals] = useState([
    {
      id: 1,
      title: 'Matematik Temelleri',
      description: 'Temel matematik konularını tamamla',
      target: 80,
      current: 65,
      deadline: '2024-02-15',
      category: 'matematik',
      priority: 'high',
      completed: false
    },
    {
      id: 2,
      title: 'Türkçe Dilbilgisi',
      description: 'Dilbilgisi kurallarını öğren',
      target: 90,
      current: 45,
      deadline: '2024-02-20',
      category: 'turkce',
      priority: 'medium',
      completed: false
    },
    {
      id: 3,
      title: 'Fen Bilimleri Deneyleri',
      description: 'Laboratuvar deneylerini tamamla',
      target: 70,
      current: 70,
      deadline: '2024-02-10',
      category: 'fen',
      priority: 'low',
      completed: true
    }
  ]);

  const [learningStats] = useState({
    totalStudyTime: 1240, // dakika
    weeklyGoal: 1200,
    streakDays: 7,
    totalLessons: 45,
    completedLessons: 38,
    averageScore: 85,
    improvementRate: 12
  });

  const [studySessions] = useState([
    { date: '2024-01-30', duration: 45, subject: 'Matematik', score: 88 },
    { date: '2024-01-29', duration: 60, subject: 'Türkçe', score: 92 },
    { date: '2024-01-28', duration: 30, subject: 'Fen', score: 85 },
    { date: '2024-01-27', duration: 75, subject: 'Matematik', score: 78 },
    { date: '2024-01-26', duration: 40, subject: 'Türkçe', score: 90 },
    { date: '2024-01-25', duration: 55, subject: 'Fen', score: 87 },
    { date: '2024-01-24', duration: 35, subject: 'Matematik', score: 82 }
  ]);

  const [recommendations] = useState([
    {
      type: 'weakness',
      subject: 'Matematik',
      topic: 'Kesirler',
      description: 'Kesirler konusunda daha fazla pratik yapmanız önerilir',
      priority: 'high'
    },
    {
      type: 'strength',
      subject: 'Türkçe',
      topic: 'Dilbilgisi',
      description: 'Dilbilgisi konusunda çok başarılısınız!',
      priority: 'low'
    },
    {
      type: 'improvement',
      subject: 'Fen',
      topic: 'Deneyler',
      description: 'Laboratuvar deneylerinde gelişme gösteriyorsunuz',
      priority: 'medium'
    }
  ]);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: 80,
    deadline: '',
    category: 'matematik',
    priority: 'medium'
  });

  const addNewGoal = () => {
    if (newGoal.title && newGoal.description && newGoal.deadline) {
      const goal = {
        id: Date.now(),
        ...newGoal,
        current: 0,
        completed: false
      };
      setLearningGoals([...learningGoals, goal]);
      setNewGoal({
        title: '',
        description: '',
        target: 80,
        deadline: '',
        category: 'matematik',
        priority: 'medium'
      });
    }
  };

  const updateGoalProgress = (goalId, newProgress) => {
    setLearningGoals(goals =>
      goals.map(goal =>
        goal.id === goalId
          ? { ...goal, current: Math.min(newProgress, goal.target) }
          : goal
      )
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'matematik': return '🔢';
      case 'turkce': return '📝';
      case 'fen': return '🔬';
      case 'sosyal': return '🌍';
      case 'ingilizce': return '🇬🇧';
      default: return '📚';
    }
  };

  const calculateProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="learning-tracker">
      {/* Ana İstatistikler */}
      <div className="stats-overview">
        <h2>📊 Öğrenme Takibi</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>{Math.floor(learningStats.totalStudyTime / 60)}s {learningStats.totalStudyTime % 60}dk</h3>
              <p>Toplam Çalışma Süresi</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(learningStats.totalStudyTime / learningStats.weeklyGoal) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>{learningStats.streakDays} gün</h3>
              <p>Çalışma Serisi</p>
              <div className="streak-indicator">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`streak-day ${i < learningStats.streakDays ? 'active' : ''}`}>
                    {i < learningStats.streakDays ? '🔥' : '⚪'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{learningStats.completedLessons}/{learningStats.totalLessons}</h3>
              <p>Tamamlanan Dersler</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(learningStats.completedLessons / learningStats.totalLessons) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{learningStats.averageScore}%</h3>
              <p>Ortalama Başarı</p>
              <div className="improvement">
                <span className={`improvement-arrow ${learningStats.improvementRate > 0 ? 'positive' : 'negative'}`}>
                  {learningStats.improvementRate > 0 ? '↗️' : '↘️'}
                </span>
                <span>{Math.abs(learningStats.improvementRate)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hedefler Bölümü */}
      <div className="goals-section">
        <div className="section-header">
          <h3>🎯 Öğrenme Hedefleri</h3>
          <button className="add-goal-btn" onClick={() => document.getElementById('goalModal').style.display = 'flex'}>
            + Yeni Hedef
          </button>
        </div>

        <div className="goals-grid">
          {learningGoals.map(goal => (
            <div key={goal.id} className="goal-card">
              <div className="goal-header">
                <div className="goal-icon">{getCategoryIcon(goal.category)}</div>
                <div className="goal-info">
                  <h4>{goal.title}</h4>
                  <p>{goal.description}</p>
                </div>
                <div 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(goal.priority) }}
                >
                  {goal.priority === 'high' ? 'Yüksek' : goal.priority === 'medium' ? 'Orta' : 'Düşük'}
                </div>
              </div>

              <div className="goal-progress">
                <div className="progress-info">
                  <span>{goal.current}%</span>
                  <span>Hedef: {goal.target}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateProgressPercentage(goal.current, goal.target)}%` }}
                  ></div>
                </div>
                <div className="deadline-info">
                  <span>Kalan: {getDaysUntilDeadline(goal.deadline)} gün</span>
                </div>
              </div>

              <div className="goal-actions">
                <input
                  type="range"
                  min="0"
                  max={goal.target}
                  value={goal.current}
                  onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                  className="progress-slider"
                />
                <button 
                  className={`complete-btn ${goal.completed ? 'completed' : ''}`}
                  onClick={() => updateGoalProgress(goal.id, goal.target)}
                >
                  {goal.completed ? '✅ Tamamlandı' : 'Tamamla'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Çalışma Geçmişi */}
      <div className="study-history">
        <h3>📅 Çalışma Geçmişi</h3>
        <div className="history-chart">
          {studySessions.map((session, index) => (
            <div key={index} className="session-bar">
              <div 
                className="session-fill"
                style={{ 
                  height: `${(session.duration / 75) * 100}%`,
                  backgroundColor: session.score > 85 ? '#27ae60' : session.score > 70 ? '#f39c12' : '#e74c3c'
                }}
              ></div>
              <div className="session-tooltip">
                <strong>{session.subject}</strong><br/>
                {session.duration} dakika<br/>
                Başarı: {session.score}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Öneriler */}
      <div className="recommendations-section">
        <h3>💡 Kişiselleştirilmiş Öneriler</h3>
        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card ${rec.type}`}>
              <div className="rec-icon">
                {rec.type === 'weakness' ? '⚠️' : rec.type === 'strength' ? '🎉' : '📈'}
              </div>
              <div className="rec-content">
                <h4>{rec.subject} - {rec.topic}</h4>
                <p>{typeof rec.description === 'string' ? rec.description : JSON.stringify(rec.description)}</p>
                <div className="rec-priority">
                  Öncelik: <span style={{ color: getPriorityColor(rec.priority) }}>
                    {rec.priority === 'high' ? 'Yüksek' : rec.priority === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yeni Hedef Modal */}
      <div id="goalModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>🎯 Yeni Öğrenme Hedefi</h3>
            <button className="close-btn" onClick={() => document.getElementById('goalModal').style.display = 'none'}>
              ✕
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label>Hedef Başlığı</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="Örn: Matematik Temelleri"
              />
            </div>
            
            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Hedefiniz hakkında detaylı açıklama"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Hedef Yüzde</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="form-group">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ders</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                >
                  <option value="matematik">Matematik</option>
                  <option value="turkce">Türkçe</option>
                  <option value="fen">Fen Bilimleri</option>
                  <option value="sosyal">Sosyal Bilgiler</option>
                  <option value="ingilizce">İngilizce</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Öncelik</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="cancel-btn" onClick={() => document.getElementById('goalModal').style.display = 'none'}>
              İptal
            </button>
            <button className="save-btn" onClick={addNewGoal}>
              Hedef Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningTracker; 