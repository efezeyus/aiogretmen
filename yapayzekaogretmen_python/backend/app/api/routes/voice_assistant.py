from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import json
from datetime import datetime

from app.services.ai_service import AIService
from app.services.voice_service import voice_service
from app.models.user import User
from app.api.middlewares.auth import get_current_user

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])

# Pydantic modelleri
class VoiceCommandRequest(BaseModel):
    command: str
    context: Optional[str] = "general"
    user_id: Optional[str] = None

class VoiceResponse(BaseModel):
    response: str
    action: Optional[str] = None
    data: Optional[dict] = None
    confidence: float
    timestamp: datetime

class VoiceSettings(BaseModel):
    language: str = "tr-TR"
    speed: float = 1.0
    pitch: float = 1.0
    auto_response: bool = True

class VoiceSession(BaseModel):
    session_id: str
    user_id: str
    start_time: datetime
    commands: List[VoiceCommandRequest]
    settings: VoiceSettings

# Sesli komut tanımları
VOICE_COMMANDS = {
    "ders başlat": {
        "action": "start_lesson",
        "description": "Ders başlatır",
        "response": "Ders başlatılıyor. Hangi konuyu çalışmak istiyorsunuz?"
    },
    "soru sor": {
        "action": "ask_question",
        "description": "Soru sorma modunu açar",
        "response": "Soru sorma modu açıldı. Sorunuzu sorabilirsiniz."
    },
    "analiz göster": {
        "action": "show_analytics",
        "description": "Analiz sayfasını açar",
        "response": "Analiz sayfası açılıyor. Öğrenme istatistiklerinizi görüntüleyebilirsiniz."
    },
    "arkadaşlarım": {
        "action": "show_friends",
        "description": "Arkadaş listesini gösterir",
        "response": "Arkadaş listeniz açılıyor."
    },
    "rozetlerim": {
        "action": "show_badges",
        "description": "Rozetlerinizi gösterir",
        "response": "Rozetleriniz açılıyor. Başarılarınızı görebilirsiniz."
    },
    "yardım": {
        "action": "help",
        "description": "Mevcut komutları listeler",
        "response": "Mevcut komutlar: ders başlat, soru sor, analiz göster, arkadaşlarım, rozetlerim"
    },
    "çalışma sürem": {
        "action": "study_time",
        "description": "Çalışma sürenizi gösterir",
        "response": "Bugün 2 saat 15 dakika çalıştınız. Haftalık hedefinizin %85'ini tamamladınız."
    },
    "puanım": {
        "action": "show_points",
        "description": "Puanınızı gösterir",
        "response": "Toplam 8500 puanınız var. Seviye 5'te bulunuyorsunuz."
    },
    "seri durumu": {
        "action": "streak_status",
        "description": "Çalışma serinizi gösterir",
        "response": "7 günlük çalışma seriniz var. Harika gidiyorsunuz!"
    },
    "derslerim": {
        "action": "show_lessons",
        "description": "Derslerinizi listeler",
        "response": "Bugünkü dersleriniz: Matematik, Türkçe ve Fen Bilimleri"
    }
}

