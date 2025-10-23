"""
Murat adında 6. sınıf öğrencisi ekle
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Backend dizinini Python path'e ekle
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.mongodb import mongo_connection, get_database
from app.core.config import settings
from passlib.context import CryptContext
from loguru import logger


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def add_murat():
    """Murat kullanıcısını ekle"""
    logger.info("🚀 Murat kullanıcısı ekleniyor...")
    logger.info(f"📍 MongoDB URL: {settings.MONGODB_URL}")
    
    # MongoDB'ye bağlan
    await mongo_connection.connect()
    
    try:
        db = get_database()
        if db is None:
            logger.error("Database bağlantısı yok!")
            return
        
        # Murat'ı kontrol et
        existing = await db.users.find_one({"email": "murat@okul.com"})
        if existing:
            logger.info("⏭️  murat@okul.com zaten var!")
            
            # Bilgilerini göster
            logger.info(f"📋 Mevcut Bilgiler:")
            logger.info(f"   Ad: {existing.get('name')}")
            logger.info(f"   Email: {existing.get('email')}")
            logger.info(f"   Username: {existing.get('username')}")
            logger.info(f"   Sınıf: {existing.get('grade')}")
            logger.info(f"   Rol: {existing.get('role')}")
            return
        
        # Şifreyi hashle
        hashed_password = pwd_context.hash("123456")
        
        # Murat'ı oluştur
        murat_data = {
            "name": "Murat Ustaalioglu",
            "username": "muratustaalioglu",
            "email": "murat@okul.com",
            "password_hash": hashed_password,
            "role": "student",
            "grade": 6,
            "phone": "0555 123 45 67",
            "parent_name": "Ali Ustaalioglu",
            "parent_phone": "0555 987 65 43",
            "created_at": datetime.now(),
            "is_active": True,
            "preferences": {
                "teacher_gender": "male",
                "theme": "light",
                "language": "tr",
                "has_seen_onboarding": False
            },
            "subscription": {
                "status": "trial",
                "plan": "free",
                "trial_ends": None
            }
        }
        
        # Veritabanına ekle
        result = await db.users.insert_one(murat_data)
        logger.info(f"✅ Murat başarıyla eklendi!")
        logger.info(f"📋 Kullanıcı Bilgileri:")
        logger.info(f"   ID: {result.inserted_id}")
        logger.info(f"   Ad: Murat Ustaalioglu")
        logger.info(f"   Email: murat@okul.com")
        logger.info(f"   Şifre: 123456")
        logger.info(f"   Sınıf: 6")
        logger.info(f"   Rol: Öğrenci")
        logger.info("")
        logger.info("🎓 Artık bu bilgilerle giriş yapabilirsiniz!")
        
    except Exception as e:
        logger.error(f"❌ Hata: {e}")
        raise
    finally:
        await mongo_connection.disconnect()


if __name__ == "__main__":
    asyncio.run(add_murat())

