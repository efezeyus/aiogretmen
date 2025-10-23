import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './QuizPlayer.css';

/**
 * QUIZ PLAYER - İnteraktif Quiz Çözme Sistemi
 * MEB müfredatı entegre, AI destekli geri bildirim
 */

const QuizPlayer = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz && !showResult) {
      handleSubmitQuiz();
    }
  }, [timeLeft, showResult]);

  const loadQuiz = async () => {
    try {
      // Demo quiz data - Backend'den gelecek
      const demoQuiz = {
        id: quizId,
        title: '5. Sınıf Matematik - Kesirler Quiz',
        subject: 'Matematik',
        topic: 'Kesirler',
        duration: 900, // 15 dakika (saniye)
        totalPoints: 100,
        passingScore: 60,
        questions: [
          {
            id: 1,
            question: 'Bir pastanın 3/4\'ü yenmiştir. Geriye kalan kısmı hangi kesir ile gösterilir?',
            options: ['1/4', '1/2', '2/3', '3/4'],
            correctAnswer: 0,
            explanation: 'Bütün pasta 4/4\'tür. 3/4\'ü yenirse, 4/4 - 3/4 = 1/4 kalır.',
            difficulty: 'kolay',
            points: 10
          },
          {
            id: 2,
            question: '2/3 + 1/6 işleminin sonucu nedir?',
            options: ['3/6', '4/6', '5/6', '6/6'],
            correctAnswer: 2,
            explanation: 'Paydaları eşitlemek için 2/3 = 4/6 yaparız. Sonra 4/6 + 1/6 = 5/6',
            difficulty: 'orta',
            points: 15
          },
          {
            id: 3,
            question: '7/3 bileşik kesrini tam sayılı kesre çevirin.',
            options: ['2 1/3', '1 4/3', '3 1/7', '7 1/3'],
            correctAnswer: 0,
            explanation: '7 ÷ 3 = 2 kalan 1. Yani 7/3 = 2 1/3',
            difficulty: 'orta',
            points: 15
          },
          {
            id: 4,
            question: 'Hangi kesir en büyüktür? 1/2, 1/3, 1/4',
            options: ['1/2', '1/3', '1/4', 'Hepsi eşit'],
            correctAnswer: 0,
            explanation: 'Paylar eşitse, paydası küçük olan kesir büyüktür. 1/2 > 1/3 > 1/4',
            difficulty: 'kolay',
            points: 10
          },
          {
            id: 5,
            question: '3,25 ondalık sayısını kesir olarak yazın.',
            options: ['3 1/4', '3 2/5', '3 1/2', '3 3/4'],
            correctAnswer: 0,
            explanation: '3,25 = 3 + 0,25 = 3 + 25/100 = 3 + 1/4 = 3 1/4',
            difficulty: 'zor',
            points: 20
          }
        ]
      };

      setQuiz(demoQuiz);
      setTimeLeft(demoQuiz.duration);
      setAnswers(new Array(demoQuiz.questions.length).fill(null));
    } catch (error) {
      console.error('Quiz yükleme hatası:', error);
      alert('Quiz yüklenemedi!');
      navigate('/student/quiz');
    }
  };

  const handleSelectAnswer = (optionIndex) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNextQuestion = () => {
    // Cevabı kaydet
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    // Doğru mu kontrol et
    if (selectedAnswer === quiz.questions[currentQuestion].correctAnswer) {
      setScore(score + quiz.questions[currentQuestion].points);
    }

    // Sonraki soruya geç veya bitir
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    
    // Final skoru hesapla
    let finalScore = 0;
    answers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correctAnswer) {
        finalScore += quiz.questions[index].points;
      }
    });
    
    setScore(finalScore);
    setShowResult(true);

    // Backend'e kaydet
    try {
      await api.post('/student/quiz-results', {
        quizId: quiz.id,
        score: finalScore,
        totalPoints: quiz.totalPoints,
        answers: answers,
        timeSpent: quiz.duration - timeLeft,
        completedAt: new Date().toISOString()
      });
      console.log('✅ Quiz sonucu kaydedildi');
    } catch (error) {
      console.error('Quiz sonucu kaydetme hatası:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    const percentage = (score / quiz.totalPoints) * 100;
    if (percentage >= 80) return '#27ae60';
    if (percentage >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getPassed = () => {
    return score >= quiz.passingScore;
  };

  if (!quiz) {
    return (
      <div className="quiz-loading">
        <div className="loading-icon">📝</div>
        <div>Quiz yükleniyor...</div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.totalPoints) * 100);
    const passed = getPassed();

    return (
      <div className="quiz-result">
        <div className="result-container">
          <div className="result-icon" style={{ color: getScoreColor() }}>
            {passed ? '🎉' : '📚'}
          </div>
          
          <h1 className="result-title">
            {passed ? 'Tebrikler! Geçtin!' : 'Biraz Daha Çalışmalısın'}
          </h1>

          <div className="result-score" style={{ color: getScoreColor() }}>
            {score} / {quiz.totalPoints}
          </div>
          
          <div className="result-percentage" style={{ color: getScoreColor() }}>
            %{percentage}
          </div>

          <div className="result-stats">
            <div className="result-stat">
              <span className="stat-icon">✅</span>
              <span>{answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length} Doğru</span>
            </div>
            <div className="result-stat">
              <span className="stat-icon">❌</span>
              <span>{answers.filter((a, i) => a !== null && a !== quiz.questions[i].correctAnswer).length} Yanlış</span>
            </div>
            <div className="result-stat">
              <span className="stat-icon">⏱️</span>
              <span>{formatTime(quiz.duration - timeLeft)} Süre</span>
            </div>
          </div>

          <div className="result-feedback">
            {passed ? (
              <p>🌟 Harika bir performans! Konuyu çok iyi kavramışsın. Bir sonraki konuya geçebilirsin.</p>
            ) : (
              <p>📚 Endişelenme! Bu konuyu tekrar çalışarak başarabilirsin. AI öğretmen sana yardımcı olacak.</p>
            )}
          </div>

          <div className="result-actions">
            <button className="btn-review" onClick={() => {
              setShowResult(false);
              setCurrentQuestion(0);
              setSelectedAnswer(null);
            }}>
              📖 Cevapları İncele
            </button>
            
            <button className="btn-retry" onClick={() => {
              setAnswers(new Array(quiz.questions.length).fill(null));
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setScore(0);
              setShowResult(false);
              setTimeLeft(quiz.duration);
            }}>
              🔄 Tekrar Çöz
            </button>
            
            <button className="btn-dashboard" onClick={() => navigate('/student/dashboard')}>
              🏠 Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-player">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-info">
          <h1>{quiz.title}</h1>
          <div className="quiz-meta">
            <span className="meta-badge">{quiz.subject}</span>
            <span className="meta-badge">{quiz.topic}</span>
          </div>
        </div>
        
        <div className="quiz-timer">
          <span className="timer-icon">⏱️</span>
          <span className="timer-value" style={{ color: timeLeft < 60 ? '#e74c3c' : '#667eea' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="quiz-progress">
        <div className="progress-info">
          <span>Soru {currentQuestion + 1} / {quiz.questions.length}</span>
          <span>%{Math.round(progress)}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question */}
      <div className="question-container">
        <div className="question-difficulty">
          Zorluk: <span className={`difficulty-${question.difficulty}`}>{question.difficulty}</span>
        </div>
        
        <h2 className="question-text">{question.question}</h2>

        <div className="options-grid">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answers[currentQuestion] !== null && index === question.correctAnswer;
            const isWrong = answers[currentQuestion] !== null && answers[currentQuestion] === index && index !== question.correctAnswer;

            return (
              <button
                key={index}
                className={`option-btn ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => answers[currentQuestion] === null && handleSelectAnswer(index)}
                disabled={answers[currentQuestion] !== null}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {isCorrect && <span className="option-icon">✅</span>}
                {isWrong && <span className="option-icon">❌</span>}
              </button>
            );
          })}
        </div>

        {answers[currentQuestion] !== null && (
          <div className={`explanation ${answers[currentQuestion] === question.correctAnswer ? 'correct' : 'wrong'}`}>
            <div className="explanation-icon">
              {answers[currentQuestion] === question.correctAnswer ? '🎉' : '📚'}
            </div>
            <div className="explanation-content">
              <div className="explanation-title">
                {answers[currentQuestion] === question.correctAnswer ? 'Doğru!' : 'Yanlış!'}
              </div>
              <div className="explanation-text">{question.explanation}</div>
              {answers[currentQuestion] === question.correctAnswer && (
                <div className="points-earned">+{question.points} puan kazandın!</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button 
          className="btn-nav"
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
        >
          ← Önceki
        </button>

        <div className="question-indicators">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentQuestion ? 'active' : ''} ${answers[index] !== null ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button 
            className="btn-nav"
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null && answers[currentQuestion] === null}
          >
            Sonraki →
          </button>
        ) : (
          <button 
            className="btn-submit"
            onClick={handleSubmitQuiz}
            disabled={answers.filter(a => a !== null).length < quiz.questions.length}
          >
            ✅ Bitir
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;

