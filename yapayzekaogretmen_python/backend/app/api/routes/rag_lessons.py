"""
RAG Tabanlı Ders Anlatım API Route'ları
--------------------------------------
PDF içeriklerine dayalı yapay zeka destekli ders anlatımı
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List, Dict

from app.services.rag_service import RAGService
from app.api.middlewares.auth import get_current_user
from app.models.user import User
from app.core.logger import logger

router = APIRouter(
    prefix="/lessons/rag",
    tags=["RAG Lessons"]
)

# Servis örneği
rag_service = RAGService()


# Request modelleri
class TeachLessonRequest(BaseModel):
    grade: int
    subject: str
    topic: str
    question: Optional[str] = "Bu konuyu anlatır mısın?"
    collection_name: Optional[str] = None


class AskQuestionRequest(BaseModel):
    question: str
    grade: Optional[int] = None
    subject: Optional[str] = None
    use_history: bool = True


class GenerateSummaryRequest(BaseModel):
    grade: int
    subject: str
    topic: str
    collection_name: Optional[str] = None


@router.post("/teach")
async def teach_lesson(
    request: TeachLessonRequest,
    current_user: User = Depends(get_current_user)
):
    """
    PDF içeriklerine dayalı ders anlat
    
    - **grade**: Sınıf seviyesi (1-12)
    - **subject**: Ders adı
    - **topic**: Konu başlığı
    - **question**: Öğrencinin sorusu (opsiyonel)
    - **collection_name**: Kullanılacak koleksiyon (opsiyonel)
    """
    try:
        result = rag_service.teach_lesson(
            student_id=str(current_user.id),
            grade=request.grade,
            subject=request.subject,
            topic=request.topic,
            question=request.question,
            collection_name=request.collection_name
        )
        
        if result["success"]:
            return {
                "lesson": result["content"],
                "model": result.get("model", "unknown"),
                "sources": result.get("sources", []),
                "grade": request.grade,
                "subject": request.subject,
                "topic": request.topic
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Ders anlatımında hata oluştu")
            )
            
    except Exception as e:
        logger.error(f"Ders anlatım hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/ask")
async def ask_question(
    request: AskQuestionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Öğrenci sorusunu PDF içeriklerine dayalı cevapla
    
    - **question**: Soru
    - **grade**: Sınıf seviyesi (opsiyonel, daha iyi sonuç için)
    - **subject**: Ders adı (opsiyonel, daha iyi sonuç için)
    - **use_history**: Konuşma geçmişini kullan
    """
    try:
        result = rag_service.answer_question(
            student_id=str(current_user.id),
            question=request.question,
            grade=request.grade,
            subject=request.subject,
            use_conversation_history=request.use_history
        )
        
        if result["success"]:
            return {
                "answer": result["answer"],
                "sources": result.get("sources", []),
                "question": request.question
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Soru cevaplanamadı")
            )
            
    except Exception as e:
        logger.error(f"Soru cevaplama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/summary")
async def generate_summary(
    request: GenerateSummaryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Konu özeti oluştur
    
    - **grade**: Sınıf seviyesi
    - **subject**: Ders adı
    - **topic**: Konu başlığı
    - **collection_name**: Kullanılacak koleksiyon (opsiyonel)
    """
    try:
        result = rag_service.generate_topic_summary(
            grade=request.grade,
            subject=request.subject,
            topic=request.topic,
            collection_name=request.collection_name
        )
        
        if result["success"]:
            return {
                "summary": result["summary"],
                "topic": result["topic"],
                "grade": result["grade"],
                "subject": result["subject"]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Özet oluşturulamadı")
            )
            
    except Exception as e:
        logger.error(f"Özet oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/topics/{grade}/{subject}")
async def get_available_topics(
    grade: int,
    subject: str,
    current_user: User = Depends(get_current_user)
):
    """Belirli sınıf ve ders için mevcut konuları listele"""
    try:
        # İlgili koleksiyonları bul
        from app.services.vector_db_service import VectorDBService
        vector_service = VectorDBService()
        
        collections = vector_service.list_collections()
        matching_collections = [
            col for col in collections 
            if f"grade_{grade}_{subject}" in col
        ]
        
        if not matching_collections:
            return {
                "grade": grade,
                "subject": subject,
                "topics": [],
                "message": "Bu sınıf ve ders için içerik bulunamadı"
            }
        
        # TODO: Koleksiyonlardan konu listesini çıkar
        # Şimdilik basit bir liste döndür
        topics = [
            "Doğal Sayılar",
            "Kesirler",
            "Ondalık Sayılar",
            "Geometrik Şekiller",
            "Ölçme"
        ]
        
        return {
            "grade": grade,
            "subject": subject,
            "topics": topics,
            "collection_count": len(matching_collections)
        }
        
    except Exception as e:
        logger.error(f"Konu listeleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/conversation/{student_id}")
async def get_conversation_history(
    student_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Öğrenci konuşma geçmişini getir"""
    try:
        # Güvenlik kontrolü
        if str(current_user.id) != student_id and current_user.role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu konuşma geçmişine erişim yetkiniz yok"
            )
        
        # Konuşma geçmişini al
        if student_id in rag_service.conversations:
            history = rag_service.conversations[student_id][-limit:]
            return {
                "student_id": student_id,
                "count": len(history),
                "conversations": history
            }
        else:
            return {
                "student_id": student_id,
                "count": 0,
                "conversations": []
            }
            
    except Exception as e:
        logger.error(f"Konuşma geçmişi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )