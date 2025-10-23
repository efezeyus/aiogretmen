import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import aiService from '../services/aiService';
import advancedAITeacher from '../services/advancedAITeacher';
import proactiveTeacher from '../services/proactiveTeacher';
import stableTeacher from '../services/stableTeacher';
import ttsService from '../services/textToSpeechService';
import gradeAccessControl from '../services/gradeAccessControl';
import SmartPromptInput from './SmartPromptInput';
import './LessonRoomUltimate.css';

/**
 * DÜNYANIN EN İYİ YAPAY ZEKA ÖĞRETMENİ - LESSON ROOM
 * 
 * Özellikler:
 * - MEB müfredatı entegrasyonu
 * - Kişiselleştirilmiş öğrenme
 * - Gerçek zamanlı AI öğretmen
 * - Adaptif zorluk
 * - Multimodal etkileşim (Metin/Ses/Görsel)
 * - Gamification
 * - Anlık geri bildirim
 * - Öğrenme analitikleri
 */

const LessonRoomUltimate = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Core State
  const [loading, setLoading] = useState(true);
  const [lessonData, setLessonData] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [personalizedPlan, setPersonalizedPlan] = useState(null);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Proactive Teaching State
  const [teachingMode, setTeachingMode] = useState('stable'); // 'reactive', 'proactive', 'stable'
  const [currentTeachingMessage, setCurrentTeachingMessage] = useState(null);
  const [lessonStarted, setLessonStarted] = useState(false);
  
  // Voice Control State
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Progress State
  const [progress, setProgress] = useState({
    completedSections: [],
    currentScore: 0,
    timeSpent: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    hintsUsed: 0
  });

  // AI Teacher State
  const [aiTeacher, setAiTeacher] = useState({
    name: 'Öğretmen AI',
    avatar: '🤖',
    personality: 'friendly', // friendly, professional, playful, strict
    teachingStyle: 'adaptive', // adaptive, step-by-step, discovery-based
    currentEmotion: 'happy'
  });

  // Student Profile
  const [studentProfile, setStudentProfile] = useState({
    id: localStorage.getItem('userId') || 'guest',
    name: localStorage.getItem('userName') || 'Öğrenci',
    grade: parseInt(localStorage.getItem('userGrade')) || 5,
    learningStyle: localStorage.getItem('learningStyle') || 'görsel',
    currentLevel: 'orta'
  });
  
  // Log student info
  useEffect(() => {
    console.log('👨‍🎓 Öğrenci Profili:', studentProfile);
    console.log('🎓 Sınıf:', studentProfile.grade);
  }, []);

  // Interactive Elements
  const [interactiveState, setInteractiveState] = useState({
    showVisual: false,
    showQuiz: false,
    showPractice: false,
    currentVisual: null,
    currentQuestion: null
  });

  // Session Metrics
  const [sessionMetrics, setSessionMetrics] = useState({
    startTime: Date.now(),
    interactions: 0,
    avgResponseTime: 0,
    engagementScore: 0,
    confusionDetected: false,
    strugglingTopics: []
  });

  // Initialize Lesson
  useEffect(() => {
    initializeLesson();
  }, [lessonId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeLesson = async () => {
    try {
      setLoading(true);
      
      const grade = parseInt(localStorage.getItem('userGrade')) || 6;
      const studentName = localStorage.getItem('userName') || 'Öğrenci';
      
      console.log('📚 Ders başlatılıyor...');
      console.log('🎓 Sınıf:', grade);
      console.log('👤 Öğrenci:', studentName);
      
      // 🔐 GÜVENLİK: Erişim kontrolü
      gradeAccessControl.initialize();

      // Demo data - Her zaman yükle (backend olmasa da çalışsın)
      const demoLesson = {
        id: lessonId,
        title: `${grade}. Sınıf Matematik - ${grade === 6 ? 'Tam Sayılar' : 'Kesirler'}`,
        subject: 'Matematik',
        grade: grade,
        topic: grade === 6 ? 'Tam Sayılar' : 'Kesirler',
        mebUnit: grade === 6 ? 'Tam Sayılar' : 'Kesirler ve İşlemler',
        objectives: grade === 6 ? [
          'Tam sayıları tanır ve sayı doğrusunda gösterir',
          'Tam sayıları karşılaştırır ve sıralar',
          'Mutlak değer kavramını anlar',
          'Tam sayılarla dört işlem yapar'
        ] : [
          'Kesir kavramını anlar',
          'Basit, bileşik ve tam sayılı kesirleri tanır',
          'Kesirleri karşılaştırır',
          'Kesirlerle toplama işlemi yapar'
        ],
        sections: [
          {
            id: 1,
            title: grade === 6 ? 'Tam Sayılar Nedir?' : 'Kesir Nedir?',
            type: 'concept_introduction',
            difficulty: 'temel',
            estimatedTime: 10,
            content: grade === 6 ? {
              introduction: 'Tam sayılar, pozitif ve negatif sayıları içerir. Sıfırın sağında pozitif (+), solunda negatif (-) sayılar vardır.',
              realLifeExamples: ['Sıcaklık (+25°C, -10°C)', 'Borç-Alacak', 'Deniz seviyesi (üstü/altı)'],
              visualAids: ['number_line', 'thermometer'],
              keyTerms: ['Pozitif sayı', 'Negatif sayı', 'Mutlak değer', 'Sıfır']
            } : {
              introduction: 'Kesirler, bir bütünün eşit parçalarını gösterir.',
              realLifeExamples: ['Pizza dilimleri', 'Saat', 'Para'],
              visualAids: ['pizza_model', 'fraction_bars'],
              keyTerms: ['Pay', 'Payda', 'Kesir çizgisi']
            }
          },
          {
            id: 2,
            title: 'Kesir Türleri',
            type: 'classification',
            difficulty: 'orta',
            estimatedTime: 15,
            content: {
              types: [
                { name: 'Basit Kesir', example: '3/4', definition: 'Pay < Payda' },
                { name: 'Bileşik Kesir', example: '5/3', definition: 'Pay > Payda' },
                { name: 'Tam Sayılı Kesir', example: '2 1/3', definition: 'Tam sayı + Kesir' }
              ],
              interactiveActivity: 'fraction_classification_game'
            }
          },
          {
            id: 3,
            title: 'Kesirleri Karşılaştırma',
            type: 'skill_building',
            difficulty: 'orta',
            estimatedTime: 20,
            content: {
              rules: [
                'Paydalar eşitse, payı büyük olan kesir büyüktür',
                'Paylar eşitse, paydası küçük olan kesir büyüktür'
              ],
              practice: true,
              adaptiveQuestions: true
            }
          },
          {
            id: 4,
            title: 'Kesirlerle Toplama',
            type: 'operation',
            difficulty: 'ileri',
            estimatedTime: 25,
            content: {
              steps: [
                'Paydaları eşitle',
                'Payları topla',
                'Sonucu sadeleştir'
              ],
              examples: [
                { question: '1/2 + 1/4', solution: '3/4', steps: ['Paydaları eşitle', 'Payları topla', 'Sonuç: 3/4'] },
                { question: '2/3 + 1/6', solution: '5/6', steps: ['2/3 = 4/6', '4/6 + 1/6 = 5/6'] }
              ]
            }
          },
          {
            id: 5,
            title: 'Quiz ve Değerlendirme',
            type: 'assessment',
            difficulty: 'mixed',
            estimatedTime: 15
          }
        ]
      };

      // 🔐 GÜVENLİK: Ders sınıf kontrolü
      if (demoLesson.grade !== grade) {
        const denial = gradeAccessControl.getAccessDeniedMessage(demoLesson.grade);
        alert(`${denial.title}\n\n${denial.message}\n\n${denial.suggestion}`);
        navigate('/student/dashboard');
        return;
      }
      
      // Demo lesson'ı kullan (backend olmasa da çalışsın)
      setLessonData(demoLesson);
      setPersonalizedPlan(null);
      
      console.log('✅ Ders yüklendi (GÜVENLİ):', demoLesson.title);

      // AI öğretmeni başlat
      await initializeAITeacher(demoLesson);

    } catch (error) {
      console.error('Ders yükleme hatası:', error);
      alert('Ders yüklenemedi. Dashboard\'a dönülüyor.');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initializeAITeacher = async (lesson) => {
    // AI öğretmeni kişiselleştir
    const personality = determineTeacherPersonality(studentProfile);
    
    setAiTeacher(prev => ({
      ...prev,
      personality: personality,
      name: getTeacherName(lesson.subject, personality)
    }));

    // STABLE ÖĞRETIM MODU - Gerçek öğretmen gibi, sesli! (VARSAYILAN)
    if (teachingMode === 'stable') {
      console.log('🎓 Stabil öğretim modu başlatılıyor...');
      
      try {
        // Stable teacher'ı başlat
        const firstMessage = await stableTeacher.startLesson(lesson, studentProfile);
        
        // İlk mesajı göster
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: firstMessage.message,
          timestamp: new Date().toLocaleTimeString(),
          emotion: 'enthusiastic',
          stable: true,
          phase: firstMessage.phase,
          requiresResponse: firstMessage.requiresResponse,
          voiceEnabled: firstMessage.voiceEnabled
        }]);
        
        setCurrentTeachingMessage(firstMessage);
        setLessonStarted(true);
        setVoiceEnabled(firstMessage.voiceEnabled);
        
        console.log('✅ Stabil öğretim başladı (sesli)!');
      } catch (error) {
        console.error('Stabil öğretim hatası:', error);
        // Fallback
        const welcomeMessage = await generateWelcomeMessage(lesson, studentProfile);
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: welcomeMessage,
          timestamp: new Date().toLocaleTimeString(),
          emotion: 'enthusiastic'
        }]);
      }
    }
    // PROAKTIF ÖĞRETİM MODU - AI kendi başına ders anlatır!
    else if (teachingMode === 'proactive') {
      console.log('🎓 Proaktif öğretim modu başlatılıyor...');
      
      try {
        // Proactive teacher'ı başlat
        const firstInstruction = await proactiveTeacher.startLesson(lesson, studentProfile);
        
        // İlk mesajı göster
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: firstInstruction.message,
          timestamp: new Date().toLocaleTimeString(),
          emotion: 'enthusiastic',
          proactive: true,
          state: firstInstruction.state,
          awaitingResponse: firstInstruction.awaitingResponse
        }]);
        
        setCurrentTeachingMessage(firstInstruction);
        setLessonStarted(true);
        
        console.log('✅ Proaktif ders başladı!');
      } catch (error) {
        console.error('Proaktif öğretim hatası:', error);
        // Fallback: Normal hoş geldin mesajı
        const welcomeMessage = await generateWelcomeMessage(lesson, studentProfile);
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: welcomeMessage,
          timestamp: new Date().toLocaleTimeString(),
          emotion: 'enthusiastic'
        }]);
      }
    } else {
      // REAKTİF MOD - Eski davranış
      const welcomeMessage = await generateWelcomeMessage(lesson, studentProfile);
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date().toLocaleTimeString(),
        emotion: 'enthusiastic'
      }]);
    }
  };

  const determineTeacherPersonality = (profile) => {
    // Öğrenci seviyesine ve tercihlerine göre
    if (profile.currentLevel === 'temel') {
      return 'friendly'; // Destekleyici, sabırlı
    } else if (profile.currentLevel === 'ileri') {
      return 'professional'; // Zorlayıcı, detaylı
    }
    return 'playful'; // Eğlenceli, motivasyonel
  };

  const getTeacherName = (subject, personality) => {
    const names = {
      'matematik': {
        'friendly': 'Öğretmen Maya 📐',
        'professional': 'Prof. Matematik 🎓',
        'playful': 'Matematik Sihirbazı 🪄'
      },
      'default': {
        'friendly': 'AI Öğretmen 🤖',
        'professional': 'Uzman Öğretmen 👨‍🏫',
        'playful': 'Arkadaş Öğretmen 😊'
      }
    };
    
    return names[subject]?.[personality] || names.default[personality];
  };

  const generateWelcomeMessage = async (lesson, profile) => {
    const greetings = {
      'friendly': `Merhaba ${profile.name}! 👋 Ben ${aiTeacher.name}. Bugün "${lesson.title}" konusunu birlikte öğreneceğiz. Hazır mısın?`,
      'professional': `İyi günler ${profile.name}. Bugünkü dersimiz: ${lesson.title}. Hedeflerimizi birlikte gerçekleştirelim.`,
      'playful': `Hey ${profile.name}! 🎉 Bugün süper eğlenceli bir konu var: ${lesson.title}! Birlikte maceraya çıkalım!`
    };
    
    return greetings[aiTeacher.personality] || greetings.friendly;
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Kullanıcı mesajını ekle
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    // Session metrikleri güncelle
    setSessionMetrics(prev => ({
      ...prev,
      interactions: prev.interactions + 1
    }));

    try {
      console.log("🤖 AI'ya mesaj gönderiliyor:", message);
      
      let aiResponse = null;
      
      // STABLE MOD - Stabil, sesli, gerçek öğretmen gibi! (VARSAYILAN)
      if (teachingMode === 'stable' && currentTeachingMessage) {
        console.log('🎓 Stable mod: Öğrenci yanıtı işleniyor...');
        
        try {
          // Öğrenci yanıtını işle ve sonraki adımı al
          const nextPhase = await stableTeacher.processResponse(
            message,
            currentTeachingMessage
          );
          
          console.log('📍 Sonraki faz:', nextPhase.phase);
          
          // Yeni mesajı göster
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: nextPhase.message,
            timestamp: new Date().toLocaleTimeString(),
            emotion: 'friendly',
            stable: true,
            phase: nextPhase.phase,
            requiresResponse: nextPhase.requiresResponse,
            voiceEnabled: nextPhase.voiceEnabled
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setCurrentTeachingMessage(nextPhase);
          
          // Eğer ders tamamlandıysa
          if (nextPhase.lessonComplete) {
            setLessonStarted(false);
            console.log('🎊 Ders tamamlandı!');
          }
          
          // Sonraki mesaj varsa (iki mesaj birden)
          if (nextPhase.nextMessage) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const nextMsg = {
              id: Date.now() + 2,
              type: 'ai',
              content: nextPhase.nextMessage.message,
              timestamp: new Date().toLocaleTimeString(),
              emotion: 'encouraging',
              stable: true
            };
            setMessages(prev => [...prev, nextMsg]);
            setCurrentTeachingMessage(nextPhase.nextMessage);
          }
          
          console.log('✅ Stable yanıt işlendi');
          return; // Stable modda buradan çık
          
        } catch (stableError) {
          console.error('Stable öğretim hatası:', stableError);
          // Fallback: Normal AI yanıtı
        }
      }
      
      // PROAKTIF MOD - Öğrenci yanıtını işle ve bir sonraki adıma geç
      else if (teachingMode === 'proactive' && currentTeachingMessage) {
        console.log('🎓 Proaktif mod: Öğrenci yanıtı işleniyor...');
        
        try {
          // Öğrenci yanıtını değerlendir
          const evaluation = await proactiveTeacher.processStudentResponse(
            message, 
            currentTeachingMessage
          );
          
          console.log('📊 Değerlendirme:', evaluation);
          
          // Geri bildirim varsa göster
          if (evaluation.feedback) {
            const feedbackMessage = {
              id: Date.now() + 1,
              type: 'ai',
              content: evaluation.feedback,
              timestamp: new Date().toLocaleTimeString(),
              emotion: evaluation.advance ? 'happy' : 'supportive',
              proactive: true
            };
            setMessages(prev => [...prev, feedbackMessage]);
            
            // Kısa bekleme
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
          // Sonraki adıma geç mi?
          if (evaluation.advance) {
            proactiveTeacher.advance();
            
            // Yeni talimatı al
            const nextInstruction = await proactiveTeacher.generateNextInstruction(
              lessonData, 
              studentProfile
            );
            
            // Ders tamamlandı mı?
            if (nextInstruction.completed) {
              const completionMessage = {
                id: Date.now() + 2,
                type: 'ai',
                content: nextInstruction.message,
                timestamp: new Date().toLocaleTimeString(),
                emotion: 'celebration',
                proactive: true,
                lessonComplete: true
              };
              setMessages(prev => [...prev, completionMessage]);
              setLessonStarted(false);
              return;
            }
            
            // Yeni adım mesajı göster
            const nextMessage = {
              id: Date.now() + 2,
              type: 'ai',
              content: nextInstruction.message,
              timestamp: new Date().toLocaleTimeString(),
              emotion: 'encouraging',
              proactive: true,
              state: nextInstruction.state,
              awaitingResponse: nextInstruction.awaitingResponse
            };
            
            setMessages(prev => [...prev, nextMessage]);
            setCurrentTeachingMessage(nextInstruction);
            console.log('✅ Sonraki adıma geçildi!');
            
          } else if (evaluation.reteach) {
            // Tekrar anlat
            const reteachMessage = {
              id: Date.now() + 2,
              type: 'ai',
              content: 'Tamam, farklı bir yöntemle anlatayım... 🔄\n\n' + 
                       proactiveTeacher.generateExplanation(lessonData).message,
              timestamp: new Date().toLocaleTimeString(),
              emotion: 'patient',
              proactive: true
            };
            setMessages(prev => [...prev, reteachMessage]);
          }
          
          return; // Proaktif modda buradan çık
          
        } catch (proactiveError) {
          console.error('Proaktif öğretim hatası:', proactiveError);
          // Fallback: Normal AI yanıtı
        }
      }
      
      // REAKTİF MOD veya FALLBACK - Normal AI yanıtı
      // 1. Önce advancedAITeacher dene
      try {
        const aiContext = {
          lesson: lessonData,
          currentSection: lessonData?.sections[currentSection],
          studentProfile: studentProfile,
          conversationHistory: messages.slice(-10),
          mebObjectives: lessonData?.objectives || [],
          studentLevel: studentProfile.currentLevel,
          learningStyle: studentProfile.learningStyle
        };

        aiResponse = await advancedAITeacher.teach({
          message: message,
          context: aiContext,
          studentId: studentProfile.id
        });
        
        console.log('✅ AI yanıtı alındı (Advanced)');
      } catch (advError) {
        console.warn('⚠️ Advanced AI hatası, fallback kullanılacak:', advError);
      }

      // 2. Eğer başarısız olduysa basit yanıt oluştur
      if (!aiResponse || !aiResponse.message) {
        console.log('💡 Demo AI yanıtı oluşturuluyor...');
        aiResponse = generateDemoAIResponse(message, studentProfile, lessonData);
      }

      // AI yanıtını ekle
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.message || aiResponse.response || aiResponse,
        timestamp: new Date().toLocaleTimeString(),
        emotion: aiResponse.tone || 'friendly',
        visualAids: aiResponse.visuals || [],
        suggestions: aiResponse.suggestions || []
      };
      
      setMessages(prev => [...prev, aiMessage]);
      console.log('✅ AI mesajı eklendi');

      // Görsel yardımları göster
      if (aiResponse.visuals && aiResponse.visuals.length > 0) {
        setInteractiveState(prev => ({
          ...prev,
          showVisual: true,
          currentVisual: aiResponse.visuals[0]
        }));
      }

    } catch (error) {
      console.error('❌ AI yanıt hatası:', error);
      
      // Fallback - Basit ama çalışan bir yanıt
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateSimpleFallback(message, studentProfile),
        timestamp: new Date().toLocaleTimeString(),
        emotion: 'helpful'
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Demo AI yanıt oluşturucu
  const generateDemoAIResponse = (userMessage, profile, lesson) => {
    const msg = userMessage.toLowerCase();
    
    // Konu bazlı yanıtlar
    if (msg.includes('tam sayı') || msg.includes('nedir') || msg.includes('ne demek')) {
      return {
        message: `Merhaba ${profile.name}! 🎓\n\nTam sayılar, pozitif ve negatif sayıları içerir. Sıfırın sağında pozitif (+), solunda negatif (-) sayılar vardır.\n\n📊 Örnek:\n+5 (sıcak hava, 5 derece)\n-3 (soğuk hava, eksi 3 derece)\n0 (donma noktası)\n\nGünlük hayattan düşün: Banka hesabında +1000 TL paran varsa alacaklısın, -500 TL ise borçlusun! 💰`,
        tone: 'friendly'
      };
    }
    
    if (msg.includes('örnek') || msg.includes('sample')) {
      return {
        message: `Tabii! İşte ${lesson?.topic || 'bu konu'} için örnekler:\n\n📝 Örnek 1: (-5) + (+8) = +3\n📝 Örnek 2: (+7) - (+10) = -3\n📝 Örnek 3: (-4) × (+2) = -8\n\nAnladın mı? Denemek ister misin? 🎯`,
        tone: 'encouraging'
      };
    }
    
    if (msg.includes('anlamadım') || msg.includes('zor')) {
      return {
        message: `Endişelenme ${profile.name}! 😊 Adım adım gidelim:\n\n1️⃣ Önce basit bir örnekle başlayalım\n2️⃣ Sonra mantığını anlayalım\n3️⃣ En son pratik yapalım\n\nHangi kısmını anlamadın? Özel olarak onu açıklayayım! 💡`,
        tone: 'supportive'
      };
    }
    
    if (msg.includes('quiz') || msg.includes('test') || msg.includes('soru')) {
      return {
        message: `Harika! 🎯 Hemen bir quiz sorusu sorayım:\n\n❓ (-8) + (+12) = ?\n\nA) -20\nB) -4\nC) +4\nD) +20\n\nCevabını yaz! 📝`,
        tone: 'energetic'
      };
    }
    
    // Genel yanıt
    return {
      message: `Merhaba ${profile.name}! 👋\n\nBen senin ${lesson?.grade || profile.grade}. sınıf matematik öğretmeninim. "${lesson?.topic || 'Matematik'}" konusunu birlikte öğreneceğiz!\n\nŞunları sorabilirsin:\n• "Bu konu nedir?"\n• "Örnek verir misin?"\n• "Anlamadım, tekrar anlatır mısın?"\n• "Quiz çözmek istiyorum"\n\nNasıl yardımcı olabilirim? 🎓`,
      tone: 'welcoming'
    };
  };
  
  // Basit fallback
  const generateSimpleFallback = (userMessage, profile) => {
    return `Merhaba ${profile.name}! "${userMessage}" sorunuzu aldım. \n\nŞu an AI sisteminde küçük bir sorun var ama sana yardımcı olmaya çalışıyorum! 💪\n\nBana:\n• "Örnek ver"\n• "Anlamadım"\n• "Quiz"\ngibi basit komutlar verebilirsin, hemen cevap vereceğim! 😊`;
  };

  const handleSectionComplete = async () => {
    const currentSectionData = lessonData.sections[currentSection];
    
    // İlerlemeyi kaydet
    const score = calculateSectionScore();
    
    setProgress(prev => ({
      ...prev,
      completedSections: [...prev.completedSections, currentSectionData.id],
      currentScore: (prev.currentScore + score) / 2
    }));

    // Backend'e kaydet
    try {
      await api.post('/curriculum/personalized/update-progress', null, {
        params: {
          grade: studentProfile.grade,
          subject: lessonData.subject.toLowerCase(),
          topic: currentSectionData.title,
          score: score / 100,
          time_spent: sessionMetrics.sessionDuration || 0
        }
      });

      // Başarı mesajı
      const congratsMessage = {
        id: Date.now(),
        type: 'ai',
        content: `🎉 Harika! "${currentSectionData.title}" konusunu tamamladın! Başarı oranın: %${score}. ${
          score >= 80 ? 'Mükemmel bir performans!' : score >= 60 ? 'İyi iş çıkardın!' : 'Biraz daha pratik yapalım mı?'
        }`,
        timestamp: new Date().toLocaleTimeString(),
        emotion: 'proud'
      };
      setMessages(prev => [...prev, congratsMessage]);

      // Bir sonraki bölüme geç
      if (currentSection < lessonData.sections.length - 1) {
        setTimeout(() => {
          setCurrentSection(prev => prev + 1);
        }, 2000);
      } else {
        // Ders tamamlandı!
        handleLessonComplete();
      }

    } catch (error) {
      console.error('İlerleme kaydetme hatası:', error);
    }
  };

  const calculateSectionScore = () => {
    const { questionsAnswered, correctAnswers, hintsUsed } = progress;
    
    if (questionsAnswered === 0) return 70; // Varsayılan
    
    let baseScore = (correctAnswers / questionsAnswered) * 100;
    let penalty = hintsUsed * 5; // Her ipucu -5 puan
    
    return Math.max(0, Math.min(100, baseScore - penalty));
  };

  const handleLessonComplete = async () => {
    const finalScore = progress.currentScore;
    const totalTime = (Date.now() - sessionMetrics.startTime) / 1000;

    // Tebrik mesajı
    const completionMessage = {
      id: Date.now(),
      type: 'ai',
      content: `🏆 Tebrikler ${studentProfile.name}! Dersi tamamladın!\n\n📊 Genel Başarın: %${Math.round(finalScore)}\n⏱️ Toplam Süre: ${Math.floor(totalTime / 60)} dakika\n🎯 Doğru Cevap: ${progress.correctAnswers}/${progress.questionsAnswered}\n\n${
        finalScore >= 85 ? '⭐⭐⭐ Mükemmel! Bir sonraki konuya geçebilirsin!' :
        finalScore >= 70 ? '⭐⭐ Çok iyi! Konuyu kavramışsın.' :
        '⭐ İyi çaba! Biraz daha pratik yapman faydalı olabilir.'
      }`,
      timestamp: new Date().toLocaleTimeString(),
      emotion: 'proud'
    };
    
    setMessages(prev => [...prev, completionMessage]);

    // Başarı kazanımları
    if (finalScore >= 90) {
      setTimeout(() => {
        showAchievement('perfect_lesson', 'Mükemmel Ders', '+100 XP');
      }, 2000);
    }
  };

  const showAchievement = (id, title, reward) => {
    // Achievement popup göster
    const achievementMsg = {
      id: Date.now(),
      type: 'achievement',
      content: `🏆 Yeni Başarı Kazandın!\n\n${title}\n${reward}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, achievementMsg]);
  };

  const askAITeacher = async (question) => {
    // Hızlı AI sorgusu
    await sendMessage(question);
  };

  const requestHint = async () => {
    setProgress(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    
    const hintMessage = {
      id: Date.now(),
      type: 'ai',
      content: '💡 İpucu: ' + generateHint(lessonData.sections[currentSection]),
      timestamp: new Date().toLocaleTimeString(),
      emotion: 'helpful'
    };
    setMessages(prev => [...prev, hintMessage]);
  };

  const generateHint = (section) => {
    const hints = [
      'Önce konunun temel kavramlarını hatırla.',
      'Gerçek hayattan örnekler düşün.',
      'Adım adım ilerle, acele etme.',
      'Eğer zorlanıyorsan, önceki bölüme geri dönebilirsin.'
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
    }
  };

  if (loading) {
    return (
      <div className="lesson-loading">
        <div className="loading-animation">🎓</div>
        <div>Ders hazırlanıyor...</div>
      </div>
    );
  }

  return (
    <div className="lesson-room-ultimate">
      {/* Header */}
      <div className="lesson-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard
        </button>
        <div className="lesson-info">
          <h1>{lessonData?.title}</h1>
          <div className="lesson-meta">
            <span className="meta-badge">{lessonData?.subject}</span>
            <span className="meta-badge">{lessonData?.grade}. Sınıf</span>
            <span className="meta-badge">{lessonData?.topic}</span>
            {teachingMode === 'stable' && (
              <span className="meta-badge voice-badge">
                🔊 Sesli Öğretmen
              </span>
            )}
          </div>
        </div>
        <div className="lesson-controls">
          {/* Ses Kontrol Butonu */}
          <button 
            className={`btn-voice ${voiceEnabled ? 'active' : ''}`}
            onClick={() => {
              const newState = stableTeacher.toggleVoice();
              setVoiceEnabled(newState);
            }}
            title={voiceEnabled ? "Sesi Kapat" : "Sesi Aç"}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
          
          {/* Konuşmayı Durdur */}
          {isSpeaking && (
            <button 
              className="btn-stop-speak"
              onClick={() => stableTeacher.stopSpeaking()}
              title="Konuşmayı Durdur"
            >
              ⏹️
            </button>
          )}
        </div>
        <div className="lesson-progress-mini">
          <span>İlerleme: {currentSection + 1}/{lessonData?.sections.length}</span>
          <div className="progress-bar-mini">
            <div 
              className="progress-fill-mini" 
              style={{ width: `${((currentSection + 1) / lessonData?.sections.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lesson-content">
        {/* Left Sidebar - Sections */}
        <div className="lesson-sidebar">
          <h3>📚 Ders İçeriği</h3>
          <div className="sections-list">
            {lessonData?.sections.map((section, index) => (
              <div
                key={section.id}
                className={`section-item ${index === currentSection ? 'active' : ''} ${
                  progress.completedSections.includes(section.id) ? 'completed' : ''
                }`}
                onClick={() => setCurrentSection(index)}
              >
                <div className="section-number">{index + 1}</div>
                <div className="section-details">
                  <div className="section-title">{section.title}</div>
                  <div className="section-time">~{section.estimatedTime} dk</div>
                </div>
                {progress.completedSections.includes(section.id) && (
                  <div className="section-check">✅</div>
                )}
              </div>
            ))}
          </div>

          {/* MEB Objectives */}
          <div className="meb-objectives">
            <h4>🎯 MEB Kazanımları</h4>
            <ul>
              {lessonData?.objectives.map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Center - Chat Interface */}
        <div className="lesson-chat">
          <div className="chat-header">
            <div className="ai-teacher-info">
              <div className="ai-avatar">{aiTeacher.avatar}</div>
              <div>
                <div className="ai-name">{aiTeacher.name}</div>
                <div className="ai-status">
                  {isTyping ? '💬 Yazıyor...' : '✅ Aktif'}
                </div>
              </div>
            </div>
            <div className="chat-actions">
              <button className="btn-hint" onClick={requestHint} title="İpucu Al">
                💡 İpucu
              </button>
              <button className="btn-explain" onClick={() => askAITeacher('Bunu detaylı açıklar mısın?')} title="Detaylı Açıklama">
                📖 Açıkla
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'ai' ? aiTeacher.avatar : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">{message.timestamp}</div>
                  
                  {message.visualAids && message.visualAids.length > 0 && (
                    <div className="visual-aids">
                      {message.visualAids.map((visual, index) => (
                        <div key={index} className="visual-item">
                          📊 {visual}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="quick-replies">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="quick-reply-btn"
                          onClick={() => sendMessage(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message ai typing">
                <div className="message-avatar">{aiTeacher.avatar}</div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Smart Prompt Input */}
          <SmartPromptInput
            onSend={sendMessage}
            onTyping={(typing) => setIsTyping(typing)}
            placeholder="AI öğretmenine sor... (/, @, veya doğrudan yaz)"
            maxLength={500}
            enableVoice={true}
            enableEmoji={true}
            enableCommands={true}
            enableMath={true}
            aiSuggestions={[
              "Bu konuyu anlamadım, tekrar anlatır mısın?",
              "Bir örnek verir misin?",
              "Bunu günlük hayatta nerede kullanırız?",
              "Quiz çözmek istiyorum",
              "Daha kolay bir yöntem var mı?",
              "Bu formülü açıklar mısın?"
            ]}
          />
        </div>

        {/* Right Sidebar - Interactive Tools */}
        <div className="lesson-tools">
          {/* Progress Card */}
          <div className="tool-card progress-card">
            <h4>📊 Performansın</h4>
            <div className="score-circle">
              <svg viewBox="0 0 100 100" className="score-svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="6" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#667eea" 
                  strokeWidth="6"
                  strokeDasharray={`${progress.currentScore * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="score-text">%{Math.round(progress.currentScore)}</div>
            </div>
            <div className="progress-stats">
              <div className="stat-row">
                <span>Doğru:</span>
                <span>{progress.correctAnswers}/{progress.questionsAnswered}</span>
              </div>
              <div className="stat-row">
                <span>Süre:</span>
                <span>{Math.floor(progress.timeSpent / 60)}dk</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="tool-card insights-card">
            <h4>🤖 AI Önerileri</h4>
            <div className="insight-item">
              <span className="insight-icon">🎯</span>
              <span>Öğrenme hızın normal seviyede</span>
            </div>
            <div className="insight-item">
              <span className="insight-icon">💪</span>
              <span>Kavramları iyi anlıyorsun</span>
            </div>
            {sessionMetrics.confusionDetected && (
              <div className="insight-item warning">
                <span className="insight-icon">⚠️</span>
                <span>Bu konu biraz zor gelebilir</span>
              </div>
            )}
          </div>

          {/* Gamification */}
          <div className="tool-card rewards-card">
            <h4>🎮 Ödüller</h4>
            <div className="reward-item">
              <span>⭐ XP Kazandın:</span>
              <span className="reward-value">+{progress.questionsAnswered * 10}</span>
            </div>
            <div className="reward-item">
              <span>🪙 Coin:</span>
              <span className="reward-value">+{progress.correctAnswers * 5}</span>
            </div>
            {progress.correctAnswers >= 5 && (
              <div className="reward-badge">
                🏆 Kesir Ustası Rozeti Kazandın!
              </div>
            )}
          </div>

          {/* Section Actions */}
          <div className="tool-card actions-card">
            <button 
              className="btn-complete-section"
              onClick={handleSectionComplete}
              disabled={progress.questionsAnswered < 3}
            >
              ✅ Bölümü Tamamla
            </button>
            <button className="btn-next-section" onClick={() => setCurrentSection(prev => Math.min(prev + 1, lessonData.sections.length - 1))}>
              ▶️ Sonraki Bölüm
            </button>
            <button className="btn-exit" onClick={() => navigate('/student/dashboard')}>
              🚪 Çıkış
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonRoomUltimate;

