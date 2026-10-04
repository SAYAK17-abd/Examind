import asyncio
from app.core.config import get_settings
from app.providers.mock_provider import MockAIProvider
from app.schemas.evaluation import EvaluationRequest, RubricCriterion


def test_brief_answer_triggers_human_review():
    provider = MockAIProvider()
    request = EvaluationRequest(
        evaluationId="eval-terse",
        question="Describe Java Memory Model and GC in detail.",
        studentAnswer="It cleans stuff.",  # Extremely brief
        referenceAnswer="The Java Memory Model defines heap and stack memory where JVM garbage collector reclaims unreachable objects.",
        maxMarks=10.0
    )
    res = asyncio.run(provider.evaluate(request))
    # Low confidence on very short answers (< 40 characters) should trigger human review
    assert res.confidence < get_settings().CONFIDENCE_REVIEW_THRESHOLD
    assert res.requiresHumanReview is True


def test_rubric_partial_credit_allocation():
    provider = MockAIProvider()
    request = EvaluationRequest(
        evaluationId="eval-rubric",
        question="Explain encapsulation and inheritance.",
        studentAnswer="Encapsulation is hiding internal data using private variables and public getters and setters.",
        referenceAnswer="Encapsulation bundles data while inheritance allows deriving properties.",
        maxMarks=10.0,
        rubric=[
            RubricCriterion(criterion="Encapsulation", maxMarks=5.0),
            RubricCriterion(criterion="Inheritance", maxMarks=5.0)
        ],
        expectedConcepts=["encapsulation", "inheritance"]
    )
    res = asyncio.run(provider.evaluate(request))
    assert "encapsulation" in res.detectedConcepts
    assert "inheritance" in res.missingConcepts

    crit_dict = {c.criterion: c.score for c in res.criterionScores}
    assert crit_dict["Encapsulation"] > crit_dict["Inheritance"]

