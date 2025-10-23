"""
System Health Check API
----------------------
Sistem durumunu ve entegre servisleri kontrol eden endpoint'ler
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
import asyncio
from datetime import datetime

from app.core.logger import logger
from app.services.ai_service import ai_service
from app.services.auto_learning_service import auto_learning_service
# from app.services.rag_service import rag_service  # Temporarily disabled
from app.services.adaptive_learning_service import adaptive_learning_service
from app.db.mongodb import get_database
from app.db.postgres import engine as postgres_engine
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["System Health"])

@router.get("/health")
async def health_check() -> Dict:
    """Sistem sağlık kontrolü"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "services": {}
    }
    
    # AI Servisleri Kontrolü
    try:
        # DeepSeek kontrolü
        if ai_service.deepseek_client:
            health_status["services"]["deepseek"] = {
                "status": "active",
                "model": ai_service.current_model,
                "api_key_set": bool(ai_service.deepseek_api_key)
            }
        else:
            health_status["services"]["deepseek"] = {
                "status": "inactive",
                "reason": "API key not configured"
            }
            
        # OpenAI kontrolü
        if ai_service.openai_client:
            health_status["services"]["openai"] = {
                "status": "active",
                "api_key_set": bool(ai_service.openai_api_key)
            }
        else:
            health_status["services"]["openai"] = {
                "status": "inactive",
                "reason": "API key not configured"
            }
            
    except Exception as e:
        health_status["services"]["ai"] = {
            "status": "error",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # MongoDB kontrolü
    try:
        db = get_database()
        if db:
            # Basit bir ping işlemi
            await db.command("ping")
            health_status["services"]["mongodb"] = {
                "status": "active",
                "database": db.name
            }
        else:
            health_status["services"]["mongodb"] = {
                "status": "inactive",
                "reason": "Connection not established"
            }
    except Exception as e:
        health_status["services"]["mongodb"] = {
            "status": "error",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # PostgreSQL kontrolü
    try:
        if postgres_engine:
            with postgres_engine.connect() as conn:
                result = conn.execute("SELECT 1")
                health_status["services"]["postgresql"] = {
                    "status": "active"
                }
        else:
            health_status["services"]["postgresql"] = {
                "status": "inactive",
                "reason": "Connection not configured"
            }
    except Exception as e:
        health_status["services"]["postgresql"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Auto-learning servisi kontrolü
    try:
        if auto_learning_service.learning_collection:
            health_status["services"]["auto_learning"] = {
                "status": "active",
                "min_feedback_threshold": auto_learning_service.min_feedback_for_learning,
                "learning_interval_days": auto_learning_service.learning_interval_days
            }
        else:
            health_status["services"]["auto_learning"] = {
                "status": "inactive",
                "reason": "Database collection not available"
            }
    except Exception as e:
        health_status["services"]["auto_learning"] = {
            "status": "error", 
            "error": str(e)
        }
    
    # RAG servisi kontrolü
    try:
        pass  # RAG service temporarily disabled
        # if rag_service:
        #     health_status["services"]["rag"] = {
        #         "status": "active",
        #         "vector_store": "chromadb" if hasattr(rag_service, 'chroma_client') else "none"
        #     }
    except Exception as e:
        health_status["services"]["rag"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Adaptive learning kontrolü
    try:
        if adaptive_learning_service:
            health_status["services"]["adaptive_learning"] = {
                "status": "active",
                "difficulty_levels": adaptive_learning_service.difficulty_levels
            }
    except Exception as e:
        health_status["services"]["adaptive_learning"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Genel durum belirleme
    inactive_services = [
        service for service, status in health_status["services"].items()
        if status.get("status") in ["inactive", "error"]
    ]
    
    if inactive_services:
        health_status["status"] = "degraded"
        health_status["inactive_services"] = inactive_services
    
    return health_status

@router.get("/ai-models")
async def get_ai_models() -> Dict:
    """Mevcut AI modellerini listele"""
    return {
        "current_model": ai_service.current_model,
        "current_provider": ai_service.current_provider,
        "available_models": {
            "deepseek": {
                "models": ["deepseek-chat", "deepseek-coder"],
                "status": "active" if ai_service.deepseek_client else "inactive"
            },
            "openai": {
                "models": ["gpt-4", "gpt-3.5-turbo"],
                "status": "active" if ai_service.openai_client else "inactive"
            },
            "huggingface": {
                "model": ai_service.huggingface_model,
                "endpoint": ai_service.huggingface_endpoint,
                "status": "active"
            }
        },
        "model_config": ai_service.model_config
    }

@router.get("/learning-stats")
async def get_learning_stats() -> Dict:
    """Auto-learning istatistiklerini getir"""
    try:
        performance = await auto_learning_service.analyze_performance()
        
        # Son öğrenme döngüsü bilgisi
        last_cycle = None
        if auto_learning_service.db:
            last_cycle = await auto_learning_service.db.improvement_cycles.find_one(
                sort=[("timestamp", -1)]
            )
        
        return {
            "performance": performance,
            "last_improvement_cycle": last_cycle,
            "learning_parameters": {
                "min_feedback_for_learning": auto_learning_service.min_feedback_for_learning,
                "confidence_threshold": auto_learning_service.confidence_threshold,
                "learning_interval_days": auto_learning_service.learning_interval_days
            }
        }
    except Exception as e:
        logger.error(f"Learning stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-learning")
async def trigger_learning_cycle() -> Dict:
    """Manual olarak öğrenme döngüsünü tetikle"""
    try:
        result = await auto_learning_service.continuous_improvement_cycle()
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        logger.error(f"Learning cycle trigger error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config")
async def get_system_config() -> Dict:
    """Sistem konfigürasyonunu getir (hassas bilgiler hariç)"""
    return {
        "environment": settings.ENVIRONMENT,
        "services": {
            "mongodb": {
                "configured": bool(settings.MONGODB_URL),
                "database": settings.MONGODB_DB_NAME
            },
            "postgresql": {
                "configured": bool(settings.POSTGRES_SERVER)
            },
            "redis": {
                "configured": bool(settings.REDIS_URL)
            },
            "deepseek": {
                "configured": bool(settings.DEEPSEEK_API_KEY),
                "model": "deepseek-chat"
            },
            "openai": {
                "configured": bool(settings.OPENAI_API_KEY)
            },
            "elasticsearch": {
                "configured": bool(getattr(settings, "ELASTICSEARCH_URL", None))
            }
        },
        "features": {
            "auto_learning": True,
            "adaptive_learning": True,
            "rag_enabled": True,
            "voice_enabled": True,
            "vision_enabled": True,
            "blockchain_certificates": True,
            "gamification": True,
            "peer_learning": True,
            "parent_dashboard": True,
            "emotion_detection": True
        }
    }
