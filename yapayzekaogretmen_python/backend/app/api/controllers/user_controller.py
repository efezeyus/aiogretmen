"""
Yapay Zeka Öğretmen - Kullanıcı Controller
----------------------------------------
Kullanıcı işlemleri için controller fonksiyonları.
"""
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status

from app.services.user_service import (
    get_user_by_id,
    get_users as get_users_service,
    update_user as update_user_service,
    delete_user as delete_user_service,
    update_preferences as update_preferences_service,
    change_password as change_password_service,
)
from app.models.user import User


async def get_users(skip: int = 0, limit: int = 10) -> List[User]:
    """
    Kullanıcı listesini getir.
    
    Args:
        skip: Atlanacak kullanıcı sayısı
        limit: Getirilecek maksimum kullanıcı sayısı
    
    Returns:
        Kullanıcı nesneleri listesi
    """
    return await get_users_service(skip, limit)


async def get_user(user_id: str) -> User:
    """
    Kullanıcıyı getir.
    
    Args:
        user_id: Kullanıcı ID
    
    Returns:
        Kullanıcı nesnesi
    
    Raises:
        HTTPException: Kullanıcı bulunamazsa
    """
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı",
        )
    return user


async def update_user(user_id: str, user_data: Dict[str, Any]) -> User:
    """
    Kullanıcı bilgilerini güncelle.
    
    Args:
        user_id: Kullanıcı ID
        user_data: Güncellenecek kullanıcı bilgileri
    
    Returns:
        Güncellenmiş kullanıcı nesnesi
    
    Raises:
        HTTPException: Güncelleme başarısız olursa
    """
    user = await update_user_service(user_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı veya güncellenemedi",
        )
    return user


async def delete_user(user_id: str) -> None:
    """
    Kullanıcıyı sil.
    
    Args:
        user_id: Kullanıcı ID
    
    Raises:
        HTTPException: Silme başarısız olursa
    """
    success = await delete_user_service(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı veya silinemedi",
        )


async def update_preferences(user_id: str, preferences: Dict[str, Any]) -> User:
    """
    Kullanıcı tercihlerini güncelle.
    
    Args:
        user_id: Kullanıcı ID
        preferences: Güncellenecek tercihler
    
    Returns:
        Güncellenmiş kullanıcı nesnesi
    
    Raises:
        HTTPException: Güncelleme başarısız olursa
    """
    user = await update_preferences_service(user_id, preferences)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı veya tercihler güncellenemedi",
        )
    return user


async def change_password(user_id: str, old_password: str, new_password: str) -> Dict[str, Any]:
    """
    Kullanıcı şifresini değiştir.
    
    Args:
        user_id: Kullanıcı ID
        old_password: Eski şifre
        new_password: Yeni şifre
    
    Returns:
        İşlem durumunu içeren sözlük
    
    Raises:
        HTTPException: Şifre değiştirme başarısız olursa
    """
    # Eski şifreyi doğrula
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı",
        )
    
    if not user.verify_password(old_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mevcut şifre yanlış",
        )
    
    # Yeni şifreyi ayarla
    success = await change_password_service(user_id, new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Şifre değiştirilemedi",
        )
    
    return {
        "success": True,
        "message": "Şifre başarıyla değiştirildi",
    } 