"""
Yapay Zeka Öğretmen - Ders Servisi
--------------------------------
Ders işlemleri için servis fonksiyonları.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from loguru import logger

from app.db.mongodb import lessons_collection, topics_collection, user_progress_collection


async def get_lesson_by_id(lesson_id: str) -> Optional[Dict[str, Any]]:
    """
    Dersi ID ile getir.
    
    Args:
        lesson_id: Ders ID
    
    Returns:
        Ders nesnesi veya None
    """
    try:
        lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if lesson:
            lesson["id"] = str(lesson.pop("_id"))
            return lesson
        return None
    except Exception as e:
        logger.error(f"Ders getirme hatası (ID: {lesson_id}): {e}")
        return None


async def get_lessons_by_filter(filter_query: Dict[str, Any], skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Filtreye göre dersleri getir.
    
    Args:
        filter_query: Filtre sorgusu
        skip: Atlanacak ders sayısı
        limit: Getirilecek maksimum ders sayısı
    
    Returns:
        Ders nesneleri listesi
    """
    try:
        cursor = lessons_collection.find(filter_query).skip(skip).limit(limit)
        lessons = []
        async for lesson in cursor:
            lesson["id"] = str(lesson.pop("_id"))
            lessons.append(lesson)
        return lessons
    except Exception as e:
        logger.error(f"Ders listesi getirme hatası: {e}")
        return []


async def create_lesson(lesson_data: Dict[str, Any]) -> Optional[str]:
    """
    Yeni ders oluştur.
    
    Args:
        lesson_data: Ders bilgileri
    
    Returns:
        Oluşturulan dersin ID'si veya None
    """
    try:
        # Oluşturma bilgilerini ekle
        if "created_at" not in lesson_data:
            lesson_data["created_at"] = datetime.utcnow()
        if "updated_at" not in lesson_data:
            lesson_data["updated_at"] = datetime.utcnow()
        
        # Dersi oluştur
        result = await lessons_collection.insert_one(lesson_data)
        
        # Oluşturulan dersin ID'sini döndür
        if result.inserted_id:
            return str(result.inserted_id)
        return None
    except Exception as e:
        logger.error(f"Ders oluşturma hatası: {e}")
        return None


async def update_lesson(lesson_id: str, lesson_data: Dict[str, Any]) -> bool:
    """
    Ders bilgilerini güncelle.
    
    Args:
        lesson_id: Ders ID
        lesson_data: Güncellenecek ders bilgileri
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Güncelleme zamanını ekle
        lesson_data["updated_at"] = datetime.utcnow()
        
        # Dersi güncelle
        result = await lessons_collection.update_one(
            {"_id": ObjectId(lesson_id)},
            {"$set": lesson_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Ders güncelleme hatası (ID: {lesson_id}): {e}")
        return False


async def delete_lesson(lesson_id: str) -> bool:
    """
    Dersi sil.
    
    Args:
        lesson_id: Ders ID
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Dersi sil
        result = await lessons_collection.delete_one({"_id": ObjectId(lesson_id)})
        
        # Derse ait konuları sil
        await topics_collection.delete_many({"lesson_id": lesson_id})
        
        # Derse ait ilerleme kayıtlarını sil
        await user_progress_collection.delete_many({"lesson_id": lesson_id})
        
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Ders silme hatası (ID: {lesson_id}): {e}")
        return False


async def get_topics_by_lesson(lesson_id: str) -> List[Dict[str, Any]]:
    """
    Belirli bir dersin konularını getir.
    
    Args:
        lesson_id: Ders ID
    
    Returns:
        Konu nesneleri listesi
    """
    try:
        cursor = topics_collection.find({"lesson_id": lesson_id}).sort("order", 1)
        topics = []
        async for topic in cursor:
            topic["id"] = str(topic.pop("_id"))
            topics.append(topic)
        return topics
    except Exception as e:
        logger.error(f"Ders konuları getirme hatası (Ders ID: {lesson_id}): {e}")
        return []


async def get_topic_by_id(topic_id: str) -> Optional[Dict[str, Any]]:
    """
    Konuyu ID ile getir.
    
    Args:
        topic_id: Konu ID
    
    Returns:
        Konu nesnesi veya None
    """
    try:
        topic = await topics_collection.find_one({"_id": ObjectId(topic_id)})
        if topic:
            topic["id"] = str(topic.pop("_id"))
            return topic
        return None
    except Exception as e:
        logger.error(f"Konu getirme hatası (ID: {topic_id}): {e}")
        return None


