/**
 * Stabil AI Öğretmen - Gerçek Öğretmen Simülasyonu
 * 
 * Akış:
 * 1. Önce konuyu anlat (5-10 dakika)
 * 2. Örnek göster (3-5 örnek)
 * 3. "Anladın mı?" kontrol et
 * 4. Sorular sor (quiz)
 * 5. Cevaplara göre ilerle
 * 6. Sesli konuş (TTS)
 * 
 * Stabil ve öngörülebilir akış!
 */

import ttsService from './textToSpeechService';
import api from './api';

class StableTeacher {
  constructor() {
    // Ders durumu - Çok basit ve stabil
    this.lessonPhases = {
      GREETING: 'greeting',           // 1. Selamlama
      INTRODUCTION: 'introduction',   // 2. Konu tanıtımı
      EXPLANATION: 'explanation',     // 3. Konuyu anlat
      EXAMPLES: 'examples',           // 4. Örnekler
      CHECK: 'check',                 // 5. "Anladın mı?"
      QUIZ: 'quiz',                   // 6. Sorular sor
      FEEDBACK: 'feedback',           // 7. Geri bildirim
      NEXT: 'next'                    // 8. Sonraki adım
    };

    this.currentPhase = this.lessonPhases.GREETING;
    this.phaseIndex = 0;
    this.totalPhases = 8;
    
    // Ders verisi
    this.lessonData = null;
    this.studentName = '';
    this.currentTopic = '';
    
    // Ses ayarları
    this.voiceEnabled = true;
    this.autoRead = true;
    
    // Backend API URL
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  }

  /**
   * Dersi başlat - Stable ve öngörülebilir
   */
  async startLesson(lessonData, studentInfo) {
    console.log('🎓 Stabil öğretim başlıyor...');
    
    this.lessonData = lessonData;
    this.studentName = studentInfo.name || 'Öğrenci';
    this.currentTopic = lessonData.topic || lessonData.title;
    this.currentPhase = this.lessonPhases.GREETING;
    this.phaseIndex = 0;

    // İlk mesaj: Selamlama
    return await this.getGreeting();
  }

