import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { safeLog } from '../config/environment';
import { safeStorage } from '../utils/storageHelper';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(() => {
    try {
      const userType = safeStorage.getItem('userType', true) || safeStorage.getItem('userType', false);
      const userRole = safeStorage.getItem('userRole', true) || safeStorage.getItem('userRole', false);
      const userName = safeStorage.getItem('userName', true) || safeStorage.getItem('userName', false);
      const token = safeStorage.getItem('authToken', true) || safeStorage.getItem('authToken', false);

      // Chrome storage debug
      console.log('🔍 Storage availability:', safeStorage.isStorageAvailable());
      console.log('🔍 Checking auth status:', { userType, userRole, userName, token: token ? 'exists' : 'missing' });

      if (userType && userRole && userName && token) {
        // Basit token kontrolü - JWT parse etmeye çalışma
        if (token && token.length > 0) {
          const userData = {
            type: userType,
            role: userRole,
            name: userName,
            token: token
          };
          setUser(userData);
          setIsAuthenticated(true);
          console.log('🔍 Auth status: Authenticated', userData);
        } else {
          // Token geçersiz, auth data'yı temizle
          console.log('🔍 Auth status: Invalid token, clearing data');
          // clearAuthData'yı burada çağırmak yerine manuel olarak temizle
          ['userType', 'userRole', 'userName', 'authToken', 'refreshToken', 'userEmail', 'userId'].forEach(key => {
            safeStorage.removeItem(key, true);
            safeStorage.removeItem(key, false);
          });
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('🔍 Auth status: Not authenticated');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('🔍 Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []); // clearAuthData dependency'sini kaldırdık

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const clearAuthData = useCallback(() => {
    console.log('🔍 Clearing auth data');
    // Clear both localStorage and sessionStorage
    ['userType', 'userRole', 'userName', 'authToken', 'refreshToken', 'userEmail', 'userId'].forEach(key => {
      safeStorage.removeItem(key, true);
      safeStorage.removeItem(key, false);
    });
    // Also clear the full storage in case of any issues
    safeStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    try {
      console.log('🔍 Login attempt:', email);
      
      // TEMPORARY MOCK AUTHENTICATION - Backend çalışmadığı için
      if (email === 'admin@yapayzekaogretmen.com' && password === 'admin123') {
        console.log('🔍 Using mock authentication for admin');
        
        const userData = {
          type: 'admin',
          role: 'admin',
          name: 'Sistem Yöneticisi',
          email: email,
          id: '1',
          token: 'mock-admin-token-' + Date.now()
        };

        // Store based on remember me preference
        safeStorage.setItem('userType', userData.type, rememberMe);
        safeStorage.setItem('userRole', userData.role, rememberMe);
        safeStorage.setItem('userName', userData.name, rememberMe);
        safeStorage.setItem('authToken', userData.token, rememberMe);
        safeStorage.setItem('userEmail', userData.email, rememberMe);
        safeStorage.setItem('userId', userData.id, rememberMe);

        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);

        console.log('🔍 Mock login successful:', userData);
        return { success: true, user: userData };
      }
      
      // MOCK AUTHENTICATION - TÜM ÖĞRENCİLER
      const studentAccounts = {
        'ahmet.yilmaz@okul.com': { id: '2', name: 'Ahmet Yılmaz', grade: 5 },
        'murat@okul.com': { id: '3', name: 'Murat Ustaalioglu', grade: 6 },
        'ayse.kara@okul.com': { id: '4', name: 'Ayşe Kara', grade: 5 },
        'mehmet.demir@okul.com': { id: '5', name: 'Mehmet Demir', grade: 9 },
        'zeynep.sahin@okul.com': { id: '6', name: 'Zeynep Şahin', grade: 1 }
      };

      if (studentAccounts[email] && password === '123456') {
        console.log('🔍 Using mock authentication for student');
        
        const studentInfo = studentAccounts[email];
        const userData = {
          type: 'student',
          role: 'student',
          name: studentInfo.name,
          email: email,
          id: studentInfo.id,
          grade: studentInfo.grade,
          token: 'mock-student-token-' + Date.now()
        };

        // Store based on remember me preference
        safeStorage.setItem('userType', userData.type, rememberMe);
        safeStorage.setItem('userRole', userData.role, rememberMe);
        safeStorage.setItem('userName', userData.name, rememberMe);
        safeStorage.setItem('authToken', userData.token, rememberMe);
        safeStorage.setItem('userEmail', userData.email, rememberMe);
        safeStorage.setItem('userId', userData.id, rememberMe);
        safeStorage.setItem('userGrade', studentInfo.grade.toString(), rememberMe);

        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);

        console.log('🔍 Mock login successful:', userData);
        return { success: true, user: userData };
      }
      
      // Backend API'yi kullan (şu an çalışmıyor)
      const response = await fetch('http://localhost:8000/api/auth_simple/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // credentials kaldırıldı - token zaten response'ta geliyor
        mode: 'cors', // CORS modunu açık belirt
        body: JSON.stringify({ email, password })
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);

      const data = await response.json();
      console.log('🔍 Login response:', data);

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Giriş başarısız');
      }

      if (data.success && data.user) {
        const userData = {
          type: data.user.role,
          role: data.user.role,
          name: data.user.full_name,
          email: data.user.email,
          id: data.user.id,
          token: data.token
        };

        // Store based on remember me preference
        safeStorage.setItem('userType', userData.type, rememberMe);
        safeStorage.setItem('userRole', userData.role, rememberMe);
        safeStorage.setItem('userName', userData.name, rememberMe);
        safeStorage.setItem('authToken', userData.token, rememberMe);
        safeStorage.setItem('userEmail', userData.email, rememberMe);
        safeStorage.setItem('userId', userData.id, rememberMe);

        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);

        console.log('🔍 Login successful:', userData);
        return { success: true, user: userData };
      } else {
        throw new Error('Giriş başarısız - geçersiz yanıt');
      }
    } catch (error) {
      console.error('🔍 Login error:', error);
      setLoading(false);
      
      // Network hatalarını daha iyi yönet
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.' };
      }
      
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    clearAuthData();
    
    // Clear any ongoing timers or processes
    if (window.logoutTimer) {
      clearTimeout(window.logoutTimer);
    }
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    return requiredRoles.includes(user?.role);
  };

  const refreshAuth = async () => {
    try {
      // In a real app, this would call the refresh token endpoint
      const refreshToken = safeStorage.getItem('refreshToken', true) || safeStorage.getItem('refreshToken', false);
      if (refreshToken) {
        // Simulate refresh token API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update token and continue session
        const newToken = generateMockToken(user.role, user.email);
        const isLocal = safeStorage.getItem('authToken', true) !== null;
        safeStorage.setItem('authToken', newToken, isLocal);
        
        setUser(prev => ({ ...prev, token: newToken }));
        return true;
      }
      return false;
    } catch (error) {
      safeLog.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Mock token generator for testing
  const generateMockToken = (role, email) => {
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({
      sub: email,
      role: role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    refreshAuth,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth; 