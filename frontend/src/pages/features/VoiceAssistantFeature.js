import React from 'react';
import { Link } from 'react-router-dom';

const VoiceAssistantFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🎙️ Sesli Asistan</h1>
        <p>Sesli komutlarla öğrenme</p>
      </div>
      <div className="feature-content">
        <p>Sesli asistan özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default VoiceAssistantFeature;
