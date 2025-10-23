"""
AI Model Performans İzleme API
------------------------------
Yapay zeka modellerinin performansını izleme ve raporlama.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.logger import logger
from app.services.auto_learning_service import auto_learning_service
from app.models.user import User, RoleEnum
from app.utils.auth import get_current_user, check_role


router = APIRouter(
    prefix="/ai-monitoring",
    tags=["AI Monitoring"]
)


class PerformanceMetrics(BaseModel):
    """Performans metrikleri"""
    total_interactions: int
    avg_positive_feedback: float
    avg_confidence: float
    avg_response_time: float
    success_rate: float
    
class ModelPerformance(BaseModel):
    """Model performans özeti"""
    model_name: str
    provider: str
    metrics: PerformanceMetrics
    last_updated: datetime
    improvement_suggestions: List[str] = []

class DashboardResponse(BaseModel):
    """Dashboard yanıt modeli"""
    timestamp: datetime
    period: str
    overall_metrics: PerformanceMetrics
    model_performances: List[ModelPerformance]
    improvement_areas: List[Dict]
    learning_status: Dict


@router.get("/dashboard", response_model=DashboardResponse)
async def get_performance_dashboard(
    period_days: int = Query(7, description="Analiz periyodu (gün)"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    AI model performans dashboard verilerini getir
    
    - Genel performans metrikleri
    - Model bazlı karşılaştırmalar
    - İyileştirme önerileri
    - Öğrenme durumu
    """
    try:
        # Performans analizini al
        performance = await auto_learning_service.analyze_performance()
        
        if "error" in performance:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Performans analizi hatası: {performance['error']}"
            )
        
        # Model karşılaştırmasını al
        model_comparison = await auto_learning_service._compare_models()
        
        # Model performanslarını hazırla
        model_performances = []
        for model_name, data in model_comparison.items():
            model_performances.append(ModelPerformance(
                model_name=model_name,
                provider=_get_provider_from_model(model_name),
                metrics=PerformanceMetrics(
                    total_interactions=data["metrics"]["usage_count"],
                    avg_positive_feedback=data["metrics"]["satisfaction"],
                    avg_confidence=data["metrics"]["confidence"],
                    avg_response_time=data["metrics"]["response_time"],
                    success_rate=data["metrics"]["satisfaction"] * data["metrics"]["confidence"]
                ),
                last_updated=datetime.utcnow(),
                improvement_suggestions=_generate_model_suggestions(data["metrics"])
            ))
        
        # Öğrenme durumu
        learning_status = await _get_learning_status()
        
        # Dashboard yanıtı oluştur
        dashboard = DashboardResponse(
            timestamp=datetime.utcnow(),
            period=f"last_{period_days}_days",
            overall_metrics=PerformanceMetrics(
                total_interactions=performance["overall"]["total_interactions"],
                avg_positive_feedback=performance["overall"]["avg_positive_feedback"],
                avg_confidence=performance["overall"]["avg_confidence"],
                avg_response_time=performance["overall"]["avg_response_time"],
                success_rate=performance["overall"]["avg_positive_feedback"] * performance["overall"]["avg_confidence"]
            ),
            model_performances=model_performances,
            improvement_areas=performance["overall"]["improvement_areas"],
            learning_status=learning_status
        )
        
        return dashboard
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard veri hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Dashboard verileri alınamadı"
        )


@router.get("/metrics/realtime")
async def get_realtime_metrics(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Gerçek zamanlı metrikler (WebSocket yerine polling için)
    """
    try:
        # Son 1 saatin metriklerini al
        from app.db.mongodb import get_database
        db = get_database()
        
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        start_time = datetime.utcnow() - timedelta(hours=1)
        
        # Son saatteki etkileşimler
        recent_interactions = await db.auto_learning.find({
            "timestamp": {"$gte": start_time}
        }).sort("timestamp", -1).limit(50).to_list(None)
        
        # Anlık metrikler
        realtime_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "last_hour": {
                "interaction_count": len(recent_interactions),
                "avg_response_time": sum(i.get("response_time", 0) for i in recent_interactions) / len(recent_interactions) if recent_interactions else 0,
                "positive_feedback_rate": sum(1 for i in recent_interactions if i.get("user_feedback") == "positive") / len(recent_interactions) if recent_interactions else 0,
                "active_models": list(set(i.get("model_used", "unknown") for i in recent_interactions))
            },
            "recent_interactions": [
                {
                    "timestamp": i["timestamp"].isoformat(),
                    "subject": i.get("subject"),
                    "grade_level": i.get("grade_level"),
                    "model": i.get("model_used"),
                    "feedback": i.get("user_feedback"),
                    "response_time": i.get("response_time")
                }
                for i in recent_interactions[:10]  # Son 10 etkileşim
            ]
        }
        
        return realtime_data
        
    except Exception as e:
        logger.error(f"Gerçek zamanlı metrik hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gerçek zamanlı metrikler alınamadı"
        )


@router.post("/trigger-learning")
async def trigger_learning_cycle(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Manuel olarak öğrenme döngüsünü tetikle
    """
    try:
        # Öğrenme döngüsünü başlat
        result = await auto_learning_service.continuous_improvement_cycle()
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Öğrenme döngüsü hatası: {result['error']}"
            )
        
        return {
            "success": True,
            "message": "Öğrenme döngüsü başarıyla tamamlandı",
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Öğrenme döngüsü tetikleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğrenme döngüsü başlatılamadı"
        )


