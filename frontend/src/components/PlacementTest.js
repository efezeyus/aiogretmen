import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import placementTestService from '../services/placementTestService';
import './PlacementTest.css';

/**
 * Seviye Belirleme Testi Bileşeni
 * 
 * Yeni öğrenciler için seviye belirleme testi
 * Admin onayı bekler
 */
const PlacementTest = () => {
  const navigate = useNavigate();
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const studentInfo = {
    id: localStorage.getItem('userId') || 'student_demo',
    name: localStorage.getItem('userName') || 'Öğrenci',
    grade: parseInt(localStorage.getItem('userGrade')) || 5
  };

  // Test başlat
  const handleStartTest = async () => {
    setLoading(true);
    try {
      const response = await placementTestService.startPlacementTest(studentInfo);
      
      if (response.success) {
        setTestStarted(true);
        setCurrentQuestionData(response.firstQuestion);
      }
    } catch (error) {
      console.error('Test başlatma hatası:', error);
      alert('Test başlatılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Cevap seç
  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  // Cevabı gönder
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      alert('Lütfen bir cevap seçin!');
      return;
    }

    const result = placementTestService.submitAnswer(
      currentQuestionData.question.id,
      selectedAnswer
    );

    // Sonraki soruya geç
    if (result.hasNext) {
      const nextQuestion = placementTestService.getNextQuestion();
      setCurrentQuestionData(nextQuestion);
      setSelectedAnswer(null);
    } else {
      // Test bitti
      handleCompleteTest();
    }
  };

  // Testi tamamla
  const handleCompleteTest = async () => {
    setLoading(true);
    try {
      const result = await placementTestService.completeTest(studentInfo.id);
      
      if (result.success) {
        setTestCompleted(true);
        setTestResult(result.result);
      }
    } catch (error) {
      console.error('Test tamamlama hatası:', error);
      alert('Test tamamlanamadı. Sonuçlar kaydedildi.');
    } finally {
      setLoading(false);
    }
  };

  // Test tamamlandıysa sonuçları göster
  if (testCompleted && testResult) {
    return (
      <div className="placement-test-container">
        <div className="test-result-card">
          <div className="result-header">
            <h1>🎊 Test Tamamlandı!</h1>
            <p className="result-subtitle">Harika çalıştın {studentInfo.name}!</p>
          </div>

          <div className="result-score">
            <div className="score-circle">
              <span className="score-number">{testResult.score}</span>
              <span className="score-total">/100</span>
            </div>
            <p className="score-label">Başarı Puanın</p>
          </div>

          <div className="result-details">
            <div className="detail-row">
              <span className="detail-label">Doğru Cevap:</span>
              <span className="detail-value">{testResult.correctAnswers}/{testResult.totalQuestions}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Önerilen Seviye:</span>
              <span className="detail-value highlight">{testResult.suggestedGrade}. Sınıf</span>
            </div>
          </div>

          <div className="result-analysis">
            <h3>📊 Performans Analizi</h3>
            
            {testResult.strengths && testResult.strengths.length > 0 && (
              <div className="strength-section">
                <h4>✅ Güçlü Yönlerin</h4>
                <ul>
                  {testResult.strengths.map((strength, i) => (
                    <li key={i}>
                      <strong>{strength.topic}</strong> - %{strength.successRate}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {testResult.weaknesses && testResult.weaknesses.length > 0 && (
              <div className="weakness-section">
                <h4>📈 Geliştirme Alanları</h4>
                <ul>
                  {testResult.weaknesses.map((weakness, i) => (
                    <li key={i}>
                      <strong>{weakness.topic}</strong> - %{weakness.successRate}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="result-recommendation">
            <h3>💡 Öneri</h3>
            <p>{testResult.recommendation?.message}</p>
            <p className="recommendation-plan">{testResult.recommendation?.plan}</p>
          </div>

          <div className="result-status">
            <div className="status-badge pending">
              ⏳ Öğretmen Onayı Bekleniyor
            </div>
            <p className="status-text">
              Sonuçlarınız öğretmeniniz tarafından değerlendirilecek.
              Onaylandıktan sonra derslerinize başlayabileceksiniz!
            </p>
          </div>

          <div className="result-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/student/dashboard')}
            >
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test başlamadıysa intro göster
  if (!testStarted) {
    return (
      <div className="placement-test-container">
        <div className="test-intro-card">
          <h1>📝 Seviye Belirleme Testi</h1>
          <p className="intro-subtitle">
            Merhaba {studentInfo.name}! Senin için en uygun seviyeyi belirleyelim.
          </p>

          <div className="test-info">
            <div className="info-item">
              <span className="info-icon">📋</span>
              <div>
                <strong>Soru Sayısı:</strong>
                <p>15 soru (3 farklı seviyeden)</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">⏱</span>
              <div>
                <strong>Tahmini Süre:</strong>
                <p>~30 dakika</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">🎯</span>
              <div>
                <strong>Amaç:</strong>
                <p>Senin için en uygun sınıf seviyesini belirlemek</p>
              </div>
            </div>
          </div>

          <div className="test-instructions">
            <h3>📌 Talimatlar</h3>
            <ul>
              <li>Her soruyu dikkatlice oku</li>
              <li>En iyi bildiğin cevabı seç</li>
              <li>Bilmediğin sorularda tahmin yapabilirsin</li>
              <li>Testi tamamladıktan sonra öğretmenin onayını bekleyeceksin</li>
            </ul>
          </div>

          <div className="test-ready">
            <p className="ready-text">Hazır mısın?</p>
            <button 
              className="btn-start"
              onClick={handleStartTest}
              disabled={loading}
            >
              {loading ? 'Hazırlanıyor...' : '🚀 Teste Başla'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test devam ediyorsa soru göster
  if (currentQuestionData) {
    const { question, questionNumber, totalQuestions, progress } = currentQuestionData;

    return (
      <div className="placement-test-container">
        <div className="test-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="test-question-card">
          <div className="question-header">
            <span className="question-number">
              Soru {questionNumber} / {totalQuestions}
            </span>
            <span className="question-difficulty">
              {question.difficulty === 'kolay' && '⭐ Kolay'}
              {question.difficulty === 'orta' && '⭐⭐ Orta'}
              {question.difficulty === 'ileri' && '⭐⭐⭐ İleri'}
            </span>
          </div>

          <div className="question-content">
            <h2>{question.question}</h2>
          </div>

          <div className="question-options">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`option ${selectedAnswer === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>

          <div className="question-actions">
            <button
              className="btn-submit"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              {questionNumber === totalQuestions ? 'Testi Tamamla' : 'Sonraki Soru →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="placement-test-container">
      <div className="loading-spinner">Yükleniyor...</div>
    </div>
  );
};

export default PlacementTest;

