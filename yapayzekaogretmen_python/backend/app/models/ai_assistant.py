"""
Yapay Zeka Öğretmen - Yapay Zeka Asistanı Modeli
---------------------------------
Öğrenci asistanı, içerik önerisi ve kişiselleştirme için yapay zeka modelleri.
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from beanie import Document, Link
from pydantic import BaseModel, Field

from app.models.user import User
from app.models.course import Course, CourseContent


class AssistantType(str, Enum):
    """Asistan türü."""
    LEARNING_ASSISTANT = "learning_assistant"  # Öğrenme asistanı
    TEACHER_ASSISTANT = "teacher_assistant"  # Öğretmen asistanı
    CONTENT_CREATOR = "content_creator"  # İçerik oluşturucu


class AssistantPrompt(BaseModel):
    """Asistan için hazır sorgu şablonu."""
    title: str
    prompt_template: str
    assistant_type: AssistantType
    description: Optional[str] = None
    is_active: bool = True
    

class AIAssistant(Document):
    """Yapay zeka asistanı modeli."""
    name: str
    description: Optional[str] = None
    assistant_type: AssistantType
    model_name: str = "gpt-3.5-turbo"  # Varsayılan model
    is_active: bool = True
    system_prompt: str
    prompt_templates: List[AssistantPrompt] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "ai_assistants"


class AssistantMessage(BaseModel):
    """Asistan mesajı modeli."""
    role: str  # "user", "assistant" veya "system"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AssistantConversation(Document):
    """Asistan ile yapılan konuşma modeli."""
    user: Link[User]
    assistant: Link[AIAssistant]
    course: Optional[Link[Course]] = None
    content: Optional[Link[CourseContent]] = None
    messages: List[AssistantMessage] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "assistant_conversations"


class LearningAnalysis(Document):
    """Öğrenci öğrenme analizi."""
    user: Link[User]
    course: Link[Course]
    strengths: List[str] = []  # Güçlü olduğu konular
    weaknesses: List[str] = []  # Zayıf olduğu konular
    learning_style: str = "visual"  # Öğrenme stili: visual, auditory, reading, kinesthetic
    recommended_content: List[str] = []  # Önerilen içerik ID'leri
    recommended_courses: List[str] = []  # Önerilen kurs ID'leri
    ai_generated_insights: str = ""  # AI tarafından oluşturulan içgörüler
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "learning_analyses"


class QuizGeneration(Document):
    """Otomatik oluşturulan quiz modeli."""
    course: Link[Course]
    content: Optional[Link[CourseContent]] = None
    creator: Link[User]  # Oluşturan öğretmen
    subject: str
    difficulty_level: str = "medium"  # easy, medium, hard
    generated_questions: List[Dict[str, Any]] = []  # Oluşturulan sorular
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "quiz_generations"


class PersonalizedLearningPath(Document):
    """Kişiselleştirilmiş öğrenme yolu."""
    user: Link[User]
    learning_goal: str
    recommended_courses: List[Link[Course]] = []
    recommended_order: List[str] = []  # Kurs/içerik ID'lerinin önerilen sırası
    estimated_completion_time: int = 0  # Tahmini tamamlama süresi (dakika)
    ai_explanation: str = ""  # AI'ın önerme mantığının açıklaması
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "personalized_learning_paths" 