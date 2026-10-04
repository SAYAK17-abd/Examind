from abc import ABC, abstractmethod
from typing import Tuple


class OCRProvider(ABC):
    """Abstract interface for Optical Character Recognition (OCR) providers."""

    @abstractmethod
    async def extract_text(self, file_bytes: bytes, filename: str) -> Tuple[str, float]:
        """
        Extracts text from image or document bytes.
        Returns: (extracted_text, ocr_confidence)
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass

