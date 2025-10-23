import React, { useState, useEffect } from 'react';
import './AdminLessonManagement.css';

const AdminLessonManagement = () => {
  const [activeView, setActiveView] = useState('overview');
  const [lessons, setLessons] = useState([
    {
      id: 1,
      title: '5. Sınıf Matematik - Kesirler',
      subject: 'Matematik',
      grade: '5. Sınıf',
      teacher: 'Ahmet Öğretmen',
      duration: 45,
      difficulty: 'Orta',
      description: 'Kesirler konusunun kapsamlı anlatımı',
      videoUrl: 'https://example.com/video1.mp4',
      materials: ['kesirler_ozet.pdf', 'alistirma_sorulari.pdf'],
      createdAt: '2024-12-15',
      status: 'active',
      enrolledStudents: 234,
      completionRate: 87,
      rating: 4.5,
      modules: [
        { id: 1, title: 'Kesirlere Giriş', duration: 15, completed: true },
        { id: 2, title: 'Kesir Türleri', duration: 15, completed: true },
        { id: 3, title: 'Kesirlerle İşlemler', duration: 15, completed: false }
      ],
      schedule: {
        day: 'Pazartesi',
        time: '14:00',
        recurring: true
      },
      tags: ['matematik', 'kesirler', '5.sınıf', 'temel']
    },
    {
      id: 2,
      title: '6. Sınıf Fen - Işık ve Ses',
      subject: 'Fen Bilimleri',
      grade: '6. Sınıf',
      teacher: 'Ayşe Öğretmen',
      duration: 50,
      difficulty: 'Kolay',
      description: 'Işık ve ses olaylarının temel prensipleri',
      videoUrl: 'https://example.com/video2.mp4',
      materials: ['isik_ses_deney.pdf'],
      createdAt: '2024-12-10',
      status: 'active',
      enrolledStudents: 198,
      completionRate: 92,
      rating: 4.8,
      modules: [
        { id: 1, title: 'Işığın Özellikleri', duration: 20, completed: true },
        { id: 2, title: 'Ses Dalgaları', duration: 20, completed: true },
        { id: 3, title: 'Deney ve Uygulamalar', duration: 10, completed: true }
      ],
      schedule: {
        day: 'Salı',
        time: '15:00',
        recurring: true
      },
      tags: ['fen', 'fizik', '6.sınıf', 'deney']
    }
  ]);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showNewLessonForm, setShowNewLessonForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  const [newLesson, setNewLesson] = useState({
    title: '',
    subject: '',
    grade: '',
    teacher: '',
    duration: '',
    difficulty: 'Kolay',
    description: '',
    videoFile: null,
    materials: [],
    modules: [],
    tags: [],
    schedule: {
      day: '',
      time: '',
      recurring: false
    }
  });

  const [lessonStats] = useState({
    totalLessons: 156,
    activeLessons: 142,
    totalStudents: 3456,
    avgCompletion: 78,
    totalHours: 234,
    avgRating: 4.3
  });

  // AI Ders Önerileri
  const [aiSuggestions] = useState([
    {
      id: 1,
      title: 'Geometri - Üçgenler',
      reason: '5. sınıf müfredatında eksik konu',
      priority: 'Yüksek',
      estimatedStudents: 180
    },
    {
      id: 2,
      title: 'İngilizce - Present Continuous',
      reason: 'Öğrenci talepleri yüksek',
      priority: 'Orta',
      estimatedStudents: 220
    }
  ]);

  // Ders Takvimi
  const [weeklySchedule] = useState({
    Pazartesi: [
      { time: '09:00', lesson: '5. Sınıf Matematik', students: 45 },
      { time: '14:00', lesson: '6. Sınıf Fen', students: 38 }
    ],
    Salı: [
      { time: '10:00', lesson: '7. Sınıf Türkçe', students: 42 },
      { time: '15:00', lesson: '8. Sınıf İngilizce', students: 35 }
    ],
    Çarşamba: [
      { time: '09:00', lesson: '5. Sınıf Sosyal', students: 40 },
      { time: '14:00', lesson: '6. Sınıf Matematik', students: 44 }
    ],
    Perşembe: [
      { time: '11:00', lesson: '7. Sınıf Fen', students: 37 },
      { time: '16:00', lesson: '8. Sınıf Türkçe', students: 33 }
    ],
    Cuma: [
      { time: '09:00', lesson: '5. Sınıf İngilizce', students: 41 },
      { time: '13:00', lesson: '6. Sınıf Sosyal', students: 39 }
    ]
  });

  // Functions
  const handleCreateLesson = () => {
    if (!newLesson.title || !newLesson.subject || !newLesson.grade) {
      alert('Lütfen gerekli alanları doldurun!');
      return;
    }

    const lesson = {
      id: lessons.length + 1,
      ...newLesson,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      enrolledStudents: 0,
      completionRate: 0,
      rating: 0
    };

    setLessons([...lessons, lesson]);
    setNewLesson({
      title: '',
      subject: '',
      grade: '',
      teacher: '',
      duration: '',
      difficulty: 'Kolay',
      description: '',
      videoFile: null,
      materials: [],
      modules: [],
      tags: [],
      schedule: {
        day: '',
        time: '',
        recurring: false
      }
    });
    setShowNewLessonForm(false);
    alert('Ders başarıyla oluşturuldu!');
  };

  const handleDeleteLesson = (lessonId) => {
    if (window.confirm('Bu dersi silmek istediğinizden emin misiniz?')) {
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
      alert('Ders silindi!');
    }
  };

  const handleLessonStatusToggle = (lessonId) => {
    setLessons(lessons.map(lesson => 
      lesson.id === lessonId 
        ? { ...lesson, status: lesson.status === 'active' ? 'inactive' : 'active' }
        : lesson
    ));
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === 'video') {
        setNewLesson({ ...newLesson, videoFile: file });
      } else if (type === 'material') {
        setNewLesson({ 
          ...newLesson, 
          materials: [...newLesson.materials, file.name] 
        });
      }
    }
  };

  const handleAddModule = () => {
    const moduleName = prompt('Modül adını girin:');
    if (moduleName) {
      const newModule = {
        id: newLesson.modules.length + 1,
        title: moduleName,
        duration: 15,
        completed: false
      };
      setNewLesson({
        ...newLesson,
        modules: [...newLesson.modules, newModule]
      });
    }
  };

  const handleAddTag = () => {
    const tag = prompt('Etiket girin:');
    if (tag && !newLesson.tags.includes(tag)) {
      setNewLesson({
        ...newLesson,
        tags: [...newLesson.tags, tag]
      });
    }
  };

  const renderOverview = () => (
    <div className="lesson-overview">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card gradient-primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{lessonStats.totalLessons}</h3>
            <p>Toplam Ders</p>
            <span className="trend positive">+12 bu ay</span>
          </div>
        </div>
        
        <div className="stat-card gradient-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{lessonStats.activeLessons}</h3>
            <p>Aktif Ders</p>
            <span className="trend positive">+8 bu hafta</span>
          </div>
        </div>
        
        <div className="stat-card gradient-info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{lessonStats.totalStudents}</h3>
            <p>Toplam Öğrenci</p>
            <span className="trend positive">+156 bu ay</span>
          </div>
        </div>
        
        <div className="stat-card gradient-warning">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>%{lessonStats.avgCompletion}</h3>
            <p>Ortalama Tamamlama</p>
            <span className="trend neutral">Sabit</span>
          </div>
        </div>
        
        <div className="stat-card gradient-purple">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{lessonStats.totalHours} saat</h3>
            <p>Toplam İçerik</p>
            <span className="trend positive">+24 saat</span>
          </div>
        </div>
        
        <div className="stat-card gradient-pink">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{lessonStats.avgRating}</h3>
            <p>Ortalama Puan</p>
            <span className="trend positive">+0.2</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-card create"
          onClick={() => setShowNewLessonForm(true)}
        >
          <div className="action-icon">➕</div>
          <h4>Yeni Ders Oluştur</h4>
          <p>Müfredata yeni ders ekle</p>
        </button>
        
        <button 
          className="action-card schedule"
          onClick={() => setActiveView('schedule')}
        >
          <div className="action-icon">📅</div>
          <h4>Ders Takvimi</h4>
          <p>Haftalık programı görüntüle</p>
        </button>
        
        <button 
          className="action-card ai"
          onClick={() => setShowAIAssistant(true)}
        >
          <div className="action-icon">🤖</div>
          <h4>AI Asistan</h4>
          <p>Akıllı ders önerileri</p>
        </button>
        
        <button 
          className="action-card analytics"
          onClick={() => setActiveView('analytics')}
        >
          <div className="action-icon">📈</div>
          <h4>Detaylı Analiz</h4>
          <p>Performans raporları</p>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>📋 Son Aktiviteler</h3>
        <div className="activity-timeline">
          <div className="timeline-item">
            <div className="timeline-icon create">➕</div>
            <div className="timeline-content">
              <h4>Yeni ders eklendi</h4>
              <p>7. Sınıf Matematik - Denklemler</p>
              <span className="timeline-date">2 saat önce</span>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-icon update">✏️</div>
            <div className="timeline-content">
              <h4>Ders güncellendi</h4>
              <p>5. Sınıf Fen - Canlılar Dünyası</p>
              <span className="timeline-date">5 saat önce</span>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-icon complete">✅</div>
            <div className="timeline-content">
              <h4>Modül tamamlandı</h4>
              <p>6. Sınıf İngilizce - Past Tense</p>
              <span className="timeline-date">1 gün önce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLessonList = () => (
    <div className="lesson-list-view">
      {/* Filters */}
      <div className="lesson-filters">
        <div className="filter-group">
          <select>
            <option value="">Tüm Dersler</option>
            <option value="Matematik">Matematik</option>
            <option value="Fen Bilimleri">Fen Bilimleri</option>
            <option value="Türkçe">Türkçe</option>
            <option value="İngilizce">İngilizce</option>
            <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
          </select>
          
          <select>
            <option value="">Tüm Sınıflar</option>
            <option value="5. Sınıf">5. Sınıf</option>
            <option value="6. Sınıf">6. Sınıf</option>
            <option value="7. Sınıf">7. Sınıf</option>
            <option value="8. Sınıf">8. Sınıf</option>
          </select>
          
          <select>
            <option value="">Durum</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="draft">Taslak</option>
          </select>
          
          <input 
            type="text" 
            placeholder="Ders ara..." 
            className="search-input"
          />
        </div>
        
        <div className="view-options">
          <button className="view-btn active">
            <span>📋</span> Liste
          </button>
          <button className="view-btn">
            <span>📊</span> Kart
          </button>
        </div>
      </div>

      {/* Lessons Table */}
      <div className="lessons-table">
        <table>
          <thead>
            <tr>
              <th>Ders Adı</th>
              <th>Öğretmen</th>
              <th>Sınıf</th>
              <th>Öğrenci</th>
              <th>Tamamlanma</th>
              <th>Puan</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map(lesson => (
              <tr key={lesson.id}>
                <td>
                  <div className="lesson-title-cell">
                    <div className="lesson-icon">📚</div>
                    <div>
                      <h4>{lesson.title}</h4>
                      <p>{lesson.subject} • {lesson.duration} dk</p>
                    </div>
                  </div>
                </td>
                <td>{lesson.teacher}</td>
                <td>{lesson.grade}</td>
                <td>
                  <div className="student-count">
                    <span className="count">{lesson.enrolledStudents}</span>
                    <span className="label">öğrenci</span>
                  </div>
                </td>
                <td>
                  <div className="completion-cell">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{width: `${lesson.completionRate}%`}}
                      ></div>
                    </div>
                    <span>{lesson.completionRate}%</span>
                  </div>
                </td>
                <td>
                  <div className="rating-cell">
                    <span className="stars">⭐</span>
                    <span>{lesson.rating || '-'}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${lesson.status}`}>
                    {lesson.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn view"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setActiveView('detail');
                      }}
                      title="Detay"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setShowEditForm(true);
                      }}
                      title="Düzenle"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn toggle"
                      onClick={() => handleLessonStatusToggle(lesson.id)}
                      title="Durum Değiştir"
                    >
                      {lesson.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteLesson(lesson.id)}
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLessonDetail = () => {
    if (!selectedLesson) return null;

    return (
      <div className="lesson-detail-view">
        <div className="detail-header">
          <button 
            className="back-btn"
            onClick={() => setActiveView('list')}
          >
            ← Geri
          </button>
          <div className="detail-actions">
            <button className="btn-edit">✏️ Düzenle</button>
            <button className="btn-schedule">📅 Zamanla</button>
            <button className="btn-duplicate">📋 Kopyala</button>
          </div>
        </div>

        <div className="detail-content">
          {/* Lesson Info */}
          <div className="lesson-info-card">
            <div className="info-header">
              <h1>{selectedLesson.title}</h1>
              <span className={`status-badge ${selectedLesson.status}`}>
                {selectedLesson.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
              </span>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Ders:</label>
                <span>{selectedLesson.subject}</span>
              </div>
              <div className="info-item">
                <label>Sınıf:</label>
                <span>{selectedLesson.grade}</span>
              </div>
              <div className="info-item">
                <label>Öğretmen:</label>
                <span>{selectedLesson.teacher}</span>
              </div>
              <div className="info-item">
                <label>Süre:</label>
                <span>{selectedLesson.duration} dakika</span>
              </div>
              <div className="info-item">
                <label>Zorluk:</label>
                <span className={`difficulty ${selectedLesson.difficulty.toLowerCase()}`}>
                  {selectedLesson.difficulty}
                </span>
              </div>
              <div className="info-item">
                <label>Oluşturulma:</label>
                <span>{new Date(selectedLesson.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>

            <div className="description">
              <h3>Açıklama</h3>
              <p>{selectedLesson.description}</p>
            </div>

            <div className="tags">
              {selectedLesson.tags?.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="lesson-stats-card">
            <h3>📊 İstatistikler</h3>
            <div className="stats-items">
              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-value">{selectedLesson.enrolledStudents}</span>
                  <span className="stat-label">Kayıtlı Öğrenci</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-value">{selectedLesson.completionRate}%</span>
                  <span className="stat-label">Tamamlanma</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <span className="stat-value">{selectedLesson.rating || '-'}</span>
                  <span className="stat-label">Ortalama Puan</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <span className="stat-value">45</span>
                  <span className="stat-label">Yorum</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="lesson-modules-card">
            <h3>📚 Ders Modülleri</h3>
            <div className="modules-list">
              {selectedLesson.modules?.map(module => (
                <div key={module.id} className="module-item">
                  <div className="module-info">
                    <span className="module-number">{module.id}</span>
                    <div>
                      <h4>{module.title}</h4>
                      <p>{module.duration} dakika</p>
                    </div>
                  </div>
                  <div className="module-status">
                    {module.completed ? (
                      <span className="completed">✅ Tamamlandı</span>
                    ) : (
                      <span className="pending">⏳ Bekliyor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="add-module-btn">
              ➕ Yeni Modül Ekle
            </button>
          </div>

          {/* Materials */}
          <div className="lesson-materials-card">
            <h3>📁 Ders Materyalleri</h3>
            <div className="materials-grid">
              <div className="material-item video">
                <div className="material-icon">🎥</div>
                <div className="material-info">
                  <h4>Ders Videosu</h4>
                  <p>{selectedLesson.videoUrl}</p>
                </div>
                <button className="material-action">📥 İndir</button>
              </div>
              
              {selectedLesson.materials?.map((material, index) => (
                <div key={index} className="material-item document">
                  <div className="material-icon">📄</div>
                  <div className="material-info">
                    <h4>{material}</h4>
                    <p>PDF Doküman</p>
                  </div>
                  <button className="material-action">📥 İndir</button>
                </div>
              ))}
            </div>
            <button className="add-material-btn">
              ➕ Materyal Ekle
            </button>
          </div>

          {/* Student List Preview */}
          <div className="enrolled-students-card">
            <div className="students-header">
              <h3>👥 Kayıtlı Öğrenciler ({selectedLesson.enrolledStudents})</h3>
              <button 
                className="view-all-btn"
                onClick={() => setShowStudentList(true)}
              >
                Tümünü Gör →
              </button>
            </div>
            <div className="students-preview">
              <div className="student-avatar">👤</div>
              <div className="student-avatar">👤</div>
              <div className="student-avatar">👤</div>
              <div className="student-avatar">👤</div>
              <div className="student-avatar more">+{selectedLesson.enrolledStudents - 4}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSchedule = () => (
    <div className="schedule-view">
      <div className="schedule-header">
        <h2>📅 Haftalık Ders Programı</h2>
        <div className="schedule-actions">
          <button className="btn-print">🖨️ Yazdır</button>
          <button className="btn-export">📊 Dışa Aktar</button>
          <button className="btn-new-schedule">➕ Yeni Program</button>
        </div>
      </div>

      <div className="schedule-grid">
        {Object.entries(weeklySchedule).map(([day, dayLessons]) => (
          <div key={day} className="schedule-day">
            <h3>{day}</h3>
            <div className="day-lessons">
              {dayLessons.map((lesson, index) => (
                <div key={index} className="schedule-lesson">
                  <span className="lesson-time">🕐 {lesson.time}</span>
                  <div className="lesson-info">
                    <h4>{lesson.lesson}</h4>
                    <p>{lesson.students} öğrenci</p>
                  </div>
                  <button className="lesson-action">✏️</button>
                </div>
              ))}
              <button className="add-lesson-btn">
                ➕ Ders Ekle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Classes */}
      <div className="upcoming-classes">
        <h3>🔔 Yaklaşan Dersler</h3>
        <div className="upcoming-list">
          <div className="upcoming-item">
            <div className="upcoming-time">
              <span className="day">Bugün</span>
              <span className="hour">14:00</span>
            </div>
            <div className="upcoming-info">
              <h4>5. Sınıf Matematik - Kesirler</h4>
              <p>45 öğrenci • Zoom</p>
            </div>
            <button className="start-btn">🚀 Başlat</button>
          </div>
          
          <div className="upcoming-item">
            <div className="upcoming-time">
              <span className="day">Yarın</span>
              <span className="hour">10:00</span>
            </div>
            <div className="upcoming-info">
              <h4>6. Sınıf Fen - Işık ve Ses</h4>
              <p>38 öğrenci • Sınıf 3B</p>
            </div>
            <button className="prepare-btn">📋 Hazırla</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-view">
      <h2>📈 Ders Analitiği</h2>
      
      {/* Performance Charts */}
      <div className="analytics-grid">
        <div className="chart-card">
          <h3>📊 Aylık Performans</h3>
          <div className="chart-placeholder">
            <div className="chart-bar" style={{height: '60%'}}>Oca</div>
            <div className="chart-bar" style={{height: '75%'}}>Şub</div>
            <div className="chart-bar" style={{height: '85%'}}>Mar</div>
            <div className="chart-bar" style={{height: '90%'}}>Nis</div>
            <div className="chart-bar" style={{height: '80%'}}>May</div>
            <div className="chart-bar" style={{height: '95%'}}>Haz</div>
          </div>
        </div>

        <div className="chart-card">
          <h3>🎯 Ders Bazlı Başarı</h3>
          <div className="subject-performance">
            <div className="subject-item">
              <span>Matematik</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '85%'}}></div>
              </div>
              <span>85%</span>
            </div>
            <div className="subject-item">
              <span>Fen Bilimleri</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '92%'}}></div>
              </div>
              <span>92%</span>
            </div>
            <div className="subject-item">
              <span>Türkçe</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '78%'}}></div>
              </div>
              <span>78%</span>
            </div>
            <div className="subject-item">
              <span>İngilizce</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '88%'}}></div>
              </div>
              <span>88%</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>⭐ En Popüler Dersler</h3>
          <div className="popular-lessons">
            <div className="popular-item">
              <span className="rank">1</span>
              <div className="lesson-info">
                <h4>Matematik - Kesirler</h4>
                <p>234 öğrenci • 4.8 ⭐</p>
              </div>
            </div>
            <div className="popular-item">
              <span className="rank">2</span>
              <div className="lesson-info">
                <h4>Fen - Işık ve Ses</h4>
                <p>198 öğrenci • 4.7 ⭐</p>
              </div>
            </div>
            <div className="popular-item">
              <span className="rank">3</span>
              <div className="lesson-info">
                <h4>İngilizce - Grammar</h4>
                <p>176 öğrenci • 4.6 ⭐</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>📈 Öğrenci Gelişimi</h3>
          <div className="growth-stats">
            <div className="growth-item">
              <div className="growth-icon up">📈</div>
              <div className="growth-info">
                <h4>+23%</h4>
                <p>Ders tamamlama oranı</p>
              </div>
            </div>
            <div className="growth-item">
              <div className="growth-icon up">📈</div>
              <div className="growth-info">
                <h4>+156</h4>
                <p>Yeni öğrenci</p>
              </div>
            </div>
            <div className="growth-item">
              <div className="growth-icon down">📉</div>
              <div className="growth-info">
                <h4>-12%</h4>
                <p>Ders bırakma oranı</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNewLessonForm = () => (
    <div className="modal-overlay" onClick={() => setShowNewLessonForm(false)}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎓 Yeni Ders Oluştur</h2>
          <button 
            className="close-btn"
            onClick={() => setShowNewLessonForm(false)}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-sections">
            {/* Temel Bilgiler */}
            <div className="form-section">
              <h3>📝 Temel Bilgiler</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ders Başlığı *</label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    placeholder="Örn: 5. Sınıf Matematik - Kesirler"
                  />
                </div>

                <div className="form-group">
                  <label>Ders *</label>
                  <select
                    value={newLesson.subject}
                    onChange={(e) => setNewLesson({...newLesson, subject: e.target.value})}
                  >
                    <option value="">Ders Seçin</option>
                    <option value="Matematik">Matematik</option>
                    <option value="Fen Bilimleri">Fen Bilimleri</option>
                    <option value="Türkçe">Türkçe</option>
                    <option value="İngilizce">İngilizce</option>
                    <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Sınıf *</label>
                  <select
                    value={newLesson.grade}
                    onChange={(e) => setNewLesson({...newLesson, grade: e.target.value})}
                  >
                    <option value="">Sınıf Seçin</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`${i + 1}. Sınıf`}>
                        {i + 1}. Sınıf
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Öğretmen</label>
                  <select
                    value={newLesson.teacher}
                    onChange={(e) => setNewLesson({...newLesson, teacher: e.target.value})}
                  >
                    <option value="">Öğretmen Seçin</option>
                    <option value="Ahmet Öğretmen">Ahmet Öğretmen</option>
                    <option value="Ayşe Öğretmen">Ayşe Öğretmen</option>
                    <option value="Mehmet Öğretmen">Mehmet Öğretmen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Süre (dk)</label>
                  <input
                    type="number"
                    value={newLesson.duration}
                    onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})}
                    placeholder="45"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="form-group">
                  <label>Zorluk Seviyesi</label>
                  <select
                    value={newLesson.difficulty}
                    onChange={(e) => setNewLesson({...newLesson, difficulty: e.target.value})}
                  >
                    <option value="Kolay">Kolay</option>
                    <option value="Orta">Orta</option>
                    <option value="Zor">Zor</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Açıklama</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    placeholder="Ders açıklaması..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* İçerik ve Materyaller */}
            <div className="form-section">
              <h3>📚 İçerik ve Materyaller</h3>
              <div className="upload-area">
                <div className="upload-box">
                  <div className="upload-icon">🎥</div>
                  <h4>Video Dosyası</h4>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    id="video-upload"
                    style={{display: 'none'}}
                  />
                  <label htmlFor="video-upload" className="upload-btn">
                    📁 Video Seç
                  </label>
                  {newLesson.videoFile && (
                    <p className="file-name">📹 {newLesson.videoFile.name}</p>
                  )}
                </div>

                <div className="upload-box">
                  <div className="upload-icon">📄</div>
                  <h4>Ders Materyalleri</h4>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => handleFileUpload(e, 'material')}
                    id="material-upload"
                    style={{display: 'none'}}
                    multiple
                  />
                  <label htmlFor="material-upload" className="upload-btn">
                    📁 Dosya Seç
                  </label>
                  {newLesson.materials.length > 0 && (
                    <div className="materials-list">
                      {newLesson.materials.map((material, index) => (
                        <span key={index} className="material-tag">
                          📄 {material}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modüller */}
            <div className="form-section">
              <h3>📑 Ders Modülleri</h3>
              <div className="modules-section">
                {newLesson.modules.length > 0 ? (
                  <div className="modules-list">
                    {newLesson.modules.map((module, index) => (
                      <div key={index} className="module-item">
                        <span className="module-number">{index + 1}</span>
                        <span className="module-name">{module.title}</span>
                        <span className="module-duration">{module.duration} dk</span>
                        <button 
                          className="remove-btn"
                          onClick={() => {
                            setNewLesson({
                              ...newLesson,
                              modules: newLesson.modules.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">Henüz modül eklenmedi</p>
                )}
                <button 
                  type="button"
                  className="add-btn"
                  onClick={handleAddModule}
                >
                  ➕ Modül Ekle
                </button>
              </div>
            </div>

            {/* Etiketler ve Zamanlama */}
            <div className="form-section">
              <h3>🏷️ Etiketler ve Zamanlama</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Etiketler</label>
                  <div className="tags-section">
                    {newLesson.tags.length > 0 && (
                      <div className="tags-list">
                        {newLesson.tags.map((tag, index) => (
                          <span key={index} className="tag">
                            #{tag}
                            <button 
                              onClick={() => {
                                setNewLesson({
                                  ...newLesson,
                                  tags: newLesson.tags.filter((_, i) => i !== index)
                                });
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <button 
                      type="button"
                      className="add-tag-btn"
                      onClick={handleAddTag}
                    >
                      ➕ Etiket Ekle
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Gün</label>
                  <select
                    value={newLesson.schedule.day}
                    onChange={(e) => setNewLesson({
                      ...newLesson,
                      schedule: {...newLesson.schedule, day: e.target.value}
                    })}
                  >
                    <option value="">Gün Seçin</option>
                    <option value="Pazartesi">Pazartesi</option>
                    <option value="Salı">Salı</option>
                    <option value="Çarşamba">Çarşamba</option>
                    <option value="Perşembe">Perşembe</option>
                    <option value="Cuma">Cuma</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Saat</label>
                  <input
                    type="time"
                    value={newLesson.schedule.time}
                    onChange={(e) => setNewLesson({
                      ...newLesson,
                      schedule: {...newLesson.schedule, time: e.target.value}
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newLesson.schedule.recurring}
                      onChange={(e) => setNewLesson({
                        ...newLesson,
                        schedule: {...newLesson.schedule, recurring: e.target.checked}
                      })}
                    />
                    <span>Tekrar Eden Ders</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={() => setShowNewLessonForm(false)}
          >
            ❌ İptal
          </button>
          <button 
            className="save-draft-btn"
            onClick={() => alert('Taslak kaydedildi!')}
          >
            💾 Taslak Kaydet
          </button>
          <button 
            className="create-btn"
            onClick={handleCreateLesson}
          >
            ✅ Dersi Oluştur
          </button>
        </div>
      </div>
    </div>
  );

  const renderAIAssistant = () => (
    <div className="modal-overlay" onClick={() => setShowAIAssistant(false)}>
      <div className="modal-content ai-assistant" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 AI Ders Asistanı</h2>
          <button 
            className="close-btn"
            onClick={() => setShowAIAssistant(false)}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="ai-suggestions">
            <h3>💡 Önerilen Dersler</h3>
            <div className="suggestions-list">
              {aiSuggestions.map(suggestion => (
                <div key={suggestion.id} className="suggestion-card">
                  <div className="suggestion-header">
                    <h4>{suggestion.title}</h4>
                    <span className={`priority ${suggestion.priority.toLowerCase()}`}>
                      {suggestion.priority} Öncelik
                    </span>
                  </div>
                  <p className="suggestion-reason">{suggestion.reason}</p>
                  <div className="suggestion-footer">
                    <span>Tahmini öğrenci: {suggestion.estimatedStudents}</span>
                    <button className="create-from-suggestion">
                      ➕ Oluştur
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-analyzer">
            <h3>📊 Müfredat Analizi</h3>
            <div className="analysis-results">
              <div className="analysis-item">
                <div className="analysis-icon">✅</div>
                <div className="analysis-content">
                  <h4>Güçlü Alanlar</h4>
                  <p>Matematik ve Fen derslerinde yeterli içerik mevcut</p>
                </div>
              </div>
              
              <div className="analysis-item">
                <div className="analysis-icon">⚠️</div>
                <div className="analysis-content">
                  <h4>Geliştirilmesi Gerekenler</h4>
                  <p>7. ve 8. sınıf Sosyal Bilgiler içeriği eksik</p>
                </div>
              </div>
              
              <div className="analysis-item">
                <div className="analysis-icon">💡</div>
                <div className="analysis-content">
                  <h4>Öneriler</h4>
                  <p>Öğrenci geri bildirimlerine göre daha fazla pratik içerik ekleyin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-chat">
            <h3>💬 AI Asistan ile Sohbet</h3>
            <div className="chat-messages">
              <div className="message ai">
                <p>Merhaba! Size ders içeriği oluşturma konusunda nasıl yardımcı olabilirim?</p>
              </div>
            </div>
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Sorunuzu yazın..."
              />
              <button className="send-btn">📤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-lesson-management">
      {/* Header */}
      <div className="management-header">
        <div className="header-left">
          <h1>📚 Ders Yönetimi</h1>
          <p>Tüm dersleri yönet, düzenle ve analiz et</p>
        </div>
        <div className="header-right">
          <button 
            className="header-btn primary"
            onClick={() => setShowNewLessonForm(true)}
          >
            ➕ Yeni Ders
          </button>
          <button className="header-btn">
            📥 İçe Aktar
          </button>
          <button className="header-btn">
            📤 Dışa Aktar
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="management-nav">
        <button 
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          📊 Genel Bakış
        </button>
        <button 
          className={`nav-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          📋 Ders Listesi
        </button>
        <button 
          className={`nav-btn ${activeView === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveView('schedule')}
        >
          📅 Takvim
        </button>
        <button 
          className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          📈 Analitik
        </button>
      </div>

      {/* Content */}
      <div className="management-content">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'list' && renderLessonList()}
        {activeView === 'detail' && renderLessonDetail()}
        {activeView === 'schedule' && renderSchedule()}
        {activeView === 'analytics' && renderAnalytics()}
      </div>

      {/* Modals */}
      {showNewLessonForm && renderNewLessonForm()}
      {showAIAssistant && renderAIAssistant()}
    </div>
  );
};

export default AdminLessonManagement;