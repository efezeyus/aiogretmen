"""
Yapay Zeka Öğretmen - MongoDB Bağlantısı
--------------------------------------
MongoDB veritabanı bağlantı ve koleksiyon ayarları.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from loguru import logger
import asyncio
from typing import Optional

from app.core.config import settings


class MongoDBConnection:
    """MongoDB bağlantı yöneticisi sınıfı."""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self._connection_params = {
            'maxPoolSize': 50,  # Maximum connection pool size
            'minPoolSize': 5,   # Minimum connection pool size
            'maxIdleTimeMS': 30000,  # 30 seconds
            'waitQueueTimeoutMS': 5000,  # 5 seconds
            'serverSelectionTimeoutMS': 5000,  # 5 seconds
            'connectTimeoutMS': 5000,  # 5 seconds
            'retryWrites': True,
            'retryReads': True,
            'w': 'majority',  # Write concern
            'readPreference': 'primaryPreferred',
        }
    
    async def connect(self) -> bool:
        """MongoDB'ye bağlan."""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                **self._connection_params
            )
            
            # Bağlantıyı test et
            await self.client.admin.command('ping')

            # Veritabanını al
            db_name = settings.MONGODB_URL.split('/')[-1]
            self.db = self.client[db_name]
            
            logger.info(f"✅ MongoDB bağlantısı başarılı: {db_name}")
            return True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"❌ MongoDB bağlantı hatası: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Beklenmeyen MongoDB hatası: {e}")
            return False
    
    async def disconnect(self):
        """MongoDB bağlantısını kapat."""
        if self.client:
            self.client.close()
            logger.info("MongoDB bağlantısı kapatıldı")
    
    async def health_check(self) -> bool:
        """Bağlantı sağlık kontrolü."""
        try:
            if not self.client:
                return False
            
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return False


# Global MongoDB connection instance
mongo_connection = MongoDBConnection()

# Convenience getter functions
def get_database():
    """Veritabanı nesnesini döndür."""
    return mongo_connection.db

def get_client():
    """MongoDB client'ını döndür."""
    return mongo_connection.client

# Koleksiyon getter'ları
def get_users_collection():
    """Kullanıcılar koleksiyonu."""
    return mongo_connection.db.users if mongo_connection.db else None

def get_curriculum_collection():
    """Müfredat koleksiyonu."""
    return mongo_connection.db.curriculum if mongo_connection.db else None

def get_lessons_collection():
    """Dersler koleksiyonu.""" 
    return mongo_connection.db.lessons if mongo_connection.db else None

def get_topics_collection():
    """Konular koleksiyonu."""
    return mongo_connection.db.topics if mongo_connection.db else None

def get_user_progress_collection():
    """Kullanıcı ilerleme koleksiyonu."""
    return mongo_connection.db.user_progress if mongo_connection.db else None

def get_interactions_collection():
    """Etkileşimler koleksiyonu."""
    return mongo_connection.db.interactions if mongo_connection.db else None

def get_payments_collection():
    """Ödemeler koleksiyonu."""
    return mongo_connection.db.payments if mongo_connection.db else None

def get_subscriptions_collection():
    """Abonelikler koleksiyonu."""
    return mongo_connection.db.subscriptions if mongo_connection.db else None

# Backward compatibility - deprecated, use getter functions above
users_collection = None
curriculum_collection = None
lessons_collection = None
topics_collection = None
user_progress_collection = None
interactions_collection = None
payments_collection = None
subscriptions_collection = None


async def connect_to_mongodb() -> bool:
    """MongoDB'ye bağlan ve bağlantıyı doğrula."""
    return await mongo_connection.connect()


async def close_mongodb_connection():
    """MongoDB bağlantısını kapat."""
    await mongo_connection.disconnect()