@router.get("/learning-history")
async def get_learning_history(
    limit: int = Query(100, description="Kayıt limiti"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Öğrenme geçmişini getir
    """
    try:
        from app.db.mongodb import get_database
        db = get_database()
        
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        # İyileştirme döngülerini al
        cycles = await db.improvement_cycles.find().sort("timestamp", -1).limit(limit).to_list(None)
        
        # Eğitim verilerini al
        training_data = await db.training_data.find().sort("generated_at", -1).limit(10).to_list(None)
        
        history = {
            "improvement_cycles": [
                {
                    "timestamp": cycle["timestamp"],
                    "performance_summary": cycle.get("performance_summary", {}),
                    "training_data_generated": cycle.get("training_data_generated", 0),
                    "action_items": cycle.get("action_items", [])
                }
                for cycle in cycles
            ],
            "training_data_summary": {
                "total_datasets": len(training_data),
                "total_examples": sum(td.get("data_count", 0) for td in training_data),
                "latest_generation": training_data[0]["generated_at"].isoformat() if training_data else None
            }
        }
        
        return history
        
    except Exception as e:
        logger.error(f"Öğrenme geçmişi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğrenme geçmişi alınamadı"
        )


@router.get("/model-comparison")
async def get_model_comparison(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Model karşılaştırma raporu
    """
    try:
        # Model karşılaştırmasını al
        comparison = await auto_learning_service._compare_models()
        
        # Detaylı rapor oluştur
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "models": [],
            "recommendation": None
        }
        
        for model_name, data in comparison.items():
            report["models"].append({
                "name": model_name,
                "provider": _get_provider_from_model(model_name),
                "score": data["score"],
                "metrics": data["metrics"],
                "strengths": _identify_model_strengths(data["metrics"]),
                "weaknesses": _identify_model_weaknesses(data["metrics"])
            })
        
        # En iyi modeli öner
        if report["models"]:
            best_model = max(report["models"], key=lambda x: x["score"])
            report["recommendation"] = {
                "model": best_model["name"],
                "reason": f"En yüksek performans skoru ({best_model['score']:.2f})",
                "action": "Bu modeli varsayılan olarak ayarlayın"
            }
        
        return report
        
    except Exception as e:
        logger.error(f"Model karşılaştırma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model karşılaştırması yapılamadı"
        )


# Yardımcı fonksiyonlar
def _get_provider_from_model(model_name: str) -> str:
    """Model adından sağlayıcıyı çıkar"""
    if "gpt" in model_name.lower():
        return "openai"
    elif "deepseek" in model_name.lower():
        return "deepseek"
    elif "gemma" in model_name.lower() or "flan" in model_name.lower():
        return "huggingface"
    else:
        return "unknown"


def _generate_model_suggestions(metrics: Dict) -> List[str]:
    """Model için iyileştirme önerileri oluştur"""
    suggestions = []
    
    if metrics["satisfaction"] < 0.7:
        suggestions.append("Kullanıcı memnuniyeti düşük, yanıt kalitesi iyileştirilmeli")
    
    if metrics["response_time"] > 2.0:
        suggestions.append("Yanıt süresi yüksek, optimizasyon gerekli")
    
    if metrics["confidence"] < 0.8:
        suggestions.append("Güven skoru düşük, daha fazla eğitim verisi gerekli")
    
    if metrics["usage_count"] < 10:
        suggestions.append("Az kullanım, daha fazla test edilmeli")
    
    return suggestions if suggestions else ["Performans kabul edilebilir seviyede"]


def _identify_model_strengths(metrics: Dict) -> List[str]:
    """Model güçlü yönlerini belirle"""
    strengths = []
    
    if metrics["satisfaction"] > 0.85:
        strengths.append("Yüksek kullanıcı memnuniyeti")
    
    if metrics["response_time"] < 1.0:
        strengths.append("Çok hızlı yanıt süresi")
    
    if metrics["confidence"] > 0.9:
        strengths.append("Yüksek güven skoru")
    
    return strengths


def _identify_model_weaknesses(metrics: Dict) -> List[str]:
    """Model zayıf yönlerini belirle"""
    weaknesses = []
    
    if metrics["satisfaction"] < 0.6:
        weaknesses.append("Düşük kullanıcı memnuniyeti")
    
    if metrics["response_time"] > 3.0:
        weaknesses.append("Yavaş yanıt süresi")
    
    if metrics["confidence"] < 0.7:
        weaknesses.append("Düşük güven skoru")
    
    return weaknesses


async def _get_learning_status() -> Dict:
    """Öğrenme durumunu al"""
    try:
        from app.db.mongodb import get_database
        db = get_database()
        
        if not db:
            return {"status": "unknown", "details": "Veritabanı bağlantısı yok"}
        
        # Son öğrenme döngüsü
        last_cycle = await db.improvement_cycles.find_one(sort=[("timestamp", -1)])
        
        # Bekleyen eğitim verisi
        pending_data = await db.auto_learning.count_documents({
            "training_data_generated": {"$ne": True}
        })
        
        status = {
            "last_cycle": last_cycle["timestamp"] if last_cycle else None,
            "pending_training_data": pending_data,
            "next_cycle_eligible": pending_data >= 50,
            "auto_learning_enabled": True,
            "learning_interval_days": 7
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Öğrenme durumu hatası: {e}")
        return {"status": "error", "details": str(e)}
