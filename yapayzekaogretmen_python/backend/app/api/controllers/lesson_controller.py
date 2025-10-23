"""
Yapay Zeka Öğretmen - Ders Controller
-----------------------------------
Ders işlemleri için controller fonksiyonları.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from loguru import logger
from bson import ObjectId

from app.db.mongodb import lessons_collection, topics_collection, user_progress_collection
from app.models.user import User


async def get_lessons(grade: Optional[int] = None, subject: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Ders listesini getir.
    
    Args:
        grade: Sınıf seviyesi
        subject: Ders konusu
    
    Returns:
        Ders listesi
    """
    try:
        # Filtre oluştur
        filter_query = {}
        if grade:
            filter_query["grade"] = grade
        if subject:
            filter_query["subject"] = subject
        
        # Dersleri bul
        cursor = lessons_collection.find(filter_query)
        lessons = []
        async for lesson in cursor:
            lesson["id"] = str(lesson.pop("_id"))
            lessons.append(lesson)
        
        return lessons
    except Exception as e:
        logger.error(f"Ders listesi getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Dersler getirilirken bir hata oluştu",
        )


async def get_lesson(lesson_id: str) -> Dict[str, Any]:
    """
    Belirli bir dersi getir.
    
    Args:
        lesson_id: Ders ID'si
    
    Returns:
        Ders bilgileri
    """
    try:
        lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ders bulunamadı",
            )
        
        lesson["id"] = str(lesson.pop("_id"))
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ders getirme hatası (ID: {lesson_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ders getirilirken bir hata oluştu",
        )


async def create_lesson(lesson_data: Dict[str, Any], user: User) -> Dict[str, Any]:
    """
    Yeni ders oluştur.
    
    Args:
        lesson_data: Ders bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Oluşturulan ders bilgileri
    """
    try:
        # Gerekli alanların kontrolü
        required_fields = ["title", "grade", "subject", "description"]
        for field in required_fields:
            if field not in lesson_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"'{field}' alanı gereklidir",
                )
        
        # Oluşturma bilgilerini ekle
        lesson_data["created_by"] = str(user.id)
        lesson_data["created_at"] = datetime.utcnow()
        lesson_data["updated_at"] = datetime.utcnow()
        
        # Dersi oluştur
        result = await lessons_collection.insert_one(lesson_data)
        
        # Oluşturulan dersi getir
        new_lesson = await get_lesson(str(result.inserted_id))
        return new_lesson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ders oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ders oluşturulurken bir hata oluştu",
        )


