import React, { useState } from 'react';
import './AdminBlockchainCertificates.css';

const AdminBlockchainCertificates = () => {
  const [activeTab, setActiveTab] = useState('certificates');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const [certificates] = useState([
    {
      id: 'CERT-2024-001',
      studentName: 'Ahmet Yılmaz',
      studentId: 'STU-123',
      courseName: '5. Sınıf Matematik - Temel Kavramlar',
      issueDate: '2024-12-15',
      grade: 95,
      blockchainHash: '0x7d4e3eec80026719639ed45980e25bb7c4b5f5a7d9e5c5d4f5e8c6a9b8c7d6e5',
      transactionId: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'verified',
      ipfsHash: 'QmT5NvUtoM5n5MW9Yz8Zr9Jh8xH8Yz8Zr9Jh8xH8'
    },
    {
      id: 'CERT-2024-002',
      studentName: 'Ayşe Kaya',
      studentId: 'STU-124',
      courseName: '7. Sınıf Fen Bilimleri - Hücre',
      issueDate: '2024-12-18',
      grade: 88,
      blockchainHash: '0x8e5f4edc90137829750ee56890f36cc8d5c6g6b8e0f6d6e5g6f9d7ba8d9e7f6',
      transactionId: '0xa0g97e192995d8e850b3gfba1d66ae126b4cg2c3c1c7e37ce26e7d26c1g11b19',
      status: 'verified',
      ipfsHash: 'QmU6OwVuPN6o6NX8ZA9aSA9aI9aH9YA9aSA9aI9aH9'
    },
    {
      id: 'CERT-2024-003',
      studentName: 'Mehmet Demir',
      studentId: 'STU-125',
      courseName: '6. Sınıf İngilizce - Grammar Basics',
      issueDate: '2024-12-20',
      grade: 92,
      blockchainHash: 'pending',
      transactionId: 'pending',
      status: 'pending',
      ipfsHash: 'pending'
    }
  ]);

  const [blockchainStats] = useState({
    totalCertificates: 342,
    verifiedCertificates: 338,
    pendingCertificates: 4,
    gasSpent: '0.234 ETH',
    avgVerificationTime: '12 sec',
    chainNetwork: 'Polygon'
  });

  const [certificateTemplates] = useState([
    {
      id: 1,
      name: 'Standart Başarı Sertifikası',
      description: 'Ders tamamlama için temel sertifika',
      fields: ['studentName', 'courseName', 'grade', 'date']
    },
    {
      id: 2,
      name: 'Üstün Başarı Sertifikası',
      description: '%90+ başarı için özel sertifika',
      fields: ['studentName', 'courseName', 'grade', 'date', 'ranking']
    },
    {
      id: 3,
      name: 'Katılım Sertifikası',
      description: 'Workshop ve etkinlikler için',
      fields: ['studentName', 'eventName', 'date', 'duration']
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return 'Doğrulandı';
      case 'pending': return 'Beklemede';
      case 'failed': return 'Başarısız';
      default: return '';
    }
  };

  const handleVerifyCertificate = (hash) => {
    setShowVerifyModal(true);
    // Simulate blockchain verification
    setTimeout(() => {
      setVerificationResult({
        valid: true,
        certificate: certificates.find(c => c.blockchainHash === hash),
        blockInfo: {
          blockNumber: 34567890,
          timestamp: new Date().toISOString(),
          network: 'Polygon Mainnet',
          gasUsed: '0.00012 ETH'
        }
      });
    }, 2000);
  };

  const handleBatchMint = () => {
    alert('Toplu sertifika oluşturma başlatılıyor...');
  };

  const handleExportCertificate = (certificate) => {
    alert(`${certificate.id} sertifikası PDF olarak indiriliyor...`);
  };

  return (
    <div className="admin-blockchain-certificates">
      {/* Header */}
      <div className="blockchain-header">
        <div className="header-left">
          <h2>🔗 Blockchain Sertifika Sistemi</h2>
          <p>Değiştirilemez, doğrulanabilir dijital sertifikalar</p>
        </div>
        <div className="header-actions">
          <button className="btn-mint" onClick={handleBatchMint}>
            ⚡ Toplu Oluştur
          </button>
          <button className="btn-verify" onClick={() => setShowVerifyModal(true)}>
            🔍 Sertifika Doğrula
          </button>
          <button className="btn-settings">
            ⚙️ Blockchain Ayarları
          </button>
        </div>
      </div>

      {/* Blockchain Stats */}
      <div className="blockchain-stats">
        <div className="stat-card">
          <div className="stat-icon">📜</div>
          <div className="stat-content">
            <div className="stat-value">{blockchainStats.totalCertificates}</div>
            <div className="stat-label">Toplam Sertifika</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{blockchainStats.verifiedCertificates}</div>
            <div className="stat-label">Doğrulanmış</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{blockchainStats.pendingCertificates}</div>
            <div className="stat-label">Beklemede</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⛽</div>
          <div className="stat-content">
            <div className="stat-value">{blockchainStats.gasSpent}</div>
            <div className="stat-label">Toplam Gas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{blockchainStats.avgVerificationTime}</div>
            <div className="stat-label">Ort. Doğrulama</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-value">{blockchainStats.chainNetwork}</div>
            <div className="stat-label">Blockchain Ağı</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="blockchain-tabs">
        <button
          className={`tab ${activeTab === 'certificates' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificates')}
        >
          📜 Sertifikalar
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Şablonlar
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💸 İşlemler
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analitik
        </button>
      </div>

      {/* Content */}
      <div className="blockchain-content">
        {activeTab === 'certificates' && (
          <div className="certificates-section">
            <div className="certificates-filters">
              <input
                type="text"
                placeholder="🔍 Sertifika ara..."
                className="search-input"
              />
              <select className="filter-select">
                <option value="all">Tüm Durumlar</option>
                <option value="verified">Doğrulanmış</option>
                <option value="pending">Beklemede</option>
                <option value="failed">Başarısız</option>
              </select>
              <input
                type="date"
                className="date-filter"
                placeholder="Tarih"
              />
            </div>

            <div className="certificates-grid">
              {certificates.map(cert => (
                <div key={cert.id} className="certificate-card">
                  <div className="cert-header">
                    <h3>{cert.id}</h3>
                    <span 
                      className="cert-status"
                      style={{ backgroundColor: getStatusColor(cert.status) }}
                    >
                      {getStatusLabel(cert.status)}
                    </span>
                  </div>

                  <div className="cert-info">
                    <div className="info-row">
                      <span className="label">Öğrenci:</span>
                      <span className="value">{cert.studentName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Ders:</span>
                      <span className="value">{cert.courseName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Not:</span>
                      <span className="value">{cert.grade}/100</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Tarih:</span>
                      <span className="value">{cert.issueDate}</span>
                    </div>
                  </div>

                  <div className="cert-blockchain">
                    <div className="blockchain-item">
                      <span className="icon">🔗</span>
                      <span className="label">Hash:</span>
                      <span className="hash" title={cert.blockchainHash}>
                        {cert.blockchainHash === 'pending' 
                          ? 'Beklemede...' 
                          : `${cert.blockchainHash.substring(0, 10)}...`}
                      </span>
                    </div>
                    <div className="blockchain-item">
                      <span className="icon">📋</span>
                      <span className="label">TX ID:</span>
                      <span className="hash" title={cert.transactionId}>
                        {cert.transactionId === 'pending' 
                          ? 'Beklemede...' 
                          : `${cert.transactionId.substring(0, 10)}...`}
                      </span>
                    </div>
                    <div className="blockchain-item">
                      <span className="icon">☁️</span>
                      <span className="label">IPFS:</span>
                      <span className="hash" title={cert.ipfsHash}>
                        {cert.ipfsHash === 'pending' 
                          ? 'Beklemede...' 
                          : `${cert.ipfsHash.substring(0, 10)}...`}
                      </span>
                    </div>
                  </div>

                  <div className="cert-actions">
                    <button 
                      className="btn-action view"
                      onClick={() => setSelectedCertificate(cert)}
                    >
                      👁️ Görüntüle
                    </button>
                    <button 
                      className="btn-action verify"
                      onClick={() => handleVerifyCertificate(cert.blockchainHash)}
                      disabled={cert.status === 'pending'}
                    >
                      🔍 Doğrula
                    </button>
                    <button 
                      className="btn-action download"
                      onClick={() => handleExportCertificate(cert)}
                    >
                      📥 İndir
                    </button>
                    <button className="btn-action share">
                      🔗 Paylaş
                    </button>
                  </div>

                  {cert.status === 'verified' && (
                    <div className="cert-qr">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${cert.blockchainHash}`}
                        alt="QR Code"
                      />
                      <span className="qr-label">Doğrulama QR</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-section">
            <h3>📋 Sertifika Şablonları</h3>
            <div className="templates-grid">
              {certificateTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-fields">
                    <h5>Alanlar:</h5>
                    <ul>
                      {template.fields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="template-actions">
                    <button className="btn-edit">✏️ Düzenle</button>
                    <button className="btn-preview">👁️ Önizle</button>
                    <button className="btn-use">✅ Kullan</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-create-template">
              ➕ Yeni Şablon Oluştur
            </button>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-section">
            <h3>💸 Blockchain İşlemleri</h3>
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>İşlem ID</th>
                    <th>Tip</th>
                    <th>Sertifika</th>
                    <th>Gas</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="tx-id">0x7d4e3e...c7d6e5</td>
                    <td>Mint</td>
                    <td>CERT-2024-001</td>
                    <td>0.00015 ETH</td>
                    <td><span className="status success">Başarılı</span></td>
                    <td>2024-12-15 10:30</td>
                    <td>
                      <button className="btn-view-tx">🔍</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="tx-id">0x8e5f4e...e7f6</td>
                    <td>Mint</td>
                    <td>CERT-2024-002</td>
                    <td>0.00014 ETH</td>
                    <td><span className="status success">Başarılı</span></td>
                    <td>2024-12-18 14:22</td>
                    <td>
                      <button className="btn-view-tx">🔍</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="tx-id">pending...</td>
                    <td>Mint</td>
                    <td>CERT-2024-003</td>
                    <td>-</td>
                    <td><span className="status pending">Beklemede</span></td>
                    <td>2024-12-20 09:15</td>
                    <td>
                      <button className="btn-view-tx" disabled>🔍</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="gas-tracker">
              <h4>⛽ Gas Takibi</h4>
              <div className="gas-info">
                <div className="gas-item">
                  <span className="label">Güncel Gas Fiyatı:</span>
                  <span className="value">25 Gwei</span>
                </div>
                <div className="gas-item">
                  <span className="label">Tahmini İşlem Ücreti:</span>
                  <span className="value">0.00018 ETH</span>
                </div>
                <div className="gas-item">
                  <span className="label">Toplam Harcama:</span>
                  <span className="value">0.234 ETH</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h3>📊 Blockchain Analitiği</h3>
            
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>📈 Aylık Sertifika Üretimi</h4>
                <div className="chart-placeholder">
                  <div className="mock-chart">
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '75%'}}></div>
                    <div className="bar" style={{height: '85%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                    <div className="bar" style={{height: '95%'}}></div>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>🔍 Doğrulama İstatistikleri</h4>
                <div className="verify-stats">
                  <div className="verify-item">
                    <span className="label">Toplam Doğrulama:</span>
                    <span className="value">1,234</span>
                  </div>
                  <div className="verify-item">
                    <span className="label">Başarılı:</span>
                    <span className="value success">1,230</span>
                  </div>
                  <div className="verify-item">
                    <span className="label">Başarısız:</span>
                    <span className="value error">4</span>
                  </div>
                  <div className="verify-item">
                    <span className="label">Ortalama Süre:</span>
                    <span className="value">12 saniye</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>💰 Maliyet Analizi</h4>
                <div className="cost-breakdown">
                  <div className="cost-item">
                    <span className="label">Mint İşlemleri:</span>
                    <span className="value">0.198 ETH</span>
                  </div>
                  <div className="cost-item">
                    <span className="label">Doğrulama:</span>
                    <span className="value">0.036 ETH</span>
                  </div>
                  <div className="cost-item">
                    <span className="label">IPFS Depolama:</span>
                    <span className="value">$12.50</span>
                  </div>
                  <div className="cost-total">
                    <span className="label">Toplam:</span>
                    <span className="value">0.234 ETH + $12.50</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>🌍 Ağ Durumu</h4>
                <div className="network-status">
                  <div className="network-item">
                    <span className="label">Ağ:</span>
                    <span className="value">Polygon Mainnet</span>
                  </div>
                  <div className="network-item">
                    <span className="label">Blok Yüksekliği:</span>
                    <span className="value">34,567,890</span>
                  </div>
                  <div className="network-item">
                    <span className="label">Ortalama Blok Süresi:</span>
                    <span className="value">2.1 saniye</span>
                  </div>
                  <div className="network-item">
                    <span className="label">Durum:</span>
                    <span className="value success">✅ Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="modal-overlay" onClick={() => {
          setShowVerifyModal(false);
          setVerificationResult(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔍 Sertifika Doğrulama</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerificationResult(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {!verificationResult ? (
                <div className="verify-form">
                  <p>Sertifika hash'ini veya QR kodunu girin:</p>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="verify-input"
                  />
                  <button className="btn-verify-submit">
                    Doğrula
                  </button>
                  <div className="verify-or">
                    <span>veya</span>
                  </div>
                  <div className="qr-scanner">
                    <div className="scanner-placeholder">
                      📷 QR Kod Tara
                    </div>
                  </div>
                </div>
              ) : (
                <div className="verify-result">
                  {verificationResult.valid ? (
                    <>
                      <div className="result-icon success">✅</div>
                      <h4>Sertifika Doğrulandı!</h4>
                      <div className="result-details">
                        <div className="detail-row">
                          <span className="label">Sertifika ID:</span>
                          <span className="value">{verificationResult.certificate.id}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Öğrenci:</span>
                          <span className="value">{verificationResult.certificate.studentName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Ders:</span>
                          <span className="value">{verificationResult.certificate.courseName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Blok Numarası:</span>
                          <span className="value">{verificationResult.blockInfo.blockNumber}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Ağ:</span>
                          <span className="value">{verificationResult.blockInfo.network}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="result-icon error">❌</div>
                      <h4>Sertifika Doğrulanamadı!</h4>
                      <p>Bu hash ile eşleşen bir sertifika bulunamadı.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlockchainCertificates;
