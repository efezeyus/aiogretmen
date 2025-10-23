import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>Aradığınız sayfa bulunamadı</p>
      <Link to="/" className="btn btn-primary">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
};

export default NotFound;