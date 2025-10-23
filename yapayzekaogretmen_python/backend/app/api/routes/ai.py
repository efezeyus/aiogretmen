"""
AI Öğretmen API Routes
DeepSeek entegrasyonu ile güçlü AI öğretmen
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict
from loguru import logger

from app.services.ai_service import AIService
from app.services.auto_learning_service import auto_learning_service
from app.api.middlewares.auth import get_current_user
from app.models.user import User

router = APIRouter()
ai_service = AIService()

class AITeacherRequest(BaseModel):
    message: str
    grade_level: int = 5
    subject: str = "matematik"
    context: Optional[str] = None
    conversation_history: Optional[List[Dict]] = None
    user_name: Optional[str] = None

class AITeacherResponse(BaseModel):
    response: str
    model_used: str
    provider: str
    confidence: float = 0.9

@router.post("/teach", response_model=AITeacherResponse)
async def ai_teacher_lesson(
    request: AITeacherRequest
    # current_user: User = Depends(get_current_user)  # Geçici olarak kaldırıldı
):
    """AI öğretmen ders anlatma endpoint'i"""
    try:
        logger.info(f"AI öğretmen isteği: {request.grade_level}. sınıf {request.subject}")
        
        # AI servisinden yanıt al
        response, metadata = await ai_service.get_ai_response(
            prompt=request.message,
            grade_level=request.grade_level,
            subject=request.subject,
            context=request.context,
            conversation_history=request.conversation_history,
            user_name=request.user_name
        )
        
        return AITeacherResponse(
            response=response,
            model_used=metadata.get("model", "deepseek-chat"),
            provider=metadata.get("provider", "deepseek"),
            confidence=metadata.get("confidence", 0.9)
        )
        
    except Exception as e:
        logger.error(f"AI öğretmen hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI öğretmen yanıt verirken hata oluştu: {str(e)}"
        )

@router.get("/models")
async def get_available_models():
    """Kullanılabilir AI modellerini listele"""
    try:
        model_info = ai_service.get_model_info()
        return {
            "current_model": model_info.get("current_model"),
            "current_provider": model_info.get("current_provider"),
            "available_models": model_info.get("available_models", []),
            "status": "active"
        }
    except Exception as e:
        logger.error(f"Model bilgisi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model bilgisi alınamadı"
        )

@router.post("/analyze")
async def analyze_student_question(
    request: AITeacherRequest
    # current_user: User = Depends(get_current_user)  # Geçici olarak kaldırıldı
):
    """Öğrenci sorusunu analiz et"""
    try:
        analysis = ai_service.analyze_student_question(request.message)
        return {
            "analysis": analysis,
            "suggestions": analysis.get("suggestions", []),
            "difficulty_level": analysis.get("difficulty_level", "medium")
        }
    except Exception as e:
        logger.error(f"Soru analizi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Soru analizi yapılamadı"
        )


class FeedbackRequest(BaseModel):
    """Geri bildirim isteği modeli"""
    interaction_id: Optional[str] = None
    message: str
    ai_response: str
    feedback_type: str  # "positive", "negative", "neutral"
    grade_level: int
    subject: str
    model_used: Optional[str] = None
    response_time: Optional[float] = None
    additional_comments: Optional[str] = None
    difficulty_rating: Optional[int] = None  # 1-5 arası
    clarity_rating: Optional[int] = None  # 1-5 arası
    helpfulness_rating: Optional[int] = None  # 1-5 arası


@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    # current_user: User = Depends(get_current_user)  # Geçici olarak kaldırıldı
):
    """
    Öğrenci geri bildirimi kaydet
    
    - AI yanıtının kalitesi hakkında geri bildirim
    - Otomatik öğrenme için veri toplama
    - Model performans iyileştirme
    """
    try:
        # Geri bildirimi zenginleştir
        interaction_data = {
            "user_id": "anonymous",  # Kullanıcı auth eklendiğinde güncellenecek
            "grade_level": feedback.grade_level,
            "subject": feedback.subject,
            "question": feedback.message,
            "ai_response": feedback.ai_response,
            "user_feedback": feedback.feedback_type,
            "model_used": feedback.model_used or "unknown",
            "response_time": feedback.response_time or 1.0,
            "confidence_score": 0.9,  # Model'den alınabilir
            "success_indicator": feedback.feedback_type == "positive",
            "additional_feedback": {
                "comments": feedback.additional_comments,
                "difficulty": feedback.difficulty_rating,
                "clarity": feedback.clarity_rating,
                "helpfulness": feedback.helpfulness_rating
            }
        }
        
        # Auto-learning servisine gönder
        await auto_learning_service.collect_learning_data(interaction_data)
        
        # Eğer olumsuz geri bildirim ise, analiz et
        improvement_suggestions = []
        if feedback.feedback_type == "negative":
            if feedback.clarity_rating and feedback.clarity_rating < 3:
                improvement_suggestions.append("Yanıtlar daha açık ve anlaşılır olmalı")
            if feedback.difficulty_rating and feedback.difficulty_rating > 4:
                improvement_suggestions.append("İçerik seviyeye uygun şekilde basitleştirilmeli")
            if feedback.helpfulness_rating and feedback.helpfulness_rating < 3:
                improvement_suggestions.append("Daha fazla örnek ve açıklama eklenmeli")
        
        return {
            "success": True,
            "message": "Geri bildiriminiz kaydedildi",
            "improvement_suggestions": improvement_suggestions,
            "thank_you_message": "Geri bildiriminiz için teşekkürler! Bu, AI öğretmenimizi geliştirmemize yardımcı olacak."
        }
        
    except Exception as e:
        logger.error(f"Geri bildirim kaydetme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Geri bildirim kaydedilemedi"
        )


