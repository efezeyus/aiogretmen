import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './AIStudyBuddy.css';

const AIStudyBuddy = ({ studentId }) => {
  const [buddy, setBuddy] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [buddyMood, setBuddyMood] = useState('happy');
  const [showEmotions, setShowEmotions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeBuddy();
  }, [studentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeBuddy = async () => {
    try {
      const response = await api.post('/personalized/buddy/create', null, {
        params: { student_id: studentId }
      });

      if (response.data.success) {
        setBuddy(response.data.buddy);
        setMessages([{
          id: Date.now(),
          type: 'buddy',
          text: response.data.buddy.introduction,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Buddy başlatma hatası:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/personalized/buddy/chat', {
        student_id: studentId,
        message: inputMessage
      });

      if (response.data.success) {
        const buddyMessage = {
          id: Date.now() + 1,
          type: 'buddy',
          text: response.data.response,
          timestamp: new Date(),
          mood: response.data.mood_detected
        };

        setMessages(prev => [...prev, buddyMessage]);
        setBuddyMood(response.data.buddy_state?.happiness > 0.7 ? 'happy' : 'neutral');

        // Özel eylemler
        if (response.data.special_actions?.length > 0) {
          handleSpecialActions(response.data.special_actions);
        }
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpecialActions = (actions) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'celebration':
          showCelebration(action.data);
          break;
        case 'mini_game':
          startMiniGame(action.data);
          break;
        case 'achievement':
          showAchievement(action.data);
          break;
        default:
          break;
      }
    });
  };

  const showCelebration = (data) => {
    // Kutlama animasyonu
    const celebration = document.createElement('div');
    celebration.className = 'celebration-animation';
    celebration.innerHTML = '🎉🎊🎉';
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.remove();
    }, 3000);
  };

  const startMiniGame = (data) => {
    // Mini oyun başlat
    console.log('Mini oyun başlatılıyor:', data);
  };

  const showAchievement = (data) => {
    // Başarı bildirimi
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <h4>Başarı Kazandın!</h4>
        <p>${data.title}</p>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const sendEmotion = async (emotion) => {
    try {
      const response = await api.post('/personalized/buddy/emotional-support', {
        student_id: studentId,
        emotion: emotion
      });

      if (response.data.success) {
        const supportMessage = {
          id: Date.now(),
          type: 'buddy',
          text: response.data.support.support_message,
          timestamp: new Date(),
          isSupport: true
        };

        setMessages(prev => [...prev, supportMessage]);

        // Aktivite önerisi varsa göster
        if (response.data.support.activity) {
          const activityMessage = {
            id: Date.now() + 1,
            type: 'activity',
            data: response.data.support.activity,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, activityMessage]);
        }
      }
    } catch (error) {
      console.error('Duygusal destek hatası:', error);
    }
    
    setShowEmotions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!buddy) {
    return (
      <div className="ai-buddy-loading">
        <div className="loading-spinner">⚡</div>
        <p>AI arkadaşın hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="ai-study-buddy">
      <div className="buddy-header">
        <div className="buddy-avatar">
          <span className="avatar-emoji">{buddy.avatar}</span>
          <span className={`mood-indicator ${buddyMood}`}></span>
        </div>
        <div className="buddy-info">
          <h3>{buddy.name}</h3>
          <p className="buddy-traits">{buddy.personality.join(', ')}</p>
        </div>
        <button 
          className="emotion-btn"
          onClick={() => setShowEmotions(!showEmotions)}
        >
          😊
        </button>
      </div>

      {showEmotions && (
        <div className="emotion-selector">
          <button onClick={() => sendEmotion('happy')}>😊 Mutlu</button>
          <button onClick={() => sendEmotion('sad')}>😢 Üzgün</button>
          <button onClick={() => sendEmotion('anxious')}>😰 Endişeli</button>
          <button onClick={() => sendEmotion('confused')}>😕 Kafam Karışık</button>
          <button onClick={() => sendEmotion('excited')}>🤩 Heyecanlı</button>
          <button onClick={() => sendEmotion('tired')}>😴 Yorgun</button>
        </div>
      )}

      <div className="buddy-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.type === 'buddy' && (
              <div className="message-avatar">{buddy.avatar}</div>
            )}
            
            <div className="message-content">
              {message.type === 'activity' ? (
                <div className="activity-card">
                  <h4>🎯 Aktivite Önerisi</h4>
                  <p>{message.data.description}</p>
                  <button className="activity-btn">Başla</button>
                </div>
              ) : (
                <>
                  <p className={message.isSupport ? 'support-text' : ''}>
                    {message.text}
                  </p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message buddy typing">
            <div className="message-avatar">{buddy.avatar}</div>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="buddy-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`${buddy.name}'e bir şey sor...`}
          rows="1"
        />
        <button 
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className="send-btn"
        >
          📤
        </button>
      </div>
    </div>
  );
};

export default AIStudyBuddy;
