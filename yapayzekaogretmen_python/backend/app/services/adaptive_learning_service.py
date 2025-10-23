"""
Adaptive Learning Service - Personalized Learning Path
-----------------------------------------------------
Kişiselleştirilmiş ve adaptif öğrenme yolu servisi.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
from dataclasses import dataclass, field
from collections import defaultdict

from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache, cached
from app.services.ai_service import ai_service


class DifficultyLevel(str, Enum):
    """Zorluk seviyeleri"""
    BEGINNER = "beginner"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class LearningPace(str, Enum):
    """Öğrenme hızı"""
    VERY_SLOW = "very_slow"
    SLOW = "slow"
    NORMAL = "normal"
    FAST = "fast"
    VERY_FAST = "very_fast"


class ContentType(str, Enum):
    """İçerik tipi"""
    VIDEO = "video"
    TEXT = "text"
    INTERACTIVE = "interactive"
    QUIZ = "quiz"
    PRACTICE = "practice"
    GAME = "game"
    PROJECT = "project"


@dataclass
class LearningMetrics:
    """Öğrenme metrikleri"""
    success_rate: float = 0.0
    average_time: float = 0.0
    attempt_count: int = 0
    retention_rate: float = 0.0
    engagement_score: float = 0.0
    confidence_level: float = 0.0
    mastery_level: float = 0.0


@dataclass
class StudentLearningProfile:
    """Öğrenci öğrenme profili"""
    user_id: str
    current_level: DifficultyLevel = DifficultyLevel.MEDIUM
    learning_pace: LearningPace = LearningPace.NORMAL
    preferred_content_types: List[ContentType] = field(default_factory=list)
    strong_topics: List[str] = field(default_factory=list)
    weak_topics: List[str] = field(default_factory=list)
    learning_metrics: Dict[str, LearningMetrics] = field(default_factory=dict)
    skill_tree: Dict[str, float] = field(default_factory=dict)
    learning_history: List[Dict] = field(default_factory=list)
    adaptations_made: List[Dict] = field(default_factory=list)


@dataclass
class LearningPath:
    """Öğrenme yolu"""
    id: str
    user_id: str
    subject: str
    current_topic: str
    next_topics: List[str]
    completed_topics: List[str]
    milestones: List[Dict]
    estimated_completion: datetime
    path_type: str  # linear, branching, spiral


@dataclass
class AdaptiveContent:
    """Adaptif içerik"""
    id: str
    topic: str
    type: ContentType
    difficulty: DifficultyLevel
    estimated_time: int  # dakika
    prerequisites: List[str]
    learning_objectives: List[str]
    content_url: str
    metadata: Dict


class AdaptiveLearningService:
    """Adaptif öğrenme servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Adaptasyon parametreleri
        self.adaptation_thresholds = {
            "difficulty_up": 0.85,      # %85 başarı -> zorluk artır
            "difficulty_down": 0.60,    # %60 başarı -> zorluk azalt
            "pace_up": 0.90,           # %90 başarı -> hız artır
            "pace_down": 0.50,         # %50 başarı -> hız azalt
            "mastery": 0.80            # %80 -> ustalık seviyesi
        }
        
        # İçerik önerileri için ağırlıklar
        self.content_weights = {
            "performance": 0.3,
            "preference": 0.2,
            "engagement": 0.2,
            "time_since_last": 0.15,
            "prerequisite": 0.15
        }
        
        # Öğrenme eğrisi parametreleri
        self.learning_curve_params = {
            "initial_difficulty": 0.7,
            "growth_rate": 0.1,
            "plateau_threshold": 0.85
        }
        
        logger.info("Adaptive Learning Service başlatıldı")
    
    async def get_or_create_learning_profile(self, user_id: str) -> StudentLearningProfile:
        """Öğrenci öğrenme profilini getir veya oluştur"""
        # Cache'den kontrol et
        cache_key = f"learning_profile:{user_id}"
        cached_profile = await cache.get(cache_key, namespace="adaptive_learning")
        
        if cached_profile:
            return StudentLearningProfile(**cached_profile)
        
        if not self.db:
            return StudentLearningProfile(user_id=user_id)
        
        # Veritabanından al
        profile_data = await self.db.adaptive_learning_profiles.find_one({"user_id": user_id})
        
        if not profile_data:
            # Yeni profil oluştur
            profile = await self._create_initial_profile(user_id)
            
            # Veritabanına kaydet
            await self.db.adaptive_learning_profiles.insert_one(profile.__dict__)
        else:
            profile = StudentLearningProfile(**profile_data)
        
        # Cache'e kaydet
        await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="adaptive_learning")
        
        return profile
    
    async def _create_initial_profile(self, user_id: str) -> StudentLearningProfile:
        """Başlangıç profili oluştur"""
        # Kullanıcı verilerinden başlangıç seviyesi belirle
        if self.db:
            user = await self.db.users.find_one({"_id": user_id})
            
            if user:
                grade_level = user.get("grade_level", 5)
                
                # Sınıf seviyesine göre başlangıç zorluğu
                if grade_level <= 3:
                    initial_level = DifficultyLevel.BEGINNER
                elif grade_level <= 6:
                    initial_level = DifficultyLevel.EASY
                elif grade_level <= 9:
                    initial_level = DifficultyLevel.MEDIUM
                else:
                    initial_level = DifficultyLevel.HARD
            else:
                initial_level = DifficultyLevel.EASY
        else:
            initial_level = DifficultyLevel.EASY
        
        return StudentLearningProfile(
            user_id=user_id,
            current_level=initial_level,
            learning_pace=LearningPace.NORMAL,
            preferred_content_types=[ContentType.VIDEO, ContentType.INTERACTIVE]
        )
    
    async def track_learning_activity(
        self,
        user_id: str,
        activity: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Öğrenme aktivitesini takip et
        
        Args:
            activity: {
                "type": "quiz|practice|lesson|video",
                "topic": "matematik.kesirler",
                "difficulty": "medium",
                "duration": 1200,  # saniye
                "score": 0.85,  # 0-1 arası
                "attempts": 2,
                "completed": true,
                "engagement_metrics": {...}
            }
        """
        profile = await self.get_or_create_learning_profile(user_id)
        
        # Aktiviteyi geçmişe ekle
        activity["timestamp"] = datetime.utcnow()
        profile.learning_history.append(activity)
        
        # Metrikleri güncelle
        topic = activity.get("topic", "general")
        if topic not in profile.learning_metrics:
            profile.learning_metrics[topic] = LearningMetrics()
        
        metrics = profile.learning_metrics[topic]
        
        # Başarı oranı güncelle (weighted average)
        old_weight = metrics.attempt_count / (metrics.attempt_count + 1)
        new_weight = 1 / (metrics.attempt_count + 1)
        metrics.success_rate = (metrics.success_rate * old_weight) + (activity.get("score", 0) * new_weight)
        
        # Diğer metrikleri güncelle
        metrics.attempt_count += 1
        metrics.average_time = (metrics.average_time * old_weight) + (activity.get("duration", 0) * new_weight)
        metrics.engagement_score = activity.get("engagement_metrics", {}).get("score", 0.5)
        
        # Skill tree güncelle
        await self._update_skill_tree(profile, topic, activity.get("score", 0))
        
        # Adaptasyon gerekli mi kontrol et
        adaptations = await self._check_adaptations_needed(profile, topic, metrics)
        
        if adaptations:
            profile.adaptations_made.extend(adaptations)
            await self._apply_adaptations(profile, adaptations)
        
        # Profili kaydet
        await self._save_profile(profile)
        
        return {
            "profile_updated": True,
            "current_level": profile.current_level,
            "learning_pace": profile.learning_pace,
            "adaptations": adaptations,
            "metrics": {
                "success_rate": metrics.success_rate,
                "mastery_level": profile.skill_tree.get(topic, 0),
                "engagement": metrics.engagement_score
            }
        }
    
    async def _update_skill_tree(
        self,
        profile: StudentLearningProfile,
        topic: str,
        score: float
    ):
        """Beceri ağacını güncelle"""
        # Mevcut beceri seviyesi
        current_skill = profile.skill_tree.get(topic, 0.0)
        
        # Öğrenme eğrisi formülü (logaritmik büyüme)
        growth = self.learning_curve_params["growth_rate"] * (1 - current_skill) * score
        new_skill = min(1.0, current_skill + growth)
        
        profile.skill_tree[topic] = new_skill
        
        # İlişkili becerileri de güncelle (transfer learning)
        related_topics = await self._get_related_topics(topic)
        for related_topic, relation_strength in related_topics:
            if related_topic in profile.skill_tree:
                transfer = growth * relation_strength * 0.3  # %30 transfer
                profile.skill_tree[related_topic] = min(
                    1.0,
                    profile.skill_tree[related_topic] + transfer
                )
    
    async def _get_related_topics(self, topic: str) -> List[Tuple[str, float]]:
        """İlişkili konuları getir"""
        # TODO: Topic ontology'den çek
        # Şimdilik basit bir mapping
        topic_relations = {
            "matematik.kesirler": [
                ("matematik.ondalik_sayilar", 0.8),
                ("matematik.oran_oranti", 0.6),
                ("matematik.yuzde", 0.7)
            ],
            "fen.canlilar": [
                ("fen.ekosistem", 0.7),
                ("fen.besin_zinciri", 0.8),
                ("fen.hucre", 0.6)
            ]
        }
        
        return topic_relations.get(topic, [])
    
    async def _check_adaptations_needed(
        self,
        profile: StudentLearningProfile,
        topic: str,
        metrics: LearningMetrics
    ) -> List[Dict]:
        """Gerekli adaptasyonları kontrol et"""
        adaptations = []
        
        # Zorluk adaptasyonu
        if metrics.attempt_count >= 3:  # En az 3 deneme
            if metrics.success_rate >= self.adaptation_thresholds["difficulty_up"]:
                if profile.current_level != DifficultyLevel.EXPERT:
                    adaptations.append({
                        "type": "difficulty_increase",
                        "reason": "high_success_rate",
                        "metric": metrics.success_rate,
                        "topic": topic
                    })
            
            elif metrics.success_rate <= self.adaptation_thresholds["difficulty_down"]:
                if profile.current_level != DifficultyLevel.BEGINNER:
                    adaptations.append({
                        "type": "difficulty_decrease",
                        "reason": "low_success_rate",
                        "metric": metrics.success_rate,
                        "topic": topic
                    })
        
        # Hız adaptasyonu
        if len(profile.learning_history) >= 5:
            recent_scores = [h.get("score", 0) for h in profile.learning_history[-5:]]
            avg_recent_score = np.mean(recent_scores)
            
            if avg_recent_score >= self.adaptation_thresholds["pace_up"]:
                if profile.learning_pace not in [LearningPace.FAST, LearningPace.VERY_FAST]:
                    adaptations.append({
                        "type": "pace_increase",
                        "reason": "consistent_high_performance",
                        "metric": avg_recent_score
                    })
            
            elif avg_recent_score <= self.adaptation_thresholds["pace_down"]:
                if profile.learning_pace not in [LearningPace.SLOW, LearningPace.VERY_SLOW]:
                    adaptations.append({
                        "type": "pace_decrease",
                        "reason": "struggling_with_content",
                        "metric": avg_recent_score
                    })
        
        # İçerik tipi adaptasyonu
        if metrics.engagement_score < 0.4:
            adaptations.append({
                "type": "content_type_change",
                "reason": "low_engagement",
                "metric": metrics.engagement_score,
                "suggestion": "more_interactive"
            })
        
        return adaptations
    
    async def _apply_adaptations(
        self,
        profile: StudentLearningProfile,
        adaptations: List[Dict]
    ):
        """Adaptasyonları uygula"""
        difficulty_map = {
            DifficultyLevel.BEGINNER: 0,
            DifficultyLevel.EASY: 1,
            DifficultyLevel.MEDIUM: 2,
            DifficultyLevel.HARD: 3,
            DifficultyLevel.EXPERT: 4
        }
        
        pace_map = {
            LearningPace.VERY_SLOW: 0,
            LearningPace.SLOW: 1,
            LearningPace.NORMAL: 2,
            LearningPace.FAST: 3,
            LearningPace.VERY_FAST: 4
        }
        
        for adaptation in adaptations:
            if adaptation["type"] == "difficulty_increase":
                current_idx = difficulty_map[profile.current_level]
                if current_idx < 4:
                    profile.current_level = list(difficulty_map.keys())[current_idx + 1]
            
            elif adaptation["type"] == "difficulty_decrease":
                current_idx = difficulty_map[profile.current_level]
                if current_idx > 0:
                    profile.current_level = list(difficulty_map.keys())[current_idx - 1]
            
            elif adaptation["type"] == "pace_increase":
                current_idx = pace_map[profile.learning_pace]
                if current_idx < 4:
                    profile.learning_pace = list(pace_map.keys())[current_idx + 1]
            
            elif adaptation["type"] == "pace_decrease":
                current_idx = pace_map[profile.learning_pace]
                if current_idx > 0:
                    profile.learning_pace = list(pace_map.keys())[current_idx - 1]
            
            elif adaptation["type"] == "content_type_change":
                # İnteraktif içeriği tercih listesine ekle
                if ContentType.INTERACTIVE not in profile.preferred_content_types:
                    profile.preferred_content_types.insert(0, ContentType.INTERACTIVE)
                if ContentType.GAME not in profile.preferred_content_types:
                    profile.preferred_content_types.append(ContentType.GAME)
    
    async def get_adaptive_content_recommendations(
        self,
        user_id: str,
        subject: str,
        topic: Optional[str] = None,
        count: int = 5
    ) -> List[AdaptiveContent]:
        """Adaptif içerik önerileri getir"""
        profile = await self.get_or_create_learning_profile(user_id)
        
        # İçerik havuzunu filtrele
        content_pool = await self._get_content_pool(subject, topic, profile.current_level)
        
        if not content_pool:
            return []
        
        # İçerikleri skorla
        scored_content = []
        for content in content_pool:
            score = await self._calculate_content_score(content, profile)
            scored_content.append((content, score))
        
        # En yüksek skorlu içerikleri seç
        scored_content.sort(key=lambda x: x[1], reverse=True)
        
        recommendations = []
        for content, score in scored_content[:count]:
            recommendations.append(AdaptiveContent(
                id=content["id"],
                topic=content["topic"],
                type=ContentType(content["type"]),
                difficulty=DifficultyLevel(content["difficulty"]),
                estimated_time=content["estimated_time"],
                prerequisites=content.get("prerequisites", []),
                learning_objectives=content.get("objectives", []),
                content_url=content["url"],
                metadata={
                    "recommendation_score": score,
                    "reason": self._get_recommendation_reason(content, profile)
                }
            ))
        
        return recommendations
    
    async def _get_content_pool(
        self,
        subject: str,
        topic: Optional[str],
        level: DifficultyLevel
    ) -> List[Dict]:
        """İçerik havuzunu getir"""
        if not self.db:
            return []
        
        # Zorluk seviyesi aralığı (current ± 1)
        difficulty_range = self._get_difficulty_range(level)
        
        query = {
            "subject": subject,
            "difficulty": {"$in": difficulty_range},
            "status": "active"
        }
        
        if topic:
            query["topic"] = topic
        
        content = await self.db.adaptive_content.find(query).limit(50).to_list(50)
        
        return content
    
    def _get_difficulty_range(self, level: DifficultyLevel) -> List[str]:
        """Zorluk seviyesi aralığını getir"""
        levels = list(DifficultyLevel)
        current_idx = levels.index(level)
        
        range_indices = [
            max(0, current_idx - 1),
            current_idx,
            min(len(levels) - 1, current_idx + 1)
        ]
        
        return [levels[i].value for i in range_indices]
    
    async def _calculate_content_score(
        self,
        content: Dict,
        profile: StudentLearningProfile
    ) -> float:
        """İçerik skorunu hesapla"""
        score = 0.0
        
        # Performans skoru
        topic_metrics = profile.learning_metrics.get(content["topic"], LearningMetrics())
        if topic_metrics.success_rate > 0:
            # Çok kolay veya çok zor içerikten kaçın
            optimal_difficulty = 0.7  # %70 başarı hedefi
            performance_score = 1 - abs(topic_metrics.success_rate - optimal_difficulty)
            score += performance_score * self.content_weights["performance"]
        
        # Tercih skoru
        if ContentType(content["type"]) in profile.preferred_content_types:
            preference_idx = profile.preferred_content_types.index(ContentType(content["type"]))
            preference_score = 1 - (preference_idx * 0.2)  # İlk tercih %100, ikinci %80...
            score += preference_score * self.content_weights["preference"]
        
        # Engagement skoru
        if topic_metrics.engagement_score > 0:
            score += topic_metrics.engagement_score * self.content_weights["engagement"]
        
        # Zaman skoru (son görülmeden geçen zaman)
        last_seen = self._get_last_seen_time(content["topic"], profile.learning_history)
        if last_seen:
            days_since = (datetime.utcnow() - last_seen).days
            time_score = min(1.0, days_since / 7)  # 7 günde maksimum skor
            score += time_score * self.content_weights["time_since_last"]
        
        # Prerequisite skoru
        prereq_score = await self._calculate_prerequisite_score(
            content.get("prerequisites", []),
            profile.skill_tree
        )
        score += prereq_score * self.content_weights["prerequisite"]
        
        return score
    
    async def _calculate_prerequisite_score(
        self,
        prerequisites: List[str],
        skill_tree: Dict[str, float]
    ) -> float:
        """Önkoşul skorunu hesapla"""
        if not prerequisites:
            return 1.0
        
        prereq_scores = []
        for prereq in prerequisites:
            skill_level = skill_tree.get(prereq, 0.0)
            prereq_scores.append(skill_level)
        
        # Tüm önkoşulların minimum seviyesi
        return min(prereq_scores) if prereq_scores else 1.0
    
    def _get_last_seen_time(
        self,
        topic: str,
        history: List[Dict]
    ) -> Optional[datetime]:
        """Konunun son görülme zamanını getir"""
        for activity in reversed(history):
            if activity.get("topic") == topic:
                return activity.get("timestamp")
        return None
    
    def _get_recommendation_reason(
        self,
        content: Dict,
        profile: StudentLearningProfile
    ) -> str:
        """Öneri nedenini belirle"""
        reasons = []
        
        # Zorluk uyumu
        if content["difficulty"] == profile.current_level.value:
            reasons.append("Seviyene uygun")
        
        # Tercih uyumu
        if ContentType(content["type"]) in profile.preferred_content_types[:2]:
            reasons.append("Tercih ettiğin içerik tipi")
        
        # Performans
        topic_metrics = profile.learning_metrics.get(content["topic"], LearningMetrics())
        if topic_metrics.success_rate > 0.6 and topic_metrics.success_rate < 0.8:
            reasons.append("Optimal zorluk seviyesi")
        
        return " • ".join(reasons) if reasons else "Önerilen içerik"
    
    async def generate_learning_path(
        self,
        user_id: str,
        subject: str,
        target_topics: List[str],
        deadline: Optional[datetime] = None
    ) -> LearningPath:
        """Kişiselleştirilmiş öğrenme yolu oluştur"""
        profile = await self.get_or_create_learning_profile(user_id)
        
        # Topic bağımlılıklarını analiz et
        topic_graph = await self._build_topic_dependency_graph(target_topics)
        
        # Optimal sıralama belirle
        ordered_topics = self._topological_sort(topic_graph, profile.skill_tree)
        
        # Süre tahmini
        estimated_hours = await self._estimate_learning_time(
            ordered_topics,
            profile.learning_pace,
            profile.skill_tree
        )
        
        # Milestones oluştur
        milestones = self._create_milestones(ordered_topics, estimated_hours)
        
        # Tamamlanma tahmini
        if deadline:
            estimated_completion = deadline
        else:
            study_hours_per_day = 2  # Günde ortalama 2 saat
            days_needed = int(np.ceil(sum(estimated_hours.values()) / study_hours_per_day))
            estimated_completion = datetime.utcnow() + timedelta(days=days_needed)
        
        # Learning path oluştur
        path = LearningPath(
            id=f"path_{user_id}_{subject}_{datetime.utcnow().timestamp()}",
            user_id=user_id,
            subject=subject,
            current_topic=ordered_topics[0] if ordered_topics else "",
            next_topics=ordered_topics[1:] if len(ordered_topics) > 1 else [],
            completed_topics=[],
            milestones=milestones,
            estimated_completion=estimated_completion,
            path_type="adaptive"  # Adaptif yol
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.learning_paths.insert_one({
                **path.__dict__,
                "created_at": datetime.utcnow(),
                "status": "active"
            })
        
        return path
    
    async def _build_topic_dependency_graph(
        self,
        topics: List[str]
    ) -> Dict[str, List[str]]:
        """Konu bağımlılık grafiği oluştur"""
        # TODO: Gerçek bağımlılıkları veritabanından çek
        # Şimdilik örnek
        dependencies = {
            "matematik.kesirler": [],
            "matematik.ondalik_sayilar": ["matematik.kesirler"],
            "matematik.yuzde": ["matematik.kesirler", "matematik.ondalik_sayilar"],
            "matematik.oran_oranti": ["matematik.kesirler"]
        }
        
        # Sadece istenen konuları filtrele
        filtered = {}
        for topic in topics:
            if topic in dependencies:
                filtered[topic] = [dep for dep in dependencies[topic] if dep in topics]
            else:
                filtered[topic] = []
        
        return filtered
    
    def _topological_sort(
        self,
        graph: Dict[str, List[str]],
        skill_tree: Dict[str, float]
    ) -> List[str]:
        """Topolojik sıralama ile optimal öğrenme sırası"""
        # Kahn's algorithm
        in_degree = {node: 0 for node in graph}
        
        for node in graph:
            for neighbor in graph[node]:
                in_degree[neighbor] = in_degree.get(neighbor, 0) + 1
        
        # Başlangıç düğümleri (bağımlılığı olmayan)
        queue = [node for node in graph if in_degree[node] == 0]
        
        # Skill tree'ye göre sırala
        queue.sort(key=lambda x: skill_tree.get(x, 0), reverse=True)
        
        result = []
        while queue:
            node = queue.pop(0)
            result.append(node)
            
            # Komşuların in-degree'sini azalt
            for neighbor in graph.get(node, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
            
            # Queue'yu skill'e göre sırala
            queue.sort(key=lambda x: skill_tree.get(x, 0), reverse=True)
        
        return result
    
    async def _estimate_learning_time(
        self,
        topics: List[str],
        pace: LearningPace,
        skill_tree: Dict[str, float]
    ) -> Dict[str, float]:
        """Öğrenme süresi tahmini"""
        # Temel öğrenme süreleri (saat)
        base_times = {
            "easy": 2,
            "medium": 4,
            "hard": 6
        }
        
        # Hız çarpanları
        pace_multipliers = {
            LearningPace.VERY_SLOW: 1.5,
            LearningPace.SLOW: 1.25,
            LearningPace.NORMAL: 1.0,
            LearningPace.FAST: 0.75,
            LearningPace.VERY_FAST: 0.5
        }
        
        estimates = {}
        for topic in topics:
            # Mevcut skill seviyesine göre ayarla
            current_skill = skill_tree.get(topic, 0.0)
            skill_multiplier = 1 - (current_skill * 0.3)  # Max %30 azalma
            
            # Konu zorluğunu tahmin et (TODO: gerçek veri kullan)
            difficulty = "medium"
            base_time = base_times.get(difficulty, 4)
            
            # Final süre
            estimated_time = base_time * pace_multipliers[pace] * skill_multiplier
            estimates[topic] = round(estimated_time, 1)
        
        return estimates
    
    def _create_milestones(
        self,
        topics: List[str],
        time_estimates: Dict[str, float]
    ) -> List[Dict]:
        """Öğrenme kilometre taşları oluştur"""
        milestones = []
        cumulative_time = 0
        
        # Her 3 konuda bir milestone
        for i in range(0, len(topics), 3):
            milestone_topics = topics[i:i+3]
            milestone_time = sum(time_estimates.get(t, 0) for t in milestone_topics)
            cumulative_time += milestone_time
            
            milestones.append({
                "id": f"milestone_{i//3 + 1}",
                "name": f"Aşama {i//3 + 1}",
                "topics": milestone_topics,
                "estimated_hours": milestone_time,
                "cumulative_hours": cumulative_time,
                "rewards": {
                    "points": 100 * (i//3 + 1),
                    "badge": f"milestone_{i//3 + 1}_complete"
                }
            })
        
        return milestones
    
    async def update_learning_path_progress(
        self,
        user_id: str,
        path_id: str,
        completed_topic: str
    ) -> Dict[str, Any]:
        """Öğrenme yolu ilerlemesini güncelle"""
        if not self.db:
            return {"success": False, "error": "Database not available"}
        
        # Path'i getir
        path_data = await self.db.learning_paths.find_one({
            "id": path_id,
            "user_id": user_id
        })
        
        if not path_data:
            return {"success": False, "error": "Learning path not found"}
        
        path = LearningPath(**path_data)
        
        # İlerlemeyi güncelle
        if completed_topic == path.current_topic:
            path.completed_topics.append(completed_topic)
            
            if path.next_topics:
                path.current_topic = path.next_topics.pop(0)
            else:
                path.current_topic = None  # Tamamlandı
        
        # Veritabanında güncelle
        await self.db.learning_paths.update_one(
            {"id": path_id},
            {
                "$set": {
                    "current_topic": path.current_topic,
                    "next_topics": path.next_topics,
                    "completed_topics": path.completed_topics,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # İlerleme yüzdesi
        total_topics = len(path.completed_topics) + len(path.next_topics) + (1 if path.current_topic else 0)
        progress_percentage = (len(path.completed_topics) / total_topics * 100) if total_topics > 0 else 0
        
        return {
            "success": True,
            "current_topic": path.current_topic,
            "completed_topics": path.completed_topics,
            "remaining_topics": path.next_topics,
            "progress_percentage": round(progress_percentage, 1),
            "path_completed": path.current_topic is None
        }
    
    async def get_learning_insights(
        self,
        user_id: str,
        time_period_days: int = 30
    ) -> Dict[str, Any]:
        """Öğrenme içgörüleri ve analizler"""
        profile = await self.get_or_create_learning_profile(user_id)
        
        # Son aktiviteleri filtrele
        cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)
        recent_activities = [
            a for a in profile.learning_history
            if a.get("timestamp", datetime.min) > cutoff_date
        ]
        
        if not recent_activities:
            return {
                "period_days": time_period_days,
                "insights": {
                    "message": "Bu dönemde yeterli veri yok"
                }
            }
        
        # Analizler
        insights = {
            "period_days": time_period_days,
            "total_activities": len(recent_activities),
            "total_time_hours": sum(a.get("duration", 0) for a in recent_activities) / 3600,
            "average_score": np.mean([a.get("score", 0) for a in recent_activities]),
            "improvement_rate": self._calculate_improvement_rate(recent_activities),
            "strongest_topics": self._get_strongest_topics(profile.skill_tree, 3),
            "topics_to_review": self._get_topics_to_review(profile.learning_metrics, 3),
            "learning_patterns": self._analyze_learning_patterns(recent_activities),
            "recommendations": await self._generate_insights_recommendations(profile, recent_activities)
        }
        
        return insights
    
    def _calculate_improvement_rate(self, activities: List[Dict]) -> float:
        """İyileşme oranını hesapla"""
        if len(activities) < 2:
            return 0.0
        
        # İlk ve son dönem ortalamalarını karşılaştır
        mid_point = len(activities) // 2
        first_half = activities[:mid_point]
        second_half = activities[mid_point:]
        
        first_avg = np.mean([a.get("score", 0) for a in first_half])
        second_avg = np.mean([a.get("score", 0) for a in second_half])
        
        improvement = ((second_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0
        
        return round(improvement, 1)
    
    def _get_strongest_topics(
        self,
        skill_tree: Dict[str, float],
        count: int
    ) -> List[Dict]:
        """En güçlü konuları getir"""
        sorted_skills = sorted(
            skill_tree.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [
            {"topic": topic, "mastery": round(skill * 100, 1)}
            for topic, skill in sorted_skills[:count]
        ]
    
    def _get_topics_to_review(
        self,
        metrics: Dict[str, LearningMetrics],
        count: int
    ) -> List[Dict]:
        """Tekrar edilmesi gereken konuları getir"""
        topics_to_review = []
        
        for topic, metric in metrics.items():
            if metric.success_rate < 0.7 and metric.attempt_count > 0:
                topics_to_review.append({
                    "topic": topic,
                    "success_rate": round(metric.success_rate * 100, 1),
                    "attempts": metric.attempt_count
                })
        
        # Başarı oranına göre sırala
        topics_to_review.sort(key=lambda x: x["success_rate"])
        
        return topics_to_review[:count]
    
    def _analyze_learning_patterns(self, activities: List[Dict]) -> Dict:
        """Öğrenme kalıplarını analiz et"""
        # Gün ve saat analizi
        activity_by_hour = defaultdict(int)
        activity_by_day = defaultdict(int)
        
        for activity in activities:
            timestamp = activity.get("timestamp", datetime.utcnow())
            activity_by_hour[timestamp.hour] += 1
            activity_by_day[timestamp.weekday()] += 1
        
        # En verimli saatler
        best_hours = sorted(
            activity_by_hour.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        # En aktif günler
        days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
        best_days = sorted(
            activity_by_day.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return {
            "best_study_hours": [{"hour": h, "count": c} for h, c in best_hours],
            "most_active_days": [{"day": days[d], "count": c} for d, c in best_days],
            "average_session_duration": np.mean([a.get("duration", 0) for a in activities]) / 60  # dakika
        }
    
    async def _generate_insights_recommendations(
        self,
        profile: StudentLearningProfile,
        activities: List[Dict]
    ) -> List[str]:
        """İçgörü bazlı öneriler üret"""
        recommendations = []
        
        # Performans bazlı
        avg_score = np.mean([a.get("score", 0) for a in activities])
        if avg_score < 0.6:
            recommendations.append("Konuları daha küçük parçalara bölerek çalışmayı dene")
        elif avg_score > 0.85:
            recommendations.append("Harika gidiyorsun! Daha zorlu konulara geçebilirsin")
        
        # Hız bazlı
        if profile.learning_pace == LearningPace.VERY_SLOW:
            recommendations.append("Acele etme, kendi hızında ilerle. Temel konuları sağlamlaştır")
        elif profile.learning_pace == LearningPace.VERY_FAST:
            recommendations.append("İleri seviye projeler ve yarışmalara katılmayı düşün")
        
        # Zayıf konular
        weak_topics = [t for t, m in profile.learning_metrics.items() if m.success_rate < 0.6]
        if weak_topics:
            recommendations.append(f"Şu konulara odaklan: {', '.join(weak_topics[:2])}")
        
        # Çalışma düzeni
        study_pattern = self._analyze_learning_patterns(activities)
        if study_pattern["average_session_duration"] < 15:
            recommendations.append("Çalışma sürelerini biraz uzatmayı dene (20-25 dakika ideal)")
        elif study_pattern["average_session_duration"] > 60:
            recommendations.append("Uzun çalışma seanslarını molalarla böl (Pomodoro tekniği)")
        
        return recommendations[:3]  # En fazla 3 öneri
    
    async def _save_profile(self, profile: StudentLearningProfile):
        """Profili kaydet"""
        if self.db:
            await self.db.adaptive_learning_profiles.update_one(
                {"user_id": profile.user_id},
                {"$set": profile.__dict__},
                upsert=True
            )
        
        # Cache'i güncelle
        cache_key = f"learning_profile:{profile.user_id}"
        await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="adaptive_learning")


# Global adaptive learning service instance
adaptive_learning_service = AdaptiveLearningService()


# Helper functions
async def track_activity(user_id: str, activity: Dict) -> Dict:
    """Öğrenme aktivitesini takip et"""
    return await adaptive_learning_service.track_learning_activity(user_id, activity)


async def get_recommendations(
    user_id: str,
    subject: str,
    topic: Optional[str] = None,
    count: int = 5
) -> List[AdaptiveContent]:
    """Adaptif içerik önerileri al"""
    return await adaptive_learning_service.get_adaptive_content_recommendations(
        user_id, subject, topic, count
    )


async def create_learning_path(
    user_id: str,
    subject: str,
    topics: List[str],
    deadline: Optional[datetime] = None
) -> LearningPath:
    """Öğrenme yolu oluştur"""
    return await adaptive_learning_service.generate_learning_path(
        user_id, subject, topics, deadline
    )
