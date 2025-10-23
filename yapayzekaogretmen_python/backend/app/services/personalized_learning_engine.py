"""
Personalized Learning Engine - Kişiselleştirilmiş Öğrenme Motoru
==============================================================
Her öğrencinin benzersiz öğrenme yolculuğunu tasarlayan gelişmiş AI sistemi
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import json
from enum import Enum
import asyncio
from collections import defaultdict

from loguru import logger
from app.core.config import settings
from app.db.mongodb import get_database


class LearningDimension(str, Enum):
    """Çok boyutlu öğrenme analizi için boyutlar"""
    COGNITIVE = "cognitive"  # Bilişsel (anlama, hatırlama, uygulama)
    AFFECTIVE = "affective"  # Duyuşsal (motivasyon, tutum, ilgi)
    PSYCHOMOTOR = "psychomotor"  # Psikomotor (el-göz koordinasyonu, motor beceriler)
    SOCIAL = "social"  # Sosyal (işbirliği, iletişim, liderlik)
    METACOGNITIVE = "metacognitive"  # Üst bilişsel (öğrenmeyi öğrenme)
    CREATIVE = "creative"  # Yaratıcı (yenilikçi düşünme, problem çözme)


class LearningModality(str, Enum):
    """Öğrenme modaliteleri - Howard Gardner'ın Çoklu Zeka Teorisi"""
    VISUAL_SPATIAL = "visual_spatial"  # Görsel-uzamsal
    AUDITORY_MUSICAL = "auditory_musical"  # İşitsel-müzikal
    VERBAL_LINGUISTIC = "verbal_linguistic"  # Sözel-dilsel
    LOGICAL_MATHEMATICAL = "logical_mathematical"  # Mantıksal-matematiksel
    BODILY_KINESTHETIC = "bodily_kinesthetic"  # Bedensel-kinestetik
    INTERPERSONAL = "interpersonal"  # Kişilerarası
    INTRAPERSONAL = "intrapersonal"  # Öze dönük
    NATURALISTIC = "naturalistic"  # Doğacı
    EXISTENTIAL = "existential"  # Varoluşsal


class CognitiveState(str, Enum):
    """Bilişsel durumlar - Flow Theory (Csikszentmihalyi)"""
    ANXIETY = "anxiety"  # Kaygı (Zorluk > Beceri)
    AROUSAL = "arousal"  # Uyarılma (Zorluk biraz > Beceri)
    FLOW = "flow"  # Akış (Zorluk = Beceri)
    CONTROL = "control"  # Kontrol (Beceri biraz > Zorluk)
    RELAXATION = "relaxation"  # Rahatlama (Beceri > Zorluk)
    BOREDOM = "boredom"  # Sıkılma (Beceri >> Zorluk)
    APATHY = "apathy"  # İlgisizlik (Düşük zorluk, düşük beceri)
    WORRY = "worry"  # Endişe (Orta zorluk, düşük beceri)


@dataclass
class NeuroCognitiveProfile:
    """Nöro-bilişsel profil - Beyin temelli öğrenme"""
    attention_span: float = 0.5  # Dikkat süresi (0-1)
    working_memory_capacity: int = 7  # Miller'ın sayısı ± 2
    processing_speed: float = 0.5  # İşleme hızı (0-1)
    executive_function: float = 0.5  # Yürütücü işlevler (0-1)
    
    # Nörotransmitter seviyeleri (motivasyon ve öğrenme için)
    dopamine_level: float = 0.5  # Ödül ve motivasyon
    serotonin_level: float = 0.5  # Ruh hali ve odaklanma
    norepinephrine_level: float = 0.5  # Dikkat ve uyanıklık
    acetylcholine_level: float = 0.5  # Öğrenme ve hafıza
    
    # Beyin dalgaları
    alpha_waves: float = 0.5  # Rahat odaklanma (8-12 Hz)
    beta_waves: float = 0.5  # Aktif düşünme (12-30 Hz)
    theta_waves: float = 0.5  # Derin öğrenme (4-8 Hz)
    gamma_waves: float = 0.5  # Yüksek bilişsel işleme (30-100 Hz)


@dataclass
class EmotionalIntelligenceProfile:
    """Duygusal zeka profili - Goleman modeli"""
    self_awareness: float = 0.5  # Öz farkındalık
    self_regulation: float = 0.5  # Öz düzenleme
    motivation: float = 0.5  # İçsel motivasyon
    empathy: float = 0.5  # Empati
    social_skills: float = 0.5  # Sosyal beceriler
    
    # Duygu durumları
    current_mood: str = "neutral"
    mood_stability: float = 0.5
    stress_level: float = 0.3
    confidence_level: float = 0.7
    curiosity_level: float = 0.8


