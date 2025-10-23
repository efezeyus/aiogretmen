# 🤖 Yapay Zeka Öğretmen - AI Teacher Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/yapayzekaogretmen)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18.2+-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)

> **MEB Müfredatına Uygun Yapay Zeka Destekli Kişiselleştirilmiş Eğitim Platformu**

Modern yapay zeka teknolojileri ile öğrencilere kişiselleştirilmiş, interaktif ve etkili bir öğrenme deneyimi sunan, Türkiye Milli Eğitim Bakanlığı müfredatına tam uyumlu eğitim platformu.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Teknolojiler](#-teknolojiler)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

## ✨ Özellikler

### 🎯 Temel Özellikler

- **🤖 AI Öğretmen**: GPT-4o ve DeepSeek ile desteklenen akıllı öğretmen asistanı
- **📚 MEB Müfredatı**: 2-12. sınıflar için tam uyumlu müfredat
- **🎯 Kişiselleştirilmiş Öğrenme**: Her öğrenciye özel uyarlanabilir içerik
- **📊 İlerleme Takibi**: Detaylı öğrenci performans analizi
- **🎮 Oyunlaştırma**: Rozet, puan ve seviye sistemi
- **🗣️ Sesli Asistan**: Metin-konuşma ve konuşma-metin özellikleri
- **📱 Responsive Tasarım**: Tüm cihazlarda mükemmel deneyim

### 🚀 Gelişmiş Özellikler

- **🧠 Adaptif Öğrenme**: Öğrenci performansına göre otomatik zorluk ayarlama
- **🔍 Akıllı Arama**: Elasticsearch ile hızlı içerik arama
- **📧 Bildirim Sistemi**: Email, SMS ve Push notification desteği
- **💳 Ödeme Entegrasyonu**: Stripe ile güvenli ödeme sistemi
- **🔐 Blockchain Sertifikalar**: Dijital başarı sertifikaları
- **👥 Sosyal Öğrenme**: Öğrenciler arası iş birliği
- **📈 Detaylı Analitik**: Öğretmen ve veli için kapsamlı raporlar
- **🌐 Çoklu Dil Desteği**: Türkçe, İngilizce ve daha fazlası

### 🎓 Roller ve Yetkiler

- **👨‍🎓 Öğrenci**: Ders takibi, quiz, ödev, ilerleme görüntüleme
- **👪 Veli**: Çocuk takibi, performans raporları
- **👨‍🏫 Öğretmen**: İçerik oluşturma, öğrenci yönetimi
- **⚙️ Admin**: Sistem yönetimi, kullanıcı kontrolü

## ⚡ Hızlı Başlangıç

### Tek Komutla Başlat

```bash
# Projeyi klonlayın
git clone https://github.com/yourusername/yapayzekaogretmen.git
cd yapayzekaogretmen

# Sistemi başlatın
./BASLAT.sh
```

Bu kadar! Script otomatik olarak:
- ✅ Gereksinimleri kontrol eder
- ✅ MongoDB ve Redis'i başlatır
- ✅ Backend ve Frontend'i kurar
- ✅ Sistemi başlatır ve tarayıcıyı açar

### Sistemi Durdurma

```bash
./DURDUR.sh
```

## 🔧 Kurulum

### Gereksinimler

- **Python** 3.11 veya üzeri
- **Node.js** 16.0 veya üzeri
- **MongoDB** 7.0 veya üzeri
- **Redis** 7.0 veya üzeri (opsiyonel)
- **Elasticsearch** 8.x (opsiyonel)
- **PostgreSQL** 16.x (opsiyonel)

### Detaylı Kurulum

#### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/yapayzekaogretmen.git
cd yapayzekaogretmen
```

#### 2. Backend Kurulumu

```bash
cd yapayzekaogretmen_python/backend

# Virtual environment oluştur
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows

# Gereksinimleri yükle
pip install -r requirements.txt

# Environment dosyasını oluştur
cp env.example .env

# .env dosyasını düzenle ve API anahtarlarını ekle
nano .env
```

#### 3. Frontend Kurulumu

```bash
cd ../../frontend

# Gereksinimleri yükle
npm install

# Environment dosyasını oluştur
cp env.example .env
```

#### 4. Veritabanı Kurulumu

**MongoDB** (Zorunlu):
```bash
# macOS
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Ubuntu/Debian
sudo apt install mongodb-org
sudo systemctl start mongod
```

**Redis** (Opsiyonel ama önerilen):
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

#### 5. Environment Değişkenleri

Backend `.env` dosyası:
```env
# AI API Anahtarları
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Veritabanı
MONGODB_URL=mongodb://localhost:27017/yapay_zeka_ogretmen

# Security
JWT_SECRET=your-super-secret-key-min-64-characters

# Opsiyonel Servisler
STRIPE_API_KEY=your_stripe_key
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password
```

Frontend `.env` dosyası:
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:8000/ws
```

## 🎮 Kullanım

### Manuel Başlatma

**Backend**:
```bash
cd yapayzekaogretmen_python/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**:
```bash
cd frontend
npm start
```

### Erişim URL'leri

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:8000/api
- 📚 **API Docs**: http://localhost:8000/api/docs
- 📊 **GraphQL Playground**: http://localhost:8000/api/graphql

### Demo Kullanıcılar

**Admin Hesabı**:
```
Email: admin@aiogretmen.com
Şifre: Admin123!
```

**Öğrenci Hesabı (Murat - 6. Sınıf)**:
```
Email: murat@student.com
Şifre: Murat123!
```

## 🛠️ Teknolojiler

### Backend

- **Framework**: FastAPI 0.109
- **AI/ML**: OpenAI GPT-4o, DeepSeek, LangChain
- **Veritabanı**: MongoDB, PostgreSQL (opsiyonel)
- **Cache**: Redis
- **Arama**: Elasticsearch
- **Real-time**: WebSocket
- **Güvenlik**: JWT, bcrypt, CORS
- **Ödeme**: Stripe
- **Bildirim**: Email (SMTP), SMS (Twilio), Push (Firebase)

### Frontend

- **Framework**: React 18.2
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI
- **Routing**: React Router v6
- **Charts**: Chart.js, Recharts
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client

### DevOps

- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx
- **CI/CD**: GitHub Actions (yapılandırılabilir)
- **Monitoring**: Sentry (opsiyonel)
- **Logging**: Loguru

## 📚 API Dokümantasyonu

### REST API

API dokümantasyonuna Swagger UI üzerinden erişebilirsiniz:
```
http://localhost:8000/api/docs
```

### GraphQL API

GraphQL Playground:
```
http://localhost:8000/api/graphql
```

### Örnek API İstekleri

**Kullanıcı Girişi**:
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "murat@student.com",
    "password": "Murat123!"
  }'
```

**AI Öğretmen ile Sohbet**:
```bash
curl -X POST "http://localhost:8000/api/ai/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Merhaba, matematik ödevimde yardıma ihtiyacım var",
    "grade": 6,
    "subject": "matematik"
  }'
```

## 🏗️ Proje Yapısı

```
yapayzekaogretmen/
├── yapayzekaogretmen_python/backend/   # Backend (FastAPI)
│   ├── app/
│   │   ├── api/                        # API routes & controllers
│   │   ├── core/                       # Core config & utilities
│   │   ├── db/                         # Database connections
│   │   ├── models/                     # Data models
│   │   ├── services/                   # Business logic
│   │   └── main.py                     # Application entry
│   ├── requirements.txt
│   └── env.example
├── frontend/                           # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/                 # React components
│   │   ├── pages/                      # Page components
│   │   ├── services/                   # API services
│   │   ├── store/                      # Redux store
│   │   └── App.js
│   ├── package.json
│   └── env.example
├── ai-fine-tuning/                     # AI model training
├── docker-compose.yml                  # Docker configuration
├── BASLAT.sh                          # Quick start script
├── DURDUR.sh                          # Stop script
└── README.md
```

## 🧪 Test

```bash
# Backend testleri
cd yapayzekaogretmen_python/backend
pytest

# Frontend testleri
cd frontend
npm test

# E2E testleri
npm run test:e2e
```

## 🐳 Docker ile Çalıştırma

```bash
# Tüm servisleri başlat
docker-compose up -d

# Servisleri durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f
```

## 📊 Performans

- **API Response Time**: < 200ms (ortalama)
- **Page Load Time**: < 2s (ilk yükleme)
- **Concurrent Users**: 1000+ (desteklenir)
- **Database Queries**: Optimize edilmiş indexler
- **Caching**: Redis ile multi-layer cache

## 🔒 Güvenlik

- ✅ JWT token based authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS yapılandırması
- ✅ Rate limiting
- ✅ SQL injection koruması
- ✅ XSS koruması
- ✅ CSRF token
- ✅ HTTPS (production)
- ✅ Security headers

## 🌍 Deployment

### Production Deployment

```bash
# Environment ayarları
export ENVIRONMENT=production
export DOMAIN=aiogretmen.com

# Docker ile deploy
docker-compose -f docker-compose.prod.yml up -d

# SSL sertifikası (Let's Encrypt)
certbot --nginx -d aiogretmen.com -d www.aiogretmen.com
```

Detaylı deployment bilgisi için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasına bakın.

## 📖 Dokümantasyon

- [Kurulum Rehberi](SETUP_GUIDE.md)
- [API Dokümantasyonu](docs/api/)
- [Kullanım Kılavuzu](SISTEM_KULLANIM_REHBERI.md)
- [DeepSeek Entegrasyonu](DEEPSEEK_GUIDE.md)
- [MEB Müfredat Rehberi](MEB_MUFREDAT_REHBERI.md)
- [Değişiklikler](CHANGELOG.md)

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 🐛 Sorun Bildirme

Bir hata buldunuz mu? [Issue açın](https://github.com/yourusername/yapayzekaogretmen/issues/new)

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Ekip

- **Proje Sahibi**: AI Öğretmen Ekibi
- **Email**: info@aiogretmen.com
- **Website**: https://aiogretmen.com

## 🙏 Teşekkürler

- OpenAI GPT-4 API
- DeepSeek AI
- MEB (Milli Eğitim Bakanlığı)
- Tüm açık kaynak katkıcılara

## 📞 İletişim

- **Website**: https://aiogretmen.com
- **Email**: info@aiogretmen.com
- **Twitter**: [@aiogretmen](https://twitter.com/aiogretmen)
- **LinkedIn**: [AI Öğretmen](https://linkedin.com/company/aiogretmen)

## 🎯 Roadmap

- [ ] Mobil uygulama (React Native)
- [ ] Offline mod
- [ ] AR/VR entegrasyonu
- [ ] Daha fazla AI model desteği
- [ ] Çoklu dil desteği genişletme
- [ ] WhatsApp bot entegrasyonu
- [ ] Video ders oluşturma
- [ ] Otomatik ödev değerlendirme

---

<div align="center">
  <p>
    <strong>🤖 Yapay Zeka ile Geleceğin Eğitimi 📚</strong>
  </p>
  <p>
    <sub>Made with ❤️ in Turkey</sub>
  </p>
  <p>
    <a href="#-hızlı-başlangıç">Başlarken</a> •
    <a href="#-özellikler">Özellikler</a> •
    <a href="#-api-dokümantasyonu">API Docs</a> •
    <a href="#-katkıda-bulunma">Katkıda Bulun</a>
  </p>
</div>
