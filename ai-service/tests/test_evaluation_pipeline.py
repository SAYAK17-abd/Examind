import asyncio
from app.pipelines.evaluation_pipeline import get_evaluation_pipeline
from app.schemas.evaluation import EvaluationRequest, RubricCriterion


def test_pipeline_end_to_end_evaluation():
    pipeline = get_evaluation_pipeline()

    request = EvaluationRequest(
        evaluationId="eval-pipe-test",
        question="Explain polymorphism in Java.",
        studentAnswer=(
            "Polymorphism allows objects to take multiple forms. "
            "In Java, runtime polymorphism is achieved through method overriding, "
            "where a child class provides a specific implementation of a parent method."
        ),
        referenceAnswer=(
            "Polymorphism allows one interface to represent multiple implementations. "
            "It encompasses method overriding (runtime polymorphism) and method overloading (compile-time polymorphism)."
        ),
        maxMarks=10.0,
        rubric=[
            RubricCriterion(criterion="Definition", maxMarks=3.0),
            RubricCriterion(criterion="Method Overriding", maxMarks=4.0),
            RubricCriterion(criterion="Method Overloading", maxMarks=3.0)
        ],
        expectedConcepts=["polymorphism", "method overriding", "method overloading"]
    )

    res = asyncio.run(pipeline.execute(request))

    assert res.evaluationId == "eval-pipe-test"
    assert res.maxMarks == 10.0
    assert 0.0 <= res.score <= 10.0
    assert 0.0 <= res.confidence <= 1.0
    assert "polymorphism" in res.detectedConcepts
    assert "method overriding" in res.detectedConcepts
    assert "method overloading" in res.missingConcepts
    assert len(res.criterionScores) == 3
    assert len(res.strengths) > 0
    assert len(res.weaknesses) > 0
    assert res.requiresHumanReview is False

