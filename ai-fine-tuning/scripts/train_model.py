#!/usr/bin/env python3
"""
Fine-tuning Eğitim Yönetim Scripti
End-to-end fine-tuning sürecini yönetir.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

# Diğer scriptleri import et
sys.path.append(str(Path(__file__).parent))
from prepare_data import DataProcessor
from validate_data import DataValidator
from openai_client import FineTuningManager


class TrainingPipeline:
    """Fine-tuning eğitim pipeline'ı"""
    
    def __init__(self, config_path: Optional[Path] = None):
        # Konfigürasyon
        if config_path and config_path.exists():
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = self._get_default_config()
        
        # Dizinler
        self.base_dir = Path(__file__).parent.parent
        self.raw_data_dir = self.base_dir / 'data' / 'raw'
        self.processed_data_dir = self.base_dir / 'data' / 'processed'
        self.models_dir = self.base_dir / 'models'
        self.results_dir = self.base_dir / 'results'
        
        # Dizinleri oluştur
        for dir_path in [self.processed_data_dir, self.models_dir, self.results_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def _get_default_config(self) -> Dict:
        """Varsayılan konfigürasyon"""
        return {
            "model": {
                "base_model": "gpt-3.5-turbo",
                "suffix": "meb-ogretmen",
                "temperature": 0.7,
                "max_tokens": 500
            },
            "training": {
                "n_epochs": 3,
                "batch_size": 1,
                "learning_rate_multiplier": 0.1,
                "validation_split": 0.1
            },
            "data": {
                "augmentation": True,
                "max_tokens_per_conversation": 4096,
                "sample_size": 0  # 0 = tüm veri
            }
        }
    
    def step1_prepare_data(self) -> Dict:
        """Adım 1: Veri hazırlama"""
        print("\n" + "="*60)
        print("ADIM 1: VERİ HAZIRLAMA")
        print("="*60)
        
        processor = DataProcessor(
            str(self.raw_data_dir),
            str(self.processed_data_dir)
        )
        
        stats = processor.process_all_data()
        
        # Sample oluştur
        if self.config['data']['sample_size'] > 0:
            processor.create_sample_dataset(self.config['data']['sample_size'])
        
        return stats
    
    def step2_validate_data(self) -> bool:
        """Adım 2: Veri doğrulama"""
        print("\n" + "="*60)
        print("ADIM 2: VERİ DOĞRULAMA")
        print("="*60)
        
        validator = DataValidator(str(self.processed_data_dir))
        
        # Train verisini doğrula
        train_file = self.processed_data_dir / 'train.jsonl'
        if not train_file.exists():
            print("❌ train.jsonl bulunamadı!")
            return False
        
        stats = validator.analyze_dataset(train_file)
        validator.print_report(stats)
        
        # Format hatası var mı?
        if stats['format_errors']:
            print(f"\n❌ {len(stats['format_errors'])} format hatası bulundu!")
            return False
        
        # Token limiti kontrolü
        over_limit = validator.check_token_limits(
            train_file, 
            self.config['data']['max_tokens_per_conversation']
        )
        
        if over_limit:
            print(f"\n⚠️  {len(over_limit)} konuşma token limitini aşıyor!")
            response = input("Devam etmek istiyor musunuz? (e/h): ")
            if response.lower() != 'e':
                return False
        
        return True
    
    def step3_upload_data(self, manager: FineTuningManager) -> str:
        """Adım 3: Veriyi yükle"""
        print("\n" + "="*60)
        print("ADIM 3: VERİYİ YÜKLE")
        print("="*60)
        
        # Hangi dosyayı yükleyeceğiz?
        if self.config['data']['sample_size'] > 0:
            train_file = self.processed_data_dir / 'sample.jsonl'
        else:
            train_file = self.processed_data_dir / 'train.jsonl'
        
        if not train_file.exists():
            raise FileNotFoundError(f"{train_file} bulunamadı!")
        
        # Maliyet tahmini
        cost_estimate = manager.estimate_cost(train_file)
        print(f"\n💰 Tahmini maliyet: {cost_estimate['estimated_training_cost']}")
        print(f"   Token sayısı: {cost_estimate['estimated_tokens']:,}")
        
        response = input("\nDevam etmek istiyor musunuz? (e/h): ")
        if response.lower() != 'e':
            print("İptal edildi.")
            sys.exit(0)
        
        # Dosyayı yükle
        file_id = manager.upload_training_file(train_file)
        return file_id
    
    def step4_start_training(self, manager: FineTuningManager, file_id: str) -> str:
        """Adım 4: Eğitimi başlat"""
        print("\n" + "="*60)
        print("ADIM 4: EĞİTİMİ BAŞLAT")
        print("="*60)
        
        hyperparameters = {
            "n_epochs": self.config['training']['n_epochs'],
            "batch_size": self.config['training']['batch_size'],
            "learning_rate_multiplier": self.config['training']['learning_rate_multiplier']
        }
        
        job_id = manager.create_fine_tuning_job(
            file_id,
            model=self.config['model']['base_model'],
            suffix=self.config['model']['suffix'],
            hyperparameters=hyperparameters
        )
        
        return job_id
    
    def step5_monitor_training(self, manager: FineTuningManager, job_id: str) -> str:
        """Adım 5: Eğitimi izle"""
        print("\n" + "="*60)
        print("ADIM 5: EĞİTİMİ İZLE")
        print("="*60)
        
        model_name = manager.monitor_job(job_id, check_interval=30)
        return model_name
    
    def step6_test_model(self, manager: FineTuningManager, model_name: str):
        """Adım 6: Modeli test et"""
        print("\n" + "="*60)
        print("ADIM 6: MODELİ TEST ET")
        print("="*60)
        
        test_prompts = [
            "5. sınıf öğrencisiyim. Kesirler konusunu anlamadım.",
            "8. sınıf matematik Pisagor teoremi nedir?",
            "3. sınıf öğrencisiyim. Çarpma işlemini öğrenmek istiyorum.",
            "11. sınıf türev konusunu açıklar mısın?",
            "6. sınıf fen bilimleri vücudumuzda sistemler"
        ]
        
        results = []
        
        for i, prompt in enumerate(test_prompts, 1):
            print(f"\n🧪 Test {i}/{len(test_prompts)}")
            print(f"Soru: {prompt}")
            
            try:
                response = manager.test_fine_tuned_model(model_name, prompt)
                print(f"Cevap: {response[:200]}...")
                
                results.append({
                    "prompt": prompt,
                    "response": response,
                    "success": True
                })
            except Exception as e:
                print(f"Hata: {e}")
                results.append({
                    "prompt": prompt,
                    "error": str(e),
                    "success": False
                })
        
        # Sonuçları kaydet
        self._save_test_results(model_name, results)
        
        # Başarı oranı
        success_count = sum(1 for r in results if r['success'])
        print(f"\n✅ Başarı oranı: {success_count}/{len(results)}")
    
    def _save_test_results(self, model_name: str, results: list):
        """Test sonuçlarını kaydet"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_file = self.results_dir / f"test_results_{timestamp}.json"
        
        data = {
            "model": model_name,
            "timestamp": timestamp,
            "config": self.config,
            "results": results
        }
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n📁 Test sonuçları kaydedildi: {results_file}")
    
    def run_full_pipeline(self):
        """Tam pipeline'ı çalıştır"""
        print("\n🚀 FINE-TUNING PIPELINE BAŞLATILIYOR")
        print("="*60)
        
        try:
            # Adım 1: Veri hazırlama
            data_stats = self.step1_prepare_data()
            print(f"\n✅ Veri hazırlandı: {data_stats['total']} konuşma")
            
            # Adım 2: Veri doğrulama
            if not self.step2_validate_data():
                print("\n❌ Veri doğrulama başarısız!")
                return
            
            # OpenAI client oluştur
            manager = FineTuningManager()
            
            # Adım 3: Veriyi yükle
            file_id = self.step3_upload_data(manager)
            
            # Adım 4: Eğitimi başlat
            job_id = self.step4_start_training(manager, file_id)
            
            # Model bilgilerini kaydet
            model_info = {
                "file_id": file_id,
                "job_id": job_id,
                "config": self.config,
                "created_at": datetime.now().isoformat()
            }
            
            info_file = self.models_dir / f"model_info_{job_id}.json"
            with open(info_file, 'w') as f:
                json.dump(model_info, f, indent=2)
            
            # Adım 5: Eğitimi izle
            model_name = self.step5_monitor_training(manager, job_id)
            
            # Model bilgilerini güncelle
            model_info["fine_tuned_model"] = model_name
            model_info["completed_at"] = datetime.now().isoformat()
            
            with open(info_file, 'w') as f:
                json.dump(model_info, f, indent=2)
            
            # Adım 6: Modeli test et
            self.step6_test_model(manager, model_name)
            
            print("\n" + "="*60)
            print("🎉 FINE-TUNING TAMAMLANDI!")
            print("="*60)
            print(f"Model: {model_name}")
            print(f"Bilgi dosyası: {info_file}")
            
        except Exception as e:
            print(f"\n❌ Hata: {e}")
            raise


def main():
    parser = argparse.ArgumentParser(description='Fine-tuning eğitim yönetimi')
    parser.add_argument('--config', type=Path, help='Konfigürasyon dosyası')
    parser.add_argument('--skip-validation', action='store_true', 
                       help='Veri doğrulamayı atla')
    parser.add_argument('--sample', type=int, default=0,
                       help='Örnek veri boyutu (0 = tüm veri)')
    
    args = parser.parse_args()
    
    # Pipeline oluştur
    pipeline = TrainingPipeline(args.config)
    
    # Sample size override
    if args.sample > 0:
        pipeline.config['data']['sample_size'] = args.sample
    
    # Pipeline'ı çalıştır
    pipeline.run_full_pipeline()


if __name__ == '__main__':
    main() 