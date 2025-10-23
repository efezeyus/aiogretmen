/**
 * Seviye Belirleme Testi (Placement Test)
 * 
 * Özellikler:
 * - Öğrenci ilk girişte seviye testi yapar
 * - MEB müfredatına göre sınıf seviyesi belirlenir
 * - Admin onayı bekler
 * - Uygun yerden başlar
 */

import api from './api';

class PlacementTestService {
  constructor() {
    this.testQuestions = null;
    this.currentQuestion = 0;
    this.answers = [];
    this.testResult = null;
  }

  /**
   * Seviye belirleme testini başlat
   */
  async startPlacementTest(studentInfo) {
    try {
      console.log('📝 Seviye belirleme testi başlatılıyor...');
      
      // Backend'den test sorularını al
      const response = await api.post('/placement-test/start', {
        student_id: studentInfo.id,
        grade: studentInfo.grade || 5,
        subject: 'matematik'
      });

      this.testQuestions = response.questions || this.generateDefaultTest(studentInfo.grade);
      this.currentQuestion = 0;
      this.answers = [];
      
      console.log('✅ Test hazır:', this.testQuestions.length, 'soru');
      
      return {
        success: true,
        totalQuestions: this.testQuestions.length,
        estimatedTime: this.testQuestions.length * 2, // Her soru ~2 dakika
        firstQuestion: this.testQuestions[0]
      };
      
    } catch (error) {
      console.error('❌ Placement test başlatma hatası:', error);
      
      // Fallback: Varsayılan test
      this.testQuestions = this.generateDefaultTest(studentInfo.grade);
      this.currentQuestion = 0;
      this.answers = [];
      
      return {
        success: true,
        totalQuestions: this.testQuestions.length,
        estimatedTime: this.testQuestions.length * 2,
        firstQuestion: this.testQuestions[0],
        fallback: true
      };
    }
  }

  /**
   * Varsayılan test oluştur (Offline mode)
   */
  generateDefaultTest(targetGrade = 5) {
    const questions = [];
    
    // 3 farklı seviyeden sorular (hedef sınıfın altı, hedef, üstü)
    const grades = [
      Math.max(1, targetGrade - 1),  // Alt seviye
      targetGrade,                     // Hedef seviye
      Math.min(12, targetGrade + 1)    // Üst seviye
    ];

    grades.forEach(grade => {
      // Her seviyeden 5 soru (toplam 15 soru)
      for (let i = 0; i < 5; i++) {
        questions.push(this.generateQuestionForGrade(grade, i + 1));
      }
    });

    // Soruları karıştır
    return this.shuffleArray(questions);
  }

  /**
   * Belirli sınıf seviyesi için soru oluştur
   */
  generateQuestionForGrade(grade, questionNumber) {
    const questionBank = {
      4: [
        {
          id: `g4_q${questionNumber}`,
          grade: 4,
          question: 'Bir sınıfta 24 öğrenci var. Her sıraya 2 öğrenci oturuyorsa kaç sıra vardır?',
          options: ['10 sıra', '12 sıra', '14 sıra', '16 sıra'],
          correctAnswer: 1,
          topic: 'Bölme',
          difficulty: 'kolay',
          points: 10
        },
        {
          id: `g4_q${questionNumber}`,
          grade: 4,
          question: '456 sayısının onlar basamağındaki rakam kaçtır?',
          options: ['4', '5', '6', '0'],
          correctAnswer: 1,
          topic: 'Basamak Değeri',
          difficulty: 'kolay',
          points: 10
        }
      ],
      5: [
        {
          id: `g5_q${questionNumber}`,
          grade: 5,
          question: '3/4 + 1/4 işleminin sonucu nedir?',
          options: ['4/8', '1', '2/4', '4/4'],
          correctAnswer: 1,
          topic: 'Kesirler',
          difficulty: 'orta',
          points: 15
        },
        {
          id: `g5_q${questionNumber}`,
          grade: 5,
          question: 'Bir dikdörtgenin alanı 48 cm², kısa kenarı 6 cm ise uzun kenarı kaç cm\'dir?',
          options: ['6 cm', '8 cm', '10 cm', '12 cm'],
          correctAnswer: 1,
          topic: 'Alan',
          difficulty: 'orta',
          points: 15
        }
      ],
      6: [
        {
          id: `g6_q${questionNumber}`,
          grade: 6,
          question: '(-5) + (+8) işleminin sonucu kaçtır?',
          options: ['-13', '-3', '+3', '+13'],
          correctAnswer: 2,
          topic: 'Tam Sayılar',
          difficulty: 'orta',
          points: 15
        },
        {
          id: `g6_q${questionNumber}`,
          grade: 6,
          question: '2/3 kesrinin ondalık gösterimi nedir?',
          options: ['0.66', '0.67', '0.666...', '0.6'],
          correctAnswer: 2,
          topic: 'Ondalık Sayılar',
          difficulty: 'orta',
          points: 15
        }
      ],
      7: [
        {
          id: `g7_q${questionNumber}`,
          grade: 7,
          question: '3x + 5 = 20 denkleminde x kaçtır?',
          options: ['3', '5', '15', '25'],
          correctAnswer: 1,
          topic: 'Denklemler',
          difficulty: 'ileri',
          points: 20
        }
      ]
    };

    // Soru bankasından rastgele seç
    const gradeQuestions = questionBank[grade] || questionBank[5];
    return gradeQuestions[questionNumber % gradeQuestions.length];
  }

