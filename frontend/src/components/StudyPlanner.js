import React, { useState, useEffect } from 'react';
import './StudyPlanner.css';

const StudyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week, month, agenda
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Matematik - Kesirler Konusu',
      description: 'Kesirler konusunu tekrar et ve alıştırmaları çöz',
      subject: 'matematik',
      priority: 'high',
      duration: 60, // dakika
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // yarın
      completed: false,
      type: 'study'
    },
    {
      id: 2,
      title: 'Fen Bilimleri - Deney Raporu',
      description: 'Asit-baz deneyi raporunu hazırla',
      subject: 'fen_bilimleri',
      priority: 'medium',
      duration: 45,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
      completed: false,
      type: 'assignment'
    },
    {
      id: 3,
      title: 'Türkçe - Kitap Okuma',
      description: 'Günlük 30 dakika kitap okuma',
      subject: 'turkce',
      priority: 'low',
      duration: 30,
      date: new Date(),
      completed: true,
      type: 'reading'
    },
    {
      id: 4,
      title: 'İngilizce - Kelime Çalışması',
      description: 'Yeni kelimeleri öğren ve cümleler kur',
      subject: 'ingilizce',
      priority: 'medium',
      duration: 20,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
      completed: false,
      type: 'vocabulary'
    }
  ]);

  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Matematik Sınavına Hazırlan',
      description: 'Kesirler ve ondalık sayılar konularını tamamen öğren',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonra
      progress: 65,
      subject: 'matematik',
      status: 'in_progress'
    },
    {
      id: 2,
      title: 'Günlük Okuma Alışkanlığı',
      description: 'Her gün en az 30 dakika kitap oku',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 ay sonra
      progress: 80,
      subject: 'turkce',
      status: 'in_progress'
    },
    {
      id: 3,
      title: 'İngilizce Kelime Hazinesi',
      description: '100 yeni kelime öğren',
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 hafta sonra
      progress: 45,
      subject: 'ingilizce',
      status: 'in_progress'
    }
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: 'matematik',
    priority: 'medium',
    duration: 30,
    date: new Date(),
    type: 'study'
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    subject: 'matematik'
  });

  const subjects = {
    matematik: { name: 'Matematik', color: '#e74c3c', icon: '🔢' },
    fen_bilimleri: { name: 'Fen Bilimleri', color: '#3498db', icon: '🔬' },
    turkce: { name: 'Türkçe', color: '#f39c12', icon: '📚' },
    ingilizce: { name: 'İngilizce', color: '#9b59b6', icon: '🌍' },
    sosyal_bilgiler: { name: 'Sosyal Bilgiler', color: '#1abc9c', icon: '🌍' },
    tarih: { name: 'Tarih', color: '#e67e22', icon: '📜' },
    cografya: { name: 'Coğrafya', color: '#27ae60', icon: '🗺️' }
  };

  const taskTypes = {
    study: { name: 'Çalışma', icon: '📖' },
    assignment: { name: 'Ödev', icon: '📝' },
    reading: { name: 'Okuma', icon: '📚' },
    vocabulary: { name: 'Kelime', icon: '📝' },
    quiz: { name: 'Quiz', icon: '❓' },
    review: { name: 'Tekrar', icon: '🔄' }
  };

  useEffect(() => {
    // Günlük istatistikleri güncelle
    updateDailyStats();
  }, [tasks]);

  const updateDailyStats = () => {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(task => 
      task.date.toDateString() === today
    );
    
    const completedToday = todayTasks.filter(task => task.completed).length;
    const totalToday = todayTasks.length;
    
    return { completed: completedToday, total: totalToday };
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getMonthDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Önceki ayın son günleri
    const startOfWeek = new Date(firstDay);
    startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => 
      task.date.toDateString() === date.toDateString()
    );
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const addTask = () => {
    if (newTask.title.trim()) {
      const task = {
        ...newTask,
        id: Date.now(),
        completed: false
      };
      setTasks(prev => [...prev, task]);
      setNewTask({
        title: '',
        description: '',
        subject: 'matematik',
        priority: 'medium',
        duration: 30,
        date: new Date(),
        type: 'study'
      });
      setShowAddTask(false);
    }
  };

  const addGoal = () => {
    if (newGoal.title.trim()) {
      const goal = {
        ...newGoal,
        id: Date.now(),
        progress: 0,
        status: 'in_progress'
      };
      setGoals(prev => [...prev, goal]);
      setNewGoal({
        title: '',
        description: '',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subject: 'matematik'
      });
      setShowAddGoal(false);
    }
  };

  const updateGoalProgress = (goalId, progress) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? { 
              ...goal, 
              progress: Math.min(100, Math.max(0, progress)),
              status: progress >= 100 ? 'completed' : 'in_progress'
            }
          : goal
      )
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const dailyStats = updateDailyStats();

  return (
    <div className="study-planner">
      {/* Header */}
      <div className="planner-header">
        <div className="header-left">
          <h2>📅 Çalışma Planı</h2>
          <div className="daily-stats">
            <span className="stat-item">
              <span className="stat-number">{dailyStats.completed}</span>
              <span className="stat-label">Tamamlanan</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{dailyStats.total}</span>
              <span className="stat-label">Toplam</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">
                {dailyStats.total > 0 ? Math.round((dailyStats.completed / dailyStats.total) * 100) : 0}%
              </span>
              <span className="stat-label">İlerleme</span>
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Haftalık
            </button>
            <button 
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Aylık
            </button>
            <button 
              className={`view-btn ${viewMode === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewMode('agenda')}
            >
              Gündem
            </button>
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-btn add-task-btn"
              onClick={() => setShowAddTask(true)}
            >
              + Görev Ekle
            </button>
            <button 
              className="action-btn add-goal-btn"
              onClick={() => setShowAddGoal(true)}
            >
              + Hedef Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="calendar-navigation">
        <button 
          className="nav-btn"
          onClick={() => {
            const newDate = new Date(currentDate);
            if (viewMode === 'week') {
              newDate.setDate(currentDate.getDate() - 7);
            } else {
              newDate.setMonth(currentDate.getMonth() - 1);
            }
            setCurrentDate(newDate);
          }}
        >
          ← Önceki
        </button>
        
        <h3 className="current-period">
          {viewMode === 'week' 
            ? `${formatDate(getWeekDays()[0])} - ${formatDate(getWeekDays()[6])}`
            : currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
          }
        </h3>
        
        <button 
          className="nav-btn"
          onClick={() => {
            const newDate = new Date(currentDate);
            if (viewMode === 'week') {
              newDate.setDate(currentDate.getDate() + 7);
            } else {
              newDate.setMonth(currentDate.getMonth() + 1);
            }
            setCurrentDate(newDate);
          }}
        >
          Sonraki →
        </button>
      </div>

      {/* Main Content */}
      <div className="planner-content">
        {/* Calendar View */}
        <div className="calendar-section">
          {viewMode === 'week' && (
            <div className="week-view">
              <div className="week-header">
                {getWeekDays().map(day => (
                  <div 
                    key={day.toISOString()} 
                    className={`week-day-header ${day.toDateString() === selectedDate.toDateString() ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="day-name">
                      {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </div>
                    <div className="day-number">
                      {day.getDate()}
                    </div>
                    <div className="day-tasks-count">
                      {getTasksForDate(day).length}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="week-grid">
                {getWeekDays().map(day => (
                  <div 
                    key={day.toISOString()} 
                    className={`week-day ${day.toDateString() === selectedDate.toDateString() ? 'selected' : ''}`}
                  >
                    {getTasksForDate(day).map(task => (
                      <div 
                        key={task.id}
                        className={`task-item ${task.completed ? 'completed' : ''} ${task.priority}`}
                        style={{ borderLeftColor: subjects[task.subject]?.color }}
                      >
                        <div className="task-header">
                          <span className="task-subject-icon">
                            {subjects[task.subject]?.icon}
                          </span>
                          <span className="task-title">{task.title}</span>
                          <span className="task-duration">{task.duration}dk</span>
                        </div>
                        <div className="task-actions">
                          <button 
                            className="task-action-btn"
                            onClick={() => toggleTaskComplete(task.id)}
                          >
                            {task.completed ? '✓' : '○'}
                          </button>
                          <button 
                            className="task-action-btn delete"
                            onClick={() => deleteTask(task.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="month-view">
              <div className="month-grid">
                {getMonthDays().map(day => (
                  <div 
                    key={day.toISOString()} 
                    className={`month-day ${day.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${day.toDateString() === selectedDate.toDateString() ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    <div className="day-tasks">
                      {getTasksForDate(day).slice(0, 3).map(task => (
                        <div 
                          key={task.id}
                          className={`task-dot ${task.completed ? 'completed' : ''}`}
                          style={{ backgroundColor: subjects[task.subject]?.color }}
                          title={task.title}
                        />
                      ))}
                      {getTasksForDate(day).length > 3 && (
                        <div className="more-tasks">+{getTasksForDate(day).length - 3}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="agenda-view">
              <div className="agenda-list">
                {tasks
                  .sort((a, b) => a.date - b.date)
                  .map(task => (
                    <div 
                      key={task.id}
                      className={`agenda-item ${task.completed ? 'completed' : ''}`}
                    >
                      <div className="agenda-time">
                        {formatTime(task.date)}
                      </div>
                      <div className="agenda-content">
                        <div className="agenda-title">{task.title}</div>
                        <div className="agenda-subject">
                          {subjects[task.subject]?.icon} {subjects[task.subject]?.name}
                        </div>
                        <div className="agenda-description">{task.description}</div>
                      </div>
                      <div className="agenda-actions">
                        <button 
                          className="agenda-action-btn"
                          onClick={() => toggleTaskComplete(task.id)}
                        >
                          {task.completed ? '✓' : '○'}
                        </button>
                        <button 
                          className="agenda-action-btn delete"
                          onClick={() => deleteTask(task.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div className="goals-section">
          <h3>🎯 Hedefler</h3>
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <div className="goal-subject">
                    {subjects[goal.subject]?.icon} {subjects[goal.subject]?.name}
                  </div>
                  <div className="goal-progress">
                    {goal.progress}%
                  </div>
                </div>
                
                <div className="goal-title">{goal.title}</div>
                <div className="goal-description">{goal.description}</div>
                
                <div className="goal-progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${goal.progress}%`,
                      backgroundColor: subjects[goal.subject]?.color
                    }}
                  />
                </div>
                
                <div className="goal-meta">
                  <span className="goal-deadline">
                    Hedef: {formatDate(goal.targetDate)}
                  </span>
                  <div className="goal-actions">
                    <button 
                      className="goal-action-btn"
                      onClick={() => updateGoalProgress(goal.id, goal.progress + 10)}
                    >
                      +10%
                    </button>
                    <button 
                      className="goal-action-btn"
                      onClick={() => updateGoalProgress(goal.id, goal.progress - 10)}
                    >
                      -10%
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Yeni Görev Ekle</h3>
            <div className="form-group">
              <label>Başlık:</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Görev başlığı..."
              />
            </div>
            
            <div className="form-group">
              <label>Açıklama:</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Görev açıklaması..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ders:</label>
                <select
                  value={newTask.subject}
                  onChange={(e) => setNewTask(prev => ({ ...prev, subject: e.target.value }))}
                >
                  {Object.entries(subjects).map(([key, subject]) => (
                    <option key={key} value={key}>
                      {typeof subject.icon === 'string' ? subject.icon : ''} {typeof subject.name === 'string' ? subject.name : JSON.stringify(subject.name)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Tür:</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(taskTypes).map(([key, type]) => (
                    <option key={key} value={key}>
                      {typeof type.icon === 'string' ? type.icon : ''} {typeof type.name === 'string' ? type.name : JSON.stringify(type.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Öncelik:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Süre (dk):</label>
                <input
                  type="number"
                  value={newTask.duration}
                  onChange={(e) => setNewTask(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  min="5"
                  max="480"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Tarih:</label>
              <input
                type="datetime-local"
                value={newTask.date.toISOString().slice(0, 16)}
                onChange={(e) => setNewTask(prev => ({ ...prev, date: new Date(e.target.value) }))}
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddTask(false)}>
                İptal
              </button>
              <button className="btn-save" onClick={addTask}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Yeni Hedef Ekle</h3>
            <div className="form-group">
              <label>Hedef:</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Hedef başlığı..."
              />
            </div>
            
            <div className="form-group">
              <label>Açıklama:</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Hedef açıklaması..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ders:</label>
                <select
                  value={newGoal.subject}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, subject: e.target.value }))}
                >
                  {Object.entries(subjects).map(([key, subject]) => (
                    <option key={key} value={key}>
                      {typeof subject.icon === 'string' ? subject.icon : ''} {typeof subject.name === 'string' ? subject.name : JSON.stringify(subject.name)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Hedef Tarih:</label>
                <input
                  type="date"
                  value={newGoal.targetDate.toISOString().split('T')[0]}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddGoal(false)}>
                İptal
              </button>
              <button className="btn-save" onClick={addGoal}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner; 