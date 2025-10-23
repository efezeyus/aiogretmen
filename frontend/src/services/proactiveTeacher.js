/**
 * Proaktif AI Öğretmen - Gerçek Öğretmen Simülasyonu
 * 
 * Özellikler:
 * - Kendi başına ders anlatır
 * - Anlama kontrolü yapar
 * - Adım adım ilerler
 * - Öğrenci seviyesine göre uyarlanır
 * - Gerçek öğretmen gibi davranır
 */

class ProactiveTeacher {
  constructor() {
    // Ders akışı durumları (Lesson Flow States)
    this.lessonStates = {
      INTRODUCTION: 'introduction',        // Tanışma ve konu tanıtımı
      EXPLANATION: 'explanation',          // Konunun açıklanması
      EXAMPLES: 'examples',                // Örnekler gösterme
      GUIDED_PRACTICE: 'guided_practice',  // Rehberli pratik
      COMPREHENSION_CHECK: 'check',        // Anlama kontrolü
      INDEPENDENT_PRACTICE: 'practice',    // Bağımsız pratik
      ASSESSMENT: 'assessment',            // Değerlendirme
      REVIEW: 'review',                    // Tekrar
      NEXT_TOPIC: 'next'                   // Sonraki konuya geçiş
    };

    // Mevcut ders durumu
    this.currentState = this.lessonStates.INTRODUCTION;
    this.currentStep = 0;
    this.totalSteps = 7;
    
    // Öğrenci profili
    this.studentProfile = {
      comprehensionLevel: 50,
      correctAnswers: 0,
      incorrectAnswers: 0,
      needsMorePractice: false,
      strugglingTopics: [],
      masteredTopics: []
    };

    // Ders planı
    this.lessonPlan = null;
  }

  /**
   * Dersi başlat - Proaktif öğretim
   */
  async startLesson(lessonData, studentInfo) {
    console.log('🎓 Proaktif öğretim başlıyor...');
    
    this.lessonPlan = this.createLessonPlan(lessonData);
    this.currentState = this.lessonStates.INTRODUCTION;
    this.currentStep = 0;

    // İlk mesajı oluştur
    return this.generateNextInstruction(lessonData, studentInfo);
  }

  /**
   * Ders planı oluştur
   */
  createLessonPlan(lessonData) {
    const topic = lessonData.topic || lessonData.title;
    const grade = lessonData.grade || 5;
    const subject = lessonData.subject || 'matematik';

    return {
      topic: topic,
      grade: grade,
      subject: subject,
      steps: [
        {
          state: this.lessonStates.INTRODUCTION,
          duration: 2,
          goal: 'Öğrenciyle tanış ve konuyu tanıt'
        },
        {
          state: this.lessonStates.EXPLANATION,
          duration: 5,
          goal: 'Konuyu basit ve anlaşılır şekilde açıkla'
        },
        {
          state: this.lessonStates.EXAMPLES,
          duration: 3,
          goal: 'Somut örnekler göster'
        },
        {
          state: this.lessonStates.GUIDED_PRACTICE,
          duration: 5,
          goal: 'Beraber örnek çöz'
        },
        {
          state: this.lessonStates.COMPREHENSION_CHECK,
          duration: 3,
          goal: 'Anlama kontrolü yap'
        },
        {
          state: this.lessonStates.INDEPENDENT_PRACTICE,
          duration: 5,
          goal: 'Öğrenciye kendi başına pratik yaptır'
        },
        {
          state: this.lessonStates.ASSESSMENT,
          duration: 3,
          goal: 'Öğrenmeyi değerlendir'
        }
      ],
      checkpoints: [
        { step: 2, question: 'Buraya kadar anladın mı?' },
        { step: 4, question: 'Şimdi sen dener misin?' },
        { step: 6, question: 'Hazır mısın, test edelim?' }
      ]
    };
  }

