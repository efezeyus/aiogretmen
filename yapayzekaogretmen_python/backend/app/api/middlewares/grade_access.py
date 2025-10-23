"""
Grade-Based Access Control Middleware

ÖNEMLİ GÜVENLIK KURALI:
- Öğrenci SADECE kendi sınıfının kaynaklarına erişebilir
- 5. sınıf öğrencisi → Sadece 5. sınıf dersleri
- URL manipülasyonu engellenir
- Backend'de doğrulama yapılır
"""

from fastapi import HTTPException, status
from typing import Optional
from loguru import logger


class GradeAccessControl:
    """Sınıf bazlı erişim kontrolü"""
    
    @staticmethod
    def validate_grade_access(
        user_grade: int,
        resource_grade: int,
        resource_type: str = "lesson",
        resource_id: str = None
    ) -> bool:
        """
        Öğrencinin kaynağa erişim yetkisi var mı kontrol et
        
        Args:
            user_grade: Öğrencinin sınıfı
            resource_grade: Kaynağın sınıfı
            resource_type: Kaynak tipi (lesson, quiz, unit, vb.)
            resource_id: Kaynak ID'si
            
        Returns:
            bool: Erişim izni var mı?
            
        Raises:
            HTTPException: Erişim reddedilirse
        """
        
        # Admin kontrolü - Admin her şeye erişebilir
        # Bu kontrol çağıran fonksiyonda yapılmalı
        
        # Sınıf eşleşmesi kontrolü
        if user_grade != resource_grade:
            # Güvenlik log'u
            logger.warning(
                f"🚨 GRADE ACCESS DENIED: "
                f"User Grade={user_grade}, "
                f"Resource Grade={resource_grade}, "
                f"Type={resource_type}, "
                f"ID={resource_id}"
            )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "GRADE_ACCESS_DENIED",
                    "message": f"Bu {resource_grade}. sınıf {resource_type}'ine erişim yetkiniz yok.",
                    "user_grade": user_grade,
                    "resource_grade": resource_grade,
                    "suggestion": f"Sadece {user_grade}. sınıf kaynaklarına erişebilirsiniz."
                }
            )
        
        logger.info(f"✅ Grade access granted: {user_grade}. sınıf → {resource_type}")
        return True
    
    @staticmethod
    def filter_by_grade(items: list, user_grade: int, grade_field: str = "grade") -> list:
        """
        Liste içindeki öğeleri kullanıcının sınıfına göre filtrele
        
        Args:
            items: Filtrelenecek liste
            user_grade: Öğrencinin sınıfı
            grade_field: Grade bilgisinin bulunduğu alan adı
            
        Returns:
            list: Filtrelenmiş liste (sadece kendi sınıfı)
        """
        
        if not items:
            return []
        
        filtered = [
            item for item in items 
            if item.get(grade_field) == user_grade
        ]
        
        logger.info(
            f"📚 Grade filter: {len(filtered)}/{len(items)} items "
            f"(Grade {user_grade})"
        )
        
        return filtered
    
    @staticmethod
    def check_lesson_access(user_grade: int, lesson_data: dict) -> dict:
        """
        Ders erişim kontrolü
        
        Returns:
            dict: Erişim bilgisi
        """
        
        lesson_grade = lesson_data.get("grade")
        
        if lesson_grade != user_grade:
            return {
                "allowed": False,
                "reason": "grade_mismatch",
                "message": f"Bu {lesson_grade}. sınıf dersi. Senin sınıfın: {user_grade}"
            }
        
        return {
            "allowed": True
        }
    
    @staticmethod
    def get_allowed_grades(user_grade: int, user_role: str = "student") -> list:
        """
        Kullanıcının erişebileceği sınıflar
        
        Args:
            user_grade: Kullanıcının sınıfı
            user_role: Kullanıcının rolü (student, teacher, admin)
            
        Returns:
            list: Erişilebilir sınıflar
        """
        
        if user_role == "admin":
            # Admin tüm sınıflara erişebilir
            return list(range(1, 13))  # 1-12. sınıflar
        
        if user_role == "teacher":
            # Öğretmen birden fazla sınıfa erişebilir
            # Bu öğretmenin atandığı sınıflar (DB'den gelir)
            return [user_grade]  # Basitleştirilmiş
        
        # Öğrenci sadece kendi sınıfına erişebilir
        return [user_grade]
    
    @staticmethod
    def validate_curriculum_access(user_grade: int, curriculum_grade: int):
        """
        Müfredat erişim kontrolü
        """
        
        if user_grade != curriculum_grade:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "CURRICULUM_ACCESS_DENIED",
                    "message": f"{curriculum_grade}. sınıf müfredatına erişim yetkiniz yok.",
                    "user_grade": user_grade,
                    "allowed_grade": user_grade
                }
            )
        
        return True


# Singleton instance
grade_access_control = GradeAccessControl()

