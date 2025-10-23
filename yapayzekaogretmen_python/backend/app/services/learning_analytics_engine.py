"""
Learning Analytics Engine - Öğrenme Analitiği Motoru
==================================================
Öğrenci verilerini derinlemesine analiz eden ve öngörülerde bulunan sistem
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import json
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import asyncio
from collections import defaultdict

from loguru import logger
from app.core.config import settings
from app.db.mongodb import get_database


@dataclass
class LearningPattern:
    """Öğrenme deseni"""
    pattern_type: str
    frequency: float
    effectiveness: float
    time_of_day_preference: List[int]  # 0-23 saat
    duration_preference: int  # dakika
    break_pattern: Dict[str, float]
    focus_duration: float
    distraction_triggers: List[str]


@dataclass
class PredictiveInsight:
    """Tahmine dayalı içgörü"""
    insight_type: str
    prediction: Any
    confidence: float
    timeframe: str
    factors: List[Dict]
    recommendations: List[str]
    risk_level: str  # low, medium, high


class LearningAnalyticsEngine:
    """Öğrenme analitiği motoru"""
    
    def __init__(self):
        self.db = get_database()
        self.analytics_collection = self.db.learning_analytics if self.db else None
        self.predictions_collection = self.db.predictions if self.db else None
        
        # ML modelleri (basit başlangıç)
        self.clustering_model = None
        self.dropout_predictor = None
        self.performance_predictor = None
        self.engagement_predictor = None
        
        # Analitik metrikleri
        self.key_metrics = [
            "engagement_rate",
            "completion_rate", 
            "accuracy_rate",
            "time_on_task",
            "help_seeking_frequency",
            "error_patterns",
            "learning_velocity",
            "retention_rate"
        ]
        
        logger.info("Learning Analytics Engine başlatıldı")
    
    async def analyze_learning_patterns(self, student_id: str) -> Dict:
        """Öğrenme desenlerini analiz et"""
        try:
            # Son 30 günlük veriyi al
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            interactions = await self._get_student_interactions(
                student_id, start_date, end_date
            )
            
            if not interactions:
                return {"error": "Yeterli veri yok"}
            
            # Zaman bazlı analiz
            time_patterns = self._analyze_time_patterns(interactions)
            
            # Performans desenleri
            performance_patterns = self._analyze_performance_patterns(interactions)
            
            # Öğrenme stili desenleri
            style_patterns = self._analyze_learning_style_patterns(interactions)
            
            # Dikkat ve odaklanma desenleri
            focus_patterns = self._analyze_focus_patterns(interactions)
            
            # Sosyal öğrenme desenleri
            social_patterns = self._analyze_social_patterns(interactions)
            
            # Başarı faktörleri
            success_factors = self._identify_success_factors(interactions)
            
            # Engeller ve zorluklar
            barriers = self._identify_learning_barriers(interactions)
            
            return {
                "student_id": student_id,
                "analysis_period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "patterns": {
                    "time": time_patterns,
                    "performance": performance_patterns,
                    "style": style_patterns,
                    "focus": focus_patterns,
                    "social": social_patterns
                },
                "success_factors": success_factors,
                "barriers": barriers,
                "insights": self._generate_pattern_insights(
                    time_patterns, performance_patterns, style_patterns
                )
            }
            
        except Exception as e:
            logger.error(f"Öğrenme deseni analizi hatası: {e}")
            return {"error": str(e)}
    
    async def predict_student_outcomes(self, student_id: str) -> List[PredictiveInsight]:
        """Öğrenci sonuçlarını tahmin et"""
        try:
            predictions = []
            
            # Başarı tahmini
            success_prediction = await self._predict_success_probability(student_id)
            predictions.append(success_prediction)
            
            # Bırakma riski tahmini
            dropout_risk = await self._predict_dropout_risk(student_id)
            predictions.append(dropout_risk)
            
            # Öğrenme hızı tahmini
            learning_velocity = await self._predict_learning_velocity(student_id)
            predictions.append(learning_velocity)
            
            # Motivasyon düşüşü tahmini
            motivation_drop = await self._predict_motivation_drop(student_id)
            predictions.append(motivation_drop)
            
            # Zorluk yaşanacak konular
            difficulty_areas = await self._predict_difficulty_areas(student_id)
            predictions.append(difficulty_areas)
            
            # Optimal öğrenme zamanı
            optimal_time = await self._predict_optimal_learning_time(student_id)
            predictions.append(optimal_time)
            
            # Kaydetme
            if self.predictions_collection:
                await self.predictions_collection.insert_one({
                    "student_id": student_id,
                    "timestamp": datetime.utcnow(),
                    "predictions": [p.__dict__ for p in predictions]
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Tahmin hatası: {e}")
            return []
    
    async def generate_personalized_recommendations(
        self, 
        student_id: str
    ) -> Dict:
        """Kişiselleştirilmiş öneriler üret"""
        try:
            # Analizleri al
            patterns = await self.analyze_learning_patterns(student_id)
            predictions = await self.predict_student_outcomes(student_id)
            
            recommendations = {
                "immediate_actions": [],  # Hemen yapılması gerekenler
                "weekly_goals": [],  # Haftalık hedefler
                "learning_strategies": [],  # Öğrenme stratejileri
                "content_recommendations": [],  # İçerik önerileri
                "study_schedule": {},  # Çalışma programı
                "motivation_boosters": [],  # Motivasyon artırıcılar
                "peer_learning": [],  # Akran öğrenme önerileri
                "parent_involvement": []  # Veli katılımı önerileri
            }
            
            # Acil eylemler
            for prediction in predictions:
                if prediction.risk_level == "high":
                    recommendations["immediate_actions"].extend(
                        prediction.recommendations[:2]
                    )
            
            # Zaman desenlerine göre çalışma programı
            time_patterns = patterns.get("patterns", {}).get("time", {})
            recommendations["study_schedule"] = self._create_optimal_schedule(
                time_patterns
            )
            
            # Performans desenlerine göre stratejiler
            performance = patterns.get("patterns", {}).get("performance", {})
            recommendations["learning_strategies"] = self._recommend_strategies(
                performance
            )
            
            # Motivasyon önerileri
            if any(p.insight_type == "motivation_drop" for p in predictions):
                recommendations["motivation_boosters"] = [
                    "Günlük küçük hedefler belirle",
                    "Başarılarını kutla",
                    "Arkadaşlarınla yarışmalar düzenle",
                    "Favori konularınla başla",
                    "Ödül sistemi oluştur"
                ]
            
            # İçerik önerileri
            recommendations["content_recommendations"] = await self._recommend_content(
                student_id, patterns
            )
            
            # Akran öğrenme
            social_patterns = patterns.get("patterns", {}).get("social", {})
            if social_patterns.get("prefers_collaboration", False):
                recommendations["peer_learning"] = [
                    "Çalışma grubu oluştur",
                    "Arkadaşlarınla bilgi yarışması yap",
                    "Öğrendiklerini başkalarına öğret",
                    "Online çalışma oturumlarına katıl"
                ]
            
            # Veli katılımı
            age = await self._get_student_age(student_id)
            if age and age < 14:
                recommendations["parent_involvement"] = [
                    "Günlük 10 dakika öğrenme sohbeti",
                    "Haftalık ilerleme paylaşımı",
                    "Birlikte eğitici oyunlar",
                    "Başarı kutlamaları"
                ]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Öneri üretme hatası: {e}")
            return {}
    
    async def detect_learning_anomalies(self, student_id: str) -> List[Dict]:
        """Öğrenme anomalilerini tespit et"""
        try:
            anomalies = []
            
            # Son aktiviteleri al
            recent_data = await self._get_recent_metrics(student_id, days=7)
            historical_data = await self._get_historical_metrics(student_id)
            
            if not recent_data or not historical_data:
                return []
            
            # Ani performans düşüşü
            perf_drop = self._detect_performance_drop(recent_data, historical_data)
            if perf_drop:
                anomalies.append(perf_drop)
            
            # Alışılmadık çalışma deseni
            pattern_anomaly = self._detect_pattern_anomaly(recent_data, historical_data)
            if pattern_anomaly:
                anomalies.append(pattern_anomaly)
            
            # Aşırı hata tekrarı
            error_anomaly = self._detect_error_anomaly(recent_data)
            if error_anomaly:
                anomalies.append(error_anomaly)
            
            # Motivasyon kaybı belirtileri
            motivation_anomaly = self._detect_motivation_loss(recent_data)
            if motivation_anomaly:
                anomalies.append(motivation_anomaly)
            
            # Sosyal izolasyon
            social_anomaly = self._detect_social_isolation(recent_data)
            if social_anomaly:
                anomalies.append(social_anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Anomali tespiti hatası: {e}")
            return []
    
    async def benchmark_student_performance(
        self, 
        student_id: str,
        peer_group: Optional[str] = None
    ) -> Dict:
        """Öğrenci performansını karşılaştır"""
        try:
            # Öğrenci metriklerini al
            student_metrics = await self._calculate_student_metrics(student_id)
            
            # Akran grubu belirle
            if not peer_group:
                peer_group = await self._determine_peer_group(student_id)
            
            # Akran metrikleri
            peer_metrics = await self._get_peer_group_metrics(peer_group)
            
            # Karşılaştırma
            comparison = {
                "student_id": student_id,
                "peer_group": peer_group,
                "metrics": {}
            }
            
            for metric in self.key_metrics:
                student_value = student_metrics.get(metric, 0)
                peer_avg = peer_metrics.get(metric, {}).get("average", 0)
                peer_std = peer_metrics.get(metric, {}).get("std_dev", 1)
                
                # Z-skoru hesapla
                z_score = (student_value - peer_avg) / peer_std if peer_std > 0 else 0
                
                # Yüzdelik dilim
                percentile = self._calculate_percentile(
                    student_value, 
                    peer_metrics.get(metric, {}).get("distribution", [])
                )
                
                comparison["metrics"][metric] = {
                    "student_value": student_value,
                    "peer_average": peer_avg,
                    "z_score": z_score,
                    "percentile": percentile,
                    "interpretation": self._interpret_comparison(z_score, percentile)
                }
            
            # Güçlü ve zayıf yönler
            comparison["strengths"] = [
                metric for metric, data in comparison["metrics"].items()
                if data["percentile"] > 75
            ]
            
            comparison["weaknesses"] = [
                metric for metric, data in comparison["metrics"].items()
                if data["percentile"] < 25
            ]
            
            # Genel değerlendirme
            comparison["overall_performance"] = self._calculate_overall_performance(
                comparison["metrics"]
            )
            
            return comparison
            
        except Exception as e:
            logger.error(f"Karşılaştırma hatası: {e}")
            return {}
    
    # Tahmin metodları
    async def _predict_success_probability(self, student_id: str) -> PredictiveInsight:
        """Başarı olasılığını tahmin et"""
        # Basitleştirilmiş tahmin mantığı
        student_data = await self._get_student_features(student_id)
        
        # Faktörler
        factors = []
        success_prob = 0.5  # Başlangıç
        
        # Tutarlılık faktörü
        if student_data.get("consistency_score", 0) > 0.7:
            success_prob += 0.2
            factors.append({
                "factor": "Yüksek tutarlılık",
                "impact": "+20%"
            })
        
        # Performans trendi
        if student_data.get("performance_trend", 0) > 0:
            success_prob += 0.15
            factors.append({
                "factor": "Yükselen performans",
                "impact": "+15%"
            })
        
        # Motivasyon seviyesi
        if student_data.get("motivation_level", 0.5) > 0.7:
            success_prob += 0.1
            factors.append({
                "factor": "Yüksek motivasyon",
                "impact": "+10%"
            })
        
        success_prob = min(success_prob, 0.95)  # Max %95
        
        return PredictiveInsight(
            insight_type="success_probability",
            prediction=success_prob,
            confidence=0.75,
            timeframe="3_months",
            factors=factors,
            recommendations=[
                "Mevcut çalışma düzenini koru",
                "Zor konulara daha fazla zaman ayır",
                "Düzenli tekrar yap"
            ],
            risk_level="low" if success_prob > 0.7 else "medium"
        )
    
    async def _predict_dropout_risk(self, student_id: str) -> PredictiveInsight:
        """Bırakma riskini tahmin et"""
        student_data = await self._get_student_features(student_id)
        
        risk_score = 0.0
        factors = []
        
        # Devamsızlık
        absence_rate = student_data.get("absence_rate", 0)
        if absence_rate > 0.2:
            risk_score += 0.3
            factors.append({
                "factor": f"Yüksek devamsızlık (%{int(absence_rate*100)})",
                "impact": "+30%"
            })
        
        # Düşen performans
        if student_data.get("performance_trend", 0) < -0.2:
            risk_score += 0.25
            factors.append({
                "factor": "Düşen performans",
                "impact": "+25%"
            })
        
        # Düşük katılım
        if student_data.get("engagement_rate", 1) < 0.3:
            risk_score += 0.2
            factors.append({
                "factor": "Düşük katılım",
                "impact": "+20%"
            })
        
        risk_level = "low"
        if risk_score > 0.5:
            risk_level = "high"
        elif risk_score > 0.3:
            risk_level = "medium"
        
        recommendations = []
        if risk_level != "low":
            recommendations = [
                "Öğrenciyle birebir görüşme yap",
                "Veli ile iletişime geç",
                "Motivasyon desteği sağla",
                "Öğrenme hedeflerini yeniden belirle",
                "Akran desteği sağla"
            ]
        
        return PredictiveInsight(
            insight_type="dropout_risk",
            prediction=risk_score,
            confidence=0.8,
            timeframe="1_month",
            factors=factors,
            recommendations=recommendations,
            risk_level=risk_level
        )
    
    # Yardımcı metodlar
    def _analyze_time_patterns(self, interactions: List[Dict]) -> Dict:
        """Zaman desenlerini analiz et"""
        time_data = defaultdict(list)
        
        for interaction in interactions:
            timestamp = interaction.get("timestamp")
            if timestamp:
                dt = datetime.fromisoformat(timestamp)
                hour = dt.hour
                day = dt.weekday()
                duration = interaction.get("duration", 0)
                
                time_data["hours"].append(hour)
                time_data["days"].append(day)
                time_data["durations"].append(duration)
        
        # En verimli saatler
        hour_performance = defaultdict(list)
        for i, interaction in enumerate(interactions):
            if "timestamp" in interaction and "performance_score" in interaction:
                hour = datetime.fromisoformat(interaction["timestamp"]).hour
                hour_performance[hour].append(interaction["performance_score"])
        
        best_hours = sorted(
            hour_performance.items(),
            key=lambda x: np.mean(x[1]) if x[1] else 0,
            reverse=True
        )[:3]
        
        return {
            "preferred_hours": [h[0] for h in best_hours],
            "average_session_duration": np.mean(time_data["durations"]) if time_data["durations"] else 0,
            "most_active_days": self._get_most_frequent(time_data["days"], 3),
            "consistency_score": self._calculate_consistency(time_data["days"])
        }
    
    def _calculate_consistency(self, days: List[int]) -> float:
        """Tutarlılık skoru hesapla"""
        if not days:
            return 0.0
        
        # Son 4 haftayı kontrol et
        weeks = defaultdict(set)
        for i, day in enumerate(days):
            week_num = i // 7
            weeks[week_num].add(day)
        
        # Her hafta kaç gün çalışmış
        days_per_week = [len(days) for days in weeks.values()]
        
        if not days_per_week:
            return 0.0
        
        # Tutarlılık = düşük varyans
        variance = np.var(days_per_week)
        consistency = 1 / (1 + variance)
        
        return consistency
    
    def _get_most_frequent(self, items: List, n: int) -> List:
        """En sık görülen n öğeyi döndür"""
        from collections import Counter
        counter = Counter(items)
        return [item for item, _ in counter.most_common(n)]
    
    def _detect_performance_drop(
        self, 
        recent_data: Dict,
        historical_data: Dict
    ) -> Optional[Dict]:
        """Performans düşüşü tespit et"""
        recent_avg = recent_data.get("average_performance", 0)
        historical_avg = historical_data.get("average_performance", 1)
        
        if historical_avg > 0:
            drop_percentage = (historical_avg - recent_avg) / historical_avg
            
            if drop_percentage > 0.2:  # %20'den fazla düşüş
                return {
                    "type": "performance_drop",
                    "severity": "high" if drop_percentage > 0.3 else "medium",
                    "details": {
                        "historical_avg": historical_avg,
                        "recent_avg": recent_avg,
                        "drop_percentage": drop_percentage
                    },
                    "recommendations": [
                        "Öğrenciyle görüşme yap",
                        "Zorluk seviyesini kontrol et",
                        "Motivasyon desteği sağla"
                    ]
                }
        
        return None


# Singleton instance
learning_analytics_engine = LearningAnalyticsEngine()
