"""
Yapay Zeka Öğretmen - Ödeme Servisi
---------------------------------
Ödeme ve abonelik işlemleri için servis fonksiyonları.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from loguru import logger

from app.db.mongodb import subscriptions_collection, payments_collection
from app.core.config import settings


async def get_subscription_plans() -> List[Dict[str, Any]]:
    """
    Abonelik planlarını getir.
    
    Returns:
        Plan listesi
    """
    # Sabit planlar
    plans = [
        {
            "id": "monthly",
            "name": "Aylık Abonelik",
            "description": "Her ay yenilenen standart abonelik paketi",
            "price": 99.90,
            "currency": "TRY",
            "interval": "month",
            "features": [
                "Tüm derslere sınırsız erişim",
                "Yapay zeka destekli öğretmen 7/24 erişim",
                "Test soruları oluşturma",
                "Öğrenci ilerleme takibi"
            ]
        },
        {
            "id": "annual",
            "name": "Yıllık Abonelik",
            "description": "Her yıl yenilenen indirimli abonelik paketi",
            "price": 899.90,
            "currency": "TRY",
            "interval": "year",
            "features": [
                "Tüm derslere sınırsız erişim",
                "Yapay zeka destekli öğretmen 7/24 erişim",
                "Test soruları oluşturma",
                "Öğrenci ilerleme takibi",
                "İndirimli fiyat (2 ay bedava)",
                "Ek özel içerikler"
            ]
        },
        {
            "id": "school",
            "name": "Okul Paketi",
            "description": "Okullar için özel paket",
            "price": 4999.90,
            "currency": "TRY",
            "interval": "year",
            "features": [
                "30 öğrenci hesabı",
                "3 öğretmen hesabı",
                "Tüm özelliklere tam erişim",
                "Özel destek hattı",
                "Öğrenci performans raporları",
                "Özel müfredat entegrasyonu"
            ]
        }
    ]
    return plans


async def get_plan_by_id(plan_id: str) -> Optional[Dict[str, Any]]:
    """
    Plan ID'sine göre abonelik planını getir.
    
    Args:
        plan_id: Plan ID'si
    
    Returns:
        Plan bilgileri veya None
    """
    plans = await get_subscription_plans()
    for plan in plans:
        if plan["id"] == plan_id:
            return plan
    return None


async def create_payment(payment_data: Dict[str, Any]) -> Optional[str]:
    """
    Yeni ödeme kaydı oluştur.
    
    Args:
        payment_data: Ödeme bilgileri
    
    Returns:
        Oluşturulan ödeme kaydının ID'si veya None
    """
    try:
        # Oluşturma zamanını ekle
        if "created_at" not in payment_data:
            payment_data["created_at"] = datetime.utcnow()
        
        # Ödeme kaydını oluştur
        result = await payments_collection.insert_one(payment_data)
        
        # Oluşturulan ödeme kaydının ID'sini döndür
        if result.inserted_id:
            return str(result.inserted_id)
        return None
    except Exception as e:
        logger.error(f"Ödeme oluşturma hatası: {e}")
        return None


async def update_payment(payment_id: str, payment_data: Dict[str, Any]) -> bool:
    """
    Ödeme kaydını güncelle.
    
    Args:
        payment_id: Ödeme ID'si
        payment_data: Güncellenecek ödeme bilgileri
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Ödeme kaydını güncelle
        result = await payments_collection.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": payment_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Ödeme güncelleme hatası (ID: {payment_id}): {e}")
        return False


async def get_payment_by_id(payment_id: str) -> Optional[Dict[str, Any]]:
    """
    Ödeme kaydını ID ile getir.
    
    Args:
        payment_id: Ödeme ID'si
    
    Returns:
        Ödeme bilgileri veya None
    """
    try:
        payment = await payments_collection.find_one({"_id": ObjectId(payment_id)})
        if payment:
            payment["id"] = str(payment.pop("_id"))
            return payment
        return None
    except Exception as e:
        logger.error(f"Ödeme getirme hatası (ID: {payment_id}): {e}")
        return None


