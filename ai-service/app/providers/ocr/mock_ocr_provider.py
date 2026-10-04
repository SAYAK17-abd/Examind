import io
from typing import Tuple
from app.providers.ocr.base import OCRProvider
from app.core.logging import logger

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class MockOCRProvider(OCRProvider):
    """
    Standard OCR Provider with PDF digital text extraction and simulated OCR engine.
    Extracts embedded digital text if PDF, or returns simulated OCR transcript for image scans.
    """

    def get_provider_name(self) -> str:
        return "mock-ocr-v1"

    async def extract_text(self, file_bytes: bytes, filename: str) -> Tuple[str, float]:
        logger.info(f"MockOCRProvider extracting text from filename='{filename}' ({len(file_bytes)} bytes)")

        # If it's a PDF, extract real digital text if present
        if filename.lower().endswith(".pdf") and HAS_PYPDF:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                text_pages = [page.extract_text() for page in reader.pages if page.extract_text()]
                combined_pdf_text = "\n".join(text_pages).strip()
                if combined_pdf_text:
                    return combined_pdf_text, 0.95
            except Exception as e:
                logger.warning(f"Failed to extract PDF text via pypdf: {e}")

        # Simulated OCR for image uploads
        extracted_sample = (
            "Polymorphism allows objects to be treated as instances of their parent class. "
            "In Java, this is demonstrated via method overriding at runtime and method overloading at compile time."
        )
        return extracted_sample, 0.88

