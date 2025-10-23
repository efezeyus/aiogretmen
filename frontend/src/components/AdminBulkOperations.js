import React, { useState } from 'react';
import './AdminBulkOperations.css';

const AdminBulkOperations = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [operationStatus, setOperationStatus] = useState(null);

  const [bulkTemplates] = useState({
    users: {
      headers: ['Email', 'Ad', 'Soyad', 'Rol', 'Sınıf', 'Okul'],
      sample: [
        ['ogrenci1@okul.com', 'Ali', 'Yılmaz', 'student', '5', 'Atatürk İlkokulu'],
        ['ogrenci2@okul.com', 'Ayşe', 'Kaya', 'student', '6', 'Atatürk İlkokulu'],
        ['ogretmen1@okul.com', 'Mehmet', 'Öz', 'teacher', '', 'Atatürk İlkokulu']
      ]
    },
    lessons: {
      headers: ['Ders Adı', 'Konu', 'Sınıf', 'Süre (dk)', 'Zorluk', 'Açıklama'],
      sample: [
        ['Kesirler Giriş', 'Matematik', '5', '45', 'kolay', 'Kesirlere giriş dersi'],
        ['Hücre Yapısı', 'Fen Bilimleri', '7', '60', 'orta', 'Hücre ve organelleri']
      ]
    },
    assignments: {
      headers: ['Ödev Adı', 'Ders', 'Sınıf', 'Teslim Tarihi', 'Puan'],
      sample: [
        ['Kesir Problemleri', 'Matematik', '5', '2024-12-30', '100'],
        ['Hücre Raporu', 'Fen Bilimleri', '7', '2024-12-28', '50']
      ]
    }
  });

  const [recentOperations] = useState([
    {
      id: 1,
      type: 'import',
      entity: 'users',
      count: 250,
      status: 'completed',
      date: '2024-12-20 14:30',
      operator: 'Admin',
      successCount: 248,
      errorCount: 2
    },
    {
      id: 2,
      type: 'update',
      entity: 'lessons',
      count: 45,
      status: 'completed',
      date: '2024-12-19 10:15',
      operator: 'Admin',
      successCount: 45,
      errorCount: 0
    },
    {
      id: 3,
      type: 'delete',
      entity: 'users',
      count: 15,
      status: 'completed',
      date: '2024-12-18 16:45',
      operator: 'Admin',
      successCount: 15,
      errorCount: 0
    }
  ]);

  const [selectedUsers] = useState([
    { id: 1, name: 'Ali Yılmaz', email: 'ali@okul.com', role: 'student', status: 'active' },
    { id: 2, name: 'Ayşe Kaya', email: 'ayse@okul.com', role: 'student', status: 'active' },
    { id: 3, name: 'Mehmet Öz', email: 'mehmet@okul.com', role: 'teacher', status: 'active' }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setShowPreviewModal(true);
        }
      }, 200);
    }
  };

  const handleBulkAction = (action) => {
    const message = action === 'delete' 
      ? `${selectedItems.length} öğe silinecek. Emin misiniz?`
      : `${selectedItems.length} öğe için ${action} işlemi yapılacak. Devam edilsin mi?`;
    
    if (window.confirm(message)) {
      setOperationStatus({
        type: 'processing',
        message: 'İşlem yapılıyor...'
      });
      
      setTimeout(() => {
        setOperationStatus({
          type: 'success',
          message: `${selectedItems.length} öğe için ${action} işlemi başarıyla tamamlandı!`
        });
        setSelectedItems([]);
      }, 2000);
    }
  };

  const downloadTemplate = (type) => {
    const template = bulkTemplates[type];
    let csv = template.headers.join(',') + '\n';
    template.sample.forEach(row => {
      csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
  };

  const renderUploadSection = (type) => (
    <div className="upload-section">
      <div className="upload-header">
        <h3>📤 Toplu {type === 'users' ? 'Kullanıcı' : type === 'lessons' ? 'Ders' : 'Ödev'} Yükleme</h3>
        <button 
          className="btn-download-template"
          onClick={() => downloadTemplate(type)}
        >
          📥 Şablon İndir
        </button>
      </div>

      <div className="upload-area">
        <input
          type="file"
          id={`file-upload-${type}`}
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor={`file-upload-${type}`} className="upload-dropzone">
          <div className="dropzone-content">
            <span className="upload-icon">📁</span>
            <p>Dosyayı buraya sürükleyin veya seçmek için tıklayın</p>
            <span className="file-types">CSV veya Excel dosyası</span>
          </div>
        </label>

        {uploadFile && (
          <div className="upload-info">
            <div className="file-details">
              <span className="file-name">📄 {uploadFile.name}</span>
              <span className="file-size">({(uploadFile.size / 1024).toFixed(2)} KB)</span>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="template-preview">
        <h4>📋 Şablon Örneği</h4>
        <div className="table-wrapper">
          <table className="template-table">
            <thead>
              <tr>
                {bulkTemplates[type].headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bulkTemplates[type].sample.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-bulk-operations">
      {/* Header */}
      <div className="bulk-header">
        <div className="header-left">
          <h2>📦 Toplu İşlemler</h2>
          <p>Çoklu veri yükleme, güncelleme ve silme işlemleri</p>
        </div>
        <div className="header-actions">
          <button className="btn-history">
            📜 İşlem Geçmişi
          </button>
          <button className="btn-settings">
            ⚙️ Ayarlar
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bulk-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">3,456</div>
            <div className="stat-label">Toplam İşlem</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">3,398</div>
            <div className="stat-label">Başarılı</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">58</div>
            <div className="stat-label">Hatalı</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">2.3s</div>
            <div className="stat-label">Ort. Süre</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bulk-tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Kullanıcılar
        </button>
        <button
          className={`tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          📚 Dersler
        </button>
        <button
          className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📝 Ödevler
        </button>
        <button
          className={`tab ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => setActiveTab('operations')}
        >
          🔄 Toplu İşlemler
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Geçmiş
        </button>
      </div>

      {/* Content */}
      <div className="bulk-content">
        {activeTab === 'users' && renderUploadSection('users')}
        {activeTab === 'lessons' && renderUploadSection('lessons')}
        {activeTab === 'assignments' && renderUploadSection('assignments')}

        {activeTab === 'operations' && (
          <div className="operations-section">
            <h3>🔄 Toplu İşlemler</h3>

            <div className="operation-cards">
              <div className="operation-card">
                <div className="operation-icon">📧</div>
                <h4>Toplu Email Gönderimi</h4>
                <p>Seçili kullanıcılara toplu email gönderin</p>
                <button className="btn-operation">
                  Email Gönder
                </button>
              </div>

              <div className="operation-card">
                <div className="operation-icon">🔑</div>
                <h4>Toplu Şifre Sıfırlama</h4>
                <p>Seçili kullanıcıların şifrelerini sıfırlayın</p>
                <button className="btn-operation">
                  Şifre Sıfırla
                </button>
              </div>

              <div className="operation-card">
                <div className="operation-icon">🏷️</div>
                <h4>Toplu Rol Değişimi</h4>
                <p>Kullanıcı rollerini toplu olarak güncelleyin</p>
                <button className="btn-operation">
                  Rol Güncelle
                </button>
              </div>

              <div className="operation-card">
                <div className="operation-icon">🎓</div>
                <h4>Toplu Sınıf Ataması</h4>
                <p>Öğrencileri sınıflara toplu olarak atayın</p>
                <button className="btn-operation">
                  Sınıf Ata
                </button>
              </div>

              <div className="operation-card">
                <div className="operation-icon">🗑️</div>
                <h4>Toplu Silme</h4>
                <p>Seçili öğeleri toplu olarak silin</p>
                <button className="btn-operation danger">
                  Toplu Sil
                </button>
              </div>

              <div className="operation-card">
                <div className="operation-icon">📊</div>
                <h4>Toplu Dışa Aktarma</h4>
                <p>Verileri CSV veya Excel formatında indirin</p>
                <button className="btn-operation">
                  Dışa Aktar
                </button>
              </div>
            </div>

            <div className="selected-items-section">
              <h4>👥 Seçili Öğeler ({selectedUsers.length})</h4>
              <div className="selected-items-list">
                {selectedUsers.map(user => (
                  <div key={user.id} className="selected-item">
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, user.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <div className="item-info">
                      <span className="item-name">{user.name}</span>
                      <span className="item-email">{user.email}</span>
                    </div>
                    <span className={`item-status ${user.status}`}>
                      {user.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bulk-actions">
                <button 
                  className="btn-bulk-action"
                  onClick={() => handleBulkAction('activate')}
                  disabled={selectedItems.length === 0}
                >
                  ✅ Aktifleştir
                </button>
                <button 
                  className="btn-bulk-action"
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={selectedItems.length === 0}
                >
                  ⏸️ Pasifleştir
                </button>
                <button 
                  className="btn-bulk-action"
                  onClick={() => handleBulkAction('export')}
                  disabled={selectedItems.length === 0}
                >
                  📥 Dışa Aktar
                </button>
                <button 
                  className="btn-bulk-action danger"
                  onClick={() => handleBulkAction('delete')}
                  disabled={selectedItems.length === 0}
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <h3>📜 İşlem Geçmişi</h3>
            
            <div className="history-filters">
              <select className="filter-select">
                <option value="all">Tüm İşlemler</option>
                <option value="import">İçe Aktarma</option>
                <option value="update">Güncelleme</option>
                <option value="delete">Silme</option>
              </select>
              <select className="filter-select">
                <option value="all">Tüm Varlıklar</option>
                <option value="users">Kullanıcılar</option>
                <option value="lessons">Dersler</option>
                <option value="assignments">Ödevler</option>
              </select>
              <input 
                type="date" 
                className="date-filter"
                placeholder="Tarih"
              />
            </div>

            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>İşlem</th>
                    <th>Varlık</th>
                    <th>Sayı</th>
                    <th>Başarılı</th>
                    <th>Hatalı</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                    <th>İşlemi Yapan</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOperations.map(op => (
                    <tr key={op.id}>
                      <td>
                        <span className={`operation-type ${op.type}`}>
                          {op.type === 'import' ? '📥 İçe Aktarma' :
                           op.type === 'update' ? '🔄 Güncelleme' :
                           '🗑️ Silme'}
                        </span>
                      </td>
                      <td>{op.entity === 'users' ? 'Kullanıcılar' : 
                           op.entity === 'lessons' ? 'Dersler' : 'Ödevler'}</td>
                      <td>{op.count}</td>
                      <td className="success-count">{op.successCount}</td>
                      <td className="error-count">{op.errorCount}</td>
                      <td>
                        <span className="status-badge completed">
                          ✅ Tamamlandı
                        </span>
                      </td>
                      <td>{op.date}</td>
                      <td>{op.operator}</td>
                      <td>
                        <button className="btn-table-action">📄 Detay</button>
                        <button className="btn-table-action">📥 Log</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Operation Status */}
      {operationStatus && (
        <div className={`operation-status ${operationStatus.type}`}>
          <span className="status-icon">
            {operationStatus.type === 'processing' ? '⏳' :
             operationStatus.type === 'success' ? '✅' : '❌'}
          </span>
          <span className="status-message">{operationStatus.message}</span>
          <button 
            className="status-close"
            onClick={() => setOperationStatus(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Veri Önizleme</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPreviewModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="preview-info">
                <p>Toplam <strong>250</strong> kayıt bulundu. İlk 10 kayıt aşağıda gösteriliyor:</p>
              </div>
              
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>✓</th>
                      {bulkTemplates[activeTab].headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>
                          <input type="checkbox" defaultChecked />
                        </td>
                        {bulkTemplates[activeTab].sample[0].map((_, cellIndex) => (
                          <td key={cellIndex}>Örnek Veri {rowIndex + 1}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="preview-actions">
                <div className="import-options">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Mevcut kayıtları güncelle
                  </label>
                  <label>
                    <input type="checkbox" />
                    Hatalı kayıtları atla
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    İşlem sonucunu email ile bildir
                  </label>
                </div>
                
                <div className="action-buttons">
                  <button className="btn-primary">
                    ✅ İçe Aktarmayı Başlat
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkOperations;
