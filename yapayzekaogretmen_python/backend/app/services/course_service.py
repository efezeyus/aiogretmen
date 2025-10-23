"""
Yapay Zeka Öğretmen - Kurs Servisi
---------------------------------
Kurs yönetimi için servis fonksiyonları.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from beanie import PydanticObjectId

from app.models.course import Course, CourseProgress, Certificate, CourseStatus, CourseContent, CourseSection
from app.models.user import User


async def get_courses(
    skip: int = 0, 
    limit: int = 10, 
    status: Optional[CourseStatus] = None, 
    category: Optional[str] = None,
    instructor_id: Optional[PydanticObjectId] = None,
    search_term: Optional[str] = None
) -> List[Course]:
    """
    Kriterlere göre kursları getirir.
    
    Args:
        skip: Atlanacak kayıt sayısı (sayfalama için)
        limit: Getirilecek maksimum kayıt sayısı
        status: Kurs durumu filtresi
        category: Kategori filtresi
        instructor_id: Eğitmen ID filtresi
        search_term: Arama terimi (başlık ve açıklamada arar)
    
    Returns:
        Kurs listesi
    """
    query = {}
    
    # Filtreler
    if status:
        query["status"] = status
    
    if category:
        query["category"] = category
    
    if instructor_id:
        query["instructor._id"] = instructor_id
    
    if search_term:
        # Başlık veya açıklamada arama
        query["$or"] = [
            {"title": {"$regex": search_term, "$options": "i"}},
            {"description": {"$regex": search_term, "$options": "i"}}
        ]
    
    # Sorguyu çalıştır
    courses = await Course.find(query).skip(skip).limit(limit).to_list()
    return courses


async def get_course_by_id(course_id: PydanticObjectId) -> Optional[Course]:
    """
    ID'ye göre kursu getirir.
    
    Args:
        course_id: Kurs ID
    
    Returns:
        Kurs nesnesi veya None
    """
    return await Course.get(course_id)


async def create_course(course_data: Dict[str, Any], instructor: User) -> Course:
    """
    Yeni kurs oluşturur.
    
    Args:
        course_data: Kurs verileri
        instructor: Eğitmen kullanıcı
    
    Returns:
        Oluşturulan kurs
    """
    # Varsayılan değerleri ayarla
    course_data["instructor"] = instructor
    course_data["created_at"] = datetime.utcnow()
    course_data["updated_at"] = datetime.utcnow()
    
    # Kurs nesnesi oluştur
    course = Course(**course_data)
    
    # Veritabanına kaydet
    await course.insert()
    
    return course


async def update_course(course_id: PydanticObjectId, course_data: Dict[str, Any]) -> Optional[Course]:
    """
    Mevcut kursu günceller.
    
    Args:
        course_id: Kurs ID
        course_data: Güncellenecek veriler
    
    Returns:
        Güncellenmiş kurs veya None
    """
    # Kursu bul
    course = await get_course_by_id(course_id)
    if not course:
        return None
    
    # Güncellenme tarihini ayarla
    course_data["updated_at"] = datetime.utcnow()
    
    # Kursu güncelle
    await course.update({"$set": course_data})
    
    # Güncel kursu getir
    return await get_course_by_id(course_id)


async def delete_course(course_id: PydanticObjectId) -> bool:
    """
    Kursu siler.
    
    Args:
        course_id: Kurs ID
    
    Returns:
        Başarı durumu
    """
    course = await get_course_by_id(course_id)
    if not course:
        return False
    
    await course.delete()
    return True


async def add_section_to_course(course_id: PydanticObjectId, section_data: Dict[str, Any]) -> Optional[Course]:
    """
    Kursa yeni bölüm ekler.
    
    Args:
        course_id: Kurs ID
        section_data: Bölüm verileri
    
    Returns:
        Güncellenmiş kurs veya None
    """
    course = await get_course_by_id(course_id)
    if not course:
        return None
    
    # Bölüm sırasını ayarla
    if not section_data.get("order"):
        section_data["order"] = len(course.sections) + 1
    
    # Yeni bölüm oluştur
    new_section = CourseSection(**section_data)
    
    # Bölümü kursa ekle
    course.sections.append(new_section)
    course.updated_at = datetime.utcnow()
    
    await course.save()
    return course


async def add_content_to_section(
    course_id: PydanticObjectId, 
    section_index: int, 
    content_data: Dict[str, Any]
) -> Optional[Course]:
    """
    Bölüme yeni içerik ekler.
    
    Args:
        course_id: Kurs ID
        section_index: Bölüm indeksi
        content_data: İçerik verileri
    
    Returns:
        Güncellenmiş kurs veya None
    """
    course = await get_course_by_id(course_id)
    if not course or section_index >= len(course.sections):
        return None
    
    # İçerik sırasını ayarla
    if not content_data.get("order"):
        content_data["order"] = len(course.sections[section_index].contents) + 1
    
    # Yeni içerik oluştur
    new_content = CourseContent(**content_data)
    
    # İçeriği bölüme ekle
    course.sections[section_index].contents.append(new_content)
    course.updated_at = datetime.utcnow()
    
    await course.save()
    return course


async def get_user_course_progress(user_id: PydanticObjectId, course_id: PydanticObjectId) -> Optional[CourseProgress]:
    """
    Kullanıcının kurs ilerleme durumunu getirir.
    
    Args:
        user_id: Kullanıcı ID
        course_id: Kurs ID
    
    Returns:
        Kurs ilerleme durumu veya None
    """
    return await CourseProgress.find_one({"user._id": user_id, "course._id": course_id})


async def update_course_progress(
    user_id: PydanticObjectId, 
    course_id: PydanticObjectId, 
    content_id: str, 
    is_completed: bool = True,
    quiz_score: Optional[float] = None
) -> CourseProgress:
    """
    Kullanıcının kurs ilerleme durumunu günceller.
    
    Args:
        user_id: Kullanıcı ID
        course_id: Kurs ID
        content_id: İçerik ID
        is_completed: İçerik tamamlandı mı?
        quiz_score: Varsa quiz puanı
    
    Returns:
        Güncellenmiş kurs ilerleme durumu
    """
    # Kullanıcı ve kursu getir
    user = await User.get(user_id)
    course = await Course.get(course_id)
    
    if not user or not course:
        raise ValueError("Kullanıcı veya kurs bulunamadı")
    
    # İlerleme kaydını getir veya oluştur
    progress = await get_user_course_progress(user_id, course_id)
    if not progress:
        progress = CourseProgress(
            user=user,
            course=course,
            started_at=datetime.utcnow()
        )
    
    # Son erişilen içerik
    progress.last_accessed_content_id = content_id
    
    # İçerik tamamlandıysa listeye ekle
    if is_completed and content_id not in progress.completed_content_ids:
        progress.completed_content_ids.append(content_id)
    
    # Quiz puanını güncelle
    if quiz_score is not None:
        progress.quiz_scores[content_id] = quiz_score
    
    # İlerleme yüzdesini hesapla
    total_content_count = _count_total_course_content(course)
    if total_content_count > 0:
        progress.progress_percentage = (len(progress.completed_content_ids) / total_content_count) * 100
    
    # Kurs tamamlandı mı kontrol et
    if progress.progress_percentage >= 100 and not progress.completed_at:
        progress.completed_at = datetime.utcnow()
        # Sertifika oluştur
        await create_certificate(user_id, course_id)
    
    # Kaydet
    await progress.save()
    return progress


def _count_total_course_content(course: Course) -> int:
    """
    Kurstaki toplam içerik sayısını hesaplar.
    
    Args:
        course: Kurs nesnesi
    
    Returns:
        Toplam içerik sayısı
    """
    count = 0
    for section in course.sections:
        count += len([content for content in section.contents if content.is_required])
    return count


async def create_certificate(user_id: PydanticObjectId, course_id: PydanticObjectId) -> Certificate:
    """
    Kurs tamamlama sertifikası oluşturur.
    
    Args:
        user_id: Kullanıcı ID
        course_id: Kurs ID
    
    Returns:
        Oluşturulan sertifika
    """
    # Mevcut sertifikayı kontrol et
    existing_cert = await Certificate.find_one({"user._id": user_id, "course._id": course_id})
    if existing_cert:
        return existing_cert
    
    # Kullanıcı ve kursu getir
    user = await User.get(user_id)
    course = await Course.get(course_id)
    
    if not user or not course:
        raise ValueError("Kullanıcı veya kurs bulunamadı")
    
    # Benzersiz sertifika ID oluştur
    certificate_id = f"CERT-{uuid.uuid4().hex[:8].upper()}"
    
    # Sertifika nesnesi oluştur
    certificate = Certificate(
        user=user,
        course=course,
        certificate_id=certificate_id,
        issue_date=datetime.utcnow()
    )
    
    # Veritabanına kaydet
    await certificate.insert()
    
    return certificate


async def get_user_certificates(user_id: PydanticObjectId) -> List[Certificate]:
    """
    Kullanıcının tüm sertifikalarını getirir.
    
    Args:
        user_id: Kullanıcı ID
    
    Returns:
        Sertifika listesi
    """
    return await Certificate.find({"user._id": user_id}).to_list()


async def get_user_courses(user_id: PydanticObjectId) -> List[Dict[str, Any]]:
    """
    Kullanıcının kayıtlı olduğu tüm kursları getirir.
    
    Args:
        user_id: Kullanıcı ID
    
    Returns:
        Kurs ve ilerleme bilgisi listesi
    """
    # Kullanıcının ilerleme kayıtlarını getir
    progress_records = await CourseProgress.find({"user._id": user_id}).to_list()
    
    # Kurs bilgilerini ve ilerleme durumlarını birleştir
    result = []
    for progress in progress_records:
        course = await Course.get(progress.course.id)
        if course:
            result.append({
                "course": course,
                "progress": progress
            })
    
    return result 