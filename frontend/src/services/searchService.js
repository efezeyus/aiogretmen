/**
 * Search Service - Elasticsearch Integration
 * ------------------------------------------
 * Frontend search service for Elasticsearch integration
 */

import apiService from './api';

const searchService = {
  /**
   * Global arama (tüm index'lerde)
   */
  async globalSearch(query, options = {}) {
    try {
      const params = {
        query,
        size: options.limit || 10,
        from: options.offset || 0,
        highlight: options.highlight !== false,
        fuzzy: options.fuzzy !== false,
      };

      if (options.filters) {
        params.filters = JSON.stringify(options.filters);
      }

      const response = await apiService.get('/search/global', params);
      return {
        success: true,
        data: response.hits || [],
        total: response.total || 0,
        aggregations: response.aggregations || {},
        took: response.took || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Arama işlemi başarısız oldu',
        data: []
      };
    }
  },

  /**
   * Ders arama
   */
  async searchLessons(query, filters = {}) {
    try {
      const params = { query, ...filters };
      const response = await apiService.get('/search/lessons', params);
      return {
        success: true,
        data: response.hits || [],
        total: response.total || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Kullanıcı arama
   */
  async searchUsers(query, filters = {}) {
    try {
      const params = { query, ...filters };
      const response = await apiService.get('/search/users', params);
      return {
        success: true,
        data: response.hits || [],
        total: response.total || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Soru arama
   */
  async searchQuestions(query, filters = {}) {
    try {
      const params = { query, ...filters };
      const response = await apiService.get('/search/questions', params);
      return {
        success: true,
        data: response.hits || [],
        total: response.total || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Otomatik tamamlama
   */
  async autocomplete(prefix, type = 'lessons') {
    try {
      const params = { prefix, type };
      const response = await apiService.get('/search/autocomplete', params);
      return {
        success: true,
        suggestions: response.suggestions || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  },

  /**
   * Benzer içerikler
   */
  async findSimilar(documentId, type, limit = 5) {
    try {
      const params = { doc_id: documentId, type, limit };
      const response = await apiService.get('/search/similar', params);
      return {
        success: true,
        data: response.similar || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
};

export default searchService;

