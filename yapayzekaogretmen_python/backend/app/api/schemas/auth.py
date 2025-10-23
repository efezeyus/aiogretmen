"""
Yapay Zeka Öğretmen - Kimlik Doğrulama Şemaları
-------------------------------------------
Kimlik doğrulama ve kullanıcı yönetimi için API şemaları.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, EmailStr, Field, validator


class RoleEnum(str, Enum):
    """Kullanıcı rolleri."""

    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class SubscriptionStatusEnum(str, Enum):
    """Abonelik durumları."""

    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELED = "canceled"
    NONE = "none"


class SubscriptionPlanEnum(str, Enum):
    """Abonelik planları."""

    MONTHLY = "monthly"
    YEARLY = "yearly"
    NONE = "none"


class TeacherGenderEnum(str, Enum):
    """Öğretmen cinsiyet seçenekleri."""

    MALE = "male"
    FEMALE = "female"


class ThemeEnum(str, Enum):
    """Uygulama tema seçenekleri."""

    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class NotificationPreferencesSchema(BaseModel):
    """Bildirim tercihleri şeması."""

    email: bool = True
    push: bool = True


class PreferencesSchema(BaseModel):
    """Kullanıcı tercihleri şeması."""

    teacher_gender: TeacherGenderEnum = TeacherGenderEnum.MALE
    notifications: NotificationPreferencesSchema = NotificationPreferencesSchema()
    theme: ThemeEnum = ThemeEnum.SYSTEM
    has_seen_onboarding: bool = False
    language: str = "tr"


class SubscriptionSchema(BaseModel):
    """Kullanıcı abonelik şeması."""

    status: SubscriptionStatusEnum = SubscriptionStatusEnum.NONE
    plan: SubscriptionPlanEnum = SubscriptionPlanEnum.NONE
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    cancel_date: Optional[datetime] = None
    trial_ends: Optional[datetime] = None


class RegisterSchema(BaseModel):
    """Kullanıcı kaydı için şema."""

    name: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)
    grade: Optional[int] = Field(None, ge=2, le=12)
    role: RoleEnum = RoleEnum.STUDENT

    @validator("grade")
    def validate_grade(cls, v, values):
        """Rol öğrenci ise sınıf seviyesi gereklidir."""
        if values.get("role") == RoleEnum.STUDENT and v is None:
            raise ValueError("Öğrenci için sınıf seviyesi gereklidir")
        return v

    class Config:
        schema_extra = {
            "example": {
                "name": "Ahmet Yılmaz",
                "email": "ahmet@example.com",
                "username": "ahmetyilmaz",
                "password": "gizli_sifre123",
                "grade": 9,
                "role": "student"
            }
        }


class ForgotPasswordSchema(BaseModel):
    """Şifre sıfırlama isteği için şema."""

    email: EmailStr


class ResetPasswordSchema(BaseModel):
    """Şifre sıfırlama için şema."""

    token: str
    password: str = Field(..., min_length=6)


class TokenSchema(BaseModel):
    """Token şeması."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenSchema(BaseModel):
    """Yenileme token şeması."""

    refresh_token: str


class UserResponseSchema(BaseModel):
    """Kullanıcı yanıt şeması."""

    id: str
    name: str
    email: EmailStr
    username: str
    role: RoleEnum
    grade: Optional[int] = None
    preferences: PreferencesSchema
    subscription: SubscriptionSchema
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        schema_extra = {
            "example": {
                "id": "5f8d5b4c9d6b0a0012345678",
                "name": "Ahmet Yılmaz",
                "email": "ahmet@example.com",
                "username": "ahmetyilmaz",
                "role": "student",
                "grade": 9,
                "preferences": {
                    "teacher_gender": "male",
                    "theme": "light",
                    "notifications": True,
                    "language": "tr"
                },
                "subscription": {
                    "status": "trial",
                    "plan": "none",
                    "trial_ends": "2023-06-30T00:00:00.000Z"
                },
                "created_at": "2023-06-16T10:30:00.000Z",
                "last_login": "2023-06-16T14:45:00.000Z"
            }
        }


class LoginResponseSchema(BaseModel):
    """Giriş yanıt şeması."""

    success: bool = True
    token: str
    user: UserResponseSchema 