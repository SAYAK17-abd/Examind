from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_similarity_check_endpoint():
    payload = {
        "answer1": "Polymorphism enables an object to take different shapes and forms.",
        "answer2": "Polymorphism allows objects to take multiple shapes and forms.",
        "threshold": 0.50
    }
    response = client.post("/api/v1/similarity/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "similarity" in data
    assert "possibleSimilarity" in data
    assert "rationale" in data


def test_student_insights_endpoint():
    payload = {
        "studentId": "std-99",
        "evaluations": [
            {
                "questionId": "q1",
                "subject": "Java",
                "topic": "OOP",
                "score": 9.0,
                "maxMarks": 10.0,
                "detectedConcepts": ["Inheritance", "Polymorphism"],
                "missingConcepts": []
            },
            {
                "questionId": "q2",
                "subject": "Java",
                "topic": "Concurrency",
                "score": 3.0,
                "maxMarks": 10.0,
                "detectedConcepts": [],
                "missingConcepts": ["Thread Safety", "Synchronization"]
            }
        ]
    }
    response = client.post("/api/v1/insights/student", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["studentId"] == "std-99"
    assert "OOP" in data["strongTopics"]
    assert "Concurrency" in data["weakTopics"]
    assert len(data["recommendedRevision"]) > 0

