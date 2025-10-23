"""
Yapay Zeka Öğretmen - Ana Uygulama
--------------------------------
FastAPI ana uygulama dosyası.
"""
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.config import settings
from app.api.routes import users, auth, ai, curriculum, lessons, payments, student_content, voice_assistant, fine_tuning, ai_monitoring, training_scheduler, admin, admin_advanced, websocket, search, notification, gamification, student_panel, system_health, personalized_learning, student, ai_training, admin_curriculum, whiteboard
from app.api.routes.auth_simple import router as auth_simple_router
# from app.api.routes import pdf_curriculum, rag_lessons
from app.api.middlewares.auth import get_current_user
from app.models.user import User
from app.core.logger import setup_logging
from app.web_app import WebApp
from app.db import connect_to_db, close_db_connections

# Sentry integration for error tracking
if settings.SENTRY_DSN and settings.ENVIRONMENT == "production":
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration(auto_enabling=True)],
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)

# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"🚀 {settings.PROJECT_NAME} başlatılıyor...")
    setup_logging()
    
    # Gerekli klasörleri oluştur
    for directory in [settings.MEDIA_ROOT, settings.LOGS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
    
    # Veritabanı bağlantıları
    await connect_to_db()
    
    logger.info(f"✅ {settings.PROJECT_NAME} başlatıldı - Sürüm: {settings.VERSION}")
    logger.info(f"📖 API Docs: http://{settings.HOST}:{settings.PORT}/api/docs")
    
    yield
    
    # Shutdown
    logger.info(f"🛑 {settings.PROJECT_NAME} kapatılıyor...")
    await close_db_connections()
    logger.info("👋 Güle güle!")

# FastAPI uygulamasını oluştur
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/api/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Add security headers
    for header, value in settings.SECURITY_HEADERS.items():
        response.headers[header] = value
    
    # Add custom headers
    response.headers["X-API-Version"] = settings.VERSION
    response.headers["X-Environment"] = settings.ENVIRONMENT
    
    return response

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    
    # Log slow requests in development
    if settings.ENVIRONMENT == "development" and process_time > 1.0:
        logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
    
    return response

# Trusted hosts (security)
if settings.ENVIRONMENT == "production":
    allowed_hosts = ["yapayzekaogretmen.com", "www.yapayzekaogretmen.com", "api.yapayzekaogretmen.com"]
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS yapılandırması
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-API-Version"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Static files (only in development and staging)
if settings.ENVIRONMENT in ["development", "staging"]:
    app.mount("/static", StaticFiles(directory=settings.STATIC_ROOT), name="static")
    app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    
    if settings.ENVIRONMENT == "development":
        # In development, return detailed error
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": str(exc),
                "type": type(exc).__name__,
                "path": str(request.url.path),
            }
        )
    else:
        # In production, return generic error
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                "error_id": str(int(time.time()))
            }
        )

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path),
        }
    )

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Root endpoint with rate limiting
@app.get("/", tags=["Root"])
@limiter.limit("30/minute")
async def root(request: Request):
    """Ana endpoint - API bilgilerini döndürür."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/api/docs" if settings.ENVIRONMENT != "production" else "Contact admin for API documentation",
        "health": "/health",
        "api_prefix": settings.API_PREFIX,
        "message": "Yapay Zeka Öğretmen API'sine hoş geldiniz! 🤖📚"
    }

# API Routes
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(auth_simple_router, prefix="/api/auth_simple", tags=["Simple Auth"])
# app.include_router(pdf_curriculum.router, prefix="/api", tags=["PDF Curriculum"])
# app.include_router(rag_lessons.router, prefix="/api", tags=["RAG Lessons"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Teacher"])
app.include_router(curriculum.router, prefix="/api/curriculum", tags=["Curriculum"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(student_content.router, prefix="/api/student-content", tags=["Student Content"])
app.include_router(voice_assistant.router, prefix="/api/voice", tags=["Voice Assistant"])
app.include_router(fine_tuning.router, prefix="/api/fine-tuning", tags=["Fine Tuning"])
app.include_router(ai_monitoring.router, prefix="/api", tags=["AI Monitoring"])
app.include_router(training_scheduler.router, prefix="/api", tags=["Training Scheduler"])
app.include_router(admin.router, prefix="/api", tags=["Admin Panel"])
app.include_router(admin_advanced.router, prefix="/api", tags=["Admin Advanced"])
app.include_router(admin_curriculum.router, prefix="/api/admin", tags=["Admin Curriculum & Students"])
app.include_router(websocket.router, prefix="/api", tags=["WebSocket"])
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(notification.router, prefix="/api", tags=["Notifications"])
app.include_router(gamification.router, prefix="/api", tags=["Gamification"])
app.include_router(student_panel.router, prefix="/api", tags=["Student Panel"])
app.include_router(system_health.router, prefix="/api", tags=["System Health"])
app.include_router(personalized_learning.router, prefix="/api", tags=["Personalized Learning"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])
app.include_router(ai_training.router, prefix="/api/ai-training", tags=["AI Training"])
app.include_router(whiteboard.router, prefix="/api", tags=["AI Whiteboard"])

# GraphQL endpoint
from app.api.routes.graphql_route import graphql_app
app.include_router(graphql_app, prefix="/api/graphql")

# Web uygulamasını entegre et (sadece development ve staging'de)
if settings.ENVIRONMENT in ["development", "staging"]:
    web_app = WebApp(app)

# Production'da ekstra güvenlik
if settings.ENVIRONMENT == "production":
    # Disable server header
    @app.middleware("http")
    async def remove_server_header(request: Request, call_next):
        response = await call_next(request)
        if "server" in response.headers:
            del response.headers["server"]
        return response

# Startup banner
@app.on_event("startup")
async def display_startup_banner():
    banner = f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║               🤖 YAPAY ZEKA ÖĞRETMEN API 📚                 ║
    ║                                                              ║
    ║  Sürüm: {settings.VERSION:<10} Ortam: {settings.ENVIRONMENT:<12}           ║
    ║  Port: {settings.PORT:<12} Host: {settings.HOST:<15}        ║
    ║                                                              ║
    ║  API Docs: /api/docs   Health: /health                      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    logger.info(banner)
    
    # Redis cache bağlantısı (Opsiyonel)
    try:
        from app.services.cache_service import cache
        await cache.connect()
        logger.info("✅ Redis cache bağlantısı başarılı")
    except ImportError:
        logger.warning("⚠️ Cache service bulunamadı (opsiyonel)")
    except Exception as e:
        logger.warning(f"⚠️ Redis cache bağlantısı başarısız: {e}")
        logger.warning("Sistem cache olmadan devam edecek")
    
    # Elasticsearch bağlantısı (Opsiyonel)
    try:
        from app.services.search_service import search_service
        await search_service.connect()
        logger.info("✅ Elasticsearch bağlantısı başarılı")
    except ImportError:
        logger.warning("⚠️ Search service bulunamadı (opsiyonel)")
    except Exception as e:
        logger.warning(f"⚠️ Elasticsearch bağlantısı başarısız: {e}")
        logger.warning("Sistem arama servisi olmadan devam edecek")
    
    # Notification servisi başlat (Opsiyonel)
    try:
        from app.services.notification_service import notification_service
        await notification_service.initialize()
        logger.info("✅ Notification servisi başlatıldı")
    except ImportError:
        logger.warning("⚠️ Notification service bulunamadı (opsiyonel)")
    except Exception as e:
        logger.warning(f"⚠️ Notification servisi başlatma hatası: {e}")
        logger.warning("Sistem bildirimler olmadan devam edecek")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    ) 