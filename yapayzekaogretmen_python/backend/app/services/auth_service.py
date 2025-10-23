"""
Yapay Zeka Öğretmen - Kimlik Doğrulama Servisi
--------------------------------------------
Kullanıcı kimlik doğrulama işlemleri.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from loguru import logger

from app.core.config import settings
from app.models.user import User, UserInDB
from app.db.mongodb import users_collection
from app.services.user_service import create_user, get_user_by_email


# Şifre hash'leme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Şifre doğrulama."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Şifre hash'leme."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT access token oluştur."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """JWT refresh token oluştur."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return encoded_jwt


async def authenticate_user(email: str, password: str) -> Optional[User]:
    """Kullanıcı kimlik doğrulama."""
    user = await get_user_by_email(email)
    
    if not user:
        return None
    
    if not verify_password(password, user.password):
        return None
    
    # Son giriş zamanını güncelle
    await users_collection.update_one(
        {"email": email},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return user


async def register_user(
    name: str,
    email: str,
    username: str,
    password: str,
    role: str = "student"
) -> User:
    """Yeni kullanıcı kaydı."""
    # Email kontrolü
    existing_user = await get_user_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu email adresi zaten kullanımda"
        )
    
    # Username kontrolü
    existing_username = await users_collection.find_one({"username": username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı zaten kullanımda"
        )
    
    # Kullanıcı oluştur
    user_data = {
        "name": name,
        "email": email,
        "username": username,
        "password": get_password_hash(password),
        "role": role,
        "active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Öğrenci ise deneme süresi başlat
    if role == "student":
        user_data["subscription"] = {
            "status": "trial",
            "trial_ends": datetime.utcnow() + timedelta(days=14)
        }
    
    user = await create_user(user_data)
    
    logger.info(f"Yeni kullanıcı kaydı: {email}")
    
    return user


async def verify_token(token: str) -> dict:
    """Token doğrulama."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def refresh_access_token(refresh_token: str) -> dict:
    """Access token yenileme."""
    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        
        # Token tipini kontrol et
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token tipi"
            )
        
        # Yeni access token oluştur
        user_id = payload.get("sub")
        access_token = create_access_token(data={"sub": user_id})
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz refresh token"
        )


async def change_password(user_id: str, current_password: str, new_password: str) -> bool:
    """Şifre değiştirme."""
    # Kullanıcıyı bul
    user_doc = await users_collection.find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Mevcut şifreyi doğrula
    if not verify_password(current_password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre yanlış"
        )
    
    # Yeni şifreyi hash'le ve güncelle
    new_password_hash = get_password_hash(new_password)
    
    result = await users_collection.update_one(
        {"_id": user_id},
        {
            "$set": {
                "password": new_password_hash,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Şifre değiştirildi: {user_id}")
        return True
    
    return False 