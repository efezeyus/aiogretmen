import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminUserManagement from './AdminUserManagement';
import AdminLessonManagementEnhanced from './AdminLessonManagementEnhanced';
import AdminQuizManagement from './AdminQuizManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminNotifications from './AdminNotifications';
import AdminContentManagement from './AdminContentManagement';
import AdminSettings from './AdminSettings';
import AdminSupport from './AdminSupport';
import AdminLogs from './AdminLogs';
import SystemMonitor from './SystemMonitor';
import AdminStudentAnalytics from './AdminStudentAnalytics';
import AdminAIManagement from './AdminAIManagement';
import AdminLessonCurriculum from './AdminLessonCurriculum';
import AdminDashboardEnhanced from './AdminDashboardEnhanced';
import AdminBlockchainCertificates from './AdminBlockchainCertificates';
import AdminLiveClassroom from './AdminLiveClassroom';
import AdminAITraining from './AdminAITraining';
import AdminPaymentSystem from './AdminPaymentSystem';
import AdminReportingCenter from './AdminReportingCenter';
import AdminBulkOperations from './AdminBulkOperations';
import AdminAPIKeys from './AdminAPIKeys';
import AdminWebhooks from './AdminWebhooks';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1234,
    activeUsers: 456,
    totalLessons: 89,
    totalQuizzes: 234,
    systemUptime: '99.9%',
    activeAISessions: 23
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', message: 'Yeni kullanıcı kaydı: Ahmet Yılmaz', time: '5 dakika önce', read: false },
    { id: 2, type: 'warning', message: 'Disk kullanımı %85\'e ulaştı', time: '1 saat önce', read: false },
    { id: 3, type: 'success', message: 'Sistem yedeklemesi tamamlandı', time: '3 saat önce', read: true }
  ]);

  const [recentActivities] = useState([
    { id: 1, user: 'Ahmet Yılmaz', action: 'Yeni ders tamamladı', subject: 'Matematik - Kesirler', time: '10 dakika önce' },
    { id: 2, user: 'Ayşe Kaya', action: 'Quiz başladı', subject: 'Fen Bilimleri', time: '25 dakika önce' },
    { id: 3, user: 'Mehmet Demir', action: 'AI ile sohbet', subject: 'İngilizce ödev yardımı', time: '1 saat önce' }
  ]);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        activeAISessions: prev.activeAISessions + Math.floor(Math.random() * 3) - 1
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'broadcast':
        alert('Toplu bildirim gönderme sayfası açılıyor...');
        break;
      case 'backup':
        alert('Sistem yedekleme başlatılıyor...');
        break;
      case 'maintenance':
        alert('Bakım modu ayarları açılıyor...');
        break;
      case 'reports':
        alert('Raporlar sayfası açılıyor...');
        break;
      default:
        break;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardEnhanced />;

      case 'users':
        return <AdminUserManagement />;

      case 'lessons':
        return <AdminLessonManagementEnhanced />;

      case 'quizzes':
        return <AdminQuizManagement />;

      case 'analytics':
        return <AdminAnalytics />;

      case 'notifications':
        return <AdminNotifications />;

      case 'content':
        return <AdminContentManagement />;

      case 'settings':
        return <AdminSettings />;

      case 'support':
        return <AdminSupport />;

      case 'logs':
        return <AdminLogs />;
        
      case 'system-monitor':
        return <SystemMonitor />;
        
      case 'student-analytics':
        return <AdminStudentAnalytics />;
        
      case 'ai-management':
        return <AdminAIManagement />;
        
      case 'curriculum':
        return <AdminLessonCurriculum />;
      
      case 'blockchain':
        return <AdminBlockchainCertificates />;
      
      case 'live-classroom':
        return <AdminLiveClassroom />;
      
      case 'ai-training':
        return <AdminAITraining />;
      
      case 'payments':
        return <AdminPaymentSystem />;
      
      case 'reports':
        return <AdminReportingCenter />;
      
      case 'bulk':
        return <AdminBulkOperations />;
      
      case 'api-keys':
        return <AdminAPIKeys />;
      
      case 'webhooks':
        return <AdminWebhooks />;

      default:
        return (
          <div className="tab-content">
            <h2>Dashboard</h2>
            <p>Ana kontrol paneli</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1>🛠️ Admin Paneli</h1>
          <p>Yapay Zeka Öğretmen Yönetim Sistemi</p>
        </div>
        <div className="header-right">
          <div className="notifications">
            <button className="notification-btn">
              🔔
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="admin-nav">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Dashboard</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-label">Kullanıcılar</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <span className="tab-icon">📚</span>
            <span className="tab-label">Dersler</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => setActiveTab('curriculum')}
          >
            <span className="tab-icon">🎯</span>
            <span className="tab-label">Müfredat</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            <span className="tab-icon">📝</span>
            <span className="tab-label">Quizler</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="tab-icon">📈</span>
            <span className="tab-label">Analitik</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <span className="tab-icon">💳</span>
            <span className="tab-label">Ödemeler</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Raporlar</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'student-analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('student-analytics')}
          >
            <span className="tab-icon">🎓</span>
            <span className="tab-label">Öğrenci Analizi</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'ai-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-management')}
          >
            <span className="tab-icon">🤖</span>
            <span className="tab-label">AI Yönetimi</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'ai-training' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-training')}
          >
            <span className="tab-icon">🧠</span>
            <span className="tab-label">AI Eğitimi</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="tab-icon">🔔</span>
            <span className="tab-label">Bildirimler</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <span className="tab-icon">📁</span>
            <span className="tab-label">İçerik</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">Ayarlar</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            <span className="tab-icon">📦</span>
            <span className="tab-label">Toplu İşlem</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
          >
            <span className="tab-icon">🔑</span>
            <span className="tab-label">API Keys</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            <span className="tab-icon">🔗</span>
            <span className="tab-label">Webhooks</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span className="tab-icon">🆘</span>
            <span className="tab-label">Destek</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">Loglar</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'system-monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('system-monitor')}
          >
            <span className="tab-icon">🖥️</span>
            <span className="tab-label">Sistem İzleme</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'blockchain' ? 'active' : ''}`}
            onClick={() => setActiveTab('blockchain')}
          >
            <span className="tab-icon">🔗</span>
            <span className="tab-label">Blockchain</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'live-classroom' ? 'active' : ''}`}
            onClick={() => setActiveTab('live-classroom')}
          >
            <span className="tab-icon">🎥</span>
            <span className="tab-label">Canlı Sınıf</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;