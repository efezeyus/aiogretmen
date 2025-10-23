import React from 'react';
import { Link } from 'react-router-dom';

const TranslationFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🌐 Çoklu Dil Desteği</h1>
        <p>20+ dilde eğitim içeriği</p>
      </div>
      <div className="feature-content">
        <p>Çoklu dil desteği özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default TranslationFeature;
