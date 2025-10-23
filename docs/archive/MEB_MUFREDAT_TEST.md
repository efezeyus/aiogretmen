# 🧪 MEB Müfredatı Görüntüleme - Test Rehberi

## ❓ Neden Göremiyordunuz?

Oluşturduğumuz müfredat içerikleri **Python kodunda** (modül dosyalarında) saklı, **veritabanında değil**. Admin paneli API'den veri çekiyor, bu yüzden şimdi frontend'i yeni API endpoint'lerini kullanacak şekilde güncelledik.

---

## ✅ Yapılan Düzeltmeler

### 1. Frontend Güncellemeleri
- ✅ `ContentManager.js` - Yeni MEB API'lerini kullanacak şekilde güncellendi
- ✅ İstatistik kartlarına "MEB Müfredatı" ve "Yapı Tanımları" eklendi
- ✅ CSS'e yeni stiller eklendi

### 2. API Entegrasyonu
- ✅ `/curriculum/meb/grade/{grade}/detailed` - Detaylı müfredat
- ✅ `/curriculum/meb/grade/{grade}/subjects` - Sınıfa göre dersler
- ✅ `/curriculum/meb/summary` - Genel özet

---

## 🚀 Test Adımları

### Adım 1: Backend'in Çalıştığından Emin Olun

```bash
# Backend dizinine gidin
cd yapayzekaogretmen_python/backend

# Backend'i başlatın (eğer çalışmıyorsa)
python run.py
# veya
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend çalışıyorsa şu adreste API docs görebilirsiniz:
**http://localhost:8000/api/docs**

### Adım 2: API'yi Test Edin

Tarayıcıda veya curl ile test edin:

```bash
# 1. Eğitim seviyelerini getir
curl http://localhost:8000/api/curriculum/meb/education-levels

# 2. 5. sınıf derslerini getir
curl http://localhost:8000/api/curriculum/meb/grade/5/subjects

# 3. 5. sınıf matematik detaylı müfredat
curl http://localhost:8000/api/curriculum/meb/grade/5/detailed?subject=matematik

# 4. Müfredat özeti (Dikkat: Auth token gerekebilir)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/curriculum/meb/summary
```

### Adım 3: Frontend'i Yenileyin

```bash
# Frontend dizinine gidin
cd ../../frontend

# Eğer çalışmıyorsa başlatın
npm start
```

### Adım 4: Admin Paneline Gidin

1. Tarayıcıda açın: **http://localhost:3000/admin/content**
2. Login olun (admin hesabıyla)
3. Sayfayı yenileyin (F5)

---

## 📊 Göreceğiniz İçerikler

### İstatistik Kartları
- **Toplam İçerik**: ~150+ içerik
- **🎓 MEB Müfredatı**: ~50+ detaylı ünite (1., 5., 9. sınıflar)
- **Dersler**: ~50 ders içeriği
- **🏗️ Yapı Tanımları**: ~100+ ders yapısı (2-4, 6-8, 10-12. sınıflar)

### İçerik Listesi
Görmelisiniz:

#### 1. Sınıf (Detaylı)
- ✅ 1. Sınıf Matematik - Rakamlar
- ✅ 1. Sınıf Matematik - 20'ye Kadar Sayılar
- ✅ 1. Sınıf Türkçe - Sesli ve Sessiz Dinleme
- ✅ 1. Sınıf Hayat Bilgisi - Okulumu Tanıyorum
- ...

#### 5. Sınıf (En Detaylı)
- ✅ 5. Sınıf Matematik - Doğal Sayılar
- ✅ 5. Sınıf Matematik - Kesirler
- ✅ 5. Sınıf Matematik - Ondalık Gösterim
- ✅ 5. Sınıf Fen Bilimleri - İnsan ve Çevre
- ✅ 5. Sınıf Türkçe - Dinleme Stratejileri
- ✅ 5. Sınıf Sosyal Bilgiler - Toplumsal Yapı
- ✅ 5. Sınıf İngilizce - Hello! / My Town
- ...

#### 9. Sınıf (Lise - Detaylı)
- ✅ 9. Sınıf Matematik - Önermeler ve Mantık
- ✅ 9. Sınıf Fizik - Fizik Bilimine Giriş
- ✅ 9. Sınıf Kimya - Atom Modelleri
- ✅ 9. Sınıf Biyoloji - Canlıların Sınıflandırılması
- ...

#### Diğer Sınıflar (Yapı Tanımları)
- 🏗️ 2. Sınıf Matematik (Yapısal tanım)
- 🏗️ 6. Sınıf Fen Bilimleri (Yapısal tanım)
- 🏗️ 10. Sınıf Kimya (Yapısal tanım)
- ...

---

## 🔍 Filtreleme ve Arama

### Filtreler
- **Tür**: Ders, Yapı, Quiz, Video, Doküman
- **Sınıf**: 1-12 arası tüm sınıflar
- **Arama**: Başlık veya ders adında ara

### Örnek Aramalar
- "matematik" → Tüm matematik içerikleri
- "kesir" → Kesir konularını içeren dersler
- "5. sınıf" → 5. sınıf içerikleri

---

## ❗ Sorun Giderme

### Problem 1: İçerikler Görünmüyor
**Çözüm:**
1. Backend'in çalıştığından emin olun
2. Tarayıcı konsolunu açın (F12)
3. Network sekmesinde API çağrılarını kontrol edin
4. Hata mesajlarını okuyun

### Problem 2: "Unauthorized" Hatası
**Çözüm:**
1. Admin hesabıyla giriş yaptığınızdan emin olun
2. Token'ın geçerli olduğunu kontrol edin
3. Gerekirse logout/login yapın

### Problem 3: API Hatası (500, 404)
**Çözüm:**
```bash
# Backend loglarını kontrol edin
tail -f yapayzekaogretmen_python/backend/logs/2025-10-01.log

