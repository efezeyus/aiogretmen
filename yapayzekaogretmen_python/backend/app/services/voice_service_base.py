"""
Voice Service Base - Speech Recognition & Text-to-Speech
-------------------------------------------------------
Ses tanıma ve metinden sese dönüştürme servisi - Temel sınıflar.
"""

from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import base64
import io
import wave
import json
from pathlib import Path
from dataclasses import dataclass, field
import numpy as np

from loguru import logger


class VoiceProvider(str, Enum):
    """Ses servisi sağlayıcıları"""
    WEB_SPEECH_API = "web_speech"     # Browser API
    GOOGLE_CLOUD = "google_cloud"      # Google Cloud Speech
    AMAZON_POLLY = "amazon_polly"      # Amazon Polly
    AZURE_SPEECH = "azure_speech"      # Azure Cognitive Services
    OPENAI_WHISPER = "openai_whisper"  # OpenAI Whisper
    ELEVENLABS = "elevenlabs"          # ElevenLabs (TTS)


class AudioFormat(str, Enum):
    """Ses formatları"""
    MP3 = "mp3"
    WAV = "wav"
    OGG = "ogg"
    WEBM = "webm"
    M4A = "m4a"


class VoiceGender(str, Enum):
    """Ses cinsiyeti"""
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class VoiceAge(str, Enum):
    """Ses yaş grubu"""
    CHILD = "child"
    TEEN = "teen"
    ADULT = "adult"
    SENIOR = "senior"


class SpeechMode(str, Enum):
    """Konuşma modu"""
    NORMAL = "normal"
    TEACHING = "teaching"      # Öğretici (yavaş ve net)
    STORYTELLING = "story"     # Hikaye anlatımı
    CONVERSATION = "chat"      # Sohbet
    READING = "reading"        # Kitap okuma


@dataclass
class VoiceProfile:
    """Ses profili"""
    id: str
    name: str
    language: str
    gender: VoiceGender
    age: VoiceAge
    provider: VoiceProvider
    voice_id: str  # Provider-specific ID
    sample_url: Optional[str] = None
    description: Optional[str] = None
    features: List[str] = field(default_factory=list)
    settings: Dict = field(default_factory=dict)


@dataclass
class SpeechRecognitionResult:
    """Ses tanıma sonucu"""
    text: str
    confidence: float
    language: str
    duration: float
    alternatives: List[Dict] = field(default_factory=list)
    words: List[Dict] = field(default_factory=list)  # Word-level timestamps
    metadata: Dict = field(default_factory=dict)


@dataclass
class TTSRequest:
    """Text-to-Speech isteği"""
    text: str
    voice_id: str
    language: str
    speed: float = 1.0
    pitch: float = 0.0
    volume: float = 1.0
    format: AudioFormat = AudioFormat.MP3
    mode: SpeechMode = SpeechMode.NORMAL
    ssml: bool = False  # SSML markup desteği


@dataclass
class AudioTranscription:
    """Ses transkripsiyonu"""
    id: str
    user_id: str
    audio_url: str
    text: str
    language: str
    duration: float
    created_at: datetime
    purpose: str  # homework, note, question, etc.
    metadata: Dict = field(default_factory=dict)
