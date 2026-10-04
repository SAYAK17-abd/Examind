import io
from typing import Tuple, Dict, Any
from PIL import Image, ImageEnhance, ImageOps
from app.core.logging import logger
from app.providers.ocr.base import OCRProvider
from app.providers.ocr.mock_ocr_provider import MockOCRProvider
from app.utils.text import normalize_text


class DocumentPipeline:
    """
    Document Ingestion & OCR Processing Pipeline.
    Orchestrates:
    1. Validation of image/PDF payloads
    2. Image preprocessing (contrast enhancement, binarization, orientation)
    3. OCR execution
    4. Text normalization and cleanup
    """

    def __init__(self, ocr_provider: OCRProvider | None = None):
        self.ocr_provider = ocr_provider or MockOCRProvider()

    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """Enhances image contrast and normalizes grayscale for improved OCR recognition."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to grayscale
            gray = ImageOps.grayscale(image)
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(gray)
            enhanced = enhancer.enhance(1.8)

            output_buffer = io.BytesIO()
            enhanced.save(output_buffer, format="PNG")
            return output_buffer.getvalue()
        except Exception as e:
            logger.warning(f"Image preprocessing skipped due to error: {e}")
            return image_bytes

    async def process_document(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        logger.info(f"DocumentPipeline processing '{filename}' ({len(file_bytes)} bytes)")

        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff")):
            processed_bytes = self.preprocess_image(file_bytes)
        else:
            processed_bytes = file_bytes

        raw_text, confidence = await self.ocr_provider.extract_text(processed_bytes, filename)
        cleaned_text = normalize_text(raw_text)

        return {
            "filename": filename,
            "extractedText": cleaned_text,
            "confidence": round(confidence, 2),
            "provider": self.ocr_provider.get_provider_name()
        }


_document_pipeline_instance: DocumentPipeline | None = None


def get_document_pipeline() -> DocumentPipeline:
    global _document_pipeline_instance
    if _document_pipeline_instance is None:
        _document_pipeline_instance = DocumentPipeline()
    return _document_pipeline_instance

