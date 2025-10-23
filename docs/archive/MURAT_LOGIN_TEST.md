# 🔐 Murat Login Test Rehberi

## ✅ Murat Hesabı Hazır!

### **Kullanıcı Bilgileri:**
```
📧 Email: murat@okul.com
🔑 Şifre: 123456
🎓 Sınıf: 6
👤 Ad: Murat Ustaalioglu
```

---

## 🧪 LOGIN TEST ADIMLARI:

### **Adım 1: LocalStorage Temizle (ÖNEMLİ!)**

Tarayıcı Console'unda (F12):
```javascript
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage temizlendi');
location.reload();
```

### **Adım 2: Login Sayfasına Git**
```
http://localhost:3000/login
```

### **Adım 3: Bilgileri Gir**
```
Email: murat@okul.com
Şifre: 123456
```

### **Adım 4: Login Butonuna Bas**

---

## 📊 Console'da Görecekleriniz:

### **Başarılı Login:**
```javascript
🔍 Form submit - formData: {email: 'murat@okul.com', password: '123456'}
🔍 Calling login function...
🔍 Login attempt: murat@okul.com
🔍 Using mock authentication for student
🔍 Mock login successful: {type: 'student', role: 'student', name: 'Murat Ustaalioglu', ...}
🔍 Login successful!
🔍 User role: student
🔍 Redirecting to student dashboard...

[Sayfa yönleniyor...]

🎓 Dashboard initializing...
🔍 Is authenticated: true
🔍 User: {name: 'Murat Ustaalioglu', role: 'student', grade: '6. Sınıf'}
✅ Auth check passed, loading dashboard...
📊 AI Insights yükleniyor...
📈 Öğrenci metrikleri yükleniyor...
```

### **Dashboard Açılacak:**
```
http://localhost:3000/student/dashboard
```

---

## ✅ Murat'ın Dashboard'ında:

### **Hoş Geldin Kartı:**
```
╔═══════════════════════════════════╗
║ Merhaba Murat! ☀️                 ║
║ 6. Sınıf                          ║
║ Bugün harika bir öğrenme günü!    ║
╚═══════════════════════════════════╝
```

### **6. Sınıf MEB Dersleri (11 Ders):**
```
📐 Matematik (6 saat/hafta)
📖 Türkçe (6 saat/hafta)
🧪 Fen Bilimleri (4 saat/hafta)
🌍 Sosyal Bilgiler (3 saat/hafta)
🇬🇧 İngilizce (4 saat/hafta)
🎨 Görsel Sanatlar (1 saat/hafta)
🎵 Müzik (1 saat/hafta)
⚽ Beden Eğitimi (2 saat/hafta)
💻 Teknoloji ve Tasarım (2 saat/hafta)
💻 Bilişim Teknolojileri (2 saat/hafta)
📿 Din Kültürü (2 saat/hafta)
```

---

## ❌ Login Olmazsa:

### **Problem 1: "Geçersiz kimlik" Hatası**

**Çözüm:**
1. LocalStorage'ı temizleyin
2. Sayfayı hard refresh (Ctrl+Shift+R)
3. Email'i doğru yazdığınızdan emin olun: `murat@okul.com`
4. Şifre: `123456`

### **Problem 2: Dashboard Açılmıyor**

**Console'da kontrol edin:**
```javascript
// Auth durumu
localStorage.getItem('userType')
// "student" olmalı

localStorage.getItem('userName')
// "Murat Ustaalioglu" olmalı

localStorage.getItem('userGrade')
// "6" olmalı
```

**Çözüm:**
```javascript
// Manuel set (geçici)
localStorage.setItem('userType', 'student');
localStorage.setItem('userName', 'Murat Ustaalioglu');
localStorage.setItem('userGrade', '6');
localStorage.setItem('authToken', 'mock-token');
location.reload();
```

---

## 🎯 Backend İle Login (Alternatif):

Backend çalışıyorsa gerçek auth da çalışır:

```bash
# Backend'i yeniden başlat
cd yapayzekaogretmen_python/backend
./venv/bin/python run.py
```

Sonra:
```bash
# Test et
curl -X POST http://localhost:8000/api/auth_simple/login \
  -H "Content-Type: application/json" \
  -d '{"email":"murat@okul.com","password":"123456"}'
```

**Başarılı:**
```json
{
  "success": true,
  "token": "test_token_2_murat@okul.com",
  "user": {
    "id": "2",
    "email": "murat@okul.com",
    "full_name": "Murat Ustaalioglu",
    "role": "student",
    "grade": 6
  }
}
```

---

## 🚀 HIZLI ÇÖZÜM:

### **En Kolay Yol:**

1. **LocalStorage temizle:**
```javascript
localStorage.clear(); sessionStorage.clear();
```

2. **Sayfa yenile:**
```javascript
location.reload();
```

3. **Login:**
```
Email: murat@okul.com
Şifre: 123456
```

4. **Hard refresh varsa:**
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

---

**ŞİMDİ DENEYİN:**

1. Console açın (F12)
2. `localStorage.clear(); location.reload();`
3. Login sayfası açılacak
4. murat@okul.com / 123456
5. Dashboard açılacak!

**Murat ile sisteme giriş yapabilirsiniz!** 🎓✅

