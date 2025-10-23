"""
Notification API Routes
----------------------
Bildirim yönetimi endpoint'leri.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.logger import logger
from app.services.notification_service import (
    notification_service,
    NotificationType,
    NotificationPriority,
    NotificationCategory,
    NotificationTemplates
)
from app.models.user import User


# Basit auth kontrolü (demo için)
async def get_current_user():
    """Basit kullanıcı döndürme (demo için)"""
    return type('User', (), {
        'id': 'demo_user',
        'username': 'demo',
        'role': 'admin',
        'grade_level': 5
    })


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# Request/Response Models
class NotificationRequest(BaseModel):
    """Bildirim gönderme isteği"""
    title: str = Field(..., description="Bildirim başlığı")
    message: str = Field(..., description="Bildirim mesajı")
    notification_types: List[NotificationType] = Field(
        default=[NotificationType.IN_APP],
        description="Bildirim tipleri"
    )
    category: NotificationCategory = Field(
        default=NotificationCategory.SYSTEM,
        description="Bildirim kategorisi"
    )
    priority: NotificationPriority = Field(
        default=NotificationPriority.NORMAL,
        description="Öncelik seviyesi"
    )
    data: Optional[Dict] = Field(None, description="Ek veri")
    scheduled_at: Optional[datetime] = Field(None, description="Zamanlanmış gönderim")


class BulkNotificationRequest(BaseModel):
    """Toplu bildirim isteği"""
    user_ids: List[str] = Field(..., description="Kullanıcı ID listesi")
    title: str
    message: str
    notification_types: List[NotificationType] = [NotificationType.IN_APP]
    category: NotificationCategory = NotificationCategory.SYSTEM
    priority: NotificationPriority = NotificationPriority.NORMAL
    data: Optional[Dict] = None


class NotificationPreferencesUpdate(BaseModel):
    """Bildirim tercihleri güncelleme"""
    push: Optional[bool] = None
    email: Optional[bool] = None
    sms: Optional[bool] = None
    in_app: Optional[bool] = None
    webhook: Optional[bool] = None


class NotificationResponse(BaseModel):
    """Bildirim yanıtı"""
    id: str
    title: str
    message: str
    category: str
    priority: str
    created_at: datetime
    read: bool
    read_at: Optional[datetime] = None


class FCMTokenRequest(BaseModel):
    """FCM Token kayıt"""
    token: str = Field(..., description="Firebase Cloud Messaging token")
    device_type: str = Field("mobile", description="Cihaz tipi: mobile, web")
    device_name: Optional[str] = Field(None, description="Cihaz adı")


@router.post("/send")
async def send_notification(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Bildirim gönder
    
    Desteklenen tipler:
    - push: Firebase Cloud Messaging
    - email: SMTP email
    - sms: Twilio SMS
    - in_app: WebSocket + Notification Center
    - webhook: HTTP webhook
    """
    try:
        result = await notification_service.send_notification(
            user_id=str(current_user.id),
            title=request.title,
            message=request.message,
            notification_type=request.notification_types,
            category=request.category,
            priority=request.priority,
            data=request.data,
            scheduled_at=request.scheduled_at
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Bildirim gönderim hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bildirim gönderilemedi"
        )