async def get_payment_by_checkout_id(checkout_id: str) -> Optional[Dict[str, Any]]:
    """
    Ödeme kaydını checkout ID ile getir.
    
    Args:
        checkout_id: Checkout ID'si
    
    Returns:
        Ödeme bilgileri veya None
    """
    try:
        payment = await payments_collection.find_one({"checkout_id": checkout_id})
        if payment:
            payment["id"] = str(payment.pop("_id"))
            return payment
        return None
    except Exception as e:
        logger.error(f"Ödeme getirme hatası (Checkout ID: {checkout_id}): {e}")
        return None


async def get_payments_by_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Kullanıcının ödemelerini getir.
    
    Args:
        user_id: Kullanıcı ID'si
    
    Returns:
        Ödeme bilgileri listesi
    """
    try:
        cursor = payments_collection.find({"user_id": user_id}).sort("created_at", -1)
        payments = []
        async for payment in cursor:
            payment["id"] = str(payment.pop("_id"))
            payments.append(payment)
        return payments
    except Exception as e:
        logger.error(f"Kullanıcı ödemeleri getirme hatası (Kullanıcı ID: {user_id}): {e}")
        return []


async def create_subscription(subscription_data: Dict[str, Any]) -> Optional[str]:
    """
    Yeni abonelik kaydı oluştur.
    
    Args:
        subscription_data: Abonelik bilgileri
    
    Returns:
        Oluşturulan abonelik kaydının ID'si veya None
    """
    try:
        # Oluşturma zamanını ekle
        if "created_at" not in subscription_data:
            subscription_data["created_at"] = datetime.utcnow()
        if "updated_at" not in subscription_data:
            subscription_data["updated_at"] = datetime.utcnow()
        
        # Abonelik kaydını oluştur
        result = await subscriptions_collection.insert_one(subscription_data)
        
        # Oluşturulan abonelik kaydının ID'sini döndür
        if result.inserted_id:
            return str(result.inserted_id)
        return None
    except Exception as e:
        logger.error(f"Abonelik oluşturma hatası: {e}")
        return None


async def update_subscription(subscription_id: str, subscription_data: Dict[str, Any]) -> bool:
    """
    Abonelik kaydını güncelle.
    
    Args:
        subscription_id: Abonelik ID'si
        subscription_data: Güncellenecek abonelik bilgileri
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Güncelleme zamanını ekle
        subscription_data["updated_at"] = datetime.utcnow()
        
        # Abonelik kaydını güncelle
        result = await subscriptions_collection.update_one(
            {"_id": ObjectId(subscription_id)},
            {"$set": subscription_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Abonelik güncelleme hatası (ID: {subscription_id}): {e}")
        return False


async def get_subscription_by_id(subscription_id: str) -> Optional[Dict[str, Any]]:
    """
    Abonelik kaydını ID ile getir.
    
    Args:
        subscription_id: Abonelik ID'si
    
    Returns:
        Abonelik bilgileri veya None
    """
    try:
        subscription = await subscriptions_collection.find_one({"_id": ObjectId(subscription_id)})
        if subscription:
            subscription["id"] = str(subscription.pop("_id"))
            return subscription
        return None
    except Exception as e:
        logger.error(f"Abonelik getirme hatası (ID: {subscription_id}): {e}")
        return None


async def get_subscription_by_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Kullanıcının abonelik bilgilerini getir.
    
    Args:
        user_id: Kullanıcı ID'si
    
    Returns:
        Abonelik bilgileri veya None
    """
    try:
        subscription = await subscriptions_collection.find_one({"user_id": user_id})
        if subscription:
            subscription["id"] = str(subscription.pop("_id"))
            return subscription
        return None
    except Exception as e:
        logger.error(f"Kullanıcı aboneliği getirme hatası (Kullanıcı ID: {user_id}): {e}")
        return None


async def upsert_subscription(user_id: str, subscription_data: Dict[str, Any]) -> bool:
    """
    Kullanıcının abonelik bilgilerini ekle veya güncelle.
    
    Args:
        user_id: Kullanıcı ID'si
        subscription_data: Abonelik bilgileri
    
    Returns:
        İşlem başarılı ise True, değilse False
    """
    try:
        # Güncelleme zamanını ekle
        subscription_data["updated_at"] = datetime.utcnow()
        subscription_data["user_id"] = user_id
        
        # Kullanıcı ID'si ile abonelik varsa güncelle, yoksa ekle
        result = await subscriptions_collection.update_one(
            {"user_id": user_id},
            {"$set": subscription_data},
            upsert=True
        )
        
        return result.modified_count > 0 or result.upserted_id is not None
    except Exception as e:
        logger.error(f"Abonelik ekleme/güncelleme hatası (Kullanıcı ID: {user_id}): {e}")
        return False


async def calculate_subscription_end_date(plan_id: str, start_date: datetime = None) -> datetime:
    """
    Abonelik bitiş tarihini hesapla.
    
    Args:
        plan_id: Plan ID'si
        start_date: Başlangıç tarihi (None ise şu anki zaman)
    
    Returns:
        Abonelik bitiş tarihi
    """
    if start_date is None:
        start_date = datetime.utcnow()
    
    if plan_id == "monthly":
        return start_date + timedelta(days=30)
    elif plan_id == "annual":
        return start_date + timedelta(days=365)
    elif plan_id == "school":
        return start_date + timedelta(days=365)
    else:
        # Varsayılan olarak 30 gün
        return start_date + timedelta(days=30)


async def check_subscription_status(user_id: str) -> Dict[str, Any]:
    """
    Kullanıcının abonelik durumunu kontrol et.
    
    Args:
        user_id: Kullanıcı ID'si
    
    Returns:
        Abonelik durum bilgileri
    """
    try:
        subscription = await get_subscription_by_user(user_id)
        now = datetime.utcnow()
        
        if not subscription:
            return {
                "has_subscription": False,
                "status": "none",
                "message": "Aktif abonelik bulunamadı",
            }
        
        # Abonelik durumunu kontrol et
        if subscription.get("status") == "active":
            end_date = subscription.get("end_date")
            if end_date and end_date > now:
                days_left = (end_date - now).days
                return {
                    "has_subscription": True,
                    "status": "active",
                    "end_date": end_date,
                    "days_left": days_left,
                    "plan_id": subscription.get("plan_id"),
                    "message": f"Abonelik aktif, {days_left} gün kaldı",
                }
            else:
                # Süresi dolmuş abonelik
                return {
                    "has_subscription": False,
                    "status": "expired",
                    "end_date": end_date,
                    "plan_id": subscription.get("plan_id"),
                    "message": "Abonelik süresi dolmuş",
                }
        elif subscription.get("status") == "cancelled":
            end_date = subscription.get("end_date")
            if end_date and end_date > now:
                days_left = (end_date - now).days
                return {
                    "has_subscription": True,
                    "status": "cancelled",
                    "end_date": end_date,
                    "days_left": days_left,
                    "plan_id": subscription.get("plan_id"),
                    "message": f"Abonelik iptal edildi, {days_left} gün kaldı",
                }
            else:
                return {
                    "has_subscription": False,
                    "status": "expired",
                    "end_date": end_date,
                    "plan_id": subscription.get("plan_id"),
                    "message": "Abonelik süresi dolmuş",
                }
        elif subscription.get("status") == "trial":
            trial_end = subscription.get("trial_ends")
            if trial_end and trial_end > now:
                days_left = (trial_end - now).days
                return {
                    "has_subscription": True,
                    "status": "trial",
                    "end_date": trial_end,
                    "days_left": days_left,
                    "message": f"Deneme süresi aktif, {days_left} gün kaldı",
                }
            else:
                return {
                    "has_subscription": False,
                    "status": "trial_expired",
                    "end_date": trial_end,
                    "message": "Deneme süresi dolmuş",
                }
        else:
            return {
                "has_subscription": False,
                "status": "unknown",
                "message": "Bilinmeyen abonelik durumu",
            }
    except Exception as e:
        logger.error(f"Abonelik durumu kontrol hatası (Kullanıcı ID: {user_id}): {e}")
        return {
            "has_subscription": False,
            "status": "error",
            "message": "Abonelik durumu kontrol edilirken bir hata oluştu",
        } 