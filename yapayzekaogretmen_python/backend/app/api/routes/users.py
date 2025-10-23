"""
Yapay Zeka Öğretmen - Kullanıcı Rotaları
--------------------------------------
Kullanıcı işlemleri için API rotaları.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import List, Optional

from app.api.controllers import user_controller
from app.api.schemas.auth import UserResponseSchema
from app.api.middlewares.auth import get_current_user, check_role
from app.api.schemas.auth import RoleEnum
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[UserResponseSchema])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(check_role([RoleEnum.ADMIN])),
):
    """
    Kullanıcı listesi.
    Sadece yöneticiler erişebilir.
    """
    return await user_controller.get_users(skip, limit)


@router.get("/{user_id}", response_model=UserResponseSchema)
async def get_user(
    user_id: str = Path(..., title="Kullanıcı ID"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN])),
):
    """
    Belirli bir kullanıcıyı getir.
    Sadece yöneticiler erişebilir.
    """
    return await user_controller.get_user(user_id)


@router.put("/{user_id}", response_model=UserResponseSchema)
async def update_user(
    user_data: dict,
    user_id: str = Path(..., title="Kullanıcı ID"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN])),
):
    """
    Kullanıcı bilgilerini güncelle.
    Sadece yöneticiler erişebilir.
    """
    return await user_controller.update_user(user_id, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str = Path(..., title="Kullanıcı ID"),
    current_user: User = Depends(check_role([RoleEnum.ADMIN])),
):
    """
    Kullanıcıyı sil.
    Sadece yöneticiler erişebilir.
    """
    await user_controller.delete_user(user_id)
    return None


@router.put("/me/preferences", response_model=UserResponseSchema)
async def update_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcı tercihlerini güncelle.
    """
    return await user_controller.update_preferences(current_user.id, preferences)


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcı şifresini değiştir.
    """
    if "old_password" not in password_data or "new_password" not in password_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eski ve yeni şifre gereklidir",
        )
    
    return await user_controller.change_password(
        current_user.id, 
        password_data["old_password"], 
        password_data["new_password"]
    ) 