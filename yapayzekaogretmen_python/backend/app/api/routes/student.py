"""
Student API Routes
Öğrenciye özel endpoint'ler
"""

from fastapi import APIRouter, Depends, Query, Path
from typing import List, Dict, Any
from datetime import datetime

from app.api.middlewares.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/lessons")
async def get_student_lessons(
    current_user: User = Depends(get_current_user)
):
    """
    Öğrencinin derslerini döndürür.
    MEB müfredatına göre öğrencinin sınıfındaki dersler.
    """
    # Demo data
    lessons = [
        {
            "id": 1,
            "title": "5. Sınıf Matematik - Kesirler",
            "subject": "Matematik",
            "grade": 5,
            "progress": 65,
            "nextSection": "Kesir Toplama",
            "totalSections": 5,
            "completedSections": 3,
            "estimatedTime": 25,
            "difficulty": "Orta",
            "lastAccessed": "2 saat önce"
        },
        {
            "id": 2,
            "title": "Fen Bilimleri - Canlılar ve Çevre",
            "subject": "Fen Bilimleri",
            "grade": 5,
            "progress": 40,
            "nextSection": "Ekosistem",
            "totalSections": 4,
            "completedSections": 1,
            "estimatedTime": 30,
            "difficulty": "Kolay",
            "lastAccessed": "1 gün önce"
        },
        {
            "id": 3,
            "title": "Türkçe - Yazılı Anlatım",
            "subject": "Türkçe",
            "grade": 5,
            "progress": 80,
            "nextSection": "Kompozisyon",
            "totalSections": 6,
            "completedSections": 5,
            "estimatedTime": 20,
            "difficulty": "Orta",
            "lastAccessed": "Dün"
        }
    ]
    
    return {"success": True, "data": lessons}


@router.get("/quizzes")
async def get_student_quizzes(
    status: str = Query(None, description="available, completed, all"),
    current_user: User = Depends(get_current_user)
):
    """
    Öğrencinin quizlerini döndürür.
    """
    quizzes = [
        {
            "id": 1,
            "title": "Doğal Sayılar Quiz",
            "subject": "Matematik",
            "grade": 5,
            "topic": "Doğal Sayılar",
            "status": "completed",
            "score": 85,
            "questions": 10,
            "totalPoints": 100,
            "duration": 15,
            "difficulty": "kolay",
            "attemptDate": "2024-10-01",
            "attempts": 1
        },
        {
            "id": 2,
            "title": "Kesirler Quiz",
            "subject": "Matematik",
            "grade": 5,
            "topic": "Kesirler",
            "status": "available",
            "questions": 12,
            "totalPoints": 120,
            "duration": 20,
            "difficulty": "orta",
            "locked": False
        },
        {
            "id": 3,
            "title": "Ondalık Sayılar Quiz",
            "subject": "Matematik",
            "grade": 5,
            "topic": "Ondalık Gösterim",
            "status": "locked",
            "questions": 10,
            "totalPoints": 100,
            "duration": 15,
            "difficulty": "orta",
            "locked": True,
            "unlockRequirement": "Kesirler quizini tamamla"
        },
        {
            "id": 4,
            "title": "Canlılar ve Çevre Quiz",
            "subject": "Fen Bilimleri",
            "grade": 5,
            "topic": "İnsan ve Çevre",
            "status": "completed",
            "score": 92,
            "questions": 15,
            "totalPoints": 150,
            "duration": 20,
            "difficulty": "kolay",
            "attemptDate": "2024-09-30",
            "attempts": 1
        }
    ]
    
    # Filtreleme
    if status:
        if status == "available":
            quizzes = [q for q in quizzes if q["status"] == "available"]
        elif status == "completed":
            quizzes = [q for q in quizzes if q["status"] == "completed"]
    
    return {"success": True, "data": quizzes}


@router.post("/quiz-results")
async def save_quiz_result(
    quiz_result: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Quiz sonucunu kaydeder.
    """
    # TODO: Veritabanına kaydet
    return {
        "success": True,
        "message": "Quiz sonucu kaydedildi",
        "xp_earned": quiz_result.get("score", 0),
        "coins_earned": quiz_result.get("score", 0) // 2
    }


@router.get("/achievements")
async def get_student_achievements(
    current_user: User = Depends(get_current_user)
):
    """
    Öğrencinin başarılarını döndürür.
    """
    achievements = [
        {
            "id": "first_login",
            "title": "İlk Adım",
            "description": "Platforma ilk kez giriş yaptın!",
            "icon": "🎯",
            "earned": True,
            "earnedDate": "2024-09-15",
            "xp": 10,
            "rarity": "common"
        },
        {
            "id": "complete_10_lessons",
            "title": "Öğrenme Tutkunu",
            "description": "10 ders tamamladın",
            "icon": "📚",
            "earned": True,
            "earnedDate": "2024-09-28",
            "xp": 100,
            "rarity": "rare"
        },
        {
            "id": "perfect_quiz",
            "title": "Mükemmellik",
            "description": "Bir quizde %100 başarı elde ettin",
            "icon": "⭐",
            "earned": True,
            "earnedDate": "2024-10-01",
            "xp": 50,
            "rarity": "epic"
        },
        {
            "id": "math_master_5",
            "title": "5. Sınıf Matematik Ustası",
            "description": "5. sınıf matematik müfredatını tamamladın",
            "icon": "🏆",
            "earned": False,
            "progress": 35,
            "xp": 500,
            "rarity": "legendary"
        },
        {
            "id": "daily_streak_7",
            "title": "Haftalık Disiplin",
            "description": "7 gün üst üste giriş yaptın",
            "icon": "🔥",
            "earned": True,
            "earnedDate": "2024-09-30",
            "xp": 75,
            "rarity": "epic"
        }
    ]
    
    return {"success": True, "data": achievements}


@router.get("/profile")
async def get_student_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Öğrenci profil bilgilerini döndürür.
    """
    profile = {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "grade": current_user.grade if hasattr(current_user, 'grade') else 5,
        "avatar": "🎓",
        "learningStyle": "görsel",
        "phone": getattr(current_user, 'phone', ''),
        "bio": ""
    }
    
    return {"success": True, "data": profile}


@router.get("/metrics")
async def get_student_metrics(
    current_user: User = Depends(get_current_user)
):
    """
    Öğrenci metriklerini döndürür.
    """
    metrics = {
        "totalStudyTime": 480,
        "todayStudyTime": 45,
        "weeklyGoal": 300,
        "streak": 7,
        "totalPoints": 1250,
        "level": 15,
        "xp": 3250,
        "xpToNextLevel": 4000,
        "totalLessons": 45,
        "completedLessons": 12,
        "totalQuizzes": 8,
        "averageScore": 78,
        "badges": 8,
        "currentStreak": 7,
        "longestStreak": 12
    }
    
    return {"success": True, "data": metrics}


@router.get("/statistics")
async def get_student_statistics(
    current_user: User = Depends(get_current_user)
):
    """
    Detaylı istatistikler.
    """
    stats = {
        "totalLessons": 45,
        "completedLessons": 12,
        "totalQuizzes": 8,
        "averageScore": 78,
        "totalStudyTime": 480,
        "currentStreak": 7,
        "longestStreak": 12,
        "totalXP": 3250,
        "level": 15,
        "badges": 8
    }
    
    return {"success": True, "data": stats}

