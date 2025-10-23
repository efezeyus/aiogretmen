"""
Yapay Zeka Öğretmen - Veritabanı İşlemleri
----------------------------------------
Veritabanı bağlantıları ve işlemleri.
"""
from app.db.mongodb import (
    connect_to_mongodb,
    close_mongodb_connection,
    init_mongodb,
    users_collection,
    lessons_collection,
    curriculum_collection,
    payments_collection,
)
from app.db.postgres import (
    get_db,
    init_postgres,
    check_database_connection,
    create_tables,
)


async def connect_to_db():
    """Tüm veritabanı bağlantılarını başlatır."""
    # MongoDB bağlantısı ve initialization
    await init_mongodb()
    # PostgreSQL bağlantısı
    await init_postgres()


async def close_db_connections():
    """Tüm veritabanı bağlantılarını kapatır."""
    # MongoDB bağlantısını kapat
    await close_mongodb_connection()
    # PostgreSQL bağlantısı için özel bir close fonksiyonu yok 