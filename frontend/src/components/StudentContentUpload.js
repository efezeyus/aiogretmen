import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './StudentContentUpload.css';

const StudentContentUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentCategory, setCurrentCategory] = useState('homework');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMetadata, setUploadMetadata] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    tags: [],
    priority: 'medium'
  });

  const fileInputRef = useRef(null);

  // Desteklenen dosya türleri
  const supportedTypes = {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
    presentations: ['.ppt', '.pptx', '.odp'],
    spreadsheets: ['.xls', '.xlsx', '.ods', '.csv'],
    archives: ['.zip', '.rar', '.7z']
  };

  const categories = [
    { id: 'homework', name: 'Ödevler', icon: '📝', color: '#4CAF50' },
    { id: 'projects', name: 'Projeler', icon: '🎯', color: '#2196F3' },
    { id: 'presentations', name: 'Sunumlar', icon: '📊', color: '#FF9800' },
    { id: 'research', name: 'Araştırmalar', icon: '🔍', color: '#9C27B0' },
    { id: 'notes', name: 'Notlar', icon: '📚', color: '#795548' },
    { id: 'other', name: 'Diğer', icon: '📎', color: '#607D8B' }
  ];

  const subjects = [
    'Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 
    'İngilizce', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya'
  ];

  // Drag & Drop işlemleri
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: getFileType(file.name),
      size: formatFileSize(file.size)
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const getFileType = (filename) => {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (supportedTypes.documents.includes(ext)) return 'document';
    if (supportedTypes.images.includes(ext)) return 'image';
    if (supportedTypes.videos.includes(ext)) return 'video';
    if (supportedTypes.presentations.includes(ext)) return 'presentation';
    if (supportedTypes.spreadsheets.includes(ext)) return 'spreadsheet';
    if (supportedTypes.archives.includes(ext)) return 'archive';
    return 'other';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    const icons = {
      document: '📄',
      image: '🖼️',
      video: '🎥',
      presentation: '📊',
      spreadsheet: '📈',
      archive: '📦',
      other: '📎'
    };
    return icons[type] || '📎';
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    
    // Dosyaları ekle
    selectedFiles.forEach((fileObj, index) => {
      formData.append(`files`, fileObj.file);
    });

    // Metadata ekle
    formData.append('metadata', JSON.stringify({
      ...uploadMetadata,
      category: currentCategory,
      uploadDate: new Date().toISOString(),
      studentId: localStorage.getItem('studentId') || 'demo-student'
    }));

    try {
      // Upload progress simülasyonu
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(prev => ({
          ...prev,
          overall: i
        }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Gerçek API çağrısı
      const response = await fetch('/api/student-content/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Backend'den gelen veriyi frontend formatına çevir
        const newUpload = {
          ...result.content,
          file: { name: result.content.title || 'Yüklenen Dosya' },
          size: result.content.files?.[0]?.file_size ? formatFileSize(result.content.files[0].file_size) : '0 KB',
          type: result.content.files?.[0]?.content_type?.startsWith('image/') ? 'image' : 'document',
          uploadDate: result.content.created_at
        };

        setUploadedFiles(prev => [...prev, newUpload]);
        setSelectedFiles([]);
        setShowUploadModal(false);
        setUploadMetadata({
          title: '',
          description: '',
          subject: '',
          dueDate: '',
          tags: [],
          priority: 'medium'
        });
        setUploadProgress({});

        // Başarı bildirimi
        alert('Dosyalar başarıyla yüklendi!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload hatası:', error);
      alert('Dosya yükleme sırasında bir hata oluştu.');
      setUploadProgress({});
    }
  };

  const addTag = (tag) => {
    if (tag && !uploadMetadata.tags.includes(tag)) {
      setUploadMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setUploadMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Mevcut dosyaları yükle
  useEffect(() => {
    const loadExistingFiles = async () => {
      try {
        const response = await fetch('/api/student-content/my-content', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const formattedFiles = result.contents.map(content => ({
            ...content,
            file: { name: content.title || 'Yüklenen Dosya' },
            size: content.files?.[0]?.file_size ? formatFileSize(content.files[0].file_size) : '0 KB',
            type: content.files?.[0]?.content_type?.startsWith('image/') ? 'image' : 'document',
            uploadDate: content.created_at
          }));
          setUploadedFiles(formattedFiles);
        }
      } catch (error) {
        console.error('Dosyalar yüklenirken hata:', error);
      }
    };

    loadExistingFiles();
  }, []);

  const filteredFiles = uploadedFiles.filter(file => 
    currentCategory === 'all' || file.category === currentCategory
  );

  return (
    <div className="student-content-upload">
      <div className="upload-header">
        <div className="header-left">
          <h2>📚 Ders İçeriklerim</h2>
          <p>Ödevlerinizi, projelerinizi ve notlarınızı yükleyin ve organize edin</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-upload-new"
            onClick={() => setShowUploadModal(true)}
          >
            <span className="icon">📤</span>
            Yeni Yükleme
          </button>
        </div>
      </div>

      {/* Kategori Seçimi */}
      <div className="category-tabs">
        <button 
          className={`category-tab ${currentCategory === 'all' ? 'active' : ''}`}
          onClick={() => setCurrentCategory('all')}
        >
          <span className="icon">📋</span>
          Tümü ({uploadedFiles.length})
        </button>
        {categories.map(category => (
          <button 
            key={category.id}
            className={`category-tab ${currentCategory === category.id ? 'active' : ''}`}
            onClick={() => setCurrentCategory(category.id)}
            style={{ '--category-color': category.color }}
          >
            <span className="icon">{category.icon}</span>
            {category.name} ({uploadedFiles.filter(f => f.category === category.id).length})
          </button>
        ))}
      </div>

      {/* Dosya Listesi */}
      <div className="files-grid">
        {filteredFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>Henüz dosya yüklenmemiş</h3>
            <p>İlk dosyanızı yüklemek için "Yeni Yükleme" butonuna tıklayın</p>
          </div>
        ) : (
          filteredFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-preview">
                {file.preview ? (
                  <img src={file.preview} alt={file.file.name} />
                ) : (
                  <div className="file-icon">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="file-overlay">
                  <button className="btn-icon" title="İndir">💾</button>
                  <button className="btn-icon" title="Paylaş">🔗</button>
                  <button className="btn-icon danger" title="Sil">🗑️</button>
                </div>
              </div>
              
              <div className="file-info">
                <h4>{file.title || file.file.name}</h4>
                <p className="file-meta">
                  <span className="subject">{file.subject}</span>
                  <span className="size">{file.size}</span>
                </p>
                <p className="file-description">{typeof file.description === 'string' ? file.description : JSON.stringify(file.description)}</p>
                
                {file.tags && file.tags.length > 0 && (
                  <div className="file-tags">
                    {file.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                
                <div className="file-footer">
                  <span className="upload-date">
                    {new Date(file.uploadDate).toLocaleDateString('tr-TR')}
                  </span>
                  <span className={`priority ${file.priority}`}>
                    {file.priority === 'high' ? '🔴' : file.priority === 'medium' ? '🟡' : '🟢'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>📤 Yeni Dosya Yükleme</h3>
              <button 
                className="btn-close"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {/* Dosya Seçimi */}
              <div className="upload-section">
                <h4>1. Dosya Seçimi</h4>
                <div 
                  {...getRootProps()} 
                  className={`dropzone ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <div className="upload-icon">📁</div>
                    <p>
                      {isDragActive 
                        ? 'Dosyaları buraya bırakın...' 
                        : 'Dosyaları sürükleyin veya tıklayın'
                      }
                    </p>
                    <small>PDF, Word, PowerPoint, Excel, resim ve video dosyaları desteklenir (Max: 50MB)</small>
                  </div>
                </div>

                {/* Seçilen Dosyalar */}
                {selectedFiles.length > 0 && (
                  <div className="selected-files">
                    <h5>Seçilen Dosyalar ({selectedFiles.length})</h5>
                    {selectedFiles.map(fileObj => (
                      <div key={fileObj.id} className="selected-file">
                        <span className="file-icon">{getFileIcon(fileObj.type)}</span>
                        <span className="file-name">{fileObj.file.name}</span>
                        <span className="file-size">{fileObj.size}</span>
                        <button 
                          className="btn-remove"
                          onClick={() => removeFile(fileObj.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="upload-section">
                <h4>2. Dosya Bilgileri</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Başlık</label>
                    <input
                      type="text"
                      value={uploadMetadata.title}
                      onChange={(e) => setUploadMetadata(prev => ({...prev, title: e.target.value}))}
                      placeholder="Dosya başlığı girin"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ders</label>
                    <select
                      value={uploadMetadata.subject}
                      onChange={(e) => setUploadMetadata(prev => ({...prev, subject: e.target.value}))}
                    >
                      <option value="">Ders seçin</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Kategori</label>
                    <select
                      value={currentCategory}
                      onChange={(e) => setCurrentCategory(e.target.value)}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Öncelik</label>
                    <select
                      value={uploadMetadata.priority}
                      onChange={(e) => setUploadMetadata(prev => ({...prev, priority: e.target.value}))}
                    >
                      <option value="low">🟢 Düşük</option>
                      <option value="medium">🟡 Orta</option>
                      <option value="high">🔴 Yüksek</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Teslim Tarihi</label>
                    <input
                      type="date"
                      value={uploadMetadata.dueDate}
                      onChange={(e) => setUploadMetadata(prev => ({...prev, dueDate: e.target.value}))}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Açıklama</label>
                    <textarea
                      value={uploadMetadata.description}
                      onChange={(e) => setUploadMetadata(prev => ({...prev, description: e.target.value}))}
                      placeholder="Dosya hakkında açıklama yazın..."
                      rows={3}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Etiketler</label>
                    <div className="tags-input">
                      <input
                        type="text"
                        placeholder="Etiket eklemek için yazın ve Enter'a basın"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="tags-list">
                        {uploadMetadata.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                            <button onClick={() => removeTag(tag)}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress.overall > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${uploadProgress.overall}%`}}
                    />
                  </div>
                  <span>{uploadProgress.overall}% Yüklendi</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowUploadModal(false)}
              >
                İptal
              </button>
              <button 
                className="btn-upload"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadProgress.overall > 0}
              >
                {uploadProgress.overall > 0 ? 'Yükleniyor...' : `Yükle (${selectedFiles.length} dosya)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentContentUpload; 