"""
Study Planner Service - AI-Powered Study Planning
------------------------------------------------
AI destekli kişiselleştirilmiş çalışma planı servisi.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, time, date
from enum import Enum
import asyncio
from dataclasses import dataclass, field
from collections import defaultdict
import uuid

from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.adaptive_learning_service import adaptive_learning_service
from app.services.ai_service import ai_service
from app.services.notification_service import notification_service


class StudySessionType(str, Enum):
    """Çalışma oturumu tipleri"""
    LESSON = "lesson"
    HOMEWORK = "homework"
    REVIEW = "review"
    PRACTICE = "practice"
    EXAM_PREP = "exam_prep"
    PROJECT = "project"
    BREAK = "break"


class PriorityLevel(str, Enum):
    """Öncelik seviyeleri"""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class StudyTechnique(str, Enum):
    """Çalışma teknikleri"""
    POMODORO = "pomodoro"          # 25 dk çalışma, 5 dk mola
    TIMEBOXING = "timeboxing"      # Sabit zaman blokları
    SPACED_REPETITION = "spaced"   # Aralıklı tekrar
    ACTIVE_RECALL = "active"       # Aktif hatırlama
    FEYNMAN = "feynman"           # Feynman tekniği


class TimeSlotPreference(str, Enum):
    """Zaman dilimi tercihleri"""
    EARLY_MORNING = "early_morning"  # 06:00-09:00
    MORNING = "morning"              # 09:00-12:00
    AFTERNOON = "afternoon"          # 12:00-17:00
    EVENING = "evening"              # 17:00-21:00
    NIGHT = "night"                  # 21:00-23:00


@dataclass
class StudyPlan:
    """Çalışma planı"""
    id: str
    user_id: str
    start_date: date
    end_date: date
    goals: List[Dict]
    daily_study_hours: float
    preferred_times: List[TimeSlotPreference]
    subjects: List[Dict]  # {subject, priority, weekly_hours}
    study_technique: StudyTechnique
    sessions: List['StudySession'] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True


@dataclass
class StudySession:
    """Çalışma oturumu"""
    id: str
    plan_id: str
    user_id: str
    subject: str
    topic: str
    session_type: StudySessionType
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    priority: PriorityLevel
    technique: StudyTechnique
    materials: List[Dict] = field(default_factory=list)
    reminders: List[datetime] = field(default_factory=list)
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    completed: bool = False
    productivity_score: Optional[float] = None
    notes: Optional[str] = None


@dataclass
class StudyGoal:
    """Çalışma hedefi"""
    id: str
    user_id: str
    title: str
    description: str
    target_date: date
    subject: Optional[str] = None
    measurable_target: Dict = field(default_factory=dict)  # {metric: value}
    progress: float = 0.0
    milestones: List[Dict] = field(default_factory=list)
    is_achieved: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ProductivityMetrics:
    """Verimlilik metrikleri"""
    user_id: str
    period_start: date
    period_end: date
    total_planned_hours: float
    total_actual_hours: float
    completion_rate: float
    average_focus_score: float
    most_productive_time: TimeSlotPreference
    most_productive_day: str
    subject_distribution: Dict[str, float]
    technique_effectiveness: Dict[StudyTechnique, float]


class StudyPlannerService:
    """Çalışma planlama servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Varsayılan ayarlar
        self.default_settings = {
            "min_session_duration": 15,      # dakika
            "max_session_duration": 120,     # dakika
            "pomodoro_work": 25,            # dakika
            "pomodoro_short_break": 5,      # dakika
            "pomodoro_long_break": 15,      # dakika
            "daily_study_limit": 6,         # saat
            "break_ratio": 0.2              # %20 mola
        }
        
        # Zaman dilimi tanımları
        self.time_slots = {
            TimeSlotPreference.EARLY_MORNING: (6, 9),
            TimeSlotPreference.MORNING: (9, 12),
            TimeSlotPreference.AFTERNOON: (12, 17),
            TimeSlotPreference.EVENING: (17, 21),
            TimeSlotPreference.NIGHT: (21, 23)
        }
        
        # Konu zorluğu çarpanları
        self.difficulty_multipliers = {
            "easy": 0.8,
            "medium": 1.0,
            "hard": 1.3,
            "very_hard": 1.5
        }
        
        logger.info("Study Planner Service başlatıldı")
    
    async def create_study_plan(
        self,
        user_id: str,
        goals: List[Dict],
        duration_weeks: int = 4,
        daily_hours: float = 2.0,
        preferred_times: Optional[List[TimeSlotPreference]] = None,
        subjects: Optional[List[Dict]] = None,
        technique: StudyTechnique = StudyTechnique.POMODORO
    ) -> StudyPlan:
        """
        AI destekli çalışma planı oluştur
        
        Args:
            user_id: Kullanıcı ID
            goals: Hedefler listesi
            duration_weeks: Plan süresi (hafta)
            daily_hours: Günlük çalışma saati
            preferred_times: Tercih edilen zaman dilimleri
            subjects: Ders listesi ve öncelikleri
            technique: Çalışma tekniği
        """
        # Kullanıcı profili ve öğrenme verilerini al
        learning_profile = await adaptive_learning_service.get_or_create_learning_profile(user_id)
        
        # Varsayılan değerler
        if not preferred_times:
            preferred_times = [TimeSlotPreference.AFTERNOON, TimeSlotPreference.EVENING]
        
        if not subjects:
            # Zayıf konulara odaklan
            subjects = await self._get_priority_subjects(user_id, learning_profile)
        
        # Plan oluştur
        start_date = date.today()
        end_date = start_date + timedelta(weeks=duration_weeks)
        
        plan = StudyPlan(
            id=f"plan_{uuid.uuid4().hex}",
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            goals=goals,
            daily_study_hours=daily_hours,
            preferred_times=preferred_times,
            subjects=subjects,
            study_technique=technique
        )
        
        # AI ile optimize edilmiş oturumlar oluştur
        sessions = await self._generate_study_sessions(plan, learning_profile)
        plan.sessions = sessions
        
        # Veritabanına kaydet
        if self.db:
            plan_dict = plan.__dict__.copy()
            plan_dict["sessions"] = [s.__dict__ for s in sessions]
            await self.db.study_plans.insert_one(plan_dict)
        
        # Cache'e kaydet
        cache_key = f"study_plan:{plan.id}"
        await cache.set(cache_key, plan_dict, ttl=86400, namespace="planner")
        
        # Hatırlatıcıları planla
        await self._schedule_reminders(plan)
        
        return plan
    
    async def _get_priority_subjects(
        self,
        user_id: str,
        profile: Any
    ) -> List[Dict]:
        """Öncelikli dersleri belirle"""
        subjects = []
        
        # Zayıf konular yüksek öncelik
        for topic in profile.weak_topics[:3]:
            subject = topic.split(".")[0] if "." in topic else topic
            subjects.append({
                "subject": subject,
                "priority": PriorityLevel.HIGH,
                "weekly_hours": 4,
                "topics": [topic]
            })
        
        # Güçlü konular düşük öncelik (unutmamak için)
        for topic in profile.strong_topics[:2]:
            subject = topic.split(".")[0] if "." in topic else topic
            subjects.append({
                "subject": subject,
                "priority": PriorityLevel.LOW,
                "weekly_hours": 1,
                "topics": [topic]
            })
        
        return subjects
    
    async def _generate_study_sessions(
        self,
        plan: StudyPlan,
        profile: Any
    ) -> List[StudySession]:
        """AI ile optimize edilmiş çalışma oturumları oluştur"""
        sessions = []
        current_date = plan.start_date
        
        # Her gün için oturumlar oluştur
        while current_date <= plan.end_date:
            daily_sessions = await self._create_daily_sessions(
                plan,
                current_date,
                profile
            )
            sessions.extend(daily_sessions)
            current_date += timedelta(days=1)
        
        # AI ile optimize et
        optimized_sessions = await self._optimize_with_ai(sessions, plan, profile)
        
        return optimized_sessions
    
    async def _create_daily_sessions(
        self,
        plan: StudyPlan,
        date: date,
        profile: Any
    ) -> List[StudySession]:
        """Günlük çalışma oturumları oluştur"""
        sessions = []
        remaining_hours = plan.daily_study_hours
        
        # Tercih edilen zaman dilimlerini kullan
        for time_slot in plan.preferred_times:
            if remaining_hours <= 0:
                break
            
            start_hour, end_hour = self.time_slots[time_slot]
            
            # Pomodoro tekniği için
            if plan.study_technique == StudyTechnique.POMODORO:
                session_time = datetime.combine(date, time(start_hour, 0))
                
                while remaining_hours > 0 and session_time.hour < end_hour:
                    # Çalışma oturumu
                    work_session = await self._create_pomodoro_session(
                        plan,
                        session_time,
                        profile
                    )
                    sessions.append(work_session)
                    
                    session_time += timedelta(minutes=self.default_settings["pomodoro_work"])
                    remaining_hours -= self.default_settings["pomodoro_work"] / 60
                    
                    # Mola
                    if remaining_hours > 0:
                        break_session = StudySession(
                            id=f"session_{uuid.uuid4().hex}",
                            plan_id=plan.id,
                            user_id=plan.user_id,
                            subject="break",
                            topic="Mola",
                            session_type=StudySessionType.BREAK,
                            scheduled_start=session_time,
                            scheduled_end=session_time + timedelta(minutes=self.default_settings["pomodoro_short_break"]),
                            duration_minutes=self.default_settings["pomodoro_short_break"],
                            priority=PriorityLevel.LOW,
                            technique=StudyTechnique.POMODORO
                        )
                        sessions.append(break_session)
                        session_time += timedelta(minutes=self.default_settings["pomodoro_short_break"])
        
        return sessions
    
    async def _create_pomodoro_session(
        self,
        plan: StudyPlan,
        start_time: datetime,
        profile: Any
    ) -> StudySession:
        """Pomodoro oturumu oluştur"""
        # Konu seç (döngüsel)
        subject_index = len(plan.sessions) % len(plan.subjects)
        subject_info = plan.subjects[subject_index]
        
        # Uygun içerik öner
        recommendations = await adaptive_learning_service.get_adaptive_content_recommendations(
            user_id=plan.user_id,
            subject=subject_info["subject"],
            count=1
        )
        
        topic = recommendations[0].topic if recommendations else subject_info["subject"]
        materials = [{
            "type": "recommendation",
            "content_id": recommendations[0].id,
            "url": recommendations[0].content_url
        }] if recommendations else []
        
        # Oturum tipi belirle
        session_type = self._determine_session_type(subject_info, profile)
        
        return StudySession(
            id=f"session_{uuid.uuid4().hex}",
            plan_id=plan.id,
            user_id=plan.user_id,
            subject=subject_info["subject"],
            topic=topic,
            session_type=session_type,
            scheduled_start=start_time,
            scheduled_end=start_time + timedelta(minutes=self.default_settings["pomodoro_work"]),
            duration_minutes=self.default_settings["pomodoro_work"],
            priority=subject_info["priority"],
            technique=StudyTechnique.POMODORO,
            materials=materials,
            reminders=[start_time - timedelta(minutes=5)]  # 5 dk önce hatırlat
        )
    
    def _determine_session_type(
        self,
        subject_info: Dict,
        profile: Any
    ) -> StudySessionType:
        """Oturum tipini belirle"""
        # Öncelik yüksekse ödev/pratik
        if subject_info["priority"] == PriorityLevel.HIGH:
            return StudySessionType.PRACTICE
        
        # Zayıf konularda tekrar
        if any(topic in profile.weak_topics for topic in subject_info.get("topics", [])):
            return StudySessionType.REVIEW
        
        return StudySessionType.LESSON
    
    async def _optimize_with_ai(
        self,
        sessions: List[StudySession],
        plan: StudyPlan,
        profile: Any
    ) -> List[StudySession]:
        """AI ile oturum optimizasyonu"""
        # Oturum bilgilerini hazırla
        session_data = [{
            "subject": s.subject,
            "type": s.session_type,
            "duration": s.duration_minutes,
            "time": s.scheduled_start.isoformat()
        } for s in sessions[:20]]  # İlk 20 oturum
        
        # AI'dan optimizasyon önerileri al
        prompt = f"""
        Öğrenci profili:
        - Zayıf konular: {profile.weak_topics}
        - Güçlü konular: {profile.strong_topics}
        - Öğrenme hızı: {profile.learning_pace}
        
        Hedefler: {plan.goals}
        
        Mevcut çalışma planı: {session_data}
        
        Bu planı optimize et:
        1. Zayıf konulara daha fazla zaman ayır
        2. Verimli saatleri kullan
        3. Çeşitlilik sağla
        4. Aşırı yüklenmeden kaçın
        
        Öneriler:
        """
        
        try:
            response, _ = await ai_service.get_ai_response(
                prompt=prompt,
                grade_level=5,
                subject="planner",
                max_tokens=500
            )
            
            # AI önerilerini uygula
            # TODO: Parse AI response and apply optimizations
            
        except Exception as e:
            logger.error(f"AI optimization hatası: {e}")
        
        return sessions
    
    async def _schedule_reminders(self, plan: StudyPlan):
        """Hatırlatıcıları planla"""
        for session in plan.sessions:
            for reminder_time in session.reminders:
                await notification_service.schedule_notification(
                    user_id=plan.user_id,
                    title=f"{session.subject} Çalışma Zamanı",
                    message=f"{session.topic} konusuna {session.duration_minutes} dakika çalışacaksın",
                    scheduled_time=reminder_time,
                    notification_type=["in_app", "push"],
                    data={
                        "session_id": session.id,
                        "plan_id": plan.id
                    }
                )
    
    async def start_study_session(
        self,
        session_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Çalışma oturumunu başlat"""
        # Oturumu getir
        session = await self._get_session(session_id)
        if not session or session.user_id != user_id:
            return {"success": False, "error": "Session not found"}
        
        # Başlat
        session.actual_start = datetime.utcnow()
        
        # Pomodoro timer başlat
        if session.technique == StudyTechnique.POMODORO:
            timer_data = {
                "session_id": session_id,
                "duration": session.duration_minutes,
                "start_time": session.actual_start,
                "end_time": session.actual_start + timedelta(minutes=session.duration_minutes)
            }
            
            # Cache'e kaydet
            await cache.set(
                f"active_session:{user_id}",
                timer_data,
                ttl=session.duration_minutes * 60 + 300,
                namespace="planner"
            )
        
        # Veritabanında güncelle
        await self._update_session(session)
        
        return {
            "success": True,
            "session": session.__dict__,
            "timer": {
                "duration_seconds": session.duration_minutes * 60,
                "technique": session.technique
            }
        }
    
    async def end_study_session(
        self,
        session_id: str,
        user_id: str,
        notes: Optional[str] = None,
        productivity_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """Çalışma oturumunu bitir"""
        # Oturumu getir
        session = await self._get_session(session_id)
        if not session or session.user_id != user_id:
            return {"success": False, "error": "Session not found"}
        
        # Bitir
        session.actual_end = datetime.utcnow()
        session.completed = True
        session.notes = notes
        
        # Verimlilik skoru
        if productivity_score is None:
            # Otomatik hesapla
            planned_duration = session.duration_minutes
            actual_duration = (session.actual_end - session.actual_start).total_seconds() / 60
            
            if actual_duration >= planned_duration * 0.8:
                productivity_score = 0.9
            elif actual_duration >= planned_duration * 0.5:
                productivity_score = 0.7
            else:
                productivity_score = 0.5
        
        session.productivity_score = productivity_score
        
        # Veritabanında güncelle
        await self._update_session(session)
        
        # Cache'den temizle
        await cache.delete(f"active_session:{user_id}", namespace="planner")
        
        # İstatistikleri güncelle
        await self._update_productivity_stats(session)
        
        # Başarı puanı
        from app.services.gamification_service import gamification_service
        await gamification_service.add_points(
            user_id=user_id,
            action="study_session_complete",
            metadata={
                "session_id": session_id,
                "duration": actual_duration,
                "productivity": productivity_score
            }
        )
        
        return {
            "success": True,
            "session_summary": {
                "duration_minutes": actual_duration,
                "productivity_score": productivity_score,
                "completed": True
            },
            "next_session": await self._get_next_session(user_id)
        }
    
    async def get_today_schedule(
        self,
        user_id: str
    ) -> List[StudySession]:
        """Bugünün çalışma programı"""
        today = date.today()
        
        if not self.db:
            return []
        
        # Aktif planı bul
        plan = await self.db.study_plans.find_one({
            "user_id": user_id,
            "is_active": True,
            "start_date": {"$lte": today},
            "end_date": {"$gte": today}
        })
        
        if not plan:
            return []
        
        # Bugünün oturumları
        today_start = datetime.combine(today, time.min)
        today_end = datetime.combine(today, time.max)
        
        sessions = []
        for session_data in plan.get("sessions", []):
            session = StudySession(**session_data)
            if today_start <= session.scheduled_start <= today_end:
                sessions.append(session)
        
        # Saate göre sırala
        sessions.sort(key=lambda s: s.scheduled_start)
        
        return sessions
    
    async def create_goal(
        self,
        user_id: str,
        title: str,
        description: str,
        target_date: date,
        subject: Optional[str] = None,
        measurable_target: Optional[Dict] = None
    ) -> StudyGoal:
        """Çalışma hedefi oluştur"""
        goal = StudyGoal(
            id=f"goal_{uuid.uuid4().hex}",
            user_id=user_id,
            title=title,
            description=description,
            target_date=target_date,
            subject=subject,
            measurable_target=measurable_target or {}
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.study_goals.insert_one(goal.__dict__)
        
        return goal
    
    async def update_goal_progress(
        self,
        goal_id: str,
        progress: float,
        milestone: Optional[Dict] = None
    ) -> bool:
        """Hedef ilerlemesini güncelle"""
        if not self.db:
            return False
        
        update_data = {"$set": {"progress": progress}}
        
        if milestone:
            update_data["$push"] = {"milestones": milestone}
        
        if progress >= 1.0:
            update_data["$set"]["is_achieved"] = True
            update_data["$set"]["achieved_at"] = datetime.utcnow()
        
        result = await self.db.study_goals.update_one(
            {"id": goal_id},
            update_data
        )
        
        return result.modified_count > 0
    
    async def get_productivity_report(
        self,
        user_id: str,
        days: int = 7
    ) -> ProductivityMetrics:
        """Verimlilik raporu"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        if not self.db:
            # Demo veri
            return ProductivityMetrics(
                user_id=user_id,
                period_start=start_date,
                period_end=end_date,
                total_planned_hours=14,
                total_actual_hours=12.5,
                completion_rate=0.89,
                average_focus_score=0.82,
                most_productive_time=TimeSlotPreference.AFTERNOON,
                most_productive_day="Salı",
                subject_distribution={"matematik": 0.4, "fen": 0.3, "türkçe": 0.3},
                technique_effectiveness={StudyTechnique.POMODORO: 0.85}
            )
        
        # Gerçek veri analizi
        sessions = await self.db.study_sessions.find({
            "user_id": user_id,
            "scheduled_start": {
                "$gte": datetime.combine(start_date, time.min),
                "$lte": datetime.combine(end_date, time.max)
            }
        }).to_list(1000)
        
        # Metrikleri hesapla
        return await self._calculate_productivity_metrics(
            user_id,
            sessions,
            start_date,
            end_date
        )
    
    async def get_ai_study_recommendations(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """AI çalışma önerileri"""
        # Kullanıcı verilerini topla
        productivity = await self.get_productivity_report(user_id)
        learning_profile = await adaptive_learning_service.get_or_create_learning_profile(user_id)
        current_goals = await self._get_active_goals(user_id)
        
        # AI'dan öneri al
        prompt = f"""
        Öğrenci verileri:
        - En verimli saat: {productivity.most_productive_time}
        - Tamamlama oranı: %{int(productivity.completion_rate * 100)}
        - Zayıf konular: {learning_profile.weak_topics}
        - Aktif hedefler: {len(current_goals)}
        
        Bu öğrenci için:
        1. Optimal çalışma saatlerini öner
        2. Hangi konulara odaklanmalı?
        3. Hangi çalışma tekniği daha uygun?
        4. Motivasyon önerileri ver
        """
        
        try:
            response, _ = await ai_service.get_ai_response(
                prompt=prompt,
                grade_level=5,
                subject="study_planning",
                max_tokens=400
            )
            
            recommendations = {
                "ai_suggestions": response,
                "optimal_hours": [productivity.most_productive_time],
                "focus_subjects": learning_profile.weak_topics[:3],
                "recommended_technique": StudyTechnique.POMODORO,
                "daily_target_hours": 2.5
            }
            
        except Exception as e:
            logger.error(f"AI recommendations hatası: {e}")
            recommendations = {
                "error": "AI önerileri alınamadı",
                "default_suggestions": [
                    "Günde 2-3 saat düzenli çalış",
                    "Zayıf konulara öncelik ver",
                    "Pomodoro tekniğini dene"
                ]
            }
        
        return recommendations
    
    # Yardımcı metodlar
    
    async def _get_session(self, session_id: str) -> Optional[StudySession]:
        """Oturum getir"""
        if not self.db:
            return None
        
        # Önce planlardan ara
        plan = await self.db.study_plans.find_one(
            {"sessions.id": session_id}
        )
        
        if plan:
            for session_data in plan.get("sessions", []):
                if session_data["id"] == session_id:
                    return StudySession(**session_data)
        
        return None
    
    async def _update_session(self, session: StudySession):
        """Oturumu güncelle"""
        if not self.db:
            return
        
        # Plan içindeki oturumu güncelle
        await self.db.study_plans.update_one(
            {"sessions.id": session.id},
            {"$set": {f"sessions.$.{key}": value for key, value in session.__dict__.items()}}
        )
    
    async def _get_next_session(self, user_id: str) -> Optional[Dict]:
        """Sonraki oturumu getir"""
        now = datetime.utcnow()
        
        if not self.db:
            return None
        
        # Aktif plan
        plan = await self.db.study_plans.find_one({
            "user_id": user_id,
            "is_active": True
        })
        
        if not plan:
            return None
        
        # Gelecek oturumlar
        future_sessions = []
        for session_data in plan.get("sessions", []):
            session = StudySession(**session_data)
            if session.scheduled_start > now and not session.completed:
                future_sessions.append(session)
        
        if future_sessions:
            # En yakın oturum
            next_session = min(future_sessions, key=lambda s: s.scheduled_start)
            return {
                "id": next_session.id,
                "subject": next_session.subject,
                "topic": next_session.topic,
                "starts_in_minutes": (next_session.scheduled_start - now).total_seconds() / 60,
                "scheduled_start": next_session.scheduled_start.isoformat()
            }
        
        return None
    
    async def _update_productivity_stats(self, session: StudySession):
        """Verimlilik istatistiklerini güncelle"""
        if not self.db:
            return
        
        # Günlük istatistik
        today = date.today()
        stat_id = f"{session.user_id}_{today.isoformat()}"
        
        await self.db.productivity_stats.update_one(
            {"_id": stat_id},
            {
                "$inc": {
                    "total_minutes": (session.actual_end - session.actual_start).total_seconds() / 60,
                    "completed_sessions": 1,
                    f"subject_minutes.{session.subject}": session.duration_minutes
                },
                "$push": {
                    "productivity_scores": session.productivity_score
                },
                "$set": {
                    "user_id": session.user_id,
                    "date": today
                }
            },
            upsert=True
        )
    
    async def _get_active_goals(self, user_id: str) -> List[StudyGoal]:
        """Aktif hedefleri getir"""
        if not self.db:
            return []
        
        goals = []
        cursor = self.db.study_goals.find({
            "user_id": user_id,
            "is_achieved": False,
            "target_date": {"$gte": date.today()}
        })
        
        async for goal_data in cursor:
            goals.append(StudyGoal(**goal_data))
        
        return goals
    
    async def _calculate_productivity_metrics(
        self,
        user_id: str,
        sessions: List[Dict],
        start_date: date,
        end_date: date
    ) -> ProductivityMetrics:
        """Verimlilik metriklerini hesapla"""
        # Temel metrikler
        total_planned = sum(s["duration_minutes"] for s in sessions) / 60
        completed_sessions = [s for s in sessions if s.get("completed")]
        total_actual = sum(
            (s["actual_end"] - s["actual_start"]).total_seconds() / 3600
            for s in completed_sessions
            if s.get("actual_end") and s.get("actual_start")
        )
        
        completion_rate = len(completed_sessions) / len(sessions) if sessions else 0
        
        # Odaklanma skoru
        productivity_scores = [
            s["productivity_score"] 
            for s in completed_sessions 
            if s.get("productivity_score") is not None
        ]
        avg_focus = sum(productivity_scores) / len(productivity_scores) if productivity_scores else 0
        
        # En verimli zaman
        time_productivity = defaultdict(list)
        for session in completed_sessions:
            if session.get("scheduled_start") and session.get("productivity_score"):
                hour = session["scheduled_start"].hour
                if 6 <= hour < 9:
                    time_slot = TimeSlotPreference.EARLY_MORNING
                elif 9 <= hour < 12:
                    time_slot = TimeSlotPreference.MORNING
                elif 12 <= hour < 17:
                    time_slot = TimeSlotPreference.AFTERNOON
                elif 17 <= hour < 21:
                    time_slot = TimeSlotPreference.EVENING
                else:
                    time_slot = TimeSlotPreference.NIGHT
                
                time_productivity[time_slot].append(session["productivity_score"])
        
        # En yüksek ortalama verimlilik
        best_time = TimeSlotPreference.AFTERNOON  # Default
        best_score = 0
        for time_slot, scores in time_productivity.items():
            avg = sum(scores) / len(scores) if scores else 0
            if avg > best_score:
                best_score = avg
                best_time = time_slot
        
        # Konu dağılımı
        subject_minutes = defaultdict(float)
        for session in completed_sessions:
            if session.get("subject") and session.get("duration_minutes"):
                subject_minutes[session["subject"]] += session["duration_minutes"]
        
        total_subject_minutes = sum(subject_minutes.values())
        subject_distribution = {
            subject: minutes / total_subject_minutes
            for subject, minutes in subject_minutes.items()
        } if total_subject_minutes > 0 else {}
        
        # Teknik etkinliği
        technique_scores = defaultdict(list)
        for session in completed_sessions:
            if session.get("technique") and session.get("productivity_score"):
                technique_scores[session["technique"]].append(session["productivity_score"])
        
        technique_effectiveness = {
            StudyTechnique(technique): sum(scores) / len(scores)
            for technique, scores in technique_scores.items()
        }
        
        return ProductivityMetrics(
            user_id=user_id,
            period_start=start_date,
            period_end=end_date,
            total_planned_hours=total_planned,
            total_actual_hours=total_actual,
            completion_rate=completion_rate,
            average_focus_score=avg_focus,
            most_productive_time=best_time,
            most_productive_day="Salı",  # TODO: Calculate from data
            subject_distribution=subject_distribution,
            technique_effectiveness=technique_effectiveness
        )


# Global study planner service instance
study_planner_service = StudyPlannerService()


# Helper functions
async def create_weekly_plan(
    user_id: str,
    goals: List[str],
    daily_hours: float = 2.0
) -> StudyPlan:
    """Haftalık çalışma planı oluştur"""
    goal_dicts = [{"title": g, "type": "weekly"} for g in goals]
    
    return await study_planner_service.create_study_plan(
        user_id=user_id,
        goals=goal_dicts,
        duration_weeks=1,
        daily_hours=daily_hours
    )


async def start_pomodoro(user_id: str, subject: str) -> Dict:
    """Pomodoro oturumu başlat"""
    # Bugünün planından uygun oturum bul veya yeni oluştur
    today_sessions = await study_planner_service.get_today_schedule(user_id)
    
    # Subject'e uygun ilk tamamlanmamış oturum
    for session in today_sessions:
        if session.subject == subject and not session.completed:
            return await study_planner_service.start_study_session(
                session.id,
                user_id
            )
    
    # Bulunamazsa yeni oturum oluştur
    # TODO: Implement quick session creation
    
    return {"success": False, "message": "Uygun oturum bulunamadı"}
