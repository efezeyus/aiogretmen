"""
Admin Panel API Routes
---------------------
Kapsamlı admin yönetim sistemi.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import asyncio

from app.core.logger import logger
from app.models.user import User, RoleEnum
from app.utils.auth import get_current_user, check_role
from app.db.mongodb import get_database
from app.services.ai_service import ai_service
from app.services.auto_learning_service import auto_learning_service
from app.services.ab_test_service import ab_test_service
from app.services.auto_training_scheduler import auto_training_scheduler


router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"]
)


# Response Models
class SystemHealthResponse(BaseModel):
    """Sistem sağlığı yanıt modeli"""
    status: str = "healthy"
    uptime_hours: float
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    database_status: str
    ai_service_status: str
    active_users: int
    timestamp: datetime


class DashboardStatsResponse(BaseModel):
    """Dashboard istatistikleri"""
    users: Dict
    lessons: Dict
    ai_metrics: Dict
    revenue: Dict
    system_health: SystemHealthResponse


class UserAnalyticsResponse(BaseModel):
    """Kullanıcı analitiği"""
    total_users: int
    active_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    user_growth_rate: float
    retention_rate: float
    average_session_duration: float
    top_subjects: List[Dict]
    user_distribution_by_grade: Dict


class AIPerformanceResponse(BaseModel):
    """AI performans özeti"""
    total_interactions: int
    satisfaction_rate: float
    average_response_time: float
    model_accuracy: float
    active_models: List[Dict]
    fine_tuning_status: Dict
    ab_test_results: List[Dict]


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Admin dashboard için genel istatistikler
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        # Kullanıcı istatistikleri
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({
            "last_active": {"$gte": datetime.utcnow() - timedelta(days=7)}
        })
        new_users_today = await db.users.count_documents({
            "created_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
        })
        
        # Ders istatistikleri
        total_lessons = await db.lessons.count_documents({})
        completed_lessons_today = await db.lesson_progress.count_documents({
            "completed_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
        })
        
        # AI metrikleri
        ai_performance = await auto_learning_service.analyze_performance()
        
        # Sistem sağlığı
        import psutil
        system_health = SystemHealthResponse(
            status="healthy",
            uptime_hours=round((datetime.utcnow() - datetime(2024, 1, 1)).total_seconds() / 3600, 2),
            cpu_usage=psutil.cpu_percent(interval=1),
            memory_usage=psutil.virtual_memory().percent,
            disk_usage=psutil.disk_usage('/').percent,
            database_status="connected" if db else "disconnected",
            ai_service_status="active",
            active_users=active_users,
            timestamp=datetime.utcnow()
        )
        
        # Dashboard yanıtı
        return DashboardStatsResponse(
            users={
                "total": total_users,
                "active": active_users,
                "new_today": new_users_today,
                "growth_percentage": 5.2  # Örnek değer
            },
            lessons={
                "total": total_lessons,
                "completed_today": completed_lessons_today,
                "average_completion_rate": 78.5  # Örnek değer
            },
            ai_metrics={
                "total_interactions": ai_performance["overall"]["total_interactions"],
                "satisfaction_rate": ai_performance["overall"]["avg_positive_feedback"],
                "avg_response_time": ai_performance["overall"]["avg_response_time"],
                "improvement_areas": len(ai_performance["overall"]["improvement_areas"])
            },
            revenue={
                "monthly_total": 28950,  # Örnek değer
                "growth_percentage": 9.3,
                "active_subscriptions": 874,
                "churn_rate": 2.1
            },
            system_health=system_health
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard istatistik hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Dashboard verileri alınamadı"
        )


@router.get("/analytics/users", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    days: int = Query(30, description="Analiz periyodu (gün)"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Detaylı kullanıcı analitiği
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Temel metrikler
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({
            "last_active": {"$gte": start_date}
        })
        
        # Yeni kullanıcılar
        new_users_today = await db.users.count_documents({
            "created_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
        })
        new_users_week = await db.users.count_documents({
            "created_at": {"$gte": datetime.utcnow() - timedelta(days=7)}
        })
        new_users_month = await db.users.count_documents({
            "created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}
        })
        
        # Büyüme oranı
        previous_month_users = await db.users.count_documents({
            "created_at": {
                "$gte": datetime.utcnow() - timedelta(days=60),
                "$lt": datetime.utcnow() - timedelta(days=30)
            }
        })
        growth_rate = ((new_users_month - previous_month_users) / previous_month_users * 100) if previous_month_users > 0 else 0
        
        # Retention rate (basit hesaplama)
        retention_rate = (active_users / total_users * 100) if total_users > 0 else 0
        
        # Konu popülerliği
        subject_pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": "$subject",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        top_subjects = []
        if db.auto_learning:
            subject_results = await db.auto_learning.aggregate(subject_pipeline).to_list(None)
            top_subjects = [
                {"subject": r["_id"], "interactions": r["count"]}
                for r in subject_results
            ]
        
        # Sınıf dağılımı
        grade_distribution = {}
        for grade in range(1, 13):
            count = await db.users.count_documents({"grade_level": grade})
            grade_distribution[f"grade_{grade}"] = count
        
        return UserAnalyticsResponse(
            total_users=total_users,
            active_users=active_users,
            new_users_today=new_users_today,
            new_users_this_week=new_users_week,
            new_users_this_month=new_users_month,
            user_growth_rate=round(growth_rate, 2),
            retention_rate=round(retention_rate, 2),
            average_session_duration=25.4,  # Dakika (örnek)
            top_subjects=top_subjects,
            user_distribution_by_grade=grade_distribution
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Kullanıcı analitiği hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kullanıcı analitiği alınamadı"
        )


@router.get("/ai/performance", response_model=AIPerformanceResponse)
async def get_ai_performance(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    AI sistem performansı özeti
    """
    try:
        # AI performans metrikleri
        performance = await auto_learning_service.analyze_performance()
        
        # Model bilgileri
        model_info = ai_service.get_model_info()
        
        # Fine-tuning durumu
        training_status = await auto_training_scheduler.get_schedule_status()
        
        # A/B test sonuçları
        db = get_database()
        ab_tests = []
        if db:
            active_experiments = await db.ab_experiments.find({
                "status": "active"
            }).limit(5).to_list(None)
            
            for exp in active_experiments:
                ab_tests.append({
                    "experiment_id": exp["experiment_id"],
                    "name": exp["name"],
                    "participants": exp.get("total_participants", 0),
                    "start_date": exp["start_date"].isoformat()
                })
        
        return AIPerformanceResponse(
            total_interactions=performance["overall"]["total_interactions"],
            satisfaction_rate=performance["overall"]["avg_positive_feedback"],
            average_response_time=performance["overall"]["avg_response_time"],
            model_accuracy=performance["overall"]["avg_confidence"],
            active_models=[
                {
                    "name": m["name"],
                    "provider": m["provider"],
                    "enabled": m["enabled"],
                    "is_current": m["name"] == model_info["current_model"]
                }
                for m in model_info["available_models"]
                if m["enabled"]
            ],
            fine_tuning_status={
                "scheduler_running": training_status.get("scheduler_running", False),
                "last_training": training_status.get("last_training"),
                "next_training": training_status.get("next_training_estimated"),
                "pending_data": training_status.get("pending_data_count", 0)
            },
            ab_test_results=ab_tests
        )
        
    except Exception as e:
        logger.error(f"AI performans hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI performans verileri alınamadı"
        )


