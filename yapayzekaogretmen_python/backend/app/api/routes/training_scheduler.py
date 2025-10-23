"""
Training Scheduler API Routes
----------------------------
Otomatik fine-tuning planlayıcı yönetimi.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, List
from datetime import datetime
from pydantic import BaseModel

from app.core.logger import logger
from app.services.auto_training_scheduler import auto_training_scheduler
from app.models.user import User, RoleEnum
from app.utils.auth import get_current_user, check_role


router = APIRouter(
    prefix="/training-scheduler",
    tags=["Training Scheduler"]
)


class SchedulerStatusResponse(BaseModel):
    """Planlayıcı durumu yanıtı"""
    scheduler_running: bool
    check_interval_hours: int
    training_interval_days: int
    min_data_required: int
    pending_data_count: int
    last_training: Dict = None
    next_training_estimated: str = None
    active_job: Dict = None


class TrainingJobResponse(BaseModel):
    """Eğitim job yanıtı"""
    job_id: str
    status: str
    auto_triggered: bool
    data_count: int
    created_at: datetime
    started_at: datetime = None
    completed_at: datetime = None
    model_name: str = None
    metrics: Dict = {}
    error: str = None


@router.get("/status", response_model=SchedulerStatusResponse)
async def get_scheduler_status(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Otomatik eğitim planlayıcısının durumunu getir
    """
    try:
        status = await auto_training_scheduler.get_schedule_status()
        
        if "error" in status:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Durum alınamadı: {status['error']}"
            )
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scheduler durumu hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Planlayıcı durumu alınamadı"
        )


@router.post("/start")
async def start_scheduler(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Otomatik eğitim planlayıcısını başlat
    """
    try:
        await auto_training_scheduler.start_scheduler()
        
        return {
            "success": True,
            "message": "Planlayıcı başlatıldı",
            "status": "running"
        }
        
    except Exception as e:
        logger.error(f"Planlayıcı başlatma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Planlayıcı başlatılamadı"
        )


@router.post("/stop")
async def stop_scheduler(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Otomatik eğitim planlayıcısını durdur
    """
    try:
        await auto_training_scheduler.stop_scheduler()
        
        return {
            "success": True,
            "message": "Planlayıcı durduruldu",
            "status": "stopped"
        }
        
    except Exception as e:
        logger.error(f"Planlayıcı durdurma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Planlayıcı durdurulamadı"
        )


@router.post("/trigger-training")
async def trigger_training_manually(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Manuel olarak eğitim başlat
    """
    try:
        result = await auto_training_scheduler.trigger_training(auto_triggered=False)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Eğitim başlatılamadı")
            )
        
        return {
            "success": True,
            "job_id": result["job_id"],
            "message": result["message"],
            "data_file": result.get("data_file")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Manuel eğitim tetikleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eğitim başlatılamadı"
        )


@router.get("/history", response_model=List[TrainingJobResponse])
async def get_training_history(
    limit: int = Query(10, description="Kayıt limiti"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Eğitim geçmişini getir
    """
    try:
        history = await auto_training_scheduler.get_training_history(limit)
        
        # Pydantic modeline dönüştür
        return [
            TrainingJobResponse(
                job_id=job["job_id"],
                status=job["status"],
                auto_triggered=job.get("auto_triggered", False),
                data_count=job.get("data_count", 0),
                created_at=job["created_at"],
                started_at=job.get("started_at"),
                completed_at=job.get("completed_at"),
                model_name=job.get("model_name"),
                metrics=job.get("metrics", {}),
                error=job.get("error")
            )
            for job in history
        ]
        
    except Exception as e:
        logger.error(f"Eğitim geçmişi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eğitim geçmişi alınamadı"
        )


@router.get("/job/{job_id}")
async def get_training_job_details(
    job_id: str,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Belirli bir eğitim job'ının detaylarını getir
    """
    try:
        from app.db.mongodb import get_database
        db = get_database()
        
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Veritabanı bağlantısı yok"
            )
        
        job = await db.training_jobs.find_one({"job_id": job_id})
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Eğitim job'ı bulunamadı"
            )
        
        # Hassas bilgileri temizle
        job.pop("_id", None)
        
        return job
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job detay hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Job detayları alınamadı"
        )


@router.post("/configure")
async def configure_scheduler(
    check_interval_hours: int = Query(None, description="Kontrol aralığı (saat)"),
    training_interval_days: int = Query(None, description="Eğitim aralığı (gün)"),
    min_data_for_training: int = Query(None, description="Minimum veri sayısı"),
    auto_deploy_threshold: float = Query(None, description="Otomatik deploy eşiği"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Planlayıcı parametrelerini yapılandır
    """
    try:
        updates = {}
        
        if check_interval_hours is not None:
            auto_training_scheduler.check_interval_hours = check_interval_hours
            updates["check_interval_hours"] = check_interval_hours
        
        if training_interval_days is not None:
            auto_training_scheduler.training_interval_days = training_interval_days
            updates["training_interval_days"] = training_interval_days
        
        if min_data_for_training is not None:
            auto_training_scheduler.min_data_for_training = min_data_for_training
            updates["min_data_for_training"] = min_data_for_training
        
        if auto_deploy_threshold is not None:
            auto_training_scheduler.auto_deploy_threshold = auto_deploy_threshold
            updates["auto_deploy_threshold"] = auto_deploy_threshold
        
        # Konfigürasyonu kaydet (opsiyonel)
        from app.db.mongodb import get_database
        db = get_database()
        if db:
            await db.scheduler_config.update_one(
                {"_id": "training_scheduler"},
                {"$set": {
                    **updates,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
        
        return {
            "success": True,
            "message": "Planlayıcı yapılandırıldı",
            "updates": updates
        }
        
    except Exception as e:
        logger.error(f"Yapılandırma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Yapılandırma güncellenemedi"
        )
