import React, { useState, useRef, useEffect } from 'react';
import './SmartPromptInput.css';

/**
 * AKILLI PROMPT GİRİŞ SİSTEMİ
 * 
 * Son Teknoloji Özellikler:
 * - Auto-complete önerileri
 * - Emoji picker
 * - Sesli girdi (Speech-to-Text)
 * - Smart suggestions (AI destekli)
 * - Command shortcuts (/help, /quiz vb.)
 * - Matematik denklemi girişi (LaTeX)
 * - Resim yükleme
 * - Kod snippet desteği
 * - Multi-line support
 * - Karakter sayacı
 * - Typing indicator
 */

const SmartPromptInput = ({ 
  onSend, 
  onTyping,
  placeholder = "AI öğretmenine sor...",
  maxLength = 1000,
  enableVoice = true,
  enableEmoji = true,
  enableCommands = true,
  enableMath = true,
  enableImage = false,
  aiSuggestions = []
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-complete suggestions
  const smartSuggestions = {
    questions: [
      "Bu konuyu anlamadım, tekrar anlatır mısın?",
      "Bir örnek verir misin?",
      "Bunu günlük hayatta nerede kullanırız?",
      "Daha kolay bir yöntem var mı?",
      "Bu formülü açıklar mısın?",
      "Konu özeti yapabilir misin?",
      "Quiz çözmek istiyorum",
      "Pratik soru ister misiniz?"
    ],
    math: [
      "1/2 + 1/4 = ?",
      "24 × 15 = ?",
      "√16 = ?",
      "3² + 4² = ?",
      "Bu denklemi çöz: 2x + 5 = 15"
    ],
    commands: [
      { cmd: "/help", desc: "Yardım menüsünü göster" },
      { cmd: "/quiz", desc: "Hızlı quiz başlat" },
      { cmd: "/example", desc: "Örnek iste" },
      { cmd: "/explain", desc: "Detaylı açıklama" },
      { cmd: "/summary", desc: "Konu özeti" },
      { cmd: "/practice", desc: "Alıştırma soruları" },
      { cmd: "/hint", desc: "İpucu al" },
      { cmd: "/clear", desc: "Sohbeti temizle" }
    ]
  };

  // Emojis
  const emojiCategories = {
    '😊 Duygular': ['😊', '😃', '😄', '😁', '🥰', '😍', '🤔', '😮', '😕', '😢', '😡', '🤯'],
    '👍 Tepkiler': ['👍', '👎', '👏', '🙌', '👋', '✌️', '🤝', '💪', '🙏', '✋'],
    '🎓 Eğitim': ['🎓', '📚', '📖', '✏️', '📝', '🧮', '🔬', '🧪', '🔭', '🎨', '🎵'],
    '⭐ Başarı': ['⭐', '🌟', '✨', '💫', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅'],
    '🎯 Semboller': ['❤️', '💙', '💚', '💛', '🔥', '⚡', '💡', '✅', '❌', '⚠️']
  };

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-complete logic
  useEffect(() => {
    if (input.length > 0) {
      // Trigger typing indicator
      if (onTyping) {
        onTyping(true);
      }

      // Debounce typing indicator
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (onTyping) onTyping(false);
      }, 1000);

      // Show suggestions
      if (input.startsWith('/')) {
        // Command mode
        const matchedCommands = smartSuggestions.commands.filter(cmd => 
          cmd.cmd.toLowerCase().includes(input.toLowerCase())
        );
        setSuggestions(matchedCommands.map(c => c.cmd + ' - ' + c.desc));
        setShowCommands(true);
        setShowSuggestions(true);
      } else if (input.endsWith('?')) {
        // Question mode
        const matchedQuestions = smartSuggestions.questions.filter(q =>
          q.toLowerCase().includes(input.toLowerCase().slice(0, -1))
        );
        setSuggestions(matchedQuestions);
        setShowSuggestions(matchedQuestions.length > 0);
      } else if (/[\d\/\+\-\*\=]/.test(input)) {
        // Math mode
        setSuggestions(smartSuggestions.math);
        setShowSuggestions(true);
      } else if (input.length >= 3) {
        // General suggestions
        const combined = [...smartSuggestions.questions, ...aiSuggestions];
        const matched = combined.filter(s => 
          s.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 5);
        setSuggestions(matched);
        setShowSuggestions(matched.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setShowCommands(false);
    }
  }, [input, aiSuggestions, onTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Command handling
    if (enableCommands && input.startsWith('/')) {
      handleCommand(input);
      return;
    }

    onSend(input);
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleCommand = (command) => {
    const cmd = command.split(' ')[0];
    
    const commands = {
      '/help': () => onSend('Yardım: Kullanabileceğin komutlar: /quiz, /example, /explain, /summary, /practice, /hint'),
      '/quiz': () => onSend('Hemen bir quiz başlatalım!'),
      '/example': () => onSend('Bir örnek gösterir misin?'),
      '/explain': () => onSend('Bu konuyu detaylı açıklar mısın?'),
      '/summary': () => onSend('Konu özetini verir misin?'),
      '/practice': () => onSend('Alıştırma soruları istiyorum'),
      '/hint': () => onSend('İpucu verir misin?'),
      '/clear': () => {
        setInput('');
        if (window.confirm('Sohbet geçmişini temizlemek istediğinize emin misiniz?')) {
          // Parent component'te clear fonksiyonu çağrılmalı
        }
      }
    };

    if (commands[cmd]) {
      commands[cmd]();
      setInput('');
    } else {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        // Auto-complete ile gönder
        selectSuggestion(suggestions[selectedSuggestionIndex]);
      } else {
        handleSend();
      }
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => 
        Math.min(prev + 1, suggestions.length - 1)
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowEmojiPicker(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    const cleanSuggestion = suggestion.split(' - ')[0]; // Remove command description
    setInput(cleanSuggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(0);
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız ses tanımayı desteklemiyor');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const insertEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Resim yükleme işlemi
      const reader = new FileReader();
      reader.onload = (event) => {
        onSend(`[Resim yüklendi: ${file.name}]`, { image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const insertMathTemplate = (template) => {
    const templates = {
      'fraction': 'a/b',
      'equation': 'x + y = z',
      'sqrt': '√x',
      'power': 'x²'
    };
    setInput(prev => prev + templates[template]);
  };

  return (
    <div className="smart-prompt-container">
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => selectSuggestion(suggestion)}
            >
              {showCommands ? '⌘ ' : '💡 '}
              {suggestion}
            </div>
          ))}
          <div className="suggestions-footer">
            ↑↓ ile seç, Enter ile kullan, Esc ile kapat
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-header">
            <span>Emoji Seç</span>
            <button onClick={() => setShowEmojiPicker(false)}>✕</button>
          </div>
          <div className="emoji-categories">
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} className="emoji-category">
                <div className="category-name">{category}</div>
                <div className="emoji-grid">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      className="emoji-btn"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="prompt-input-wrapper">
        {/* Toolbar */}
        <div className="prompt-toolbar">
          <div className="toolbar-left">
            {enableCommands && (
              <button 
                className="tool-btn" 
                onClick={() => setShowCommands(!showCommands)}
                title="Komutlar (/help, /quiz vb.)"
              >
                ⌘
              </button>
            )}
            
            {enableMath && (
              <div className="math-tools">
                <button className="tool-btn" onClick={() => insertMathTemplate('fraction')} title="Kesir">
                  ¾
                </button>
                <button className="tool-btn" onClick={() => insertMathTemplate('sqrt')} title="Karekök">
                  √
                </button>
                <button className="tool-btn" onClick={() => insertMathTemplate('power')} title="Üs">
                  x²
                </button>
              </div>
            )}
          </div>

          <div className="toolbar-right">
            <span className="char-counter">
              {input.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* Input Field */}
        <div className="input-container">
          <textarea
            ref={inputRef}
            className="smart-input"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            rows={input.split('\n').length}
            maxLength={maxLength}
          />

          {/* Quick Actions */}
          <div className="input-actions">
            {enableEmoji && (
              <button 
                className={`action-btn ${showEmojiPicker ? 'active' : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Emoji"
              >
                😊
              </button>
            )}

            {enableVoice && (
              <button 
                className={`action-btn ${isRecording ? 'recording' : ''}`}
                onClick={startVoiceInput}
                title="Sesli Girdi"
              >
                {isRecording ? '🔴' : '🎤'}
              </button>
            )}

            {enableImage && (
              <label className="action-btn" title="Resim Yükle">
                📷
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}

            <button 
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Gönder (Enter)"
            >
              {input.trim() ? '📤' : '💬'}
            </button>
          </div>
        </div>

        {/* Smart Chips - Quick Suggestions */}
        {!input && aiSuggestions.length > 0 && (
          <div className="smart-chips">
            <div className="chips-label">Hızlı sorular:</div>
            <div className="chips-container">
              {aiSuggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-animation">
              <span className="pulse"></span>
              <span className="pulse"></span>
              <span className="pulse"></span>
            </div>
            <span className="recording-text">🎤 Dinliyorum... (Konuşun)</span>
          </div>
        )}

        {/* Helper Text */}
        {!input && !isRecording && (
          <div className="helper-text">
            <span className="helper-icon">💡</span>
            <span>
              Klavye kısayolları: <kbd>Enter</kbd> gönder, <kbd>Shift+Enter</kbd> yeni satır, 
              <kbd>/</kbd> komutlar
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartPromptInput;

