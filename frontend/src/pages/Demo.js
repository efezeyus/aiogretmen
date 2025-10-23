import React from 'react';
import { Link } from 'react-router-dom';

const Demo = () => {
  return (
    <div className="demo-page">
      <h1>Demo</h1>
      <p>Yapay Zeka Öğretmen'i keşfedin</p>
      <div className="demo-content">
        <p>İnteraktif demo yakında eklenecek...</p>
        <Link to="/register" className="btn btn-primary">
          Ücretsiz Deneyin
        </Link>
      </div>
    </div>
  );
};

export default Demo;
