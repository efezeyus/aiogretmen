# 🔧 MURAT DEBUG KOMUTLARI

## 🎯 MURAT'IN SINIFINI KONTROL ET

### **Console'da Çalıştır:**
```javascript
console.log('👤 Kullanıcı:', localStorage.getItem('userName'));
console.log('🎓 Sınıf:', localStorage.getItem('userGrade'));
console.log('📧 Email:', localStorage.getItem('userEmail'));
console.log('🆔 ID:', localStorage.getItem('userId'));
```

**Görmeli:**
```
👤 Kullanıcı: Murat Ustaalioglu
🎓 Sınıf: 6
📧 Email: murat@okul.com
🆔 ID: 3
```

---

## ✅ MURAT'I DOĞRU AYARLAMA:

### **Tam Komut (Console):**
```javascript
// 1. Temizle
localStorage.clear();
sessionStorage.clear();

// 2. Murat'ı DOĞRU ayarla
const muratToken = 'mock-murat-token-' + Date.now();
const muratUser = {
    id: '3',
    email: 'murat@okul.com',
    name: 'Murat Ustaalioglu',
    full_name: 'Murat Ustaalioglu',
    role: 'student',
    type: 'student',
    grade: 6
};

localStorage.setItem('token', muratToken);
localStorage.setItem('authToken', muratToken);
localStorage.setItem('user', JSON.stringify(muratUser));
localStorage.setItem('userType', 'student');
localStorage.setItem('userRole', 'student');
localStorage.setItem('userName', 'Murat Ustaalioglu');
localStorage.setItem('userId', '3');
localStorage.setItem('userEmail', 'murat@okul.com');
localStorage.setItem('userGrade', '6');  // ← ÖNEMLİ! STRING olarak "6"

console.log('✅ Murat 6. sınıf olarak ayarlandı!');

// 3. Dashboard'a git
window.location.href = '/student/dashboard';
```

---

## 🧪 6. SINIF DERSLERİNİ KONTROL:

Dashboard açıldığında Console'da:
```javascript
// API çağrısını kontrol et
console.log('API çağrısı yapılıyor...');
```

**Görmeli:**
```
📚 MEB Müfredatı yükleniyor...
🎓 Öğrenci sınıfı: 6  ← Bu 6 olmalı!
✅ MEB Müfredatı yüklendi: 11 ders ← 6. sınıf dersleri
```

Eğer "5" görüyorsan, userGrade yanlış set edilmiş.

---

## 🤖 AI İLE DERS YAPMA:

### **Lesson Room'a Git:**
```
http://localhost:3000/student/lesson/1
```

### **Console Kontrolü:**
```javascript
console.log('Lesson açılıyor...');
```

**Görmeli:**
```
👨‍🎓 Öğrenci Profili: {name: 'Murat...', grade: 6}
🎓 Sınıf: 6  ← Bu 6 olmalı!
```

### **AI Öğretmenle Konuşma:**

Smart Prompt'a yaz:
```
"Merhaba, ben kimim?"
```

AI cevabı:
```
"Merhaba Murat! Sen 6. sınıf öğrencisisin..."
```

---

## 🎯 SORUN GİDERME:

### **Problem 1: Hala 5. Sınıf Dersleri**

**Çözüm:**
```javascript
// Console'da zorla ayarla
localStorage.setItem('userGrade', '6');
location.reload();
```

### **Problem 2: AI Çalışmıyor**

**Kontrol:**
```javascript
// Lesson room'da
console.log('AI modülü:', typeof advancedAITeacher);
console.log('AI teach fonksiyonu:', typeof advancedAITeacher.teach);
```

**Çözüm:**
Backend çalışmalı veya AI servisi yüklü olmalı.

---

## 🚀 TAM ÇÖZÜM (KESİN ÇALIŞIR):

**Console'a YAPıŞTıR:**
```javascript
localStorage.clear();sessionStorage.clear();localStorage.setItem('authToken','mock-murat-'+Date.now());localStorage.setItem('userType','student');localStorage.setItem('userRole','student');localStorage.setItem('userName','Murat Ustaalioglu');localStorage.setItem('userId','3');localStorage.setItem('userEmail','murat@okul.com');localStorage.setItem('userGrade','6');console.log('✅ Murat 6. sınıf!',localStorage.getItem('userGrade'));window.location.href='/student/dashboard';
```

**Sonra Dashboard'da Console kontrol:**
```javascript
console.log('Sınıf:', localStorage.getItem('userGrade'));
// "6" görmeli
```

---

**Bu komutu yapıştırın, Murat 6. sınıf dersleri görecek!** ✅🎓

