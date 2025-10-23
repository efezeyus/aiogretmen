import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ContactPage.css';

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    message: '',
    type: 'school' // 'school' | 'individual' | 'other'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Gerçek uygulamada backend'e gönder
    console.log('İletişim formu gönderildi:', formData);
    
    // Email gönderme simülasyonu
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="contact-page">
        <nav className="landing-nav">
          <div className="nav-container">
            <div className="logo" onClick={() => navigate('/')}>
              <span className="logo-icon">🎓</span>
              <span className="logo-text">AI Öğretmen</span>
            </div>
          </div>
        </nav>

        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Mesajınız Alındı!</h2>
          <p>
            En kısa sürede size geri dönüş yapacağız.
            <br />
            Teşekkür ederiz!
          </p>
          <button className="btn-home" onClick={() => navigate('/')}>
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-icon">🎓</span>
            <span className="logo-text">AI Öğretmen</span>
          </div>
          <div className="nav-actions">
            <button className="btn-login" onClick={() => navigate('/login')}>Giriş Yap</button>
            <button className="btn-register" onClick={() => navigate('/register')}>Kayıt Ol</button>
          </div>
        </div>
      </nav>

      <section className="contact-hero">
        <h1>İletişim</h1>
        <p>Size nasıl yardımcı olabiliriz?</p>
      </section>

      <section className="contact-content">
        <div className="contact-container">
          <div className="contact-info">
            <h2>📞 İletişim Bilgileri</h2>
            
            <div className="info-card">
              <div className="info-icon">📧</div>
              <div className="info-details">
                <h4>Email</h4>
                <p>info@aiogretmen.com</p>
                <p>destek@aiogretmen.com</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📱</div>
              <div className="info-details">
                <h4>Telefon</h4>
                <p>0850 XXX XX XX</p>
                <p>Hafta içi 09:00 - 18:00</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-details">
                <h4>Adres</h4>
                <p>Teknokent, Ankara</p>
                <p>Türkiye</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⏰</div>
              <div className="info-details">
                <h4>Çalışma Saatleri</h4>
                <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                <p>Cumartesi: 10:00 - 15:00</p>
              </div>
            </div>
          </div>

          <div className="contact-form-container">
            <h2>✉️ Bize Yazın</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ad Soyad *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="ornek@email.com"
                />
              </div>

              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div className="form-group">
                <label>İlgilendiğiniz Paket</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="school">Okul Paketi</option>
                  <option value="individual">Bireysel</option>
                  <option value="corporate">Kurumsal</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Okul/Kurum Adı</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  placeholder="Okul veya kurum adınız"
                />
              </div>

              <div className="form-group">
                <label>Mesajınız *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Mesajınızı buraya yazın..."
                ></textarea>
              </div>

              <button type="submit" className="btn-submit">
                📤 Gönder
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 AI Öğretmen. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;

