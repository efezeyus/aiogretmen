// Kendi Kendine Öğrenen AI Sistemi
import api from './api';

class SelfLearningAI {
  constructor() {
    this.learningDatabase = {
      studentInteractions: [],
      successfulStrategies: [],
      failedStrategies: [],
      studentProfiles: new Map(),
      lessonEffectiveness: new Map(),
      commonMisconceptions: [],
      adaptiveResponses: new Map(),
      emotionalPatterns: new Map()
    };

    // Öğrenme parametreleri
    this.learningParameters = {
      minInteractionsForPattern: 5,
      confidenceThreshold: 0.75,
      adaptationRate: 0.1,
      feedbackWeight: 0.3,
      emotionalWeight: 0.2,
      performanceWeight: 0.5
    };

    // Model güncelleme sıklığı
    this.updateFrequency = {
      immediate: ['emotion', 'confusion', 'frustration'],
      session: ['performance', 'engagement', 'comprehension'],
      daily: ['patterns', 'strategies', 'misconceptions'],
      weekly: ['curriculum', 'difficulty', 'teaching_methods']
    };

    // Başarı metrikleri
    this.successMetrics = {
      studentEngagement: 0,
      comprehensionRate: 0,
      retentionRate: 0,
      satisfactionScore: 0,
      progressionSpeed: 0
    };

    // Otomatik kaydetme
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, 30000); // Her 30 saniyede bir kaydet

