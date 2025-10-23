"""
Yapay Zeka Öğretmen - Kullanıcı Modeli
------------------------------------
Uygulama kullanıcı veri modeli ve ilgili fonksiyonlar.
"""
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Any, Optional, List

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, validator
from passlib.context import CryptContext


# Şifre işleme için
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RoleEnum(str, Enum):
    """Kullanıcı rolleri."""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class Preferences(BaseModel):
    """Kullanıcı tercihleri."""
    teacher_gender: str = "male"  # male, female
    theme: str = "light"  # light, dark
    notifications: bool = True
    language: str = "tr"
    
    def get(self, key, default=None):
        """Tercih değerini al."""
        return getattr(self, key, default)


class Subscription(BaseModel):
    """Kullanıcı abonelik bilgileri."""
    status: str = "inactive"  # inactive, active, trial, cancelled
    plan_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    cancel_date: Optional[datetime] = None
    trial_ends: Optional[datetime] = None
    
    def dict(self):
        """Abonelik verilerini dict olarak döndür."""
        return {
            "status": self.status,
            "plan_id": self.plan_id,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "cancel_date": self.cancel_date,
            "trial_ends": self.trial_ends,
        }


class User(BaseModel):
    """Kullanıcı modeli."""
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    name: str
    email: EmailStr
    username: str
    password: str
    role: RoleEnum = RoleEnum.STUDENT
    active: bool = True
    preferences: Preferences = Field(default_factory=Preferences)
    subscription: Subscription = Field(default_factory=Subscription)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        """Pydantic yapılandırması."""
        json_encoders = {
            ObjectId: str
        }
        arbitrary_types_allowed = True
    
    @validator("password", pre=True, always=True)
    def hash_password(cls, v):
        """Şifreyi hash'ler (eğer hash değilse)."""
        if not v or v.startswith("$2b$"):  # Zaten hash'lenmiş
            return v
        return cls.get_password_hash(v)
    
    @classmethod
    def get_password_hash(cls, password: str) -> str:
        """Şifreyi hash'le."""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str) -> bool:
        """Şifre doğrulama."""
        return pwd_context.verify(plain_password, self.password)
    
    def start_trial(self, days: int = 14) -> None:
        """Deneme süresini başlat."""
        now = datetime.utcnow()
        self.subscription.status = "trial"
        self.subscription.trial_ends = now + timedelta(days=days)
    
    def check_subscription(self) -> bool:
        """Kullanıcının aktif aboneliği var mı?"""
        now = datetime.utcnow()
        
        # Deneme süresi aktif mi?
        if self.subscription.status == "trial" and self.subscription.trial_ends and self.subscription.trial_ends > now:
            return True
        
        # Abonelik aktif mi?
        if self.subscription.status == "active" and self.subscription.end_date and self.subscription.end_date > now:
            return True
        
        # İptal edilmiş ama süresi dolmamış abonelik
        if self.subscription.status == "cancelled" and self.subscription.end_date and self.subscription.end_date > now:
            return True
        
        return False
    
    def dict(self, *args, **kwargs) -> Dict[str, Any]:
        """Kullanıcı verilerini dict olarak döndür (şifre hariç)."""
        user_dict = super().dict(*args, **kwargs)
        user_dict.pop("password", None)  # Şifreyi çıkart
        
        # ObjectId'yi string'e çevir
        if "_id" in user_dict:
            user_dict["id"] = str(user_dict.pop("_id"))
        elif "id" in user_dict and isinstance(user_dict["id"], ObjectId):
            user_dict["id"] = str(user_dict["id"])
        
        return user_dict


class UserInDB(User):
    """Veritabanındaki kullanıcı modeli (tam sürüm)."""
    reset_password_token: Optional[str] = None
    reset_password_expire: Optional[datetime] = None 