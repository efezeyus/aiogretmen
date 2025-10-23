#!/usr/bin/env python3
"""
Fine-tuned Model Değerlendirme Scripti
Model performansını kapsamlı olarak test eder.
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import numpy as np
from openai import OpenAI
import argparse
from collections import Counter


class ModelEvaluator:
    """Model değerlendirme sınıfı"""
    
    def __init__(self, model_name: str, api_key: Optional[str] = None):
        self.model_name = model_name
        self.client = OpenAI(api_key=api_key)
        self.results_dir = Path('results/evaluation')
        self.results_dir.mkdir(parents=True, exist_ok=True)
    
    def load_test_cases(self, test_file: Path) -> List[Dict]:
        """Test vakalarını yükle"""
        with open(test_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def evaluate_response(self, response: str, expected_criteria: Dict) -> Dict:
        """Yanıtı değerlendir"""
        evaluation = {
            'accuracy': 0,
            'relevance': 0,
            'completeness': 0,
            'pedagogy': 0,
            'language_quality': 0,
            'grade_appropriateness': 0
        }
        
        # Basit skorlama (gerçek uygulamada daha sofistike olmalı)
        
        # 1. Doğruluk: Beklenen anahtar kelimeler var mı?
        if 'keywords' in expected_criteria:
            found_keywords = sum(1 for kw in expected_criteria['keywords'] 
                               if kw.lower() in response.lower())
            evaluation['accuracy'] = found_keywords / len(expected_criteria['keywords'])
        
        # 2. İlgililik: Konu dışına çıkılmış mı?
        evaluation['relevance'] = 0.8 if len(response) > 50 else 0.4
        
        # 3. Tamlık: Yeterince detaylı mı?
        evaluation['completeness'] = min(len(response) / 500, 1.0)
        
        # 4. Pedagoji: Öğretici unsurlar var mı?
        pedagogical_markers = ['örnek', 'mesela', 'gibi', 'adım', 'kural', 'formül']
        found_markers = sum(1 for marker in pedagogical_markers 
                          if marker in response.lower())
        evaluation['pedagogy'] = min(found_markers / 3, 1.0)
        
        # 5. Dil kalitesi: Anlaşılır mı?
        evaluation['language_quality'] = 0.85  # Varsayılan
        
        # 6. Sınıf seviyesine uygunluk
        if 'grade_level' in expected_criteria:
            grade_indicators = [f"{expected_criteria['grade_level']}. sınıf", 
                              f"{expected_criteria['grade_level']} sınıf"]
            evaluation['grade_appropriateness'] = 1.0 if any(ind in response.lower() 
                                                           for ind in grade_indicators) else 0.5
        
        # Genel skor
        evaluation['overall_score'] = np.mean(list(evaluation.values()))
        
        return evaluation
    
    def run_single_test(self, test_case: Dict) -> Dict:
        """Tek bir test vakasını çalıştır"""
        start_time = time.time()
        
        try:
            # Model yanıtı al
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": test_case.get('system_prompt', 
                        "Sen MEB müfredatına uygun eğitim veren bir öğretmensin.")},
                    {"role": "user", "content": test_case['prompt']}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            answer = response.choices[0].message.content
            response_time = time.time() - start_time
            
            # Yanıtı değerlendir
            evaluation = self.evaluate_response(answer, test_case.get('expected', {}))
            
            return {
                'success': True,
                'prompt': test_case['prompt'],
                'response': answer,
                'response_time': response_time,
                'evaluation': evaluation,
                'category': test_case.get('category', 'general'),
                'grade_level': test_case.get('expected', {}).get('grade_level')
            }
            
        except Exception as e:
            return {
                'success': False,
                'prompt': test_case['prompt'],
                'error': str(e),
                'response_time': time.time() - start_time,
                'category': test_case.get('category', 'general')
            }
    
    def run_evaluation_suite(self, test_cases: List[Dict]) -> Dict:
        """Tüm test paketini çalıştır"""
        print(f"\n🧪 {len(test_cases)} test vakası çalıştırılıyor...")
        
        results = []
        categories_scores = {}
        grade_levels_scores = {}
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\r⏳ Test {i}/{len(test_cases)}", end='', flush=True)
            
            result = self.run_single_test(test_case)
            results.append(result)
            
            # Kategori bazlı skorlama
            if result['success']:
                category = result['category']
                if category not in categories_scores:
                    categories_scores[category] = []
                categories_scores[category].append(
                    result['evaluation']['overall_score']
                )
                
                # Sınıf seviyesi bazlı skorlama
                grade = result.get('grade_level')
                if grade:
                    if grade not in grade_levels_scores:
                        grade_levels_scores[grade] = []
                    grade_levels_scores[grade].append(
                        result['evaluation']['overall_score']
                    )
        
        print("\n✅ Testler tamamlandı!")
        
        # Özet istatistikler
        successful_tests = [r for r in results if r['success']]
        failed_tests = [r for r in results if not r['success']]
        
        summary = {
            'total_tests': len(results),
            'successful_tests': len(successful_tests),
            'failed_tests': len(failed_tests),
            'success_rate': len(successful_tests) / len(results) if results else 0,
            'avg_response_time': np.mean([r['response_time'] for r in successful_tests]) if successful_tests else 0,
            'category_scores': {cat: np.mean(scores) for cat, scores in categories_scores.items()},
            'grade_level_scores': {str(grade): np.mean(scores) for grade, scores in grade_levels_scores.items()},
            'detailed_results': results
        }
        
        # Detaylı metrikler
        if successful_tests:
            all_evaluations = [r['evaluation'] for r in successful_tests]
            
            summary['metrics'] = {
                'accuracy': np.mean([e['accuracy'] for e in all_evaluations]),
                'relevance': np.mean([e['relevance'] for e in all_evaluations]),
                'completeness': np.mean([e['completeness'] for e in all_evaluations]),
                'pedagogy': np.mean([e['pedagogy'] for e in all_evaluations]),
                'language_quality': np.mean([e['language_quality'] for e in all_evaluations]),
                'grade_appropriateness': np.mean([e['grade_appropriateness'] for e in all_evaluations]),
                'overall': np.mean([e['overall_score'] for e in all_evaluations])
            }
        
        return summary
    
    def generate_report(self, evaluation_results: Dict) -> str:
        """Değerlendirme raporu oluştur"""
        report = []
        report.append("=" * 70)
        report.append(f"MODEL DEĞERLENDİRME RAPORU")
        report.append(f"Model: {self.model_name}")
        report.append(f"Tarih: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 70)
        
        # Genel özet
        report.append("\n📊 GENEL ÖZET:")
        report.append(f"  • Toplam test: {evaluation_results['total_tests']}")
        report.append(f"  • Başarılı: {evaluation_results['successful_tests']}")
        report.append(f"  • Başarısız: {evaluation_results['failed_tests']}")
        report.append(f"  • Başarı oranı: {evaluation_results['success_rate']:.1%}")
        report.append(f"  • Ortalama yanıt süresi: {evaluation_results['avg_response_time']:.2f}s")
        
        # Metrik skorları
        if 'metrics' in evaluation_results:
            report.append("\n📈 METRİK SKORLARI (0-1):")
            for metric, score in evaluation_results['metrics'].items():
                report.append(f"  • {metric.title()}: {score:.3f}")
        
        # Kategori bazlı performans
        if evaluation_results['category_scores']:
            report.append("\n📚 KATEGORİ BAZLI PERFORMANS:")
            for category, score in sorted(evaluation_results['category_scores'].items()):
                report.append(f"  • {category}: {score:.3f}")
        
        # Sınıf seviyesi bazlı performans
        if evaluation_results['grade_level_scores']:
            report.append("\n🎓 SINIF SEVİYESİ BAZLI PERFORMANS:")
            for grade, score in sorted(evaluation_results['grade_level_scores'].items()):
                report.append(f"  • {grade}. sınıf: {score:.3f}")
        
        # Başarısız testler
        failed = [r for r in evaluation_results['detailed_results'] if not r['success']]
        if failed:
            report.append(f"\n❌ BAŞARISIZ TESTLER ({len(failed)}):")
            for fail in failed[:5]:
                report.append(f"  • Soru: {fail['prompt'][:50]}...")
                report.append(f"    Hata: {fail['error']}")
        
        # En iyi ve en kötü yanıtlar
        successful = [r for r in evaluation_results['detailed_results'] if r['success']]
        if successful:
            sorted_by_score = sorted(successful, 
                                   key=lambda x: x['evaluation']['overall_score'], 
                                   reverse=True)
            
            report.append("\n✅ EN İYİ YANITLAR:")
            for result in sorted_by_score[:3]:
                report.append(f"  • Soru: {result['prompt']}")
                report.append(f"    Skor: {result['evaluation']['overall_score']:.3f}")
                report.append(f"    Yanıt: {result['response'][:100]}...")
            
            report.append("\n⚠️  EN KÖTÜ YANITLAR:")
            for result in sorted_by_score[-3:]:
                report.append(f"  • Soru: {result['prompt']}")
                report.append(f"    Skor: {result['evaluation']['overall_score']:.3f}")
                report.append(f"    Yanıt: {result['response'][:100]}...")
        
        report_text = "\n".join(report)
        
        # Raporu kaydet
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = self.results_dir / f"evaluation_report_{timestamp}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        # JSON sonuçları da kaydet
        results_file = self.results_dir / f"evaluation_results_{timestamp}.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(evaluation_results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📁 Rapor kaydedildi: {report_file}")
        print(f"📁 Detaylı sonuçlar: {results_file}")
        
        return report_text


def create_default_test_cases() -> List[Dict]:
    """Varsayılan test vakaları oluştur"""
    return [
        # Matematik testleri
        {
            "prompt": "5. sınıf öğrencisiyim. Kesirler konusunu anlamadım.",
            "category": "matematik",
            "expected": {
                "keywords": ["pay", "payda", "bütün", "parça", "kesir"],
                "grade_level": 5
            }
        },
        {
            "prompt": "3/4 + 1/4 işlemini nasıl yaparım?",
            "category": "matematik",
            "expected": {
                "keywords": ["payda", "aynı", "topla", "4/4", "1"],
                "grade_level": 5
            }
        },
        {
            "prompt": "8. sınıf Pisagor teoremi nedir?",
            "category": "matematik",
            "expected": {
                "keywords": ["dik üçgen", "hipotenüs", "kare", "a²+b²=c²"],
                "grade_level": 8
            }
        },
        
        # Türkçe testleri
        {
            "prompt": "İsim ve fiil arasındaki fark nedir?",
            "category": "turkce",
            "expected": {
                "keywords": ["varlık", "hareket", "eylem", "ad"],
                "grade_level": 5
            }
        },
        {
            "prompt": "Noktalama işaretlerini nasıl kullanırım?",
            "category": "turkce",
            "expected": {
                "keywords": ["nokta", "virgül", "soru", "ünlem"],
                "grade_level": 4
            }
        },
        
        # Fen Bilimleri testleri
        {
            "prompt": "6. sınıf vücudumuzda sistemler konusu",
            "category": "fen",
            "expected": {
                "keywords": ["iskelet", "kas", "sindirim", "dolaşım", "solunum"],
                "grade_level": 6
            }
        },
        {
            "prompt": "9. sınıf hücre nedir?",
            "category": "fen",
            "expected": {
                "keywords": ["canlı", "yapı", "çekirdek", "sitoplazma", "zar"],
                "grade_level": 9
            }
        },
        
        # Çok sınıflı testler
        {
            "prompt": "Ben 2. sınıf öğrencisiyim. Saat okumayı öğret.",
            "category": "matematik",
            "expected": {
                "keywords": ["akrep", "yelkovan", "saat", "dakika"],
                "grade_level": 2
            }
        },
        {
            "prompt": "11. sınıf türev konusu",
            "category": "matematik",
            "expected": {
                "keywords": ["değişim", "hız", "limit", "f'(x)"],
                "grade_level": 11
            }
        }
    ]


def main():
    parser = argparse.ArgumentParser(description='Fine-tuned model değerlendirme')
    parser.add_argument('model', help='Değerlendirilecek model adı')
    parser.add_argument('--test-file', type=Path, 
                       help='Test vakaları JSON dosyası')
    parser.add_argument('--quick', action='store_true',
                       help='Hızlı test (sadece 5 vaka)')
    
    args = parser.parse_args()
    
    # Test vakalarını yükle
    if args.test_file and args.test_file.exists():
        test_cases = json.load(open(args.test_file, 'r', encoding='utf-8'))
    else:
        test_cases = create_default_test_cases()
    
    # Hızlı test modu
    if args.quick:
        test_cases = test_cases[:5]
    
    # Değerlendirici oluştur
    evaluator = ModelEvaluator(args.model)
    
    # Değerlendirme yap
    results = evaluator.run_evaluation_suite(test_cases)
    
    # Rapor oluştur
    report = evaluator.generate_report(results)
    
    # Raporu ekrana yazdır
    print("\n" + report)


if __name__ == '__main__':
    main() 