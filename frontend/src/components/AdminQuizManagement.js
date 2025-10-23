import React, { useState, useEffect } from 'react';
import './AdminQuizManagement.css';

const AdminQuizManagement = () => {
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: '5. Sınıf Matematik - Kesirler',
      subject: 'Matematik',
      grade: '5. Sınıf',
      topic: 'Kesirler',
      questionCount: 20,
      duration: 45,
      difficulty: 'orta',
      status: 'active',
      createdDate: '2024-12-15T10:00:00Z',
      createdBy: 'Ayşe Öğretmen',
      attempts: 342,
      avgScore: 78,
      questions: []
    },
    {
      id: 2,
      title: '8. Sınıf Türkçe - Fiilimsiler',
      subject: 'Türkçe',
      grade: '8. Sınıf',
      topic: 'Fiilimsiler',
      questionCount: 15,
      duration: 30,
      difficulty: 'zor',
      status: 'active',
      createdDate: '2024-12-20T14:30:00Z',
      createdBy: 'Mehmet Öğretmen',
      attempts: 128,
      avgScore: 65,
      questions: []
    }
  ]);

  const [filteredQuizzes, setFilteredQuizzes] = useState(quizzes);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // list, questions, analytics

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    subject: '',
    grade: '',
    topic: '',
    duration: 30,
    difficulty: 'orta',
    status: 'draft',
    questions: []
  });

  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'multiple',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 10,
    image: null
  });

  const [quizStats] = useState({
    total: 156,
    active: 134,
    draft: 22,
    totalAttempts: 12847,
    avgScore: 72,
    popularSubject: 'Matematik'
  });

  const applyFilters = () => {
    let filtered = [...quizzes];

    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(quiz => quiz.subject === filterSubject);
    }

    if (filterGrade !== 'all') {
      filtered = filtered.filter(quiz => quiz.grade === filterGrade);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(quiz => quiz.difficulty === filterDifficulty);
    }

    setFilteredQuizzes(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterSubject, filterGrade, filterDifficulty, quizzes]);

  const handleAddQuiz = () => {
    setEditingQuiz(null);
    setNewQuiz({
      title: '',
      subject: '',
      grade: '',
      topic: '',
      duration: 30,
      difficulty: 'orta',
      status: 'draft',
      questions: []
    });
    setShowQuizModal(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setNewQuiz({
      title: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade,
      topic: quiz.topic,
      duration: quiz.duration,
      difficulty: quiz.difficulty,
      status: quiz.status,
      questions: quiz.questions || []
    });
    setShowQuizModal(true);
  };

  const handleSaveQuiz = () => {
    if (editingQuiz) {
      setQuizzes(prev => prev.map(quiz =>
        quiz.id === editingQuiz.id
          ? { ...quiz, ...newQuiz, questionCount: newQuiz.questions.length }
          : quiz
      ));
    } else {
      const newId = Math.max(...quizzes.map(q => q.id), 0) + 1;
      setQuizzes(prev => [...prev, {
        ...newQuiz,
        id: newId,
        questionCount: newQuiz.questions.length,
        createdDate: new Date().toISOString(),
        createdBy: 'Admin',
        attempts: 0,
        avgScore: 0
      }]);
    }
    setShowQuizModal(false);
  };

  const handleDeleteQuiz = (quizId) => {
    if (window.confirm('Bu quiz\'i silmek istediğinizden emin misiniz?')) {
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
    }
  };

  const handleViewQuestions = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentView('questions');
  };

  const handleAddQuestion = () => {
    setNewQuestion({
      text: '',
      type: 'multiple',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 10,
      image: null
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = () => {
    if (selectedQuiz) {
      const updatedQuiz = {
        ...selectedQuiz,
        questions: [...(selectedQuiz.questions || []), { ...newQuestion, id: Date.now() }]
      };
      
      setQuizzes(prev => prev.map(quiz =>
        quiz.id === selectedQuiz.id ? updatedQuiz : quiz
      ));
      
      setSelectedQuiz(updatedQuiz);
    }
    setShowQuestionModal(false);
  };

  const handleDeleteQuestion = (questionId) => {
    if (selectedQuiz && window.confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      const updatedQuiz = {
        ...selectedQuiz,
        questions: selectedQuiz.questions.filter(q => q.id !== questionId)
      };
      
      setQuizzes(prev => prev.map(quiz =>
        quiz.id === selectedQuiz.id ? updatedQuiz : quiz
      ));
      
      setSelectedQuiz(updatedQuiz);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'kolay': return '#4CAF50';
      case 'orta': return '#FF9800';
      case 'zor': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-quiz-management">
      {currentView === 'list' ? (
        <>
          {/* Header */}
          <div className="quiz-management-header">
            <div className="header-left">
              <h2>📝 Quiz Yönetimi</h2>
              <p>Quiz ve sınavları yönetin</p>
            </div>
            <div className="header-actions">
              <button className="btn-add-quiz" onClick={handleAddQuiz}>
                ➕ Yeni Quiz
              </button>
              <button className="btn-import">
                📥 İçe Aktar
              </button>
              <button className="btn-export">
                📤 Dışa Aktar
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="quiz-stats-grid">
            <div className="quiz-stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <div className="stat-number">{quizStats.total}</div>
                <div className="stat-label">Toplam Quiz</div>
              </div>
            </div>
            <div className="quiz-stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-number">{quizStats.active}</div>
                <div className="stat-label">Aktif Quiz</div>
              </div>
            </div>
            <div className="quiz-stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-number">{quizStats.totalAttempts}</div>
                <div className="stat-label">Toplam Deneme</div>
              </div>
            </div>
            <div className="quiz-stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-number">%{quizStats.avgScore}</div>
                <div className="stat-label">Ortalama Başarı</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="quiz-filters">
            <div className="filter-search">
              <input
                type="text"
                placeholder="🔍 Quiz ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-controls">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tüm Dersler</option>
                <option value="Matematik">Matematik</option>
                <option value="Türkçe">Türkçe</option>
                <option value="Fen Bilimleri">Fen Bilimleri</option>
                <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                <option value="İngilizce">İngilizce</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tüm Sınıflar</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={`${i + 1}. Sınıf`}>{i + 1}. Sınıf</option>
                ))}
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tüm Zorluklar</option>
                <option value="kolay">Kolay</option>
                <option value="orta">Orta</option>
                <option value="zor">Zor</option>
              </select>
            </div>
          </div>

          {/* Quizzes Grid */}
          <div className="quizzes-grid">
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-header">
                  <h3>{quiz.title}</h3>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(quiz.difficulty) }}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
                
                <div className="quiz-info">
                  <div className="info-row">
                    <span>📚 {quiz.subject}</span>
                    <span>🎓 {quiz.grade}</span>
                  </div>
                  <div className="info-row">
                    <span>❓ {quiz.questionCount} soru</span>
                    <span>⏱️ {quiz.duration} dk</span>
                  </div>
                  <div className="info-row">
                    <span>📊 {quiz.attempts} deneme</span>
                    <span>🎯 %{quiz.avgScore} başarı</span>
                  </div>
                </div>

                <div className="quiz-meta">
                  <span>👤 {quiz.createdBy}</span>
                  <span>📅 {formatDate(quiz.createdDate)}</span>
                </div>

                <div className="quiz-actions">
                  <button
                    className="action-btn view"
                    onClick={() => handleViewQuestions(quiz)}
                    title="Soruları Görüntüle"
                  >
                    👁️ Sorular
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditQuiz(quiz)}
                    title="Düzenle"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn analytics"
                    title="İstatistikler"
                  >
                    📊
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : currentView === 'questions' && selectedQuiz && (
        <div className="questions-view">
          <div className="questions-header">
            <button
              className="btn-back"
              onClick={() => setCurrentView('list')}
            >
              ← Geri
            </button>
            <h2>{selectedQuiz.title} - Sorular</h2>
            <button
              className="btn-add-question"
              onClick={handleAddQuestion}
            >
              ➕ Soru Ekle
            </button>
          </div>

          <div className="questions-list">
            {selectedQuiz.questions?.length > 0 ? (
              selectedQuiz.questions.map((question, index) => (
                <div key={question.id} className="question-item">
                  <div className="question-number">Soru {index + 1}</div>
                  <div className="question-content">
                    <p className="question-text">{question.text}</p>
                    {question.type === 'multiple' && (
                      <div className="question-options">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`option ${optIndex === question.correctAnswer ? 'correct' : ''}`}
                          >
                            {String.fromCharCode(65 + optIndex)}) {option}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.explanation && (
                      <div className="question-explanation">
                        <strong>Açıklama:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                  <div className="question-actions">
                    <span className="points">{question.points} puan</span>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-questions">
                <p>Henüz soru eklenmemiş.</p>
                <button onClick={handleAddQuestion}>İlk Soruyu Ekle</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="modal-overlay">
          <div className="quiz-modal">
            <div className="modal-header">
              <h3>{editingQuiz ? 'Quiz Düzenle' : 'Yeni Quiz Oluştur'}</h3>
              <button
                className="modal-close"
                onClick={() => setShowQuizModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Quiz Başlığı</label>
                <input
                  type="text"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                  placeholder="Örn: 5. Sınıf Matematik - Kesirler"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ders</label>
                  <select
                    value={newQuiz.subject}
                    onChange={(e) => setNewQuiz({...newQuiz, subject: e.target.value})}
                  >
                    <option value="">Ders seçin</option>
                    <option value="Matematik">Matematik</option>
                    <option value="Türkçe">Türkçe</option>
                    <option value="Fen Bilimleri">Fen Bilimleri</option>
                    <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                    <option value="İngilizce">İngilizce</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sınıf</label>
                  <select
                    value={newQuiz.grade}
                    onChange={(e) => setNewQuiz({...newQuiz, grade: e.target.value})}
                  >
                    <option value="">Sınıf seçin</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={`${i + 1}. Sınıf`}>{i + 1}. Sınıf</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Konu</label>
                <input
                  type="text"
                  value={newQuiz.topic}
                  onChange={(e) => setNewQuiz({...newQuiz, topic: e.target.value})}
                  placeholder="Örn: Kesirler, Fiilimsiler"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Süre (dakika)</label>
                  <input
                    type="number"
                    value={newQuiz.duration}
                    onChange={(e) => setNewQuiz({...newQuiz, duration: parseInt(e.target.value)})}
                    min="5"
                    max="180"
                  />
                </div>
                <div className="form-group">
                  <label>Zorluk</label>
                  <select
                    value={newQuiz.difficulty}
                    onChange={(e) => setNewQuiz({...newQuiz, difficulty: e.target.value})}
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Durum</label>
                <select
                  value={newQuiz.status}
                  onChange={(e) => setNewQuiz({...newQuiz, status: e.target.value})}
                >
                  <option value="draft">Taslak</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowQuizModal(false)}
              >
                İptal
              </button>
              <button
                className="btn-save"
                onClick={handleSaveQuiz}
              >
                {editingQuiz ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="modal-overlay">
          <div className="question-modal">
            <div className="modal-header">
              <h3>Yeni Soru Ekle</h3>
              <button
                className="modal-close"
                onClick={() => setShowQuestionModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Soru Metni</label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                  placeholder="Soruyu yazın..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Soru Tipi</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                  >
                    <option value="multiple">Çoktan Seçmeli</option>
                    <option value="truefalse">Doğru/Yanlış</option>
                    <option value="open">Açık Uçlu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Puan</label>
                  <input
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {newQuestion.type === 'multiple' && (
                <>
                  <div className="form-group">
                    <label>Seçenekler</label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="option-input">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newQuestion.correctAnswer === index}
                          onChange={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOptions});
                          }}
                          placeholder={`${String.fromCharCode(65 + index)} şıkkı`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Açıklama (İsteğe bağlı)</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Doğru cevabın açıklaması..."
                  rows="2"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowQuestionModal(false)}
              >
                İptal
              </button>
              <button
                className="btn-save"
                onClick={handleSaveQuestion}
              >
                Soruyu Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizManagement;
