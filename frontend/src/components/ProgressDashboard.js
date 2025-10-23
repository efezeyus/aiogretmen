import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import curriculumService from '../services/curriculumService';
import gradeAccessControl from '../services/gradeAccessControl';
import './ProgressDashboard.css';

/**
 * İlerleme Dashboard Bileşeni
 * 
 * - Genel ilerleme görünümü
 * - Ünite bazlı durum
 * - Kilitli/açık dersler
 * - Başarı metrikleri
 */
const ProgressDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [curriculum, setCurriculum] = useState(null);
  const [progress, setProgress] = useState(null);

  const studentId = localStorage.getItem('userId') || 'student_demo';
  const grade = parseInt(localStorage.getItem('userGrade')) || 5;
  const subject = 'matematik';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 🔐 GÜVENLİK: Erişim kontrolü başlat
      gradeAccessControl.initialize();
      
      // Sadece kendi sınıfının müfredatını yükle
      const curriculumData = await curriculumService.loadCurriculum(grade, subject);
      
      // 🔐 Müfredat null ise erişim reddedilmiş demektir
      if (!curriculumData) {
        alert('🔒 Bu sınıfın müfredatına erişim yetkiniz yok!');
        navigate('/student/dashboard');
        return;
      }
      
      setCurriculum(curriculumData);

      // İlerleme verilerini yükle
      const progressData = await curriculumService.loadStudentProgress(studentId, grade, subject);
      setProgress(progressData);

      console.log(`✅ Dashboard yüklendi (${grade}. sınıf - GÜVENLİ)`);
    } catch (error) {
      console.error('Dashboard yükleme hatası:', error);
      
      // Erişim hatası ise yönlendir
      if (error.message && error.message.includes('Erişim')) {
        alert('🔒 Erişim reddedildi! Sadece kendi sınıfınızın derslerini görebilirsiniz.');
        navigate('/student/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    // 🔐 GÜVENLİK: Sınıf kontrolü
    if (!gradeAccessControl.canAccessLesson(lesson)) {
      const denial = gradeAccessControl.getAccessDeniedMessage(lesson.grade);
      alert(`${denial.title}\n\n${denial.message}\n\n${denial.suggestion}`);
      return;
    }
    
    // Kilit kontrolü
    const isUnlocked = curriculumService.isLessonUnlocked(lesson.id);
    
    if (!isUnlocked) {
      alert('🔒 Bu ders kilitli! Önceki dersleri tamamlayın.');
      return;
    }

    // Derse git
    navigate(`/student/lesson/${lesson.id}`);
  };

  const getLessonStatus = (lessonId) => {
    if (!progress) return 'locked';
    
    if (progress.completedLessons.includes(lessonId)) {
      return 'completed';
    }
    
    if (curriculumService.isLessonUnlocked(lessonId)) {
      return 'unlocked';
    }
    
    return 'locked';
  };

  const getUnitProgress = (unit) => {
    if (!progress) return 0;
    
    const totalLessons = unit.lessons.length;
    const completedLessons = unit.lessons.filter(l => 
      progress.completedLessons.includes(l.id)
    ).length;
    
    return Math.round((completedLessons / totalLessons) * 100);
  };

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  // Admin onayı bekliyor mu?
  if (progress && !progress.approvedGrade) {
    return (
      <div className="progress-dashboard">
        <div className="approval-pending-card">
          <div className="pending-icon">⏳</div>
          <h2>Seviye Onayı Bekleniyor</h2>
          <p>
            Seviye belirleme testini tamamladınız. 
            Öğretmeninizin onayını bekleyiniz.
          </p>
          <div className="pending-details">
            <div className="detail-item">
              <span className="label">Önerilen Seviye:</span>
              <span className="value">{progress.suggestedGrade}. Sınıf</span>
            </div>
            <div className="detail-item">
              <span className="label">Durum:</span>
              <span className="value status-pending">Onay Bekliyor</span>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/student/dashboard')}
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📚 {grade}. Sınıf {curriculum?.subject || 'Matematik'}</h1>
        <p className="academic-year">{curriculum?.academicYear || '2024-2025'} Eğitim Yılı</p>
      </div>

      {/* Overall Progress */}
      <div className="overall-progress-card">
        <h3>🎯 Genel İlerleme</h3>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress?.overallProgress || 0}%` }}
            >
              <span className="progress-text">%{progress?.overallProgress || 0}</span>
            </div>
          </div>
        </div>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-value">{progress?.completedLessons.length || 0}</span>
            <span className="stat-label">Tamamlanan Ders</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{curriculum?.totalLessons || 48}</span>
            <span className="stat-label">Toplam Ders</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{progress?.completedUnits.length || 0}/{curriculum?.totalUnits || 6}</span>
            <span className="stat-label">Ünite</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📝</div>
          <div className="metric-content">
            <span className="metric-value">%{progress?.averageQuizScore || 0}</span>
            <span className="metric-label">Quiz Ortalaması</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🎓</div>
          <div className="metric-content">
            <span className="metric-value">%{progress?.averageFinalScore || 0}</span>
            <span className="metric-label">Final Ortalaması</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏱</div>
          <div className="metric-content">
            <span className="metric-value">{Math.round((progress?.totalTimeSpent || 0) / 60)}</span>
            <span className="metric-label">Saat Çalışma</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <span className="metric-value">{progress?.achievements?.length || 0}</span>
            <span className="metric-label">Başarı</span>
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="units-section">
        <h2>📖 Üniteler</h2>
        {curriculum?.units?.map((unit, index) => {
          const unitProgress = getUnitProgress(unit);
          const isUnitUnlocked = curriculumService.isUnitUnlocked(unit.id);
          
          return (
            <div 
              key={unit.id} 
              className={`unit-card ${!isUnitUnlocked ? 'locked' : ''}`}
            >
              <div className="unit-header">
                <div className="unit-title-section">
                  <h3>
                    {!isUnitUnlocked && '🔒 '}
                    Ünite {unit.unitNumber}: {unit.title}
                  </h3>
                  <p className="unit-description">{unit.description}</p>
                  <span className="unit-meta">
                    {unit.lessons.length} Ders • ~{unit.estimatedHours} Saat
                  </span>
                </div>
                <div className="unit-progress-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${unitProgress}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">
                      {unitProgress}%
                    </text>
                  </svg>
                </div>
              </div>

              {isUnitUnlocked && (
                <div className="lessons-list">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const status = getLessonStatus(lesson.id);
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-item ${status}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className="lesson-number">
                          {status === 'completed' && '✅'}
                          {status === 'unlocked' && '📖'}
                          {status === 'locked' && '🔒'}
                          <span>{lesson.lessonNumber}</span>
                        </div>
                        <div className="lesson-info">
                          <h4>{lesson.title}</h4>
                          <div className="lesson-meta">
                            <span className="meta-item">
                              {lesson.difficulty === 'kolay' && '⭐ Kolay'}
                              {lesson.difficulty === 'orta' && '⭐⭐ Orta'}
                              {lesson.difficulty === 'ileri' && '⭐⭐⭐ İleri'}
                            </span>
                            <span className="meta-item">⏱ {lesson.duration} dk</span>
                          </div>
                        </div>
                        <div className="lesson-status">
                          {status === 'completed' && (
                            <span className="status-badge completed">Tamamlandı</span>
                          )}
                          {status === 'unlocked' && (
                            <span className="status-badge unlocked">Başla</span>
                          )}
                          {status === 'locked' && (
                            <span className="status-badge locked">Kilitli</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Unit Final */}
                  {unit.assessment && (
                    <div
                      className={`lesson-item final ${
                        curriculumService.isLessonUnlocked(unit.assessment.id) 
                          ? 'unlocked' 
                          : 'locked'
                      }`}
                    >
                      <div className="lesson-number">
                        📝
                      </div>
                      <div className="lesson-info">
                        <h4>{unit.assessment.title}</h4>
                        <div className="lesson-meta">
                          <span className="meta-item">
                            {unit.assessment.questionCount} Soru
                          </span>
                          <span className="meta-item">
                            ⏱ {unit.assessment.duration} dk
                          </span>
                          <span className="meta-item passing">
                            Geçme: %{unit.assessment.passingScore}
                          </span>
                        </div>
                      </div>
                      <div className="lesson-status">
                        {curriculumService.isLessonUnlocked(unit.assessment.id) ? (
                          <span className="status-badge unlocked">Sınava Gir</span>
                        ) : (
                          <span className="status-badge locked">Kilitli</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isUnitUnlocked && (
                <div className="unit-locked-message">
                  <p>
                    🔒 Bu ünite kilitli. Açmak için önceki üniteleri tamamlayın.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressDashboard;

