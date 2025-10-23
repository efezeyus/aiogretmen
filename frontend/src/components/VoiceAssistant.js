import React, { useState, useEffect, useRef } from 'react';
import { safeLog } from '../config/environment';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [voiceCommands] = useState([
    { command: 'ders başlat', action: 'start_lesson', description: 'Ders başlatır' },
    { command: 'soru sor', action: 'ask_question', description: 'Soru sorma modunu açar' },
    { command: 'analiz göster', action: 'show_analytics', description: 'Analiz sayfasını açar' },
    { command: 'arkadaşlarım', action: 'show_friends', description: 'Arkadaş listesini gösterir' },
    { command: 'rozetlerim', action: 'show_badges', description: 'Rozetlerinizi gösterir' },
    { command: 'yardım', action: 'help', description: 'Mevcut komutları listeler' }
  ]);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  useEffect(() => {
    // Web Speech API'yi başlat
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        safeLog.info('Sesli tanıma başladı');
      };
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        safeLog.error('Sesli tanıma hatası:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Speech Synthesis API'yi başlat
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        safeLog.error('Ses sentezi hatası:', event);
        setIsSpeaking(false);
      };
      
      synthesisRef.current.speak(utterance);
    }
  };

  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    // Komut eşleştirme
    const matchedCommand = voiceCommands.find(cmd => 
      lowerCommand.includes(cmd.command.toLowerCase())
    );
    
    if (matchedCommand) {
      executeCommand(matchedCommand.action);
    } else {
      // AI'ye gönder
      handleAIQuery(command);
    }
    
    // Konuşma geçmişine ekle
    setConversationHistory(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: command,
      timestamp: new Date()
    }]);
  };

  const executeCommand = (action) => {
    switch (action) {
      case 'start_lesson':
        // Ders başlatma işlemi
        safeLog.info('Ders başlatılıyor...');
        break;
      case 'ask_question':
        // Soru sorma modu
        safeLog.info('Soru sorma modu açılıyor...');
        break;
      case 'show_analytics':
        // Analiz sayfasına yönlendir
        window.location.href = '/student/analytics';
        break;
      case 'show_friends':
        // Arkadaş sayfasına yönlendir
        window.location.href = '/student/social';
        break;
      case 'show_badges':
        // Rozet sayfasına yönlendir
        window.location.href = '/student/gamification';
        break;
      case 'help':
        const helpText = `Mevcut komutlar: ${voiceCommands.map(cmd => cmd.command).join(', ')}`;
        setAiResponse(helpText);
        speak(helpText);
        break;
      default:
        safeLog.warn('Bilinmeyen komut:', action);
    }
  };

  const handleAIQuery = async (question) => {
    try {
      const response = await askAI(question);
      setAiResponse(response);
      speak(response);
      
      // Konuşma geçmişine AI yanıtını ekle
      setConversationHistory(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      safeLog.error('AI yanıt hatası:', error);
      const errorMessage = 'Üzgünüm, şu anda yanıt veremiyorum.';
      setAiResponse(errorMessage);
      speak(errorMessage);
    }
  };

  const askAI = async (question) => {
    // AI servisine soru gönder
    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          question: question,
          context: 'voice_assistant'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response || data.answer || 'Üzgünüm, şu anda yanıt veremiyorum.';
    } catch (error) {
      safeLog.error('AI yanıt hatası:', error);
      return 'Teknik bir sorun oluştu. Lütfen tekrar deneyin.';
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setTranscript('');
    setAiResponse('');
  };

  return (
    <div className="voice-assistant">
      <div className="voice-assistant-header">
        <h3>🎤 Sesli Asistan</h3>
        <button 
          className="btn-clear" 
          onClick={clearConversation}
          title="Konuşma geçmişini temizle"
        >
          🗑️
        </button>
      </div>

      <div className="voice-controls">
        <button
          className={`btn-voice ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={isSpeaking}
        >
          {isListening ? '🔴 Dinliyor...' : '🎤 Dinle'}
        </button>

        <button
          className="btn-voice"
          onClick={() => window.speechSynthesis.cancel()}
          disabled={!isSpeaking}
        >
          🔇 Sustur
        </button>
      </div>

      {transcript && (
        <div className="transcript">
          <strong>Sen:</strong> {transcript}
        </div>
      )}

      {aiResponse && (
        <div className="ai-response">
          <strong>AI Öğretmen:</strong> {aiResponse}
        </div>
      )}

      <div className="voice-commands">
        <h4>📝 Kullanabileceğin Komutlar:</h4>
        <ul>
          {voiceCommands.map((cmd, index) => (
            <li key={index}>
              <strong>"{cmd.command}"</strong> - {cmd.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="conversation-history">
        <h4>💬 Konuşma Geçmişi:</h4>
        <div className="history-list">
          {conversationHistory.slice(-5).map(item => (
            <div key={item.id} className={`history-item ${item.type}`}>
              <span className="history-time">
                {item.timestamp.toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              <span className="history-text">
                <strong>{item.type === 'user' ? 'Sen' : 'AI'}:</strong> {typeof item.text === 'string' ? item.text : JSON.stringify(item.text)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant; 