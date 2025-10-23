import React from 'react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
  const plans = [
    {
      name: 'Başlangıç',
      price: '49₺',
      period: '/ay',
      features: [
        '1 Öğrenci Hesabı',
        'Temel AI Desteği',
        '50 Ders/Ay',
        'Email Desteği',
        'Temel Raporlama'
      ],
      recommended: false
    },
    {
      name: 'Profesyonel',
      price: '149₺',
      period: '/ay',
      features: [
        '5 Öğrenci Hesabı',
        'Gelişmiş AI Desteği',
        'Sınırsız Ders',
        '7/24 Destek',
        'Detaylı Analitik',
        'Sesli Asistan',
        'Veli Paneli'
      ],
      recommended: true
    },
    {
      name: 'Kurumsal',
      price: 'Özel Fiyat',
      period: '',
      features: [
        'Sınırsız Öğrenci',
        'Özel AI Modeli',
        'Sınırsız Her Şey',
        'Öncelikli Destek',
        'API Erişimi',
        'Özel Entegrasyon',
        'Blockchain Sertifika'
      ],
      recommended: false
    }
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Basit ve Şeffaf Fiyatlandırma</h1>
        <p>Size uygun planı seçin ve hemen başlayın</p>
      </div>

      <div className="pricing-cards">
        {plans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}>
            {plan.recommended && <div className="badge">Önerilen</div>}
            <h3>{plan.name}</h3>
            <div className="price">
              <span className="amount">{plan.price}</span>
              <span className="period">{plan.period}</span>
            </div>
            <ul className="features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <Link to="/register" className="btn btn-primary">
              Başla
            </Link>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Sık Sorulan Sorular</h2>
        <p>Daha fazla bilgi için <Link to="/contact">iletişime geçin</Link></p>
      </div>
    </div>
  );
};

export default PricingPage;