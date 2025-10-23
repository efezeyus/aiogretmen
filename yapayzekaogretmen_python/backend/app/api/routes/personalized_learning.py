"""
Personalized Learning API Routes
================================
Kişiselleştirilmiş öğrenme endpoint'leri
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.logger import logger
from app.services.personalized_learning_engine import personalized_learning_engine
from app.services.ai_study_buddy import ai_study_buddy
from app.services.learning_analytics_engine import learning_analytics_engine

router = APIRouter(prefix="/personalized", tags=["Personalized Learning"])


# Request/Response Models
class StudentAnalysisRequest(BaseModel):
    student_id: str
    include_predictions: bool = True
    include_recommendations: bool = True


class LearningPathRequest(BaseModel):
    student_id: str
    subject: str
    target_level: str
    duration_weeks: Optional[int] = 12


class BuddyMessageRequest(BaseModel):
    student_id: str
    message: str
    context: Optional[Dict] = None


class RealTimeAdaptationRequest(BaseModel):
    student_id: str
    task_complexity: float = 0.5
    response_time: float = 1.0
    error_rate: float = 0.0
    help_requests: int = 0
    session_duration: int = 0
    current_strategy: Optional[str] = None


class EmotionalSupportRequest(BaseModel):
    student_id: str
    emotion: str
    context: Optional[str] = None


# Endpoints
@router.post("/analyze-student")
async def analyze_student(request: StudentAnalysisRequest) -> Dict:
    """Öğrenciyi bütünsel olarak analiz et"""
    try:
        # Temel analiz
        analysis = await personalized_learning_engine.analyze_student_holistically(
            request.student_id
        )
        
        # Öğrenme desenleri
        patterns = await learning_analytics_engine.analyze_learning_patterns(
            request.student_id
        )
        analysis["learning_patterns"] = patterns
        
        # Tahminler
        if request.include_predictions:
            predictions = await learning_analytics_engine.predict_student_outcomes(
                request.student_id
            )
            analysis["predictions"] = [p.__dict__ for p in predictions]
        
        # Öneriler
        if request.include_recommendations:
            recommendations = await learning_analytics_engine.generate_personalized_recommendations(
                request.student_id
            )
            analysis["recommendations"] = recommendations
        
        return {
            "success": True,
            "analysis": analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Öğrenci analizi hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-learning-path")
async def create_learning_path(request: LearningPathRequest) -> Dict:
    """Kişiselleştirilmiş öğrenme yolu oluştur"""
    try:
        path = await personalized_learning_engine.create_adaptive_learning_path(
            student_id=request.student_id,
            subject=request.subject,
            target_level=request.target_level
        )
        
        return {
            "success": True,
            "learning_path": {
                "path_id": f"path_{request.student_id}_{datetime.utcnow().timestamp()}",
                "student_id": path.student_id,
                "subject": request.subject,
                "target_level": request.target_level,
                "duration_weeks": request.duration_weeks,
                "current_module": path.current_module,
                "short_term_goals": path.short_term_goals,
                "medium_term_goals": path.medium_term_goals,
                "long_term_goals": path.long_term_goals,
                "difficulty_level": path.difficulty_level,
                "pace_multiplier": path.pace_multiplier,
                "estimated_completion": path.estimated_completion_date.isoformat() if path.estimated_completion_date else None,
                "success_probability": path.success_probability,
                "daily_minutes": path.recommended_daily_minutes
            }
        }
        
    except Exception as e:
        logger.error(f"Öğrenme yolu oluşturma hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adapt-in-realtime")
async def adapt_in_realtime(request: RealTimeAdaptationRequest) -> Dict:
    """Gerçek zamanlı adaptasyon"""
    try:
        interaction_data = {
            "task_complexity": request.task_complexity,
            "response_time": request.response_time,
            "error_rate": request.error_rate,
            "help_requests": request.help_requests,
            "session_duration": request.session_duration,
            "current_strategy": request.current_strategy,
            "timestamp": datetime.utcnow()
        }
        
        adaptations = await personalized_learning_engine.adapt_in_real_time(
            request.student_id,
            interaction_data
        )
        
        return {
            "success": True,
            "adaptations": adaptations
        }
        
    except Exception as e:
        logger.error(f"Gerçek zamanlı adaptasyon hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buddy/create")
async def create_buddy(student_id: str) -> Dict:
    """Öğrenci için AI buddy oluştur"""
    try:
        result = await ai_study_buddy.create_buddy_for_student(student_id)
        return result
        
    except Exception as e:
        logger.error(f"Buddy oluşturma hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buddy/chat")
async def chat_with_buddy(request: BuddyMessageRequest) -> Dict:
    """AI buddy ile sohbet et"""
    try:
        response = await ai_study_buddy.chat_with_buddy(
            student_id=request.student_id,
            message=request.message,
            context=request.context
        )
        return response
        
    except Exception as e:
        logger.error(f"Buddy sohbet hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/buddy/check-in/{student_id}")
async def buddy_check_in(student_id: str) -> Dict:
    """Günlük buddy check-in"""
    try:
        check_in = await ai_study_buddy.buddy_check_in(student_id)
        return {
            "success": True,
            "check_in": check_in
        }
        
    except Exception as e:
        logger.error(f"Buddy check-in hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buddy/celebrate")
async def celebrate_achievement(
    student_id: str,
    achievement_title: str,
    achievement_type: str,
    points: int = 10
) -> Dict:
    """Başarıyı kutla"""
    try:
        achievement = {
            "title": achievement_title,
            "type": achievement_type,
            "points": points,
            "timestamp": datetime.utcnow()
        }
        
        celebration = await ai_study_buddy.celebrate_achievement(
            student_id,
            achievement
        )
        
        return {
            "success": True,
            "celebration": celebration
        }
        
    except Exception as e:
        logger.error(f"Kutlama hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buddy/emotional-support")
async def provide_emotional_support(request: EmotionalSupportRequest) -> Dict:
    """Duygusal destek sağla"""
    try:
        support = await ai_study_buddy.provide_emotional_support(
            student_id=request.student_id,
            emotion=request.emotion,
            context=request.context
        )
        
        return {
            "success": True,
            "support": support
        }
        
    except Exception as e:
        logger.error(f"Duygusal destek hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/patterns/{student_id}")
async def get_learning_patterns(student_id: str) -> Dict:
    """Öğrenme desenlerini getir"""
    try:
        patterns = await learning_analytics_engine.analyze_learning_patterns(student_id)
        return {
            "success": True,
            "patterns": patterns
        }
        
    except Exception as e:
        logger.error(f"Desen analizi hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/anomalies/{student_id}")
async def detect_anomalies(student_id: str) -> Dict:
    """Öğrenme anomalilerini tespit et"""
    try:
        anomalies = await learning_analytics_engine.detect_learning_anomalies(student_id)
        return {
            "success": True,
            "anomalies": anomalies,
            "detected_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Anomali tespiti hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/benchmark/{student_id}")
async def benchmark_performance(
    student_id: str,
    peer_group: Optional[str] = None
) -> Dict:
    """Performans karşılaştırması"""
    try:
        benchmark = await learning_analytics_engine.benchmark_student_performance(
            student_id,
            peer_group
        )
        return {
            "success": True,
            "benchmark": benchmark
        }
        
    except Exception as e:
        logger.error(f"Karşılaştırma hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/micro-interventions")
async def generate_micro_interventions(
    student_id: str,
    attention_level: float = 1.0,
    motivation_level: float = 1.0,
    cognitive_load: float = 0.5,
    retention_risk: bool = False
) -> Dict:
    """Mikro müdahaleler üret"""
    try:
        current_state = {
            "attention_level": attention_level,
            "motivation_level": motivation_level,
            "cognitive_load": cognitive_load,
            "retention_risk": retention_risk
        }
        
        interventions = await personalized_learning_engine.generate_micro_interventions(
            student_id,
            current_state
        )
        
        return {
            "success": True,
            "interventions": interventions,
            "priority": "high" if len(interventions) > 2 else "normal"
        }
        
    except Exception as e:
        logger.error(f"Mikro müdahale hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/{student_id}")
async def get_personalized_dashboard(student_id: str) -> Dict:
    """Kişiselleştirilmiş dashboard verisi"""
    try:
        # Paralel veri toplama
        import asyncio
        
        tasks = [
            personalized_learning_engine.analyze_student_holistically(student_id),
            learning_analytics_engine.analyze_learning_patterns(student_id),
            learning_analytics_engine.predict_student_outcomes(student_id),
            ai_study_buddy.buddy_check_in(student_id)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Hataları kontrol et
        analysis = results[0] if not isinstance(results[0], Exception) else {}
        patterns = results[1] if not isinstance(results[1], Exception) else {}
        predictions = results[2] if not isinstance(results[2], Exception) else []
        buddy_check = results[3] if not isinstance(results[3], Exception) else {}
        
        return {
            "success": True,
            "dashboard": {
                "student_id": student_id,
                "timestamp": datetime.utcnow().isoformat(),
                "cognitive_state": analysis.get("cognitive_state"),
                "learning_modalities": analysis.get("learning_modalities", []),
                "today_focus": patterns.get("patterns", {}).get("time", {}).get("preferred_hours", []),
                "predictions_summary": [
                    {
                        "type": p.insight_type,
                        "risk_level": p.risk_level,
                        "recommendation": p.recommendations[0] if p.recommendations else None
                    }
                    for p in predictions[:3]
                ] if isinstance(predictions, list) else [],
                "buddy_message": buddy_check.get("message", ""),
                "daily_challenge": buddy_check.get("challenge", {}),
                "motivational_quote": buddy_check.get("motivational_boost", "")
            }
        }
        
    except Exception as e:
        logger.error(f"Dashboard hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))
