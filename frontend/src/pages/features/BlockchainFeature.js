import React from 'react';
import { Link } from 'react-router-dom';

const BlockchainFeature = () => {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1>🔗 Blockchain Sertifikalar</h1>
        <p>NFT tabanlı başarı sertifikaları</p>
      </div>
      <div className="feature-content">
        <p>Blockchain sertifika özellikleri yakında detaylandırılacak...</p>
        <Link to="/features">← Tüm Özelliklere Dön</Link>
      </div>
    </div>
  );
};

export default BlockchainFeature;
