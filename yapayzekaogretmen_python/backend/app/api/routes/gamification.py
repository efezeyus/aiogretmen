"""
Gamification API Routes
----------------------
Oyunlaştırma sistemi endpoint'leri.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import Body

from app.core.logger import logger
from app.services.gamification_service import (
    gamification_service,
    LeaderboardType,
    award_lesson_completion,
    award_quiz_completion,
    award_daily_login,
    award_peer_help
)
from app.models.user import User


# Basit auth kontrolü (demo için)
async def get_current_user():
    """Basit kullanıcı döndürme (demo için)"""
    return type('User', (), {
        'id': 'demo_user',
        'username': 'demo',
        'role': 'student',
        'grade_level': 5
    })


router = APIRouter(
    prefix="/gamification",
    tags=["Gamification"]
)


# Request/Response Models
class PointsRequest(BaseModel):
    """Puan ekleme isteği"""
    action: str = Field(..., description="Aksiyon tipi")
    metadata: Optional[Dict] = Field(None, description="Ek bilgiler")


class PointsResponse(BaseModel):
    """Puan yanıtı"""
    success: bool
    points_added: int
    total_points: int
    level: int
    level_up: bool
    achievements_unlocked: List[Dict]
    bonus_multiplier: float


class ProfileResponse(BaseModel):
    """Kullanıcı profil yanıtı"""
    user_id: str
    level: int
    total_points: int
    level_progress: Dict
    achievements: List[Dict]
    achievement_count: int
    total_achievements: int
    ranking: Dict
    streak: int
    badges: List[str]


class LeaderboardEntry(BaseModel):
    """Liderlik tablosu girdisi"""
    rank: int
    user_id: str
    username: str
    avatar: Optional[str]
    level: int
    points: int
    total_points: int
    achievements: int
    badges: List[str]


class LeaderboardResponse(BaseModel):
    """Liderlik tablosu yanıtı"""
    leaderboard: List[LeaderboardEntry]
    total: int
    type: str
    updated_at: str


class AchievementResponse(BaseModel):
    """Başarı yanıtı"""
    id: str
    name: str
    description: str
    icon: str
    points: int
    rarity: str
    unlocked: bool
    unlocked_at: Optional[str]
    progress: Optional[Dict]


@router.get("/profile", response_model=ProfileResponse)
async def get_gamification_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Kullanıcının gamification profilini getir
    
    - Seviye ve puan bilgisi
    - Kazanılan başarılar
    - Liderlik tablosu sıralaması
    - Aktif streak
    """
    try:
        profile = await gamification_service.get_user_profile(str(current_user.id))
        return ProfileResponse(**profile)
        
    except Exception as e:
        logger.error(f"Profil getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profil bilgileri alınamadı"
        )


