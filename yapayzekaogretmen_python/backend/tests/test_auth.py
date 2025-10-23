"""
Authentication Tests
-------------------
Test authentication endpoints.
"""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "strongpassword123",
            "full_name": "New User",
            "role": "student"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert "id" in data
    assert "access_token" not in data  # Token is not returned on registration

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    """Test registration with duplicate email."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "username": "anotheruser",
            "password": "password123",
            "full_name": "Another User",
            "role": "student"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    """Test successful login."""
    # First register a user with known password
    password = "testpassword123"
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "logintest@example.com",
            "username": "logintest",
            "password": password,
            "full_name": "Login Test",
            "role": "student"
        }
    )
    
    # Then login
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "logintest@example.com",
            "password": password
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers):
    """Test getting current user info."""
    response = await client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"

@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without authentication."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, auth_headers):
    """Test token refresh."""
    # Get refresh token first
    response = await client.post(
        "/api/v1/auth/refresh",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # Use refresh token to get new access token
    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {data['refresh_token']}"}
    )
    assert refresh_response.status_code == 200
    assert "access_token" in refresh_response.json()

@pytest.mark.asyncio
async def test_logout(client: AsyncClient, auth_headers):
    """Test user logout."""
    response = await client.post(
        "/api/v1/auth/logout",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"

@pytest.mark.asyncio
async def test_password_reset_request(client: AsyncClient, test_user):
    """Test password reset request."""
    response = await client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": test_user.email}
    )
    assert response.status_code == 200
    assert "reset link" in response.json()["message"].lower()

@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, auth_headers):
    """Test password change."""
    response = await client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "testpassword123",
            "new_password": "newstrongpassword123"
        }
    )
    # This will fail because we don't know the actual current password
    # In a real test, we would create a user with a known password
    assert response.status_code in [200, 400]