  /**
   * Sonraki talimatı oluştur - AI proaktif olarak yönlendirir
   */
  async generateNextInstruction(lessonData, studentInfo) {
    const currentPlanStep = this.lessonPlan.steps[this.currentStep];
    
    console.log(`📍 Ders Adımı: ${this.currentStep + 1}/${this.totalSteps} - ${currentPlanStep.state}`);

    // Durum makinesine göre mesaj oluştur
    switch (currentPlanStep.state) {
      case this.lessonStates.INTRODUCTION:
        return this.generateIntroduction(studentInfo, lessonData);
      
      case this.lessonStates.EXPLANATION:
        return this.generateExplanation(lessonData);
      
      case this.lessonStates.EXAMPLES:
        return this.generateExamples(lessonData);
      
      case this.lessonStates.GUIDED_PRACTICE:
        return this.generateGuidedPractice(lessonData);
      
      case this.lessonStates.COMPREHENSION_CHECK:
        return this.generateComprehensionCheck(lessonData);
      
      case this.lessonStates.INDEPENDENT_PRACTICE:
        return this.generateIndependentPractice(lessonData);
      
      case this.lessonStates.ASSESSMENT:
        return this.generateAssessment(lessonData);
      
      default:
        return this.generateGenericResponse(lessonData);
    }
  }

  /**
   * 1. TANITIM - Öğrenciyle tanış
   */
  generateIntroduction(studentInfo, lessonData) {
    const name = studentInfo.name || 'Öğrenci';
    const topic = lessonData.topic || lessonData.title;

    return {
      message: `Merhaba ${name}! 👋 Ben senin ${lessonData.grade || 5}. sınıf matematik öğretmeninim! 🎓

Bugün birlikte **"${topic}"** konusunu öğreneceğiz. Çok heyecanlıyım! 🌟

📚 **Bugünkü Planımız:**
1️⃣ Önce konuyu basitçe açıklayacağım
2️⃣ Somut örnekler göstereceğim
3️⃣ Beraber pratik yapacağız
4️⃣ Sen kendi başına deneyeceksin
5️⃣ Öğrendiklerini test edeceğiz

Her adımda anladığından emin olacağım, endişelenme! 😊

**Hazır mısın?** 
Hazır olduğunda "Evet, başlayalım!" yaz, hemen başlayalım! 🚀`,
      type: 'proactive_intro',
      state: this.lessonStates.INTRODUCTION,
      awaitingResponse: true,
      expectedResponses: ['evet', 'hazırım', 'başlayalım', 'tamam'],
      nextAction: 'advance'
    };
  }

  /**
   * 2. AÇIKLAMA - Konuyu anlat
   */
  generateExplanation(lessonData) {
    const topic = lessonData.topic || lessonData.title;

    return {
      message: `Harika! 🎯 O zaman başlayalım!

📖 **${topic} Nedir?**

${this.getTopicExplanation(topic, lessonData.grade)}

💡 **Basit Tanım:**
${this.getSimpleDefinition(topic)}

🌍 **Günlük Hayatta Nerede Kullanılır?**
${this.getRealLifeExamples(topic)}

**Buraya kadar anladın mı?** 🤔
- Anladıysan: "Anladım!" yaz
- Anlamadıysan: "Anlamadım" yaz, tekrar farklı şekilde anlatayım!`,
      type: 'proactive_explanation',
      state: this.lessonStates.EXPLANATION,
      awaitingResponse: true,
      expectedResponses: {
        understood: ['anladım', 'evet', 'tamam', 'açık'],
        confused: ['anlamadım', 'hayır', 'karışık', 'zor']
      },
      nextAction: 'check_comprehension'
    };
  }

  /**
   * 3. ÖRNEKLER - Somut örnekler göster
   */
  generateExamples(lessonData) {
    const topic = lessonData.topic || lessonData.title;

    return {
      message: `Mükemmel! 🌟 Şimdi örneklerle pekiştirelim!

📝 **Örnek 1: Basit Bir Başlangıç**
${this.getExample(topic, 'easy')}

✅ **Çözüm:**
${this.getSolution(topic, 'easy')}

📝 **Örnek 2: Biraz Daha Zorlayıcı**
${this.getExample(topic, 'medium')}

**Sence bu sorunun cevabı ne?** 
Tahmin et, yanlış olsa bile önemli değil! 💪`,
      type: 'proactive_examples',
      state: this.lessonStates.EXAMPLES,
      awaitingResponse: true,
      checkAnswer: true,
      nextAction: 'validate_answer'
    };
  }

  /**
   * 4. REHBERLİ PRATİK - Beraber çöz
   */
  generateGuidedPractice(lessonData) {
    return {
      message: `Harika çalışıyorsun! 👏 Şimdi beraber bir soru çözelim.

🎯 **Beraber Çözelim:**
${this.getGuidedPracticeQuestion(lessonData.topic)}

**1. Adım Nedir?**
Ben ipucu vereceğim, sen düşüneceksin!

💡 **İpucu:** ${this.getHint(lessonData.topic, 1)}

Ne düşünüyorsun? İlk adımı söyler misin? 🤔`,
      type: 'proactive_guided',
      state: this.lessonStates.GUIDED_PRACTICE,
      awaitingResponse: true,
      providesHints: true,
      nextAction: 'guide_step_by_step'
    };
  }

