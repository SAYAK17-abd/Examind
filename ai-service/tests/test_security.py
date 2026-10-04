from fastapi.testclient import TestClient
from app.main import app
from app.core.config import get_settings


def test_security_header_when_key_configured(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "AI_SERVICE_API_KEY", "super-secret-examind-key")

    client = TestClient(app)
    payload = {
        "question": "What is JVM?",
        "studentAnswer": "Java Virtual Machine executes bytecode.",
        "maxMarks": 5.0
    }

    # Request without key must return 401
    resp_unauth = client.post("/api/v1/evaluate", json=payload)
    assert resp_unauth.status_code == 401

    # Request with invalid key must return 401
    resp_bad = client.post(
        "/api/v1/evaluate",
        json=payload,
        headers={"X-AI-Service-Key": "wrong-key"}
    )
    assert resp_bad.status_code == 401

    # Request with valid key must return 200
    resp_ok = client.post(
        "/api/v1/evaluate",
        json=payload,
        headers={"X-AI-Service-Key": "super-secret-examind-key"}
    )
    assert resp_ok.status_code == 200