@dataclass
class PersonalizedLearningPath:
    """Kişiselleştirilmiş öğrenme yolu"""
    student_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    # Öğrenme hedefleri
    short_term_goals: List[Dict] = field(default_factory=list)  # 1-7 gün
    medium_term_goals: List[Dict] = field(default_factory=list)  # 1-4 hafta
    long_term_goals: List[Dict] = field(default_factory=list)  # 1-6 ay
    
    # Öğrenme rotası
    current_module: Optional[Dict] = None
    completed_modules: List[Dict] = field(default_factory=list)
    upcoming_modules: List[Dict] = field(default_factory=list)
    
    # Adaptif parametreler
    difficulty_level: float = 0.5  # 0-1 arası
    pace_multiplier: float = 1.0  # Hız çarpanı
    repetition_factor: float = 1.0  # Tekrar faktörü
    
    # Öğrenme stratejileri
    preferred_strategies: List[str] = field(default_factory=list)
    avoided_strategies: List[str] = field(default_factory=list)
    
    # Performans tahmini
    estimated_completion_date: Optional[datetime] = None
    success_probability: float = 0.0
    recommended_daily_minutes: int = 30


class PersonalizedLearningEngine:
    """Ana kişiselleştirilmiş öğrenme motoru"""
    
    def __init__(self):
        self.db = get_database()
        self.student_profiles = self.db.student_profiles if self.db else None
        self.learning_paths = self.db.learning_paths if self.db else None
        self.interaction_logs = self.db.interaction_logs if self.db else None
        
        # Öğrenme teorileri ağırlıkları
        self.theory_weights = {
            "constructivism": 0.25,  # Yapılandırmacı
            "behaviorism": 0.15,  # Davranışçı
            "cognitivism": 0.25,  # Bilişsel
            "connectivism": 0.20,  # Bağlantıcı
            "humanism": 0.15  # Hümanist
        }
        
        logger.info("Personalized Learning Engine başlatıldı")
    
    async def analyze_student_holistically(self, student_id: str) -> Dict:
        """Öğrenciyi bütünsel olarak analiz et"""
        try:
            # Tüm veri kaynaklarından bilgi topla
            profile = await self._get_student_profile(student_id)
            interactions = await self._get_recent_interactions(student_id)
            performance = await self._analyze_performance_patterns(student_id)
            
            # Çok boyutlu analiz
            cognitive_analysis = self._analyze_cognitive_dimension(interactions)
            affective_analysis = self._analyze_affective_dimension(interactions)
            social_analysis = self._analyze_social_dimension(interactions)
            metacognitive_analysis = self._analyze_metacognitive_dimension(interactions)
            
            # Nöro-bilişsel profil oluştur
            neuro_profile = self._create_neurocognitive_profile(
                profile, interactions, performance
            )
            
            # Duygusal zeka profili
            eq_profile = self._create_emotional_intelligence_profile(
                profile, interactions
            )
            
            # Öğrenme modalitelerini belirle
            dominant_modalities = self._identify_learning_modalities(
                interactions, performance
            )
            
            # Bilişsel durumu tespit et
            cognitive_state = self._determine_cognitive_state(
                performance, neuro_profile
            )
            
            return {
                "student_id": student_id,
                "timestamp": datetime.utcnow().isoformat(),
                "holistic_profile": {
                    "cognitive": cognitive_analysis,
                    "affective": affective_analysis,
                    "social": social_analysis,
                    "metacognitive": metacognitive_analysis
                },
                "neurocognitive_profile": neuro_profile.__dict__,
                "emotional_intelligence": eq_profile.__dict__,
                "learning_modalities": dominant_modalities,
                "cognitive_state": cognitive_state,
                "recommendations": await self._generate_holistic_recommendations(
                    cognitive_state, neuro_profile, eq_profile, dominant_modalities
                )
            }
            
        except Exception as e:
            logger.error(f"Bütünsel analiz hatası: {e}")
            return {"error": str(e)}
    
    async def create_adaptive_learning_path(
        self, 
        student_id: str,
        subject: str,
        target_level: str
    ) -> PersonalizedLearningPath:
        """Adaptif öğrenme yolu oluştur"""
        try:
            # Öğrenci analizi
            analysis = await self.analyze_student_holistically(student_id)
            
            # Öğrenme yolu oluştur
            path = PersonalizedLearningPath(student_id=student_id)
            
            # Kısa vadeli hedefler (mikro öğrenme)
            path.short_term_goals = self._generate_micro_learning_goals(
                analysis, subject, days=7
            )
            
            # Orta vadeli hedefler
            path.medium_term_goals = self._generate_adaptive_milestones(
                analysis, subject, weeks=4
            )
            
            # Uzun vadeli hedefler
            path.long_term_goals = self._generate_mastery_goals(
                analysis, subject, target_level
            )
            
            # İlk modülü belirle
            path.current_module = self._select_optimal_starting_point(
                analysis, subject
            )
            
            # Gelecek modülleri planla
            path.upcoming_modules = self._plan_learning_sequence(
                analysis, subject, target_level
            )
            
            # Adaptif parametreleri ayarla
            path.difficulty_level = self._calculate_optimal_difficulty(analysis)
            path.pace_multiplier = self._calculate_learning_pace(analysis)
            path.repetition_factor = self._calculate_repetition_needs(analysis)
            
            # Strateji önerileri
            path.preferred_strategies = self._recommend_learning_strategies(analysis)
            
            # Performans tahmini
            path.success_probability = self._predict_success_probability(
                analysis, subject, target_level
            )
            path.estimated_completion_date = self._estimate_completion_date(
                analysis, path
            )
            path.recommended_daily_minutes = self._calculate_optimal_study_time(
                analysis
            )
            
            # Veritabanına kaydet
            if self.learning_paths:
                await self.learning_paths.insert_one(path.__dict__)
            
            return path
            
        except Exception as e:
            logger.error(f"Öğrenme yolu oluşturma hatası: {e}")
            raise
    
    async def adapt_in_real_time(
        self, 
        student_id: str,
        interaction_data: Dict
    ) -> Dict:
        """Gerçek zamanlı adaptasyon"""
        try:
            # Anlık performans analizi
            instant_metrics = self._analyze_instant_performance(interaction_data)
            
            # Duygu durumu tespiti
            emotional_state = self._detect_emotional_state(interaction_data)
            
            # Bilişsel yük hesaplama
            cognitive_load = self._calculate_cognitive_load(interaction_data)
            
            # Adaptasyon kararları
            adaptations = {
                "difficulty_adjustment": 0,
                "pace_adjustment": 0,
                "content_type_change": None,
                "break_recommendation": False,
                "encouragement_needed": False,
                "strategy_switch": None
            }
            
            # Zorluk ayarlaması
            if cognitive_load > 0.8:
                adaptations["difficulty_adjustment"] = -0.1  # Kolaylaştır
            elif cognitive_load < 0.3:
                adaptations["difficulty_adjustment"] = 0.1  # Zorlaştır
            
            # Hız ayarlaması
            if instant_metrics["response_time"] > instant_metrics["avg_response_time"] * 1.5:
                adaptations["pace_adjustment"] = -0.1  # Yavaşlat
            
            # Duygu durumuna göre adaptasyon
            if emotional_state in ["frustrated", "anxious"]:
                adaptations["encouragement_needed"] = True
                adaptations["difficulty_adjustment"] = -0.05
            elif emotional_state == "bored":
                adaptations["content_type_change"] = "gamified"
                adaptations["difficulty_adjustment"] = 0.05
            
            # Mola önerisi
            study_duration = interaction_data.get("session_duration", 0)
            if study_duration > 25:  # Pomodoro tekniği
                adaptations["break_recommendation"] = True
            
            # Strateji değişimi
            if instant_metrics["error_rate"] > 0.4:
                current_strategy = interaction_data.get("current_strategy")
                adaptations["strategy_switch"] = self._suggest_alternative_strategy(
                    current_strategy, instant_metrics
                )
            
            # Adaptasyonları uygula ve kaydet
            await self._apply_adaptations(student_id, adaptations)
            
            return {
                "adaptations": adaptations,
                "reasoning": {
                    "cognitive_load": cognitive_load,
                    "emotional_state": emotional_state,
                    "instant_metrics": instant_metrics
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Gerçek zamanlı adaptasyon hatası: {e}")
            return {"error": str(e)}
    
    async def generate_micro_interventions(
        self, 
        student_id: str,
        current_state: Dict
    ) -> List[Dict]:
        """Mikro müdahaleler üret"""
        interventions = []
        
        # Dikkat dağınıklığı müdahalesi
        if current_state.get("attention_level", 1) < 0.5:
            interventions.append({
                "type": "attention_booster",
                "action": "mini_game",
                "duration": 60,  # saniye
                "content": "focus_challenge"
            })
        
        # Motivasyon müdahalesi
        if current_state.get("motivation_level", 1) < 0.4:
            interventions.append({
                "type": "motivation_boost",
                "action": "achievement_reminder",
                "content": await self._generate_personalized_encouragement(student_id)
            })
        
        # Bilişsel aşırı yüklenme müdahalesi
        if current_state.get("cognitive_load", 0) > 0.85:
            interventions.append({
                "type": "cognitive_relief",
                "action": "breathing_exercise",
                "duration": 120,
                "guidance": "4-7-8 nefes tekniği"
            })
        
        # Öğrenme pekiştirme
        if current_state.get("retention_risk", False):
            interventions.append({
                "type": "retention_boost",
                "action": "spaced_repetition",
                "content": await self._select_review_items(student_id)
            })
        
        return interventions
    
    # Yardımcı metodlar
    def _analyze_cognitive_dimension(self, interactions: List[Dict]) -> Dict:
        """Bilişsel boyut analizi"""
        return {
            "bloom_level": self._calculate_bloom_taxonomy_level(interactions),
            "critical_thinking": self._assess_critical_thinking(interactions),
            "problem_solving": self._assess_problem_solving(interactions),
            "creativity": self._assess_creativity(interactions),
            "memory_retention": self._calculate_retention_rate(interactions)
        }
    
    def _analyze_affective_dimension(self, interactions: List[Dict]) -> Dict:
        """Duyuşsal boyut analizi"""
        return {
            "motivation_type": self._identify_motivation_type(interactions),
            "engagement_level": self._calculate_engagement_level(interactions),
            "self_efficacy": self._assess_self_efficacy(interactions),
            "attitude_towards_learning": self._assess_learning_attitude(interactions),
            "emotional_stability": self._calculate_emotional_stability(interactions)
        }
    
    def _create_neurocognitive_profile(
        self, 
        profile: Dict, 
        interactions: List[Dict],
        performance: Dict
    ) -> NeuroCognitiveProfile:
        """Nöro-bilişsel profil oluştur"""
        neuro_profile = NeuroCognitiveProfile()
        
        # Dikkat süresi hesaplama
        focus_times = [i.get("focus_duration", 0) for i in interactions]
        if focus_times:
            avg_focus = np.mean(focus_times)
            neuro_profile.attention_span = min(avg_focus / 30, 1.0)  # 30 dk normalize
        
        # Çalışma belleği kapasitesi
        chunk_sizes = [i.get("info_chunks_processed", 0) for i in interactions]
        if chunk_sizes:
            neuro_profile.working_memory_capacity = int(np.mean(chunk_sizes))
        
        # İşleme hızı
        response_times = [i.get("response_time", 0) for i in interactions]
        if response_times:
            avg_response = np.mean(response_times)
            neuro_profile.processing_speed = 1 - min(avg_response / 10, 1.0)
        
        # Nörotransmitter seviyeleri (simüle edilmiş)
        success_rate = performance.get("success_rate", 0.5)
        neuro_profile.dopamine_level = success_rate  # Başarı dopamin salgılatır
        
        stress_indicators = sum(1 for i in interactions if i.get("stress_detected"))
        neuro_profile.serotonin_level = 1 - (stress_indicators / max(len(interactions), 1))
        
        engagement_rate = performance.get("engagement_rate", 0.5)
        neuro_profile.norepinephrine_level = engagement_rate
        
        learning_rate = performance.get("learning_rate", 0.5)
        neuro_profile.acetylcholine_level = learning_rate
        
        # Beyin dalgaları (simüle edilmiş)
        if performance.get("in_flow_state", False):
            neuro_profile.alpha_waves = 0.8
            neuro_profile.theta_waves = 0.7
        
        return neuro_profile
    
    def _determine_cognitive_state(
        self, 
        performance: Dict,
        neuro_profile: NeuroCognitiveProfile
    ) -> str:
        """Bilişsel durumu belirle - Flow teorisi"""
        skill_level = performance.get("skill_level", 0.5)
        challenge_level = performance.get("challenge_level", 0.5)
        
        skill_challenge_ratio = skill_level / max(challenge_level, 0.1)
        
        if 0.8 <= skill_challenge_ratio <= 1.2:
            return CognitiveState.FLOW
        elif skill_challenge_ratio < 0.5:
            return CognitiveState.ANXIETY
        elif 0.5 <= skill_challenge_ratio < 0.8:
            return CognitiveState.AROUSAL
        elif 1.2 < skill_challenge_ratio <= 1.5:
            return CognitiveState.CONTROL
        elif 1.5 < skill_challenge_ratio <= 2.0:
            return CognitiveState.RELAXATION
        elif skill_challenge_ratio > 2.0:
            return CognitiveState.BOREDOM
        else:
            return CognitiveState.APATHY
    
    def _calculate_optimal_difficulty(self, analysis: Dict) -> float:
        """Optimal zorluk seviyesi hesapla - Zone of Proximal Development"""
        current_ability = analysis.get("holistic_profile", {}).get(
            "cognitive", {}
        ).get("bloom_level", 3)
        
        cognitive_state = analysis.get("cognitive_state", CognitiveState.APATHY)
        
        # Flow durumunu hedefle
        if cognitive_state == CognitiveState.FLOW:
            return 0.5  # Mevcut seviyeyi koru
        elif cognitive_state in [CognitiveState.ANXIETY, CognitiveState.WORRY]:
            return 0.3  # Zorluğu azalt
        elif cognitive_state in [CognitiveState.BOREDOM, CognitiveState.APATHY]:
            return 0.7  # Zorluğu artır
        else:
            return 0.5
    
    def _generate_micro_learning_goals(
        self, 
        analysis: Dict,
        subject: str,
        days: int
    ) -> List[Dict]:
        """Mikro öğrenme hedefleri oluştur"""
        goals = []
        daily_capacity = analysis.get("neurocognitive_profile", {}).get(
            "attention_span", 0.5
        ) * 60  # dakika
        
        for day in range(days):
            daily_goals = {
                "day": day + 1,
                "date": (datetime.utcnow() + timedelta(days=day)).isoformat(),
                "micro_goals": []
            }
            
            # Günlük 3-5 mikro hedef
            num_goals = min(int(daily_capacity / 10), 5)
            
            for i in range(num_goals):
                micro_goal = {
                    "id": f"micro_{day}_{i}",
                    "duration_minutes": 10,
                    "type": self._select_micro_goal_type(analysis, i),
                    "difficulty": self._calculate_optimal_difficulty(analysis),
                    "content": f"{subject} - Mikro öğrenme {i+1}",
                    "success_criteria": "Tamamlanma ve %70 doğruluk"
                }
                daily_goals["micro_goals"].append(micro_goal)
            
            goals.append(daily_goals)
        
        return goals
    
    def _select_micro_goal_type(self, analysis: Dict, index: int) -> str:
        """Mikro hedef tipi seç"""
        modalities = analysis.get("learning_modalities", [])
        
        goal_types = {
            "visual_spatial": ["video_lesson", "infographic", "mind_map"],
            "auditory_musical": ["podcast", "song", "audio_story"],
            "verbal_linguistic": ["reading", "writing", "discussion"],
            "logical_mathematical": ["puzzle", "pattern", "calculation"],
            "bodily_kinesthetic": ["simulation", "gesture_learning", "movement"],
            "interpersonal": ["peer_discussion", "collaboration", "teaching"],
            "intrapersonal": ["reflection", "journal", "self_assessment"]
        }
        
        # Baskın modaliteye göre seç
        if modalities:
            primary_modality = modalities[0]["type"]
            available_types = goal_types.get(primary_modality, ["practice"])
            return available_types[index % len(available_types)]
        
        return "practice"
    
    async def _generate_personalized_encouragement(self, student_id: str) -> str:
        """Kişiselleştirilmiş cesaretlendirme mesajı"""
        # Öğrenci başarılarını al
        if self.student_profiles:
            profile = await self.student_profiles.find_one({"student_id": student_id})
            if profile:
                achievements = profile.get("achievements", [])
                if achievements:
                    latest = achievements[-1]
                    return f"Hatırla, {latest['title']} başarını kazandığında ne kadar iyiydin! 🌟"
        
        return "Sen yapabilirsin! Her adım seni hedefe yaklaştırıyor! 💪"
    
    def _calculate_cognitive_load(self, interaction_data: Dict) -> float:
        """Bilişsel yük hesapla"""
        # Faktörler
        task_complexity = interaction_data.get("task_complexity", 0.5)
        time_pressure = interaction_data.get("time_pressure", 0.0)
        error_rate = interaction_data.get("error_rate", 0.0)
        help_requests = interaction_data.get("help_requests", 0)
        
        # Ağırlıklı hesaplama
        cognitive_load = (
            task_complexity * 0.4 +
            time_pressure * 0.2 +
            error_rate * 0.3 +
            min(help_requests / 5, 1.0) * 0.1
        )
        
        return min(cognitive_load, 1.0)


# Singleton instance
personalized_learning_engine = PersonalizedLearningEngine()
