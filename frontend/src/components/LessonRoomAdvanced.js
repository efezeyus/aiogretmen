import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import aiService from '../services/aiService';
import emojiReader from '../utils/emojiReader';
import selfLearningAI from '../services/selfLearningAI';
import advancedAITeacher from '../services/advancedAITeacher';
import './LessonRoomAdvanced.css';

// 3D Avatar ve Animasyonlar için
const AI_AVATARS = {
  math: { emoji: '🤖', name: 'Matematik Öğretmeni Maya', personality: 'analytical' },
  science: { emoji: '🔬', name: 'Fen Öğretmeni Fatih', personality: 'curious' },
  turkish: { emoji: '📚', name: 'Türkçe Öğretmeni Türkan', personality: 'creative' },
  social: { emoji: '🌍', name: 'Sosyal Öğretmeni Selim', personality: 'friendly' },
  english: { emoji: '🇬🇧', name: 'İngilizce Öğretmeni Emily', personality: 'enthusiastic' }
};

// Gelişmiş Ders İçeriği Sistemi
const ADVANCED_LESSONS = {
  1: { // Matematik
    title: "5. Sınıf Matematik - Kesirler ve Ondalık Sayılar",
    subject: "math",
    difficulty: "adaptive", // AI difficulty ayarlıyor
    modules: [
      {
        id: 1,
        title: "Kesirlere Giriş",
        type: "interactive",
        content: {
          intro: "Merhaba! Ben Maya, matematik öğretmenin. Bugün kesirleri öğreneceğiz. Kesirler günlük hayatımızda her yerde! 🍕 Pizza dilimlerinden 💧 su bardaklarına kadar...",
          visualAid: "fraction_pizza_animation",
          interactiveElements: ["drag_drop_fractions", "virtual_manipulatives"],
          realWorldExamples: ["Pizza paylaşımı", "Saat okuma", "Para bozma"],
          gamification: {
            points: 100,
            badges: ["Kesir Kaşifi", "Pizza Ustası"],
            leaderboard: true
          }
        }
      },
      {
        id: 2,
        title: "Kesir Karşılaştırma",
        type: "gamified",
        content: {
          intro: "Şimdi kesirleri karşılaştırmayı öğrenelim! Bu bir oyun gibi düşün - hangi pizza dilimi daha büyük? 🎮",
          game: "fraction_comparison_game",
          levels: ["Kolay", "Orta", "Zor", "Uzman"],
          rewards: {
            coins: 50,
            xp: 200,
            unlockedContent: "bonus_fraction_puzzles"
          }
        }
      },
      {
        id: 3,
        title: "Ondalık Sayılar",
        type: "vr_experience",
        content: {
          intro: "Ondalık sayıları sanal gerçeklikte keşfedelim! VR gözlüğünüz varsa takın, yoksa 3D simülasyonu kullanacağız.",
          vrScene: "decimal_number_world",
          interactiveObjects: ["decimal_blocks", "number_line_3d", "money_counter"],
          fallback3D: true
        }
      }
    ],
    assessments: {
      formative: {
        type: "real_time",
        questions: "adaptive", // AI soruları öğrenciye göre ayarlıyor
        feedback: "immediate"
      },
      summative: {
        type: "project_based",
        project: "Kendi pizza restoranını tasarla ve kesirlerle menü oluştur"
      }
    },
    aiFeatures: {
      emotionRecognition: true, // Öğrencinin duygularını analiz eder
      adaptivePacing: true, // Öğrenme hızını ayarlar
      personalizedExamples: true, // Öğrencinin ilgi alanlarına göre örnekler
      voiceAnalysis: true, // Ses tonundan anlama seviyesini ölçer
      eyeTracking: false, // Opsiyonel - göz takibi ile dikkat analizi
      gestureRecognition: true // El hareketleriyle etkileşim
    }
  }
};

