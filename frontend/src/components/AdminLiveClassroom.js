import React, { useState, useEffect } from 'react';
import './AdminLiveClassroom.css';

const AdminLiveClassroom = () => {
  const [activeView, setActiveView] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [streamStatus, setStreamStatus] = useState('idle');

  const [liveSessions, setLiveSessions] = useState([
    {
      id: 'LIVE-001',
      title: '5. Sınıf Matematik - Canlı Ders',
      teacher: 'Mehmet Öğretmen',
      subject: 'Matematik',
      grade: 5,
      scheduledTime: '2024-12-21T14:00:00',
      duration: 45,
      status: 'live',
      participants: 23,
      maxParticipants: 30,
      roomUrl: 'https://meet.yapayzekaogretmen.com/room/LIVE-001',
      recording: true,
      chat: true,
      whiteboard: true,
      screenShare: true,
      aiAssistant: true
    },
    {
      id: 'LIVE-002',
      title: '7. Sınıf Fen - Deney Gösterimi',
      teacher: 'Ayşe Öğretmen',
      subject: 'Fen Bilimleri',
      grade: 7,
      scheduledTime: '2024-12-21T15:00:00',
      duration: 60,
      status: 'scheduled',
      participants: 0,
      maxParticipants: 25,
      roomUrl: 'https://meet.yapayzekaogretmen.com/room/LIVE-002',
      recording: true,
      chat: true,
      whiteboard: true,
      screenShare: true,
      aiAssistant: false
    },
    {
      id: 'LIVE-003',
      title: '6. Sınıf İngilizce - Speaking Practice',
      teacher: 'John Teacher',
      subject: 'İngilizce',
      grade: 6,
      scheduledTime: '2024-12-21T10:00:00',
      duration: 40,
      status: 'completed',
      participants: 18,
      maxParticipants: 20,
      roomUrl: 'https://meet.yapayzekaogretmen.com/room/LIVE-003',
      recording: true,
      chat: true,
      whiteboard: false,
      screenShare: true,
      aiAssistant: true,
      recordingUrl: 'https://recordings.yapayzekaogretmen.com/LIVE-003.mp4'
    }
  ]);

  const [sessionStats] = useState({
    totalSessions: 145,
    activeSessions: 3,
    scheduledToday: 12,
    totalParticipants: 456,
    avgDuration: '52 dk',
    satisfaction: 4.8
  });

  const [features] = useState({
    videoQuality: [
      { label: '360p', value: '360p' },
      { label: '720p HD', value: '720p' },
      { label: '1080p Full HD', value: '1080p' }
    ],
    layouts: [
      { label: 'Galeri Görünümü', value: 'gallery' },
      { label: 'Konuşmacı Görünümü', value: 'speaker' },
      { label: 'Sunum Modu', value: 'presentation' }
    ],
    tools: [
      { id: 'whiteboard', name: 'Beyaz Tahta', icon: '📝', enabled: true },
      { id: 'screenshare', name: 'Ekran Paylaşımı', icon: '🖥️', enabled: true },
      { id: 'chat', name: 'Sohbet', icon: '💬', enabled: true },
      { id: 'polls', name: 'Anketler', icon: '📊', enabled: true },
      { id: 'breakout', name: 'Grup Odaları', icon: '🚪', enabled: true },
      { id: 'recording', name: 'Kayıt', icon: '🎥', enabled: true },
      { id: 'ai-notes', name: 'AI Not Alma', icon: '🤖', enabled: true },
      { id: 'translation', name: 'Canlı Çeviri', icon: '🌐', enabled: true }
    ]
  });

  const [participants] = useState([
    { id: 1, name: 'Ahmet Yılmaz', role: 'student', status: 'online', hand: false, mic: true, camera: true },
    { id: 2, name: 'Ayşe Kaya', role: 'student', status: 'online', hand: true, mic: false, camera: true },
    { id: 3, name: 'Mehmet Demir', role: 'student', status: 'online', hand: false, mic: false, camera: false },
    { id: 4, name: 'Zeynep Çelik', role: 'student', status: 'away', hand: false, mic: false, camera: true }
  ]);

  useEffect(() => {
    // Simulate real-time participant updates
    const interval = setInterval(() => {
      setLiveSessions(prev => prev.map(session => {
        if (session.status === 'live') {
          return {
            ...session,
            participants: Math.max(0, session.participants + Math.floor(Math.random() * 3) - 1)
          };
        }
        return session;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return '#f44336';
      case 'scheduled': return '#ff9800';
      case 'completed': return '#4caf50';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'live': return 'Canlı';
      case 'scheduled': return 'Planlandı';
      case 'completed': return 'Tamamlandı';
      default: return '';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartSession = (session) => {
    setStreamStatus('starting');
    setTimeout(() => {
      setStreamStatus('live');
      setLiveSessions(prev => prev.map(s => 
        s.id === session.id ? { ...s, status: 'live' } : s
      ));
    }, 2000);
  };

  const handleEndSession = (session) => {
    if (window.confirm('Canlı dersi sonlandırmak istediğinizden emin misiniz?')) {
      setStreamStatus('ending');
      setTimeout(() => {
        setStreamStatus('idle');
        setLiveSessions(prev => prev.map(s => 
          s.id === session.id ? { ...s, status: 'completed' } : s
        ));
      }, 1000);
    }
  };

  const handleToggleRecording = () => {
    alert('Kayıt durumu değiştiriliyor...');
  };

  const handleMuteAll = () => {
    alert('Tüm katılımcıların mikrofonu kapatıldı');
  };

  return (
    <div className="admin-live-classroom">
      {/* Header */}
      <div className="live-header">
        <div className="header-left">
          <h2>🎥 Canlı Sınıf Yönetimi</h2>
          <p>Video konferans, sanal sınıflar ve canlı ders yönetimi</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Yeni Canlı Ders
          </button>
          <button className="btn-schedule">
            📅 Takvim Görünümü
          </button>
          <button className="btn-settings">
            ⚙️ Ayarlar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="live-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{sessionStats.totalSessions}</div>
            <div className="stat-label">Toplam Oturum</div>
          </div>
        </div>
        <div className="stat-card live">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-value">{sessionStats.activeSessions}</div>
            <div className="stat-label">Aktif Canlı Ders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{sessionStats.scheduledToday}</div>
            <div className="stat-label">Bugünkü Ders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{sessionStats.totalParticipants}</div>
            <div className="stat-label">Toplam Katılımcı</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{sessionStats.avgDuration}</div>
            <div className="stat-label">Ort. Süre</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{sessionStats.satisfaction}</div>
            <div className="stat-label">Memnuniyet</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="live-tabs">
        <button
          className={`tab ${activeView === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveView('sessions')}
        >
          🎥 Oturumlar
        </button>
        <button
          className={`tab ${activeView === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveView('monitor')}
        >
          📊 İzleme
        </button>
        <button
          className={`tab ${activeView === 'recordings' ? 'active' : ''}`}
          onClick={() => setActiveView('recordings')}
        >
          🎬 Kayıtlar
        </button>
        <button
          className={`tab ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          ⚙️ Platform Ayarları
        </button>
      </div>

      {/* Content */}
      <div className="live-content">
        {activeView === 'sessions' && (
          <div className="sessions-view">
            <div className="sessions-filters">
              <input
                type="text"
                placeholder="🔍 Oturum ara..."
                className="search-input"
              />
              <select className="filter-select">
                <option value="all">Tüm Durumlar</option>
                <option value="live">Canlı</option>
                <option value="scheduled">Planlandı</option>
                <option value="completed">Tamamlandı</option>
              </select>
              <input type="date" className="date-filter" />
            </div>

            <div className="sessions-grid">
              {liveSessions.map(session => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <div className="session-info">
                      <h3>{session.title}</h3>
                      <span 
                        className="session-status"
                        style={{ backgroundColor: getStatusColor(session.status) }}
                      >
                        {session.status === 'live' && '🔴'} {getStatusLabel(session.status)}
                      </span>
                    </div>
                  </div>

                  <div className="session-details">
                    <div className="detail-item">
                      <span className="icon">👨‍🏫</span>
                      <span>{session.teacher}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">📚</span>
                      <span>{session.subject} - {session.grade}. Sınıf</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">🕐</span>
                      <span>{formatDateTime(session.scheduledTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">⏱️</span>
                      <span>{session.duration} dakika</span>
                    </div>
                  </div>

                  <div className="session-participants">
                    <div className="participants-bar">
                      <div 
                        className="participants-fill"
                        style={{ width: `${(session.participants / session.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                    <span className="participants-text">
                      {session.participants} / {session.maxParticipants} katılımcı
                    </span>
                  </div>

                  <div className="session-features">
                    {session.recording && <span className="feature-badge">🎥 Kayıt</span>}
                    {session.chat && <span className="feature-badge">💬 Sohbet</span>}
                    {session.whiteboard && <span className="feature-badge">📝 Tahta</span>}
                    {session.screenShare && <span className="feature-badge">🖥️ Ekran</span>}
                    {session.aiAssistant && <span className="feature-badge">🤖 AI</span>}
                  </div>

                  <div className="session-actions">
                    {session.status === 'scheduled' && (
                      <>
                        <button 
                          className="btn-action start"
                          onClick={() => handleStartSession(session)}
                        >
                          ▶️ Başlat
                        </button>
                        <button className="btn-action edit">
                          ✏️ Düzenle
                        </button>
                      </>
                    )}
                    {session.status === 'live' && (
                      <>
                        <button 
                          className="btn-action join"
                          onClick={() => window.open(session.roomUrl, '_blank')}
                        >
                          🚪 Katıl
                        </button>
                        <button 
                          className="btn-action monitor"
                          onClick={() => setSelectedSession(session)}
                        >
                          👁️ İzle
                        </button>
                        <button 
                          className="btn-action end"
                          onClick={() => handleEndSession(session)}
                        >
                          ⏹️ Bitir
                        </button>
                      </>
                    )}
                    {session.status === 'completed' && (
                      <>
                        <button className="btn-action view">
                          🎬 Kayıt
                        </button>
                        <button className="btn-action stats">
                          📊 İstatistik
                        </button>
                        <button className="btn-action download">
                          📥 İndir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'monitor' && selectedSession && (
          <div className="monitor-view">
            <div className="monitor-header">
              <h3>📊 Canlı İzleme: {selectedSession.title}</h3>
              <div className="monitor-controls">
                <button onClick={handleToggleRecording}>
                  🎥 Kayıt: Açık
                </button>
                <button onClick={handleMuteAll}>
                  🔇 Herkesi Sustur
                </button>
                <button>
                  📢 Duyuru Yap
                </button>
              </div>
            </div>

            <div className="monitor-grid">
              <div className="monitor-section video-grid">
                <h4>👥 Katılımcılar</h4>
                <div className="participants-grid">
                  {participants.map(participant => (
                    <div key={participant.id} className="participant-card">
                      <div className="participant-video">
                        <div className="video-placeholder">
                          {participant.camera ? '📹' : '🚫'}
                        </div>
                        {participant.hand && (
                          <span className="hand-raised">✋</span>
                        )}
                      </div>
                      <div className="participant-info">
                        <span className="participant-name">{participant.name}</span>
                        <div className="participant-controls">
                          <span className={`control-icon ${participant.mic ? 'active' : ''}`}>
                            {participant.mic ? '🎤' : '🔇'}
                          </span>
                          <span className={`control-icon ${participant.camera ? 'active' : ''}`}>
                            {participant.camera ? '📹' : '📷'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="monitor-section stats-section">
                <h4>📊 Canlı İstatistikler</h4>
                <div className="live-stats-grid">
                  <div className="live-stat">
                    <span className="stat-label">Bağlantı Kalitesi</span>
                    <div className="quality-indicator good">
                      <span>🟢 Mükemmel</span>
                    </div>
                  </div>
                  <div className="live-stat">
                    <span className="stat-label">CPU Kullanımı</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '45%' }}></div>
                    </div>
                    <span className="usage-text">45%</span>
                  </div>
                  <div className="live-stat">
                    <span className="stat-label">Bant Genişliği</span>
                    <span className="stat-value">2.4 Mbps</span>
                  </div>
                  <div className="live-stat">
                    <span className="stat-label">Paket Kaybı</span>
                    <span className="stat-value">0.1%</span>
                  </div>
                </div>
              </div>

              <div className="monitor-section chat-section">
                <h4>💬 Sohbet Akışı</h4>
                <div className="chat-messages">
                  <div className="chat-message">
                    <span className="sender">Ahmet:</span>
                    <span className="message">Hocam ses gelmiyor</span>
                    <span className="time">14:23</span>
                  </div>
                  <div className="chat-message">
                    <span className="sender">Öğretmen:</span>
                    <span className="message">Şimdi kontrol ediyorum</span>
                    <span className="time">14:24</span>
                  </div>
                  <div className="chat-message system">
                    <span className="message">Ayşe el kaldırdı</span>
                    <span className="time">14:25</span>
                  </div>
                </div>
              </div>

              <div className="monitor-section ai-insights">
                <h4>🤖 AI İçgörüleri</h4>
                <div className="insights-list">
                  <div className="insight-item">
                    <span className="insight-icon">📊</span>
                    <span className="insight-text">Katılım oranı %85 - Çok iyi!</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">💡</span>
                    <span className="insight-text">3 öğrenci pasif durumda</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-icon">⚠️</span>
                    <span className="insight-text">Ses seviyesi düşük</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'recordings' && (
          <div className="recordings-view">
            <h3>🎬 Ders Kayıtları</h3>
            <div className="recordings-filters">
              <input
                type="text"
                placeholder="🔍 Kayıt ara..."
                className="search-input"
              />
              <select className="filter-select">
                <option value="all">Tüm Dersler</option>
                <option value="matematik">Matematik</option>
                <option value="fen">Fen Bilimleri</option>
                <option value="ingilizce">İngilizce</option>
              </select>
              <input type="date" className="date-filter" />
            </div>

            <div className="recordings-table">
              <table>
                <thead>
                  <tr>
                    <th>Ders</th>
                    <th>Öğretmen</th>
                    <th>Tarih</th>
                    <th>Süre</th>
                    <th>İzlenme</th>
                    <th>Boyut</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>5. Sınıf Matematik - Kesirler</td>
                    <td>Mehmet Öğretmen</td>
                    <td>20.12.2024</td>
                    <td>45 dk</td>
                    <td>234</td>
                    <td>1.2 GB</td>
                    <td>
                      <button className="btn-table-action">👁️</button>
                      <button className="btn-table-action">📥</button>
                      <button className="btn-table-action">🗑️</button>
                    </td>
                  </tr>
                  <tr>
                    <td>7. Sınıf Fen - Hücre</td>
                    <td>Ayşe Öğretmen</td>
                    <td>19.12.2024</td>
                    <td>60 dk</td>
                    <td>189</td>
                    <td>1.8 GB</td>
                    <td>
                      <button className="btn-table-action">👁️</button>
                      <button className="btn-table-action">📥</button>
                      <button className="btn-table-action">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="storage-info">
              <h4>💾 Depolama Durumu</h4>
              <div className="storage-bar">
                <div className="storage-used" style={{ width: '68%' }}></div>
              </div>
              <div className="storage-details">
                <span>Kullanılan: 68 GB / 100 GB</span>
                <span>Kalan: 32 GB</span>
              </div>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="settings-view">
            <h3>⚙️ Platform Ayarları</h3>
            
            <div className="settings-grid">
              <div className="settings-card">
                <h4>🎥 Video Ayarları</h4>
                <div className="setting-item">
                  <label>Varsayılan Video Kalitesi</label>
                  <select defaultValue="720p">
                    {features.videoQuality.map(quality => (
                      <option key={quality.value} value={quality.value}>
                        {quality.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="setting-item">
                  <label>Maksimum Katılımcı</label>
                  <input type="number" defaultValue="50" min="10" max="500" />
                </div>
                <div className="setting-item">
                  <label>Varsayılan Düzen</label>
                  <select defaultValue="gallery">
                    {features.layouts.map(layout => (
                      <option key={layout.value} value={layout.value}>
                        {layout.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="settings-card">
                <h4>🛠️ Araçlar ve Özellikler</h4>
                {features.tools.map(tool => (
                  <div key={tool.id} className="feature-toggle">
                    <label>
                      <input
                        type="checkbox"
                        defaultChecked={tool.enabled}
                      />
                      <span>{tool.icon} {tool.name}</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="settings-card">
                <h4>🔒 Güvenlik</h4>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Oda şifresi zorunlu
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Bekleme odası aktif
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Otomatik kayıt başlat
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Uçtan uca şifreleme
                  </label>
                </div>
              </div>

              <div className="settings-card">
                <h4>🤖 AI Özellikleri</h4>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Otomatik altyazı
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Gürültü engelleme
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Otomatik not alma
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Duygu analizi
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-save">💾 Ayarları Kaydet</button>
              <button className="btn-reset">🔄 Varsayılana Dön</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎥 Yeni Canlı Ders Oluştur</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label>Ders Başlığı</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 5. Sınıf Matematik - Kesirler"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ders</label>
                    <select required>
                      <option value="">Seçiniz</option>
                      <option value="matematik">Matematik</option>
                      <option value="fen">Fen Bilimleri</option>
                      <option value="turkce">Türkçe</option>
                      <option value="ingilizce">İngilizce</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sınıf</label>
                    <select required>
                      <option value="">Seçiniz</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}. Sınıf</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tarih</label>
                    <input type="date" required />
                  </div>

                  <div className="form-group">
                    <label>Saat</label>
                    <input type="time" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Süre (dakika)</label>
                    <input 
                      type="number" 
                      min="15" 
                      max="180" 
                      defaultValue="45"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Maks. Katılımcı</label>
                    <input 
                      type="number" 
                      min="5" 
                      max="100" 
                      defaultValue="30"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Özellikler</label>
                  <div className="features-grid">
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>🎥 Kayıt</span>
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>💬 Sohbet</span>
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>📝 Beyaz Tahta</span>
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked />
                      <span>🖥️ Ekran Paylaşımı</span>
                    </label>
                    <label>
                      <input type="checkbox" />
                      <span>🤖 AI Asistan</span>
                    </label>
                    <label>
                      <input type="checkbox" />
                      <span>🌐 Canlı Çeviri</span>
                    </label>
                  </div>
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

export default AdminLiveClassroom;
