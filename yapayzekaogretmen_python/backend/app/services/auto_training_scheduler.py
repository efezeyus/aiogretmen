"""
Auto Training Scheduler - Otomatik Fine-tuning Planlayıcı
-------------------------------------------------------
Periyodik olarak fine-tuning işlemlerini başlatan servis.
"""

import os
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
import json
from loguru import logger
import subprocess
import sys

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.auto_learning_service import auto_learning_service


class AutoTrainingScheduler:
    """Otomatik fine-tuning planlayıcı servisi"""
    
    def __init__(self):
        self.db = get_database()
        self.training_jobs_collection = self.db.training_jobs if self.db else None
        self.training_schedule_collection = self.db.training_schedules if self.db else None
        
        # Planlama parametreleri
        self.check_interval_hours = 24  # 24 saatte bir kontrol
        self.min_data_for_training = 100  # Minimum eğitim verisi
        self.training_interval_days = 7  # Haftalık eğitim
        self.auto_deploy_threshold = 0.85  # Otomatik deployment eşiği
        
        # Fine-tuning script yolu
        self.fine_tuning_dir = Path(__file__).parent.parent.parent.parent / "ai-fine-tuning"
        self.train_script = self.fine_tuning_dir / "scripts" / "train_model.py"
        
        # Scheduler durumu
        self._is_running = False
        self._scheduler_task = None
        
        logger.info("Auto Training Scheduler başlatıldı")
    
    async def start_scheduler(self):
        """Planlayıcıyı başlat"""
        if self._is_running:
            logger.warning("Scheduler zaten çalışıyor")
            return
        
        self._is_running = True
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        logger.info("Training scheduler başlatıldı")
    
    async def stop_scheduler(self):
        """Planlayıcıyı durdur"""
        self._is_running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("Training scheduler durduruldu")
    
    async def _scheduler_loop(self):
        """Ana planlayıcı döngüsü"""
        while self._is_running:
            try:
                # Eğitim gerekip gerekmediğini kontrol et
                should_train, reason = await self._check_training_needed()
                
                if should_train:
                    logger.info(f"Otomatik eğitim başlatılıyor. Sebep: {reason}")
                    await self.trigger_training(auto_triggered=True)
                else:
                    logger.info(f"Eğitim gerekmiyor. Durum: {reason}")
                
                # Sonraki kontrole kadar bekle
                await asyncio.sleep(self.check_interval_hours * 3600)
                
            except Exception as e:
                logger.error(f"Scheduler döngü hatası: {e}")
                await asyncio.sleep(3600)  # Hata durumunda 1 saat bekle
    
    async def _check_training_needed(self) -> tuple[bool, str]:
        """Eğitim gerekip gerekmediğini kontrol et"""
        try:
            # Son eğitim zamanını kontrol et
            last_training = await self._get_last_training()
            
            if last_training:
                days_since_training = (datetime.utcnow() - last_training["started_at"]).days
                
                # Periyodik eğitim zamanı geldi mi?
                if days_since_training < self.training_interval_days:
                    return False, f"Son eğitimden bu yana {days_since_training} gün geçti"
            else:
                logger.info("Henüz hiç eğitim yapılmamış")
            
            # Yeterli yeni veri var mı?
            new_data_count = await self._count_new_training_data()
            
            if new_data_count < self.min_data_for_training:
                return False, f"Yetersiz veri: {new_data_count}/{self.min_data_for_training}"
            
            # Model performansı düşük mü?
            performance = await auto_learning_service.analyze_performance()
            avg_satisfaction = performance.get("overall", {}).get("avg_positive_feedback", 1.0)
            
            if avg_satisfaction < 0.7:
                return True, f"Düşük performans: %{avg_satisfaction*100:.1f} memnuniyet"
            
            # Periyodik eğitim zamanı
            if not last_training or days_since_training >= self.training_interval_days:
                return True, f"Periyodik eğitim zamanı ({new_data_count} yeni veri)"
            
            return False, "Tüm koşullar normal"
            
        except Exception as e:
            logger.error(f"Eğitim kontrolü hatası: {e}")
            return False, f"Kontrol hatası: {e}"
    
    async def trigger_training(self, auto_triggered: bool = False) -> Dict:
        """Fine-tuning işlemini başlat"""
        try:
            # Eğitim verilerini hazırla
            logger.info("Eğitim verileri hazırlanıyor...")
            training_data = await auto_learning_service.generate_training_data()
            
            if not training_data:
                return {
                    "success": False,
                    "message": "Eğitim verisi oluşturulamadı"
                }
            
            # JSONL dosyası oluştur
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            data_file = self.fine_tuning_dir / "data" / "raw" / f"auto_training_{timestamp}.jsonl"
            data_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(data_file, 'w', encoding='utf-8') as f:
                for item in training_data:
                    f.write(json.dumps(item, ensure_ascii=False) + '\n')
            
            logger.info(f"Eğitim verisi kaydedildi: {data_file}")
            
            # Eğitim job'ı oluştur
            job = {
                "job_id": f"auto_{timestamp}",
                "status": "pending",
                "auto_triggered": auto_triggered,
                "data_file": str(data_file),
                "data_count": len(training_data),
                "created_at": datetime.utcnow(),
                "started_at": None,
                "completed_at": None,
                "model_name": None,
                "metrics": {},
                "error": None
            }
            
            if self.training_jobs_collection:
                await self.training_jobs_collection.insert_one(job)
            
            # Asenkron olarak eğitimi başlat
            asyncio.create_task(self._run_training_process(job["job_id"], data_file))
            
            return {
                "success": True,
                "job_id": job["job_id"],
                "message": f"Eğitim başlatıldı ({len(training_data)} veri)",
                "data_file": str(data_file)
            }
            
        except Exception as e:
            logger.error(f"Eğitim tetikleme hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _run_training_process(self, job_id: str, data_file: Path):
        """Fine-tuning sürecini çalıştır"""
        try:
            # Job durumunu güncelle
            await self._update_job_status(job_id, "running", {"started_at": datetime.utcnow()})
            
            # Python script'ini çalıştır
            logger.info(f"Fine-tuning script başlatılıyor: {self.train_script}")
            
            # Script argümanları
            cmd = [
                sys.executable,  # Python yorumlayıcısı
                str(self.train_script),
                "--data-path", str(data_file),
                "--auto-mode",  # Otomatik mod
                "--no-interaction"  # Kullanıcı etkileşimi yok
            ]
            
            # Subprocess ile çalıştır
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.fine_tuning_dir / "scripts")
            )
            
            # Çıktıyı oku
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Başarılı
                output = stdout.decode('utf-8')
                
                # Model adını çıktıdan al
                model_name = self._extract_model_name(output)
                
                # Metrikleri al
                metrics = self._extract_metrics(output)
                
                # Job'ı güncelle
                await self._update_job_status(job_id, "completed", {
                    "completed_at": datetime.utcnow(),
                    "model_name": model_name,
                    "metrics": metrics,
                    "output": output[-1000:]  # Son 1000 karakter
                })
                
                # Model performansını kontrol et
                if await self._should_auto_deploy(metrics):
                    await self._deploy_model(model_name)
                
                logger.info(f"Eğitim tamamlandı: {model_name}")
                
            else:
                # Hata
                error_msg = stderr.decode('utf-8')
                await self._update_job_status(job_id, "failed", {
                    "completed_at": datetime.utcnow(),
                    "error": error_msg[-1000:]  # Son 1000 karakter
                })
                
                logger.error(f"Eğitim başarısız: {error_msg}")
                
        except Exception as e:
            logger.error(f"Eğitim süreci hatası: {e}")
            await self._update_job_status(job_id, "failed", {
                "completed_at": datetime.utcnow(),
                "error": str(e)
            })
    
    async def get_training_history(self, limit: int = 10) -> List[Dict]:
        """Eğitim geçmişini getir"""
        try:
            if not self.training_jobs_collection:
                return []
            
            jobs = await self.training_jobs_collection.find().sort(
                "created_at", -1
            ).limit(limit).to_list(None)
            
            # Hassas bilgileri temizle
            for job in jobs:
                job.pop("_id", None)
                job.pop("output", None)
            
            return jobs
            
        except Exception as e:
            logger.error(f"Eğitim geçmişi hatası: {e}")
            return []
    
    async def get_schedule_status(self) -> Dict:
        """Planlayıcı durumunu getir"""
        try:
            # Son eğitim
            last_training = await self._get_last_training()
            
            # Bekleyen veri
            pending_data = await self._count_new_training_data()
            
            # Sonraki eğitim tahmini
            next_training = None
            if last_training:
                next_date = last_training["started_at"] + timedelta(days=self.training_interval_days)
                if next_date > datetime.utcnow():
                    next_training = next_date.isoformat()
            
            # Aktif job var mı?
            active_job = None
            if self.training_jobs_collection:
                active = await self.training_jobs_collection.find_one({
                    "status": {"$in": ["pending", "running"]}
                })
                if active:
                    active_job = {
                        "job_id": active["job_id"],
                        "status": active["status"],
                        "started_at": active.get("started_at")
                    }
            
            return {
                "scheduler_running": self._is_running,
                "check_interval_hours": self.check_interval_hours,
                "training_interval_days": self.training_interval_days,
                "min_data_required": self.min_data_for_training,
                "pending_data_count": pending_data,
                "last_training": {
                    "job_id": last_training["job_id"],
                    "completed_at": last_training["completed_at"].isoformat(),
                    "model_name": last_training.get("model_name")
                } if last_training else None,
                "next_training_estimated": next_training,
                "active_job": active_job
            }
            
        except Exception as e:
            logger.error(f"Durum alma hatası: {e}")
            return {"error": str(e)}
    
    # Yardımcı metodlar
    async def _get_last_training(self) -> Optional[Dict]:
        """Son başarılı eğitimi getir"""
        if not self.training_jobs_collection:
            return None
        
        return await self.training_jobs_collection.find_one(
            {"status": "completed"},
            sort=[("completed_at", -1)]
        )
    
    async def _count_new_training_data(self) -> int:
        """Yeni eğitim verisi sayısını getir"""
        if not self.db:
            return 0
        
        # İşlenmemiş yüksek kaliteli etkileşimleri say
        count = await self.db.auto_learning.count_documents({
            "user_feedback": "positive",
            "confidence_score": {"$gte": 0.85},
            "training_data_generated": {"$ne": True}
        })
        
        return count
    
    async def _update_job_status(self, job_id: str, status: str, updates: Dict):
        """Job durumunu güncelle"""
        if self.training_jobs_collection:
            updates["status"] = status
            await self.training_jobs_collection.update_one(
                {"job_id": job_id},
                {"$set": updates}
            )
    
    def _extract_model_name(self, output: str) -> Optional[str]:
        """Script çıktısından model adını çıkar"""
        # Örnek: "Model: ft:gpt-3.5-turbo:org:suffix:id"
        import re
        match = re.search(r'Model:\s*(ft:[^\s]+)', output)
        return match.group(1) if match else None
    
    def _extract_metrics(self, output: str) -> Dict:
        """Script çıktısından metrikleri çıkar"""
        metrics = {}
        
        # Basit metrik çıkarma
        import re
        
        # Accuracy
        match = re.search(r'Accuracy:\s*([0-9.]+)', output)
        if match:
            metrics["accuracy"] = float(match.group(1))
        
        # Loss
        match = re.search(r'Loss:\s*([0-9.]+)', output)
        if match:
            metrics["loss"] = float(match.group(1))
        
        return metrics
    
    async def _should_auto_deploy(self, metrics: Dict) -> bool:
        """Modelin otomatik deploy edilip edilmeyeceğini kontrol et"""
        # Basit kural: accuracy eşiği
        accuracy = metrics.get("accuracy", 0)
        return accuracy >= self.auto_deploy_threshold
    
    async def _deploy_model(self, model_name: str):
        """Modeli production'a deploy et"""
        try:
            from app.services.ai_service import ai_service
            
            # AI servisinde modeli güncelle
            success = ai_service.update_fine_tuned_model(model_name)
            
            if success:
                logger.info(f"Model otomatik deploy edildi: {model_name}")
                
                # Deployment kaydı
                if self.db:
                    await self.db.model_deployments.insert_one({
                        "model_name": model_name,
                        "deployed_at": datetime.utcnow(),
                        "auto_deployed": True,
                        "deployment_type": "production"
                    })
            else:
                logger.error(f"Model deployment başarısız: {model_name}")
                
        except Exception as e:
            logger.error(f"Model deployment hatası: {e}")


# Singleton instance
auto_training_scheduler = AutoTrainingScheduler()
