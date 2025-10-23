import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import './UnauthorizedAccess.css';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = [], 
  redirectTo = '/login',
  showUnauthorized = true 
}) => {
  const { isAuthenticated, loading, user, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Loading durumunda spinner göster
  if (loading) {
    return <LoadingSpinner size="large" text="Yetkilendirme kontrol ediliyor..." />;
  }

  // Kullanıcı giriş yapmamışsa login'e yönlendir
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Belirli bir rol gerekiyorsa kontrol et
  if (requiredRole && !hasRole(requiredRole)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess requiredRole={requiredRole} userRole={user?.role} />;
    }
    return <Navigate to="/" replace />;
  }

  // Birden fazla rolden birisi gerekiyorsa kontrol et
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess requiredRoles={requiredRoles} userRole={user?.role} />;
    }
    return <Navigate to="/" replace />;
  }

  // Tüm kontroller geçildiyse children veya Outlet'i render et
  return children || <Outlet />;
};

const UnauthorizedAccess = ({ requiredRole, requiredRoles, userRole }) => {
  const getRoleName = (role) => {
    const roleNames = {
      admin: 'Yönetici',
      teacher: 'Öğretmen',
      student: 'Öğrenci',
      parent: 'Veli'
    };
    return roleNames[role] || role;
  };

  const getRequiredRolesText = () => {
    if (requiredRole) {
      return getRoleName(requiredRole);
    }
    if (requiredRoles) {
      return requiredRoles.map(getRoleName).join(' veya ');
    }
    return 'Belirsiz';
  };

  return (
    <div className="unauthorized-access">
      <div className="unauthorized-container">
        <div className="unauthorized-icon">🚫</div>
        <h2>Yetkisiz Erişim</h2>
        <p>
          Bu sayfaya erişmek için <strong>{getRequiredRolesText()}</strong> yetkisine ihtiyacınız var.
        </p>
        <p>
          Mevcut yetkiniz: <strong>{getRoleName(userRole)}</strong>
        </p>
        
        <div className="unauthorized-actions">
          <button 
            className="btn-go-back"
            onClick={() => window.history.back()}
          >
            ← Geri Dön
          </button>
          <button 
            className="btn-home"
            onClick={() => window.location.href = '/'}
          >
            🏠 Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute; 