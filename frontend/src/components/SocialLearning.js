import React, { useState, useEffect } from 'react';
import './SocialLearning.css';

const SocialLearning = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [friends] = useState([
    { id: 1, name: 'Ayşe Kaya', avatar: '👧', grade: '5. Sınıf', status: 'online', lastActive: 'Şimdi', subjects: ['Matematik', 'Türkçe'], level: 8 },
    { id: 2, name: 'Mehmet Demir', avatar: '👦', grade: '5. Sınıf', status: 'online', lastActive: '2 dk önce', subjects: ['Fen Bilimleri', 'Matematik'], level: 7 },
    { id: 3, name: 'Zeynep Şahin', avatar: '👧', grade: '5. Sınıf', status: 'offline', lastActive: '1 saat önce', subjects: ['Türkçe', 'Sosyal Bilgiler'], level: 6 },
    { id: 4, name: 'Ali Yılmaz', avatar: '👦', grade: '5. Sınıf', status: 'online', lastActive: '5 dk önce', subjects: ['Matematik'], level: 9 }
  ]);

  const [studyGroups] = useState([
    { id: 1, name: 'Matematik Dehaları', subject: 'Matematik', members: 8, maxMembers: 10, level: 'İleri', description: 'Kesirler ve ondalık sayılar üzerine çalışıyoruz' },
    { id: 2, name: 'Fen Bilimleri Keşif', subject: 'Fen Bilimleri', members: 5, maxMembers: 8, level: 'Orta', description: 'Maddenin halleri ve değişimleri' },
    { id: 3, name: 'Türkçe Yazarlar', subject: 'Türkçe', members: 6, maxMembers: 8, level: 'Başlangıç', description: 'Kompozisyon yazma teknikleri' }
  ]);

  const [discussions] = useState([
    { id: 1, title: 'Kesirlerde Çarpma İşlemi', author: 'Ayşe K.', replies: 12, views: 45, lastReply: '2 saat önce', subject: 'Matematik', isHot: true },
    { id: 2, title: 'Maddenin Halleri Nasıl Değişir?', author: 'Mehmet D.', replies: 8, views: 32, lastReply: '4 saat önce', subject: 'Fen Bilimleri', isHot: false },
    { id: 3, title: 'Kompozisyon Yazma İpuçları', author: 'Zeynep Ş.', replies: 15, views: 67, lastReply: '1 gün önce', subject: 'Türkçe', isHot: true }
  ]);

  const [collaborativeProjects] = useState([
    { id: 1, title: 'Matematik Projesi: Geometrik Şekiller', subject: 'Matematik', participants: 4, progress: 75, deadline: '3 gün', description: 'Geometrik şekillerin çevre ve alan hesaplamaları' },
    { id: 2, title: 'Fen Projesi: Bitki Büyümesi', subject: 'Fen Bilimleri', participants: 3, progress: 45, deadline: '1 hafta', description: 'Farklı koşullarda bitki büyümesi gözlemi' },
    { id: 3, title: 'Türkçe Projesi: Hikaye Yazma', subject: 'Türkçe', participants: 5, progress: 90, deadline: 'Yarın', description: 'Ortak hikaye yazma projesi' }
  ]);

  const [friendRequests] = useState([
    { id: 1, name: 'Elif Özkan', avatar: '👧', grade: '5. Sınıf', subjects: ['Matematik', 'Fen Bilimleri'], mutualFriends: 3 },
    { id: 2, name: 'Can Arslan', avatar: '👦', grade: '5. Sınıf', subjects: ['Türkçe'], mutualFriends: 1 }
  ]);

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendMessage = (friendId) => {
    console.log(`Mesaj gönder: ${friendId}`);
    // Mesajlaşma modalını aç
  };

  const handleJoinGroup = (groupId) => {
    console.log(`Gruba katıl: ${groupId}`);
    // Grup katılım işlemi
  };

  const handleJoinDiscussion = (discussionId) => {
    console.log(`Tartışmaya katıl: ${discussionId}`);
    // Tartışma sayfasına yönlendir
  };

  const handleJoinProject = (projectId) => {
    console.log(`Projeye katıl: ${projectId}`);
    // Proje detay sayfasına yönlendir
  };

  return (
    <div className="social-learning">
      {/* Header */}
      <div className="social-header">
        <h1>👥 Sosyal Öğrenme</h1>
        <p>Arkadaşlarınızla birlikte öğrenin, tartışın ve projeler geliştirin</p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Arkadaş, grup veya konu ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Arkadaşlar ({friends.length})
        </button>
        <button 
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          👨‍👩‍👧‍👦 Çalışma Grupları ({studyGroups.length})
        </button>
        <button 
          className={`tab ${activeTab === 'discussions' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussions')}
        >
          💬 Tartışmalar ({discussions.length})
        </button>
        <button 
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          🚀 Ortak Projeler ({collaborativeProjects.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="friends-section">
            <div className="section-header">
              <h3>Arkadaşlarım</h3>
              <div className="friend-requests">
                <span className="request-count">{friendRequests.length}</span>
                <span>Arkadaşlık İsteği</span>
              </div>
            </div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="friend-requests-section">
                <h4>Arkadaşlık İstekleri</h4>
                <div className="requests-list">
                  {friendRequests.map(request => (
                    <div key={request.id} className="friend-request">
                      <div className="request-avatar">{request.avatar}</div>
                      <div className="request-info">
                        <h5>{request.name}</h5>
                        <p>{request.grade} • {request.subjects.join(', ')}</p>
                        <small>{request.mutualFriends} ortak arkadaş</small>
                      </div>
                      <div className="request-actions">
                        <button className="btn-accept">✓ Kabul Et</button>
                        <button className="btn-decline">✗ Reddet</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="friends-list">
              {filteredFriends.map(friend => (
                <div key={friend.id} className="friend-item">
                  <div className="friend-avatar">
                    {friend.avatar}
                    <div className={`status-indicator ${friend.status}`} />
                  </div>
                  <div className="friend-info">
                    <h4>{friend.name}</h4>
                    <p>{friend.grade} • Seviye {friend.level}</p>
                    <div className="friend-subjects">
                      {friend.subjects.map((subject, index) => (
                        <span key={index} className="subject-tag">{subject}</span>
                      ))}
                    </div>
                    <small>Son aktif: {friend.lastActive}</small>
                  </div>
                  <div className="friend-actions">
                    <button 
                      className="btn-message"
                      onClick={() => handleSendMessage(friend.id)}
                    >
                      💬 Mesaj
                    </button>
                    <button className="btn-study">📚 Birlikte Çalış</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Groups Tab */}
        {activeTab === 'groups' && (
          <div className="groups-section">
            <div className="section-header">
              <h3>Çalışma Grupları</h3>
              <button className="btn-create-group">+ Yeni Grup Oluştur</button>
            </div>

            <div className="groups-grid">
              {studyGroups.map(group => (
                <div key={group.id} className="group-card">
                  <div className="group-header">
                    <h4>{group.name}</h4>
                    <span className="group-subject">{group.subject}</span>
                  </div>
                  <p className="group-description">{group.description}</p>
                  <div className="group-stats">
                    <span className="members-count">
                      👥 {group.members}/{group.maxMembers} üye
                    </span>
                    <span className="group-level">📊 {group.level}</span>
                  </div>
                  <div className="group-actions">
                    <button 
                      className="btn-join-group"
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      Katıl
                    </button>
                    <button className="btn-view-group">Görüntüle</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="discussions-section">
            <div className="section-header">
              <h3>Tartışma Forumları</h3>
              <button className="btn-start-discussion">+ Yeni Tartışma Başlat</button>
            </div>

            <div className="discussions-list">
              {discussions.map(discussion => (
                <div key={discussion.id} className={`discussion-item ${discussion.isHot ? 'hot' : ''}`}>
                  {discussion.isHot && <div className="hot-badge">🔥</div>}
                  <div className="discussion-content">
                    <h4>{discussion.title}</h4>
                    <div className="discussion-meta">
                      <span className="author">👤 {discussion.author}</span>
                      <span className="subject">📚 {discussion.subject}</span>
                      <span className="stats">
                        💬 {discussion.replies} yanıt • 👁️ {discussion.views} görüntüleme
                      </span>
                    </div>
                    <small>Son yanıt: {discussion.lastReply}</small>
                  </div>
                  <div className="discussion-actions">
                    <button 
                      className="btn-join-discussion"
                      onClick={() => handleJoinDiscussion(discussion.id)}
                    >
                      Katıl
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="projects-section">
            <div className="section-header">
              <h3>Ortak Projeler</h3>
              <button className="btn-create-project">+ Yeni Proje Oluştur</button>
            </div>

            <div className="projects-grid">
              {collaborativeProjects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h4>{project.title}</h4>
                    <span className="project-subject">{project.subject}</span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-stats">
                    <div className="project-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">%{project.progress} tamamlandı</span>
                    </div>
                    <div className="project-meta">
                      <span>👥 {project.participants} katılımcı</span>
                      <span>⏰ {project.deadline} kaldı</span>
                    </div>
                  </div>
                  <div className="project-actions">
                    <button 
                      className="btn-join-project"
                      onClick={() => handleJoinProject(project.id)}
                    >
                      Katıl
                    </button>
                    <button className="btn-view-project">Görüntüle</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Sidebar */}
      <div className="quick-actions-sidebar">
        <h4>Hızlı Erişim</h4>
        <div className="quick-actions-list">
          <button className="quick-action">
            <span className="action-icon">📞</span>
            <span>Görüntülü Görüşme</span>
          </button>
          <button className="quick-action">
            <span className="action-icon">📝</span>
            <span>Ödev Paylaş</span>
          </button>
          <button className="quick-action">
            <span className="action-icon">🎮</span>
            <span>Oyun Oyna</span>
          </button>
          <button className="quick-action">
            <span className="action-icon">📊</span>
            <span>Skor Karşılaştır</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialLearning; 