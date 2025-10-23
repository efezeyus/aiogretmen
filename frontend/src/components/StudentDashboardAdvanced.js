import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import advancedAITeacher from '../services/advancedAITeacher';
import selfLearningAI from '../services/selfLearningAI';
import AIStudyBuddy from './AIStudyBuddy';
import './StudentDashboardAdvanced.css';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

// Chart.js registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const StudentDashboardAdvanced = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // State Management
  const [activeView, setActiveView] = useState('overview'); // overview, analytics, social, achievements, schedule
  const [showBuddyChat, setShowBuddyChat] = useState(false);
  
  const [studentData, setStudentData] = useState({
    id: localStorage.getItem('userId') || user?.id || 'guest',
    name: localStorage.getItem('userName') || user?.name || 'Öğrenci',
    email: localStorage.getItem('userEmail') || user?.email || '',
    grade: '5. Sınıf',
    avatar: '🎓',
    school: 'Yapay Zeka İlkokulu'
  });

  // AI-Powered Insights
  const [aiInsights, setAiInsights] = useState({
    dailyMotivation: '',
    learningRecommendations: [],
    performancePrediction: {},
    emotionalStatus: {},
    optimalStudyTime: '',
    focusLevel: 0,
    stressLevel: 0
  });

  // Learning Metrics
  const [learningMetrics, setLearningMetrics] = useState({
    totalStudyTime: 0,
    todayStudyTime: 0,
    weeklyGoal: 300, // minutes
    streak: 0,
    totalPoints: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    masteredConcepts: [],
    strugglingConcepts: [],
    learningVelocity: 0,
    accuracy: 0,
    engagement: 0
  });

  // Personalized Learning Path
  const [learningPath, setLearningPath] = useState({
    currentMilestone: {},
    nextMilestone: {},
    completedMilestones: [],
    suggestedTopics: [],
    adaptiveChallenges: [],
    personalizedResources: []
  });

  // Social Learning
  const [socialData, setSocialData] = useState({
    studyGroups: [],
    classmates: [],
    collaborativeProjects: [],
    peerMessages: [],
    teacherFeedback: [],
    parentUpdates: []
  });

  // Gamification
  const [gamificationData, setGamificationData] = useState({
    badges: [],
    achievements: [],
    leaderboardPosition: 0,
    challenges: [],
    rewards: [],
    inventory: [],
    virtualPet: {
      name: 'Bilgi',
      type: 'owl',
      level: 1,
      happiness: 80,
      energy: 100
    }
  });

  // Schedule & Calendar
  const [scheduleData, setScheduleData] = useState({
    todayClasses: [],
    upcomingAssignments: [],
    studyReminders: [],
    personalizedSchedule: [],
    optimalBreaks: []
  });

  // Wellness Data
  const [wellnessData, setWellnessData] = useState({
    moodHistory: [],
    stressIndicators: [],
    sleepQuality: 0,
    physicalActivity: 0,
    mindfulnessMinutes: 0,
    wellbeingScore: 0
  });

  // AI Dashboard State
  const [aiDashboard, setAiDashboard] = useState({
    isListening: false,
    aiMessage: '',
    showAIAssistant: false,
    aiMood: 'friendly',
    suggestions: []
  });

  // Initialize Dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      console.log('🎓 Dashboard initializing...');
      console.log('🔍 Auth loading:', authLoading);
      console.log('🔍 Is authenticated:', isAuthenticated);
      console.log('🔍 User:', user);
      
      // Auth yükleniyorsa bekle
      if (authLoading) {
        console.log('⏳ Waiting for auth...');
        return;
      }
      
      // Auth değilse login'e yönlendir
      if (!isAuthenticated || !user) {
        console.log('❌ Not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Öğrenci değilse uyarı ver ama yine de devam et (test için)
      if (user.role !== 'student' && user.type !== 'student') {
        console.warn('⚠️ User is not a student but allowing access for testing');
      }

      console.log('✅ Auth check passed, loading dashboard...');

      // User data'yı güncelle
      setStudentData(prev => ({
        ...prev,
        id: user.id || prev.id,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));

      // Load AI insights
      await loadAIInsights();
      
      // Load student metrics
      await loadStudentMetrics();
      
      // Start real-time monitoring
      startRealTimeMonitoring();
      
      // Get personalized greeting
      getPersonalizedGreeting();
    };

    initializeDashboard();
  }, [navigate, isAuthenticated, user, authLoading]);

  // Load AI Insights
  const loadAIInsights = async () => {
    try {
      console.log('📊 AI Insights yükleniyor...');
      
      // Fallback demo data
      const demoInsights = {
        dailyMotivation: generateMotivationalMessage(),
        learningRecommendations: [
          'Kesirler konusunu pekiştir',
          'Geometri çalışmalarına başla',
          'Günlük 30 dakika matematik pratiği yap'
        ],
        performancePrediction: {
          nextWeekScore: 85,
          trend: 'improving'
        },
        emotionalStatus: {
          mood: 'positive',
          stress: 20,
          engagement: 80
        },
        optimalStudyTime: calculateOptimalStudyTime(),
        focusLevel: calculateFocusLevel(),
        stressLevel: 20
      };

      // Try advanced AI teacher
      try {
        if (advancedAITeacher?.modules?.predictive) {
          const insights = await advancedAITeacher.modules.predictive.predict({
            studentId: studentData.id,
            currentTime: new Date().toISOString()
          });
          
          if (insights) {
            demoInsights.performancePrediction = insights.performance || demoInsights.performancePrediction;
          }
        }
      } catch (aiError) {
        console.warn('Advanced AI unavailable, using demo data');
      }

      setAiInsights(demoInsights);
      console.log('✅ AI Insights yüklendi');
    } catch (error) {
      console.error('AI insights yükleme hatası:', error);
      // Hata durumunda bile temel insights ver
      setAiInsights({
        dailyMotivation: 'Bugün harika bir öğrenme günü! 🌟',
        learningRecommendations: [],
        performancePrediction: {},
        emotionalStatus: {},
        optimalStudyTime: 'Şimdi çalışmak için iyi bir zaman!',
        focusLevel: 75,
        stressLevel: 0
      });
    }
  };

  // Load Student Metrics
  const loadStudentMetrics = async () => {
    try {
      console.log('📈 Öğrenci metrikleri yükleniyor...');
      
      // Demo metrikleri
      const demoMetrics = {
        totalStudyTime: 480, // 8 saat
        todayStudyTime: getTodayStudyTime() || 45,
        weeklyGoal: 300,
        streak: calculateStreak() || 7,
        totalPoints: calculateTotalPoints() || 1250,
        level: 15,
        xp: 3250,
        xpToNextLevel: 4000,
        masteredConcepts: ['Doğal Sayılar', 'Toplama', 'Çarpma'],
        strugglingConcepts: ['Kesir Toplama', 'Ondalık Bölme'],
        learningVelocity: 1.2,
        accuracy: 78,
        engagement: 85
      };

      // Try to get real metrics
      try {
        if (selfLearningAI?.getPerformanceMetrics) {
          const metrics = selfLearningAI.getPerformanceMetrics(studentData.id);
          
          if (metrics && metrics.totalInteractions > 0) {
            const advancedMetrics = calculateAdvancedMetrics(metrics);
            Object.assign(demoMetrics, {
              ...advancedMetrics,
              totalStudyTime: metrics.totalInteractions * 5 || demoMetrics.totalStudyTime,
              accuracy: (metrics.avgSuccessRate * 100) || demoMetrics.accuracy
            });
          }
        }
      } catch (aiError) {
        console.warn('Self-learning AI unavailable, using demo data');
      }

      setLearningMetrics(demoMetrics);
      console.log('✅ Metrikler yüklendi:', demoMetrics);

      // Update learning path
      updateLearningPath();
    } catch (error) {
      console.error('Metrik yükleme hatası:', error);
      // Hata durumunda temel metrikler
      setLearningMetrics({
        totalStudyTime: 0,
        todayStudyTime: 0,
        weeklyGoal: 300,
        streak: 0,
        totalPoints: 0,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        masteredConcepts: [],
        strugglingConcepts: [],
        learningVelocity: 1.0,
        accuracy: 0,
        engagement: 0
      });
    }
  };

  // Real-time Monitoring
  const startRealTimeMonitoring = () => {
    const monitoringInterval = setInterval(() => {
      // Update focus level based on activity
      updateFocusLevel();
      
      // Check for optimal break time
      checkBreakTime();
      
      // Update wellness indicators
      updateWellnessIndicators();
    }, 60000); // Every minute

    return () => clearInterval(monitoringInterval);
  };

  // Personalized Greeting
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    const name = studentData.name.split(' ')[0];
    
    let greeting = '';
    let aiMood = 'friendly';
    
    if (hour < 12) {
      greeting = `Günaydın ${name}! ☀️ Harika bir öğrenme günü seni bekliyor!`;
      aiMood = 'energetic';
    } else if (hour < 17) {
      greeting = `Merhaba ${name}! 🌟 Öğleden sonra enerjin nasıl?`;
      aiMood = 'encouraging';
    } else {
      greeting = `İyi akşamlar ${name}! 🌙 Bugün neler öğrendin?`;
      aiMood = 'calm';
    }

    // Add personalized touch based on recent activity
    if (learningMetrics.streak > 3) {
      greeting += ` ${learningMetrics.streak} günlük serini koruyorsun, harika! 🔥`;
    }

    setAiDashboard(prev => ({
      ...prev,
      aiMessage: greeting,
      aiMood: aiMood
    }));
  };

  // Helper Functions
  const generateMotivationalMessage = () => {
    const messages = [
      "Bugün yeni bir şeyler öğrenmek için harika bir gün! 🚀",
      "Her küçük adım, büyük başarılara giden yolda önemlidir! 💪",
      "Merakın seni harika yerlere götürecek! 🌟",
      "Hatalardan korkmadan öğrenmek, gerçek bilgeliğin anahtarıdır! 🔑",
      "Bugün kendini geçmiş halinden daha iyi yap! 📈"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const calculateOptimalStudyTime = () => {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) return "Şu an! Beynin en verimli saatleri 🧠";
    if (hour >= 15 && hour <= 17) return "15:00 - 17:00 arası";
    if (hour >= 19 && hour <= 21) return "19:00 - 21:00 arası";
    return "Dinlenme zamanı 😴";
  };

  const calculateFocusLevel = () => {
    // Simulated focus calculation
    return Math.floor(Math.random() * 30) + 70;
  };

  const getTodayStudyTime = () => {
    // Get today's study time from localStorage or API
    return parseInt(localStorage.getItem('todayStudyTime') || '0');
  };

  const calculateStreak = () => {
    // Calculate learning streak
    return parseInt(localStorage.getItem('learningStreak') || '0');
  };

  const calculateTotalPoints = () => {
    // Calculate total points
    return parseInt(localStorage.getItem('totalPoints') || '0');
  };

  const calculateAdvancedMetrics = (metrics) => {
    return {
      learningVelocity: metrics.patterns?.length / (metrics.totalInteractions || 1),
      masteredConcepts: metrics.topStrategies?.map(s => s.strategy) || [],
      strugglingConcepts: metrics.commonMistakes || []
    };
  };

  const updateLearningPath = () => {
    // Update personalized learning path
    const path = {
      currentMilestone: {
        title: "Kesirler ve Ondalık Sayılar",
        progress: 65,
        estimatedCompletion: "2 gün"
      },
      nextMilestone: {
        title: "Geometrik Şekiller",
        difficulty: "Orta",
        estimatedTime: "1 hafta"
      },
      completedMilestones: [
        "Doğal Sayılar",
        "Toplama ve Çıkarma",
        "Çarpma İşlemi"
      ],
      suggestedTopics: [
        "Problem Çözme Teknikleri",
        "Zihinden Hesaplama"
      ]
    };
    setLearningPath(path);
  };

  const updateFocusLevel = () => {
    // Update focus based on activity patterns
    setAiInsights(prev => ({
      ...prev,
      focusLevel: calculateFocusLevel()
    }));
  };

  const checkBreakTime = () => {
    // Check if it's time for a break
    if (learningMetrics.todayStudyTime > 0 && learningMetrics.todayStudyTime % 25 === 0) {
      showBreakNotification();
    }
  };

  const updateWellnessIndicators = () => {
    // Update wellness data
    setWellnessData(prev => ({
      ...prev,
      wellbeingScore: calculateWellbeingScore()
    }));
  };

  const calculateWellbeingScore = () => {
    // Calculate overall wellbeing
    return Math.floor(Math.random() * 20) + 80;
  };

  const showBreakNotification = () => {
    // Show break reminder
    setAiDashboard(prev => ({
      ...prev,
      aiMessage: "🧘 Mola zamanı! 5 dakika göz dinlendirmesi yapmaya ne dersin?",
      showAIAssistant: true
    }));
  };

  // Chart Data
  const getProgressChartData = () => ({
    labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    datasets: [{
      label: 'Öğrenme Süresi (dk)',
      data: [45, 60, 30, 75, 90, 120, 60],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4
    }]
  });

  const getSkillsRadarData = () => ({
    labels: ['Matematik', 'Fen', 'Türkçe', 'Sosyal', 'İngilizce', 'Sanat'],
    datasets: [{
      label: 'Beceri Seviyen',
      data: [85, 70, 90, 75, 60, 80],
      backgroundColor: 'rgba(102, 126, 234, 0.2)',
      borderColor: '#667eea',
      pointBackgroundColor: '#667eea'
    }]
  });

  const getAchievementDonutData = () => ({
    labels: ['Tamamlanan', 'Devam Eden', 'Kilitli'],
    datasets: [{
      data: [15, 8, 12],
      backgroundColor: ['#48bb78', '#667eea', '#e2e8f0'],
      borderWidth: 0
    }]
  });

  // Navigation Functions
  const navigateToLesson = (lessonId) => {
    navigate(`/student/lesson/${lessonId}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // AI Assistant Functions
  const toggleAIAssistant = () => {
    setAiDashboard(prev => ({
      ...prev,
      showAIAssistant: !prev.showAIAssistant
    }));
  };

  const sendToAI = async (message) => {
    try {
      const response = await advancedAITeacher.teach({
        message: message,
        studentId: studentData.id,
        context: 'dashboard'
      });

      setAiDashboard(prev => ({
        ...prev,
        aiMessage: response.message || "Nasıl yardımcı olabilirim?"
      }));
    } catch (error) {
      console.error('AI yanıt hatası:', error);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>🎓</div>
          <div>Dashboard yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>🔒</div>
          <div>Giriş yapmanız gerekiyor...</div>
          <button 
            onClick={() => navigate('/login')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-advanced">
      {/* Top Navigation Bar */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">AI Öğretmen</span>
          </div>
          
          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <span className="nav-icon">🏠</span>
              Genel Bakış
            </button>
            <button 
              className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveView('analytics')}
            >
              <span className="nav-icon">📊</span>
              Analizler
            </button>
            <button 
              className={`nav-btn ${activeView === 'social' ? 'active' : ''}`}
              onClick={() => setActiveView('social')}
            >
              <span className="nav-icon">👥</span>
              Sosyal
            </button>
            <button 
              className={`nav-btn ${activeView === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveView('achievements')}
            >
              <span className="nav-icon">🏆</span>
              Başarılar
            </button>
            <button 
              className={`nav-btn ${activeView === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveView('schedule')}
            >
              <span className="nav-icon">📅</span>
              Program
            </button>
          </nav>
        </div>

        <div className="header-right">
          {/* AI Quick Actions */}
          <button className="ai-quick-btn" title="Sesli Asistan">
            🎤
          </button>
          
          {/* Notifications */}
          <button className="notification-btn">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>
          
          {/* User Profile */}
          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{studentData.name}</span>
              <span className="user-grade">{studentData.grade}</span>
            </div>
            <div className="user-avatar">{studentData.avatar}</div>
            <button className="logout-btn" onClick={handleLogout}>
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* AI Floating Assistant */}
      <div className={`ai-assistant-float ${aiDashboard.showAIAssistant ? 'active' : ''}`}>
        <button className="ai-toggle-btn" onClick={toggleAIAssistant}>
          <span className="ai-avatar">🤖</span>
        </button>
        
        {aiDashboard.showAIAssistant && (
          <div className="ai-assistant-panel">
            <div className="ai-header">
              <h3>AI Asistan</h3>
              <button className="close-btn" onClick={toggleAIAssistant}>✕</button>
            </div>
            <div className="ai-message">
              <p>{aiDashboard.aiMessage}</p>
            </div>
            <div className="ai-suggestions">
              <button onClick={() => sendToAI("Bugün ne öğrenmeliyim?")}>
                💡 Öneri Al
              </button>
              <button onClick={() => sendToAI("Nasıl daha iyi öğrenebilirim?")}>
                🎯 Strateji
              </button>
              <button onClick={() => sendToAI("Motivasyona ihtiyacım var")}>
                💪 Motivasyon
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="view-container overview-view">
            {/* Welcome Section with AI Insights */}
            <section className="welcome-section">
              <div className="welcome-content">
                <h1 className="welcome-title">
                  {new Date().getHours() < 12 ? 'Günaydın' : 
                   new Date().getHours() < 17 ? 'İyi Günler' : 'İyi Akşamlar'}, 
                  {' ' + studentData.name.split(' ')[0]}! 👋
                </h1>
                <p className="motivation-text">{aiInsights.dailyMotivation}</p>
                
                {/* Real-time Status */}
                <div className="status-indicators">
                  <div className="status-item">
                    <span className="status-icon">🧠</span>
                    <span className="status-label">Odak</span>
                    <span className="status-value">{aiInsights.focusLevel}%</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">⚡</span>
                    <span className="status-label">Enerji</span>
                    <span className="status-value">
                      {gamificationData.virtualPet.energy}%
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">😊</span>
                    <span className="status-label">Ruh Hali</span>
                    <span className="status-value">İyi</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">⏰</span>
                    <span className="status-label">Optimal Çalışma</span>
                    <span className="status-value">{aiInsights.optimalStudyTime}</span>
                  </div>
                </div>
              </div>
              
              {/* Virtual Pet */}
              <div className="virtual-pet-widget">
                <div className="pet-container">
                  <div className="pet-avatar">🦉</div>
                  <div className="pet-info">
                    <h4>{gamificationData.virtualPet.name}</h4>
                    <p>Seviye {gamificationData.virtualPet.level}</p>
                    <div className="pet-stats">
                      <div className="pet-stat">
                        <span>😊</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill happiness"
                            style={{width: `${gamificationData.virtualPet.happiness}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="pet-stat">
                        <span>⚡</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill energy"
                            style={{width: `${gamificationData.virtualPet.energy}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Learning Progress Overview */}
            <section className="progress-overview">
              <h2 className="section-title">Öğrenme İlerleme</h2>
              
              <div className="progress-cards">
                {/* Daily Progress */}
                <div className="progress-card daily">
                  <div className="card-header">
                    <h3>Günlük Hedef</h3>
                    <span className="progress-percentage">
                      {Math.round((learningMetrics.todayStudyTime / 60) * 100)}%
                    </span>
                  </div>
                  <div className="progress-visual">
                    <div className="circular-progress">
                      <svg viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#e0e7ff"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#667eea"
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - learningMetrics.todayStudyTime / 60)}`}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="progress-text">
                        {learningMetrics.todayStudyTime}<span>dk</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="footer-text">Hedef: 60 dakika</span>
                    <button className="action-btn">Çalışmaya Başla</button>
                  </div>
                </div>

                {/* Weekly Progress */}
                <div className="progress-card weekly">
                  <div className="card-header">
                    <h3>Haftalık İlerleme</h3>
                    <span className="trend-indicator positive">↑ 15%</span>
                  </div>
                  <div className="progress-visual">
                    <Line 
                      data={getProgressChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  </div>
                  <div className="card-footer">
                    <span className="streak-info">
                      🔥 {learningMetrics.streak} günlük seri!
                    </span>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="progress-card level">
                  <div className="card-header">
                    <h3>Seviye İlerlemesi</h3>
                    <span className="level-badge">Lvl {learningMetrics.level}</span>
                  </div>
                  <div className="xp-progress">
                    <div className="xp-info">
                      <span>XP: {learningMetrics.xp}/{learningMetrics.xpToNextLevel}</span>
                      <span>{learningMetrics.xpToNextLevel - learningMetrics.xp} XP kaldı</span>
                    </div>
                    <div className="xp-bar">
                      <div 
                        className="xp-fill"
                        style={{width: `${(learningMetrics.xp / learningMetrics.xpToNextLevel) * 100}%`}}
                      >
                        <span className="xp-sparkle">✨</span>
                      </div>
                    </div>
                  </div>
                  <div className="rewards-preview">
                    <span>Sonraki Ödül:</span>
                    <div className="reward-item">🎖️ Matematik Ustası</div>
                  </div>
                </div>
              </div>
            </section>

            {/* AI-Powered Learning Recommendations */}
            <section className="ai-recommendations">
              <h2 className="section-title">
                🤖 AI Önerileri
                <span className="ai-badge">Kişiselleştirilmiş</span>
              </h2>
              
              <div className="recommendations-grid">
                {/* Optimal Study Topic */}
                <div className="recommendation-card optimal-topic">
                  <div className="rec-icon">🎯</div>
                  <h3>Bugünkü En İyi Konu</h3>
                  <p className="rec-content">
                    {learningPath.currentMilestone.title}
                  </p>
                  <div className="rec-meta">
                    <span className="difficulty">Zorluk: Orta</span>
                    <span className="duration">~20 dk</span>
                  </div>
                  <button 
                    className="start-btn"
                    onClick={() => navigateToLesson(1)}
                  >
                    Hemen Başla
                  </button>
                </div>

                {/* Struggling Concept Alert */}
                <div className="recommendation-card struggling-alert">
                  <div className="rec-icon">💡</div>
                  <h3>Tekrar Et</h3>
                  <p className="rec-content">
                    Kesirler konusunda biraz daha pratik yapalım
                  </p>
                  <div className="practice-options">
                    <button className="practice-btn">Hızlı Quiz</button>
                    <button className="practice-btn">Video İzle</button>
                  </div>
                </div>

                {/* Peer Learning Opportunity */}
                <div className="recommendation-card peer-learning">
                  <div className="rec-icon">👥</div>
                  <h3>Grup Çalışması</h3>
                  <p className="rec-content">
                    Sınıf arkadaşların da bu konuyu çalışıyor!
                  </p>
                  <div className="peer-avatars">
                    <span className="peer-avatar">👦</span>
                    <span className="peer-avatar">👧</span>
                    <span className="peer-avatar">👦</span>
                    <span className="peer-count">+3</span>
                  </div>
                  <button className="join-btn">Gruba Katıl</button>
                </div>

                {/* Break Reminder */}
                {learningMetrics.todayStudyTime > 30 && (
                  <div className="recommendation-card break-reminder">
                    <div className="rec-icon">🧘</div>
                    <h3>Mola Zamanı</h3>
                    <p className="rec-content">
                      30 dakikadır çalışıyorsun. Kısa bir ara vermeye ne dersin?
                    </p>
                    <div className="break-activities">
                      <button className="activity-btn">🚶 Yürüyüş</button>
                      <button className="activity-btn">💧 Su İç</button>
                      <button className="activity-btn">👀 Göz Egzersizi</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="quick-actions">
              <h2 className="section-title">Hızlı Erişim</h2>
              
              <div className="actions-grid">
                <button className="action-card" onClick={() => navigate('/student/courses')}>
                  <span className="action-icon">📚</span>
                  <span className="action-label">Derslerim</span>
                </button>
                
                <button className="action-card" onClick={() => navigate('/student/quiz')}>
                  <span className="action-icon">📝</span>
                  <span className="action-label">Quizler</span>
                </button>
                
                <button className="action-card" onClick={() => navigate('/student/progress')}>
                  <span className="action-icon">📈</span>
                  <span className="action-label">İlerleme</span>
                </button>
                
                <button className="action-card" onClick={() => navigate('/student/achievements')}>
                  <span className="action-icon">🏆</span>
                  <span className="action-label">Başarılarım</span>
                </button>
                
                <button className="action-card" onClick={() => navigate('/student/profile')}>
                  <span className="action-icon">👤</span>
                  <span className="action-label">Profilim</span>
                </button>
                
                <button className="action-card" onClick={() => navigate('/student/settings')}>
                  <span className="action-icon">⚙️</span>
                  <span className="action-label">Ayarlar</span>
                </button>
                
                <button className="action-card" onClick={() => setShowBuddyChat(true)}>
                  <span className="action-icon">🤖</span>
                  <span className="action-label">AI Buddy</span>
                </button>
                
                <button className="action-card" onClick={() => navigate('/student/lesson/1')}>
                  <span className="action-icon">▶️</span>
                  <span className="action-label">Ders Başlat</span>
                </button>
                
                <button className="action-card">
                  <span className="action-icon">📝</span>
                  <span className="action-label">Ödevler</span>
                  <span className="action-badge">2 yeni</span>
                </button>
                
                <button className="action-card">
                  <span className="action-icon">🎮</span>
                  <span className="action-label">Öğrenme Oyunları</span>
                </button>
                
                <button className="action-card">
                  <span className="action-icon">📊</span>
                  <span className="action-label">Raporlarım</span>
                </button>
                
                <button className="action-card">
                  <span className="action-icon">🏆</span>
                  <span className="action-label">Yarışmalar</span>
                </button>
                
                <button className="action-card">
                  <span className="action-icon">💬</span>
                  <span className="action-label">Soru Sor</span>
                </button>
              </div>
            </section>

            {/* Live Learning Feed */}
            <section className="learning-feed">
              <h2 className="section-title">Canlı Akış</h2>
              
              <div className="feed-items">
                <div className="feed-item achievement">
                  <span className="feed-icon">🎉</span>
                  <div className="feed-content">
                    <p><strong>Ayşe</strong> "Matematik Kahramanı" rozetini kazandı!</p>
                    <span className="feed-time">5 dk önce</span>
                  </div>
                </div>
                
                <div className="feed-item study-group">
                  <span className="feed-icon">👥</span>
                  <div className="feed-content">
                    <p>Fen Bilgisi çalışma grubu başladı</p>
                    <button className="join-quick">Katıl</button>
                  </div>
                </div>
                
                <div className="feed-item challenge">
                  <span className="feed-icon">🎯</span>
                  <div className="feed-content">
                    <p>Yeni Haftalık Meydan Okuma: "Problem Çözme Ustası"</p>
                    <span className="feed-time">1 saat önce</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="view-container analytics-view">
            <h1 className="view-title">Öğrenme Analizlerin</h1>
            
            {/* Performance Overview */}
            <section className="analytics-section">
              <h2>Performans Özeti</h2>
              
              <div className="analytics-cards">
                <div className="analytics-card">
                  <h3>Genel Başarı</h3>
                  <div className="big-number">{Math.round(learningMetrics.accuracy)}%</div>
                  <span className="trend positive">↑ 5% bu hafta</span>
                </div>
                
                <div className="analytics-card">
                  <h3>Öğrenme Hızı</h3>
                  <div className="big-number">
                    {learningMetrics.learningVelocity.toFixed(1)}x
                  </div>
                  <span className="subtitle">Normal hızdan</span>
                </div>
                
                <div className="analytics-card">
                  <h3>Tamamlanan Konu</h3>
                  <div className="big-number">
                    {learningPath.completedMilestones.length}
                  </div>
                  <span className="subtitle">Bu dönem</span>
                </div>
                
                <div className="analytics-card">
                  <h3>Aktif Gün</h3>
                  <div className="big-number">{learningMetrics.streak}</div>
                  <span className="subtitle">Ardışık</span>
                </div>
              </div>
            </section>

            {/* Skills Radar Chart */}
            <section className="analytics-section">
              <h2>Beceri Haritası</h2>
              <div className="chart-container">
                <Radar data={getSkillsRadarData()} options={{
                  responsive: true,
                  maintainAspectRatio: false
                }} />
              </div>
            </section>

            {/* Learning Patterns */}
            <section className="analytics-section">
              <h2>Öğrenme Desenleri</h2>
              
              <div className="patterns-grid">
                <div className="pattern-card">
                  <h3>En Verimli Saatler</h3>
                  <div className="time-heatmap">
                    {/* Time heatmap visualization */}
                    <div className="heatmap-row">
                      <span className="time-label">Sabah</span>
                      <div className="heat-cells">
                        <div className="heat-cell high"></div>
                        <div className="heat-cell high"></div>
                        <div className="heat-cell medium"></div>
                      </div>
                    </div>
                    <div className="heatmap-row">
                      <span className="time-label">Öğlen</span>
                      <div className="heat-cells">
                        <div className="heat-cell medium"></div>
                        <div className="heat-cell low"></div>
                        <div className="heat-cell low"></div>
                      </div>
                    </div>
                    <div className="heatmap-row">
                      <span className="time-label">Akşam</span>
                      <div className="heat-cells">
                        <div className="heat-cell medium"></div>
                        <div className="heat-cell high"></div>
                        <div className="heat-cell medium"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pattern-card">
                  <h3>Öğrenme Tarzı</h3>
                  <div className="learning-style-viz">
                    <div className="style-bar">
                      <span className="style-label">👁️ Görsel</span>
                      <div className="bar-fill" style={{width: '80%'}}></div>
                    </div>
                    <div className="style-bar">
                      <span className="style-label">👂 İşitsel</span>
                      <div className="bar-fill" style={{width: '60%'}}></div>
                    </div>
                    <div className="style-bar">
                      <span className="style-label">✋ Kinestetik</span>
                      <div className="bar-fill" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Predictions */}
            <section className="analytics-section">
              <h2>AI Tahminleri</h2>
              
              <div className="predictions-container">
                <div className="prediction-card">
                  <h3>Gelecek Hafta Tahmini</h3>
                  <p>Mevcut hızınla devam edersen, "Kesirler" konusunu 
                     <strong> 3 gün</strong> içinde tamamlayacaksın!</p>
                </div>
                
                <div className="prediction-card">
                  <h3>Güçlü Yönlerin</h3>
                  <ul>
                    <li>Problem çözme becerin harika! 🌟</li>
                    <li>Görsel öğrenmede çok başarılısın 👁️</li>
                    <li>Matematik hesaplamalarında hızlısın ⚡</li>
                  </ul>
                </div>
                
                <div className="prediction-card">
                  <h3>Gelişim Alanları</h3>
                  <ul>
                    <li>Okuma hızını artırabilirsin 📚</li>
                    <li>Kelime hazineni genişletebilirsin 📝</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Social View */}
        {activeView === 'social' && (
          <div className="view-container social-view">
            <h1 className="view-title">Sosyal Öğrenme</h1>
            
            {/* Study Groups */}
            <section className="social-section">
              <h2>Çalışma Grupları</h2>
              
              <div className="study-groups-grid">
                <div className="study-group-card active">
                  <div className="group-header">
                    <h3>Matematik Takımı</h3>
                    <span className="member-count">5 üye</span>
                  </div>
                  <div className="group-members">
                    <span className="member-avatar">👦</span>
                    <span className="member-avatar">👧</span>
                    <span className="member-avatar">👦</span>
                    <span className="member-avatar">👧</span>
                    <span className="member-avatar">👦</span>
                  </div>
                  <div className="group-activity">
                    <span className="activity-status online">Şu an aktif</span>
                    <p>Kesirler konusunu çalışıyor</p>
                  </div>
                  <button className="join-group-btn">Katıl</button>
                </div>
                
                <div className="study-group-card">
                  <div className="group-header">
                    <h3>Fen Kaşifleri</h3>
                    <span className="member-count">8 üye</span>
                  </div>
                  <div className="group-members">
                    <span className="member-avatar">👧</span>
                    <span className="member-avatar">👦</span>
                    <span className="member-avatar">👧</span>
                    <span className="more-members">+5</span>
                  </div>
                  <div className="group-activity">
                    <span className="activity-status">Sonraki: 16:00</span>
                    <p>Deney yapacağız!</p>
                  </div>
                  <button className="join-group-btn">Katıl</button>
                </div>
              </div>
            </section>

            {/* Classmates Activity */}
            <section className="social-section">
              <h2>Sınıf Arkadaşların</h2>
              
              <div className="classmates-list">
                <div className="classmate-item">
                  <div className="classmate-avatar">👧</div>
                  <div className="classmate-info">
                    <h4>Ayşe K.</h4>
                    <p className="status">Matematik çalışıyor</p>
                  </div>
                  <div className="classmate-stats">
                    <span className="stat">🔥 15 gün</span>
                    <span className="stat">⭐ 1250 XP</span>
                  </div>
                  <button className="invite-btn">Birlikte Çalış</button>
                </div>
                
                <div className="classmate-item">
                  <div className="classmate-avatar">👦</div>
                  <div className="classmate-info">
                    <h4>Mehmet Y.</h4>
                    <p className="status">Çevrimdışı</p>
                  </div>
                  <div className="classmate-stats">
                    <span className="stat">🔥 8 gün</span>
                    <span className="stat">⭐ 980 XP</span>
                  </div>
                  <button className="invite-btn" disabled>Davet Et</button>
                </div>
              </div>
            </section>

            {/* Collaborative Projects */}
            <section className="social-section">
              <h2>Grup Projeleri</h2>
              
              <div className="projects-grid">
                <div className="project-card">
                  <div className="project-header">
                    <h3>Güneş Sistemi Sunumu</h3>
                    <span className="due-date">3 gün kaldı</span>
                  </div>
                  <div className="project-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '60%'}}></div>
                    </div>
                    <span>%60 tamamlandı</span>
                  </div>
                  <div className="project-team">
                    <span className="team-member">👦 Sen</span>
                    <span className="team-member">👧 Elif</span>
                    <span className="team-member">👦 Can</span>
                  </div>
                  <button className="continue-btn">Devam Et</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Achievements View */}
        {activeView === 'achievements' && (
          <div className="view-container achievements-view">
            <h1 className="view-title">Başarılar & Rozetler</h1>
            
            {/* Achievement Stats */}
            <section className="achievement-stats">
              <div className="stats-overview">
                <div className="stat-item">
                  <span className="stat-value">
                    {gamificationData.achievements.length}
                  </span>
                  <span className="stat-label">Toplam Başarı</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {gamificationData.badges.length}
                  </span>
                  <span className="stat-label">Rozet</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {learningMetrics.totalPoints}
                  </span>
                  <span className="stat-label">Puan</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    #{gamificationData.leaderboardPosition}
                  </span>
                  <span className="stat-label">Sıralama</span>
                </div>
              </div>
            </section>

            {/* Recent Achievements */}
            <section className="achievements-section">
              <h2>Son Başarılar</h2>
              
              <div className="achievements-grid">
                <div className="achievement-card unlocked">
                  <div className="achievement-icon">🎯</div>
                  <h3>İlk Adım</h3>
                  <p>İlk dersini tamamladın!</p>
                  <span className="unlock-date">2 gün önce</span>
                </div>
                
                <div className="achievement-card unlocked">
                  <div className="achievement-icon">🔥</div>
                  <h3>Ateşli Seri</h3>
                  <p>7 gün üst üste çalıştın!</p>
                  <span className="unlock-date">Bugün</span>
                </div>
                
                <div className="achievement-card locked">
                  <div className="achievement-icon">🏆</div>
                  <h3>Matematik Şampiyonu</h3>
                  <p>10 matematik konusunu tamamla</p>
                  <div className="progress-mini">
                    <div className="progress-fill" style={{width: '70%'}}></div>
                  </div>
                  <span className="progress-text">7/10</span>
                </div>
              </div>
            </section>

            {/* Badges Collection */}
            <section className="badges-section">
              <h2>Rozet Koleksiyonu</h2>
              
              <div className="badges-grid">
                <div className="badge-item earned">
                  <div className="badge-icon">🌟</div>
                  <span className="badge-name">Başlangıç</span>
                </div>
                <div className="badge-item earned">
                  <div className="badge-icon">📚</div>
                  <span className="badge-name">Kitap Kurdu</span>
                </div>
                <div className="badge-item earned">
                  <div className="badge-icon">🧮</div>
                  <span className="badge-name">Hesap Ustası</span>
                </div>
                <div className="badge-item locked">
                  <div className="badge-icon">🎖️</div>
                  <span className="badge-name">???</span>
                </div>
              </div>
            </section>

            {/* Leaderboard */}
            <section className="leaderboard-section">
              <h2>Sınıf Sıralaması</h2>
              
              <div className="leaderboard">
                <div className="leaderboard-item top">
                  <span className="rank">1</span>
                  <div className="user-info">
                    <span className="avatar">👧</span>
                    <span className="name">Zeynep A.</span>
                  </div>
                  <span className="points">2,450 XP</span>
                </div>
                
                <div className="leaderboard-item top">
                  <span className="rank">2</span>
                  <div className="user-info">
                    <span className="avatar">👦</span>
                    <span className="name">Ali K.</span>
                  </div>
                  <span className="points">2,320 XP</span>
                </div>
                
                <div className="leaderboard-item top">
                  <span className="rank">3</span>
                  <div className="user-info">
                    <span className="avatar">👧</span>
                    <span className="name">Ayşe B.</span>
                  </div>
                  <span className="points">2,180 XP</span>
                </div>
                
                <div className="leaderboard-item current-user">
                  <span className="rank">
                    {gamificationData.leaderboardPosition}
                  </span>
                  <div className="user-info">
                    <span className="avatar">{studentData.avatar}</span>
                    <span className="name">Sen</span>
                  </div>
                  <span className="points">{learningMetrics.totalPoints} XP</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Schedule View */}
        {activeView === 'schedule' && (
          <div className="view-container schedule-view">
            <h1 className="view-title">Öğrenme Programım</h1>
            
            {/* Today's Schedule */}
            <section className="schedule-section">
              <h2>Bugünkü Program</h2>
              
              <div className="schedule-timeline">
                <div className="timeline-item completed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <span className="time">09:00</span>
                    <div className="event-info">
                      <h4>Matematik - Kesirler</h4>
                      <p>Tamamlandı ✓</p>
                    </div>
                  </div>
                </div>
                
                <div className="timeline-item current">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <span className="time">10:30</span>
                    <div className="event-info">
                      <h4>Fen Bilgisi - Güneş Sistemi</h4>
                      <p>Şu an</p>
                      <button className="start-class-btn">Derse Başla</button>
                    </div>
                  </div>
                </div>
                
                <div className="timeline-item upcoming">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <span className="time">14:00</span>
                    <div className="event-info">
                      <h4>İngilizce - Kelime Çalışması</h4>
                      <p>Yaklaşıyor</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Optimized Schedule */}
            <section className="schedule-section">
              <h2>AI Önerilen Program</h2>
              
              <div className="ai-schedule-card">
                <div className="schedule-insight">
                  <span className="insight-icon">🤖</span>
                  <p>
                    Senin için en verimli çalışma saatleri 
                    <strong> 09:00-11:00</strong> ve 
                    <strong> 15:00-17:00</strong> arasında!
                  </p>
                </div>
                
                <div className="optimized-schedule">
                  <div className="schedule-block math">
                    <span className="block-time">09:00 - 09:45</span>
                    <span className="block-subject">Matematik</span>
                    <span className="block-topic">Problem Çözme</span>
                  </div>
                  
                  <div className="schedule-block break">
                    <span className="block-time">09:45 - 10:00</span>
                    <span className="block-subject">Mola</span>
                    <span className="block-topic">Hareket et!</span>
                  </div>
                  
                  <div className="schedule-block science">
                    <span className="block-time">10:00 - 10:45</span>
                    <span className="block-subject">Fen Bilgisi</span>
                    <span className="block-topic">Deney Zamanı</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Upcoming Assignments */}
            <section className="assignments-section">
              <h2>Yaklaşan Ödevler</h2>
              
              <div className="assignments-list">
                <div className="assignment-item">
                  <div className="assignment-icon">📝</div>
                  <div className="assignment-info">
                    <h4>Matematik Alıştırmaları</h4>
                    <p>10 soru çöz</p>
                  </div>
                  <div className="assignment-meta">
                    <span className="due-time">Yarın</span>
                    <button className="start-btn">Başla</button>
                  </div>
                </div>
                
                <div className="assignment-item">
                  <div className="assignment-icon">📖</div>
                  <div className="assignment-info">
                    <h4>Okuma Ödevi</h4>
                    <p>"Küçük Prens" 20 sayfa</p>
                  </div>
                  <div className="assignment-meta">
                    <span className="due-time">2 gün</span>
                    <button className="start-btn">Başla</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Wellness Widget */}
      <div className="wellness-widget">
        <div className="wellness-header">
          <h3>Nasıl Hissediyorsun?</h3>
        </div>
        <div className="mood-selector">
          <button className="mood-btn">😊</button>
          <button className="mood-btn">😐</button>
          <button className="mood-btn">😔</button>
          <button className="mood-btn">😰</button>
          <button className="mood-btn">🤗</button>
        </div>
        <div className="wellness-tip">
          <p>💡 İpucu: Düzenli molalar vermek öğrenme verimliliğini artırır!</p>
        </div>
      </div>
      
      {/* AI Study Buddy Chat */}
      {showBuddyChat && (
        <div className="buddy-chat-modal">
          <div className="buddy-chat-container">
            <button 
              className="buddy-close-btn"
              onClick={() => setShowBuddyChat(false)}
            >
              ✕
            </button>
            <AIStudyBuddy studentId={studentData.id} />
          </div>
        </div>
      )}
      
      {/* Floating AI Buddy Button */}
      <button 
        className="floating-buddy-btn"
        onClick={() => setShowBuddyChat(!showBuddyChat)}
        title="AI Arkadaşım"
      >
        <span className="buddy-icon">🤖</span>
        <span className="buddy-pulse"></span>
      </button>
    </div>
  );
};

export default StudentDashboardAdvanced;
