import React, { useState, useEffect } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// Admin Alt Sayfaları
import FeatureManager from './FeatureManager';
import UserManager from './UserManager';
import ContentManager from './ContentManager';
import AnalyticsOverview from './AnalyticsOverview';
import SystemSettings from './SystemSettings';
import ServiceMonitor from './ServiceMonitor';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    redis: 'checking',
    elasticsearch: 'checking'
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLessons: 0,
    totalQuizzes: 0
  });

  const menuItems = [
    { icon: '🎯', title: 'Özellik Yönetimi', path: '/admin/features', description: 'Sistem özelliklerini yönet' },
    { icon: '👥', title: 'Kullanıcı Yönetimi', path: '/admin/users', description: 'Kullanıcıları yönet' },
    { icon: '📚', title: 'İçerik Yönetimi', path: '/admin/content', description: 'Ders içeriklerini düzenle' },
    { icon: '📊', title: 'Analitik', path: '/admin/analytics', description: 'Sistem istatistikleri' },
    { icon: '⚙️', title: 'Sistem Ayarları', path: '/admin/settings', description: 'Genel ayarlar' },
    { icon: '🔧', title: 'Servis Durumu', path: '/admin/services', description: 'Servis monitörü' }
  ];

  useEffect(() => {
    checkSystemStatus();
    fetchStats();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Backend health check
      const healthResponse = await fetch('http://localhost:8000/health');
      const healthData = await healthResponse.json();
      
      // System health check
      const systemResponse = await fetch('http://localhost:8000/api/system/health');
      const systemData = await systemResponse.json();
      
      setSystemStatus({
        backend: healthData.status === 'healthy' ? 'active' : 'error',
        database: systemData.services?.mongodb?.status === 'active' ? 'active' : 
                  systemData.services?.mongodb?.status === 'error' ? 'error' : 'warning',
        redis: systemData.services?.redis?.status === 'active' ? 'active' : 'warning',
        elasticsearch: systemData.services?.elasticsearch?.status === 'active' ? 'active' : 'warning'
      });
    } catch (error) {
      console.error('System status check error:', error);
      setSystemStatus({
        backend: 'error',
        database: 'error',
        redis: 'warning',
        elasticsearch: 'warning'
      });
    }
  };

  const fetchStats = async () => {
    try {
      // API'den gerçek istatistikleri al
      const response = await fetch('http://localhost:8000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.total_users || 0,
          activeUsers: data.active_users || 0,
          totalLessons: data.total_lessons || 0,
          totalQuizzes: data.total_quizzes || 0
        });
      } else {
        // API başarısız olursa varsayılan değerler
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalLessons: 0,
          totalQuizzes: 0
        });
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
      // Hata durumunda 0 değerleri göster
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalLessons: 0,
        totalQuizzes: 0
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '⏳';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>🎓 Admin Panel</h2>
          <p>aiogretmen.com</p>
        </div>
        
        <nav className="admin-nav">
          {menuItems.map((item, index) => (
            <Link 
              key={index}
              to={item.path}
              className="admin-nav-item"
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-title">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-user-info">
          <img src="/assets/admin-avatar.svg" alt="Admin" />
          <div>
            <p className="admin-name">Admin User</p>
            <Link to="/logout" className="logout-link">Çıkış Yap</Link>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-outline"
          >
            Ana Sayfaya Dön
          </button>
        </div>

        <Routes>
          <Route path="/" element={
            <>
              {/* System Status */}
              <div className="status-cards">
                <div className="status-card">
                  <h3>Sistem Durumu</h3>
                  <div className="status-list">
                    <div className="status-item">
                      <span>Backend API</span>
                      <span>{getStatusIcon(systemStatus.backend)}</span>
                    </div>
                    <div className="status-item">
                      <span>MongoDB</span>
                      <span>{getStatusIcon(systemStatus.database)}</span>
                    </div>
                    <div className="status-item">
                      <span>Redis Cache</span>
                      <span>{getStatusIcon(systemStatus.redis)}</span>
                    </div>
                    <div className="status-item">
                      <span>Elasticsearch</span>
                      <span>{getStatusIcon(systemStatus.elasticsearch)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="stats-cards">
                  <div className="stat-card">
                    <h4>Toplam Kullanıcı</h4>
                    <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Aktif Kullanıcı</h4>
                    <p className="stat-value">{stats.activeUsers.toLocaleString()}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Ders Sayısı</h4>
                    <p className="stat-value">{stats.totalLessons}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Quiz Sayısı</h4>
                    <p className="stat-value">{stats.totalQuizzes}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h2>Hızlı İşlemler</h2>
                <div className="action-grid">
                  {menuItems.map((item, index) => (
                    <Link 
                      key={index}
                      to={item.path}
                      className="action-card"
                    >
                      <div className="action-icon">{item.icon}</div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          } />
          
          <Route path="/features/*" element={<FeatureManager />} />
          <Route path="/users/*" element={<UserManager />} />
          <Route path="/content/*" element={<ContentManager />} />
          <Route path="/analytics/*" element={<AnalyticsOverview />} />
          <Route path="/settings/*" element={<SystemSettings />} />
          <Route path="/services/*" element={<ServiceMonitor />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
