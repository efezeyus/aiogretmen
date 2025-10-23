"""
GraphQL Schema Definition
------------------------
Modern GraphQL API for flexible data fetching.
"""

import strawberry
from strawberry.types import Info
from typing import List, Optional, Union
from datetime import datetime
import asyncio

from app.core.logger import logger
from app.db.mongodb import get_database
from app.services.ai_service import ai_service
from app.services.cache_service import cache, cached


# GraphQL Types
@strawberry.type
class User:
    id: str
    username: str
    email: str
    full_name: str
    role: str
    grade_level: Optional[int] = None
    created_at: datetime
    is_active: bool = True
    
    @strawberry.field
    async def lessons(self) -> List["Lesson"]:
        """Kullanıcının derslerini getir"""
        db = get_database()
        if not db:
            return []
        
        lessons_data = await db.lessons.find({"user_id": self.id}).to_list(100)
        return [
            Lesson(
                id=str(lesson["_id"]),
                title=lesson["title"],
                subject=lesson["subject"],
                grade_level=lesson["grade_level"],
                created_at=lesson.get("created_at", datetime.utcnow())
            )
            for lesson in lessons_data
        ]
    
    @strawberry.field
    async def progress(self) -> "UserProgress":
        """Kullanıcının genel ilerlemesi"""
        # Cache'den kontrol et
        cache_key = f"user_progress:{self.id}"
        cached_progress = await cache.get(cache_key, namespace="user")
        
        if cached_progress:
            return UserProgress(**cached_progress)
        
        # Hesapla
        db = get_database()
        if not db:
            return UserProgress(total_lessons=0, completed_lessons=0, average_score=0)
        
        total = await db.lessons.count_documents({"user_id": self.id})
        completed = await db.lesson_progress.count_documents({
            "user_id": self.id,
            "status": "completed"
        })
        
        progress_data = {
            "total_lessons": total,
            "completed_lessons": completed,
            "average_score": 85.5  # Örnek
        }
        
        # Cache'e kaydet
        await cache.set(cache_key, progress_data, ttl=300, namespace="user")
        
        return UserProgress(**progress_data)


@strawberry.type
class Lesson:
    id: str
    title: str
    subject: str
    grade_level: int
    created_at: datetime
    duration_minutes: int = 45
    
    @strawberry.field
    async def content(self) -> "LessonContent":
        """Ders içeriğini getir"""
        # Örnek içerik
        return LessonContent(
            introduction="Ders giriş metni",
            main_content="Ana içerik",
            summary="Özet",
            resources=["Kaynak 1", "Kaynak 2"]
        )
    
    @strawberry.field
    async def quiz(self) -> Optional["Quiz"]:
        """Derse ait quiz"""
        db = get_database()
        if not db:
            return None
        
        quiz_data = await db.quizzes.find_one({"lesson_id": self.id})
        if not quiz_data:
            return None
        
        return Quiz(
            id=str(quiz_data["_id"]),
            title=quiz_data["title"],
            question_count=len(quiz_data.get("questions", []))
        )


@strawberry.type
class LessonContent:
    introduction: str
    main_content: str
    summary: str
    resources: List[str]


@strawberry.type
class Quiz:
    id: str
    title: str
    question_count: int
    passing_score: int = 70
    
    @strawberry.field
    async def questions(self) -> List["Question"]:
        """Quiz sorularını getir"""
        # Örnek sorular
        return [
            Question(
                id="1",
                text="Soru 1",
                options=["A", "B", "C", "D"],
                correct_answer="A"
            )
        ]


@strawberry.type
class Question:
    id: str
    text: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


@strawberry.type
class UserProgress:
    total_lessons: int
    completed_lessons: int
    average_score: float
    
    @property
    def completion_rate(self) -> float:
        if self.total_lessons == 0:
            return 0
        return (self.completed_lessons / self.total_lessons) * 100


