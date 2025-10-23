// Environment Configuration - Security Enhanced
const config = {
  development: {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000/ws',
    DEBUG_MODE: true,
    MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
    ENABLE_DEV_TOOLS: true,
    CONSOLE_LOGGING: true,
    ERROR_REPORTING: false,
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || 'https://api.yapayzekaogretmen.com/api',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.yapayzekaogretmen.com/ws',
    DEBUG_MODE: false,
    MOCK_API: false,
    ENABLE_DEV_TOOLS: false,
    CONSOLE_LOGGING: false,
    ERROR_REPORTING: true,
  },
  staging: {
    API_URL: process.env.REACT_APP_API_URL || 'https://staging-api.yapayzekaogretmen.com/api',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://staging-api.yapayzekaogretmen.com/ws',
    DEBUG_MODE: false,
    MOCK_API: false,
    ENABLE_DEV_TOOLS: true,
    CONSOLE_LOGGING: true,
    ERROR_REPORTING: true,
  },
  test: {
    API_URL: 'http://localhost:3001/api',
    WEBSOCKET_URL: 'ws://localhost:3001/ws',
    DEBUG_MODE: true,
    MOCK_API: true,
    ENABLE_DEV_TOOLS: true,
    CONSOLE_LOGGING: true,
    ERROR_REPORTING: false,
  }
};

const environment = process.env.NODE_ENV || 'development';

// Security validation for production
if (environment === 'production') {
  // Ensure HTTPS in production
  if (config.production.API_URL.startsWith('http:')) {
    console.warn('⚠️ Production API URL should use HTTPS');
  }
  
  // Disable dev tools in production
  if (typeof window !== 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  }
}

export const ENV_CONFIG = {
  ...config[environment],
  ENVIRONMENT: environment,
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  BUILD_DATE: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  
  // Feature Flags
  FEATURES: {
    VOICE: process.env.REACT_APP_ENABLE_VOICE_FEATURES !== 'false',
    SOCIAL: process.env.REACT_APP_ENABLE_SOCIAL_FEATURES !== 'false',
    GAMIFICATION: process.env.REACT_APP_ENABLE_GAMIFICATION !== 'false',
    ADMIN_PANEL: process.env.REACT_APP_ENABLE_ADMIN_PANEL !== 'false',
    FILE_UPLOAD: process.env.REACT_APP_ENABLE_FILE_UPLOAD !== 'false',
  },
  
  // UI Configuration
  UI: {
    THEME: process.env.REACT_APP_THEME || 'light',
    LANGUAGE: process.env.REACT_APP_LANGUAGE || 'tr',
    TIMEZONE: process.env.REACT_APP_TIMEZONE || 'Europe/Istanbul',
    ANIMATIONS: process.env.REACT_APP_ANIMATIONS !== 'false',
  },
  
  // Performance & Security
  PERFORMANCE: {
    CACHE_DURATION: parseInt(process.env.REACT_APP_CACHE_DURATION) || 300,
    MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 10485760, // 10MB
    REQUEST_TIMEOUT: parseInt(process.env.REACT_APP_REQUEST_TIMEOUT) || 30000,
    RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_RETRY_ATTEMPTS) || 3,
  },
  
  // Security Settings
  SECURITY: {
    TOKEN_STORAGE: 'sessionStorage', // Use sessionStorage instead of localStorage for better security
    AUTO_LOGOUT_MINUTES: parseInt(process.env.REACT_APP_AUTO_LOGOUT_MINUTES) || 60,
    CSRF_PROTECTION: process.env.REACT_APP_CSRF_PROTECTION !== 'false',
    XSS_PROTECTION: true,
  },
  
  // External Services
  EXTERNAL: {
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    FACEBOOK_APP_ID: process.env.REACT_APP_FACEBOOK_APP_ID,
    GOOGLE_ANALYTICS_ID: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
  },
  
  // Monitoring
  MONITORING: {
    ERROR_TRACKING: environment === 'production' || environment === 'staging',
    PERFORMANCE_TRACKING: environment !== 'development',
    USER_ANALYTICS: environment === 'production',
  }
};

// Utility functions
export const isProduction = () => environment === 'production';
export const isDevelopment = () => environment === 'development';
export const isStaging = () => environment === 'staging';
export const isTest = () => environment === 'test';

export const getApiUrl = (endpoint = '') => {
  const baseUrl = ENV_CONFIG.API_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
};

export const getWebSocketUrl = (endpoint = '') => {
  const baseUrl = ENV_CONFIG.WEBSOCKET_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
};

// Safe console logging
export const safeLog = {
  log: (...args) => {
    if (ENV_CONFIG.CONSOLE_LOGGING) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (ENV_CONFIG.CONSOLE_LOGGING) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (ENV_CONFIG.CONSOLE_LOGGING) {
      console.error(...args);
    }
  },
  info: (...args) => {
    if (ENV_CONFIG.CONSOLE_LOGGING) {
      console.info(...args);
    }
  }
};

// Configuration logging (only in development)
export const logConfig = () => {
  if (isDevelopment() && ENV_CONFIG.CONSOLE_LOGGING) {
    console.group('🔧 Environment Configuration');
    console.log('Environment:', ENV_CONFIG.ENVIRONMENT);
    console.log('Version:', ENV_CONFIG.VERSION);
    console.log('API URL:', ENV_CONFIG.API_URL);
    console.log('Features:', ENV_CONFIG.FEATURES);
    console.log('Debug Mode:', ENV_CONFIG.DEBUG_MODE);
    console.log('Performance Settings:', ENV_CONFIG.PERFORMANCE);
    console.groupEnd();
  }
};

// Auto-logout implementation
export const setupAutoLogout = () => {
  if (ENV_CONFIG.SECURITY.AUTO_LOGOUT_MINUTES > 0) {
    let timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Trigger logout
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }, ENV_CONFIG.SECURITY.AUTO_LOGOUT_MINUTES * 60 * 1000);
    };
    
    // Reset timeout on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetTimeout, true);
    });
    
    resetTimeout();
  }
};

export default ENV_CONFIG; 