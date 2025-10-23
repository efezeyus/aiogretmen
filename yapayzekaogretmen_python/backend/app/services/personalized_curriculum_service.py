"""
Kişiselleştirilmiş Müfredat Servisi
MEB müfredatı ile adaptive learning'i birleştiren ana servis
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from loguru import logger

from app.db.mongodb import get_database
from app.services.curriculum_manager import curriculum_manager
from app.services.adaptive_learning_service import AdaptiveLearningService
from app.services.personalized_learning_engine import PersonalizedLearningEngine


@dataclass
class StudentCurriculumPlan:
    """Öğrenci için kişiselleştirilmiş müfredat planı"""
    student_id: str
    grade: int
    subject: str
    
    # Öğrenci profili
    current_level: str = "orta"  # temel, orta, ileri
    learning_style: str = "görsel"  # görsel, işitsel, dokunsal
    learning_pace: float = 1.0  # 0.5 = yavaş, 1.0 = normal, 1.5 = hızlı
    
    # Müfredat yolu
    completed_topics: List[str] = field(default_factory=list)
    current_topic: Optional[str] = None
    upcoming_topics: List[Dict] = field(default_factory=list)
    
    # Performans metrikleri
    overall_score: float = 0.0
    topic_scores: Dict[str, float] = field(default_factory=dict)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    
    # Öneriler
    recommended_activities: List[Dict] = field(default_factory=list)
    recommended_review_topics: List[str] = field(default_factory=list)
    estimated_completion_date: Optional[datetime] = None
    
    # AI insights
    ai_recommendations: List[str] = field(default_factory=list)
    motivation_message: str = ""
    next_milestone: Optional[str] = None


class PersonalizedCurriculumService:
    """Kişiselleştirilmiş Müfredat Ana Servisi"""
    
    def __init__(self):
        self.db = get_database()
        self.adaptive_service = AdaptiveLearningService()
        self.learning_engine = PersonalizedLearningEngine()
        
        # Zorluk eşikleri
        self.difficulty_thresholds = {
            "temel": {"min": 0.0, "max": 0.60},
            "orta": {"min": 0.60, "max": 0.85},
            "ileri": {"min": 0.85, "max": 1.0}
        }
        
        logger.info("Personalized Curriculum Service başlatıldı")
    
    async def create_personalized_plan(
        self, 
        student_id: str, 
        grade: int, 
        subject: str
    ) -> StudentCurriculumPlan:
        """Öğrenci için kişiselleştirilmiş müfredat planı oluştur"""
        
        try:
            # Öğrenci profilini al
            profile = await self.adaptive_service.get_or_create_learning_profile(student_id)
            
            # MEB müfredatını al
            curriculum = curriculum_manager.get_detailed_curriculum(grade, subject)
            
            if not curriculum:
                raise ValueError(f"{grade}. sınıf {subject} müfredatı bulunamadı")
            
            # Plan oluştur
            plan = StudentCurriculumPlan(
                student_id=student_id,
                grade=grade,
                subject=subject
            )
            
            # Öğrenci profilinden verileri al
            plan.learning_style = profile.learning_style
            plan.learning_pace = profile.learning_velocity
            
            # Performans analizi
            await self._analyze_performance(plan, profile, subject)
            
            # Müfredat yolu oluştur
            await self._build_curriculum_path(plan, curriculum, profile)
            
            # Aktivite önerileri
            await self._generate_activity_recommendations(plan, curriculum, profile)
            
            # AI önerileri
            await self._generate_ai_insights(plan, profile)
            
            # Planı kaydet
            await self._save_plan(plan)
            
            return plan
            
        except Exception as e:
            logger.error(f"Kişiselleştirilmiş plan oluşturma hatası: {e}")
            raise
    
    async def _analyze_performance(
        self, 
        plan: StudentCurriculumPlan, 
        profile, 
        subject: str
    ):
        """Öğrenci performansını analiz et"""
        
        # Genel başarı oranı
        subject_metrics = profile.learning_metrics.get(subject)
        if subject_metrics:
            plan.overall_score = subject_metrics.success_rate
            plan.current_level = self._determine_level(subject_metrics.success_rate)
        
        # Konu bazlı analiz
        for topic, metrics in profile.learning_metrics.items():
            if topic.startswith(subject):
                topic_name = topic.split('.')[-1]
                plan.topic_scores[topic_name] = metrics.success_rate
                
                # Güçlü/zayıf yönleri belirle
                if metrics.success_rate >= 0.80:
                    plan.strengths.append(topic_name)
                elif metrics.success_rate < 0.60:
                    plan.weaknesses.append(topic_name)
    
    async def _build_curriculum_path(
        self, 
        plan: StudentCurriculumPlan, 
        curriculum: Dict, 
        profile
    ):
        """Öğrenci için optimize edilmiş müfredat yolu oluştur"""
        
        all_topics = []
        
        # Müfredattan tüm konuları çıkar
        if isinstance(curriculum, dict) and "learning_areas" in curriculum:
            for learning_area in curriculum["learning_areas"]:
                for unit in learning_area.get("units", []):
                    for topic in unit.get("topics", []):
                        topic_info = {
                            "topic_id": f"{plan.subject}.{unit['title']}.{topic['title']}",
                            "topic_name": topic["title"],
                            "unit_name": unit["title"],
                            "learning_area": learning_area["name"],
                            "estimated_hours": unit.get("estimated_hours", 2) / len(unit.get("topics", [1])),
                            "objectives": topic.get("objectives", []),
                            "difficulty": self._estimate_topic_difficulty(topic)
                        }
                        all_topics.append(topic_info)
        
        # Tamamlanan konuları belirle (örnek - gerçekte DB'den gelecek)
        completed = set(plan.completed_topics)
        
        # Upcoming topics - Adaptif sıralama
        upcoming = []
        for topic in all_topics:
            if topic["topic_name"] not in completed:
                # Zorluk ve öğrenci seviyesi uyumu
                topic["compatibility_score"] = self._calculate_topic_compatibility(
                    topic, plan.current_level, profile
                )
                upcoming.append(topic)
        
        # En uygun konuları sırala
        upcoming.sort(key=lambda x: -x["compatibility_score"])
        
        # Current topic - Henüz başlanmadıysa ilkini seç
        if not plan.current_topic and upcoming:
            plan.current_topic = upcoming[0]["topic_name"]
        
        # Upcoming topics - İlk 5 tanesini al
        plan.upcoming_topics = upcoming[:5]
        
        # Tamamlanma tahmini
        remaining_hours = sum(t["estimated_hours"] for t in upcoming)
        daily_study_hours = 1.0  # Varsayılan günlük çalışma
        estimated_days = int(remaining_hours / daily_study_hours)
        plan.estimated_completion_date = datetime.utcnow() + timedelta(days=estimated_days)
    
    async def _generate_activity_recommendations(
        self, 
        plan: StudentCurriculumPlan, 
        curriculum: Dict, 
        profile
    ):
        """Öğrenci için aktivite önerileri oluştur"""
        
        recommendations = []
        
        # Zayıf konular için tekrar aktiviteleri
        for weakness in plan.weaknesses[:3]:  # En zayıf 3 konu
            recommendations.append({
                "type": "review",
                "topic": weakness,
                "priority": "high",
                "activity_types": ["practice", "video", "interactive"],
                "reason": f"Bu konuda başarı oranın %{plan.topic_scores.get(weakness, 0)*100:.0f}. Tekrar çalışmalısın.",
                "estimated_time": 30
            })
        
        # Güçlü konular için ileri aktiviteler
        for strength in plan.strengths[:2]:  # En güçlü 2 konu
            recommendations.append({
                "type": "challenge",
                "topic": strength,
                "priority": "medium",
                "activity_types": ["advanced_quiz", "project"],
                "reason": f"Bu konuda çok başarılısın! Kendini daha fazla geliştirebilirsin.",
                "estimated_time": 45
            })
        
        # Upcoming topic için hazırlık
        if plan.upcoming_topics:
            next_topic = plan.upcoming_topics[0]
            recommendations.append({
                "type": "preparation",
                "topic": next_topic["topic_name"],
                "priority": "high",
                "activity_types": ["intro_video", "prerequisite_check"],
                "reason": "Bir sonraki konuya hazırlanman için ön bilgiler",
                "estimated_time": 20
            })
        
        # Öğrenme stiline göre özelleştir
        for rec in recommendations:
            if plan.learning_style == "görsel":
                rec["activity_types"] = [a for a in rec["activity_types"] if a in ["video", "interactive", "animation"]]
            elif plan.learning_style == "işitsel":
                rec["activity_types"] = [a for a in rec["activity_types"] if a in ["audio", "podcast", "discussion"]]
            elif plan.learning_style == "dokunsal":
                rec["activity_types"] = [a for a in rec["activity_types"] if a in ["practice", "project", "experiment"]]
        
        plan.recommended_activities = recommendations
        
        # Tekrar gereken konuları belirle
        plan.recommended_review_topics = plan.weaknesses[:5]
    
    async def _generate_ai_insights(self, plan: StudentCurriculumPlan, profile):
        """AI destekli içgörüler ve öneriler"""
        
        insights = []
        
        # Genel performans değerlendirmesi
        if plan.overall_score >= 0.85:
            insights.append("🌟 Harika gidiyorsun! Başarı oranın çok yüksek.")
            plan.motivation_message = "Mükemmel bir iş çıkarıyorsun! Başarılarını sürdür. 🎯"
        elif plan.overall_score >= 0.70:
            insights.append("👍 İyi bir ilerleme kaydediyorsun.")
            plan.motivation_message = "Güzel gidiyorsun! Biraz daha çaba ile harika olacak. 💪"
        else:
            insights.append("📚 Daha fazla çalışma zamanı ayırmalısın.")
            plan.motivation_message = "Pes etme! Her çalışma seni hedefe bir adım daha yaklaştırıyor. 🌱"
        
        # Öğrenme stili uyarısı
        if plan.learning_style == "görsel":
            insights.append("🎨 Görsel öğrenen birisin. Video ve şemalarla çalışmayı sürdür.")
        elif plan.learning_style == "işitsel":
            insights.append("🎧 Sesli kayıtlar ve tartışmalar sana uygun.")
        elif plan.learning_style == "dokunsal":
            insights.append("🔬 Pratik ve deneylerle öğrenmeyi seviyorsun.")
        
        # Öğrenme hızı analizi
        if plan.learning_pace > 1.3:
            insights.append("⚡ Hızlı öğrenen birisin! Daha zor içerikler deneyebilirsin.")
            plan.next_milestone = "İleri seviye konulara geçiş"
        elif plan.learning_pace < 0.7:
            insights.append("🐢 Sakin adımlarla ilerliyorsun. Acele etme, önemli olan anlamak.")
            plan.next_milestone = "Mevcut konuları pekiştirme"
        else:
            insights.append("📊 Normal bir hızla ilerliyorsun.")
            plan.next_milestone = "Sonraki üniteyi tamamlama"
        
        # Güçlü yönler vurgusu
        if plan.strengths:
            insights.append(f"💪 Güçlü olduğun konular: {', '.join(plan.strengths[:3])}")
        
        # Gelişim alanları
        if plan.weaknesses:
            insights.append(f"📈 Gelişim alanların: {', '.join(plan.weaknesses[:3])}")
            insights.append("Bu konulara ekstra zaman ayırmanı öneriyorum.")
        
        # Zamanlama önerisi
        if plan.estimated_completion_date:
            days_left = (plan.estimated_completion_date - datetime.utcnow()).days
            if days_left > 0:
                insights.append(f"📅 Tahmini tamamlama: {days_left} gün sonra ({plan.estimated_completion_date.strftime('%d %B %Y')})")
        
        plan.ai_recommendations = insights
    
    def _determine_level(self, score: float) -> str:
        """Başarı oranına göre seviye belirle"""
        if score >= 0.85:
            return "ileri"
        elif score >= 0.60:
            return "orta"
        else:
            return "temel"
    
    def _estimate_topic_difficulty(self, topic: Dict) -> str:
        """Konu zorluğunu tahmin et"""
        # Objectives sayısına ve karmaşıklığına göre
        objectives = topic.get("objectives", [])
        
        if len(objectives) >= 4:
            return "zor"
        elif len(objectives) >= 2:
            return "orta"
        else:
            return "kolay"
    
    def _calculate_topic_compatibility(
        self, 
        topic: Dict, 
        student_level: str, 
        profile
    ) -> float:
        """Konunun öğrenci ile uyumluluğunu hesapla"""
        
        score = 0.5  # Base score
        
        # Zorluk uyumu
        topic_difficulty = topic.get("difficulty", "orta")
        if topic_difficulty == student_level:
            score += 0.3
        elif abs(["temel", "orta", "ileri"].index(topic_difficulty) - 
                 ["temel", "orta", "ileri"].index(student_level)) == 1:
            score += 0.15  # Bir seviye fark
        
        # Prerequisite kontrolü (basitleştirilmiş)
        score += 0.2
        
        return min(1.0, score)
    
    async def _save_plan(self, plan: StudentCurriculumPlan):
        """Planı veritabanına kaydet"""
        if self.db is None:
            return
        
        plan_data = {
            "student_id": plan.student_id,
            "grade": plan.grade,
            "subject": plan.subject,
            "current_level": plan.current_level,
            "learning_style": plan.learning_style,
            "learning_pace": plan.learning_pace,
            "completed_topics": plan.completed_topics,
            "current_topic": plan.current_topic,
            "upcoming_topics": plan.upcoming_topics,
            "overall_score": plan.overall_score,
            "topic_scores": plan.topic_scores,
            "strengths": plan.strengths,
            "weaknesses": plan.weaknesses,
            "recommended_activities": plan.recommended_activities,
            "recommended_review_topics": plan.recommended_review_topics,
            "estimated_completion_date": plan.estimated_completion_date,
            "ai_recommendations": plan.ai_recommendations,
            "motivation_message": plan.motivation_message,
            "next_milestone": plan.next_milestone,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Update veya insert
        await self.db.student_curriculum_plans.update_one(
            {"student_id": plan.student_id, "grade": plan.grade, "subject": plan.subject},
            {"$set": plan_data},
            upsert=True
        )
        
        logger.info(f"✅ Plan kaydedildi: {plan.student_id} - {plan.grade}. sınıf {plan.subject}")
    
    async def get_student_plan(
        self, 
        student_id: str, 
        grade: int, 
        subject: str
    ) -> Optional[StudentCurriculumPlan]:
        """Kaydedilmiş planı getir"""
        if self.db is None:
            return None
        
        plan_data = await self.db.student_curriculum_plans.find_one({
            "student_id": student_id,
            "grade": grade,
            "subject": subject
        })
        
        if not plan_data:
            return None
        
        # Dict'ten StudentCurriculumPlan oluştur
        return StudentCurriculumPlan(**{
            k: v for k, v in plan_data.items() 
            if k not in ["_id", "created_at", "updated_at"]
        })
    
    async def update_progress(
        self, 
        student_id: str, 
        grade: int, 
        subject: str,
        topic: str,
        score: float,
        time_spent: int
    ) -> StudentCurriculumPlan:
        """Öğrenci ilerlemesini güncelle ve planı yeniden hesapla"""
        
        # Aktiviteyi kaydet
        activity = {
            "type": "lesson",
            "topic": f"{subject}.{topic}",
            "score": score,
            "duration": time_spent,
            "completed": score >= 0.60,
            "timestamp": datetime.utcnow()
        }
        
        await self.adaptive_service.track_learning_activity(student_id, activity)
        
        # Planı yenile
        plan = await self.create_personalized_plan(student_id, grade, subject)
        
        # Tamamlanan konuyu güncelle
        if score >= 0.60 and topic not in plan.completed_topics:
            plan.completed_topics.append(topic)
            
            # Bir sonraki konuya geç
            if plan.upcoming_topics:
                plan.current_topic = plan.upcoming_topics[0]["topic_name"]
            
            await self._save_plan(plan)
        
        return plan
    
    async def get_next_activity(
        self, 
        student_id: str, 
        grade: int, 
        subject: str
    ) -> Dict[str, Any]:
        """Öğrenci için bir sonraki aktiviteyi öner"""
        
        plan = await self.get_student_plan(student_id, grade, subject)
        
        if not plan:
            plan = await self.create_personalized_plan(student_id, grade, subject)
        
        # En yüksek öncelikli aktiviteyi seç
        if plan.recommended_activities:
            next_activity = sorted(
                plan.recommended_activities, 
                key=lambda x: {"high": 3, "medium": 2, "low": 1}[x["priority"]]
            )[0]
            
            return {
                "activity": next_activity,
                "current_topic": plan.current_topic,
                "motivation": plan.motivation_message,
                "progress_percentage": len(plan.completed_topics) / 
                    (len(plan.completed_topics) + len(plan.upcoming_topics)) * 100
                    if plan.upcoming_topics else 0
            }
        
        return {
            "message": "Şu an için önerimiz yok",
            "current_topic": plan.current_topic
        }
    
    async def get_dashboard_summary(
        self, 
        student_id: str
    ) -> Dict[str, Any]:
        """Öğrenci için dashboard özeti"""
        
        # Öğrenci bilgisini al
        user = await self.db.users.find_one({"_id": student_id}) if self.db else None
        
        if not user:
            return {"error": "Öğrenci bulunamadı"}
        
        grade = user.get("grade")
        
        # Ana dersleri al
        main_subjects = ["matematik", "turkce", "fen_bilimleri"]
        
        summary = {
            "student_id": student_id,
            "student_name": user.get("name"),
            "grade": grade,
            "overall_progress": {},
            "quick_stats": {
                "total_time_minutes": 0,
                "completed_topics": 0,
                "current_streak": 0,
                "level": 1,
                "total_xp": 0
            },
            "active_plans": []
        }
        
        # Her ders için plan özetini al
        for subject in main_subjects:
            plan = await self.get_student_plan(student_id, grade, subject)
            
            if plan:
                summary["overall_progress"][subject] = {
                    "current_topic": plan.current_topic,
                    "completed_count": len(plan.completed_topics),
                    "overall_score": plan.overall_score,
                    "level": plan.current_level,
                    "next_milestone": plan.next_milestone
                }
                
                summary["active_plans"].append({
                    "subject": subject,
                    "progress": len(plan.completed_topics),
                    "next_activity": plan.recommended_activities[0] if plan.recommended_activities else None
                })
        
        return summary


# Global instance
personalized_curriculum_service = PersonalizedCurriculumService()