@strawberry.type
class AIResponse:
    id: str
    question: str
    response: str
    model_used: str
    confidence: float
    created_at: datetime
    
    @strawberry.field
    async def feedback(self) -> Optional["Feedback"]:
        """AI yanıtına verilen geri bildirim"""
        db = get_database()
        if not db:
            return None
        
        feedback_data = await db.ai_feedback.find_one({"response_id": self.id})
        if not feedback_data:
            return None
        
        return Feedback(
            rating=feedback_data["rating"],
            comment=feedback_data.get("comment")
        )


@strawberry.type
class Feedback:
    rating: int  # 1-5
    comment: Optional[str] = None


@strawberry.type
class SearchResult:
    """Arama sonucu"""
    id: str
    title: str
    type: str  # lesson, quiz, user
    relevance_score: float
    highlight: Optional[str] = None


@strawberry.type
class SystemStats:
    """Sistem istatistikleri"""
    total_users: int
    active_users: int
    total_lessons: int
    total_ai_interactions: int
    average_satisfaction: float
    
    @strawberry.field
    async def trending_subjects(self) -> List[str]:
        """Popüler konular"""
        # Cache'den al
        cached = await cache.get("trending_subjects", namespace="analytics")
        if cached:
            return cached
        
        # Hesapla ve cache'le
        subjects = ["Matematik", "Fen Bilgisi", "Türkçe", "İngilizce"]
        await cache.set("trending_subjects", subjects, ttl=3600, namespace="analytics")
        
        return subjects


# Input Types
@strawberry.input
class CreateUserInput:
    username: str
    email: str
    password: str
    full_name: str
    role: str = "student"
    grade_level: Optional[int] = None


@strawberry.input
class CreateLessonInput:
    title: str
    subject: str
    grade_level: int
    content: str
    duration_minutes: int = 45


@strawberry.input
class AIQuestionInput:
    question: str
    grade_level: int
    subject: str
    context: Optional[str] = None
    include_resources: bool = False


@strawberry.input
class SearchInput:
    query: str
    type: Optional[str] = None  # lesson, quiz, user
    grade_level: Optional[int] = None
    subject: Optional[str] = None
    limit: int = 10


# Subscription Types
@strawberry.type
class LessonProgressUpdate:
    """Ders ilerleme güncellemesi"""
    user_id: str
    lesson_id: str
    progress: int  # 0-100
    timestamp: datetime


@strawberry.type
class OnlineUserUpdate:
    """Online kullanıcı güncellemesi"""
    user_id: str
    status: str  # online, offline, away
    timestamp: datetime


@strawberry.type
class AIStreamResponse:
    """AI streaming yanıtı"""
    chunk: str
    is_final: bool
    token_count: int


