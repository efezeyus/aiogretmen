import React, { useState, useEffect } from 'react';
import './AdminUserManagement.css';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      role: 'student',
      grade: '5. Sınıf',
      status: 'active',
      lastLogin: '2025-01-02T10:30:00Z',
      joinDate: '2024-09-15T00:00:00Z',
      progress: 75,
      lessonsCompleted: 28,
      avatar: null
    },
    {
      id: 2,
      name: 'Ayşe Kaya',
      email: 'ayse@example.com',
      role: 'teacher',
      department: 'Matematik',
      status: 'active',
      lastLogin: '2025-01-02T09:15:00Z',
      joinDate: '2024-08-20T00:00:00Z',
      studentsCount: 45,
      avatar: null
    },
    {
      id: 3,
      name: 'Mehmet Demir',
      email: 'mehmet@example.com',
      role: 'parent',
      children: ['Fatma Demir', 'Ali Demir'],
      status: 'active',
      lastLogin: '2025-01-01T18:20:00Z',
      joinDate: '2024-10-05T00:00:00Z',
      avatar: null
    }
  ]);

  const [filteredUsers, setFilteredUsers] = useState(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    grade: '',
    department: '',
    password: '',
    status: 'active'
  });

  const [userStats] = useState({
    total: 2847,
    students: 2534,
    teachers: 156,
    parents: 157,
    active: 2623,
    inactive: 224
  });

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterRole, filterStatus, sortBy, sortOrder, users]);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.grade || '',
      department: user.department || '',
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setNewUser({
      name: '',
      email: '',
      role: 'student',
      grade: '',
      department: '',
      password: '',
      status: 'active'
    });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      // Update existing user
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...newUser }
          : user
      ));
    } else {
      // Add new user
      const newId = Math.max(...users.map(u => u.id)) + 1;
      const userToAdd = {
        ...newUser,
        id: newId,
        joinDate: new Date().toISOString(),
        lastLogin: null,
        progress: 0,
        lessonsCompleted: 0,
        studentsCount: 0,
        children: []
      };
      setUsers(prev => [...prev, userToAdd]);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'activate':
        setUsers(prev => prev.map(user =>
          selectedUsers.includes(user.id)
            ? { ...user, status: 'active' }
            : user
        ));
        break;
      case 'deactivate':
        setUsers(prev => prev.map(user =>
          selectedUsers.includes(user.id)
            ? { ...user, status: 'inactive' }
            : user
        ));
        break;
      case 'delete':
        if (window.confirm(`${selectedUsers.length} kullanıcıyı silmek istediğinizden emin misiniz?`)) {
          setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        }
        break;
      default:
        console.log('Bilinmeyen toplu işlem:', action);
    }
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Hiç giriş yapmadı';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return '🎓';
      case 'teacher': return '👨‍🏫';
      case 'parent': return '👪';
      case 'admin': return '👑';
      default: return '👤';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'student': return 'Öğrenci';
      case 'teacher': return 'Öğretmen';
      case 'parent': return 'Veli';
      case 'admin': return 'Yönetici';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="admin-user-management">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-left">
          <h2>👥 Kullanıcı Yönetimi</h2>
          <p>Sistem kullanıcılarını yönetin ve izleyin</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-add-user"
            onClick={handleAddUser}
          >
            ➕ Yeni Kullanıcı
          </button>
          {selectedUsers.length > 0 && (
            <button 
              className="btn-bulk-actions"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              ⚙️ Toplu İşlemler ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="user-stats-grid">
        <div className="user-stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{userStats.total}</div>
            <div className="stat-label">Toplam Kullanıcı</div>
          </div>
        </div>
        <div className="user-stat-card students">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <div className="stat-number">{userStats.students}</div>
            <div className="stat-label">Öğrenci</div>
          </div>
        </div>
        <div className="user-stat-card teachers">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-info">
            <div className="stat-number">{userStats.teachers}</div>
            <div className="stat-label">Öğretmen</div>
          </div>
        </div>
        <div className="user-stat-card parents">
          <div className="stat-icon">👪</div>
          <div className="stat-info">
            <div className="stat-number">{userStats.parents}</div>
            <div className="stat-label">Veli</div>
          </div>
        </div>
        <div className="user-stat-card active">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <div className="stat-number">{userStats.active}</div>
            <div className="stat-label">Aktif</div>
          </div>
        </div>
        <div className="user-stat-card inactive">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <div className="stat-number">{userStats.inactive}</div>
            <div className="stat-label">Pasif</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="user-filters">
        <div className="filter-search">
          <input
            type="text"
            placeholder="🔍 Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tüm Roller</option>
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
            <option value="parent">Veli</option>
            <option value="admin">Yönetici</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">İsme Göre</option>
            <option value="email">E-postaya Göre</option>
            <option value="role">Role Göre</option>
            <option value="lastLogin">Son Girişe Göre</option>
            <option value="joinDate">Katılım Tarihine Göre</option>
          </select>

          <button
            className={`sort-order-btn ${sortOrder}`}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '📈' : '📉'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bulk-actions-panel">
          <button onClick={() => handleBulkAction('activate')} className="bulk-btn activate">
            ✅ Aktifleştir
          </button>
          <button onClick={() => handleBulkAction('deactivate')} className="bulk-btn deactivate">
            ❌ Pasifleştir
          </button>
          <button onClick={() => handleBulkAction('delete')} className="bulk-btn delete">
            🗑️ Sil
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Kullanıcı</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Son Giriş</th>
              <th>Katılım Tarihi</th>
              <th>İstatistikler</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                  />
                </td>
                <td className="user-info">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    {user.grade && <div className="user-grade">{user.grade}</div>}
                    {user.department && <div className="user-department">{user.department}</div>}
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td className="user-role">
                  <span className={`role-badge ${user.role}`}>
                    {getRoleIcon(user.role)} {getRoleName(user.role)}
                  </span>
                </td>
                <td className="user-status">
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                  </span>
                </td>
                <td className="user-last-login">{formatDate(user.lastLogin)}</td>
                <td className="user-join-date">{formatDate(user.joinDate)}</td>
                <td className="user-stats">
                  {user.role === 'student' && (
                    <div className="student-stats">
                      <div>📚 {user.lessonsCompleted} ders</div>
                      <div>📊 %{user.progress} ilerleme</div>
                    </div>
                  )}
                  {user.role === 'teacher' && (
                    <div className="teacher-stats">
                      <div>👥 {user.studentsCount} öğrenci</div>
                    </div>
                  )}
                  {user.role === 'parent' && (
                    <div className="parent-stats">
                      <div>👶 {user.children?.length || 0} çocuk</div>
                    </div>
                  )}
                </td>
                <td className="user-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditUser(user)}
                    title="Düzenle"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Sil"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="user-modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Ad Soyad</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Kullanıcı adı"
                  />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="kullanici@example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="student">Öğrenci</option>
                    <option value="teacher">Öğretmen</option>
                    <option value="parent">Veli</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Durum</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>

              {newUser.role === 'student' && (
                <div className="form-group">
                  <label>Sınıf</label>
                  <select
                    value={newUser.grade}
                    onChange={(e) => setNewUser({...newUser, grade: e.target.value})}
                  >
                    <option value="">Sınıf seçin</option>
                    <option value="1. Sınıf">1. Sınıf</option>
                    <option value="2. Sınıf">2. Sınıf</option>
                    <option value="3. Sınıf">3. Sınıf</option>
                    <option value="4. Sınıf">4. Sınıf</option>
                    <option value="5. Sınıf">5. Sınıf</option>
                    <option value="6. Sınıf">6. Sınıf</option>
                    <option value="7. Sınıf">7. Sınıf</option>
                    <option value="8. Sınıf">8. Sınıf</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf">12. Sınıf</option>
                  </select>
                </div>
              )}

              {newUser.role === 'teacher' && (
                <div className="form-group">
                  <label>Bölüm</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  >
                    <option value="">Bölüm seçin</option>
                    <option value="Matematik">Matematik</option>
                    <option value="Türkçe">Türkçe</option>
                    <option value="Fen Bilimleri">Fen Bilimleri</option>
                    <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                    <option value="İngilizce">İngilizce</option>
                    <option value="Fizik">Fizik</option>
                    <option value="Kimya">Kimya</option>
                    <option value="Biyoloji">Biyoloji</option>
                    <option value="Tarih">Tarih</option>
                    <option value="Coğrafya">Coğrafya</option>
                  </select>
                </div>
              )}

              {!editingUser && (
                <div className="form-group">
                  <label>Şifre</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Güçlü bir şifre girin"
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowUserModal(false)}
              >
                İptal
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveUser}
              >
                {editingUser ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement; 