"""
Yapay Zeka Öğretmen - Müfredat Controller
---------------------------------------
Müfredat işlemleri için controller fonksiyonları.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import HTTPException, status, UploadFile
from loguru import logger
from bson import ObjectId
import os
from pathlib import Path

from app.core.config import settings
from app.db.mongodb import curriculum_collection
from app.models.user import User
from app.services.curriculum_manager import curriculum_manager


async def get_curriculum(grade: Optional[int] = None, subject: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Müfredat listesini getir.
    
    Args:
        grade: Sınıf seviyesi
        subject: Ders konusu
    
    Returns:
        Müfredat listesi
    """
    try:
        # Filtre oluştur
        filter_query = {}
        if grade:
            filter_query["grade"] = grade
        if subject:
            filter_query["subject"] = subject
        
        # Müfredatları bul
        cursor = curriculum_collection.find(filter_query)
        curriculum_items = []
        async for item in cursor:
            item["id"] = str(item.pop("_id"))
            curriculum_items.append(item)
        
        return curriculum_items
    except Exception as e:
        logger.error(f"Müfredat listesi getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredatlar getirilirken bir hata oluştu",
        )


async def get_curriculum_item(curriculum_id: str) -> Dict[str, Any]:
    """
    Belirli bir müfredat öğesini getir.
    
    Args:
        curriculum_id: Müfredat ID'si
    
    Returns:
        Müfredat bilgileri
    """
    try:
        item = await curriculum_collection.find_one({"_id": ObjectId(curriculum_id)})
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Müfredat öğesi bulunamadı",
            )
        
        item["id"] = str(item.pop("_id"))
        return item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Müfredat öğesi getirme hatası (ID: {curriculum_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat öğesi getirilirken bir hata oluştu",
        )


async def create_curriculum(curriculum_data: Dict[str, Any], user: User) -> Dict[str, Any]:
    """
    Yeni müfredat öğesi oluştur.
    
    Args:
        curriculum_data: Müfredat bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Oluşturulan müfredat bilgileri
    """
    try:
        # Gerekli alanların kontrolü
        required_fields = ["title", "grade", "subject", "content"]
        for field in required_fields:
            if field not in curriculum_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"'{field}' alanı gereklidir",
                )
        
        # Oluşturma bilgilerini ekle
        curriculum_data["created_by"] = str(user.id)
        curriculum_data["created_at"] = datetime.utcnow()
        curriculum_data["updated_at"] = datetime.utcnow()
        
        # Müfredat öğesini oluştur
        result = await curriculum_collection.insert_one(curriculum_data)
        
        # Oluşturulan müfredat öğesini getir
        new_item = await get_curriculum_item(str(result.inserted_id))
        return new_item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Müfredat oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat oluşturulurken bir hata oluştu",
        )


