import os
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General App Config
    APP_ENV: str = "development"
    APP_NAME: str = "EXAMIND AI Evaluation Service"
    APP_VERSION: str = "1.0.0"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # API Security
    AI_SERVICE_API_KEY: Optional[str] = None

    # AI Provider & Models
    LLM_PROVIDER: str = "mock"  # "mock", "gemini", "openai"
    LLM_MODEL: str = "gemini-1.5-flash"
    LLM_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Scoring Weights
    WEIGHT_SEMANTIC: float = 0.20
    WEIGHT_CONCEPT: float = 0.25
    WEIGHT_CORRECTNESS: float = 0.30
    WEIGHT_COMPLETENESS: float = 0.25

    # Confidence Thresholds
    CONFIDENCE_AUTO_THRESHOLD: float = 0.85
    CONFIDENCE_REVIEW_THRESHOLD: float = 0.60

    # Operational Parameters
    AI_REQUEST_TIMEOUT: int = 60
    EVALUATION_VERSION: str = "1.0"
    PROMPT_VERSION: str = "rubric-evaluator-v1"

    # OCR and Document Processing Parameters (MEM3)
    OCR_PROVIDER: str = "tesseract"  # "tesseract", "mock", "handwriting"
    OCR_CONFIDENCE_THRESHOLD: float = 0.70
    OCR_MIN_DIGITAL_TEXT_CHARS: int = 50
    TESSERACT_CMD: Optional[str] = None
    TESSDATA_PREFIX: Optional[str] = None
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: list[str] = ["pdf", "jpg", "jpeg", "png"]
    OCR_DPI: int = 300


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()

