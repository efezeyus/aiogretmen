"""
Yapay Zeka Öğretmen - Yapay Zeka Şemaları
--------------------------------------
Yapay zeka işlemleri için API şemaları.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, validator


class DifficultyEnum(str, Enum):
    """Zorluk seviyesi."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class TeacherGenderEnum(str, Enum):
    """Öğretmen cinsiyet seçenekleri."""

    MALE = "male"
    FEMALE = "female"


class QuestionRequest(BaseModel):
    """Soru sorma isteği."""
    question: str = Field(..., description="Öğrencinin sorusu")
    grade: int = Field(..., ge=2, le=12, description="Öğrencinin sınıf seviyesi")
    subject: str = Field(..., description="Ders konusu")


class QuestionResponse(BaseModel):
    """Soru yanıtı şeması."""

    success: bool = True
    data: Dict[str, Any] = {
        "answer": str,
        "teacher_gender": TeacherGenderEnum,
    }


class TopicExplanationRequest(BaseModel):
    """Konu anlatımı isteği."""
    topic: str = Field(..., description="Açıklanacak konu başlığı")
    grade: int = Field(..., ge=2, le=12, description="Öğrencinin sınıf seviyesi")
    subject: str = Field(..., description="Ders konusu")
    difficulty: DifficultyEnum = Field(DifficultyEnum.MEDIUM, description="Zorluk seviyesi")


class ExplanationResponse(BaseModel):
    """Konu anlatımı yanıtı şeması."""

    success: bool = True
    data: Dict[str, Any] = {
        "explanation": str,
        "teacher_gender": TeacherGenderEnum,
        "topic": str,
        "grade": int,
        "subject": str,
    }


class GenerateQuestionsRequest(BaseModel):
    """Soru oluşturma isteği."""
    topic: str = Field(..., description="Soru konusu")
    count: int = Field(5, ge=1, le=10, description="İstenen soru sayısı")
    difficulty: DifficultyEnum = Field(DifficultyEnum.MEDIUM, description="Zorluk seviyesi")
    grade: int = Field(..., ge=2, le=12, description="Öğrencinin sınıf seviyesi")
    subject: str = Field(..., description="Ders konusu")


class QuestionOptionSchema(BaseModel):
    """Test sorusu seçeneği şeması."""

    text: str
    letter: str


class QuestionSchema(BaseModel):
    """Test sorusu şeması."""

    question: str
    options: List[str]
    correct_answer: str
    explanation: str


class QuestionsResponse(BaseModel):
    """Test soruları yanıtı şeması."""

    success: bool = True
    data: Dict[str, Any] = {
        "questions": List[QuestionSchema],
        "topic": str,
        "count": int,
        "difficulty": DifficultyEnum,
    }


class EvaluateAnswerRequest(BaseModel):
    """Cevap değerlendirme isteği."""
    question: str = Field(..., description="Soru metni")
    answer: str = Field(..., description="Öğrencinin cevabı")
    correct_answer: Optional[str] = Field(None, description="Doğru cevap (varsa)")


class AnswerEvaluationResponse(BaseModel):
    """Cevap değerlendirme yanıtı şeması."""

    success: bool = True
    data: Dict[str, Any] = {
        "evaluation": str,
        "teacher_gender": TeacherGenderEnum,
    }


class TeacherCharacterRequest(BaseModel):
    """Öğretmen karakteri seçimi şeması."""

    gender: TeacherGenderEnum = Field(...)


class QuestionOption(BaseModel):
    """Çoktan seçmeli soru seçeneği."""
    text: str
    is_correct: bool = False


class Question(BaseModel):
    """Test sorusu."""
    soru: str
    secenekler: List[str]
    dogru_cevap: str
    aciklama: Optional[str] = None


class AIResponse(BaseModel):
    """Temel yapay zeka yanıtı."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    token_usage: Optional[int] = None 