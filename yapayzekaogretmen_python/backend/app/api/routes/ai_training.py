"""
AI Model Training Routes
Kendi yapay zeka modelimizi eğitme ve yönetme
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Dict, Any

from app.api.middlewares.auth import check_role
from app.api.schemas.auth import RoleEnum
from app.models.user import User
from app.services.ai_model_trainer import ai_model_trainer

router = APIRouter()


@router.get("/training/statistics")
async def get_training_statistics(
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER]))
):
    """
    AI model eğitimi için istatistikler.
    Toplanan eğitim verisi miktarı ve dağılımı.
    """
    stats = await ai_model_trainer.get_training_statistics()
    return stats


@router.post("/training/collect-data")
async def collect_training_data(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Öğrenci etkileşimlerinden eğitim verisi topla.
    JSONL formatında kaydedilir.
    """
    count = await ai_model_trainer.collect_training_data_from_interactions()
    
    return {
        "success": True,
        "message": f"{count} eğitim örneği toplandı",
        "collected_examples": count
    }


@router.post("/training/generate-meb-dataset")
async def generate_meb_dataset(
    grade: int = Query(..., ge=1, le=12),
    subject: str = Query(...),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Belirli sınıf ve ders için MEB uyumlu eğitim dataset'i oluştur.
    """
    file_path = await ai_model_trainer.generate_meb_training_dataset(grade, subject)
    
    if file_path.startswith("Hata"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=file_path
        )
    
    return {
        "success": True,
        "message": "MEB eğitim dataset'i oluşturuldu",
        "file_path": file_path
    }


@router.get("/training/recommendations")
async def get_training_recommendations(
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER]))
):
    """
    Model eğitimi için öneriler.
    """
    recommendations = ai_model_trainer.get_training_recommendations()
    
    return {
        "recommendations": recommendations
    }


@router.get("/training/models")
async def get_available_models(
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Mevcut AI modellerini listele.
    """
    return {
        "models": ai_model_trainer.models,
        "active_model": "base"
    }


@router.get("/training/model-performance/{model_name}")
async def get_model_performance(
    model_name: str,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Belirli bir modelin performans metriklerini döndür.
    """
    performance = await ai_model_trainer.get_model_performance(model_name)
    
    if "error" in performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=performance["error"]
        )
    
    return performance