async def update_curriculum(curriculum_id: str, curriculum_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Müfredat öğesini güncelle.
    
    Args:
        curriculum_id: Müfredat ID'si
        curriculum_data: Güncellenecek müfredat bilgileri
    
    Returns:
        Güncellenmiş müfredat bilgileri
    """
    try:
        # Müfredat öğesinin var olup olmadığını kontrol et
        existing_item = await curriculum_collection.find_one({"_id": ObjectId(curriculum_id)})
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Müfredat öğesi bulunamadı",
            )
        
        # Güncelleme zamanını ekle
        curriculum_data["updated_at"] = datetime.utcnow()
        
        # Müfredat öğesini güncelle
        await curriculum_collection.update_one(
            {"_id": ObjectId(curriculum_id)},
            {"$set": curriculum_data}
        )
        
        # Güncellenmiş müfredat öğesini getir
        updated_item = await get_curriculum_item(curriculum_id)
        return updated_item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Müfredat güncelleme hatası (ID: {curriculum_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat güncellenirken bir hata oluştu",
        )


async def delete_curriculum(curriculum_id: str) -> None:
    """
    Müfredat öğesini sil.
    
    Args:
        curriculum_id: Müfredat ID'si
    """
    try:
        # Müfredat öğesinin var olup olmadığını kontrol et
        existing_item = await curriculum_collection.find_one({"_id": ObjectId(curriculum_id)})
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Müfredat öğesi bulunamadı",
            )
        
        # Dosya yolu varsa dosyayı sil
        if "file_path" in existing_item and existing_item["file_path"]:
            try:
                file_path = Path(existing_item["file_path"])
                if file_path.exists():
                    os.remove(file_path)
            except Exception as e:
                logger.error(f"Müfredat dosyası silme hatası: {e}")
        
        # Müfredat öğesini sil
        await curriculum_collection.delete_one({"_id": ObjectId(curriculum_id)})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Müfredat silme hatası (ID: {curriculum_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat silinirken bir hata oluştu",
        )


async def upload_curriculum_file(
    file: UploadFile, 
    grade: int, 
    subject: str, 
    user: User
) -> Dict[str, Any]:
    """
    Müfredat dosyası yükle.
    
    Args:
        file: Yüklenen dosya
        grade: Sınıf seviyesi
        subject: Ders konusu
        user: Kullanıcı nesnesi
    
    Returns:
        Yüklenen dosya ve analiz bilgileri
    """
    try:
        # Dosya yükleme yolu oluştur
        upload_dir = Path(settings.MEDIA_ROOT) / "curriculum"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Dosyayı kaydet
        timestamp = datetime.utcnow().timestamp()
        safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = upload_dir / safe_filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # PDF içeriğini oku ve analiz et
        try:
            import pypdf2
            pdf_reader = pypdf2.PdfReader(file_path)
            pdf_text = ""
            for page in pdf_reader.pages:
                pdf_text += page.extract_text()
            
            # PDF içeriğini analiz et
            analysis = await analyze_curriculum_pdf(pdf_text)
            extracted_content = analysis.get("extracted_content", "")
            
        except Exception as e:
            logger.error(f"PDF analiz hatası: {e}")
            extracted_content = ""
        
        # Müfredat verisini oluştur
        curriculum_data = {
            "title": file.filename,
            "grade": grade,
            "subject": subject,
            "file_name": file.filename,
            "file_path": str(file_path),
            "content": extracted_content,
            "uploaded_by": str(user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Veritabanına kaydet
        result = await curriculum_collection.insert_one(curriculum_data)
        
        # Oluşturulan müfredat öğesini getir
        new_item = await get_curriculum_item(str(result.inserted_id))
        return new_item
    except Exception as e:
        logger.error(f"Müfredat dosyası yükleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat dosyası yüklenirken bir hata oluştu",
        )


# YENİ FONKSİYONLAR - MEB Müfredatı Yönetimi

async def get_education_levels() -> List[Dict[str, Any]]:
    """Tüm eğitim seviyelerini döndürür"""
    try:
        return curriculum_manager.get_education_levels()
    except Exception as e:
        logger.error(f"Eğitim seviyeleri getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eğitim seviyeleri getirilirken bir hata oluştu"
        )


async def get_subjects_by_grade(grade: int) -> List[Dict[str, Any]]:
    """Belirli bir sınıf için tüm dersleri döndürür"""
    try:
        if not (1 <= grade <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sınıf seviyesi (1-12 arası olmalı)"
            )
        return curriculum_manager.get_subjects_by_grade(grade)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ders listesi getirme hatası (Sınıf: {grade}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ders listesi getirilirken bir hata oluştu"
        )


async def get_detailed_curriculum(grade: int, subject: Optional[str] = None) -> Dict[str, Any]:
    """Detaylı müfredat içeriğini döndürür"""
    try:
        if not (1 <= grade <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sınıf seviyesi (1-12 arası olmalı)"
            )
        
        curriculum = curriculum_manager.get_detailed_curriculum(grade, subject)
        
        if not curriculum:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{grade}. sınıf için detaylı müfredat henüz hazır değil"
            )
        
        return curriculum
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detaylı müfredat getirme hatası (Sınıf: {grade}, Ders: {subject}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Detaylı müfredat getirilirken bir hata oluştu"
        )


async def get_curriculum_statistics(grade: int, subject: Optional[str] = None) -> Dict[str, Any]:
    """Müfredat istatistiklerini döndürür"""
    try:
        if not (1 <= grade <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sınıf seviyesi (1-12 arası olmalı)"
            )
        
        return curriculum_manager.get_curriculum_statistics(grade, subject)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Müfredat istatistikleri getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat istatistikleri getirilirken bir hata oluştu"
        )


async def search_curriculum(keyword: str, grade: Optional[int] = None) -> List[Dict[str, Any]]:
    """Müfredatta arama yapar"""
    try:
        if grade and not (1 <= grade <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sınıf seviyesi (1-12 arası olmalı)"
            )
        
        if not keyword or len(keyword) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arama kelimesi en az 2 karakter olmalıdır"
            )
        
        return curriculum_manager.search_curriculum(keyword, grade)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Müfredat arama hatası (Kelime: {keyword}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat araması yapılırken bir hata oluştu"
        )


async def get_learning_path(grade: int, subject: str) -> Dict[str, Any]:
    """Belirli bir ders için öğrenme yolu oluşturur"""
    try:
        if not (1 <= grade <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sınıf seviyesi (1-12 arası olmalı)"
            )
        
        learning_path = curriculum_manager.get_learning_path(grade, subject)
        
        if "error" in learning_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=learning_path["error"]
            )
        
        return learning_path
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Öğrenme yolu oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğrenme yolu oluşturulurken bir hata oluştu"
        )


async def get_ai_teaching_recommendations(
    grade: int, 
    subject: str, 
    topic_title: str
) -> Dict[str, Any]:
    """Belirli bir konu için yapay zeka öğretim önerilerini döndürür"""
    try:
        if not (1 <= grade <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sınıf seviyesi (1-12 arası olmalı)"
            )
        
        recommendations = curriculum_manager.get_ai_teaching_recommendations(
            grade, subject, topic_title
        )
        
        if not recommendations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Konu için öğretim önerileri bulunamadı"
            )
        
        return recommendations
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Öğretim önerileri getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğretim önerileri getirilirken bir hata oluştu"
        )


async def get_curriculum_summary() -> Dict[str, Any]:
    """Tüm müfredat için özet rapor oluşturur"""
    try:
        return curriculum_manager.generate_curriculum_summary()
    except Exception as e:
        logger.error(f"Müfredat özeti oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Müfredat özeti oluşturulurken bir hata oluştu"
        ) 