async def create_topic(topic_data: Dict[str, Any]) -> Optional[str]:
    """
    Yeni konu oluştur.
    
    Args:
        topic_data: Konu bilgileri
    
    Returns:
        Oluşturulan konunun ID'si veya None
    """
    try:
        # Oluşturma bilgilerini ekle
        if "created_at" not in topic_data:
            topic_data["created_at"] = datetime.utcnow()
        if "updated_at" not in topic_data:
            topic_data["updated_at"] = datetime.utcnow()
        
        # Konuyu oluştur
        result = await topics_collection.insert_one(topic_data)
        
        # Oluşturulan konunun ID'sini döndür
        if result.inserted_id:
            return str(result.inserted_id)
        return None
    except Exception as e:
        logger.error(f"Konu oluşturma hatası: {e}")
        return None


async def update_topic(topic_id: str, topic_data: Dict[str, Any]) -> bool:
    """
    Konu bilgilerini güncelle.
    
    Args:
        topic_id: Konu ID
        topic_data: Güncellenecek konu bilgileri
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Güncelleme zamanını ekle
        topic_data["updated_at"] = datetime.utcnow()
        
        # Konuyu güncelle
        result = await topics_collection.update_one(
            {"_id": ObjectId(topic_id)},
            {"$set": topic_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Konu güncelleme hatası (ID: {topic_id}): {e}")
        return False


async def delete_topic(topic_id: str) -> bool:
    """
    Konuyu sil.
    
    Args:
        topic_id: Konu ID
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        result = await topics_collection.delete_one({"_id": ObjectId(topic_id)})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Konu silme hatası (ID: {topic_id}): {e}")
        return False


async def get_user_progress(user_id: str, lesson_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Kullanıcının ders ilerleme durumunu getir.
    
    Args:
        user_id: Kullanıcı ID
        lesson_id: Belirli bir ders için filtreleme (isteğe bağlı)
    
    Returns:
        İlerleme nesneleri listesi
    """
    try:
        # Filtre oluştur
        filter_query = {"user_id": user_id}
        if lesson_id:
            filter_query["lesson_id"] = lesson_id
        
        # İlerleme kayıtlarını getir
        cursor = user_progress_collection.find(filter_query).sort("updated_at", -1)
        progress_list = []
        
        async for progress in cursor:
            progress["id"] = str(progress.pop("_id"))
            progress_list.append(progress)
        
        return progress_list
    except Exception as e:
        logger.error(f"Kullanıcı ilerleme durumu getirme hatası (Kullanıcı ID: {user_id}): {e}")
        return []


async def update_user_progress(user_id: str, lesson_id: str, progress_data: Dict[str, Any]) -> Optional[str]:
    """
    Kullanıcının ders ilerleme durumunu güncelle.
    
    Args:
        user_id: Kullanıcı ID
        lesson_id: Ders ID
        progress_data: İlerleme bilgileri
    
    Returns:
        Güncellenen ilerleme kaydının ID'si veya None
    """
    try:
        # Mevcut ilerleme kaydını ara
        existing_progress = await user_progress_collection.find_one({
            "user_id": user_id,
            "lesson_id": lesson_id,
        })
        
        # İlerleme verisi hazırla
        update_data = {
            "user_id": user_id,
            "lesson_id": lesson_id,
            "updated_at": datetime.utcnow(),
            **progress_data,
        }
        
        if existing_progress:
            # Mevcut kaydı güncelle
            await user_progress_collection.update_one(
                {"_id": existing_progress["_id"]},
                {"$set": update_data}
            )
            return str(existing_progress["_id"])
        else:
            # Yeni kayıt oluştur
            update_data["created_at"] = datetime.utcnow()
            result = await user_progress_collection.insert_one(update_data)
            if result.inserted_id:
                return str(result.inserted_id)
        
        return None
    except Exception as e:
        logger.error(f"İlerleme güncelleme hatası (Kullanıcı ID: {user_id}, Ders ID: {lesson_id}): {e}")
        return None 