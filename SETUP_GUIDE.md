# Yapay Zeka Öğretmen - Kurulum Rehberi

## 📋 İçindekiler

1. [Sistem Gereksinimleri](#sistem-gereksinimleri)
2. [Backend Kurulumu](#backend-kurulumu)
3. [Frontend Kurulumu](#frontend-kurulumu)
4. [Veritabanı Kurulumu](#veritabanı-kurulumu)
5. [Servis Kurulumları](#servis-kurulumları)
6. [Çalıştırma](#çalıştırma)
7. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Sistem Gereksinimleri

### Zorunlu
- Python 3.10 veya üzeri
- Node.js 16.x veya üzeri
- MongoDB 5.0 veya üzeri
- Git

### Opsiyonel (İleri Seviye Özellikler İçin)
- PostgreSQL 13 veya üzeri
- Redis 6.0 veya üzeri
- Elasticsearch 8.x

---

## 🐍 Backend Kurulumu

### 1. Repository'yi Klonlayın
```bash
git clone <repository-url>
cd yapayzekaogretmen
```

### 2. Python Virtual Environment Oluşturun
```bash
cd yapayzekaogretmen_python/backend
python -m venv venv

# Aktif edin:
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 3. Bağımlılıkları Yükleyin
```bash
# Temel paketler
pip install -r requirements.txt

# Eğer hata alırsanız, aşamalı yükleme yapın:
pip install -r requirements_minimal.txt
pip install -r requirements_additional.txt
```

### 4. Environment Dosyasını Oluşturun
```bash
cp env.example .env
```

`.env` dosyasını düzenleyin ve gerekli ayarları yapın:

```env
# Zorunlu Ayarlar
MONGODB_URL="mongodb://localhost:27017/yapay_zeka_ogretmen"
JWT_SECRET="your-super-secret-key-min-64-chars"
OPENAI_API_KEY="your-openai-api-key"

# Opsiyonel - DeepSeek API (Alternatif AI)
DEEPSEEK_API_KEY="your-deepseek-api-key"

# Opsiyonel - İleri Seviye Özellikler
REDIS_URL="redis://localhost:6379/0"
ELASTICSEARCH_URL="http://localhost:9200"
POSTGRES_USER="your_user"
POSTGRES_PASSWORD="your_password"
```

### 5. Veritabanı Migrationlarını Çalıştırın
```bash
# MongoDB bağlantısını test edin
python -c "from app.db import connect_to_db; import asyncio; asyncio.run(connect_to_db())"
```

---

## ⚛️ Frontend Kurulumu

### 1. Frontend Klasörüne Gidin
```bash
cd ../../frontend
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Dosyasını Oluşturun
```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/api/ws
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

---

## 💾 Veritabanı Kurulumu

### MongoDB (Zorunlu)

#### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Ubuntu/Debian
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows
[MongoDB İndir](https://www.mongodb.com/try/download/community)

### PostgreSQL (Opsiyonel)

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
createdb yapay_zeka_ogretmen
```

#### Ubuntu/Debian
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb yapay_zeka_ogretmen
```

---

## 🔌 Servis Kurulumları (Opsiyonel)

### Redis (Cache & WebSocket)

#### macOS
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Test
```bash
redis-cli ping
# PONG döndürmeli
```

### Elasticsearch (Arama)

#### macOS
```bash
brew tap elastic/tap
brew install elastic/tap/elasticsearch-full
brew services start elasticsearch-full
```

#### Ubuntu/Debian
```bash
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.11.1-amd64.deb
sudo dpkg -i elasticsearch-8.11.1-amd64.deb
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch
```

#### Test
```bash
curl -X GET "localhost:9200"
```

---

## 🚀 Çalıştırma

### Backend'i Başlatın

#### Temel Mod (Sadece MongoDB)
```bash
cd yapayzekaogretmen_python/backend
source venv/bin/activate  # veya venv\Scripts\activate (Windows)
python run.py
```

#### Geliştirici Modu (Hot Reload)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend şu adreste çalışacak: `http://localhost:8000`
API Docs: `http://localhost:8000/api/docs`

### Frontend'i Başlatın

```bash
cd frontend
npm start
```

Frontend şu adreste çalışacak: `http://localhost:3000`

---

## 🧪 Test ve Doğrulama

### Backend Health Check
```bash
curl http://localhost:8000/health
```

Beklenen yanıt:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development"
}
```

### Sistem Sağlık Kontrolü
```bash
curl http://localhost:8000/api/system/health
```

### Frontend Test
Tarayıcıda `http://localhost:3000` adresini açın.

---

## 🔍 Sorun Giderme

### "ModuleNotFoundError: No module named 'XXX'"
```bash
cd yapayzekaogretmen_python/backend
source venv/bin/activate
pip install <eksik-paket>
```

### MongoDB Bağlantı Hatası
```bash
# MongoDB'nin çalıştığını kontrol edin
mongosh
# veya
mongo
```

### Port Çakışması
Backend için farklı port:
```bash
uvicorn app.main:app --port 8001
```

Frontend için farklı port:
```bash
PORT=3001 npm start
```

### Redis Bağlanamıyor
```bash
# Redis'in çalıştığını kontrol edin
redis-cli ping

# Çalışmıyorsa:
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### Elasticsearch Bağlanamıyor
```bash
# Elasticsearch'ün çalıştığını kontrol edin
curl localhost:9200

# Çalışmıyorsa:
brew services start elasticsearch-full  # macOS
sudo systemctl start elasticsearch  # Linux
```

---

## 📦 Minimum Kurulum (Sadece Temel Özellikler)

Eğer sadece temel özellikleri test etmek istiyorsanız:

1. **Sadece MongoDB yükleyin**
2. **Backend .env'de sadece şunları ayarlayın:**
   - `MONGODB_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (veya `DEEPSEEK_API_KEY`)

3. **Opsiyonel servisleri kapatın:**
   ```env
   REDIS_URL=""
   ELASTICSEARCH_URL=""
   ```

4. **Backend başlatın - sistem otomatik olarak eksik servisleri atlayacak**

---

## 📚 Ek Kaynaklar

- [API Dokümantasyonu](http://localhost:8000/api/docs)
- [Proje Yapısı](PROJECT_STRUCTURE.md)
- [Deployment Rehberi](DEPLOYMENT.md)

---

## 🆘 Destek

Sorun yaşıyorsanız:
1. Logları kontrol edin: `yapayzekaogretmen_python/backend/logs/`
2. Issue açın: [GitHub Issues](repository-url/issues)
3. Dokümantasyonu inceleyin

---

## ✅ Kurulum Checklist

- [ ] Python 3.10+ yüklü
- [ ] Node.js 16+ yüklü
- [ ] MongoDB yüklü ve çalışıyor
- [ ] Backend bağımlılıkları yüklendi
- [ ] Frontend bağımlılıkları yüklendi
- [ ] .env dosyaları oluşturuldu ve ayarlandı
- [ ] MongoDB bağlantısı test edildi
- [ ] Backend başarıyla çalışıyor
- [ ] Frontend başarıyla çalışıyor
- [ ] API health check başarılı
- [ ] Frontend UI açılıyor

**Tebrikler! 🎉 Sistem kurulumu tamamlandı.**

