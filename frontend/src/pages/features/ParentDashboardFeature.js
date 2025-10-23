import React from 'react';
import { Link } from 'react-router-dom';

const ParentDashboardFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>👨‍👩‍👧 Veli Paneli</h1>
        <p>Gerçek zamanlı ilerleme takibi</p>
      </div>
      <div className="feature-content">
        <p>Veli paneli özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default ParentDashboardFeature;
