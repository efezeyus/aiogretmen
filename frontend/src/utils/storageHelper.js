// Storage Helper - Chrome uyumluluğu için güvenli storage erişimi

export const safeStorage = {
  setItem: (key, value, useLocal = false) => {
    try {
      const storage = useLocal ? localStorage : sessionStorage;
      storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Storage setItem failed for key ${key}:`, error);
      // Fallback to memory storage
      window.__tempStorage = window.__tempStorage || {};
      window.__tempStorage[key] = value;
      return false;
    }
  },

  getItem: (key, useLocal = false) => {
    try {
      const storage = useLocal ? localStorage : sessionStorage;
      return storage.getItem(key);
    } catch (error) {
      console.warn(`Storage getItem failed for key ${key}:`, error);
      // Fallback to memory storage
      return window.__tempStorage?.[key] || null;
    }
  },

  removeItem: (key, useLocal = false) => {
    try {
      const storage = useLocal ? localStorage : sessionStorage;
      storage.removeItem(key);
    } catch (error) {
      console.warn(`Storage removeItem failed for key ${key}:`, error);
      // Fallback to memory storage
      if (window.__tempStorage) {
        delete window.__tempStorage[key];
      }
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.warn('Storage clear failed:', error);
    }
    window.__tempStorage = {};
  },

  // Chrome özel kontrol
  isStorageAvailable: () => {
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
};

export default safeStorage;
