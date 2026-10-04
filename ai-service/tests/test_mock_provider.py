import asyncio
from app.providers.mock_provider import MockAIProvider
from app.schemas.evaluation import EvaluationRequest, RubricCriterion


def test_empty_answer_returns_zero_score():
    provider = MockAIProvider()
    request = EvaluationRequest(
        evaluationId="test-eval-1",
        question="What is encapsulation?",
        studentAnswer="",
        referenceAnswer="Encapsulation is bundling data and methods.",
        maxMarks=10.0,
        expectedConcepts=["encapsulation", "data hiding"]
    )
    res = asyncio.run(provider.evaluate(request))
    assert res.score == 0.0
    assert res.confidence >= 0.90
    assert "No answer" in res.feedback
    assert res.requiresHumanReview is False


def test_full_correct_answer_evaluation():
    provider = MockAIProvider()
    request = EvaluationRequest(
        evaluationId="test-eval-2",
        question="Explain polymorphism in Java.",
        studentAnswer="Polymorphism allows objects to take multiple forms. It includes method overloading and method overriding.",
        referenceAnswer="Polymorphism allows one interface for different forms through method overriding and method overloading.",
        maxMarks=10.0,
        rubric=[
            RubricCriterion(criterion="Definition", maxMarks=3.0),
            RubricCriterion(criterion="Method Overriding", maxMarks=4.0),
            RubricCriterion(criterion="Method Overloading", maxMarks=3.0)
        ],
        expectedConcepts=["polymorphism", "method overriding", "method overloading"]
    )
    res = asyncio.run(provider.evaluate(request))
    assert res.score > 5.0
    assert res.score <= 10.0
    assert "polymorphism" in res.detectedConcepts
    assert "method overriding" in res.detectedConcepts
    assert res.confidence >= 0.60
    assert len(res.criterionScores) == 3


def test_score_never_exceeds_max_marks():
    provider = MockAIProvider()
    request = EvaluationRequest(
        evaluationId="test-eval-3",
        question="What is inheritance?",
        studentAnswer="Inheritance is super powerful and allows child classes to inherit parent properties and methods.",
        referenceAnswer="Inheritance is child class acquiring parent properties.",
        maxMarks=5.0
    )
    res = asyncio.run(provider.evaluate(request))
    assert res.score <= 5.0
    assert res.score >= 0.0

