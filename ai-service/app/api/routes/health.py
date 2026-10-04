
from fastapi import APIRouter
from app.core.config import get_settings
from app.providers.llm_provider import ProviderFactory
from app.models.embeddings import get_embedding_manager

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health", summary="Service Liveness Check")
def health_check():
    """Returns basic liveness status of the AI service."""
    settings = get_settings()
    return {
        "status": "UP",
        "service": "examind-ai-service",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }


@router.get("/ready", summary="Service Readiness Probe")
def readiness_check():
    """Validates that underlying AI models and providers are initialized and ready."""
    settings = get_settings()
    provider = ProviderFactory.get_provider()
    embedding_manager = get_embedding_manager()
    return {
        "status": "READY",
        "service": "examind-ai-service",
        "provider": provider.get_provider_name(),
        "embeddingModel": settings.EMBEDDING_MODEL,
        "embeddingModelLoaded": embedding_manager.is_loaded(),
        "llmModel": settings.LLM_MODEL
    }
