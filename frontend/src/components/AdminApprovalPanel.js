import React, { useState, useEffect } from 'react';
import api from '../services/api';
import curriculumService from '../services/curriculumService';
import './AdminApprovalPanel.css';

/**
 * Admin/Öğretmen Onay Paneli
 * 
 * - Seviye belirleme test sonuçlarını görüntüle
 * - Öğrencilerin seviyelerini onayla veya düzenle
 * - Öğrenci ilerleme durumlarını izle
 */
const AdminApprovalPanel = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'all'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Gerçek uygulamada backend'den gelir
      // Demo için localStorage'dan yükle
      
      const mockPending = [
        {
          studentId: 'student_001',
          studentName: 'Ali Yılmaz',
          age: 11,
          testDate: new Date().toISOString(),
          testScore: 75,
          suggestedGrade: 5,
          testAnalysis: {
            strengths: [
              { topic: 'Doğal Sayılar', successRate: 90 },
              { topic: 'Toplama-Çıkarma', successRate: 85 }
            ],
            weaknesses: [
              { topic: 'Kesirler', successRate: 60 },
              { topic: 'Geometri', successRate: 65 }
            ]
          }
        },
        {
          studentId: 'student_002',
          studentName: 'Ayşe Kaya',
          age: 10,
          testDate: new Date().toISOString(),
          testScore: 92,
          suggestedGrade: 6,
          testAnalysis: {
            strengths: [
              { topic: 'Kesirler', successRate: 95 },
              { topic: 'Geometri', successRate: 90 }
            ],
            weaknesses: []
          }
        }
      ];

      setPendingApprovals(mockPending);
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (student, approvedGrade) => {
    try {
      console.log(`Onaylanıyor: ${student.studentName} - ${approvedGrade}. sınıf`);
      
      // Backend'e gönder
      await api.post('/admin/approve-level', {
        studentId: student.studentId,
        approvedGrade: approvedGrade,
        approvedBy: localStorage.getItem('userId'),
        approvedAt: new Date().toISOString()
      });

      // Local state'den kaldır
      setPendingApprovals(prev => 
        prev.filter(s => s.studentId !== student.studentId)
      );

      alert(`✅ ${student.studentName} başarıyla onaylandı! (${approvedGrade}. Sınıf)`);
      
    } catch (error) {
      console.error('Onay hatası:', error);
      alert('Onay işlemi başarısız oldu.');
    }
  };

  const handleReject = async (student, reason) => {
    try {
      const rejectionReason = reason || prompt('Red nedeni (opsiyonel):');
      
      console.log(`Reddediliyor: ${student.studentName}`);
      
      // Backend'e gönder
      await api.post('/admin/reject-level', {
        studentId: student.studentId,
        rejectedBy: localStorage.getItem('userId'),
        reason: rejectionReason
      });

      // Local state'den kaldır
      setPendingApprovals(prev => 
        prev.filter(s => s.studentId !== student.studentId)
      );

      alert(`❌ ${student.studentName} seviye onayı reddedildi.`);
      
    } catch (error) {
      console.error('Red hatası:', error);
      alert('Red işlemi başarısız oldu.');
    }
  };

  const handleModifyGrade = async (student) => {
    const newGrade = prompt(
      `${student.studentName} için yeni seviye:\n(Önerilen: ${student.suggestedGrade}. Sınıf)`,
      student.suggestedGrade
    );

    if (newGrade && !isNaN(newGrade)) {
      const grade = parseInt(newGrade);
      if (grade >= 1 && grade <= 12) {
        await handleApprove(student, grade);
      } else {
        alert('Geçersiz sınıf seviyesi! (1-12 arası olmalı)');
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-approval-panel loading">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="admin-approval-panel">
      <div className="panel-header">
        <h1>👨‍💼 Admin Onay Paneli</h1>
        <p className="panel-subtitle">Seviye belirleme test sonuçlarını yönetin</p>
      </div>

      <div className="panel-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Onay Bekleyenler ({pendingApprovals.length})
        </button>
        <button 
          className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Onaylananlar
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📊 Tüm Öğrenciler
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'pending' && (
          <>
            {pendingApprovals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Onay Bekleyen Öğrenci Yok</h3>
                <p>Tüm seviye belirleme testleri onaylanmış durumda.</p>
              </div>
            ) : (
              <div className="approvals-list">
                {pendingApprovals.map(student => (
                  <div key={student.studentId} className="approval-card">
                    <div className="card-header">
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <h3>{student.studentName}</h3>
                          <p className="student-meta">
                            {student.age} yaş • 
                            Test: {new Date(student.testDate).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="test-score">
                        <div className="score-circle">
                          <span className="score">{student.testScore}</span>
                          <span className="score-max">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="suggestion-box">
                        <h4>💡 Sistem Önerisi</h4>
                        <div className="suggested-grade">
                          {student.suggestedGrade}. Sınıf
                        </div>
                      </div>

                      <div className="analysis-section">
                        {student.testAnalysis.strengths.length > 0 && (
                          <div className="analysis-group">
                            <h5>✅ Güçlü Yönler</h5>
                            <ul>
                              {student.testAnalysis.strengths.map((s, i) => (
                                <li key={i}>
                                  <strong>{s.topic}</strong>
                                  <span className="rate success">%{s.successRate}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {student.testAnalysis.weaknesses.length > 0 && (
                          <div className="analysis-group">
                            <h5>📈 Geliştirme Alanları</h5>
                            <ul>
                              {student.testAnalysis.weaknesses.map((w, i) => (
                                <li key={i}>
                                  <strong>{w.topic}</strong>
                                  <span className="rate warning">%{w.successRate}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      <button 
                        className="btn-approve"
                        onClick={() => handleApprove(student, student.suggestedGrade)}
                      >
                        ✅ Onayla ({student.suggestedGrade}. Sınıf)
                      </button>
                      <button 
                        className="btn-modify"
                        onClick={() => handleModifyGrade(student)}
                      >
                        ✏️ Düzenle
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleReject(student)}
                      >
                        ❌ Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'approved' && (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Onaylanmış Öğrenciler</h3>
            <p>Bu bölüm geliştirme aşamasında...</p>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Tüm Öğrenciler</h3>
            <p>Bu bölüm geliştirme aşamasında...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalPanel;

