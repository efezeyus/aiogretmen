import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './StudentProgress.css';

const StudentProgress = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('matematik');
  const [progressData, setProgressData] = useState(null);

  const subjects = [
    { key: 'matematik', name: 'Matematik', icon: '📐' },
    { key: 'turkce', name: 'Türkçe', icon: '📖' },
    { key: 'fen_bilimleri', name: 'Fen Bilimleri', icon: '🧪' },
    { key: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', icon: '🌍' },
    { key: 'ingilizce', name: 'İngilizce', icon: '🇬🇧' }
  ];

  useEffect(() => {
    loadProgress();
  }, [selectedSubject]);

  const loadProgress = async () => {
    try {
      const grade = parseInt(localStorage.getItem('userGrade') || '5');
      const response = await api.get(`/curriculum/personalized/plan?grade=${grade}&subject=${selectedSubject}`);
      
      // Demo data için
      const demoData = {
        subject: selectedSubject,
        currentLevel: 'orta',
        overall_score: 0.75,
        completedTopics: ['Doğal Sayılar', 'Dört İşlem'],
        currentTopic: 'Kesirler',
        upcomingTopics: [
          { topic_name: 'Ondalık Gösterim', estimated_hours: 4 },
          { topic_name: 'Geometri', estimated_hours: 6 }
        ],
        strengths: ['Toplama', 'Çarpma', 'Basamak Değeri'],
        weaknesses: ['Kesir Toplama', 'Ondalık Bölme'],
        topicScores: {
          'Doğal Sayılar': 0.85,
          'Dört İşlem': 0.70,
          'Kesirler': 0.60
        }
      };

      setProgressData(response || demoData);
    } catch (error) {
      console.error('İlerleme yükleme hatası:', error);
    }
  };

  if (!progressData) {
    return <div className="loading">İlerleme verileri yükleniyor...</div>;
  }

  return (
    <div className="student-progress">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard
        </button>
        <h1>📈 İlerleme Raporım</h1>
      </div>

      {/* Subject Selector */}
      <div className="subject-selector">
        {subjects.map(subject => (
          <button
            key={subject.key}
            className={`subject-btn ${selectedSubject === subject.key ? 'active' : ''}`}
            onClick={() => setSelectedSubject(subject.key)}
          >
            <span className="subject-icon">{subject.icon}</span>
            <span>{subject.name}</span>
          </button>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="progress-overview">
        <div className="overview-card">
          <h3>📊 Genel Durum</h3>
          <div className="progress-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#667eea" 
                strokeWidth="8"
                strokeDasharray={`${progressData.overall_score * 283} 283`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="progress-percentage">
              %{Math.round(progressData.overall_score * 100)}
            </div>
          </div>
          <div className="level-badge">Seviye: {progressData.currentLevel.toUpperCase()}</div>
        </div>

        <div className="current-topic-card">
          <h3>📍 Şu An Çalıştığın Konu</h3>
          <div className="current-topic">
            {progressData.currentTopic || 'Henüz başlamadın'}
          </div>
          <button className="btn-continue" onClick={() => navigate('/student/courses')}>
            ▶️ Devam Et
          </button>
        </div>
      </div>

      {/* Completed Topics */}
      <div className="topics-section">
        <h3>✅ Tamamlanan Konular ({progressData.completedTopics?.length || 0})</h3>
        <div className="topics-grid">
          {progressData.completedTopics?.map((topic, index) => (
            <div key={index} className="topic-card completed">
              <div className="topic-icon">✅</div>
              <div className="topic-name">{topic}</div>
              <div className="topic-score">
                {progressData.topicScores?.[topic] 
                  ? `%${Math.round(progressData.topicScores[topic] * 100)}`
                  : '-%'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Topics */}
      <div className="topics-section">
        <h3>🎯 Gelecek Konular</h3>
        <div className="topics-list">
          {progressData.upcomingTopics?.map((topic, index) => (
            <div key={index} className="topic-item">
              <div className="topic-number">{index + 1}</div>
              <div className="topic-info">
                <div className="topic-name">{topic.topic_name}</div>
                <div className="topic-meta">
                  Tahmini Süre: {topic.estimated_hours} saat
                </div>
              </div>
              <button className="btn-preview">👁️ Önizle</button>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="analysis-grid">
        <div className="analysis-card strengths">
          <h3>💪 Güçlü Yönlerin</h3>
          <div className="strength-list">
            {progressData.strengths?.map((strength, index) => (
              <div key={index} className="strength-item">
                <span className="strength-icon">⭐</span>
                <span>{strength}</span>
              </div>
            ))}
          </div>
          {progressData.strengths?.length === 0 && (
            <p className="empty-message">Henüz yeterli veri yok</p>
          )}
        </div>

        <div className="analysis-card weaknesses">
          <h3>📈 Gelişim Alanların</h3>
          <div className="weakness-list">
            {progressData.weaknesses?.map((weakness, index) => (
              <div key={index} className="weakness-item">
                <span className="weakness-icon">📚</span>
                <span>{weakness}</span>
                <button className="btn-practice-small">Pratik Yap</button>
              </div>
            ))}
          </div>
          {progressData.weaknesses?.length === 0 && (
            <p className="empty-message">Harika! Gelişim gereken alan yok.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;

