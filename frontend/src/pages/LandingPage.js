import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/**
 * Ana Sayfa - Landing Page
 * Ticari eğitim platformu tanıtımı
 */
const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🤖',
      title: 'Yapay Zeka Öğretmen',
      description: 'DeepSeek AI destekli, gerçek öğretmen gibi ders anlatan akıllı sistem'
    },
    {
      icon: '📚',
      title: 'MEB Uyumlu Müfredat',
      description: '%100 Milli Eğitim Bakanlığı müfredatına uygun içerikler'
    },
    {
      icon: '🎯',
      title: 'Kişiselleştirilmiş Öğrenme',
      description: 'Her öğrencinin seviyesine özel, adaptif öğretim sistemi'
    },
    {
      icon: '📊',
      title: 'İlerleme Takibi',
      description: 'Detaylı raporlar, veli bildirimleri ve başarı analizi'
    },
    {
      icon: '🏆',
      title: 'Gamification',
      description: 'Oyunlaştırma, rozetler ve liderlik tablosu ile motivasyon'
    },
    {
      icon: '👨‍💼',
      title: 'Admin Paneli',
      description: 'Öğretmen ve yöneticiler için güçlü yönetim araçları'
    }
  ];

  const pricingPlans = [
    {
      name: 'Bireysel',
      price: '99',
      period: 'ay',
      features: [
        'Tüm dersler',
        'AI öğretmen',
        'İlerleme takibi',
        'Sertifika',
        'Mobil erişim'
      ],
      popular: false
    },
    {
      name: 'Okul Paketi',
      price: '1.500',
      period: 'ay',
      subtitle: '50 öğrenci',
      features: [
        'Tüm bireysel özellikler',
        'Admin paneli',
        'Veli raporları',
        'Öğretmen desteği',
        'Öncelikli destek',
        'Özel eğitim'
      ],
      popular: true
    },
    {
      name: 'Kurumsal',
      price: 'Özel',
      period: 'teklif',
      features: [
        'Sınırsız öğrenci',
        'Özel entegrasyon',
        'Beyaz etiket',
        'API erişimi',
        '7/24 destek',
        'Özel geliştirme'
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Ayşe Yılmaz',
      role: 'Matematik Öğretmeni',
      school: 'Ankara Fen Lisesi',
      text: 'Öğrencilerim çok mutlu! AI öğretmen gerçekten işe yarıyor. Başarı oranları %30 arttı.',
      avatar: '👩‍🏫'
    },
    {
      name: 'Mehmet Kaya',
      role: 'Okul Müdürü',
      school: 'İstanbul Anadolu Lisesi',
      text: 'Okulumuzda 200 öğrenci kullanıyor. Velilerden çok olumlu geri dönüşler alıyoruz.',
      avatar: '👨‍💼'
    },
    {
      name: 'Zeynep Demir',
      role: 'Veli',
      text: 'Çocuğum matematik derslerinde çok ilerledi. AI öğretmen sabırla tekrar tekrar anlatıyor.',
      avatar: '👩'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">AI Öğretmen</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#features">Özellikler</a></li>
            <li><a href="#pricing">Fiyatlandırma</a></li>
            <li><a href="#testimonials">Referanslar</a></li>
            <li><a href="#contact">İletişim</a></li>
          </ul>
          <div className="nav-actions">
            <button className="btn-login" onClick={() => navigate('/login')}>
              Giriş Yap
            </button>
            <button className="btn-register" onClick={() => navigate('/register')}>
              Ücretsiz Dene
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">🚀 Türkiye'nin İlk AI Destekli Eğitim Platformu</span>
            <h1 className="hero-title">
              Yapay Zeka ile
              <span className="gradient-text"> Kişiselleştirilmiş </span>
              Eğitim
            </h1>
            <p className="hero-subtitle">
              Her öğrenci için özel AI öğretmen. MEB müfredatına %100 uyumlu.
              Başarınızı artırmak için tasarlandı.
            </p>
            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={() => navigate('/register')}>
                🎯 Hemen Başla - Ücretsiz Dene
              </button>
              <button className="btn-hero-secondary" onClick={() => navigate('/demo')}>
                📺 Demo İzle
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Aktif Öğrenci</span>
              </div>
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Okul</span>
              </div>
              <div className="stat">
                <span className="stat-number">%95</span>
                <span className="stat-label">Memnuniyet</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card floating">
              <div className="card-header">🤖 AI Öğretmen</div>
              <div className="card-content">
                <p>"Merhaba! Bugün kesirler konusunu öğreneceğiz..."</p>
              </div>
            </div>
            <div className="hero-card floating-delayed">
              <div className="card-header">📊 İlerleme</div>
              <div className="card-content">
                <div className="progress-demo">
                  <span>Matematik</span>
                  <div className="progress-bar-demo">
                    <div className="progress-fill-demo" style={{width: '75%'}}></div>
                  </div>
                  <span>%75</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">✨ Özellikler</span>
            <h2 className="section-title">Neden AI Öğretmen?</h2>
            <p className="section-subtitle">
              En gelişmiş teknoloji ile en iyi eğitim deneyimi
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">🎯 Nasıl Çalışır?</span>
            <h2 className="section-title">3 Adımda Başlayın</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Kayıt Olun</h3>
                <p>Ücretsiz hesap oluşturun, kredi kartı gerektirmez</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Seviye Testi</h3>
                <p>15 soruluk test ile seviyenizi belirleyin</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Öğrenmeye Başlayın</h3>
                <p>AI öğretmeniniz ile kişiselleştirilmiş eğitim</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" id="pricing">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">💰 Fiyatlandırma</span>
            <h2 className="section-title">Size Uygun Paketi Seçin</h2>
            <p className="section-subtitle">
              Tüm paketlerde 14 gün ücretsiz deneme
            </p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">En Popüler</div>}
                <h3 className="plan-name">{plan.name}</h3>
                {plan.subtitle && <p className="plan-subtitle">{plan.subtitle}</p>}
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">₺/{plan.period}</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <span className="check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  className={`btn-plan ${plan.popular ? 'primary' : 'secondary'}`}
                  onClick={() => navigate('/register')}
                >
                  {plan.popular ? 'Hemen Başla' : 'Detaylı Bilgi'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials" id="testimonials">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">💬 Referanslar</span>
            <h2 className="section-title">Kullanıcılarımız Ne Diyor?</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                    {testimonial.school && (
                      <div className="author-school">{testimonial.school}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">Hazır mısınız?</h2>
          <p className="cta-subtitle">
            Bugün başlayın, başarınızı artırın!
          </p>
          <button className="btn-cta" onClick={() => navigate('/register')}>
            🚀 Ücretsiz Denemeye Başla
          </button>
          <p className="cta-note">
            Kredi kartı gerektirmez • 14 gün ücretsiz • İstediğiniz zaman iptal
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>AI Öğretmen</h4>
              <p>Türkiye'nin ilk AI destekli kişiselleştirilmiş eğitim platformu</p>
              <div className="social-links">
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="LinkedIn">💼</a>
                <a href="#" aria-label="Instagram">📸</a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Ürün</h4>
              <ul>
                <li><a href="#features">Özellikler</a></li>
                <li><a href="#pricing">Fiyatlandırma</a></li>
                <li><a href="/demo">Demo</a></li>
                <li><a href="/docs">Dokümantasyon</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Şirket</h4>
              <ul>
                <li><a href="/about">Hakkımızda</a></li>
                <li><a href="/careers">Kariyer</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/contact">İletişim</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Yasal</h4>
              <ul>
                <li><a href="/privacy">Gizlilik Politikası</a></li>
                <li><a href="/terms">Kullanım Şartları</a></li>
                <li><a href="/kvkk">KVKK</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 AI Öğretmen. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
