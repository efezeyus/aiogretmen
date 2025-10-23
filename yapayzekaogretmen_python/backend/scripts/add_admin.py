import asyncio
from app.db.mongodb import MongoDB
from app.core.security import get_password_hash
from datetime import datetime

async def add_admin_user():
    """Admin kullanıcısını ekle"""
    db = MongoDB()
    
    # Admin kullanıcı bilgileri
    admin_user = {
        "email": "admin@yapayzekaogretmen.com",
        "password": get_password_hash("admin123"),  # Güvenli şifre
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
        await db.users.update_one(
            {"email": admin_user["email"]},
            {"$set": admin_user}
        )
        print(f"✅ Admin kullanıcısı güncellendi: {admin_user['email']}")
    else:
        # Yeni ekle
        await db.users.insert_one(admin_user)
        print(f"✅ Admin kullanıcısı eklendi: {admin_user['email']}")
    
    print(f"📧 Email: {admin_user['email']}")
    print(f"🔑 Şifre: admin123")
    print(f"🌐 URL: http://localhost:3000/admin")

if __name__ == "__main__":
    asyncio.run(add_admin_user())
