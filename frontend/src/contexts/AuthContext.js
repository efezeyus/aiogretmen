import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { login: authLogin, logout: authLogout, updateProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Session restore error:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // TEMPORARY: Mock authentication for admin
      if (email === 'admin@yapayzekaogretmen.com' && password === 'admin123') {
        const mockUser = {
          id: '1',
          email: email,
          full_name: 'Sistem Yöneticisi',
          role: 'admin',
          is_active: true
        };
        
        const mockToken = 'mock-admin-token-' + Date.now();
        
        // Tüm gerekli verileri kaydet (useAuth.js checkAuthStatus ile uyumlu)
        localStorage.setItem('token', mockToken);
        localStorage.setItem('authToken', mockToken);  // ← useAuth için
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userName', 'Sistem Yöneticisi');
        localStorage.setItem('userId', '1');
        localStorage.setItem('userEmail', email);
        
        setUser(mockUser);
        
        // LoginPage navigate'i halledecek
        return { success: true, user: mockUser };
      }

      // TEMPORARY: Mock authentication for students
      const studentAccounts = {
        'ahmet.yilmaz@okul.com': { id: '2', name: 'Ahmet Yılmaz', grade: 5 },
        'murat@okul.com': { id: '3', name: 'Murat Ustaalioglu', grade: 6 },
        'ayse.kara@okul.com': { id: '4', name: 'Ayşe Kara', grade: 5 },
        'mehmet.demir@okul.com': { id: '5', name: 'Mehmet Demir', grade: 9 },
        'zeynep.sahin@okul.com': { id: '6', name: 'Zeynep Şahin', grade: 1 }
      };

      if (studentAccounts[email] && password === '123456') {
        const studentInfo = studentAccounts[email];
        const mockUser = {
          id: studentInfo.id,
          email: email,
          full_name: studentInfo.name,
          name: studentInfo.name,
          role: 'student',
          grade: `${studentInfo.grade}. Sınıf`,
          is_active: true
        };
        
        const mockToken = 'mock-student-token-' + Date.now();
        
        // Tüm gerekli verileri kaydet (useAuth.js checkAuthStatus ile uyumlu)
        localStorage.setItem('token', mockToken);
        localStorage.setItem('authToken', mockToken);  // ← useAuth için
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('userType', 'student');
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('userName', studentInfo.name);
        localStorage.setItem('userId', studentInfo.id);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userGrade', studentInfo.grade.toString());
        
        setUser(mockUser);
        
        // LoginPage navigate'i halledecek
        return { success: true, user: mockUser };
      }

      // If not mock users, try real backend
      const result = await authLogin(email, password);
      
      if (result.success) {
        setUser(result.user);
        // LoginPage navigate'i halledecek
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.' 
      };
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const result = await updateProfile(updates);
      if (result.success) {
        setUser(prevUser => ({ ...prevUser, ...updates }));
        localStorage.setItem('user', JSON.stringify({ ...user, ...updates }));
      }
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Profil güncellenemedi' };
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUserProfile,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
