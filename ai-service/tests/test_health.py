from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_returns_up():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "examind-ai-service"


def test_readiness_check_returns_ready():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "READY"
    assert "provider" in data

