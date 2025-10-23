"""
Gamification Service - Motivation and Engagement
-----------------------------------------------
Puan, rozet, seviye ve liderlik tablosu sistemi.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.notification_service import notification_service, NotificationCategory


class AchievementType(str, Enum):
    """Başarı tipleri"""
    LESSON_COMPLETE = "lesson_complete"
    QUIZ_PERFECT = "quiz_perfect"
    STREAK = "streak"
    TIME_SPENT = "time_spent"
    SKILL_MASTER = "skill_master"
    HELPER = "helper"
    EXPLORER = "explorer"
    MILESTONE = "milestone"


class BadgeRarity(str, Enum):
    """Rozet nadirlik seviyeleri"""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class LeaderboardType(str, Enum):
    """Liderlik tablosu tipleri"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALL_TIME = "all_time"
    SUBJECT = "subject"
    GRADE = "grade"


class GamificationService:
    """Oyunlaştırma servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Puan sistemi
        self.point_values = {
            "lesson_complete": 10,
            "quiz_complete": 15,
            "quiz_perfect": 30,
            "daily_login": 5,
            "help_peer": 20,
            "create_note": 5,
            "watch_video": 10,
            "homework_submit": 25,
            "homework_ontime": 10
        }
        
        # Seviye sistemi
        self.level_thresholds = self._generate_level_thresholds()
        
        # Başarılar ve rozetler
        self.achievements = self._load_achievements()
        
        logger.info("Gamification Service başlatıldı")
    
    def _generate_level_thresholds(self) -> List[int]:
        """Seviye eşiklerini oluştur (exponential growth)"""
        thresholds = [0]  # Level 0
        base_xp = 100
        
        for level in range(1, 101):  # 100 seviye
            # Her seviye için gereken XP exponential olarak artar
            required_xp = int(base_xp * (1.15 ** (level - 1)))
            thresholds.append(thresholds[-1] + required_xp)
        
        return thresholds
    
    def _load_achievements(self) -> Dict[str, Dict]:
        """Başarı tanımlarını yükle"""
        return {
            # Ders tamamlama başarıları
            "first_lesson": {
                "name": "İlk Adım",
                "description": "İlk dersini tamamladın!",
                "type": AchievementType.LESSON_COMPLETE,
                "rarity": BadgeRarity.COMMON,
                "points": 50,
                "icon": "🎯",
                "criteria": {"lessons_completed": 1}
            },
            "lesson_master_10": {
                "name": "Ders Ustası",
                "description": "10 ders tamamladın",
                "type": AchievementType.LESSON_COMPLETE,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 100,
                "icon": "📚",
                "criteria": {"lessons_completed": 10}
            },
            "lesson_master_50": {
                "name": "Bilge",
                "description": "50 ders tamamladın",
                "type": AchievementType.LESSON_COMPLETE,
                "rarity": BadgeRarity.RARE,
                "points": 500,
                "icon": "🎓",
                "criteria": {"lessons_completed": 50}
            },
            
            # Quiz başarıları
            "perfect_quiz": {
                "name": "Mükemmeliyetçi",
                "description": "Bir quiz'de %100 başarı",
                "type": AchievementType.QUIZ_PERFECT,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 75,
                "icon": "💯",
                "criteria": {"perfect_quizzes": 1}
            },
            "quiz_champion": {
                "name": "Quiz Şampiyonu",
                "description": "10 quiz'de %100 başarı",
                "type": AchievementType.QUIZ_PERFECT,
                "rarity": BadgeRarity.EPIC,
                "points": 750,
                "icon": "🏆",
                "criteria": {"perfect_quizzes": 10}
            },
            
            # Streak başarıları
            "week_warrior": {
                "name": "Hafta Savaşçısı",
                "description": "7 gün üst üste giriş yaptın",
                "type": AchievementType.STREAK,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 100,
                "icon": "🔥",
                "criteria": {"login_streak": 7}
            },
            "month_master": {
                "name": "Ay Ustası",
                "description": "30 gün üst üste giriş yaptın",
                "type": AchievementType.STREAK,
                "rarity": BadgeRarity.EPIC,
                "points": 500,
                "icon": "⚡",
                "criteria": {"login_streak": 30}
            },
            
            # Zaman başarıları
            "dedicated_learner": {
                "name": "Azimli Öğrenci",
                "description": "Toplam 10 saat çalıştın",
                "type": AchievementType.TIME_SPENT,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 200,
                "icon": "⏰",
                "criteria": {"total_hours": 10}
            },
            "time_investor": {
                "name": "Zaman Yatırımcısı",
                "description": "Toplam 100 saat çalıştın",
                "type": AchievementType.TIME_SPENT,
                "rarity": BadgeRarity.LEGENDARY,
                "points": 2000,
                "icon": "⌛",
                "criteria": {"total_hours": 100}
            },
            
            # Yardım başarıları
            "helpful_friend": {
                "name": "Yardımsever Arkadaş",
                "description": "5 arkadaşına yardım ettin",
                "type": AchievementType.HELPER,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 150,
                "icon": "🤝",
                "criteria": {"peers_helped": 5}
            },
            
            # Keşif başarıları
            "subject_explorer": {
                "name": "Konu Kaşifi",
                "description": "5 farklı konuda ders aldın",
                "type": AchievementType.EXPLORER,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 100,
                "icon": "🔍",
                "criteria": {"unique_subjects": 5}
            },
            
            # Milestone başarıları
            "level_10": {
                "name": "Seviye 10",
                "description": "10. seviyeye ulaştın!",
                "type": AchievementType.MILESTONE,
                "rarity": BadgeRarity.UNCOMMON,
                "points": 200,
                "icon": "🌟",
                "criteria": {"level": 10}
            },
            "level_25": {
                "name": "Seviye 25",
                "description": "25. seviyeye ulaştın!",
                "type": AchievementType.MILESTONE,
                "rarity": BadgeRarity.RARE,
                "points": 500,
                "icon": "✨",
                "criteria": {"level": 25}
            },
            "level_50": {
                "name": "Seviye 50",
                "description": "50. seviyeye ulaştın!",
                "type": AchievementType.MILESTONE,
                "rarity": BadgeRarity.EPIC,
                "points": 1000,
                "icon": "💫",
                "criteria": {"level": 50}
            }
        }
    
    async def add_points(
        self,
        user_id: str,
        action: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Kullanıcıya puan ekle
        
        Returns:
            points_added: Eklenen puan
            total_points: Toplam puan
            level_up: Seviye atladı mı?
            new_level: Yeni seviye
            achievements_unlocked: Kazanılan başarılar
        """
        if not self.db:
            return {"success": False, "error": "Database not available"}
        
        # Puan değeri
        points = self.point_values.get(action, 0)
        if points == 0:
            return {"success": False, "error": f"Unknown action: {action}"}
        
        # Bonus hesapla (streak, combo vs.)
        bonus_multiplier = await self._calculate_bonus_multiplier(user_id, action)
        final_points = int(points * bonus_multiplier)
        
        # Kullanıcı profilini güncelle
        user_profile = await self._get_or_create_profile(user_id)
        old_points = user_profile.get("total_points", 0)
        new_points = old_points + final_points
        old_level = self._calculate_level(old_points)
        new_level = self._calculate_level(new_points)
        
        # Profili güncelle
        update_data = {
            "$set": {
                "total_points": new_points,
                "level": new_level,
                "last_activity": datetime.utcnow()
            },
            "$inc": {
                f"action_counts.{action}": 1,
                "weekly_points": final_points,
                "monthly_points": final_points
            },
            "$push": {
                "point_history": {
                    "action": action,
                    "points": final_points,
                    "timestamp": datetime.utcnow(),
                    "metadata": metadata
                }
            }
        }
        
        await self.db.gamification_profiles.update_one(
            {"user_id": user_id},
            update_data,
            upsert=True
        )
        
        # Başarı kontrolü
        achievements_unlocked = await self._check_achievements(user_id, action)
        
        # Seviye atladıysa bildirim gönder
        level_up = new_level > old_level
        if level_up:
            await self._send_level_up_notification(user_id, new_level)
        
        # Cache güncelle
        await self._update_leaderboard_cache(user_id, new_points)
        
        return {
            "success": True,
            "points_added": final_points,
            "total_points": new_points,
            "level_up": level_up,
            "old_level": old_level,
            "new_level": new_level,
            "achievements_unlocked": achievements_unlocked,
            "bonus_multiplier": bonus_multiplier
        }
    
    def _calculate_level(self, points: int) -> int:
        """Puana göre seviye hesapla"""
        for level, threshold in enumerate(self.level_thresholds):
            if points < threshold:
                return level - 1
        return len(self.level_thresholds) - 1
    
    def get_level_progress(self, points: int) -> Dict[str, Any]:
        """Seviye ilerleme bilgisi"""
        current_level = self._calculate_level(points)
        
        if current_level >= len(self.level_thresholds) - 1:
            # Max level
            return {
                "level": current_level,
                "current_xp": points,
                "next_level_xp": None,
                "progress_percentage": 100,
                "xp_for_next": 0
            }
        
        current_threshold = self.level_thresholds[current_level]
        next_threshold = self.level_thresholds[current_level + 1]
        progress = points - current_threshold
        required = next_threshold - current_threshold
        
        return {
            "level": current_level,
            "current_xp": points,
            "next_level_xp": next_threshold,
            "progress_percentage": int((progress / required) * 100),
            "xp_for_next": required - progress
        }
    
    async def _calculate_bonus_multiplier(self, user_id: str, action: str) -> float:
        """Bonus çarpanı hesapla"""
        multiplier = 1.0
        
        # Streak bonus
        streak = await self._get_login_streak(user_id)
        if streak >= 7:
            multiplier += 0.1  # %10 bonus
        if streak >= 30:
            multiplier += 0.1  # Toplam %20 bonus
        
        # Hafta sonu bonusu
        if datetime.utcnow().weekday() in [5, 6]:  # Cumartesi, Pazar
            multiplier += 0.5  # %50 hafta sonu bonusu
        
        # Premium bonus (varsa)
        # TODO: Premium kontrolü
        
        return multiplier
    
    async def _check_achievements(self, user_id: str, action: str) -> List[Dict]:
        """Başarı kontrolü yap"""
        if not self.db:
            return []
        
        unlocked = []
        profile = await self._get_or_create_profile(user_id)
        unlocked_achievements = set(profile.get("achievements", []))
        
        # Her başarıyı kontrol et
        for achievement_id, achievement in self.achievements.items():
            if achievement_id in unlocked_achievements:
                continue
            
            # Kriterleri kontrol et
            if await self._check_achievement_criteria(profile, achievement):
                # Başarı kazanıldı!
                unlocked.append({
                    "id": achievement_id,
                    "name": achievement["name"],
                    "description": achievement["description"],
                    "icon": achievement["icon"],
                    "points": achievement["points"],
                    "rarity": achievement["rarity"]
                })
                
                # Profili güncelle
                await self.db.gamification_profiles.update_one(
                    {"user_id": user_id},
                    {
                        "$push": {"achievements": achievement_id},
                        "$inc": {"total_points": achievement["points"]}
                    }
                )
                
                # Bildirim gönder
                await self._send_achievement_notification(
                    user_id,
                    achievement["name"],
                    achievement["description"]
                )
        
        return unlocked
    
    async def _check_achievement_criteria(self, profile: Dict, achievement: Dict) -> bool:
        """Başarı kriterlerini kontrol et"""
        criteria = achievement.get("criteria", {})
        
        for key, value in criteria.items():
            if key == "lessons_completed":
                if profile.get("action_counts", {}).get("lesson_complete", 0) < value:
                    return False
            
            elif key == "perfect_quizzes":
                if profile.get("action_counts", {}).get("quiz_perfect", 0) < value:
                    return False
            
            elif key == "login_streak":
                streak = await self._get_login_streak(profile["user_id"])
                if streak < value:
                    return False
            
            elif key == "level":
                if profile.get("level", 0) < value:
                    return False
            
            elif key == "total_hours":
                # TODO: Toplam çalışma saati hesapla
                pass
        
        return True
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Kullanıcı gamification profilini getir"""
        profile = await self._get_or_create_profile(user_id)
        
        # Seviye bilgisi
        level_info = self.get_level_progress(profile.get("total_points", 0))
        
        # Başarılar
        achievements = []
        for achievement_id in profile.get("achievements", []):
            if achievement_id in self.achievements:
                achievement = self.achievements[achievement_id].copy()
                achievement["id"] = achievement_id
                achievement["unlocked_at"] = "N/A"  # TODO: Unlock zamanı kaydet
                achievements.append(achievement)
        
        # Liderlik tablosu sıralaması
        ranking = await self._get_user_ranking(user_id)
        
        return {
            "user_id": user_id,
            "level": level_info["level"],
            "total_points": profile.get("total_points", 0),
            "level_progress": level_info,
            "achievements": achievements,
            "achievement_count": len(achievements),
            "total_achievements": len(self.achievements),
            "ranking": ranking,
            "streak": await self._get_login_streak(user_id),
            "badges": await self._get_user_badges(user_id)
        }
    
    async def get_leaderboard(
        self,
        leaderboard_type: LeaderboardType = LeaderboardType.WEEKLY,
        subject: Optional[str] = None,
        grade_level: Optional[int] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Liderlik tablosunu getir"""
        # Cache'den kontrol et
        cache_key = f"leaderboard:{leaderboard_type}:{subject}:{grade_level}"
        cached = await cache.get(cache_key, namespace="gamification")
        
        if cached:
            return cached
        
        if not self.db:
            return {"leaderboard": [], "total": 0}
        
        # Query oluştur
        query = {}
        sort_field = "total_points"
        
        if leaderboard_type == LeaderboardType.DAILY:
            # Bugünün puanları
            query["last_activity"] = {"$gte": datetime.utcnow().replace(hour=0, minute=0)}
            sort_field = "daily_points"
        
        elif leaderboard_type == LeaderboardType.WEEKLY:
            # Bu haftanın puanları
            monday = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
            query["last_activity"] = {"$gte": monday.replace(hour=0, minute=0)}
            sort_field = "weekly_points"
        
        elif leaderboard_type == LeaderboardType.MONTHLY:
            # Bu ayın puanları
            first_day = datetime.utcnow().replace(day=1, hour=0, minute=0)
            query["last_activity"] = {"$gte": first_day}
            sort_field = "monthly_points"
        
        # Sınıf seviyesi filtresi
        if grade_level:
            # TODO: Kullanıcı sınıf bilgisini ekle
            pass
        
        # Liderlik tablosu
        leaderboard = await self.db.gamification_profiles.find(query)\
            .sort(sort_field, -1)\
            .skip(offset)\
            .limit(limit)\
            .to_list(limit)
        
        # Kullanıcı bilgilerini ekle
        results = []
        for idx, entry in enumerate(leaderboard):
            # Kullanıcı bilgisi
            user = await self.db.users.find_one({"_id": entry["user_id"]})
            
            results.append({
                "rank": offset + idx + 1,
                "user_id": entry["user_id"],
                "username": user.get("username", "Unknown") if user else "Unknown",
                "avatar": user.get("avatar_url") if user else None,
                "level": entry.get("level", 0),
                "points": entry.get(sort_field, 0),
                "total_points": entry.get("total_points", 0),
                "achievements": len(entry.get("achievements", [])),
                "badges": await self._get_user_badges(entry["user_id"])
            })
        
        total = await self.db.gamification_profiles.count_documents(query)
        
        result = {
            "leaderboard": results,
            "total": total,
            "type": leaderboard_type,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Cache'e kaydet (5 dakika)
        await cache.set(cache_key, result, ttl=300, namespace="gamification")
        
        return result
    
    async def _get_user_ranking(self, user_id: str) -> Dict[str, int]:
        """Kullanıcının sıralamasını getir"""
        if not self.db:
            return {"daily": 0, "weekly": 0, "monthly": 0, "all_time": 0}
        
        profile = await self._get_or_create_profile(user_id)
        
        rankings = {}
        
        # All-time ranking
        all_time_rank = await self.db.gamification_profiles.count_documents({
            "total_points": {"$gt": profile.get("total_points", 0)}
        })
        rankings["all_time"] = all_time_rank + 1
        
        # Weekly ranking
        weekly_rank = await self.db.gamification_profiles.count_documents({
            "weekly_points": {"$gt": profile.get("weekly_points", 0)}
        })
        rankings["weekly"] = weekly_rank + 1
        
        # TODO: Daily ve monthly rankings
        rankings["daily"] = 0
        rankings["monthly"] = 0
        
        return rankings
    
    async def _get_user_badges(self, user_id: str) -> List[str]:
        """Kullanıcının rozetlerini getir (öne çıkan)"""
        profile = await self._get_or_create_profile(user_id)
        achievements = profile.get("achievements", [])
        
        # En nadir 3 rozeti göster
        badges = []
        rarity_order = [
            BadgeRarity.LEGENDARY,
            BadgeRarity.EPIC,
            BadgeRarity.RARE,
            BadgeRarity.UNCOMMON,
            BadgeRarity.COMMON
        ]
        
        for rarity in rarity_order:
            for achievement_id in achievements:
                if achievement_id in self.achievements:
                    achievement = self.achievements[achievement_id]
                    if achievement["rarity"] == rarity:
                        badges.append(achievement["icon"])
                        if len(badges) >= 3:
                            return badges
        
        return badges
    
    async def _get_login_streak(self, user_id: str) -> int:
        """Login streak hesapla"""
        if not self.db:
            return 0
        
        # Login geçmişini kontrol et
        # TODO: Login tracking implement et
        return 0
    
    async def _get_or_create_profile(self, user_id: str) -> Dict:
        """Kullanıcı profilini getir veya oluştur"""
        if not self.db:
            return {}
        
        profile = await self.db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            profile = {
                "user_id": user_id,
                "total_points": 0,
                "level": 0,
                "achievements": [],
                "action_counts": {},
                "created_at": datetime.utcnow(),
                "last_activity": datetime.utcnow(),
                "daily_points": 0,
                "weekly_points": 0,
                "monthly_points": 0
            }
            
            await self.db.gamification_profiles.insert_one(profile)
        
        return profile
    
    async def _update_leaderboard_cache(self, user_id: str, points: int):
        """Liderlik tablosu cache'ini güncelle"""
        # Cache invalidation
        await cache.clear_namespace("gamification")
    
    async def _send_level_up_notification(self, user_id: str, new_level: int):
        """Seviye atlama bildirimi"""
        await notification_service.send_notification(
            user_id=user_id,
            title=f"Seviye Atladın! 🎉",
            message=f"Tebrikler! {new_level}. seviyeye ulaştın!",
            notification_type=["push", "in_app"],
            category=NotificationCategory.ACHIEVEMENT,
            data={"level": new_level}
        )
    
    async def _send_achievement_notification(self, user_id: str, achievement_name: str, description: str):
        """Başarı bildirimi"""
        from app.services.notification_service import NotificationTemplates
        
        template = NotificationTemplates.achievement_unlocked(
            user_name="",  # TODO: Kullanıcı adını al
            achievement_name=achievement_name,
            achievement_description=description
        )
        
        await notification_service.send_notification(
            user_id=user_id,
            title=template["title"],
            message=template["message"],
            notification_type=["push", "in_app"],
            category=template["category"],
            priority=template["priority"],
            template_name=template.get("template_name"),
            template_data=template.get("template_data")
        )
    
    # Daily/Weekly/Monthly reset tasks
    async def reset_daily_points(self):
        """Günlük puanları sıfırla"""
        if self.db:
            await self.db.gamification_profiles.update_many(
                {},
                {"$set": {"daily_points": 0}}
            )
            logger.info("Günlük puanlar sıfırlandı")
    
    async def reset_weekly_points(self):
        """Haftalık puanları sıfırla"""
        if self.db:
            await self.db.gamification_profiles.update_many(
                {},
                {"$set": {"weekly_points": 0}}
            )
            logger.info("Haftalık puanlar sıfırlandı")
    
    async def reset_monthly_points(self):
        """Aylık puanları sıfırla"""
        if self.db:
            await self.db.gamification_profiles.update_many(
                {},
                {"$set": {"monthly_points": 0}}
            )
            logger.info("Aylık puanlar sıfırlandı")


# Global gamification service instance
gamification_service = GamificationService()


# Helper functions for common actions
async def award_lesson_completion(user_id: str, lesson_id: str, metadata: Optional[Dict] = None) -> Dict:
    """Ders tamamlama ödülü"""
    if not metadata:
        metadata = {}
    metadata["lesson_id"] = lesson_id
    
    return await gamification_service.add_points(
        user_id=user_id,
        action="lesson_complete",
        metadata=metadata
    )


async def award_quiz_completion(
    user_id: str,
    quiz_id: str,
    score: float,
    metadata: Optional[Dict] = None
) -> Dict:
    """Quiz tamamlama ödülü"""
    if not metadata:
        metadata = {}
    metadata["quiz_id"] = quiz_id
    metadata["score"] = score
    
    # Normal quiz puanı
    result = await gamification_service.add_points(
        user_id=user_id,
        action="quiz_complete",
        metadata=metadata
    )
    
    # Perfect score bonus
    if score >= 100:
        perfect_result = await gamification_service.add_points(
            user_id=user_id,
            action="quiz_perfect",
            metadata=metadata
        )
        
        # Sonuçları birleştir
        result["points_added"] += perfect_result["points_added"]
        result["achievements_unlocked"].extend(perfect_result["achievements_unlocked"])
    
    return result


async def award_daily_login(user_id: str) -> Dict:
    """Günlük giriş ödülü"""
    # TODO: Günde bir kez kontrol et
    return await gamification_service.add_points(
        user_id=user_id,
        action="daily_login",
        metadata={"timestamp": datetime.utcnow().isoformat()}
    )


async def award_peer_help(helper_id: str, helped_id: str, metadata: Optional[Dict] = None) -> Dict:
    """Arkadaşa yardım ödülü"""
    if not metadata:
        metadata = {}
    metadata["helped_user"] = helped_id
    
    return await gamification_service.add_points(
        user_id=helper_id,
        action="help_peer",
        metadata=metadata
    )