  /**
   * 5. ANLAMA KONTROLÜ - Quiz
   */
  generateComprehensionCheck(lessonData) {
    return {
      message: `Çok iyi ilerliyorsun! 🎉 Şimdi anlayıp anlamadığını kontrol edelim.

❓ **Mini Quiz:**

**Soru 1:** ${this.getQuizQuestion(lessonData.topic, 1)}

A) ${this.getQuizOption(lessonData.topic, 'A')}
B) ${this.getQuizOption(lessonData.topic, 'B')}
C) ${this.getQuizOption(lessonData.topic, 'C')}

**Cevabını yaz!** (A, B veya C) 📝

Eğer yanlış yaparsan endişelenme, beraber tekrar bakarız! 😊`,
      type: 'proactive_check',
      state: this.lessonStates.COMPREHENSION_CHECK,
      awaitingResponse: true,
      isQuiz: true,
      correctAnswer: 'B', // Bu dinamik olmalı
      nextAction: 'evaluate_and_proceed'
    };
  }

  /**
   * 6. BAĞIMSIZ PRATİK - Kendi başına dene
   */
  generateIndependentPractice(lessonData) {
    return {
      message: `Süpersin! 🌟 Artık hazırsın, kendi başına dene!

📋 **Senin Sorun:**
${this.getPracticeQuestion(lessonData.topic)}

Bu sefer ipucu yok! Ama takılırsan "yardım" yazabilirsin. 💪

**Çözümünü adım adım yaz!** Ben izliyorum ve yardımcı olacağım. 🎓`,
      type: 'proactive_practice',
      state: this.lessonStates.INDEPENDENT_PRACTICE,
      awaitingResponse: true,
      allowsHelp: true,
      nextAction: 'assess_independence'
    };
  }

  /**
   * 7. DEĞERLENDİRME - Final test
   */
  generateAssessment(lessonData) {
    return {
      message: `Tebrikler! 🎊 Son adımdayız!

🏆 **Final Değerlendirme:**

Bu soruları çözersen konuyu tamamen öğrenmişsin demektir! 💯

**Soru 1:** ${this.getAssessmentQuestion(lessonData.topic, 1)}

**Soru 2:** ${this.getAssessmentQuestion(lessonData.topic, 2)}

**Her iki soruyu da çöz!** Sonunda başarı rozetini kazanacaksın! 🏅

Hazır mısın? "Başlayalım!" yaz! 🚀`,
      type: 'proactive_assessment',
      state: this.lessonStates.ASSESSMENT,
      awaitingResponse: true,
      isFinalTest: true,
      nextAction: 'complete_lesson'
    };
  }

  /**
   * Öğrenci yanıtını işle ve sonraki adıma geç
   */
  async processStudentResponse(response, currentMessage) {
    const responseLower = response.toLowerCase().trim();

    console.log('🎯 Öğrenci yanıtı:', response);
    console.log('📍 Mevcut durum:', this.currentState);

    // Anlama kontrolü
    if (currentMessage.awaitingResponse) {
      
      // Comprehension check - doğru mu yanlış mı?
      if (currentMessage.isQuiz) {
        const isCorrect = this.checkAnswer(responseLower, currentMessage.correctAnswer);
        
        if (isCorrect) {
          this.studentProfile.correctAnswers++;
          this.studentProfile.comprehensionLevel += 10;
          
          return {
            feedback: `🎉 Doğru! Harika! Çok iyi anlamışsın! ${this.getEncouragement()}`,
            advance: true
          };
        } else {
          this.studentProfile.incorrectAnswers++;
          this.studentProfile.comprehensionLevel -= 5;
          this.studentProfile.needsMorePractice = true;
          
          return {
            feedback: `🤔 Bu sefer olmadı ama sorun değil! Öğreniyoruz! ${this.getCorrectAnswerExplanation(currentMessage)}`,
            advance: false,
            retry: true
          };
        }
      }

      // Genel anlama kontrolü
      if (currentMessage.expectedResponses) {
        if (Array.isArray(currentMessage.expectedResponses)) {
          const understood = currentMessage.expectedResponses.some(exp => 
            responseLower.includes(exp)
          );
          
          if (understood) {
            return { advance: true };
          }
        } else {
          // Object - understood vs confused
          if (currentMessage.expectedResponses.understood.some(exp => responseLower.includes(exp))) {
            return { advance: true };
          } else if (currentMessage.expectedResponses.confused.some(exp => responseLower.includes(exp))) {
            return {
              feedback: 'Tamam, sorun değil! Farklı bir şekilde anlatayım... 🔄',
              reteach: true,
              advance: false
            };
          }
        }
      }
    }

    // Default: advance
    return { advance: true };
  }

