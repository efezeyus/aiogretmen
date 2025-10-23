import axios from 'axios';
import { ENV_CONFIG, getApiUrl } from '../config/environment';

// Debug: Environment config kontrol
console.log('🔍 ENV_CONFIG.API_URL:', ENV_CONFIG.API_URL);
console.log('🔍 Full ENV_CONFIG:', ENV_CONFIG);

// Axios instance oluştur
const api = axios.create({
  baseURL: ENV_CONFIG.API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug mode ve development ise log at
    if (ENV_CONFIG.DEBUG_MODE && process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      console.log('📋 Request Data:', config.data);
      console.log('🌐 Base URL:', config.baseURL);
      console.log('🔗 Full URL:', `${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi
api.interceptors.response.use(
  (response) => {
    // Debug mode ve development ise log at
    if (ENV_CONFIG.DEBUG_MODE && process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    }
    
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Token yenileme
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(getApiUrl('/auth/refresh'), {
            refresh_token: refreshToken
          });
          
          localStorage.setItem('authToken', response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem('refreshToken', response.data.refresh_token);
          }
          
          // Yeni token ile tekrar dene
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Token yenileme başarısız - logout
        localStorage.clear();
        if (typeof window !== 'undefined') {
        window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Hata mesajını format et
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.message || 
                        'Bir hata oluştu';
    
    // Production'da sadece error level loglar
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url, errorMessage);
    }
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// API metodları
const apiService = {
  // GET request
  get: (url, params = {}) => api.get(url, { params }),
  
  // POST request
  post: (url, data = {}) => api.post(url, data),
  
  // PUT request
  put: (url, data = {}) => api.put(url, data),
  
  // PATCH request
  patch: (url, data = {}) => api.patch(url, data),
  
  // DELETE request
  delete: (url) => api.delete(url),
  
  // File upload
  upload: (url, formData, onProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
      timeout: 60000 // File upload için daha uzun timeout
    });
  },
  
  // File download
  download: async (url, filename) => {
    try {
      const response = await api.get(url, { 
        responseType: 'blob',
        timeout: 60000 
      });
      
      const blob = new Blob([response]);
      const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
      link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default apiService; 