@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def get_user_gamification_profile(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Başka bir kullanıcının profilini görüntüle"""
    try:
        profile = await gamification_service.get_user_profile(user_id)
        
        # Gizlilik: Bazı bilgileri gizle
        if str(current_user.id) != user_id:
            # Sadece public bilgileri göster
            profile["ranking"] = {}  # Sıralama bilgisini gizle
        
        return ProfileResponse(**profile)
        
    except Exception as e:
        logger.error(f"Kullanıcı profili hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kullanıcı profili alınamadı"
        )


@router.post("/points", response_model=PointsResponse)
async def add_points(
    request: PointsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Puan ekle
    
    Desteklenen aksiyonlar:
    - lesson_complete: Ders tamamlama
    - quiz_complete: Quiz tamamlama
    - daily_login: Günlük giriş
    - help_peer: Arkadaşa yardım
    - create_note: Not oluşturma
    - watch_video: Video izleme
    """
    try:
        result = await gamification_service.add_points(
            user_id=str(current_user.id),
            action=request.action,
            metadata=request.metadata
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Puan eklenemedi")
            )
        
        return PointsResponse(
            success=True,
            points_added=result["points_added"],
            total_points=result["total_points"],
            level=result["new_level"],
            level_up=result["level_up"],
            achievements_unlocked=result["achievements_unlocked"],
            bonus_multiplier=result["bonus_multiplier"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Puan ekleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Puan eklenemedi"
        )


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    type: LeaderboardType = Query(LeaderboardType.WEEKLY, description="Liderlik tablosu tipi"),
    subject: Optional[str] = Query(None, description="Konu filtresi"),
    grade_level: Optional[int] = Query(None, description="Sınıf seviyesi filtresi"),
    limit: int = Query(10, ge=1, le=100, description="Limit"),
    offset: int = Query(0, ge=0, description="Offset"),
    current_user: User = Depends(get_current_user)
):
    """
    Liderlik tablosunu getir
    
    Tipler:
    - daily: Günlük
    - weekly: Haftalık
    - monthly: Aylık
    - all_time: Tüm zamanlar
    - subject: Konuya göre
    - grade: Sınıf seviyesine göre
    """
    try:
        result = await gamification_service.get_leaderboard(
            leaderboard_type=type,
            subject=subject,
            grade_level=grade_level,
            limit=limit,
            offset=offset
        )
        
        return LeaderboardResponse(**result)
        
    except Exception as e:
        logger.error(f"Liderlik tablosu hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Liderlik tablosu alınamadı"
        )


@router.get("/leaderboard/position")
async def get_leaderboard_position(
    type: LeaderboardType = Query(LeaderboardType.WEEKLY, description="Liderlik tablosu tipi"),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının liderlik tablosundaki pozisyonu"""
    try:
        rankings = await gamification_service._get_user_ranking(str(current_user.id))
        
        return {
            "user_id": str(current_user.id),
            "rankings": rankings,
            "type": type
        }
        
    except Exception as e:
        logger.error(f"Pozisyon getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pozisyon bilgisi alınamadı"
        )


@router.get("/achievements", response_model=List[AchievementResponse])
async def get_all_achievements(
    current_user: User = Depends(get_current_user)
):
    """
    Tüm başarıları listele
    
    Kullanıcının kazandığı ve kazanmadığı tüm başarılar.
    """
    try:
        # Kullanıcı profili
        profile = await gamification_service.get_user_profile(str(current_user.id))
        unlocked_ids = [a["id"] for a in profile["achievements"]]
        
        # Tüm başarılar
        achievements = []
        for achievement_id, achievement in gamification_service.achievements.items():
            achievements.append(AchievementResponse(
                id=achievement_id,
                name=achievement["name"],
                description=achievement["description"],
                icon=achievement["icon"],
                points=achievement["points"],
                rarity=achievement["rarity"],
                unlocked=achievement_id in unlocked_ids,
                unlocked_at=None,  # TODO: Unlock zamanını kaydet
                progress=None  # TODO: İlerleme bilgisi
            ))
        
        # Önce kazanılanlar, sonra rarity'ye göre sırala
        achievements.sort(key=lambda x: (not x.unlocked, x.rarity))
        
        return achievements
        
    except Exception as e:
        logger.error(f"Başarı listesi hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Başarı listesi alınamadı"
        )


@router.get("/achievements/{achievement_id}", response_model=AchievementResponse)
async def get_achievement_detail(
    achievement_id: str,
    current_user: User = Depends(get_current_user)
):
    """Başarı detayı"""
    if achievement_id not in gamification_service.achievements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Başarı bulunamadı"
        )
    
    achievement = gamification_service.achievements[achievement_id]
    profile = await gamification_service.get_user_profile(str(current_user.id))
    unlocked_ids = [a["id"] for a in profile["achievements"]]
    
    # TODO: İlerleme bilgisi hesapla
    progress = None
    
    return AchievementResponse(
        id=achievement_id,
        name=achievement["name"],
        description=achievement["description"],
        icon=achievement["icon"],
        points=achievement["points"],
        rarity=achievement["rarity"],
        unlocked=achievement_id in unlocked_ids,
        unlocked_at=None,
        progress=progress
    )


@router.get("/level-info")
async def get_level_info(
    points: Optional[int] = Query(None, description="Puan değeri"),
    current_user: User = Depends(get_current_user)
):
    """
    Seviye bilgisi
    
    Belirtilen puan için veya kullanıcının mevcut puanı için seviye bilgisi.
    """
    if points is None:
        # Kullanıcının mevcut puanı
        profile = await gamification_service.get_user_profile(str(current_user.id))
        points = profile["total_points"]
    
    level_info = gamification_service.get_level_progress(points)
    
    return level_info


# Event-based endpoints
@router.post("/events/lesson-complete")
async def on_lesson_complete(
    lesson_id: str,
    duration_minutes: Optional[int] = None,
    score: Optional[float] = None,
    current_user: User = Depends(get_current_user)
):
    """Ders tamamlama eventi"""
    metadata = {
        "duration_minutes": duration_minutes,
        "score": score
    }
    
    result = await award_lesson_completion(
        user_id=str(current_user.id),
        lesson_id=lesson_id,
        metadata=metadata
    )
    
    return PointsResponse(
        success=True,
        points_added=result["points_added"],
        total_points=result["total_points"],
        level=result["new_level"],
        level_up=result["level_up"],
        achievements_unlocked=result["achievements_unlocked"],
        bonus_multiplier=result["bonus_multiplier"]
    )


@router.post("/events/quiz-complete")
async def on_quiz_complete(
    quiz_id: str,
    score: float = Body(..., ge=0, le=100, description="Quiz skoru (0-100)"),
    duration_seconds: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Quiz tamamlama eventi"""
    metadata = {
        "duration_seconds": duration_seconds
    }
    
    result = await award_quiz_completion(
        user_id=str(current_user.id),
        quiz_id=quiz_id,
        score=score,
        metadata=metadata
    )
    
    return PointsResponse(
        success=True,
        points_added=result["points_added"],
        total_points=result["total_points"],
        level=result["new_level"],
        level_up=result["level_up"],
        achievements_unlocked=result["achievements_unlocked"],
        bonus_multiplier=result["bonus_multiplier"]
    )


@router.post("/events/daily-login")
async def on_daily_login(
    current_user: User = Depends(get_current_user)
):
    """Günlük giriş eventi"""
    result = await award_daily_login(str(current_user.id))
    
    return PointsResponse(
        success=True,
        points_added=result["points_added"],
        total_points=result["total_points"],
        level=result["new_level"],
        level_up=result["level_up"],
        achievements_unlocked=result["achievements_unlocked"],
        bonus_multiplier=result["bonus_multiplier"]
    )


@router.post("/events/peer-help")
async def on_peer_help(
    helped_user_id: str,
    help_type: str = Body(..., description="Yardım tipi: answer, explanation, resource"),
    current_user: User = Depends(get_current_user)
):
    """Arkadaşa yardım eventi"""
    metadata = {
        "help_type": help_type
    }
    
    result = await award_peer_help(
        helper_id=str(current_user.id),
        helped_id=helped_user_id,
        metadata=metadata
    )
    
    return PointsResponse(
        success=True,
        points_added=result["points_added"],
        total_points=result["total_points"],
        level=result["new_level"],
        level_up=result["level_up"],
        achievements_unlocked=result["achievements_unlocked"],
        bonus_multiplier=result["bonus_multiplier"]
    )


@router.get("/stats/overview")
async def get_gamification_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Genel gamification istatistikleri
    
    Admin yetkisi gerektirir.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin yetkisi gereklidir"
        )
    
    # TODO: Genel istatistikler
    return {
        "total_users": 1234,
        "active_users": 567,
        "total_points_distributed": 1234567,
        "total_achievements_unlocked": 8901,
        "most_popular_achievement": "first_lesson",
        "average_user_level": 12.5,
        "daily_active_users": 234,
        "weekly_active_users": 456
    }
