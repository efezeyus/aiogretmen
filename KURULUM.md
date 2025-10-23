# Yapay Zeka Öğretmen - Kurulum Kılavuzu

## Gereksinimler

- Docker ve Docker Compose
- Node.js 18+ (manuel kurulum için)
- Python 3.11+ (manuel kurulum için)
- MongoDB 7.0+
- PostgreSQL 16+

## Hızlı Kurulum (Docker ile)

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/kullaniciadi/yapayzekaogretmen.git
cd yapayzekaogretmen
```

### 2. Environment Dosyalarını Oluşturun

Backend için `.env` dosyası (`yapayzekaogretmen_python/backend/.env`):
```env
# Sunucu Yapılandırması
APP_ENV=development
DEBUG=True
SECRET_KEY=super-secret-key-change-in-production-2024
API_PREFIX=/api
PORT=8000
HOST=0.0.0.0

# PostgreSQL Veritabanı
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_SERVER=postgresql
POSTGRES_PORT=5432
POSTGRES_DB=yapay_zeka_ogretmen

# MongoDB Veritabanı
MONGODB_URL=mongodb://admin:admin123@mongodb:27017/yapay_zeka_ogretmen?authSource=admin

# JWT Kimlik Doğrulama
JWT_SECRET=jwt-super-secret-key-change-in-production-2024
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here
```

Frontend için `.env` dosyası (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:8000/ws
REACT_APP_ENVIRONMENT=development
```

### 3. Docker Compose ile Başlatın
```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları takip et
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

### 4. Uygulamaya Erişim
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Dokümantasyonu: http://localhost:8000/api/docs

## Manuel Kurulum

### Backend Kurulumu

1. Python sanal ortamı oluşturun:
```bash
cd yapayzekaogretmen_python/backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

3. Veritabanlarını başlatın:
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# PostgreSQL
docker run -d -p 5432:5432 --name postgresql \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=yapay_zeka_ogretmen \
  postgres:16-alpine
```

4. Backend'i başlatın:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Kurulumu

1. Bağımlılıkları yükleyin:
```bash
cd frontend
npm install
```

2. Frontend'i başlatın:
```bash
npm start
```

## Test Kullanıcıları

### Öğrenci
- Email: `ahmet.yilmaz@okul.com`
- Şifre: `test123`

### Veli
- Email: `veli.yilmaz@email.com`
- Şifre: `veli123`

### Admin
- Email: `admin@yapayzekaogretmen.com`
- Şifre: `admin123`

## Sorun Giderme

### Port Çakışması
Eğer portlar kullanımdaysa, `docker-compose.yml` dosyasında portları değiştirin:
```yaml
ports:
  - "3001:3000"  # Frontend için
  - "8001:8000"  # Backend için
```

### Veritabanı Bağlantı Hatası
Docker container'ların çalıştığından emin olun:
```bash
docker ps
```

### Python Bağımlılık Hataları
Python versiyonunuzu kontrol edin:
```bash
python --version  # 3.11+ olmalı
```

## Production Deployment

Production ortamı için:

1. Environment değişkenlerini güncelleyin
2. `DEBUG=False` yapın
3. Güvenli secret key'ler kullanın
4. SSL sertifikası ekleyin
5. Nginx reverse proxy kullanın

Detaylı deployment kılavuzu için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın. 