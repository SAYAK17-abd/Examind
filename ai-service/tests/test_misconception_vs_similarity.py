import asyncio
from app.providers.mock_provider import MockAIProvider
from app.schemas.evaluation import EvaluationRequest


def test_misconception_yields_low_correctness_despite_word_overlap():
    provider = MockAIProvider()

    # Reference states: "Java does not support multiple inheritance through classes."
    # Student states: "Java supports multiple inheritance through classes."
    request = EvaluationRequest(
        evaluationId="eval-misconception",
        question="Does Java support multiple inheritance through classes?",
        studentAnswer="Java supports multiple inheritance through classes because child classes inherit from multiple classes.",
        referenceAnswer="Java does not support multiple inheritance through classes to avoid the diamond problem.",
        maxMarks=10.0,
        expectedConcepts=["multiple inheritance", "interfaces"]
    )

    res = asyncio.run(provider.evaluate(request))

    # Correctness must be severely penalized due to technical error/misconception
    assert res.correctness <= 0.40
    assert any("misconception" in w.lower() for w in res.weaknesses)
    # The final score must not award full marks despite high word overlap
    assert res.score < 5.0
