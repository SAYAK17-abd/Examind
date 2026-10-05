from typing import Optional, Dict
from app.core.config import get_settings
from app.core.logging import logger
from app.providers.ocr.base import OCRProvider
from app.providers.ocr.tesseract_provider import TesseractOCRProvider
from app.providers.ocr.mock_ocr_provider import MockOCRProvider
from app.providers.ocr.handwriting_provider import HandwritingOCRProvider


class OCRProviderFactory:
    """
    Factory & Registry for OCR Providers.
    Caches provider singletons to prevent expensive repeated initializations.
    Supports easy future addition of Cloud OCR providers (Google Cloud Vision, AWS Textract, Azure).
    """

    _instances: Dict[str, OCRProvider] = {}

    @classmethod
    def get_provider(cls, provider_type: Optional[str] = None) -> OCRProvider:
        settings = get_settings()
        selected_type = (provider_type or settings.OCR_PROVIDER or "tesseract").lower().strip()

        if selected_type in cls._instances:
            return cls._instances[selected_type]

        provider: OCRProvider

        if selected_type == "tesseract":
            tess_provider = TesseractOCRProvider()
            if tess_provider.is_available():
                provider = tess_provider
            else:
                logger.warning("Tesseract binary is unavailable. Falling back to MockOCRProvider.")
                provider = MockOCRProvider()

        elif selected_type in ["mock", "test"]:
            provider = MockOCRProvider()

        elif selected_type in ["handwriting", "handwritten"]:
            provider = HandwritingOCRProvider()

        else:
            logger.warning(f"Unknown OCR provider type '{selected_type}'. Defaulting to MockOCRProvider.")
            provider = MockOCRProvider()

        cls._instances[selected_type] = provider
        return provider

    @classmethod
    def reset_instances(cls) -> None:
        """Clears cached providers (useful in test teardown)."""
        cls._instances.clear()
