import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboardFixed = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    console.log('🎯 StudentDashboardFixed mounted');
    const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
    
    if (userType !== 'student') {
      console.log('Not a student, redirecting to login');
      navigate('/login');
      return;
    }
    
    setIsLoaded(true);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        fontSize: '18px'
      }}>
        Yükleniyor...
      </div>
    );
  }
  
  const lessons = [
    { id: 1, name: 'Matematik', icon: '📐', color: '#5c3cfc', progress: 75 },
    { id: 2, name: 'Fen Bilimleri', icon: '🧪', color: '#00BFA6', progress: 60 },
    { id: 3, name: 'Türkçe', icon: '📖', color: '#f39c12', progress: 85 },
    { id: 4, name: 'Sosyal Bilgiler', icon: '🌍', color: '#e67e22', progress: 45 },
    { id: 5, name: 'İngilizce', icon: '🇬🇧', color: '#3498db', progress: 90 },
  ];
  
  const stats = [
    { icon: '📚', label: 'Bugünkü Dersler', value: '3', color: '#5c3cfc' },
    { icon: '✅', label: 'Tamamlanan', value: '1', color: '#27ae60' },
    { icon: '🔥', label: 'Seri', value: '7 gün', color: '#e74c3c' },
    { icon: '⭐', label: 'Puan', value: '1250', color: '#f39c12' },
  ];
  
  const achievements = [
    { icon: '🏆', name: 'İlk Ders Başarısı', earned: true },
    { icon: '🎯', name: 'Quiz Ustası', earned: true },
    { icon: '📚', name: 'Haftalık Hedef', earned: false },
    { icon: '🔥', name: '7 Gün Serisi', earned: true },
  ];
  
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#5c3cfc', fontSize: '1.5rem' }}>
              🎓 Yapay Zeka Öğretmen
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
              Hoş geldin, <strong>{localStorage.getItem('userName') || 'Öğrenci'}</strong>!
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#5c3cfc' }}>
                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🚪 Çıkış
            </button>
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <nav style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        padding: '0 2rem'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '2rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {['overview', 'lessons', 'achievements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '1rem 0',
                fontSize: '0.95rem',
                fontWeight: '500',
                color: activeTab === tab ? '#5c3cfc' : '#666',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '3px solid #5c3cfc' : 'none',
                marginBottom: '-1px'
              }}
            >
              {tab === 'overview' && '📊 Genel Bakış'}
              {tab === 'lessons' && '📚 Derslerim'}
              {tab === 'achievements' && '🏆 Başarımlar'}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {stats.map((stat, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  border: `2px solid ${stat.color}20`
                }}>
                  <div style={{ 
                    fontSize: '2.5rem',
                    width: '70px',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px'
                  }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                      {stat.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>⚡ Hızlı İşlemler</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem' 
              }}>
                {[
                  { icon: '🤖', name: 'AI Asistan', path: '/student/ai-assistant' },
                  { icon: '🎤', name: 'Sesli Asistan', path: '/student/voice-assistant' },
                  { icon: '📅', name: 'Çalışma Planı', path: '/student/study-planner' },
                  { icon: '🎮', name: 'Oyunlar', path: '/student/gamification' },
                  { icon: '❓', name: 'Quiz', path: '/student/quiz' },
                  { icon: '📊', name: 'İstatistikler', path: '/student/stats' },
                ].map((action, index) => (
                  <button 
                    key={index}
                    onClick={() => navigate(action.path)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1.5rem 1rem',
                      backgroundColor: 'white',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = '#5c3cfc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{action.icon}</span>
                    <span>{action.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'lessons' && (
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>📚 Derslerim</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {lessons.map((lesson) => (
                <div key={lesson.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  border: '2px solid transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '2rem',
                      backgroundColor: lesson.color,
                      color: 'white'
                    }}>
                      {lesson.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>
                        {lesson.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                        5. Sınıf
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '600', 
                        color: lesson.color 
                      }}>
                        {lesson.progress}%
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '4px', 
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${lesson.progress}%`, 
                        height: '100%', 
                        backgroundColor: lesson.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: '#666',
                      marginTop: '0.5rem'
                    }}>
                      12/16 ders tamamlandı
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => navigate(`/student/lesson/${lesson.id}`)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: lesson.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Derse Başla
                    </button>
                    <button 
                      onClick={() => navigate(`/student/quiz/${lesson.id}`)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#f8f9fa',
                        color: '#2c3e50',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Quiz Yap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {activeTab === 'achievements' && (
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🏆 Başarımlarım</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1rem' 
            }}>
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: achievement.earned ? '2px solid #27ae60' : '2px solid #e0e0e0',
                    opacity: achievement.earned ? 1 : 0.7
                  }}
                >
                  <div style={{ 
                    fontSize: '3rem',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px'
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                      {achievement.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                      {achievement.earned ? '✅ Kazanıldı' : '🔒 Kilitli'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentDashboardFixed;