# Query Root
@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info: Info) -> Optional[User]:
        """Mevcut kullanıcı bilgisi"""
        # Auth kontrolü yapılacak
        user_id = info.context.get("user_id", "demo_user")
        
        db = get_database()
        if not db:
            return None
        
        user_data = await db.users.find_one({"_id": user_id})
        if not user_data:
            return None
        
        return User(
            id=str(user_data["_id"]),
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            grade_level=user_data.get("grade_level"),
            created_at=user_data.get("created_at", datetime.utcnow())
        )
    
    @strawberry.field
    async def user(self, id: str) -> Optional[User]:
        """Kullanıcı detayı"""
        db = get_database()
        if not db:
            return None
        
        user_data = await db.users.find_one({"_id": id})
        if not user_data:
            return None
        
        return User(
            id=str(user_data["_id"]),
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            grade_level=user_data.get("grade_level"),
            created_at=user_data.get("created_at", datetime.utcnow())
        )
    
    @strawberry.field
    async def users(self, limit: int = 10, offset: int = 0) -> List[User]:
        """Kullanıcı listesi"""
        db = get_database()
        if not db:
            return []
        
        users_data = await db.users.find().skip(offset).limit(limit).to_list(limit)
        
        return [
            User(
                id=str(user["_id"]),
                username=user["username"],
                email=user["email"],
                full_name=user["full_name"],
                role=user["role"],
                grade_level=user.get("grade_level"),
                created_at=user.get("created_at", datetime.utcnow())
            )
            for user in users_data
        ]
    
    @strawberry.field
    async def lesson(self, id: str) -> Optional[Lesson]:
        """Ders detayı"""
        db = get_database()
        if not db:
            return None
        
        lesson_data = await db.lessons.find_one({"_id": id})
        if not lesson_data:
            return None
        
        return Lesson(
            id=str(lesson_data["_id"]),
            title=lesson_data["title"],
            subject=lesson_data["subject"],
            grade_level=lesson_data["grade_level"],
            created_at=lesson_data.get("created_at", datetime.utcnow())
        )
    
    @strawberry.field
    @cached(namespace="graphql", ttl=300)
    async def lessons(
        self,
        subject: Optional[str] = None,
        grade_level: Optional[int] = None,
        limit: int = 20
    ) -> List[Lesson]:
        """Ders listesi (cached)"""
        db = get_database()
        if not db:
            return []
        
        query = {}
        if subject:
            query["subject"] = subject
        if grade_level:
            query["grade_level"] = grade_level
        
        lessons_data = await db.lessons.find(query).limit(limit).to_list(limit)
        
        return [
            Lesson(
                id=str(lesson["_id"]),
                title=lesson["title"],
                subject=lesson["subject"],
                grade_level=lesson["grade_level"],
                created_at=lesson.get("created_at", datetime.utcnow())
            )
            for lesson in lessons_data
        ]
    
    @strawberry.field
    async def search(self, input: SearchInput) -> List[SearchResult]:
        """Genel arama"""
        # Basit arama implementasyonu
        results = []
        
        # Cache'den kontrol et
        cache_key = f"search:{input.query}:{input.type}:{input.grade_level}"
        cached_results = await cache.get(cache_key, namespace="search")
        
        if cached_results:
            return [SearchResult(**r) for r in cached_results]
        
        # Örnek sonuçlar
        if "matematik" in input.query.lower():
            results.append(
                SearchResult(
                    id="1",
                    title="Matematik - Kesirler",
                    type="lesson",
                    relevance_score=0.95,
                    highlight="<b>Matematik</b> dersinde kesirler konusu"
                )
            )
        
        # Cache'e kaydet
        await cache.set(
            cache_key,
            [r.__dict__ for r in results],
            ttl=600,
            namespace="search"
        )
        
        return results
    
    @strawberry.field
    async def system_stats(self) -> SystemStats:
        """Sistem istatistikleri"""
        db = get_database()
        
        if not db:
            return SystemStats(
                total_users=0,
                active_users=0,
                total_lessons=0,
                total_ai_interactions=0,
                average_satisfaction=0
            )
        
        # Paralel sorgular
        results = await asyncio.gather(
            db.users.count_documents({}),
            db.users.count_documents({"is_active": True}),
            db.lessons.count_documents({}),
            db.ai_interactions.count_documents({}) if db.ai_interactions else asyncio.sleep(0)
        )
        
        return SystemStats(
            total_users=results[0],
            active_users=results[1],
            total_lessons=results[2],
            total_ai_interactions=results[3] if isinstance(results[3], int) else 0,
            average_satisfaction=0.87  # Örnek
        )