@router.get("/logs/recent")
async def get_recent_logs(
    log_type: Optional[str] = Query(None, description="Log tipi (error, warning, info)"),
    limit: int = Query(100, description="Log limiti"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Son sistem logları
    """
    try:
        db = get_database()
        if not db:
            return {"logs": [], "message": "Veritabanı bağlantısı yok"}
        
        # Log filtreleme
        query = {}
        if log_type:
            query["level"] = log_type.upper()
        
        # Son logları getir
        logs = await db.system_logs.find(query).sort(
            "timestamp", -1
        ).limit(limit).to_list(None)
        
        # Format logs
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                "timestamp": log.get("timestamp", datetime.utcnow()).isoformat(),
                "level": log.get("level", "INFO"),
                "message": log.get("message", ""),
                "module": log.get("module", "unknown"),
                "user_id": log.get("user_id"),
                "metadata": log.get("metadata", {})
            })
        
        return {
            "logs": formatted_logs,
            "total": len(formatted_logs),
            "filtered_by": log_type
        }
        
    except Exception as e:
        logger.error(f"Log okuma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Loglar okunamadı"
        )


@router.get("/security/audit")
async def get_security_audit(
    days: int = Query(7, description="Audit periyodu (gün)"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Güvenlik denetim logları
    """
    try:
        db = get_database()
        if not db:
            return {"audit_logs": [], "alerts": []}
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Güvenlik olayları
        security_events = await db.security_logs.find({
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1).limit(100).to_list(None)
        
        # Şüpheli aktiviteler
        suspicious_activities = []
        failed_logins = await db.security_logs.count_documents({
            "event_type": "login_failed",
            "timestamp": {"$gte": start_date}
        })
        
        if failed_logins > 50:
            suspicious_activities.append({
                "type": "high_failed_logins",
                "severity": "warning",
                "count": failed_logins,
                "message": f"Son {days} günde {failed_logins} başarısız giriş denemesi"
            })
        
        # Format audit logs
        audit_logs = []
        for event in security_events:
            audit_logs.append({
                "timestamp": event.get("timestamp", datetime.utcnow()).isoformat(),
                "event_type": event.get("event_type"),
                "user_id": event.get("user_id"),
                "ip_address": event.get("ip_address"),
                "user_agent": event.get("user_agent"),
                "status": event.get("status"),
                "details": event.get("details", {})
            })
        
        return {
            "audit_logs": audit_logs,
            "alerts": suspicious_activities,
            "summary": {
                "total_events": len(security_events),
                "failed_logins": failed_logins,
                "period_days": days
            }
        }
        
    except Exception as e:
        logger.error(f"Güvenlik denetimi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Güvenlik denetimi alınamadı"
        )


@router.get("/api/usage")
async def get_api_usage_stats(
    days: int = Query(30, description="İstatistik periyodu (gün)"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    API kullanım istatistikleri
    """
    try:
        db = get_database()
        if not db:
            return {"endpoints": [], "total_requests": 0}
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # API çağrı istatistikleri
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": {
                    "endpoint": "$endpoint",
                    "method": "$method"
                },
                "count": {"$sum": 1},
                "avg_response_time": {"$avg": "$response_time"},
                "error_count": {
                    "$sum": {"$cond": [{"$gte": ["$status_code", 400]}, 1, 0]}
                }
            }},
            {"$sort": {"count": -1}},
            {"$limit": 20}
        ]
        
        api_stats = []
        total_requests = 0
        
        if db.api_logs:
            results = await db.api_logs.aggregate(pipeline).to_list(None)
            
            for result in results:
                total_requests += result["count"]
                api_stats.append({
                    "endpoint": result["_id"]["endpoint"],
                    "method": result["_id"]["method"],
                    "requests": result["count"],
                    "avg_response_time": round(result["avg_response_time"], 2),
                    "error_rate": round(result["error_count"] / result["count"] * 100, 2),
                    "requests_per_day": round(result["count"] / days, 2)
                })
        
        # Günlük kullanım trendi
        daily_trend = []
        for i in range(min(days, 30)):
            date = datetime.utcnow() - timedelta(days=i)
            count = await db.api_logs.count_documents({
                "timestamp": {
                    "$gte": date.replace(hour=0, minute=0, second=0),
                    "$lt": date.replace(hour=23, minute=59, second=59)
                }
            }) if db.api_logs else 0
            
            daily_trend.append({
                "date": date.strftime("%Y-%m-%d"),
                "requests": count
            })
        
        return {
            "endpoints": api_stats,
            "total_requests": total_requests,
            "average_daily_requests": round(total_requests / days, 2),
            "daily_trend": daily_trend,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"API kullanım istatistiği hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API kullanım istatistikleri alınamadı"
        )


@router.post("/actions/clear-cache")
async def clear_system_cache(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Sistem önbelleğini temizle
    """
    try:
        # Redis cache temizleme (eğer kullanılıyorsa)
        # await redis_client.flushdb()
        
        # A/B test cache temizleme
        ab_test_service._invalidate_cache()
        
        # Log kaydı
        logger.info(f"Sistem önbelleği temizlendi - Admin: {current_user.id}")
        
        return {
            "success": True,
            "message": "Sistem önbelleği başarıyla temizlendi",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cache temizleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Önbellek temizlenemedi"
        )


@router.post("/actions/restart-services")
async def restart_services(
    service_name: Optional[str] = Query(None, description="Servis adı (all, ai, scheduler)"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Sistem servislerini yeniden başlat
    """
    try:
        restarted_services = []
        
        if service_name in [None, "all", "scheduler"]:
            # Training scheduler'ı yeniden başlat
            await auto_training_scheduler.stop_scheduler()
            await asyncio.sleep(1)
            await auto_training_scheduler.start_scheduler()
            restarted_services.append("training_scheduler")
        
        if service_name in [None, "all", "ai"]:
            # AI servisi yeniden yükle
            ai_service.model_config = ai_service._load_model_config()
            ai_service.current_model, ai_service.current_provider = ai_service._select_best_model()
            restarted_services.append("ai_service")
        
        # Log kaydı
        logger.info(f"Servisler yeniden başlatıldı: {restarted_services} - Admin: {current_user.id}")
        
        return {
            "success": True,
            "restarted_services": restarted_services,
            "message": f"{len(restarted_services)} servis yeniden başlatıldı",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Servis yeniden başlatma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Servisler yeniden başlatılamadı"
        )


@router.get("/notifications/unread")
async def get_unread_notifications(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Okunmamış sistem bildirimleri
    """
    try:
        db = get_database()
        if not db:
            return {"notifications": [], "unread_count": 0}
        
        # Sistem bildirimleri
        notifications = []
        
        # Kritik hatalar
        critical_errors = await db.system_logs.count_documents({
            "level": "ERROR",
            "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=24)},
            "acknowledged": {"$ne": True}
        }) if db.system_logs else 0
        
        if critical_errors > 0:
            notifications.append({
                "id": "critical_errors",
                "type": "error",
                "title": "Kritik Hatalar",
                "message": f"Son 24 saatte {critical_errors} kritik hata tespit edildi",
                "timestamp": datetime.utcnow().isoformat(),
                "priority": "high"
            })
        
        # Düşük AI performansı
        performance = await auto_learning_service.analyze_performance()
        if performance["overall"]["avg_positive_feedback"] < 0.7:
            notifications.append({
                "id": "low_ai_performance",
                "type": "warning",
                "title": "Düşük AI Performansı",
                "message": f"Kullanıcı memnuniyeti %{performance['overall']['avg_positive_feedback']*100:.0f} seviyesinde",
                "timestamp": datetime.utcnow().isoformat(),
                "priority": "medium"
            })
        
        # Bekleyen fine-tuning
        training_status = await auto_training_scheduler.get_schedule_status()
        if training_status.get("pending_data_count", 0) > 200:
            notifications.append({
                "id": "pending_training",
                "type": "info",
                "title": "Fine-tuning Bekliyor",
                "message": f"{training_status['pending_data_count']} yeni eğitim verisi mevcut",
                "timestamp": datetime.utcnow().isoformat(),
                "priority": "medium"
            })
        
        return {
            "notifications": notifications,
            "unread_count": len(notifications)
        }
        
    except Exception as e:
        logger.error(f"Bildirim okuma hatası: {e}")
        return {"notifications": [], "unread_count": 0}
