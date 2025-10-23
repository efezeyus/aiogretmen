import React from 'react';
import { Link } from 'react-router-dom';

const StudyPlannerFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>📅 Akıllı Planlayıcı</h1>
        <p>AI destekli çalışma programı</p>
      </div>
      <div className="feature-content">
        <p>Akıllı planlayıcı özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default StudyPlannerFeature;
