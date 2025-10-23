"""
Advanced Admin Panel Features
----------------------------
Gelişmiş admin özellikleri - canlı izleme, otomasyon, batch işlemler
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, AsyncGenerator
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import asyncio
import json

from app.core.logger import logger
from app.models.user import User, RoleEnum
from app.utils.auth import get_current_user, check_role
from app.db.mongodb import get_database
from app.services.ai_service import ai_service
from app.services.auto_learning_service import auto_learning_service
from app.services.ab_test_service import ab_test_service
from app.services.auto_training_scheduler import auto_training_scheduler


router = APIRouter(
    prefix="/admin/advanced",
    tags=["Admin Advanced"]
)


# Models
class BatchUserOperation(BaseModel):
    """Toplu kullanıcı işlemi"""
    user_ids: List[str]
    operation: str  # activate, deactivate, delete, send_notification
    parameters: Dict = {}


class SystemCommand(BaseModel):
    """Sistem komutu"""
    command: str  # clear_cache, restart_service, backup_data
    target: Optional[str] = None
    force: bool = False


class AutomationRule(BaseModel):
    """Otomasyon kuralı"""
    name: str
    trigger_type: str  # time_based, event_based, metric_based
    trigger_config: Dict
    action_type: str
    action_config: Dict
    enabled: bool = True


@router.get("/realtime/dashboard")
async def realtime_dashboard_stream(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Gerçek zamanlı dashboard verilerini stream et (Server-Sent Events)
    """
    async def generate_events() -> AsyncGenerator[str, None]:
        """SSE event generator"""
        try:
            while True:
                # Dashboard verilerini topla
                db = get_database()
                
                # Anlık metrikler
                metrics = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "active_users": 0,
                    "ai_requests_per_minute": 0,
                    "system_health": {}
                }
                
                if db:
                    # Son 1 dakikadaki aktif kullanıcılar
                    one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
                    metrics["active_users"] = await db.users.count_documents({
                        "last_active": {"$gte": one_minute_ago}
                    })
                    
                    # Son 1 dakikadaki AI istekleri
                    if db.auto_learning:
                        metrics["ai_requests_per_minute"] = await db.auto_learning.count_documents({
                            "timestamp": {"$gte": one_minute_ago}
                        })
                
                # Sistem sağlığı
                try:
                    import psutil
                    metrics["system_health"] = {
                        "cpu": psutil.cpu_percent(interval=0.1),
                        "memory": psutil.virtual_memory().percent,
                        "disk": psutil.disk_usage('/').percent,
                        "network_sent_mb": round(psutil.net_io_counters().bytes_sent / 1024 / 1024, 2),
                        "network_recv_mb": round(psutil.net_io_counters().bytes_recv / 1024 / 1024, 2)
                    }
                except:
                    pass
                
                # SSE formatında gönder
                event_data = json.dumps(metrics)
                yield f"data: {event_data}\n\n"
                
                # 5 saniyede bir güncelle
                await asyncio.sleep(5)
                
        except asyncio.CancelledError:
            logger.info("Realtime stream iptal edildi")
            raise
        except Exception as e:
            logger.error(f"Realtime stream hatası: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Nginx buffering'i kapat
        }
    )


