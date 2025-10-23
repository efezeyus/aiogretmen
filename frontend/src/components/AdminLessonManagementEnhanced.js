import React, { useState } from 'react';
import './AdminLessonManagementEnhanced.css';

const AdminLessonManagementEnhanced = () => {
  const [activeView, setActiveView] = useState('lessons');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [lessons, setLessons] = useState([
    {
      id: 1,
      title: '5. Sınıf Matematik - Kesirler',
      subject: 'Matematik',
      grade: 5,
      duration: 45,
      difficulty: 'medium',
      status: 'published',
      aiEnabled: true,
      students: 234,
      completionRate: 78,
      rating: 4.8,
      lastUpdated: '2024-12-20',
      content: {
        videos: 3,
        documents: 5,
        quizzes: 2,
        activities: 4
      }
    },
    {
      id: 2,
      title: '7. Sınıf Fen - Hücre ve Bölünmeler',
      subject: 'Fen Bilimleri',
      grade: 7,
      duration: 60,
      difficulty: 'hard',
      status: 'published',
      aiEnabled: true,
      students: 189,
      completionRate: 65,
      rating: 4.6,
      lastUpdated: '2024-12-19',
      content: {
        videos: 4,
        documents: 6,
        quizzes: 3,
        activities: 5
      }
    },
    {
      id: 3,
      title: '6. Sınıf İngilizce - Present Continuous',
      subject: 'İngilizce',
      grade: 6,
      duration: 40,
      difficulty: 'easy',
      status: 'draft',
      aiEnabled: false,
      students: 0,
      completionRate: 0,
      rating: 0,
      lastUpdated: '2024-12-21',
      content: {
        videos: 2,
        documents: 3,
        quizzes: 1,
        activities: 3
      }
    }
  ]);

  const [lessonTemplates] = useState([
    {
      id: 1,
      name: 'Standart Ders Şablonu',
      description: 'Video, doküman, quiz ve aktivitelerle standart ders yapısı',
      structure: ['Giriş', 'Ana İçerik', 'Alıştırmalar', 'Quiz', 'Özet']
    },
    {
      id: 2,
      name: 'İnteraktif Atölye',
      description: 'Yüksek etkileşimli, aktivite odaklı ders yapısı',
      structure: ['Isınma', 'Keşif', 'Uygulama', 'Paylaşım', 'Değerlendirme']
    },
    {
      id: 3,
      name: 'Problem Çözme',
      description: 'Problem odaklı öğrenme için optimize edilmiş',
      structure: ['Problem Tanıtımı', 'Analiz', 'Çözüm Geliştirme', 'Test', 'Yansıtma']
    }
  ]);

  const [aiFeatures] = useState({
    contentGeneration: true,
    autoQuiz: true,
    personalizedPath: true,
    realTimeAdaptation: true,
    emotionDetection: true,
    voiceAssistant: true
  });

  const grades = Array.from({ length: 12 }, (_, i) => i + 1);
  const subjects = ['Matematik', 'Fen Bilimleri', 'Türkçe', 'İngilizce', 'Sosyal Bilgiler', 'Din Kültürü'];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#666';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#4caf50';
      case 'draft': return '#ff9800';
      case 'archived': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Yayında';
      case 'draft': return 'Taslak';
      case 'archived': return 'Arşivde';
      default: return '';
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesGrade = filterGrade === 'all' || lesson.grade === parseInt(filterGrade);
    const matchesSubject = filterSubject === 'all' || lesson.subject === filterSubject;
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSubject && matchesSearch;
  });

  const handleCreateLesson = (lessonData) => {
    const newLesson = {
      id: Date.now(),
      ...lessonData,
      students: 0,
      completionRate: 0,
      rating: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      content: {
        videos: 0,
        documents: 0,
        quizzes: 0,
        activities: 0
      }
    };
    setLessons([...lessons, newLesson]);
    setShowCreateModal(false);
  };

  const handleDeleteLesson = (lessonId) => {
    if (window.confirm('Bu dersi silmek istediğinizden emin misiniz?')) {
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    }
  };

  const handleDuplicateLesson = (lesson) => {
    const duplicatedLesson = {
      ...lesson,
      id: Date.now(),
      title: `${lesson.title} (Kopya)`,
      status: 'draft',
      students: 0,
      completionRate: 0,
      rating: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setLessons([...lessons, duplicatedLesson]);
  };

  return (
    <div className="admin-lesson-management-enhanced">
      {/* Header */}
      <div className="lesson-header">
        <div className="header-left">
          <h2>📚 Ders Yönetimi</h2>
          <p>Ders içerikleri, müfredat ve AI entegrasyonu</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Yeni Ders Oluştur
          </button>
          <button className="btn-import">
            📥 İçe Aktar
          </button>
          <button className="btn-export">
            📤 Dışa Aktar
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="lesson-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{lessons.length}</div>
            <div className="stat-label">Toplam Ders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{lessons.filter(l => l.status === 'published').length}</div>
            <div className="stat-label">Yayında</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{lessons.reduce((sum, l) => sum + l.students, 0)}</div>
            <div className="stat-label">Toplam Öğrenci</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">
              {(lessons.filter(l => l.rating > 0).reduce((sum, l) => sum + l.rating, 0) / 
                lessons.filter(l => l.rating > 0).length || 0).toFixed(1)}
            </div>
            <div className="stat-label">Ortalama Puan</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{lessons.filter(l => l.aiEnabled).length}</div>
            <div className="stat-label">AI Destekli</div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${activeView === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveView('lessons')}
        >
          📚 Dersler
        </button>
        <button
          className={`view-tab ${activeView === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveView('curriculum')}
        >
          🎯 Müfredat
        </button>
        <button
          className={`view-tab ${activeView === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveView('templates')}
        >
          📋 Şablonlar
        </button>
        <button
          className={`view-tab ${activeView === 'ai-settings' ? 'active' : ''}`}
          onClick={() => setActiveView('ai-settings')}
        >
          🤖 AI Ayarları
        </button>
      </div>

      {/* Content */}
      <div className="lesson-content">
        {activeView === 'lessons' && (
          <>
            {/* Filters */}
            <div className="lesson-filters">
              <input
                type="text"
                placeholder="🔍 Ders ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tüm Sınıflar</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}. Sınıf</option>
                ))}
              </select>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tüm Dersler</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <button className="filter-btn">
                🔧 Gelişmiş Filtreler
              </button>
            </div>

            {/* Lessons Grid */}
            <div className="lessons-grid">
              {filteredLessons.map(lesson => (
                <div key={lesson.id} className="lesson-card">
                  <div className="lesson-header">
                    <h3>{lesson.title}</h3>
                    <div className="lesson-badges">
                      <span 
                        className="badge status"
                        style={{ backgroundColor: getStatusColor(lesson.status) }}
                      >
                        {getStatusLabel(lesson.status)}
                      </span>
                      {lesson.aiEnabled && (
                        <span className="badge ai">🤖 AI</span>
                      )}
                    </div>
                  </div>

                  <div className="lesson-meta">
                    <span className="meta-item">
                      <span className="icon">🎓</span>
                      {lesson.grade}. Sınıf
                    </span>
                    <span className="meta-item">
                      <span className="icon">📖</span>
                      {lesson.subject}
                    </span>
                    <span className="meta-item">
                      <span className="icon">⏱️</span>
                      {lesson.duration} dk
                    </span>
                    <span 
                      className="meta-item difficulty"
                      style={{ color: getDifficultyColor(lesson.difficulty) }}
                    >
                      <span className="icon">📊</span>
                      {getDifficultyLabel(lesson.difficulty)}
                    </span>
                  </div>

                  <div className="lesson-content-info">
                    <div className="content-item">
                      <span className="icon">🎥</span>
                      <span>{lesson.content.videos} Video</span>
                    </div>
                    <div className="content-item">
                      <span className="icon">📄</span>
                      <span>{lesson.content.documents} Doküman</span>
                    </div>
                    <div className="content-item">
                      <span className="icon">📝</span>
                      <span>{lesson.content.quizzes} Quiz</span>
                    </div>
                    <div className="content-item">
                      <span className="icon">🎮</span>
                      <span>{lesson.content.activities} Aktivite</span>
                    </div>
                  </div>

                  <div className="lesson-stats">
                    <div className="stat">
                      <span className="stat-label">Öğrenci</span>
                      <span className="stat-value">{lesson.students}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Tamamlanma</span>
                      <span className="stat-value">{lesson.completionRate}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Puan</span>
                      <span className="stat-value">⭐ {lesson.rating || '-'}</span>
                    </div>
                  </div>

                  <div className="lesson-progress">
                    <div 
                      className="progress-bar"
                      style={{ width: `${lesson.completionRate}%` }}
                    ></div>
                  </div>

                  <div className="lesson-actions">
                    <button 
                      className="btn-action edit"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      ✏️ Düzenle
                    </button>
                    <button 
                      className="btn-action preview"
                      onClick={() => window.open(`/lesson-preview/${lesson.id}`, '_blank')}
                    >
                      👁️ Önizle
                    </button>
                    <button 
                      className="btn-action duplicate"
                      onClick={() => handleDuplicateLesson(lesson)}
                    >
                      📋 Kopyala
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      🗑️ Sil
                    </button>
                  </div>

                  <div className="lesson-footer">
                    <span className="update-time">
                      Son güncelleme: {lesson.lastUpdated}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeView === 'curriculum' && (
          <div className="curriculum-view">
            <h3>🎯 MEB Müfredatı Eşleştirme</h3>
            <div className="curriculum-mapper">
              <div className="mapper-sidebar">
                <h4>Sınıf Seçimi</h4>
                {grades.map(grade => (
                  <button key={grade} className="grade-btn">
                    {grade}. Sınıf
                  </button>
                ))}
              </div>
              <div className="mapper-content">
                <h4>Kazanımlar ve Ders Eşleştirmeleri</h4>
                <div className="achievement-list">
                  <div className="achievement-item">
                    <input type="checkbox" checked readOnly />
                    <span className="achievement-code">M.5.1.1</span>
                    <span className="achievement-text">
                      Doğal sayılarla dört işlem yapar
                    </span>
                    <span className="linked-lesson">
                      ✅ 5. Sınıf Matematik - Doğal Sayılar
                    </span>
                  </div>
                  <div className="achievement-item">
                    <input type="checkbox" />
                    <span className="achievement-code">M.5.1.2</span>
                    <span className="achievement-text">
                      Kesirlerle toplama ve çıkarma işlemi yapar
                    </span>
                    <span className="linked-lesson unlinked">
                      ❌ Ders bağlantısı yok
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'templates' && (
          <div className="templates-view">
            <h3>📋 Ders Şablonları</h3>
            <div className="templates-grid">
              {lessonTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-structure">
                    <h5>Yapı:</h5>
                    <ol>
                      {template.structure.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <button className="btn-use-template">
                    Şablonu Kullan
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-create-template">
              ➕ Yeni Şablon Oluştur
            </button>
          </div>
        )}

        {activeView === 'ai-settings' && (
          <div className="ai-settings-view">
            <h3>🤖 AI Özellik Ayarları</h3>
            <div className="ai-features-grid">
              <div className="ai-feature-card">
                <div className="feature-header">
                  <h4>🎯 İçerik Üretimi</h4>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={aiFeatures.contentGeneration}
                      readOnly
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p>AI ile otomatik ders içeriği oluşturma</p>
                <div className="feature-options">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Özet oluştur
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Örnek sorular üret
                  </label>
                  <label>
                    <input type="checkbox" />
                    Video transkripsiyonu
                  </label>
                </div>
              </div>

              <div className="ai-feature-card">
                <div className="feature-header">
                  <h4>📝 Otomatik Quiz</h4>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={aiFeatures.autoQuiz}
                      readOnly
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p>Ders içeriğinden otomatik quiz oluşturma</p>
                <div className="feature-options">
                  <select defaultValue="medium">
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                  <input 
                    type="number" 
                    defaultValue="10" 
                    min="5" 
                    max="50"
                    placeholder="Soru sayısı"
                  />
                </div>
              </div>

              <div className="ai-feature-card">
                <div className="feature-header">
                  <h4>🛤️ Kişisel Öğrenme Yolu</h4>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={aiFeatures.personalizedPath}
                      readOnly
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p>Her öğrenci için özel öğrenme rotası</p>
                <div className="feature-options">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Hız adaptasyonu
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Zorluk ayarlaması
                  </label>
                  <label>
                    <input type="checkbox" />
                    İlgi alanı analizi
                  </label>
                </div>
              </div>

              <div className="ai-feature-card">
                <div className="feature-header">
                  <h4>⚡ Gerçek Zamanlı Adaptasyon</h4>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={aiFeatures.realTimeAdaptation}
                      readOnly
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p>Öğrenci performansına göre anlık uyarlama</p>
              </div>

              <div className="ai-feature-card">
                <div className="feature-header">
                  <h4>😊 Duygu Analizi</h4>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={aiFeatures.emotionDetection}
                      readOnly
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p>Öğrenci duygularını anlama ve motivasyon</p>
              </div>

              <div className="ai-feature-card">
                <div className="feature-header">
                  <h4>🎙️ Sesli Asistan</h4>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={aiFeatures.voiceAssistant}
                      readOnly
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p>Sesli komut ve yanıt desteği</p>
              </div>
            </div>

            <div className="ai-model-selection">
              <h4>AI Model Seçimi</h4>
              <div className="model-options">
                <label className="model-option">
                  <input type="radio" name="ai-model" value="deepseek" defaultChecked />
                  <span className="model-info">
                    <strong>DeepSeek</strong>
                    <small>Hızlı ve etkili, Türkçe desteği mükemmel</small>
                  </span>
                </label>
                <label className="model-option">
                  <input type="radio" name="ai-model" value="gpt4" />
                  <span className="model-info">
                    <strong>GPT-4</strong>
                    <small>En gelişmiş, yaratıcı içerik üretimi</small>
                  </span>
                </label>
                <label className="model-option">
                  <input type="radio" name="ai-model" value="claude" />
                  <span className="model-info">
                    <strong>Claude 3</strong>
                    <small>Analitik düşünme, detaylı açıklamalar</small>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📚 Yeni Ders Oluştur</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateLesson({
                  title: formData.get('title'),
                  subject: formData.get('subject'),
                  grade: parseInt(formData.get('grade')),
                  duration: parseInt(formData.get('duration')),
                  difficulty: formData.get('difficulty'),
                  status: 'draft',
                  aiEnabled: formData.get('aiEnabled') === 'on'
                });
              }}>
                <div className="form-group">
                  <label>Ders Başlığı</label>
                  <input 
                    type="text" 
                    name="title"
                    placeholder="Örn: 5. Sınıf Matematik - Kesirler"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ders</label>
                    <select name="subject" required>
                      <option value="">Seçiniz</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sınıf</label>
                    <select name="grade" required>
                      <option value="">Seçiniz</option>
                      {grades.map(grade => (
                        <option key={grade} value={grade}>{grade}. Sınıf</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Süre (dakika)</label>
                    <input 
                      type="number" 
                      name="duration"
                      min="15" 
                      max="120" 
                      defaultValue="45"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Zorluk</label>
                    <select name="difficulty" required>
                      <option value="easy">Kolay</option>
                      <option value="medium">Orta</option>
                      <option value="hard">Zor</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="aiEnabled" defaultChecked />
                    <span>AI Desteği Aktif</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Ders Oluştur
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLessonManagementEnhanced;
