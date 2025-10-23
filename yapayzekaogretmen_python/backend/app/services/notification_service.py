"""
Notification Service - Multi-channel Notifications
-------------------------------------------------
Push notifications, Email, SMS ve in-app bildirimler.
"""

import asyncio
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from enum import Enum
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import httpx
from jinja2 import Template
from loguru import logger
# Firebase ve Twilio isteğe bağlı
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Admin SDK bulunamadı, push bildirimleri devre dışı")

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio SDK bulunamadı, SMS bildirimleri devre dışı")

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.websocket_manager import websocket_service


class NotificationType(str, Enum):
    """Bildirim tipleri"""
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    WEBHOOK = "webhook"


class NotificationPriority(str, Enum):
    """Bildirim öncelikleri"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationCategory(str, Enum):
    """Bildirim kategorileri"""
    LESSON = "lesson"
    HOMEWORK = "homework"
    EXAM = "exam"
    ACHIEVEMENT = "achievement"
    SYSTEM = "system"
    REMINDER = "reminder"
    MESSAGE = "message"
    ALERT = "alert"


class NotificationService:
    """Çoklu kanal bildirim servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Email konfigürasyonu
        self.smtp_host = getattr(settings, 'SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_user = getattr(settings, 'SMTP_USER', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.smtp_from = getattr(settings, 'SMTP_FROM', 'noreply@yapayzekaogretmen.com')
        
        # SMS konfigürasyonu (Twilio)
        self.twilio_account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        self.twilio_auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        self.twilio_from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')
        self.twilio_client = None
        
        # Firebase konfigürasyonu
        self.firebase_initialized = False
        
        # Email templates
        self.email_templates = self._load_email_templates()
        
        # Notification queue
        self.notification_queue = asyncio.Queue()
        
        logger.info("Notification Service başlatıldı")
    
    async def initialize(self):
        """Servisleri başlat"""
        # Twilio
        if self.twilio_account_sid and self.twilio_auth_token:
            try:
                self.twilio_client = TwilioClient(
                    self.twilio_account_sid,
                    self.twilio_auth_token
                )
                logger.info("Twilio client başlatıldı")
            except Exception as e:
                logger.error(f"Twilio başlatma hatası: {e}")
        
        # Firebase
        firebase_creds_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
        if firebase_creds_path:
            try:
                cred = credentials.Certificate(firebase_creds_path)
                firebase_admin.initialize_app(cred)
                self.firebase_initialized = True
                logger.info("Firebase başlatıldı")
            except Exception as e:
                logger.error(f"Firebase başlatma hatası: {e}")
        
        # Queue processor başlat
        asyncio.create_task(self._process_notification_queue())
    
    def _load_email_templates(self) -> Dict[str, Template]:
        """Email şablonlarını yükle"""
        templates = {
            "welcome": Template("""
                <h2>Hoş Geldiniz {{ user_name }}!</h2>
                <p>Yapay Zeka Öğretmen ailesine katıldığınız için mutluyuz.</p>
                <p>Hemen öğrenmeye başlamak için <a href="{{ app_url }}">buraya tıklayın</a>.</p>
            """),
            
            "lesson_reminder": Template("""
                <h3>Ders Hatırlatması</h3>
                <p>Merhaba {{ user_name }},</p>
                <p><strong>{{ lesson_title }}</strong> dersiniz {{ lesson_time }} saatinde başlayacak.</p>
                <p>Derse katılmak için <a href="{{ lesson_url }}">buraya tıklayın</a>.</p>
            """),
            
            "achievement": Template("""
                <h2>🎉 Tebrikler {{ user_name }}!</h2>
                <p>{{ achievement_name }} başarısını kazandınız!</p>
                <p>{{ achievement_description }}</p>
                <div style="text-align: center; margin: 20px;">
                    <img src="{{ badge_url }}" alt="{{ achievement_name }}" style="width: 150px;">
                </div>
            """),
            
            "homework_due": Template("""
                <h3>⏰ Ödev Hatırlatması</h3>
                <p>{{ user_name }}, <strong>{{ homework_title }}</strong> ödevinizin teslim süresi yaklaşıyor.</p>
                <p>Son teslim: <strong>{{ due_date }}</strong></p>
                <p><a href="{{ homework_url }}">Ödevi görüntüle</a></p>
            """),
            
            "parent_report": Template("""
                <h2>Haftalık İlerleme Raporu</h2>
                <p>Sayın {{ parent_name }},</p>
                <p>{{ student_name }} adlı öğrencinizin bu haftaki performans özeti:</p>
                <ul>
                    <li>Tamamlanan Ders: {{ completed_lessons }}</li>
                    <li>Ortalama Başarı: %{{ average_score }}</li>
                    <li>Çalışma Süresi: {{ study_hours }} saat</li>
                </ul>
                <p>Detaylı rapor için <a href="{{ report_url }}">buraya tıklayın</a>.</p>
            """)
        }
        
        return templates
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: Union[NotificationType, List[NotificationType]],
        category: NotificationCategory = NotificationCategory.SYSTEM,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        data: Optional[Dict] = None,
        template_name: Optional[str] = None,
        template_data: Optional[Dict] = None,
        scheduled_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Bildirim gönder
        
        Args:
            user_id: Kullanıcı ID
            title: Bildirim başlığı
            message: Bildirim mesajı
            notification_type: Bildirim tipi veya tipleri
            category: Bildirim kategorisi
            priority: Öncelik seviyesi
            data: Ek veri
            template_name: Email template adı
            template_data: Template değişkenleri
            scheduled_at: Zamanlanmış gönderim
        
        Returns:
            Gönderim sonucu
        """
        # Notification types listesine çevir
        if isinstance(notification_type, str):
            notification_types = [notification_type]
        else:
            notification_types = notification_type
        
        # Kullanıcı tercihlerini kontrol et
        user_preferences = await self._get_user_preferences(user_id)
        allowed_types = [
            nt for nt in notification_types
            if user_preferences.get(nt, True)
        ]
        
        if not allowed_types:
            logger.info(f"Kullanıcı {user_id} için bildirim tercihleri kapalı")
            return {"success": False, "reason": "user_preferences"}
        
        # Bildirim verisi
        notification_data = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "types": allowed_types,
            "category": category,
            "priority": priority,
            "data": data or {},
            "template_name": template_name,
            "template_data": template_data or {},
            "created_at": datetime.utcnow(),
            "scheduled_at": scheduled_at,
            "status": "pending" if scheduled_at else "sending"
        }
        
        # Veritabanına kaydet
        if self.db:
            result = await self.db.notifications.insert_one(notification_data)
            notification_id = str(result.inserted_id)
            notification_data["_id"] = notification_id
        else:
            notification_id = "temp_id"
        
        # Zamanlanmış ise kuyruğa alma
        if scheduled_at and scheduled_at > datetime.utcnow():
            await self._schedule_notification(notification_data)
            return {
                "success": True,
                "notification_id": notification_id,
                "scheduled": True,
                "scheduled_at": scheduled_at.isoformat()
            }
        
        # Hemen gönder
        await self.notification_queue.put(notification_data)
        
        return {
            "success": True,
            "notification_id": notification_id,
            "types_sent": allowed_types
        }
    
    async def _process_notification_queue(self):
        """Bildirim kuyruğunu işle"""
        while True:
            try:
                # Kuyruktan bildirim al
                notification = await self.notification_queue.get()
                
                # Her tip için gönder
                results = {}
                for notification_type in notification["types"]:
                    try:
                        if notification_type == NotificationType.PUSH:
                            result = await self._send_push_notification(notification)
                        elif notification_type == NotificationType.EMAIL:
                            result = await self._send_email_notification(notification)
                        elif notification_type == NotificationType.SMS:
                            result = await self._send_sms_notification(notification)
                        elif notification_type == NotificationType.IN_APP:
                            result = await self._send_in_app_notification(notification)
                        elif notification_type == NotificationType.WEBHOOK:
                            result = await self._send_webhook_notification(notification)
                        
                        results[notification_type] = result
                    
                    except Exception as e:
                        logger.error(f"{notification_type} gönderim hatası: {e}")
                        results[notification_type] = {"success": False, "error": str(e)}
                
                # Durumu güncelle
                if self.db and "_id" in notification:
                    await self.db.notifications.update_one(
                        {"_id": notification["_id"]},
                        {
                            "$set": {
                                "status": "sent",
                                "sent_at": datetime.utcnow(),
                                "results": results
                            }
                        }
                    )
                
            except Exception as e:
                logger.error(f"Queue processing hatası: {e}")
                await asyncio.sleep(1)
    
    async def _send_push_notification(self, notification: Dict) -> Dict:
        """Push notification gönder (Firebase)"""
        if not self.firebase_initialized:
            return {"success": False, "error": "Firebase not initialized"}
        
        try:
            # Kullanıcının FCM token'larını al
            user_tokens = await self._get_user_fcm_tokens(notification["user_id"])
            if not user_tokens:
                return {"success": False, "error": "No FCM tokens"}
            
            # Firebase message oluştur
            message = messaging.MulticastMessage(
                tokens=user_tokens,
                notification=messaging.Notification(
                    title=notification["title"],
                    body=notification["message"]
                ),
                data={
                    "category": notification["category"],
                    "priority": notification["priority"],
                    **notification.get("data", {})
                },
                android=messaging.AndroidConfig(
                    priority="high" if notification["priority"] in ["high", "urgent"] else "normal",
                    notification=messaging.AndroidNotification(
                        icon="notification_icon",
                        color="#4F46E5",
                        sound="default"
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            badge=1,
                            sound="default",
                            category=notification["category"]
                        )
                    )
                )
            )
            
            # Gönder
            response = messaging.send_multicast(message)
            
            return {
                "success": True,
                "success_count": response.success_count,
                "failure_count": response.failure_count
            }
            
        except Exception as e:
            logger.error(f"Push notification hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_email_notification(self, notification: Dict) -> Dict:
        """Email notification gönder"""
        try:
            # Kullanıcı email'ini al
            user_email = await self._get_user_email(notification["user_id"])
            if not user_email:
                return {"success": False, "error": "No email address"}
            
            # Email oluştur
            msg = MIMEMultipart()
            msg['From'] = self.smtp_from
            msg['To'] = user_email
            msg['Subject'] = notification["title"]
            
            # Template kullan
            if notification.get("template_name") and notification["template_name"] in self.email_templates:
                template = self.email_templates[notification["template_name"]]
                html_content = template.render(**notification.get("template_data", {}))
            else:
                # Basit HTML
                html_content = f"""
                <html>
                <body>
                    <h3>{notification["title"]}</h3>
                    <p>{notification["message"]}</p>
                </body>
                </html>
                """
            
            msg.attach(MIMEText(html_content, 'html'))
            
            # SMTP gönderim
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Email gönderim hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_sms_notification(self, notification: Dict) -> Dict:
        """SMS notification gönder"""
        if not self.twilio_client:
            return {"success": False, "error": "Twilio not configured"}
        
        try:
            # Kullanıcı telefon numarasını al
            phone_number = await self._get_user_phone(notification["user_id"])
            if not phone_number:
                return {"success": False, "error": "No phone number"}
            
            # SMS gönder
            message = self.twilio_client.messages.create(
                body=f"{notification['title']}\n{notification['message']}",
                from_=self.twilio_from_number,
                to=phone_number
            )
            
            return {
                "success": True,
                "message_sid": message.sid
            }
            
        except Exception as e:
            logger.error(f"SMS gönderim hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_in_app_notification(self, notification: Dict) -> Dict:
        """In-app notification (WebSocket)"""
        try:
            # WebSocket üzerinden gönder
            await websocket_service.send_notification(
                user_id=notification["user_id"],
                notification={
                    "id": str(notification.get("_id", "temp")),
                    "title": notification["title"],
                    "message": notification["message"],
                    "category": notification["category"],
                    "priority": notification["priority"],
                    "data": notification.get("data", {}),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Notification center'a kaydet
            if self.db:
                await self.db.notification_center.insert_one({
                    "user_id": notification["user_id"],
                    "title": notification["title"],
                    "message": notification["message"],
                    "category": notification["category"],
                    "priority": notification["priority"],
                    "data": notification.get("data", {}),
                    "created_at": datetime.utcnow(),
                    "read": False,
                    "read_at": None
                })
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"In-app notification hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_webhook_notification(self, notification: Dict) -> Dict:
        """Webhook notification gönder"""
        try:
            # Kullanıcının webhook URL'ini al
            webhook_url = await self._get_user_webhook(notification["user_id"])
            if not webhook_url:
                return {"success": False, "error": "No webhook URL"}
            
            # HTTP POST
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json={
                        "type": "notification",
                        "notification": {
                            "title": notification["title"],
                            "message": notification["message"],
                            "category": notification["category"],
                            "priority": notification["priority"],
                            "data": notification.get("data", {}),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    },
                    timeout=10.0
                )
                
                return {
                    "success": response.status_code < 300,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            logger.error(f"Webhook notification hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_bulk_notification(
        self,
        user_ids: List[str],
        title: str,
        message: str,
        notification_type: Union[NotificationType, List[NotificationType]],
        **kwargs
    ) -> Dict:
        """Toplu bildirim gönder"""
        results = {
            "total": len(user_ids),
            "success": 0,
            "failed": 0,
            "details": []
        }
        
        # Paralel gönderim
        tasks = []
        for user_id in user_ids:
            task = self.send_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                **kwargs
            )
            tasks.append(task)
        
        # Sonuçları topla
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for user_id, response in zip(user_ids, responses):
            if isinstance(response, Exception):
                results["failed"] += 1
                results["details"].append({
                    "user_id": user_id,
                    "error": str(response)
                })
            elif response.get("success"):
                results["success"] += 1
            else:
                results["failed"] += 1
                results["details"].append({
                    "user_id": user_id,
                    "error": response.get("reason", "unknown")
                })
        
        return results
    
    async def mark_as_read(self, user_id: str, notification_ids: List[str]) -> int:
        """Bildirimleri okundu olarak işaretle"""
        if not self.db:
            return 0
        
        result = await self.db.notification_center.update_many(
            {
                "user_id": user_id,
                "_id": {"$in": notification_ids},
                "read": False
            },
            {
                "$set": {
                    "read": True,
                    "read_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        category: Optional[NotificationCategory] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        """Kullanıcı bildirimlerini getir"""
        if not self.db:
            return []
        
        # Query oluştur
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        if category:
            query["category"] = category
        
        # Bildirimleri getir
        notifications = await self.db.notification_center.find(query)\
            .sort("created_at", -1)\
            .skip(offset)\
            .limit(limit)\
            .to_list(limit)
        
        # Format
        for notification in notifications:
            notification["id"] = str(notification.pop("_id"))
        
        return notifications
    
    async def update_user_preferences(
        self,
        user_id: str,
        preferences: Dict[str, bool]
    ) -> bool:
        """Kullanıcı bildirim tercihlerini güncelle"""
        if not self.db:
            return False
        
        await self.db.user_preferences.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "notifications": preferences,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return True
    
    # Helper methods
    async def _get_user_preferences(self, user_id: str) -> Dict[str, bool]:
        """Kullanıcı bildirim tercihlerini al"""
        if not self.db:
            return {}
        
        prefs = await self.db.user_preferences.find_one({"user_id": user_id})
        if prefs:
            return prefs.get("notifications", {})
        
        # Default preferences
        return {
            NotificationType.PUSH: True,
            NotificationType.EMAIL: True,
            NotificationType.SMS: False,  # Default kapalı (ücretli)
            NotificationType.IN_APP: True,
            NotificationType.WEBHOOK: False
        }
    
    async def _get_user_fcm_tokens(self, user_id: str) -> List[str]:
        """Kullanıcının FCM token'larını al"""
        if not self.db:
            return []
        
        user = await self.db.users.find_one({"_id": user_id})
        if user:
            return user.get("fcm_tokens", [])
        return []
    
    async def _get_user_email(self, user_id: str) -> Optional[str]:
        """Kullanıcı email'ini al"""
        if not self.db:
            return None
        
        user = await self.db.users.find_one({"_id": user_id})
        if user:
            return user.get("email")
        return None
    
    async def _get_user_phone(self, user_id: str) -> Optional[str]:
        """Kullanıcı telefon numarasını al"""
        if not self.db:
            return None
        
        user = await self.db.users.find_one({"_id": user_id})
        if user:
            return user.get("phone_number")
        return None
    
    async def _get_user_webhook(self, user_id: str) -> Optional[str]:
        """Kullanıcı webhook URL'ini al"""
        if not self.db:
            return None
        
        prefs = await self.db.user_preferences.find_one({"user_id": user_id})
        if prefs:
            return prefs.get("webhook_url")
        return None
    
    async def _schedule_notification(self, notification: Dict):
        """Bildirimi zamanla"""
        # TODO: APScheduler veya Celery ile implement edilebilir
        logger.info(f"Bildirim zamanlandı: {notification['scheduled_at']}")


# Global notification service instance
notification_service = NotificationService()


# Notification templates
class NotificationTemplates:
    """Hazır bildirim şablonları"""
    
    @staticmethod
    def welcome_notification(user_name: str) -> Dict:
        return {
            "title": "Hoş Geldiniz! 🎉",
            "message": f"Merhaba {user_name}, Yapay Zeka Öğretmen'e hoş geldiniz! Öğrenme yolculuğunuz başlıyor.",
            "category": NotificationCategory.SYSTEM,
            "template_name": "welcome",
            "template_data": {
                "user_name": user_name,
                "app_url": settings.APP_URL
            }
        }
    
    @staticmethod
    def lesson_reminder(user_name: str, lesson_title: str, lesson_time: str) -> Dict:
        return {
            "title": "Ders Hatırlatması 📚",
            "message": f"{lesson_title} dersiniz {lesson_time} saatinde başlayacak.",
            "category": NotificationCategory.LESSON,
            "template_name": "lesson_reminder",
            "template_data": {
                "user_name": user_name,
                "lesson_title": lesson_title,
                "lesson_time": lesson_time,
                "lesson_url": f"{settings.APP_URL}/lessons"
            }
        }
    
    @staticmethod
    def achievement_unlocked(user_name: str, achievement_name: str, achievement_description: str) -> Dict:
        return {
            "title": "Başarı Kazanıldı! 🏆",
            "message": f"Tebrikler! {achievement_name} başarısını kazandınız.",
            "category": NotificationCategory.ACHIEVEMENT,
            "priority": NotificationPriority.HIGH,
            "template_name": "achievement",
            "template_data": {
                "user_name": user_name,
                "achievement_name": achievement_name,
                "achievement_description": achievement_description,
                "badge_url": f"{settings.APP_URL}/assets/badges/{achievement_name.lower().replace(' ', '_')}.png"
            }
        }
    
    @staticmethod
    def homework_due_reminder(user_name: str, homework_title: str, due_date: str) -> Dict:
        return {
            "title": "Ödev Teslim Hatırlatması ⏰",
            "message": f"{homework_title} ödevinizin teslim süresi yaklaşıyor.",
            "category": NotificationCategory.HOMEWORK,
            "priority": NotificationPriority.HIGH,
            "template_name": "homework_due",
            "template_data": {
                "user_name": user_name,
                "homework_title": homework_title,
                "due_date": due_date,
                "homework_url": f"{settings.APP_URL}/homework"
            }
        }
    
    @staticmethod
    def parent_weekly_report(
        parent_name: str,
        student_name: str,
        completed_lessons: int,
        average_score: float,
        study_hours: float
    ) -> Dict:
        return {
            "title": "Haftalık İlerleme Raporu 📊",
            "message": f"{student_name} adlı öğrencinizin haftalık performans raporu hazır.",
            "category": NotificationCategory.SYSTEM,
            "template_name": "parent_report",
            "template_data": {
                "parent_name": parent_name,
                "student_name": student_name,
                "completed_lessons": completed_lessons,
                "average_score": average_score,
                "study_hours": study_hours,
                "report_url": f"{settings.APP_URL}/parent/reports"
            }
        }
