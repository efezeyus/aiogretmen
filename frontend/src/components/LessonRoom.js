import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import aiService from '../services/aiService';
import './LessonRoom.css';

// AI Öğretmen Avatar
const AI_AVATAR = '🤖';
const USER_AVATAR = '👤';

// Ders içeriği
const LESSON = {
  title: "5. Sınıf Matematik - Basamak Kavramı",
  course: "Matematik",
  sections: [
    "Basamak Kavramı",
    "Sayıları Okuma",
    "Basamak Değeri",
    "Sayıları Yazma",
    "Karşılaştırma",
    "Özet ve Test"
  ],
  content: {
    1: {
      audio: "Merhaba öğrencilerim! Bugün matematik dersinde basamak kavramını öğreneceğiz. Basamak, sayıları yazarken her rakamın bulunduğu yerdir. En sağdan başlayarak birler basamağı, onlar basamağı, yüzler basamağı diye devam eder. Örneğin 123 sayısında 3 birler basamağında, 2 onlar basamağında, 1 yüzler basamağındadır. Anladınız mı?",
      keyPoints: ["Basamak kavramı", "Birler, onlar, yüzler basamağı", "Sayı yazma"],
      difficulty: "beginner",
      expectedResponse: "evet anladım"
    },
    2: {
      audio: "Harika! Şimdi sayıları nasıl okuyacağımızı öğrenelim. 123 sayısını okurken 'yüz yirmi üç' deriz. Yani yüzler basamağındaki sayıyı söyler, sonra onlar basamağındaki sayıyı, en son da birler basamağındaki sayıyı söyleriz. 456 sayısını nasıl okuruz?",
      keyPoints: ["Sayı okuma", "Basamak sırası", "Türkçe okuma"],
      difficulty: "beginner",
      expectedResponse: "dört yüz elli altı"
    },
    3: {
      audio: "Mükemmel! Şimdi basamak değerini öğrenelim. Her basamağın bir değeri vardır. Birler basamağı 1, onlar basamağı 10, yüzler basamağı 100 katıdır. Yani 123'te 1'in değeri 100, 2'nin değeri 20, 3'ün değeri 3'tür. 234 sayısında 2'nin basamak değeri nedir?",
      keyPoints: ["Basamak değeri", "Çarpma işlemi", "Hesaplama"],
      difficulty: "intermediate",
      expectedResponse: "200"
    },
    4: {
      audio: "Harika! Şimdi sayıları yazmayı öğrenelim. Yazarken sağdan sola doğru yazarız. Önce birler basamağı, sonra onlar basamağı, en son yüzler basamağı. 'Yüz yirmi üç' sayısını nasıl yazarız?",
      keyPoints: ["Sayı yazma", "Sağdan sola", "Basamak sırası"],
      difficulty: "intermediate",
      expectedResponse: "123"
    },
    5: {
      audio: "Mükemmel! Şimdi sayıları karşılaştırmayı öğrenelim. Karşılaştırırken soldan sağa doğru bakarız. İlk farklı basamakta hangi sayı büyükse o sayı büyüktür. 123 ile 145'i karşılaştırırken hangisi büyüktür?",
      keyPoints: ["Karşılaştırma", "Soldan sağa", "Büyük küçük"],
      difficulty: "intermediate",
      expectedResponse: "145"
    },
    6: {
      audio: "Harika! Bugün basamak kavramını çok güzel öğrendiniz. Basamak kavramı matematikte çok önemlidir. Sayıları okuma, yazma, karşılaştırma ve hesaplama için kullanırız. Başka sorunuz var mı?",
      keyPoints: ["Özet", "Önem", "Kullanım alanları"],
      difficulty: "beginner",
      expectedResponse: "hayır teşekkürler"
    }
  }
};