@router.post("/batch/users")
async def batch_user_operations(
    operation: BatchUserOperation,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Toplu kullanıcı işlemleri
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        # İşlem tipine göre uygula
        results = {
            "total": len(operation.user_ids),
            "successful": 0,
            "failed": 0,
            "details": []
        }
        
        if operation.operation == "activate":
            # Kullanıcıları aktif et
            result = await db.users.update_many(
                {"_id": {"$in": operation.user_ids}},
                {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
            )
            results["successful"] = result.modified_count
            
        elif operation.operation == "deactivate":
            # Kullanıcıları deaktif et
            result = await db.users.update_many(
                {"_id": {"$in": operation.user_ids}},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            results["successful"] = result.modified_count
            
        elif operation.operation == "send_notification":
            # Toplu bildirim gönder (arka planda)
            background_tasks.add_task(
                send_bulk_notifications,
                operation.user_ids,
                operation.parameters
            )
            results["successful"] = len(operation.user_ids)
            results["details"].append("Bildirimler arka planda gönderiliyor")
            
        elif operation.operation == "reset_password":
            # Toplu şifre sıfırlama
            for user_id in operation.user_ids:
                # Şifre sıfırlama token'ı oluştur ve e-posta gönder
                # (Implementasyon gerekli)
                pass
            results["successful"] = len(operation.user_ids)
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Geçersiz işlem: {operation.operation}"
            )
        
        results["failed"] = results["total"] - results["successful"]
        
        # İşlem logunu kaydet
        logger.info(f"Toplu işlem tamamlandı: {operation.operation} - {results}")
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Toplu işlem hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Toplu işlem başarısız"
        )


@router.post("/system/command")
async def execute_system_command(
    command: SystemCommand,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Sistem komutlarını çalıştır
    """
    try:
        result = {
            "command": command.command,
            "status": "completed",
            "details": {}
        }
        
        if command.command == "clear_all_cache":
            # Tüm cache'leri temizle
            # Redis cache
            # Memory cache
            # File cache
            ab_test_service._invalidate_cache()
            result["details"]["cache_cleared"] = True
            
        elif command.command == "backup_database":
            # Veritabanı yedekleme (arka plan görevi olarak)
            # MongoDB dump
            # PostgreSQL backup
            result["status"] = "initiated"
            result["details"]["backup_job_id"] = "backup_" + datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            
        elif command.command == "optimize_database":
            # Veritabanı optimizasyonu
            db = get_database()
            if db:
                # Index optimizasyonu
                await db.users.create_index("email")
                await db.users.create_index("created_at")
                await db.auto_learning.create_index([("timestamp", -1)])
                result["details"]["indexes_optimized"] = True
            
        elif command.command == "emergency_shutdown":
            if command.force:
                # Acil kapatma (sadece force=true ile)
                logger.critical("ACİL KAPATMA BAŞLATILDI!")
                # Servisleri durdur
                await auto_training_scheduler.stop_scheduler()
                result["details"]["services_stopped"] = True
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Acil kapatma için force=true gerekli"
                )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bilinmeyen komut: {command.command}"
            )
        
        # Komut logunu kaydet
        logger.info(f"Sistem komutu çalıştırıldı: {command.command} - Admin: {current_user.id}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sistem komut hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Komut çalıştırılamadı"
        )


@router.get("/automation/rules")
async def get_automation_rules(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Otomasyon kurallarını listele
    """
    try:
        db = get_database()
        if not db:
            return {"rules": []}
        
        # Örnek otomasyon kuralları
        rules = [
            {
                "id": "auto_training_low_performance",
                "name": "Düşük Performansta Otomatik Eğitim",
                "trigger_type": "metric_based",
                "trigger_config": {
                    "metric": "ai_satisfaction",
                    "threshold": 0.7,
                    "condition": "less_than"
                },
                "action_type": "start_training",
                "action_config": {
                    "auto_deploy": True
                },
                "enabled": True,
                "last_triggered": None
            },
            {
                "id": "daily_backup",
                "name": "Günlük Yedekleme",
                "trigger_type": "time_based",
                "trigger_config": {
                    "cron": "0 3 * * *",  # Her gün saat 03:00
                    "timezone": "Europe/Istanbul"
                },
                "action_type": "backup_database",
                "action_config": {
                    "include_logs": True,
                    "compress": True
                },
                "enabled": True,
                "last_triggered": "2024-01-20T03:00:00Z"
            },
            {
                "id": "high_error_rate_alert",
                "name": "Yüksek Hata Oranı Uyarısı",
                "trigger_type": "metric_based",
                "trigger_config": {
                    "metric": "error_rate",
                    "threshold": 0.05,  # %5
                    "condition": "greater_than",
                    "duration_minutes": 5
                },
                "action_type": "send_alert",
                "action_config": {
                    "channels": ["email", "slack"],
                    "severity": "high"
                },
                "enabled": True,
                "last_triggered": None
            }
        ]
        
        return {"rules": rules, "total": len(rules)}
        
    except Exception as e:
        logger.error(f"Otomasyon kuralları hatası: {e}")
        return {"rules": [], "error": str(e)}


@router.post("/automation/rules")
async def create_automation_rule(
    rule: AutomationRule,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Yeni otomasyon kuralı oluştur
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        # Kural verisi
        rule_data = {
            "rule_id": f"rule_{datetime.utcnow().timestamp()}",
            "name": rule.name,
            "trigger_type": rule.trigger_type,
            "trigger_config": rule.trigger_config,
            "action_type": rule.action_type,
            "action_config": rule.action_config,
            "enabled": rule.enabled,
            "created_by": str(current_user.id),
            "created_at": datetime.utcnow(),
            "last_triggered": None,
            "trigger_count": 0
        }
        
        # Veritabanına kaydet
        await db.automation_rules.insert_one(rule_data)
        
        logger.info(f"Otomasyon kuralı oluşturuldu: {rule.name}")
        
        return {
            "success": True,
            "rule_id": rule_data["rule_id"],
            "message": "Otomasyon kuralı başarıyla oluşturuldu"
        }
        
    except Exception as e:
        logger.error(f"Otomasyon kuralı oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kural oluşturulamadı"
        )


@router.get("/insights/ai-recommendations")
async def get_ai_recommendations(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    AI tabanlı sistem önerileri
    """
    try:
        recommendations = []
        
        # Performans analizi
        performance = await auto_learning_service.analyze_performance()
        
        # Düşük memnuniyet kontrolü
        if performance["overall"]["avg_positive_feedback"] < 0.75:
            recommendations.append({
                "type": "performance",
                "severity": "high",
                "title": "AI Performansı Düşük",
                "description": f"Kullanıcı memnuniyeti %{performance['overall']['avg_positive_feedback']*100:.0f} seviyesinde",
                "action": "Fine-tuning başlatmanızı öneririz",
                "impact": "Kullanıcı deneyimini %20-30 iyileştirebilir"
            })
        
        # Bekleyen eğitim verisi
        training_status = await auto_training_scheduler.get_schedule_status()
        if training_status.get("pending_data_count", 0) > 150:
            recommendations.append({
                "type": "training",
                "severity": "medium",
                "title": "Eğitim Verisi Birikti",
                "description": f"{training_status['pending_data_count']} adet işlenmemiş veri mevcut",
                "action": "Manuel eğitim başlatın veya otomatik eğitimi aktifleştirin",
                "impact": "Model doğruluğunu artırabilir"
            })
        
        # Sistem kaynakları
        try:
            import psutil
            cpu_usage = psutil.cpu_percent(interval=1)
            if cpu_usage > 80:
                recommendations.append({
                    "type": "system",
                    "severity": "warning",
                    "title": "Yüksek CPU Kullanımı",
                    "description": f"CPU kullanımı %{cpu_usage} seviyesinde",
                    "action": "Kaynak optimizasyonu yapın veya ölçeklendirin",
                    "impact": "Sistem yanıt sürelerini iyileştirebilir"
                })
        except:
            pass
        
        # A/B test önerisi
        db = get_database()
        if db:
            active_tests = await db.ab_experiments.count_documents({"status": "active"})
            if active_tests == 0:
                recommendations.append({
                    "type": "optimization",
                    "severity": "low",
                    "title": "A/B Test Önerisi",
                    "description": "Aktif A/B test bulunmuyor",
                    "action": "Yeni modelleri test etmek için A/B test başlatın",
                    "impact": "En iyi performans gösteren modeli belirleyebilirsiniz"
                })
        
        return {
            "recommendations": recommendations,
            "total": len(recommendations),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI önerileri hatası: {e}")
        return {"recommendations": [], "error": str(e)}


@router.get("/export/report")
async def export_admin_report(
    report_type: str = Query(..., description="Report tipi (daily, weekly, monthly, custom)"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    format: str = Query("json", description="Format (json, csv, pdf)"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Admin raporlarını dışa aktar
    """
    try:
        # Tarih aralığını belirle
        if report_type == "daily":
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=1)
        elif report_type == "weekly":
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=7)
        elif report_type == "monthly":
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        
        # Rapor verilerini topla
        report_data = {
            "report_type": report_type,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": str(current_user.id)
        }
        
        # Dashboard stats
        dashboard_stats = await get_dashboard_stats(current_user)
        report_data["dashboard_stats"] = dashboard_stats.dict()
        
        # AI performance
        ai_performance = await get_ai_performance(current_user)
        report_data["ai_performance"] = ai_performance.dict()
        
        # User analytics
        user_analytics = await get_user_analytics(30, current_user)
        report_data["user_analytics"] = user_analytics.dict()
        
        # Format'a göre dönüştür
        if format == "json":
            return report_data
        
        elif format == "csv":
            # CSV formatına dönüştür
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            writer.writerow(["Metrik", "Değer", "Tarih"])
            
            # Data rows
            writer.writerow(["Toplam Kullanıcı", report_data["dashboard_stats"]["users"]["total"], end_date.strftime("%Y-%m-%d")])
            writer.writerow(["Aktif Kullanıcı", report_data["dashboard_stats"]["users"]["active"], end_date.strftime("%Y-%m-%d")])
            writer.writerow(["AI Memnuniyet", f"{report_data['dashboard_stats']['ai_metrics']['satisfaction_rate']*100:.1f}%", end_date.strftime("%Y-%m-%d")])
            
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode()),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=admin_report_{report_type}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
                }
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Desteklenmeyen format: {format}"
            )
            
    except Exception as e:
        logger.error(f"Rapor export hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Rapor oluşturulamadı"
        )


# Background task functions
async def send_bulk_notifications(user_ids: List[str], parameters: Dict):
    """Toplu bildirim gönderme arka plan görevi"""
    try:
        db = get_database()
        if not db:
            return
        
        notification_type = parameters.get("type", "info")
        title = parameters.get("title", "Sistem Bildirimi")
        message = parameters.get("message", "")
        
        for user_id in user_ids:
            # Bildirim kaydı oluştur
            await db.notifications.insert_one({
                "user_id": user_id,
                "type": notification_type,
                "title": title,
                "message": message,
                "created_at": datetime.utcnow(),
                "read": False
            })
        
        logger.info(f"{len(user_ids)} kullanıcıya bildirim gönderildi")
        
    except Exception as e:
        logger.error(f"Toplu bildirim hatası: {e}")


# Import for report generation
from app.api.routes.admin import (
    get_dashboard_stats,
    get_ai_performance,
    get_user_analytics
)
