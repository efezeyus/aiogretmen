"""
Peer Learning Service - Collaborative Learning Platform
------------------------------------------------------
Öğrenciler arası işbirlikli öğrenme platformu.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import uuid
from dataclasses import dataclass, field
from collections import defaultdict
import random

from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.websocket_manager import manager as ws_manager
from app.services.notification_service import notification_service
from app.services.gamification_service import gamification_service, award_peer_help


class StudyGroupType(str, Enum):
    """Çalışma grubu tipleri"""
    STUDY_CIRCLE = "study_circle"      # Çalışma grubu
    PEER_TUTORING = "peer_tutoring"    # Akran öğretimi
    PROJECT_TEAM = "project_team"      # Proje takımı
    DISCUSSION_GROUP = "discussion"     # Tartışma grubu
    COMPETITION_TEAM = "competition"    # Yarışma takımı


class GroupPrivacy(str, Enum):
    """Grup gizlilik ayarları"""
    PUBLIC = "public"          # Herkese açık
    PRIVATE = "private"        # Sadece davetliler
    SCHOOL_ONLY = "school"     # Okul içi


class MemberRole(str, Enum):
    """Üye rolleri"""
    LEADER = "leader"          # Grup lideri
    MODERATOR = "moderator"    # Moderatör
    TUTOR = "tutor"           # Öğretici
    MEMBER = "member"         # Normal üye


class HelpRequestStatus(str, Enum):
    """Yardım isteği durumu"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


@dataclass
class StudyGroup:
    """Çalışma grubu"""
    id: str
    name: str
    description: str
    type: StudyGroupType
    subject: str
    grade_level: int
    max_members: int
    privacy: GroupPrivacy
    created_by: str
    created_at: datetime
    members: List[Dict] = field(default_factory=list)  # {user_id, role, joined_at}
    tags: List[str] = field(default_factory=list)
    settings: Dict = field(default_factory=dict)
    activity_count: int = 0
    last_activity: Optional[datetime] = None


@dataclass
class StudySession:
    """Grup çalışma oturumu"""
    id: str
    group_id: str
    title: str
    description: str
    scheduled_time: datetime
    duration_minutes: int
    host_id: str
    participants: List[str] = field(default_factory=list)
    materials: List[Dict] = field(default_factory=list)
    status: str = "scheduled"  # scheduled, active, completed, cancelled
    meeting_url: Optional[str] = None
    recording_url: Optional[str] = None


@dataclass
class HelpRequest:
    """Yardım isteği"""
    id: str
    requester_id: str
    subject: str
    topic: str
    question: str
    description: str
    difficulty_level: str
    status: HelpRequestStatus
    created_at: datetime
    helper_id: Optional[str] = None
    accepted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    attachments: List[Dict] = field(default_factory=list)


@dataclass
class PeerMatch:
    """Akran eşleştirme"""
    id: str
    student1_id: str
    student2_id: str
    subject: str
    match_score: float
    match_reasons: List[str]
    created_at: datetime
    status: str = "pending"  # pending, accepted, rejected, active, completed


