import React, { useState } from 'react';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [changedSettings, setChangedSettings] = useState({});

  // Genel Ayarlar
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Yapay Zeka Öğretmen',
    siteDescription: 'Öğrenciler için AI destekli eğitim platformu',
    siteUrl: 'https://yapayzekaogretmen.com',
    supportEmail: 'destek@yapayzekaogretmen.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    autoApproveTeachers: false
  });

  // AI Ayarları
  const [aiSettings, setAISettings] = useState({
    defaultModel: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
    enableAutoLearning: true,
    enableRAG: true,
    enableVoiceAssistant: true,
    responseLanguage: 'tr',
    adaptiveLearningLevel: 'medium'
  });

  // Eğitim Ayarları
  const [educationSettings, setEducationSettings] = useState({
    defaultGradeSystem: '1-12',
    lessonDuration: 45,
    quizPassScore: 60,
    maxRetakeAttempts: 3,
    showCorrectAnswers: true,
    enablePeerLearning: true,
    enableParentAccess: true,
    certificateGeneration: true
  });

  // Güvenlik Ayarları
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    enableCaptcha: true,
    dataEncryption: true
  });

  // Bildirim Ayarları
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newUserNotification: true,
    lessonCompletionNotification: true,
    quizResultNotification: true,
    systemUpdateNotification: true,
    weeklyReportEmail: true
  });

  // API Ayarları
  const [apiSettings, setAPISettings] = useState({
    apiRateLimit: 1000,
    apiTimeout: 30,
    enableAPIAccess: true,
    requireAPIKey: true,
    logAPIRequests: true,
    corsEnabled: true,
    allowedOrigins: '*',
    webhooksEnabled: false
  });

  const handleSettingChange = (category, key, value) => {
    const updateSettings = {
      general: [generalSettings, setGeneralSettings],
      ai: [aiSettings, setAISettings],
      education: [educationSettings, setEducationSettings],
      security: [securitySettings, setSecuritySettings],
      notifications: [notificationSettings, setNotificationSettings],
      api: [apiSettings, setAPISettings]
    };

    const [settings, setSettings] = updateSettings[category];
    setSettings({ ...settings, [key]: value });
    setChangedSettings({ ...changedSettings, [`${category}.${key}`]: value });
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', changedSettings);
    setShowSaveModal(true);
    setTimeout(() => {
      setShowSaveModal(false);
      setChangedSettings({});
    }, 2000);
  };

  const handleResetSettings = (category) => {
    if (window.confirm(`${category} ayarlarını varsayılana döndürmek istediğinizden emin misiniz?`)) {
      console.log(`Resetting ${category} settings`);
    }
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>🌐 Genel Ayarlar</h3>
      
      <div className="setting-group">
        <label>Site Adı</label>
        <input
          type="text"
          value={generalSettings.siteName}
          onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>Site Açıklaması</label>
        <textarea
          value={generalSettings.siteDescription}
          onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
          rows="3"
        />
      </div>

      <div className="setting-group">
        <label>Site URL</label>
        <input
          type="url"
          value={generalSettings.siteUrl}
          onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>Destek E-posta</label>
        <input
          type="email"
          value={generalSettings.supportEmail}
          onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
        />
      </div>

      <div className="settings-toggles">
        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={generalSettings.maintenanceMode}
              onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
            />
            <span>Bakım Modu</span>
          </label>
          <p>Site bakım modunda olduğunda sadece yöneticiler giriş yapabilir</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={generalSettings.registrationEnabled}
              onChange={(e) => handleSettingChange('general', 'registrationEnabled', e.target.checked)}
            />
            <span>Kayıt Olma Aktif</span>
          </label>
          <p>Yeni kullanıcıların sisteme kayıt olmasına izin ver</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={generalSettings.emailVerification}
              onChange={(e) => handleSettingChange('general', 'emailVerification', e.target.checked)}
            />
            <span>E-posta Doğrulama</span>
          </label>
          <p>Kullanıcılar e-posta adreslerini doğrulamalı</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={generalSettings.autoApproveTeachers}
              onChange={(e) => handleSettingChange('general', 'autoApproveTeachers', e.target.checked)}
            />
            <span>Öğretmen Otomatik Onay</span>
          </label>
          <p>Öğretmen kayıtları otomatik onaylansın</p>
        </div>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="settings-section">
      <h3>🤖 AI Ayarları</h3>
      
      <div className="setting-group">
        <label>Varsayılan AI Modeli</label>
        <select
          value={aiSettings.defaultModel}
          onChange={(e) => handleSettingChange('ai', 'defaultModel', e.target.value)}
        >
          <option value="deepseek-chat">DeepSeek Chat</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3">Claude 3</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Temperature (0-1)</label>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={aiSettings.temperature}
            onChange={(e) => handleSettingChange('ai', 'temperature', parseFloat(e.target.value))}
          />
          <span>{aiSettings.temperature}</span>
        </div>
        <p className="setting-help">Düşük değerler daha tutarlı, yüksek değerler daha yaratıcı cevaplar</p>
      </div>

      <div className="setting-group">
        <label>Maksimum Token</label>
        <input
          type="number"
          value={aiSettings.maxTokens}
          onChange={(e) => handleSettingChange('ai', 'maxTokens', parseInt(e.target.value))}
          min="100"
          max="4000"
        />
      </div>

      <div className="setting-group">
        <label>Yanıt Dili</label>
        <select
          value={aiSettings.responseLanguage}
          onChange={(e) => handleSettingChange('ai', 'responseLanguage', e.target.value)}
        >
          <option value="tr">Türkçe</option>
          <option value="en">İngilizce</option>
          <option value="de">Almanca</option>
          <option value="fr">Fransızca</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Adaptif Öğrenme Seviyesi</label>
        <select
          value={aiSettings.adaptiveLearningLevel}
          onChange={(e) => handleSettingChange('ai', 'adaptiveLearningLevel', e.target.value)}
        >
          <option value="low">Düşük</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksek</option>
        </select>
      </div>

      <div className="settings-toggles">
        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={aiSettings.enableAutoLearning}
              onChange={(e) => handleSettingChange('ai', 'enableAutoLearning', e.target.checked)}
            />
            <span>Otomatik Öğrenme</span>
          </label>
          <p>AI kendini geliştirsin ve öğrenci etkileşimlerinden öğrensin</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={aiSettings.enableRAG}
              onChange={(e) => handleSettingChange('ai', 'enableRAG', e.target.checked)}
            />
            <span>RAG (Retrieval Augmented Generation)</span>
          </label>
          <p>Veritabanından bilgi alarak daha doğru cevaplar üret</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={aiSettings.enableVoiceAssistant}
              onChange={(e) => handleSettingChange('ai', 'enableVoiceAssistant', e.target.checked)}
            />
            <span>Sesli Asistan</span>
          </label>
          <p>Sesli komutlar ve yanıtlar aktif olsun</p>
        </div>
      </div>
    </div>
  );

  const renderEducationSettings = () => (
    <div className="settings-section">
      <h3>🎓 Eğitim Ayarları</h3>
      
      <div className="setting-group">
        <label>Sınıf Sistemi</label>
        <select
          value={educationSettings.defaultGradeSystem}
          onChange={(e) => handleSettingChange('education', 'defaultGradeSystem', e.target.value)}
        >
          <option value="1-12">1-12 (Türkiye)</option>
          <option value="K-12">K-12 (US)</option>
          <option value="1-13">1-13 (UK)</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Ders Süresi (dakika)</label>
        <input
          type="number"
          value={educationSettings.lessonDuration}
          onChange={(e) => handleSettingChange('education', 'lessonDuration', parseInt(e.target.value))}
          min="15"
          max="90"
        />
      </div>

      <div className="setting-group">
        <label>Quiz Geçme Notu (%)</label>
        <input
          type="number"
          value={educationSettings.quizPassScore}
          onChange={(e) => handleSettingChange('education', 'quizPassScore', parseInt(e.target.value))}
          min="0"
          max="100"
        />
      </div>

      <div className="setting-group">
        <label>Maksimum Tekrar Hakkı</label>
        <input
          type="number"
          value={educationSettings.maxRetakeAttempts}
          onChange={(e) => handleSettingChange('education', 'maxRetakeAttempts', parseInt(e.target.value))}
          min="0"
          max="10"
        />
      </div>

      <div className="settings-toggles">
        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={educationSettings.showCorrectAnswers}
              onChange={(e) => handleSettingChange('education', 'showCorrectAnswers', e.target.checked)}
            />
            <span>Doğru Cevapları Göster</span>
          </label>
          <p>Quiz sonunda doğru cevapları göster</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={educationSettings.enablePeerLearning}
              onChange={(e) => handleSettingChange('education', 'enablePeerLearning', e.target.checked)}
            />
            <span>Akran Öğrenmesi</span>
          </label>
          <p>Öğrenciler birbirlerinden öğrenebilsin</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={educationSettings.enableParentAccess}
              onChange={(e) => handleSettingChange('education', 'enableParentAccess', e.target.checked)}
            />
            <span>Veli Erişimi</span>
          </label>
          <p>Veliler çocuklarının ilerlemesini takip edebilsin</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={educationSettings.certificateGeneration}
              onChange={(e) => handleSettingChange('education', 'certificateGeneration', e.target.checked)}
            />
            <span>Sertifika Oluşturma</span>
          </label>
          <p>Ders tamamlandığında otomatik sertifika oluştur</p>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>🔒 Güvenlik Ayarları</h3>
      
      <div className="setting-group">
        <label>Minimum Şifre Uzunluğu</label>
        <input
          type="number"
          value={securitySettings.passwordMinLength}
          onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
          min="6"
          max="20"
        />
      </div>

      <div className="setting-group">
        <label>Oturum Zaman Aşımı (dakika)</label>
        <input
          type="number"
          value={securitySettings.sessionTimeout}
          onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
          min="5"
          max="1440"
        />
      </div>

      <div className="setting-group">
        <label>Maksimum Giriş Denemesi</label>
        <input
          type="number"
          value={securitySettings.maxLoginAttempts}
          onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
          min="3"
          max="10"
        />
      </div>

      <div className="settings-toggles">
        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={securitySettings.passwordRequireUppercase}
              onChange={(e) => handleSettingChange('security', 'passwordRequireUppercase', e.target.checked)}
            />
            <span>Büyük Harf Zorunlu</span>
          </label>
          <p>Şifrede en az bir büyük harf bulunmalı</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={securitySettings.passwordRequireNumber}
              onChange={(e) => handleSettingChange('security', 'passwordRequireNumber', e.target.checked)}
            />
            <span>Rakam Zorunlu</span>
          </label>
          <p>Şifrede en az bir rakam bulunmalı</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={securitySettings.passwordRequireSpecial}
              onChange={(e) => handleSettingChange('security', 'passwordRequireSpecial', e.target.checked)}
            />
            <span>Özel Karakter Zorunlu</span>
          </label>
          <p>Şifrede en az bir özel karakter bulunmalı</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={securitySettings.enableTwoFactor}
              onChange={(e) => handleSettingChange('security', 'enableTwoFactor', e.target.checked)}
            />
            <span>İki Faktörlü Doğrulama</span>
          </label>
          <p>Ekstra güvenlik için 2FA etkinleştir</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={securitySettings.enableCaptcha}
              onChange={(e) => handleSettingChange('security', 'enableCaptcha', e.target.checked)}
            />
            <span>CAPTCHA</span>
          </label>
          <p>Bot koruması için CAPTCHA kullan</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={securitySettings.dataEncryption}
              onChange={(e) => handleSettingChange('security', 'dataEncryption', e.target.checked)}
            />
            <span>Veri Şifreleme</span>
          </label>
          <p>Hassas verileri şifrele</p>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>🔔 Bildirim Ayarları</h3>
      
      <div className="settings-toggles">
        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
            />
            <span>E-posta Bildirimleri</span>
          </label>
          <p>E-posta ile bildirim gönder</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.pushNotifications}
              onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
            />
            <span>Push Bildirimleri</span>
          </label>
          <p>Tarayıcı push bildirimleri</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.smsNotifications}
              onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
            />
            <span>SMS Bildirimleri</span>
          </label>
          <p>Önemli bildirimler için SMS gönder</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.newUserNotification}
              onChange={(e) => handleSettingChange('notifications', 'newUserNotification', e.target.checked)}
            />
            <span>Yeni Kullanıcı Bildirimi</span>
          </label>
          <p>Yeni kullanıcı kaydında bildirim</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.lessonCompletionNotification}
              onChange={(e) => handleSettingChange('notifications', 'lessonCompletionNotification', e.target.checked)}
            />
            <span>Ders Tamamlama Bildirimi</span>
          </label>
          <p>Öğrenci ders tamamladığında bildir</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.quizResultNotification}
              onChange={(e) => handleSettingChange('notifications', 'quizResultNotification', e.target.checked)}
            />
            <span>Quiz Sonuç Bildirimi</span>
          </label>
          <p>Quiz sonuçlarını bildir</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.systemUpdateNotification}
              onChange={(e) => handleSettingChange('notifications', 'systemUpdateNotification', e.target.checked)}
            />
            <span>Sistem Güncelleme Bildirimi</span>
          </label>
          <p>Sistem güncellemelerini bildir</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={notificationSettings.weeklyReportEmail}
              onChange={(e) => handleSettingChange('notifications', 'weeklyReportEmail', e.target.checked)}
            />
            <span>Haftalık Rapor E-postası</span>
          </label>
          <p>Her hafta özet rapor gönder</p>
        </div>
      </div>
    </div>
  );

  const renderAPISettings = () => (
    <div className="settings-section">
      <h3>🔌 API Ayarları</h3>
      
      <div className="setting-group">
        <label>API Rate Limit (istek/saat)</label>
        <input
          type="number"
          value={apiSettings.apiRateLimit}
          onChange={(e) => handleSettingChange('api', 'apiRateLimit', parseInt(e.target.value))}
          min="100"
          max="10000"
        />
      </div>

      <div className="setting-group">
        <label>API Timeout (saniye)</label>
        <input
          type="number"
          value={apiSettings.apiTimeout}
          onChange={(e) => handleSettingChange('api', 'apiTimeout', parseInt(e.target.value))}
          min="10"
          max="120"
        />
      </div>

      <div className="setting-group">
        <label>İzin Verilen Origin'ler</label>
        <input
          type="text"
          value={apiSettings.allowedOrigins}
          onChange={(e) => handleSettingChange('api', 'allowedOrigins', e.target.value)}
          placeholder="* veya https://example.com"
        />
      </div>

      <div className="settings-toggles">
        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={apiSettings.enableAPIAccess}
              onChange={(e) => handleSettingChange('api', 'enableAPIAccess', e.target.checked)}
            />
            <span>API Erişimi</span>
          </label>
          <p>Dış API erişimine izin ver</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={apiSettings.requireAPIKey}
              onChange={(e) => handleSettingChange('api', 'requireAPIKey', e.target.checked)}
            />
            <span>API Key Zorunlu</span>
          </label>
          <p>API erişimi için key gereksin</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={apiSettings.logAPIRequests}
              onChange={(e) => handleSettingChange('api', 'logAPIRequests', e.target.checked)}
            />
            <span>API İstekleri Logla</span>
          </label>
          <p>Tüm API isteklerini kaydet</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={apiSettings.corsEnabled}
              onChange={(e) => handleSettingChange('api', 'corsEnabled', e.target.checked)}
            />
            <span>CORS Aktif</span>
          </label>
          <p>Cross-Origin isteklere izin ver</p>
        </div>

        <div className="toggle-item">
          <label>
            <input
              type="checkbox"
              checked={apiSettings.webhooksEnabled}
              onChange={(e) => handleSettingChange('api', 'webhooksEnabled', e.target.checked)}
            />
            <span>Webhooks</span>
          </label>
          <p>Webhook entegrasyonlarını aktifleştir</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h2>⚙️ Sistem Ayarları</h2>
        <div className="header-actions">
          {Object.keys(changedSettings).length > 0 && (
            <span className="unsaved-changes">
              ⚠️ {Object.keys(changedSettings).length} kaydedilmemiş değişiklik
            </span>
          )}
          <button 
            className="btn-save"
            onClick={handleSaveSettings}
            disabled={Object.keys(changedSettings).length === 0}
          >
            💾 Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="settings-menu">
            <button
              className={`menu-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="menu-icon">🌐</span>
              <span>Genel</span>
            </button>
            <button
              className={`menu-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <span className="menu-icon">🤖</span>
              <span>AI</span>
            </button>
            <button
              className={`menu-item ${activeTab === 'education' ? 'active' : ''}`}
              onClick={() => setActiveTab('education')}
            >
              <span className="menu-icon">🎓</span>
              <span>Eğitim</span>
            </button>
            <button
              className={`menu-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="menu-icon">🔒</span>
              <span>Güvenlik</span>
            </button>
            <button
              className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="menu-icon">🔔</span>
              <span>Bildirimler</span>
            </button>
            <button
              className={`menu-item ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <span className="menu-icon">🔌</span>
              <span>API</span>
            </button>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'ai' && renderAISettings()}
          {activeTab === 'education' && renderEducationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'api' && renderAPISettings()}

          <div className="settings-footer">
            <button 
              className="btn-reset"
              onClick={() => handleResetSettings(activeTab)}
            >
              🔄 Varsayılana Dön
            </button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="save-modal">
          <div className="modal-content">
            <div className="success-icon">✅</div>
            <h3>Ayarlar Kaydedildi!</h3>
            <p>Değişiklikler başarıyla uygulandı.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
