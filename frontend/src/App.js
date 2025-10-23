import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { AuthProvider } from './hooks/useAuth';
import './App.css';

// Layout Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// New Components - Placement & Progress
import PlacementTest from './components/PlacementTest';
import ProgressDashboard from './components/ProgressDashboard';
import AdminApprovalPanel from './components/AdminApprovalPanel';

// Student Pages
import StudentDashboardComplete from './components/StudentDashboardComplete';
import StudentDashboardAdvanced from './components/StudentDashboardAdvanced';
import StudentDashboardFixed from './components/StudentDashboardFixed';
import StudentDashboardTest from './components/StudentDashboardTest';
import StudentDashboardSimple from './components/StudentDashboardSimple';
import StudentDashboardDebug from './components/StudentDashboardDebug';
import CourseList from './components/CourseList';
import LessonRoom from './components/LessonRoom';
import LessonRoomAdvanced from './components/LessonRoomAdvanced';
import LessonRoomUltimate from './components/LessonRoomUltimate';
import QuizPlayer from './components/QuizPlayer';
import VoiceAssistant from './components/VoiceAssistant';
import StudyPlanner from './components/StudyPlanner';
import GamificationSystem from './components/GamificationSystem';
import SocialLearning from './components/SocialLearning';

// Student Dashboard Sub-Pages (YENİ)
import StudentProfile from './pages/dashboard/StudentProfile';
import StudentQuizList from './pages/dashboard/StudentQuizList';
import StudentProgress from './pages/dashboard/StudentProgress';
import StudentAchievements from './pages/dashboard/StudentAchievements';
import StudentSettings from './pages/dashboard/StudentSettings';

// Teacher Pages
import TeacherDashboard from './components/teachers/TeacherDashboard';
import LessonCreator from './components/teachers/LessonCreator';

// Parent Pages
import ParentDashboard from './components/ParentDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDashboardNew from './pages/admin/AdminDashboardNew';
import AITrainingDashboard from './pages/admin/AITrainingDashboard';

// Feature Pages
import Features from './pages/Features';
import AILearning from './pages/features/AILearning';
import GamificationFeature from './pages/features/GamificationFeature';
import BlockchainFeature from './pages/features/BlockchainFeature';
import AdaptiveLearning from './pages/features/AdaptiveLearning';
import TranslationFeature from './pages/features/TranslationFeature';
import VoiceAssistantFeature from './pages/features/VoiceAssistantFeature';
import ComputerVision from './pages/features/ComputerVision';
import AnalyticsFeature from './pages/features/AnalyticsFeature';
import PeerLearning from './pages/features/PeerLearning';
import ParentDashboardFeature from './pages/features/ParentDashboardFeature';
import StudyPlannerFeature from './pages/features/StudyPlannerFeature';
import EmotionAIFeature from './pages/features/EmotionAI';

// Other Pages
import Pricing from './pages/PricingPage';
import Contact from './pages/Contact';
import About from './pages/About';
import Demo from './pages/Demo';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes - No Layout (Full Page) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact-new" element={<ContactPage />} />
            
            {/* Public Routes with Layout */}
            <Route path="/login" element={<Layout><LoginPage /></Layout>} />
            <Route path="/register" element={<Layout><LoginPage /></Layout>} />
            <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/about-old" element={<Layout><About /></Layout>} />
            <Route path="/demo" element={<Layout><Demo /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/cookies" element={<Layout><Cookies /></Layout>} />
            
            {/* Feature Pages with Layout */}
            <Route path="/features" element={<Layout><Features /></Layout>} />
            <Route path="/features/ai-learning" element={<Layout><AILearning /></Layout>} />
            <Route path="/features/gamification" element={<Layout><GamificationFeature /></Layout>} />
            <Route path="/features/blockchain" element={<Layout><BlockchainFeature /></Layout>} />
            <Route path="/features/adaptive-learning" element={<Layout><AdaptiveLearning /></Layout>} />
            <Route path="/features/translation" element={<Layout><TranslationFeature /></Layout>} />
            <Route path="/features/voice-assistant" element={<Layout><VoiceAssistantFeature /></Layout>} />
            <Route path="/features/computer-vision" element={<Layout><ComputerVision /></Layout>} />
            <Route path="/features/analytics" element={<Layout><AnalyticsFeature /></Layout>} />
            <Route path="/features/peer-learning" element={<Layout><PeerLearning /></Layout>} />
            <Route path="/features/parent-dashboard" element={<Layout><ParentDashboardFeature /></Layout>} />
            <Route path="/features/study-planner" element={<Layout><StudyPlannerFeature /></Layout>} />
            <Route path="/features/emotion-ai" element={<Layout><EmotionAIFeature /></Layout>} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
              
              {/* Student Routes */}
              <Route path="/student">
                <Route index element={<StudentDashboardComplete />} />
                <Route path="dashboard" element={<StudentDashboardComplete />} />
                <Route path="dashboard-advanced" element={<StudentDashboardAdvanced />} />
                <Route path="dashboard-old" element={<StudentDashboardFixed />} />
                <Route path="test" element={<StudentDashboardTest />} />
                <Route path="simple" element={<StudentDashboardSimple />} />
                <Route path="debug" element={<StudentDashboardDebug />} />
                
                {/* NEW: Placement & Progress */}
                <Route path="placement-test" element={<PlacementTest />} />
                <Route path="progress-curriculum" element={<ProgressDashboard />} />
                
                {/* Yeni Alt Sayfalar */}
                <Route path="profile" element={<StudentProfile />} />
                <Route path="quiz" element={<StudentQuizList />} />
                <Route path="progress" element={<StudentProgress />} />
                <Route path="achievements" element={<StudentAchievements />} />
                <Route path="settings" element={<StudentSettings />} />
                
                {/* Mevcut Sayfalar */}
                <Route path="courses" element={<CourseList />} />
                <Route path="lesson/:lessonId" element={<LessonRoomUltimate />} />
                <Route path="lesson-advanced/:lessonId" element={<LessonRoomAdvanced />} />
                <Route path="lesson-classic/:lessonId" element={<LessonRoom />} />
                <Route path="quiz/:quizId" element={<QuizPlayer />} />
                <Route path="voice-assistant" element={<VoiceAssistant />} />
                <Route path="study-planner" element={<StudyPlanner />} />
                <Route path="gamification" element={<GamificationSystem />} />
                <Route path="social" element={<SocialLearning />} />
              </Route>

              {/* Teacher Routes */}
              <Route path="/teacher">
                <Route index element={<TeacherDashboard />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="create-lesson" element={<LessonCreator />} />
              </Route>

              {/* Parent Routes */}
              <Route path="/parent">
                <Route index element={<ParentDashboard />} />
                <Route path="dashboard" element={<ParentDashboard />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboardNew />} />
              <Route path="/admin/dashboard" element={<AdminDashboardNew />} />
              <Route path="/admin/old" element={<AdminDashboard />} />
              <Route path="/admin/ai-training" element={<AITrainingDashboard />} />
              <Route path="/admin/approvals" element={<AdminApprovalPanel />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </div>
      </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;