  /**
   * Cevap kaydet
   */
  submitAnswer(questionId, answer) {
    const question = this.testQuestions[this.currentQuestion];
    
    this.answers.push({
      questionId: question.id,
      answer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect: answer === question.correctAnswer,
      grade: question.grade,
      topic: question.topic,
      points: answer === question.correctAnswer ? question.points : 0,
      timeSpent: Date.now() // Basit zaman takibi
    });

    this.currentQuestion++;
    
    return {
      isCorrect: answer === question.correctAnswer,
      correctAnswer: question.correctAnswer,
      hasNext: this.currentQuestion < this.testQuestions.length
    };
  }

  /**
   * Sonraki soruyu getir
   */
  getNextQuestion() {
    if (this.currentQuestion >= this.testQuestions.length) {
      return null;
    }
    
    return {
      question: this.testQuestions[this.currentQuestion],
      questionNumber: this.currentQuestion + 1,
      totalQuestions: this.testQuestions.length,
      progress: (this.currentQuestion / this.testQuestions.length) * 100
    };
  }

  /**
   * Testi tamamla ve sonucu hesapla
   */
  async completeTest(studentId) {
    try {
      // Sonuçları analiz et
      const analysis = this.analyzeResults();
      
      // Backend'e gönder (admin onayı için)
      const response = await api.post('/placement-test/complete', {
        student_id: studentId,
        answers: this.answers,
        analysis: analysis,
        status: 'pending_approval' // Admin onayı bekliyor
      });

      this.testResult = {
        ...analysis,
        status: 'pending_approval',
        submittedAt: new Date().toISOString()
      };

      console.log('✅ Test tamamlandı, admin onayı bekleniyor');
      
      return {
        success: true,
        result: this.testResult,
        message: 'Test başarıyla tamamlandı! Sonuçlarınız öğretmeniniz tarafından değerlendirilecek.'
      };
      
    } catch (error) {
      console.error('❌ Test tamamlama hatası:', error);
      
      // Fallback: Sonuçları local kaydet
      const analysis = this.analyzeResults();
      
      // LocalStorage'a kaydet
      localStorage.setItem(`placementTest_${studentId}`, JSON.stringify({
        answers: this.answers,
        analysis: analysis,
        status: 'pending_approval',
        submittedAt: new Date().toISOString()
      }));

      return {
        success: true,
        result: analysis,
        message: 'Test tamamlandı! Sonuçlar kaydedildi.',
        offline: true
      };
    }
  }

  /**
   * Sonuçları analiz et
   */
  analyzeResults() {
    const totalQuestions = this.answers.length;
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    const totalPoints = this.answers.reduce((sum, a) => sum + a.points, 0);
    const maxPoints = this.answers.reduce((sum, a) => sum + (a.isCorrect ? a.points : this.testQuestions.find(q => q.id === a.questionId)?.points || 0), 0);
    
    // Sınıf bazında başarı oranları
    const gradePerformance = {};
    this.answers.forEach(answer => {
      if (!gradePerformance[answer.grade]) {
        gradePerformance[answer.grade] = { correct: 0, total: 0 };
      }
      gradePerformance[answer.grade].total++;
      if (answer.isCorrect) {
        gradePerformance[answer.grade].correct++;
      }
    });

    // Konu bazında başarı
    const topicPerformance = {};
    this.answers.forEach(answer => {
      if (!topicPerformance[answer.topic]) {
        topicPerformance[answer.topic] = { correct: 0, total: 0 };
      }
      topicPerformance[answer.topic].total++;
      if (answer.isCorrect) {
        topicPerformance[answer.topic].correct++;
      }
    });

    // Önerilen seviye belirle
    const suggestedGrade = this.calculateSuggestedGrade(gradePerformance);
    const startingUnit = this.calculateStartingUnit(suggestedGrade, topicPerformance);

    return {
      totalQuestions,
      correctAnswers,
      score: Math.round((correctAnswers / totalQuestions) * 100),
      pointsEarned: totalPoints,
      maxPoints,
      gradePerformance,
      topicPerformance,
      suggestedGrade,
      startingUnit,
      strengths: this.identifyStrengths(topicPerformance),
      weaknesses: this.identifyWeaknesses(topicPerformance),
      recommendation: this.generateRecommendation(suggestedGrade, topicPerformance)
    };
  }

