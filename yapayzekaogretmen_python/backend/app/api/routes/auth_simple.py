"""
Basit Auth Endpoint - Test için
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from loguru import logger

router = APIRouter()

# Test kullanıcıları
TEST_USERS = {
    "ahmet.yilmaz@okul.com": {
        "password": "123456",
        "full_name": "Ahmet Yılmaz",
        "role": "student",
        "grade": 5,
        "id": "1"
    },
    "murat@okul.com": {
        "password": "123456",
        "full_name": "Murat Ustaalioglu",
        "role": "student",
        "grade": 6,
        "id": "2"
    },
    "ayse.kara@okul.com": {
        "password": "123456",
        "full_name": "Ayşe Kara",
        "role": "student",
        "grade": 5,
        "id": "3"
    },
    "mehmet.demir@okul.com": {
        "password": "123456",
        "full_name": "Mehmet Demir",
        "role": "student",
        "grade": 9,
        "id": "4"
    },
    "zeynep.sahin@okul.com": {
        "password": "123456",
        "full_name": "Zeynep Şahin",
        "role": "student",
        "grade": 1,
        "id": "5"
    },
    "veli.yilmaz@email.com": {
        "password": "veli123", 
        "full_name": "Veli Yılmaz",
        "role": "parent",
        "id": "6"
    },
    "admin@yapayzekaogretmen.com": {
        "password": "admin123",
        "full_name": "Admin User", 
        "role": "admin",
        "id": "7"
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: dict

@router.post("/login", response_model=LoginResponse)
async def simple_login(login_data: LoginRequest):
    """Basit login endpoint - test kullanıcıları için"""
    
    email = login_data.email
    password = login_data.password
    
    logger.info(f"Login attempt: {email}")
    
    # Test kullanıcısını kontrol et
    if email not in TEST_USERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kimlik bilgileri"
        )
    
    user_data = TEST_USERS[email]
    
    # Şifreyi kontrol et
    if user_data["password"] != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kimlik bilgileri"
        )
    
    # Basit token oluştur (gerçek JWT değil, test için)
    token = f"test_token_{user_data['id']}_{email}"
    
    return LoginResponse(
        success=True,
        token=token,
        user={
            "id": user_data["id"],
            "email": email,
            "full_name": user_data["full_name"],
            "role": user_data["role"]
        }
    ) 