import apiService from './api';
import { ENV_CONFIG } from '../config/environment';

// Secure token storage utility
const tokenStorage = {
  setItem: (key, value) => {
    if (ENV_CONFIG.SECURITY.TOKEN_STORAGE === 'sessionStorage') {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  },
  getItem: (key) => {
    if (ENV_CONFIG.SECURITY.TOKEN_STORAGE === 'sessionStorage') {
      return sessionStorage.getItem(key);
    } else {
      return localStorage.getItem(key);
    }
  },
  removeItem: (key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key); // Clear both for safety
  },
  clear: () => {
    sessionStorage.clear();
    localStorage.clear();
  }
};

const authService = {
  // Giriş yap
  login: async (email, password, rememberMe = false) => {
    try {
      const response = await apiService.post('/auth_simple/login', {
        email: email, // API email bekliyor
        password: password
      });

      // Token'ları güvenli şekilde kaydet
      if (response.token) {
        tokenStorage.setItem('authToken', response.token);
        tokenStorage.setItem('tokenType', 'Bearer');
        
        // Remember me özelliği
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('authToken', response.token);
        } else {
          localStorage.removeItem('rememberMe');
        }
      }

      // Kullanıcı bilgilerini al (response'dan direkt kullan)
      const userInfo = response.user || null;
      
      // Auto-logout timer başlat
      if (typeof window !== 'undefined' && ENV_CONFIG.SECURITY.AUTO_LOGOUT_MINUTES > 0) {
        authService.setupAutoLogout();
      }
      
      return {
        success: true,
        user: userInfo,
        token: response.token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Giriş başarısız'
      };
    }
  },

  // Kayıt ol
  register: async (userData) => {
    try {
      // Şifre güvenlik kontrolü
      if (!authService.validatePasswordStrength(userData.password)) {
        throw new Error('Şifre en az 8 karakter olmalı ve büyük harf, küçük harf, rakam içermelidir');
      }
      
      const response = await apiService.post('/auth/register', userData);
      
      // Kayıt sonrası otomatik giriş
      if (response.access_token) {
        tokenStorage.setItem('authToken', response.access_token);
        if (response.refresh_token) {
          tokenStorage.setItem('refreshToken', response.refresh_token);
        }
      }
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Kayıt başarısız'
      };
    }
  },

  // Çıkış yap
  logout: async () => {
    try {
      // Backend'e logout isteği gönder
      await apiService.post('/auth/logout');
    } catch (error) {
      if (ENV_CONFIG.CONSOLE_LOGGING) {
        console.error('Logout error:', error);
      }
    } finally {
      // Token storage'ı temizle
      tokenStorage.clear();
      
      // Auto-logout timer'ı temizle
      if (authService.logoutTimer) {
        clearTimeout(authService.logoutTimer);
      }
      
      // Ana sayfaya yönlendir
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  },

  // Mevcut kullanıcı bilgilerini al
  getCurrentUser: async () => {
    try {
      const response = await apiService.get('/me');
      
      // Session storage'a kaydet (güvenli bilgiler)
      if (response) {
        tokenStorage.setItem('userType', response.role);
        tokenStorage.setItem('userRole', response.role);
        tokenStorage.setItem('userName', response.name);
        tokenStorage.setItem('userEmail', response.email);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Token yenile
  refreshToken: async () => {
    try {
      const refreshToken = tokenStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      if (response.access_token) {
        tokenStorage.setItem('authToken', response.access_token);
        if (response.refresh_token) {
          tokenStorage.setItem('refreshToken', response.refresh_token);
        }
      }

      return response;
    } catch (error) {
      // Token yenileme başarısız - logout
      await authService.logout();
      throw error;
    }
  },

  // Şifre güvenlik kontrolü
  validatePasswordStrength: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
  },

  // Auto-logout setup
  setupAutoLogout: () => {
    if (authService.logoutTimer) {
      clearTimeout(authService.logoutTimer);
    }
    
    const logoutTime = ENV_CONFIG.SECURITY.AUTO_LOGOUT_MINUTES * 60 * 1000;
    authService.logoutTimer = setTimeout(() => {
      authService.logout();
    }, logoutTime);
  },

  // Token kontrolü
  isAuthenticated: () => {
    const token = tokenStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      // Token expiry check (basic)
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return tokenData.exp > currentTime;
    } catch {
      return false;
    }
  },

  // Kullanıcı rolü kontrolü
  hasRole: (role) => {
    const userRole = tokenStorage.getItem('userRole');
    return userRole === role;
  },

  // Kullanıcı rolleri kontrolü (çoklu)
  hasAnyRole: (roles) => {
    const userRole = tokenStorage.getItem('userRole');
    return roles.includes(userRole);
  },

  // CSRF token alma
  getCSRFToken: async () => {
    if (!ENV_CONFIG.SECURITY.CSRF_PROTECTION) return null;
    
    try {
      const response = await apiService.get('/auth/csrf-token');
      return response.csrf_token;
    } catch (error) {
      if (ENV_CONFIG.CONSOLE_LOGGING) {
        console.error('CSRF token alma hatası:', error);
      }
      return null;
    }
  },

  // Session validation
  validateSession: async () => {
    try {
      const response = await apiService.get('/auth/validate-session');
      return response.valid;
    } catch (error) {
      return false;
    }
  },

  // Şifre sıfırlama isteği
  requestPasswordReset: async (email) => {
    try {
      const response = await apiService.post('/auth/password-reset/request', {
        email: email
      });
      
      return {
        success: true,
        message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Şifre sıfırlama isteği başarısız'
      };
    }
  },

  // Şifre sıfırlama
  resetPassword: async (token, newPassword) => {
    try {
      if (!authService.validatePasswordStrength(newPassword)) {
        throw new Error('Şifre en az 8 karakter olmalı ve büyük harf, küçük harf, rakam içermelidir');
      }
      
      const response = await apiService.post('/auth/password-reset/confirm', {
        token: token,
        new_password: newPassword
      });
      
      return {
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Şifre sıfırlama başarısız'
      };
    }
  },

  // Email doğrulama
  verifyEmail: async (token) => {
    try {
      const response = await apiService.post('/auth/verify-email', {
        token: token
      });
      
      return {
        success: true,
        message: 'Email adresiniz doğrulandı'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Email doğrulama başarısız'
      };
    }
  }
};

export default authService; 