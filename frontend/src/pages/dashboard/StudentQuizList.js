import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './StudentQuizList.css';

const StudentQuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, available, completed

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/quizzes');
      
      // Demo data
      const demoQuizzes = [
        {
          id: '1',
          title: '5. Sınıf Matematik - Doğal Sayılar Quiz',
          subject: 'Matematik',
          grade: 5,
          topic: 'Doğal Sayılar',
          duration: 15,
          questionCount: 10,
          totalPoints: 100,
          difficulty: 'kolay',
          completed: true,
          score: 85,
          attempts: 1,
          lastAttempt: '2024-10-01'
        },
        {
          id: '2',
          title: 'Kesirler ile İşlemler',
          subject: 'Matematik',
          grade: 5,
          topic: 'Kesirler',
          duration: 20,
          questionCount: 12,
          totalPoints: 120,
          difficulty: 'orta',
          completed: false,
          locked: false
        },
        {
          id: '3',
          title: 'Ondalık Sayılar ve Para Problemleri',
          subject: 'Matematik',
          grade: 5,
          topic: 'Ondalık Gösterim',
          duration: 15,
          questionCount: 10,
          totalPoints: 100,
          difficulty: 'orta',
          completed: false,
          locked: true,
          unlockRequirement: 'Kesirler quizini tamamla'
        },
        {
          id: '4',
          title: 'Canlılar ve Çevre',
          subject: 'Fen Bilimleri',
          grade: 5,
          topic: 'İnsan ve Çevre İlişkisi',
          duration: 20,
          questionCount: 15,
          totalPoints: 150,
          difficulty: 'kolay',
          completed: true,
          score: 92,
          attempts: 1,
          lastAttempt: '2024-09-30'
        }
      ];

      setQuizzes(demoQuizzes);
    } catch (error) {
      console.error('Quiz yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    if (filter === 'completed') return quiz.completed;
    if (filter === 'available') return !quiz.completed && !quiz.locked;
    return true;
  });

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      'kolay': { text: 'Kolay', class: 'badge-easy' },
      'orta': { text: 'Orta', class: 'badge-medium' },
      'zor': { text: 'Zor', class: 'badge-hard' }
    };
    const badge = badges[difficulty] || badges.kolay;
    return <span className={`difficulty-badge ${badge.class}`}>{badge.text}</span>;
  };

  const handleStartQuiz = (quiz) => {
    if (quiz.locked) {
      alert('🔒 ' + quiz.unlockRequirement);
      return;
    }
    navigate(`/student/quiz/${quiz.id}`);
  };

  return (
    <div className="student-quiz-list">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard
        </button>
        <h1>📝 Quizler</h1>
      </div>

      {/* Filters */}
      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          📚 Tümü
        </button>
        <button
          className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
          onClick={() => setFilter('available')}
        >
          ✅ Mevcut
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          🏆 Tamamlanan
        </button>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="summary-card">
          <div className="summary-icon">📝</div>
          <div className="summary-content">
            <div className="summary-value">{quizzes.length}</div>
            <div className="summary-label">Toplam Quiz</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <div className="summary-value">{quizzes.filter(q => q.completed).length}</div>
            <div className="summary-label">Tamamlanan</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">⭐</div>
          <div className="summary-content">
            <div className="summary-value">
              {quizzes.filter(q => q.completed).length > 0 
                ? Math.round(quizzes.filter(q => q.completed).reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.filter(q => q.completed).length)
                : 0}%
            </div>
            <div className="summary-label">Ortalama Başarı</div>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      {loading ? (
        <div className="loading">Quizler yükleniyor...</div>
      ) : (
        <div className="quiz-grid">
          {filteredQuizzes.map(quiz => (
            <div key={quiz.id} className={`quiz-card ${quiz.locked ? 'locked' : ''} ${quiz.completed ? 'completed' : ''}`}>
              <div className="quiz-header">
                <div className="quiz-subject">{quiz.subject}</div>
                {getDifficultyBadge(quiz.difficulty)}
              </div>

              <h3 className="quiz-title">{quiz.title}</h3>
              <div className="quiz-topic">{quiz.topic}</div>

              <div className="quiz-meta">
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span>{quiz.duration} dk</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">❓</span>
                  <span>{quiz.questionCount} soru</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">⭐</span>
                  <span>{quiz.totalPoints} puan</span>
                </div>
              </div>

              {quiz.completed && (
                <div className="quiz-result">
                  <div className="result-score">
                    Başarı: <strong>%{quiz.score}</strong>
                  </div>
                  <div className="result-date">
                    Son: {new Date(quiz.lastAttempt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              )}

              {quiz.locked && (
                <div className="quiz-locked">
                  <div className="lock-icon">🔒</div>
                  <div className="lock-text">{quiz.unlockRequirement}</div>
                </div>
              )}

              <button
                className={`quiz-btn ${quiz.locked ? 'disabled' : ''}`}
                onClick={() => handleStartQuiz(quiz)}
                disabled={quiz.locked}
              >
                {quiz.completed ? '🔄 Tekrar Çöz' : quiz.locked ? '🔒 Kilitli' : '▶️ Başlat'}
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredQuizzes.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Quiz Bulunamadı</h3>
          <p>Bu filtrede quiz bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};

export default StudentQuizList;

