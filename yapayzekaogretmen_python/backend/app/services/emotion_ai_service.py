"""
Emotion AI Service - Emotional Intelligence & Motivation
-------------------------------------------------------
Duygu analizi, motivasyon takibi ve duygusal zeka servisi.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import base64
import io
import numpy as np
from dataclasses import dataclass, field
from collections import defaultdict

from loguru import logger
import cv2

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.ai_service import ai_service
from app.services.notification_service import notification_service
from app.services.gamification_service import gamification_service


class EmotionType(str, Enum):
    """Duygu tipleri"""
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    SURPRISED = "surprised"
    NEUTRAL = "neutral"
    CONFUSED = "confused"
    FOCUSED = "focused"
    BORED = "bored"
    STRESSED = "stressed"
    EXCITED = "excited"


class MoodLevel(str, Enum):
    """Ruh hali seviyeleri"""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"


class StressLevel(str, Enum):
    """Stres seviyeleri"""
    RELAXED = "relaxed"
    NORMAL = "normal"
    MILD_STRESS = "mild_stress"
    MODERATE_STRESS = "moderate_stress"
    HIGH_STRESS = "high_stress"


class MotivationType(str, Enum):
    """Motivasyon tipleri"""
    ACHIEVEMENT = "achievement"      # Başarı odaklı
    RECOGNITION = "recognition"      # Takdir odaklı
    CHALLENGE = "challenge"          # Meydan okuma
    PROGRESS = "progress"           # İlerleme odaklı
    SOCIAL = "social"               # Sosyal motivasyon
    REWARD = "reward"               # Ödül odaklı


@dataclass
class EmotionAnalysis:
    """Duygu analiz sonucu"""
    timestamp: datetime
    primary_emotion: EmotionType
    emotion_scores: Dict[EmotionType, float]
    confidence: float
    mood_level: MoodLevel
    stress_level: StressLevel
    attention_level: float  # 0-1 arası
    engagement_score: float  # 0-1 arası
    source: str  # face, voice, text, combined


@dataclass
class MotivationProfile:
    """Motivasyon profili"""
    user_id: str
    primary_motivation: MotivationType
    motivation_triggers: List[str]
    demotivation_triggers: List[str]
    preferred_rewards: List[str]
    emotional_patterns: Dict[str, List[EmotionType]]
    resilience_score: float  # 0-1 arası
    last_updated: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EmotionalState:
    """Duygusal durum"""
    user_id: str
    current_emotion: EmotionType
    current_mood: MoodLevel
    current_stress: StressLevel
    energy_level: float  # 0-1 arası
    focus_duration: int  # dakika
    last_break: Optional[datetime] = None
    study_efficiency: float = 0.0
    needs_intervention: bool = False
    recommended_actions: List[str] = field(default_factory=list)


@dataclass
class EmotionHistory:
    """Duygu geçmişi"""
    user_id: str
    date: datetime
    emotions: List[EmotionAnalysis]
    average_mood: MoodLevel
    stress_peaks: List[Tuple[datetime, StressLevel]]
    productive_periods: List[Tuple[datetime, datetime]]
    total_study_time: int  # dakika
    mood_changes: int
    interventions_triggered: int


class EmotionAIService:
    """Emotion AI servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Duygu tanıma modelleri (placeholder)
        self.face_cascade = None
        self._load_face_detector()
        
        # Duygu-renk eşlemeleri
        self.emotion_colors = {
            EmotionType.HAPPY: "#4CAF50",
            EmotionType.SAD: "#2196F3",
            EmotionType.ANGRY: "#F44336",
            EmotionType.SURPRISED: "#FF9800",
            EmotionType.NEUTRAL: "#9E9E9E",
            EmotionType.CONFUSED: "#9C27B0",
            EmotionType.FOCUSED: "#00BCD4",
            EmotionType.BORED: "#795548",
            EmotionType.STRESSED: "#E91E63",
            EmotionType.EXCITED: "#FFEB3B"
        }
        
        # Müdahale eşikleri
        self.intervention_thresholds = {
            "stress_duration": 30,  # dakika
            "low_energy_duration": 20,  # dakika
            "negative_mood_count": 3,  # ardışık negatif
            "focus_loss_duration": 15  # dakika
        }
        
        # Motivasyon mesajları
        self.motivation_messages = self._load_motivation_messages()
        
        logger.info("Emotion AI Service başlatıldı")
    
    def _load_face_detector(self):
        """Yüz tanıma detektörü yükle"""
        try:
            # OpenCV haar cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception as e:
            logger.error(f"Face detector yükleme hatası: {e}")
    
    def _load_motivation_messages(self) -> Dict[str, List[str]]:
        """Motivasyon mesajlarını yükle"""
        return {
            EmotionType.STRESSED: [
                "Derin bir nefes al! Her şey yoluna girecek. 🌟",
                "Biraz ara vermek iyi gelecektir. 5 dakika mola! ☕",
                "Stres geçici, başarın kalıcı! Sen yapabilirsin! 💪"
            ],
            EmotionType.BORED: [
                "Hadi biraz oyunlaştıralım! Bir challenge'a ne dersin? 🎮",
                "Konuyu değiştirelim mi? Belki farklı bir yaklaşım... 🔄",
                "Küçük bir egzersiz molası enerjini yükseltebilir! 🏃"
            ],
            EmotionType.SAD: [
                "Üzülme, herkesin zor günleri olur. Yanındayım! 💙",
                "Bugün zor olabilir ama yarın yeni bir gün! 🌈",
                "Başarılarını hatırla, sen harikasın! ⭐"
            ],
            EmotionType.CONFUSED: [
                "Kafan mı karıştı? Adım adım gidelim! 📚",
                "Bu normal! Her yeni bilgi başta karmaşık gelir. 🧩",
                "Farklı bir açıdan bakalım, belki daha net olur! 💡"
            ],
            EmotionType.HAPPY: [
                "Harika gidiyorsun! Bu enerjiyi koru! 🎉",
                "Gülümsemen bulaşıcı! Öğrenmek eğlenceli! 😊",
                "Pozitif enerjin başarıyı getiriyor! 🌟"
            ]
        }
    
    async def analyze_facial_emotion(
        self,
        image_data: bytes,
        user_id: str
    ) -> EmotionAnalysis:
        """Yüz ifadesi analizi"""
        try:
            # Görüntüyü numpy array'e dönüştür
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Yüz tespiti
            if self.face_cascade is not None:
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) == 0:
                    return self._create_default_analysis("face")
            
            # AI ile duygu analizi
            emotion_scores = await self._analyze_with_ai(image_data, "face")
            
            # En yüksek skorlu duygu
            primary_emotion = max(emotion_scores.items(), key=lambda x: x[1])[0]
            
            # Mood ve stress hesapla
            mood_level = self._calculate_mood_level(emotion_scores)
            stress_level = self._calculate_stress_level(emotion_scores)
            
            # Dikkat ve katılım skorları
            attention_level = emotion_scores.get(EmotionType.FOCUSED, 0.5)
            engagement_score = self._calculate_engagement(emotion_scores)
            
            analysis = EmotionAnalysis(
                timestamp=datetime.utcnow(),
                primary_emotion=primary_emotion,
                emotion_scores=emotion_scores,
                confidence=max(emotion_scores.values()),
                mood_level=mood_level,
                stress_level=stress_level,
                attention_level=attention_level,
                engagement_score=engagement_score,
                source="face"
            )
            
            # Geçmişe kaydet
            await self._save_emotion_analysis(user_id, analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Facial emotion analysis hatası: {e}")
            return self._create_default_analysis("face")
    
    async def analyze_text_emotion(
        self,
        text: str,
        user_id: str
    ) -> EmotionAnalysis:
        """Metin duygu analizi"""
        # AI ile duygu analizi
        emotion_scores = await self._analyze_text_with_ai(text)
        
        # En yüksek skorlu duygu
        primary_emotion = max(emotion_scores.items(), key=lambda x: x[1])[0]
        
        # Mood ve stress hesapla
        mood_level = self._calculate_mood_level(emotion_scores)
        stress_level = self._calculate_stress_from_text(text)
        
        analysis = EmotionAnalysis(
            timestamp=datetime.utcnow(),
            primary_emotion=primary_emotion,
            emotion_scores=emotion_scores,
            confidence=max(emotion_scores.values()),
            mood_level=mood_level,
            stress_level=stress_level,
            attention_level=0.5,  # Text'ten tahmin edilemez
            engagement_score=self._calculate_engagement(emotion_scores),
            source="text"
        )
        
        # Geçmişe kaydet
        await self._save_emotion_analysis(user_id, analysis)
        
        return analysis
    
    async def get_emotional_state(
        self,
        user_id: str
    ) -> EmotionalState:
        """Kullanıcının güncel duygusal durumunu getir"""
        # Son analizleri al
        recent_analyses = await self._get_recent_analyses(user_id, minutes=30)
        
        if not recent_analyses:
            # Varsayılan durum
            return EmotionalState(
                user_id=user_id,
                current_emotion=EmotionType.NEUTRAL,
                current_mood=MoodLevel.NEUTRAL,
                current_stress=StressLevel.NORMAL,
                energy_level=0.7,
                focus_duration=0
            )
        
        # En son analiz
        latest = recent_analyses[0]
        
        # Ortalama değerler
        avg_energy = np.mean([
            1 - a.emotion_scores.get(EmotionType.BORED, 0)
            for a in recent_analyses
        ])
        
        # Focus süresi hesapla
        focus_duration = self._calculate_focus_duration(recent_analyses)
        
        # Müdahale gerekiyor mu?
        needs_intervention = await self._check_intervention_needed(
            user_id,
            recent_analyses
        )
        
        # Öneriler
        recommendations = await self._get_recommendations(
            latest.primary_emotion,
            latest.stress_level,
            avg_energy
        )
        
        state = EmotionalState(
            user_id=user_id,
            current_emotion=latest.primary_emotion,
            current_mood=latest.mood_level,
            current_stress=latest.stress_level,
            energy_level=avg_energy,
            focus_duration=focus_duration,
            last_break=await self._get_last_break(user_id),
            study_efficiency=latest.engagement_score,
            needs_intervention=needs_intervention,
            recommended_actions=recommendations
        )
        
        # Cache'e kaydet
        cache_key = f"emotional_state:{user_id}"
        await cache.set(cache_key, state.__dict__, ttl=300, namespace="emotion")
        
        return state
    
    async def get_motivation_profile(
        self,
        user_id: str
    ) -> MotivationProfile:
        """Kullanıcının motivasyon profilini getir"""
        # Cache'den kontrol
        cache_key = f"motivation_profile:{user_id}"
        cached = await cache.get(cache_key, namespace="emotion")
        if cached:
            return MotivationProfile(**cached)
        
        if not self.db:
            # Varsayılan profil
            return MotivationProfile(
                user_id=user_id,
                primary_motivation=MotivationType.ACHIEVEMENT,
                motivation_triggers=["yeni rozet", "seviye atlama", "yüksek puan"],
                demotivation_triggers=["zor sorular", "düşük puan", "uzun dersler"],
                preferred_rewards=["rozet", "puan", "sertifika"],
                emotional_patterns={},
                resilience_score=0.7
            )
        
        # Veritabanından al veya oluştur
        profile_data = await self.db.motivation_profiles.find_one({"user_id": user_id})
        
        if not profile_data:
            # Geçmiş verilerden profil oluştur
            profile = await self._create_motivation_profile(user_id)
            await self.db.motivation_profiles.insert_one(profile.__dict__)
        else:
            profile = MotivationProfile(**profile_data)
        
        # Cache'e kaydet
        await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="emotion")
        
        return profile
    
    async def _create_motivation_profile(
        self,
        user_id: str
    ) -> MotivationProfile:
        """Kullanıcı verilerinden motivasyon profili oluştur"""
        # Gamification verilerini al
        from app.services.gamification_service import gamification_service
        game_profile = await gamification_service.get_user_profile(user_id)
        
        # En çok kazanılan başarılardan motivasyon tipini çıkar
        primary_motivation = MotivationType.ACHIEVEMENT  # Default
        
        if game_profile["achievement_count"] > 20:
            primary_motivation = MotivationType.ACHIEVEMENT
        elif game_profile["level"] > 10:
            primary_motivation = MotivationType.PROGRESS
        
        # Duygusal kalıpları analiz et
        emotion_history = await self._get_emotion_history(user_id, days=30)
        patterns = self._analyze_emotional_patterns(emotion_history)
        
        return MotivationProfile(
            user_id=user_id,
            primary_motivation=primary_motivation,
            motivation_triggers=["başarı", "ilerleme", "ödül"],
            demotivation_triggers=["başarısızlık", "zorluk"],
            preferred_rewards=["puan", "rozet", "seviye"],
            emotional_patterns=patterns,
            resilience_score=0.7
        )
    
    async def provide_emotional_support(
        self,
        user_id: str,
        current_emotion: Optional[EmotionType] = None
    ) -> Dict[str, Any]:
        """Duygusal destek sağla"""
        # Mevcut durumu al
        if not current_emotion:
            state = await self.get_emotional_state(user_id)
            current_emotion = state.current_emotion
        
        # Motivasyon profili
        profile = await self.get_motivation_profile(user_id)
        
        # Uygun mesaj seç
        support_message = await self._generate_support_message(
            current_emotion,
            profile
        )
        
        # Önerilen aktiviteler
        activities = self._suggest_activities(current_emotion)
        
        # Gamification entegrasyonu
        reward = None
        if current_emotion in [EmotionType.STRESSED, EmotionType.SAD]:
            # Moral boost ödülü
            await gamification_service.add_points(
                user_id=user_id,
                action="emotional_support_received",
                metadata={"emotion": current_emotion}
            )
            reward = {"type": "points", "amount": 10}
        
        return {
            "message": support_message,
            "emotion_detected": current_emotion,
            "suggested_activities": activities,
            "reward": reward,
            "breathing_exercise": current_emotion == EmotionType.STRESSED,
            "music_recommendation": self._get_music_recommendation(current_emotion)
        }
    
    async def track_study_mood(
        self,
        user_id: str,
        session_id: str,
        mood_updates: List[Dict]
    ) -> Dict[str, Any]:
        """Çalışma oturumu ruh hali takibi"""
        if not self.db:
            return {"success": False}
        
        # Mood değişimlerini kaydet
        session_data = {
            "user_id": user_id,
            "session_id": session_id,
            "start_time": datetime.utcnow(),
            "mood_timeline": mood_updates,
            "mood_changes": len(set(u["mood"] for u in mood_updates)) - 1,
            "average_engagement": np.mean([u.get("engagement", 0.5) for u in mood_updates])
        }
        
        await self.db.study_mood_sessions.insert_one(session_data)
        
        # Analiz
        mood_stability = 1 - (session_data["mood_changes"] / len(mood_updates))
        efficiency_score = session_data["average_engagement"] * mood_stability
        
        return {
            "success": True,
            "session_analysis": {
                "mood_stability": mood_stability,
                "efficiency_score": efficiency_score,
                "total_mood_changes": session_data["mood_changes"],
                "recommendation": self._get_session_recommendation(efficiency_score)
            }
        }
    
    async def get_emotional_insights(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """Duygusal içgörüler ve analiz"""
        # Geçmiş verileri al
        emotion_history = await self._get_emotion_history(user_id, days)
        
        if not emotion_history:
            return {"message": "Yeterli veri yok"}
        
        # Analiz
        insights = {
            "period_days": days,
            "total_analyses": sum(len(h.emotions) for h in emotion_history),
            "dominant_emotion": self._find_dominant_emotion(emotion_history),
            "mood_trend": self._analyze_mood_trend(emotion_history),
            "stress_patterns": self._analyze_stress_patterns(emotion_history),
            "productive_hours": self._find_productive_hours(emotion_history),
            "emotional_stability": self._calculate_emotional_stability(emotion_history),
            "recommendations": await self._generate_insights_recommendations(
                user_id,
                emotion_history
            )
        }
        
        return insights
    
    async def detect_burnout_risk(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Tükenmişlik riski tespiti"""
        # Son 14 günlük veri
        history = await self._get_emotion_history(user_id, days=14)
        
        if len(history) < 7:
            return {"risk_level": "unknown", "message": "Yeterli veri yok"}
        
        # Risk faktörleri
        risk_factors = {
            "chronic_stress": self._check_chronic_stress(history),
            "decreasing_engagement": self._check_engagement_decline(history),
            "mood_volatility": self._check_mood_volatility(history),
            "low_energy": self._check_low_energy(history)
        }
        
        # Risk skoru (0-1)
        risk_score = sum(risk_factors.values()) / len(risk_factors)
        
        # Risk seviyesi
        if risk_score < 0.3:
            risk_level = "low"
        elif risk_score < 0.6:
            risk_level = "moderate"
        else:
            risk_level = "high"
        
        # Öneriler
        recommendations = self._get_burnout_prevention_tips(risk_level, risk_factors)
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "suggested_break_days": self._suggest_break_schedule(risk_score)
        }
    
    # Yardımcı metodlar
    
    async def _analyze_with_ai(
        self,
        image_data: bytes,
        source: str
    ) -> Dict[EmotionType, float]:
        """AI ile duygu analizi"""
        # TODO: Gerçek AI model entegrasyonu
        # Şimdilik simülasyon
        
        # Rastgele duygu skorları (demo)
        emotions = list(EmotionType)
        scores = np.random.dirichlet(np.ones(len(emotions)))
        
        return {
            emotion: float(score)
            for emotion, score in zip(emotions, scores)
        }
    
    async def _analyze_text_with_ai(
        self,
        text: str
    ) -> Dict[EmotionType, float]:
        """Metin duygu analizi"""
        # Basit keyword analizi
        emotion_keywords = {
            EmotionType.HAPPY: ["mutlu", "harika", "süper", "başardım", "sevindim"],
            EmotionType.SAD: ["üzgün", "kötü", "başaramadım", "yapamıyorum"],
            EmotionType.ANGRY: ["sinir", "kızgın", "bıktım", "nefret"],
            EmotionType.STRESSED: ["stres", "endişe", "kaygı", "korkuyorum"],
            EmotionType.CONFUSED: ["anlamadım", "kafam karıştı", "zorlanıyorum"],
            EmotionType.BORED: ["sıkıldım", "sıkıcı", "ilgimi çekmiyor"],
            EmotionType.FOCUSED: ["odaklandım", "konsantre", "çalışıyorum"],
            EmotionType.EXCITED: ["heyecanlı", "merak", "sabırsız"]
        }
        
        text_lower = text.lower()
        scores = {}
        
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            scores[emotion] = score / len(keywords) if keywords else 0
        
        # Normalize
        total = sum(scores.values())
        if total > 0:
            scores = {e: s/total for e, s in scores.items()}
        else:
            # Neutral default
            scores = {e: 0.1 for e in EmotionType}
            scores[EmotionType.NEUTRAL] = 0.2
        
        return scores
    
    def _calculate_mood_level(
        self,
        emotion_scores: Dict[EmotionType, float]
    ) -> MoodLevel:
        """Mood seviyesi hesapla"""
        positive_emotions = [
            EmotionType.HAPPY,
            EmotionType.EXCITED,
            EmotionType.FOCUSED
        ]
        negative_emotions = [
            EmotionType.SAD,
            EmotionType.ANGRY,
            EmotionType.STRESSED,
            EmotionType.BORED
        ]
        
        positive_score = sum(
            emotion_scores.get(e, 0) for e in positive_emotions
        )
        negative_score = sum(
            emotion_scores.get(e, 0) for e in negative_emotions
        )
        
        mood_balance = positive_score - negative_score
        
        if mood_balance > 0.4:
            return MoodLevel.VERY_POSITIVE
        elif mood_balance > 0.1:
            return MoodLevel.POSITIVE
        elif mood_balance > -0.1:
            return MoodLevel.NEUTRAL
        elif mood_balance > -0.4:
            return MoodLevel.NEGATIVE
        else:
            return MoodLevel.VERY_NEGATIVE
    
    def _calculate_stress_level(
        self,
        emotion_scores: Dict[EmotionType, float]
    ) -> StressLevel:
        """Stres seviyesi hesapla"""
        stress_score = emotion_scores.get(EmotionType.STRESSED, 0)
        anxiety_indicators = emotion_scores.get(EmotionType.CONFUSED, 0)
        
        total_stress = stress_score + (anxiety_indicators * 0.5)
        
        if total_stress < 0.2:
            return StressLevel.RELAXED
        elif total_stress < 0.4:
            return StressLevel.NORMAL
        elif total_stress < 0.6:
            return StressLevel.MILD_STRESS
        elif total_stress < 0.8:
            return StressLevel.MODERATE_STRESS
        else:
            return StressLevel.HIGH_STRESS
    
    def _calculate_stress_from_text(self, text: str) -> StressLevel:
        """Metinden stres seviyesi tahmin et"""
        stress_words = ["stres", "kaygı", "endişe", "panik", "korku", "bunaldım"]
        text_lower = text.lower()
        
        stress_count = sum(1 for word in stress_words if word in text_lower)
        
        if stress_count == 0:
            return StressLevel.NORMAL
        elif stress_count == 1:
            return StressLevel.MILD_STRESS
        elif stress_count == 2:
            return StressLevel.MODERATE_STRESS
        else:
            return StressLevel.HIGH_STRESS
    
    def _calculate_engagement(
        self,
        emotion_scores: Dict[EmotionType, float]
    ) -> float:
        """Katılım skoru hesapla"""
        engaged_emotions = [
            EmotionType.FOCUSED,
            EmotionType.EXCITED,
            EmotionType.HAPPY
        ]
        disengaged_emotions = [
            EmotionType.BORED,
            EmotionType.CONFUSED
        ]
        
        engagement = sum(emotion_scores.get(e, 0) for e in engaged_emotions)
        disengagement = sum(emotion_scores.get(e, 0) for e in disengaged_emotions)
        
        return max(0, min(1, engagement - disengagement))
    
    def _create_default_analysis(self, source: str) -> EmotionAnalysis:
        """Varsayılan analiz"""
        return EmotionAnalysis(
            timestamp=datetime.utcnow(),
            primary_emotion=EmotionType.NEUTRAL,
            emotion_scores={e: 0.1 for e in EmotionType},
            confidence=0.5,
            mood_level=MoodLevel.NEUTRAL,
            stress_level=StressLevel.NORMAL,
            attention_level=0.5,
            engagement_score=0.5,
            source=source
        )
    
    async def _save_emotion_analysis(
        self,
        user_id: str,
        analysis: EmotionAnalysis
    ):
        """Duygu analizini kaydet"""
        if not self.db:
            return
        
        await self.db.emotion_analyses.insert_one({
            "user_id": user_id,
            **analysis.__dict__
        })
    
    async def _get_recent_analyses(
        self,
        user_id: str,
        minutes: int = 30
    ) -> List[EmotionAnalysis]:
        """Son analizleri getir"""
        if not self.db:
            return []
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        
        analyses = []
        cursor = self.db.emotion_analyses.find({
            "user_id": user_id,
            "timestamp": {"$gte": cutoff_time}
        }).sort("timestamp", -1)
        
        async for analysis_data in cursor:
            analyses.append(EmotionAnalysis(**analysis_data))
        
        return analyses
    
    def _calculate_focus_duration(
        self,
        analyses: List[EmotionAnalysis]
    ) -> int:
        """Odaklanma süresi hesapla (dakika)"""
        if not analyses:
            return 0
        
        focused_count = sum(
            1 for a in analyses
            if a.primary_emotion == EmotionType.FOCUSED
        )
        
        # Her analiz ~1 dakika varsayımı
        return focused_count
    
    async def _check_intervention_needed(
        self,
        user_id: str,
        analyses: List[EmotionAnalysis]
    ) -> bool:
        """Müdahale gerekli mi kontrol et"""
        if not analyses:
            return False
        
        # Yüksek stres süresi
        high_stress_count = sum(
            1 for a in analyses
            if a.stress_level in [StressLevel.MODERATE_STRESS, StressLevel.HIGH_STRESS]
        )
        
        if high_stress_count > self.intervention_thresholds["stress_duration"] / 2:
            return True
        
        # Ardışık negatif mood
        negative_moods = [
            a for a in analyses[:5]
            if a.mood_level in [MoodLevel.NEGATIVE, MoodLevel.VERY_NEGATIVE]
        ]
        
        if len(negative_moods) >= self.intervention_thresholds["negative_mood_count"]:
            return True
        
        return False
    
    async def _get_recommendations(
        self,
        emotion: EmotionType,
        stress: StressLevel,
        energy: float
    ) -> List[str]:
        """Duygusal duruma göre öneriler"""
        recommendations = []
        
        if stress in [StressLevel.MODERATE_STRESS, StressLevel.HIGH_STRESS]:
            recommendations.append("5 dakika nefes egzersizi yap")
            recommendations.append("Kısa bir yürüyüşe çık")
        
        if emotion == EmotionType.BORED:
            recommendations.append("Farklı bir konu dene")
            recommendations.append("Etkileşimli içerik kullan")
        
        if energy < 0.3:
            recommendations.append("15 dakika mola ver")
            recommendations.append("Hafif bir atıştırmalık ye")
        
        if emotion == EmotionType.CONFUSED:
            recommendations.append("Konuyu küçük parçalara böl")
            recommendations.append("Video ders izle")
        
        return recommendations[:3]  # En fazla 3 öneri
    
    async def _get_last_break(self, user_id: str) -> Optional[datetime]:
        """Son mola zamanı"""
        # TODO: Study session verilerinden çek
        return None
    
    async def _generate_support_message(
        self,
        emotion: EmotionType,
        profile: MotivationProfile
    ) -> str:
        """Kişiselleştirilmiş destek mesajı"""
        # Hazır mesajlar
        if emotion in self.motivation_messages:
            messages = self.motivation_messages[emotion]
            
            # Profil bazlı seçim
            if profile.primary_motivation == MotivationType.ACHIEVEMENT:
                # Başarı odaklı mesaj tercih et
                return messages[0] if messages else ""
            else:
                # Rastgele seç
                import random
                return random.choice(messages)
        
        return "Sen harikasın! Devam et! 💪"
    
    def _suggest_activities(self, emotion: EmotionType) -> List[str]:
        """Duygu durumuna göre aktivite öner"""
        activities = {
            EmotionType.STRESSED: [
                "Meditasyon",
                "Hafif egzersiz",
                "Müzik dinleme"
            ],
            EmotionType.BORED: [
                "Oyunlaştırılmış quiz",
                "Video ders",
                "Arkadaşla çalışma"
            ],
            EmotionType.SAD: [
                "Başarı rozetlerine bak",
                "Sevdiğin konuya geç",
                "Motivasyon videosu izle"
            ],
            EmotionType.FOCUSED: [
                "Pomodoro devam et",
                "Zor sorulara geç",
                "Bonus puan kazan"
            ]
        }
        
        return activities.get(emotion, ["Kısa mola", "Su iç", "Esneme hareketleri"])
    
    def _get_music_recommendation(self, emotion: EmotionType) -> Optional[str]:
        """Müzik önerisi"""
        music_map = {
            EmotionType.STRESSED: "lo-fi relaxing beats",
            EmotionType.FOCUSED: "study music instrumental",
            EmotionType.HAPPY: "upbeat motivational",
            EmotionType.SAD: "calming nature sounds"
        }
        
        return music_map.get(emotion)
    
    def _get_session_recommendation(self, efficiency_score: float) -> str:
        """Oturum verimliliği önerisi"""
        if efficiency_score > 0.8:
            return "Harika bir oturum! Bu tempoda devam et!"
        elif efficiency_score > 0.6:
            return "İyi gidiyorsun! Biraz daha odaklanabilirsin."
        elif efficiency_score > 0.4:
            return "Dalgalanmalar var. Molalar verimliliği artırabilir."
        else:
            return "Zorlu bir oturum. Belki konuyu değiştirmek iyi olur."
    
    async def _get_emotion_history(
        self,
        user_id: str,
        days: int
    ) -> List[EmotionHistory]:
        """Duygu geçmişini getir"""
        if not self.db:
            return []
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # TODO: Aggregate emotion data by day
        # Placeholder implementation
        return []
    
    def _find_dominant_emotion(
        self,
        history: List[EmotionHistory]
    ) -> EmotionType:
        """Baskın duyguyu bul"""
        emotion_counts = defaultdict(int)
        
        for day_history in history:
            for analysis in day_history.emotions:
                emotion_counts[analysis.primary_emotion] += 1
        
        if emotion_counts:
            return max(emotion_counts.items(), key=lambda x: x[1])[0]
        
        return EmotionType.NEUTRAL
    
    def _analyze_mood_trend(
        self,
        history: List[EmotionHistory]
    ) -> str:
        """Mood trendi analizi"""
        if len(history) < 2:
            return "stable"
        
        # İlk ve son dönem karşılaştır
        first_half = history[:len(history)//2]
        second_half = history[len(history)//2:]
        
        first_avg_mood = self._average_mood_score(first_half)
        second_avg_mood = self._average_mood_score(second_half)
        
        if second_avg_mood > first_avg_mood + 0.1:
            return "improving"
        elif second_avg_mood < first_avg_mood - 0.1:
            return "declining"
        else:
            return "stable"
    
    def _average_mood_score(self, history: List[EmotionHistory]) -> float:
        """Ortalama mood skoru"""
        mood_scores = {
            MoodLevel.VERY_POSITIVE: 1.0,
            MoodLevel.POSITIVE: 0.75,
            MoodLevel.NEUTRAL: 0.5,
            MoodLevel.NEGATIVE: 0.25,
            MoodLevel.VERY_NEGATIVE: 0.0
        }
        
        scores = [mood_scores.get(h.average_mood, 0.5) for h in history]
        return np.mean(scores) if scores else 0.5
    
    def _analyze_stress_patterns(
        self,
        history: List[EmotionHistory]
    ) -> Dict[str, Any]:
        """Stres kalıpları analizi"""
        stress_times = []
        
        for day_history in history:
            for time, level in day_history.stress_peaks:
                stress_times.append({
                    "hour": time.hour,
                    "level": level
                })
        
        # En stresli saatler
        if stress_times:
            stress_by_hour = defaultdict(list)
            for st in stress_times:
                stress_by_hour[st["hour"]].append(st["level"])
            
            # TODO: Analyze patterns
        
        return {
            "peak_stress_hours": [14, 15, 16],  # Placeholder
            "stress_triggers": ["sınav", "ödev teslimi"]
        }
    
    def _find_productive_hours(
        self,
        history: List[EmotionHistory]
    ) -> List[int]:
        """Verimli saatleri bul"""
        # TODO: Analyze productive periods from history
        return [9, 10, 11, 14, 15]  # Placeholder
    
    def _calculate_emotional_stability(
        self,
        history: List[EmotionHistory]
    ) -> float:
        """Duygusal stabilite skoru"""
        if not history:
            return 0.5
        
        mood_changes = sum(h.mood_changes for h in history)
        total_days = len(history)
        
        # Daha az değişim = daha yüksek stabilite
        avg_changes_per_day = mood_changes / total_days if total_days > 0 else 0
        stability = max(0, 1 - (avg_changes_per_day / 10))  # 10 değişim = 0 stabilite
        
        return stability
    
    async def _generate_insights_recommendations(
        self,
        user_id: str,
        history: List[EmotionHistory]
    ) -> List[str]:
        """İçgörü bazlı öneriler"""
        recommendations = []
        
        # Stabilite bazlı
        stability = self._calculate_emotional_stability(history)
        if stability < 0.5:
            recommendations.append("Düzenli molalar duygusal dengeye yardımcı olabilir")
        
        # Stres bazlı
        stress_patterns = self._analyze_stress_patterns(history)
        if stress_patterns["peak_stress_hours"]:
            hours = stress_patterns["peak_stress_hours"][:2]
            recommendations.append(f"Saat {hours[0]}-{hours[1]} arası hafif konular çalış")
        
        # Mood trend bazlı
        trend = self._analyze_mood_trend(history)
        if trend == "declining":
            recommendations.append("Motivasyon aktivitelerine daha fazla zaman ayır")
        
        return recommendations
    
    def _analyze_emotional_patterns(
        self,
        history: List[EmotionHistory]
    ) -> Dict[str, List[EmotionType]]:
        """Duygusal kalıpları analiz et"""
        patterns = {
            "morning": [],
            "afternoon": [],
            "evening": []
        }
        
        # TODO: Analyze patterns from history
        
        return patterns
    
    def _check_chronic_stress(self, history: List[EmotionHistory]) -> float:
        """Kronik stres kontrolü"""
        high_stress_days = sum(
            1 for h in history
            if any(level in [StressLevel.MODERATE_STRESS, StressLevel.HIGH_STRESS]
                   for _, level in h.stress_peaks)
        )
        
        return high_stress_days / len(history) if history else 0
    
    def _check_engagement_decline(self, history: List[EmotionHistory]) -> float:
        """Katılım düşüşü kontrolü"""
        if len(history) < 2:
            return 0
        
        # İlk ve son hafta karşılaştır
        first_week = history[:7]
        last_week = history[-7:]
        
        first_engagement = np.mean([
            np.mean([e.engagement_score for e in h.emotions])
            for h in first_week if h.emotions
        ])
        
        last_engagement = np.mean([
            np.mean([e.engagement_score for e in h.emotions])
            for h in last_week if h.emotions
        ])
        
        decline = max(0, first_engagement - last_engagement)
        return min(1, decline * 2)  # Scale to 0-1
    
    def _check_mood_volatility(self, history: List[EmotionHistory]) -> float:
        """Mood değişkenliği kontrolü"""
        mood_changes = [h.mood_changes for h in history]
        if not mood_changes:
            return 0
        
        avg_changes = np.mean(mood_changes)
        return min(1, avg_changes / 10)  # 10+ değişim = yüksek volatilite
    
    def _check_low_energy(self, history: List[EmotionHistory]) -> float:
        """Düşük enerji kontrolü"""
        # TODO: Calculate from emotion data
        return 0.3  # Placeholder
    
    def _get_burnout_prevention_tips(
        self,
        risk_level: str,
        risk_factors: Dict[str, float]
    ) -> List[str]:
        """Tükenmişlik önleme ipuçları"""
        tips = []
        
        if risk_level == "high":
            tips.extend([
                "Acil olarak 1-2 gün tam dinlenme öneriyoruz",
                "Çalışma saatlerini %30 azalt",
                "Profesyonel destek almayı düşün"
            ])
        elif risk_level == "moderate":
            tips.extend([
                "Günlük çalışma süresini 1 saat azalt",
                "Her gün 30 dakika gevşeme aktivitesi yap",
                "Hafta sonu çalışmadan uzak dur"
            ])
        else:
            tips.extend([
                "Mevcut çalışma düzenini koru",
                "Düzenli molalar vermeye devam et",
                "Hobiler için zaman ayır"
            ])
        
        # Risk faktörlerine özel öneriler
        if risk_factors.get("chronic_stress", 0) > 0.5:
            tips.append("Stres yönetimi teknikleri öğren")
        
        if risk_factors.get("low_energy", 0) > 0.5:
            tips.append("Uyku düzenine dikkat et")
        
        return tips
    
    def _suggest_break_schedule(self, risk_score: float) -> List[str]:
        """Mola programı öner"""
        if risk_score > 0.7:
            return [
                "Yarın: Tam gün dinlen",
                "Sonraki 3 gün: Günde max 2 saat çalış",
                "Hafta sonu: Hiç çalışma"
            ]
        elif risk_score > 0.5:
            return [
                "Her 45 dakikada 15 dakika mola",
                "Günde max 4 saat çalış",
                "Hafta sonu yarım gün dinlen"
            ]
        else:
            return [
                "Her 1 saatte 10 dakika mola",
                "Normal çalışma düzenine devam",
                "Hafta sonu rahat aktiviteler"
            ]


# Global emotion AI service instance
emotion_ai_service = EmotionAIService()


# Helper functions
async def analyze_student_emotion(
    image_data: bytes,
    user_id: str
) -> EmotionAnalysis:
    """Öğrenci duygu analizi"""
    return await emotion_ai_service.analyze_facial_emotion(image_data, user_id)


async def get_motivational_support(
    user_id: str,
    current_emotion: Optional[str] = None
) -> Dict:
    """Motivasyonel destek al"""
    emotion = EmotionType(current_emotion) if current_emotion else None
    return await emotion_ai_service.provide_emotional_support(user_id, emotion)


async def check_student_wellbeing(user_id: str) -> Dict:
    """Öğrenci refahını kontrol et"""
    state = await emotion_ai_service.get_emotional_state(user_id)
    burnout = await emotion_ai_service.detect_burnout_risk(user_id)
    
    return {
        "current_state": state.__dict__,
        "burnout_risk": burnout,
        "needs_attention": state.needs_intervention or burnout["risk_level"] == "high"
    }
