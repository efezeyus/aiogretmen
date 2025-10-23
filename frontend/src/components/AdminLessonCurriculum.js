import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminLessonCurriculum.css';

const AdminLessonCurriculum = () => {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState(''); // 'subject', 'unit', 'topic'

  // MEB Müfredatı Yapısı
  const [curriculum, setCurriculum] = useState({
    '1. Sınıf': {
      'Matematik': {
        units: [
          {
            id: 1,
            name: 'Sayılar ve İşlemler',
            topics: [
              { id: 1, name: 'Rakamlar', hours: 4, completed: true },
              { id: 2, name: '20\'ye Kadar Sayılar', hours: 6, completed: true },
              { id: 3, name: 'Toplama İşlemi', hours: 8, completed: false }
            ]
          },
          {
            id: 2,
            name: 'Geometri',
            topics: [
              { id: 4, name: 'Geometrik Şekiller', hours: 4, completed: false },
              { id: 5, name: 'Uzamsal İlişkiler', hours: 3, completed: false }
            ]
          }
        ]
      },
      'Türkçe': {
        units: [
          {
            id: 3,
            name: 'Dinleme/İzleme',
            topics: [
              { id: 6, name: 'Dinleme Kuralları', hours: 2, completed: true },
              { id: 7, name: 'Dinlediğini Anlama', hours: 4, completed: false }
            ]
          }
        ]
      }
    },
    '5. Sınıf': {
      'Matematik': {
        units: [
          {
            id: 8,
            name: 'Doğal Sayılar',
            topics: [
              { id: 8, name: 'Doğal Sayılarla İşlemler', hours: 12, completed: true },
              { id: 9, name: 'İşlem Önceliği', hours: 4, completed: true }
            ]
          },
          {
            id: 9,
            name: 'Kesirler',
            topics: [
              { id: 10, name: 'Kesir Kavramı', hours: 6, completed: true },
              { id: 11, name: 'Kesirlerle İşlemler', hours: 10, completed: false },
              { id: 12, name: 'Kesir Problemleri', hours: 6, completed: false }
            ]
          },
          {
            id: 10,
            name: 'Ondalık Gösterim',
            topics: [
              { id: 13, name: 'Ondalık Sayılar', hours: 8, completed: false },
              { id: 14, name: 'Ondalık Sayılarla İşlemler', hours: 10, completed: false }
            ]
          }
        ]
      },
      'Fen Bilimleri': {
        units: [
          {
            id: 11,
            name: 'Güneş, Dünya ve Ay',
            topics: [
              { id: 15, name: 'Güneş\'in Yapısı', hours: 4, completed: true },
              { id: 16, name: 'Dünya\'nın Katmanları', hours: 6, completed: false }
            ]
          },
          {
            id: 12,
            name: 'Canlılar Dünyası',
            topics: [
              { id: 17, name: 'Canlıların Sınıflandırılması', hours: 8, completed: false },
              { id: 18, name: 'İnsan ve Çevre', hours: 6, completed: false }
            ]
          }
        ]
      }
    }
  });

  const [newItem, setNewItem] = useState({
    name: '',
    hours: '',
    description: '',
    objectives: [],
    prerequisites: [],
    materials: []
  });

  const grades = Array.from({length: 12}, (_, i) => `${i + 1}. Sınıf`);
  
  const subjects = [
    'Matematik',
    'Fen Bilimleri',
    'Türkçe',
    'Sosyal Bilgiler',
    'İngilizce',
    'Din Kültürü ve Ahlak Bilgisi',
    'Görsel Sanatlar',
    'Müzik',
    'Beden Eğitimi',
    'Teknoloji ve Tasarım',
    'Bilişim Teknolojileri'
  ];

  const handleAddSubject = () => {
    if (!selectedGrade || !newItem.name) return;
    
    setCurriculum(prev => ({
      ...prev,
      [selectedGrade]: {
        ...prev[selectedGrade],
        [newItem.name]: {
          units: []
        }
      }
    }));
    
    setShowAddForm(false);
    setNewItem({ name: '', hours: '', description: '', objectives: [], prerequisites: [], materials: [] });
  };

  const handleAddUnit = () => {
    if (!selectedGrade || !selectedSubject || !newItem.name) return;
    
    const newUnit = {
      id: Date.now(),
      name: newItem.name,
      topics: [],
      description: newItem.description,
      totalHours: newItem.hours || 0
    };
    
    setCurriculum(prev => ({
      ...prev,
      [selectedGrade]: {
        ...prev[selectedGrade],
        [selectedSubject]: {
          ...prev[selectedGrade][selectedSubject],
          units: [...(prev[selectedGrade][selectedSubject]?.units || []), newUnit]
        }
      }
    }));
    
    setShowAddForm(false);
    setNewItem({ name: '', hours: '', description: '', objectives: [], prerequisites: [], materials: [] });
  };

  const handleAddTopic = () => {
    if (!selectedGrade || !selectedSubject || !selectedUnit || !newItem.name) return;
    
    const newTopic = {
      id: Date.now(),
      name: newItem.name,
      hours: parseInt(newItem.hours) || 0,
      completed: false,
      description: newItem.description,
      objectives: newItem.objectives,
      prerequisites: newItem.prerequisites,
      materials: newItem.materials
    };
    
    setCurriculum(prev => {
      const updatedCurriculum = { ...prev };
      const units = updatedCurriculum[selectedGrade][selectedSubject].units;
      const unitIndex = units.findIndex(u => u.name === selectedUnit);
      
      if (unitIndex !== -1) {
        units[unitIndex].topics.push(newTopic);
      }
      
      return updatedCurriculum;
    });
    
    setShowAddForm(false);
    setNewItem({ name: '', hours: '', description: '', objectives: [], prerequisites: [], materials: [] });
  };

  const calculateProgress = (topics) => {
    if (!topics || topics.length === 0) return 0;
    const completed = topics.filter(t => t.completed).length;
    return Math.round((completed / topics.length) * 100);
  };

  const renderCurriculumTab = () => (
    <div className="curriculum-content">
      <div className="curriculum-header">
        <h2>📚 MEB Müfredatı Yönetimi</h2>
        <div className="header-actions">
          <button className="btn-import">📥 Müfredat İçe Aktar</button>
          <button className="btn-export">📤 Müfredat Dışa Aktar</button>
          <button className="btn-sync">🔄 MEB ile Senkronize Et</button>
        </div>
      </div>

      {/* Grade and Subject Selector */}
      <div className="curriculum-filters">
        <div className="filter-group">
          <label>Sınıf Seç</label>
          <select 
            value={selectedGrade} 
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedSubject('');
              setSelectedUnit('');
            }}
          >
            <option value="">Sınıf Seçin</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {selectedGrade && (
          <div className="filter-group">
            <label>Ders Seç</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedUnit('');
              }}
            >
              <option value="">Ders Seçin</option>
              {Object.keys(curriculum[selectedGrade] || {}).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <button 
              className="btn-add-small"
              onClick={() => {
                setFormType('subject');
                setShowAddForm(true);
              }}
            >
              ➕
            </button>
          </div>
        )}
      </div>

      {/* Curriculum Tree View */}
      {selectedGrade && selectedSubject && curriculum[selectedGrade]?.[selectedSubject] && (
        <div className="curriculum-tree">
          <div className="subject-header">
            <h3>{selectedSubject} - {selectedGrade}</h3>
            <button 
              className="btn-add-unit"
              onClick={() => {
                setFormType('unit');
                setShowAddForm(true);
              }}
            >
              ➕ Ünite Ekle
            </button>
          </div>

          <div className="units-list">
            {curriculum[selectedGrade][selectedSubject].units.map((unit, unitIndex) => (
              <div key={unit.id} className="unit-card">
                <div className="unit-header">
                  <div className="unit-info">
                    <h4>{unitIndex + 1}. {unit.name}</h4>
                    <span className="topic-count">{unit.topics.length} konu</span>
                    <span className="progress">{calculateProgress(unit.topics)}% tamamlandı</span>
                  </div>
                  <div className="unit-actions">
                    <button 
                      className="btn-add-topic"
                      onClick={() => {
                        setSelectedUnit(unit.name);
                        setFormType('topic');
                        setShowAddForm(true);
                      }}
                    >
                      ➕ Konu Ekle
                    </button>
                    <button className="btn-edit">✏️</button>
                    <button className="btn-delete">🗑️</button>
                  </div>
                </div>

                <div className="topics-list">
                  {unit.topics.map((topic, topicIndex) => (
                    <div key={topic.id} className="topic-item">
                      <div className="topic-info">
                        <span className="topic-number">{unitIndex + 1}.{topicIndex + 1}</span>
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-hours">⏱️ {topic.hours} saat</span>
                      </div>
                      <div className="topic-status">
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={topic.completed}
                            onChange={(e) => {
                              // Update topic completion status
                              const updatedCurriculum = { ...curriculum };
                              updatedCurriculum[selectedGrade][selectedSubject].units[unitIndex].topics[topicIndex].completed = e.target.checked;
                              setCurriculum(updatedCurriculum);
                            }}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <button className="btn-create-lesson" title="Ders Oluştur">
                          🎓
                        </button>
                        <button className="btn-view-details" title="Detaylar">
                          👁️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="unit-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${calculateProgress(unit.topics)}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {!selectedSubject && selectedGrade && (
        <div className="grade-overview">
          <h3>{selectedGrade} Genel Durum</h3>
          <div className="subjects-grid">
            {Object.entries(curriculum[selectedGrade] || {}).map(([subject, data]) => {
              const totalTopics = data.units.reduce((sum, unit) => sum + unit.topics.length, 0);
              const completedTopics = data.units.reduce((sum, unit) => 
                sum + unit.topics.filter(t => t.completed).length, 0
              );
              const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

              return (
                <div key={subject} className="subject-card">
                  <h4>{subject}</h4>
                  <div className="subject-stats">
                    <span>{data.units.length} ünite</span>
                    <span>{totalTopics} konu</span>
                  </div>
                  <div className="subject-progress">
                    <div className="progress-circle">
                      <span>{progress}%</span>
                    </div>
                  </div>
                  <button 
                    className="btn-select"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    Seç →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="templates-content">
      <h2>📋 Ders Şablonları</h2>
      
      <div className="templates-grid">
        <div className="template-card">
          <div className="template-icon">🔢</div>
          <h3>Matematik Problem Çözme</h3>
          <p>Problem çözme stratejileri ve yöntemleri</p>
          <div className="template-tags">
            <span>5-8. Sınıf</span>
            <span>45 dk</span>
            <span>İnteraktif</span>
          </div>
          <button className="btn-use-template">Kullan</button>
        </div>

        <div className="template-card">
          <div className="template-icon">🔬</div>
          <h3>Fen Deneyi</h3>
          <p>Güvenli ve eğlenceli deney şablonu</p>
          <div className="template-tags">
            <span>6-8. Sınıf</span>
            <span>60 dk</span>
            <span>Laboratuvar</span>
          </div>
          <button className="btn-use-template">Kullan</button>
        </div>

        <div className="template-card">
          <div className="template-icon">📖</div>
          <h3>Türkçe Okuma Anlama</h3>
          <p>Metin analizi ve anlama teknikleri</p>
          <div className="template-tags">
            <span>5-7. Sınıf</span>
            <span>40 dk</span>
            <span>Bireysel</span>
          </div>
          <button className="btn-use-template">Kullan</button>
        </div>

        <div className="template-card">
          <div className="template-icon">🌍</div>
          <h3>Sosyal Bilgiler Projesi</h3>
          <p>Araştırma ve sunum projesi şablonu</p>
          <div className="template-tags">
            <span>6-8. Sınıf</span>
            <span>90 dk</span>
            <span>Grup</span>
          </div>
          <button className="btn-use-template">Kullan</button>
        </div>

        <div className="template-card">
          <div className="template-icon">🗣️</div>
          <h3>İngilizce Konuşma</h3>
          <p>Speaking aktiviteleri ve diyaloglar</p>
          <div className="template-tags">
            <span>5-8. Sınıf</span>
            <span>30 dk</span>
            <span>İkili</span>
          </div>
          <button className="btn-use-template">Kullan</button>
        </div>

        <div className="template-card create-new">
          <div className="template-icon">➕</div>
          <h3>Yeni Şablon Oluştur</h3>
          <p>Kendi ders şablonunuzu oluşturun</p>
          <button className="btn-create-template">Oluştur</button>
        </div>
      </div>
    </div>
  );

  const renderObjectivesTab = () => (
    <div className="objectives-content">
      <h2>🎯 Kazanımlar ve Hedefler</h2>
      
      {selectedGrade && selectedSubject ? (
        <div className="objectives-view">
          <div className="objectives-header">
            <h3>{selectedGrade} - {selectedSubject} Kazanımları</h3>
            <div className="objectives-actions">
              <button className="btn-add">➕ Kazanım Ekle</button>
              <button className="btn-import">📥 MEB'den İçe Aktar</button>
            </div>
          </div>

          <div className="objectives-list">
            <div className="objective-item">
              <div className="objective-code">M.5.1.1</div>
              <div className="objective-content">
                <h4>Doğal sayılarla toplama ve çıkarma işlemlerini yapar</h4>
                <p>Öğrenci, doğal sayılarla toplama ve çıkarma işlemlerini akıcı bir şekilde yapabilir.</p>
                <div className="objective-tags">
                  <span>Bilişsel Alan</span>
                  <span>Uygulama</span>
                  <span>Temel</span>
                </div>
              </div>
              <div className="objective-status">
                <span className="coverage">%85 kapsanıyor</span>
                <button className="btn-link-lesson">Ders Bağla</button>
              </div>
            </div>

            <div className="objective-item">
              <div className="objective-code">M.5.1.2</div>
              <div className="objective-content">
                <h4>Doğal sayılarla çarpma işlemini yapar</h4>
                <p>Öğrenci, iki ve üç basamaklı doğal sayılarla çarpma işlemini yapabilir.</p>
                <div className="objective-tags">
                  <span>Bilişsel Alan</span>
                  <span>Uygulama</span>
                  <span>Temel</span>
                </div>
              </div>
              <div className="objective-status">
                <span className="coverage partial">%60 kapsanıyor</span>
                <button className="btn-link-lesson">Ders Bağla</button>
              </div>
            </div>

            <div className="objective-item">
              <div className="objective-code">M.5.1.3</div>
              <div className="objective-content">
                <h4>Doğal sayılarla bölme işlemini yapar</h4>
                <p>Öğrenci, bölme işleminin anlamını kavrar ve bölme işlemini yapar.</p>
                <div className="objective-tags">
                  <span>Bilişsel Alan</span>
                  <span>Kavrama</span>
                  <span>Temel</span>
                </div>
              </div>
              <div className="objective-status">
                <span className="coverage low">%30 kapsanıyor</span>
                <button className="btn-link-lesson">Ders Bağla</button>
              </div>
            </div>
          </div>

          {/* Objectives Summary */}
          <div className="objectives-summary">
            <h4>Kazanım Özeti</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">24</span>
                <span className="stat-label">Toplam Kazanım</span>
              </div>
              <div className="stat">
                <span className="stat-value">18</span>
                <span className="stat-label">Kapsanan</span>
              </div>
              <div className="stat">
                <span className="stat-value">75%</span>
                <span className="stat-label">Kapsama Oranı</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="objectives-empty">
          <p>Kazanımları görüntülemek için lütfen sınıf ve ders seçin.</p>
        </div>
      )}
    </div>
  );

  const renderResourcesTab = () => (
    <div className="resources-content">
      <h2>📦 Ders Kaynakları</h2>
      
      <div className="resources-categories">
        <div className="category-card">
          <div className="category-icon">📹</div>
          <h3>Video Kaynakları</h3>
          <p>234 video</p>
          <button className="btn-browse">Göz At</button>
        </div>

        <div className="category-card">
          <div className="category-icon">📄</div>
          <h3>PDF Dokümanlar</h3>
          <p>567 doküman</p>
          <button className="btn-browse">Göz At</button>
        </div>

        <div className="category-card">
          <div className="category-icon">🎮</div>
          <h3>İnteraktif İçerikler</h3>
          <p>89 içerik</p>
          <button className="btn-browse">Göz At</button>
        </div>

        <div className="category-card">
          <div className="category-icon">📊</div>
          <h3>Sunumlar</h3>
          <p>156 sunum</p>
          <button className="btn-browse">Göz At</button>
        </div>

        <div className="category-card">
          <div className="category-icon">🧪</div>
          <h3>Deney Kılavuzları</h3>
          <p>45 kılavuz</p>
          <button className="btn-browse">Göz At</button>
        </div>

        <div className="category-card">
          <div className="category-icon">📝</div>
          <h3>Çalışma Kağıtları</h3>
          <p>789 kağıt</p>
          <button className="btn-browse">Göz At</button>
        </div>
      </div>

      {/* Recent Resources */}
      <div className="recent-resources">
        <h3>🕒 Son Eklenen Kaynaklar</h3>
        <div className="resources-list">
          <div className="resource-item">
            <div className="resource-icon">📹</div>
            <div className="resource-info">
              <h4>5. Sınıf Kesirler - Giriş</h4>
              <p>Video • 12 dk • Matematik</p>
            </div>
            <div className="resource-actions">
              <button className="btn-preview">👁️</button>
              <button className="btn-download">📥</button>
              <button className="btn-use">✓ Kullan</button>
            </div>
          </div>

          <div className="resource-item">
            <div className="resource-icon">📄</div>
            <div className="resource-info">
              <h4>Fen Deneyleri Güvenlik Kuralları</h4>
              <p>PDF • 15 sayfa • Fen Bilimleri</p>
            </div>
            <div className="resource-actions">
              <button className="btn-preview">👁️</button>
              <button className="btn-download">📥</button>
              <button className="btn-use">✓ Kullan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-lesson-curriculum">
      {/* Navigation */}
      <div className="curriculum-nav">
        <button 
          className={activeTab === 'curriculum' ? 'active' : ''}
          onClick={() => setActiveTab('curriculum')}
        >
          📚 Müfredat
        </button>
        <button 
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          📋 Şablonlar
        </button>
        <button 
          className={activeTab === 'objectives' ? 'active' : ''}
          onClick={() => setActiveTab('objectives')}
        >
          🎯 Kazanımlar
        </button>
        <button 
          className={activeTab === 'resources' ? 'active' : ''}
          onClick={() => setActiveTab('resources')}
        >
          📦 Kaynaklar
        </button>
      </div>

      {/* Content */}
      <div className="curriculum-main">
        {activeTab === 'curriculum' && renderCurriculumTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'objectives' && renderObjectivesTab()}
        {activeTab === 'resources' && renderResourcesTab()}
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {formType === 'subject' && '➕ Yeni Ders Ekle'}
                {formType === 'unit' && '➕ Yeni Ünite Ekle'}
                {formType === 'topic' && '➕ Yeni Konu Ekle'}
              </h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  {formType === 'subject' && 'Ders Adı'}
                  {formType === 'unit' && 'Ünite Adı'}
                  {formType === 'topic' && 'Konu Adı'}
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder={
                    formType === 'subject' ? 'Örn: Bilişim Teknolojileri' :
                    formType === 'unit' ? 'Örn: Doğal Sayılar' :
                    'Örn: Kesir Kavramı'
                  }
                />
              </div>

              {formType !== 'subject' && (
                <div className="form-group">
                  <label>Açıklama</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Konu hakkında kısa açıklama..."
                    rows="3"
                  />
                </div>
              )}

              {formType === 'topic' && (
                <>
                  <div className="form-group">
                    <label>Ders Saati</label>
                    <input
                      type="number"
                      value={newItem.hours}
                      onChange={(e) => setNewItem({...newItem, hours: e.target.value})}
                      placeholder="Örn: 4"
                      min="1"
                      max="20"
                    />
                  </div>

                  <div className="form-group">
                    <label>Kazanımlar</label>
                    <div className="tag-input">
                      <input
                        type="text"
                        placeholder="Kazanım eklemek için Enter'a basın"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value) {
                            setNewItem({
                              ...newItem,
                              objectives: [...newItem.objectives, e.target.value]
                            });
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="tags-list">
                        {newItem.objectives.map((obj, index) => (
                          <span key={index} className="tag">
                            {obj}
                            <button onClick={() => {
                              setNewItem({
                                ...newItem,
                                objectives: newItem.objectives.filter((_, i) => i !== index)
                              });
                            }}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Önkoşullar</label>
                    <div className="tag-input">
                      <input
                        type="text"
                        placeholder="Önkoşul eklemek için Enter'a basın"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value) {
                            setNewItem({
                              ...newItem,
                              prerequisites: [...newItem.prerequisites, e.target.value]
                            });
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="tags-list">
                        {newItem.prerequisites.map((pre, index) => (
                          <span key={index} className="tag">
                            {pre}
                            <button onClick={() => {
                              setNewItem({
                                ...newItem,
                                prerequisites: newItem.prerequisites.filter((_, i) => i !== index)
                              });
                            }}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddForm(false)}>
                İptal
              </button>
              <button 
                className="btn-save"
                onClick={() => {
                  if (formType === 'subject') handleAddSubject();
                  else if (formType === 'unit') handleAddUnit();
                  else if (formType === 'topic') handleAddTopic();
                }}
              >
                {formType === 'subject' && 'Ders Ekle'}
                {formType === 'unit' && 'Ünite Ekle'}
                {formType === 'topic' && 'Konu Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLessonCurriculum;
