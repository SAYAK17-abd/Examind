from fastapi import Header, HTTPException, status
from app.core.config import get_settings


async def verify_api_key(
    x_ai_service_key: str | None = Header(default=None, alias="X-AI-Service-Key")
) -> bool:
    """
    Validates the X-AI-Service-Key header against configured secret.
    If no API key is configured in settings, allows access (useful for local dev).
    """
    settings = get_settings()
    configured_key = settings.AI_SERVICE_API_KEY

    # If no key configured, bypass in development mode
    if not configured_key or configured_key.strip() == "":
        return True

    if not x_ai_service_key or x_ai_service_key != configured_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "UNAUTHORIZED",
                "message": "Invalid or missing X-AI-Service-Key header"
            }
        )

    return True

