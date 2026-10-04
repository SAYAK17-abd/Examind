import asyncio
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.llm_provider import ProviderFactory
from app.schemas.evaluation import EvaluationRequest


def test_gemini_provider_fallback_when_no_api_key():
    provider = GeminiProvider(api_key=None)
    request = EvaluationRequest(
        evaluationId="gemini-fallback-test",
        question="What is abstraction in OOP?",
        studentAnswer="Abstraction is hiding background details and only showing essential features.",
        referenceAnswer="Abstraction focuses on hiding implementation complexity.",
        maxMarks=5.0
    )

    res = asyncio.run(provider.evaluate(request))
    assert res.score <= 5.0
    assert res.score >= 0.0
    assert "gemini" in res.modelUsed.lower()
    assert res.confidence > 0.0


def test_openai_provider_fallback_when_no_api_key():
    provider = OpenAIProvider(api_key=None)
    request = EvaluationRequest(
        evaluationId="openai-fallback-test",
        question="Explain encapsulation.",
        studentAnswer="Encapsulation is wrapping data and methods into a single class.",
        referenceAnswer="Encapsulation binds data and code together.",
        maxMarks=5.0
    )

    res = asyncio.run(provider.evaluate(request))
    assert res.score <= 5.0
    assert res.score >= 0.0
    assert "openai" in res.modelUsed.lower()


def test_provider_factory_resolution(monkeypatch):
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    ProviderFactory.reset()
    provider = ProviderFactory.get_provider()
    assert isinstance(provider, GeminiProvider)

    monkeypatch.setattr(settings, "LLM_PROVIDER", "openai")
    ProviderFactory.reset()
    provider = ProviderFactory.get_provider()
    assert isinstance(provider, OpenAIProvider)

    # Reset back to mock
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")
    ProviderFactory.reset()

