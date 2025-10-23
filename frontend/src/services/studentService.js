import apiService from './api';

const studentService = {
  // İçerik yükleme
  uploadContent: async (files, metadata) => {
    try {
      const formData = new FormData();
      
      // Dosyaları ekle
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Metadata'yı JSON string olarak ekle
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await apiService.upload('/student-content/upload', formData, (progress) => {
        console.log(`Upload Progress: ${progress}%`);
      });
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İçerik yükleme başarısız'
      };
    }
  },

  // Öğrenci içeriklerini getir
  getMyContent: async (params = {}) => {
    try {
      const response = await apiService.get('/student-content/my-content', params);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İçerikler getirilemedi'
      };
    }
  },

  // Belirli bir içeriği getir
  getContent: async (contentId) => {
    try {
      const response = await apiService.get(`/student-content/content/${contentId}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İçerik getirilemedi'
      };
    }
  },

  // İçerik güncelle
  updateContent: async (contentId, updateData) => {
    try {
      const formData = new FormData();
      
      Object.keys(updateData).forEach(key => {
        if (key === 'tags' && Array.isArray(updateData[key])) {
          formData.append(key, JSON.stringify(updateData[key]));
        } else {
          formData.append(key, updateData[key]);
        }
      });
      
      const response = await apiService.put(`/student-content/content/${contentId}`, formData);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İçerik güncellenemedi'
      };
    }
  },

  // İçerik sil
  deleteContent: async (contentId) => {
    try {
      const response = await apiService.delete(`/student-content/content/${contentId}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İçerik silinemedi'
      };
    }
  },

  // Kategorileri getir
  getCategories: async () => {
    try {
      const response = await apiService.get('/student-content/categories');
      return {
        success: true,
        data: response.categories
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Kategoriler getirilemedi'
      };
    }
  },

  // Dersleri getir
  getSubjects: async () => {
    try {
      const response = await apiService.get('/student-content/subjects');
      return {
        success: true,
        data: response.subjects
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dersler getirilemedi'
      };
    }
  },

  // İstatistikleri getir
  getStats: async () => {
    try {
      const response = await apiService.get('/student-content/stats');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İstatistikler getirilemedi'
      };
    }
  },

  // Ders programını getir
  getSchedule: async () => {
    try {
      const response = await apiService.get('/student/schedule');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Ders programı getirilemedi'
      };
    }
  },

  // Öğrenme ilerlemesini getir
  getLearningProgress: async (subject = null) => {
    try {
      const params = subject ? { subject } : {};
      const response = await apiService.get('/student/progress', params);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İlerleme bilgisi getirilemedi'
      };
    }
  },

  // Quiz sonuçlarını getir
  getQuizResults: async (limit = 10) => {
    try {
      const response = await apiService.get('/student/quiz-results', { limit });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Quiz sonuçları getirilemedi'
      };
    }
  }
};

export default studentService; 