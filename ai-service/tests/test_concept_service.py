from app.services.concept_service import get_concept_service


def test_concept_detection_with_synonyms():
    service = get_concept_service()
    student = "Java achieves dynamic method dispatch when a subclass provides its own method definition."
    expected = ["runtime polymorphism", "inheritance"]

    detected, missing, coverage = service.detect_concepts(
        student_answer=student,
        expected_concepts=expected
    )

    # "dynamic method dispatch" is a recognized synonym of "runtime polymorphism"
    assert "runtime polymorphism" in detected
    assert coverage >= 0.50


def test_missing_concept_accurately_flagged():
    service = get_concept_service()
    student = "Encapsulation binds data and functions together into a single unit."
    expected = ["encapsulation", "polymorphism", "inheritance"]

    detected, missing, coverage = service.detect_concepts(
        student_answer=student,
        expected_concepts=expected
    )

    assert "encapsulation" in detected
    assert "polymorphism" in missing
    assert "inheritance" in missing
    assert coverage == round(1 / 3, 3)
