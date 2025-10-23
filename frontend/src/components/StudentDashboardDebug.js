import React, { useEffect } from 'react';

const StudentDashboardDebug = () => {
  useEffect(() => {
    console.log('🔍 StudentDashboardDebug mounted');
    console.log('🔍 Window location:', window.location.href);
    console.log('🔍 LocalStorage userType:', localStorage.getItem('userType'));
    console.log('🔍 LocalStorage userName:', localStorage.getItem('userName'));
    console.log('🔍 LocalStorage authToken:', localStorage.getItem('authToken'));
  }, []);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#5c3cfc', fontSize: '2rem', marginBottom: '20px' }}>
        🔍 Student Dashboard Debug
      </h1>
      
      <div style={{ 
        maxWidth: '600px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'left'
      }}>
        <h2>Debug Bilgileri:</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>LocalStorage İçeriği:</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
            {JSON.stringify({
              userType: localStorage.getItem('userType'),
              userName: localStorage.getItem('userName'),
              userRole: localStorage.getItem('userRole'),
              authToken: localStorage.getItem('authToken') ? 'Mevcut' : 'Yok',
              userEmail: localStorage.getItem('userEmail'),
              userId: localStorage.getItem('userId')
            }, null, 2)}
          </pre>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Test İşlemleri:</h3>
          <button 
            onClick={() => {
              localStorage.setItem('userType', 'student');
              localStorage.setItem('userRole', 'student');
              localStorage.setItem('userName', 'Ahmet Yılmaz');
              localStorage.setItem('authToken', 'test_token_1_ahmet.yilmaz@okul.com');
              localStorage.setItem('userEmail', 'ahmet.yilmaz@okul.com');
              localStorage.setItem('userId', '1');
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#5c3cfc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Test Girişi Yap
          </button>
          
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            LocalStorage Temizle
          </button>
        </div>
        
        <div>
          <h3>Navigasyon:</h3>
          <a 
            href="/student/dashboard" 
            style={{ 
              color: '#5c3cfc', 
              textDecoration: 'none',
              fontSize: '16px'
            }}
          >
            → Student Dashboard'a Git
          </a>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardDebug;
