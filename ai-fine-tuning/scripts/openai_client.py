#!/usr/bin/env python3
"""
OpenAI Fine-tuning API Client
Fine-tuning işlemlerini yönetir.
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import openai
from openai import OpenAI
import argparse
from dotenv import load_dotenv


class FineTuningManager:
    """OpenAI Fine-tuning yönetim sınıfı"""
    
    def __init__(self, api_key: Optional[str] = None):
        load_dotenv()
        
        # API anahtarı
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY bulunamadı!")
        
        # OpenAI client
        self.client = OpenAI(api_key=self.api_key)
        
        # Log dizini
        self.log_dir = Path('logs')
        self.log_dir.mkdir(exist_ok=True)
    
    def upload_training_file(self, file_path: Path) -> str:
        """Eğitim dosyasını yükle"""
        print(f"📤 Dosya yükleniyor: {file_path}")
        
        with open(file_path, 'rb') as f:
            response = self.client.files.create(
                file=f,
                purpose='fine-tune'
            )
        
        file_id = response.id
        print(f"✅ Dosya yüklendi: {file_id}")
        
        # Log kaydet
        self._log_event('file_upload', {
            'file_path': str(file_path),
            'file_id': file_id,
            'timestamp': datetime.now().isoformat()
        })
        
        return file_id
    
    def create_fine_tuning_job(self, 
                              training_file_id: str,
                              model: str = "gpt-3.5-turbo",
                              suffix: str = "meb-ogretmen",
                              hyperparameters: Optional[Dict] = None) -> str:
        """Fine-tuning işi oluştur"""
        print(f"🚀 Fine-tuning işi başlatılıyor...")
        
        # Varsayılan hyperparameters
        if hyperparameters is None:
            hyperparameters = {
                "n_epochs": 3,
                "batch_size": 1,
                "learning_rate_multiplier": 0.1
            }
        
        # İş oluştur
        response = self.client.fine_tuning.jobs.create(
            training_file=training_file_id,
            model=model,
            suffix=suffix,
            hyperparameters=hyperparameters
        )
        
        job_id = response.id
        print(f"✅ Fine-tuning işi oluşturuldu: {job_id}")
        
        # Log kaydet
        self._log_event('job_created', {
            'job_id': job_id,
            'model': model,
            'suffix': suffix,
            'hyperparameters': hyperparameters,
            'timestamp': datetime.now().isoformat()
        })
        
        return job_id
    
    def get_job_status(self, job_id: str) -> Dict:
        """İş durumunu kontrol et"""
        response = self.client.fine_tuning.jobs.retrieve(job_id)
        
        return {
            'id': response.id,
            'status': response.status,
            'model': response.model,
            'fine_tuned_model': response.fine_tuned_model,
            'created_at': response.created_at,
            'finished_at': response.finished_at,
            'error': response.error
        }
    
    def monitor_job(self, job_id: str, check_interval: int = 30) -> str:
        """İş tamamlanana kadar bekle ve izle"""
        print(f"📊 İş izleniyor: {job_id}")
        print(f"   (Her {check_interval} saniyede kontrol edilecek)")
        
        while True:
            status = self.get_job_status(job_id)
            
            print(f"\n⏳ Durum: {status['status']}")
            print(f"   Zaman: {datetime.now().strftime('%H:%M:%S')}")
            
            if status['status'] == 'succeeded':
                print(f"\n🎉 Fine-tuning tamamlandı!")
                print(f"   Model: {status['fine_tuned_model']}")
                
                # Log kaydet
                self._log_event('job_completed', {
                    'job_id': job_id,
                    'fine_tuned_model': status['fine_tuned_model'],
                    'timestamp': datetime.now().isoformat()
                })
                
                return status['fine_tuned_model']
            
            elif status['status'] == 'failed':
                print(f"\n❌ Fine-tuning başarısız!")
                print(f"   Hata: {status['error']}")
                
                # Log kaydet
                self._log_event('job_failed', {
                    'job_id': job_id,
                    'error': status['error'],
                    'timestamp': datetime.now().isoformat()
                })
                
                raise Exception(f"Fine-tuning başarısız: {status['error']}")
            
            time.sleep(check_interval)
    
    def list_fine_tuning_jobs(self, limit: int = 10) -> List[Dict]:
        """Fine-tuning işlerini listele"""
        response = self.client.fine_tuning.jobs.list(limit=limit)
        
        jobs = []
        for job in response.data:
            jobs.append({
                'id': job.id,
                'status': job.status,
                'model': job.model,
                'fine_tuned_model': job.fine_tuned_model,
                'created_at': datetime.fromtimestamp(job.created_at).strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jobs
    
    def test_fine_tuned_model(self, model_name: str, test_prompt: str) -> str:
        """Fine-tuned modeli test et"""
        print(f"🧪 Model test ediliyor: {model_name}")
        
        response = self.client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "Sen MEB müfredatına uygun eğitim veren bir öğretmensin."},
                {"role": "user", "content": test_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    
    def estimate_cost(self, file_path: Path) -> Dict:
        """Tahmini maliyeti hesapla"""
        # Token sayısını hesapla (basit tahmin)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Yaklaşık token sayısı (4 karakter = 1 token)
            estimated_tokens = len(content) / 4
        
        # Maliyet tahmini (GPT-3.5-turbo fine-tuning)
        # Training: $0.0080 / 1K tokens
        # Inference: $0.0030 / 1K tokens (input) + $0.0060 / 1K tokens (output)
        training_cost = (estimated_tokens / 1000) * 0.008
        
        return {
            'estimated_tokens': int(estimated_tokens),
            'estimated_training_cost': f"${training_cost:.2f}",
            'note': 'Bu tahmindir. Gerçek maliyet değişebilir.'
        }
    
    def _log_event(self, event_type: str, data: Dict):
        """Olayları logla"""
        log_file = self.log_dir / f"fine_tuning_{datetime.now().strftime('%Y%m%d')}.json"
        
        log_entry = {
            'event': event_type,
            'data': data
        }
        
        # Mevcut logları oku
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
        
        # Yeni log ekle
        logs.append(log_entry)
        
        # Kaydet
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description='OpenAI Fine-tuning yönetimi')
    
    subparsers = parser.add_subparsers(dest='command', help='Komutlar')
    
    # Upload komutu
    upload_parser = subparsers.add_parser('upload', help='Eğitim dosyası yükle')
    upload_parser.add_argument('file', help='Yüklenecek JSONL dosyası')
    
    # Create komutu
    create_parser = subparsers.add_parser('create', help='Fine-tuning işi oluştur')
    create_parser.add_argument('file_id', help='Eğitim dosyası ID')
    create_parser.add_argument('--model', default='gpt-3.5-turbo', help='Temel model')
    create_parser.add_argument('--suffix', default='meb-ogretmen', help='Model soneki')
    create_parser.add_argument('--epochs', type=int, default=3, help='Epoch sayısı')
    
    # Monitor komutu
    monitor_parser = subparsers.add_parser('monitor', help='İşi izle')
    monitor_parser.add_argument('job_id', help='Fine-tuning iş ID')
    
    # List komutu
    list_parser = subparsers.add_parser('list', help='İşleri listele')
    list_parser.add_argument('--limit', type=int, default=10, help='Listeleme limiti')
    
    # Test komutu
    test_parser = subparsers.add_parser('test', help='Modeli test et')
    test_parser.add_argument('model', help='Model adı')
    test_parser.add_argument('prompt', help='Test sorusu')
    
    # Cost komutu
    cost_parser = subparsers.add_parser('cost', help='Maliyet tahmini')
    cost_parser.add_argument('file', help='JSONL dosyası')
    
    args = parser.parse_args()
    
    # Manager oluştur
    manager = FineTuningManager()
    
    # Komutu çalıştır
    if args.command == 'upload':
        file_id = manager.upload_training_file(Path(args.file))
        print(f"\nDosya ID: {file_id}")
        
    elif args.command == 'create':
        hyperparameters = {
            "n_epochs": args.epochs,
            "batch_size": 1,
            "learning_rate_multiplier": 0.1
        }
        job_id = manager.create_fine_tuning_job(
            args.file_id, 
            model=args.model,
            suffix=args.suffix,
            hyperparameters=hyperparameters
        )
        print(f"\nİş ID: {job_id}")
        
    elif args.command == 'monitor':
        model_name = manager.monitor_job(args.job_id)
        print(f"\nModel hazır: {model_name}")
        
    elif args.command == 'list':
        jobs = manager.list_fine_tuning_jobs(args.limit)
        print("\nFine-tuning İşleri:")
        print("-" * 80)
        for job in jobs:
            print(f"ID: {job['id']}")
            print(f"  Durum: {job['status']}")
            print(f"  Model: {job['model']}")
            print(f"  Fine-tuned: {job['fine_tuned_model'] or 'N/A'}")
            print(f"  Tarih: {job['created_at']}")
            print("-" * 80)
            
    elif args.command == 'test':
        response = manager.test_fine_tuned_model(args.model, args.prompt)
        print(f"\n🤖 Model Yanıtı:\n{response}")
        
    elif args.command == 'cost':
        estimate = manager.estimate_cost(Path(args.file))
        print(f"\n💰 Maliyet Tahmini:")
        print(f"  Token sayısı: {estimate['estimated_tokens']:,}")
        print(f"  Eğitim maliyeti: {estimate['estimated_training_cost']}")
        print(f"  Not: {estimate['note']}")
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main() 