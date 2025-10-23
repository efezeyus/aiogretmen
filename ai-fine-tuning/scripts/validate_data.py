#!/usr/bin/env python3
"""
Fine-tuning Veri Doğrulama Scripti
Hazırlanan verilerin formatını ve içeriğini doğrular.
"""

import json
import tiktoken
from pathlib import Path
from typing import Dict, List, Tuple
from collections import Counter
import argparse


class DataValidator:
    """Fine-tuning veri doğrulama sınıfı"""
    
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
        
    def load_jsonl(self, file_path: Path) -> List[Dict]:
        """JSONL dosyasını yükle"""
        data = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
        return data
    
    def count_tokens(self, text: str) -> int:
        """Metin token sayısını hesapla"""
        return len(self.encoding.encode(text))
    
    def validate_format(self, conversation: Dict) -> Tuple[bool, str]:
        """OpenAI format doğrulaması"""
        # messages anahtarı var mı?
        if 'messages' not in conversation:
            return False, "messages anahtarı eksik"
        
        messages = conversation['messages']
        
        # En az 2 mesaj var mı?
        if len(messages) < 2:
            return False, "En az 2 mesaj olmalı"
        
        # Her mesajın role ve content'i var mı?
        for i, msg in enumerate(messages):
            if 'role' not in msg:
                return False, f"Mesaj {i}: role eksik"
            if 'content' not in msg:
                return False, f"Mesaj {i}: content eksik"
            if msg['role'] not in ['system', 'user', 'assistant']:
                return False, f"Mesaj {i}: geçersiz rol '{msg['role']}'"
        
        # İlk mesaj system mı?
        if messages[0]['role'] != 'system':
            return False, "İlk mesaj system olmalı"
        
        # User-assistant sıralaması doğru mu?
        for i in range(1, len(messages)-1):
            if messages[i]['role'] == messages[i+1]['role']:
                return False, f"Ardışık aynı roller: pozisyon {i} ve {i+1}"
        
        return True, "OK"
    
    def analyze_dataset(self, file_path: Path) -> Dict:
        """Veri seti analizi"""
        data = self.load_jsonl(file_path)
        
        stats = {
            'total_conversations': len(data),
            'total_messages': 0,
            'total_tokens': 0,
            'avg_messages_per_conversation': 0,
            'avg_tokens_per_conversation': 0,
            'max_tokens_conversation': 0,
            'min_tokens_conversation': float('inf'),
            'role_distribution': Counter(),
            'grade_levels': Counter(),
            'subjects': Counter(),
            'format_errors': []
        }
        
        conversation_tokens = []
        
        for i, conv in enumerate(data):
            # Format doğrulama
            is_valid, error = self.validate_format(conv)
            if not is_valid:
                stats['format_errors'].append(f"Konuşma {i}: {error}")
                continue
            
            messages = conv['messages']
            stats['total_messages'] += len(messages)
            
            # Token sayısı
            conv_tokens = 0
            for msg in messages:
                tokens = self.count_tokens(msg['content'])
                conv_tokens += tokens
                stats['role_distribution'][msg['role']] += 1
                
                # Sınıf seviyesi tespiti
                content_lower = msg['content'].lower()
                for grade in range(1, 13):
                    if f"{grade}. sınıf" in content_lower:
                        stats['grade_levels'][f"{grade}. sınıf"] += 1
                
                # Ders tespiti
                subjects = ['matematik', 'türkçe', 'fen', 'sosyal', 'ingilizce', 
                           'fizik', 'kimya', 'biyoloji', 'tarih', 'coğrafya']
                for subject in subjects:
                    if subject in content_lower:
                        stats['subjects'][subject] += 1
            
            conversation_tokens.append(conv_tokens)
            stats['total_tokens'] += conv_tokens
            stats['max_tokens_conversation'] = max(stats['max_tokens_conversation'], conv_tokens)
            stats['min_tokens_conversation'] = min(stats['min_tokens_conversation'], conv_tokens)
        
        # Ortalamalar
        if stats['total_conversations'] > 0:
            stats['avg_messages_per_conversation'] = stats['total_messages'] / stats['total_conversations']
            stats['avg_tokens_per_conversation'] = stats['total_tokens'] / stats['total_conversations']
        
        return stats
    
    def check_token_limits(self, file_path: Path, max_tokens: int = 4096) -> List[int]:
        """Token limitini aşan konuşmaları bul"""
        data = self.load_jsonl(file_path)
        over_limit = []
        
        for i, conv in enumerate(data):
            total_tokens = sum(self.count_tokens(msg['content']) for msg in conv['messages'])
            if total_tokens > max_tokens:
                over_limit.append(i)
        
        return over_limit
    
    def print_report(self, stats: Dict):
        """Analiz raporunu yazdır"""
        print("\n" + "="*60)
        print("VERİ SETİ ANALİZ RAPORU")
        print("="*60)
        
        print(f"\nGenel İstatistikler:")
        print(f"  - Toplam konuşma: {stats['total_conversations']}")
        print(f"  - Toplam mesaj: {stats['total_messages']}")
        print(f"  - Toplam token: {stats['total_tokens']:,}")
        print(f"  - Ortalama mesaj/konuşma: {stats['avg_messages_per_conversation']:.1f}")
        print(f"  - Ortalama token/konuşma: {stats['avg_tokens_per_conversation']:.0f}")
        print(f"  - Max token (konuşma): {stats['max_tokens_conversation']:,}")
        print(f"  - Min token (konuşma): {stats['min_tokens_conversation']:,}")
        
        print(f"\nRol Dağılımı:")
        for role, count in stats['role_distribution'].most_common():
            print(f"  - {role}: {count}")
        
        print(f"\nSınıf Seviyeleri:")
        for grade, count in sorted(stats['grade_levels'].items()):
            print(f"  - {grade}: {count}")
        
        print(f"\nDers Dağılımı:")
        for subject, count in stats['subjects'].most_common(10):
            print(f"  - {subject}: {count}")
        
        if stats['format_errors']:
            print(f"\nFormat Hataları ({len(stats['format_errors'])}):")
            for error in stats['format_errors'][:5]:
                print(f"  - {error}")
            if len(stats['format_errors']) > 5:
                print(f"  ... ve {len(stats['format_errors'])-5} hata daha")
        else:
            print(f"\n✅ Format hataları yok!")


def main():
    parser = argparse.ArgumentParser(description='Fine-tuning veri doğrulama')
    parser.add_argument('--data-path', default='../data/processed',
                       help='İşlenmiş veri klasörü')
    parser.add_argument('--max-tokens', type=int, default=4096,
                       help='Maksimum token limiti')
    
    args = parser.parse_args()
    
    validator = DataValidator(args.data_path)
    
    # Train ve validation verilerini analiz et
    for dataset in ['train.jsonl', 'validation.jsonl']:
        file_path = Path(args.data_path) / dataset
        
        if not file_path.exists():
            print(f"\n❌ {dataset} bulunamadı!")
            continue
        
        print(f"\n📊 Analiz ediliyor: {dataset}")
        
        # Analiz yap
        stats = validator.analyze_dataset(file_path)
        validator.print_report(stats)
        
        # Token limitini kontrol et
        over_limit = validator.check_token_limits(file_path, args.max_tokens)
        if over_limit:
            print(f"\n⚠️  {len(over_limit)} konuşma {args.max_tokens} token limitini aşıyor!")
            print(f"   İndeksler: {over_limit[:5]}...")


if __name__ == '__main__':
    main() 