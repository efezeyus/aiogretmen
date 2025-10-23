# 🔄 Backend Yeniden Başlatma Rehberi

## ❓ Sorun Nedir?

Backend çalışıyor ama **yeni eklenen API route'larını yüklememiş**. Bu yüzden:
- `/api/curriculum/meb/...` endpoint'leri "Not Found" veriyor
- Admin panelde 0 içerik görünüyor

## ✅ Çözüm: Backend'i Yeniden Başlatın

### Yöntem 1: Terminal ile (Önerilen)

1. **Backend klasörüne gidin:**
```bash
cd yapayzekaogretmen_python/backend
```

2. **Eski process'i durdurun:**
```bash
# Process ID'yi bulun
ps aux | grep "run.py\|uvicorn" | grep -v grep

# Çıkan process ID'yi not edin (örnek: 37775)
# Process'i durdurun
kill 37775
```

3. **Backend'i yeniden başlatın:**
```bash
# Yöntem A: run.py ile
python run.py

# VEYA Yöntem B: Doğrudan uvicorn ile
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Yöntem 2: PyCharm/VSCode ile

1. **Çalışan debug/run konfigürasyonunu durdurun** (Kırmızı stop düğmesi)
2. **Yeniden başlatın** (Yeşil play düğmesi)

---

## 🧪 Backend Başarıyla Başladı mı? Test Edin

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

**Beklenen Sonuç:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890.12,
  "version": "1.0.0",
  "environment": "development"
}
```

### Test 2: Yeni API Endpoint
```bash
curl http://localhost:8000/api/curriculum/meb/grade/5/subjects
```

**Beklenen Sonuç:**
```json
[
  {
    "key": "matematik",
    "name": "Matematik",
    "weekly_hours": 6,
    "description": "Matematiksel düşünme..."
  },
  ...
]
```

❌ **"Not Found" alıyorsanız** → Backend düzgün başlamamış, tekrar deneyin
✅ **JSON veri geliyorsa** → Başarılı! Frontend'e geçin

---

## 🌐 Frontend'i Test Edin

Backend başarıyla başladıktan sonra:

1. **Tarayıcıda açın:** http://localhost:3000/admin/content
2. **Sayfayı yenileyin** (F5 veya Ctrl+R)
3. **İçerikleri görün!**

### Beklenen Görünüm:
```
📊 Toplam İçerik: ~150+
🎓 MEB Müfredatı: ~50+
📚 Dersler: ~50
🏗️ Yapı Tanımları: ~100+
```

Ve liste:
```
✅ 5. Sınıf Matematik - Doğal Sayılar
✅ 5. Sınıf Matematik - Kesirler
✅ 5. Sınıf Fen Bilimleri - İnsan ve Çevre
...
```

---

## ❗ Hala Çalışmıyor mu?

### Sorun 1: Port Zaten Kullanılıyor
```bash
# 8000 portunu kullanan process'i bulun
lsof -i :8000

# Process'i durdurun
kill -9 <PID>
```

### Sorun 2: Import Hataları
```bash
# Backend loglarını kontrol edin
tail -f yapayzekaogretmen_python/backend/logs/2025-10-01.log
```

Hata görüyorsanız:
- Python sürümünüzü kontrol edin (3.10+)
- Dependencies'leri güncelleyin: `pip install -r requirements.txt`

### Sorun 3: MongoDB/Redis Bağlantı Hatası
Backend MongoDB'ye bağlanamıyorsa:
```bash
# MongoDB'yi başlatın
brew services start mongodb-community

# Veya Docker ile
docker run -d -p 27017:27017 mongo
```

---

## 🚀 Hızlı Başlatma Komutu (Tek Satır)

```bash
cd yapayzekaogretmen_python/backend && \
pkill -f "run.py" && \
sleep 2 && \
python run.py
```

---

## 📝 Backend Başarıyla Başladığını Nasıl Anlarım?

Terminal'de şu mesajları görmelisiniz:

```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)

🚀 aiogretmen.com başlatılıyor...
✅ aiogretmen.com başlatıldı - Sürüm: 1.0.0
📖 API Docs: http://0.0.0.0:8000/api/docs
```

---

## 📞 Yardım

Hala sorun yaşıyorsanız:

1. **Backend loglarını paylaşın:**
```bash
tail -50 yapayzekaogretmen_python/backend/logs/2025-10-01.log
```

2. **Terminal çıktısını gönderin** (backend başlatırken gördüğünüz mesajlar)

3. **Tarayıcı konsolunu kontrol edin** (F12 → Console/Network)

---

**Başarılar! 🎉**

