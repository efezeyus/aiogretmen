"""
A/B Test Service - Model Karşılaştırma Sistemi
--------------------------------------------
Farklı AI modellerini karşılaştırmak için A/B test sistemi.
"""

import random
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database


class ABTestService:
    """A/B test yönetim servisi"""
    
    def __init__(self):
        self.db = get_database()
        self.experiments_collection = self.db.ab_experiments if self.db else None
        self.assignments_collection = self.db.ab_assignments if self.db else None
        self.results_collection = self.db.ab_results if self.db else None
        
        # Aktif deneyler cache
        self._active_experiments_cache = {}
        self._cache_ttl = 300  # 5 dakika
        self._last_cache_update = None
        
        logger.info("A/B Test Service başlatıldı")
    
    async def create_experiment(self, experiment_config: Dict) -> Dict:
        """
        Yeni A/B test deneyi oluştur
        
        Args:
            experiment_config: Deney konfigürasyonu
                - name: Deney adı
                - description: Açıklama
                - variants: Model varyantları listesi
                - traffic_split: Trafik dağılımı (varsayılan eşit)
                - target_metrics: Hedef metrikler
                - duration_days: Deney süresi
        """
        try:
            # Varsayılan değerler
            variants = experiment_config.get("variants", [])
            traffic_split = experiment_config.get("traffic_split", {})
            
            # Eşit trafik dağılımı
            if not traffic_split and variants:
                equal_split = 1.0 / len(variants)
                traffic_split = {v["id"]: equal_split for v in variants}
            
            # Deney verisi
            experiment = {
                "experiment_id": self._generate_experiment_id(experiment_config["name"]),
                "name": experiment_config["name"],
                "description": experiment_config.get("description", ""),
                "variants": variants,
                "traffic_split": traffic_split,
                "target_metrics": experiment_config.get("target_metrics", [
                    "satisfaction_rate",
                    "response_time",
                    "accuracy",
                    "engagement"
                ]),
                "status": "active",
                "created_at": datetime.utcnow(),
                "start_date": datetime.utcnow(),
                "end_date": datetime.utcnow() + timedelta(
                    days=experiment_config.get("duration_days", 14)
                ),
                "total_participants": 0,
                "results": {}
            }
            
            # Veritabanına kaydet
            if self.experiments_collection:
                await self.experiments_collection.insert_one(experiment)
                logger.info(f"A/B test deneyi oluşturuldu: {experiment['experiment_id']}")
            
            # Cache'i güncelle
            self._invalidate_cache()
            
            return {
                "success": True,
                "experiment_id": experiment["experiment_id"],
                "message": "Deney başarıyla oluşturuldu"
            }
            
        except Exception as e:
            logger.error(f"Deney oluşturma hatası: {e}")
            return {"success": False, "error": str(e)}
    
    async def assign_variant(self, user_id: str, experiment_id: str) -> str:
        """
        Kullanıcıya varyant ata
        
        Args:
            user_id: Kullanıcı ID
            experiment_id: Deney ID
            
        Returns:
            Atanan varyant ID
        """
        try:
            # Önceki atamayı kontrol et
            existing = await self._get_user_assignment(user_id, experiment_id)
            if existing:
                return existing["variant_id"]
            
            # Aktif deneyi al
            experiment = await self._get_active_experiment(experiment_id)
            if not experiment:
                logger.warning(f"Deney bulunamadı veya aktif değil: {experiment_id}")
                return "control"  # Varsayılan
            
            # Varyant seç
            variant_id = self._select_variant(
                user_id, 
                experiment["traffic_split"]
            )
            
            # Atamayı kaydet
            assignment = {
                "user_id": user_id,
                "experiment_id": experiment_id,
                "variant_id": variant_id,
                "assigned_at": datetime.utcnow()
            }
            
            if self.assignments_collection:
                await self.assignments_collection.insert_one(assignment)
            
            # Katılımcı sayısını güncelle
            if self.experiments_collection:
                await self.experiments_collection.update_one(
                    {"experiment_id": experiment_id},
                    {"$inc": {"total_participants": 1}}
                )
            
            logger.debug(f"Varyant atandı: {user_id} -> {variant_id}")
            return variant_id
            
        except Exception as e:
            logger.error(f"Varyant atama hatası: {e}")
            return "control"
    
    async def track_event(self, event_data: Dict) -> None:
        """
        A/B test olayını kaydet
        
        Args:
            event_data: Olay verisi
                - user_id: Kullanıcı ID
                - experiment_id: Deney ID
                - variant_id: Varyant ID
                - event_type: Olay tipi (interaction, feedback, etc.)
                - metrics: Metrik değerleri
        """
        try:
            # Olay kaydı
            event = {
                "timestamp": datetime.utcnow(),
                "user_id": event_data["user_id"],
                "experiment_id": event_data["experiment_id"],
                "variant_id": event_data["variant_id"],
                "event_type": event_data["event_type"],
                "metrics": event_data.get("metrics", {}),
                "metadata": event_data.get("metadata", {})
            }
            
            if self.results_collection:
                await self.results_collection.insert_one(event)
                
            # Gerçek zamanlı metrik güncelleme
            await self._update_experiment_metrics(
                event_data["experiment_id"],
                event_data["variant_id"],
                event_data.get("metrics", {})
            )
            
        except Exception as e:
            logger.error(f"Olay kaydetme hatası: {e}")
    
    async def get_experiment_results(self, experiment_id: str) -> Dict:
        """
        Deney sonuçlarını getir
        
        Args:
            experiment_id: Deney ID
            
        Returns:
            Detaylı deney sonuçları
        """
        try:
            # Deneyi al
            experiment = await self._get_experiment(experiment_id)
            if not experiment:
                return {"error": "Deney bulunamadı"}
            
            # Her varyant için metrikleri hesapla
            results = {}
            
            for variant in experiment["variants"]:
                variant_id = variant["id"]
                
                # Metrik agregasyonu
                pipeline = [
                    {"$match": {
                        "experiment_id": experiment_id,
                        "variant_id": variant_id
                    }},
                    {"$group": {
                        "_id": None,
                        "total_events": {"$sum": 1},
                        "avg_response_time": {"$avg": "$metrics.response_time"},
                        "satisfaction_count": {
                            "$sum": {"$cond": [
                                {"$eq": ["$metrics.satisfaction", "positive"]}, 1, 0
                            ]}
                        },
                        "engagement_score": {"$avg": "$metrics.engagement_score"},
                        "accuracy_score": {"$avg": "$metrics.accuracy"}
                    }}
                ]
                
                if self.results_collection:
                    agg_results = await self.results_collection.aggregate(pipeline).to_list(1)
                    
                    if agg_results:
                        result = agg_results[0]
                        results[variant_id] = {
                            "variant_name": variant["name"],
                            "model": variant.get("model", "unknown"),
                            "total_interactions": result["total_events"],
                            "metrics": {
                                "satisfaction_rate": (
                                    result["satisfaction_count"] / result["total_events"]
                                    if result["total_events"] > 0 else 0
                                ),
                                "avg_response_time": result["avg_response_time"] or 0,
                                "engagement_score": result["engagement_score"] or 0,
                                "accuracy_score": result["accuracy_score"] or 0
                            }
                        }
                    else:
                        results[variant_id] = {
                            "variant_name": variant["name"],
                            "model": variant.get("model", "unknown"),
                            "total_interactions": 0,
                            "metrics": {
                                "satisfaction_rate": 0,
                                "avg_response_time": 0,
                                "engagement_score": 0,
                                "accuracy_score": 0
                            }
                        }
            
            # İstatistiksel analiz
            statistical_analysis = self._perform_statistical_analysis(results)
            
            # Kazanan belirleme
            winner = self._determine_winner(results, statistical_analysis)
            
            return {
                "experiment_id": experiment_id,
                "name": experiment["name"],
                "status": experiment["status"],
                "duration": {
                    "start": experiment["start_date"].isoformat(),
                    "end": experiment["end_date"].isoformat(),
                    "days_running": (datetime.utcnow() - experiment["start_date"]).days
                },
                "total_participants": experiment["total_participants"],
                "results": results,
                "statistical_analysis": statistical_analysis,
                "winner": winner,
                "recommendations": self._generate_recommendations(results, winner)
            }
            
        except Exception as e:
            logger.error(f"Sonuç getirme hatası: {e}")
            return {"error": str(e)}
    
    async def end_experiment(self, experiment_id: str) -> Dict:
        """
        Deneyi sonlandır
        
        Args:
            experiment_id: Deney ID
            
        Returns:
            Sonlandırma durumu
        """
        try:
            # Deneyi güncelle
            if self.experiments_collection:
                result = await self.experiments_collection.update_one(
                    {"experiment_id": experiment_id},
                    {
                        "$set": {
                            "status": "completed",
                            "end_date": datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    # Final sonuçları al
                    final_results = await self.get_experiment_results(experiment_id)
                    
                    # Cache'i güncelle
                    self._invalidate_cache()
                    
                    return {
                        "success": True,
                        "message": "Deney sonlandırıldı",
                        "final_results": final_results
                    }
                else:
                    return {
                        "success": False,
                        "message": "Deney bulunamadı veya zaten sonlanmış"
                    }
            
            return {"success": False, "message": "Veritabanı bağlantısı yok"}
            
        except Exception as e:
            logger.error(f"Deney sonlandırma hatası: {e}")
            return {"success": False, "error": str(e)}
    
    # Yardımcı metodlar
    def _generate_experiment_id(self, name: str) -> str:
        """Benzersiz deney ID oluştur"""
        timestamp = datetime.utcnow().isoformat()
        return hashlib.md5(f"{name}_{timestamp}".encode()).hexdigest()[:12]
    
    def _select_variant(self, user_id: str, traffic_split: Dict[str, float]) -> str:
        """Deterministik varyant seçimi"""
        # Kullanıcı ID'sinden hash oluştur
        user_hash = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        bucket = (user_hash % 100) / 100.0
        
        # Trafik dağılımına göre varyant seç
        cumulative = 0.0
        for variant_id, split in traffic_split.items():
            cumulative += split
            if bucket < cumulative:
                return variant_id
        
        # Varsayılan olarak ilk varyantı döndür
        return list(traffic_split.keys())[0] if traffic_split else "control"
    
    async def _get_user_assignment(self, user_id: str, experiment_id: str) -> Optional[Dict]:
        """Kullanıcının mevcut atamasını getir"""
        if self.assignments_collection:
            return await self.assignments_collection.find_one({
                "user_id": user_id,
                "experiment_id": experiment_id
            })
        return None
    
    async def _get_active_experiment(self, experiment_id: str) -> Optional[Dict]:
        """Aktif deneyi getir (cache'li)"""
        # Cache kontrolü
        if self._active_experiments_cache and self._last_cache_update:
            cache_age = (datetime.utcnow() - self._last_cache_update).seconds
            if cache_age < self._cache_ttl:
                return self._active_experiments_cache.get(experiment_id)
        
        # Veritabanından al
        experiment = await self._get_experiment(experiment_id)
        if experiment and experiment["status"] == "active":
            # Cache'e ekle
            self._active_experiments_cache[experiment_id] = experiment
            self._last_cache_update = datetime.utcnow()
            return experiment
        
        return None
    
    async def _get_experiment(self, experiment_id: str) -> Optional[Dict]:
        """Deneyi getir"""
        if self.experiments_collection:
            return await self.experiments_collection.find_one({
                "experiment_id": experiment_id
            })
        return None
    
    async def _update_experiment_metrics(self, experiment_id: str, variant_id: str, metrics: Dict) -> None:
        """Deney metriklerini güncelle"""
        try:
            if self.experiments_collection:
                # Gerçek zamanlı metrik güncelleme
                update_fields = {}
                for metric_name, metric_value in metrics.items():
                    if isinstance(metric_value, (int, float)):
                        update_fields[f"results.{variant_id}.{metric_name}"] = metric_value
                
                if update_fields:
                    await self.experiments_collection.update_one(
                        {"experiment_id": experiment_id},
                        {"$inc": update_fields}
                    )
        except Exception as e:
            logger.error(f"Metrik güncelleme hatası: {e}")
    
    def _perform_statistical_analysis(self, results: Dict) -> Dict:
        """İstatistiksel analiz yap"""
        try:
            # Basit bir analiz örneği
            analysis = {
                "confidence_level": 0.95,
                "sample_size_adequate": True,
                "variants": {}
            }
            
            # Her varyant için analiz
            satisfaction_rates = []
            for variant_id, data in results.items():
                interactions = data["total_interactions"]
                satisfaction = data["metrics"]["satisfaction_rate"]
                
                analysis["variants"][variant_id] = {
                    "sample_size": interactions,
                    "satisfaction_rate": satisfaction,
                    "is_significant": interactions > 100  # Basit kural
                }
                
                if interactions > 0:
                    satisfaction_rates.append(satisfaction)
            
            # Varyantlar arası fark
            if len(satisfaction_rates) >= 2:
                analysis["max_difference"] = max(satisfaction_rates) - min(satisfaction_rates)
                analysis["is_conclusive"] = analysis["max_difference"] > 0.05  # %5 fark
            else:
                analysis["is_conclusive"] = False
            
            return analysis
            
        except Exception as e:
            logger.error(f"İstatistiksel analiz hatası: {e}")
            return {"error": str(e)}
    
    def _determine_winner(self, results: Dict, statistical_analysis: Dict) -> Optional[Dict]:
        """Kazanan varyantı belirle"""
        try:
            if not statistical_analysis.get("is_conclusive", False):
                return None
            
            # En yüksek satisfaction rate'e sahip varyantı bul
            best_variant = None
            best_satisfaction = -1
            
            for variant_id, data in results.items():
                satisfaction = data["metrics"]["satisfaction_rate"]
                if satisfaction > best_satisfaction:
                    best_satisfaction = satisfaction
                    best_variant = {
                        "variant_id": variant_id,
                        "variant_name": data["variant_name"],
                        "model": data["model"],
                        "satisfaction_rate": satisfaction,
                        "improvement": 0  # Hesaplanacak
                    }
            
            # Control'e göre iyileştirme hesapla
            if best_variant and "control" in results:
                control_satisfaction = results["control"]["metrics"]["satisfaction_rate"]
                if control_satisfaction > 0:
                    improvement = ((best_satisfaction - control_satisfaction) / control_satisfaction) * 100
                    best_variant["improvement"] = improvement
            
            return best_variant
            
        except Exception as e:
            logger.error(f"Kazanan belirleme hatası: {e}")
            return None
    
    def _generate_recommendations(self, results: Dict, winner: Optional[Dict]) -> List[str]:
        """Deney sonuçlarına göre öneriler oluştur"""
        recommendations = []
        
        if winner:
            recommendations.append(
                f"{winner['variant_name']} varyantı en iyi performansı gösterdi "
                f"(%{winner['satisfaction_rate']*100:.1f} memnuniyet)"
            )
            
            if winner.get("improvement", 0) > 10:
                recommendations.append(
                    f"Bu model, kontrol grubuna göre %{winner['improvement']:.1f} "
                    "daha iyi performans gösterdi. Production'a alınması önerilir."
                )
        else:
            recommendations.append(
                "Henüz istatistiksel olarak anlamlı bir sonuç yok. "
                "Daha fazla veri toplanması gerekiyor."
            )
        
        # Düşük performanslı varyantlar
        for variant_id, data in results.items():
            if data["metrics"]["satisfaction_rate"] < 0.5:
                recommendations.append(
                    f"{data['variant_name']} varyantı düşük performans gösteriyor. "
                    "Model parametreleri gözden geçirilmeli."
                )
        
        return recommendations
    
    def _invalidate_cache(self):
        """Cache'i geçersiz kıl"""
        self._active_experiments_cache = {}
        self._last_cache_update = None


# Singleton instance
ab_test_service = ABTestService()
