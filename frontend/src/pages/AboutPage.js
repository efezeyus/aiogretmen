import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
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

      <section className="about-hero">
        <div className="hero-container">
          <h1>Hakkımızda</h1>
          <p className="hero-lead">
            Türkiye'nin ilk yapay zeka destekli kişiselleştirilmiş eğitim platformu
          </p>
        </div>
      </section>

      <section className="about-content">
        <div className="content-container">
          <div className="about-story">
            <h2>📖 Hikayemiz</h2>
            <p>
              AI Öğretmen, eğitimde fırsat eşitliği yaratmak ve her öğrencinin 
              potansiyelini maksimize etmek amacıyla kuruldu. Yapay zeka teknolojisi
              ile geleneksel eğitimi birleştirerek, her öğrenciye özel bir öğretmen 
              sunuyoruz.
            </p>
          </div>

          <div className="about-mission">
            <h2>🎯 Misyonumuz</h2>
            <p>
              MEB müfredatına %100 uyumlu, kişiselleştirilmiş eğitim ile 
              Türkiye'deki tüm öğrencilere kaliteli eğitim fırsatı sunmak.
            </p>
          </div>

          <div className="about-vision">
            <h2>🌟 Vizyonumuz</h2>
            <p>
              2030 yılına kadar Türkiye'deki her okul ve öğrenciye ulaşmak,
              eğitimde yapay zeka kullanımında dünya lideri olmak.
            </p>
          </div>

          <div className="about-values">
            <h2>💎 Değerlerimiz</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🎓</div>
                <h3>Eğitim Kalitesi</h3>
                <p>En yüksek kalitede eğitim içeriği</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Erişilebilirlik</h3>
                <p>Herkese ulaşılabilir eğitim</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🔬</div>
                <h3>İnovasyon</h3>
                <p>Sürekli gelişim ve yenilik</p>
              </div>
              <div className="value-card">
                <div className="value-icon">❤️</div>
                <h3>Öğrenci Odaklı</h3>
                <p>Her karar öğrenci için</p>
              </div>
            </div>
          </div>

          <div className="about-team">
            <h2>👥 Ekibimiz</h2>
            <p className="team-intro">
              Eğitim, teknoloji ve yapay zeka alanlarında uzman kadromuz
            </p>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-avatar">👨‍💻</div>
                <h4>Murat Usta</h4>
                <p className="member-role">Kurucu & CEO</p>
                <p className="member-bio">AI & Eğitim Teknolojileri</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">👩‍🏫</div>
                <h4>Pedagoji Ekibi</h4>
                <p className="member-role">Eğitim Uzmanları</p>
                <p className="member-bio">MEB Müfredat Danışmanları</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">🤖</div>
                <h4>AI Ekibi</h4>
                <p className="member-role">Yapay Zeka Mühendisleri</p>
                <p className="member-bio">DeepSeek & GPT Entegrasyonu</p>
              </div>
            </div>
          </div>

          <div className="about-cta">
            <h2>Bize Katılın!</h2>
            <p>Eğitimin geleceğini birlikte inşa edelim</p>
            <button className="btn-cta-about" onClick={() => navigate('/register')}>
              Ücretsiz Denemeye Başla
            </button>
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

export default AboutPage;

