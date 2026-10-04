from app.services.rubric_service import get_rubric_service
from app.schemas.evaluation import RubricCriterion


def test_rubric_evaluation_multiple_criteria():
    service = get_rubric_service()

    rubric = [
        RubricCriterion(criterion="Definition", description="Correct definition of polymorphism", maxMarks=2.0),
        RubricCriterion(criterion="Method Overriding", description="Explains runtime polymorphism", maxMarks=3.0),
        RubricCriterion(criterion="Method Overloading", description="Explains compile-time polymorphism", maxMarks=2.0),
        RubricCriterion(criterion="Practical Example", description="Provides code or real-world example", maxMarks=2.0),
        RubricCriterion(criterion="Clarity", description="Clear explanation and organization", maxMarks=1.0),
    ]

    student_answer = (
        "Polymorphism allows an object to take many forms. "
        "Method overriding is runtime polymorphism where subclass overrides parent method."
    )
    detected_concepts = ["polymorphism", "method overriding"]

    total_score, criterion_scores = service.evaluate_rubric(
        rubric=rubric,
        student_answer=student_answer,
        detected_concepts=detected_concepts
    )

    assert len(criterion_scores) == 5
    assert 0.0 <= total_score <= 10.0

    scores_map = {c.criterion: c.score for c in criterion_scores}
    assert scores_map["Definition"] > scores_map["Practical Example"]
    assert scores_map["Method Overriding"] > scores_map["Method Overloading"]

    for c in criterion_scores:
        assert c.feedback is not None
        assert len(c.feedback) > 5

