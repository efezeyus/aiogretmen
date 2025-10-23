import React from 'react';
import { Link } from 'react-router-dom';

const ComputerVision = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>👁️ Bilgisayar Görüsü</h1>
        <p>El yazısı tanıma ve görsel analiz</p>
      </div>
      <div className="feature-content">
        <p>Bilgisayar görüsü özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default ComputerVision;
