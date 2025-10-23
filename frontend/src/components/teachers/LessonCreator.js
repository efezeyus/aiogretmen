import React, { useState } from 'react';
import './LessonCreator.css';

const LessonCreator = () => {
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    content: '',
    objectives: [''],
    materials: ['']
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLessonData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (field, index, value) => {
    setLessonData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setLessonData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setLessonData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Ders oluşturuldu:', lessonData);
    // API'ye gönder
  };

  return (
    <div className="lesson-creator">
      <div className="creator-header">
        <h1>Yeni Ders Oluştur</h1>
        <p>AI destekli ders içeriği oluşturucu</p>
      </div>

      <form onSubmit={handleSubmit} className="lesson-form">
        <div className="form-section">
          <h2>Temel Bilgiler</h2>
          
          <div className="form-group">
            <label>Ders Başlığı</label>
            <input
              type="text"
              name="title"
              value={lessonData.title}
              onChange={handleInputChange}
              placeholder="Örn: Matematik Temelleri"
              required
            />
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              name="description"
              value={lessonData.description}
              onChange={handleInputChange}
              placeholder="Dersin kısa açıklaması"
              rows="3"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Konu</label>
              <select
                name="subject"
                value={lessonData.subject}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                <option value="matematik">Matematik</option>
                <option value="fen">Fen Bilimleri</option>
                <option value="turkce">Türkçe</option>
                <option value="sosyal">Sosyal Bilgiler</option>
                <option value="ingilizce">İngilizce</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sınıf Seviyesi</label>
              <select
                name="gradeLevel"
                value={lessonData.gradeLevel}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}. Sınıf</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Öğrenme Hedefleri</h2>
          {lessonData.objectives.map((objective, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleArrayInputChange('objectives', index, e.target.value)}
                placeholder={`${index + 1}. Hedef`}
              />
              {lessonData.objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('objectives', index)}
                  className="remove-btn"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('objectives')}
            className="add-btn"
          >
            + Hedef Ekle
          </button>
        </div>

        <div className="form-section">
          <h2>Ders İçeriği</h2>
          <div className="form-group">
            <label>Ana İçerik</label>
            <textarea
              name="content"
              value={lessonData.content}
              onChange={handleInputChange}
              placeholder="Ders içeriğini buraya yazın veya AI'dan yardım alın"
              rows="10"
              required
            />
          </div>
          <button type="button" className="ai-assist-btn">
            🤖 AI ile İçerik Oluştur
          </button>
        </div>

        <div className="form-section">
          <h2>Gerekli Materyaller</h2>
          {lessonData.materials.map((material, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={material}
                onChange={(e) => handleArrayInputChange('materials', index, e.target.value)}
                placeholder={`${index + 1}. Materyal`}
              />
              {lessonData.materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('materials', index)}
                  className="remove-btn"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('materials')}
            className="add-btn"
          >
            + Materyal Ekle
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Dersi Oluştur
          </button>
          <button type="button" className="btn btn-secondary">
            Taslak Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonCreator;
