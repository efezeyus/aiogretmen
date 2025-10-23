"""
Yapay Zeka Öğretmen - Kimlik Doğrulama Controller
-----------------------------------------------
Kimlik doğrulama işlemleri için controller fonksiyonları.
"""
from datetime import datetime
import secrets
import string
from typing import Dict, Any, Optional

from fastapi import HTTPException, status
from loguru import logger

from app.api.middlewares.auth import create_access_token, create_refresh_token
from app.api.schemas.auth import RegisterSchema, UserResponseSchema
from app.services.user_service import (
    get_user_by_email,
    create_user,
    update_user,
)
from app.models.user import User


async def register(user_data: RegisterSchema) -> Dict[str, Any]:
    """
    Yeni kullanıcı kaydı.
    
    Args:
        user_data: Kullanıcı kayıt bilgileri
    
    Returns:
        Token ve kullanıcı bilgilerini içeren yanıt
    """
    try:
        # E-posta adresinin kullanımda olup olmadığını kontrol et
        existing_user = await get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu e-posta adresi zaten kullanımda",
            )
        
        # Kullanıcı verilerini dict'e çevir
        user_dict = user_data.dict()
        
        # Yeni kullanıcı oluştur
        user = await create_user(user_dict)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Kullanıcı oluşturulamadı",
            )
        
        # Deneme süresini başlat
        user.start_trial()
        await update_user(str(user.id), {"subscription": user.subscription.dict()})
        
        # Token oluştur
        access_token = await create_access_token(str(user.id))
        refresh_token = await create_refresh_token(str(user.id))
        
        return {
            "success": True,
            "token": access_token,
            "user": user,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Kayıt hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kayıt işlemi başarısız",
        )


async def login(email: str, password: str) -> Dict[str, Any]:
    """
    Kullanıcı girişi.
    
    Args:
        email: Kullanıcı e-postası
        password: Kullanıcı şifresi
    
    Returns:
        Token ve kullanıcı bilgilerini içeren yanıt
    """
    try:
        # Kullanıcıyı e-posta ile bul
        user = await get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz kimlik bilgileri",
            )
        
        # Şifreyi doğrula
        if not user.verify_password(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz kimlik bilgileri",
            )
        
        # Son giriş tarihini güncelle
        await update_user(str(user.id), {"last_login": datetime.utcnow()})
        
        # Token oluştur
        access_token = await create_access_token(str(user.id))
        refresh_token = await create_refresh_token(str(user.id))
        
        return {
            "success": True,
            "token": access_token,
            "user": user,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Giriş hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Giriş işlemi başarısız",
        )


async def refresh_token(refresh_token: str) -> Dict[str, Any]:
    """
    Token yenileme.
    
    Args:
        refresh_token: Yenileme token'ı
    
    Returns:
        Yeni token bilgilerini içeren yanıt
    """
    from jose import jwt, JWTError
    from app.core.config import settings
    
    try:
        # Token'ı doğrula
        payload = jwt.decode(
            refresh_token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Token'ın refresh token olup olmadığını kontrol et
        if not payload.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token türü",
            )
        
        # Kullanıcı ID'sini al
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token",
            )
        
        # Yeni access token oluştur
        new_access_token = await create_access_token(user_id)
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz token",
        )
    except Exception as e:
        logger.error(f"Token yenileme hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token yenileme başarısız",
        )


async def forgot_password(email: str) -> Dict[str, Any]:
    """
    Şifre sıfırlama isteği.
    
    Args:
        email: Kullanıcı e-postası
    
    Returns:
        İşlem durumunu içeren yanıt
    """
    try:
        # Kullanıcıyı bul
        user = await get_user_by_email(email)
        if not user:
            # E-posta güvenliği için kullanıcı bulunamasa bile başarılı döndür
            return {
                "success": True,
                "message": "Şifre sıfırlama e-postası gönderildi (Kullanıcı yoksa mail gitmez)",
            }
        
        # Rastgele token oluştur
        token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        reset_token = token
        
        # Token'ın son kullanım tarihini belirle (1 saat)
        expire_time = datetime.utcnow() + 3600
        
        # Kullanıcı bilgilerini güncelle
        await update_user(
            str(user.id),
            {
                "reset_password_token": reset_token,
                "reset_password_expire": expire_time,
            }
        )
        
        # TODO: E-posta gönderme işlemi
        # ...
        
        return {
            "success": True,
            "message": "Şifre sıfırlama e-postası gönderildi",
        }
    except Exception as e:
        logger.error(f"Şifre sıfırlama isteği hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Şifre sıfırlama isteği başarısız",
        )


async def reset_password(token: str, new_password: str) -> Dict[str, Any]:
    """
    Şifre sıfırlama.
    
    Args:
        token: Sıfırlama token'ı
        new_password: Yeni şifre
    
    Returns:
        İşlem durumunu içeren yanıt
    """
    try:
        from app.db.mongodb import users_collection
        
        # Token ile kullanıcıyı bul
        user_data = await users_collection.find_one({
            "reset_password_token": token,
            "reset_password_expire": {"$gt": datetime.utcnow()},
        })
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz veya süresi dolmuş token",
            )
        
        # Kullanıcı nesnesini oluştur
        user = User(**user_data)
        
        # Şifreyi güncelle ve token bilgilerini temizle
        await update_user(
            str(user.id),
            {
                "password": User.get_password_hash(new_password),
                "reset_password_token": None,
                "reset_password_expire": None,
            }
        )
        
        return {
            "success": True,
            "message": "Şifre başarıyla sıfırlandı",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Şifre sıfırlama hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Şifre sıfırlama başarısız",
        )


async def start_trial(email: str) -> Dict[str, Any]:
    """
    Deneme süresini başlat.
    
    Args:
        email: Kullanıcı e-postası
    
    Returns:
        İşlem durumunu içeren yanıt
    """
    try:
        # Kullanıcıyı bul
        user = await get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı",
            )
        
        # Daha önce deneme süresi kullanılmış mı kontrol et
        if user.subscription.trial_ends and user.subscription.trial_ends > datetime.utcnow():
            return {
                "success": True,
                "message": "Deneme süresi zaten aktif",
                "data": {
                    "trial_ends": user.subscription.trial_ends,
                },
            }
        
        # Deneme süresini başlat
        user.start_trial()
        await update_user(str(user.id), {"subscription": user.subscription.dict()})
        
        return {
            "success": True,
            "message": "Deneme süresi başlatıldı",
            "data": {
                "trial_ends": user.subscription.trial_ends,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deneme süresi başlatma hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Deneme süresi başlatma başarısız",
        ) 