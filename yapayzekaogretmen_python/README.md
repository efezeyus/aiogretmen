# Yapay Zeka Öğretmen

MEB müfredatına uygun, 2-12. sınıf öğrencileri için yapay zeka destekli kişiselleştirilmiş eğitim platformu.

## Proje Tanımı

Yapay Zeka Öğretmen, öğrencilerin kendi hızlarında öğrenmelerine yardımcı olan, yapay zeka teknolojisiyle desteklenen bir eğitim uygulamasıdır. Uygulama, öğrencilerin anlamadıkları konuları doğrudan bir yapay zeka öğretmene sorabilmeleri, müfredata uygun ders içeriklerine erişebilmeleri ve kendilerini test edebilmeleri için tasarlanmıştır.

## Özellikler

- **Yapay Zeka Destekli Öğrenme**: Öğrencilerin sorularını anında yanıtlayan, kişiselleştirilmiş geri bildirimler sunan yapay zeka öğretmen
- **MEB Müfredatı Uyumlu**: 2-12. sınıflar için tüm zorunlu derslerde tam müfredat desteği
- **Kişiselleştirilmiş Öğrenme**: Öğrencinin seviyesine ve öğrenme hızına göre uyarlanmış içerikler
- **Erkek/Kadın Öğretmen Seçeneği**: Öğrencilerin tercihlerine göre erkek veya kadın öğretmen karakteri seçebilme imkanı
- **Esnek Abonelik Modeli**: 3 günlük ücretsiz deneme sonrası aylık/yıllık abonelik seçenekleri
- **Çoklu Platform Desteği**: Web, iOS ve Android uyumlu arayüz

## Teknik Altyapı

### Backend (Python)

- **Web Çerçevesi**: FastAPI
- **Veritabanı**: MongoDB (NoSQL) ve PostgreSQL (SQL) hibrit yapı
- **Kimlik Doğrulama**: JWT tabanlı kimlik doğrulama sistemi
- **API Belgelendirme**: Swagger/OpenAPI ile otomatik belgelendirme
- **Yapay Zeka**: OpenAI API entegrasyonu, langchain kütüphanesi

### Frontend (Geliştirilmekte)

- **Web Arayüzü**: React.js, Material UI
- **Durum Yönetimi**: Redux
- **Mobil Uygulama**: React Native

## Kurulum

### Gereksinimler

- Python 3.9+
- MongoDB 4.4+
- PostgreSQL 13+

### Backend Kurulumu

1. Repository'yi klonlayın:
   ```bash
   git clone https://github.com/kullaniciadi/yapayzekaogretmen.git
   cd yapayzekaogretmen_python/backend
   ```

2. Sanal ortam oluşturun ve aktifleştirin:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate  # Windows
   ```

3. Gereksinimleri yükleyin:
   ```bash
   pip install -r requirements.txt
   ```

4. Çevre değişkenlerini ayarlayın:
   ```bash
   cp env.example .env
   # .env dosyasını düzenleyin
   ```

5. Uygulamayı çalıştırın:
   ```bash
   uvicorn app.main:app --reload
   ```

6. API belgelerine erişin:
   ```
   http://localhost:8000/api/docs
   ```

## Geliştirme

### Kod Stili

Bu proje Black kod formatı, isort import sıralama ve Flake8 linting standartlarını takip eder.

```bash
# Kod formatlaması
black app/
isort app/

# Linting
flake8 app/
```

### Testleri Çalıştırma

```bash
pytest
```

## Lisans

Bu proje özel lisansa tabidir. Tüm hakları saklıdır.

## İletişim

Proje ile ilgili sorularınız için: info@yapayzekaogretmen.com 