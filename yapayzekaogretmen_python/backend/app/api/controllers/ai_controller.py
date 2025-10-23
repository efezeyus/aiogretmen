"""
Yapay Zeka Öğretmen - Yapay Zeka Controller
-----------------------------------------
Yapay zeka işlemleri için controller fonksiyonları.
"""
from typing import Dict, Any, Optional, List
import os
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, status, UploadFile
from loguru import logger
from pydantic import ValidationError
import PyPDF2

from app.services.user_service import update_preferences
from app.api.schemas.ai import (
    QuestionRequest,
    TopicExplanationRequest,
    GenerateQuestionsRequest,
    EvaluateAnswerRequest,
)
from app.db.mongodb import curriculum_collection
from app.models.user import User


async def ask_question(question_data: QuestionRequest, user: User) -> Dict[str, Any]:
    """
    Soru sorma işlemi.
    
    Args:
        question_data: Soru bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Yanıt içeren sözlük
    """
    try:
        # AI servisine isteği ilet
        result = await ai_ask_question(
            question=question_data.question,
            grade=question_data.grade,
            subject=question_data.subject,
            user=user,
        )
        
        return {
            "success": True,
            "data": result,
        }
    except Exception as e:
        logger.error(f"Soru sorma hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Soru yanıtlanırken bir hata oluştu: {str(e)}",
        )


async def explain_topic(topic_data: TopicExplanationRequest, user: User) -> Dict[str, Any]:
    """
    Konu anlatımı.
    
    Args:
        topic_data: Konu bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Açıklama içeren sözlük
    """
    try:
        # AI servisine isteği ilet
        result = await ai_explain_topic(
            topic=topic_data.topic,
            grade=topic_data.grade,
            subject=topic_data.subject,
            difficulty=topic_data.difficulty,
            user=user,
        )
        
        return {
            "success": True,
            "data": result,
        }
    except Exception as e:
        logger.error(f"Konu anlatımı hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Konu anlatılırken bir hata oluştu: {str(e)}",
        )


async def generate_questions(questions_data: GenerateQuestionsRequest, user: User) -> Dict[str, Any]:
    """
    Test soruları oluşturma.
    
    Args:
        questions_data: Soru oluşturma bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Soruları içeren sözlük
    """
    try:
        # AI servisine isteği ilet
        result = await ai_generate_questions(
            topic=questions_data.topic,
            count=questions_data.count,
            difficulty=questions_data.difficulty,
            grade=questions_data.grade,
            subject=questions_data.subject,
            user=user,
        )
        
        return {
            "success": True,
            "data": result,
        }
    except Exception as e:
        logger.error(f"Soru oluşturma hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sorular oluşturulurken bir hata oluştu: {str(e)}",
        )


async def evaluate_answer(answer_data: EvaluateAnswerRequest, user: User) -> Dict[str, Any]:
    """
    Cevap değerlendirme.
    
    Args:
        answer_data: Cevap bilgileri
        user: Kullanıcı nesnesi
    
    Returns:
        Değerlendirme içeren sözlük
    """
    try:
        # AI servisine isteği ilet
        result = await ai_evaluate_answer(
            question=answer_data.question,
            answer=answer_data.answer,
            correct_answer=answer_data.correct_answer,
            user=user,
        )
        
        return {
            "success": True,
            "data": result,
        }
    except Exception as e:
        logger.error(f"Cevap değerlendirme hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cevap değerlendirilirken bir hata oluştu: {str(e)}",
        )


async def upload_curriculum(file: UploadFile, user: User) -> Dict[str, Any]:
    """
    Müfredat PDF'i yükleme ve analiz etme.
    
    Args:
        file: Yüklenen PDF dosyası
        user: Kullanıcı nesnesi
    
    Returns:
        Analiz sonuçlarını içeren sözlük
    """
    try:
        from app.core.config import settings
        
        # Dosya yükleme yolu oluştur
        upload_dir = Path(settings.MEDIA_ROOT) / "curriculum"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Dosyayı kaydet
        file_path = upload_dir / f"{datetime.utcnow().timestamp()}_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # PDF içeriğini oku
        pdf_reader = PyPDF2.PdfReader(file_path)
        pdf_text = ""
        for page in pdf_reader.pages:
            pdf_text += page.extract_text()
        
        # PDF içeriğini analiz et
        analysis = await ai_analyze_curriculum_pdf(pdf_text)
        
        # Veritabanına kaydet
        curriculum_data = {
            "file_name": file.filename,
            "file_path": str(file_path),
            "uploaded_by": str(user.id),
            "extracted_content": analysis["extracted_content"],
            "upload_date": datetime.utcnow(),
        }
        
        result = await curriculum_collection.insert_one(curriculum_data)
        
        return {
            "success": True,
            "message": "Müfredat başarıyla yüklendi ve analiz edildi",
            "data": {
                "curriculum_id": str(result.inserted_id),
                "file_name": file.filename,
                "extracted_content": analysis["extracted_content"],
            },
        }
    except Exception as e:
        logger.error(f"Müfredat yükleme hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Müfredat yüklenirken bir hata oluştu: {str(e)}",
        )


async def set_teacher_character(gender: str, user: User) -> Dict[str, Any]:
    """
    Öğretmen karakteri seçimi.
    
    Args:
        gender: Öğretmen cinsiyeti (male/female)
        user: Kullanıcı nesnesi
    
    Returns:
        İşlem durumunu içeren sözlük
    """
    try:
        # Geçerli cinsiyet kontrolü
        if gender not in ["male", "female"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz cinsiyet seçimi",
            )
        
        # Kullanıcı tercihlerini güncelle
        preferences = user.preferences.dict()
        preferences["teacher_gender"] = gender
        
        updated_user = await update_preferences(str(user.id), preferences)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Kullanıcı tercihleri güncellenemedi",
            )
        
        return {
            "success": True,
            "message": f"Öğretmen karakteri {gender} olarak ayarlandı",
            "data": {
                "teacher_gender": gender,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Öğretmen karakteri ayarlama hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğretmen karakteri ayarlanamadı",
        ) 