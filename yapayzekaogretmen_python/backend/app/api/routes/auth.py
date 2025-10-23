"""
Yapay Zeka Öğretmen - Kimlik Doğrulama Rotaları
--------------------------------------------
Kimlik doğrulama ve kullanıcı yönetimi için API rotaları.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Body
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.api.controllers import auth_controller
from app.api.schemas.auth import RegisterSchema, LoginResponseSchema, TokenSchema
from app.api.middlewares.auth import get_current_user
from app.models.user import User


class LoginSchema(BaseModel):
    email: str
    password: str


router = APIRouter()


@router.post("/register", response_model=LoginResponseSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterSchema):
    """
    Yeni kullanıcı kaydı.
    """
    return await auth_controller.register(user_data)


@router.post("/login", response_model=LoginResponseSchema)
async def login(login_data: LoginSchema):
    """
    Kullanıcı girişi.
    Email ve password kullanılır.
    """
    return await auth_controller.login(login_data.email, login_data.password)


@router.post("/refresh-token", response_model=TokenSchema)
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    """
    Access token yenileme.
    """
    return await auth_controller.refresh_token(refresh_token)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(email: str = Body(..., embed=True)):
    """
    Şifre sıfırlama isteği.
    """
    return await auth_controller.forgot_password(email)


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
):
    """
    Şifre sıfırlama.
    """
    return await auth_controller.reset_password(token, new_password)


@router.post("/start-trial", status_code=status.HTTP_200_OK)
async def start_trial(
    current_user: User = Depends(get_current_user),
):
    """
    Deneme süresini başlat.
    """
    return await auth_controller.start_trial(current_user.email) 