class PeerLearningService:
    """Peer learning servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Eşleştirme parametreleri
        self.matching_weights = {
            "grade_level": 0.3,
            "skill_complementarity": 0.25,
            "learning_style": 0.2,
            "availability": 0.15,
            "interests": 0.1
        }
        
        # Grup limitleri
        self.group_limits = {
            StudyGroupType.STUDY_CIRCLE: 8,
            StudyGroupType.PEER_TUTORING: 2,
            StudyGroupType.PROJECT_TEAM: 6,
            StudyGroupType.DISCUSSION_GROUP: 12,
            StudyGroupType.COMPETITION_TEAM: 5
        }
        
        # Ödül sistemi
        self.reward_points = {
            "help_given": 20,
            "help_received": 5,
            "group_created": 30,
            "session_hosted": 25,
            "session_attended": 10,
            "helpful_rating": 15
        }
        
        logger.info("Peer Learning Service başlatıldı")
    
    async def create_study_group(
        self,
        creator_id: str,
        name: str,
        description: str,
        type: StudyGroupType,
        subject: str,
        grade_level: int,
        privacy: GroupPrivacy = GroupPrivacy.PUBLIC,
        tags: Optional[List[str]] = None,
        max_members: Optional[int] = None
    ) -> StudyGroup:
        """Çalışma grubu oluştur"""
        # Maksimum üye sayısı
        if not max_members:
            max_members = self.group_limits.get(type, 10)
        
        group = StudyGroup(
            id=f"group_{uuid.uuid4().hex}",
            name=name,
            description=description,
            type=type,
            subject=subject,
            grade_level=grade_level,
            max_members=max_members,
            privacy=privacy,
            created_by=creator_id,
            created_at=datetime.utcnow(),
            members=[{
                "user_id": creator_id,
                "role": MemberRole.LEADER,
                "joined_at": datetime.utcnow()
            }],
            tags=tags or [],
            settings={
                "allow_join_requests": True,
                "require_approval": privacy == GroupPrivacy.PRIVATE,
                "notify_on_activity": True
            }
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.study_groups.insert_one(group.__dict__)
        
        # Cache'e kaydet
        cache_key = f"study_group:{group.id}"
        await cache.set(cache_key, group.__dict__, ttl=3600, namespace="peer_learning")
        
        # Oluşturucu için puan
        await gamification_service.add_points(
            user_id=creator_id,
            action="group_created",
            metadata={"group_id": group.id, "type": type}
        )
        
        # Bildirim (eğer public ise)
        if privacy == GroupPrivacy.PUBLIC:
            await self._notify_potential_members(group)
        
        return group
    
    async def join_study_group(
        self,
        user_id: str,
        group_id: str,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Gruba katıl"""
        # Grubu getir
        group_data = await self._get_group(group_id)
        if not group_data:
            return {"success": False, "error": "Grup bulunamadı"}
        
        group = StudyGroup(**group_data)
        
        # Üye kontrolü
        if any(m["user_id"] == user_id for m in group.members):
            return {"success": False, "error": "Zaten üyesiniz"}
        
        # Kapasite kontrolü
        if len(group.members) >= group.max_members:
            return {"success": False, "error": "Grup dolu"}
        
        # Onay gerekiyor mu?
        if group.settings.get("require_approval"):
            # Katılma isteği oluştur
            await self._create_join_request(user_id, group_id, message)
            return {
                "success": True,
                "status": "pending_approval",
                "message": "Katılma isteğiniz gönderildi"
            }
        
        # Doğrudan ekle
        new_member = {
            "user_id": user_id,
            "role": MemberRole.MEMBER,
            "joined_at": datetime.utcnow()
        }
        
        group.members.append(new_member)
        
        # Güncelle
        await self._update_group(group)
        
        # WebSocket ile diğer üyelere bildir
        await self._broadcast_to_group(group_id, {
            "type": "member_joined",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "success": True,
            "status": "joined",
            "group": group.__dict__
        }
    
    async def create_help_request(
        self,
        requester_id: str,
        subject: str,
        topic: str,
        question: str,
        description: str,
        difficulty_level: str = "medium",
        attachments: Optional[List[Dict]] = None
    ) -> HelpRequest:
        """Yardım isteği oluştur"""
        help_request = HelpRequest(
            id=f"help_{uuid.uuid4().hex}",
            requester_id=requester_id,
            subject=subject,
            topic=topic,
            question=question,
            description=description,
            difficulty_level=difficulty_level,
            status=HelpRequestStatus.OPEN,
            created_at=datetime.utcnow(),
            attachments=attachments or []
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.help_requests.insert_one(help_request.__dict__)
        
        # Potansiyel yardımcıları bul
        helpers = await self._find_potential_helpers(help_request)
        
        # Bildirimleri gönder
        for helper_id in helpers[:5]:  # İlk 5 kişiye bildirim
            await notification_service.send_notification(
                user_id=helper_id,
                title="Yardım İsteği",
                message=f"{subject} konusunda yardıma ihtiyaç var: {question[:50]}...",
                notification_type=["in_app", "push"],
                data={"help_request_id": help_request.id}
            )
        
        # Real-time broadcast
        await ws_manager.broadcast({
            "type": "new_help_request",
            "data": {
                "id": help_request.id,
                "subject": subject,
                "topic": topic,
                "question": question,
                "difficulty": difficulty_level
            }
        })
        
        return help_request
    
    async def accept_help_request(
        self,
        helper_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """Yardım isteğini kabul et"""
        if not self.db:
            return {"success": False, "error": "Database not available"}
        
        # İsteği getir
        request_data = await self.db.help_requests.find_one({"id": request_id})
        if not request_data:
            return {"success": False, "error": "İstek bulunamadı"}
        
        help_request = HelpRequest(**request_data)
        
        # Durum kontrolü
        if help_request.status != HelpRequestStatus.OPEN:
            return {"success": False, "error": "İstek zaten alınmış"}
        
        # Güncelle
        help_request.helper_id = helper_id
        help_request.status = HelpRequestStatus.IN_PROGRESS
        help_request.accepted_at = datetime.utcnow()
        
        await self.db.help_requests.update_one(
            {"id": request_id},
            {"$set": {
                "helper_id": helper_id,
                "status": help_request.status,
                "accepted_at": help_request.accepted_at
            }}
        )
        
        # İstek sahibine bildirim
        await notification_service.send_notification(
            user_id=help_request.requester_id,
            title="Yardım İsteğin Kabul Edildi!",
            message="Bir arkadaşın sana yardım etmek istiyor",
            notification_type=["in_app", "push"],
            data={"helper_id": helper_id, "request_id": request_id}
        )
        
        # Sohbet odası oluştur
        chat_room = await self._create_help_chat_room(help_request, helper_id)
        
        return {
            "success": True,
            "chat_room": chat_room
        }
    
    async def resolve_help_request(
        self,
        request_id: str,
        resolver_id: str,
        rating: Optional[int] = None,
        feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """Yardım isteğini çöz"""
        if not self.db:
            return {"success": False, "error": "Database not available"}
        
        # İsteği getir
        request_data = await self.db.help_requests.find_one({"id": request_id})
        if not request_data:
            return {"success": False, "error": "İstek bulunamadı"}
        
        help_request = HelpRequest(**request_data)
        
        # Yetki kontrolü
        if resolver_id not in [help_request.requester_id, help_request.helper_id]:
            return {"success": False, "error": "Bu işlem için yetkiniz yok"}
        
        # Güncelle
        update_data = {
            "status": HelpRequestStatus.RESOLVED,
            "resolved_at": datetime.utcnow()
        }
        
        if rating:
            update_data["rating"] = rating
        if feedback:
            update_data["feedback"] = feedback
        
        await self.db.help_requests.update_one(
            {"id": request_id},
            {"$set": update_data}
        )
        
        # Puanlama
        if help_request.helper_id:
            # Yardım eden kişiye puan
            await award_peer_help(
                helper_id=help_request.helper_id,
                helped_id=help_request.requester_id,
                metadata={
                    "request_id": request_id,
                    "subject": help_request.subject,
                    "rating": rating
                }
            )
            
            # İyi değerlendirme bonusu
            if rating and rating >= 4:
                await gamification_service.add_points(
                    user_id=help_request.helper_id,
                    action="helpful_rating",
                    metadata={"rating": rating}
                )
        
        return {
            "success": True,
            "message": "Yardım isteği çözüldü"
        }
    
    async def find_study_buddy(
        self,
        user_id: str,
        subject: str,
        preferences: Optional[Dict] = None
    ) -> List[PeerMatch]:
        """Çalışma arkadaşı bul"""
        # Kullanıcı profili
        user_profile = await self._get_user_learning_profile(user_id)
        
        # Potansiyel eşleşmeler
        candidates = await self._find_compatible_peers(
            user_id,
            subject,
            user_profile,
            preferences
        )
        
        # Eşleştirme skorları hesapla
        matches = []
        for candidate in candidates[:20]:  # En fazla 20 aday
            match_score, reasons = await self._calculate_match_score(
                user_profile,
                candidate,
                subject
            )
            
            if match_score >= 0.6:  # Minimum eşleşme skoru
                match = PeerMatch(
                    id=f"match_{uuid.uuid4().hex}",
                    student1_id=user_id,
                    student2_id=candidate["user_id"],
                    subject=subject,
                    match_score=match_score,
                    match_reasons=reasons,
                    created_at=datetime.utcnow()
                )
                matches.append(match)
        
        # Skora göre sırala
        matches.sort(key=lambda x: x.match_score, reverse=True)
        
        # En iyi 5 eşleşmeyi kaydet
        if self.db and matches:
            for match in matches[:5]:
                await self.db.peer_matches.insert_one(match.__dict__)
        
        return matches[:5]
    
    async def _find_potential_helpers(
        self,
        help_request: HelpRequest
    ) -> List[str]:
        """Potansiyel yardımcıları bul"""
        if not self.db:
            return []
        
        # Kriterlere göre ara
        query = {
            "skills": help_request.subject,
            "grade_level": {"$gte": help_request.requester_id - 1},
            "helper_rating": {"$gte": 4.0},
            "status": "online"  # Çevrimiçi kullanıcılar
        }
        
        # TODO: Gerçek kullanıcı verilerinden çek
        # Şimdilik demo
        return ["helper1", "helper2", "helper3"]
    
    async def _find_compatible_peers(
        self,
        user_id: str,
        subject: str,
        user_profile: Dict,
        preferences: Optional[Dict]
    ) -> List[Dict]:
        """Uyumlu akranları bul"""
        if not self.db:
            return []
        
        # Arama kriterleri
        query = {
            "user_id": {"$ne": user_id},
            "subjects": subject,
            "grade_level": {
                "$gte": user_profile.get("grade_level", 5) - 2,
                "$lte": user_profile.get("grade_level", 5) + 2
            }
        }
        
        # Tercihler
        if preferences:
            if "learning_style" in preferences:
                query["learning_style"] = preferences["learning_style"]
            if "availability" in preferences:
                query["availability"] = {"$in": preferences["availability"]}
        
        # TODO: Gerçek sorgu
        # Şimdilik demo veri
        return [
            {
                "user_id": "peer1",
                "name": "Ahmet",
                "grade_level": user_profile.get("grade_level", 5),
                "subjects": [subject],
                "skills": {subject: 0.8},
                "learning_style": "visual",
                "availability": ["afternoon", "evening"]
            },
            {
                "user_id": "peer2",
                "name": "Ayşe",
                "grade_level": user_profile.get("grade_level", 5) + 1,
                "subjects": [subject],
                "skills": {subject: 0.9},
                "learning_style": "kinesthetic",
                "availability": ["morning", "afternoon"]
            }
        ]
    
    async def _calculate_match_score(
        self,
        user_profile: Dict,
        candidate: Dict,
        subject: str
    ) -> Tuple[float, List[str]]:
        """Eşleştirme skoru hesapla"""
        score = 0.0
        reasons = []
        
        # Sınıf seviyesi uyumu
        grade_diff = abs(
            user_profile.get("grade_level", 5) - 
            candidate.get("grade_level", 5)
        )
        if grade_diff == 0:
            score += self.matching_weights["grade_level"]
            reasons.append("Aynı sınıf seviyesi")
        elif grade_diff == 1:
            score += self.matching_weights["grade_level"] * 0.7
            reasons.append("Yakın sınıf seviyesi")
        
        # Beceri tamamlayıcılığı
        user_skill = user_profile.get("skills", {}).get(subject, 0.5)
        candidate_skill = candidate.get("skills", {}).get(subject, 0.5)
        
        # İdeal: Biri güçlü, diğeri orta seviye
        skill_complement = 1 - abs(user_skill - candidate_skill)
        if 0.2 <= abs(user_skill - candidate_skill) <= 0.4:
            score += self.matching_weights["skill_complementarity"]
            reasons.append("Tamamlayıcı beceri seviyeleri")
        
        # Öğrenme stili
        if user_profile.get("learning_style") == candidate.get("learning_style"):
            score += self.matching_weights["learning_style"] * 0.8
            reasons.append("Benzer öğrenme stili")
        
        # Müsaitlik
        user_availability = set(user_profile.get("availability", []))
        candidate_availability = set(candidate.get("availability", []))
        overlap = user_availability.intersection(candidate_availability)
        
        if len(overlap) >= 2:
            score += self.matching_weights["availability"]
            reasons.append("Uygun zaman dilimleri")
        
        # İlgi alanları
        user_interests = set(user_profile.get("interests", []))
        candidate_interests = set(candidate.get("interests", []))
        common_interests = user_interests.intersection(candidate_interests)
        
        if common_interests:
            score += self.matching_weights["interests"]
            reasons.append(f"Ortak ilgi alanları: {', '.join(common_interests)}")
        
        return score, reasons
    
    async def create_study_session(
        self,
        group_id: str,
        host_id: str,
        title: str,
        description: str,
        scheduled_time: datetime,
        duration_minutes: int = 60,
        materials: Optional[List[Dict]] = None
    ) -> StudySession:
        """Grup çalışma oturumu oluştur"""
        # Grup kontrolü
        group = await self._get_group(group_id)
        if not group:
            raise ValueError("Grup bulunamadı")
        
        # Yetki kontrolü
        member = next((m for m in group["members"] if m["user_id"] == host_id), None)
        if not member or member["role"] not in [MemberRole.LEADER, MemberRole.MODERATOR]:
            raise ValueError("Bu işlem için yetkiniz yok")
        
        session = StudySession(
            id=f"session_{uuid.uuid4().hex}",
            group_id=group_id,
            title=title,
            description=description,
            scheduled_time=scheduled_time,
            duration_minutes=duration_minutes,
            host_id=host_id,
            materials=materials or [],
            meeting_url=self._generate_meeting_url()
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.study_sessions.insert_one(session.__dict__)
        
        # Grup üyelerine bildirim
        for member in group["members"]:
            if member["user_id"] != host_id:
                await notification_service.send_notification(
                    user_id=member["user_id"],
                    title="Yeni Çalışma Oturumu",
                    message=f"{title} - {scheduled_time.strftime('%d.%m %H:%M')}",
                    notification_type=["in_app", "push"],
                    data={
                        "session_id": session.id,
                        "group_id": group_id,
                        "scheduled_time": scheduled_time.isoformat()
                    }
                )
        
        # Takvime ekle
        await self._add_to_calendar(session)
        
        return session
    
    async def get_my_groups(
        self,
        user_id: str,
        group_type: Optional[StudyGroupType] = None
    ) -> List[StudyGroup]:
        """Kullanıcının gruplarını getir"""
        if not self.db:
            return []
        
        # Üye olunan gruplar
        query = {"members.user_id": user_id}
        if group_type:
            query["type"] = group_type
        
        groups = []
        async for group_data in self.db.study_groups.find(query):
            groups.append(StudyGroup(**group_data))
        
        return groups
    
    async def get_open_help_requests(
        self,
        subject: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 20
    ) -> List[HelpRequest]:
        """Açık yardım isteklerini getir"""
        if not self.db:
            return []
        
        query = {"status": HelpRequestStatus.OPEN}
        if subject:
            query["subject"] = subject
        if difficulty:
            query["difficulty_level"] = difficulty
        
        requests = []
        cursor = self.db.help_requests.find(query)\
            .sort("created_at", -1)\
            .limit(limit)
        
        async for request_data in cursor:
            requests.append(HelpRequest(**request_data))
        
        return requests
    
    async def get_group_analytics(
        self,
        group_id: str
    ) -> Dict[str, Any]:
        """Grup analitiği"""
        if not self.db:
            return {}
        
        group = await self._get_group(group_id)
        if not group:
            return {}
        
        # Oturum istatistikleri
        total_sessions = await self.db.study_sessions.count_documents({
            "group_id": group_id
        })
        
        completed_sessions = await self.db.study_sessions.count_documents({
            "group_id": group_id,
            "status": "completed"
        })
        
        # Üye aktivitesi
        active_members = len([
            m for m in group["members"]
            if m.get("last_activity") and 
            (datetime.utcnow() - m["last_activity"]).days <= 7
        ])
        
        # Yardımlaşma istatistikleri
        help_given = await self.db.help_requests.count_documents({
            "helper_id": {"$in": [m["user_id"] for m in group["members"]]},
            "status": HelpRequestStatus.RESOLVED
        })
        
        return {
            "group_id": group_id,
            "member_count": len(group["members"]),
            "active_member_count": active_members,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "completion_rate": (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0,
            "help_given_count": help_given,
            "activity_score": group.get("activity_count", 0),
            "created_days_ago": (datetime.utcnow() - group["created_at"]).days
        }
    
    async def _get_group(self, group_id: str) -> Optional[Dict]:
        """Grubu getir"""
        # Cache'den kontrol et
        cache_key = f"study_group:{group_id}"
        cached = await cache.get(cache_key, namespace="peer_learning")
        
        if cached:
            return cached
        
        if self.db:
            group = await self.db.study_groups.find_one({"id": group_id})
            if group:
                await cache.set(cache_key, group, ttl=3600, namespace="peer_learning")
            return group
        
        return None
    
    async def _update_group(self, group: StudyGroup):
        """Grubu güncelle"""
        if self.db:
            await self.db.study_groups.update_one(
                {"id": group.id},
                {"$set": group.__dict__}
            )
        
        # Cache'i güncelle
        cache_key = f"study_group:{group.id}"
        await cache.set(cache_key, group.__dict__, ttl=3600, namespace="peer_learning")
    
    async def _broadcast_to_group(self, group_id: str, message: Dict):
        """Gruba mesaj yayınla"""
        group = await self._get_group(group_id)
        if group:
            for member in group["members"]:
                await ws_manager.send_personal_message(
                    message=message,
                    client_id=member["user_id"]
                )
    
    async def _create_join_request(
        self,
        user_id: str,
        group_id: str,
        message: Optional[str]
    ):
        """Katılma isteği oluştur"""
        if self.db:
            await self.db.group_join_requests.insert_one({
                "id": f"join_req_{uuid.uuid4().hex}",
                "user_id": user_id,
                "group_id": group_id,
                "message": message,
                "status": "pending",
                "created_at": datetime.utcnow()
            })
    
    async def _notify_potential_members(self, group: StudyGroup):
        """Potansiyel üyelere bildirim gönder"""
        # TODO: Uygun kullanıcıları bul ve bildir
        pass
    
    async def _create_help_chat_room(
        self,
        help_request: HelpRequest,
        helper_id: str
    ) -> Dict:
        """Yardım sohbet odası oluştur"""
        room = {
            "id": f"help_chat_{help_request.id}",
            "participants": [help_request.requester_id, helper_id],
            "subject": help_request.subject,
            "topic": help_request.topic,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # WebSocket odası oluştur
        # TODO: WebSocket room implementation
        
        return room
    
    async def _get_user_learning_profile(self, user_id: str) -> Dict:
        """Kullanıcı öğrenme profilini getir"""
        # TODO: Adaptive learning service'den çek
        return {
            "user_id": user_id,
            "grade_level": 7,
            "skills": {"matematik": 0.7, "fen": 0.8},
            "learning_style": "visual",
            "availability": ["afternoon", "evening"],
            "interests": ["bilim", "teknoloji"]
        }
    
    def _generate_meeting_url(self) -> str:
        """Toplantı URL'i oluştur"""
        # TODO: Jitsi, Zoom veya benzeri entegrasyonu
        meeting_id = uuid.uuid4().hex[:8]
        return f"https://meet.yapayzekaogretmen.com/{meeting_id}"
    
    async def _add_to_calendar(self, session: StudySession):
        """Takvime ekle"""
        # TODO: Google Calendar, Outlook entegrasyonu
        pass


# Global peer learning service instance
peer_learning_service = PeerLearningService()


# Helper functions
async def quick_match_study_buddy(
    user_id: str,
    subject: str
) -> Optional[PeerMatch]:
    """Hızlı çalışma arkadaşı eşleştir"""
    matches = await peer_learning_service.find_study_buddy(
        user_id=user_id,
        subject=subject
    )
    
    return matches[0] if matches else None


async def request_help(
    user_id: str,
    subject: str,
    question: str
) -> HelpRequest:
    """Hızlı yardım isteği"""
    return await peer_learning_service.create_help_request(
        requester_id=user_id,
        subject=subject,
        topic=subject,
        question=question,
        description=question,
        difficulty_level="medium"
    )
