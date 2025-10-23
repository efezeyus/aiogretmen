import React, { useState } from 'react';
import './AdminSupport.css';

const AdminSupport = () => {
  const [activeView, setActiveView] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  const [tickets, setTickets] = useState([
    {
      id: 'TK-2025001',
      subject: 'Giriş Yapamıyorum',
      description: 'Şifremi unutmuş olabilirim. Sisteme giriş yapamıyorum.',
      user: 'Ahmet Yılmaz',
      userEmail: 'ahmet@example.com',
      userType: 'student',
      category: 'login',
      priority: 'high',
      status: 'open',
      createdDate: '2025-01-02T10:30:00Z',
      lastUpdate: '2025-01-02T10:30:00Z',
      assignedTo: null,
      messages: [
        {
          id: 1,
          sender: 'Ahmet Yılmaz',
          message: 'Merhaba, şifremi unutmuş olabilirim. Sisteme giriş yapamıyorum. Yardımcı olur musunuz?',
          date: '2025-01-02T10:30:00Z',
          type: 'user'
        }
      ]
    },
    {
      id: 'TK-2025002',
      subject: 'Video Oynatılmıyor',
      description: 'Ders videolarından bazıları açılmıyor.',
      user: 'Ayşe Kaya',
      userEmail: 'ayse@example.com',
      userType: 'student',
      category: 'technical',
      priority: 'medium',
      status: 'in_progress',
      createdDate: '2025-01-01T14:20:00Z',
      lastUpdate: '2025-01-02T09:15:00Z',
      assignedTo: 'Teknik Destek',
      messages: [
        {
          id: 1,
          sender: 'Ayşe Kaya',
          message: '7. sınıf matematik dersinin videolarından bazıları açılmıyor. Hata veriyor.',
          date: '2025-01-01T14:20:00Z',
          type: 'user'
        },
        {
          id: 2,
          sender: 'Teknik Destek',
          message: 'Merhaba Ayşe, sorununuzu inceliyoruz. Hangi tarayıcıyı kullanıyorsunuz?',
          date: '2025-01-02T09:15:00Z',
          type: 'support'
        }
      ]
    },
    {
      id: 'TK-2025003',
      subject: 'Sertifika Alamıyorum',
      description: 'Dersi tamamladım ama sertifika alamıyorum.',
      user: 'Mehmet Demir',
      userEmail: 'mehmet@example.com',
      userType: 'student',
      category: 'certificate',
      priority: 'low',
      status: 'resolved',
      createdDate: '2024-12-28T16:45:00Z',
      lastUpdate: '2024-12-29T11:30:00Z',
      assignedTo: 'Destek Ekibi',
      messages: []
    }
  ]);

  const [replyMessage, setReplyMessage] = useState('');
  const [canned, setCanned] = useState([
    {
      id: 1,
      title: 'Şifre Sıfırlama',
      message: 'Merhaba, şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen spam klasörünü de kontrol edin. Link 24 saat geçerlidir.'
    },
    {
      id: 2,
      title: 'Tarayıcı Uyumluluğu',
      message: 'Sistemimiz Chrome, Firefox, Safari ve Edge tarayıcılarının güncel versiyonlarını desteklemektedir. Lütfen tarayıcınızı güncelleyin.'
    },
    {
      id: 3,
      title: 'Video Sorunu',
      message: 'Video sorunları için öncelikle internet bağlantınızı kontrol edin. Sorun devam ederse tarayıcı önbelleğini temizleyin.'
    }
  ]);

  const [ticketStats] = useState({
    total: 342,
    open: 45,
    inProgress: 23,
    resolved: 274,
    avgResponseTime: '2.5 saat',
    satisfactionRate: 94
  });

  const categories = [
    { value: 'login', label: 'Giriş Sorunları', icon: '🔐' },
    { value: 'technical', label: 'Teknik Sorunlar', icon: '🔧' },
    { value: 'payment', label: 'Ödeme', icon: '💳' },
    { value: 'certificate', label: 'Sertifika', icon: '📜' },
    { value: 'content', label: 'İçerik', icon: '📚' },
    { value: 'other', label: 'Diğer', icon: '❓' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük', color: '#4caf50' },
    { value: 'medium', label: 'Orta', color: '#ff9800' },
    { value: 'high', label: 'Yüksek', color: '#f44336' },
    { value: 'urgent', label: 'Acil', color: '#d32f2f' }
  ];

  const statuses = [
    { value: 'open', label: 'Açık', color: '#2196f3' },
    { value: 'in_progress', label: 'İşlemde', color: '#ff9800' },
    { value: 'resolved', label: 'Çözüldü', color: '#4caf50' },
    { value: 'closed', label: 'Kapalı', color: '#9e9e9e' }
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    const newMessage = {
      id: Date.now(),
      sender: 'Destek Ekibi',
      message: replyMessage,
      date: new Date().toISOString(),
      type: 'support'
    };

    setTickets(tickets.map(ticket => 
      ticket.id === selectedTicket.id
        ? {
            ...ticket,
            messages: [...ticket.messages, newMessage],
            lastUpdate: new Date().toISOString(),
            status: ticket.status === 'open' ? 'in_progress' : ticket.status
          }
        : ticket
    ));

    setSelectedTicket({
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessage],
      lastUpdate: new Date().toISOString()
    });

    setReplyMessage('');
    setShowReplyModal(false);
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(tickets.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, status: newStatus, lastUpdate: new Date().toISOString() }
        : ticket
    ));
  };

  const handlePriorityChange = (ticketId, newPriority) => {
    setTickets(tickets.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, priority: newPriority }
        : ticket
    ));
  };

  const getCategoryIcon = (category) => {
    return categories.find(c => c.value === category)?.icon || '❓';
  };

  const getCategoryLabel = (category) => {
    return categories.find(c => c.value === category)?.label || 'Diğer';
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.value === priority)?.color || '#666';
  };

  const getPriorityLabel = (priority) => {
    return priorities.find(p => p.value === priority)?.label || 'Orta';
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.value === status)?.color || '#666';
  };

  const getStatusLabel = (status) => {
    return statuses.find(s => s.value === status)?.label || 'Açık';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-support">
      {/* Header */}
      <div className="support-header">
        <div className="header-left">
          <h2>🎧 Destek Merkezi</h2>
          <p>Kullanıcı destek talepleri ve ticket yönetimi</p>
        </div>
        <div className="header-actions">
          <button className="btn-knowledge-base">
            📚 Bilgi Bankası
          </button>
          <button className="btn-export">
            📊 Rapor İndir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="support-stats">
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <div className="stat-value">{ticketStats.total}</div>
            <div className="stat-label">Toplam Ticket</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📂</div>
          <div className="stat-content">
            <div className="stat-value">{ticketStats.open}</div>
            <div className="stat-label">Açık</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{ticketStats.inProgress}</div>
            <div className="stat-label">İşlemde</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{ticketStats.resolved}</div>
            <div className="stat-label">Çözüldü</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{ticketStats.avgResponseTime}</div>
            <div className="stat-label">Ort. Yanıt Süresi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">😊</div>
          <div className="stat-content">
            <div className="stat-value">%{ticketStats.satisfactionRate}</div>
            <div className="stat-label">Memnuniyet</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="support-content">
        {/* Sidebar */}
        <div className="support-sidebar">
          {/* Filters */}
          <div className="filters-section">
            <h3>Filtreler</h3>
            
            <div className="filter-group">
              <label>Arama</label>
              <input
                type="text"
                placeholder="🔍 Ticket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>Durum</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tümü</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Öncelik</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">Tümü</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <h3>Hızlı İstatistikler</h3>
            <div className="stat-item">
              <span className="stat-label">Bugün Açılan:</span>
              <span className="stat-value">12</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bekleyen:</span>
              <span className="stat-value">8</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Kritik:</span>
              <span className="stat-value">3</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="support-main">
          <div className="view-tabs">
            <button
              className={`view-tab ${activeView === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveView('tickets')}
            >
              🎫 Ticketlar
            </button>
            <button
              className={`view-tab ${activeView === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveView('faq')}
            >
              ❓ SSS
            </button>
            <button
              className={`view-tab ${activeView === 'canned' ? 'active' : ''}`}
              onClick={() => setActiveView('canned')}
            >
              📝 Hazır Yanıtlar
            </button>
          </div>

          {activeView === 'tickets' && (
            <>
              {/* Tickets List */}
              <div className="tickets-list">
                {filteredTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className={`ticket-item ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="ticket-header">
                      <div className="ticket-id">{ticket.id}</div>
                      <div 
                        className="ticket-priority"
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                      >
                        {getPriorityLabel(ticket.priority)}
                      </div>
                      <div 
                        className="ticket-status"
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        {getStatusLabel(ticket.status)}
                      </div>
                    </div>
                    
                    <h4 className="ticket-subject">{ticket.subject}</h4>
                    <p className="ticket-description">{ticket.description}</p>
                    
                    <div className="ticket-meta">
                      <span>{getCategoryIcon(ticket.category)} {getCategoryLabel(ticket.category)}</span>
                      <span>👤 {ticket.user}</span>
                      <span>📅 {formatDate(ticket.createdDate)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ticket Detail */}
              {selectedTicket && (
                <div className="ticket-detail">
                  <div className="detail-header">
                    <div className="detail-title">
                      <h3>{selectedTicket.subject}</h3>
                      <span className="ticket-id">{selectedTicket.id}</span>
                    </div>
                    <div className="detail-actions">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                        className="status-select"
                        style={{ borderColor: getStatusColor(selectedTicket.status) }}
                      >
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                        className="priority-select"
                        style={{ borderColor: getPriorityColor(selectedTicket.priority) }}
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="detail-info">
                    <div className="info-item">
                      <span className="info-label">Kullanıcı:</span>
                      <span className="info-value">{selectedTicket.user} ({selectedTicket.userEmail})</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Kategori:</span>
                      <span className="info-value">
                        {getCategoryIcon(selectedTicket.category)} {getCategoryLabel(selectedTicket.category)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Oluşturulma:</span>
                      <span className="info-value">{formatDate(selectedTicket.createdDate)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Son Güncelleme:</span>
                      <span className="info-value">{formatDate(selectedTicket.lastUpdate)}</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="ticket-messages">
                    <h4>Mesajlar</h4>
                    <div className="messages-list">
                      {selectedTicket.messages.map(message => (
                        <div 
                          key={message.id} 
                          className={`message-item ${message.type}`}
                        >
                          <div className="message-header">
                            <span className="message-sender">{message.sender}</span>
                            <span className="message-date">{formatDate(message.date)}</span>
                          </div>
                          <p className="message-content">{message.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="reply-section">
                      <textarea
                        placeholder="Yanıtınızı yazın..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows="4"
                      />
                      <div className="reply-actions">
                        <button
                          className="btn-canned"
                          onClick={() => setShowReplyModal(true)}
                        >
                          📝 Hazır Yanıt
                        </button>
                        <button
                          className="btn-send"
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim()}
                        >
                          📤 Gönder
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeView === 'faq' && (
            <div className="faq-section">
              <h3>Sık Sorulan Sorular</h3>
              <div className="faq-list">
                <div className="faq-item">
                  <h4>Şifremi nasıl sıfırlarım?</h4>
                  <p>Giriş ekranındaki "Şifremi Unuttum" linkine tıklayarak e-posta adresinize şifre sıfırlama linki gönderebilirsiniz.</p>
                </div>
                <div className="faq-item">
                  <h4>Videolar neden açılmıyor?</h4>
                  <p>Video sorunları genellikle internet bağlantısı veya tarayıcı uyumsuzluğundan kaynaklanır. Güncel bir tarayıcı kullandığınızdan emin olun.</p>
                </div>
                <div className="faq-item">
                  <h4>Sertifikamı nasıl alabilirim?</h4>
                  <p>Bir dersi %100 tamamladığınızda otomatik olarak sertifika oluşturulur. Profilinizden sertifikalarınıza erişebilirsiniz.</p>
                </div>
              </div>
            </div>
          )}

          {activeView === 'canned' && (
            <div className="canned-responses">
              <h3>Hazır Yanıtlar</h3>
              <div className="canned-list">
                {canned.map(response => (
                  <div key={response.id} className="canned-item">
                    <h4>{response.title}</h4>
                    <p>{response.message}</p>
                    <div className="canned-actions">
                      <button className="btn-use">Kullan</button>
                      <button className="btn-edit">Düzenle</button>
                      <button className="btn-delete">Sil</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-add-canned">
                ➕ Yeni Hazır Yanıt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
