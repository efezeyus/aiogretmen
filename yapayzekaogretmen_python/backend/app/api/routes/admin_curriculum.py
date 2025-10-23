"""
Admin Curriculum & Student Management API
Öğretmen/yönetici için öğrenci ve ders yönetimi
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger

from app.models.user import User
from app.api.middlewares.auth import get_current_user, require_admin

router = APIRouter()

# ============================================================================
# MODELS
# ============================================================================

class StudentInfo(BaseModel):
    id: str
    name: str
    email: str
    grade: int
    created_at: str
    last_login: Optional[str] = None

class LessonProgress(BaseModel):
    lesson_id: str
    lesson_title: str
    completed: bool
    quiz_score: Optional[int] = None
    completed_at: Optional[str] = None

class StudentDetailResponse(BaseModel):
    student: StudentInfo
    progress: Dict[str, Any]
    lessons: List[LessonProgress]
    stats: Dict[str, Any]

# ============================================================================
# ENDPOINTS - ÖĞRENCI YÖNETİMİ
# ============================================================================

@router.get("/students")
async def get_all_students(
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    limit: int = Query(default=100, le=500)
):
    """
    Tüm öğrencileri listele
    Admin paneli için
    """
    try:
        logger.info(f"Admin: Öğrenci listesi getiriliyor (grade={grade}, subject={subject})")
        
        # DEMO DATA - Gerçek uygulamada MongoDB'den gelir
        mock_students = [
            {
                "id": "student_001",
                "name": "Murat Usta",
                "email": "murat@example.com",
                "grade": 5,
                "subject": "matematik",
                "created_at": "2024-10-01T10:00:00Z",
                "last_login": "2024-10-15T14:30:00Z",
                "status": "active",
                "placement_test_completed": True,
                "approved_grade": 5,
                "overall_progress": 40,
                "completed_lessons": 8,
                "total_lessons": 20,
                "quiz_average": 87,
                "final_average": 82,
                "total_time_spent": 720  # dakika
            },
            {
                "id": "student_002",
                "name": "Ali Yılmaz",
                "email": "ali@example.com",
                "grade": 5,
                "subject": "matematik",
                "created_at": "2024-09-15T10:00:00Z",
                "last_login": "2024-10-15T16:00:00Z",
                "status": "active",
                "placement_test_completed": True,
                "approved_grade": 5,
                "overall_progress": 65,
                "completed_lessons": 13,
                "total_lessons": 20,
                "quiz_average": 92,
                "final_average": 88,
                "total_time_spent": 1080
            },
            {
                "id": "student_003",
                "name": "Ayşe Kaya",
                "email": "ayse@example.com",
                "grade": 6,
                "subject": "matematik",
                "created_at": "2024-10-05T10:00:00Z",
                "last_login": "2024-10-14T12:00:00Z",
                "status": "active",
                "placement_test_completed": True,
                "approved_grade": 6,
                "overall_progress": 25,
                "completed_lessons": 5,
                "total_lessons": 20,
                "quiz_average": 78,
                "final_average": 75,
                "total_time_spent": 360
            }
        ]

        # Filtreleme
        filtered = mock_students
        if grade:
            filtered = [s for s in filtered if s['grade'] == grade]
        if subject:
            filtered = [s for s in filtered if s['subject'] == subject]

        return {
            "success": True,
            "students": filtered[:limit],
            "total": len(filtered)
        }

    except Exception as e:
        logger.error(f"Öğrenci listesi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/students/{student_id}")
async def get_student_detail(student_id: str):
    """
    Öğrenci detaylarını getir
    - Kişisel bilgiler
    - İlerleme durumu
    - Tamamlanan dersler
    - İstatistikler
    """
    try:
        logger.info(f"Admin: Öğrenci detayı getiriliyor - {student_id}")
        
        # DEMO DATA
        student_data = {
            "id": student_id,
            "name": "Murat Usta",
            "email": "murat@example.com",
            "grade": 5,
            "subject": "matematik",
            "created_at": "2024-10-01T10:00:00Z",
            "last_login": "2024-10-15T14:30:00Z",
            "status": "active",
            "phone": "05XX XXX XX XX",
            "parent_email": "parent@example.com"
        }

        progress_data = {
            "overall_progress": 40,
            "current_unit": 2,
            "current_lesson": "u2_l2",
            "completed_lessons": ["u1_l1", "u1_l2", "u1_l3", "u1_l4", "u1_final", "u2_l1", "u2_l2"],
            "completed_units": ["u1"],
            "quiz_average": 87,
            "final_average": 82,
            "total_time_spent": 720,
            "last_activity": "2024-10-15T14:30:00Z"
        }

        lessons_data = [
            {
                "lesson_id": "u1_l1",
                "lesson_title": "Doğal Sayıları Okuma ve Yazma",
                "unit": "Ünite 1: Doğal Sayılar",
                "completed": True,
                "quiz_score": 90,
                "time_spent": 45,
                "completed_at": "2024-10-05T10:30:00Z"
            },
            {
                "lesson_id": "u1_l2",
                "lesson_title": "Basamak Değeri",
                "unit": "Ünite 1: Doğal Sayılar",
                "completed": True,
                "quiz_score": 85,
                "time_spent": 50,
                "completed_at": "2024-10-06T11:00:00Z"
            },
            {
                "lesson_id": "u2_l1",
                "lesson_title": "Kesir Kavramı",
                "unit": "Ünite 2: Kesirler",
                "completed": True,
                "quiz_score": 92,
                "time_spent": 55,
                "completed_at": "2024-10-14T15:00:00Z"
            },
            {
                "lesson_id": "u2_l2",
                "lesson_title": "Kesir Türleri",
                "unit": "Ünite 2: Kesirler",
                "completed": False,
                "quiz_score": None,
                "time_spent": 15,
                "completed_at": None
            }
        ]

        stats_data = {
            "total_lessons_completed": 7,
            "total_quizzes_taken": 7,
            "total_quizzes_passed": 7,
            "quiz_average": 87,
            "final_average": 82,
            "total_study_time_minutes": 720,
            "average_session_time": 45,
            "streak_days": 7,
            "achievements": [
                {"name": "İlk Ders", "date": "2024-10-05"},
                {"name": "Quiz Master", "date": "2024-10-10"},
                {"name": "7 Gün Streak", "date": "2024-10-15"}
            ]
        }

        return {
            "success": True,
            "student": student_data,
            "progress": progress_data,
            "lessons": lessons_data,
            "stats": stats_data
        }

    except Exception as e:
        logger.error(f"Öğrenci detay hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# ENDPOINTS - DERS YÖNETİMİ
# ============================================================================

@router.get("/lessons")
async def get_all_lessons(
    grade: Optional[int] = None,
    subject: Optional[str] = "matematik"
):
    """
    Tüm dersleri listele
    Admin için ders yönetimi
    """
    try:
        logger.info(f"Admin: Ders listesi - {grade}. sınıf {subject}")
        
        # DEMO DATA
        lessons = [
            {
                "id": "u1_l1",
                "unit_id": "u1",
                "unit_title": "Ünite 1: Doğal Sayılar",
                "lesson_number": 1,
                "title": "Doğal Sayıları Okuma ve Yazma",
                "meb_code": "5.1.1",
                "grade": 5,
                "subject": "matematik",
                "duration": 45,
                "difficulty": "kolay",
                "objectives": [
                    "Doğal sayıları okur ve yazar",
                    "Büyük sayıları basamaklarına ayırır"
                ],
                "has_video": True,
                "has_pdf": True,
                "has_quiz": True,
                "active": True
            },
            {
                "id": "u1_l2",
                "unit_id": "u1",
                "unit_title": "Ünite 1: Doğal Sayılar",
                "lesson_number": 2,
                "title": "Basamak Değeri",
                "meb_code": "5.1.2",
                "grade": 5,
                "subject": "matematik",
                "duration": 45,
                "difficulty": "kolay",
                "objectives": ["Basamak değerini hesaplar"],
                "has_video": True,
                "has_pdf": False,
                "has_quiz": True,
                "active": True
            },
            {
                "id": "u2_l1",
                "unit_id": "u2",
                "unit_title": "Ünite 2: Kesirler",
                "lesson_number": 1,
                "title": "Kesir Kavramı",
                "meb_code": "5.2.1",
                "grade": 5,
                "subject": "matematik",
                "duration": 45,
                "difficulty": "orta",
                "objectives": [
                    "Kesir kavramını anlar",
                    "Pay ve paydayı tanır"
                ],
                "has_video": True,
                "has_pdf": True,
                "has_quiz": True,
                "active": True
            }
        ]

        # Filtreleme
        if grade:
            lessons = [l for l in lessons if l['grade'] == grade]

        return {
            "success": True,
            "lessons": lessons,
            "total": len(lessons)
        }

    except Exception as e:
        logger.error(f"Ders listesi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/lessons/{lesson_id}/students")
async def get_lesson_students(lesson_id: str):
    """
    Belirli bir dersi alan öğrencileri listele
    """
    try:
        logger.info(f"Admin: Ders öğrencileri - {lesson_id}")
        
        # DEMO DATA
        students = [
            {
                "student_id": "student_001",
                "student_name": "Murat Usta",
                "status": "in_progress",
                "progress_percent": 60,
                "quiz_score": None,
                "time_spent": 25,
                "last_accessed": "2024-10-15T14:30:00Z"
            },
            {
                "student_id": "student_002",
                "student_name": "Ali Yılmaz",
                "status": "completed",
                "progress_percent": 100,
                "quiz_score": 95,
                "time_spent": 45,
                "last_accessed": "2024-10-15T10:00:00Z",
                "completed_at": "2024-10-15T10:45:00Z"
            }
        ]

        return {
            "success": True,
            "lesson_id": lesson_id,
            "students": students,
            "total": len(students)
        }

    except Exception as e:
        logger.error(f"Ders öğrencileri hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# ENDPOINTS - İSTATİSTİKLER
# ============================================================================

@router.get("/statistics")
async def get_admin_statistics(
    grade: Optional[int] = None,
    subject: Optional[str] = "matematik"
):
    """
    Genel istatistikler
    Dashboard için
    """
    try:
        logger.info("Admin: İstatistikler getiriliyor")
        
        # DEMO DATA
        stats = {
            "total_students": 125,
            "active_students": 118,
            "pending_approvals": 7,
            "total_lessons": 48,
            "active_lessons": 45,
            "total_units": 6,
            
            "today": {
                "active_students": 45,
                "lessons_completed": 23,
                "quizzes_taken": 18,
                "avg_quiz_score": 84
            },
            
            "this_week": {
                "new_students": 12,
                "lessons_completed": 156,
                "quizzes_taken": 134,
                "avg_study_time": 38  # dakika/öğrenci
            },
            
            "grade_distribution": {
                "5": 45,
                "6": 38,
                "7": 25,
                "8": 17
            },
            
            "top_students": [
                {"name": "Ali Yılmaz", "progress": 89, "grade": 5},
                {"name": "Ayşe Kaya", "progress": 85, "grade": 6},
                {"name": "Murat Usta", "progress": 82, "grade": 5}
            ],
            
            "needs_attention": [
                {"name": "Zehra Demir", "reason": "3 gündür giriş yok"},
                {"name": "Can Öztürk", "reason": "Quiz ortalaması %60'a düştü"}
            ]
        }

        return {
            "success": True,
            "statistics": stats
        }

    except Exception as e:
        logger.error(f"İstatistik hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# ENDPOINTS - İÇERİK YÖNETİMİ
# ============================================================================

@router.get("/content/videos")
async def get_videos():
    """Video listesi"""
    videos = [
        {
            "id": "v1",
            "title": "Doğal Sayılar Giriş",
            "lesson_id": "u1_l1",
            "duration": 10,
            "url": "/media/videos/dogal_sayilar_giris.mp4",
            "views": 234,
            "status": "active"
        }
    ]
    
    return {"success": True, "videos": videos}


@router.get("/content/pdfs")
async def get_pdfs():
    """PDF listesi"""
    pdfs = [
        {
            "id": "pdf1",
            "title": "Kesirler Ders Notu",
            "lesson_id": "u2_l1",
            "pages": 12,
            "url": "/media/pdfs/kesirler_ders_notu.pdf",
            "downloads": 456,
            "status": "active"
        }
    ]
    
    return {"success": True, "pdfs": pdfs}


@router.get("/content/quizzes")
async def get_quizzes():
    """Quiz listesi"""
    quizzes = [
        {
            "id": "q1",
            "title": "Doğal Sayılar Quiz",
            "lesson_id": "u1_l1",
            "question_count": 10,
            "passing_score": 80,
            "attempts": 234,
            "avg_score": 87,
            "status": "active"
        }
    ]
    
    return {"success": True, "quizzes": quizzes}

