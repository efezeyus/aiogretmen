"""
Yapay Zeka Öğretmen - Müfredat Servisi
------------------------------------
Müfredat işlemleri için servis fonksiyonları.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from loguru import logger
import os
from pathlib import Path

from app.db.mongodb import curriculum_collection


async def get_curriculum_by_id(curriculum_id: str) -> Optional[Dict[str, Any]]:
    """
    Müfredat öğesini ID ile getir.
    
    Args:
        curriculum_id: Müfredat ID
    
    Returns:
        Müfredat nesnesi veya None
    """
    try:
        curriculum = await curriculum_collection.find_one({"_id": ObjectId(curriculum_id)})
        if curriculum:
            curriculum["id"] = str(curriculum.pop("_id"))
            return curriculum
        return None
    except Exception as e:
        logger.error(f"Müfredat getirme hatası (ID: {curriculum_id}): {e}")
        return None


async def get_curriculum_by_filter(filter_query: Dict[str, Any], skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Filtreye göre müfredat öğelerini getir.
    
    Args:
        filter_query: Filtre sorgusu
        skip: Atlanacak öğe sayısı
        limit: Getirilecek maksimum öğe sayısı
    
    Returns:
        Müfredat nesneleri listesi
    """
    try:
        cursor = curriculum_collection.find(filter_query).skip(skip).limit(limit)
        curriculum_items = []
        async for item in cursor:
            item["id"] = str(item.pop("_id"))
            curriculum_items.append(item)
        return curriculum_items
    except Exception as e:
        logger.error(f"Müfredat listesi getirme hatası: {e}")
        return []


async def create_curriculum(curriculum_data: Dict[str, Any]) -> Optional[str]:
    """
    Yeni müfredat öğesi oluştur.
    
    Args:
        curriculum_data: Müfredat bilgileri
    
    Returns:
        Oluşturulan müfredat öğesinin ID'si veya None
    """
    try:
        # Oluşturma bilgilerini ekle
        if "created_at" not in curriculum_data:
            curriculum_data["created_at"] = datetime.utcnow()
        if "updated_at" not in curriculum_data:
            curriculum_data["updated_at"] = datetime.utcnow()
        
        # Müfredat öğesini oluştur
        result = await curriculum_collection.insert_one(curriculum_data)
        
        # Oluşturulan müfredat öğesinin ID'sini döndür
        if result.inserted_id:
            return str(result.inserted_id)
        return None
    except Exception as e:
        logger.error(f"Müfredat oluşturma hatası: {e}")
        return None


async def update_curriculum(curriculum_id: str, curriculum_data: Dict[str, Any]) -> bool:
    """
    Müfredat bilgilerini güncelle.
    
    Args:
        curriculum_id: Müfredat ID
        curriculum_data: Güncellenecek müfredat bilgileri
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Güncelleme zamanını ekle
        curriculum_data["updated_at"] = datetime.utcnow()
        
        # Müfredat öğesini güncelle
        result = await curriculum_collection.update_one(
            {"_id": ObjectId(curriculum_id)},
            {"$set": curriculum_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Müfredat güncelleme hatası (ID: {curriculum_id}): {e}")
        return False


async def delete_curriculum(curriculum_id: str) -> bool:
    """
    Müfredat öğesini sil.
    
    Args:
        curriculum_id: Müfredat ID
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Müfredat öğesini bul
        curriculum = await get_curriculum_by_id(curriculum_id)
        if not curriculum:
            return False
        
        # Dosya yolu varsa dosyayı sil
        if "file_path" in curriculum and curriculum["file_path"]:
            try:
                file_path = Path(curriculum["file_path"])
                if file_path.exists():
                    os.remove(file_path)
            except Exception as e:
                logger.error(f"Müfredat dosyası silme hatası: {e}")
        
        # Müfredat öğesini sil
        result = await curriculum_collection.delete_one({"_id": ObjectId(curriculum_id)})
        
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Müfredat silme hatası (ID: {curriculum_id}): {e}")
        return False


async def get_curriculum_by_grade_subject(grade: int, subject: str) -> List[Dict[str, Any]]:
    """
    Sınıf ve ders konusuna göre müfredat öğelerini getir.
    
    Args:
        grade: Sınıf seviyesi
        subject: Ders konusu
    
    Returns:
        Müfredat nesneleri listesi
    """
    try:
        filter_query = {}
        if grade:
            filter_query["grade"] = grade
        if subject:
            filter_query["subject"] = subject
        
        return await get_curriculum_by_filter(filter_query)
    except Exception as e:
        logger.error(f"Müfredat listesi getirme hatası (Sınıf: {grade}, Konu: {subject}): {e}")
        return []


async def search_curriculum(keyword: str, grade: Optional[int] = None, subject: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Müfredat içeriğinde arama yap.
    
    Args:
        keyword: Aranacak kelime
        grade: Sınıf seviyesi (isteğe bağlı)
        subject: Ders konusu (isteğe bağlı)
    
    Returns:
        Arama sonuçları listesi
    """
    try:
        # Filtre oluştur
        filter_query = {
            "$or": [
                {"title": {"$regex": keyword, "$options": "i"}},
                {"content": {"$regex": keyword, "$options": "i"}},
                {"description": {"$regex": keyword, "$options": "i"}},
            ]
        }
        
        # Sınıf ve konu filtresi ekle
        if grade:
            filter_query["grade"] = grade
        if subject:
            filter_query["subject"] = subject
        
        # Arama yap
        return await get_curriculum_by_filter(filter_query)
    except Exception as e:
        logger.error(f"Müfredat arama hatası (Kelime: {keyword}): {e}")
        return []


async def get_curriculum_stats() -> Dict[str, Any]:
    """
    Müfredat istatistiklerini getir.
    
    Returns:
        İstatistik bilgileri
    """
    try:
        # Toplam müfredat sayısı
        total_count = await curriculum_collection.count_documents({})
        
        # Sınıf ve konu dağılımı
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "grade": "$grade",
                        "subject": "$subject"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        cursor = curriculum_collection.aggregate(pipeline)
        distribution = {}
        
        async for item in cursor:
            grade = item["_id"]["grade"]
            subject = item["_id"]["subject"]
            count = item["count"]
            
            if grade not in distribution:
                distribution[grade] = {}
            
            distribution[grade][subject] = count
        
        return {
            "total_count": total_count,
            "distribution": distribution
        }
    except Exception as e:
        logger.error(f"Müfredat istatistikleri getirme hatası: {e}")
        return {
            "total_count": 0,
            "distribution": {}
        } 