  /**
   * Önerilen sınıf seviyesini hesapla
   */
  calculateSuggestedGrade(gradePerformance) {
    let bestGrade = 5;
    let bestScore = 0;

    Object.entries(gradePerformance).forEach(([grade, performance]) => {
      const score = performance.total > 0 ? (performance.correct / performance.total) : 0;
      
      // En az %70 başarı gösterilen en yüksek sınıf
      if (score >= 0.7 && parseInt(grade) > bestGrade) {
        bestGrade = parseInt(grade);
        bestScore = score;
      } else if (score > bestScore) {
        bestGrade = parseInt(grade);
        bestScore = score;
      }
    });

    return bestGrade;
  }

  /**
   * Başlangıç ünitesini belirle
   */
  calculateStartingUnit(grade, topicPerformance) {
    // Zayıf olunan konuları bul
    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, perf]) => {
        const rate = perf.total > 0 ? (perf.correct / perf.total) : 0;
        return rate < 0.6; // %60'ın altı zayıf
      })
      .map(([topic, _]) => topic);

    if (weakTopics.length === 0) {
      return { unit: 1, reason: 'Tüm konularda başarılı, ilk üniteden başlayabilir.' };
    }

    // İlk zayıf konuyu bul
    return {
      unit: 1,
      topics: weakTopics,
      reason: `${weakTopics.join(', ')} konularında pekiştirme gerekiyor.`
    };
  }

  /**
   * Güçlü yönleri belirle
   */
  identifyStrengths(topicPerformance) {
    return Object.entries(topicPerformance)
      .filter(([_, perf]) => {
        const rate = perf.total > 0 ? (perf.correct / perf.total) : 0;
        return rate >= 0.8; // %80+ güçlü
      })
      .map(([topic, perf]) => ({
        topic,
        successRate: Math.round((perf.correct / perf.total) * 100)
      }));
  }

  /**
   * Zayıf yönleri belirle
   */
  identifyWeaknesses(topicPerformance) {
    return Object.entries(topicPerformance)
      .filter(([_, perf]) => {
        const rate = perf.total > 0 ? (perf.correct / perf.total) : 0;
        return rate < 0.6; // %60'ın altı zayıf
      })
      .map(([topic, perf]) => ({
        topic,
        successRate: Math.round((perf.correct / perf.total) * 100)
      }));
  }

  /**
   * Öneri oluştur
   */
  generateRecommendation(suggestedGrade, topicPerformance) {
    const weaknesses = this.identifyWeaknesses(topicPerformance);
    
    if (weaknesses.length === 0) {
      return {
        message: `Harika! ${suggestedGrade}. sınıf seviyesi senin için uygun. Tüm konularda başarılısın!`,
        plan: `${suggestedGrade}. sınıf müfredatından başlayabilirsin.`,
        nextSteps: ['İlk üniteden başla', 'Düzenli çalış', 'Quiz\'leri tamamla']
      };
    }

    return {
      message: `${suggestedGrade}. sınıf seviyesi senin için uygun görünüyor.`,
      plan: `Bazı konularda pekiştirme yaparak başlayacağız: ${weaknesses.map(w => w.topic).join(', ')}`,
      nextSteps: [
        'Zayıf konuları tekrar et',
        'Pratik sorular çöz',
        'İlerledikçe zorluk artacak'
      ]
    };
  }

  /**
   * Yardımcı: Array karıştırma
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Test durumunu getir
   */
  getTestStatus(studentId) {
    // LocalStorage'dan kontrol et
    const saved = localStorage.getItem(`placementTest_${studentId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  }
}

// Singleton
const placementTestService = new PlacementTestService();
export default placementTestService;

