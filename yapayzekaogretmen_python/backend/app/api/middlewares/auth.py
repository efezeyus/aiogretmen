"""
Yapay Zeka Öğretmen - Kimlik Doğrulama Middleware
-----------------------------------------------
Kullanıcı kimlik doğrulama işlemleri için middleware.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from loguru import logger

from app.core.config import settings
from app.api.schemas.auth import TokenSchema, UserResponseSchema, RoleEnum
from app.models.user import User
from app.services.user_service import get_user_by_id

# OAuth2PasswordBearer kurulumu
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login",
    scheme_name="JWT",
)


async def create_access_token(subject: Union[str, int]) -> str:
    """JWT erişim token'ı oluşturur."""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


async def create_refresh_token(subject: Union[str, int]) -> str:
    """JWT yenileme token'ı oluşturur."""
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.utcnow() + expires_delta

    to_encode = {"exp": expire, "sub": str(subject), "refresh": True}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Token'dan mevcut kullanıcıyı alır."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        token_expires = datetime.fromtimestamp(payload.get("exp"))
        
        # Token geçerlilik süresi kontrolü
        if datetime.utcnow() >= token_expires:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token süresi dolmuş",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz kimlik bilgileri",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Kullanıcıyı getir
        user = await get_user_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı bulunamadı",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Abone durumu kontrolü
        if (
            user.subscription and user.subscription.status != "active"
            and not (
                user.subscription.trial_ends 
                and datetime.utcnow() < user.subscription.trial_ends
            )
        ):
            logger.warning(f"Üyeliği aktif olmayan kullanıcı erişim denemesi: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Üyeliğiniz aktif değil",
            )

        return user

    except JWTError as e:
        logger.error(f"JWT token hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik doğrulama başarısız",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValidationError as e:
        logger.error(f"Token validasyon hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz token formatı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Beklenmeyen kimlik doğrulama hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik doğrulama başarısız",
            headers={"WWW-Authenticate": "Bearer"},
        )


def check_role(allowed_roles: List[RoleEnum]):
    """Kullanıcı rolünü kontrol eden decorator."""
    
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in [role.value for role in allowed_roles]:
            logger.warning(
                f"Rol erişim hatası: Kullanıcı {user.id}, "
                f"istenilen rol: {[role.value for role in allowed_roles]}, "
                f"mevcut rol: {user.role}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu işlem için yetkiniz yok",
            )
        return user
    
    return role_checker


def verify_token(token: str):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) 