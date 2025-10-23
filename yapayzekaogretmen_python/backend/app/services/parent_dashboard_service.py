"""
Parent Dashboard Service - Family Engagement Platform
----------------------------------------------------
Veli takip ve aile katılımı platformu.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, time
from enum import Enum
import asyncio
import uuid
from dataclasses import dataclass, field
from collections import defaultdict
import statistics

from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.notification_service import notification_service, NotificationTemplates
from app.services.adaptive_learning_service import adaptive_learning_service


class ParentRole(str, Enum):
    """Veli rolleri"""
    MOTHER = "mother"
    FATHER = "father"
    GUARDIAN = "guardian"
    RELATIVE = "relative"


class ReportFrequency(str, Enum):
    """Rapor sıklığı"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ON_DEMAND = "on_demand"


class AlertType(str, Enum):
    """Uyarı tipleri"""
    ATTENDANCE = "attendance"          # Devamsızlık
    PERFORMANCE_DROP = "performance"   # Performans düşüşü
    ACHIEVEMENT = "achievement"        # Başarı
    BEHAVIORAL = "behavioral"          # Davranışsal
    HOMEWORK = "homework"             # Ödev
    MILESTONE = "milestone"           # Önemli başarı


class CommunicationChannel(str, Enum):
    """İletişim kanalları"""
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    PUSH = "push"


@dataclass
class ParentProfile:
    """Veli profili"""
    id: str
    user_id: str  # Parent user ID
    student_ids: List[str]  # Bağlı öğrenciler
    role: ParentRole
    full_name: str
    email: str
    phone: Optional[str] = None
    preferences: Dict = field(default_factory=dict)
    notification_settings: Dict = field(default_factory=dict)
    last_login: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class StudentProgress:
    """Öğrenci ilerleme özeti"""
    student_id: str
    period_start: datetime
    period_end: datetime
    attendance_rate: float
    average_score: float
    completed_lessons: int
    total_study_hours: float
    strongest_subjects: List[Dict]
    weakest_subjects: List[Dict]
    achievements: List[Dict]
    behavioral_notes: List[Dict]
    teacher_comments: List[Dict]


@dataclass
class ParentAlert:
    """Veli uyarısı"""
    id: str
    parent_id: str
    student_id: str
    type: AlertType
    severity: str  # low, medium, high, critical
    title: str
    message: str
    data: Dict
    created_at: datetime
    read: bool = False
    acknowledged: bool = False
    action_required: bool = False
    action_url: Optional[str] = None


@dataclass
class ParentTeacherMessage:
    """Veli-öğretmen mesajı"""
    id: str
    sender_id: str
    receiver_id: str
    student_id: str
    subject: str
    message: str
    attachments: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    read: bool = False
    replied: bool = False
    thread_id: Optional[str] = None


@dataclass
class StudySchedule:
    """Çalışma programı"""
    id: str
    student_id: str
    day_of_week: int  # 0-6 (Pazartesi-Pazar)
    start_time: time
    end_time: time
    subject: str
    activity_type: str  # lesson, homework, practice, break
    recurring: bool = True
    parent_approved: bool = False
    reminder_enabled: bool = True


