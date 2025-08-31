"""
Tests for API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import create_app
from app.core.config import settings


@pytest.fixture
def client():
    """Test client fixture."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Authentication headers fixture."""
    return {"Authorization": f"Bearer {settings.api_key}"}


def test_health_endpoint(client):
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


@patch('app.services.ollama_client.ollama_client.health_check')
def test_ready_endpoint_healthy(mock_health_check, client):
    """Test ready endpoint when Ollama is healthy."""
    mock_health_check.return_value = AsyncMock(return_value=True)()
    
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


@patch('app.services.ollama_client.ollama_client.health_check')
def test_ready_endpoint_unhealthy(mock_health_check, client):
    """Test ready endpoint when Ollama is unhealthy."""
    mock_health_check.return_value = AsyncMock(return_value=False)()
    
    response = client.get("/ready")
    assert response.status_code == 503


def test_models_endpoint_no_auth(client):
    """Test models endpoint without authentication."""
    response = client.get("/v1/models")
    assert response.status_code == 401


@patch('app.services.model_manager.model_manager.get_all_models_info')
def test_models_endpoint_with_auth(mock_get_models, client, auth_headers):
    """Test models endpoint with authentication."""
    mock_get_models.return_value = [
        {
            "id": "test-model",
            "name": "Test Model",
            "status": "available",
            "size_gb": 1.0,
            "context_window": 2048,
            "supports_json": True,
            "loaded": False
        }
    ]
    
    response = client.get("/v1/models", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) == 1
    assert data["models"][0]["id"] == "test-model"


def test_load_model_no_auth(client):
    """Test load model endpoint without authentication."""
    response = client.post("/v1/models/test-model/load")
    assert response.status_code == 401


@patch('app.services.model_manager.model_manager.load_model')
def test_load_model_success(mock_load_model, client, auth_headers):
    """Test successful model loading."""
    mock_load_model.return_value = AsyncMock(return_value={
        "success": True,
        "message": "Model loaded successfully",
        "model_id": "test-model"
    })()
    
    response = client.post("/v1/models/test-model/load", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["model_id"] == "test-model"


@patch('app.services.model_manager.model_manager.load_model')
def test_load_model_failure(mock_load_model, client, auth_headers):
    """Test failed model loading."""
    mock_load_model.return_value = AsyncMock(return_value={
        "success": False,
        "message": "Model not found",
        "model_id": "test-model"
    })()
    
    response = client.post("/v1/models/test-model/load", headers=auth_headers)
    assert response.status_code == 400


def test_inference_no_auth(client):
    """Test inference endpoint without authentication."""
    response = client.post("/v1/inference", json={
        "model_id": "test-model",
        "prompt": "Hello"
    })
    assert response.status_code == 401


@patch('app.services.inference_service.inference_service.generate')
def test_inference_success(mock_generate, client, auth_headers):
    """Test successful inference."""
    from app.models.api import InferenceResponse, UsageInfo
    
    mock_generate.return_value = AsyncMock(return_value=InferenceResponse(
        success=True,
        output="Hello, world!",
        usage=UsageInfo(prompt_tokens=1, completion_tokens=3, total_tokens=4),
        latency_ms=500,
        model_id="test-model"
    ))()
    
    response = client.post("/v1/inference", headers=auth_headers, json={
        "model_id": "test-model",
        "prompt": "Hello",
        "temperature": 0.7,
        "max_tokens": 100
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["output"] == "Hello, world!"
    assert data["model_id"] == "test-model"
    assert "usage" in data
    assert "latency_ms" in data


def test_inference_invalid_request(client, auth_headers):
    """Test inference with invalid request."""
    response = client.post("/v1/inference", headers=auth_headers, json={
        "prompt": "Hello"  # Missing model_id
    })
    assert response.status_code == 422  # Validation error


@patch('app.services.ollama_client.ollama_client.health_check')
@patch('app.services.model_manager.model_manager.get_loaded_models')
def test_status_endpoint(mock_get_loaded, mock_health_check, client, auth_headers):
    """Test status endpoint."""
    mock_health_check.return_value = AsyncMock(return_value=True)()
    mock_get_loaded.return_value = ["test-model"]
    
    response = client.get("/v1/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ollama_running"] is True
    assert "test-model" in data["models_loaded"]
    assert "memory_available_gb" in data
    assert "version" in data
