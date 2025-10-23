# Backend Scripts Rehberi

## 📜 Mevcut Scriptler

### 1. `seed_database.py` - Veritabanı Seed Script

Örnek verileri veritabanına yükler.

#### Kullanım:
```bash
cd yapayzekaogretmen_python/backend
./venv/bin/python scripts/seed_database.py
```

#### Eklenecek Veriler:
- ✅ 4 Örnek Öğrenci
- ✅ 2 Örnek Öğretmen
- ✅ 9 Örnek Soru (5. ve 9. sınıf matematik)
- ✅ 3 Örnek Quiz
- ✅ 3 Örnek Ders İçeriği
- ✅ 5 Örnek Başarı (Achievement)

#### Örnek Kullanıcılar:

**Öğrenciler:**
```
Email: ahmet.yilmaz@okul.com
Şifre: 123456
Rol: Öğrenci (5. sınıf)

Email: ayse.kara@okul.com
Şifre: 123456
Rol: Öğrenci (5. sınıf)

Email: mehmet.demir@okul.com
Şifre: 123456
Rol: Öğrenci (9. sınıf)

Email: zeynep.sahin@okul.com
Şifre: 123456
Rol: Öğrenci (1. sınıf)
```

**Öğretmenler:**
```
Email: ayse.ogretmen@okul.com
Şifre: teacher123
Rol: Öğretmen

Email: mehmet.hoca@okul.com
Şifre: teacher123
Rol: Öğretmen
```

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Backend'e gidin
cd yapayzekaogretmen_python/backend

# 2. Veritabanını seed edin
./venv/bin/python scripts/seed_database.py

# 3. Backend'i başlatın (başka bir terminalde)
./venv/bin/python run.py
```

---

## 📊 Veritabanı Durumunu Kontrol

```bash
# MongoDB shell ile
mongosh yapay_zeka_ogretmen

# Kullanıcıları listele
db.users.find().pretty()

# Soruları listele
db.questions.find().pretty()

# Quizleri listele
db.quizzes.find().pretty()
```

---

## ⚠️ Dikkat

- Script'i birden fazla çalıştırabilirsiniz, mevcut kullanıcılar atlanır
- Email unique olduğu için duplicate hata vermez
- Mevcut verileri silmez, sadece yeni ekler

---

## 🔄 Veritabanını Sıfırlama

**DİKKAT: Bu tüm verileri siler!**

```bash
mongosh yapay_zeka_ogretmen

db.users.deleteMany({})
db.questions.deleteMany({})
db.quizzes.deleteMany({})
db.lesson_contents.deleteMany({})
db.achievements.deleteMany({})
```

Sonra seed script'ini tekrar çalıştırın.

