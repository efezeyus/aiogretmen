/**
 * WebSocket Service
 * ----------------
 * Real-time communication service using WebSocket
 */

import { ENV_CONFIG } from '../config/environment';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  /**
   * WebSocket bağlantısı kur
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket zaten bağlı');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket bağlantısı zaten kuruluyor');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = ENV_CONFIG.WS_URL || 'ws://localhost:8000/api/ws';
      const urlWithToken = `${wsUrl}?token=${token}`;
      
      this.ws = new WebSocket(urlWithToken);

      this.ws.onopen = () => {
        console.log('✅ WebSocket bağlantısı kuruldu');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket mesajı alındı:', data);
          
          if (data.type) {
            this.emit(data.type, data);
          }
          this.emit('message', data);
        } catch (error) {
          console.error('❌ WebSocket mesaj parse hatası:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket hatası:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket bağlantısı kapandı');
        this.isConnecting = false;
        this.emit('disconnected');
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error('❌ WebSocket bağlantı hatası:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Yeniden bağlanmayı dene
   */
  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`🔄 ${delay}ms sonra yeniden bağlanılacak (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token);
      }, delay);
    } else {
      console.error('❌ Maksimum yeniden bağlanma denemesi aşıldı');
      this.emit('reconnect_failed');
    }
  }

  /**
   * Mesaj gönder
   */
  send(type, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket bağlantısı yok');
      return false;
    }

    try {
      const message = JSON.stringify({ type, ...data });
      this.ws.send(message);
      console.log('📤 WebSocket mesajı gönderildi:', { type, data });
      return true;
    } catch (error) {
      console.error('❌ WebSocket mesaj gönderme hatası:', error);
      return false;
    }
  }

  /**
   * Event listener ekle
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Event listener kaldır
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Event emit et
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Event callback hatası (${event}):`, error);
      }
    });
  }

  /**
   * Bağlantıyı kapat
   */
  disconnect() {
    if (this.ws) {
      this.reconnectAttempts = this.maxReconnectAttempts; // Yeniden bağlanmayı engelle
      this.ws.close();
      this.ws = null;
      this.listeners.clear();
      console.log('🔌 WebSocket bağlantısı kapatıldı');
    }
  }

  /**
   * Bağlantı durumu
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;

