"""
Kendi AI Modelimizi Eğitme Servisi
OpenAI Fine-tuning ve kendi modelimiz
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from loguru import logger
import json
from pathlib import Path

from app.db.mongodb import get_database
from app.core.config import settings


class AIModelTrainer:
    """
    Kendi AI Öğretmen Modelimizi Eğitme ve Yönetme Servisi
    
    Özellikler:
    - Öğrenci etkileşimlerinden öğrenme
    - MEB müfredatına özel model
    - Türkçe optimizasyonu
    - Kişiselleştirilmiş yanıtlar
    - Sürekli iyileştirme
    """
    
    def __init__(self):
        self.db = get_database()
        self.training_data_dir = Path("training_data")
        self.training_data_dir.mkdir(exist_ok=True)
        
        # Model versiyonları
        self.models = {
            "base": {
                "name": "yapay-zeka-ogretmen-base-v1",
                "description": "Temel MEB müfredatı modeli",
                "training_examples": 0,
                "accuracy": 0.0,
                "last_trained": None
            },
            "personalized": {
                "name": "yapay-zeka-ogretmen-personalized-v1",
                "description": "Kişiselleştirilmiş öğrenme modeli",
                "training_examples": 0,
                "accuracy": 0.0,
                "last_trained": None
            }
        }
        
        logger.info("AI Model Trainer başlatıldı")
    
    async def collect_training_data_from_interactions(self) -> int:
        """
        Öğrenci etkileşimlerinden eğitim verisi topla
        """
        if self.db is None:
            logger.warning("Database bağlantısı yok")
            return 0
        
        try:
            # İnteraksiyon loglarını al
            interactions = []
            async for interaction in self.db.interaction_logs.find(
                {"type": "lesson_chat"}
            ).limit(1000):
                interactions.append(interaction)
            
            # Fine-tuning formatına çevir
            training_examples = []
            
            for interaction in interactions:
                if "student_message" in interaction and "ai_response" in interaction:
                    example = {
                        "messages": [
                            {
                                "role": "system",
                                "content": self._get_system_prompt(interaction)
                            },
                            {
                                "role": "user",
                                "content": interaction["student_message"]
                            },
                            {
                                "role": "assistant",
                                "content": interaction["ai_response"]
                            }
                        ],
                        "metadata": {
                            "grade": interaction.get("grade"),
                            "subject": interaction.get("subject"),
                            "topic": interaction.get("topic"),
                            "timestamp": interaction.get("timestamp")
                        }
                    }
                    training_examples.append(example)
            
            # JSONL formatında kaydet
            if training_examples:
                output_file = self.training_data_dir / f"training_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    for example in training_examples:
                        f.write(json.dumps(example, ensure_ascii=False) + '\n')
                
                logger.info(f"✅ {len(training_examples)} eğitim örneği kaydedildi: {output_file}")
                return len(training_examples)
            
            return 0
            
        except Exception as e:
            logger.error(f"Eğitim verisi toplama hatası: {e}")
            return 0
    
    def _get_system_prompt(self, interaction: Dict) -> str:
        """
        Eğitim için system prompt oluştur
        """
        grade = interaction.get("grade", "5")
        subject = interaction.get("subject", "Matematik")
        
        return f"""Sen MEB müfredatına uygun, Türkçe konuşan bir yapay zeka öğretmenisin.

Öğrenci Seviyesi: {grade}. Sınıf
Ders: {subject}

Görevin:
- Konuları basit ve anlaşılır şekilde açıklamak
- Gerçek hayat örnekleri vermek
- Öğrenciyi motive etmek
- Sorularını sabırla cevaplamak
- MEB kazanımlarına uygun öğretmek

