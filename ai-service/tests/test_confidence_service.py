from app.services.confidence_service import get_confidence_service
from app.core.config import get_settings


def test_confidence_high_on_consistent_comprehensive_answer():
    service = get_confidence_service()
    conf, requires_review, rationale = service.estimate_confidence(
        semantic_similarity=0.90,
        concept_coverage=0.95,
        correctness=0.92,
        completeness=0.88,
        answer_length=250,
        has_rubric=True,
        has_misconception=False
    )

    assert conf >= get_settings().CONFIDENCE_AUTO_THRESHOLD
    assert requires_review is False
    assert "eligible for autonomous" in rationale.lower()


def test_confidence_drops_and_flags_review_on_conflicting_evidence():
    service = get_confidence_service()
    conf, requires_review, rationale = service.estimate_confidence(
        semantic_similarity=0.85,
        concept_coverage=0.40,
        correctness=0.20,
        completeness=0.90,
        answer_length=120,
        has_rubric=False,
        has_misconception=True
    )

    assert conf < get_settings().CONFIDENCE_REVIEW_THRESHOLD
    assert requires_review is True
    assert "teacher review is required" in rationale.lower()


def test_confidence_penalizes_very_short_response():
    service = get_confidence_service()
    conf, requires_review, _ = service.estimate_confidence(
        semantic_similarity=0.50,
        concept_coverage=0.50,
        correctness=0.50,
        completeness=0.20,
        answer_length=15,
        has_rubric=False
    )

    assert conf < get_settings().CONFIDENCE_REVIEW_THRESHOLD
    assert requires_review is True

