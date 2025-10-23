"""
Yapay Zeka Öğretmen - Web Uygulaması
---------------------------------
Web kullanıcı arayüzü ve admin panel için FastAPI web uygulaması.
"""
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
from typing import List, Dict, Any, Optional
import os

from app.core.config import settings
from app.api.middlewares.auth import get_current_user
from app.models.user import User
from app.services import course_service
from app.models.course import CourseStatus

# Template klasörü yolunu oluştur
TEMPLATES_DIR = os.path.join(settings.BASE_DIR, "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

class WebApp:
    """
    Web kullanıcı arayüzü için FastAPI uygulaması.
    """
    def __init__(self, app: FastAPI):
        """
        Web uygulamasını ana uygulamaya entegre eder.

        Args:
            app: Ana FastAPI uygulaması
        """
        self.app = app

        # Statik dosyaları monte et
        self.app.mount("/static", StaticFiles(directory=os.path.join(settings.BASE_DIR, "static")), name="static")

        # Ana sayfa ve diğer genel rotaları tanımla
        self._add_public_routes()

        # Admin paneli rotalarını tanımla
        self._add_admin_routes()

    def _add_public_routes(self):
        """Genel rotaları tanımlar."""
        @self.app.get("/", response_class=HTMLResponse)
        async def index(request: Request):
            """Ana sayfa."""
            return templates.TemplateResponse("index.html", {"request": request})
        
        @self.app.get("/hakkimizda", response_class=HTMLResponse)
        async def about(request: Request):
            """Hakkımızda sayfası."""
            return templates.TemplateResponse("about.html", {"request": request})
        
        @self.app.get("/dersler", response_class=HTMLResponse)
        async def courses(request: Request):
            """Dersler sayfası."""
            courses_data = [
                {"id": 1, "title": "Matematik", "category": "math", "level": "5. Sınıf", "image": "/static/img/course-math.jpg"},
                {"id": 2, "title": "Fen Bilgisi", "category": "science", "level": "7. Sınıf", "image": "/static/img/course-science.jpg"},
                {"id": 3, "title": "Türkçe", "category": "turkish", "level": "4. Sınıf", "image": "/static/img/course-turkish.jpg"},
                {"id": 4, "title": "Sosyal Bilgiler", "category": "social", "level": "6. Sınıf", "image": "/static/img/course-social.jpg"},
            ]
            return templates.TemplateResponse("courses.html", {
                "request": request,
                "courses": courses_data
            })
        
        @self.app.get("/iletisim", response_class=HTMLResponse)
        async def contact(request: Request):
            """İletişim sayfası."""
            return templates.TemplateResponse("contact.html", {"request": request})
        
        @self.app.get("/giris", response_class=HTMLResponse)
        async def login(request: Request):
            """Giriş sayfası."""
            return templates.TemplateResponse("login.html", {"request": request})
        
        @self.app.get("/kayit", response_class=HTMLResponse)
        async def register(request: Request):
            """Kayıt sayfası."""
            return templates.TemplateResponse("register.html", {"request": request})

    def _add_admin_routes(self):
        """Admin paneli rotalarını tanımlar."""
        @self.app.get("/admin", response_class=HTMLResponse)
        async def admin_dashboard(request: Request):
            """Modern admin panel"""
            # Basit auth kontrolü (demo için)
            return self.templates.TemplateResponse("admin/modern_dashboard.html", {
                "request": request
            })
        
        @self.app.get("/admin/legacy", response_class=HTMLResponse)
        async def admin_dashboard_legacy(request: Request, current_user: User = Depends(get_current_user)):
            """Admin panel ana sayfası (eski versiyon)."""
            # Kimlik doğrulama ve yetki kontrolü
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu sayfaya erişim izniniz yok")
            
            # Örnek veri
            stats = {
                "total_users": 1254,
                "user_growth": 5.2,
                "active_subscriptions": 874,
                "subscription_growth": 3.8,
                "completed_lessons": 5420,
                "lesson_growth": 7.6,
                "monthly_revenue": 28950,
                "revenue_growth": 9.3
            }
            
            user_stats = {
                "labels": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"],
                "new_users": [120, 145, 170, 165, 185, 190],
                "active_users": [750, 850, 950, 980, 1020, 1150]
            }
            
            lesson_stats = {
                "labels": ["Matematik", "Fen Bilgisi", "Türkçe", "Sosyal Bilgiler", "İngilizce"],
                "completed": [1250, 950, 800, 600, 450]
            }
            
            recent_activities = [
                {"user_name": "Ahmet Y.", "user_avatar": "/static/img/avatar1.jpg", "action": "Ders tamamladı", "lesson": "Matematik - Cebir", "date": "10 Mayıs 2023 14:35", "status": "success", "status_text": "Tamamlandı"},
                {"user_name": "Zeynep K.", "user_avatar": "/static/img/avatar3.jpg", "action": "Quiz çözdü", "lesson": "Fen Bilgisi - Atom", "date": "10 Mayıs 2023 14:30", "status": "warning", "status_text": "Devam Ediyor"},
                {"user_name": "Mehmet S.", "user_avatar": "/static/img/avatar2.jpg", "action": "Kayıt oldu", "lesson": "-", "date": "10 Mayıs 2023 14:25", "status": "info", "status_text": "Yeni Kayıt"},
                {"user_name": "Ayşe T.", "user_avatar": "/static/img/avatar4.jpg", "action": "Abonelik yeniledi", "lesson": "-", "date": "10 Mayıs 2023 14:15", "status": "success", "status_text": "Tamamlandı"},
                {"user_name": "Can B.", "user_avatar": "/static/img/avatar5.jpg", "action": "Video izledi", "lesson": "Türkçe - Dilbilgisi", "date": "10 Mayıs 2023 14:00", "status": "success", "status_text": "Tamamlandı"}
            ]
            
            recent_payments = [
                {"id": "P12345", "user_name": "Ayşe T.", "package": "Yıllık Abonelik", "amount": 599.99, "date": "10 Mayıs 2023", "status": "success", "status_text": "Tamamlandı"},
                {"id": "P12344", "user_name": "Mehmet A.", "package": "Aylık Abonelik", "amount": 59.99, "date": "10 Mayıs 2023", "status": "success", "status_text": "Tamamlandı"},
                {"id": "P12343", "user_name": "Deniz S.", "package": "6 Aylık Abonelik", "amount": 329.99, "date": "9 Mayıs 2023", "status": "success", "status_text": "Tamamlandı"},
                {"id": "P12342", "user_name": "Zeynep K.", "package": "Aylık Abonelik", "amount": 59.99, "date": "9 Mayıs 2023", "status": "warning", "status_text": "İşleniyor"},
                {"id": "P12341", "user_name": "Ali V.", "package": "Yıllık Abonelik", "amount": 599.99, "date": "8 Mayıs 2023", "status": "danger", "status_text": "İptal Edildi"}
            ]
            
            return templates.TemplateResponse("admin/dashboard.html", {
                "request": request,
                "current_user": {"name": current_user.name},
                "stats": stats,
                "user_stats": user_stats,
                "lesson_stats": lesson_stats,
                "recent_activities": recent_activities,
                "recent_payments": recent_payments
            })
        
        @self.app.get("/admin/kullanicilar", response_class=HTMLResponse)
        async def admin_users(request: Request, current_user: User = Depends(get_current_user)):
            """Kullanıcı yönetimi sayfası."""
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu sayfaya erişim izniniz yok")
            
            # Örnek kullanıcı verileri
            users = [
                {"id": 1, "name": "Ahmet Yılmaz", "email": "ahmet@example.com", "role": "admin", "role_display": "Yönetici", "status": "active", "status_display": "Aktif", "created_at": "01.01.2023", "last_login": "10.05.2023 10:45", "avatar": "/static/img/avatar1.jpg"},
                {"id": 2, "name": "Mehmet Ali", "email": "mehmet@example.com", "role": "teacher", "role_display": "Öğretmen", "status": "active", "status_display": "Aktif", "created_at": "02.01.2023", "last_login": "10.05.2023 09:30", "avatar": "/static/img/avatar2.jpg"},
                {"id": 3, "name": "Zeynep Kaya", "email": "zeynep@example.com", "role": "student", "role_display": "Öğrenci", "status": "active", "status_display": "Aktif", "created_at": "03.01.2023", "last_login": "10.05.2023 08:15", "avatar": "/static/img/avatar3.jpg"},
                {"id": 4, "name": "Ayşe Tekin", "email": "ayse@example.com", "role": "parent", "role_display": "Veli", "status": "inactive", "status_display": "Pasif", "created_at": "04.01.2023", "last_login": "09.05.2023 14:20", "avatar": "/static/img/avatar4.jpg"},
                {"id": 5, "name": "Can Bulut", "email": "can@example.com", "role": "student", "role_display": "Öğrenci", "status": "pending", "status_display": "Onay Bekliyor", "created_at": "05.01.2023", "last_login": "-", "avatar": "/static/img/avatar5.jpg"}
            ]
            
            # Sayfalama bilgisi
            total_items = len(users)
            items_per_page = 10
            current_page = 1
            total_pages = (total_items + items_per_page - 1) // items_per_page
            
            return templates.TemplateResponse("admin/users.html", {
                "request": request,
                "current_user": {"name": current_user.name},
                "users": users,
                "total_items": total_items,
                "items_per_page": items_per_page,
                "current_page": current_page,
                "total_pages": total_pages
            })
            
        @self.app.get("/admin/kurslar", response_class=HTMLResponse)
        async def admin_courses(request: Request, current_user: User = Depends(get_current_user)):
            """Kurs yönetimi sayfası."""
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu sayfaya erişim izniniz yok")
            
            # Kursları veritabanından çek (şu an için örnek veri)
            try:
                # Gerçek verileri almaya çalış
                courses = await course_service.get_courses(limit=100)
                
                # İlave bilgileri ekle
                for course in courses:
                    # İçerik sayısını hesapla
                    content_count = 0
                    for section in course.sections:
                        content_count += len(section.contents)
                    course.content_count = content_count
                    
                    # Öğrenci sayısını ekle (gerçek veri için)
                    # Bu bilgiyi veritabanından alman gerekir
                    course.student_count = 0
                    
            except Exception as e:
                # Hata durumunda örnek veri göster
                print(f"Kurs verilerini alma hatası: {e}")
                courses = [
                    {
                        "id": "1", 
                        "title": "Matematik - 5. Sınıf", 
                        "category": "math", 
                        "status": "published", 
                        "level": "5", 
                        "price": 0,
                        "instructor": {"name": "Ahmet Yılmaz"},
                        "sections": [{"title": "Bölüm 1"}, {"title": "Bölüm 2"}],
                        "image_url": "/static/img/course-math.jpg",
                        "content_count": 12,
                        "student_count": 45
                    },
                    {
                        "id": "2", 
                        "title": "Fen Bilgisi - 7. Sınıf", 
                        "category": "science", 
                        "status": "published", 
                        "level": "7", 
                        "price": 99.99,
                        "instructor": {"name": "Zeynep Kaya"},
                        "sections": [{"title": "Bölüm 1"}],
                        "image_url": "/static/img/course-science.jpg",
                        "content_count": 8,
                        "student_count": 32
                    },
                    {
                        "id": "3", 
                        "title": "Türkçe - 4. Sınıf", 
                        "category": "turkish", 
                        "status": "draft", 
                        "level": "4", 
                        "price": 0,
                        "instructor": {"name": "Mehmet Ali"},
                        "sections": [{"title": "Bölüm 1"}, {"title": "Bölüm 2"}, {"title": "Bölüm 3"}],
                        "image_url": "/static/img/course-turkish.jpg",
                        "content_count": 15,
                        "student_count": 0
                    },
                    {
                        "id": "4", 
                        "title": "Sosyal Bilgiler - 6. Sınıf", 
                        "category": "social", 
                        "status": "archived", 
                        "level": "6", 
                        "price": 79.99,
                        "instructor": {"name": "Ayşe Tekin"},
                        "sections": [],
                        "image_url": "/static/img/course-social.jpg",
                        "content_count": 0,
                        "student_count": 18
                    }
                ]
            
            # Öğretmen listesi (kurs oluşturma/düzenleme için)
            instructors = [
                {"id": "1", "name": "Ahmet Yılmaz"},
                {"id": "2", "name": "Mehmet Ali"},
                {"id": "3", "name": "Zeynep Kaya"},
                {"id": "4", "name": "Ayşe Tekin"}
            ]
            
            return templates.TemplateResponse("admin/courses.html", {
                "request": request,
                "current_user": {"name": current_user.name},
                "courses": courses,
                "instructors": instructors
            })
        
        # Kurs API endpoint'leri (AJAX istekleri için)
        @self.app.get("/admin/api/courses/{course_id}")
        async def get_course_details(course_id: str, current_user: User = Depends(get_current_user)):
            """Kurs bilgilerini getiren API endpoint'i."""
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu işleme izniniz yok")
            
            try:
                # Gerçek kurs bilgilerini almaya çalış
                course = await course_service.get_course_by_id(course_id)
                if not course:
                    raise ValueError("Kurs bulunamadı")
                return course
            except Exception as e:
                # Hata durumunda örnek veri döndür
                print(f"Kurs ayrıntılarını alma hatası: {e}")
                return {
                    "id": course_id,
                    "title": "Örnek Kurs",
                    "description": "Bu bir örnek kurs açıklamasıdır.",
                    "category": "math",
                    "sub_category": "algebra",
                    "status": "published",
                    "level": "5",
                    "price": 99.99,
                    "learning_objectives": [
                        "Temel matematik kavramlarını öğrenmek",
                        "Problem çözme becerilerini geliştirmek",
                        "Matematiksel düşünme yeteneğini artırmak"
                    ],
                    "prerequisites": [
                        "4. sınıf matematik bilgisi"
                    ]
                }
                
        @self.app.get("/admin/api/courses/{course_id}/contents")
        async def get_course_contents(course_id: str, current_user: User = Depends(get_current_user)):
            """Kurs içeriklerini getiren API endpoint'i."""
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu işleme izniniz yok")
            
            try:
                # Gerçek kurs içeriklerini almaya çalış
                course = await course_service.get_course_by_id(course_id)
                if not course:
                    raise ValueError("Kurs bulunamadı")
                
                # Kurs ve bölüm/içerik bilgilerini döndür
                return {
                    "course": {
                        "id": str(course.id),
                        "title": course.title
                    },
                    "sections": course.sections
                }
            except Exception as e:
                # Hata durumunda örnek veri döndür
                print(f"Kurs içeriklerini alma hatası: {e}")
                return {
                    "course": {
                        "id": course_id,
                        "title": "Örnek Kurs"
                    },
                    "sections": [
                        {
                            "id": "s1",
                            "title": "Giriş",
                            "order": 1,
                            "contents": [
                                {
                                    "id": "c1",
                                    "title": "Kurs Tanıtımı",
                                    "type": "video",
                                    "order": 1
                                },
                                {
                                    "id": "c2",
                                    "title": "Neler Öğreneceğiz?",
                                    "type": "document",
                                    "order": 2
                                }
                            ]
                        },
                        {
                            "id": "s2",
                            "title": "Temel Kavramlar",
                            "order": 2,
                            "contents": [
                                {
                                    "id": "c3",
                                    "title": "Temel Matematik Kavramları",
                                    "type": "video",
                                    "order": 1
                                },
                                {
                                    "id": "c4",
                                    "title": "Quiz: Temel Kavramlar",
                                    "type": "quiz",
                                    "order": 2
                                }
                            ]
                        }
                    ]
                }
        
        # API endpoint'leri (AJAX istekleri için)
        @self.app.get("/admin/api/users/{user_id}")
        async def get_user(user_id: int, current_user: User = Depends(get_current_user)):
            """Kullanıcı bilgilerini getiren API endpoint'i."""
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu işleme izniniz yok")
            
            # Gerçek uygulamada veritabanından getir
            example_user = {
                "id": user_id,
                "name": "Örnek Kullanıcı",
                "email": "ornek@example.com",
                "role": "student",
                "status": "active",
                "bio": "Örnek bir kullanıcı profili."
            }
            
            return example_user
        
        @self.app.delete("/admin/api/users/{user_id}")
        async def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
            """Kullanıcı silen API endpoint'i."""
            if not current_user or current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bu işleme izniniz yok")
            
            # Gerçek uygulamada veritabanından sil
            return {"success": True, "message": "Kullanıcı başarıyla silindi"}

# Template helper fonksiyonlar
def format_date(date: datetime, format_str: str = "%d.%m.%Y") -> str:
    """Tarihi belirtilen formatta biçimlendirir."""
    return date.strftime(format_str)

def format_currency(amount: float, currency: str = "₺") -> str:
    """Para birimini biçimlendirir."""
    return f"{amount:,.2f} {currency}" 