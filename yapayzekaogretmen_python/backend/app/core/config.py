"""
Yapay Zeka Öğretmen - Konfigürasyon
---------------------------------
Uygulama yapılandırma ayarları.
"""
import os
import secrets
from pathlib import Path
from typing import List, Union, Dict, Any, Optional

from pydantic_settings import BaseSettings
from loguru import logger


class Settings(BaseSettings):
    """Uygulama ayarları sınıfı."""
    
    # Temel bilgiler
    PROJECT_NAME: str = "aiogretmen.com"
    PROJECT_DESCRIPTION: str = "MEB müfredatına uygun yapay zeka destekli kişiselleştirilmiş eğitim platformu"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, production, testing
    DOMAIN: str = "aiogretmen.com"
    SITE_URL: str = "https://aiogretmen.com"
    
    # Uygulama ve sunucu ayarları
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # API ve URL ayarları
    API_PREFIX: str = "/api"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # CORS ayarları - Security hardened
    @property
    def CORS_ORIGINS(self) -> List[str]:
        if self.ENVIRONMENT == "production":
            return [
                "https://aiogretmen.com",
                "https://www.aiogretmen.com",
                "https://app.aiogretmen.com",
                "https://api.aiogretmen.com"
            ]
        elif self.ENVIRONMENT == "staging":
            return [
                "https://staging.aiogretmen.com",
                "http://localhost:3000"
            ]
        else:  # development
            return [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://0.0.0.0:3000",
                "*"  # Development'ta tüm origin'lere izin ver
            ]
    
    # Veritabanı ayarları
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/yapay_zeka_ogretmen"
    
    # PostgreSQL
    POSTGRES_USER: str = "muratustaalioglu"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "yapay_zeka_ogretmen"
    
    # PostgreSQL bağlantı dizesi
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # JWT ayarları - Security hardened
    @property
    def JWT_SECRET(self) -> str:
        secret = os.getenv("JWT_SECRET")
        if not secret:
            if self.ENVIRONMENT == "production":
                raise ValueError("JWT_SECRET zorunludur! Production'da environment variable olarak ayarlayın.")
            else:
                # Development için otomatik güvenli secret oluştur
                secret = secrets.token_urlsafe(64)
                logger.warning("JWT_SECRET bulunamadı, geçici secret oluşturuldu. Production'da mutlaka ayarlayın!")
        return secret
    
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 saat
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 gün
    
    # Security headers
    @property
    def SECURITY_HEADERS(self) -> Dict[str, str]:
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
    
    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100  # requests per minute
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # OpenAI API ayarları
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL_NAME: str = "gpt-4o"  # GPT-4 Optimized - En yeni ve güçlü model
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.7
    
    # DeepSeek API ayarları
    DEEPSEEK_API_KEY: str = ""  # Environment variable'dan okunacak
    DEEPSEEK_MODEL_NAME: str = "deepseek-chat"
    
    # Hugging Face API ayarları
    HUGGINGFACE_API_KEY: str = ""  # Opsiyonel, ücretsiz modeller için gerekli değil
    HUGGINGFACE_MODEL_NAME: str = "microsoft/DialoGPT-medium"  # Türkçe için: "dbmdz/bert-base-turkish-cased"
    HUGGINGFACE_ENDPOINT: str = "https://api-inference.huggingface.co/models/"
  
  
    
    # Dosya yolları
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    LOGS_DIR: Path = BASE_DIR / "logs"
    MEDIA_ROOT: Path = BASE_DIR / "media"
    STATIC_ROOT: Path = BASE_DIR / "static"
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [
        "pdf", "doc", "docx", "txt", "png", "jpg", "jpeg", "gif", "mp4", "avi"
    ]
    
    # Ödeme ayarları
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_CURRENCY: str = "try"  # Turkish Lira
    
    # E-posta ayarları
    MAIL_SERVER: str = ""
    MAIL_PORT: int = 587
    MAIL_USE_TLS: bool = True
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "info@aiogretmen.com"
    MAIL_FROM_NAME: str = "aiogretmen.com"
    
    # Session ayarları
    SESSION_COOKIE_SECURE: bool = True
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = "strict"
    
    # Cache ayarları
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 300  # 5 minutes
    CACHE_MAX_SIZE: int = 10000  # Maximum cache entries
    CACHE_KEY_PREFIX: str = "yzogretmen:"
    
    # Elasticsearch ayarları
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_USERNAME: Optional[str] = None
    ELASTICSEARCH_PASSWORD: Optional[str] = None
    ELASTICSEARCH_INDEX_PREFIX: str = "yzogretmen_"
    
    # Notification ayarları
    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@aiogretmen.com"
    
    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    
    # Push Notifications (Firebase)
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    
    # App URL (for email templates)
    APP_URL: str = "https://aiogretmen.com"
    
    # Monitoring
    SENTRY_DSN: str = ""
    
    # Loglama ayarları
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FORMAT: str = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ekstra alanları yoksay

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Environment specific validations
        if self.ENVIRONMENT == "production":
            self._validate_production_settings()
    
    def _validate_production_settings(self):
        """Production ortamı için zorunlu ayarları kontrol et."""
        required_production_vars = [
            "OPENAI_API_KEY",
            "POSTGRES_PASSWORD",
            "MAIL_PASSWORD"
        ]
        
        missing_vars = []
        for var in required_production_vars:
            if not getattr(self, var, None):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Production ortamında şu değişkenler zorunludur: {', '.join(missing_vars)}")


# Ayarlar nesnesini oluştur
settings = Settings()

# Environment-specific configuration loading
if settings.ENVIRONMENT == "development":
    logger.info("🚀 Development modu aktif")
    logger.info(f"API URL: http://{settings.HOST}:{settings.PORT}")
    logger.info(f"Docs: http://{settings.HOST}:{settings.PORT}/api/docs")
elif settings.ENVIRONMENT == "production":
    logger.info("🏭 Production modu aktif")
    # Production'da debug info'ları gösterme
else:
    logger.info(f"🧪 {settings.ENVIRONMENT.title()} modu aktif")

# Güvenlik uyarıları
if not settings.OPENAI_API_KEY:
    logger.warning("⚠️  OPENAI_API_KEY ayarlanmamış! Yapay zeka özellikleri çalışmayacak.")

if settings.ENVIRONMENT == "production" and settings.DEBUG:
    logger.warning("⚠️  Production'da DEBUG modu aktif! Bu güvenlik riski oluşturabilir.")

# Gerekli klasörleri oluştur
for directory in [settings.LOGS_DIR, settings.MEDIA_ROOT, settings.STATIC_ROOT]:
    directory.mkdir(parents=True, exist_ok=True) 