import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentSettings.css';

const StudentSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      showProfile: true,
      showProgress: true,
      allowMessages: true
    },
    learning: {
      dailyGoal: 60,
      difficulty: 'auto',
      aiAssistant: true
    },
    appearance: {
      theme: 'light',
      language: 'tr'
    }
  });

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    alert('✅ Ayarlar kaydedildi!');
  };

  return (
    <div className="student-settings">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard
        </button>
        <h1>⚙️ Ayarlar</h1>
      </div>

      <div className="settings-content">
        {/* Notifications */}
        <div className="settings-section">
          <h2>🔔 Bildirimler</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Email Bildirimleri</div>
              <div className="setting-desc">Önemli güncellemeler için email al</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Push Bildirimleri</div>
              <div className="setting-desc">Tarayıcı bildirimleri</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, push: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="settings-section">
          <h2>🎓 Öğrenme Tercihleri</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Günlük Hedef (dakika)</div>
              <div className="setting-desc">Her gün ne kadar çalışmak istiyorsun?</div>
            </div>
            <select
              value={settings.learning.dailyGoal}
              onChange={(e) => setSettings({
                ...settings,
                learning: { ...settings.learning, dailyGoal: parseInt(e.target.value) }
              })}
              className="setting-select"
            >
              <option value="30">30 dakika</option>
              <option value="60">60 dakika</option>
              <option value="90">90 dakika</option>
              <option value="120">120 dakika</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Zorluk Seviyesi</div>
              <div className="setting-desc">Otomatik veya manuel zorluk</div>
            </div>
            <select
              value={settings.learning.difficulty}
              onChange={(e) => setSettings({
                ...settings,
                learning: { ...settings.learning, difficulty: e.target.value }
              })}
              className="setting-select"
            >
              <option value="auto">Otomatik (AI Belirlir)</option>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">AI Asistan</div>
              <div className="setting-desc">Yapay zeka öğretmen desteği</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.learning.aiAssistant}
                onChange={(e) => setSettings({
                  ...settings,
                  learning: { ...settings.learning, aiAssistant: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-section">
          <h2>🎨 Görünüm</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Tema</div>
              <div className="setting-desc">Arayüz renk teması</div>
            </div>
            <select
              value={settings.appearance.theme}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, theme: e.target.value }
              })}
              className="setting-select"
            >
              <option value="light">☀️ Açık</option>
              <option value="dark">🌙 Koyu</option>
              <option value="auto">🔄 Otomatik</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button className="btn-save" onClick={handleSave}>
            💾 Ayarları Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;

