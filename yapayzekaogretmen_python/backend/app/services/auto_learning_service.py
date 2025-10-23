"""
Auto-Learning Service - Yapay Zeka Kendini Geliştirme Sistemi
--------------------------------------------------------
Öğrenci etkileşimlerinden öğrenen ve kendini geliştiren AI sistemi.
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio
from pathlib import Path
import numpy as np
from loguru import logger

from app.core.config import settings
# Circular import fix - will be imported when needed
from app.db.mongodb import get_database


class AutoLearningService:
    """Otomatik öğrenme ve model geliştirme servisi"""
    
    def __init__(self):
        self.db = get_database()
        self.learning_collection = self.db.auto_learning if self.db else None
        self.feedback_collection = self.db.student_feedback if self.db else None
        self.training_data_collection = self.db.training_data if self.db else None
        
        # Öğrenme parametreleri
        self.min_feedback_for_learning = 50  # Minimum geri bildirim sayısı
        self.confidence_threshold = 0.85  # Güven eşiği
        self.learning_interval_days = 7  # Öğrenme döngüsü (gün)
        
        logger.info("Auto-Learning Service başlatıldı")
    
    async def collect_learning_data(self, interaction: Dict) -> None:
        """
        Öğrenci etkileşimlerini topla ve analiz et
        
        Args:
            interaction: Öğrenci-AI etkileşim verisi
        """
        try:
            # Etkileşim verisini zenginleştir
            learning_data = {
                "timestamp": datetime.utcnow(),
                "user_id": interaction.get("user_id"),
                "grade_level": interaction.get("grade_level"),
                "subject": interaction.get("subject"),
                "question": interaction.get("question"),
                "ai_response": interaction.get("ai_response"),
                "user_feedback": interaction.get("feedback"),  # Beğendi/Beğenmedi
                "response_time": interaction.get("response_time"),
                "model_used": interaction.get("model_used"),
                "confidence_score": interaction.get("confidence_score", 0.9),
                "topic_tags": self._extract_topics(interaction.get("question", "")),
                "difficulty_level": self._estimate_difficulty(interaction),
                "success_indicator": interaction.get("success", True)
            }
            
            # Veritabanına kaydet
            if self.learning_collection:
                await self.learning_collection.insert_one(learning_data)
                logger.debug(f"Öğrenme verisi kaydedildi: {learning_data['timestamp']}")
            
            # Otomatik öğrenme tetikleyicisini kontrol et
            await self._check_learning_trigger()
            
        except Exception as e:
            logger.error(f"Öğrenme verisi toplama hatası: {e}")
    
    async def analyze_performance(self) -> Dict:
        """Model performansını analiz et"""
        try:
            if not self.learning_collection:
                return {"error": "Database bağlantısı yok"}
            
            # Son 7 günün verilerini al
            start_date = datetime.utcnow() - timedelta(days=7)
            
            pipeline = [
                {"$match": {"timestamp": {"$gte": start_date}}},
                {"$group": {
                    "_id": {
                        "subject": "$subject",
                        "grade_level": "$grade_level",
                        "model": "$model_used"
                    },
                    "total_interactions": {"$sum": 1},
                    "positive_feedback": {
                        "$sum": {"$cond": [{"$eq": ["$user_feedback", "positive"]}, 1, 0]}
                    },
                    "avg_confidence": {"$avg": "$confidence_score"},
                    "avg_response_time": {"$avg": "$response_time"},
                    "success_rate": {"$avg": {"$cond": ["$success_indicator", 1, 0]}}
                }},
                {"$project": {
                    "subject": "$_id.subject",
                    "grade_level": "$_id.grade_level",
                    "model": "$_id.model",
                    "total_interactions": 1,
                    "positive_feedback_rate": {
                        "$divide": ["$positive_feedback", "$total_interactions"]
                    },
                    "avg_confidence": 1,
                    "avg_response_time": 1,
                    "success_rate": 1
                }}
            ]
            
            results = await self.learning_collection.aggregate(pipeline).to_list(None)
            
            # Genel performans metrikleri
            performance = {
                "period": "last_7_days",
                "timestamp": datetime.utcnow().isoformat(),
                "by_subject": {},
                "overall": {
                    "total_interactions": sum(r["total_interactions"] for r in results),
                    "avg_positive_feedback": np.mean([r["positive_feedback_rate"] for r in results]) if results else 0,
                    "avg_confidence": np.mean([r["avg_confidence"] for r in results]) if results else 0,
                    "avg_response_time": np.mean([r["avg_response_time"] for r in results]) if results else 0,
                    "improvement_areas": []
                }
            }
            
            # Konu bazlı analiz
            for result in results:
                key = f"{result['subject']}_{result['grade_level']}"
                if key not in performance["by_subject"]:
                    performance["by_subject"][key] = []
                
                performance["by_subject"][key].append({
                    "model": result["model"],
                    "metrics": {
                        "interactions": result["total_interactions"],
                        "satisfaction": result["positive_feedback_rate"],
                        "confidence": result["avg_confidence"],
                        "response_time": result["avg_response_time"],
                        "success_rate": result["success_rate"]
                    }
                })
                
                # İyileştirme alanlarını tespit et
                if result["positive_feedback_rate"] < 0.7:
                    performance["overall"]["improvement_areas"].append({
                        "subject": result["subject"],
                        "grade": result["grade_level"],
                        "current_satisfaction": result["positive_feedback_rate"],
                        "recommendation": "Bu konu için daha fazla eğitim verisi gerekli"
                    })
            
            return performance
            
        except Exception as e:
            logger.error(f"Performans analizi hatası: {e}")
            return {"error": str(e)}
    
    async def generate_training_data(self) -> List[Dict]:
        """Geri bildirimlerden otomatik eğitim verisi oluştur"""
        try:
            if not self.learning_collection:
                return []
            
            # Yüksek kaliteli etkileşimleri seç
            quality_interactions = await self.learning_collection.find({
                "user_feedback": "positive",
                "confidence_score": {"$gte": self.confidence_threshold},
                "success_indicator": True,
                "training_data_generated": {"$ne": True}  # Daha önce kullanılmamış
            }).limit(100).to_list(None)
            
            training_data = []
            
            for interaction in quality_interactions:
                # JSONL formatında eğitim verisi oluştur
                training_example = {
                    "messages": [
                        {
                            "role": "system",
                            "content": self._generate_system_prompt(
                                interaction["grade_level"],
                                interaction["subject"]
                            )
                        },
                        {
                            "role": "user",
                            "content": interaction["question"]
                        },
                        {
                            "role": "assistant",
                            "content": interaction["ai_response"]
                        }
                    ]
                }
                
                training_data.append(training_example)
                
                # İşlendiğini işaretle
                await self.learning_collection.update_one(
                    {"_id": interaction["_id"]},
                    {"$set": {"training_data_generated": True}}
                )
            
            # Eğitim verisini kaydet
            if training_data and self.training_data_collection:
                await self.training_data_collection.insert_one({
                    "generated_at": datetime.utcnow(),
                    "data_count": len(training_data),
                    "data": training_data,
                    "status": "ready_for_training"
                })
                
                logger.info(f"{len(training_data)} adet eğitim verisi oluşturuldu")
            
            return training_data
            
        except Exception as e:
            logger.error(f"Eğitim verisi oluşturma hatası: {e}")
            return []
    
    async def adaptive_learning(self, user_profile: Dict) -> Dict:
        """Kullanıcı profiline göre adaptif öğrenme"""
        try:
            # Kullanıcının öğrenme geçmişini analiz et
            user_history = await self._get_user_learning_history(user_profile["user_id"])
            
            # Güçlü ve zayıf yönleri belirle
            strengths = []
            weaknesses = []
            
            for subject, data in user_history.items():
                if data["success_rate"] > 0.8:
                    strengths.append(subject)
                elif data["success_rate"] < 0.6:
                    weaknesses.append(subject)
            
            # Kişiselleştirilmiş öğrenme planı
            learning_plan = {
                "user_id": user_profile["user_id"],
                "analysis_date": datetime.utcnow().isoformat(),
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommendations": [],
                "difficulty_adjustment": 0,  # -1: Kolaylaştır, 0: Aynı, 1: Zorlaştır
                "focus_topics": []
            }
            
            # Öneriler oluştur
            if weaknesses:
                learning_plan["recommendations"].append(
                    f"Şu konulara daha fazla odaklanmalısın: {', '.join(weaknesses)}"
                )
                learning_plan["difficulty_adjustment"] = -1
                learning_plan["focus_topics"] = weaknesses[:3]  # En zayıf 3 konu
            
            if strengths and len(strengths) > 3:
                learning_plan["recommendations"].append(
                    "Güçlü olduğun konularda daha ileri seviye sorularla kendini geliştirebilirsin"
                )
                if not weaknesses:  # Zayıf yön yoksa zorlaştır
                    learning_plan["difficulty_adjustment"] = 1
            
            # Öğrenme hızı analizi
            learning_speed = self._calculate_learning_speed(user_history)
            if learning_speed < 0.5:
                learning_plan["recommendations"].append(
                    "Daha yavaş ilerlemen ve konuları tekrar etmen faydalı olabilir"
                )
            elif learning_speed > 0.8:
                learning_plan["recommendations"].append(
                    "Hızlı öğreniyorsun! Daha karmaşık konulara geçebilirsin"
                )
            
            return learning_plan
            
        except Exception as e:
            logger.error(f"Adaptif öğrenme hatası: {e}")
            return {"error": str(e)}
    
    async def continuous_improvement_cycle(self) -> Dict:
        """Sürekli iyileştirme döngüsü"""
        try:
            logger.info("Sürekli iyileştirme döngüsü başlatılıyor...")
            
            # 1. Performans analizi
            performance = await self.analyze_performance()
            
            # 2. Eğitim verisi oluştur
            training_data = await self.generate_training_data()
            
            # 3. Model karşılaştırması
            model_comparison = await self._compare_models()
            
            # 4. İyileştirme önerileri
            improvements = {
                "timestamp": datetime.utcnow().isoformat(),
                "performance_summary": performance.get("overall", {}),
                "training_data_generated": len(training_data),
                "model_recommendations": [],
                "action_items": []
            }
            
            # Model önerileri
            if model_comparison:
                best_model = max(model_comparison.items(), key=lambda x: x[1]["score"])
                improvements["model_recommendations"].append({
                    "current_best": best_model[0],
                    "score": best_model[1]["score"],
                    "reason": best_model[1]["reason"]
                })
            
            # Eylem öğeleri
            if performance["overall"].get("avg_positive_feedback", 0) < 0.7:
                improvements["action_items"].append({
                    "priority": "high",
                    "action": "Fine-tuning gerekli",
                    "details": "Kullanıcı memnuniyeti düşük, model yeniden eğitilmeli"
                })
            
            if len(training_data) >= 100:
                improvements["action_items"].append({
                    "priority": "medium",
                    "action": "Yeni fine-tuning başlat",
                    "details": f"{len(training_data)} yeni eğitim verisi hazır"
                })
            
            # Sonuçları kaydet
            if self.db:
                await self.db.improvement_cycles.insert_one(improvements)
            
            logger.info("Sürekli iyileştirme döngüsü tamamlandı")
            return improvements
            
        except Exception as e:
            logger.error(f"İyileştirme döngüsü hatası: {e}")
            return {"error": str(e)}
    
    # Yardımcı metodlar
    def _extract_topics(self, text: str) -> List[str]:
        """Metinden konuları çıkar"""
        # Basit bir implementasyon, gerçekte NLP kullanılabilir
        topics = []
        
        topic_keywords = {
            "matematik": ["sayı", "toplama", "çıkarma", "çarpma", "bölme", "kesir", "ondalık"],
            "geometri": ["üçgen", "kare", "dikdörtgen", "çember", "alan", "çevre"],
            "fen": ["madde", "enerji", "kuvvet", "hareket", "ısı", "ışık"],
            "türkçe": ["özne", "yüklem", "nesne", "sıfat", "zarf", "fiil", "isim"]
        }
        
        text_lower = text.lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _estimate_difficulty(self, interaction: Dict) -> str:
        """Soru zorluğunu tahmin et"""
        question = interaction.get("question", "").lower()
        grade = interaction.get("grade_level", 5)
        
        # Basit zorluk tahmini
        if any(word in question for word in ["kolay", "basit", "temel"]):
            return "easy"
        elif any(word in question for word in ["zor", "karmaşık", "ileri"]):
            return "hard"
        elif grade <= 4:
            return "easy"
        elif grade >= 9:
            return "hard"
        else:
            return "medium"
    
    def _generate_system_prompt(self, grade: int, subject: str) -> str:
        """Sistem promptu oluştur"""
        return f"Sen {grade}. sınıf {subject} öğretmenisin. MEB müfredatına uygun, öğrenci dostu bir dille ders anlatıyorsun."
    
    async def _get_user_learning_history(self, user_id: str) -> Dict:
        """Kullanıcının öğrenme geçmişini getir"""
        if not self.learning_collection:
            return {}
        
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$subject",
                "total_questions": {"$sum": 1},
                "successful": {"$sum": {"$cond": ["$success_indicator", 1, 0]}},
                "avg_confidence": {"$avg": "$confidence_score"}
            }},
            {"$project": {
                "subject": "$_id",
                "success_rate": {"$divide": ["$successful", "$total_questions"]},
                "confidence": "$avg_confidence",
                "total_interactions": "$total_questions"
            }}
        ]
        
        results = await self.learning_collection.aggregate(pipeline).to_list(None)
        
        return {r["subject"]: {
            "success_rate": r["success_rate"],
            "confidence": r["confidence"],
            "interactions": r["total_interactions"]
        } for r in results}
    
    def _calculate_learning_speed(self, history: Dict) -> float:
        """Öğrenme hızını hesapla"""
        if not history:
            return 0.5
        
        # Basit bir metrik: başarı oranı * güven skoru
        speeds = []
        for subject_data in history.values():
            speed = subject_data["success_rate"] * subject_data.get("confidence", 1)
            speeds.append(speed)
        
        return np.mean(speeds) if speeds else 0.5
    
    async def _compare_models(self) -> Dict:
        """Farklı modelleri karşılaştır"""
        if not self.learning_collection:
            return {}
        
        # Son 24 saatin model performansları
        start_time = datetime.utcnow() - timedelta(days=1)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_time}}},
            {"$group": {
                "_id": "$model_used",
                "count": {"$sum": 1},
                "avg_satisfaction": {"$avg": {"$cond": [
                    {"$eq": ["$user_feedback", "positive"]}, 1, 0
                ]}},
                "avg_response_time": {"$avg": "$response_time"},
                "avg_confidence": {"$avg": "$confidence_score"}
            }}
        ]
        
        results = await self.learning_collection.aggregate(pipeline).to_list(None)
        
        model_scores = {}
        for result in results:
            model = result["_id"]
            if model:
                # Birleşik skor hesapla
                score = (
                    result["avg_satisfaction"] * 0.4 +
                    (1 - min(result["avg_response_time"] / 2, 1)) * 0.3 +
                    result["avg_confidence"] * 0.3
                )
                
                model_scores[model] = {
                    "score": score,
                    "metrics": {
                        "satisfaction": result["avg_satisfaction"],
                        "response_time": result["avg_response_time"],
                        "confidence": result["avg_confidence"],
                        "usage_count": result["count"]
                    },
                    "reason": self._get_model_recommendation_reason(result)
                }
        
        return model_scores
    
    def _get_model_recommendation_reason(self, metrics: Dict) -> str:
        """Model önerisi nedeni"""
        reasons = []
        
        if metrics["avg_satisfaction"] > 0.8:
            reasons.append("Yüksek kullanıcı memnuniyeti")
        if metrics["avg_response_time"] < 1.5:
            reasons.append("Hızlı yanıt süresi")
        if metrics["avg_confidence"] > 0.85:
            reasons.append("Yüksek güven skoru")
        
        return ", ".join(reasons) if reasons else "Standart performans"
    
    async def _check_learning_trigger(self) -> None:
        """Otomatik öğrenme tetikleyicisini kontrol et"""
        try:
            if not self.learning_collection:
                return
            
            # Son öğrenme döngüsünden bu yana geçen süre
            last_cycle = await self.db.improvement_cycles.find_one(
                sort=[("timestamp", -1)]
            )
            
            should_trigger = False
            
            if not last_cycle:
                should_trigger = True
            else:
                last_cycle_date = datetime.fromisoformat(last_cycle["timestamp"])
                days_passed = (datetime.utcnow() - last_cycle_date).days
                
                if days_passed >= self.learning_interval_days:
                    should_trigger = True
            
            # Yeterli veri var mı kontrol et
            if should_trigger:
                recent_count = await self.learning_collection.count_documents({
                    "training_data_generated": {"$ne": True}
                })
                
                if recent_count >= self.min_feedback_for_learning:
                    # Asenkron olarak öğrenme döngüsünü başlat
                    asyncio.create_task(self.continuous_improvement_cycle())
                    logger.info("Otomatik öğrenme döngüsü tetiklendi")
        
        except Exception as e:
            logger.error(f"Öğrenme tetikleyici kontrolü hatası: {e}")


# Singleton instance
auto_learning_service = AutoLearningService()
