import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    console.log('🔍 Form field changed:', e.target.name, '=', e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔍 Form submit - formData:', formData);
    console.log('🔍 Email:', formData.email);
    console.log('🔍 Password:', formData.password);

    try {
      console.log('🔍 Calling login function...');
      // useAuth hook'unu kullan
      const result = await login(formData.email, formData.password);
      console.log('🔍 Login result:', result);
      
      if (result.success) {
        console.log('🔍 Login successful!');
        console.log('🔍 User data:', result.user);
        console.log('🔍 User role:', result.user.role);
        
        // Login başarılı - Hard redirect kullan (daha garantili)
        const user = result.user;
        
        // Role'e göre yönlendirme
        let redirectPath = '/student/dashboard';
        
        if (user.role === 'student') {
          redirectPath = '/student/dashboard';
          console.log('🔍 Redirecting to student dashboard...');
        } else if (user.role === 'teacher') {
          redirectPath = '/teacher/dashboard';
          console.log('🔍 Redirecting to teacher dashboard...');
        } else if (user.role === 'parent') {
          redirectPath = '/parent/dashboard';
          console.log('🔍 Redirecting to parent dashboard...');
        } else if (user.role === 'admin') {
          redirectPath = '/admin';
          console.log('🔍 Redirecting to admin dashboard...');
        }
        
        console.log('🔍 Final redirect path:', redirectPath);
        
        // Hard redirect - state update beklemeden
        window.location.href = redirectPath;
      } else {
        console.log('🔍 Login failed:', result.error);
        setError(result.error || 'E-posta veya şifre hatalı!');
      }
    } catch (error) {
      console.error('🔍 Login error:', error);
      setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <Link to="/" className="back-home">
            ← Ana Sayfaya Dön
          </Link>
          
          <div className="login-content">
            <h1>Hoş Geldiniz!</h1>
            <p>Öğrenme yolculuğunuza devam edin</p>
            
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  {typeof error === 'string'
                    ? error
                    : Array.isArray(error)
                      ? error.map((e, i) => (
                          <div key={i}>
                            {typeof e === 'string'
                              ? e
                              : e.msg
                                ? e.msg
                                : JSON.stringify(e)}
                          </div>
                        ))
                      : error.message
                        ? (typeof error.message === 'string'
                            ? error.message
                            : JSON.stringify(error.message))
                        : JSON.stringify(error)
                  }
                </div>
              )}
              
              <div className="form-group">
                <label>E-posta Adresi</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Şifre</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Beni hatırla</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Şifremi unuttum
                </Link>
              </div>
              
              <button 
                type="submit" 
                className="btn-login-submit"
                disabled={loading}
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
            
            <div className="login-divider">
              <span>veya</span>
            </div>
            
            <div className="demo-accounts">
              <h4>Demo Hesaplar:</h4>
              <div className="demo-account">
                <strong>Öğrenci:</strong>
                <p>Email: ahmet.yilmaz@okul.com</p>
                <p>Şifre: test123</p>
              </div>
              <div className="demo-account">
                <strong>Veli:</strong>
                <p>Email: veli.yilmaz@email.com</p>
                <p>Şifre: veli123</p>
              </div>
              <div className="demo-account admin-demo">
                <strong>🛡️ Admin:</strong>
                <p>Email: admin@yapayzekaogretmen.com</p>
                <p>Şifre: admin / admin123 / 123456</p>
              </div>
            </div>
            
            <div className="register-link">
              Henüz hesabınız yok mu? 
              <Link to="/register"> Ücretsiz kayıt olun</Link>
            </div>
          </div>
        </div>
        
        <div className="login-right">
          <div className="login-features">
            <h2>Yapay Zeka Öğretmen ile</h2>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <h4>Kişiselleştirilmiş Öğrenme</h4>
                  <p>Her öğrenciye özel eğitim programı</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h4>Anlık İlerleme Takibi</h4>
                  <p>Başarıyı gerçek zamanlı izleyin</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏆</span>
                <div>
                  <h4>Ödüllü Öğrenme</h4>
                  <p>Rozetler ve başarı sertifikaları</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <div>
                  <h4>7/24 AI Desteği</h4>
                  <p>Her zaman yanınızda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 