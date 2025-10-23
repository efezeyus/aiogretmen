"""
Redis Cache Service - High Performance Caching
----------------------------------------------
Yüksek performanslı önbellekleme sistemi.
"""

import json
import pickle
from typing import Any, Optional, Union, List, Dict
from datetime import timedelta
import hashlib
import asyncio
from functools import wraps
import redis.asyncio as redis
from redis.exceptions import RedisError
from loguru import logger

from app.core.config import settings


class CacheService:
    """Redis tabanlı cache servisi"""
    
    def __init__(self):
        self.redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
        self.default_ttl = getattr(settings, 'CACHE_TTL', 300)  # 5 dakika
        self.client: Optional[redis.Redis] = None
        self.is_connected = False
        
        # Cache namespace'leri
        self.namespaces = {
            "user": "user:",
            "lesson": "lesson:",
            "ai": "ai:",
            "session": "session:",
            "temp": "temp:",
            "analytics": "analytics:"
        }
        
        logger.info("Cache Service başlatıldı")
    
    async def connect(self):
        """Redis'e bağlan"""
        try:
            self.client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            
            # Bağlantı testi
            await self.client.ping()
            self.is_connected = True
            logger.info("Redis bağlantısı başarılı")
            
        except Exception as e:
            logger.error(f"Redis bağlantı hatası: {e}")
            self.is_connected = False
    
    async def disconnect(self):
        """Redis bağlantısını kapat"""
        if self.client:
            await self.client.close()
            self.is_connected = False
            logger.info("Redis bağlantısı kapatıldı")
    
    def _make_key(self, namespace: str, key: str) -> str:
        """Cache key oluştur"""
        prefix = self.namespaces.get(namespace, "")
        return f"{prefix}{key}"
    
    def _serialize(self, value: Any) -> str:
        """Değeri serialize et"""
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        elif isinstance(value, (str, int, float, bool)):
            return str(value)
        else:
            # Kompleks objeler için pickle kullan
            return pickle.dumps(value).hex()
    
    def _deserialize(self, value: str, data_type: Optional[str] = None) -> Any:
        """Değeri deserialize et"""
        if not value:
            return None
        
        if data_type == "json":
            return json.loads(value)
        elif data_type == "pickle":
            return pickle.loads(bytes.fromhex(value))
        else:
            # Otomatik tip tespiti
            try:
                return json.loads(value)
            except:
                try:
                    return pickle.loads(bytes.fromhex(value))
                except:
                    return value
    
    async def get(self, key: str, namespace: str = "temp") -> Optional[Any]:
        """Cache'den değer al"""
        if not self.is_connected:
            return None
        
        try:
            full_key = self._make_key(namespace, key)
            value = await self.client.get(full_key)
            
            if value:
                return self._deserialize(value)
            return None
            
        except Exception as e:
            logger.error(f"Cache get hatası: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None,
        namespace: str = "temp"
    ) -> bool:
        """Cache'e değer kaydet"""
        if not self.is_connected:
            return False
        
        try:
            full_key = self._make_key(namespace, key)
            serialized = self._serialize(value)
            
            if ttl is None:
                ttl = self.default_ttl
            
            if ttl > 0:
                await self.client.setex(full_key, ttl, serialized)
            else:
                await self.client.set(full_key, serialized)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set hatası: {e}")
            return False
    
    async def delete(self, key: str, namespace: str = "temp") -> bool:
        """Cache'den değer sil"""
        if not self.is_connected:
            return False
        
        try:
            full_key = self._make_key(namespace, key)
            result = await self.client.delete(full_key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Cache delete hatası: {e}")
            return False
    
    async def exists(self, key: str, namespace: str = "temp") -> bool:
        """Key'in varlığını kontrol et"""
        if not self.is_connected:
            return False
        
        try:
            full_key = self._make_key(namespace, key)
            return await self.client.exists(full_key) > 0
            
        except Exception as e:
            logger.error(f"Cache exists hatası: {e}")
            return False
    
    async def clear_namespace(self, namespace: str) -> int:
        """Belirli bir namespace'i temizle"""
        if not self.is_connected:
            return 0
        
        try:
            prefix = self.namespaces.get(namespace, namespace)
            pattern = f"{prefix}*"
            
            # Tüm key'leri bul
            keys = []
            async for key in self.client.scan_iter(match=pattern):
                keys.append(key)
            
            # Toplu silme
            if keys:
                return await self.client.delete(*keys)
            return 0
            
        except Exception as e:
            logger.error(f"Cache clear namespace hatası: {e}")
            return 0
    
    async def get_many(self, keys: List[str], namespace: str = "temp") -> Dict[str, Any]:
        """Birden fazla değeri al"""
        if not self.is_connected:
            return {}
        
        try:
            full_keys = [self._make_key(namespace, key) for key in keys]
            values = await self.client.mget(full_keys)
            
            result = {}
            for key, value in zip(keys, values):
                if value:
                    result[key] = self._deserialize(value)
            
            return result
            
        except Exception as e:
            logger.error(f"Cache get_many hatası: {e}")
            return {}
    
    async def set_many(
        self, 
        data: Dict[str, Any], 
        ttl: Optional[int] = None,
        namespace: str = "temp"
    ) -> bool:
        """Birden fazla değeri kaydet"""
        if not self.is_connected:
            return False
        
        try:
            pipe = self.client.pipeline()
            
            for key, value in data.items():
                full_key = self._make_key(namespace, key)
                serialized = self._serialize(value)
                
                if ttl is None:
                    ttl = self.default_ttl
                
                if ttl > 0:
                    pipe.setex(full_key, ttl, serialized)
                else:
                    pipe.set(full_key, serialized)
            
            await pipe.execute()
            return True
            
        except Exception as e:
            logger.error(f"Cache set_many hatası: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1, namespace: str = "analytics") -> Optional[int]:
        """Sayaç artır"""
        if not self.is_connected:
            return None
        
        try:
            full_key = self._make_key(namespace, key)
            return await self.client.incrby(full_key, amount)
            
        except Exception as e:
            logger.error(f"Cache increment hatası: {e}")
            return None
    
    async def get_ttl(self, key: str, namespace: str = "temp") -> Optional[int]:
        """Key'in TTL değerini al"""
        if not self.is_connected:
            return None
        
        try:
            full_key = self._make_key(namespace, key)
            ttl = await self.client.ttl(full_key)
            return ttl if ttl >= 0 else None
            
        except Exception as e:
            logger.error(f"Cache get_ttl hatası: {e}")
            return None
    
    async def expire(self, key: str, ttl: int, namespace: str = "temp") -> bool:
        """Key'e TTL ayarla"""
        if not self.is_connected:
            return False
        
        try:
            full_key = self._make_key(namespace, key)
            return await self.client.expire(full_key, ttl)
            
        except Exception as e:
            logger.error(f"Cache expire hatası: {e}")
            return False
    
    # List operations
    async def lpush(self, key: str, *values: Any, namespace: str = "temp") -> Optional[int]:
        """Liste başına ekle"""
        if not self.is_connected:
            return None
        
        try:
            full_key = self._make_key(namespace, key)
            serialized = [self._serialize(v) for v in values]
            return await self.client.lpush(full_key, *serialized)
            
        except Exception as e:
            logger.error(f"Cache lpush hatası: {e}")
            return None
    
    async def lrange(self, key: str, start: int = 0, end: int = -1, namespace: str = "temp") -> List[Any]:
        """Liste elemanlarını al"""
        if not self.is_connected:
            return []
        
        try:
            full_key = self._make_key(namespace, key)
            values = await self.client.lrange(full_key, start, end)
            return [self._deserialize(v) for v in values]
            
        except Exception as e:
            logger.error(f"Cache lrange hatası: {e}")
            return []
    
    # Set operations
    async def sadd(self, key: str, *values: Any, namespace: str = "temp") -> Optional[int]:
        """Set'e ekle"""
        if not self.is_connected:
            return None
        
        try:
            full_key = self._make_key(namespace, key)
            serialized = [self._serialize(v) for v in values]
            return await self.client.sadd(full_key, *serialized)
            
        except Exception as e:
            logger.error(f"Cache sadd hatası: {e}")
            return None
    
    async def smembers(self, key: str, namespace: str = "temp") -> set:
        """Set elemanlarını al"""
        if not self.is_connected:
            return set()
        
        try:
            full_key = self._make_key(namespace, key)
            values = await self.client.smembers(full_key)
            return {self._deserialize(v) for v in values}
            
        except Exception as e:
            logger.error(f"Cache smembers hatası: {e}")
            return set()


# Global cache instance
cache = CacheService()


# Decorator for caching
def cached(
    namespace: str = "temp",
    ttl: Optional[int] = None,
    key_prefix: str = "",
    key_builder: Optional[callable] = None
):
    """
    Cache decorator
    
    Kullanım:
    ```python
    @cached(namespace="user", ttl=3600)
    async def get_user_data(user_id: str):
        # Expensive operation
        return user_data
    ```
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Cache key oluştur
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Basit key builder
                key_parts = [key_prefix or func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)
            
            # Hash key for long keys
            if len(cache_key) > 100:
                cache_key = hashlib.md5(cache_key.encode()).hexdigest()
            
            # Cache'den kontrol et
            cached_value = await cache.get(cache_key, namespace)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Fonksiyonu çalıştır
            result = await func(*args, **kwargs)
            
            # Cache'e kaydet
            await cache.set(cache_key, result, ttl, namespace)
            logger.debug(f"Cache set: {cache_key}")
            
            return result
        
        return wrapper
    return decorator


# Cache invalidation helper
class CacheInvalidator:
    """Cache invalidation yardımcısı"""
    
    @staticmethod
    async def invalidate_user_cache(user_id: str):
        """Kullanıcı cache'ini temizle"""
        patterns = [
            f"user:{user_id}",
            f"user:{user_id}:*",
            f"session:{user_id}:*"
        ]
        
        for pattern in patterns:
            await cache.delete(pattern, "user")
    
    @staticmethod
    async def invalidate_lesson_cache(lesson_id: str):
        """Ders cache'ini temizle"""
        patterns = [
            f"lesson:{lesson_id}",
            f"lesson:{lesson_id}:*"
        ]
        
        for pattern in patterns:
            await cache.delete(pattern, "lesson")
    
    @staticmethod
    async def invalidate_ai_cache(user_id: Optional[str] = None):
        """AI cache'ini temizle"""
        if user_id:
            await cache.delete(f"ai:{user_id}:*", "ai")
        else:
            await cache.clear_namespace("ai")


# Rate limiter using Redis
class RateLimiter:
    """Redis tabanlı rate limiter"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def check_rate_limit(self, identifier: str) -> tuple[bool, int]:
        """
        Rate limit kontrolü
        
        Returns:
            (allowed, remaining_requests)
        """
        key = f"rate_limit:{identifier}"
        
        current = await cache.get(key, "temp")
        if current is None:
            await cache.set(key, 1, self.window_seconds, "temp")
            return True, self.max_requests - 1
        
        current = int(current)
        if current >= self.max_requests:
            ttl = await cache.get_ttl(key, "temp")
            return False, 0
        
        new_count = await cache.increment(key, 1, "temp")
        return True, self.max_requests - new_count