async def update_lesson(lesson_id: str, lesson_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ders bilgilerini güncelle.
    
    Args:
        lesson_id: Ders ID'si
        lesson_data: Güncellenecek ders bilgileri
    
    Returns:
        Güncellenmiş ders bilgileri
    """
    try:
        # Dersin var olup olmadığını kontrol et
        existing_lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if not existing_lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ders bulunamadı",
            )
        
        # Güncelleme zamanını ekle
        lesson_data["updated_at"] = datetime.utcnow()
        
        # Dersi güncelle
        await lessons_collection.update_one(
            {"_id": ObjectId(lesson_id)},
            {"$set": lesson_data}
        )
        
        # Güncellenmiş dersi getir
        updated_lesson = await get_lesson(lesson_id)
        return updated_lesson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ders güncelleme hatası (ID: {lesson_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ders güncellenirken bir hata oluştu",
        )


async def delete_lesson(lesson_id: str) -> None:
    """
    Ders sil.
    
    Args:
        lesson_id: Ders ID'si
    """
    try:
        # Dersin var olup olmadığını kontrol et
        existing_lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if not existing_lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ders bulunamadı",
            )
        
        # Dersi sil
        await lessons_collection.delete_one({"_id": ObjectId(lesson_id)})
        
        # Derse ait konuları sil
        await topics_collection.delete_many({"lesson_id": lesson_id})
        
        # Derse ait ilerleme kayıtlarını sil
        await user_progress_collection.delete_many({"lesson_id": lesson_id})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ders silme hatası (ID: {lesson_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ders silinirken bir hata oluştu",
        )


async def get_lesson_topics(lesson_id: str) -> List[Dict[str, Any]]:
    """
    Belirli bir dersin konularını getir.
    
    Args:
        lesson_id: Ders ID'si
    
    Returns:
        Konu listesi
    """
    try:
        # Dersin var olup olmadığını kontrol et
        existing_lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if not existing_lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ders bulunamadı",
            )
        
        # Dersin konularını bul
        cursor = topics_collection.find({"lesson_id": lesson_id})
        topics = []
        async for topic in cursor:
            topic["id"] = str(topic.pop("_id"))
            topics.append(topic)
        
        return topics
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ders konuları getirme hatası (Ders ID: {lesson_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ders konuları getirilirken bir hata oluştu",
        )


async def add_lesson_topic(lesson_id: str, topic_data: Dict[str, Any], user: User) -> Dict[str, Any]:
    """
    Derse yeni konu ekle.
    
    Args:
        lesson_id: Ders ID'si
        topic_data: Konu bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Eklenen konu bilgileri
    """
    try:
        # Dersin var olup olmadığını kontrol et
        existing_lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if not existing_lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ders bulunamadı",
            )
        
        # Gerekli alanların kontrolü
        required_fields = ["title", "content", "order"]
        for field in required_fields:
            if field not in topic_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"'{field}' alanı gereklidir",
                )
        
        # Konu verisine ders ID'si ve oluşturma bilgilerini ekle
        topic_data["lesson_id"] = lesson_id
        topic_data["created_by"] = str(user.id)
        topic_data["created_at"] = datetime.utcnow()
        topic_data["updated_at"] = datetime.utcnow()
        
        # Konuyu oluştur
        result = await topics_collection.insert_one(topic_data)
        
        # Oluşturulan konuyu getir
        new_topic = await topics_collection.find_one({"_id": result.inserted_id})
        new_topic["id"] = str(new_topic.pop("_id"))
        
        return new_topic
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Konu ekleme hatası (Ders ID: {lesson_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Konu eklenirken bir hata oluştu",
        )


async def get_user_progress(user_id: str) -> List[Dict[str, Any]]:
    """
    Kullanıcının ders ilerleme durumunu getir.
    
    Args:
        user_id: Kullanıcı ID'si
    
    Returns:
        İlerleme durumu listesi
    """
    try:
        # Kullanıcının ilerleme kayıtlarını bul
        cursor = user_progress_collection.find({"user_id": user_id})
        progress_list = []
        async for progress in cursor:
            progress["id"] = str(progress.pop("_id"))
            
            # Ders bilgilerini ekle
            try:
                lesson = await lessons_collection.find_one({"_id": ObjectId(progress["lesson_id"])})
                if lesson:
                    progress["lesson"] = {
                        "id": str(lesson["_id"]),
                        "title": lesson["title"],
                        "subject": lesson["subject"],
                        "grade": lesson["grade"],
                    }
            except:
                progress["lesson"] = None
            
            progress_list.append(progress)
        
        return progress_list
    except Exception as e:
        logger.error(f"Kullanıcı ilerleme durumu getirme hatası (Kullanıcı ID: {user_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İlerleme durumu getirilirken bir hata oluştu",
        )


async def update_lesson_progress(user_id: str, lesson_id: str, progress_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Kullanıcının ders ilerleme durumunu güncelle.
    
    Args:
        user_id: Kullanıcı ID'si
        lesson_id: Ders ID'si
        progress_data: İlerleme bilgileri
    
    Returns:
        Güncellenmiş ilerleme bilgileri
    """
    try:
        # Dersin var olup olmadığını kontrol et
        existing_lesson = await lessons_collection.find_one({"_id": ObjectId(lesson_id)})
        if not existing_lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ders bulunamadı",
            )
        
        # Kullanıcı ilerleme kaydını ara
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
            result_id = existing_progress["_id"]
        else:
            # Yeni kayıt oluştur
            update_data["created_at"] = datetime.utcnow()
            result = await user_progress_collection.insert_one(update_data)
            result_id = result.inserted_id
        
        # Güncellenmiş ilerleme kaydını getir
        updated_progress = await user_progress_collection.find_one({"_id": result_id})
        updated_progress["id"] = str(updated_progress.pop("_id"))
        
        return updated_progress
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"İlerleme güncelleme hatası (Kullanıcı ID: {user_id}, Ders ID: {lesson_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İlerleme durumu güncellenirken bir hata oluştu",
        ) 