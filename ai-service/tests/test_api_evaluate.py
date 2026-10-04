from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_v1_evaluate_success():
    payload = {
        "evaluationId": "eval-101",
        "question": "Explain method overriding in Java.",
        "studentAnswer": "Method overriding allows a subclass to provide a specific implementation of a method declared in its superclass.",
        "referenceAnswer": "Method overriding is runtime polymorphism where subclass overrides superclass method.",
        "maxMarks": 10.0,
        "rubric": [
            {"criterion": "Definition", "maxMarks": 5.0},
            {"criterion": "Runtime Polymorphism", "maxMarks": 5.0}
        ],
        "expectedConcepts": ["subclass", "override", "runtime polymorphism"],
        "subject": "Java",
        "difficulty": "MEDIUM"
    }

    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["evaluationId"] == "eval-101"
    assert data["maxMarks"] == 10.0
    assert 0.0 <= data["score"] <= 10.0
    assert 0.0 <= data["confidence"] <= 1.0
    assert "feedback" in data
    assert "detectedConcepts" in data


def test_legacy_evaluate_alias_backward_compatible():
    payload = {
        "question": "Define abstraction.",
        "studentAnswer": "Abstraction is hiding internal details and showing functionality.",
        "referenceAnswer": "Abstraction hides implementation details.",
        "maxScore": 5.0
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["maxMarks"] == 5.0
    assert data["score"] <= 5.0


def test_invalid_max_marks_rejected():
    payload = {
        "question": "What is JVM?",
        "studentAnswer": "Java Virtual Machine.",
        "maxMarks": 0.0
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code in (422, 400)

