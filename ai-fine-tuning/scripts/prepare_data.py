#!/usr/bin/env python3
"""
Fine-tuning Veri Hazırlama Scripti
MEB müfredatına uygun eğitim verilerini işler ve OpenAI formatına dönüştürür.
"""

import json
import os
import random
from typing import List, Dict, Any
from pathlib import Path
import argparse


class DataProcessor:
    """Fine-tuning veri işleme sınıfı"""
    
    def __init__(self, raw_data_path: str, processed_data_path: str):
        self.raw_data_path = Path(raw_data_path)
        self.processed_data_path = Path(processed_data_path)
        self.processed_data_path.mkdir(parents=True, exist_ok=True)
        
    def load_jsonl(self, file_path: Path) -> List[Dict]:
        """JSONL dosyasını yükle"""
        data = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
        return data
    
    def save_jsonl(self, data: List[Dict], file_path: Path):
        """JSONL dosyasına kaydet"""
        with open(file_path, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    def validate_conversation(self, conversation: Dict) -> bool:
        """Konuşma formatını doğrula"""
        if 'messages' not in conversation:
            return False
        
        messages = conversation['messages']
        if len(messages) < 2:
            return False
        
        # İlk mesaj system olmalı
        if messages[0]['role'] != 'system':
            return False
        
        # En az bir user ve bir assistant mesajı olmalı
        roles = [msg['role'] for msg in messages]
        if 'user' not in roles or 'assistant' not in roles:
            return False
        
        return True
    
    def augment_data(self, conversation: Dict) -> List[Dict]:
        """Veri çoğaltma teknikleri uygula"""
        augmented = [conversation]
        
        # Varyasyon 1: Farklı sistem promptları
        system_prompts = [
            "Sen MEB müfredatına uygun eğitim veren, sabırlı ve yardımsever bir öğretmensin.",
            "Sen Türkiye'deki öğrencilere MEB müfredatına göre ders anlatan deneyimli bir eğitmensin.",
            "Sen öğrencilerin seviyesine uygun, MEB müfredatını takip eden bir yapay zeka öğretmenisin."
        ]
        
        # Rastgele sistem promptu seç
        new_conv = conversation.copy()
        new_conv['messages'] = conversation['messages'].copy()
        new_conv['messages'][0] = {
            'role': 'system',
            'content': random.choice(system_prompts)
        }
        augmented.append(new_conv)
        
        return augmented
    
    def process_all_data(self):
        """Tüm ham verileri işle"""
        all_processed = []
        
        # Raw klasöründeki tüm JSONL dosyalarını işle
        for jsonl_file in self.raw_data_path.glob('*.jsonl'):
            print(f"İşleniyor: {jsonl_file.name}")
            
            # Veriyi yükle
            raw_data = self.load_jsonl(jsonl_file)
            
            # Her konuşmayı işle
            for conversation in raw_data:
                # Formatı doğrula
                if not self.validate_conversation(conversation):
                    print(f"Geçersiz format atlandı: {jsonl_file.name}")
                    continue
                
                # Veri çoğaltma
                augmented = self.augment_data(conversation)
                all_processed.extend(augmented)
        
        # Veriyi karıştır
        random.shuffle(all_processed)
        
        # Train/Validation split (90/10)
        split_idx = int(len(all_processed) * 0.9)
        train_data = all_processed[:split_idx]
        val_data = all_processed[split_idx:]
        
        # Kaydet
        self.save_jsonl(train_data, self.processed_data_path / 'train.jsonl')
        self.save_jsonl(val_data, self.processed_data_path / 'validation.jsonl')
        
        print(f"\nİşlem tamamlandı!")
        print(f"Toplam veri: {len(all_processed)}")
        print(f"Eğitim verisi: {len(train_data)}")
        print(f"Doğrulama verisi: {len(val_data)}")
        
        return {
            'total': len(all_processed),
            'train': len(train_data),
            'validation': len(val_data)
        }
    
    def create_sample_dataset(self, sample_size: int = 100):
        """Test için küçük bir örnek veri seti oluştur"""
        train_path = self.processed_data_path / 'train.jsonl'
        
        if not train_path.exists():
            print("Önce process_all_data() çalıştırın!")
            return
        
        train_data = self.load_jsonl(train_path)
        sample_data = random.sample(train_data, min(sample_size, len(train_data)))
        
        self.save_jsonl(sample_data, self.processed_data_path / 'sample.jsonl')
        print(f"Örnek veri seti oluşturuldu: {len(sample_data)} kayıt")


def main():
    parser = argparse.ArgumentParser(description='Fine-tuning veri hazırlama')
    parser.add_argument('--raw-path', default='../data/raw', 
                       help='Ham veri klasörü')
    parser.add_argument('--processed-path', default='../data/processed',
                       help='İşlenmiş veri klasörü')
    parser.add_argument('--sample', type=int, default=0,
                       help='Örnek veri seti boyutu (0 = oluşturma)')
    
    args = parser.parse_args()
    
    # Processor oluştur
    processor = DataProcessor(args.raw_path, args.processed_path)
    
    # Tüm veriyi işle
    stats = processor.process_all_data()
    
    # Örnek veri seti oluştur
    if args.sample > 0:
        processor.create_sample_dataset(args.sample)


if __name__ == '__main__':
    main() 