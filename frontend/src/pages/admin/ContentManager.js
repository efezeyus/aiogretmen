import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './ContentManager.css';

const ContentManager = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [curriculumSummary, setCurriculumSummary] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    lessons: 0,
    quizzes: 0,
    videos: 0,
    documents: 0,
    curriculum_items: 0,
    structures: 0
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      
      // Tüm sınıflar için içerikleri al
      const allContents = [];
      
      // Detaylı müfredat olan sınıflar: 1, 5, 9
      const detailedGrades = [1, 5, 9];
      
      for (const grade of detailedGrades) {
        try {
          const gradeResponse = await apiService.get(`/curriculum/meb/grade/${grade}/detailed`);
          
          if (gradeResponse) {
            // Her ders için içerik oluştur
            Object.keys(gradeResponse).forEach((subjectKey) => {
              const subject = gradeResponse[subjectKey];
              
              if (subject.learning_areas) {
                subject.learning_areas.forEach((learningArea) => {
                  learningArea.units.forEach((unit) => {
                    allContents.push({
                      id: `${grade}_${subjectKey}_${unit.id}`,
                      title: `${grade}. Sınıf ${subject.subject_name} - ${unit.title}`,
                      type: 'lesson',
                      grade: grade,
                      subject: subject.subject_name,
                      status: 'published',
                      author: 'MEB Müfredatı - AI Öğretmen',
                      views: 0,
                      topics_count: unit.topics?.length || 0,
                      estimated_hours: unit.estimated_hours || 0,
                      description: unit.description || '',
                      learning_area: learningArea.name,
                      created_at: '2024-10-01',
                      updated_at: '2024-10-01',
                      is_curriculum: true
                    });
                  });
                });
              }
            });
          }
        } catch (error) {
          console.error(`Sınıf ${grade} verileri alınamadı:`, error);
        }
      }
      
      // Diğer sınıflar için yapısal bilgileri göster
      const otherGrades = [2, 3, 4, 6, 7, 8, 10, 11, 12];
      
      for (const grade of otherGrades) {
        try {
          const subjectsResponse = await apiService.get(`/curriculum/meb/grade/${grade}/subjects`);
          
          if (subjectsResponse && Array.isArray(subjectsResponse)) {
            subjectsResponse.forEach((subject) => {
              allContents.push({
                id: `${grade}_${subject.key}_structure`,
                title: `${grade}. Sınıf ${subject.name}`,
                type: 'structure',
                grade: grade,
                subject: subject.name,
                status: 'draft',
                author: 'MEB Yapısal Tanım',
                views: 0,
                weekly_hours: subject.weekly_hours,
                description: subject.description || '',
                created_at: '2024-10-01',
                updated_at: '2024-10-01',
                is_structure: true
              });
            });
          }
        } catch (error) {
          console.error(`Sınıf ${grade} yapısı alınamadı:`, error);
        }
      }
      
      setContents(allContents);
      calculateStats(allContents);
    } catch (error) {
      console.error('İçerik yükleme hatası:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (contentList) => {
    setStats({
      total: contentList.length,
      lessons: contentList.filter(c => c.type === 'lesson').length,
      quizzes: contentList.filter(c => c.type === 'quiz').length,
      videos: contentList.filter(c => c.type === 'video').length,
      documents: contentList.filter(c => c.type === 'document').length,
      curriculum_items: contentList.filter(c => c.is_curriculum === true).length,
      structures: contentList.filter(c => c.is_structure === true).length
    });
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || content.type === filterType;
    const matchesGrade = filterGrade === 'all' || content.grade.toString() === filterGrade;
    return matchesSearch && matchesType && matchesGrade;
  });

  const handleViewContent = (content) => {
    setSelectedContent(content);
    setShowModal(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
    
    try {
      await apiService.delete(`/admin/content/${contentId}`);
      fetchContents();
      alert('İçerik silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('İçerik silinemedi');
    }
  };

  const handleToggleStatus = async (contentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await apiService.patch(`/admin/content/${contentId}/status`, { status: newStatus });
      fetchContents();
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      alert('Durum değiştirilemedi');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      lesson: '📚',
      quiz: '📝',
      video: '🎥',
      document: '📄',
      structure: '🏗️'
    };
    return icons[type] || '📄';
  };

  const getTypeBadge = (type) => {
    const badges = {
      lesson: { text: 'Ders', class: 'badge-lesson' },
      quiz: { text: 'Quiz', class: 'badge-quiz' },
      video: { text: 'Video', class: 'badge-video' },
      document: { text: 'Doküman', class: 'badge-document' },
      structure: { text: 'Yapı', class: 'badge-structure' }
    };
    const badge = badges[type] || badges.document;
    return (
      <span className={`type-badge ${badge.class}`}>
        {getTypeIcon(type)} {badge.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status === 'published' ? 'published' : 'draft'}`}>
        {status === 'published' ? '✅ Yayında' : '📝 Taslak'}
      </span>
    );
  };

  return (
    <div className="content-manager">
      <div className="page-header">
        <h1>📚 İçerik Yönetimi</h1>
        <button className="btn btn-primary" onClick={() => {
          setSelectedContent(null);
          setShowModal(true);
        }}>
          + Yeni İçerik Ekle
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Toplam İçerik</p>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>{stats.curriculum_items}</h3>
            <p>MEB Müfredatı</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.lessons}</h3>
            <p>Dersler</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-content">
            <h3>{stats.structures}</h3>
            <p>Yapı Tanımları</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.quizzes}</h3>
            <p>Quizler</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎥</div>
          <div className="stat-content">
            <h3>{stats.videos}</h3>
            <p>Videolar</p>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="filters">
        <input
          type="text"
          placeholder="🔍 İçerik ara (başlık, ders)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tüm Tipler</option>
          <option value="lesson">Dersler</option>
          <option value="quiz">Quizler</option>
          <option value="video">Videolar</option>
          <option value="document">Dokümanlar</option>
        </select>
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tüm Sınıflar</option>
          {[2,3,4,5,6,7,8,9,10,11,12].map(grade => (
            <option key={grade} value={grade}>{grade}. Sınıf</option>
          ))}
        </select>
      </div>

      {/* İçerik Tablosu */}
      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : (
        <div className="contents-table-container">
          <table className="contents-table">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Tip</th>
                <th>Sınıf</th>
                <th>Ders</th>
                <th>Durum</th>
                <th>Görüntüleme</th>
                <th>Son Güncelleme</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredContents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    İçerik bulunamadı
                  </td>
                </tr>
              ) : (
                filteredContents.map(content => (
                  <tr key={content.id}>
                    <td>
                      <div className="content-title">
                        <span className="title-icon">{getTypeIcon(content.type)}</span>
                        <span>{content.title}</span>
                      </div>
                    </td>
                    <td>{getTypeBadge(content.type)}</td>
                    <td>{content.grade}. Sınıf</td>
                    <td>{content.subject}</td>
                    <td>{getStatusBadge(content.status)}</td>
                    <td>{content.views.toLocaleString()}</td>
                    <td>{new Date(content.updated_at).toLocaleDateString('tr-TR')}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleViewContent(content)}
                        title="Görüntüle"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleToggleStatus(content.id, content.status)}
                        title={content.status === 'published' ? 'Taslağa Al' : 'Yayınla'}
                      >
                        {content.status === 'published' ? '📝' : '✅'}
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDeleteContent(content.id)}
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* İçerik Detay/Ekleme Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedContent ? 'İçerik Detayları' : 'Yeni İçerik Ekle'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedContent ? (
                // Detay görünümü
                <div className="content-detail-grid">
                  <div className="detail-item">
                    <label>Başlık:</label>
                    <span>{selectedContent.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>Tip:</label>
                    <span>{getTypeBadge(selectedContent.type)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sınıf:</label>
                    <span>{selectedContent.grade}. Sınıf</span>
                  </div>
                  <div className="detail-item">
                    <label>Ders:</label>
                    <span>{selectedContent.subject}</span>
                  </div>
                  <div className="detail-item">
                    <label>Durum:</label>
                    <span>{getStatusBadge(selectedContent.status)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Yazar:</label>
                    <span>{selectedContent.author}</span>
                  </div>
                  <div className="detail-item">
                    <label>Görüntülenme:</label>
                    <span>{selectedContent.views.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Oluşturulma:</label>
                    <span>{new Date(selectedContent.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="detail-item">
                    <label>Son Güncelleme:</label>
                    <span>{new Date(selectedContent.updated_at).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ) : (
                // Yeni içerik formu
                <div className="content-form">
                  <div className="form-group">
                    <label>Başlık *</label>
                    <input type="text" placeholder="İçerik başlığı" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tip *</label>
                      <select>
                        <option value="lesson">Ders</option>
                        <option value="quiz">Quiz</option>
                        <option value="video">Video</option>
                        <option value="document">Doküman</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sınıf *</label>
                      <select>
                        {[2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                          <option key={grade} value={grade}>{grade}. Sınıf</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ders *</label>
                      <select>
                        <option>Matematik</option>
                        <option>Türkçe</option>
                        <option>Fen Bilimleri</option>
                        <option>Sosyal Bilgiler</option>
                        <option>İngilizce</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>İçerik</label>
                    <textarea rows="10" placeholder="İçerik metni..."></textarea>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      İptal
                    </button>
                    <button className="btn btn-primary">
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