# Mutation Root
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_user(self, input: CreateUserInput) -> User:
        """Yeni kullanıcı oluştur"""
        db = get_database()
        if not db:
            raise Exception("Database connection error")
        
        # Kullanıcı verisi
        user_data = {
            "username": input.username,
            "email": input.email,
            "password": input.password,  # Hash'lenmeli
            "full_name": input.full_name,
            "role": input.role,
            "grade_level": input.grade_level,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = await db.users.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        
        return User(
            id=str(user_data["_id"]),
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            grade_level=user_data.get("grade_level"),
            created_at=user_data["created_at"]
        )
    
    @strawberry.mutation
    async def create_lesson(self, input: CreateLessonInput) -> Lesson:
        """Yeni ders oluştur"""
        db = get_database()
        if not db:
            raise Exception("Database connection error")
        
        lesson_data = {
            "title": input.title,
            "subject": input.subject,
            "grade_level": input.grade_level,
            "content": input.content,
            "duration_minutes": input.duration_minutes,
            "created_at": datetime.utcnow()
        }
        
        result = await db.lessons.insert_one(lesson_data)
        lesson_data["_id"] = result.inserted_id
        
        # Cache'i invalidate et
        await cache.clear_namespace("graphql")
        
        return Lesson(
            id=str(lesson_data["_id"]),
            title=lesson_data["title"],
            subject=lesson_data["subject"],
            grade_level=lesson_data["grade_level"],
            created_at=lesson_data["created_at"]
        )
    
    @strawberry.mutation
    async def ask_ai(self, input: AIQuestionInput) -> AIResponse:
        """AI'ya soru sor"""
        # AI servisinden yanıt al
        response, metadata = await ai_service.get_ai_response(
            prompt=input.question,
            grade_level=input.grade_level,
            subject=input.subject,
            context=input.context
        )
        
        # Kaydet
        db = get_database()
        if db:
            ai_data = {
                "question": input.question,
                "response": response,
                "model_used": metadata.get("model_used", "unknown"),
                "confidence": 0.9,
                "created_at": datetime.utcnow(),
                "metadata": metadata
            }
            
            result = await db.ai_interactions.insert_one(ai_data)
            response_id = str(result.inserted_id)
        else:
            response_id = "temp_id"
        
        return AIResponse(
            id=response_id,
            question=input.question,
            response=response,
            model_used=metadata.get("model_used", "unknown"),
            confidence=0.9,
            created_at=datetime.utcnow()
        )
    
    @strawberry.mutation
    async def update_lesson_progress(
        self,
        lesson_id: str,
        progress: int,
        user_id: Optional[str] = None
    ) -> bool:
        """Ders ilerlemesini güncelle"""
        db = get_database()
        if not db:
            return False
        
        # Progress güncelle
        await db.lesson_progress.update_one(
            {"user_id": user_id or "demo_user", "lesson_id": lesson_id},
            {
                "$set": {
                    "progress": progress,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        # Cache'i invalidate et
        cache_key = f"user_progress:{user_id or 'demo_user'}"
        await cache.delete(cache_key, namespace="user")
        
        return True


# Subscription Root
@strawberry.type
class Subscription:
    @strawberry.subscription
    async def lesson_progress(self, user_id: str) -> LessonProgressUpdate:
        """Ders ilerleme güncellemelerini dinle"""
        # WebSocket üzerinden gerçek zamanlı güncellemeler
        while True:
            await asyncio.sleep(5)  # Simülasyon
            
            yield LessonProgressUpdate(
                user_id=user_id,
                lesson_id="lesson_123",
                progress=50,
                timestamp=datetime.utcnow()
            )
    
    @strawberry.subscription
    async def online_users(self) -> OnlineUserUpdate:
        """Online kullanıcı güncellemelerini dinle"""
        while True:
            await asyncio.sleep(3)  # Simülasyon
            
            yield OnlineUserUpdate(
                user_id="user_123",
                status="online",
                timestamp=datetime.utcnow()
            )
    
    @strawberry.subscription
    async def ai_stream(self, input: AIQuestionInput) -> AIStreamResponse:
        """AI yanıtını streaming olarak al"""
        # AI yanıtını parçalar halinde gönder
        full_response = "Bu bir örnek AI yanıtıdır. Streaming olarak gönderiliyor."
        words = full_response.split()
        
        for i, word in enumerate(words):
            await asyncio.sleep(0.1)  # Simülasyon
            
            yield AIStreamResponse(
                chunk=word + " ",
                is_final=(i == len(words) - 1),
                token_count=i + 1
            )


# Schema
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)
