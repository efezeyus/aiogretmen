"""
Yapay Zeka Öğretmen - Kurs Controller
---------------------------------
Kurs API endpoint'leri için controller sınıfı.
"""
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, Depends, Query, Body, Path
from beanie import PydanticObjectId

from app.services import course_service
from app.models.course import Course, CourseStatus, CourseSection, CourseContent, CourseProgress, Certificate
from app.models.user import User
from app.api.middlewares.auth import get_current_user


class CourseController:
    """Kurs API endpoint'leri."""
    
    # Kurs Listesi
    @staticmethod
    async def get_courses(
        skip: int = Query(0, description="Atlanacak kayıt sayısı"),
        limit: int = Query(10, description="Getirilecek maksimum kayıt sayısı"),
        status: Optional[CourseStatus] = Query(None, description="Kurs durumu filtresi"),
        category: Optional[str] = Query(None, description="Kategori filtresi"),
        search: Optional[str] = Query(None, description="Arama terimi")
    ) -> List[Course]:
        """
        Kursları listeler.
        
        Args:
            skip: Atlanacak kayıt sayısı
            limit: Maksimum kayıt sayısı
            status: Kurs durumu filtresi
            category: Kategori filtresi
            search: Arama terimi
            
        Returns:
            Kurs listesi
        """
        return await course_service.get_courses(
            skip=skip,
            limit=limit,
            status=status,
            category=category,
            search_term=search
        )
    
    # Kurs Detayı
    @staticmethod
    async def get_course(
        course_id: PydanticObjectId = Path(..., description="Kurs ID")
    ) -> Course:
        """
        Kurs detayını getirir.
        
        Args:
            course_id: Kurs ID
            
        Returns:
            Kurs detayı
            
        Raises:
            HTTPException: Kurs bulunamadığında
        """
        course = await course_service.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Kurs bulunamadı")
        return course
    
    # Kurs Oluşturma
    @staticmethod
    async def create_course(
        course_data: Dict[str, Any] = Body(..., description="Kurs verileri"),
        current_user: User = Depends(get_current_user)
    ) -> Course:
        """
        Yeni kurs oluşturur.
        
        Args:
            course_data: Kurs verileri
            current_user: Mevcut kullanıcı
            
        Returns:
            Oluşturulan kurs
            
        Raises:
            HTTPException: Kullanıcı eğitmen değilse veya işlem başarısız olursa
        """
        # Kullanıcı yetkisini kontrol et
        if current_user.role not in ["admin", "teacher"]:
            raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
        
        try:
            return await course_service.create_course(course_data, current_user)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Kurs Güncelleme
    @staticmethod
    async def update_course(
        course_id: PydanticObjectId = Path(..., description="Kurs ID"),
        course_data: Dict[str, Any] = Body(..., description="Güncellenecek veriler"),
        current_user: User = Depends(get_current_user)
    ) -> Course:
        """
        Mevcut kursu günceller.
        
        Args:
            course_id: Kurs ID
            course_data: Güncellenecek veriler
            current_user: Mevcut kullanıcı
            
        Returns:
            Güncellenmiş kurs
            
        Raises:
            HTTPException: Kurs bulunamadığında, kullanıcı yetkisiz olduğunda veya işlem başarısız olduğunda
        """
        # Kursu kontrol et
        course = await course_service.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Kurs bulunamadı")
        
        # Yetki kontrolü
        if current_user.role != "admin" and course.instructor.id != current_user.id:
            raise HTTPException(status_code=403, detail="Bu kursu düzenleme yetkiniz yok")
        
        try:
            updated_course = await course_service.update_course(course_id, course_data)
            if not updated_course:
                raise HTTPException(status_code=404, detail="Kurs güncellenemedi")
            return updated_course
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Kurs Silme
    @staticmethod
    async def delete_course(
        course_id: PydanticObjectId = Path(..., description="Kurs ID"),
        current_user: User = Depends(get_current_user)
    ) -> Dict[str, bool]:
        """
        Kursu siler.
        
        Args:
            course_id: Kurs ID
            current_user: Mevcut kullanıcı
            
        Returns:
            Başarı durumu
            
        Raises:
            HTTPException: Kurs bulunamadığında, kullanıcı yetkisiz olduğunda veya işlem başarısız olduğunda
        """
        # Kursu kontrol et
        course = await course_service.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Kurs bulunamadı")
        
        # Yetki kontrolü
        if current_user.role != "admin" and course.instructor.id != current_user.id:
            raise HTTPException(status_code=403, detail="Bu kursu silme yetkiniz yok")
        
        result = await course_service.delete_course(course_id)
        if not result:
            raise HTTPException(status_code=400, detail="Kurs silinemedi")
        
        return {"success": True}
    
    # Kursa Bölüm Ekleme
    @staticmethod
    async def add_section(
        course_id: PydanticObjectId = Path(..., description="Kurs ID"),
        section_data: Dict[str, Any] = Body(..., description="Bölüm verileri"),
        current_user: User = Depends(get_current_user)
    ) -> Course:
        """
        Kursa yeni bölüm ekler.
        
        Args:
            course_id: Kurs ID
            section_data: Bölüm verileri
            current_user: Mevcut kullanıcı
            
        Returns:
            Güncellenmiş kurs
            
        Raises:
            HTTPException: Kurs bulunamadığında, kullanıcı yetkisiz olduğunda veya işlem başarısız olduğunda
        """
        # Kursu kontrol et
        course = await course_service.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Kurs bulunamadı")
        
        # Yetki kontrolü
        if current_user.role != "admin" and course.instructor.id != current_user.id:
            raise HTTPException(status_code=403, detail="Bu kursa bölüm ekleme yetkiniz yok")
        
        try:
            updated_course = await course_service.add_section_to_course(course_id, section_data)
            if not updated_course:
                raise HTTPException(status_code=400, detail="Bölüm eklenemedi")
            return updated_course
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Bölüme İçerik Ekleme
    @staticmethod
    async def add_content(
        course_id: PydanticObjectId = Path(..., description="Kurs ID"),
        section_index: int = Query(..., description="Bölüm indeksi"),
        content_data: Dict[str, Any] = Body(..., description="İçerik verileri"),
        current_user: User = Depends(get_current_user)
    ) -> Course:
        """
        Bölüme yeni içerik ekler.
        
        Args:
            course_id: Kurs ID
            section_index: Bölüm indeksi
            content_data: İçerik verileri
            current_user: Mevcut kullanıcı
            
        Returns:
            Güncellenmiş kurs
            
        Raises:
            HTTPException: Kurs bulunamadığında, kullanıcı yetkisiz olduğunda veya işlem başarısız olduğunda
        """
        # Kursu kontrol et
        course = await course_service.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Kurs bulunamadı")
        
        # Yetki kontrolü
        if current_user.role != "admin" and course.instructor.id != current_user.id:
            raise HTTPException(status_code=403, detail="Bu kursa içerik ekleme yetkiniz yok")
        
        # Bölüm indeksini kontrol et
        if section_index < 0 or section_index >= len(course.sections):
            raise HTTPException(status_code=404, detail="Bölüm bulunamadı")
        
        try:
            updated_course = await course_service.add_content_to_section(course_id, section_index, content_data)
            if not updated_course:
                raise HTTPException(status_code=400, detail="İçerik eklenemedi")
            return updated_course
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Kullanıcı Kursları
    @staticmethod
    async def get_user_courses(
        current_user: User = Depends(get_current_user)
    ) -> List[Dict[str, Any]]:
        """
        Kullanıcının kayıtlı olduğu kursları getirir.
        
        Args:
            current_user: Mevcut kullanıcı
            
        Returns:
            Kurs ve ilerleme bilgisi listesi
        """
        try:
            return await course_service.get_user_courses(current_user.id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Kullanıcı Sertifikaları
    @staticmethod
    async def get_user_certificates(
        current_user: User = Depends(get_current_user)
    ) -> List[Certificate]:
        """
        Kullanıcının sertifikalarını getirir.
        
        Args:
            current_user: Mevcut kullanıcı
            
        Returns:
            Sertifika listesi
        """
        try:
            return await course_service.get_user_certificates(current_user.id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Kurs İlerleme Güncelleme
    @staticmethod
    async def update_progress(
        course_id: PydanticObjectId = Path(..., description="Kurs ID"),
        content_id: str = Body(..., description="İçerik ID"),
        is_completed: bool = Body(True, description="İçerik tamamlandı mı?"),
        quiz_score: Optional[float] = Body(None, description="Quiz puanı"),
        current_user: User = Depends(get_current_user)
    ) -> CourseProgress:
        """
        Kullanıcının kurs ilerleme durumunu günceller.
        
        Args:
            course_id: Kurs ID
            content_id: İçerik ID
            is_completed: İçerik tamamlandı mı?
            quiz_score: Quiz puanı
            current_user: Mevcut kullanıcı
            
        Returns:
            Güncellenmiş kurs ilerleme durumu
            
        Raises:
            HTTPException: Kurs bulunamadığında veya işlem başarısız olduğunda
        """
        # Kursu kontrol et
        course = await course_service.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Kurs bulunamadı")
        
        try:
            return await course_service.update_course_progress(
                current_user.id,
                course_id,
                content_id,
                is_completed,
                quiz_score
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e)) 