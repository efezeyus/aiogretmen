"""
Veritabanı Seed Script
Örnek verileri veritabanına yükler
"""

import asyncio
import sys
from pathlib import Path

# Backend dizinini Python path'e ekle
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.mongodb import mongo_connection, get_database
from app.core.config import settings
from app.data.sample_data import (
    SAMPLE_STUDENTS,
    SAMPLE_TEACHERS,
    SAMPLE_QUESTIONS_MATH_5,
    SAMPLE_QUESTIONS_MATH_9,
    SAMPLE_QUIZZES,
    SAMPLE_LESSON_CONTENTS,
    SAMPLE_ACHIEVEMENTS
)
from passlib.context import CryptContext
from datetime import datetime
from loguru import logger


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_users():
    """Örnek kullanıcıları ekle"""
    db = get_database()
    if db is None:
        logger.error("Database bağlantısı yok!")
        return
    
    logger.info("👥 Örnek kullanıcılar ekleniyor...")
    
    # Öğrencileri ekle
    for student in SAMPLE_STUDENTS:
        existing = await db.users.find_one({"email": student["email"]})
        if existing:
            logger.info(f"⏭️  {student['email']} zaten var, atlanıyor")
            continue
        
        hashed_password = pwd_context.hash(student["password"])
        student_data = {
            "name": student["name"],
            "username": student["username"],
            "email": student["email"],
            "password_hash": hashed_password,
            "role": student["role"],
            "grade": student.get("grade"),
            "phone": student.get("phone"),
            "parent_name": student.get("parent_name"),
            "parent_phone": student.get("parent_phone"),
            "created_at": datetime.utcnow(),
            "is_active": True,
            "preferences": student.get("preferences", {
                "teacher_gender": "male",
                "theme": "light",
                "language": "tr",
                "has_seen_onboarding": False
            }),
            "subscription": {
                "status": "trial",
                "plan": "free"
            }
        }
        
        await db.users.insert_one(student_data)
        logger.info(f"✅ Öğrenci eklendi: {student['name']}")
    
    # Öğretmenleri ekle
    for teacher in SAMPLE_TEACHERS:
        existing = await db.users.find_one({"email": teacher["email"]})
        if existing:
            logger.info(f"⏭️  {teacher['email']} zaten var, atlanıyor")
            continue
        
        hashed_password = pwd_context.hash(teacher["password"])
        teacher_data = {
            "name": teacher["name"],
            "username": teacher["username"],
            "email": teacher["email"],
            "password_hash": hashed_password,
            "role": teacher["role"],
            "phone": teacher.get("phone"),
            "subjects": teacher.get("subjects", []),
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(teacher_data)
        logger.info(f"✅ Öğretmen eklendi: {teacher['name']}")


async def seed_questions():
    """Örnek soruları ekle"""
    db = get_database()
    if db is None:
        return
    
    logger.info("❓ Örnek sorular ekleniyor...")
    
    all_questions = SAMPLE_QUESTIONS_MATH_5 + SAMPLE_QUESTIONS_MATH_9
    
    for question in all_questions:
        question_data = {
            **question,
            "created_at": datetime.utcnow(),
            "created_by": "system",
            "is_active": True,
            "times_used": 0,
            "average_score": 0
        }
        
        await db.questions.insert_one(question_data)
    
    logger.info(f"✅ {len(all_questions)} soru eklendi")


async def seed_quizzes():
    """Örnek quizleri ekle"""
    db = get_database()
    if db is None:
        return
    
    logger.info("📝 Örnek quizler ekleniyor...")
    
    for quiz in SAMPLE_QUIZZES:
        quiz_data = {
            **quiz,
            "created_at": datetime.utcnow(),
            "created_by": "system",
            "is_active": True,
            "is_published": True
        }
        
        await db.quizzes.insert_one(quiz_data)
        logger.info(f"✅ Quiz eklendi: {quiz['title']}")


async def seed_lesson_contents():
    """Örnek ders içeriklerini ekle"""
    db = get_database()
    if db is None:
        return
    
    logger.info("📚 Örnek ders içerikleri ekleniyor...")
    
    for content in SAMPLE_LESSON_CONTENTS:
        content_data = {
            **content,
            "created_at": datetime.utcnow(),
            "created_by": "system",
            "is_active": True,
            "views": 0,
            "ratings": []
        }
        
        await db.lesson_contents.insert_one(content_data)
        logger.info(f"✅ İçerik eklendi: {content['title']}")


async def seed_achievements():
    """Örnek başarıları ekle"""
    db = get_database()
    if db is None:
        return
    
    logger.info("🏆 Örnek başarılar ekleniyor...")
    
    for achievement in SAMPLE_ACHIEVEMENTS:
        existing = await db.achievements.find_one({"id": achievement["id"]})
        if existing:
            continue
        
        await db.achievements.insert_one(achievement)
        logger.info(f"✅ Başarı eklendi: {achievement['title']}")


async def main():
    """Ana fonksiyon"""
    logger.info("🚀 Veritabanı seed işlemi başlatılıyor...")
    logger.info(f"📍 MongoDB URL: {settings.MONGODB_URL}")
    
    # MongoDB'ye bağlan
    await mongo_connection.connect()
    
    try:
        # Seed işlemleri
        await seed_users()
        await seed_questions()
        await seed_quizzes()
        await seed_lesson_contents()
        await seed_achievements()
        
        logger.info("🎉 Tüm örnek veriler başarıyla eklendi!")
        logger.info("\n📊 Özet:")
        logger.info(f"   👥 Kullanıcılar: {len(SAMPLE_STUDENTS) + len(SAMPLE_TEACHERS)}")
        logger.info(f"   ❓ Sorular: {len(SAMPLE_QUESTIONS_MATH_5) + len(SAMPLE_QUESTIONS_MATH_9)}")
        logger.info(f"   📝 Quizler: {len(SAMPLE_QUIZZES)}")
        logger.info(f"   📚 İçerikler: {len(SAMPLE_LESSON_CONTENTS)}")
        logger.info(f"   🏆 Başarılar: {len(SAMPLE_ACHIEVEMENTS)}")
        
    except Exception as e:
        logger.error(f"❌ Hata: {e}")
        raise
    finally:
        await mongo_connection.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

