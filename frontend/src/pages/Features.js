import React from 'react';
import { Link } from 'react-router-dom';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI Destekli Öğrenme',
      description: 'DeepSeek AI ile güçlendirilmiş kişiselleştirilmiş eğitim deneyimi. Her öğrencinin öğrenme hızına ve tarzına uygun içerikler.',
      link: '/features/ai-learning',
      highlights: [
        'Kişiselleştirilmiş öğrenme yolları',
        'Akıllı soru-cevap sistemi',
        'Otomatik içerik önerisi',
        'Performans tahminleme'
      ]
    },
    {
      icon: '🎮',
      title: 'Gamification',
      description: 'Öğrenmeyi eğlenceli hale getiren oyunlaştırma özellikleri. Puanlar, rozetler ve liderlik tabloları.',
      link: '/features/gamification',
      highlights: [
        'Başarı rozetleri',
        'Puan sistemi',
        'Liderlik tablosu',
        'Günlük görevler'
      ]
    },
    {
      icon: '🔗',
      title: 'Blockchain Sertifikalar',
      description: 'NFT tabanlı, doğrulanabilir ve taşınabilir başarı sertifikaları.',
      link: '/features/blockchain',
      highlights: [
        'NFT sertifikalar',
        'Polygon ağında',
        'Doğrulanabilir başarılar',
        'Dijital portfolyo'
      ]
    },
    {
      icon: '🎯',
      title: 'Adaptif Öğrenme',
      description: 'Öğrenci performansına göre otomatik olarak ayarlanan zorluk seviyeleri.',
      link: '/features/adaptive-learning',
      highlights: [
        'Dinamik zorluk ayarı',
        'Kişisel öğrenme hızı',
        'Zayıf noktaları belirleme',
        'Özel takviye programları'
      ]
    },
    {
      icon: '🌐',
      title: 'Çoklu Dil Desteği',
      description: '20+ dilde eğitim içeriği ve arayüz desteği.',
      link: '/features/translation',
      highlights: [
        '20+ dil desteği',
        'Otomatik çeviri',
        'Yerel içerik',
        'Sesli çeviri'
      ]
    },
    {
      icon: '🎙️',
      title: 'Sesli Asistan',
      description: 'Sesli komutlarla öğrenme ve etkileşim.',
      link: '/features/voice-assistant',
      highlights: [
        'Sesli komutlar',
        'Konuşma tanıma',
        'Sesli geri bildirim',
        'Eller serbest öğrenme'
      ]
    },
    {
      icon: '👁️',
      title: 'Bilgisayar Görüsü',
      description: 'El yazısı tanıma, görsel analiz ve artırılmış gerçeklik özellikleri.',
      link: '/features/computer-vision',
      highlights: [
        'El yazısı tanıma',
        'Görsel problem çözme',
        'AR deneyimler',
        'Otomatik not alma'
      ]
    },
    {
      icon: '📊',
      title: 'Gelişmiş Analitik',
      description: 'Detaylı performans raporları ve öğrenme analitiği.',
      link: '/features/analytics',
      highlights: [
        'Gerçek zamanlı raporlar',
        'Performans grafikleri',
        'Tahmine dayalı analiz',
        'Öğrenme paterni analizi'
      ]
    }
  ];

  return (
    <div className="features-page">
      <div className="features-hero">
        <h1>Güçlü Özellikler</h1>
        <p>Modern teknolojilerle donatılmış, kapsamlı eğitim özellikleri</p>
      </div>

      <div className="features-container">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-detail-card">
              <div className="feature-icon">{feature.icon}</div>
              <h2>{feature.title}</h2>
              <p className="feature-description">{feature.description}</p>
              
              <div className="feature-highlights">
                <h4>Öne Çıkan Özellikler:</h4>
                <ul>
                  {feature.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>

              <Link to={feature.link} className="feature-cta">
                Detaylı Bilgi →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="features-cta-section">
        <h2>Tüm Bu Özellikleri Deneyimleyin</h2>
        <p>14 gün ücretsiz deneme süresi ile başlayın</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">
            Hemen Başla
          </Link>
          <Link to="/demo" className="btn btn-outline">
            Demo İzle
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Features;
