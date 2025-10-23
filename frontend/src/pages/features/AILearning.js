import React from 'react';
import { Link } from 'react-router-dom';

const AILearning = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🤖 AI Destekli Öğrenme</h1>
        <p>DeepSeek AI ile güçlendirilmiş kişiselleştirilmiş eğitim</p>
      </div>
      <div className="feature-content">
        <p>AI Destekli Öğrenme özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default AILearning;
