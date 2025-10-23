import React, { useState, useEffect } from 'react';
import './AdvancedQuiz.css';

const AdvancedQuiz = () => {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [quizAnalysis, setQuizAnalysis] = useState(null);

  const [availableQuizzes] = useState([
    {
      id: 1,
      title: 'Matematik - Kesirler',
      subject: 'Matematik',
      difficulty: 'Orta',
      duration: 20, // dakika
      questionCount: 15,
      description: 'Kesirler konusunda kapsamlı değerlendirme',
      topics: ['Kesirler', 'Ondalık Sayılar', 'Yüzde'],
      adaptive: true
    },
    {
      id: 2,
      title: 'Türkçe - Dilbilgisi',
      subject: 'Türkçe',
      difficulty: 'Kolay',
      duration: 15,
      questionCount: 12,
      description: 'Temel dilbilgisi kuralları',
      topics: ['Fiiller', 'İsimler', 'Sıfatlar'],
      adaptive: false
    },
    {
      id: 3,
      title: 'Fen Bilimleri - Madde',
      subject: 'Fen Bilimleri',
      difficulty: 'Zor',
      duration: 25,
      questionCount: 18,
      description: 'Madde ve özellikleri',
      topics: ['Maddenin Halleri', 'Fiziksel Değişim', 'Kimyasal Değişim'],
      adaptive: true
    }
  ]);

  const [questions] = useState({
    1: [
      {
        id: 1,
        question: '3/4 + 1/2 işleminin sonucu kaçtır?',
        type: 'multiple_choice',
        options: ['5/4', '4/6', '6/8', '7/4'],
        correctAnswer: 0,
        explanation: '3/4 + 1/2 = 3/4 + 2/4 = 5/4',
        difficulty: 'medium',
        topic: 'Kesirler'
      },
      {
        id: 2,
        question: '0.75 sayısının kesir karşılığı nedir?',
        type: 'multiple_choice',
        options: ['3/4', '7/10', '75/100', '1/4'],
        correctAnswer: 0,
        explanation: '0.75 = 75/100 = 3/4',
        difficulty: 'easy',
        topic: 'Ondalık Sayılar'
      },
      {
        id: 3,
        question: 'Bir sayının %25\'i 50 ise, bu sayı kaçtır?',
        type: 'multiple_choice',
        options: ['100', '150', '200', '250'],
        correctAnswer: 2,
        explanation: '50 = x * 0.25 → x = 50 / 0.25 = 200',
        difficulty: 'hard',
        topic: 'Yüzde'
      }
    ],
    2: [
      {
        id: 4,
        question: 'Aşağıdakilerden hangisi bir fiildir?',
        type: 'multiple_choice',
        options: ['Güzel', 'Koşmak', 'Mavi', 'Ev'],
        correctAnswer: 1,
        explanation: 'Koşmak bir eylem bildiren fiildir.',
        difficulty: 'easy',
        topic: 'Fiiller'
      }
    ],
    3: [
      {
        id: 5,
        question: 'Su hangi sıcaklıkta donar?',
        type: 'multiple_choice',
        options: ['0°C', '100°C', '-10°C', '50°C'],
        correctAnswer: 0,
        explanation: 'Su 0°C sıcaklıkta donar.',
        difficulty: 'easy',
        topic: 'Maddenin Halleri'
      }
    ]
  });

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizStarted) {
      finishQuiz();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, quizCompleted]);

  const startQuiz = (quizId) => {
    const quiz = availableQuizzes.find(q => q.id === quizId);
    setCurrentQuiz(quiz);
    setTimeLeft(quiz.duration * 60); // saniyeye çevir
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setShowResults(false);
  };

  const answerQuestion = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions[currentQuiz.id].length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    setQuizCompleted(true);
    setQuizStarted(false);
    calculateResults();
  };

  const calculateResults = () => {
    const quizQuestions = questions[currentQuiz.id];
    let correctAnswers = 0;
    let totalScore = 0;
    let topicScores = {};
    let difficultyScores = {};

    quizQuestions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        totalScore += getQuestionScore(question.difficulty);
      }

      // Konu bazlı skor
      if (!topicScores[question.topic]) {
        topicScores[question.topic] = { correct: 0, total: 0 };
      }
      topicScores[question.topic].total++;
      if (isCorrect) topicScores[question.topic].correct++;

      // Zorluk bazlı skor
      if (!difficultyScores[question.difficulty]) {
        difficultyScores[question.difficulty] = { correct: 0, total: 0 };
      }
      difficultyScores[question.difficulty].total++;
      if (isCorrect) difficultyScores[question.difficulty].correct++;
    });

    const percentage = (correctAnswers / quizQuestions.length) * 100;
    const maxScore = quizQuestions.reduce((sum, q) => sum + getQuestionScore(q.difficulty), 0);
    const finalScore = (totalScore / maxScore) * 100;

    setQuizAnalysis({
      correctAnswers,
      totalQuestions: quizQuestions.length,
      percentage,
      finalScore,
      topicScores,
      difficultyScores,
      timeSpent: (currentQuiz.duration * 60) - timeLeft,
      recommendations: generateRecommendations(topicScores, difficultyScores)
    });
  };

  const getQuestionScore = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  };

  const generateRecommendations = (topicScores, difficultyScores) => {
    const recommendations = [];
    
    // Zayıf konuları bul
    Object.entries(topicScores).forEach(([topic, scores]) => {
      const percentage = (scores.correct / scores.total) * 100;
      if (percentage < 70) {
        recommendations.push({
          type: 'weakness',
          topic: topic,
          message: `${topic} konusunda daha fazla pratik yapmanız önerilir.`,
          priority: 'high'
        });
      }
    });

    // Zorluk seviyesi önerileri
    if (difficultyScores.hard && (difficultyScores.hard.correct / difficultyScores.hard.total) < 0.5) {
      recommendations.push({
        type: 'difficulty',
        message: 'Zor sorularda zorlanıyorsunuz. Temel konuları tekrar gözden geçirin.',
        priority: 'medium'
      });
    }

    return recommendations;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (!quizStarted && !showResults) {
    return (
      <div className="advanced-quiz">
        <div className="quiz-selection">
          <h2>🧠 Gelişmiş Quiz Sistemi</h2>
          <p>Bilginizi test edin ve öğrenme yolunuzu keşfedin</p>
          
          <div className="quiz-grid">
            {availableQuizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-header">
                  <h3>{quiz.title}</h3>
                  <div className="quiz-meta">
                    <span className="subject-badge">{quiz.subject}</span>
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(quiz.difficulty.toLowerCase()) }}
                    >
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
                
                <p className="quiz-description">{quiz.description}</p>
                
                <div className="quiz-details">
                  <div className="detail-item">
                    <span className="detail-icon">⏱️</span>
                    <span>{quiz.duration} dakika</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">❓</span>
                    <span>{quiz.questionCount} soru</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🎯</span>
                    <span>{quiz.adaptive ? 'Adaptif' : 'Standart'}</span>
                  </div>
                </div>
                
                <div className="quiz-topics">
                  <h4>Konular:</h4>
                  <div className="topics-list">
                    {quiz.topics.map((topic, index) => (
                      <span key={index} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="start-quiz-btn"
                  onClick={() => startQuiz(quiz.id)}
                >
                  Quiz'i Başlat
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (quizStarted && currentQuiz) {
    const currentQuestion = questions[currentQuiz.id][currentQuestionIndex];
    const totalQuestions = questions[currentQuiz.id].length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
      <div className="quiz-interface">
        {/* Quiz Header */}
        <div className="quiz-header">
          <div className="quiz-info">
            <h2>{currentQuiz.title}</h2>
            <div className="quiz-progress">
              <span>Soru {currentQuestionIndex + 1} / {totalQuestions}</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="quiz-timer">
            <div className="timer-display">
              <span className="timer-icon">⏰</span>
              <span className="timer-text">{formatTime(timeLeft)}</span>
            </div>
            {timeLeft < 300 && <div className="timer-warning">⚠️ Zaman azalıyor!</div>}
          </div>
        </div>

        {/* Question */}
        <div className="question-container">
          <div className="question-header">
            <span className="question-number">Soru {currentQuestionIndex + 1}</span>
            <span 
              className="difficulty-indicator"
              style={{ backgroundColor: getDifficultyColor(currentQuestion.difficulty) }}
            >
              {currentQuestion.difficulty === 'easy' ? 'Kolay' : 
               currentQuestion.difficulty === 'medium' ? 'Orta' : 'Zor'}
            </span>
          </div>
          
          <div className="question-text">
            <h3>{currentQuestion.question}</h3>
          </div>

          {/* Options */}
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${userAnswers[currentQuestion.id] === index ? 'selected' : ''}`}
                onClick={() => answerQuestion(currentQuestion.id, index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="quiz-navigation">
          <button 
            className="nav-btn prev-btn"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            ← Önceki
          </button>
          
          <div className="question-indicators">
            {questions[currentQuiz.id].map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentQuestionIndex ? 'current' : ''} ${
                  userAnswers[questions[currentQuiz.id][index].id] !== undefined ? 'answered' : ''
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <button 
            className="nav-btn next-btn"
            onClick={nextQuestion}
            disabled={currentQuestionIndex === totalQuestions - 1}
          >
            Sonraki →
          </button>
        </div>

        {/* Finish Button */}
        <div className="finish-section">
          <button 
            className="finish-quiz-btn"
            onClick={finishQuiz}
          >
            Quiz'i Bitir
          </button>
        </div>
      </div>
    );
  }

  if (showResults && quizAnalysis) {
    return (
      <div className="quiz-results">
        <div className="results-header">
          <h2>📊 Quiz Sonuçları</h2>
          <button 
            className="back-to-quizzes-btn"
            onClick={() => {
              setShowResults(false);
              setQuizAnalysis(null);
            }}
          >
            ← Quiz Listesine Dön
          </button>
        </div>

        {/* Overall Results */}
        <div className="overall-results">
          <div className="result-card main-result">
            <div className="result-icon">🎯</div>
            <div className="result-content">
              <h3>{quizAnalysis.finalScore.toFixed(1)}%</h3>
              <p>Genel Başarı</p>
              <div className="score-breakdown">
                <span>{quizAnalysis.correctAnswers} / {quizAnalysis.totalQuestions} doğru</span>
              </div>
            </div>
          </div>

          <div className="result-card">
            <div className="result-icon">⏱️</div>
            <div className="result-content">
              <h3>{Math.floor(quizAnalysis.timeSpent / 60)}:{(quizAnalysis.timeSpent % 60).toString().padStart(2, '0')}</h3>
              <p>Geçen Süre</p>
            </div>
          </div>

          <div className="result-card">
            <div className="result-icon">📈</div>
            <div className="result-content">
              <h3>{quizAnalysis.percentage.toFixed(1)}%</h3>
              <p>Doğruluk Oranı</p>
            </div>
          </div>
        </div>

        {/* Topic Analysis */}
        <div className="topic-analysis">
          <h3>📚 Konu Bazlı Analiz</h3>
          <div className="topic-grid">
            {Object.entries(quizAnalysis.topicScores).map(([topic, scores]) => {
              const percentage = (scores.correct / scores.total) * 100;
              return (
                <div key={topic} className="topic-result">
                  <div className="topic-header">
                    <h4>{topic}</h4>
                    <span className="topic-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="topic-progress">
                    <div 
                      className="topic-progress-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="topic-details">
                    <span>{scores.correct} doğru / {scores.total} soru</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations">
          <h3>💡 Öneriler</h3>
          <div className="recommendations-list">
            {quizAnalysis.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.type}`}>
                <div className="rec-icon">
                  {rec.type === 'weakness' ? '⚠️' : '💡'}
                </div>
                <div className="rec-content">
                  <p>{typeof rec.message === 'string' ? rec.message : JSON.stringify(rec.message)}</p>
                  <span className="rec-priority">Öncelik: {rec.priority === 'high' ? 'Yüksek' : 'Orta'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <button className="action-btn retry-btn">
            🔄 Tekrar Dene
          </button>
          <button className="action-btn practice-btn">
            📚 Pratik Yap
          </button>
          <button className="action-btn share-btn">
            📤 Sonucu Paylaş
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AdvancedQuiz; 