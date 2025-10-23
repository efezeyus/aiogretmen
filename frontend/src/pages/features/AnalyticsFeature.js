import React from 'react';
import { Link } from 'react-router-dom';

const AnalyticsFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>📊 Gelişmiş Analitik</h1>
        <p>Detaylı performans raporları</p>
      </div>
      <div className="feature-content">
        <p>Analitik özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default AnalyticsFeature;