# API docs'u kontrol edin
# http://localhost:8000/api/docs
```

### Problem 4: Boş Liste Dönüyor
**Çözüm:**
```bash
# API'yi doğrudan test edin
curl http://localhost:8000/api/curriculum/meb/grade/5/detailed

# Eğer boş dönüyorsa, Python modüllerinin import edildiğinden emin olun
cd yapayzekaogretmen_python/backend
python -c "from app.services.curriculum_manager import curriculum_manager; print(curriculum_manager.get_detailed_curriculum(5))"
```

---

## 🎯 Başarı Kriterleri

Admin panelde şunları görmelisiniz:

### ✅ İstatistikler
- Toplam İçerik: **~150+**
- MEB Müfredatı: **~50+**
- Yapı Tanımları: **~100+**

### ✅ İçerik Listesi
- 1. sınıf için **3 ders** x **~5 ünite**
- 5. sınıf için **5 ders** x **~7 ünite**
- 9. sınıf için **5 ders** x **~4 ünite**
- Diğer sınıflar için **yapı tanımları**

### ✅ Detay Bilgileri
Her içerikte:
- 📚 Ders adı
- 🎯 Sınıf seviyesi
- ⏱️ Tahmini saat
- 📝 Konu sayısı
- 📖 Açıklama

---

## 🚀 Hızlı Test Komutu

Tüm adımları tek seferde test edin:

```bash
# Backend test
echo "=== Backend Test ==="
curl -s http://localhost:8000/api/curriculum/meb/education-levels | head -20

echo "\n\n=== 5. Sınıf Dersler ==="
curl -s http://localhost:8000/api/curriculum/meb/grade/5/subjects | head -20

echo "\n\n=== 5. Sınıf Matematik Detay ==="
curl -s http://localhost:8000/api/curriculum/meb/grade/5/detailed?subject=matematik | head -50
```

---

## 📞 Yardım

Eğer hala göremiyorsanız:

1. **Tarayıcı konsolunu açın** (F12)
2. **Network** sekmesine gidin
3. **Sayfayı yenileyin** (F5)
4. Hangi API çağrılarının yapıldığını görün
5. Hata mesajlarını benimle paylaşın

### Örnek Çıktılar

**Başarılı API Çağrısı:**
```
Status: 200 OK
Response: {
  "grade": 5,
  "subject": "matematik",
  "subject_name": "Matematik",
  "learning_areas": [...]
}
```

**Hatalı Durum:**
```
Status: 401 Unauthorized
Response: {
  "detail": "Not authenticated"
}
```

---

**Şimdi deneyin!** 🎉

1. Backend'i başlatın ✅
2. Frontend'i yenileyin (sayfayı yenileyin) ✅
3. `http://localhost:3000/admin/content` adresine gidin ✅
4. MEB müfredatı içeriklerini görün! 🎓

