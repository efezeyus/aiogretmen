/**
 * Text-to-Speech Servisi
 * 
 * AI öğretmenin sesli konuşması için
 * - Web Speech API (Türkçe)
 * - Otomatik okuma
 * - Duraklatma/devam ettirme
 * - Hız ayarlama
 */

class TextToSpeechService {
  constructor() {
    // Web Speech API kontrolü
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.isSpeaking = false;
    this.currentUtterance = null;
    
    // Türkçe ses seçenekleri
    this.turkishVoices = [];
    this.selectedVoice = null;
    
    // Ayarlar
    this.settings = {
      rate: 0.9,        // Konuşma hızı (0.1 - 2)
      pitch: 1.0,       // Ses tonu (0 - 2)
      volume: 1.0,      // Ses seviyesi (0 - 1)
      lang: 'tr-TR'     // Türkçe
    };

    // Otomatik başlat
    this.initialize();
  }

  /**
   * Sesleri yükle ve Türkçe sesi seç
   */
  initialize() {
    if (!this.isSupported) {
      console.warn('⚠️ Text-to-Speech desteklenmiyor!');
      return;
    }

    // Sesleri yükle
    this.loadVoices();

    // Sesler yüklendiğinde tekrar dene
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    }

    console.log('🔊 Text-to-Speech servisi hazır');
  }

  /**
   * Türkçe sesleri yükle
   */
  loadVoices() {
    const voices = this.synth.getVoices();
    
    // Türkçe sesleri filtrele
    this.turkishVoices = voices.filter(voice => 
      voice.lang.startsWith('tr') || voice.lang.includes('TR')
    );

    // Varsayılan Türkçe ses seç
    if (this.turkishVoices.length > 0) {
      // Kadın ses tercih et (daha yumuşak)
      this.selectedVoice = this.turkishVoices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('kadın') ||
        v.name.toLowerCase().includes('yelda')
      ) || this.turkishVoices[0];
      
      console.log('✅ Türkçe ses seçildi:', this.selectedVoice.name);
    } else {
      console.warn('⚠️ Türkçe ses bulunamadı, varsayılan kullanılacak');
    }
  }

  /**
   * Metni sesli oku
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        console.warn('Text-to-Speech desteklenmiyor');
        resolve(false);
        return;
      }

      // Devam eden konuşmayı durdur
      this.stop();

      // Emoji ve özel karakterleri temizle
      const cleanText = this.cleanText(text);

      if (!cleanText.trim()) {
        resolve(false);
        return;
      }

      // Utterance oluştur
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Ayarları uygula
      utterance.lang = this.settings.lang;
      utterance.rate = options.rate || this.settings.rate;
      utterance.pitch = options.pitch || this.settings.pitch;
      utterance.volume = options.volume || this.settings.volume;

      // Türkçe ses kullan
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Konuşma başladı');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        console.log('✅ Konuşma bitti');
        resolve(true);
      };

      utterance.onerror = (event) => {
        console.error('❌ TTS hatası:', event);
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(event);
      };

      // Konuşmayı başlat
      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Metni temizle (Emoji, özel karakterler)
   */
  cleanText(text) {
    let cleaned = text;

    // Emoji'leri kaldır
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc symbols
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats

    // Markdown işaretlerini kaldır
    cleaned = cleaned.replace(/\*\*/g, '');  // Bold
    cleaned = cleaned.replace(/\*/g, '');    // Italic
    cleaned = cleaned.replace(/##/g, '');    // Headers
    cleaned = cleaned.replace(/###/g, '');
    cleaned = cleaned.replace(/####/g, '');
    cleaned = cleaned.replace(/─/g, '');     // Çizgiler
    cleaned = cleaned.replace(/━/g, '');
    cleaned = cleaned.replace(/•/g, '');     // Bullet points
    
    // Matematiksel sembolleri Türkçe'ye çevir
    cleaned = cleaned.replace(/\+/g, ' artı ');
    cleaned = cleaned.replace(/-(?=\d)/g, ' eksi ');
    cleaned = cleaned.replace(/×|x/g, ' çarpı ');
    cleaned = cleaned.replace(/÷|\//g, ' bölü ');
    cleaned = cleaned.replace(/=/g, ' eşittir ');

    // Çoklu boşlukları temizle
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Başındaki/sonundaki boşlukları kaldır
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Konuşmayı durdur
   */
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('⏹️ Konuşma durduruldu');
    }
  }

  /**
   * Duraklat
   */
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      console.log('⏸️ Konuşma duraklatıldı');
    }
  }

  /**
   * Devam et
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
      console.log('▶️ Konuşma devam ediyor');
    }
  }

  /**
   * Konuşma hızını ayarla
   */
  setRate(rate) {
    this.settings.rate = Math.max(0.1, Math.min(2, rate));
  }

  /**
   * Ses tonunu ayarla
   */
  setPitch(pitch) {
    this.settings.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Ses seviyesini ayarla
   */
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Konuşma durumunu kontrol et
   */
  isSpeakingNow() {
    return this.isSpeaking || this.synth.speaking;
  }

  /**
   * Otomatik oku - AI mesajı geldiğinde
   */
  async autoSpeak(message, autoPlay = true) {
    if (!autoPlay) return;

    try {
      await this.speak(message);
    } catch (error) {
      console.error('Otomatik okuma hatası:', error);
    }
  }
}

// Singleton
const ttsService = new TextToSpeechService();
export default ttsService;

