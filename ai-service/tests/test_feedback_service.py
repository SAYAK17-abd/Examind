from app.services.feedback_service import get_feedback_service
from app.schemas.evaluation import CriterionScore


def test_feedback_service_generates_balanced_explanation():
    service = get_feedback_service()

    criteria = [
        CriterionScore(criterion="Definition", score=2.0, maxMarks=2.0, feedback="Solid definition"),
        CriterionScore(criterion="Overriding", score=3.0, maxMarks=3.0, feedback="Correct explanation"),
        CriterionScore(criterion="Overloading", score=0.0, maxMarks=2.0, feedback="Not addressed"),
    ]

    strengths, weaknesses, narrative = service.generate_feedback(
        score=7.0,
        max_marks=10.0,
        detected_concepts=["polymorphism", "method overriding"],
        missing_concepts=["method overloading"],
        criterion_scores=criteria,
        correctness=0.85,
        completeness=0.75,
        has_misconception=False
    )

    assert len(strengths) > 0
    assert any("polymorphism" in s for s in strengths)
    assert len(weaknesses) > 0
    assert any("method overloading" in w for w in weaknesses)
    assert "7.0/10.0" in narrative
    assert "Key Strengths" in narrative
    assert "Areas for Improvement" in narrative

