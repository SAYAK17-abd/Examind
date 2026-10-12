from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Tuple, List, Dict, Any, Union


@dataclass
class OCRResult:
    """Standard result structure produced by OCR and document extraction engines."""
    text: str
    confidence: float
    page_count: int = 1
    provider: str = "ocr"
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    is_handwritten: bool = False

    def __iter__(self):
        """Allows unpacking as (text, confidence) for backward compatibility."""
        return iter((self.text, self.confidence))

    def __getitem__(self, index):
        """Allows indexing like a tuple (text, confidence)."""
        return (self.text, self.confidence)[index]


class OCRProvider(ABC):
    """Abstract interface for Optical Character Recognition (OCR) providers."""

    @abstractmethod
    async def extract_text(self, file_bytes: bytes, filename: str) -> Union[OCRResult, Tuple[str, float]]:
        """
        Extracts text from image or document bytes.
        Returns: OCRResult or (extracted_text, ocr_confidence)
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass
