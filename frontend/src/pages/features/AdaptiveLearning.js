import React from 'react';
import { Link } from 'react-router-dom';

const AdaptiveLearning = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🎯 Adaptif Öğrenme</h1>
        <p>Öğrenci seviyesine göre otomatik ayarlanan içerik</p>
      </div>
      <div className="feature-content">
        <p>Adaptif öğrenme özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default AdaptiveLearning;
