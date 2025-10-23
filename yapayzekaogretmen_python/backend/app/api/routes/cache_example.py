"""
Cache Usage Examples
-------------------
Redis cache kullanım örnekleri.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, List
from datetime import datetime

from app.core.logger import logger
from app.services.cache_service import cache, cached, CacheInvalidator, RateLimiter


router = APIRouter(
    prefix="/cache-examples",
    tags=["Cache Examples"]
)


# Rate limiter instance
rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


@router.get("/basic-cache")
async def basic_cache_example():
    """Basit cache kullanımı örneği"""
    key = "example:basic"
    
    # Cache'den oku
    cached_value = await cache.get(key)
    
    if cached_value:
        return {
            "source": "cache",
            "data": cached_value,
            "cached_at": cached_value.get("timestamp")
        }
    
    # Cache'de yoksa hesapla
    data = {
        "message": "Bu veri cache'den gelmiyor",
        "timestamp": datetime.utcnow().isoformat(),
        "expensive_calculation": sum(range(1000000))  # Pahalı işlem simülasyonu
    }
    
    # Cache'e kaydet (60 saniye TTL)
    await cache.set(key, data, ttl=60)
    
    return {
        "source": "calculated",
        "data": data
    }


@router.get("/cached-function/{user_id}")
@cached(namespace="user", ttl=300, key_prefix="user_profile")
async def get_user_profile_cached(user_id: str):
    """
    Cache decorator kullanımı
    Bu fonksiyon otomatik olarak cache'lenir
    """
    # Pahalı veritabanı sorgusu simülasyonu
    import asyncio
    await asyncio.sleep(2)  # 2 saniye bekleme
    
    return {
        "user_id": user_id,
        "name": f"User {user_id}",
        "email": f"user{user_id}@example.com",
        "created_at": datetime.utcnow().isoformat(),
        "profile_complete": True
    }


@router.post("/invalidate-cache/{user_id}")
async def invalidate_user_cache(user_id: str):
    """Kullanıcı cache'ini temizle"""
    await CacheInvalidator.invalidate_user_cache(user_id)
    
    return {
        "success": True,
        "message": f"User {user_id} cache invalidated"
    }


@router.get("/rate-limit-test")
async def test_rate_limit(client_id: str = "test_client"):
    """Rate limiting örneği"""
    allowed, remaining = await rate_limiter.check_rate_limit(client_id)
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    
    return {
        "success": True,
        "remaining_requests": remaining,
        "message": "Request processed successfully"
    }


@router.get("/list-cache-example")
async def list_cache_example():
    """Redis list operations örneği"""
    key = "recent_activities"
    
    # Yeni aktivite ekle
    activity = {
        "action": "login",
        "user": "test_user",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await cache.lpush(key, activity, namespace="analytics")
    
    # Son 10 aktiviteyi al
    recent = await cache.lrange(key, 0, 9, namespace="analytics")
    
    return {
        "recent_activities": recent,
        "total": len(recent)
    }


@router.get("/counter-example")
async def counter_example(counter_name: str = "page_views"):
    """Redis counter örneği"""
    # Sayacı artır
    new_count = await cache.increment(counter_name, namespace="analytics")
    
    return {
        "counter": counter_name,
        "current_value": new_count
    }


@router.get("/batch-cache-example")
async def batch_cache_example():
    """Toplu cache işlemleri örneği"""
    # Birden fazla değeri kaydet
    data = {
        "key1": {"value": "data1", "timestamp": datetime.utcnow().isoformat()},
        "key2": {"value": "data2", "timestamp": datetime.utcnow().isoformat()},
        "key3": {"value": "data3", "timestamp": datetime.utcnow().isoformat()}
    }
    
    await cache.set_many(data, ttl=120, namespace="batch")
    
    # Toplu okuma
    keys = list(data.keys())
    cached_data = await cache.get_many(keys, namespace="batch")
    
    return {
        "saved_keys": keys,
        "retrieved_data": cached_data
    }


@router.get("/set-operations")
async def set_operations_example():
    """Redis set operations örneği"""
    key = "online_users"
    
    # Kullanıcıları ekle
    users = ["user1", "user2", "user3"]
    await cache.sadd(key, *users, namespace="session")
    
    # Online kullanıcıları al
    online = await cache.smembers(key, namespace="session")
    
    return {
        "online_users": list(online),
        "count": len(online)
    }


@router.get("/ttl-example/{key}")
async def ttl_example(key: str):
    """TTL (Time To Live) örneği"""
    # Veri kaydet
    await cache.set(key, {"data": "example"}, ttl=60)
    
    # TTL kontrol et
    remaining_ttl = await cache.get_ttl(key)
    
    # TTL uzat
    await cache.expire(key, 120)
    new_ttl = await cache.get_ttl(key)
    
    return {
        "key": key,
        "original_ttl": remaining_ttl,
        "extended_ttl": new_ttl
    }


# AI Response Cache örneği
@router.get("/ai-cached-response")
@cached(namespace="ai", ttl=3600, key_prefix="ai_response")
async def get_ai_cached_response(question: str, grade_level: int = 5):
    """
    AI yanıtlarını cache'leme örneği
    Aynı soru için tekrar AI'ya gitmez
    """
    from app.services.ai_service import ai_service
    
    # Cache key'e grade level'ı da ekle
    response, metadata = await ai_service.get_ai_response(
        prompt=question,
        grade_level=grade_level,
        subject="genel"
    )
    
    return {
        "question": question,
        "response": response,
        "metadata": metadata,
        "cached": False  # İlk çağrıda false, sonrakilerde decorator otomatik cache'den döner
    }
