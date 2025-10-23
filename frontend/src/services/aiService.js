import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class AIService {
  constructor() {
    this.baseURL = '/ai';
    this.API_URL = API_URL;
  }

  // AI öğretmen ders anlatma
  async teachLesson(message, gradeLevel = 5, subject = 'matematik', context = null, conversationHistory = null) {
    try {
      console.log('🤖 AI öğretmen isteği:', { message, gradeLevel, subject });
      
      const response = await api.post(`${this.baseURL}/teach`, {
        message,
        grade_level: gradeLevel,
        subject,
        context,
        conversation_history: conversationHistory
      });

      console.log('🤖 AI öğretmen yanıtı:', response);
      return response;
    } catch (error) {
      console.error('❌ AI öğretmen hatası:', error);
      throw error;
    }
  }

  // Kullanılabilir modelleri listele
  async getAvailableModels() {
    try {
      const response = await api.get(`${this.baseURL}/models`);
      console.log('🤖 Kullanılabilir modeller:', response);
      return response;
    } catch (error) {
      console.error('❌ Model listesi hatası:', error);
      throw error;
    }
  }

  // Öğrenci sorusunu analiz et
  async analyzeQuestion(message, gradeLevel = 5, subject = 'matematik') {
    try {
      console.log('🔍 Soru analizi:', { message, gradeLevel, subject });
      
      const response = await api.post(`${this.baseURL}/analyze`, {
        message,
        grade_level: gradeLevel,
        subject
      });

      console.log('🔍 Analiz sonucu:', response);
      return response;
    } catch (error) {
      console.error('❌ Soru analizi hatası:', error);
      throw error;
    }
  }

  // Akıllı öğretmen yanıtı
  async getSmartTeacherResponse(userMessage, lessonContext) {
    try {
      const { gradeLevel = 5, subject = 'matematik', conversationHistory = [] } = lessonContext;
      
      // AI öğretmenden yanıt al
      const aiResponse = await this.teachLesson(
        userMessage,
        gradeLevel,
        subject,
        null,
        conversationHistory
      );

      return {
        success: true,
        response: aiResponse.response,
        model: aiResponse.model_used,
        provider: aiResponse.provider,
        confidence: aiResponse.confidence
      };
    } catch (error) {
      console.error('❌ Akıllı öğretmen hatası:', error);
      return {
        success: false,
        response: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
        error: error.message
      };
    }
  }

  // Gelişmiş AI Öğretmen Yanıtı
  async getAdvancedTeacherResponse(message, context) {
    try {
      const systemPrompt = `Sen gelişmiş bir AI öğretmensin. Özellikler:
      
      1. Öğrenci Profili Analizi:
         - Öğrenme stili: ${context.studentProfile.learningStyle}
         - Mevcut ruh hali: ${context.studentProfile.currentMood}
         - Anlama seviyesi: ${context.studentProfile.comprehensionLevel}%
         - İlgi alanları: ${context.studentProfile.interests.join(', ')}
      
      2. Öğretim Stratejisi:
         - Kişilik: ${context.teacherPersonality.personality}
         - Mod: ${context.teacherPersonality.teachingMode}
         - Zorluk seviyesi: ${context.teacherPersonality.adaptiveLevel}/5
         - Duygusal ton: ${context.teacherPersonality.emotionalTone}
      
      3. Mevcut Ders:
         - Konu: ${context.lesson.title}
         - Modül: ${context.currentModule}
         - Hedefler: ${JSON.stringify(context.learningObjectives)}
      
      4. Oturum Metrikleri:
         - Doğru cevaplar: ${context.sessionMetrics.correctAnswers}
         - Yanlış cevaplar: ${context.sessionMetrics.incorrectAnswers}
         - Katılım skoru: ${context.sessionMetrics.engagementScore}
      
      KURALLAR:
      - Öğrencinin ruh haline göre yanıt ver
      - Anlama seviyesine göre açıklama yap
      - Görsel ve etkileşimli öğeler öner
      - Gamification kullan (puan, rozet, vs)
      - Gerçek hayat örnekleri ver
      - 3D görselleştirme öner
      - Öğrenciyi motive et
      - Kısa ve anlaşılır ol
      
      Yanıtında şunları belirt:
      - content: Ana mesaj
      - emotion: happy/excited/encouraging/calm
      - visualAids: [{type: "3d_model/animation/image", name: "...", description: "..."}]
      - interactiveElements: [{type: "quiz/game/simulation", ...}]
      - profileUpdates: {comprehensionLevel: +5, currentMood: "happy", ...}
      - difficultyAdjustment: -1/0/+1
      - nextAction: "practice/explain/quiz/reward"`;

      const userPrompt = `
      Öğrenci mesajı: "${message}"
      İstek tipi: ${context.requestType}
      Duygusal bağlam: ${context.emotionalContext}
      
      Lütfen uygun bir yanıt oluştur.`;

      const payload = {
        message: userPrompt,
        context: systemPrompt,
        temperature: 0.7,
        max_tokens: 1000
      };

      const response = await fetch(`${this.API_URL}/ai/teach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // AI yanıtını parse et
        const aiResponse = this.parseAdvancedResponse(data.response);
        return {
          success: true,
          ...aiResponse
        };
      }

      throw new Error(data.error || 'AI yanıt hatası');

    } catch (error) {
      console.error('❌ Gelişmiş AI öğretmen hatası:', error);
      return {
        success: false,
        content: 'Üzgünüm, bir sorun oluştu. Tekrar deneyelim mi? 🤔',
        emotion: 'confused',
        visualAids: [],
        interactiveElements: []
      };
    }
  }

  // Gelişmiş yanıtı parse et
  parseAdvancedResponse(responseText) {
    try {
      // Basit bir parser - gerçek uygulamada daha sofistike olmalı
      const response = {
        content: responseText,
        emotion: 'encouraging',
        visualAids: [],
        interactiveElements: [],
        profileUpdates: null,
        difficultyAdjustment: 0,
        nextAction: 'continue'
      };

      // Duygu analizi
      if (responseText.includes('Harika') || responseText.includes('Mükemmel')) {
        response.emotion = 'excited';
      } else if (responseText.includes('merak') || responseText.includes('ilginç')) {
        response.emotion = 'curious';
      }

      // Görsel öneriler
      if (responseText.includes('göster') || responseText.includes('görsel')) {
        response.visualAids.push({
          type: 'animation',
          name: 'concept_visualization',
          description: 'Konuyu görselleştiren animasyon'
        });
      }

      // Etkileşimli öğeler
      if (responseText.includes('deneyelim') || responseText.includes('pratik')) {
        response.interactiveElements.push({
          type: 'quiz',
          question: 'Hadi öğrendiklerimizi test edelim!',
          options: ['Seçenek A', 'Seçenek B', 'Seçenek C']
        });
      }

      return response;

    } catch (error) {
      console.error('Parse hatası:', error);
      return {
        content: responseText,
        emotion: 'neutral',
        visualAids: [],
        interactiveElements: []
      };
    }
  }

  // Duygu tanıma (görüntü analizi için)
  async analyzeStudentEmotion(imageData) {
    // Gerçek uygulamada TensorFlow.js veya başka bir ML kütüphanesi kullanılabilir
    // Şimdilik simüle edilmiş sonuç
    const emotions = ['happy', 'confused', 'frustrated', 'excited', 'neutral'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    return {
      emotion: randomEmotion,
      confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0 arası güven skoru
    };
  }

  // Ses analizi
  async analyzeVoiceTone(audioData) {
    // Gerçek uygulamada Web Audio API ve ML modeli kullanılabilir
    // Şimdilik simüle edilmiş sonuç
    return {
      tone: 'curious',
      confidence: 0.85,
      volume: 'normal',
      pace: 'moderate'
    };
  }

  // Öğrenme stili tahmini
  async predictLearningStyle(interactions) {
    // Öğrenci etkileşimlerine göre öğrenme stili tahmini
    const styles = ['visual', 'auditory', 'kinesthetic'];
    
    // Basit analiz
    let visualScore = 0;
    let auditoryScore = 0;
    let kinestheticScore = 0;

    interactions.forEach(interaction => {
      if (interaction.includes('göster') || interaction.includes('görsel')) {
        visualScore++;
      }
      if (interaction.includes('anlat') || interaction.includes('açıkla')) {
        auditoryScore++;
      }
      if (interaction.includes('yapalım') || interaction.includes('deneyelim')) {
        kinestheticScore++;
      }
    });

    const scores = { visual: visualScore, auditory: auditoryScore, kinesthetic: kinestheticScore };
    const maxStyle = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    return {
      primaryStyle: maxStyle,
      scores: scores
    };
  }

  // Adaptif zorluk ayarlama
  async calculateAdaptiveDifficulty(performance) {
    const { correctAnswers, totalQuestions, timeSpent, hintsUsed } = performance;
    
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const avgTimePerQuestion = totalQuestions > 0 ? timeSpent / totalQuestions : 0;
    const hintUsageRate = totalQuestions > 0 ? hintsUsed / totalQuestions : 0;

    let difficultyAdjustment = 0;

    // Yüksek başarı ve hızlı cevap = zorluk artır
    if (accuracy > 0.8 && avgTimePerQuestion < 30 && hintUsageRate < 0.2) {
      difficultyAdjustment = 1;
    }
    // Düşük başarı veya çok fazla ipucu = zorluk azalt
    else if (accuracy < 0.5 || hintUsageRate > 0.5) {
      difficultyAdjustment = -1;
    }

    return {
      adjustment: difficultyAdjustment,
      reasoning: difficultyAdjustment > 0 ? 'Öğrenci hazır, zorluk artırılıyor' : 
                difficultyAdjustment < 0 ? 'Öğrenci zorlanıyor, zorluk azaltılıyor' : 
                'Mevcut zorluk seviyesi uygun'
    };
  }
}

export default new AIService(); 