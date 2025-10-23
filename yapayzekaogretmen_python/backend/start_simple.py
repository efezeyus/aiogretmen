"""
Simple FastAPI server to test basic functionality
"""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Yapay Zeka Öğretmen API - Test",
    description="Test API for debugging",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Yapay Zeka Öğretmen API Test Çalışıyor!", "status": "ok"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "test-api"}

@app.get("/api/test")
def test_endpoint():
    return {"test": "successful", "backend_dir": backend_dir}

# Test imports one by one
def test_imports():
    """Test each import to find issues"""
    imports_status = {}
    
    # Test core imports
    try:
        from app.core.config import settings
        imports_status["core.config"] = "✓"
        logger.info(f"API URL: {settings.API_URL}")
    except Exception as e:
        imports_status["core.config"] = f"✗ {str(e)}"
    
    # Test db imports
    try:
        from app.db.mongodb import get_database
        imports_status["db.mongodb"] = "✓"
    except Exception as e:
        imports_status["db.mongodb"] = f"✗ {str(e)}"
    
    # Test service imports
    try:
        from app.services.ai_service import ai_service
        imports_status["services.ai_service"] = "✓"
    except Exception as e:
        imports_status["services.ai_service"] = f"✗ {str(e)}"
    
    # Test auth imports
    try:
        from app.api.middlewares.auth import get_current_user
        imports_status["middlewares.auth"] = "✓"
    except Exception as e:
        imports_status["middlewares.auth"] = f"✗ {str(e)}"
    
    return imports_status

@app.get("/api/test-imports")
def test_imports_endpoint():
    """Test all imports and return status"""
    return test_imports()

if __name__ == "__main__":
    logger.info("Starting simple test server...")
    logger.info(f"Backend directory: {backend_dir}")
    
    # Test imports first
    logger.info("Testing imports...")
    import_results = test_imports()
    for module, status in import_results.items():
        logger.info(f"{module}: {status}")
    
    # Start server
    logger.info("Starting uvicorn server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
