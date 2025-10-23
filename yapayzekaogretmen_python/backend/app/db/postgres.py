"""
Yapay Zeka Öğretmen - PostgreSQL Bağlantısı
----------------------------------------
PostgreSQL veritabanı bağlantı ve model ayarları.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from loguru import logger

from app.core.config import settings


# SQLAlchemy bağlantı URL'si (asenkron driver ile)
try:
    SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI.replace("postgresql://", "postgresql+asyncpg://")
    # Asenkron motor
    engine = create_async_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
    )
except Exception as e:
    logger.warning(f"PostgreSQL bağlantısı kurulamadı: {e}")
    engine = None

# Asenkron oturum fabrikası
if engine:
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
else:
    AsyncSessionLocal = None

# Temel sınıf
Base = declarative_base()


# Bağımlılık olarak asenkron veritabanı oturumu
async def get_db() -> AsyncSession:
    """Veritabanı oturumu için bağımlılık."""
    if not AsyncSessionLocal:
        raise RuntimeError("PostgreSQL veritabanı bağlantısı mevcut değil")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Veritabanı oturum hatası: {e}")
            raise
        finally:
            await session.close()


# Veritabanı bağlantı testi
async def check_database_connection():
    """Veritabanı bağlantısını test et."""
    if not engine:
        logger.warning("PostgreSQL engine mevcut değil, bağlantı testi atlanıyor")
        return False
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        logger.info("PostgreSQL bağlantısı başarılı")
        return True
    except Exception as e:
        logger.error(f"PostgreSQL bağlantı hatası: {e}")
        return False


# Veritabanı tabloları oluştur
async def create_tables():
    """Tanımlı modellere göre veritabanı tablolarını oluştur."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL tabloları oluşturuldu")
    except Exception as e:
        logger.error(f"PostgreSQL tabloları oluşturulurken hata: {e}")
        raise


# Başlangıç aşamasında çağrılacak
async def init_postgres():
    """PostgreSQL bağlantısını başlat ve tabloları oluştur."""
    try:
        connected = await check_database_connection()
        if connected:
            await create_tables()
    except Exception as e:
        logger.warning(f"PostgreSQL bağlantısı opsiyonel - atlanıyor: {e}")
        # PostgreSQL kullanılamıyor, sadece MongoDB ile devam et
        pass 