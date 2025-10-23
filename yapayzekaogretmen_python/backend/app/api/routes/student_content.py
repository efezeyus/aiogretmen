"""
Öğrenci İçerik Yükleme API Rotaları
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.security import HTTPBearer
from pathlib import Path
import json
import shutil
import uuid

from app.core.config import settings
from app.core.logger import logger
from app.models.user import User
from app.api.middlewares.auth import get_current_user, check_role
from app.db.mongodb import get_database
from app.models.user import RoleEnum

router = APIRouter(prefix="/student-content", tags=["student-content"])
security = HTTPBearer()

# MongoDB koleksiyonu
def get_student_content_collection():
    db = get_database()
    return db.student_content if db else None

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_student_content(
    files: List[UploadFile] = File(...),
    metadata: str = Form(...),
    current_user: User = Depends(check_role([RoleEnum.STUDENT])),
):
    """
    Öğrenci içeriği yükle (ödev, proje, not vb.)
    """
    try:
        # Metadata'yı parse et
        try:
            metadata_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz metadata formatı"
            )
        
        # Yükleme dizinini oluştur
        upload_dir = Path(settings.MEDIA_ROOT) / "student_content" / str(current_user.id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        uploaded_files = []
        
        for file in files:
            # Dosya boyutu kontrolü (50MB)
            if file.size > 50 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Dosya boyutu çok büyük: {file.filename}"
                )
            
            # Güvenli dosya adı oluştur
            file_id = str(uuid.uuid4())
            file_extension = Path(file.filename).suffix
            safe_filename = f"{file_id}{file_extension}"
            file_path = upload_dir / safe_filename
            
            # Dosyayı kaydet
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Dosya bilgilerini kaydet
            file_info = {
                "id": file_id,
                "original_name": file.filename,
                "safe_filename": safe_filename,
                "file_path": str(file_path),
                "file_size": file.size,
                "content_type": file.content_type,
                "upload_date": datetime.utcnow(),
            }
            
            uploaded_files.append(file_info)
        
        # Veritabanına kaydet
        content_data = {
            "student_id": str(current_user.id),
            "title": metadata_dict.get("title", ""),
            "description": metadata_dict.get("description", ""),
            "subject": metadata_dict.get("subject", ""),
            "category": metadata_dict.get("category", "other"),
            "priority": metadata_dict.get("priority", "medium"),
            "due_date": metadata_dict.get("dueDate"),
            "tags": metadata_dict.get("tags", []),
            "files": uploaded_files,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "active"
        }
        
        collection = get_student_content_collection()
        result = await collection.insert_one(content_data)
        
        # Oluşturulan içeriği getir
        created_content = await collection.find_one({"_id": result.inserted_id})
        created_content["_id"] = str(created_content["_id"])
        
        logger.info(f"Öğrenci içeriği yüklendi: {current_user.id} - {len(files)} dosya")
        
        return {
            "message": f"{len(files)} dosya başarıyla yüklendi",
            "content": created_content
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Öğrenci içerik yükleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İçerik yükleme sırasında bir hata oluştu"
        )

@router.get("/my-content", status_code=status.HTTP_200_OK)
async def get_my_content(
    category: Optional[str] = None,
    subject: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(check_role([RoleEnum.STUDENT])),
):
    """
    Öğrencinin yüklediği içerikleri getir
    """
    try:
        collection = get_student_content_collection()
        
        # Filtre oluştur
        filter_dict = {
            "student_id": str(current_user.id),
            "status": "active"
        }
        
        if category:
            filter_dict["category"] = category
        if subject:
            filter_dict["subject"] = subject
        
        # İçerikleri getir
        cursor = collection.find(filter_dict).skip(skip).limit(limit).sort("created_at", -1)
        contents = await cursor.to_list(length=limit)
        
        # ObjectId'leri string'e çevir
        for content in contents:
            content["_id"] = str(content["_id"])
        
        # Toplam sayı
        total = await collection.count_documents(filter_dict)
        
        return {
            "contents": contents,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"İçerik listeleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İçerikler getirilirken bir hata oluştu"
        )

@router.get("/content/{content_id}", status_code=status.HTTP_200_OK)
async def get_content(
    content_id: str,
    current_user: User = Depends(check_role([RoleEnum.STUDENT])),
):
    """
    Belirli bir içeriği getir
    """
    try:
        collection = get_student_content_collection()
        
        content = await collection.find_one({
            "_id": content_id,
            "student_id": str(current_user.id),
            "status": "active"
        })
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="İçerik bulunamadı"
            )
        
        content["_id"] = str(content["_id"])
        
        return content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"İçerik getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İçerik getirilirken bir hata oluştu"
        )

@router.delete("/content/{content_id}", status_code=status.HTTP_200_OK)
async def delete_content(
    content_id: str,
    current_user: User = Depends(check_role([RoleEnum.STUDENT])),
):
    """
    İçeriği sil (soft delete)
    """
    try:
        collection = get_student_content_collection()
        
        # İçeriği bul
        content = await collection.find_one({
            "_id": content_id,
            "student_id": str(current_user.id),
            "status": "active"
        })
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="İçerik bulunamadı"
            )
        
        # Soft delete
        await collection.update_one(
            {"_id": content_id},
            {
                "$set": {
                    "status": "deleted",
                    "deleted_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"İçerik silindi: {content_id} - {current_user.id}")
        
        return {"message": "İçerik başarıyla silindi"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"İçerik silme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İçerik silinirken bir hata oluştu"
        )

@router.put("/content/{content_id}", status_code=status.HTTP_200_OK)
async def update_content(
    content_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    priority: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string
    current_user: User = Depends(check_role([RoleEnum.STUDENT])),
):
    """
    İçerik bilgilerini güncelle
    """
    try:
        collection = get_student_content_collection()
        
        # İçeriği bul
        content = await collection.find_one({
            "_id": content_id,
            "student_id": str(current_user.id),
            "status": "active"
        })
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="İçerik bulunamadı"
            )
        
        # Güncelleme verilerini hazırla
        update_data = {"updated_at": datetime.utcnow()}
        
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if subject is not None:
            update_data["subject"] = subject
        if category is not None:
            update_data["category"] = category
        if priority is not None:
            update_data["priority"] = priority
        if due_date is not None:
            update_data["due_date"] = due_date
        if tags is not None:
            try:
                update_data["tags"] = json.loads(tags)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Geçersiz etiket formatı"
                )
        
        # Güncelle
        await collection.update_one(
            {"_id": content_id},
            {"$set": update_data}
        )
        
        # Güncellenmiş içeriği getir
        updated_content = await collection.find_one({"_id": content_id})
        updated_content["_id"] = str(updated_content["_id"])
        
        logger.info(f"İçerik güncellendi: {content_id} - {current_user.id}")
        
        return {
            "message": "İçerik başarıyla güncellendi",
            "content": updated_content
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"İçerik güncelleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İçerik güncellenirken bir hata oluştu"
        )

@router.get("/categories", status_code=status.HTTP_200_OK)
async def get_categories():
    """
    Mevcut kategorileri getir
    """
    categories = [
        {"id": "homework", "name": "Ödevler", "icon": "📝", "color": "#4CAF50"},
        {"id": "projects", "name": "Projeler", "icon": "🎯", "color": "#2196F3"},
        {"id": "presentations", "name": "Sunumlar", "icon": "📊", "color": "#FF9800"},
        {"id": "research", "name": "Araştırmalar", "icon": "🔍", "color": "#9C27B0"},
        {"id": "notes", "name": "Notlar", "icon": "📚", "color": "#795548"},
        {"id": "other", "name": "Diğer", "icon": "📎", "color": "#607D8B"}
    ]
    
    return {"categories": categories}

@router.get("/subjects", status_code=status.HTTP_200_OK)
async def get_subjects():
    """
    Mevcut dersleri getir
    """
    subjects = [
        "Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", 
        "İngilizce", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"
    ]
    
    return {"subjects": subjects}

@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_content_stats(
    current_user: User = Depends(check_role([RoleEnum.STUDENT])),
):
    """
    Öğrencinin içerik istatistiklerini getir
    """
    try:
        collection = get_student_content_collection()
        
        # Toplam içerik sayısı
        total_content = await collection.count_documents({
            "student_id": str(current_user.id),
            "status": "active"
        })
        
        # Kategorilere göre dağılım
        pipeline = [
            {
                "$match": {
                    "student_id": str(current_user.id),
                    "status": "active"
                }
            },
            {
                "$group": {
                    "_id": "$category",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        category_stats = await collection.aggregate(pipeline).to_list(length=None)
        
        # Derslere göre dağılım
        pipeline[1]["$group"]["_id"] = "$subject"
        subject_stats = await collection.aggregate(pipeline).to_list(length=None)
        
        # Bu ay yüklenen içerik sayısı
        from datetime import datetime, timedelta
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        this_month_content = await collection.count_documents({
            "student_id": str(current_user.id),
            "status": "active",
            "created_at": {"$gte": start_of_month}
        })
        
        return {
            "total_content": total_content,
            "this_month_content": this_month_content,
            "category_distribution": category_stats,
            "subject_distribution": subject_stats
        }
        
    except Exception as e:
        logger.error(f"İstatistik getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İstatistikler getirilirken bir hata oluştu"
        ) 