@router.post("/batch-feedback")
async def submit_batch_feedback(
    feedbacks: List[FeedbackRequest],
    # current_user: User = Depends(get_current_user)  # Geçici olarak kaldırıldı
):
    """
    Toplu geri bildirim kaydet (Öğretmenler için)
    
    - Birden fazla öğrenci etkileşimini değerlendirme
    - Toplu iyileştirme önerileri
    """
    try:
        successful_count = 0
        failed_count = 0
        
        for feedback in feedbacks:
            try:
                interaction_data = {
                    "user_id": "teacher_batch",  # Öğretmen toplu değerlendirmesi
                    "grade_level": feedback.grade_level,
                    "subject": feedback.subject,
                    "question": feedback.message,
                    "ai_response": feedback.ai_response,
                    "user_feedback": feedback.feedback_type,
                    "model_used": feedback.model_used or "unknown",
                    "response_time": feedback.response_time or 1.0,
                    "confidence_score": 0.9,
                    "success_indicator": feedback.feedback_type == "positive"
                }
                
                await auto_learning_service.collect_learning_data(interaction_data)
                successful_count += 1
                
            except Exception as e:
                logger.error(f"Tekil geri bildirim hatası: {e}")
                failed_count += 1
        
        # Toplu analiz
        total_feedbacks = len(feedbacks)
        positive_count = sum(1 for f in feedbacks if f.feedback_type == "positive")
        satisfaction_rate = positive_count / total_feedbacks if total_feedbacks > 0 else 0
        
        return {
            "success": True,
            "summary": {
                "total": total_feedbacks,
                "successful": successful_count,
                "failed": failed_count,
                "satisfaction_rate": satisfaction_rate
            },
            "message": f"{successful_count} geri bildirim başarıyla kaydedildi",
            "recommendation": "Memnuniyet oranı düşük, model iyileştirme önerilir" if satisfaction_rate < 0.7 else "Performans iyi durumda"
        }
        
    except Exception as e:
        logger.error(f"Toplu geri bildirim hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Toplu geri bildirim işlenemedi"
        )


@router.get("/learning-suggestions/{user_id}")
async def get_learning_suggestions(
    user_id: str,
    # current_user: User = Depends(get_current_user)  # Geçici olarak kaldırıldı
):
    """
    Kullanıcıya özel öğrenme önerileri
    
    - Adaptif öğrenme planı
    - Güçlü ve zayıf yönler
    - Kişiselleştirilmiş öneriler
    """
    try:
        # Kullanıcı profilini hazırla
        user_profile = {
            "user_id": user_id,
            "grade_level": 5,  # Gerçek sistemde kullanıcı bilgisinden alınacak
            "preferred_subject": "matematik"
        }
        
        # Adaptif öğrenme planı al
        learning_plan = await auto_learning_service.adaptive_learning(user_profile)
        
        if "error" in learning_plan:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Öğrenme planı oluşturulamadı: {learning_plan['error']}"
            )
        
        return {
            "success": True,
            "user_id": user_id,
            "learning_plan": learning_plan,
            "next_steps": _generate_next_steps(learning_plan)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Öğrenme önerileri hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğrenme önerileri alınamadı"
        )


def _generate_next_steps(learning_plan: Dict) -> List[str]:
    """Öğrenme planına göre sonraki adımları oluştur"""
    steps = []
    
    if learning_plan.get("weaknesses"):
        steps.append(f"Öncelikle şu konulara odaklan: {', '.join(learning_plan['weaknesses'][:2])}")
    
    if learning_plan.get("difficulty_adjustment") == -1:
        steps.append("Daha basit sorularla başla ve yavaş yavaş ilerle")
    elif learning_plan.get("difficulty_adjustment") == 1:
        steps.append("Kendini zorlayacak ileri seviye sorulara geç")
    
    if learning_plan.get("focus_topics"):
        steps.append(f"Bu hafta {learning_plan['focus_topics'][0]} konusunu çalış")
    
    steps.append("Her gün en az 30 dakika pratik yap")
    
    return steps 