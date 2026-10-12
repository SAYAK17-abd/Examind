import io
from typing import Tuple, Dict, Any
from PIL import Image, ImageEnhance, ImageOps
from app.core.logging import logger
from app.providers.ocr.base import OCRProvider, OCRResult
from app.providers.ocr.factory import OCRProviderFactory
from app.services.question_segmenter import QuestionSegmenter
from app.utils.text import normalize_text


class DocumentPipeline:
    """
    Document Ingestion & OCR Processing Pipeline.
    Orchestrates:
    1. Validation of image/PDF payloads
    2. Image preprocessing (contrast enhancement, binarization, orientation)
    3. OCR execution
    4. Text normalization and cleanup
    5. Question & answer segmentation
    """

    def __init__(self, ocr_provider: OCRProvider | None = None):
        if ocr_provider is not None:
            self.ocr_provider = ocr_provider
        else:
            self.ocr_provider = OCRProviderFactory.get_provider()
        self.segmenter = QuestionSegmenter()

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

        ocr_result = await self.ocr_provider.extract_text(processed_bytes, filename)
        if isinstance(ocr_result, OCRResult):
            raw_text = ocr_result.text
            confidence = ocr_result.confidence
            page_count = ocr_result.page_count
            provider_name = ocr_result.provider or self.ocr_provider.get_provider_name()
            extra_warnings = list(ocr_result.warnings)
        else:
            raw_text, confidence = ocr_result
            page_count = 1
            provider_name = self.ocr_provider.get_provider_name()
            extra_warnings = []

        cleaned_text = normalize_text(raw_text)

        seg_result = self.segmenter.segment(cleaned_text)
        overall_confidence = round(min(confidence, seg_result.confidence), 2)
        requires_review = (overall_confidence < 0.70) or seg_result.requires_review

        all_warnings = list(dict.fromkeys(extra_warnings + seg_result.warnings))

        return {
            "filename": filename,
            "pageCount": page_count,
            "extractedText": cleaned_text,
            "confidence": overall_confidence,
            "provider": provider_name,
            "requiresReview": requires_review,
            "answers": seg_result.answers,
            "warnings": all_warnings
        }


_document_pipeline_instance: DocumentPipeline | None = None


def get_document_pipeline() -> DocumentPipeline:
    global _document_pipeline_instance
    if _document_pipeline_instance is None:
        _document_pipeline_instance = DocumentPipeline()
    return _document_pipeline_instance