class ParentDashboardService:
    """Veli dashboard servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Varsayılan ayarlar
        self.default_preferences = {
            "report_frequency": ReportFrequency.WEEKLY,
            "report_day": 5,  # Cuma
            "report_time": "18:00",
            "language": "tr",
            "timezone": "Europe/Istanbul"
        }
        
        self.default_notification_settings = {
            "attendance_alerts": True,
            "performance_alerts": True,
            "achievement_alerts": True,
            "homework_alerts": True,
            "daily_summary": False,
            "channels": [CommunicationChannel.IN_APP, CommunicationChannel.EMAIL]
        }
        
        # Performans eşikleri
        self.alert_thresholds = {
            "attendance_warning": 0.85,      # %85 altı devam
            "attendance_critical": 0.70,     # %70 altı devam
            "performance_drop": 0.15,        # %15 düşüş
            "low_homework_completion": 0.80  # %80 altı ödev tamamlama
        }
        
        logger.info("Parent Dashboard Service başlatıldı")
    
    async def create_parent_profile(
        self,
        user_id: str,
        student_ids: List[str],
        role: ParentRole,
        full_name: str,
        email: str,
        phone: Optional[str] = None,
        preferences: Optional[Dict] = None,
        notification_settings: Optional[Dict] = None
    ) -> ParentProfile:
        """Veli profili oluştur"""
        profile = ParentProfile(
            id=f"parent_{uuid.uuid4().hex}",
            user_id=user_id,
            student_ids=student_ids,
            role=role,
            full_name=full_name,
            email=email,
            phone=phone,
            preferences=preferences or self.default_preferences.copy(),
            notification_settings=notification_settings or self.default_notification_settings.copy()
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.parent_profiles.insert_one(profile.__dict__)
        
        # Cache'e kaydet
        cache_key = f"parent_profile:{user_id}"
        await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="parent_dashboard")
        
        # Hoşgeldin bildirimi
        await self._send_welcome_notification(profile)
        
        return profile
    
    async def get_parent_dashboard(
        self,
        parent_id: str,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Veli dashboard verilerini getir"""
        # Veli profili
        profile = await self._get_parent_profile(parent_id)
        if not profile:
            return {"error": "Parent profile not found"}
        
        # Tarih aralığı
        if not date_range:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=7)  # Son 7 gün
            date_range = (start_date, end_date)
        
        # Her öğrenci için veri topla
        students_data = []
        for student_id in profile.student_ids:
            student_data = await self._get_student_dashboard_data(
                student_id,
                date_range
            )
            students_data.append(student_data)
        
        # Aktif uyarılar
        alerts = await self._get_active_alerts(parent_id)
        
        # Yaklaşan etkinlikler
        upcoming_events = await self._get_upcoming_events(profile.student_ids)
        
        # Özet istatistikler
        summary = self._calculate_summary_stats(students_data)
        
        return {
            "profile": {
                "id": profile.id,
                "name": profile.full_name,
                "role": profile.role,
                "last_login": profile.last_login
            },
            "students": students_data,
            "alerts": alerts,
            "upcoming_events": upcoming_events,
            "summary": summary,
            "date_range": {
                "start": date_range[0].isoformat(),
                "end": date_range[1].isoformat()
            }
        }
    
    async def _get_student_dashboard_data(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> Dict[str, Any]:
        """Öğrenci dashboard verilerini getir"""
        # Öğrenci bilgileri
        student = await self._get_student_info(student_id)
        
        # Devam durumu
        attendance = await self._calculate_attendance(student_id, date_range)
        
        # Akademik performans
        performance = await self._get_academic_performance(student_id, date_range)
        
        # Son aktiviteler
        recent_activities = await self._get_recent_activities(student_id, limit=10)
        
        # Ödev durumu
        homework_status = await self._get_homework_status(student_id)
        
        # Davranış notları
        behavioral_notes = await self._get_behavioral_notes(student_id, date_range)
        
        # Öğrenme içgörüleri (Adaptive Learning Service'den)
        learning_insights = await adaptive_learning_service.get_learning_insights(
            user_id=student_id,
            time_period_days=(date_range[1] - date_range[0]).days
        )
        
        return {
            "student": student,
            "attendance": attendance,
            "performance": performance,
            "recent_activities": recent_activities,
            "homework_status": homework_status,
            "behavioral_notes": behavioral_notes,
            "learning_insights": learning_insights,
            "last_active": await self._get_last_active_time(student_id)
        }
    
    async def generate_progress_report(
        self,
        parent_id: str,
        student_id: str,
        period: str = "weekly"  # daily, weekly, monthly, custom
    ) -> StudentProgress:
        """İlerleme raporu oluştur"""
        # Tarih aralığını belirle
        end_date = datetime.utcnow()
        if period == "daily":
            start_date = end_date - timedelta(days=1)
        elif period == "weekly":
            start_date = end_date - timedelta(weeks=1)
        elif period == "monthly":
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date - timedelta(weeks=1)  # Default
        
        # Verileri topla
        attendance_rate = await self._calculate_attendance_rate(
            student_id,
            (start_date, end_date)
        )
        
        academic_data = await self._collect_academic_data(
            student_id,
            (start_date, end_date)
        )
        
        achievements = await self._get_achievements(
            student_id,
            (start_date, end_date)
        )
        
        behavioral_notes = await self._get_behavioral_notes(
            student_id,
            (start_date, end_date)
        )
        
        teacher_comments = await self._get_teacher_comments(
            student_id,
            (start_date, end_date)
        )
        
        # İlerleme raporu oluştur
        progress = StudentProgress(
            student_id=student_id,
            period_start=start_date,
            period_end=end_date,
            attendance_rate=attendance_rate,
            average_score=academic_data["average_score"],
            completed_lessons=academic_data["completed_lessons"],
            total_study_hours=academic_data["total_study_hours"],
            strongest_subjects=academic_data["strongest_subjects"],
            weakest_subjects=academic_data["weakest_subjects"],
            achievements=achievements,
            behavioral_notes=behavioral_notes,
            teacher_comments=teacher_comments
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.progress_reports.insert_one({
                **progress.__dict__,
                "parent_id": parent_id,
                "generated_at": datetime.utcnow()
            })
        
        return progress
    
    async def send_progress_report(
        self,
        parent_id: str,
        student_id: str,
        report: StudentProgress,
        channels: Optional[List[CommunicationChannel]] = None
    ):
        """İlerleme raporunu gönder"""
        profile = await self._get_parent_profile(parent_id)
        if not profile:
            return
        
        # Gönderim kanalları
        if not channels:
            channels = profile.notification_settings.get(
                "channels",
                [CommunicationChannel.EMAIL]
            )
        
        # Rapor formatla
        report_content = self._format_progress_report(report)
        
        # Her kanal için gönder
        for channel in channels:
            if channel == CommunicationChannel.EMAIL:
                await self._send_email_report(
                    profile.email,
                    report_content,
                    student_id
                )
            
            elif channel == CommunicationChannel.IN_APP:
                await notification_service.send_notification(
                    user_id=parent_id,
                    title="Haftalık İlerleme Raporu",
                    message="Çocuğunuzun haftalık ilerleme raporu hazır",
                    notification_type=["in_app"],
                    data={"report_id": f"report_{uuid.uuid4().hex}"}
                )
            
            elif channel == CommunicationChannel.SMS and profile.phone:
                # SMS özeti
                sms_content = self._format_sms_summary(report)
                await self._send_sms(profile.phone, sms_content)
    
    async def create_alert(
        self,
        parent_id: str,
        student_id: str,
        alert_type: AlertType,
        severity: str,
        title: str,
        message: str,
        data: Optional[Dict] = None,
        action_required: bool = False,
        action_url: Optional[str] = None
    ) -> ParentAlert:
        """Veli uyarısı oluştur"""
        alert = ParentAlert(
            id=f"alert_{uuid.uuid4().hex}",
            parent_id=parent_id,
            student_id=student_id,
            type=alert_type,
            severity=severity,
            title=title,
            message=message,
            data=data or {},
            created_at=datetime.utcnow(),
            action_required=action_required,
            action_url=action_url
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.parent_alerts.insert_one(alert.__dict__)
        
        # Bildirim gönder
        await self._send_alert_notification(alert)
        
        return alert
    
    async def update_study_schedule(
        self,
        parent_id: str,
        student_id: str,
        schedule: List[Dict]
    ) -> bool:
        """Çalışma programını güncelle"""
        # Yetki kontrolü
        profile = await self._get_parent_profile(parent_id)
        if not profile or student_id not in profile.student_ids:
            return False
        
        # Mevcut programı sil
        if self.db:
            await self.db.study_schedules.delete_many({
                "student_id": student_id,
                "parent_approved": True
            })
        
        # Yeni programı kaydet
        for item in schedule:
            schedule_item = StudySchedule(
                id=f"schedule_{uuid.uuid4().hex}",
                student_id=student_id,
                day_of_week=item["day_of_week"],
                start_time=time.fromisoformat(item["start_time"]),
                end_time=time.fromisoformat(item["end_time"]),
                subject=item["subject"],
                activity_type=item.get("activity_type", "lesson"),
                parent_approved=True
            )
            
            if self.db:
                await self.db.study_schedules.insert_one(schedule_item.__dict__)
        
        # Öğrenciye bildirim
        await notification_service.send_notification(
            user_id=student_id,
            title="Çalışma Programın Güncellendi",
            message="Velin yeni çalışma programını onayladı",
            notification_type=["in_app"],
            data={"parent_id": parent_id}
        )
        
        return True
    
    async def send_message_to_teacher(
        self,
        parent_id: str,
        teacher_id: str,
        student_id: str,
        subject: str,
        message: str,
        attachments: Optional[List[Dict]] = None
    ) -> ParentTeacherMessage:
        """Öğretmene mesaj gönder"""
        msg = ParentTeacherMessage(
            id=f"msg_{uuid.uuid4().hex}",
            sender_id=parent_id,
            receiver_id=teacher_id,
            student_id=student_id,
            subject=subject,
            message=message,
            attachments=attachments or []
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.parent_teacher_messages.insert_one(msg.__dict__)
        
        # Öğretmene bildirim
        await notification_service.send_notification(
            user_id=teacher_id,
            title="Yeni Veli Mesajı",
            message=f"{subject[:50]}...",
            notification_type=["in_app", "email"],
            data={
                "message_id": msg.id,
                "parent_id": parent_id,
                "student_id": student_id
            }
        )
        
        return msg
    
    async def get_attendance_calendar(
        self,
        parent_id: str,
        student_id: str,
        month: Optional[int] = None,
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """Devam takvimi getir"""
        # Yetki kontrolü
        profile = await self._get_parent_profile(parent_id)
        if not profile or student_id not in profile.student_ids:
            return {"error": "Unauthorized"}
        
        # Tarih parametreleri
        now = datetime.utcnow()
        target_month = month or now.month
        target_year = year or now.year
        
        # Ay başı ve sonu
        start_date = datetime(target_year, target_month, 1)
        if target_month == 12:
            end_date = datetime(target_year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(target_year, target_month + 1, 1) - timedelta(days=1)
        
        # Devam kayıtları
        attendance_records = await self._get_attendance_records(
            student_id,
            (start_date, end_date)
        )
        
        # Takvim formatına dönüştür
        calendar_data = self._format_attendance_calendar(
            attendance_records,
            target_month,
            target_year
        )
        
        return calendar_data
    
    async def set_screen_time_limits(
        self,
        parent_id: str,
        student_id: str,
        limits: Dict[str, int]  # {"daily_minutes": 120, "session_minutes": 30}
    ) -> bool:
        """Ekran süresi limitleri belirle"""
        # Yetki kontrolü
        profile = await self._get_parent_profile(parent_id)
        if not profile or student_id not in profile.student_ids:
            return False
        
        if self.db:
            await self.db.screen_time_limits.update_one(
                {"student_id": student_id},
                {
                    "$set": {
                        **limits,
                        "set_by": parent_id,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
        
        # Öğrenciye bildirim
        await notification_service.send_notification(
            user_id=student_id,
            title="Ekran Süresi Limitleri Güncellendi",
            message=f"Günlük limit: {limits.get('daily_minutes', 120)} dakika",
            notification_type=["in_app"],
            data=limits
        )
        
        return True
    
    async def get_content_restrictions(
        self,
        parent_id: str,
        student_id: str
    ) -> Dict[str, Any]:
        """İçerik kısıtlamalarını getir"""
        if not self.db:
            return {}
        
        restrictions = await self.db.content_restrictions.find_one({
            "student_id": student_id,
            "parent_id": parent_id
        })
        
        if not restrictions:
            # Varsayılan kısıtlamalar
            restrictions = {
                "age_appropriate_only": True,
                "blocked_subjects": [],
                "allowed_hours": {
                    "weekday": {"start": "15:00", "end": "21:00"},
                    "weekend": {"start": "09:00", "end": "22:00"}
                },
                "require_approval_for": ["external_links", "downloads"]
            }
        
        return restrictions
    
    async def approve_content(
        self,
        parent_id: str,
        content_id: str,
        approved: bool,
        reason: Optional[str] = None
    ) -> bool:
        """İçerik onayı"""
        if self.db:
            await self.db.content_approvals.insert_one({
                "parent_id": parent_id,
                "content_id": content_id,
                "approved": approved,
                "reason": reason,
                "timestamp": datetime.utcnow()
            })
        
        return True
    
    # Yardımcı metodlar
    
    async def _get_parent_profile(self, parent_id: str) -> Optional[ParentProfile]:
        """Veli profilini getir"""
        # Cache'den kontrol
        cache_key = f"parent_profile:{parent_id}"
        cached = await cache.get(cache_key, namespace="parent_dashboard")
        
        if cached:
            return ParentProfile(**cached)
        
        if self.db:
            profile_data = await self.db.parent_profiles.find_one({
                "user_id": parent_id
            })
            if profile_data:
                profile = ParentProfile(**profile_data)
                await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="parent_dashboard")
                return profile
        
        return None
    
    async def _get_student_info(self, student_id: str) -> Dict:
        """Öğrenci bilgilerini getir"""
        if self.db:
            student = await self.db.users.find_one({"_id": student_id})
            if student:
                return {
                    "id": student_id,
                    "name": student.get("full_name", "Öğrenci"),
                    "grade_level": student.get("grade_level", 0),
                    "school": student.get("school", ""),
                    "avatar_url": student.get("avatar_url")
                }
        
        return {
            "id": student_id,
            "name": "Öğrenci",
            "grade_level": 0
        }
    
    async def _calculate_attendance(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> Dict:
        """Devam durumunu hesapla"""
        if not self.db:
            return {"rate": 1.0, "present_days": 0, "total_days": 0}
        
        # Devam kayıtları
        attendance_records = await self.db.attendance.count_documents({
            "student_id": student_id,
            "date": {
                "$gte": date_range[0],
                "$lte": date_range[1]
            },
            "status": "present"
        })
        
        # Toplam okul günü (hafta içi)
        total_days = 0
        current = date_range[0]
        while current <= date_range[1]:
            if current.weekday() < 5:  # Pazartesi-Cuma
                total_days += 1
            current += timedelta(days=1)
        
        rate = attendance_records / total_days if total_days > 0 else 1.0
        
        return {
            "rate": rate,
            "present_days": attendance_records,
            "total_days": total_days,
            "absent_days": total_days - attendance_records
        }
    
    async def _get_academic_performance(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> Dict:
        """Akademik performans verilerini getir"""
        if not self.db:
            return self._get_demo_performance()
        
        # Quiz ve ödev skorları
        scores = []
        async for activity in self.db.learning_activities.find({
            "student_id": student_id,
            "timestamp": {
                "$gte": date_range[0],
                "$lte": date_range[1]
            },
            "score": {"$exists": True}
        }):
            scores.append(activity["score"])
        
        # Ortalama hesapla
        avg_score = statistics.mean(scores) if scores else 0
        
        # Konu bazlı performans
        subject_scores = defaultdict(list)
        async for activity in self.db.learning_activities.find({
            "student_id": student_id,
            "timestamp": {
                "$gte": date_range[0],
                "$lte": date_range[1]
            }
        }):
            if "subject" in activity and "score" in activity:
                subject_scores[activity["subject"]].append(activity["score"])
        
        # Konu ortalamaları
        subject_averages = {
            subject: statistics.mean(scores)
            for subject, scores in subject_scores.items()
        }
        
        return {
            "average_score": avg_score,
            "total_activities": len(scores),
            "subject_performance": subject_averages,
            "trend": self._calculate_trend(scores)
        }
    
    def _get_demo_performance(self) -> Dict:
        """Demo performans verileri"""
        return {
            "average_score": 0.82,
            "total_activities": 24,
            "subject_performance": {
                "matematik": 0.78,
                "fen": 0.85,
                "türkçe": 0.83,
                "sosyal": 0.81
            },
            "trend": "improving"
        }
    
    def _calculate_trend(self, scores: List[float]) -> str:
        """Performans trendini hesapla"""
        if len(scores) < 2:
            return "stable"
        
        # İlk yarı ve son yarı ortalamalarını karşılaştır
        mid = len(scores) // 2
        first_half = statistics.mean(scores[:mid])
        second_half = statistics.mean(scores[mid:])
        
        diff = second_half - first_half
        if diff > 0.05:
            return "improving"
        elif diff < -0.05:
            return "declining"
        else:
            return "stable"
    
    async def _get_recent_activities(
        self,
        student_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Son aktiviteleri getir"""
        if not self.db:
            return []
        
        activities = []
        cursor = self.db.student_activities.find({
            "student_id": student_id
        }).sort("timestamp", -1).limit(limit)
        
        async for activity in cursor:
            activities.append({
                "type": activity["type"],
                "title": activity.get("title", ""),
                "timestamp": activity["timestamp"],
                "duration": activity.get("duration", 0),
                "score": activity.get("score")
            })
        
        return activities
    
    async def _get_homework_status(self, student_id: str) -> Dict:
        """Ödev durumunu getir"""
        if not self.db:
            return {
                "pending": 0,
                "completed": 0,
                "overdue": 0,
                "completion_rate": 1.0
            }
        
        now = datetime.utcnow()
        
        # Ödev sayıları
        pending = await self.db.homeworks.count_documents({
            "student_id": student_id,
            "status": "pending",
            "due_date": {"$gt": now}
        })
        
        completed = await self.db.homeworks.count_documents({
            "student_id": student_id,
            "status": "completed"
        })
        
        overdue = await self.db.homeworks.count_documents({
            "student_id": student_id,
            "status": "pending",
            "due_date": {"$lt": now}
        })
        
        total = pending + completed + overdue
        completion_rate = completed / total if total > 0 else 1.0
        
        return {
            "pending": pending,
            "completed": completed,
            "overdue": overdue,
            "completion_rate": completion_rate,
            "total": total
        }
    
    async def _get_behavioral_notes(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> List[Dict]:
        """Davranış notlarını getir"""
        if not self.db:
            return []
        
        notes = []
        cursor = self.db.behavioral_notes.find({
            "student_id": student_id,
            "date": {
                "$gte": date_range[0],
                "$lte": date_range[1]
            }
        }).sort("date", -1)
        
        async for note in cursor:
            notes.append({
                "date": note["date"],
                "type": note.get("type", "general"),  # positive, negative, neutral
                "note": note["note"],
                "teacher_id": note.get("teacher_id"),
                "subject": note.get("subject")
            })
        
        return notes
    
    async def _get_last_active_time(self, student_id: str) -> Optional[datetime]:
        """Son aktif zamanı getir"""
        if not self.db:
            return None
        
        last_activity = await self.db.user_sessions.find_one(
            {"user_id": student_id},
            sort=[("last_activity", -1)]
        )
        
        if last_activity:
            return last_activity["last_activity"]
        
        return None
    
    async def _send_welcome_notification(self, profile: ParentProfile):
        """Hoşgeldin bildirimi gönder"""
        # TODO: Notification template
        pass
    
    def _calculate_summary_stats(
        self,
        students_data: List[Dict]
    ) -> Dict:
        """Özet istatistikleri hesapla"""
        if not students_data:
            return {}
        
        # Ortalamalar
        avg_attendance = statistics.mean(
            s["attendance"]["rate"] for s in students_data
        )
        
        avg_performance = statistics.mean(
            s["performance"]["average_score"] for s in students_data
            if s["performance"]["average_score"] > 0
        )
        
        total_activities = sum(
            s["performance"]["total_activities"] for s in students_data
        )
        
        # Uyarı gerektiren durumlar
        alerts_needed = []
        
        for student in students_data:
            # Devamsızlık uyarısı
            if student["attendance"]["rate"] < self.alert_thresholds["attendance_warning"]:
                alerts_needed.append({
                    "type": "attendance",
                    "student_id": student["student"]["id"],
                    "value": student["attendance"]["rate"]
                })
            
            # Ödev uyarısı
            if student["homework_status"]["completion_rate"] < self.alert_thresholds["low_homework_completion"]:
                alerts_needed.append({
                    "type": "homework",
                    "student_id": student["student"]["id"],
                    "value": student["homework_status"]["completion_rate"]
                })
        
        return {
            "average_attendance": avg_attendance,
            "average_performance": avg_performance,
            "total_activities": total_activities,
            "alerts_needed": alerts_needed,
            "student_count": len(students_data)
        }
    
    async def _get_active_alerts(self, parent_id: str) -> List[Dict]:
        """Aktif uyarıları getir"""
        if not self.db:
            return []
        
        alerts = []
        cursor = self.db.parent_alerts.find({
            "parent_id": parent_id,
            "acknowledged": False
        }).sort("created_at", -1).limit(10)
        
        async for alert in cursor:
            alerts.append({
                "id": alert["id"],
                "type": alert["type"],
                "severity": alert["severity"],
                "title": alert["title"],
                "message": alert["message"],
                "student_id": alert["student_id"],
                "created_at": alert["created_at"],
                "action_required": alert.get("action_required", False),
                "action_url": alert.get("action_url")
            })
        
        return alerts
    
    async def _get_upcoming_events(
        self,
        student_ids: List[str]
    ) -> List[Dict]:
        """Yaklaşan etkinlikleri getir"""
        if not self.db:
            return []
        
        # Önümüzdeki 7 gün
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=7)
        
        events = []
        
        # Ödevler
        async for homework in self.db.homeworks.find({
            "student_id": {"$in": student_ids},
            "due_date": {
                "$gte": start_date,
                "$lte": end_date
            },
            "status": "pending"
        }):
            events.append({
                "type": "homework",
                "title": homework["title"],
                "date": homework["due_date"],
                "student_id": homework["student_id"]
            })
        
        # Sınavlar
        async for exam in self.db.exams.find({
            "student_ids": {"$in": student_ids},
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }):
            events.append({
                "type": "exam",
                "title": exam["title"],
                "date": exam["date"],
                "subject": exam["subject"]
            })
        
        # Tarihe göre sırala
        events.sort(key=lambda x: x["date"])
        
        return events[:10]  # İlk 10 etkinlik
    
    async def _calculate_attendance_rate(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> float:
        """Devam oranını hesapla"""
        attendance = await self._calculate_attendance(student_id, date_range)
        return attendance["rate"]
    
    async def _collect_academic_data(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> Dict:
        """Akademik verileri topla"""
        performance = await self._get_academic_performance(student_id, date_range)
        
        # Adaptive learning'den veri al
        learning_profile = await adaptive_learning_service.get_or_create_learning_profile(student_id)
        
        # En güçlü ve zayıf konular
        skill_tree = learning_profile.skill_tree
        sorted_skills = sorted(skill_tree.items(), key=lambda x: x[1], reverse=True)
        
        strongest_subjects = [
            {"subject": skill[0], "score": skill[1]}
            for skill in sorted_skills[:3]
        ]
        
        weakest_subjects = [
            {"subject": skill[0], "score": skill[1]}
            for skill in sorted_skills[-3:] if skill[1] < 0.6
        ]
        
        # Toplam çalışma saati (demo)
        total_study_hours = await self._calculate_study_hours(student_id, date_range)
        
        return {
            "average_score": performance["average_score"],
            "completed_lessons": performance["total_activities"],
            "total_study_hours": total_study_hours,
            "strongest_subjects": strongest_subjects,
            "weakest_subjects": weakest_subjects,
            "subject_performance": performance["subject_performance"]
        }
    
    async def _calculate_study_hours(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> float:
        """Çalışma saatlerini hesapla"""
        if not self.db:
            return 0.0
        
        # Oturum sürelerini topla
        total_minutes = 0
        async for session in self.db.study_sessions.find({
            "student_id": student_id,
            "start_time": {"$gte": date_range[0]},
            "end_time": {"$lte": date_range[1]}
        }):
            duration = (session["end_time"] - session["start_time"]).total_seconds() / 60
            total_minutes += duration
        
        return total_minutes / 60  # Saate çevir
    
    async def _get_achievements(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> List[Dict]:
        """Başarıları getir"""
        # TODO: Gamification service'den çek
        return []
    
    async def _get_teacher_comments(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> List[Dict]:
        """Öğretmen yorumlarını getir"""
        if not self.db:
            return []
        
        comments = []
        async for comment in self.db.teacher_comments.find({
            "student_id": student_id,
            "date": {
                "$gte": date_range[0],
                "$lte": date_range[1]
            }
        }).sort("date", -1):
            comments.append({
                "date": comment["date"],
                "teacher_id": comment["teacher_id"],
                "subject": comment.get("subject"),
                "comment": comment["comment"],
                "type": comment.get("type", "general")  # academic, behavioral, general
            })
        
        return comments
    
    def _format_progress_report(self, report: StudentProgress) -> Dict:
        """İlerleme raporunu formatla"""
        return {
            "period": f"{report.period_start.strftime('%d.%m.%Y')} - {report.period_end.strftime('%d.%m.%Y')}",
            "attendance": {
                "rate": f"%{int(report.attendance_rate * 100)}",
                "status": "İyi" if report.attendance_rate >= 0.9 else "Dikkat"
            },
            "academic": {
                "average": f"%{int(report.average_score * 100)}",
                "lessons": report.completed_lessons,
                "hours": f"{report.total_study_hours:.1f} saat"
            },
            "strengths": report.strongest_subjects,
            "improvements": report.weakest_subjects,
            "achievements": len(report.achievements),
            "teacher_feedback": len(report.teacher_comments)
        }
    
    def _format_sms_summary(self, report: StudentProgress) -> str:
        """SMS özeti formatla"""
        return (
            f"Haftalık Özet: "
            f"Devam %{int(report.attendance_rate * 100)}, "
            f"Başarı %{int(report.average_score * 100)}, "
            f"{report.completed_lessons} ders tamamlandı."
        )
    
    async def _send_email_report(
        self,
        email: str,
        content: Dict,
        student_id: str
    ):
        """Email raporu gönder"""
        # TODO: Email service entegrasyonu
        pass
    
    async def _send_sms(self, phone: str, content: str):
        """SMS gönder"""
        # TODO: SMS service entegrasyonu
        pass
    
    async def _send_alert_notification(self, alert: ParentAlert):
        """Uyarı bildirimi gönder"""
        # Severity'ye göre kanal belirle
        channels = ["in_app"]
        if alert.severity in ["high", "critical"]:
            channels.extend(["push", "email"])
        
        await notification_service.send_notification(
            user_id=alert.parent_id,
            title=alert.title,
            message=alert.message,
            notification_type=channels,
            data={
                "alert_id": alert.id,
                "type": alert.type,
                "severity": alert.severity,
                "student_id": alert.student_id
            }
        )
    
    def _format_attendance_calendar(
        self,
        records: List[Dict],
        month: int,
        year: int
    ) -> Dict:
        """Devam kayıtlarını takvim formatına dönüştür"""
        # TODO: Calendar formatting
        return {
            "month": month,
            "year": year,
            "days": records
        }
    
    async def _get_attendance_records(
        self,
        student_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> List[Dict]:
        """Devam kayıtlarını getir"""
        if not self.db:
            return []
        
        records = []
        async for record in self.db.attendance.find({
            "student_id": student_id,
            "date": {
                "$gte": date_range[0],
                "$lte": date_range[1]
            }
        }):
            records.append({
                "date": record["date"],
                "status": record["status"],
                "check_in": record.get("check_in"),
                "check_out": record.get("check_out")
            })
        
        return records


# Global parent dashboard service instance
parent_dashboard_service = ParentDashboardService()


# Helper functions
async def create_parent_account(
    email: str,
    student_ids: List[str],
    role: ParentRole = ParentRole.MOTHER
) -> ParentProfile:
    """Veli hesabı oluştur"""
    # TODO: User creation logic
    user_id = f"parent_{uuid.uuid4().hex}"
    
    return await parent_dashboard_service.create_parent_profile(
        user_id=user_id,
        student_ids=student_ids,
        role=role,
        full_name=email.split("@")[0],
        email=email
    )


async def send_daily_summary(parent_id: str):
    """Günlük özet gönder"""
    profile = await parent_dashboard_service._get_parent_profile(parent_id)
    if not profile:
        return
    
    # Her öğrenci için özet oluştur
    for student_id in profile.student_ids:
        # Bugünün verileri
        today = datetime.utcnow()
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Özet rapor oluştur
        report = await parent_dashboard_service.generate_progress_report(
            parent_id=parent_id,
            student_id=student_id,
            period="daily"
        )
        
        # Gönder
        await parent_dashboard_service.send_progress_report(
            parent_id=parent_id,
            student_id=student_id,
            report=report,
            channels=[CommunicationChannel.EMAIL]
        )
