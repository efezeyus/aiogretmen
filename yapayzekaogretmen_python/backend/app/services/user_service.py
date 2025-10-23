"""
Yapay Zeka Öğretmen - Kullanıcı Servisi
--------------------------------------
Kullanıcı işlemleri için servis fonksiyonları.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from loguru import logger

from app.db.mongodb import users_collection
from app.models.user import User

async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Kullanıcıyı ID ile getir.
    
    Args:
        user_id: Kullanıcı ID
    
    Returns:
        Kullanıcı nesnesi veya None
    """
    try:
        user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return User(**user_data)
        return None
    except Exception as e:
        logger.error(f"Kullanıcı getirme hatası (ID: {user_id}): {e}")
        return None


async def get_user_by_email(email: str) -> Optional[User]:
    """
    Kullanıcıyı e-posta ile getir.
    
    Args:
        email: Kullanıcı e-postası
    
    Returns:
        Kullanıcı nesnesi veya None
    """
    try:
        user_data = await users_collection.find_one({"email": email})
        if user_data:
            return User(**user_data)
        return None
    except Exception as e:
        logger.error(f"Kullanıcı getirme hatası (E-posta: {email}): {e}")
        return None


async def create_user(user_data: Dict[str, Any]) -> Optional[User]:
    """
    Yeni kullanıcı oluştur.
    
    Args:
        user_data: Kullanıcı bilgileri
    
    Returns:
        Oluşturulan kullanıcı nesnesi veya None
    """
    try:
        # Şifreyi hashle
        from app.models.user import User
        user_data["password"] = User.get_password_hash(user_data["password"])
        
        # Oluşturma zamanı ekle
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        
        # Kullanıcıyı oluştur
        result = await users_collection.insert_one(user_data)
        
        # Oluşturulan kullanıcıyı getir
        if result.inserted_id:
            return await get_user_by_id(str(result.inserted_id))
        return None
    except Exception as e:
        logger.error(f"Kullanıcı oluşturma hatası: {e}")
        return None


async def update_user(user_id: str, user_data: Dict[str, Any]) -> Optional[User]:
    """
    Kullanıcı bilgilerini güncelle.
    
    Args:
        user_id: Kullanıcı ID
        user_data: Güncellenecek kullanıcı bilgileri
    
    Returns:
        Güncellenmiş kullanıcı nesnesi veya None
    """
    try:
        # Şifre güncellenmiyorsa şifre alanını kaldır
        if "password" in user_data:
            from app.models.user import User
            user_data["password"] = User.get_password_hash(user_data["password"])
        
        # Güncelleme zamanı ekle
        user_data["updated_at"] = datetime.utcnow()
        
        # Kullanıcıyı güncelle
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": user_data}
        )
        
        # Güncellenmiş kullanıcıyı getir
        if result.modified_count:
            return await get_user_by_id(user_id)
        return None
    except Exception as e:
        logger.error(f"Kullanıcı güncelleme hatası (ID: {user_id}): {e}")
        return None


async def delete_user(user_id: str) -> bool:
    """
    Kullanıcıyı sil.
    
    Args:
        user_id: Kullanıcı ID
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Kullanıcı silme hatası (ID: {user_id}): {e}")
        return False


async def get_users(skip: int = 0, limit: int = 10) -> List[User]:
    """
    Kullanıcı listesini getir.
    
    Args:
        skip: Atlanacak kullanıcı sayısı
        limit: Getirilecek maksimum kullanıcı sayısı
    
    Returns:
        Kullanıcı nesneleri listesi
    """
    try:
        cursor = users_collection.find().skip(skip).limit(limit)
        users = []
        async for user_data in cursor:
            users.append(User(**user_data))
        return users
    except Exception as e:
        logger.error(f"Kullanıcı listesi getirme hatası: {e}")
        return []


async def update_preferences(user_id: str, preferences: Dict[str, Any]) -> Optional[User]:
    """
    Kullanıcı tercihlerini güncelle.
    
    Args:
        user_id: Kullanıcı ID
        preferences: Güncellenecek tercihler
    
    Returns:
        Güncellenmiş kullanıcı nesnesi veya None
    """
    try:
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"preferences": preferences, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count:
            return await get_user_by_id(user_id)
        return None
    except Exception as e:
        logger.error(f"Kullanıcı tercihleri güncelleme hatası (ID: {user_id}): {e}")
        return None


async def change_password(user_id: str, new_password: str) -> bool:
    """
    Kullanıcı şifresini değiştir.
    
    Args:
        user_id: Kullanıcı ID
        new_password: Yeni şifre
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        from app.models.user import User
        hashed_password = User.get_password_hash(new_password)
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_password, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Şifre değiştirme hatası (ID: {user_id}): {e}")
        return False 