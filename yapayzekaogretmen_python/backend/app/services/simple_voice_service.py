"""
Simple Voice Service - Speech Recognition & Text-to-Speech
---------------------------------------------------------
Basitleştirilmiş ses tanıma ve metinden sese dönüştürme servisi.
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import asyncio
import base64
import io
import httpx
from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.translation_service import Language
from app.services.voice_service_base import (
    VoiceProvider, AudioFormat, VoiceGender, VoiceAge,
    VoiceProfile, SpeechRecognitionResult
)


class SimpleVoiceService:
    """Basit ses servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # OpenAI Whisper ayarları
        self.whisper_config = {
            "api_key": settings.OPENAI_API_KEY,
            "endpoint": "https://api.openai.com/v1/audio/transcriptions",
            "model": "whisper-1"
        }
        
        # Google TTS ayarları
        self.google_tts_config = {
            "api_key": settings.get("GOOGLE_CLOUD_API_KEY", ""),
            "endpoint": "https://texttospeech.googleapis.com/v1/text:synthesize"
        }
        
        # Basit ses profilleri
        self.voice_profiles = {
            "tr_female": {
                "language": "tr-TR",
                "name": "tr-TR-Wavenet-A",
                "gender": "FEMALE"
            },
            "tr_male": {
                "language": "tr-TR",
                "name": "tr-TR-Wavenet-B",
                "gender": "MALE"
            },
            "en_female": {
                "language": "en-US",
                "name": "en-US-Wavenet-F",
                "gender": "FEMALE"
            },
            "en_male": {
                "language": "en-US",
                "name": "en-US-Wavenet-D",
                "gender": "MALE"
            }
        }
        
        logger.info("Simple Voice Service başlatıldı")
    
    async def speech_to_text(
        self,
        audio_data: Union[bytes, str],
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sesi metne dönüştür"""
        # Base64'ten decode et
        if isinstance(audio_data, str):
            audio_data = base64.b64decode(audio_data)
        
        # Cache kontrolü
        audio_hash = hash(audio_data[:1000])  # İlk 1KB için hash
        cache_key = f"stt:{audio_hash}:{language or 'auto'}"
        cached = await cache.get(cache_key, namespace="voice")
        if cached:
            return cached
        
        # Whisper API çağrısı
        try:
            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.wav"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.whisper_config["endpoint"],
                    headers={"Authorization": f"Bearer {self.whisper_config['api_key']}"},
                    files={"file": audio_file},
                    data={
                        "model": self.whisper_config["model"],
                        "language": language if language else None
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Whisper API hatası: {response.text}")
                
                result = response.json()
            
            # Sonucu formatla
            formatted_result = {
                "text": result.get("text", ""),
                "language": result.get("language", language or "unknown"),
                "success": True
            }
            
            # Cache'e kaydet
            await cache.set(cache_key, formatted_result, ttl=3600, namespace="voice")
            
            # Geçmişe kaydet
            if self.db:
                await self.db.voice_transcriptions.insert_one({
                    "text": formatted_result["text"],
                    "language": formatted_result["language"],
                    "timestamp": datetime.utcnow()
                })
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"Speech-to-text hatası: {e}")
            return {
                "text": "",
                "success": False,
                "error": str(e)
            }
    
    async def text_to_speech(
        self,
        text: str,
        language: str = "tr",
        voice_type: str = "female",
        speed: float = 1.0
    ) -> Optional[bytes]:
        """Metni sese dönüştür"""
        # Voice profili seç
        voice_key = f"{language}_{voice_type}"
        voice_profile = self.voice_profiles.get(voice_key, self.voice_profiles["tr_female"])
        
        # Cache kontrolü
        cache_key = f"tts:{hash(text)}:{voice_key}:{speed}"
        cached = await cache.get(cache_key, namespace="voice")
        if cached:
            return base64.b64decode(cached)
        
        # Google TTS API çağrısı
        try:
            payload = {
                "input": {"text": text},
                "voice": {
                    "languageCode": voice_profile["language"],
                    "name": voice_profile["name"],
                    "ssmlGender": voice_profile["gender"]
                },
                "audioConfig": {
                    "audioEncoding": "MP3",
                    "speakingRate": speed
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.google_tts_config["endpoint"],
                    headers={"X-Goog-Api-Key": self.google_tts_config["api_key"]},
                    json=payload
                )
                
                if response.status_code != 200:
                    raise Exception(f"Google TTS API hatası: {response.text}")
                
                data = response.json()
            
            # Base64 audio'yu decode et
            audio_content = base64.b64decode(data["audioContent"])
            
            # Cache'e kaydet
            await cache.set(
                cache_key,
                data["audioContent"],  # Base64 olarak sakla
                ttl=86400,  # 1 gün
                namespace="voice"
            )
            
            return audio_content
            
        except Exception as e:
            logger.error(f"Text-to-speech hatası: {e}")
            return None
    
    async def create_lesson_audio(
        self,
        lesson_text: str,
        language: str = "tr",
        include_pauses: bool = True
    ) -> Optional[bytes]:
        """Ders içeriği için ses oluştur"""
        # Metin işleme
        if include_pauses:
            # Noktalama işaretlerinden sonra pause ekle
            lesson_text = lesson_text.replace(".", ". ")
            lesson_text = lesson_text.replace(",", ", ")
            lesson_text = lesson_text.replace("!", "! ")
            lesson_text = lesson_text.replace("?", "? ")
        
        # Yavaş okuma hızı
        return await self.text_to_speech(
            text=lesson_text,
            language=language,
            voice_type="female",
            speed=0.85  # %15 daha yavaş
        )
    
    async def pronunciation_check(
        self,
        student_audio: bytes,
        reference_text: str,
        language: str = "tr"
    ) -> Dict[str, Any]:
        """Telaffuz kontrolü"""
        # Öğrenci sesini tanı
        result = await self.speech_to_text(student_audio, language)
        
        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error")
            }
        
        # Basit benzerlik kontrolü
        from difflib import SequenceMatcher
        
        recognized_text = result["text"].lower().strip()
        reference_text = reference_text.lower().strip()
        
        similarity = SequenceMatcher(None, recognized_text, reference_text).ratio()
        
        # Sonuç
        return {
            "success": True,
            "recognized_text": result["text"],
            "reference_text": reference_text,
            "similarity_score": similarity,
            "is_correct": similarity >= 0.8,
            "feedback": self._get_pronunciation_feedback(similarity)
        }
    
    def _get_pronunciation_feedback(self, score: float) -> str:
        """Telaffuz geri bildirimi"""
        if score >= 0.95:
            return "Mükemmel! Telaffuzun harika! 🎉"
        elif score >= 0.8:
            return "Çok iyi! Küçük hatalar var ama anlaşılıyor. 👍"
        elif score >= 0.6:
            return "İyi deneme! Biraz daha pratik yapalım. 💪"
        else:
            return "Tekrar deneyelim. Yavaş ve net konuşmayı unutma. 🎯"
    
    async def get_available_voices(self, language: str = None) -> List[Dict]:
        """Mevcut sesleri getir"""
        voices = []
        
        for key, profile in self.voice_profiles.items():
            if language and not key.startswith(language):
                continue
            
            lang, voice_type = key.split("_")
            voices.append({
                "id": key,
                "language": lang,
                "type": voice_type,
                "name": f"{lang.upper()} {voice_type.capitalize()}"
            })
        
        return voices


# Global simple voice service instance
simple_voice_service = SimpleVoiceService()


# Helper functions
async def recognize_speech(audio_data: Union[bytes, str], language: str = None) -> str:
    """Basit ses tanıma"""
    result = await simple_voice_service.speech_to_text(audio_data, language)
    return result.get("text", "")


async def synthesize_speech(text: str, language: str = "tr") -> bytes:
    """Basit metin seslendirme"""
    return await simple_voice_service.text_to_speech(text, language)