  /**
   * 1. SELAMLAMA - Gerçek öğretmen gibi
   */
  async getGreeting() {
    const message = `Merhaba ${this.studentName}! Ben senin matematik öğretmeninim. 

Bugün "${this.currentTopic}" konusunu birlikte öğreneceğiz.

Dersimiz şöyle ilerleyecek:
Önce ben konuyu anlatacağım, sonra örnekler göstereceğim, sonra da senin anlayıp anlamadığını kontrol edeceğim.

Hazır mısın? "Evet" yazarsan başlayalım!`;

    // Sesli oku
    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      expectedResponse: ['evet', 'hazırım', 'başlayalım', 'tamam'],
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * 2. KONU TANITIMI
   */
  async getIntroduction() {
    const message = `Çok güzel! O zaman başlayalım!

"${this.currentTopic}" konusu çok önemli ve günlük hayatta sürekli kullanıyoruz.

Şimdi sana bu konunun ne olduğunu, neden öğrenmemiz gerektiğini ve nerede kullanıldığını anlatacağım.

Dikkatle dinle, sonra sorularım olacak!`;

    // Sesli oku
    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: false,
      autoAdvance: true, // Otomatik devam
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * 3. KONUYU ANLAT - Backend'den gerçek AI yanıtı
   */
  async getExplanation() {
    console.log('📚 Konu anlatımı backend\'den alınıyor...');

    try {
      // Backend'den AI ile konu anlatımı al
      const response = await fetch(`${this.apiUrl}/ai/teach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          message: `${this.currentTopic} konusunu 5. sınıf seviyesinde, basit ve anlaşılır şekilde anlat. Örnekler ver. Günlük hayattan örnekler kullan.`,
          grade_level: this.lessonData.grade || 5,
          subject: 'matematik',
          user_name: this.studentName
        })
      });

      const data = await response.json();
      
      const explanation = data.response || this.getFallbackExplanation();

      // Sonuna anlama kontrolü ekle
      const message = `${explanation}

─────────────────────

Buraya kadar anladın mı? "Anladım" veya "Anlamadım" yaz!`;

      // Sesli oku
      if (this.voiceEnabled && this.autoRead) {
        await ttsService.speak(message);
      }

      return {
        phase: this.currentPhase,
        message: message,
        requiresResponse: true,
        expectedResponse: {
          understood: ['anladım', 'evet', 'tamam', 'açık', 'net'],
          confused: ['anlamadım', 'hayır', 'karışık', 'zor', 'tekrar']
        },
        voiceEnabled: this.voiceEnabled
      };

    } catch (error) {
      console.error('Backend hatası:', error);
      
      // Fallback
      const message = this.getFallbackExplanation() + '\n\nBuraya kadar anladın mı?';
      
      if (this.voiceEnabled && this.autoRead) {
        await ttsService.speak(message);
      }

      return {
        phase: this.currentPhase,
        message: message,
        requiresResponse: true,
        voiceEnabled: this.voiceEnabled
      };
    }
  }

  /**
   * Fallback açıklama (Backend çalışmazsa)
   */
  getFallbackExplanation() {
    return `${this.currentTopic} konusu matematiğin önemli konularından biridir.

Bu konuyu günlük hayatta çok kullanıyoruz. 

Örneğin alışverişte, yemek tariflerinde, zaman hesaplamalarında hep bu konuyu kullanırız.

Şimdi sana detaylı anlatayım...`;
  }

  /**
   * 4. ÖRNEKLER GÖSTER
   */
  async getExamples() {
    const message = `Harika! Şimdi örneklerle pekiştirelim!

📝 ÖRNEK 1: Basit bir başlangıç

Diyelim ki bir pizzayı 4 eşit parçaya böldük.
Sen 3 parçasını yedin.
Kaçını yedin? Cevap: 3 bölü 4, yani 3/4 (dörtte üç)

─────────────────────

📝 ÖRNEK 2: Biraz daha ilginç

Bir torbada 8 elma var.
Bunun yarısını arkadaşına verdin.
Kaç elma verdin? Cevap: 8 bölü 2 = 4 elma

─────────────────────

Bu örnekleri anladın mı? "Anladım" yaz, daha fazla örnek ister misin de "Daha fazla" yaz!`;

    // Sesli oku
    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      expectedResponse: {
        understood: ['anladım', 'evet', 'tamam'],
        more: ['daha', 'fazla', 'başka']
      },
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * 5. ANLAMA KONTROLÜ
   */
  async getComprehensionCheck() {
    const message = `Mükemmel! Şimdi anladığını kontrol edelim.

Sana basit bir soru soracağım, rahat ol!

❓ SORU: 

Bir çikolata tableti 6 parçaya bölünmüş.
Sen 2 parçasını yedin.
Çikolatanın kaçta kaçını yedin?

A) 2/4
B) 2/6
C) 6/2
D) 4/6

Cevabını yaz! (A, B, C veya D)

Yanlış yapsan bile sorun değil, beraber öğreneceğiz!`;

    // Sesli oku
    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      isQuiz: true,
      correctAnswer: 'B',
      explanation: '2 parça yedin, toplam 6 parça vardı, yani 2/6',
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * 6. QUIZ SORULARI
   */
  async getQuiz() {
    const message = `Harika çalışıyorsun! Birkaç soru daha soracağım.

❓ SORU 1:

3/4 ile 2/4 toplamı kaçtır?

A) 5/8
B) 5/4
C) 1
D) 6/4

Cevabını yaz!`;

    // Sesli oku
    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      isQuiz: true,
      correctAnswer: 'B',
      explanation: '3/4 + 2/4 = (3+2)/4 = 5/4',
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * 7. GERİ BİLDİRİM - Pozitif veya yönlendirici
   */
  async getFeedback(isCorrect, studentAnswer) {
    let message;

    if (isCorrect) {
      const praises = [
        'Harika! Çok doğru! 🌟',
        'Mükemmel! Tam olarak doğru! 👏',
        'Süpersin! Doğru cevap! 🎉',
        'Aferin! Çok iyi! ⭐',
        'Bravo! Kesinlikle doğru! 🎯'
      ];
      message = praises[Math.floor(Math.random() * praises.length)];
      
      message += '\n\nDevam ediyoruz!';
    } else {
      message = `Bu sefer olmadı ama sorun değil! Öğreniyoruz! 

Doğru cevap şuydu: [açıklama buraya gelecek]

