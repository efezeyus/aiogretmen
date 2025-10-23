"""
AI Servis - Fine-tuned Model Desteği
MEB müfredatına uygun fine-tuned model entegrasyonu
"""

import os
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import openai
from openai import OpenAI
import logging
import requests

from app.core.config import settings
from app.core.logger import logger
# Circular import fix - moved to end of file
from app.services.ab_test_service import ab_test_service
from app.services.auto_learning_service import auto_learning_service


class AIService:
    """Fine-tuned model ve DeepSeek destekli AI servisi"""
    
    def __init__(self):
        # API anahtarları
        self.openai_api_key = settings.OPENAI_API_KEY
        self.deepseek_api_key = settings.DEEPSEEK_API_KEY
        self.huggingface_api_key = getattr(settings, 'HUGGINGFACE_API_KEY', '')
        
        # En az bir model kullanılabilir olmalı
        if not any([self.openai_api_key, self.deepseek_api_key, True]):  # HF her zaman kullanılabilir
            raise ValueError("En az bir API anahtarı gerekli!")
        
        # OpenAI client
        self.openai_client = OpenAI(api_key=self.openai_api_key) if self.openai_api_key else None
        
        # DeepSeek client (OpenAI uyumlu)
        self.deepseek_client = OpenAI(
            api_key=self.deepseek_api_key,
            base_url="https://api.deepseek.com/v1"
        ) if self.deepseek_api_key else None
        
        # Hugging Face endpoint
        self.huggingface_endpoint = getattr(settings, 'HUGGINGFACE_ENDPOINT', 'https://api-inference.huggingface.co/models/')
        self.huggingface_model = getattr(settings, 'HUGGINGFACE_MODEL_NAME', 'microsoft/DialoGPT-medium')
        
        # Model konfigürasyonu
        self.model_config = self._load_model_config()
        self.current_model, self.current_provider = self._select_best_model()
        
        logger.info(f"AI Service başlatıldı. Model: {self.current_model} (Provider: {self.current_provider})")
    
    def _load_model_config(self) -> Dict:
        """Model konfigürasyonunu yükle"""
        config_path = "config/ai_models.json"
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        else:
            # Varsayılan konfig
            return {
                "models": {
                    "fine_tuned": {
                        "name": None,  # Örnek: "ft:gpt-3.5-turbo:org:meb-ogretmen:8abc123"
                        "enabled": False,
                        "priority": 1,
                        "provider": "openai"
                    },
                    "deepseek_v3": {
                        "name": "deepseek-chat",  # DeepSeek-V3 modeli
                        "enabled": bool(self.deepseek_api_key),
                        "priority": 2,
                        "provider": "deepseek"
                    },
                    "deepseek_reasoner": {
                        "name": "deepseek-reasoner",  # DeepSeek-R1 reasoning modeli
                        "enabled": bool(self.deepseek_api_key),
                        "priority": 3,
                        "provider": "deepseek"
                    },
                    "gpt4": {
                        "name": "gpt-4",
                        "enabled": bool(self.openai_api_key),
                        "priority": 4,
                        "provider": "openai"
                    },
                    "gpt35": {
                        "name": "gpt-3.5-turbo",
                        "enabled": bool(self.openai_api_key),
                        "priority": 5,
                        "provider": "openai"
                    }
                },
                "fallback_enabled": True,
                "temperature": 0.7,
                "max_tokens": 800
            }
    
    def _select_best_model(self) -> Tuple[str, str]:
        """En uygun modeli seç (model_name, provider)"""
        available_models = [
            (m["name"], m["priority"], m.get("provider", "openai")) 
            for m in self.model_config["models"].values() 
            if m["enabled"] and m["name"]
        ]
        
        if not available_models:
            raise ValueError("Hiç kullanılabilir model yok!")
        
        # Önceliğe göre sırala ve ilkini seç
        available_models.sort(key=lambda x: x[1])
        model_name, _, provider = available_models[0]
        return model_name, provider
    
    async def get_ai_response(
        self,
        prompt: str,
        grade_level: int,
        subject: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None,
        user_name: Optional[str] = None,
        experiment_id: Optional[str] = None  # A/B test desteği
    ) -> Tuple[str, Dict]:
        """AI yanıtı al"""
        
        try:
            # A/B test varyant seçimi
            variant_id = None
            selected_model = self.current_model
            selected_provider = self.current_provider
            
            if experiment_id and user_name:  # A/B test aktifse
                try:
                    # Varyant ata
                    variant_id = await ab_test_service.assign_variant(user_name, experiment_id)
                    
                    # Varyanta göre model seç
                    if variant_id and variant_id != "control":
                        # A/B test modelini kullan
                        variant_models = {
                            "variant_a": ("deepseek-chat", "deepseek"),
                            "variant_b": ("deepseek-reasoner", "deepseek"),
                            "variant_c": ("gpt-3.5-turbo", "openai")
                        }
                        
                        if variant_id in variant_models:
                            selected_model, selected_provider = variant_models[variant_id]
                            logger.info(f"A/B test variant seçildi: {variant_id} -> {selected_model}")
                
                except Exception as e:
                    logger.warning(f"A/B test varyant seçimi başarısız: {e}")
            
            # Sistem promptu oluştur
            system_prompt = self._create_system_prompt(grade_level, subject, user_name)
            
            # Mesajları hazırla
            messages = [{"role": "system", "content": system_prompt}]
            
            # Konuşma geçmişi varsa ekle
            if conversation_history:
                messages.extend(conversation_history[-6:])  # Son 6 mesaj
            
            # Kullanıcı mesajı
            user_message = prompt
            if context:
                user_message = f"Bağlam: {context}\n\nSoru: {prompt}"
            
            messages.append({"role": "user", "content": user_message})
            
            # Model çağrısı (A/B test varsa seçilen modeli kullan)
            if variant_id and selected_provider:
                # Geçici olarak modeli değiştir
                original_model = self.current_model
                original_provider = self.current_provider
                self.current_model = selected_model
                self.current_provider = selected_provider
                
                try:
                    response = self._call_model_with_fallback(messages)
                finally:
                    # Orijinal modele geri dön
                    self.current_model = original_model
                    self.current_provider = original_provider
            else:
                response = self._call_model_with_fallback(messages)
            
            # Metadata
            metadata = {
                "model_used": getattr(response, 'model', self.current_model),
                "grade_level": grade_level,
                "subject": subject,
                "timestamp": datetime.utcnow().isoformat(),
                "tokens_used": getattr(response.usage, 'total_tokens', None) if hasattr(response, 'usage') and response.usage else None
            }
            
            # Yanıt
            ai_response = response.choices[0].message.content
            
            # Auto-learning için etkileşim verisini kaydet
            try:
                import asyncio
                interaction_data = {
                    "user_id": user_name,  # Geçici olarak user_name kullanıyoruz
                    "grade_level": grade_level,
                    "subject": subject,
                    "question": prompt,
                    "ai_response": ai_response,
                    "model_used": getattr(response, 'model', self.current_model),
                    "response_time": 1.0,  # Gerçek response time hesaplanabilir
                    "confidence_score": 0.9  # Model confidence score'u alınabilir
                }
                
                # Asenkron olarak kaydet (bloklamamak için)
                asyncio.create_task(
                    auto_learning_service.collect_learning_data(interaction_data)
                )
            except Exception as e:
                logger.warning(f"Auto-learning veri kaydı başarısız: {e}")
            
            # A/B test olayını kaydet
            if experiment_id and variant_id:
                try:
                    ab_event_data = {
                        "user_id": user_name or "anonymous",
                        "experiment_id": experiment_id,
                        "variant_id": variant_id,
                        "event_type": "ai_interaction",
                        "metrics": {
                            "response_time": 1.0,  # Gerçek süre hesaplanabilir
                            "model": metadata["model_used"],
                            "grade_level": grade_level,
                            "subject": subject
                        }
                    }
                    
                    asyncio.create_task(
                        ab_test_service.track_event(ab_event_data)
                    )
                except Exception as e:
                    logger.warning(f"A/B test olay kaydı başarısız: {e}")
            
            # Yanıtı döndür (emoji temizleme yapma)
            return ai_response, metadata
            
        except Exception as e:
            logger.error(f"AI yanıt hatası: {e}")
            return self._get_fallback_response(grade_level, subject), {
                "error": str(e),
                "fallback": True
            }
    
    def _clean_emoji_from_response(self, text: str) -> str:
        """AI yanıtından emojileri temizle ve daha doğal hale getir"""
        import re
        
        # Emoji pattern
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            u"\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
            u"\U00002600-\U000026FF"  # Miscellaneous Symbols
            u"\U00002700-\U000027BF"  # Dingbats
            "]+", flags=re.UNICODE)
        
        # Emojileri temizle
        text = emoji_pattern.sub('', text)
        
        # Emoji isimlerini temizle (örn: "gülen yüz", "kalp" vs.)
        emoji_names = [
            "gülen yüz", "gülümseyen yüz", "göz kırpan yüz", "kalp", "yıldız",
            "el sallama", "alkış", "düşünen yüz", "ampul", "kitap", "kalem",
            "not defteri", "roket", "parti", "konfeti", "balon", "hediye",
            "takvim", "saat", "çalar saat", "kum saati", "pusula", "harita",
            "dünya", "güneş", "ay", "yıldızlar", "bulut", "yağmur", "kar",
            "şimşek", "gökkuşağı", "dalga", "ateş", "patlama", "kıvılcım"
        ]
        
        for emoji_name in emoji_names:
            text = text.replace(f" {emoji_name} ", " ")
            text = text.replace(f"({emoji_name})", "")
            text = text.replace(f" {emoji_name}", "")
            text = text.replace(f"{emoji_name} ", "")
        
        # Çift boşlukları temizle
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _create_system_prompt(self, grade_level: int, subject: str, user_name: Optional[str] = None) -> str:
        """MEB müfredatına uygun sistem prompt'u oluştur"""
        
        grade_names = {
            1: "1. Sınıf", 2: "2. Sınıf", 3: "3. Sınıf", 4: "4. Sınıf",
            5: "5. Sınıf", 6: "6. Sınıf", 7: "7. Sınıf", 8: "8. Sınıf",
            9: "9. Sınıf", 10: "10. Sınıf", 11: "11. Sınıf", 12: "12. Sınıf"
        }
        
        grade_name = grade_names.get(grade_level, f"{grade_level}. Sınıf")
        
        user_info = f"Öğrencinin adı: {user_name}" if user_name else "Öğrencinin adı belirtilmemiş"
        
        system_prompt = f"""Sen Türkiye'nin en iyi yapay zeka öğretmenisin. {grade_name} {subject} dersinde uzmanlaşmışsın.

{user_info}

GÖREVİN:
- MEB müfredatına tam uyumlu öğretim yap
- Öğrencinin seviyesine göre kişiselleştirilmiş ders anlat
- Sade, anlaşılır ve eğlenceli bir dil kullan
- Türkçe konuş ve Türkçe yanıt ver
- Öğrencinin sorularını sabırla ve detaylıca yanıtla

ÖĞRETİM YÖNTEMİN:
- Konuyu basit örneklerle açıkla
- Görsel ve pratik örnekler kullan
- Öğrencinin anlayıp anlamadığını kontrol et
- Yanlış anlamaları nazikçe düzelt
- Başarıları takdir et ve motive et

ÖĞRETMEN ÖZELLİKLERİN:
- Öğrencinin önceki bilgilerini hatırla
- Zorluk seviyesini öğrencinin seviyesine göre ayarla
- Sorular sorarak öğrencinin düşünmesini sağla
- Gerçek hayat örnekleri ver
- Matematiksel hesaplamaları doğru yap

İLETİŞİM TARZIN:
- Dostça ve destekleyici ol
- Öğrencinin cesaretini kırma
- Hataları öğrenme fırsatı olarak gör
- Sabırlı ve anlayışlı ol
- Öğrencinin ilgi alanlarını dikkate al

{grade_name} {subject} MÜFREDATI:
- MEB'in {grade_name} {subject} müfredatına tam uyumlu ol
- Güncel eğitim yöntemlerini kullan
- Teknolojik araçları etkin kullan
- Öğrencinin gelişimini takip et

ÖNEMLİ KURALLAR:
- Emoji kullanabilirsin ama emojileri seslendirme
- Emoji isimlerini söyleme (örn: "gülen yüz emojisi" deme)
- Doğal ve akıcı bir Türkçe kullan
- Gerçek bir öğretmen gibi konuş
- Matematiksel sembolleri doğru oku:
  * için "çarpı" veya "kere"
  + için "artı" veya "toplama"
  - için "eksi" veya "çıkarma"
  / için "bölü" veya "bölme"
  = için "eşittir"

KONUŞMA STİLİ:
- Öğrencinin adıyla hitap et (varsa), yoksa direkt konuya gir
- Kısa ve anlaşılır cümleler kur
- Teknik terimleri açıkla
- Somut örnekler ver
- Öğrenciyi düşünmeye teşvik et
- "Anladın mı?", "Bir örnek daha yapalım mı?" gibi sorular sor
- Başarıyı "Aferin!", "Çok güzel!", "Harika!" gibi ifadelerle kutla
- Hataları "Tekrar deneyelim", "Şöyle düşünelim" gibi ifadelerle düzelt

YAPMA:
- Emoji isimlerini seslendirme
- Matematiksel sembolleri yanlış okuma
- Uzun ve karmaşık açıklamalar yapma
- Öğrenciyi küçümseme
- Konudan sapma
- Hazır cevaplar verme, düşünmeye yönlendir

Şimdi öğrencinin sorularını yanıtla ve dersini anlat!"""
        
        return system_prompt
    
    def _call_model_with_fallback(self, messages: List[Dict]) -> any:
        """Model çağrısı yap ve gerekirse fallback kullan"""
        
        # DeepSeek öncelikli olarak kullan
        if self.deepseek_client and self.current_provider == "deepseek":
            try:
                logger.info(f"DeepSeek model çağrısı: {self.current_model}")
                response = self.deepseek_client.chat.completions.create(
                    model=self.current_model,
                    messages=messages,
                    temperature=self.model_config.get("temperature", 0.7),
                    max_tokens=self.model_config.get("max_tokens", 800),
                    stream=False
                )
                logger.info("DeepSeek yanıtı başarılı")
                return response
            except Exception as e:
                logger.error(f"DeepSeek hatası: {e}")
                # Hugging Face'e geç
                if self.model_config.get("fallback_enabled", True):
                    return self._call_huggingface_model(messages)
                else:
                    raise e
        
        # OpenAI fallback
        elif self.openai_client:
            try:
                logger.info(f"OpenAI model çağrısı: {self.current_model}")
                response = self.openai_client.chat.completions.create(
                    model=self.current_model,
                    messages=messages,
                    temperature=self.model_config.get("temperature", 0.7),
                    max_tokens=self.model_config.get("max_tokens", 800),
                    stream=False
                )
                logger.info("OpenAI yanıtı başarılı")
                return response
            except Exception as e:
                logger.error(f"OpenAI hatası: {e}")
                return self._call_huggingface_model(messages)
        
        else:
            raise ValueError("Hiç kullanılabilir AI modeli yok!")
    
    def _call_huggingface_model(self, messages: List[Dict]) -> any:
        """Hugging Face model çağrısı"""
        logger.info(f"Hugging Face model çağrısı: {self.huggingface_model}")
        
        try:
            # Son kullanıcı mesajını al
            user_message = ""
            for message in reversed(messages):
                if message.get("role") == "user":
                    user_message = message.get("content", "")
                    break
            
            # Hugging Face API çağrısı
            headers = {}
            if self.huggingface_api_key:
                headers["Authorization"] = f"Bearer {self.huggingface_api_key}"
            
            # Türkçe eğitim asistanı için özel model kullanalım
            # Alternatif modeller:
            # - "dbmdz/bert-base-turkish-cased" (BERT tabanlı)
            # - "ytu-ce-cosmos/turkish-gpt2-large" (GPT-2 tabanlı)
            # - "google/gemma-2b" (Çok dilli)
            model_url = "https://api-inference.huggingface.co/models/google/flan-t5-base"
            
            # Prompt'u daha iyi yapılandıralım
            prompt = f"""Sen yardımsever bir matematik öğretmenisin. Öğrencinin sorusuna Türkçe olarak açık ve anlaşılır bir şekilde cevap ver.

Öğrenci: {user_message}
Öğretmen:"""
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 250,
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "do_sample": True
                }
            }
            
            response = requests.post(model_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "")
                    # Sadece öğretmen yanıtını al
                    if "Öğretmen:" in generated_text:
                        answer = generated_text.split("Öğretmen:")[-1].strip()
                    else:
                        answer = generated_text
                    
                    # OpenAI formatında yanıt döndür
                    return type('Response', (), {
                        'choices': [type('Choice', (), {
                            'message': type('Message', (), {
                                'content': answer
                            })()
                        })()]
                    })()
            
            logger.error(f"Hugging Face API hatası: {response.status_code} - {response.text}")
            # Fallback'e geç
            return self._call_fallback_model(messages)
            
        except Exception as e:
            logger.error(f"Hugging Face hatası: {e}")
            return self._call_fallback_model(messages)
    
    def _call_fallback_model(self, messages: List[Dict]) -> any:
        """Fallback model çağrısı"""
        logger.info("Fallback model kullanılıyor...")
        
        # Son kullanıcı mesajını al
        user_message = ""
        grade_level = 5
        subject = "matematik"
        
        for message in reversed(messages):
            if message.get("role") == "user":
                user_message = message.get("content", "")
                break
        
        # Mesajdan sınıf ve konu bilgisini çıkar
        if "5. sınıf" in user_message or "5 sınıf" in user_message:
            grade_level = 5
        elif "6. sınıf" in user_message or "6 sınıf" in user_message:
            grade_level = 6
        elif "7. sınıf" in user_message or "7 sınıf" in user_message:
            grade_level = 7
        elif "8. sınıf" in user_message or "8 sınıf" in user_message:
            grade_level = 8
        
        if "türkçe" in user_message.lower() or "turkce" in user_message.lower():
            subject = "turkce"
        elif "fen" in user_message.lower():
            subject = "fen"
        elif "matematik" in user_message.lower() or "matematik" not in user_message.lower():
            subject = "matematik"
        
        # Basit fallback yanıtı
        fallback_response = type('Response', (), {
            'choices': [type('Choice', (), {
                'message': type('Message', (), {
                    'content': self._get_fallback_response(grade_level, subject, user_message)
                })()
            })()]
        })()
        
        return fallback_response
    
    def _get_fallback_response(self, grade_level: int, subject: str, user_message: str = "") -> str:
        """Fallback yanıtı"""
        
        # Kullanıcı mesajını analiz et
        message_lower = user_message.lower()
        
        # Kesirler konusu için özel yanıt
        if "kesir" in message_lower:
            if grade_level == 5:
                return """**Kesirler Konusu - 5. Sınıf**

**Kesir Nedir?**
Bir bütünün eş parçalarından bir veya birkaçını gösteren sayılara kesir diyoruz.

**Örnek:** Bir pizzayı 4 eş parçaya böldük ve 1 dilim yedik.
- **Pay (1):** Yediğimiz dilim sayısı (üstteki sayı)
- **Payda (4):** Toplam parça sayısı (alttaki sayı)
Sonuç: **1/4** (Dörtte bir)

**Kesir Çeşitleri:**
1. **Basit Kesir:** Pay paydadan küçükse (2/5)
2. **Bileşik Kesir:** Pay paydadan büyükse (7/3)
3. **Tam Sayılı Kesir:** Bir tam sayı + basit kesir (1 tam 3/4)

**Pratik Örnek:** 6/9'u sadeleştir! (Cevap: 2/3)

Başka bir konuda yardıma ihtiyacınız var mı?"""
        
        # Matematik genel
        elif "matematik" in message_lower or subject == "matematik":
            if grade_level == 5:
                return """**5. Sınıf Matematik**

Size şu konularda yardımcı olabilirim:
• **Kesirler** - Pay, payda, sadeleştirme
• **Ondalık Sayılar** - Toplama, çıkarma, çarpma
• **Geometri** - Çevre, alan, hacim
• **Problem Çözme** - Adım adım çözümler

Hangi konuda sorunuz var?"""
        
        # Türkçe
        elif "türkçe" in message_lower or "turkce" in message_lower or subject == "turkce":
            if grade_level == 5:
                return """**5. Sınıf Türkçe**

Size şu konularda yardımcı olabilirim:
• **Okuma** - Anlama, yorumlama
• **Yazma** - Kompozisyon, hikaye
• **Dil Bilgisi** - İsim, sıfat, fiil
• **Yazım Kuralları** - Büyük harf, noktalama

Hangi konuda sorunuz var?"""
        
        # Fen
        elif "fen" in message_lower or subject == "fen":
            if grade_level == 5:
                return """**5. Sınıf Fen Bilimleri**

Size şu konularda yardımcı olabilirim:
• **Madde** - Katı, sıvı, gaz
• **Kuvvet** - Hareket, sürtünme
• **Enerji** - Isı, ışık, ses
• **Canlılar** - Bitkiler, hayvanlar

Hangi konuda sorunuz var?"""
        
        # Genel selamlama
        elif "merhaba" in message_lower or "selam" in message_lower or not user_message:
            return f"Merhaba! {grade_level}. sınıf {subject} konusunda size yardımcı olmaya çalışacağım. Hangi konuda sorunuz var?"
        
        # Varsayılan yanıt
        else:
            return f"Merhaba! {grade_level}. sınıf {subject} konusunda size yardımcı olmaya çalışacağım. Hangi konuda sorunuz var?"
    
    def analyze_student_question(self, question: str) -> Dict:
        """Öğrenci sorusunu analiz et"""
        try:
            # Basit analiz (gelişmiş versiyonda NLP kullanılabilir)
            analysis = {
                "detected_grade": None,
                "detected_subject": None,
                "question_type": None,
                "keywords": []
            }
            
            # Sınıf tespiti
            for grade in range(1, 13):
                if f"{grade}. sınıf" in question.lower() or f"{grade} sınıf" in question.lower():
                    analysis["detected_grade"] = grade
                    break
            
            # Konu tespiti
            subjects = {
                "matematik": ["matematik", "sayı", "işlem", "problem", "geometri"],
                "turkce": ["türkçe", "dil bilgisi", "paragraf", "okuma", "yazma"],
                "fen": ["fen", "deney", "doğa", "bilim"],
                "fizik": ["fizik", "kuvvet", "hareket", "enerji"],
                "kimya": ["kimya", "element", "bileşik", "reaksiyon"],
                "biyoloji": ["biyoloji", "hücre", "canlı", "organ"]
            }
            
            question_lower = question.lower()
            for subject, keywords in subjects.items():
                if any(kw in question_lower for kw in keywords):
                    analysis["detected_subject"] = subject
                    break
            
            # Soru tipi
            if "?" in question:
                if "nedir" in question_lower or "ne demek" in question_lower:
                    analysis["question_type"] = "definition"
                elif "nasıl" in question_lower:
                    analysis["question_type"] = "how_to"
                elif "neden" in question_lower or "niçin" in question_lower:
                    analysis["question_type"] = "why"
                else:
                    analysis["question_type"] = "general"
            
            return analysis
            
        except Exception as e:
            logger.error(f"Soru analiz hatası: {e}")
            return {}
    
    def update_fine_tuned_model(self, model_name: str):
        """Fine-tuned modeli güncelle"""
        try:
            # Konfigürasyonu güncelle
            self.model_config["models"]["fine_tuned"]["name"] = model_name
            self.model_config["models"]["fine_tuned"]["enabled"] = True
            
            # Dosyaya kaydet
            os.makedirs("config", exist_ok=True)
            with open("config/ai_models.json", "w") as f:
                json.dump(self.model_config, f, indent=2)
            
            # Aktif modeli güncelle
            self.current_model, self.current_provider = self._select_best_model()
            
            logger.info(f"Fine-tuned model güncellendi: {model_name}")
            return True
            
        except Exception as e:
            logger.error(f"Model güncelleme hatası: {e}")
            return False
    
    def get_model_info(self) -> Dict:
        """Model bilgilerini getir"""
        return {
            "current_model": self.current_model,
            "current_provider": self.current_provider,
            "available_models": [
                {
                    "type": model_type,
                    "name": info["name"],
                    "enabled": info["enabled"],
                    "priority": info["priority"],
                    "provider": info.get("provider", "openai")
                }
                for model_type, info in self.model_config["models"].items()
            ],
            "fallback_enabled": self.model_config.get("fallback_enabled", True),
            "providers": {
                "openai": {"enabled": bool(self.openai_api_key)},
                "deepseek": {"enabled": bool(self.deepseek_api_key)}
            }
        }


# Singleton instance
ai_service = AIService() 