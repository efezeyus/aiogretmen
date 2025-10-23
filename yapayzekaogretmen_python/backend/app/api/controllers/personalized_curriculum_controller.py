"""
Kişiselleştirilmiş Müfredat Controller
"""

from typing import Dict, Any
from fastapi import HTTPException, status
from loguru import logger

from app.services.personalized_curriculum_service import personalized_curriculum_service


async def create_personalized_plan(
    student_id: str,
    grade: int,
    subject: str
) -> Dict[str, Any]:
    """Öğrenci için kişiselleştirilmiş plan oluştur"""
    try:
        plan = await personalized_curriculum_service.create_personalized_plan(
            student_id, grade, subject
        )
        
        return {
            "student_id": plan.student_id,
            "grade": plan.grade,
            "subject": plan.subject,
            "current_level": plan.current_level,
            "learning_style": plan.learning_style,
            "learning_pace": plan.learning_pace,
            "current_topic": plan.current_topic,
            "upcoming_topics": plan.upcoming_topics,
            "overall_score": plan.overall_score,
            "strengths": plan.strengths,
            "weaknesses": plan.weaknesses,
            "recommended_activities": plan.recommended_activities,
            "recommended_review_topics": plan.recommended_review_topics,
            "estimated_completion_date": plan.estimated_completion_date.isoformat() if plan.estimated_completion_date else None,
            "ai_recommendations": plan.ai_recommendations,
            "motivation_message": plan.motivation_message,
            "next_milestone": plan.next_milestone
        }
        
    except Exception as e:
        logger.error(f"Plan oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan oluşturulamadı: {str(e)}"
        )


async def get_student_plan(
    student_id: str,
    grade: int,
    subject: str
) -> Dict[str, Any]:
    """Öğrencinin kaydedilmiş planını getir"""
    try:
        plan = await personalized_curriculum_service.get_student_plan(
            student_id, grade, subject
        )
        
        if not plan:
            # Plan yoksa yeni oluştur
            return await create_personalized_plan(student_id, grade, subject)
        
        return {
            "student_id": plan.student_id,
            "grade": plan.grade,
            "subject": plan.subject,
            "current_level": plan.current_level,
            "current_topic": plan.current_topic,
            "upcoming_topics": plan.upcoming_topics,
            "overall_score": plan.overall_score,
            "strengths": plan.strengths,
            "weaknesses": plan.weaknesses,
            "recommended_activities": plan.recommended_activities,
            "ai_recommendations": plan.ai_recommendations,
            "motivation_message": plan.motivation_message
        }
        
    except Exception as e:
        logger.error(f"Plan getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan getirilemedi: {str(e)}"
        )


async def update_progress(
    student_id: str,
    grade: int,
    subject: str,
    topic: str,
    score: float,
    time_spent: int
) -> Dict[str, Any]:
    """Öğrenci ilerlemesini güncelle"""
    try:
        # Validasyon
        if not (0 <= score <= 1.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Score 0-1 arası olmalıdır"
            )
        
        plan = await personalized_curriculum_service.update_progress(
            student_id, grade, subject, topic, score, time_spent
        )
        
        return {
            "success": True,
            "message": "İlerleme kaydedildi",
            "new_current_topic": plan.current_topic,
            "overall_score": plan.overall_score,
            "motivation": plan.motivation_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"İlerleme güncelleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"İlerleme güncellenemedi: {str(e)}"
        )


async def get_next_activity(
    student_id: str,
    grade: int,
    subject: str
) -> Dict[str, Any]:
    """Öğrenci için bir sonraki aktiviteyi öner"""
    try:
        return await personalized_curriculum_service.get_next_activity(
            student_id, grade, subject
        )
        
    except Exception as e:
        logger.error(f"Aktivite önerisi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Aktivite önerilemedi: {str(e)}"
        )


async def get_dashboard_summary(student_id: str) -> Dict[str, Any]:
    """Öğrenci dashboard özeti"""
    try:
        return await personalized_curriculum_service.get_dashboard_summary(student_id)
        
    except Exception as e:
        logger.error(f"Dashboard özeti hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard özeti alınamadı: {str(e)}"
        )