@router.post("/send-bulk")
async def send_bulk_notification(
    request: BulkNotificationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Toplu bildirim gönder
    
    Admin yetkisi gerektirir.
    """
    # Yetki kontrolü
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    
    try:
        result = await notification_service.send_bulk_notification(
            user_ids=request.user_ids,
            title=request.title,
            message=request.message,
            notification_type=request.notification_types,
            category=request.category,
            priority=request.priority,
            data=request.data
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Toplu bildirim hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Toplu bildirim gönderilemedi"
        )


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Sadece okunmamışlar"),
    category: Optional[NotificationCategory] = Query(None, description="Kategori filtresi"),
    limit: int = Query(20, ge=1, le=100, description="Limit"),
    offset: int = Query(0, ge=0, description="Offset"),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcı bildirimlerini getir"""
    notifications = await notification_service.get_user_notifications(
        user_id=str(current_user.id),
        unread_only=unread_only,
        category=category,
        limit=limit,
        offset=offset
    )
    
    return [
        NotificationResponse(
            id=n["id"],
            title=n["title"],
            message=n["message"],
            category=n["category"],
            priority=n["priority"],
            created_at=n["created_at"],
            read=n.get("read", False),
            read_at=n.get("read_at")
        )
        for n in notifications
    ]


@router.post("/mark-read")
async def mark_notifications_read(
    notification_ids: List[str],
    current_user: User = Depends(get_current_user)
):
    """Bildirimleri okundu olarak işaretle"""
    count = await notification_service.mark_as_read(
        user_id=str(current_user.id),
        notification_ids=notification_ids
    )
    
    return {
        "success": True,
        "marked_count": count
    }


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """Okunmamış bildirim sayısı"""
    notifications = await notification_service.get_user_notifications(
        user_id=str(current_user.id),
        unread_only=True,
        limit=100
    )
    
    # Kategorilere göre sayım
    counts = {
        "total": len(notifications),
        "by_category": {}
    }
    
    for notification in notifications:
        category = notification.get("category", "system")
        counts["by_category"][category] = counts["by_category"].get(category, 0) + 1
    
    return counts


@router.put("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user)
):
    """Bildirim tercihlerini güncelle"""
    # Mevcut tercihleri al
    current_prefs = await notification_service._get_user_preferences(str(current_user.id))
    
    # Güncelle
    if preferences.push is not None:
        current_prefs[NotificationType.PUSH] = preferences.push
    if preferences.email is not None:
        current_prefs[NotificationType.EMAIL] = preferences.email
    if preferences.sms is not None:
        current_prefs[NotificationType.SMS] = preferences.sms
    if preferences.in_app is not None:
        current_prefs[NotificationType.IN_APP] = preferences.in_app
    if preferences.webhook is not None:
        current_prefs[NotificationType.WEBHOOK] = preferences.webhook
    
    # Kaydet
    success = await notification_service.update_user_preferences(
        user_id=str(current_user.id),
        preferences=current_prefs
    )
    
    if success:
        return {
            "success": True,
            "preferences": current_prefs
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tercihler güncellenemedi"
        )


@router.get("/preferences")
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """Bildirim tercihlerini getir"""
    preferences = await notification_service._get_user_preferences(str(current_user.id))
    
    return {
        "push": preferences.get(NotificationType.PUSH, True),
        "email": preferences.get(NotificationType.EMAIL, True),
        "sms": preferences.get(NotificationType.SMS, False),
        "in_app": preferences.get(NotificationType.IN_APP, True),
        "webhook": preferences.get(NotificationType.WEBHOOK, False)
    }


@router.post("/fcm-token")
async def register_fcm_token(
    request: FCMTokenRequest,
    current_user: User = Depends(get_current_user)
):
    """
    FCM Token kaydet
    
    Push notification için Firebase Cloud Messaging token'ı kaydet.
    """
    # TODO: Token'ı veritabanına kaydet
    return {
        "success": True,
        "message": "FCM token kaydedildi"
    }


@router.delete("/fcm-token/{token}")
async def unregister_fcm_token(
    token: str,
    current_user: User = Depends(get_current_user)
):
    """FCM Token sil"""
    # TODO: Token'ı veritabanından sil
    return {
        "success": True,
        "message": "FCM token silindi"
    }


# Özel bildirim endpoint'leri

@router.post("/send-welcome")
async def send_welcome_notification(
    user_id: str,
    user_name: str,
    current_user: User = Depends(get_current_user)
):
    """Hoşgeldin bildirimi gönder"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin yetkisi gerekli"
        )
    
    template = NotificationTemplates.welcome_notification(user_name)
    
    result = await notification_service.send_notification(
        user_id=user_id,
        title=template["title"],
        message=template["message"],
        notification_type=[NotificationType.EMAIL, NotificationType.IN_APP],
        category=template["category"],
        template_name=template.get("template_name"),
        template_data=template.get("template_data")
    )
    
    return result


@router.post("/send-lesson-reminder")
async def send_lesson_reminder(
    user_id: str,
    user_name: str,
    lesson_title: str,
    lesson_time: str
):
    """Ders hatırlatması gönder"""
    template = NotificationTemplates.lesson_reminder(user_name, lesson_title, lesson_time)
    
    result = await notification_service.send_notification(
        user_id=user_id,
        title=template["title"],
        message=template["message"],
        notification_type=[NotificationType.PUSH, NotificationType.IN_APP],
        category=template["category"],
        template_name=template.get("template_name"),
        template_data=template.get("template_data")
    )
    
    return result


@router.post("/send-achievement")
async def send_achievement_notification(
    user_id: str,
    user_name: str,
    achievement_name: str,
    achievement_description: str
):
    """Başarı bildirimi gönder"""
    template = NotificationTemplates.achievement_unlocked(
        user_name,
        achievement_name,
        achievement_description
    )
    
    result = await notification_service.send_notification(
        user_id=user_id,
        title=template["title"],
        message=template["message"],
        notification_type=[
            NotificationType.PUSH,
            NotificationType.EMAIL,
            NotificationType.IN_APP
        ],
        category=template["category"],
        priority=template["priority"],
        template_name=template.get("template_name"),
        template_data=template.get("template_data")
    )
    
    return result


@router.post("/send-parent-report")
async def send_parent_report(
    parent_id: str,
    parent_name: str,
    student_name: str,
    completed_lessons: int,
    average_score: float,
    study_hours: float
):
    """Veli raporunu gönder"""
    template = NotificationTemplates.parent_weekly_report(
        parent_name,
        student_name,
        completed_lessons,
        average_score,
        study_hours
    )
    
    result = await notification_service.send_notification(
        user_id=parent_id,
        title=template["title"],
        message=template["message"],
        notification_type=[NotificationType.EMAIL],
        category=template["category"],
        template_name=template.get("template_name"),
        template_data=template.get("template_data")
    )
    
    return result


@router.get("/test-notification")
async def test_notification(
    notification_type: NotificationType = Query(..., description="Test edilecek bildirim tipi"),
    current_user: User = Depends(get_current_user)
):
    """
    Bildirim sistemini test et
    
    Farklı bildirim tiplerini test etmek için kullanın.
    """
    test_message = {
        NotificationType.PUSH: "Push notification test mesajı 📱",
        NotificationType.EMAIL: "Email notification test mesajı 📧",
        NotificationType.SMS: "SMS test mesajı 💬",
        NotificationType.IN_APP: "In-app notification test mesajı 🔔",
        NotificationType.WEBHOOK: "Webhook test mesajı 🔗"
    }
    
    result = await notification_service.send_notification(
        user_id=str(current_user.id),
        title=f"{notification_type.value.upper()} Test",
        message=test_message.get(notification_type, "Test mesajı"),
        notification_type=[notification_type],
        category=NotificationCategory.SYSTEM,
        priority=NotificationPriority.LOW,
        data={"test": True, "timestamp": datetime.utcnow().isoformat()}
    )
    
    return {
        "test_type": notification_type,
        "result": result
    }