Dil: Türkçe
Ton: Arkadaşça ve destekleyici
"""
    
    async def get_training_statistics(self) -> Dict[str, Any]:
        """
        Eğitim istatistiklerini döndür
        """
        if self.db is None:
            return {"error": "Database bağlantısı yok"}
        
        try:
            # Toplam etkileşim sayısı
            total_interactions = await self.db.interaction_logs.count_documents({})
            
            # Ders bazlı dağılım
            subject_pipeline = [
                {"$group": {
                    "_id": "$subject",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            subject_stats = []
            async for stat in self.db.interaction_logs.aggregate(subject_pipeline):
                subject_stats.append({
                    "subject": stat["_id"],
                    "interactions": stat["count"]
                })
            
            # Sınıf bazlı dağılım
            grade_pipeline = [
                {"$group": {
                    "_id": "$grade",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            
            grade_stats = []
            async for stat in self.db.interaction_logs.aggregate(grade_pipeline):
                grade_stats.append({
                    "grade": stat["_id"],
                    "interactions": stat["count"]
                })
            
            return {
                "total_interactions": total_interactions,
                "by_subject": subject_stats,
                "by_grade": grade_stats,
                "training_data_available": total_interactions > 100,
                "recommended_action": "Eğitim verisi toplamaya devam edin" if total_interactions < 1000 else "Model eğitimine başlayabilirsiniz"
            }
            
        except Exception as e:
            logger.error(f"İstatistik alma hatası: {e}")
            return {"error": str(e)}
    
    async def generate_meb_training_dataset(self, grade: int, subject: str) -> str:
        """
        Belirli sınıf ve ders için MEB uyumlu eğitim dataset'i oluştur
        """
        try:
            from app.services.curriculum_manager import curriculum_manager
            
            # MEB müfredatını al
            curriculum = curriculum_manager.get_detailed_curriculum(grade, subject)
            
            if not curriculum:
                return "Müfredat bulunamadı"
            
            training_examples = []
            
            # Her konu için örnek diyaloglar oluştur
            if "learning_areas" in curriculum:
                for learning_area in curriculum["learning_areas"]:
                    for unit in learning_area.get("units", []):
                        for topic in unit.get("topics", []):
                            # Örnek soru-cevap çiftleri
                            examples = self._generate_topic_examples(
                                topic, unit, learning_area, grade, subject
                            )
                            training_examples.extend(examples)
            
            # Dosyaya kaydet
            output_file = self.training_data_dir / f"meb_{grade}_{subject}_{datetime.now().strftime('%Y%m%d')}.jsonl"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                for example in training_examples:
                    f.write(json.dumps(example, ensure_ascii=False) + '\n')
            
            logger.info(f"✅ MEB eğitim dataset'i oluşturuldu: {len(training_examples)} örnek")
            return str(output_file)
            
        except Exception as e:
            logger.error(f"Dataset oluşturma hatası: {e}")
            return f"Hata: {str(e)}"
    
    def _generate_topic_examples(
        self, 
        topic: Dict, 
        unit: Dict, 
        learning_area: Dict,
        grade: int,
        subject: str
    ) -> List[Dict]:
        """
        Bir konu için örnek diyaloglar oluştur
        """
        examples = []
        topic_title = topic.get("title", "")
        objectives = topic.get("objectives", [])
        
        # Örnek 1: Konu açıklama
        examples.append({
            "messages": [
                {
                    "role": "system",
                    "content": f"Sen {grade}. sınıf {subject} öğretmenisin. MEB müfredatına uygun öğretiyorsun."
                },
                {
                    "role": "user",
                    "content": f"{topic_title} konusunu anlatır mısın?"
                },
                {
                    "role": "assistant",
                    "content": f"Tabii ki! {topic_title} konusunda şunları öğreneceğiz:\n\n" + 
                              "\n".join([f"• {obj}" for obj in objectives[:3]]) +
                              f"\n\nBu {learning_area.get('name')} öğrenme alanının bir parçası."
                }
            ]
        })
        
        # Örnek 2: Basit soru
        if objectives:
            examples.append({
                "messages": [
                    {
                        "role": "system",
                        "content": f"Sen {grade}. sınıf {subject} öğretmenisin."
                    },
                    {
                        "role": "user",
                        "content": f"{topic_title} konusunda örnek verir misin?"
                    },
                    {
                        "role": "assistant",
                        "content": f"Elbette! {objectives[0]} için bir örnek yapalım..."
                    }
                ]
            })
        
        return examples
    
    async def get_model_performance(self, model_name: str = "base") -> Dict[str, Any]:
        """
        Model performans metriklerini döndür
        """
        if model_name in self.models:
            return self.models[model_name]
        
        return {"error": "Model bulunamadı"}
    
    def get_training_recommendations(self) -> List[str]:
        """
        Model eğitimi için öneriler
        """
        return [
            "🎓 Öğrenci etkileşimlerini toplamaya devam edin (hedef: 1000+)",
            "📚 Her sınıf ve ders için dengeli veri toplayın",
            "✅ Başarılı etkileşimleri daha fazla kullanın",
            "🔄 Modeli düzenli aralıklarla güncelleyin (aylık)",
            "📊 A/B test yaparak model performansını ölçün",
            "🌐 Farklı öğrenme stillerine özel veri ekleyin",
            "🎯 Zorlanılan konular için daha fazla örnek oluşturun"
        ]


# Global instance
ai_model_trainer = AIModelTrainer()
