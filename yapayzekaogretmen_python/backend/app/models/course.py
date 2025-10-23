"""
Yapay Zeka Öğretmen - Kurs Modeli
---------------------------------
Kurs ve ders içeriği ile ilgili veri modelleri.
"""
from typing import List, Optional
from datetime import datetime
from enum import Enum
from beanie import Document, Link
from pydantic import BaseModel, Field

from app.models.user import User


class CourseStatus(str, Enum):
    """Kurs durumu."""
    DRAFT = "draft"  # Taslak
    PUBLISHED = "published"  # Yayınlanmış
    ARCHIVED = "archived"  # Arşivlenmiş


class ContentType(str, Enum):
    """İçerik türü."""
    VIDEO = "video"  # Video
    DOCUMENT = "document"  # Doküman
    QUIZ = "quiz"  # Quiz
    ASSIGNMENT = "assignment"  # Ödev
    PRESENTATION = "presentation"  # Sunum


class QuizQuestion(BaseModel):
    """Quiz sorusu."""
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None


class CourseContent(BaseModel):
    """Kurs içeriği."""
    title: str
    description: Optional[str] = None
    type: ContentType
    order: int
    duration_minutes: Optional[int] = None  # Tahmini süre, dakika olarak
    content_url: Optional[str] = None  # Dosya URL'si
    content_text: Optional[str] = None  # HTML içerik
    quiz_questions: Optional[List[QuizQuestion]] = None  # Quiz soruları
    is_required: bool = True  # Tamamlanması zorunlu mu?


class CourseSection(BaseModel):
    """Kurs bölümü."""
    title: str
    description: Optional[str] = None
    order: int
    contents: List[CourseContent] = []


class Course(Document):
    """Kurs modeli."""
    title: str
    description: str
    category: str  # Matematik, Fen, Türkçe vb.
    sub_category: Optional[str] = None  # Alt kategori
    image_url: Optional[str] = None
    instructor: Link[User]
    status: CourseStatus = CourseStatus.DRAFT
    level: str  # Başlangıç, Orta, İleri veya sınıf seviyesi
    prerequisites: List[str] = []  # Ön koşullar
    learning_objectives: List[str] = []  # Öğrenme hedefleri
    sections: List[CourseSection] = []
    price: float = 0  # Ücretsizse 0
    is_featured: bool = False  # Öne çıkarılmış kurs mu?
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "courses"
        

class CourseProgress(Document):
    """Kullanıcı kurs ilerleme durumu."""
    user: Link[User]
    course: Link[Course]
    completed_content_ids: List[str] = []  # Tamamlanan içerik ID'leri
    last_accessed_content_id: Optional[str] = None  # Son erişilen içerik
    quiz_scores: dict = {}  # {quiz_id: score}
    progress_percentage: float = 0  # İlerleme yüzdesi
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "course_progress"
        
        
class Certificate(Document):
    """Kurs tamamlama sertifikası."""
    user: Link[User]
    course: Link[Course]
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    certificate_id: str  # Benzersiz sertifika ID
    certificate_url: Optional[str] = None  # Sertifika PDF URL'si
    
    class Settings:
        name = "certificates" 