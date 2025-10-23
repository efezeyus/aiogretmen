"""
Student Panel API Routes
-----------------------
Öğrenci paneli için tüm modern özellik endpoint'leri.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.logger import logger
from app.models.user import User

# Servisleri import et
from app.services.ai_companion_service import (
    ai_companion_service,
    CompanionPersonality,
    EmotionalState,
    chat_with_companion,
    start_study_session
)
from app.services.adaptive_learning_service import (
    adaptive_learning_service,
    DifficultyLevel,
    LearningPace,
    ContentType,
    track_activity,
    get_recommendations,
    create_learning_path
)
from app.services.immersive_learning_service import (
    immersive_learning_service,
    ImmersiveType,
    DeviceType,
    ExperienceLevel,
    start_ar_experience,
    start_vr_experience
)
from app.services.blockchain_certificate_service import (
    blockchain_certificate_service,
    CertificateType,
    issue_course_certificate,
    issue_achievement_certificate
)


# Basit auth kontrolü (demo için)
async def get_current_user():
    """Basit kullanıcı döndürme (demo için)"""
    return type('User', (), {
        'id': 'demo_user',
        'username': 'demo',
        'full_name': 'Demo Öğrenci',
        'role': 'student',
        'grade_level': 7,
        'age': 13
    })


router = APIRouter(
    prefix="/student",
    tags=["Student Panel"]
)


# === AI COMPANION ENDPOINTS ===

class CompanionChatRequest(BaseModel):
    """AI arkadaş sohbet isteği"""
    message: str = Field(..., description="Öğrenci mesajı")
    subject: Optional[str] = Field(None, description="Konu/ders")
    lesson_context: Optional[Dict] = Field(None, description="Ders bağlamı")


class CompanionResponse(BaseModel):
    """AI arkadaş yanıtı"""
    response: str
    companion_name: str
    emotion_detected: str
    suggestions: List[str]
    metadata: Dict


@router.post("/ai-companion/chat", response_model=CompanionResponse)
async def chat_with_ai_companion(
    request: CompanionChatRequest,
    current_user: User = Depends(get_current_user)
):
    """AI arkadaş ile sohbet et"""
    try:
        response, metadata = await ai_companion_service.get_adaptive_response(
            user_id=str(current_user.id),
            message=request.message,
            subject=request.subject,
            lesson_context=request.lesson_context
        )
        
        # Önerileri metadata'dan çıkar
        adaptive_features = metadata.get("adaptive_features", {})
        suggestions = []
        
        if adaptive_features.get("motivation_needed"):
            suggestions.append("Biraz motivasyona ihtiyacın var gibi görünüyor! 💪")
        if adaptive_features.get("break_suggested"):
            suggestions.append("Kısa bir ara vermen iyi olabilir 🌟")
        if adaptive_features.get("extra_practice"):
            suggestions.append("Bu konuda biraz daha pratik yapalım mı? 📚")
        
        return CompanionResponse(
            response=response,
            companion_name=metadata.get("companion", "AI Arkadaş"),
            emotion_detected=metadata.get("emotion_detected", EmotionalState.NEUTRAL),
            suggestions=suggestions,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"AI companion chat hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI arkadaş yanıt veremedi"
        )


@router.get("/ai-companion/suggestions")
async def get_companion_suggestions(
    current_user: User = Depends(get_current_user)
):
    """Öğrenciye uygun AI arkadaş önerileri"""
    suggestions = await ai_companion_service.get_companion_suggestions(
        str(current_user.id)
    )
    
    return {
        "suggestions": [
            {
                "id": comp.id,
                "name": comp.name,
                "personality": comp.personality,
                "introduction": comp.introduction,
                "avatar_url": comp.avatar_url,
                "specialty_subjects": comp.specialty_subjects
            }
            for comp in suggestions
        ]
    }


@router.post("/ai-companion/switch/{companion_id}")
async def switch_companion(
    companion_id: str,
    current_user: User = Depends(get_current_user)
):
    """AI arkadaşı değiştir"""
    success = await ai_companion_service.switch_companion(
        str(current_user.id),
        companion_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz AI arkadaş ID"
        )
    
    return {"success": True, "message": "AI arkadaşın değiştirildi!"}


@router.post("/ai-companion/study-session")
async def create_study_buddy_session(
    subject: str,
    topic: str,
    duration_minutes: int = 25,
    current_user: User = Depends(get_current_user)
):
    """AI ile çalışma seansı oluştur"""
    session = await ai_companion_service.generate_study_buddy_session(
        user_id=str(current_user.id),
        subject=subject,
        topic=topic,
        duration_minutes=duration_minutes
    )
    
    return session


@router.get("/ai-companion/daily-motivation")
async def get_daily_motivation(
    current_user: User = Depends(get_current_user)
):
    """Günlük motivasyon mesajı"""
    return await ai_companion_service.get_daily_motivation(str(current_user.id))


# === ADAPTIVE LEARNING ENDPOINTS ===

class LearningActivityRequest(BaseModel):
    """Öğrenme aktivitesi"""
    type: str = Field(..., description="quiz|practice|lesson|video")
    topic: str
    difficulty: DifficultyLevel
    duration: int = Field(..., description="Süre (saniye)")
    score: float = Field(..., ge=0, le=1)
    completed: bool = True
    engagement_metrics: Optional[Dict] = None


@router.post("/adaptive-learning/track-activity")
async def track_learning_activity(
    activity: LearningActivityRequest,
    current_user: User = Depends(get_current_user)
):
    """Öğrenme aktivitesini takip et"""
    result = await adaptive_learning_service.track_learning_activity(
        user_id=str(current_user.id),
        activity=activity.dict()
    )
    
    return result


@router.get("/adaptive-learning/recommendations")
async def get_adaptive_content_recommendations(
    subject: str,
    topic: Optional[str] = None,
    count: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user)
):
    """Kişiselleştirilmiş içerik önerileri"""
    recommendations = await adaptive_learning_service.get_adaptive_content_recommendations(
        user_id=str(current_user.id),
        subject=subject,
        topic=topic,
        count=count
    )
    
    return {
        "recommendations": [
            {
                "id": rec.id,
                "topic": rec.topic,
                "type": rec.type,
                "difficulty": rec.difficulty,
                "estimated_time": rec.estimated_time,
                "url": rec.content_url,
                "reason": rec.metadata.get("reason"),
                "score": rec.metadata.get("recommendation_score")
            }
            for rec in recommendations
        ]
    }


@router.post("/adaptive-learning/create-path")
async def create_personalized_learning_path(
    subject: str,
    target_topics: List[str],
    deadline: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """Kişiselleştirilmiş öğrenme yolu oluştur"""
    path = await adaptive_learning_service.generate_learning_path(
        user_id=str(current_user.id),
        subject=subject,
        target_topics=target_topics,
        deadline=deadline
    )
    
    return {
        "path_id": path.id,
        "current_topic": path.current_topic,
        "next_topics": path.next_topics,
        "milestones": path.milestones,
        "estimated_completion": path.estimated_completion.isoformat(),
        "path_type": path.path_type
    }


@router.put("/adaptive-learning/path/{path_id}/progress")
async def update_learning_path_progress(
    path_id: str,
    completed_topic: str,
    current_user: User = Depends(get_current_user)
):
    """Öğrenme yolu ilerlemesini güncelle"""
    result = await adaptive_learning_service.update_learning_path_progress(
        user_id=str(current_user.id),
        path_id=path_id,
        completed_topic=completed_topic
    )
    
    return result


@router.get("/adaptive-learning/insights")
async def get_learning_insights(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user)
):
    """Öğrenme içgörüleri ve analizler"""
    insights = await adaptive_learning_service.get_learning_insights(
        user_id=str(current_user.id),
        time_period_days=days
    )
    
    return insights


@router.get("/adaptive-learning/profile")
async def get_learning_profile(
    current_user: User = Depends(get_current_user)
):
    """Öğrenme profili"""
    profile = await adaptive_learning_service.get_or_create_learning_profile(
        str(current_user.id)
    )
    
    return {
        "current_level": profile.current_level,
        "learning_pace": profile.learning_pace,
        "preferred_content_types": profile.preferred_content_types,
        "strong_topics": profile.strong_topics,
        "weak_topics": profile.weak_topics,
        "skill_tree": profile.skill_tree
    }


# === IMMERSIVE LEARNING ENDPOINTS ===

@router.get("/immersive/content")
async def get_immersive_content_list(
    subject: str,
    topic: Optional[str] = None,
    type: Optional[ImmersiveType] = None,
    current_user: User = Depends(get_current_user)
):
    """İmmersive içerik listesi"""
    # Cihaz tipini belirle (basit mantık)
    device_type = DeviceType.DESKTOP  # Default
    
    contents = await immersive_learning_service.get_immersive_content(
        subject=subject,
        topic=topic,
        grade_level=current_user.grade_level,
        device_type=device_type
    )
    
    # Filtrele
    if type:
        contents = [c for c in contents if c.type == type]
    
    return {
        "contents": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "type": c.type,
                "duration_minutes": c.duration_minutes,
                "preview_url": c.preview_url,
                "required_devices": c.required_devices,
                "learning_objectives": c.learning_objectives
            }
            for c in contents
        ]
    }


@router.post("/immersive/start-session")
async def start_immersive_session(
    content_id: str,
    device_type: DeviceType = DeviceType.DESKTOP,
    experience_level: ExperienceLevel = ExperienceLevel.GUIDED,
    current_user: User = Depends(get_current_user)
):
    """İmmersive oturum başlat"""
    session = await immersive_learning_service.start_immersive_session(
        user_id=str(current_user.id),
        content_id=content_id,
        device_type=device_type,
        experience_level=experience_level
    )
    
    return {
        "session_id": session.id,
        "content_id": session.content_id,
        "started_at": session.started_at.isoformat(),
        "device_type": session.device_type,
        "experience_level": session.experience_level
    }


@router.post("/immersive/session/{session_id}/interaction")
async def track_immersive_interaction(
    session_id: str,
    interaction: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """İmmersive etkileşim takibi"""
    result = await immersive_learning_service.track_interaction(
        session_id=session_id,
        interaction=interaction
    )
    
    return result


@router.post("/immersive/session/{session_id}/metrics")
async def update_session_metrics(
    session_id: str,
    metrics: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Oturum metriklerini güncelle"""
    await immersive_learning_service.update_session_metrics(
        session_id=session_id,
        metrics=metrics
    )
    
    return {"success": True}


