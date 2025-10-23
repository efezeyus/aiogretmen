import asyncio
import sys
import os

# Projeyi PYTHONPATH'e ekle
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.auth_service import get_password_hash
from datetime import datetime

async def setup_admin():
    """Admin kullanıcısını MongoDB'ye ekle"""
    
    # MongoDB'ye bağlan
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_name = settings.MONGODB_URL.split('/')[-1]
    db = client[db_name]
    
    # Admin kullanıcı bilgileri
    admin_user = {
        "email": "admin@yapayzekaogretmen.com",
        "password": get_password_hash("admin123"),
        "full_name": "Sistem Yöneticisi",
        "is_active": True,
        "is_superuser": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "role": "admin",
        "preferences": {
            "theme": "dark",
            "language": "tr",
            "notifications": True
        }
    }
    
    # Mevcut admin kullanıcısını kontrol et
    existing_user = await db.users.find_one({"email": admin_user["email"]})
    
    if existing_user:
        # Güncelle
        result = await db.users.update_one(
            {"email": admin_user["email"]},
            {"$set": admin_user}
        )
        print(f"✅ Admin kullanıcısı güncellendi: {admin_user['email']}")
    else:
        # Yeni ekle
        result = await db.users.insert_one(admin_user)
        print(f"✅ Admin kullanıcısı eklendi: {admin_user['email']}")
    
    print("\n📌 Admin Giriş Bilgileri:")
    print(f"📧 Email: admin@yapayzekaogretmen.com")
    print(f"🔑 Şifre: admin123")
    print(f"🌐 URL: http://localhost:3000/admin")
    print("\n⚠️  Güvenlik için ilk girişten sonra şifrenizi değiştirin!")
    
    # Öğrenci kullanıcısını da ekleyelim
    student_user = {
        "email": "ahmet.yilmaz@okul.com",
        "password": get_password_hash("123456"),
        "full_name": "Ahmet Yılmaz",
        "is_active": True,
        "is_superuser": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "role": "student",
        "grade": "5. Sınıf",
        "preferences": {
            "theme": "light",
            "language": "tr",
            "notifications": True
        }
    }
    
    existing_student = await db.users.find_one({"email": student_user["email"]})
    
    if not existing_student:
        await db.users.insert_one(student_user)
        print(f"\n✅ Öğrenci kullanıcısı eklendi: {student_user['email']}")
        print(f"📧 Email: ahmet.yilmaz@okul.com")
        print(f"🔑 Şifre: 123456")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_admin())
