# 🚀 Hızlı Başlatma Rehberi - Yapay Zeka Öğretmen

Son güncelleme: $(date)

## ✅ Sistem Hazır!

### 🔧 Yapılan İyileştirmeler

1. ✅ **advancedAITeacher.js** - Gerçek backend API çağrıları eklendi
2. ✅ **Backend .env** - DeepSeek ve OpenAI API keyleri hazır
3. ✅ **Frontend .env** - API URL yapılandırması hazır
4. ✅ **AI API Testi** - DeepSeek başarıyla yanıt veriyor!

---

## 📋 Hızlı Başlatma

### 1️⃣ Backend Başlat

```bash
cd yapayzekaogretmen_python/backend
./start_backend.sh
```

**Veya manuel:**
```bash
cd yapayzekaogretmen_python/backend
source venv/bin/activate
python run.py
```

**Kontrol:**
- API Docs: http://localhost:8000/api/docs
- Health: http://localhost:8000/api/

### 2️⃣ Frontend Başlat

```bash
cd frontend
npm start
```

**Kontrol:**
- Frontend: http://localhost:3000

---

## 🧪 Test Et

### Backend API Testi
```bash
curl -X POST http://localhost:8000/api/ai/teach \
  -H "Content-Type: application/json" \
  -d '{"message": "Merhaba, tam sayılar nedir?", "grade_level": 5, "subject": "matematik"}'
```

**Beklenen Yanıt:** DeepSeek'ten Türkçe AI öğretmen yanıtı

### Frontend'den Test
1. Frontend'i başlat: http://localhost:3000
2. Login olun (test hesabı veya yeni kayıt)
3. Lesson Room'a girin
4. AI öğretmene mesaj yazın: "Merhaba, tam sayılar nedir?"
5. ✅ AI yanıt vermeli!

---

## 🐛 Sorun Giderme

### Backend Çalışmıyor?

```bash
# Port kontrolü
lsof -i :8000

# Varsa sonlandır
kill $(lsof -t -i:8000)

# Tekrar başlat
cd yapayzekaogretmen_python/backend
./start_backend.sh
```

### AI Yanıt Vermiyor?

**1. Backend loglarını kontrol et:**
```bash
cd yapayzekaogretmen_python/backend
tail -50 backend.log
```

**2. DeepSeek API key kontrol:**
```bash
cd yapayzekaogretmen_python/backend
grep DEEPSEEK .env
```

**3. Frontend console'u kontrol et:**
- Chrome DevTools > Console
- Network tab'da API çağrılarını izle

### Frontend Bağlanmıyor?

**1. API URL kontrol:**
```bash
cd frontend
cat .env | grep REACT_APP_API_URL
```

**Doğru değer:** `REACT_APP_API_URL=http://localhost:8000/api`

**2. CORS hatası?**
- Backend'de CORS development için açık
- Browser console'da hata olup olmadığını kontrol et

---

## 📊 Sistem Durumu

### ✅ Hazır Olanlar
- [x] Backend DeepSeek entegrasyonu
- [x] Frontend AI servis bağlantısı
- [x] advancedAITeacher API çağrıları
- [x] Environment yapılandırmaları
- [x] Otomatik başlatma script'i

### 🎯 AI Modeller
- **Birincil:** DeepSeek Chat (deepseek-chat)
- **Fallback:** OpenAI GPT-4o
- **Demo Mode:** Offline fallback yanıtlar

### 🔐 API Keys
- **DeepSeek:** ✅ Yapılandırılmış
- **OpenAI:** ✅ Yapılandırılmış
- **Hugging Face:** ⚠️ Opsiyonel

---

## 💡 Kullanım İpuçları

### AI Öğretmen Özellikleri
1. **Akıllı Yanıtlar** - MEB müfredatına uygun
2. **Kişiselleştirilmiş** - Öğrenci seviyesine göre
3. **Türkçe** - Tam Türkçe destek
4. **Gerçek Zamanlı** - DeepSeek API ile

### Önerilen Sorular
```
"Tam sayılar nedir?"
"Bana örnek verir misin?"
"Bunu anlamadım, daha basit anlatabilir misin?"
"Quiz yapmak istiyorum"
"Pratik soru sor"
```

---

## 📞 Destek

### Loglar
- **Backend:** `yapayzekaogretmen_python/backend/backend.log`
- **Frontend:** Browser Console (F12)

### Komutlar
```bash
# Backend durumu
ps aux | grep "python run.py"

# Backend durdur
pkill -f "python run.py"

# Frontend durdur
# Ctrl+C terminalde

# Tüm servisleri yeniden başlat
# 1. Backend durdur ve başlat
# 2. Frontend durdur ve başlat
```

---

## 🎉 Başarılı!

Sistem tamamen hazır! Artık yapay zeka öğretmen öğrencilerle etkileşime geçebilir! 🚀

**Son Test:** 
1. Backend başlat ✅
2. Frontend başlat ✅
3. Login ol ✅
4. AI'ya mesaj yaz ✅
5. Yanıt geldi mi? ✅

🎓 **Hayırlı Dersler!**

