import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './UserManager.css';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    grade: '',
    phone: '',
    parent_name: '',
    parent_phone: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    active: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // MongoDB'den gerçek kullanıcıları al
      const response = await apiService.get('/users');
      
      if (response && Array.isArray(response)) {
        // Backend'den gelen users array'i
        const formattedUsers = response.map(user => ({
          id: user.id || user._id,
          name: user.name || user.full_name,
          email: user.email,
          role: user.role,
          grade: user.grade || null,
          active: user.is_active !== false,
          created_at: user.created_at,
          last_login: user.last_login || user.created_at
        }));
        
        setUsers(formattedUsers);
        calculateStats(formattedUsers);
        console.log('✅ Kullanıcılar yüklendi:', formattedUsers.length);
      } else {
        throw new Error('Kullanıcılar alınamadı');
      }
    } catch (error) {
      console.error('Kullanıcı yükleme hatası:', error);
      console.warn('⚠️ API hatası, demo veri kullanılıyor');
      
      // Fallback: Demo veri
      const demoUsers = [
          {
            id: '1',
            name: 'Ahmet Yılmaz',
            email: 'ahmet@example.com',
            role: 'student',
            grade: 5,
            active: true,
            created_at: '2024-01-15',
            last_login: '2025-10-01'
          },
          {
            id: '2',
            name: 'Ayşe Kara',
            email: 'ayse@example.com',
            role: 'teacher',
            grade: null,
            active: true,
            created_at: '2024-02-20',
            last_login: '2025-09-30'
          },
          {
            id: '3',
            name: 'Mehmet Demir',
            email: 'mehmet@example.com',
            role: 'student',
            grade: 8,
            active: true,
            created_at: '2024-03-10',
            last_login: '2025-10-01'
          },
          {
            id: '4',
            name: 'Fatma Şahin',
            email: 'fatma@example.com',
            role: 'admin',
            grade: null,
            active: true,
            created_at: '2024-01-01',
            last_login: '2025-10-01'
          }
        ];
        setUsers(demoUsers);
        calculateStats(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList) => {
    setStats({
      total: userList.length,
      students: userList.filter(u => u.role === 'student').length,
      teachers: userList.filter(u => u.role === 'teacher').length,
      admins: userList.filter(u => u.role === 'admin').length,
      active: userList.filter(u => u.active).length
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      await apiService.patch(`/admin/users/${userId}/toggle-status`);
      fetchUsers();
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      alert('Kullanıcı durumu değiştirilemedi');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    
    try {
      await apiService.delete(`/admin/users/${userId}`);
      fetchUsers();
      alert('Kullanıcı silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Kullanıcı silinemedi');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      // Form validation
      if (!newUser.name || !newUser.email || !newUser.password) {
        alert('Lütfen tüm zorunlu alanları doldurun');
        return;
      }

      if (newUser.role === 'student' && !newUser.grade) {
        alert('Öğrenci için sınıf bilgisi zorunludur');
        return;
      }

      // Prepare user data - Backend RegisterSchema format
      const userData = {
        name: newUser.name,
        username: newUser.email.split('@')[0], // Email'in @ öncesi kısmını username yap
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      };

      // Add student-specific fields
      if (newUser.role === 'student') {
        userData.grade = parseInt(newUser.grade);
      }

      console.log('📤 Gönderilen kullanıcı verisi:', userData);
      const response = await apiService.post('/auth/register', userData);
      console.log('📥 API Yanıtı:', response);
      
      if (response.success || response.user || response.id) {
        alert('✅ Kullanıcı başarıyla eklendi!');
        setShowAddModal(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'student',
          grade: '',
          phone: '',
          parent_name: '',
          parent_phone: ''
        });
        fetchUsers();
      } else {
        const errorMsg = response.message || response.detail || JSON.stringify(response);
        alert('❌ Kullanıcı eklenemedi: ' + errorMsg);
      }
    } catch (error) {
      console.error('❌ Kullanıcı ekleme hatası:', error);
      console.error('Error response:', error.response);
      
      // Hata mesajını düzgün çıkar
      let errorMessage = 'Bilinmeyen hata';
      
      if (error.response?.data?.detail) {
        // FastAPI error format
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Validation errors
          errorMessage = detail.map(err => `${err.loc?.join(' → ')}: ${err.msg}`).join('\n');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('❌ Kullanıcı eklenemedi:\n\n' + errorMessage);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      student: { text: 'Öğrenci', class: 'badge-student', icon: '👨‍🎓' },
      teacher: { text: 'Öğretmen', class: 'badge-teacher', icon: '👨‍🏫' },
      admin: { text: 'Admin', class: 'badge-admin', icon: '⚙️' }
    };
    const badge = badges[role] || badges.student;
    return (
      <span className={`role-badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  return (
    <div className="user-manager">
      <div className="page-header">
        <h1>👥 Kullanıcı Yönetimi</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Yeni Kullanıcı Ekle
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Toplam Kullanıcı</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>{stats.students}</h3>
            <p>Öğrenci</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>{stats.teachers}</h3>
            <p>Öğretmen</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Aktif Kullanıcı</p>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="filters">
        <input
          type="text"
          placeholder="🔍 Kullanıcı ara (isim, email)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tüm Roller</option>
          <option value="student">Öğrenciler</option>
          <option value="teacher">Öğretmenler</option>
          <option value="admin">Adminler</option>
        </select>
      </div>

      {/* Kullanıcı Tablosu */}
      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>İsim</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Sınıf</th>
                <th>Durum</th>
                <th>Son Giriş</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    Kullanıcı bulunamadı
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{user.grade || '-'}</td>
                    <td>
                      <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                        {user.active ? '✅ Aktif' : '❌ Pasif'}
                      </span>
                    </td>
                    <td>{new Date(user.last_login).toLocaleDateString('tr-TR')}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleViewUser(user)}
                        title="Görüntüle"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.active ? 'Pasifleştir' : 'Aktifleştir'}
                      >
                        {user.active ? '🔴' : '🟢'}
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDeleteUser(user.id)}
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

      {/* Kullanıcı Detay Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Kullanıcı Detayları</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-item">
                  <label>İsim:</label>
                  <span>{selectedUser.name}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <label>Rol:</label>
                  <span>{getRoleBadge(selectedUser.role)}</span>
                </div>
                <div className="detail-item">
                  <label>Sınıf:</label>
                  <span>{selectedUser.grade || 'Belirtilmemiş'}</span>
                </div>
                <div className="detail-item">
                  <label>Durum:</label>
                  <span className={selectedUser.active ? 'text-success' : 'text-danger'}>
                    {selectedUser.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Kayıt Tarihi:</label>
                  <span>{new Date(selectedUser.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="detail-item">
                  <label>Son Giriş:</label>
                  <span>{new Date(selectedUser.last_login).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kullanıcı Ekleme Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Yeni Kullanıcı Ekle</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Ad Soyad <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Şifre <span className="required">*</span></label>
                  <input
                    type="password"
                    placeholder="Minimum 6 karakter"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    minLength="6"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Rol <span className="required">*</span></label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      required
                    >
                      <option value="student">👨‍🎓 Öğrenci</option>
                      <option value="teacher">👨‍🏫 Öğretmen</option>
                      <option value="admin">⚙️ Admin</option>
                    </select>
                  </div>

                  {newUser.role === 'student' && (
                    <div className="form-group">
                      <label>Sınıf <span className="required">*</span></label>
                      <select
                        value={newUser.grade}
                        onChange={(e) => setNewUser({...newUser, grade: e.target.value})}
                        required
                      >
                        <option value="">Sınıf Seçin</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                          <option key={g} value={g}>{g}. Sınıf</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>

                {newUser.role === 'student' && (
                  <>
                    <div className="form-group">
                      <label>Veli Adı Soyadı</label>
                      <input
                        type="text"
                        placeholder="Veli adı"
                        value={newUser.parent_name}
                        onChange={(e) => setNewUser({...newUser, parent_name: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Veli Telefonu</label>
                      <input
                        type="tel"
                        placeholder="05XX XXX XX XX"
                        value={newUser.parent_phone}
                        onChange={(e) => setNewUser({...newUser, parent_phone: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    ➕ Kullanıcı Ekle
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

export default UserManager;
