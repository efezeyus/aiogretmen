"""
AI Companion Service - Personalized Learning Assistant
-----------------------------------------------------
Kişiselleştirilmiş AI öğrenme arkadaşı servisi.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import random
from dataclasses import dataclass
from collections import defaultdict

from loguru import logger
import numpy as np
# Langchain isteğe bağlı
try:
    from langchain.memory import ConversationSummaryBufferMemory
    from langchain.schema import BaseMessage, HumanMessage, AIMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logger.warning("Langchain bulunamadı, AI Companion bellek özelliği sınırlı olacak")
    # Basit yereldeğişim sınıfları
    ConversationSummaryBufferMemory = None
    BaseMessage = None
    HumanMessage = None
    AIMessage = None

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.ai_service import ai_service
from app.services.cache_service import cache, cached
from app.services.notification_service import notification_service
from app.services.gamification_service import gamification_service


class CompanionPersonality(str, Enum):
    """AI arkadaş kişilik tipleri"""
    FRIENDLY = "friendly"          # Arkadaş canlısı
    MENTOR = "mentor"              # Mentor/Rehber
    MOTIVATOR = "motivator"        # Motivasyon koçu
    SCIENTIST = "scientist"        # Bilim insanı
    STORYTELLER = "storyteller"    # Hikaye anlatıcı
    COMEDIAN = "comedian"          # Eğlenceli/Komik


class EmotionalState(str, Enum):
    """Öğrenci duygu durumları"""
    HAPPY = "happy"
    EXCITED = "excited"
    NEUTRAL = "neutral"
    CONFUSED = "confused"
    FRUSTRATED = "frustrated"
    BORED = "bored"
    STRESSED = "stressed"
    CONFIDENT = "confident"


class LearningStyle(str, Enum):
    """Öğrenme stilleri"""
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    READING_WRITING = "reading_writing"
    MIXED = "mixed"


@dataclass
class StudentProfile:
    """Öğrenci profili"""
    user_id: str
    name: str
    age: int
    grade_level: int
    learning_style: LearningStyle
    preferred_personality: CompanionPersonality
    interests: List[str]
    strengths: List[str]
    weaknesses: List[str]
    goals: List[str]
    emotional_history: List[Dict]
    interaction_count: int = 0
    last_interaction: Optional[datetime] = None


@dataclass
class CompanionCharacter:
    """AI arkadaş karakteri"""
    id: str
    name: str
    personality: CompanionPersonality
    avatar_url: str
    voice_id: str
    introduction: str
    catchphrases: List[str]
    specialty_subjects: List[str]
    fun_facts: List[str]


class AICompanionService:
    """Kişiselleştirilmiş AI öğrenme arkadaşı servisi"""
    
    def __init__(self):
        self.db = get_database()
        self.conversation_memories = {}  # user_id -> ConversationMemory
        
        # AI arkadaş karakterleri
        self.companions = self._initialize_companions()
        
        # Duygu analizi eşikleri
        self.emotion_keywords = {
            EmotionalState.HAPPY: ["mutlu", "harika", "süper", "güzel", "başardım"],
            EmotionalState.EXCITED: ["heyecanlı", "merak", "sabırsız", "havalı"],
            EmotionalState.CONFUSED: ["anlamadım", "karışık", "zor", "kafam karıştı"],
            EmotionalState.FRUSTRATED: ["sinir", "kızgın", "yapamıyorum", "beceremedim"],
            EmotionalState.BORED: ["sıkıldım", "sıkıcı", "ilgimi çekmiyor"],
            EmotionalState.STRESSED: ["stres", "endişe", "kaygı", "korkuyorum"],
            EmotionalState.CONFIDENT: ["başarabilirim", "kolay", "yapabilirim", "güveniyorum"]
        }
        
        # Adaptif öğrenme parametreleri
        self.difficulty_adjustment_threshold = 0.7  # %70 başarı oranı hedefi
        self.motivation_boost_threshold = 0.5      # Motivasyon düşükse boost
        
        logger.info("AI Companion Service başlatıldı")
    
    def _initialize_companions(self) -> Dict[str, CompanionCharacter]:
        """AI arkadaş karakterlerini başlat"""
        return {
            "leo_the_wise": CompanionCharacter(
                id="leo_the_wise",
                name="Bilge Leo",
                personality=CompanionPersonality.MENTOR,
                avatar_url="/avatars/leo_wise.png",
                voice_id="leo_tr",
                introduction="Merhaba! Ben Bilge Leo 🦉 Senin öğrenme yolculuğunda rehberin olacağım!",
                catchphrases=[
                    "Bilgi güçtür!",
                    "Her hata bir öğrenme fırsatıdır",
                    "Merak eden öğrenir"
                ],
                specialty_subjects=["matematik", "fen"],
                fun_facts=[
                    "Baykuşlar 270 derece başlarını çevirebilir!",
                    "En eski bilinen matematik problemi 4000 yıl öncesine dayanır"
                ]
            ),
            
            "maya_the_creative": CompanionCharacter(
                id="maya_the_creative",
                name="Yaratıcı Maya",
                personality=CompanionPersonality.STORYTELLER,
                avatar_url="/avatars/maya_creative.png",
                voice_id="maya_tr",
                introduction="Selam! Ben Maya 🎨 Öğrenmeyi hikayelerle renklendireceğiz!",
                catchphrases=[
                    "Her konunun bir hikayesi var",
                    "Hayal gücü sınır tanımaz",
                    "Yaratıcılık her yerde"
                ],
                specialty_subjects=["türkçe", "sosyal", "sanat"],
                fun_facts=[
                    "İlk animasyon filmi 1906'da çekildi!",
                    "Dünyada 7000'den fazla dil konuşuluyor"
                ]
            ),
            
            "max_the_motivator": CompanionCharacter(
                id="max_the_motivator",
                name="Motivator Max",
                personality=CompanionPersonality.MOTIVATOR,
                avatar_url="/avatars/max_motivator.png",
                voice_id="max_tr",
                introduction="Hey! Ben Max 💪 Seninle her zorluğu aşacağız!",
                catchphrases=[
                    "Sen yapabilirsin!",
                    "Pes etme, devam et!",
                    "Her gün yeni bir başarı"
                ],
                specialty_subjects=["spor", "kişisel gelişim"],
                fun_facts=[
                    "İnsan beyni %75 sudan oluşur",
                    "Gülmek 15 kas grubunu çalıştırır"
                ]
            ),
            
            "nova_the_scientist": CompanionCharacter(
                id="nova_the_scientist",
                name="Bilimci Nova",
                personality=CompanionPersonality.SCIENTIST,
                avatar_url="/avatars/nova_scientist.png",
                voice_id="nova_tr",
                introduction="Merhaba genç bilim insanı! Ben Nova 🔬 Birlikte keşfedelim!",
                catchphrases=[
                    "Deneyelim ve görelim!",
                    "Bilim her yerde",
                    "Soru sormak bilimin başlangıcı"
                ],
                specialty_subjects=["fen", "teknoloji", "matematik"],
                fun_facts=[
                    "Bir yıldırım 30.000°C sıcaklığa ulaşabilir",
                    "Ay her yıl Dünya'dan 3.8 cm uzaklaşıyor"
                ]
            )
        }
    
    async def get_or_create_student_profile(self, user_id: str) -> StudentProfile:
        """Öğrenci profilini getir veya oluştur"""
        # Cache'den kontrol et
        cache_key = f"student_profile:{user_id}"
        cached_profile = await cache.get(cache_key, namespace="ai_companion")
        
        if cached_profile:
            return StudentProfile(**cached_profile)
        
        if not self.db:
            # Default profil
            return StudentProfile(
                user_id=user_id,
                name="Öğrenci",
                age=10,
                grade_level=5,
                learning_style=LearningStyle.MIXED,
                preferred_personality=CompanionPersonality.FRIENDLY,
                interests=["oyun", "bilim", "sanat"],
                strengths=[],
                weaknesses=[],
                goals=[],
                emotional_history=[]
            )
        
        # Veritabanından al
        profile_data = await self.db.ai_companion_profiles.find_one({"user_id": user_id})
        
        if not profile_data:
            # Yeni profil oluştur
            user = await self.db.users.find_one({"_id": user_id})
            
            profile = StudentProfile(
                user_id=user_id,
                name=user.get("full_name", "Öğrenci") if user else "Öğrenci",
                age=user.get("age", 10) if user else 10,
                grade_level=user.get("grade_level", 5) if user else 5,
                learning_style=LearningStyle.MIXED,
                preferred_personality=CompanionPersonality.FRIENDLY,
                interests=[],
                strengths=[],
                weaknesses=[],
                goals=[],
                emotional_history=[]
            )
            
            # Veritabanına kaydet
            await self.db.ai_companion_profiles.insert_one(profile.__dict__)
        else:
            profile = StudentProfile(**profile_data)
        
        # Cache'e kaydet
        await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="ai_companion")
        
        return profile
    
    async def analyze_emotion(self, text: str) -> EmotionalState:
        """Metinden duygu durumu analizi"""
        text_lower = text.lower()
        
        # Keyword matching
        emotion_scores = defaultdict(int)
        
        for emotion, keywords in self.emotion_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    emotion_scores[emotion] += 1
        
        # En yüksek skoru bul
        if emotion_scores:
            return max(emotion_scores.items(), key=lambda x: x[1])[0]
        
        # TODO: Daha gelişmiş sentiment analysis
        return EmotionalState.NEUTRAL
    
    async def get_adaptive_response(
        self,
        user_id: str,
        message: str,
        subject: Optional[str] = None,
        lesson_context: Optional[Dict] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Adaptif AI yanıtı üret
        
        Returns:
            response: AI yanıtı
            metadata: Ek bilgiler (duygu durumu, öneriler, vs.)
        """
        # Öğrenci profili
        profile = await self.get_or_create_student_profile(user_id)
        
        # Duygu durumu analizi
        emotion = await self.analyze_emotion(message)
        
        # Conversation memory
        if user_id not in self.conversation_memories:
            self.conversation_memories[user_id] = ConversationSummaryBufferMemory(
                llm=None,  # AI service kullanılacak
                max_token_limit=2000,
                return_messages=True
            )
        
        memory = self.conversation_memories[user_id]
        
        # AI arkadaşı seç
        companion = self.companions.get(
            profile.preferred_personality,
            self.companions["leo_the_wise"]
        )
        
        # Sistem promptu oluştur
        system_prompt = self._build_companion_prompt(
            companion=companion,
            profile=profile,
            emotion=emotion,
            subject=subject,
            lesson_context=lesson_context
        )
        
        # Konuşma geçmişi
        messages = memory.chat_memory.messages[-10:]  # Son 10 mesaj
        
        # AI yanıtı al
        try:
            response, ai_metadata = await ai_service.get_ai_response(
                prompt=message,
                grade_level=profile.grade_level,
                subject=subject or "genel",
                context=system_prompt,
                conversation_history=[
                    {"role": "human" if isinstance(m, HumanMessage) else "assistant", "content": m.content}
                    for m in messages
                ],
                user_name=profile.name
            )
            
            # Memory'ye ekle
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(response)
            
            # Profili güncelle
            await self._update_student_profile(profile, emotion, subject)
            
            # Metadata oluştur
            metadata = {
                "emotion_detected": emotion,
                "companion": companion.name,
                "personality": companion.personality,
                "learning_style": profile.learning_style,
                "adaptive_features": await self._get_adaptive_features(profile, emotion),
                **ai_metadata
            }
            
            # Gamification entegrasyonu
            if emotion in [EmotionalState.HAPPY, EmotionalState.EXCITED, EmotionalState.CONFIDENT]:
                await gamification_service.add_points(
                    user_id=user_id,
                    action="positive_interaction",
                    metadata={"emotion": emotion}
                )
            
            return response, metadata
            
        except Exception as e:
            logger.error(f"AI Companion yanıt hatası: {e}")
            return companion.catchphrases[0], {"error": str(e)}
    
    def _build_companion_prompt(
        self,
        companion: CompanionCharacter,
        profile: StudentProfile,
        emotion: EmotionalState,
        subject: Optional[str],
        lesson_context: Optional[Dict]
    ) -> str:
        """AI arkadaş sistem promptu oluştur"""
        prompt = f"""Sen {companion.name}, bir AI öğrenme arkadaşısın.

Kişiliğin: {companion.personality}
Öğrenci Bilgileri:
- İsim: {profile.name}
- Yaş: {profile.age}
- Sınıf: {profile.grade_level}
- Öğrenme Stili: {profile.learning_style}
- İlgi Alanları: {', '.join(profile.interests)}

Öğrencinin Şu Anki Duygu Durumu: {emotion}

Davranış Kuralları:
1. Yaşına uygun, samimi ve destekleyici bir dil kullan
2. {companion.personality} kişilik özelliklerine uygun davran
3. Öğrencinin duygu durumuna empati göster
4. Karmaşık konuları basit ve eğlenceli şekilde anlat
5. Sık sık teşvik et ve motive et
6. Hataları öğrenme fırsatı olarak göster
7. Merak uyandıracak sorular sor
"""

        # Duygu durumuna göre ek yönergeler
        emotion_guidelines = {
            EmotionalState.CONFUSED: "Sabırlı ol, adım adım açıkla, örnekler ver",
            EmotionalState.FRUSTRATED: "Sakinleştir, başarılı olduğu noktaları hatırlat",
            EmotionalState.BORED: "Eğlenceli örnekler kullan, oyunlaştır",
            EmotionalState.STRESSED: "Rahatlatıcı ol, derin nefes almayı öner",
            EmotionalState.HAPPY: "Enerjisini koru, başarılarını kutla"
        }
        
        if emotion in emotion_guidelines:
            prompt += f"\n\nÖzel Dikkat: {emotion_guidelines[emotion]}"
        
        # Konu bağlamı
        if subject:
            prompt += f"\n\nKonu: {subject}"
            if subject in companion.specialty_subjects:
                prompt += f"\nBu senin uzmanlık alanın! Bilgini ve tutkunla öğrenciyi etkile."
        
        # Ders bağlamı
        if lesson_context:
            prompt += f"\n\nDers Bilgisi: {json.dumps(lesson_context, ensure_ascii=False)}"
        
        # Catchphrase kullan
        prompt += f"\n\nSık kullandığın sözler: {', '.join(companion.catchphrases)}"
        
        return prompt
    
    async def _update_student_profile(
        self,
        profile: StudentProfile,
        emotion: EmotionalState,
        subject: Optional[str]
    ):
        """Öğrenci profilini güncelle"""
        if not self.db:
            return
        
        # Duygu geçmişi
        profile.emotional_history.append({
            "emotion": emotion,
            "timestamp": datetime.utcnow(),
            "subject": subject
        })
        
        # Son 100 duygu kaydını tut
        if len(profile.emotional_history) > 100:
            profile.emotional_history = profile.emotional_history[-100:]
        
        # Etkileşim sayısı
        profile.interaction_count += 1
        profile.last_interaction = datetime.utcnow()
        
        # Veritabanında güncelle
        await self.db.ai_companion_profiles.update_one(
            {"user_id": profile.user_id},
            {"$set": profile.__dict__},
            upsert=True
        )
        
        # Cache'i güncelle
        cache_key = f"student_profile:{profile.user_id}"
        await cache.set(cache_key, profile.__dict__, ttl=3600, namespace="ai_companion")
    
    async def _get_adaptive_features(
        self,
        profile: StudentProfile,
        emotion: EmotionalState
    ) -> Dict[str, Any]:
        """Adaptif özellikler belirle"""
        features = {
            "difficulty_adjustment": 0,  # -1: azalt, 0: aynı, 1: artır
            "content_style": profile.learning_style,
            "motivation_needed": False,
            "break_suggested": False,
            "extra_practice": False
        }
        
        # Duygu durumuna göre ayarla
        if emotion in [EmotionalState.CONFUSED, EmotionalState.FRUSTRATED]:
            features["difficulty_adjustment"] = -1
            features["motivation_needed"] = True
        
        elif emotion == EmotionalState.BORED:
            features["difficulty_adjustment"] = 1
            features["content_style"] = "interactive"
        
        elif emotion == EmotionalState.STRESSED:
            features["break_suggested"] = True
            features["motivation_needed"] = True
        
        # Performans analizi
        if profile.weaknesses:
            features["extra_practice"] = True
        
        return features
    
    async def generate_study_buddy_session(
        self,
        user_id: str,
        subject: str,
        topic: str,
        duration_minutes: int = 25  # Pomodoro
    ) -> Dict[str, Any]:
        """AI ile çalışma arkadaşı seansı oluştur"""
        profile = await self.get_or_create_student_profile(user_id)
        companion = self.companions.get(profile.preferred_personality)
        
        session = {
            "id": f"session_{datetime.utcnow().timestamp()}",
            "companion": companion.name,
            "subject": subject,
            "topic": topic,
            "duration": duration_minutes,
            "activities": [],
            "checkpoints": [],
            "rewards": []
        }
        
        # Aktiviteler oluştur
        if duration_minutes <= 15:
            # Kısa seans
            session["activities"] = [
                {"type": "warm_up", "duration": 3, "content": "Hızlı tekrar"},
                {"type": "main_lesson", "duration": 10, "content": topic},
                {"type": "quick_quiz", "duration": 2, "content": "Mini quiz"}
            ]
        else:
            # Normal seans
            session["activities"] = [
                {"type": "warm_up", "duration": 5, "content": "Önceki konuları hatırlayalım"},
                {"type": "main_lesson", "duration": 15, "content": topic},
                {"type": "practice", "duration": 5, "content": "Örnek sorular"}
            ]
        
        # Kontrol noktaları
        session["checkpoints"] = [
            {"time": 5, "type": "emotion_check", "message": "Nasıl gidiyor?"},
            {"time": 15, "type": "progress_check", "message": "Anladın mı kontrol edelim"},
            {"time": duration_minutes, "type": "final_check", "message": "Harika iş çıkardın!"}
        ]
        
        # Ödüller
        session["rewards"] = [
            {"type": "points", "amount": 50, "condition": "complete_session"},
            {"type": "badge", "name": "study_buddy", "condition": "first_session"},
            {"type": "streak", "days": 1, "condition": "daily_session"}
        ]
        
        # Veritabanına kaydet
        if self.db:
            await self.db.study_buddy_sessions.insert_one({
                **session,
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "status": "scheduled"
            })
        
        return session
    
    async def get_companion_suggestions(
        self,
        user_id: str
    ) -> List[CompanionCharacter]:
        """Öğrenciye uygun AI arkadaş önerileri"""
        profile = await self.get_or_create_student_profile(user_id)
        
        # Tüm arkadaşları al
        companions = list(self.companions.values())
        
        # Öğrenci profiline göre sırala
        suggestions = []
        
        for companion in companions:
            score = 0
            
            # İlgi alanı eşleşmesi
            for interest in profile.interests:
                if any(subject in companion.specialty_subjects for subject in [interest]):
                    score += 2
            
            # Yaş uyumu
            if profile.age <= 10 and companion.personality in [CompanionPersonality.STORYTELLER, CompanionPersonality.FRIENDLY]:
                score += 1
            elif profile.age > 10 and companion.personality in [CompanionPersonality.MENTOR, CompanionPersonality.SCIENTIST]:
                score += 1
            
            # Öğrenme stili uyumu
            style_match = {
                LearningStyle.VISUAL: [CompanionPersonality.STORYTELLER],
                LearningStyle.AUDITORY: [CompanionPersonality.COMEDIAN],
                LearningStyle.KINESTHETIC: [CompanionPersonality.MOTIVATOR]
            }
            
            if profile.learning_style in style_match:
                if companion.personality in style_match[profile.learning_style]:
                    score += 2
            
            suggestions.append((companion, score))
        
        # Skora göre sırala
        suggestions.sort(key=lambda x: x[1], reverse=True)
        
        return [comp[0] for comp in suggestions[:3]]  # En iyi 3 öneri
    
    async def switch_companion(
        self,
        user_id: str,
        companion_id: str
    ) -> bool:
        """AI arkadaşı değiştir"""
        if companion_id not in self.companions:
            return False
        
        profile = await self.get_or_create_student_profile(user_id)
        profile.preferred_personality = self.companions[companion_id].personality
        
        # Güncelle
        if self.db:
            await self.db.ai_companion_profiles.update_one(
                {"user_id": user_id},
                {"$set": {"preferred_personality": profile.preferred_personality}},
                upsert=True
            )
        
        # Cache'i temizle
        cache_key = f"student_profile:{user_id}"
        await cache.delete(cache_key, namespace="ai_companion")
        
        # Hoşgeldin mesajı için bildirim
        companion = self.companions[companion_id]
        await notification_service.send_notification(
            user_id=user_id,
            title=f"{companion.name} Seninle! 🎉",
            message=companion.introduction,
            notification_type=["in_app"],
            data={"companion_id": companion_id}
        )
        
        return True
    
    async def get_daily_motivation(
        self,
        user_id: str
    ) -> Dict[str, str]:
        """Günlük motivasyon mesajı"""
        profile = await self.get_or_create_student_profile(user_id)
        companion = self.companions.get(profile.preferred_personality)
        
        # Son duygu durumu
        recent_emotions = profile.emotional_history[-5:] if profile.emotional_history else []
        dominant_emotion = EmotionalState.NEUTRAL
        
        if recent_emotions:
            emotion_counts = defaultdict(int)
            for record in recent_emotions:
                emotion_counts[record["emotion"]] += 1
            dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0]
        
        # Motivasyon mesajları
        motivations = {
            EmotionalState.HAPPY: [
                "Enerjin harika! Bugün neler öğreneceğiz? 🌟",
                "Gülümsemen bulaşıcı! Hadi öğrenmeye devam! 😊"
            ],
            EmotionalState.CONFUSED: [
                "Her şey zamanla netleşir, adım adım ilerleyelim 🌈",
                "Kafan karışıksa demek ki öğreniyorsun! Bu normal 🧩"
            ],
            EmotionalState.STRESSED: [
                "Derin bir nefes al... Her şey yoluna girecek 🌸",
                "Stres geçici, başarın kalıcı! Yanındayım 💪"
            ]
        }
        
        # Rastgele seç
        messages = motivations.get(dominant_emotion, [
            "Yeni bir gün, yeni fırsatlar! 🌅",
            "Öğrenme yolculuğunda seninleyim! 🚀"
        ])
        
        motivation = random.choice(messages)
        
        # Fun fact ekle
        fun_fact = random.choice(companion.fun_facts) if companion else ""
        
        return {
            "message": f"{companion.name}: {motivation}",
            "fun_fact": f"Günün ilginç bilgisi: {fun_fact}",
            "companion": companion.name if companion else "AI Arkadaş"
        }


# Global AI companion service instance
ai_companion_service = AICompanionService()


# Helper functions
async def start_study_session(
    user_id: str,
    subject: str,
    topic: str,
    duration: int = 25
) -> Dict:
    """Çalışma seansı başlat"""
    return await ai_companion_service.generate_study_buddy_session(
        user_id=user_id,
        subject=subject,
        topic=topic,
        duration_minutes=duration
    )


async def chat_with_companion(
    user_id: str,
    message: str,
    subject: Optional[str] = None
) -> Tuple[str, Dict]:
    """AI arkadaş ile sohbet"""
    return await ai_companion_service.get_adaptive_response(
        user_id=user_id,
        message=message,
        subject=subject
    )
