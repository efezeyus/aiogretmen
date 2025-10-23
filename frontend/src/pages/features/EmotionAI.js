import React from 'react';
import { Link } from 'react-router-dom';

const EmotionAI = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>😊 Duygu Analizi</h1>
        <p>Öğrenci motivasyon takibi</p>
      </div>
      <div className="feature-content">
        <p>Duygu analizi özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default EmotionAI;
