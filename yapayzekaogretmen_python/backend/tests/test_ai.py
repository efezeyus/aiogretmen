"""
AI Service Tests
---------------
Test AI-related endpoints.
"""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ask_question(client: AsyncClient, auth_headers):
    """Test asking a question to AI."""
    response = await client.post(
        "/api/v1/ai/ask",
        headers=auth_headers,
        json={
            "question": "5. sınıf matematik konularından hangisi daha zor?",
            "context": "matematik",
            "grade": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "confidence" in data
    assert len(data["answer"]) > 0

@pytest.mark.asyncio
async def test_ask_question_unauthorized(client: AsyncClient):
    """Test asking question without authentication."""
    response = await client.post(
        "/api/v1/ai/ask",
        json={
            "question": "Test question",
            "context": "math"
        }
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_generate_quiz(client: AsyncClient, teacher_headers):
    """Test quiz generation."""
    response = await client.post(
        "/api/v1/ai/generate-quiz",
        headers=teacher_headers,
        json={
            "topic": "Kesirler",
            "grade": 5,
            "subject": "matematik",
            "question_count": 5,
            "difficulty": "medium"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) == 5
    
    # Check question structure
    for question in data["questions"]:
        assert "question" in question
        assert "options" in question
        assert "correct_answer" in question
        assert len(question["options"]) >= 4

@pytest.mark.asyncio
async def test_analyze_performance(client: AsyncClient, auth_headers):
    """Test performance analysis."""
    response = await client.post(
        "/api/v1/ai/analyze-performance",
        headers=auth_headers,
        json={
            "student_id": "test_student_id",
            "subject": "matematik",
            "period": "last_month"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert "recommendations" in data
    assert "strengths" in data
    assert "weaknesses" in data

@pytest.mark.asyncio
async def test_get_explanation(client: AsyncClient, auth_headers):
    """Test getting explanation for a topic."""
    response = await client.post(
        "/api/v1/ai/explain",
        headers=auth_headers,
        json={
            "topic": "Kesirler nedir?",
            "grade": 5,
            "detail_level": "simple"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert "examples" in data
    assert len(data["explanation"]) > 50  # Should be a meaningful explanation

@pytest.mark.asyncio
async def test_solve_problem(client: AsyncClient, auth_headers):
    """Test problem solving with steps."""
    response = await client.post(
        "/api/v1/ai/solve",
        headers=auth_headers,
        json={
            "problem": "3/4 + 1/2 işleminin sonucu nedir?",
            "show_steps": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "solution" in data
    assert "steps" in data
    assert len(data["steps"]) > 0

@pytest.mark.asyncio
async def test_chat_with_ai(client: AsyncClient, auth_headers):
    """Test AI chat functionality."""
    response = await client.post(
        "/api/v1/ai/chat",
        headers=auth_headers,
        json={
            "message": "Merhaba, bugün matematik çalışmak istiyorum",
            "session_id": "test_session",
            "context": {
                "subject": "matematik",
                "grade": 5
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "session_id" in data
    assert len(data["response"]) > 0

@pytest.mark.asyncio
async def test_get_ai_suggestions(client: AsyncClient, auth_headers):
    """Test getting AI suggestions."""
    response = await client.get(
        "/api/v1/ai/suggestions",
        headers=auth_headers,
        params={
            "subject": "matematik",
            "recent_topics": "kesirler,ondalık sayılar"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) > 0

@pytest.mark.asyncio
async def test_evaluate_answer(client: AsyncClient, teacher_headers):
    """Test answer evaluation."""
    response = await client.post(
        "/api/v1/ai/evaluate",
        headers=teacher_headers,
        json={
            "question": "Türkiye'nin başkenti neresidir?",
            "student_answer": "Ankara",
            "expected_answer": "Ankara"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "feedback" in data
    assert data["score"] == 100  # Correct answer

@pytest.mark.asyncio
async def test_generate_learning_path(client: AsyncClient, auth_headers):
    """Test personalized learning path generation."""
    response = await client.post(
        "/api/v1/ai/learning-path",
        headers=auth_headers,
        json={
            "student_id": "test_student",
            "subject": "matematik",
            "target_grade": 5,
            "duration_weeks": 4
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "path" in data
    assert "milestones" in data
    assert len(data["path"]) > 0
