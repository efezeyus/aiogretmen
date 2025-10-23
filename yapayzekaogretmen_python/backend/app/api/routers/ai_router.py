"""
Yapay Zeka Öğretmen - Yapay Zeka Router
---------------------------------
Yapay zeka API endpoint'leri için router.
"""
from fastapi import APIRouter, Depends, Body, Path, Query
from typing import List, Dict, Any, Optional
from beanie import PydanticObjectId

from app.api.controllers.ai_controller import AIController
from app.models.ai_assistant import (
    AIAssistant, AssistantConversation, AssistantMessage, AssistantType,
    LearningAnalysis, QuizGeneration, PersonalizedLearningPath
)
from app.api.middlewares.auth import get_current_user
from app.models.user import User


router = APIRouter(prefix="/api/ai", tags=["Yapay Zeka"])

# Asistanlar
@router.get("/assistants", response_model=List[AIAssistant])
async def get_assistants(
    assistant_type: Optional[AssistantType] = Query(None, description="Asistan türü filtresi"),
    current_user: User = Depends(get_current_user)
):
    """Tüm aktif asistanları listeler."""
    return await AIController.get_assistants(assistant_type, current_user)


@router.get("/assistants/{assistant_id}", response_model=AIAssistant)
async def get_assistant(
    assistant_id: PydanticObjectId = Path(..., description="Asistan ID"),
    current_user: User = Depends(get_current_user)
):
    """Asistan detayını getirir."""
    return await AIController.get_assistant(assistant_id, current_user)


@router.post("/assistants", response_model=AIAssistant)
async def create_assistant(
    assistant_data: Dict[str, Any] = Body(..., description="Asistan verileri"),
    current_user: User = Depends(get_current_user)
):
    """Yeni asistan oluşturur."""
    return await AIController.create_assistant(assistant_data, current_user)


@router.put("/assistants/{assistant_id}", response_model=AIAssistant)
async def update_assistant(
    assistant_id: PydanticObjectId = Path(..., description="Asistan ID"),
    assistant_data: Dict[str, Any] = Body(..., description="Güncellenecek veriler"),
    current_user: User = Depends(get_current_user)
):
    """Asistanı günceller."""
    return await AIController.update_assistant(assistant_id, assistant_data, current_user)


@router.delete("/assistants/{assistant_id}", response_model=Dict[str, bool])
async def delete_assistant(
    assistant_id: PydanticObjectId = Path(..., description="Asistan ID"),
    current_user: User = Depends(get_current_user)
):
    """Asistanı siler."""
    return await AIController.delete_assistant(assistant_id, current_user)


# Konuşmalar
@router.get("/conversations", response_model=List[AssistantConversation])
async def get_user_conversations(current_user: User = Depends(get_current_user)):
    """Kullanıcının konuşmalarını listeler."""
    return await AIController.get_user_conversations(current_user)


@router.get("/conversations/{conversation_id}", response_model=AssistantConversation)
async def get_conversation(
    conversation_id: PydanticObjectId = Path(..., description="Konuşma ID"),
    current_user: User = Depends(get_current_user)
):
    """Konuşma detayını getirir."""
    return await AIController.get_conversation(conversation_id, current_user)


@router.post("/conversations", response_model=AssistantConversation)
async def create_conversation(
    assistant_id: PydanticObjectId = Body(..., description="Asistan ID"),
    course_id: Optional[PydanticObjectId] = Body(None, description="Kurs ID"),
    content_id: Optional[str] = Body(None, description="İçerik ID"),
    current_user: User = Depends(get_current_user)
):
    """Yeni konuşma oluşturur."""
    return await AIController.create_conversation(assistant_id, course_id, content_id, current_user)


@router.post("/conversations/{conversation_id}/messages", response_model=AssistantConversation)
async def add_message(
    conversation_id: PydanticObjectId = Path(..., description="Konuşma ID"),
    message: str = Body(..., description="Mesaj içeriği"),
    current_user: User = Depends(get_current_user)
):
    """Konuşmaya mesaj ekler ve asistan yanıtı alır."""
    return await AIController.add_message(conversation_id, message, current_user)


# Öğrenme Analizi
@router.post("/learning-analysis", response_model=LearningAnalysis)
async def generate_learning_analysis(
    course_id: PydanticObjectId = Body(..., description="Kurs ID"),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının kurs performansına göre öğrenme analizi oluşturur."""
    return await AIController.generate_learning_analysis(course_id, current_user)


@router.get("/learning-analysis", response_model=List[LearningAnalysis])
async def get_user_learning_analyses(current_user: User = Depends(get_current_user)):
    """Kullanıcının öğrenme analizlerini listeler."""
    return await AIController.get_user_learning_analyses(current_user)


# Quiz Oluşturma
@router.post("/quizzes", response_model=QuizGeneration)
async def generate_quiz(
    course_id: PydanticObjectId = Body(..., description="Kurs ID"),
    subject: str = Body(..., description="Konu"),
    content_id: Optional[str] = Body(None, description="İçerik ID"),
    difficulty_level: str = Body("medium", description="Zorluk seviyesi"),
    num_questions: int = Body(5, description="Soru sayısı"),
    current_user: User = Depends(get_current_user)
):
    """Yapay zeka ile otomatik quiz oluşturur."""
    return await AIController.generate_quiz(
        course_id, subject, content_id, difficulty_level, num_questions, current_user
    )


@router.post("/quizzes/publish", response_model=Dict[str, bool])
async def publish_quiz_to_content(
    quiz_id: PydanticObjectId = Body(..., description="Quiz ID"),
    course_id: PydanticObjectId = Body(..., description="Kurs ID"),
    section_index: int = Body(..., description="Bölüm indeksi"),
    title: str = Body(..., description="İçerik başlığı"),
    current_user: User = Depends(get_current_user)
):
    """Oluşturulan quiz'i kurs içeriğine ekler."""
    return await AIController.publish_quiz_to_content(
        quiz_id, course_id, section_index, title, current_user
    )


# Kişiselleştirilmiş Öğrenme Yolu
@router.post("/learning-paths", response_model=PersonalizedLearningPath)
async def create_learning_path(
    learning_goal: str = Body(..., description="Öğrenme hedefi"),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcı için kişiselleştirilmiş öğrenme yolu oluşturur."""
    return await AIController.create_learning_path(learning_goal, current_user)


@router.get("/learning-paths", response_model=List[PersonalizedLearningPath])
async def get_user_learning_paths(current_user: User = Depends(get_current_user)):
    """Kullanıcının öğrenme yollarını listeler."""
    return await AIController.get_user_learning_paths(current_user)


@router.get("/learning-paths/{path_id}", response_model=PersonalizedLearningPath)
async def get_learning_path(
    path_id: PydanticObjectId = Path(..., description="Öğrenme yolu ID"),
    current_user: User = Depends(get_current_user)
):
    """Öğrenme yolu detayını getirir."""
    return await AIController.get_learning_path(path_id, current_user) 