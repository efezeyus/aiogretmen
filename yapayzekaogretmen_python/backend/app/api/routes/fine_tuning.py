"""
Fine-tuning Yönetim API Rotaları
Fine-tuned modelleri yönetmek için API endpoint'leri
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
import os
import json
from pathlib import Path

from app.core.config import settings
from app.core.logger import logger
from app.models.user import User, RoleEnum
from app.api.middlewares.auth import get_current_user, check_role
from app.services.ai_service import ai_service


router = APIRouter(prefix="/fine-tuning", tags=["fine-tuning"])


# Pydantic modeller
class ModelConfig(BaseModel):
    """Model konfigürasyon modeli"""
    model_name: str
    enabled: bool = True
    priority: int = 1


class ModelUpdateRequest(BaseModel):
    """Model güncelleme isteği"""
    model_name: str


class ModelInfo(BaseModel):
    """Model bilgisi"""
    type: str
    name: Optional[str]
    enabled: bool
    priority: int


class ModelsResponse(BaseModel):
    """Model listesi yanıtı"""
    current_model: str
    available_models: List[ModelInfo]
    fallback_enabled: bool


class TrainingDataUpload(BaseModel):
    """Eğitim verisi yükleme yanıtı"""
    file_name: str
    file_size: int
    line_count: int
    upload_time: str


class TrainingJobRequest(BaseModel):
    """Eğitim işi başlatma isteği"""
    training_file: str
    base_model: str = "gpt-3.5-turbo"
    suffix: str = "meb-ogretmen"
    epochs: int = 3


class TrainingJobResponse(BaseModel):
    """Eğitim işi yanıtı"""
    job_id: str
    status: str
    created_at: str


# API Endpoint'leri
@router.get("/models", response_model=ModelsResponse)
async def get_models(
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER]))
):
    """
    Mevcut model konfigürasyonunu getir
    """
    try:
        model_info = ai_service.get_model_info()
        return ModelsResponse(**model_info)
    except Exception as e:
        logger.error(f"Model bilgileri alınamadı: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model bilgileri alınamadı"
        )


@router.put("/models/fine-tuned", status_code=status.HTTP_200_OK)
async def update_fine_tuned_model(
    request: ModelUpdateRequest,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Fine-tuned modeli güncelle
    """
    try:
        success = ai_service.update_fine_tuned_model(request.model_name)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Model güncellenemedi"
            )
        
        return {
            "message": "Model başarıyla güncellendi",
            "model_name": request.model_name
        }
        
    except Exception as e:
        logger.error(f"Model güncelleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model güncelleme sırasında hata oluştu"
        )


