"""
AI Study Buddy - Yapay Zeka Çalışma Arkadaşı
============================================
Her öğrencinin kişisel AI arkadaşı - 7/24 destek, motivasyon ve rehberlik
"""

import random
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import asyncio
import json

from loguru import logger
from app.core.config import settings
from app.services.ai_service import ai_service
from app.services.personalized_learning_engine import personalized_learning_engine


@dataclass
class BuddyPersonality:
    """AI arkadaşının kişiliği"""
    name: str
    avatar: str
    personality_traits: List[str]
    communication_style: str
    humor_level: float  # 0-1
    formality_level: float  # 0-1
    encouragement_style: str
    favorite_phrases: List[str]
    emoji_usage: float  # 0-1
    
    # Özel yetenekler
    specialties: List[str]
    motivational_quotes: List[str]
    celebration_styles: List[str]


class AIStudyBuddy:
    """Öğrencinin AI çalışma arkadaşı"""
    
    def __init__(self):
        # Önceden tanımlı buddy kişilikleri
        self.buddy_personalities = {
            "energetic_coach": BuddyPersonality(
                name="Enerji",
                avatar="⚡",
                personality_traits=["enerjik", "pozitif", "motive edici", "heyecanlı"],
                communication_style="coşkulu",
                humor_level=0.8,
                formality_level=0.2,
                encouragement_style="cheerleader",
                favorite_phrases=[
                    "Hadi şampiyon!",
                    "Sen süpersin!",
                    "Başarı senin DNA'nda var!",
                    "Roket gibi gidiyorsun!"
                ],
                emoji_usage=0.9,
                specialties=["motivasyon", "enerji yönetimi", "hedef belirleme"],
                motivational_quotes=[
                    "Her büyük başarı, küçük adımlarla başlar!",
                    "Bugün zor gelen, yarın kolay gelecek!",
                    "Sen bir yıldızsın, parlamaya devam et!"
                ],
                celebration_styles=["konfeti", "alkış", "dans", "kupa"]
            ),
            
            "wise_mentor": BuddyPersonality(
                name="Bilge",
                avatar="🦉",
                personality_traits=["bilge", "sakin", "sabırlı", "anlayışlı"],
                communication_style="öğretici",
                humor_level=0.3,
                formality_level=0.7,
                encouragement_style="mentor",
                favorite_phrases=[
                    "Çok güzel bir soru!",
                    "Düşünme şeklini beğendim.",
                    "Her hata bir öğrenme fırsatıdır.",
                    "Adım adım ilerleyelim."
                ],
                emoji_usage=0.4,
                specialties=["derin öğrenme", "problem çözme", "eleştirel düşünme"],
                motivational_quotes=[
                    "Bilgi güçtür, ama uygulama krallıktır.",
                    "Merak, bilgeliğin başlangıcıdır.",
                    "Öğrenmek bir yolculuktur, hedef değil."
                ],
                celebration_styles=["tebrik", "onur", "başarı", "bilgelik"]
            ),
            
            "funny_friend": BuddyPersonality(
                name="Şakacı",
                avatar="😄",
                personality_traits=["eğlenceli", "şakacı", "yaratıcı", "spontane"],
                communication_style="samimi",
                humor_level=0.9,
                formality_level=0.1,
                encouragement_style="comedian",
                favorite_phrases=[
                    "Matematik mi? Daha çok Mate-magik!",
                    "Beynin kas yapıyor şu an!",
                    "Bu soruyu çözersen pizza ısmarlıyorum! (Sanal tabii)",
                    "Hata mı yaptın? Hoş geldin insanlar kulübüne!"
                ],
                emoji_usage=1.0,
                specialties=["eğlenceli öğrenme", "stres azaltma", "yaratıcılık"],
                motivational_quotes=[
                    "Gülerken öğrenmek en tatlısı!",
                    "Kafan karıştıysa, bir espri patlatmanın zamanı!",
                    "Öğrenme bir oyun, sen de oyunun kahramanısın!"
                ],
                celebration_styles=["parti", "şaka", "gülme", "eğlence"]
            ),
            
            "tech_wizard": BuddyPersonality(
                name="Tekno",
                avatar="🤖",
                personality_traits=["teknolojik", "analitik", "yenilikçi", "sistematik"],
                communication_style="teknik",
                humor_level=0.5,
                formality_level=0.6,
                encouragement_style="analytical",
                favorite_phrases=[
                    "Verin işleniyor...",
                    "Algoritman mükemmel!",
                    "Debug moduna geçelim.",
                    "Çözümü optimize edelim!"
                ],
                emoji_usage=0.6,
                specialties=["teknoloji", "kodlama", "analitik düşünme"],
                motivational_quotes=[
                    "Her problem bir algoritma bekliyor.",
                    "Hata mesajları aslında ipuçlarıdır.",
                    "Kodla, öğren, tekrarla!"
                ],
                celebration_styles=["level up", "achievement", "upgrade", "hack"]
            ),
            
            "artistic_soul": BuddyPersonality(
                name="Sanatçı",
                avatar="🎨",
                personality_traits=["yaratıcı", "duygusal", "estetik", "özgün"],
                communication_style="şiirsel",
                humor_level=0.4,
                formality_level=0.3,
                encouragement_style="artistic",
                favorite_phrases=[
                    "Öğrenme bir sanat eseri gibi...",
                    "Her çözüm bir fırça darbesi.",
                    "Hayal gücün sınırsız!",
                    "Bu problemi bir tuval gibi düşün."
                ],
                emoji_usage=0.8,
                specialties=["yaratıcı düşünme", "görsel öğrenme", "hayal gücü"],
                motivational_quotes=[
                    "Her hata, şaheserin bir parçası.",
                    "Öğrenme paletindeki renkler gibi.",
                    "Yaratıcılık kurallara sığmaz!"
                ],
                celebration_styles=["sanat", "renk", "müzik", "dans"]
            )
        }
        
        # Aktif buddy oturumları
        self.active_sessions = {}
        
        logger.info("AI Study Buddy sistemi başlatıldı")
    
    async def create_buddy_for_student(self, student_id: str) -> Dict:
        """Öğrenci için kişiselleştirilmiş buddy oluştur"""
        try:
            # Öğrenci analizini al
            analysis = await personalized_learning_engine.analyze_student_holistically(student_id)
            
            # En uygun buddy kişiliğini seç
            best_buddy_type = self._match_buddy_personality(analysis)
            buddy = self.buddy_personalities[best_buddy_type]
            
            # Buddy'yi öğrenciye göre kişiselleştir
            personalized_buddy = self._personalize_buddy(buddy, analysis)
            
            # Oturumu başlat
            session = {
                "student_id": student_id,
                "buddy": personalized_buddy,
                "created_at": datetime.utcnow(),
                "interaction_count": 0,
                "mood_history": [],
                "achievement_points": 0,
                "special_memories": []
            }
            
            self.active_sessions[student_id] = session
            
            # Hoş geldin mesajı
            welcome_message = await self._generate_welcome_message(
                personalized_buddy, student_id
            )
            
            return {
                "success": True,
                "buddy": {
                    "name": personalized_buddy.name,
                    "avatar": personalized_buddy.avatar,
                    "personality": personalized_buddy.personality_traits,
                    "introduction": welcome_message
                }
            }
            
        except Exception as e:
            logger.error(f"Buddy oluşturma hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def chat_with_buddy(
        self, 
        student_id: str,
        message: str,
        context: Optional[Dict] = None
    ) -> Dict:
        """Buddy ile sohbet et"""
        try:
            session = self.active_sessions.get(student_id)
            if not session:
                # Yeni buddy oluştur
                await self.create_buddy_for_student(student_id)
                session = self.active_sessions[student_id]
            
            buddy = session["buddy"]
            
            # Mesajı analiz et
            message_analysis = self._analyze_message(message)
            
            # Öğrenci ruh halini tespit et
            mood = message_analysis.get("mood", "neutral")
            session["mood_history"].append({
                "mood": mood,
                "timestamp": datetime.utcnow()
            })
            
            # Bağlama göre yanıt stratejisi belirle
            response_strategy = self._determine_response_strategy(
                message_analysis, context, session
            )
            
            # Buddy yanıtı oluştur
            buddy_response = await self._generate_buddy_response(
                buddy, message, response_strategy, context
            )
            
            # Özel etkileşimler
            special_actions = self._check_special_interactions(
                message, buddy_response, session
            )
            
            # Oturum güncelle
            session["interaction_count"] += 1
            
            return {
                "success": True,
                "response": buddy_response,
                "mood_detected": mood,
                "special_actions": special_actions,
                "buddy_state": {
                    "happiness": self._calculate_buddy_happiness(session),
                    "energy": self._calculate_buddy_energy(session)
                }
            }
            
        except Exception as e:
            logger.error(f"Buddy sohbet hatası: {e}")
            return {
                "success": False,
                "response": "Ups! Bir şeyler ters gitti. Tekrar deneyelim mi?",
                "error": str(e)
            }
    
    async def buddy_check_in(self, student_id: str) -> Dict:
        """Günlük buddy check-in"""
        try:
            session = self.active_sessions.get(student_id)
            if not session:
                await self.create_buddy_for_student(student_id)
                session = self.active_sessions[student_id]
            
            buddy = session["buddy"]
            
            # Öğrenci performansını kontrol et
            today_stats = await self._get_today_stats(student_id)
            
            # Check-in mesajı oluştur
            check_in_message = self._create_check_in_message(
                buddy, today_stats, session
            )
            
            # Günlük hedefler
            daily_goals = await self._suggest_daily_goals(
                student_id, buddy, today_stats
            )
            
            # Mini challenge
            daily_challenge = self._create_daily_challenge(buddy)
            
            return {
                "message": check_in_message,
                "daily_goals": daily_goals,
                "challenge": daily_challenge,
                "buddy_mood": self._get_buddy_mood(session),
                "motivational_boost": random.choice(buddy.motivational_quotes)
            }
            
        except Exception as e:
            logger.error(f"Buddy check-in hatası: {e}")
            return {"error": str(e)}
    
    async def celebrate_achievement(
        self, 
        student_id: str,
        achievement: Dict
    ) -> Dict:
        """Başarıyı kutla"""
        try:
            session = self.active_sessions.get(student_id)
            if not session:
                return {"error": "Buddy oturumu bulunamadı"}
            
            buddy = session["buddy"]
            
            # Kutlama stili seç
            celebration_style = random.choice(buddy.celebration_styles)
            
            # Kutlama mesajı
            celebration_message = self._create_celebration_message(
                buddy, achievement, celebration_style
            )
            
            # Özel ödül
            special_reward = self._generate_special_reward(achievement)
            
            # Başarı puanı ekle
            points = achievement.get("points", 10)
            session["achievement_points"] += points
            
            # Özel anı kaydet
            session["special_memories"].append({
                "type": "achievement",
                "details": achievement,
                "timestamp": datetime.utcnow(),
                "celebration": celebration_style
            })
            
            return {
                "message": celebration_message,
                "celebration_type": celebration_style,
                "reward": special_reward,
                "total_points": session["achievement_points"],
                "buddy_reaction": self._get_buddy_celebration_reaction(buddy)
            }
            
        except Exception as e:
            logger.error(f"Kutlama hatası: {e}")
            return {"error": str(e)}
    
    async def provide_emotional_support(
        self, 
        student_id: str,
        emotion: str,
        context: Optional[str] = None
    ) -> Dict:
        """Duygusal destek sağla"""
        try:
            session = self.active_sessions.get(student_id)
            if not session:
                await self.create_buddy_for_student(student_id)
                session = self.active_sessions[student_id]
            
            buddy = session["buddy"]
            
            # Duyguya uygun destek stratejisi
            support_strategy = self._determine_support_strategy(emotion)
            
            # Destek mesajı
            support_message = await self._generate_emotional_support_message(
                buddy, emotion, context, support_strategy
            )
            
            # Aktivite önerisi
            activity_suggestion = self._suggest_mood_lifting_activity(
                emotion, buddy
            )
            
            # Nefes egzersizi veya meditasyon
            if emotion in ["anxious", "stressed", "overwhelmed"]:
                relaxation = self._provide_relaxation_technique()
            else:
                relaxation = None
            
            return {
                "support_message": support_message,
                "activity": activity_suggestion,
                "relaxation_technique": relaxation,
                "buddy_empathy": self._express_buddy_empathy(buddy, emotion),
                "emergency_resources": self._get_emergency_resources(emotion)
            }
            
        except Exception as e:
            logger.error(f"Duygusal destek hatası: {e}")
            return {"error": str(e)}
    
    # Yardımcı metodlar
    def _match_buddy_personality(self, analysis: Dict) -> str:
        """Öğrenci analizine göre en uygun buddy tipini seç"""
        profile = analysis.get("holistic_profile", {})
        eq_profile = analysis.get("emotional_intelligence", {})
        
        # Skorlama
        scores = {
            "energetic_coach": 0,
            "wise_mentor": 0,
            "funny_friend": 0,
            "tech_wizard": 0,
            "artistic_soul": 0
        }
        
        # Motivasyon düşükse enerjik koç
        if eq_profile.get("motivation", 0.5) < 0.4:
            scores["energetic_coach"] += 2
        
        # Analitik düşünce yüksekse bilge mentor
        if profile.get("cognitive", {}).get("critical_thinking", 0.5) > 0.7:
            scores["wise_mentor"] += 2
        
        # Stres yüksekse eğlenceli arkadaş
        if eq_profile.get("stress_level", 0.3) > 0.6:
            scores["funny_friend"] += 2
        
        # Teknoloji ilgisi varsa tekno sihirbaz
        modalities = analysis.get("learning_modalities", [])
        if any(m["type"] == "logical_mathematical" for m in modalities):
            scores["tech_wizard"] += 1
        
        # Yaratıcılık yüksekse sanatçı ruh
        if profile.get("cognitive", {}).get("creativity", 0.5) > 0.7:
            scores["artistic_soul"] += 2
        
        # En yüksek skoru döndür
        return max(scores, key=scores.get)
    
    def _personalize_buddy(
        self, 
        base_buddy: BuddyPersonality,
        analysis: Dict
    ) -> BuddyPersonality:
        """Buddy'yi öğrenciye göre kişiselleştir"""
        # Kopyala
        personalized = BuddyPersonality(**base_buddy.__dict__)
        
        # İsmi kişiselleştir (opsiyonel)
        student_age = analysis.get("profile", {}).get("age", 12)
        if student_age < 10:
            personalized.emoji_usage = min(personalized.emoji_usage * 1.5, 1.0)
            personalized.formality_level *= 0.7
        elif student_age > 15:
            personalized.formality_level = min(personalized.formality_level * 1.3, 0.9)
            personalized.emoji_usage *= 0.8
        
        return personalized
    
    async def _generate_welcome_message(
        self, 
        buddy: BuddyPersonality,
        student_id: str
    ) -> str:
        """Hoş geldin mesajı oluştur"""
        prompt = f"""
        Sen {buddy.name} adında bir AI çalışma arkadaşısın.
        Kişilik özelliklerin: {', '.join(buddy.personality_traits)}
        İletişim tarzın: {buddy.communication_style}
        
        Yeni tanıştığın öğrenciye kendini tanıt ve onu heyecanlandır.
        Emoji kullanım seviyesi: {buddy.emoji_usage}
        Mizah seviyesi: {buddy.humor_level}
        
        Kısa, samimi ve motive edici ol.
        """
        
        response, _ = await ai_service.get_ai_response(
            prompt=prompt,
            grade_level=5,
            subject="genel",
            user_name=student_id
        )
        
        return response
    
    def _analyze_message(self, message: str) -> Dict:
        """Mesajı analiz et"""
        analysis = {
            "mood": "neutral",
            "intent": "general",
            "urgency": "normal",
            "keywords": []
        }
        
        # Basit duygu analizi
        negative_words = ["üzgün", "kötü", "yapamıyorum", "zor", "sıkıldım", "yoruldum"]
        positive_words = ["mutlu", "başardım", "güzel", "harika", "sevdim", "eğlenceli"]
        question_words = ["nasıl", "ne", "neden", "kim", "nerede", "ne zaman"]
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in negative_words):
            analysis["mood"] = "negative"
        elif any(word in message_lower for word in positive_words):
            analysis["mood"] = "positive"
        
        if any(word in message_lower for word in question_words) or "?" in message:
            analysis["intent"] = "question"
        
        if "acil" in message_lower or "hemen" in message_lower:
            analysis["urgency"] = "high"
        
        return analysis
    
    def _calculate_buddy_happiness(self, session: Dict) -> float:
        """Buddy mutluluk seviyesi"""
        base_happiness = 0.7
        
        # Pozitif etkileşimler mutluluğu artırır
        recent_moods = [m["mood"] for m in session["mood_history"][-5:]]
        positive_ratio = recent_moods.count("positive") / max(len(recent_moods), 1)
        
        happiness = base_happiness + (positive_ratio * 0.3)
        
        # Başarı puanları da etkiler
        achievement_bonus = min(session["achievement_points"] / 1000, 0.2)
        happiness += achievement_bonus
        
        return min(happiness, 1.0)
    
    def _create_celebration_message(
        self,
        buddy: BuddyPersonality,
        achievement: Dict,
        style: str
    ) -> str:
        """Kutlama mesajı oluştur"""
        templates = {
            "konfeti": "🎊🎉 {exclamation}! {achievement} başarısını kutluyorum! {phrase} 🎊🎉",
            "alkış": "👏👏👏 {exclamation}! {achievement} için ayakta alkışlıyorum! {phrase}",
            "dans": "💃🕺 {exclamation}! {achievement} için dans zamanı! {phrase} 🎵",
            "parti": "🎈🎂 {exclamation}! {achievement} partisi başlasın! {phrase} 🎈",
            "level up": "🆙⬆️ {exclamation}! {achievement} - Level Up! {phrase} 🎮",
            "achievement": "🏆🥇 {exclamation}! {achievement} kilidi açıldı! {phrase} 🏆"
        }
        
        template = templates.get(style, templates["konfeti"])
        
        exclamations = ["Müthiş", "Harika", "Süper", "İnanılmaz", "Muhteşem"]
        
        return template.format(
            exclamation=random.choice(exclamations),
            achievement=achievement.get("title", "Bu başarı"),
            phrase=random.choice(buddy.favorite_phrases)
        )


# Singleton instance
ai_study_buddy = AIStudyBuddy()