export default function LessonRoom() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);

  // Temel state'ler
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: LESSON.content[1].audio, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [showObjectives, setShowObjectives] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micSupported, setMicSupported] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true); // Varsayılan olarak true
  const [studentProgress, setStudentProgress] = useState({
    currentSection: 1,
    completedSections: [],
    understandingLevel: 'beginner', // beginner, intermediate, advanced
    correctAnswers: 0,
    totalQuestions: 0,
    timeSpent: 0,
    difficulties: [],
    strengths: []
  });
  const [teachingStrategy, setTeachingStrategy] = useState({
    pace: 'slow',
    explanations: 'detailed',
    examples: 'many',
    repetition: 'high',
    encouragement: 'high'
  });
  const [sessionStartTime] = useState(Date.now());

  // AI Öğretmen Sistemi State'leri
  // Bu state'ler yukarıda zaten tanımlandı

  // Akıllı Mesaj Gönderme Sistemi
  const sendMessage = async (msg) => {
    if (!msg.trim()) return;

    // Kullanıcı mesajını ekle
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: msg,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Input'u temizle
    setUserInput('');

    // AI yanıtı için loading göster
    setIsTyping(true);

    try {
      // DeepSeek AI öğretmenden yanıt al
      const lessonContext = {
        gradeLevel: 5,
        subject: 'matematik',
        conversationHistory: messages.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      };

      const aiResponse = await aiService.getSmartTeacherResponse(msg, lessonContext);

      if (aiResponse.success) {
        // AI yanıtını ekle
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiResponse.response,
          timestamp: new Date().toLocaleTimeString(),
          model: aiResponse.model,
          provider: aiResponse.provider
        };
        setMessages(prev => [...prev, aiMessage]);

        // Ses sistemi aktifse konuştur
        if (autoPlay && aiResponse.response) {
          setTimeout(() => {
            speakText(aiResponse.response);
          }, 1000);
        }
      } else {
        // Hata durumunda basit yanıt
        const fallbackMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }

    } catch (error) {
      console.error('❌ AI öğretmen hatası:', error);
      
      // Hata durumunda basit yanıt
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Otomatik scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // AI mesajı geldiğinde otomatik sesli okutma
  useEffect(() => {
    if (messages.length === 0) {
      console.log('📝 Henüz mesaj yok, ses çalmayı atlıyorum');
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.type !== 'ai') {
      console.log('📝 Son mesaj AI değil, ses çalmayı atlıyorum');
      return;
    }

    console.log('🎤 AI mesajı için ses sentezi başlatılıyor:', lastMsg.content.substring(0, 50) + '...');
    console.log('🔊 AutoPlay durumu:', autoPlay);
    console.log('🎤 SpeechSynthesis mevcut:', !!window.speechSynthesis);

    // AutoPlay kapalıysa ses çalmayı atla
    if (!autoPlay) {
      console.log('🔇 AutoPlay kapalı, ses çalmayı atlıyorum');
      return;
    }

    // SpeechSynthesis kontrolü
    if (!window.speechSynthesis) {
      console.error('❌ SpeechSynthesis desteklenmiyor!');
      return;
    }

    // Önceki sesi durdur
    window.speechSynthesis.cancel();
    console.log('🛑 Önceki ses durduruldu');
    
    // Ses çal
    speakText(lastMsg.content);
      
    //   // Event handlers
    //   utter.onstart = () => {
    //     console.log('🎤 Ses sentezi başladı!');
    //     setIsSpeaking(true);
    //   };

    //   utter.onend = () => {
    //     console.log('🎤 Ses sentezi bitti!');
    //     setIsSpeaking(false);
    //   };

    //   utter.onerror = (event) => {
    //     console.error('❌ Ses sentezi hatası:', event);
    //     console.error('🔍 Hata detayları:', {
    //       error: event.error,
    //       message: event.message,
    //       type: event.type
    //     });
    //     setIsSpeaking(false);
        
    //     // Hata durumunda kullanıcıya bilgi ver
    //     if (event.error === 'not-allowed') {
    //       console.log('❌ Ses izni verilmedi! Kullanıcı etkileşimi gerekli.');
    //       // Ses izni hatası durumunda sessiz moda geç
    //       setAutoPlay(false);
    //     } else if (event.error === 'network') {
    //       alert('❌ Ağ hatası! İnternet bağlantınızı kontrol edin.');
    //     } else {
    //       alert('❌ Ses sistemi hatası! Konsolu kontrol edin.');
    //     }
    //   };

    //   // Ses motorlarını kontrol et
    //   const voices = window.speechSynthesis.getVoices();
    //   console.log('🎤 Mevcut ses motorları:', voices.length);
      
    //   if (voices.length > 0) {
    //     // Türkçe ses motorunu seç
    //     const turkishVoice = voices.find(v => v.lang.includes('tr')) || voices.find(v => v.lang.includes('en'));
    //     if (turkishVoice) {
    //       utter.voice = turkishVoice;
    //       console.log('🎤 Seçilen ses motoru:', turkishVoice.name, '(', turkishVoice.lang, ')');
    //     } else {
    //       console.log('⚠️ Türkçe ses motoru bulunamadı, varsayılan kullanılıyor');
    //     }
    //   } else {
    //     console.log('⚠️ Ses motorları henüz yüklenmedi, varsayılan kullanılıyor');
    //   }

    //   // Ses sentezini başlat
    //   try {
    //     window.speechSynthesis.speak(utter);
    //     console.log('🎤 Ses sentezi başlatıldı!');
    //     speechRef.current = utter;
    //   } catch (error) {
    //     console.error('❌ Ses sentezi başlatma hatası:', error);
    //     alert('Ses sistemi başlatılamadı: ' + error.message);
    //   }
    // };

    // İlk mesaj için kullanıcı etkileşimi bekle
    if (messages.length === 1) {
      console.log('🎤 İlk mesaj için kullanıcı etkileşimi bekleniyor...');
      // İlk mesaj için ses çalmayı atla, kullanıcı etkileşimi sonrası başlat
      return;
    }

    // 1 saniye bekle ve sesi çal
    setTimeout(() => {
      speakText(lastMsg.content);
    }, 1000);

  }, [messages, autoPlay]);

  // Mikrofon desteği ve SpeechRecognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setMicSupported(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(interim);
      if (final) {
        setTranscript('');
        setUserInput(final);
      }
    };
    recognitionRef.current = recognition;
  }, []);

  // Hızlı cevaplar - Akıllı öneriler
  const getQuickResponses = () => {
    const currentLesson = LESSON.content[currentSection];
    const baseResponses = [
      'Evet, hazırım!',
      'Biraz heyecanlıyım',
      'Bu konuyu merak ediyorum',
      'Anladım!',
      'Çok mantıklı!',
      'Devam edin lütfen'
    ];
    
    // Mevcut bölüme özel cevaplar
    const sectionResponses = {
      1: ['Evet, hazırım!', 'Bu konuyu merak ediyorum'],
      2: ['Anladım!', 'Biraz daha açıklayabilir misiniz?'],
      3: ['Çok mantıklı!', 'Örnek daha verebilir misiniz?'],
      4: ['Anladım!', 'Biraz karmaşık geldi'],
      5: ['İki bin sekiz yüz kırk yedi!', 'Biraz düşüneyim'],
      6: ['Beş bin altı yüz yetmiş sekiz!', 'Tekrar edebilir misiniz?']
    };
    
    return sectionResponses[currentSection] || baseResponses;
  };

  const quickResponses = getQuickResponses();

  // Enter ile gönder
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
    }
  };

  // Sesi durdur fonksiyonu
  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Sesi tekrar oynat
  const replaySpeech = () => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.type === 'ai') {
      speakText(lastMsg.content);
    }
  };

  // Mikrofondan konuşmayı başlat/durdur
  const handleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  // Ses ayarlarını kontrol etme fonksiyonu
  const checkAudioSettings = () => {
    console.log('🔧 === SES AYARLARI KONTROLÜ ===');
    console.log('🔧 SpeechSynthesis mevcut:', 'speechSynthesis' in window);
    console.log('🔧 AutoPlay aktif:', autoPlay);
    console.log('🔧 Mevcut mesajlar:', messages.length);
    console.log('🔧 Son mesaj tipi:', messages.length > 0 ? messages[messages.length - 1].type : 'yok');
    console.log('🔧 Tarayıcı:', navigator.userAgent);

    const voices = window.speechSynthesis.getVoices();
    console.log('🔧 SpeechSynthesis ses motorları:', voices.length);
    console.log('🔧 Türkçe ses motorları:', voices.filter(v => v.lang.includes('tr')).length);
    console.log('🔧 Mevcut ses motorları:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Ses motorlarının durumunu kontrol et
    if (voices.length === 0) {
      console.log('⚠️ Hiç ses motoru bulunamadı!');
      alert('⚠️ Ses motorları yüklenmedi! Sayfayı yenileyin.');
    } else if (voices.filter(v => v.lang.includes('tr')).length === 0) {
      console.log('⚠️ Türkçe ses motoru bulunamadı!');
      alert('⚠️ Türkçe ses motoru bulunamadı! İngilizce ses motoru kullanılacak.');
    } else {
      console.log('✅ Ses motorları hazır!');
      alert('✅ Ses motorları hazır! Türkçe ses motoru bulundu.');
    }
  };

  // Ses motorlarının yüklenmesini bekle
  const waitForVoices = (callback) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      callback(voices);
    } else {
      setTimeout(() => waitForVoices(callback), 100);
    }
  };

  // Kullanıcı etkileşimi sonrası ses sistemini başlat
  const initializeSpeechSystem = () => {
    console.log('🎤 Ses sistemi kullanıcı etkileşimi sonrası başlatılıyor...');
    
    if (!window.speechSynthesis) {
      console.error('❌ SpeechSynthesis desteklenmiyor!');
      return;
    }

    // Test sesi çal
    const testUtter = new window.SpeechSynthesisUtterance("Ses sistemi aktif!");
    testUtter.lang = 'tr-TR';
    testUtter.rate = 0.9;
    testUtter.volume = 0.1; // Çok düşük ses
    
    testUtter.onstart = () => {
      console.log('✅ Ses sistemi başarıyla başlatıldı!');
      setAutoPlay(true);
    };

    testUtter.onerror = (event) => {
      console.error('❌ Ses sistemi başlatma hatası:', event.error);
      setAutoPlay(false);
    };

    try {
      window.speechSynthesis.speak(testUtter);
    } catch (error) {
      console.error('❌ Ses sistemi başlatma hatası:', error);
      setAutoPlay(false);
    }
  };

  // Test speech fonksiyonunu güncelle
  const testSpeech = () => {
    console.log('🧪 Konuşma testi başlatılıyor...');
    console.log('🎤 SpeechSynthesis mevcut:', !!window.speechSynthesis);
    
    const testText = "Merhaba! Ben AI öğretmeniniz. Ses sistemim çalışıyor mu?";
    
    if (!window.speechSynthesis) {
      alert('❌ SpeechSynthesis desteklenmiyor!');
      return;
    }

    // Önceki sesi durdur
    window.speechSynthesis.cancel();
    
    const utter = new window.SpeechSynthesisUtterance(testText);
    
    // Ses ayarları
    utter.lang = 'tr-TR';
    utter.rate = 0.9;
    utter.pitch = 1.1;
    utter.volume = 1.0;
    
    // Event handlers
    utter.onstart = () => {
      console.log('🎤 Test sesi başladı!');
      setIsSpeaking(true);
      alert('🎤 Test sesi çalıyor! Eğer ses duymuyorsanız, ses ayarlarınızı kontrol edin.');
      
      // Test başarılıysa ses sistemini aktif et
      setAutoPlay(true);
    };

    utter.onend = () => {
      console.log('🎤 Test sesi bitti!');
      setIsSpeaking(false);
      alert('✅ Test sesi tamamlandı! Ses sistemi çalışıyor.');
    };

    utter.onerror = (event) => {
      console.error('❌ Test sesi hatası:', event);
      setIsSpeaking(false);
      
      if (event.error === 'not-allowed') {
        alert('❌ Ses izni verilmedi! Tarayıcı ayarlarından ses iznini kontrol edin.');
      } else if (event.error === 'network') {
        alert('❌ Ağ hatası! İnternet bağlantınızı kontrol edin.');
      } else {
        alert('❌ Test sesi hatası! Konsolu kontrol edin.');
      }
    };

    // Ses motorlarını kontrol et
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Test için mevcut ses motorları:', voices.length);
    
    if (voices.length > 0) {
      // Türkçe ses motorunu seç
      const turkishVoice = voices.find(v => v.lang.includes('tr')) || voices.find(v => v.lang.includes('en'));
      if (turkishVoice) {
        utter.voice = turkishVoice;
        console.log('🎤 Test için seçilen ses motoru:', turkishVoice.name, '(', turkishVoice.lang, ')');
      } else {
        console.log('⚠️ Test için Türkçe ses motoru bulunamadı');
      }
    } else {
      console.log('⚠️ Test için ses motorları henüz yüklenmedi');
    }

    // Ses sentezini başlat
    try {
      window.speechSynthesis.speak(utter);
      console.log('🎤 Test sesi başlatıldı!');
    } catch (error) {
      console.error('❌ Test sesi başlatma hatası:', error);
      alert('Test sesi başlatılamadı: ' + error.message);
    }
  };

  // Component mount olduğunda ilk AI mesajını gönder
  useEffect(() => {
    console.log('🚀 LessonRoom component mount oldu');
    console.log('🔊 AutoPlay durumu:', autoPlay);
    console.log('🎤 SpeechSynthesis mevcut:', !!window.speechSynthesis);
    
    // İlk AI mesajını otomatik olarak gönder
    const sendFirstMessage = () => {
      if (messages.length === 0) {
        console.log('📝 İlk AI mesajı gönderiliyor...');
        const firstMessage = {
          id: 1,
          type: 'ai',
          content: LESSON.content[1].audio,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([firstMessage]);
        console.log('✅ İlk mesaj gönderildi:', firstMessage.content.substring(0, 50) + '...');
      }
    };
    
    // Hemen gönder
    sendFirstMessage();
    
    // 2 saniye sonra tekrar kontrol et
    setTimeout(() => {
      if (messages.length === 0) {
        console.log('🔄 İlk mesaj gönderilmedi, tekrar deniyorum...');
        sendFirstMessage();
      }
    }, 2000);
    
  }, []);

  // Ses sistemi fonksiyonları
  const speakText = (text) => {
    if (!window.speechSynthesis) {
      console.error('❌ SpeechSynthesis desteklenmiyor');
      return;
    }

    // Mevcut konuşmayı durdur
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    
    // Türkçe ses seç
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(voice => voice.lang === 'tr-TR') || voices[0];
    
    if (turkishVoice) {
      utter.voice = turkishVoice;
      console.log('🎤 Seçilen ses motoru:', turkishVoice.name, '(', turkishVoice.lang, ')');
    }

    // Ses ayarları
    utter.rate = 0.9;
    utter.pitch = 1.1;
    utter.volume = 1.0;

    // Event handlers
    utter.onstart = () => {
      console.log('🎤 Ses çalma başlatılıyor:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
    };

    utter.onend = () => {
      console.log('✅ Ses çalma tamamlandı');
      setIsSpeaking(false);
    };

    utter.onerror = (event) => {
      console.error('❌ Ses sentezi hatası:', event);
      console.log('🔍 Hata detayları:', {
        error: event.error,
        message: event.message,
        type: event.type
      });
      setIsSpeaking(false);
      
      if (event.error === 'not-allowed') {
        setAutoPlay(false);
        console.log('🔇 AutoPlay kapatıldı - tarayıcı izni gerekli');
      }
    };

    // Konuşmayı başlat
    window.speechSynthesis.speak(utter);
  };



  return (
    <div className="lesson-room">
      {/* HEADER */}
      <header className="lesson-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>← Geri</button>
          <div>
            <div className="lesson-title">{LESSON.title}</div>
            <div className="lesson-desc">{LESSON.course}</div>
          </div>
        </div>
        <div className="header-right">
            <button 
            className="btn-auto-play" 
            onClick={() => setAutoPlay(!autoPlay)}
            style={{
              background: autoPlay ? '#10b981' : '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              marginRight: '1rem',
              cursor: 'pointer'
            }}
          >
            {autoPlay ? '🔊 Sesli' : '🔇 Sessiz'}
          </button>
          <button className="btn-exit" onClick={() => navigate('/student/dashboard')}>Dersi Bitir</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="lesson-content">
        {/* SOL SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-title">📚 Ders İçeriği</div>
          <div className="section-list">
            {LESSON.sections.map((section, index) => (
              <div
                key={index}
                className={`section-item ${currentSection === index + 1 ? 'active' : ''} ${
                  studentProgress.completedSections.includes(index + 1) ? 'completed' : ''
                }`}
                onClick={() => setCurrentSection(index + 1)}
              >
                <span>{index + 1}</span>
                {section}
                {studentProgress.completedSections.includes(index + 1) && ' ✅'}
              </div>
            ))}
          </div>

          {/* Öğrenci İlerleme Paneli */}
          <div className="objectives">
            <div className="objectives-title">📊 Öğrenci İlerlemesi</div>
            <div className="objectives-list">
              <li>Tamamlanan Bölümler: {studentProgress.completedSections.length}/6</li>
              <li>Doğru Cevaplar: {studentProgress.correctAnswers}/{studentProgress.totalQuestions}</li>
              <li>Başarı Oranı: {studentProgress.totalQuestions > 0 ? Math.round((studentProgress.correctAnswers / studentProgress.totalQuestions) * 100) : 0}%</li>
              <li>Zorluk Yaşanan: {studentProgress.difficulties.length} bölüm</li>
              <li>Güçlü Olduğu: {studentProgress.strengths.length} bölüm</li>
            </div>
          </div>

          {/* AI Öğretmen Önerileri */}
          <div className="objectives">
            <div className="objectives-title">🤖 AI Öğretmen Önerileri</div>
            <div className="objectives-list">
              {studentProgress.correctAnswers / studentProgress.totalQuestions > 0.7 ? (
                <li>🎉 Mükemmel gidiyorsun! Hızlı ilerleyebilirsin.</li>
              ) : studentProgress.correctAnswers / studentProgress.totalQuestions > 0.5 ? (
                <li>👍 İyi gidiyorsun! Biraz daha pratik yap.</li>
              ) : (
                <li>📚 Daha fazla tekrar yapman gerekiyor.</li>
              )}
              {studentProgress.difficulties.length > 2 && (
                <li>�� Zorlandığın bölümleri tekrar et.</li>
              )}
              {studentProgress.strengths.length > 3 && (
                <li>⭐ Güçlü olduğun konuları pekiştir.</li>
              )}
            </div>
          </div>
        </aside>

        {/* CHAT ALANI */}
        <main className="chat-area">
          <div className="messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                {msg.type === 'ai' && <div className="avatar"><span>{AI_AVATAR}</span></div>}
                <div className="message-content">
                  <p>{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}</p>
                  <span className="timestamp">{msg.time}</span>
                </div>
                {msg.type === 'user' && <div className="avatar"><span>{USER_AVATAR}</span></div>}
              </div>
            ))}
            {isTyping && (
              <div className="message ai typing">
                <div className="avatar"><span>{AI_AVATAR}</span></div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Ses Kontrolleri */}
          <div style={{textAlign:'center', margin:'0.5rem 0', display:'flex', justifyContent:'center', gap:'0.5rem', flexWrap:'wrap'}}>
            {!autoPlay && (
              <button 
                onClick={initializeSpeechSystem}
                style={{background:'#8b5cf6',color:'#fff',border:'none',borderRadius:'8px',padding:'0.5rem 1.2rem',fontWeight:'bold',cursor:'pointer'}}
              >
                🎤 Ses Sistemini Başlat
              </button>
            )}
            {isSpeaking && (
              <button onClick={stopSpeech} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',padding:'0.5rem 1.2rem',fontWeight:'bold',cursor:'pointer'}}>
                🔴 Sesi Durdur
              </button>
            )}
            {!isSpeaking && messages.length > 0 && (
              <button onClick={replaySpeech} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',padding:'0.5rem 1.2rem',fontWeight:'bold',cursor:'pointer'}}>
                🔄 Tekrar Oynat
              </button>
            )}
            <button 
              onClick={testSpeech}
              style={{background:'#10b981',color:'#fff',border:'none',borderRadius:'8px',padding:'0.5rem 1.2rem',fontWeight:'bold',cursor:'pointer'}}
            >
              🔊 Konuşma Testi
            </button>
            <button 
              onClick={() => {
                checkAudioSettings();
                alert('Ses ayarları konsola yazdırıldı. F12 ile kontrol et!');
              }}
              style={{background:'#f59e0b',color:'#fff',border:'none',borderRadius:'8px',padding:'0.5rem 1.2rem',fontWeight:'bold',cursor:'pointer'}}
            >
              🔧 Ses Ayarları
            </button>
          </div>
          
          <div className="input-area">
            <div className="quick-responses">
              {quickResponses.map((txt, i) => (
                <button key={i} className="quick-response-btn" onClick={() => sendMessage(txt)}>{txt}</button>
              ))}
            </div>
            <div className="input-container">
              {/* Mikrofon butonu */}
              <button 
                type="button"
                className={`btn-mic${isListening ? ' listening' : ''}`}
                onClick={handleMic}
                disabled={!micSupported}
                title={micSupported ? (isListening ? 'Konuşmayı Bitir' : 'Mikrofonla Konuş') : 'Tarayıcı mikrofonu desteklemiyor'}
                style={{marginRight:'0.5rem'}}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
              <textarea
                value={isListening ? transcript : userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Konuşuyorsunuz...' : 'Sorunuzu yazın...'}
                rows={1}
                className={isListening ? 'listening' : ''}
                style={isListening ? {background:'#e0f2fe'} : {}}
              />
              <button className="btn-send" onClick={() => sendMessage(isListening ? transcript : userInput)} disabled={!(userInput.trim() || transcript.trim())}><span>📤</span></button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 