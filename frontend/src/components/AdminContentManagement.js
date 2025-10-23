import React, { useState, useEffect } from 'react';
import './AdminContentManagement.css';

const AdminContentManagement = () => {
  const [activeView, setActiveView] = useState('library');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  const [contents, setContents] = useState([
    {
      id: 1,
      title: '5. Sınıf Matematik - Kesirler PDF',
      type: 'pdf',
      category: 'document',
      subject: 'Matematik',
      grade: '5. Sınıf',
      size: '2.4 MB',
      uploadDate: '2025-01-01T10:00:00Z',
      uploadedBy: 'Admin',
      downloads: 234,
      views: 567,
      status: 'active',
      tags: ['matematik', 'kesirler', '5.sınıf']
    },
    {
      id: 2,
      title: 'Fotosintez Animasyonu',
      type: 'video',
      category: 'video',
      subject: 'Fen Bilimleri',
      grade: '6. Sınıf',
      size: '45.8 MB',
      duration: '5:23',
      uploadDate: '2024-12-28T14:30:00Z',
      uploadedBy: 'Ayşe Öğretmen',
      downloads: 156,
      views: 423,
      status: 'active',
      tags: ['fen', 'fotosintez', 'animasyon']
    },
    {
      id: 3,
      title: 'İngilizce Telaffuz Ses Kaydı',
      type: 'audio',
      category: 'audio',
      subject: 'İngilizce',
      grade: '7. Sınıf',
      size: '3.2 MB',
      duration: '8:45',
      uploadDate: '2024-12-25T09:15:00Z',
      uploadedBy: 'John Teacher',
      downloads: 89,
      views: 234,
      status: 'active',
      tags: ['ingilizce', 'telaffuz', 'ses']
    }
  ]);

  const [contentStats] = useState({
    totalContent: 342,
    totalSize: '12.4 GB',
    totalDownloads: 45678,
    activeContent: 298,
    pendingApproval: 23
  });

  const [newContent, setNewContent] = useState({
    title: '',
    type: '',
    category: '',
    subject: '',
    grade: '',
    description: '',
    tags: [],
    file: null
  });

  const contentCategories = [
    { value: 'all', label: 'Tümü', icon: '📁' },
    { value: 'document', label: 'Dokümanlar', icon: '📄' },
    { value: 'video', label: 'Videolar', icon: '🎥' },
    { value: 'audio', label: 'Ses Dosyaları', icon: '🎵' },
    { value: 'image', label: 'Görseller', icon: '🖼️' },
    { value: 'interactive', label: 'İnteraktif', icon: '🎮' },
    { value: 'presentation', label: 'Sunumlar', icon: '📊' }
  ];

  const subjects = [
    'Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 
    'İngilizce', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya'
  ];

  const grades = [
    '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf',
    '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf',
    '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'
  ];

  const filteredContents = contents.filter(content => {
    const matchesCategory = selectedCategory === 'all' || content.category === selectedCategory;
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUpload = () => {
    if (!newContent.title || !newContent.subject || !newContent.grade) {
      alert('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const content = {
      ...newContent,
      id: Date.now(),
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Admin',
      downloads: 0,
      views: 0,
      status: 'pending',
      size: newContent.file ? `${(newContent.file.size / 1024 / 1024).toFixed(1)} MB` : '0 MB'
    };

    setContents([content, ...contents]);
    setShowUploadModal(false);
    setNewContent({
      title: '',
      type: '',
      category: '',
      subject: '',
      grade: '',
      description: '',
      tags: [],
      file: null
    });
  };

  const handleDeleteContent = (id) => {
    if (window.confirm('Bu içeriği silmek istediğinizden emin misiniz?')) {
      setContents(contents.filter(c => c.id !== id));
    }
  };

  const handleApproveContent = (id) => {
    setContents(contents.map(c => 
      c.id === id ? { ...c, status: 'active' } : c
    ));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'ppt': return '📊';
      case 'interactive': return '🎮';
      default: return '📁';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="admin-content-management">
      {/* Header */}
      <div className="content-header">
        <div className="header-left">
          <h2>📚 İçerik Yönetimi</h2>
          <p>Eğitim materyalleri ve dijital içerikler</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-upload"
            onClick={() => setShowUploadModal(true)}
          >
            ⬆️ İçerik Yükle
          </button>
          <button className="btn-bulk">
            📦 Toplu İşlem
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="content-stats">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{contentStats.totalContent}</div>
            <div className="stat-label">Toplam İçerik</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <div className="stat-value">{contentStats.totalSize}</div>
            <div className="stat-label">Toplam Boyut</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬇️</div>
          <div className="stat-content">
            <div className="stat-value">{contentStats.totalDownloads.toLocaleString('tr-TR')}</div>
            <div className="stat-label">Toplam İndirme</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{contentStats.activeContent}</div>
            <div className="stat-label">Aktif İçerik</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{contentStats.pendingApproval}</div>
            <div className="stat-label">Onay Bekliyor</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="content-filters">
        <div className="filter-categories">
          {contentCategories.map(category => (
            <button
              key={category.value}
              className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.value)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>
        
        <div className="filter-search">
          <input
            type="text"
            placeholder="🔍 İçerik ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Content Views */}
      <div className="content-views">
        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'library' ? 'active' : ''}`}
            onClick={() => setActiveView('library')}
          >
            📚 Kütüphane
          </button>
          <button
            className={`view-tab ${activeView === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveView('pending')}
          >
            ⏳ Onay Bekleyenler
          </button>
          <button
            className={`view-tab ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          >
            📊 Raporlar
          </button>
        </div>

        {activeView === 'library' && (
          <div className="content-library">
            <div className="content-grid">
              {filteredContents.map(content => (
                <div key={content.id} className="content-card">
                  <div className="content-type-badge">
                    {getTypeIcon(content.type)}
                  </div>
                  
                  <div className="content-info">
                    <h3>{content.title}</h3>
                    <div className="content-meta">
                      <span>📚 {content.subject}</span>
                      <span>🎓 {content.grade}</span>
                    </div>
                    <div className="content-stats-row">
                      <span>💾 {content.size}</span>
                      {content.duration && <span>⏱️ {content.duration}</span>}
                    </div>
                    <div className="content-tags">
                      {content.tags.map((tag, index) => (
                        <span key={index} className="tag">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="content-footer">
                    <div className="content-metrics">
                      <span>👁️ {content.views}</span>
                      <span>⬇️ {content.downloads}</span>
                    </div>
                    <div className="content-actions">
                      <button
                        className="action-btn preview"
                        onClick={() => {
                          setSelectedContent(content);
                          setShowContentModal(true);
                        }}
                        title="Önizle"
                      >
                        👁️
                      </button>
                      <button
                        className="action-btn download"
                        title="İndir"
                      >
                        ⬇️
                      </button>
                      <button
                        className="action-btn edit"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteContent(content.id)}
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {content.status === 'pending' && (
                    <div className="pending-badge">Onay Bekliyor</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'pending' && (
          <div className="pending-contents">
            <div className="pending-list">
              {contents.filter(c => c.status === 'pending').map(content => (
                <div key={content.id} className="pending-item">
                  <div className="pending-icon">
                    {getTypeIcon(content.type)}
                  </div>
                  
                  <div className="pending-info">
                    <h4>{content.title}</h4>
                    <div className="pending-meta">
                      <span>📚 {content.subject}</span>
                      <span>🎓 {content.grade}</span>
                      <span>👤 {content.uploadedBy}</span>
                      <span>📅 {formatDate(content.uploadDate)}</span>
                    </div>
                  </div>

                  <div className="pending-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApproveContent(content.id)}
                    >
                      ✅ Onayla
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleDeleteContent(content.id)}
                    >
                      ❌ Reddet
                    </button>
                  </div>
                </div>
              ))}
              
              {contents.filter(c => c.status === 'pending').length === 0 && (
                <div className="empty-state">
                  <p>✅ Onay bekleyen içerik bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'reports' && (
          <div className="content-reports">
            <div className="reports-grid">
              <div className="report-card">
                <h3>📊 En Popüler İçerikler</h3>
                <div className="report-list">
                  {contents
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((content, index) => (
                      <div key={content.id} className="report-item">
                        <span className="rank">{index + 1}</span>
                        <span className="title">{content.title}</span>
                        <span className="metric">{content.views} görüntüleme</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="report-card">
                <h3>⬇️ En Çok İndirilenler</h3>
                <div className="report-list">
                  {contents
                    .sort((a, b) => b.downloads - a.downloads)
                    .slice(0, 5)
                    .map((content, index) => (
                      <div key={content.id} className="report-item">
                        <span className="rank">{index + 1}</span>
                        <span className="title">{content.title}</span>
                        <span className="metric">{content.downloads} indirme</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="report-card">
                <h3>📈 İçerik Dağılımı</h3>
                <div className="content-distribution">
                  {contentCategories.slice(1).map(category => {
                    const count = contents.filter(c => c.category === category.value).length;
                    const percentage = (count / contents.length * 100).toFixed(1);
                    return (
                      <div key={category.value} className="distribution-item">
                        <div className="distribution-header">
                          <span>{category.icon} {category.label}</span>
                          <span>{count}</span>
                        </div>
                        <div className="distribution-bar">
                          <div 
                            className="bar-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>İçerik Yükle</h3>
              <button
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  className="file-input"
                  onChange={(e) => setNewContent({...newContent, file: e.target.files[0]})}
                  hidden
                />
                <label htmlFor="file-upload" className="upload-label">
                  <div className="upload-icon">📁</div>
                  <p>Dosya seçmek için tıklayın veya sürükleyin</p>
                  {newContent.file && (
                    <p className="file-name">📎 {newContent.file.name}</p>
                  )}
                </label>
              </div>

              <div className="form-group">
                <label>Başlık *</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  placeholder="İçerik başlığı..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ders *</label>
                  <select
                    value={newContent.subject}
                    onChange={(e) => setNewContent({...newContent, subject: e.target.value})}
                  >
                    <option value="">Ders seçin</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sınıf *</label>
                  <select
                    value={newContent.grade}
                    onChange={(e) => setNewContent({...newContent, grade: e.target.value})}
                  >
                    <option value="">Sınıf seçin</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  placeholder="İçerik açıklaması..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Etiketler</label>
                <input
                  type="text"
                  placeholder="Virgülle ayırarak etiket girin..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                      setNewContent({...newContent, tags});
                      e.target.value = '';
                    }
                  }}
                />
                <div className="tag-list">
                  {newContent.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                      <button
                        onClick={() => {
                          const newTags = newContent.tags.filter((_, i) => i !== index);
                          setNewContent({...newContent, tags: newTags});
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowUploadModal(false)}
              >
                İptal
              </button>
              <button
                className="btn-upload-submit"
                onClick={handleUpload}
              >
                ⬆️ Yükle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview Modal */}
      {showContentModal && selectedContent && (
        <div className="modal-overlay">
          <div className="preview-modal">
            <div className="modal-header">
              <h3>{selectedContent.title}</h3>
              <button
                className="modal-close"
                onClick={() => setShowContentModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="preview-container">
                <div className="preview-icon">
                  {getTypeIcon(selectedContent.type)}
                </div>
                <div className="preview-info">
                  <div className="info-row">
                    <span className="info-label">Ders:</span>
                    <span className="info-value">{selectedContent.subject}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Sınıf:</span>
                    <span className="info-value">{selectedContent.grade}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Boyut:</span>
                    <span className="info-value">{selectedContent.size}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Yükleyen:</span>
                    <span className="info-value">{selectedContent.uploadedBy}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tarih:</span>
                    <span className="info-value">{formatDate(selectedContent.uploadDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-download"
                onClick={() => console.log('İndiriliyor...', selectedContent)}
              >
                ⬇️ İndir
              </button>
              <button
                className="btn-close"
                onClick={() => setShowContentModal(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentManagement;
