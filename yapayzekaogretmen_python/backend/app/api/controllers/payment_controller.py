"""
Yapay Zeka Öğretmen - Ödeme Controller
-------------------------------------
Ödeme ve abonelik işlemleri için controller fonksiyonları.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from loguru import logger
from bson import ObjectId

from app.db.mongodb import subscriptions_collection, payments_collection, users_collection
from app.models.user import User
from app.services.user_service import get_user_by_id, update_user
from app.core.config import settings


async def get_subscription_plans() -> List[Dict[str, Any]]:
    """
    Abonelik planlarını getir.
    
    Returns:
        Plan listesi
    """
    try:
        # Sabit planları döndür
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
    except Exception as e:
        logger.error(f"Abonelik planları getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Abonelik planları getirilirken bir hata oluştu",
        )


async def create_checkout_session(user_id: str, plan_id: str) -> Dict[str, Any]:
    """
    Ödeme sayfası oluştur.
    
    Args:
        user_id: Kullanıcı ID'si
        plan_id: Plan ID'si
    
    Returns:
        Ödeme sayfası URL'si ve oturum bilgileri
    """
    try:
        # Kullanıcıyı getir
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı",
            )
        
        # Plan bilgisini kontrol et
        plans = await get_subscription_plans()
        selected_plan = None
        for plan in plans:
            if plan["id"] == plan_id:
                selected_plan = plan
                break
        
        if not selected_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Abonelik planı bulunamadı",
            )
        
        # Stripe entegrasyonu (gerçek entegrasyon için Stripe API kullanılmalı)
        # Bu kısım şu an simülasyon amaçlı
        checkout_id = f"cs_{ObjectId()}"
        checkout_url = f"{settings.FRONTEND_URL}/checkout/{checkout_id}"
        
        # Checkout oturumunu kaydet
        checkout_data = {
            "checkout_id": checkout_id,
            "user_id": user_id,
            "plan_id": plan_id,
            "amount": selected_plan["price"],
            "currency": selected_plan["currency"],
            "status": "pending",
            "created_at": datetime.utcnow(),
        }
        
        await payments_collection.insert_one(checkout_data)
        
        return {
            "checkout_url": checkout_url,
            "checkout_id": checkout_id,
            "plan": selected_plan,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ödeme sayfası oluşturma hatası (Kullanıcı ID: {user_id}, Plan ID: {plan_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ödeme sayfası oluşturulurken bir hata oluştu",
        )


async def process_webhook(payload: bytes, signature_header: str) -> Dict[str, Any]:
    """
    Stripe webhook işle.
    
    Args:
        payload: Webhook içeriği
        signature_header: Webhook imzası
    
    Returns:
        İşlem durumu
    """
    try:
        # Bu kısım gerçek uygulamada Stripe webhook doğrulaması içerecek
        import json
        event_data = json.loads(payload)
        
        event_type = event_data.get("type")
        if not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz event tipi",
            )
        
        # Ödeme başarılı ise
        if event_type == "checkout.session.completed":
            checkout_id = event_data.get("data", {}).get("object", {}).get("id")
            if checkout_id:
                # Ödeme kaydını bul ve güncelle
                payment = await payments_collection.find_one({"checkout_id": checkout_id})
                if payment:
                    user_id = payment["user_id"]
                    plan_id = payment["plan_id"]
                    
                    # Ödemeyi tamamlandı olarak işaretle
                    await payments_collection.update_one(
                        {"checkout_id": checkout_id},
                        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
                    )
                    
                    # Kullanıcının aboneliğini güncelle
                    await _update_user_subscription(user_id, plan_id)
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook işleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook işlenirken bir hata oluştu",
        )


async def _update_user_subscription(user_id: str, plan_id: str) -> None:
    """
    Kullanıcının aboneliğini güncelle.
    
    Args:
        user_id: Kullanıcı ID'si
        plan_id: Plan ID'si
    """
    try:
        user = await get_user_by_id(user_id)
        if not user:
            logger.error(f"Abonelik güncellenemedi: Kullanıcı bulunamadı (ID: {user_id})")
            return
        
        now = datetime.utcnow()
        
        # Abonelik süresini hesapla
        if plan_id == "monthly":
            subscription_end = now + timedelta(days=30)
        elif plan_id == "annual":
            subscription_end = now + timedelta(days=365)
        elif plan_id == "school":
            subscription_end = now + timedelta(days=365)
        else:
            subscription_end = now + timedelta(days=30)  # Varsayılan
        
        # Abonelik verisini oluştur
        subscription_data = {
            "plan_id": plan_id,
            "status": "active",
            "start_date": now,
            "end_date": subscription_end,
            "updated_at": now,
        }
        
        # Abonelik koleksiyonuna ekle
        await subscriptions_collection.update_one(
            {"user_id": user_id},
            {"$set": subscription_data},
            upsert=True
        )
        
        # Kullanıcı bilgilerini güncelle
        user.subscription.status = "active"
        user.subscription.plan_id = plan_id
        user.subscription.start_date = now
        user.subscription.end_date = subscription_end
        
        await update_user(user_id, {"subscription": user.subscription.dict()})
    except Exception as e:
        logger.error(f"Kullanıcı aboneliği güncelleme hatası (Kullanıcı ID: {user_id}, Plan ID: {plan_id}): {e}")


async def get_payment_history(user_id: str) -> List[Dict[str, Any]]:
    """
    Kullanıcının ödeme geçmişini getir.
    
    Args:
        user_id: Kullanıcı ID'si
    
    Returns:
        Ödeme geçmişi listesi
    """
    try:
        # Kullanıcı ödemelerini bul
        cursor = payments_collection.find({"user_id": user_id}).sort("created_at", -1)
        payments = []
        async for payment in cursor:
            payment["id"] = str(payment.pop("_id"))
            payments.append(payment)
        
        return payments
    except Exception as e:
        logger.error(f"Ödeme geçmişi getirme hatası (Kullanıcı ID: {user_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ödeme geçmişi getirilirken bir hata oluştu",
        )


async def cancel_subscription(user_id: str) -> Dict[str, Any]:
    """
    Aboneliği iptal et.
    
    Args:
        user_id: Kullanıcı ID'si
    
    Returns:
        İşlem durumu
    """
    try:
        # Kullanıcıyı getir
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı",
            )
        
        # Kullanıcının aktif aboneliği var mı kontrol et
        if not user.subscription or user.subscription.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aktif abonelik bulunamadı",
            )
        
        # Aboneliği güncelle
        user.subscription.status = "cancelled"
        user.subscription.cancel_date = datetime.utcnow()
        
        await update_user(user_id, {"subscription": user.subscription.dict()})
        
        # Abonelik kaydını güncelle
        await subscriptions_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "status": "cancelled",
                "cancel_date": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }}
        )
        
        return {
            "success": True,
            "message": "Abonelik başarıyla iptal edildi",
            "data": {
                "status": "cancelled",
                "end_date": user.subscription.end_date,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Abonelik iptali hatası (Kullanıcı ID: {user_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Abonelik iptal edilirken bir hata oluştu",
        )


async def get_all_subscriptions(skip: int = 0, limit: int = 10, status: Optional[str] = None) -> Dict[str, Any]:
    """
    Tüm abonelikleri getir.
    
    Args:
        skip: Atlanacak kayıt sayısı
        limit: Getirilecek kayıt sayısı
        status: Filtrelenecek abonelik durumu
    
    Returns:
        Abonelik listesi ve toplam sayı
    """
    try:
        # Filtre oluştur
        filter_query = {}
        if status:
            filter_query["status"] = status
        
        # Toplam sayıyı al
        total = await subscriptions_collection.count_documents(filter_query)
        
        # Abonelikleri getir
        cursor = subscriptions_collection.find(filter_query).skip(skip).limit(limit).sort("updated_at", -1)
        subscriptions = []
        
        async for subscription in cursor:
            subscription["id"] = str(subscription.pop("_id"))
            
            # Kullanıcı bilgilerini ekle
            try:
                user_id = subscription.get("user_id")
                if user_id:
                    user = await get_user_by_id(user_id)
                    if user:
                        subscription["user"] = {
                            "id": user_id,
                            "name": user.name,
                            "email": user.email,
                        }
            except:
                pass
            
            subscriptions.append(subscription)
        
        return {
            "data": subscriptions,
            "total": total,
            "page": skip // limit + 1,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"Abonelik listesi getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Abonelikler getirilirken bir hata oluştu",
        ) 