@router.post("/process-command", response_model=VoiceResponse)
async def process_voice_command(
    request: VoiceCommandRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Sesli komutu işler ve yanıt döner
    """
    try:
        response = await voice_service.process_command(
            command=request.command,
            user_id=str(current_user.id),
            context=request.context
        )
        return VoiceResponse(**response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sesli komut işleme hatası: {str(e)}")

@router.post("/ask-ai")
async def ask_ai_voice(
    request: VoiceCommandRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI'ya sesli soru sorar
    """
    try:
        ai_service = AIService()
        response = await ai_service.process_voice_query(
            request.command, 
            current_user.id,
            context=request.context
        )
        
        return {
            "response": response,
            "timestamp": datetime.now(),
            "user_id": current_user.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI yanıt hatası: {str(e)}")

@router.get("/commands")
async def get_available_commands():
    """
    Mevcut sesli komutları listeler
    """
    return {
        "commands": [
            {
                "command": cmd,
                "description": details["description"],
                "action": details["action"]
            }
            for cmd, details in VOICE_COMMANDS.items()
        ]
    }

@router.post("/session/start")
async def start_voice_session(
    settings: VoiceSettings,
    current_user: User = Depends(get_current_user)
):
    """
    Sesli asistan oturumu başlatır
    """
    try:
        session_id = await voice_service.start_session(
            user_id=str(current_user.id),
            settings=settings.dict()
        )
        
        return {
            "session_id": session_id,
            "message": "Sesli asistan oturumu başlatıldı",
            "settings": settings
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oturum başlatma hatası: {str(e)}")

@router.post("/session/{session_id}/command")
async def add_command_to_session(
    session_id: str,
    command: VoiceCommandRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Oturuma komut ekler
    """
    try:
        success = await voice_service.add_command_to_session(
            session_id=session_id,
            command=command.command
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Oturum bulunamadı")
        
        return {
            "message": "Komut oturuma eklendi",
            "session_id": session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Komut ekleme hatası: {str(e)}")

@router.get("/session/{session_id}/history")
async def get_session_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Oturum geçmişini getirir
    """
    try:
        session_data = await voice_service.get_session_history(session_id)
        
        if not session_data:
            raise HTTPException(status_code=404, detail="Oturum bulunamadı")
        
        return session_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oturum geçmişi alma hatası: {str(e)}")

@router.post("/settings/update")
async def update_voice_settings(
    settings: VoiceSettings,
    current_user: User = Depends(get_current_user)
):
    """
    Sesli asistan ayarlarını günceller
    """
    try:
        success = await voice_service.update_settings(
            user_id=str(current_user.id),
            settings=settings.dict()
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Ayarlar güncellenemedi")
        
        return {
            "message": "Ses ayarları güncellendi",
            "settings": settings
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ayar güncelleme hatası: {str(e)}")

@router.get("/settings")
async def get_voice_settings(
    current_user: User = Depends(get_current_user)
):
    """
    Kullanıcının ses ayarlarını getirir
    """
    # settings = await get_user_voice_settings(current_user.id)
    # return settings
    
    # Varsayılan ayarlar
    return VoiceSettings()

# Yardımcı fonksiyonlar
async def execute_voice_action(action: str, user_id: str, command: str):
    """
    Sesli komut eylemini çalıştırır
    """
    try:
        if action == "start_lesson":
            return await start_lesson_action(user_id)
        elif action == "ask_question":
            return await ask_question_action(user_id)
        elif action == "show_analytics":
            return await show_analytics_action(user_id)
        elif action == "show_friends":
            return await show_friends_action(user_id)
        elif action == "show_badges":
            return await show_badges_action(user_id)
        elif action == "study_time":
            return await get_study_time_action(user_id)
        elif action == "show_points":
            return await get_points_action(user_id)
        elif action == "streak_status":
            return await get_streak_action(user_id)
        elif action == "show_lessons":
            return await get_lessons_action(user_id)
        else:
            return {"status": "unknown_action"}
            
    except Exception as e:
        return {"error": str(e)}

async def start_lesson_action(user_id: str):
    """Ders başlatma eylemi"""
    return {
        "action": "redirect",
        "url": "/student/lessons",
        "message": "Ders sayfasına yönlendiriliyorsunuz"
    }

async def ask_question_action(user_id: str):
    """Soru sorma eylemi"""
    return {
        "action": "open_modal",
        "modal": "question_modal",
        "message": "Soru sorma penceresi açılıyor"
    }

async def show_analytics_action(user_id: str):
    """Analiz gösterme eylemi"""
    return {
        "action": "redirect",
        "url": "/student/analytics",
        "message": "Analiz sayfasına yönlendiriliyorsunuz"
    }

async def show_friends_action(user_id: str):
    """Arkadaş listesi gösterme eylemi"""
    return {
        "action": "redirect",
        "url": "/student/social",
        "message": "Arkadaş sayfasına yönlendiriliyorsunuz"
    }

async def show_badges_action(user_id: str):
    """Rozet gösterme eylemi"""
    return {
        "action": "redirect",
        "url": "/student/gamification",
        "message": "Rozet sayfasına yönlendiriliyorsunuz"
    }

async def get_study_time_action(user_id: str):
    """Çalışma süresi getirme eylemi"""
    # Veritabanından çalışma süresini al
    return {
        "study_time": "2s 15dk",
        "weekly_goal": "85%",
        "daily_goal": "90%"
    }

async def get_points_action(user_id: str):
    """Puan getirme eylemi"""
    # Veritabanından puan bilgisini al
    return {
        "total_points": 8500,
        "level": 5,
        "next_level": 10000
    }

async def get_streak_action(user_id: str):
    """Seri durumu getirme eylemi"""
    # Veritabanından seri bilgisini al
    return {
        "streak_days": 7,
        "longest_streak": 15,
        "motivation": "Harika gidiyorsunuz!"
    }

async def get_lessons_action(user_id: str):
    """Ders listesi getirme eylemi"""
    # Veritabanından ders bilgilerini al
    return {
        "today_lessons": ["Matematik", "Türkçe", "Fen Bilimleri"],
        "completed": 2,
        "total": 3
    } 