// Gelişmiş AI Öğretmen Sistemi
const LessonRoomAdvanced = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const webcamStream = useRef(null);

  // State Management
  const [currentLesson, setCurrentLesson] = useState(ADVANCED_LESSONS[lessonId] || ADVANCED_LESSONS[1]);
  const [currentAvatar, setCurrentAvatar] = useState(AI_AVATARS[currentLesson.subject] || AI_AVATARS.math);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentModule, setCurrentModule] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  
  // Gelişmiş Özellikler State'leri
  const [studentProfile, setStudentProfile] = useState({
    name: localStorage.getItem('userName') || 'Öğrenci',
    learningStyle: 'visual', // visual, auditory, kinesthetic
    currentMood: 'neutral', // happy, confused, frustrated, excited
    attentionLevel: 100, // 0-100
    comprehensionLevel: 0, // 0-100
    preferredPace: 'normal', // slow, normal, fast
    interests: ['oyun', 'spor', 'müzik'],
    strengths: [],
    weaknesses: [],
    achievementPoints: 0,
    badges: [],
    learningPath: []
  });

  const [aiTeacherState, setAiTeacherState] = useState({
    personality: currentAvatar.personality,
    teachingMode: 'friendly', // strict, friendly, motivational, challenging
    currentStrategy: 'explain', // explain, question, practice, review
    adaptiveLevel: 1, // 1-5 zorluk seviyesi
    emotionalTone: 'encouraging',
    useGamification: true,
    use3DVisuals: true,
    useRealWorldExamples: true,
    interactionMode: 'conversation' // conversation, tutorial, game, exploration
  });

  const [features, setFeatures] = useState({
    webcamEnabled: false,
    microphoneEnabled: true,
    screenShareEnabled: false,
    whiteBoardEnabled: true,
    gestureControlEnabled: false,
    emotionDetectionEnabled: false,
    voiceCommandsEnabled: true,
    arModeEnabled: false,
    collaborativeModeEnabled: false,
    assessmentMode: false
  });

  const [sessionMetrics, setSessionMetrics] = useState({
    startTime: Date.now(),
    totalInteractions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    hintsUsed: 0,
    questionsAsked: 0,
    engagementScore: 100,
    focusTime: 0,
    breaksTaken: 0,
    topicsCompleted: [],
    difficultyAdjustments: []
  });

  // 3D Canvas için Three.js benzeri basit render
  const [canvas3D, setCanvas3D] = useState({
    objects: [],
    camera: { x: 0, y: 0, z: 5 },
    lighting: 'default',
    animations: []
  });

  // Başlangıç mesajı
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `${currentAvatar.emoji} Merhaba ${studentProfile.name}! Ben ${currentAvatar.name}. Bugün ${currentLesson.title} konusunu birlikte öğreneceğiz. Hazır mısın? 🚀`,
      timestamp: new Date().toLocaleTimeString(),
      avatar: currentAvatar,
      emotion: 'happy',
      animation: 'wave'
    };
    setMessages([welcomeMessage]);

    // Test için orijinal ve optimize edilmiş metni göster
    console.log('🎤 Orijinal metin:', welcomeMessage.content);
    const optimizedText = emojiReader.optimizeForSpeech(welcomeMessage.content);
    console.log('🔊 Optimize edilmiş metin:', optimizedText);

    // Ses sentezi ile karşılama - 2 saniye gecikmeyle (sayfa yüklenince)
    setTimeout(() => {
      speakWithEmotion(welcomeMessage.content, 'happy');
    }, 2000);

    // Webcam izni kontrolü
    checkWebcamPermission();
  }, []);

  // Gelişmiş Ses Sentezi
  const speakWithEmotion = (text, emotion = 'neutral') => {
    if (!window.speechSynthesis) return;

    // Emoji'leri Türkçe karşılıklarıyla değiştir
    const optimizedText = emojiReader.optimizeForSpeech(text);
    
    // Matematik sembollerini optimize et
    const finalText = emojiReader.optimizeMathForSpeech(optimizedText);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(finalText);
    
    // Duyguya göre ses ayarları
    const emotionSettings = {
      happy: { rate: 1.1, pitch: 1.2, volume: 1 },
      sad: { rate: 0.8, pitch: 0.9, volume: 0.8 },
      excited: { rate: 1.3, pitch: 1.3, volume: 1 },
      calm: { rate: 0.9, pitch: 1, volume: 0.9 },
      confused: { rate: 0.95, pitch: 1.1, volume: 0.95 },
      encouraging: { rate: 1.05, pitch: 1.15, volume: 1 },
      helpful: { rate: 1, pitch: 1.1, volume: 0.95 }
    };

    const settings = emotionSettings[emotion] || { rate: 1, pitch: 1, volume: 1 };
    Object.assign(utterance, settings);
    utterance.lang = 'tr-TR';

    // Ses seçimi
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(v => v.lang.includes('tr')) || voices[0];
    if (turkishVoice) utterance.voice = turkishVoice;

    // Ses sentezi event'leri
    utterance.onstart = () => {
      console.log('🎤 Konuşma başladı:', finalText.substring(0, 50) + '...');
    };

    utterance.onend = () => {
      console.log('✅ Konuşma tamamlandı');
    };

    utterance.onerror = (event) => {
      console.error('❌ Ses sentezi hatası:', event);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Webcam ve Emotion Detection
  const checkWebcamPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamStream.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setFeatures(prev => ({ ...prev, webcamEnabled: true }));
    } catch (error) {
      console.log('Webcam erişimi reddedildi:', error);
    }
  };

  // Gelişmiş Mesaj Gönderme Sistemi
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const interactionStartTime = Date.now();

    // Kullanıcı mesajını ekle
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString(),
      mood: detectMoodFromText(message),
      confidence: calculateConfidence(message)
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    // Metrikler güncelle
    setSessionMetrics(prev => ({
      ...prev,
      totalInteractions: prev.totalInteractions + 1,
      questionsAsked: message.includes('?') ? prev.questionsAsked + 1 : prev.questionsAsked
    }));

    // Self-Learning AI'a etkileşimi kaydet
    const interaction = {
      studentId: localStorage.getItem('userId') || 'guest',
      message: message,
      context: currentLesson.modules[currentModule]?.title || 'general',
      topic: currentLesson.subject,
      teachingMethod: 'visual', // Mevcut öğretim metodu
      timestamp: new Date().toISOString(),
      sessionInteractionCount: sessionMetrics.totalInteractions,
      responseTime: (Date.now() - interactionStartTime) / 1000,
      isVoluntary: true,
      questionDifficulty: aiTeacherState.adaptiveLevel
    };

    // AI yanıtı için typing göster
    setIsTyping(true);

    try {
      // Gelişmiş AI öğretmen input'u
      const teacherInput = {
        message: message,
        studentId: localStorage.getItem('userId') || 'guest',
        context: {
          lesson: currentLesson,
          currentModule: currentModule,
          conversationHistory: messages.slice(-10)
        },
        metadata: {
          mood: userMessage.mood,
          confidence: userMessage.confidence,
          timestamp: new Date().toISOString(),
          sessionDuration: (Date.now() - sessionStartTime) / 60000
        }
      };

      // Gelişmiş AI öğretmenden yanıt al
      const advancedResponse = await advancedAITeacher.teach(teacherInput);

      // Eğer gelişmiş sistem başarısız olursa, eski sisteme dön
      let response;
      if (advancedResponse && advancedResponse.message) {
        response = {
          success: true,
          content: advancedResponse.message,
          emotion: advancedResponse.tone || 'friendly',
          visualAids: advancedResponse.visuals || [],
          interactiveElements: advancedResponse.interactive || [],
          followUp: advancedResponse.followUp || [],
          assessments: advancedResponse.assessments || [],
          nextSteps: advancedResponse.nextSteps || []
        };
      } else {
        // Fallback to original AI service
        const aiContext = {
          lesson: currentLesson,
          studentProfile: studentProfile,
          sessionMetrics: sessionMetrics,
          currentModule: currentModule,
          conversationHistory: messages.slice(-10),
          teacherPersonality: aiTeacherState,
          requestType: analyzeRequestType(message),
          emotionalContext: userMessage.mood,
          learningObjectives: currentLesson.modules[currentModule]?.content
        };
        response = await aiService.getAdvancedTeacherResponse(message, aiContext);
      }

      if (response.success) {
        // AI yanıtını işle
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.content,
          timestamp: new Date().toLocaleTimeString(),
          avatar: currentAvatar,
          emotion: response.emotion || 'neutral',
          animation: response.animation || 'talk',
          visualAids: response.visualAids || [],
          interactiveElements: response.interactiveElements || [],
          followUp: response.followUp || [],
          assessments: response.assessments || [],
          nextSteps: response.nextSteps || [],
          nextAction: response.nextAction || null
        };

        setMessages(prev => [...prev, aiMessage]);

        // Ses ile yanıtla
        speakWithEmotion(response.content, response.emotion);

        // Takip sorularını göster
        if (response.followUp && response.followUp.length > 0) {
          setTimeout(() => {
            showFollowUpQuestions(response.followUp);
          }, 3000);
        }

        // Mini değerlendirmeleri göster
        if (response.assessments && response.assessments.length > 0) {
          setTimeout(() => {
            showAssessments(response.assessments);
          }, 5000);
        }

        // Görsel elementleri render et
        if (response.visualAids?.length > 0) {
          renderVisualAids(response.visualAids);
        }

        // Öğrenci profilini güncelle
        if (response.profileUpdates) {
          setStudentProfile(prev => ({ ...prev, ...response.profileUpdates }));
        }

        // Zorluk seviyesini ayarla
        if (response.difficultyAdjustment) {
          adjustDifficulty(response.difficultyAdjustment);
        }

        // Self-Learning AI'a sonucu kaydet
        const finalInteraction = {
          ...interaction,
          aiResponse: response.content,
          isCorrect: response.isCorrect,
          comprehensionScore: response.comprehensionScore || studentProfile.comprehensionLevel,
          engagementScore: sessionMetrics.engagementScore,
          responseTime: (Date.now() - interactionStartTime) / 1000
        };

        // Analiz sonuçlarını al ve kaydet
        const analysisResults = await selfLearningAI.recordInteraction(finalInteraction);
        
        // Öğrenme önerilerini uygula
        if (analysisResults.recommendations) {
          applyLearningRecommendations(analysisResults.recommendations);
        }

        // Başarı metriklerini güncelle
        updateSuccessMetrics(analysisResults);

      } else {
        throw new Error('AI yanıt hatası');
      }

    } catch (error) {
      console.error('AI Öğretmen hatası:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Üzgünüm, bir sorun oluştu. Tekrar deneyelim mi? 🤔',
        timestamp: new Date().toLocaleTimeString(),
        avatar: currentAvatar,
        emotion: 'confused'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Duygu Analizi
  const detectMoodFromText = (text) => {
    const moods = {
      happy: ['harika', 'süper', 'anladım', 'kolay', 'eğlenceli'],
      confused: ['anlamadım', 'karışık', 'zor', 'nasıl', 'neden'],
      frustrated: ['yapamıyorum', 'olmadı', 'bıktım', 'sıkıldım'],
      excited: ['heyecanlı', 'merak', 'öğrenmek istiyorum', 'devam']
    };

    for (const [mood, keywords] of Object.entries(moods)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return mood;
      }
    }
    return 'neutral';
  };

  // Güven Seviyesi Hesaplama
  const calculateConfidence = (text) => {
    const confidentPhrases = ['eminim', 'kesinlikle', 'tabii ki', 'kolay'];
    const uncertainPhrases = ['sanırım', 'belki', 'emin değilim', 'bilmiyorum'];
    
    if (confidentPhrases.some(phrase => text.toLowerCase().includes(phrase))) {
      return 'high';
    } else if (uncertainPhrases.some(phrase => text.toLowerCase().includes(phrase))) {
      return 'low';
    }
    return 'medium';
  };

  // İstek Tipi Analizi
  const analyzeRequestType = (message) => {
    const types = {
      question: message.includes('?') || message.startsWith('ne') || message.startsWith('nasıl'),
      help: message.includes('yardım') || message.includes('anlamadım'),
      practice: message.includes('alıştırma') || message.includes('örnek'),
      explanation: message.includes('açıkla') || message.includes('anlat'),
      progress: message.includes('ilerleme') || message.includes('nasıl gidiyorum')
    };

    return Object.entries(types).find(([_, value]) => value)?.[0] || 'general';
  };

  // Görsel Yardımcıları Render Et
  const renderVisualAids = (visualAids) => {
    visualAids.forEach(aid => {
      switch (aid.type) {
        case '3d_model':
          render3DModel(aid);
          break;
        case 'animation':
          playAnimation(aid);
          break;
        case 'interactive_board':
          showInteractiveBoard(aid);
          break;
        case 'ar_object':
          if (features.arModeEnabled) showARObject(aid);
          break;
        default:
          console.log('Bilinmeyen görsel yardımcı tipi:', aid.type);
      }
    });
  };

  // 3D Model Render
  const render3DModel = (model) => {
    setCanvas3D(prev => ({
      ...prev,
      objects: [...prev.objects, model],
      animations: model.animations || []
    }));
    console.log('3D Model yüklendi:', model.name);
  };

  // Animasyon Oynat
  const playAnimation = (animation) => {
    console.log('Animasyon oynatılıyor:', animation.name);
    // Gerçek uygulamada burada animasyon kütüphanesi kullanılır
    // Örn: Lottie, Three.js, vs.
  };

  // İnteraktif Tahta Göster
  const showInteractiveBoard = (board) => {
    setFeatures(prev => ({ ...prev, whiteBoardEnabled: true }));
    console.log('İnteraktif tahta açıldı:', board.content);
  };

  // AR Obje Göster
  const showARObject = (arObject) => {
    console.log('AR objesi gösteriliyor:', arObject.name);
    // Gerçek uygulamada WebXR API kullanılır
    alert('AR özelliği için cihazınızda AR desteği gereklidir.');
  };

  // Zorluk Ayarlama
  const adjustDifficulty = (adjustment) => {
    setAiTeacherState(prev => ({
      ...prev,
      adaptiveLevel: Math.max(1, Math.min(5, prev.adaptiveLevel + adjustment))
    }));

    setSessionMetrics(prev => ({
      ...prev,
      difficultyAdjustments: [...prev.difficultyAdjustments, {
        time: Date.now(),
        newLevel: aiTeacherState.adaptiveLevel + adjustment,
        reason: adjustment > 0 ? 'Öğrenci hazır' : 'Öğrenci zorlanıyor'
      }]
    }));
  };

  // Hızlı Cevap Önerileri - AI Destekli
  const getSmartSuggestions = () => {
    const baseContext = messages[messages.length - 1]?.content || '';
    const currentTopic = currentLesson.modules[currentModule]?.title || '';
    
    // AI'nin son mesajına göre akıllı öneriler
    const suggestions = {
      question: [
        'Evet, anladım! 😊',
        'Biraz daha açıklayabilir misin?',
        'Bir örnek daha verebilir misin?',
        'Bu konuyu oyunla öğrenebilir miyiz?'
      ],
      practice: [
        'Hadi deneyelim!',
        'Kolay bir soruyla başlayalım',
        'Biraz daha pratik yapmak istiyorum',
        'Farklı bir örnek görebilir miyim?'
      ],
      explanation: [
        'Harika açıkladın, teşekkürler!',
        'Görsel olarak gösterebilir misin?',
        'Gerçek hayattan örnek var mı?',
        'Bunu 3D olarak görebilir miyim?'
      ],
      encouragement: [
        'Kendime güveniyorum! 💪',
        'Biraz yardıma ihtiyacım var',
        'Tekrar edelim mi?',
        'Başka bir yöntemle deneyelim'
      ]
    };

    const lastAIMessage = messages.filter(m => m.type === 'ai').pop();
    const messageType = lastAIMessage?.nextAction || 'question';
    
    return suggestions[messageType] || suggestions.question;
  };

  // Yardımcı Fonksiyonlar
  const replayLastAIMessage = () => {
    const lastAIMessage = messages.filter(m => m.type === 'ai').pop();
    if (lastAIMessage) {
      speakWithEmotion(lastAIMessage.content, lastAIMessage.emotion || 'neutral');
    }
  };

  const showHelp = () => {
    const helpMessage = {
      id: Date.now(),
      type: 'ai',
      content: 'Merhaba! Size nasıl yardımcı olabilirim? 🤔 Sorularınızı sorabilir, örnek isteyebilir veya konuyu tekrar açıklamamı isteyebilirsiniz.',
      timestamp: new Date().toLocaleTimeString(),
      avatar: currentAvatar,
      emotion: 'helpful'
    };
    setMessages(prev => [...prev, helpMessage]);
    speakWithEmotion(helpMessage.content, 'helpful');
  };

  const enableGameMode = () => {
    setAiTeacherState(prev => ({ ...prev, interactionMode: 'game' }));
    const gameMessage = {
      id: Date.now(),
      type: 'ai',
      content: '🎮 Oyun modu aktif! Hadi öğrenirken eğlenelim! İlk oyunumuz hazır...',
      timestamp: new Date().toLocaleTimeString(),
      avatar: currentAvatar,
      emotion: 'excited',
      interactiveElements: [{
        type: 'game',
        name: 'math_adventure',
        description: 'Matematik Macerası'
      }]
    };
    setMessages(prev => [...prev, gameMessage]);
    speakWithEmotion(gameMessage.content, 'excited');
  };

  // Öğrenme önerilerini uygula
  const applyLearningRecommendations = (recommendations) => {
    recommendations.forEach(rec => {
      switch (rec.type) {
        case 'emotional_support':
          // Duygusal destek mesajı ekle
          const supportMessage = {
            id: Date.now() + Math.random(),
            type: 'ai',
            content: '💪 Harika gidiyorsun! Her hata yeni bir öğrenme fırsatı. Birlikte başaracağız!',
            timestamp: new Date().toLocaleTimeString(),
            avatar: currentAvatar,
            emotion: 'encouraging'
          };
          setMessages(prev => [...prev, supportMessage]);
          speakWithEmotion(supportMessage.content, 'encouraging');
          break;

        case 'teaching_method':
          // Öğretim metodunu değiştir
          if (rec.action === 'simplify_explanation') {
            setAiTeacherState(prev => ({ 
              ...prev, 
              teachingMode: 'friendly',
              currentStrategy: 'explain'
            }));
          }
          break;

        case 'visual_aid':
          // Görsel materyal ekle
          renderVisualAids([{
            type: 'animation',
            name: 'concept_helper',
            description: 'Konuyu açıklayan animasyon'
          }]);
          break;

        case 'gamification':
          // Oyun elementi ekle
          if (rec.action === 'add_game_element') {
            enableGameMode();
          }
          break;

        case 'difficulty_adjustment':
          // Zorluk seviyesini ayarla
          adjustDifficulty(rec.value);
          break;

        default:
          console.log('Bilinmeyen öneri tipi:', rec.type);
      }
    });
  };

  // Başarı metriklerini güncelle
  const updateSuccessMetrics = (analysisResults) => {
    // Anlama seviyesini güncelle
    if (analysisResults.comprehensionLevel) {
      setStudentProfile(prev => ({
        ...prev,
        comprehensionLevel: analysisResults.comprehensionLevel.score
      }));
    }

    // Ruh halini güncelle
    if (analysisResults.emotionalState) {
      setStudentProfile(prev => ({
        ...prev,
        currentMood: analysisResults.emotionalState.current
      }));
    }

    // Katılım skorunu güncelle
    if (analysisResults.engagementScore) {
      setSessionMetrics(prev => ({
        ...prev,
        engagementScore: analysisResults.engagementScore.score
      }));
    }

    // Öğrenme stilini periyodik olarak güncelle
    if (sessionMetrics.totalInteractions % 10 === 0) {
      updateLearningStyle();
    }
  };

  // Öğrenme stilini güncelle
  const updateLearningStyle = async () => {
    const studentId = localStorage.getItem('userId') || 'guest';
    const learningStyle = await selfLearningAI.determineLearningStyle(studentId);
    
    setStudentProfile(prev => ({
      ...prev,
      learningStyle: learningStyle
    }));

    // AI öğretmen stratejisini güncelle
    setAiTeacherState(prev => ({
      ...prev,
      currentStrategy: learningStyle === 'visual' ? 'show' : 
                      learningStyle === 'auditory' ? 'explain' :
                      learningStyle === 'kinesthetic' ? 'practice' : 'explain'
    }));
  };

  // Takip sorularını göster
  const showFollowUpQuestions = (questions) => {
    const followUpMessage = {
      id: Date.now() + Math.random(),
      type: 'ai',
      content: '🤔 Sana birkaç sorum var:',
      timestamp: new Date().toLocaleTimeString(),
      avatar: currentAvatar,
      emotion: 'curious',
      followUpQuestions: questions
    };
    setMessages(prev => [...prev, followUpMessage]);
  };

  // Değerlendirmeleri göster
  const showAssessments = (assessments) => {
    setFeatures(prev => ({ ...prev, assessmentMode: true }));
    
    const assessmentMessage = {
      id: Date.now() + Math.random(),
      type: 'ai',
      content: '📝 Hadi öğrendiklerimizi test edelim!',
      timestamp: new Date().toLocaleTimeString(),
      avatar: currentAvatar,
      emotion: 'encouraging',
      assessments: assessments
    };
    setMessages(prev => [...prev, assessmentMessage]);
  };

  // Gelişmiş öğrenci metrikleri
  const getAdvancedMetrics = () => {
    const studentId = localStorage.getItem('userId') || 'guest';
    const metrics = advancedAITeacher.studentModel;
    
    return {
      cognitive: metrics.cognitive,
      emotional: metrics.emotional,
      metacognitive: metrics.metacognitive,
      social: metrics.social
    };
  };

  // Sesli Komut Sistemi
  const voiceCommands = {
    'sonraki konu': () => setCurrentModule(prev => prev + 1),
    'önceki konu': () => setCurrentModule(prev => Math.max(0, prev - 1)),
    'tekrar et': () => replayLastAIMessage(),
    'yardım': () => showHelp(),
    'oyun modu': () => enableGameMode(),
    'tahta göster': () => setFeatures(prev => ({ ...prev, whiteBoardEnabled: true }))
  };

  // Gelişmiş UI Render
  return (
    <div className="lesson-room-advanced">
      {/* Gelişmiş Header */}
      <header className="lesson-header-advanced">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Geri
          </button>
          <div className="lesson-info">
            <h2>{currentLesson.title}</h2>
            <div className="lesson-meta">
              <span className="subject-badge">{currentLesson.subject}</span>
              <span className="difficulty-badge">Seviye {aiTeacherState.adaptiveLevel}</span>
              <span className="module-info">
                Modül {currentModule + 1}/{currentLesson.modules.length}
              </span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="student-status">
            <div className="mood-indicator" title={`Ruh hali: ${studentProfile.currentMood}`}>
              {studentProfile.currentMood === 'happy' && '😊'}
              {studentProfile.currentMood === 'confused' && '😕'}
              {studentProfile.currentMood === 'frustrated' && '😤'}
              {studentProfile.currentMood === 'excited' && '🤩'}
              {studentProfile.currentMood === 'neutral' && '😐'}
            </div>
            <div className="attention-meter">
              <span>Dikkat</span>
              <div className="meter-bar">
                <div 
                  className="meter-fill"
                  style={{ width: `${studentProfile.attentionLevel}%` }}
                />
              </div>
            </div>
            <div className="comprehension-meter">
              <span>Anlama</span>
              <div className="meter-bar">
                <div 
                  className="meter-fill"
                  style={{ width: `${studentProfile.comprehensionLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="achievement-display">
            <span className="points">⭐ {studentProfile.achievementPoints} Puan</span>
            <span className="badges">🏅 {studentProfile.badges.length} Rozet</span>
          </div>
          <div className="feature-toggles">
            <button 
              className={`feature-btn ${features.webcamEnabled ? 'active' : ''}`}
              onClick={() => setFeatures(prev => ({ ...prev, webcamEnabled: !prev.webcamEnabled }))}
              title="Kamera"
            >
              📹
            </button>
            <button 
              className={`feature-btn ${features.microphoneEnabled ? 'active' : ''}`}
              onClick={() => setFeatures(prev => ({ ...prev, microphoneEnabled: !prev.microphoneEnabled }))}
              title="Mikrofon"
            >
              🎤
            </button>
            <button 
              className={`feature-btn ${features.whiteBoardEnabled ? 'active' : ''}`}
              onClick={() => setFeatures(prev => ({ ...prev, whiteBoardEnabled: !prev.whiteBoardEnabled }))}
              title="Beyaz Tahta"
            >
              📝
            </button>
            <button 
              className={`feature-btn ${features.arModeEnabled ? 'active' : ''}`}
              onClick={() => setFeatures(prev => ({ ...prev, arModeEnabled: !prev.arModeEnabled }))}
              title="AR Modu"
            >
              🥽
            </button>
          </div>
          <button className="btn-exit" onClick={() => navigate('/student/dashboard')}>
            Dersi Bitir
          </button>
        </div>
      </header>

      {/* Ana İçerik Alanı */}
      <div className="lesson-content-advanced">
        {/* Sol Panel - İlerleme ve AI Öğretmen */}
        <aside className="left-panel">
          {/* AI Öğretmen Avatar */}
          <div className="ai-teacher-avatar">
            <div className="avatar-container">
              <div className="avatar-3d">
                {currentAvatar.emoji}
              </div>
              <div className="avatar-status">
                <h3>{currentAvatar.name}</h3>
                <span className="status-indicator">● Çevrimiçi</span>
              </div>
            </div>
            
            {/* Duygu Göstergesi */}
            <div className="emotion-display">
              <span>Öğretmen Modu: {aiTeacherState.emotionalTone}</span>
            </div>
          </div>

          {/* Konu İlerlemesi */}
          <div className="module-progress">
            <h4>📚 Konu İlerlemesi</h4>
            <div className="modules-list">
              {currentLesson.modules.map((module, index) => (
                <div 
                  key={module.id}
                  className={`module-item ${index === currentModule ? 'active' : ''} ${
                    sessionMetrics.topicsCompleted.includes(module.id) ? 'completed' : ''
                  }`}
                  onClick={() => setCurrentModule(index)}
                >
                  <span className="module-number">{index + 1}</span>
                  <span className="module-title">{module.title}</span>
                  <span className="module-type">{module.type}</span>
                  {sessionMetrics.topicsCompleted.includes(module.id) && '✅'}
                </div>
              ))}
            </div>
          </div>

          {/* Öğrenme Metrikleri */}
          <div className="learning-metrics">
            <h4>📊 Öğrenme İstatistikleri</h4>
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Doğru Cevap</span>
                <span className="metric-value">{sessionMetrics.correctAnswers}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Katılım</span>
                <span className="metric-value">{sessionMetrics.engagementScore}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Soru Sorma</span>
                <span className="metric-value">{sessionMetrics.questionsAsked}</span>
              </div>
              <div className="metric">
                <span className="metric-label">İpucu Kullanımı</span>
                <span className="metric-value">{sessionMetrics.hintsUsed}</span>
              </div>
            </div>
          </div>

          {/* AI Önerileri */}
          <div className="ai-recommendations">
            <h4>🤖 AI Önerileri</h4>
            <ul>
              {studentProfile.comprehensionLevel < 50 && (
                <li>💡 Konuyu daha yavaş ilerletelim</li>
              )}
              {studentProfile.attentionLevel < 70 && (
                <li>🎮 Biraz oyun oynayarak öğrenelim</li>
              )}
              {sessionMetrics.incorrectAnswers > 3 && (
                <li>📚 Bu konuyu tekrar edelim</li>
              )}
              {sessionMetrics.engagementScore > 90 && (
                <li>🚀 Harika gidiyorsun! Zorluk artırılıyor</li>
              )}
            </ul>
          </div>

          {/* Self-Learning AI Performans */}
          <div className="ai-performance">
            <h4>🧠 AI Öğrenme Durumu</h4>
            <div className="ai-stats">
              <div className="ai-stat">
                <span className="ai-stat-label">Öğrenilen Pattern</span>
                <span className="ai-stat-value">
                  {selfLearningAI.learningDatabase.topStrategies?.length || 0}
                </span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-label">Başarı Oranı</span>
                <span className="ai-stat-value">
                  {Math.round(
                    (selfLearningAI.learningDatabase.successfulStrategies.length /
                    (selfLearningAI.learningDatabase.successfulStrategies.length + 
                     selfLearningAI.learningDatabase.failedStrategies.length || 1)) * 100
                  )}%
                </span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-label">Öğrenci Profili</span>
                <span className="ai-stat-value">
                  {studentProfile.learningStyle}
                </span>
              </div>
            </div>
            <button 
              className="btn-ai-report"
              onClick={() => {
                const report = selfLearningAI.getPerformanceMetrics(
                  localStorage.getItem('userId') || 'guest'
                );
                console.log('📊 AI Performans Raporu:', report);
                alert('AI Performans raporu konsola yazdırıldı. F12 ile kontrol edin.');
              }}
            >
              📊 Detaylı Rapor
            </button>
          </div>

          {/* Gelişmiş Öğrenci Analizi */}
          <div className="advanced-student-analysis">
            <h4>🎯 Çok Boyutlu Analiz</h4>
            <div className="analysis-dimensions">
              {/* Bilişsel Boyut */}
              <div className="dimension">
                <span className="dimension-icon">🧠</span>
                <span className="dimension-label">Bilişsel</span>
                <div className="dimension-details">
                  <div className="mini-stat">
                    <span>Çalışma Belleği</span>
                    <span>{getAdvancedMetrics().cognitive.workingMemoryCapacity}/10</span>
                  </div>
                  <div className="mini-stat">
                    <span>İşleme Hızı</span>
                    <span>{getAdvancedMetrics().cognitive.processingSpeed}</span>
                  </div>
                </div>
              </div>

              {/* Duygusal Boyut */}
              <div className="dimension">
                <span className="dimension-icon">❤️</span>
                <span className="dimension-label">Duygusal</span>
                <div className="dimension-details">
                  <div className="mini-stat">
                    <span>Motivasyon</span>
                    <span>{getAdvancedMetrics().emotional.motivationType}</span>
                  </div>
                  <div className="mini-stat">
                    <span>Güven</span>
                    <span>{getAdvancedMetrics().emotional.confidenceLevel}%</span>
                  </div>
                </div>
              </div>

              {/* Üst Bilişsel Boyut */}
              <div className="dimension">
                <span className="dimension-icon">🎓</span>
                <span className="dimension-label">Üst Bilişsel</span>
                <div className="dimension-details">
                  <div className="mini-stat">
                    <span>Öz Farkındalık</span>
                    <span>{getAdvancedMetrics().metacognitive.learningAwareness}/10</span>
                  </div>
                  <div className="mini-stat">
                    <span>Hedef Belirleme</span>
                    <span>{getAdvancedMetrics().metacognitive.goalSetting}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Orta Alan - Chat ve İnteraktif İçerik */}
        <main className="main-content">
          {/* 3D Canvas / Beyaz Tahta / AR Görünümü */}
          {features.whiteBoardEnabled && (
            <div className="interactive-board">
              <canvas 
                ref={canvasRef}
                className="whiteboard-canvas"
                width={800}
                height={400}
              />
              <div className="board-tools">
                <button>🖊️ Kalem</button>
                <button>🎨 Renk</button>
                <button>📐 Şekil</button>
                <button>🗑️ Temizle</button>
              </div>
            </div>
          )}

          {/* Mesajlaşma Alanı */}
          <div className="chat-container">
            <div className="messages-area">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  {message.type === 'ai' && (
                    <div className="avatar-small">
                      {message.avatar?.emoji || currentAvatar.emoji}
                    </div>
                  )}
                  
                  <div className="message-bubble">
                    <div className="message-content">
                      {message.content}
                    </div>
                    
                    {/* Görsel Yardımcılar */}
                    {message.visualAids?.map((aid, index) => (
                      <div key={index} className="visual-aid">
                        {aid.type === 'image' && <img src={aid.url} alt={aid.description} />}
                        {aid.type === 'video' && <video src={aid.url} controls />}
                        {aid.type === 'animation' && <div className="animation-placeholder">{aid.name}</div>}
                      </div>
                    ))}
                    
                    {/* İnteraktif Elementler */}
                    {message.interactiveElements?.map((element, index) => (
                      <div key={index} className="interactive-element">
                        {element.type === 'quiz' && (
                          <div className="mini-quiz">
                            <p>{element.question}</p>
                            {element.options.map((option, i) => (
                              <button key={i} className="quiz-option">
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Takip Soruları */}
                    {message.followUpQuestions?.length > 0 && (
                      <div className="follow-up-questions">
                        {message.followUpQuestions.map((question, index) => (
                          <div 
                            key={index} 
                            className="follow-up-question"
                            onClick={() => {
                              setUserInput(question);
                              sendMessage(question);
                            }}
                          >
                            💡 {question}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mini Değerlendirmeler */}
                    {message.assessments?.length > 0 && (
                      <div className="assessment-container">
                        {message.assessments.map((assessment, index) => (
                          <div key={index} className="assessment">
                            {assessment.type === 'quiz' && (
                              <>
                                <div className="assessment-timer">⏱️ {assessment.timeLimit}s</div>
                                {assessment.questions.map((q, qIndex) => (
                                  <div key={qIndex} className="assessment-question">
                                    <p>{q.question}</p>
                                    <div className="assessment-options">
                                      {q.options.map((opt, optIndex) => (
                                        <div 
                                          key={optIndex} 
                                          className="assessment-option"
                                          onClick={() => console.log('Seçilen:', opt)}
                                        >
                                          {String.fromCharCode(65 + optIndex)}) {opt}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sonraki Adımlar */}
                    {message.nextSteps?.length > 0 && (
                      <div className="next-steps-container">
                        <div className="next-steps-title">
                          🎯 Sonraki Adımlar
                        </div>
                        {message.nextSteps.map((step, index) => (
                          <div 
                            key={index} 
                            className="next-step"
                            onClick={() => console.log('Seçilen adım:', step)}
                          >
                            <div className="next-step-type">{step.type}</div>
                            <div className="next-step-description">{step.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <span className="timestamp">{message.timestamp}</span>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="user-info">
                      <span className="mood-emoji">
                        {message.mood === 'happy' && '😊'}
                        {message.mood === 'confused' && '😕'}
                        {message.mood === 'neutral' && '😐'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="message ai typing">
                  <div className="avatar-small">{currentAvatar.emoji}</div>
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Gelişmiş Input Alanı */}
            <div className="input-section">
              {/* Akıllı Öneriler */}
              <div className="smart-suggestions">
                {getSmartSuggestions().map((suggestion, index) => (
                  <button 
                    key={index}
                    className="suggestion-chip"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Input Controls */}
              <div className="input-controls">
                <button 
                  className="voice-btn"
                  onClick={() => {/* Ses tanıma başlat */}}
                  title="Sesle konuş"
                >
                  🎤
                </button>
                
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(userInput)}
                  placeholder="Sorunuzu yazın veya mikrofonu kullanın..."
                  className="message-input"
                />
                
                <button 
                  className="emoji-btn"
                  title="Emoji ekle"
                >
                  😊
                </button>
                
                <button 
                  className="attach-btn"
                  title="Dosya ekle"
                >
                  📎
                </button>
                
                <button 
                  className="send-btn"
                  onClick={() => sendMessage(userInput)}
                  disabled={!userInput.trim()}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Sağ Panel - Ek Özellikler */}
        <aside className="right-panel">
          {/* Webcam Görünümü */}
          {features.webcamEnabled && (
            <div className="webcam-view">
              <video 
                ref={videoRef}
                autoPlay
                muted
                className="webcam-feed"
              />
              <div className="emotion-overlay">
                <span>Duygu: {studentProfile.currentMood}</span>
              </div>
            </div>
          )}

          {/* Oyunlaştırma Elementleri */}
          <div className="gamification-panel">
            <h4>🎮 Meydan Okumalar</h4>
            <div className="challenges">
              <div className="challenge">
                <span className="challenge-icon">🎯</span>
                <span className="challenge-text">5 soruyu doğru cevapla</span>
                <span className="challenge-progress">3/5</span>
              </div>
              <div className="challenge">
                <span className="challenge-icon">⏱️</span>
                <span className="challenge-text">10 dakika kesintisiz çalış</span>
                <span className="challenge-progress">7/10</span>
              </div>
            </div>
          </div>

          {/* Sosyal Öğrenme */}
          <div className="social-learning">
            <h4>👥 Sınıf Arkadaşların</h4>
            <div className="classmates-status">
              <div className="classmate">
                <span className="avatar">👧</span>
                <span className="name">Ayşe</span>
                <span className="status">Kesirler - Modül 2</span>
              </div>
              <div className="classmate">
                <span className="avatar">👦</span>
                <span className="name">Mehmet</span>
                <span className="status">Ondalık Sayılar</span>
              </div>
            </div>
            <button className="btn-collaborate">
              🤝 Birlikte Çalış
            </button>
          </div>

          {/* Hızlı Erişim Araçları */}
          <div className="quick-tools">
            <h4>🛠️ Araçlar</h4>
            <div className="tools-grid">
              <button title="Hesap Makinesi">🔢</button>
              <button title="Not Defteri">📝</button>
              <button title="Sözlük">📚</button>
              <button title="Zamanlayıcı">⏰</button>
              <button title="Müzik">🎵</button>
              <button title="Ayarlar">⚙️</button>
            </div>
          </div>
        </aside>
      </div>

      {/* Gelişmiş Özellikler Modalları */}
      {/* AR Modu, Oyun Modu, vs. için modallar buraya eklenebilir */}
    </div>
  );
};

export default LessonRoomAdvanced;