Tekrar deneyelim, bu sefer olacak!`;
    }

    // Sesli oku
    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: false,
      autoAdvance: true,
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * Öğrenci yanıtını işle ve sonraki adıma geç
   */
  async processResponse(userMessage, currentPhaseData) {
    const msg = userMessage.toLowerCase().trim();

    console.log('📝 Yanıt işleniyor:', msg);
    console.log('📍 Mevcut faz:', this.currentPhase);

    // SELAMLAMA FAZI
    if (this.currentPhase === this.lessonPhases.GREETING) {
      if (currentPhaseData.expectedResponse.some(exp => msg.includes(exp))) {
        this.currentPhase = this.lessonPhases.INTRODUCTION;
        return await this.getIntroduction();
      }
    }

    // TANITIM - Otomatik devam
    if (this.currentPhase === this.lessonPhases.INTRODUCTION) {
      this.currentPhase = this.lessonPhases.EXPLANATION;
      // 2 saniye bekle, sonra açıklamaya geç
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await this.getExplanation();
    }

    // AÇIKLAMA - "Anladın mı?" kontrolü
    if (this.currentPhase === this.lessonPhases.EXPLANATION) {
      if (currentPhaseData.expectedResponse.understood.some(exp => msg.includes(exp))) {
        // Anladı, örneklere geç
        this.currentPhase = this.lessonPhases.EXAMPLES;
        return await this.getExamples();
      } else if (currentPhaseData.expectedResponse.confused.some(exp => msg.includes(exp))) {
        // Anlamadı, tekrar anlat
        return await this.getReExplanation();
      }
    }

    // ÖRNEKLER
    if (this.currentPhase === this.lessonPhases.EXAMPLES) {
      if (currentPhaseData.expectedResponse.understood.some(exp => msg.includes(exp))) {
        this.currentPhase = this.lessonPhases.CHECK;
        return await this.getComprehensionCheck();
      } else if (currentPhaseData.expectedResponse.more.some(exp => msg.includes(exp))) {
        // Daha fazla örnek iste
        return await this.getMoreExamples();
      }
    }

    // QUIZ KONTROLÜ
    if (this.currentPhase === this.lessonPhases.CHECK && currentPhaseData.isQuiz) {
      const isCorrect = msg === currentPhaseData.correctAnswer.toLowerCase();
      
      if (isCorrect) {
        this.currentPhase = this.lessonPhases.QUIZ;
        const feedback = await this.getFeedback(true, msg);
        // Feedback'den sonra quiz'e geç
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          ...feedback,
          nextMessage: await this.getQuiz()
        };
      } else {
        // Yanlış cevap, açıkla ve tekrar sor
        return await this.getFeedback(false, msg);
      }
    }

    // QUIZ SORULARI
    if (this.currentPhase === this.lessonPhases.QUIZ && currentPhaseData.isQuiz) {
      const isCorrect = msg === currentPhaseData.correctAnswer.toLowerCase();
      
      if (isCorrect) {
        this.currentPhase = this.lessonPhases.NEXT;
        return await this.getLessonComplete();
      } else {
        return await this.getFeedback(false, msg);
      }
    }

    // Varsayılan: Bilinmeyen yanıt
    return await this.getHelpfulResponse(msg);
  }

  /**
   * Tekrar açıklama (anlamadıysa)
   */
  async getReExplanation() {
    const message = `Tamam, sorun değil! Farklı bir şekilde anlatayım...

Şöyle düşün: [Daha basit açıklama buraya gelecek]

Bu daha anlaşılır oldu mu? "Anladım" yaz!`;

    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      reteaching: true,
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * Daha fazla örnek
   */
  async getMoreExamples() {
    const message = `Tabii! İşte başka örnekler:

📝 ÖRNEK 3: Gerçek hayattan...

📝 ÖRNEK 4: Daha zorlayıcı...

Anladın mı? "Anladım" yaz!`;

    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * Ders tamamlama
   */
  async getLessonComplete() {
    const message = `Tebrikler ${this.studentName}! 

"${this.currentTopic}" konusunu başarıyla tamamladın!

Çok iyi çalıştın, gurur duyuyorum!

Sonraki derse hazır mısın?`;

    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      lessonComplete: true,
      score: 100,
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * Yardımcı yanıt (beklenmeyen mesaj için)
   */
  async getHelpfulResponse(userMessage) {
    const message = `Anlıyorum! 

Şu an ${this.getCurrentPhaseName()} aşamasındayız.

Bana "Anladım", "Anlamadım", "Devam et" veya cevabını yazabilirsin!`;

    if (this.voiceEnabled && this.autoRead) {
      await ttsService.speak(message);
    }

    return {
      phase: this.currentPhase,
      message: message,
      requiresResponse: true,
      voiceEnabled: this.voiceEnabled
    };
  }

  /**
   * Mevcut faz adını getir
   */
  getCurrentPhaseName() {
    const names = {
      'greeting': 'selamlama',
      'introduction': 'tanıtım',
      'explanation': 'konu anlatımı',
      'examples': 'örnekler',
      'check': 'anlama kontrolü',
      'quiz': 'quiz',
      'feedback': 'geri bildirim',
      'next': 'tamamlama'
    };
    return names[this.currentPhase] || 'ders';
  }

  /**
   * Sesi aç/kapat
   */
  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    
    if (!this.voiceEnabled) {
      ttsService.stop();
    }

    console.log(`🔊 Ses: ${this.voiceEnabled ? 'Açık' : 'Kapalı'}`);
    return this.voiceEnabled;
  }

  /**
   * Konuşmayı durdur
   */
  stopSpeaking() {
    ttsService.stop();
  }

  /**
   * İlerleme yüzdesi
   */
  getProgress() {
    const phaseOrder = Object.values(this.lessonPhases);
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    return Math.round((currentIndex / phaseOrder.length) * 100);
  }
}

// Singleton
const stableTeacher = new StableTeacher();
export default stableTeacher;

