from app.core.config import get_settings
from app.core.logging import logger
from app.providers.base import AIProvider
from app.providers.mock_provider import MockAIProvider


class ProviderFactory:
    """Factory to instantiate and retrieve configured AI provider."""

    _instance: AIProvider | None = None

    @classmethod
    def get_provider(cls) -> AIProvider:
        if cls._instance is not None:
            return cls._instance

        settings = get_settings()
        provider_type = (settings.LLM_PROVIDER or "mock").lower()

        logger.info(f"Initializing AI Provider: '{provider_type}'")

        if provider_type == "mock":
            cls._instance = MockAIProvider()
        elif provider_type == "gemini":
            from app.providers.gemini_provider import GeminiProvider
            cls._instance = GeminiProvider()
        elif provider_type == "openai":
            from app.providers.openai_provider import OpenAIProvider
            cls._instance = OpenAIProvider()
        else:
            logger.warning(
                f"Unknown provider '{provider_type}' specified, defaulting to MockAIProvider."
            )
            cls._instance = MockAIProvider()

        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None

