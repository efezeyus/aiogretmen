import React from 'react';

const StudentDashboardSimple = () => {
  console.log('🎯 StudentDashboardSimple component rendered');
  
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#5c3cfc', fontSize: '2rem', marginBottom: '20px' }}>
        🎓 Student Dashboard Test
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Bu sayfa çalışıyorsa, routing ve component rendering düzgün çalışıyor demektir.
      </p>
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2>Test Bilgileri:</h2>
        <p>Zaman: {new Date().toLocaleString('tr-TR')}</p>
        <p>URL: {window.location.href}</p>
        <p>User Agent: {navigator.userAgent}</p>
      </div>
    </div>
  );
};

export default StudentDashboardSimple;
