import React from 'react';
import { Link } from 'react-router-dom';

const GamificationFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🎮 Gamification</h1>
        <p>Oyunlaştırılmış öğrenme deneyimi</p>
      </div>
      <div className="feature-content">
        <p>Gamification özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default GamificationFeature;
