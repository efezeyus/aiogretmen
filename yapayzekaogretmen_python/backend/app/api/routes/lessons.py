"""
Yapay Zeka Öğretmen - Ders Rotaları
----------------------------------
Ders ve konu işlemleri için API rotaları.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import List, Optional

from app.api.controllers import lesson_controller
from app.api.middlewares.auth import get_current_user, check_role
from app.api.schemas.auth import RoleEnum
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_lessons(
    grade: Optional[int] = Query(None, ge=2, le=12),
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Ders listesi.
    """
    return await lesson_controller.get_lessons(grade, subject)


@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: str = Path(...),
    current_user: User = Depends(get_current_user),
):
    """
    Belirli bir dersi getir.
    """
    return await lesson_controller.get_lesson(lesson_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: dict,
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER])),
):
    """
    Yeni ders oluştur.
    Sadece öğretmen veya yöneticiler ekleyebilir.
    """
    return await lesson_controller.create_lesson(lesson_data, current_user)


@router.put("/{lesson_id}")
async def update_lesson(
    lesson_data: dict,
    lesson_id: str = Path(...),
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER])),
):
    """
    Ders bilgilerini güncelle.
    Sadece öğretmen veya yöneticiler güncelleyebilir.
    """
    return await lesson_controller.update_lesson(lesson_id, lesson_data)


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: str = Path(...),
    current_user: User = Depends(check_role([RoleEnum.ADMIN])),
):
    """
    Ders sil.
    Sadece yöneticiler silebilir.
    """
    await lesson_controller.delete_lesson(lesson_id)
    return None


@router.get("/{lesson_id}/topics")
async def get_lesson_topics(
    lesson_id: str = Path(...),
    current_user: User = Depends(get_current_user),
):
    """
    Belirli bir dersin konularını getir.
    """
    return await lesson_controller.get_lesson_topics(lesson_id)


@router.post("/{lesson_id}/topics", status_code=status.HTTP_201_CREATED)
async def add_lesson_topic(
    topic_data: dict,
    lesson_id: str = Path(...),
    current_user: User = Depends(check_role([RoleEnum.ADMIN, RoleEnum.TEACHER])),
):
    """
    Derse yeni konu ekle.
    Sadece öğretmen veya yöneticiler ekleyebilir.
    """
    return await lesson_controller.add_lesson_topic(lesson_id, topic_data, current_user)


@router.get("/progress")
async def get_user_progress(
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının ders ilerleme durumunu getir.
    """
    return await lesson_controller.get_user_progress(current_user.id)


@router.post("/progress/{lesson_id}", status_code=status.HTTP_200_OK)
async def update_lesson_progress(
    progress_data: dict,
    lesson_id: str = Path(...),
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının ders ilerleme durumunu güncelle.
    """
    return await lesson_controller.update_lesson_progress(
        current_user.id, 
        lesson_id, 
        progress_data
    ) 