@router.post("/upload-training-data", response_model=TrainingDataUpload)
async def upload_training_data(
    file: UploadFile = File(...),
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Fine-tuning için eğitim verisi yükle
    """
    try:
        # Dosya uzantı kontrolü
        if not file.filename.endswith('.jsonl'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sadece JSONL formatı kabul edilir"
            )
        
        # Dosya boyut kontrolü (50MB)
        file_size = 0
        contents = await file.read()
        file_size = len(contents)
        
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dosya boyutu 50MB'ı aşamaz"
            )
        
        # Geçici dizin oluştur
        upload_dir = Path(settings.MEDIA_ROOT) / "fine_tuning" / "training_data"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Dosyayı kaydet
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"training_data_{timestamp}.jsonl"
        file_path = upload_dir / safe_filename
        
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        # JSONL satır sayısını hesapla
        line_count = contents.decode('utf-8').count('\n')
        
        logger.info(f"Eğitim verisi yüklendi: {safe_filename} ({line_count} satır)")
        
        return TrainingDataUpload(
            file_name=safe_filename,
            file_size=file_size,
            line_count=line_count,
            upload_time=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dosya yükleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Dosya yükleme sırasında hata oluştu"
        )


@router.get("/training-history", status_code=status.HTTP_200_OK)
async def get_training_history(
    limit: int = 10,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Fine-tuning geçmişini getir
    """
    try:
        # Log dosyalarını oku
        log_dir = Path("ai-fine-tuning/scripts/logs")
        history = []
        
        if log_dir.exists():
            for log_file in sorted(log_dir.glob("fine_tuning_*.json"), reverse=True)[:limit]:
                with open(log_file, 'r') as f:
                    logs = json.load(f)
                    
                    # İlgili olayları filtrele
                    for log in logs:
                        if log['event'] in ['job_created', 'job_completed', 'job_failed']:
                            history.append({
                                'event': log['event'],
                                'data': log['data'],
                                'date': log_file.stem.replace('fine_tuning_', '')
                            })
        
        return {
            "history": history[:limit],
            "total": len(history)
        }
        
    except Exception as e:
        logger.error(f"Geçmiş okuma hatası: {e}")
        return {
            "history": [],
            "total": 0
        }


@router.post("/validate-data", status_code=status.HTTP_200_OK)
async def validate_training_data(
    file_name: str,
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Yüklenen eğitim verisini doğrula
    """
    try:
        file_path = Path(settings.MEDIA_ROOT) / "fine_tuning" / "training_data" / file_name
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dosya bulunamadı"
            )
        
        # Basit doğrulama
        valid_lines = 0
        invalid_lines = []
        total_tokens = 0
        
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                try:
                    data = json.loads(line)
                    
                    # Format kontrolü
                    if 'messages' not in data:
                        invalid_lines.append(f"Satır {i}: 'messages' anahtarı eksik")
                        continue
                    
                    messages = data['messages']
                    if not isinstance(messages, list) or len(messages) < 2:
                        invalid_lines.append(f"Satır {i}: En az 2 mesaj olmalı")
                        continue
                    
                    # Role kontrolü
                    roles = [msg.get('role') for msg in messages]
                    if roles[0] != 'system':
                        invalid_lines.append(f"Satır {i}: İlk mesaj 'system' olmalı")
                        continue
                    
                    valid_lines += 1
                    
                    # Token tahmini (basit)
                    for msg in messages:
                        total_tokens += len(msg.get('content', '')) // 4
                        
                except json.JSONDecodeError:
                    invalid_lines.append(f"Satır {i}: Geçersiz JSON formatı")
                except Exception as e:
                    invalid_lines.append(f"Satır {i}: {str(e)}")
        
        return {
            "file_name": file_name,
            "valid_lines": valid_lines,
            "invalid_lines": len(invalid_lines),
            "errors": invalid_lines[:10],  # İlk 10 hata
            "estimated_tokens": total_tokens,
            "estimated_cost": f"${(total_tokens / 1000) * 0.008:.2f}",
            "is_valid": len(invalid_lines) == 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Veri doğrulama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Veri doğrulama sırasında hata oluştu"
        )


@router.get("/test-model/{model_name}", status_code=status.HTTP_200_OK)
async def test_model(
    model_name: str,
    prompt: str,
    grade: int = 5,
    subject: str = "matematik",
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER]))
):
    """
    Belirli bir modeli test et
    """
    try:
        # Geçici olarak modeli değiştir
        original_model = ai_service.current_model
        ai_service.current_model = model_name
        
        try:
            # Test yanıtı al
            response, metadata = ai_service.get_ai_response(
                prompt=prompt,
                grade_level=grade,
                subject=subject
            )
            
            return {
                "model": model_name,
                "prompt": prompt,
                "response": response,
                "metadata": metadata,
                "test_time": datetime.utcnow().isoformat()
            }
            
        finally:
            # Orijinal modele geri dön
            ai_service.current_model = original_model
            
    except Exception as e:
        logger.error(f"Model test hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model test edilemedi: {str(e)}"
        )


@router.get("/model-comparison", status_code=status.HTTP_200_OK)
async def compare_models(
    prompt: str,
    grade: int = 5,
    subject: str = "matematik",
    current_user: User = Depends(check_role([RoleEnum.ADMIN]))
):
    """
    Farklı modellerin yanıtlarını karşılaştır
    """
    try:
        models_to_test = []
        
        # Aktif modelleri bul
        for model_type, info in ai_service.model_config["models"].items():
            if info["enabled"] and info["name"]:
                models_to_test.append({
                    "type": model_type,
                    "name": info["name"]
                })
        
        if not models_to_test:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Test edilecek aktif model yok"
            )
        
        # Her modeli test et
        comparisons = []
        original_model = ai_service.current_model
        
        try:
            for model in models_to_test:
                ai_service.current_model = model["name"]
                
                try:
                    start_time = datetime.utcnow()
                    response, metadata = ai_service.get_ai_response(
                        prompt=prompt,
                        grade_level=grade,
                        subject=subject
                    )
                    end_time = datetime.utcnow()
                    
                    comparisons.append({
                        "model_type": model["type"],
                        "model_name": model["name"],
                        "response": response,
                        "response_time": (end_time - start_time).total_seconds(),
                        "tokens_used": metadata.get("tokens_used"),
                        "success": True
                    })
                    
                except Exception as e:
                    comparisons.append({
                        "model_type": model["type"],
                        "model_name": model["name"],
                        "error": str(e),
                        "success": False
                    })
                    
        finally:
            ai_service.current_model = original_model
        
        return {
            "prompt": prompt,
            "grade": grade,
            "subject": subject,
            "comparisons": comparisons,
            "test_time": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model karşılaştırma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model karşılaştırma sırasında hata oluştu"
        ) 