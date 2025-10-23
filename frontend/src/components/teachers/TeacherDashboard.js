import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: 'Ders Oluştur',
      description: 'Yeni ders içeriği oluştur',
      icon: '📚',
      action: () => navigate('/teacher/create-lesson')
    },
    {
      title: 'Öğrencilerim',
      description: 'Öğrenci listesi ve ilerlemeleri',
      icon: '👥',
      action: () => navigate('/teacher/students')
    },
    {
      title: 'Performans Analizi',
      description: 'Sınıf performans raporları',
      icon: '📊',
      action: () => navigate('/teacher/analytics')
    },
    {
      title: 'Mesajlar',
      description: 'Öğrenci ve veli mesajları',
      icon: '💬',
      action: () => navigate('/teacher/messages')
    }
  ];

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>Öğretmen Paneli</h1>
        <p>Hoş geldiniz, Öğretmen!</p>
      </div>

      <div className="dashboard-grid">
        {dashboardCards.map((card, index) => (
          <div key={index} className="dashboard-card" onClick={card.action}>
            <div className="card-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>

      <div className="recent-activities">
        <h2>Son Aktiviteler</h2>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">2 saat önce</span>
            <span className="activity-text">Yeni ders eklendi: Matematik Temelleri</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">5 saat önce</span>
            <span className="activity-text">15 öğrenci quiz'i tamamladı</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">1 gün önce</span>
            <span className="activity-text">Yeni öğrenci kaydı: Ahmet Yılmaz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
