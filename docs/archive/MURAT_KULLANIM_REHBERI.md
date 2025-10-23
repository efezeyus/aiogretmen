# 🎓 MURAT HESABI - TAM KULLANIM REHBERİ

## ⚡ HIZLI GİRİŞ

### **Yöntem 1: Otomatik Giriş Sayfası (EN KOLAY)**

1. **Bu dosyayı tarayıcıda açın:**
```
file:///Users/muratustaalioglu/Desktop/ÇALIŞMALAR/yapayzekaogretmen/MURAT_HIZLI_GIRIS.html
```

2. **"🚀 Otomatik Giriş Yap (Murat)" butonuna tıklayın**

3. **Dashboard otomatik açılacak!**

---

### **Yöntem 2: Console ile Manuel (GARANTİLİ)**

1. **http://localhost:3000 açın**

2. **Console (F12) açın ve şunu yapıştırın:**

```javascript
// Temizle
localStorage.clear();
sessionStorage.clear();

// Murat'ı set et
const mockToken = 'mock-student-token-' + Date.now();
const mockUser = {
    id: '3',
    email: 'murat@okul.com',
    full_name: 'Murat Ustaalioglu',
    name: 'Murat Ustaalioglu',
    role: 'student',
    type: 'student',
    grade: '6. Sınıf',
    is_active: true
};

localStorage.setItem('token', mockToken);
localStorage.setItem('authToken', mockToken);
localStorage.setItem('user', JSON.stringify(mockUser));
localStorage.setItem('userType', 'student');
localStorage.setItem('userRole', 'student');
localStorage.setItem('userName', 'Murat Ustaalioglu');
localStorage.setItem('userId', '3');
localStorage.setItem('userEmail', 'murat@okul.com');
localStorage.setItem('userGrade', '6');

console.log('✅ Murat hazır!');

// Dashboard'a git
window.location.href = '/student/dashboard';
```

3. **Dashboard açılacak!**

---

### **Yöntem 3: Normal Login (Backend çalışıyorsa)**

Backend'i başlattıysanız:

```
1. localStorage.clear(); location.reload();
2. http://localhost:3000/login
3. Email: murat@okul.com
4. Şifre: 123456
5. Login
```

---

## 🎯 MURAT'IN SİSTEMDE YAPABİLECEKLERİ:

### **Dashboard:**
```
http://localhost:3000/student/dashboard

Görecekler:
- Merhaba Murat! 👋
- 6. Sınıf MEB Dersleri (11 ders)
- İstatistikler
- AI Önerileri
```

### **Dersler:**
```
http://localhost:3000/student/courses

6. Sınıf İçerikleri:
- Matematik: Tam Sayılar, Kesirler, Oran-Orantı
- Fen: Madde, Kuvvet, Işık
- Türkçe: Okuma, Yazma, Dil Bilgisi
+ 8 ders daha
```

### **Quiz:**
```
http://localhost:3000/student/quiz

Mevcut Quizler:
- Doğal Sayılar Quiz
- Kesirler Quiz
- Canlılar Quiz
```

### **Lesson Room:**
```
http://localhost:3000/student/lesson/1

Özellikler:
- AI Öğretmen sohbet
- Smart Prompt (sesli, emoji)
- Gerçek zamanlı puanlama
- XP kazanma
```

### **Profil:**
```
http://localhost:3000/student/profile

Düzenleyebilir:
- Ad Soyad
- Avatar
- Öğrenme stili
```

---

## 🚀 EN GARANTİLİ YÖNTEM:

**Console'a yapıştırın (CTRL+C, CTRL+V):**

```javascript
localStorage.clear();sessionStorage.clear();const t='mock-student-token-'+Date.now();localStorage.setItem('token',t);localStorage.setItem('authToken',t);localStorage.setItem('user',JSON.stringify({id:'3',email:'murat@okul.com',name:'Murat Ustaalioglu',role:'student',grade:'6. Sınıf'}));localStorage.setItem('userType','student');localStorage.setItem('userRole','student');localStorage.setItem('userName','Murat Ustaalioglu');localStorage.setItem('userId','3');localStorage.setItem('userEmail','murat@okul.com');localStorage.setItem('userGrade','6');window.location.href='/student/dashboard';
```

**Tek satır, kopyala-yapıştır, Enter!** ✅

**Dashboard açılacak!** 🎓
