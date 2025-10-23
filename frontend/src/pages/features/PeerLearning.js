import React from 'react';
import { Link } from 'react-router-dom';

const PeerLearning = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🤝 Akran Öğrenme</h1>
        <p>Öğrenciler arası işbirliği</p>
      </div>
      <div className="feature-content">
        <p>Akran öğrenme özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default PeerLearning;