@router.post("/immersive/session/{session_id}/end")
async def end_immersive_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """İmmersive oturumu bitir"""
    result = await immersive_learning_service.end_immersive_session(session_id)
    
    return result


@router.get("/immersive/3d-models")
async def get_3d_model_library(
    subject: str,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """3D model kütüphanesi"""
    models = await immersive_learning_service.get_3d_model_library(
        subject=subject,
        search_query=search
    )
    
    return {"models": models}


@router.get("/immersive/webxr-config")
async def get_webxr_configuration(
    device_type: DeviceType = DeviceType.DESKTOP,
    current_user: User = Depends(get_current_user)
):
    """WebXR konfigürasyonu"""
    config = await immersive_learning_service.get_webxr_config(device_type)
    
    return config


# === BLOCKCHAIN CERTIFICATE ENDPOINTS ===

@router.get("/certificates")
async def get_my_certificates(
    type: Optional[CertificateType] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının sertifikaları"""
    certificates = await blockchain_certificate_service.get_user_certificates(
        user_id=str(current_user.id),
        certificate_type=type,
        limit=limit,
        offset=offset
    )
    
    return {
        "certificates": [
            {
                "id": cert.id,
                "title": cert.title,
                "description": cert.description,
                "type": cert.type,
                "issued_date": cert.issued_date.isoformat(),
                "issuer": cert.issuer,
                "blockchain_tx": cert.blockchain_tx,
                "token_id": cert.token_id,
                "ipfs_hash": cert.ipfs_hash,
                "skills": cert.skills,
                "score": cert.score
            }
            for cert in certificates
        ]
    }


@router.get("/certificates/stats")
async def get_certificate_statistics(
    current_user: User = Depends(get_current_user)
):
    """Sertifika istatistikleri"""
    stats = await blockchain_certificate_service.get_certificate_stats(
        str(current_user.id)
    )
    
    return stats


@router.post("/certificates/verify")
async def verify_certificate(
    certificate_id: Optional[str] = None,
    token_id: Optional[int] = None,
    tx_hash: Optional[str] = None
):
    """Sertifika doğrula (public endpoint)"""
    if not any([certificate_id, token_id, tx_hash]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="En az bir doğrulama parametresi gerekli"
        )
    
    result = await blockchain_certificate_service.verify_certificate(
        certificate_id=certificate_id,
        token_id=token_id,
        tx_hash=tx_hash
    )
    
    return {
        "is_valid": result.is_valid,
        "message": result.message,
        "certificate": {
            "id": result.certificate.id,
            "title": result.certificate.title,
            "recipient_name": result.certificate.recipient_name,
            "issued_date": result.certificate.issued_date.isoformat(),
            "issuer": result.certificate.issuer
        } if result.certificate else None,
        "verification_data": result.verification_data
    }


@router.get("/certificates/{certificate_id}/export")
async def export_certificate_pdf(
    certificate_id: str,
    current_user: User = Depends(get_current_user)
):
    """Sertifikayı PDF olarak indir"""
    try:
        pdf_content = await blockchain_certificate_service.export_certificate_pdf(
            certificate_id
        )
        
        return {
            "success": True,
            "message": "PDF export özelliği yakında eklenecek",
            "certificate_id": certificate_id
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# === INTEGRATED FEATURES ===

@router.post("/complete-lesson")
async def complete_lesson_with_rewards(
    lesson_id: str,
    duration_minutes: int,
    background_tasks: BackgroundTasks,
    score: float = Body(..., ge=0, le=100),
    skills_learned: List[str] = [],
    current_user: User = Depends(get_current_user)
):
    """
    Ders tamamlama - tüm sistemler entegre
    
    - Gamification puanları
    - Adaptive learning güncellemesi
    - Sertifika (eğer kurs tamamlandıysa)
    - AI companion tebrik mesajı
    """
    user_id = str(current_user.id)
    
    # 1. Gamification
    from app.services.gamification_service import award_lesson_completion
    gamification_result = await award_lesson_completion(
        user_id=user_id,
        lesson_id=lesson_id,
        metadata={
            "duration_minutes": duration_minutes,
            "score": score
        }
    )
    
    # 2. Adaptive Learning
    await track_activity(
        user_id=user_id,
        activity={
            "type": "lesson",
            "topic": lesson_id,
            "difficulty": DifficultyLevel.MEDIUM,
            "duration": duration_minutes * 60,
            "score": score / 100,
            "completed": True
        }
    )
    
    # 3. AI Companion mesajı (background)
    async def send_companion_message():
        if score >= 90:
            message = f"Harika! {score} puan aldın! 🎉"
        elif score >= 70:
            message = f"Güzel iş! {score} puan fena değil 👍"
        else:
            message = f"Endişelenme, {score} puan aldın ama gelişiyorsun! 💪"
        
        await chat_with_companion(
            user_id=user_id,
            message="Dersi tamamladım!",
            subject=lesson_id
        )
    
    background_tasks.add_task(send_companion_message)
    
    # 4. Sertifika kontrolü (kurs tamamlandı mı?)
    # TODO: Kurs tamamlanma kontrolü
    certificate = None
    if score >= 80 and skills_learned:  # Demo için
        certificate = await issue_course_certificate(
            user_id=user_id,
            user_name=current_user.full_name,
            course_name="Demo Kurs",
            score=score,
            skills=skills_learned
        )
    
    return {
        "success": True,
        "gamification": {
            "points_earned": gamification_result["points_added"],
            "level_up": gamification_result["level_up"],
            "new_level": gamification_result["new_level"],
            "achievements": gamification_result["achievements_unlocked"]
        },
        "certificate": {
            "id": certificate.id,
            "title": certificate.title,
            "blockchain_tx": certificate.blockchain_tx
        } if certificate else None,
        "next_recommendations": await get_recommendations(
            user_id=user_id,
            subject=lesson_id.split(".")[0] if "." in lesson_id else "general",
            count=3
        )
    }


@router.get("/dashboard/summary")
async def get_student_dashboard_summary(
    current_user: User = Depends(get_current_user)
):
    """Öğrenci dashboard özeti - tüm sistemlerden veri"""
    user_id = str(current_user.id)
    
    # Paralel olarak tüm verileri topla
    from app.services.gamification_service import gamification_service
    
    # 1. Gamification profili
    gamification_profile = await gamification_service.get_user_profile(user_id)
    
    # 2. Learning profili
    learning_profile = await adaptive_learning_service.get_or_create_learning_profile(user_id)
    
    # 3. Sertifika sayısı
    cert_stats = await blockchain_certificate_service.get_certificate_stats(user_id)
    
    # 4. AI companion
    daily_motivation = await ai_companion_service.get_daily_motivation(user_id)
    
    # 5. Son öğrenme içgörüleri
    learning_insights = await adaptive_learning_service.get_learning_insights(
        user_id=user_id,
        time_period_days=7
    )
    
    return {
        "user": {
            "id": user_id,
            "name": current_user.full_name,
            "grade_level": current_user.grade_level
        },
        "gamification": {
            "level": gamification_profile["level"],
            "total_points": gamification_profile["total_points"],
            "achievements_count": gamification_profile["achievement_count"],
            "ranking": gamification_profile["ranking"],
            "streak": gamification_profile["streak"],
            "badges": gamification_profile["badges"]
        },
        "learning": {
            "current_level": learning_profile.current_level,
            "learning_pace": learning_profile.learning_pace,
            "strong_topics": learning_profile.strong_topics[:3],
            "weak_topics": learning_profile.weak_topics[:3],
            "weekly_insights": learning_insights
        },
        "certificates": {
            "total": cert_stats.get("total_certificates", 0),
            "nft_count": cert_stats.get("nft_certificates", 0),
            "latest": cert_stats.get("latest_certificate")
        },
        "ai_companion": daily_motivation,
        "quick_stats": {
            "lessons_this_week": learning_insights.get("total_activities", 0),
            "study_hours_this_week": round(learning_insights.get("total_time_hours", 0), 1),
            "average_score": round(learning_insights.get("average_score", 0) * 100, 1)
        }
    }
