# Yapay Zeka Öğretmen - Kurulum Rehberi

Bu belge, Yapay Zeka Öğretmen uygulamasının kurulum ve çalıştırma adımlarını içerir.

## Gereksinimler

- Python 3.9+
- MongoDB 4.4+
- PostgreSQL 13+
- Node.js 16+ (frontend için)

## Backend Kurulumu

### 1. Sanal Ortam Oluşturma

```bash
# Proje klasörüne git
cd yapayzekaogretmen_python/backend

# Sanal ortam oluştur
python -m venv venv

# Sanal ortamı aktifleştir (Linux/macOS)
source venv/bin/activate

# Windows için
# venv\Scripts\activate
```

### 2. Bağımlılıkları Kurma

```bash
# Gerekli paketleri yükle
pip install -r requirements.txt

# Geliştirme modunda kurulum yap (isteğe bağlı)
pip install -e .
```

### 3. Veritabanı Kurulumu

MongoDB ve PostgreSQL servislerinin çalıştığından emin olun.

```bash
# PostgreSQL'de veritabanı oluşturma
# psql -U postgres -c "CREATE DATABASE yapay_zeka_ogretmen;"
```

### 4. Çevre Değişkenleri Ayarlama

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değişiklikleri yapın:

```bash
cp env.example .env
# .env dosyasını düzenleyin
```

Özellikle aşağıdaki ayarları kendi ortamınıza göre değiştirin:
- `OPENAI_API_KEY`: OpenAI API anahtarınız
- Veritabanı bağlantı bilgileri
- JWT gizli anahtarları

### 5. Uygulamayı Çalıştırma

#### Geliştirme Modu

```bash
# Python betik ile çalıştır
python run.py --reload

# veya uvicorn ile çalıştır
uvicorn app.main:app --reload
```

#### Üretim Modu

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Frontend Kurulumu (Gelecek)

Frontend henüz geliştirilme aşamasındadır. React.js tabanlı bir arayüz için şu adımları uygulayabilirsiniz:

```bash
# Frontend klasörüne git
cd frontend

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm start
```

## API Dokümantasyonu

Backend API'si çalıştıktan sonra, API dokümantasyonunu aşağıdaki URL'lerden görüntüleyebilirsiniz:

- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Sorun Giderme

Eğer uygulama başlatma sırasında hata alırsanız, şunları kontrol edin:

1. Veritabanı bağlantıları doğru mu?
2. Gerekli klasörler (logs, media, static) oluşturulmuş mu?
3. Çevre değişkenleri doğru ayarlanmış mı?
4. Bağımlılıklar tam olarak yüklenmiş mi?

Loglar için `logs` klasörünü kontrol edebilirsiniz.

## İletişim

Herhangi bir sorun veya öneriniz için: info@yapayzekaogretmen.com 