  /**
   * Sonraki adıma geç
   */
  advance() {
    this.currentStep++;
    
    if (this.currentStep >= this.lessonPlan.steps.length) {
      return this.completeLesson();
    }

    this.currentState = this.lessonPlan.steps[this.currentStep].state;
    console.log(`➡️  İlerleme: ${this.currentStep}/${this.lessonPlan.steps.length}`);
  }

  /**
   * Dersi tamamla
   */
  completeLesson() {
    const score = this.calculateFinalScore();
    
    return {
      message: `🎊 **TEBRİKLER!** Dersi tamamladın! 🎊

📊 **Performansın:**
- ✅ Doğru cevaplar: ${this.studentProfile.correctAnswers}
- ❌ Yanlış cevaplar: ${this.studentProfile.incorrectAnswers}
- 📈 Anlama seviyesi: ${this.studentProfile.comprehensionLevel}%
- 🏆 Final skorun: ${score}/100

${this.getFinalFeedback(score)}

🎯 **Sonraki adım:** ${this.getNextRecommendation(score)}

Harika çalıştın! Gurur duyuyorum! 🌟`,
      type: 'lesson_complete',
      score: score,
      completed: true
    };
  }

  /**
   * Yardımcı metodlar
   */
  getTopicExplanation(topic, grade) {
    // Dinamik olarak backend'den alınabilir
    return `${topic} konusu ${grade}. sınıf müfredatının önemli bir parçasıdır...`;
  }

  getSimpleDefinition(topic) {
    return `Kısacası, ${topic}...`;
  }

  getRealLifeExamples(topic) {
    return `Günlük hayatta ${topic} şöyle kullanılır...`;
  }

  getExample(topic, difficulty) {
    return `Örnek soru (${difficulty})...`;
  }

  getSolution(topic, difficulty) {
    return `Çözüm adımları...`;
  }

  getGuidedPracticeQuestion(topic) {
    return `Rehberli pratik sorusu...`;
  }

  getHint(topic, step) {
    return `İpucu ${step}...`;
  }

  getQuizQuestion(topic, number) {
    return `Quiz sorusu ${number}...`;
  }

  getQuizOption(topic, option) {
    return `Seçenek ${option}...`;
  }

  getPracticeQuestion(topic) {
    return `Pratik sorusu...`;
  }

  getAssessmentQuestion(topic, number) {
    return `Değerlendirme sorusu ${number}...`;
  }

  checkAnswer(response, correctAnswer) {
    return response === correctAnswer.toLowerCase();
  }

  getEncouragement() {
    const encouragements = [
      'Devam et böyle!',
      'Çok akıllısın!',
      'Muhteşem!',
      'Süpersin!',
      'Harikasın!'
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  getCorrectAnswerExplanation(message) {
    return `Doğru cevap: ${message.correctAnswer}. Çünkü...`;
  }

  calculateFinalScore() {
    const total = this.studentProfile.correctAnswers + this.studentProfile.incorrectAnswers;
    if (total === 0) return 0;
    return Math.round((this.studentProfile.correctAnswers / total) * 100);
  }

  getFinalFeedback(score) {
    if (score >= 90) return '🌟 Mükemmel! Konuyu tamamen öğrenmişsin!';
    if (score >= 70) return '👍 Çok iyi! Başarılısın!';
    if (score >= 50) return '💪 Fena değil! Biraz daha pratik yapmalısın.';
    return '📚 Daha çok çalışmalıyız. Ama pes etme!';
  }

  getNextRecommendation(score) {
    if (score >= 80) return 'Sonraki konuya geçebilirsin!';
    return 'Bu konuyu tekrar etmeliyiz.';
  }
}

// Singleton instance
const proactiveTeacher = new ProactiveTeacher();
export default proactiveTeacher;

