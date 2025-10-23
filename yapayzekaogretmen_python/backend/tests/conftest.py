"""
Test Configuration
-----------------
Pytest configuration and fixtures.
"""
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.main import app
from app.core.config import settings
from app.db.mongodb import get_database, client
from app.models.user import User

# Test database name
TEST_DB_NAME = "test_yapayzekaogretmen"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_db():
    """Create test database."""
    # Use test database
    settings.DB_NAME = TEST_DB_NAME
    test_client = AsyncIOMotorClient(settings.MONGODB_URL)
    test_database = test_client[TEST_DB_NAME]
    
    yield test_database
    
    # Cleanup
    await test_client.drop_database(TEST_DB_NAME)
    test_client.close()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def test_user(test_db) -> User:
    """Create test user."""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "hashed_password": "hashed_password_here",
        "role": "student",
        "is_active": True,
        "is_verified": True
    }
    
    # Insert user to database
    result = await test_db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    
    return User(**user_data)

@pytest.fixture
async def auth_headers(test_user) -> dict:
    """Create authentication headers."""
    from app.api.middlewares.auth import create_access_token
    
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def admin_user(test_db) -> User:
    """Create admin user."""
    admin_data = {
        "email": "admin@example.com",
        "username": "adminuser",
        "full_name": "Admin User",
        "hashed_password": "hashed_password_here",
        "role": "admin",
        "is_active": True,
        "is_verified": True
    }
    
    result = await test_db.users.insert_one(admin_data)
    admin_data["_id"] = result.inserted_id
    
    return User(**admin_data)

@pytest.fixture
async def admin_headers(admin_user) -> dict:
    """Create admin authentication headers."""
    from app.api.middlewares.auth import create_access_token
    
    token = create_access_token(data={"sub": str(admin_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def teacher_user(test_db) -> User:
    """Create teacher user."""
    teacher_data = {
        "email": "teacher@example.com",
        "username": "teacheruser",
        "full_name": "Teacher User",
        "hashed_password": "hashed_password_here",
        "role": "teacher",
        "is_active": True,
        "is_verified": True
    }
    
    result = await test_db.users.insert_one(teacher_data)
    teacher_data["_id"] = result.inserted_id
    
    return User(**teacher_data)

@pytest.fixture
async def teacher_headers(teacher_user) -> dict:
    """Create teacher authentication headers."""
    from app.api.middlewares.auth import create_access_token
    
    token = create_access_token(data={"sub": str(teacher_user.id)})
    return {"Authorization": f"Bearer {token}"}
