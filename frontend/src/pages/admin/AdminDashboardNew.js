import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboardNew.css';

/**
 * Yeni Admin Dashboard
 * Backend ile tam entegre
 * Öğrencileri, dersleri, içerikleri yönet
 */
const AdminDashboardNew = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | students | lessons | content
  
  // Data states
  const [statistics, setStatistics] = useState(null);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Backend'den yükle
      try {
        const statsResponse = await api.get('/admin/statistics');
        setStatistics(statsResponse.statistics);
        
        const studentsResponse = await api.get('/admin/students');
        setStudents(studentsResponse.students);
        
        const lessonsResponse = await api.get('/admin/lessons?grade=5');
        setLessons(lessonsResponse.lessons);
        
        console.log("✅ Backend'den yüklendi");
      } catch (apiError) {
        console.warn('Backend hatası, mock data kullanılıyor:', apiError);
        // Mock data kullan
        setStatistics(getMockStatistics());
        setStudents(getMockStudents());
        setLessons(getMockLessons());
      }

      console.log('✅ Admin dashboard yüklendi');
    } catch (error) {
      console.error('Dashboard yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock Data Functions
  const getMockStatistics = () => ({
    total_students: 125,
    active_students: 118,
    pending_approvals: 7,
    total_lessons: 48,
    active_lessons: 45,
    total_units: 6,
    today: {
      active_students: 45,
      lessons_completed: 23,
      quizzes_taken: 18,
      avg_quiz_score: 84
    },
    this_week: {
      new_students: 12,
      lessons_completed: 156
    },
    top_students: [
      { name: "Ali Yılmaz", progress: 89, grade: 5 },
      { name: "Ayşe Kaya", progress: 85, grade: 6 },
      { name: "Murat Usta", progress: 82, grade: 5 }
    ],
    needs_attention: [
      { name: "Zehra Demir", reason: "3 gündür giriş yok" },
      { name: "Can Öztürk", reason: "Quiz ortalaması %60'a düştü" }
    ]
  });

  const getMockStudents = () => [
    {
      id: "student_001",
      name: "Murat Usta",
      email: "murat@example.com",
      grade: 5,
      subject: "matematik",
      created_at: "2024-10-01T10:00:00Z",
      last_login: "2024-10-15T14:30:00Z",
      overall_progress: 40,
      completed_lessons: 8,
      total_lessons: 20,
      quiz_average: 87,
      final_average: 82,
      total_time_spent: 720
    },
    {
      id: "student_002",
      name: "Ali Yılmaz",
      email: "ali@example.com",
      grade: 5,
      subject: "matematik",
      created_at: "2024-09-15T10:00:00Z",
      last_login: "2024-10-15T16:00:00Z",
      overall_progress: 65,
      completed_lessons: 13,
      total_lessons: 20,
      quiz_average: 92,
      final_average: 88,
      total_time_spent: 1080
    },
    {
      id: "student_003",
      name: "Ayşe Kaya",
      email: "ayse@example.com",
      grade: 6,
      subject: "matematik",
      created_at: "2024-10-05T10:00:00Z",
      last_login: "2024-10-14T12:00:00Z",
      overall_progress: 25,
      completed_lessons: 5,
      total_lessons: 20,
      quiz_average: 78,
      final_average: 75,
      total_time_spent: 360
    }
  ];

  const getMockLessons = () => [
    {
      id: "u1_l1",
      unit_id: "u1",
      unit_title: "Ünite 1: Doğal Sayılar",
      lesson_number: 1,
      title: "Doğal Sayıları Okuma ve Yazma",
      meb_code: "5.1.1",
      grade: 5,
      subject: "matematik",
      duration: 45,
      difficulty: "kolay",
      has_video: true,
      has_pdf: true,
      has_quiz: true,
      active: true
    },
    {
      id: "u1_l2",
      unit_id: "u1",
      unit_title: "Ünite 1: Doğal Sayılar",
      lesson_number: 2,
      title: "Basamak Değeri",
      meb_code: "5.1.2",
      grade: 5,
      subject: "matematik",
      duration: 45,
      difficulty: "kolay",
      has_video: true,
      has_pdf: false,
      has_quiz: true,
      active: true
    },
    {
      id: "u2_l1",
      unit_id: "u2",
      unit_title: "Ünite 2: Kesirler",
      lesson_number: 1,
      title: "Kesir Kavramı",
      meb_code: "5.2.1",
      grade: 5,
      subject: "matematik",
      duration: 45,
      difficulty: "orta",
      has_video: true,
      has_pdf: true,
      has_quiz: true,
      active: true
    }
  ];

  const loadStudentDetail = async (studentId) => {
    try {
      // Backend'den dene
      try {
        const response = await api.get(`/admin/students/${studentId}`);
        setStudentDetail(response);
        setSelectedStudent(studentId);
        console.log("✅ Backend'den yüklendi");
        return;
      } catch (apiError) {
        console.warn('Backend hatası, mock data:', apiError);
      }

      // Mock data
      const mockDetail = {
        student: {
          id: studentId,
          name: studentId === "student_001" ? "Murat Usta" : "Öğrenci",
          email: "murat@example.com",
          grade: 5,
          subject: "matematik"
        },
        progress: {
          overall_progress: 40,
          current_unit: 2,
          current_lesson: "u2_l2",
          completed_lessons: ["u1_l1", "u1_l2", "u1_l3", "u1_l4", "u1_final", "u2_l1"],
          completed_units: ["u1"]
        },
        lessons: [
          {
            lesson_id: "u1_l1",
            lesson_title: "Doğal Sayıları Okuma ve Yazma",
            unit: "Ünite 1: Doğal Sayılar",
            completed: true,
            quiz_score: 90,
            time_spent: 45,
            completed_at: "2024-10-05T10:30:00Z"
          },
          {
            lesson_id: "u1_l2",
            lesson_title: "Basamak Değeri",
            unit: "Ünite 1: Doğal Sayılar",
            completed: true,
            quiz_score: 85,
            time_spent: 50
          },
          {
            lesson_id: "u1_l3",
            lesson_title: "Sayıları Karşılaştırma",
            unit: "Ünite 1: Doğal Sayılar",
            completed: true,
            quiz_score: 88,
            time_spent: 42
          },
          {
            lesson_id: "u1_l4",
            lesson_title: "Toplama ve Çıkarma",
            unit: "Ünite 1: Doğal Sayılar",
            completed: true,
            quiz_score: 83,
            time_spent: 55
          },
          {
            lesson_id: "u1_final",
            lesson_title: "Ünite 1 Final Sınavı",
            unit: "Ünite 1: Doğal Sayılar",
            completed: true,
            quiz_score: 85,
            time_spent: 40
          },
          {
            lesson_id: "u2_l1",
            lesson_title: "Kesir Kavramı",
            unit: "Ünite 2: Kesirler",
            completed: true,
            quiz_score: 92,
            time_spent: 55
          },
          {
            lesson_id: "u2_l2",
            lesson_title: "Kesir Türleri",
            unit: "Ünite 2: Kesirler",
            completed: false,
            quiz_score: null,
            time_spent: 15,
            completed_at: null
          }
        ],
        stats: {
          total_lessons_completed: 7,
          total_quizzes_taken: 7,
          quiz_average: 87,
          final_average: 82,
          total_study_time_minutes: 720,
          streak_days: 7,
          achievements: [
            { name: "İlk Ders", date: "2024-10-05" },
            { name: "Quiz Master", date: "2024-10-10" },
            { name: "7 Gün Streak", date: "2024-10-15" }
          ]
        }
      };

      setStudentDetail(mockDetail);
      setSelectedStudent(studentId);
      console.log('✅ Mock data ile yüklendi');
      
    } catch (error) {
      console.error('Öğrenci detay hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-new loading">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-new">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1>👨‍💼 Admin Paneli</h1>
          <p className="header-subtitle">Öğrenci ve ders yönetimi</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadDashboardData}>
            🔄 Yenile
          </button>
          <button className="btn-logout" onClick={() => navigate('/login')}>
            🚪 Çıkış
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Genel Bakış
        </button>
        <button 
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👨‍🎓 Öğrenciler ({students.length})
        </button>
        <button 
          className={`tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          📚 Dersler ({lessons.length})
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📁 İçerik Yönetimi
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        
        {/* GENEL BAKIŞ */}
        {activeTab === 'overview' && statistics && (
          <div className="overview-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-content">
                  <span className="stat-value">{statistics.total_students}</span>
                  <span className="stat-label">Toplam Öğrenci</span>
                  <span className="stat-sub">{statistics.active_students} aktif</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <span className="stat-value">{statistics.pending_approvals}</span>
                  <span className="stat-label">Onay Bekleyen</span>
                  <span className="stat-sub">Seviye belirleme</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <span className="stat-value">{statistics.total_lessons}</span>
                  <span className="stat-label">Toplam Ders</span>
                  <span className="stat-sub">{statistics.active_lessons} aktif</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <span className="stat-value">{statistics.today.avg_quiz_score}%</span>
                  <span className="stat-label">Quiz Ortalaması</span>
                  <span className="stat-sub">Bugün</span>
                </div>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="activity-card">
              <h3>📅 Bugün</h3>
              <div className="activity-grid">
                <div className="activity-item">
                  <span className="activity-value">{statistics.today.active_students}</span>
                  <span className="activity-label">Aktif Öğrenci</span>
                </div>
                <div className="activity-item">
                  <span className="activity-value">{statistics.today.lessons_completed}</span>
                  <span className="activity-label">Tamamlanan Ders</span>
                </div>
                <div className="activity-item">
                  <span className="activity-value">{statistics.today.quizzes_taken}</span>
                  <span className="activity-label">Quiz Yapıldı</span>
                </div>
              </div>
            </div>

            {/* Top Students */}
            <div className="top-students-card">
              <h3>🏆 En Başarılı Öğrenciler</h3>
              <div className="student-list">
                {statistics.top_students.map((student, index) => (
                  <div key={index} className="student-row" onClick={() => loadStudentDetail(student.id || 'student_00' + (index + 1))}>
                    <span className="rank">#{index + 1}</span>
                    <span className="student-name">{student.name}</span>
                    <span className="student-grade">{student.grade}. Sınıf</span>
                    <span className="student-progress">{student.progress}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            {statistics.needs_attention && statistics.needs_attention.length > 0 && (
              <div className="attention-card">
                <h3>⚠️ Dikkat Gereken Öğrenciler</h3>
                {statistics.needs_attention.map((student, index) => (
                  <div key={index} className="attention-row">
                    <span className="attention-name">{student.name}</span>
                    <span className="attention-reason">{student.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÖĞRENCİLER */}
        {activeTab === 'students' && (
          <div className="students-section">
            <div className="section-header">
              <h2>👨‍🎓 Öğrenci Listesi</h2>
              <div className="header-filters">
                <select className="filter-select">
                  <option value="">Tüm Sınıflar</option>
                  <option value="5">5. Sınıf</option>
                  <option value="6">6. Sınıf</option>
                  <option value="7">7. Sınıf</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Öğrenci ara..." 
                  className="search-input"
                />
              </div>
            </div>

            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Öğrenci</th>
                    <th>Sınıf</th>
                    <th>İlerleme</th>
                    <th>Quiz Ort.</th>
                    <th>Final Ort.</th>
                    <th>Süre</th>
                    <th>Son Giriş</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">{student.name.charAt(0)}</div>
                          <div>
                            <div className="student-name-cell">{student.name}</div>
                            <div className="student-email">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{student.grade}. Sınıf</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-small">
                            <div 
                              className="progress-fill-small"
                              style={{ width: `${student.overall_progress}%` }}
                            ></div>
                          </div>
                          <span>{student.overall_progress}%</span>
                        </div>
                      </td>
                      <td className="score-cell">%{student.quiz_average}</td>
                      <td className="score-cell">%{student.final_average}</td>
                      <td>{Math.round(student.total_time_spent / 60)} saat</td>
                      <td className="date-cell">
                        {new Date(student.last_login).toLocaleDateString('tr-TR')}
                      </td>
                      <td>
                        <button 
                          className="btn-view"
                          onClick={() => loadStudentDetail(student.id)}
                        >
                          👁️ Detay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Öğrenci Detay Modal */}
            {selectedStudent && studentDetail && (
              <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>📋 {studentDetail.student.name} - Detaylı Rapor</h2>
                    <button className="btn-close" onClick={() => setSelectedStudent(null)}>✕</button>
                  </div>

                  <div className="modal-body">
                    {/* Genel Bilgiler */}
                    <div className="detail-section">
                      <h3>📌 Genel Bilgiler</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Email:</span>
                          <span className="value">{studentDetail.student.email}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Sınıf:</span>
                          <span className="value">{studentDetail.student.grade}. Sınıf</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Genel İlerleme:</span>
                          <span className="value">{studentDetail.progress.overall_progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Performans */}
                    <div className="detail-section">
                      <h3>📊 Performans</h3>
                      <div className="stats-row">
                        <div className="mini-stat">
                          <span className="mini-value">{studentDetail.stats.total_lessons_completed}</span>
                          <span className="mini-label">Tamamlanan Ders</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-value">%{studentDetail.stats.quiz_average}</span>
                          <span className="mini-label">Quiz Ortalaması</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-value">%{studentDetail.stats.final_average}</span>
                          <span className="mini-label">Final Ortalaması</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-value">{Math.round(studentDetail.stats.total_study_time_minutes / 60)}h</span>
                          <span className="mini-label">Toplam Süre</span>
                        </div>
                      </div>
                    </div>

                    {/* Dersler */}
                    <div className="detail-section">
                      <h3>📚 Ders Detayları</h3>
                      <div className="lessons-list-detail">
                        {studentDetail.lessons.map(lesson => (
                          <div key={lesson.lesson_id} className={`lesson-row ${lesson.completed ? 'completed' : 'in-progress'}`}>
                            <div className="lesson-status-icon">
                              {lesson.completed ? '✅' : '⏳'}
                            </div>
                            <div className="lesson-info-detail">
                              <div className="lesson-title-detail">{lesson.lesson_title}</div>
                              <div className="lesson-unit">{lesson.unit}</div>
                            </div>
                            <div className="lesson-metrics">
                              {lesson.quiz_score && (
                                <span className="metric quiz">Quiz: %{lesson.quiz_score}</span>
                              )}
                              <span className="metric time">{lesson.time_spent} dk</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setSelectedStudent(null)}>
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DERSLER */}
        {activeTab === 'lessons' && (
          <div className="lessons-section">
            <div className="section-header">
              <h2>📚 Ders Yönetimi</h2>
              <button className="btn-add">➕ Yeni Ders Ekle</button>
            </div>

            <div className="lessons-grid">
              {lessons.map(lesson => (
                <div key={lesson.id} className="lesson-card-admin">
                  <div className="lesson-card-header">
                    <div>
                      <h4>{lesson.title}</h4>
                      <p className="lesson-unit-title">{lesson.unit_title}</p>
                    </div>
                    <span className={`difficulty-badge ${lesson.difficulty}`}>
                      {lesson.difficulty === 'kolay' && '⭐ Kolay'}
                      {lesson.difficulty === 'orta' && '⭐⭐ Orta'}
                      {lesson.difficulty === 'ileri' && '⭐⭐⭐ İleri'}
                    </span>
                  </div>

                  <div className="lesson-card-body">
                    <div className="lesson-meta-row">
                      <span>📝 MEB: {lesson.meb_code}</span>
                      <span>⏱️ {lesson.duration} dk</span>
                    </div>

                    <div className="lesson-resources">
                      <span className={lesson.has_video ? 'resource-yes' : 'resource-no'}>
                        {lesson.has_video ? '✅' : '❌'} Video
                      </span>
                      <span className={lesson.has_pdf ? 'resource-yes' : 'resource-no'}>
                        {lesson.has_pdf ? '✅' : '❌'} PDF
                      </span>
                      <span className={lesson.has_quiz ? 'resource-yes' : 'resource-no'}>
                        {lesson.has_quiz ? '✅' : '❌'} Quiz
                      </span>
                    </div>
                  </div>

                  <div className="lesson-card-footer">
                    <button className="btn-edit">✏️ Düzenle</button>
                    <button className="btn-preview">👁️ Önizle</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İÇERİK YÖNETİMİ */}
        {activeTab === 'content' && (
          <div className="content-section">
            <h2>📁 İçerik Yönetimi</h2>
            <div className="content-tabs">
              <button className="content-tab active">📺 Videolar</button>
              <button className="content-tab">📄 PDF'ler</button>
              <button className="content-tab">❓ Quizler</button>
            </div>
            <div className="content-placeholder">
              <p>İçerik yönetimi geliştiriliyor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardNew;

