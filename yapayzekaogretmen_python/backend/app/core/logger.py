"""
Yapay Zeka Öğretmen - Loglama Modülü
----------------------------------
Uygulama loglaması için yapılandırma ve yardımcı fonksiyonlar.
"""
import sys
import os
from pathlib import Path
from datetime import datetime

from loguru import logger

from app.core.config import settings


def setup_logging():
    """
    Loglama sistemini yapılandırır.
    """
    # Log dizini yoksa oluştur
    os.makedirs(settings.LOGS_DIR, exist_ok=True)
    
    # Günlük log dosyası adı 
    log_file = settings.LOGS_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log"
    
    # Loguru yapılandırması
    config = {
        "handlers": [
            # Konsol log yönlendiricisi
            {
                "sink": sys.stdout, 
                "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
                "level": settings.LOG_LEVEL,
                "colorize": True,
            },
            # Dosya log yönlendiricisi
            {
                "sink": str(log_file),
                "format": "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
                "level": settings.LOG_LEVEL,
                "rotation": "00:00",  # Her gece yarısı yeni dosya
                "retention": "7 days",  # 7 gün saklama
                "compression": "zip",  # Eski dosyaları sıkıştır
                "enqueue": True,  # Thread-safe logging
            }
        ],
    }
    
    # Önceki yapılandırmayı temizle ve yenisini uygula
    logger.remove()
    for handler in config["handlers"]:
        logger.add(**handler)
    
    logger.info(f"Loglama sistemi '{settings.LOG_LEVEL}' seviyesinde başlatıldı")
    
    # Yapılandırılmış logger'ı döndür
    return logger 