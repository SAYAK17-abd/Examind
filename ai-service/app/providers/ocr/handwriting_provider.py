from typing import Optional, List
from app.providers.ocr.base import OCRProvider, OCRResult
from app.providers.ocr.tesseract_provider import TesseractOCRProvider
from app.core.logging import logger


class HandwritingOCRProvider(OCRProvider):
    """
    Dedicated OCR provider architecture for handwritten student answer sheets.
    IMPORTANT:
    Standard local Tesseract cannot reliably recognize varied human handwriting.
    This provider explicitly exposes this limitation to preventing misleading evaluation scores,
    mandating human-in-the-loop review until a specialized handwriting model or cloud OCR is configured.
    """

    def __init__(self, fallback_tesseract: Optional[TesseractOCRProvider] = None):
        self.underlying_provider = fallback_tesseract or TesseractOCRProvider()

    def get_provider_name(self) -> str:
        return "handwriting-ocr-v1"

    async def extract_text(self, file_bytes: bytes, filename: str) -> OCRResult:
        logger.info(f"HandwritingOCRProvider processing handwritten answer sheet '{filename}'")

        warnings: List[str] = [
            "Handwritten answer sheet detected. Standard local OCR cannot guarantee reliable handwriting recognition.",
            "Manual teacher review is strongly recommended to ensure evaluation accuracy."
        ]

        if not self.underlying_provider.is_available():
            return OCRResult(
                text="",
                confidence=0.0,
                page_count=1,
                provider=self.get_provider_name(),
                warnings=warnings + ["No local OCR engine available for handwriting extraction."],
                is_handwritten=True
            )

        # Execute OCR with underlying engine
        result = await self.underlying_provider.extract_text(file_bytes, filename)

        # Calibrate confidence downwards for handwritten text to ensure human review is triggered
        conservative_conf = round(min(result.confidence * 0.6, 0.45), 2)

        return OCRResult(
            text=result.text,
            confidence=conservative_conf,
            page_count=result.page_count,
            provider=self.get_provider_name(),
            warnings=warnings + result.warnings,
            is_handwritten=True,
            metadata={"handwritingLimitationExposed": True}
        )
