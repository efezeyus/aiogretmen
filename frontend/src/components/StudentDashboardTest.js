import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboardTest = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  console.log('🎯 StudentDashboardTest component rendered');
  
  useEffect(() => {
    console.log('🎯 StudentDashboardTest useEffect running');
    setIsLoaded(true);
  }, []);
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
  
  if (!isLoaded) {
    return <div>Yükleniyor...</div>;
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎓 Student Dashboard Test</h1>
      <p>Bu sayfa test amaçlıdır.</p>
      
      <div style={{ margin: '20px 0' }}>
        <h2>Kullanıcı Bilgileri</h2>
        <p>User Type: {localStorage.getItem('userType') || 'Yok'}</p>
        <p>User Role: {localStorage.getItem('userRole') || 'Yok'}</p>
        <p>User Name: {localStorage.getItem('userName') || 'Yok'}</p>
        <p>Token: {localStorage.getItem('authToken') ? 'Mevcut' : 'Yok'}</p>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h2>Test Butonları</h2>
        <button 
          onClick={() => {
            localStorage.setItem('userType', 'student');
            localStorage.setItem('userRole', 'student');
            localStorage.setItem('userName', 'Ahmet Yılmaz');
            localStorage.setItem('authToken', 'test_token_1_ahmet.yilmaz@okul.com');
            window.location.reload();
          }}
          style={{ margin: '5px', padding: '10px' }}
        >
          Test Kullanıcısı Oluştur
        </button>
        
        <button 
          onClick={handleLogout}
          style={{ margin: '5px', padding: '10px' }}
        >
          Çıkış Yap
        </button>
        
        <button 
          onClick={() => window.location.href = '/student/dashboard'}
          style={{ margin: '5px', padding: '10px' }}
        >
          Gerçek Dashboard'a Git
        </button>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h2>Console Logları</h2>
        <p>Browser console'u açık tutun ve sayfayı yenileyin.</p>
      </div>
    </div>
  );
};

export default StudentDashboardTest;