async def create_indexes():
    """Veritabanı indekslerini oluştur."""
    try:
        db = get_database()
        if db is None:
            logger.error("Database connection not available for index creation")
            return
        
        # Helper function to safely create index
        async def safe_create_index(collection, keys, **kwargs):
            try:
                await collection.create_index(keys, **kwargs)
            except Exception as e:
                if "IndexOptionsConflict" in str(e) or "already exists" in str(e):
                    logger.warning(f"Index already exists, skipping: {keys}")
                else:
                    raise
        
        # Kullanıcılar için indeks
        await safe_create_index(db.users, "email", unique=True, background=True)
        await safe_create_index(db.users, "username", unique=True, background=True)
        await safe_create_index(db.users, [("role", 1), ("is_active", 1)], background=True)
        await safe_create_index(db.users, "created_at", background=True)
        
        # Müfredat için indeksler
        await safe_create_index(db.curriculum, [("grade", 1), ("subject", 1)], background=True)
        await safe_create_index(db.curriculum, "is_active", background=True)
        
        # Dersler için indeksler
        await safe_create_index(db.lessons, [("grade", 1), ("subject", 1)], background=True)
        await safe_create_index(db.lessons, [("curriculum_id", 1), ("order", 1)], background=True)
        await safe_create_index(db.lessons, "is_active", background=True)
        
        # Konular için indeksler
        await safe_create_index(db.topics, "lesson_id", background=True)
        await safe_create_index(db.topics, [("lesson_id", 1), ("order", 1)], background=True)
        
        # Kullanıcı ilerleme - compound index for better performance
        await safe_create_index(
            db.user_progress,
            [("user_id", 1), ("lesson_id", 1)], 
            unique=True, 
            background=True
        )
        await safe_create_index(
            db.user_progress,
            [("user_id", 1), ("updated_at", -1)], 
            background=True
        )
        
        # Etkileşimler - TTL index for automatic cleanup
        await safe_create_index(db.interactions, "user_id", background=True)
        await safe_create_index(db.interactions, "created_at", background=True)
        
        # Ödemeler
        await safe_create_index(db.payments, "user_id", background=True)
        await safe_create_index(db.payments, "checkout_id", unique=True, background=True)
        await safe_create_index(db.payments, [("status", 1), ("created_at", -1)], background=True)
        
        # Abonelikler
        await safe_create_index(db.subscriptions, "user_id", unique=True, background=True)
        await safe_create_index(db.subscriptions, [("status", 1), ("expires_at", 1)], background=True)
        
        # Chat ve AI etkileşimleri için ek indeksler
        await safe_create_index(db.ai_conversations, "user_id", background=True)
        await safe_create_index(
            db.ai_conversations,
            [("user_id", 1), ("created_at", -1)], 
            background=True
        )
        
        logger.info("✅ MongoDB indeksleri başarıyla oluşturuldu")
        
    except Exception as e:
        logger.error(f"❌ MongoDB indeksleri oluşturulurken hata: {e}")
        # Index hataları kritik değil, devam et
        logger.warning("⚠️ Index hataları görmezden gelindi, uygulama devam ediyor")


async def setup_database_constraints():
    """Veritabanı kısıtlamaları ve validasyon kuralları."""
    try:
        db = get_database()
        if db is None:
            return
        
        # JSON Schema validation for collections
        user_schema = {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["email", "username", "password_hash", "role"],
                "properties": {
                    "email": {
                        "bsonType": "string",
                        "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    },
                    "role": {
                        "bsonType": "string",
                        "enum": ["student", "parent", "teacher", "admin"]
                    },
                    "is_active": {
                        "bsonType": "bool"
                    }
                }
            }
        }
        
        # Apply schema validation (MongoDB 3.6+)
        try:
            await db.command("collMod", "users", validator=user_schema)
            logger.info("✅ User schema validation uygulandı")
        except Exception as e:
            logger.warning(f"Schema validation uygulanamadı: {e}")
            
    except Exception as e:
        logger.error(f"Database constraints setup hatası: {e}")


# Connection retry mechanism
async def ensure_connection():
    """Bağlantının aktif olduğundan emin ol, gerekirse yeniden bağlan."""
    if not await mongo_connection.health_check():
        logger.warning("MongoDB bağlantısı kayboldu, yeniden bağlanılıyor...")
        success = await mongo_connection.connect()
        if not success:
            raise ConnectionError("MongoDB yeniden bağlantısı başarısız")
        return True
    return True


# Startup function
async def init_mongodb():
    """MongoDB bağlantısını başlat ve indeksleri oluştur."""
    success = await connect_to_mongodb()
    if not success:
        raise ConnectionError("MongoDB bağlantısı kurulamadı")
    
    # Global koleksiyon referanslarını güncelle (backward compatibility)
    global users_collection, curriculum_collection, lessons_collection
    global topics_collection, user_progress_collection, interactions_collection
    global payments_collection, subscriptions_collection
    
    db = get_database()
    users_collection = db.users
    curriculum_collection = db.curriculum
    lessons_collection = db.lessons
    topics_collection = db.topics
    user_progress_collection = db.user_progress
    interactions_collection = db.interactions
    payments_collection = db.payments
    subscriptions_collection = db.subscriptions
    
    await create_indexes() 
    await setup_database_constraints()
    
    logger.info("🎯 MongoDB initialization completed") 