    // Önceki verileri yükle
    this.loadFromLocalStorage();
  }

  // Öğrenci etkileşimini kaydet ve analiz et
  async recordInteraction(interaction) {
    const enrichedInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
      analysisResults: await this.analyzeInteraction(interaction)
    };

    this.learningDatabase.studentInteractions.push(enrichedInteraction);

    // Gerçek zamanlı öğrenme
    await this.learnFromInteraction(enrichedInteraction);

    // Pattern tanıma
    this.detectPatterns();

    return enrichedInteraction.analysisResults;
  }

  // Etkileşimi analiz et
  async analyzeInteraction(interaction) {
    const analysis = {
      emotionalState: this.analyzeEmotion(interaction),
      comprehensionLevel: this.analyzeComprehension(interaction),
      engagementScore: this.calculateEngagement(interaction),
      difficultyMatch: this.assessDifficultyMatch(interaction),
      teachingEffectiveness: this.evaluateTeachingMethod(interaction),
      recommendations: []
    };

    // AI önerileri oluştur
    analysis.recommendations = await this.generateRecommendations(analysis);

    return analysis;
  }

  // Duygu analizi
  analyzeEmotion(interaction) {
    const emotionKeywords = {
      happy: {
        words: ['harika', 'süper', 'teşekkür', 'anladım', 'kolay'],
        emojis: ['😊', '😃', '🎉', '✨', '👍'],
        weight: 1.0
      },
      confused: {
        words: ['anlamadım', 'karışık', 'nasıl', 'neden', 'zor'],
        emojis: ['😕', '🤔', '😵', '❓', '❔'],
        weight: -0.5
      },
      frustrated: {
        words: ['yapamıyorum', 'olmadı', 'bıktım', 'sıkıldım', 'zor'],
        emojis: ['😤', '😠', '😞', '😫', '😩'],
        weight: -1.0
      },
      excited: {
        words: ['heyecanlıyım', 'merak', 'öğrenmek istiyorum', 'daha fazla'],
        emojis: ['🤩', '🎯', '🚀', '⭐', '💪'],
        weight: 1.5
      }
    };

    let emotionScores = {};
    const text = interaction.message.toLowerCase();

    // Kelime ve emoji analizi
    for (const [emotion, data] of Object.entries(emotionKeywords)) {
      let score = 0;
      
      // Kelime eşleşmeleri
      data.words.forEach(word => {
        if (text.includes(word)) score += data.weight;
      });

      // Emoji eşleşmeleri
      data.emojis.forEach(emoji => {
        if (interaction.message.includes(emoji)) score += data.weight * 1.5;
      });

      emotionScores[emotion] = score;
    }

    // En yüksek skoru bul
    const dominantEmotion = Object.entries(emotionScores)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Duygu geçmişini güncelle
    this.updateEmotionalPattern(interaction.studentId, dominantEmotion);

    return {
      current: dominantEmotion,
      scores: emotionScores,
      trend: this.getEmotionalTrend(interaction.studentId)
    };
  }

  // Anlama seviyesi analizi
  analyzeComprehension(interaction) {
    const indicators = {
      high: {
        patterns: ['anladım', 'kolay', 'başka örnek', 'devam', 'tamam'],
        responseTime: { min: 5, max: 30 }, // saniye
        questionDepth: ['nasıl', 'neden', 'başka']
      },
      medium: {
        patterns: ['sanırım', 'galiba', 'biraz', 'tekrar'],
        responseTime: { min: 30, max: 120 },
        questionDepth: ['ne', 'kim', 'nerede']
      },
      low: {
        patterns: ['anlamadım', 'karışık', 'zor', 'bilmiyorum'],
        responseTime: { min: 120, max: Infinity },
        questionDepth: ['?', 'yardım']
      }
    };

    let comprehensionScore = 50; // Başlangıç skoru

    // Yanıt süresi analizi
    if (interaction.responseTime) {
      if (interaction.responseTime < 10) comprehensionScore += 20;
      else if (interaction.responseTime < 30) comprehensionScore += 10;
      else if (interaction.responseTime > 120) comprehensionScore -= 20;
    }

    // Doğru/yanlış cevap analizi
    if (interaction.isCorrect !== undefined) {
      comprehensionScore += interaction.isCorrect ? 30 : -30;
    }

    // İpucu kullanımı
    if (interaction.hintsUsed) {
      comprehensionScore -= interaction.hintsUsed * 10;
    }

    // Pattern matching
    const text = interaction.message.toLowerCase();
    for (const [level, data] of Object.entries(indicators)) {
      data.patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          if (level === 'high') comprehensionScore += 10;
          else if (level === 'low') comprehensionScore -= 10;
        }
      });
    }

    // Skor normalizasyonu (0-100)
    comprehensionScore = Math.max(0, Math.min(100, comprehensionScore));

    return {
      score: comprehensionScore,
      level: comprehensionScore > 70 ? 'high' : comprehensionScore > 40 ? 'medium' : 'low',
      factors: this.identifyComprehensionFactors(interaction)
    };
  }

  // Katılım skoru hesaplama
  calculateEngagement(interaction) {
    const engagementFactors = {
      messageLength: interaction.message.length > 20 ? 10 : 5,
      hasQuestion: interaction.message.includes('?') ? 15 : 0,
      hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(interaction.message) ? 10 : 0,
      responseSpeed: interaction.responseTime < 30 ? 15 : 5,
      interactionCount: Math.min(interaction.sessionInteractionCount * 2, 20),
      voluntaryInteraction: interaction.isVoluntary ? 20 : 10
    };

    const totalScore = Object.values(engagementFactors).reduce((a, b) => a + b, 0);
    const normalizedScore = (totalScore / 90) * 100; // Max 90 puan

    return {
      score: Math.min(100, normalizedScore),
      factors: engagementFactors,
      trend: this.calculateEngagementTrend(interaction.studentId)
    };
  }

  // Zorluk eşleşmesi değerlendirmesi
  assessDifficultyMatch(interaction) {
    const studentProfile = this.learningDatabase.studentProfiles.get(interaction.studentId) || {};
    const currentLevel = studentProfile.currentLevel || 1;
    const questionDifficulty = interaction.questionDifficulty || currentLevel;

    const match = Math.abs(currentLevel - questionDifficulty);
    let assessment = {
      isOptimal: match <= 0.5,
      suggestion: null,
      adjustmentNeeded: 0
    };

    if (match > 1) {
      assessment.suggestion = questionDifficulty > currentLevel ? 
        'Soru çok zor, daha basit örneklerle başlayın' : 
        'Öğrenci hazır, zorluk artırılabilir';
      assessment.adjustmentNeeded = currentLevel - questionDifficulty;
    }

    // Başarı oranına göre güncelle
    if (interaction.isCorrect !== undefined) {
      const successRate = this.calculateRecentSuccessRate(interaction.studentId);
      if (successRate > 0.8 && assessment.adjustmentNeeded <= 0) {
        assessment.adjustmentNeeded = 0.5;
        assessment.suggestion = 'Yüksek başarı, zorluk artırılmalı';
      } else if (successRate < 0.4 && assessment.adjustmentNeeded >= 0) {
        assessment.adjustmentNeeded = -0.5;
        assessment.suggestion = 'Düşük başarı, zorluk azaltılmalı';
      }
    }

    return assessment;
  }

  // Öğretim metodunu değerlendir
  evaluateTeachingMethod(interaction) {
    const methods = ['visual', 'auditory', 'kinesthetic', 'reading'];
    const studentProfile = this.learningDatabase.studentProfiles.get(interaction.studentId) || {};
    const preferredMethod = studentProfile.learningStyle || 'visual';
    const usedMethod = interaction.teachingMethod || 'visual';

    const effectiveness = {
      methodMatch: preferredMethod === usedMethod ? 100 : 50,
      comprehension: interaction.comprehensionScore || 50,
      engagement: interaction.engagementScore || 50,
      retention: this.calculateRetention(interaction.studentId, interaction.topic)
    };

    const overallScore = Object.values(effectiveness).reduce((a, b) => a + b, 0) / 4;

    // Metod başarısını kaydet
    this.recordMethodSuccess(usedMethod, overallScore, interaction);

    return {
      score: overallScore,
      effectiveness: effectiveness,
      recommendation: this.recommendTeachingMethod(interaction.studentId, interaction.topic)
    };
  }

  // Etkileşimden öğren
  async learnFromInteraction(interaction) {
    const { analysisResults } = interaction;

    // Başarılı stratejileri kaydet
    if (analysisResults.comprehensionLevel.score > 70 && 
        analysisResults.engagementScore.score > 70) {
      this.recordSuccessfulStrategy({
        context: interaction.context,
        method: interaction.teachingMethod,
        emotionalState: analysisResults.emotionalState.current,
        response: interaction.aiResponse
      });
    }

    // Başarısız stratejileri kaydet
    if (analysisResults.comprehensionLevel.score < 30 || 
        analysisResults.emotionalState.current === 'frustrated') {
      this.recordFailedStrategy({
        context: interaction.context,
        method: interaction.teachingMethod,
        emotionalState: analysisResults.emotionalState.current,
        response: interaction.aiResponse
      });
    }

    // Öğrenci profilini güncelle
    await this.updateStudentProfile(interaction.studentId, analysisResults);

    // Yanıt modelini güncelle
    this.updateResponseModel(interaction, analysisResults);

    // Backend'e gönder (opsiyonel)
    if (this.shouldSyncWithBackend()) {
      await this.syncWithBackend(interaction);
    }
  }

  // Pattern tanıma
  detectPatterns() {
    const recentInteractions = this.getRecentInteractions(100);
    
    // Yaygın yanlış anlamalar
    this.detectMisconceptions(recentInteractions);
    
    // Duygusal pattern'ler
    this.detectEmotionalPatterns(recentInteractions);
    
    // Öğrenme eğilimleri
    this.detectLearningTrends(recentInteractions);
    
    // Zaman bazlı pattern'ler
    this.detectTimePatterns(recentInteractions);
  }

  // Yanlış anlamaları tespit et
  detectMisconceptions(interactions) {
    const topicErrors = new Map();

    interactions.forEach(interaction => {
      if (interaction.isCorrect === false && interaction.topic) {
        if (!topicErrors.has(interaction.topic)) {
          topicErrors.set(interaction.topic, []);
        }
        topicErrors.get(interaction.topic).push({
          error: interaction.message,
          context: interaction.context,
          correction: interaction.aiResponse
        });
      }
    });

    // En yaygın hataları bul
    topicErrors.forEach((errors, topic) => {
      if (errors.length >= this.learningParameters.minInteractionsForPattern) {
        const commonError = this.findCommonPattern(errors);
        if (commonError) {
          this.learningDatabase.commonMisconceptions.push({
            topic: topic,
            pattern: commonError,
            frequency: errors.length,
            suggestedApproach: this.generateApproachForMisconception(commonError)
          });
        }
      }
    });
  }

  // Öneriler oluştur
  async generateRecommendations(analysis) {
    const recommendations = [];

    // Duygusal duruma göre
    if (analysis.emotionalState.current === 'frustrated') {
      recommendations.push({
        type: 'emotional_support',
        action: 'provide_encouragement',
        message: 'Öğrenci zorlanıyor, motive edici yaklaşım kullan'
      });
    }

    // Anlama seviyesine göre
    if (analysis.comprehensionLevel.score < 40) {
      recommendations.push({
        type: 'teaching_method',
        action: 'simplify_explanation',
        message: 'Daha basit örneklerle açıkla'
      });
      recommendations.push({
        type: 'visual_aid',
        action: 'add_visualization',
        message: 'Görsel materyaller ekle'
      });
    }

    // Katılıma göre
    if (analysis.engagementScore.score < 50) {
      recommendations.push({
        type: 'gamification',
        action: 'add_game_element',
        message: 'Oyunlaştırma elementi ekle'
      });
    }

    // Zorluk eşleşmesine göre
    if (!analysis.difficultyMatch.isOptimal) {
      recommendations.push({
        type: 'difficulty_adjustment',
        action: 'adjust_difficulty',
        value: analysis.difficultyMatch.adjustmentNeeded,
        message: analysis.difficultyMatch.suggestion
      });
    }

    return recommendations;
  }

  // Öğrenci profilini güncelle
  async updateStudentProfile(studentId, analysisResults) {
    let profile = this.learningDatabase.studentProfiles.get(studentId) || {
      id: studentId,
      createdAt: new Date().toISOString(),
      interactions: 0,
      learningStyle: 'visual',
      currentLevel: 1,
      emotionalHistory: [],
      performanceHistory: [],
      preferences: {},
      strengths: [],
      weaknesses: []
    };

    profile.interactions++;
    profile.lastInteraction = new Date().toISOString();
    
    // Duygusal geçmiş
    profile.emotionalHistory.push({
      timestamp: new Date().toISOString(),
      emotion: analysisResults.emotionalState.current,
      context: 'lesson_interaction'
    });

    // Performans geçmişi
    profile.performanceHistory.push({
      timestamp: new Date().toISOString(),
      comprehension: analysisResults.comprehensionLevel.score,
      engagement: analysisResults.engagementScore.score
    });

    // Öğrenme stili güncelleme (her 20 etkileşimde bir)
    if (profile.interactions % 20 === 0) {
      profile.learningStyle = await this.determineLearningStyle(studentId);
    }

    // Seviye güncelleme
    const avgPerformance = this.calculateAveragePerformance(profile.performanceHistory.slice(-10));
    if (avgPerformance > 80 && profile.currentLevel < 5) {
      profile.currentLevel += 0.5;
    } else if (avgPerformance < 40 && profile.currentLevel > 1) {
      profile.currentLevel -= 0.5;
    }

    this.learningDatabase.studentProfiles.set(studentId, profile);
  }

  // Yanıt modelini güncelle
  updateResponseModel(interaction, analysisResults) {
    const key = `${interaction.context}_${analysisResults.emotionalState.current}_${analysisResults.comprehensionLevel.level}`;
    
    if (!this.learningDatabase.adaptiveResponses.has(key)) {
      this.learningDatabase.adaptiveResponses.set(key, {
        successfulResponses: [],
        failedResponses: [],
        bestResponse: null
      });
    }

    const responseData = this.learningDatabase.adaptiveResponses.get(key);
    
    if (analysisResults.comprehensionLevel.score > 70) {
      responseData.successfulResponses.push({
        response: interaction.aiResponse,
        score: analysisResults.comprehensionLevel.score
      });
    } else {
      responseData.failedResponses.push({
        response: interaction.aiResponse,
        score: analysisResults.comprehensionLevel.score
      });
    }

    // En iyi yanıtı güncelle
    if (responseData.successfulResponses.length > 0) {
      responseData.bestResponse = responseData.successfulResponses
        .sort((a, b) => b.score - a.score)[0].response;
    }

    this.learningDatabase.adaptiveResponses.set(key, responseData);
  }

  // Öğrenme stilini belirle
  async determineLearningStyle(studentId) {
    const interactions = this.getStudentInteractions(studentId);
    const styleScores = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading: 0
    };

    interactions.forEach(interaction => {
      // Görsel öğrenme göstergeleri
      if (interaction.message.includes('göster') || 
          interaction.message.includes('resim') ||
          interaction.message.includes('görsel')) {
        styleScores.visual += 2;
      }

      // İşitsel öğrenme göstergeleri
      if (interaction.message.includes('anlat') || 
          interaction.message.includes('açıkla') ||
          interaction.message.includes('söyle')) {
        styleScores.auditory += 2;
      }

      // Kinestetik öğrenme göstergeleri
      if (interaction.message.includes('yapalım') || 
          interaction.message.includes('deneyelim') ||
          interaction.message.includes('uygulama')) {
        styleScores.kinesthetic += 2;
      }

      // Okuma/yazma öğrenme göstergeleri
      if (interaction.message.includes('oku') || 
          interaction.message.includes('yaz') ||
          interaction.message.includes('not')) {
        styleScores.reading += 2;
      }

      // Başarılı etkileşimlere ekstra puan
      if (interaction.analysisResults?.comprehensionLevel?.score > 70) {
        const method = interaction.teachingMethod || 'visual';
        styleScores[method] += 3;
      }
    });

    // En yüksek skoru bul
    return Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  // Performans ortalaması hesapla
  calculateAveragePerformance(performanceHistory) {
    if (performanceHistory.length === 0) return 50;
    
    const total = performanceHistory.reduce((sum, p) => 
      sum + (p.comprehension + p.engagement) / 2, 0);
    
    return total / performanceHistory.length;
  }

  // Son başarı oranını hesapla
  calculateRecentSuccessRate(studentId) {
    const recentInteractions = this.getStudentInteractions(studentId).slice(-20);
    const successCount = recentInteractions.filter(i => i.isCorrect === true).length;
    const totalAnswers = recentInteractions.filter(i => i.isCorrect !== undefined).length;
    
    return totalAnswers > 0 ? successCount / totalAnswers : 0.5;
  }

  // Hatırlama oranını hesapla
  calculateRetention(studentId, topic) {
    const topicInteractions = this.getStudentInteractions(studentId)
      .filter(i => i.topic === topic);
    
    if (topicInteractions.length < 2) return 50;

    // İlk ve son etkileşimleri karşılaştır
    const firstScore = topicInteractions[0].analysisResults?.comprehensionLevel?.score || 50;
    const lastScore = topicInteractions[topicInteractions.length - 1]
      .analysisResults?.comprehensionLevel?.score || 50;
    
    // Zaman faktörü
    const timeDiff = new Date(topicInteractions[topicInteractions.length - 1].timestamp) - 
                    new Date(topicInteractions[0].timestamp);
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Zaman geçtikçe unutma faktörü
    const forgettingFactor = Math.max(0.7, 1 - (daysDiff * 0.01));
    
    return lastScore * forgettingFactor;
  }

  // Öğretim metodu öner
  recommendTeachingMethod(studentId, topic) {
    const profile = this.learningDatabase.studentProfiles.get(studentId);
    if (!profile) return 'visual'; // Varsayılan

    const topicHistory = this.getTopicHistory(studentId, topic);
    const methodScores = {};

    // Her metodun başarısını hesapla
    topicHistory.forEach(interaction => {
      const method = interaction.teachingMethod || 'visual';
      if (!methodScores[method]) {
        methodScores[method] = { total: 0, count: 0 };
      }
      
      const score = interaction.analysisResults?.comprehensionLevel?.score || 50;
      methodScores[method].total += score;
      methodScores[method].count++;
    });

    // Ortalama skorları hesapla
    let bestMethod = profile.learningStyle;
    let bestScore = 0;

    Object.entries(methodScores).forEach(([method, data]) => {
      const avgScore = data.total / data.count;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestMethod = method;
      }
    });

    return bestMethod;
  }

  // Başarılı strateji kaydet
  recordSuccessfulStrategy(strategy) {
    this.learningDatabase.successfulStrategies.push({
      ...strategy,
      timestamp: new Date().toISOString(),
      usageCount: 1
    });

    // Benzer stratejileri güncelle
    this.consolidateStrategies();
  }

  // Başarısız strateji kaydet
  recordFailedStrategy(strategy) {
    this.learningDatabase.failedStrategies.push({
      ...strategy,
      timestamp: new Date().toISOString()
    });

    // Pattern analizi
    if (this.learningDatabase.failedStrategies.length % 10 === 0) {
      this.analyzeFailurePatterns();
    }
  }

  // Duygusal pattern güncelle
  updateEmotionalPattern(studentId, emotion) {
    if (!this.learningDatabase.emotionalPatterns.has(studentId)) {
      this.learningDatabase.emotionalPatterns.set(studentId, {
        history: [],
        patterns: {},
        triggers: {}
      });
    }

    const emotionalData = this.learningDatabase.emotionalPatterns.get(studentId);
    emotionalData.history.push({
      emotion: emotion,
      timestamp: new Date().toISOString()
    });

    // Pattern analizi (her 10 kayıtta)
    if (emotionalData.history.length % 10 === 0) {
      this.analyzeEmotionalPatterns(studentId);
    }
  }

  // Yardımcı metodlar
  getRecentInteractions(count = 50) {
    return this.learningDatabase.studentInteractions.slice(-count);
  }

  getStudentInteractions(studentId) {
    return this.learningDatabase.studentInteractions
      .filter(i => i.studentId === studentId);
  }

  getTopicHistory(studentId, topic) {
    return this.getStudentInteractions(studentId)
      .filter(i => i.topic === topic);
  }

  getEmotionalTrend(studentId) {
    const emotionalData = this.learningDatabase.emotionalPatterns.get(studentId);
    if (!emotionalData || emotionalData.history.length < 5) return 'stable';

    const recentEmotions = emotionalData.history.slice(-5);
    const positiveCount = recentEmotions.filter(e => 
      ['happy', 'excited'].includes(e.emotion)).length;
    
    if (positiveCount >= 4) return 'improving';
    if (positiveCount <= 1) return 'declining';
    return 'stable';
  }

  calculateEngagementTrend(studentId) {
    const profile = this.learningDatabase.studentProfiles.get(studentId);
    if (!profile || profile.performanceHistory.length < 5) return 'stable';

    const recentEngagement = profile.performanceHistory.slice(-5)
      .map(p => p.engagement);
    
    const trend = recentEngagement[4] - recentEngagement[0];
    if (trend > 10) return 'increasing';
    if (trend < -10) return 'decreasing';
    return 'stable';
  }

  identifyComprehensionFactors(interaction) {
    const factors = [];

    if (interaction.responseTime > 120) {
      factors.push('slow_response');
    }
    if (interaction.hintsUsed > 2) {
      factors.push('multiple_hints_needed');
    }
    if (interaction.message.length < 10) {
      factors.push('short_response');
    }
    if (interaction.retryCount > 0) {
      factors.push('multiple_attempts');
    }

    return factors;
  }

  findCommonPattern(errors) {
    // Basit pattern matching - gerçek uygulamada daha sofistike olmalı
    const errorMessages = errors.map(e => e.error.toLowerCase());
    const wordFrequency = {};

    errorMessages.forEach(msg => {
      const words = msg.split(' ');
      words.forEach(word => {
        if (word.length > 3) { // Kısa kelimeleri atla
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    // En sık kullanılan kelimeleri bul
    const commonWords = Object.entries(wordFrequency)
      .filter(([word, count]) => count >= errors.length * 0.5)
      .map(([word]) => word);

    return commonWords.length > 0 ? commonWords.join(' ') : null;
  }

  generateApproachForMisconception(pattern) {
    // Pattern'e göre yaklaşım öner
    const approaches = {
      'karıştır': 'Kavramları tek tek açıkla ve karşılaştır',
      'unutuyor': 'Tekrar ve pratik egzersizleri artır',
      'anlamıyor': 'Farklı örnekler ve görsel materyaller kullan',
      'zor': 'Daha basit adımlarla başla'
    };

    for (const [key, approach] of Object.entries(approaches)) {
      if (pattern.includes(key)) return approach;
    }

    return 'Alternatif açıklama yöntemleri dene';
  }

  consolidateStrategies() {
    // Benzer stratejileri grupla
    const strategyGroups = new Map();

    this.learningDatabase.successfulStrategies.forEach(strategy => {
      const key = `${strategy.context}_${strategy.method}_${strategy.emotionalState}`;
      
      if (!strategyGroups.has(key)) {
        strategyGroups.set(key, []);
      }
      strategyGroups.get(key).push(strategy);
    });

    // En başarılı stratejileri belirle
    const topStrategies = [];
    strategyGroups.forEach((strategies, key) => {
      if (strategies.length >= 3) {
        topStrategies.push({
          key: key,
          count: strategies.length,
          example: strategies[0]
        });
      }
    });

    // Sonuçları sakla
    this.learningDatabase.topStrategies = topStrategies
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  analyzeFailurePatterns() {
    const recentFailures = this.learningDatabase.failedStrategies.slice(-50);
    const patterns = {};

    recentFailures.forEach(failure => {
      const key = `${failure.method}_${failure.emotionalState}`;
      patterns[key] = (patterns[key] || 0) + 1;
    });

    // En yaygın başarısızlık pattern'lerini bul
    this.learningDatabase.failurePatterns = Object.entries(patterns)
      .filter(([key, count]) => count >= 5)
      .map(([key, count]) => ({ pattern: key, frequency: count }));
  }

  analyzeEmotionalPatterns(studentId) {
    const emotionalData = this.learningDatabase.emotionalPatterns.get(studentId);
    const recentHistory = emotionalData.history.slice(-20);

    // Zaman bazlı pattern'ler
    const timePatterns = {};
    recentHistory.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      if (!timePatterns[timeOfDay]) {
        timePatterns[timeOfDay] = {};
      }
      timePatterns[timeOfDay][entry.emotion] = 
        (timePatterns[timeOfDay][entry.emotion] || 0) + 1;
    });

    emotionalData.patterns = timePatterns;

    // Tetikleyicileri bul
    const triggers = {};
    for (let i = 1; i < recentHistory.length; i++) {
      if (recentHistory[i].emotion === 'frustrated' && 
          recentHistory[i-1].emotion !== 'frustrated') {
        // Frustration tetikleyicisi
        const interaction = this.learningDatabase.studentInteractions
          .find(int => Math.abs(new Date(int.timestamp) - new Date(recentHistory[i].timestamp)) < 60000);
        
        if (interaction) {
          const trigger = interaction.context || 'unknown';
          triggers[trigger] = (triggers[trigger] || 0) + 1;
        }
      }
    }

    emotionalData.triggers = triggers;
  }

  detectTimePatterns(interactions) {
    const timeBasedPerformance = {};

    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      const performance = interaction.analysisResults?.comprehensionLevel?.score || 50;
      
      if (!timeBasedPerformance[hour]) {
        timeBasedPerformance[hour] = { total: 0, count: 0 };
      }
      
      timeBasedPerformance[hour].total += performance;
      timeBasedPerformance[hour].count++;
    });

    // En verimli saatleri bul
    const productiveHours = Object.entries(timeBasedPerformance)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgPerformance: data.total / data.count
      }))
      .sort((a, b) => b.avgPerformance - a.avgPerformance)
      .slice(0, 3);

    this.learningDatabase.productiveHours = productiveHours;
  }

  detectLearningTrends(interactions) {
    // Konu bazlı ilerleme
    const topicProgress = new Map();

    interactions.forEach(interaction => {
      if (!interaction.topic) return;
      
      if (!topicProgress.has(interaction.topic)) {
        topicProgress.set(interaction.topic, []);
      }
      
      topicProgress.get(interaction.topic).push({
        timestamp: interaction.timestamp,
        score: interaction.analysisResults?.comprehensionLevel?.score || 50
      });
    });

    // Her konu için trend hesapla
    const trends = {};
    topicProgress.forEach((progress, topic) => {
      if (progress.length >= 3) {
        const firstScore = progress[0].score;
        const lastScore = progress[progress.length - 1].score;
        const improvement = lastScore - firstScore;
        
        trends[topic] = {
          improvement: improvement,
          currentLevel: lastScore,
          sessions: progress.length,
          trend: improvement > 10 ? 'improving' : improvement < -10 ? 'declining' : 'stable'
        };
      }
    });

    this.learningDatabase.learningTrends = trends;
  }

  recordMethodSuccess(method, score, interaction) {
    const key = `${method}_${interaction.topic || 'general'}`;
    
    if (!this.learningDatabase.methodEffectiveness) {
      this.learningDatabase.methodEffectiveness = new Map();
    }
    
    if (!this.learningDatabase.methodEffectiveness.has(key)) {
      this.learningDatabase.methodEffectiveness.set(key, {
        totalScore: 0,
        count: 0,
        successCount: 0
      });
    }
    
    const effectiveness = this.learningDatabase.methodEffectiveness.get(key);
    effectiveness.totalScore += score;
    effectiveness.count++;
    if (score > 70) effectiveness.successCount++;
    
    this.learningDatabase.methodEffectiveness.set(key, effectiveness);
  }

  detectEmotionalPatterns(interactions) {
    const emotionalSequences = [];
    
    for (let i = 1; i < interactions.length; i++) {
      const prevEmotion = interactions[i-1].analysisResults?.emotionalState?.current;
      const currEmotion = interactions[i].analysisResults?.emotionalState?.current;
      
      if (prevEmotion && currEmotion) {
        emotionalSequences.push({
          from: prevEmotion,
          to: currEmotion,
          context: interactions[i].context
        });
      }
    }

    // En yaygın duygusal geçişleri bul
    const transitionPatterns = {};
    emotionalSequences.forEach(seq => {
      const key = `${seq.from}_to_${seq.to}`;
      if (!transitionPatterns[key]) {
        transitionPatterns[key] = { count: 0, contexts: [] };
      }
      transitionPatterns[key].count++;
      transitionPatterns[key].contexts.push(seq.context);
    });

    this.learningDatabase.emotionalTransitions = transitionPatterns;
  }

  shouldSyncWithBackend() {
    // Her 50 etkileşimde bir sync yap
    return this.learningDatabase.studentInteractions.length % 50 === 0;
  }

  async syncWithBackend(interaction) {
    try {
      const payload = {
        interaction: interaction,
        studentProfile: this.learningDatabase.studentProfiles.get(interaction.studentId),
        learningInsights: {
          topStrategies: this.learningDatabase.topStrategies,
          commonMisconceptions: this.learningDatabase.commonMisconceptions,
          learningTrends: this.learningDatabase.learningTrends
        }
      };

      await api.post('/ai/learning-data', payload);
    } catch (error) {
      console.error('Backend sync hatası:', error);
      // Hata durumunda local'de saklamaya devam et
    }
  }

  // Local storage işlemleri
  saveToLocalStorage() {
    try {
      const dataToSave = {
        studentInteractions: this.learningDatabase.studentInteractions.slice(-1000), // Son 1000 etkileşim
        successfulStrategies: this.learningDatabase.successfulStrategies.slice(-100),
        failedStrategies: this.learningDatabase.failedStrategies.slice(-100),
        studentProfiles: Array.from(this.learningDatabase.studentProfiles.entries()),
        commonMisconceptions: this.learningDatabase.commonMisconceptions,
        topStrategies: this.learningDatabase.topStrategies,
        learningTrends: this.learningDatabase.learningTrends,
        emotionalPatterns: Array.from(this.learningDatabase.emotionalPatterns.entries())
      };

      localStorage.setItem('selfLearningAI_data', JSON.stringify(dataToSave));
      localStorage.setItem('selfLearningAI_lastSave', new Date().toISOString());
    } catch (error) {
      console.error('Local storage kayıt hatası:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('selfLearningAI_data');
      if (!savedData) return;

      const data = JSON.parse(savedData);
      
      this.learningDatabase.studentInteractions = data.studentInteractions || [];
      this.learningDatabase.successfulStrategies = data.successfulStrategies || [];
      this.learningDatabase.failedStrategies = data.failedStrategies || [];
      this.learningDatabase.studentProfiles = new Map(data.studentProfiles || []);
      this.learningDatabase.commonMisconceptions = data.commonMisconceptions || [];
      this.learningDatabase.topStrategies = data.topStrategies || [];
      this.learningDatabase.learningTrends = data.learningTrends || {};
      this.learningDatabase.emotionalPatterns = new Map(data.emotionalPatterns || []);

      console.log('Self-learning AI verileri yüklendi');
    } catch (error) {
      console.error('Local storage yükleme hatası:', error);
    }
  }

  // Temizlik
  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveToLocalStorage();
  }

  // API metodları
  getRecommendations(context) {
    const key = `${context.topic}_${context.studentEmotion}_${context.comprehensionLevel}`;
    const adaptiveResponse = this.learningDatabase.adaptiveResponses.get(key);
    
    if (adaptiveResponse && adaptiveResponse.bestResponse) {
      return {
        response: adaptiveResponse.bestResponse,
        confidence: 0.9,
        source: 'learned_pattern'
      };
    }

    // Varsayılan öneriler
    return this.generateDefaultRecommendation(context);
  }

  generateDefaultRecommendation(context) {
    const recommendations = {
      low_comprehension: {
        visual: 'Görsel materyaller ve animasyonlar kullan',
        auditory: 'Sesli açıklamalar ve örnekler ver',
        kinesthetic: 'Pratik uygulamalar ve deneyler yap',
        reading: 'Detaylı yazılı açıklamalar sağla'
      },
      frustrated: {
        response: 'Daha basit örneklerle başla ve cesaretlendir',
        approach: 'step_by_step',
        tone: 'encouraging'
      },
      confused: {
        response: 'Konuyu farklı bir açıdan açıkla',
        approach: 'alternative_explanation',
        tone: 'patient'
      },
      excited: {
        response: 'Daha zorlu problemler sun',
        approach: 'challenge',
        tone: 'enthusiastic'
      }
    };

    return {
      response: recommendations[context.studentEmotion]?.response || 
                recommendations.low_comprehension[context.learningStyle || 'visual'],
      confidence: 0.6,
      source: 'default_rules'
    };
  }

  // Performans metrikleri
  getPerformanceMetrics(studentId) {
    const profile = this.learningDatabase.studentProfiles.get(studentId);
    if (!profile) return null;

    const recentPerformance = profile.performanceHistory.slice(-20);
    const avgComprehension = recentPerformance.reduce((sum, p) => sum + p.comprehension, 0) / recentPerformance.length;
    const avgEngagement = recentPerformance.reduce((sum, p) => sum + p.engagement, 0) / recentPerformance.length;
    
    return {
      averageComprehension: avgComprehension,
      averageEngagement: avgEngagement,
      currentLevel: profile.currentLevel,
      learningStyle: profile.learningStyle,
      totalInteractions: profile.interactions,
      emotionalTrend: this.getEmotionalTrend(studentId),
      strengths: this.identifyStrengths(studentId),
      weaknesses: this.identifyWeaknesses(studentId),
      recommendations: this.generatePersonalizedRecommendations(studentId)
    };
  }

  identifyStrengths(studentId) {
    const interactions = this.getStudentInteractions(studentId);
    const topicScores = {};

    interactions.forEach(interaction => {
      if (interaction.topic && interaction.analysisResults?.comprehensionLevel?.score > 70) {
        topicScores[interaction.topic] = (topicScores[interaction.topic] || 0) + 1;
      }
    });

    return Object.entries(topicScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  identifyWeaknesses(studentId) {
    const interactions = this.getStudentInteractions(studentId);
    const topicScores = {};

    interactions.forEach(interaction => {
      if (interaction.topic && interaction.analysisResults?.comprehensionLevel?.score < 50) {
        topicScores[interaction.topic] = (topicScores[interaction.topic] || 0) + 1;
      }
    });

    return Object.entries(topicScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  generatePersonalizedRecommendations(studentId) {
    const profile = this.learningDatabase.studentProfiles.get(studentId);
    const metrics = this.getPerformanceMetrics(studentId);
    const recommendations = [];

    // Öğrenme stili önerisi
    recommendations.push({
      type: 'learning_style',
      message: `${profile.learningStyle} öğrenme stiline uygun materyaller kullanılmalı`
    });

    // Performans önerisi
    if (metrics.averageComprehension < 60) {
      recommendations.push({
        type: 'difficulty',
        message: 'Zorluk seviyesi düşürülmeli ve daha fazla pratik yapılmalı'
      });
    } else if (metrics.averageComprehension > 85) {
      recommendations.push({
        type: 'challenge',
        message: 'Daha zorlu problemler ve ileri seviye konular verilebilir'
      });
    }

    // Duygusal durum önerisi
    if (metrics.emotionalTrend === 'declining') {
      recommendations.push({
        type: 'emotional_support',
        message: 'Motivasyon artırıcı aktiviteler ve başarı hikayeleri paylaşılmalı'
      });
    }

    // Zaman önerisi
    if (this.learningDatabase.productiveHours?.length > 0) {
      const bestHour = this.learningDatabase.productiveHours[0].hour;
      recommendations.push({
        type: 'timing',
        message: `En verimli çalışma saati: ${bestHour}:00`
      });
    }

    return recommendations;
  }
}

// Singleton instance
const selfLearningAI = new SelfLearningAI();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  selfLearningAI.destroy();
});

export default selfLearningAI;
