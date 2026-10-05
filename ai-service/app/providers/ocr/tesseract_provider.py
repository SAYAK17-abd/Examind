import io
import os
import shutil
from typing import Optional, List, Tuple
from PIL import Image
from app.core.config import get_settings
from app.core.logging import logger
from app.providers.ocr.base import OCRProvider, OCRResult
from app.services.image_preprocessor import ImagePreprocessor

try:
    import pytesseract
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import pypdfium2 as pdfium
    HAS_PDFIUM = True
except ImportError:
    HAS_PDFIUM = False


class TesseractOCRProvider(OCRProvider):
    """
    Production-grade Optical Character Recognition (OCR) provider using Tesseract.
    Features:
    - Auto-discovery of local Tesseract binaries across Windows, Linux, and macOS
    - Two-stage PDF handling: instant digital extraction vs. rasterized image OCR for scans
    - Integrated multi-pass image preprocessing (CLAHE, deskew, resolution normalization)
    - Word-level confidence scoring calibrated between 0.0 and 1.0
    - Fallback aggressive binarization for degraded document scans
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.settings = get_settings()
        self.tesseract_cmd = self._discover_tesseract(tesseract_cmd or self.settings.TESSERACT_CMD)
        self._configure_environment()
        self.preprocessor = ImagePreprocessor(tesseract_cmd=self.tesseract_cmd)

    def _discover_tesseract(self, explicit_path: Optional[str] = None) -> Optional[str]:
        """Discovers the Tesseract binary location dynamically."""
        candidates = [
            explicit_path,
            os.environ.get("TESSERACT_CMD"),
            shutil.which("tesseract"),
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
            "/opt/homebrew/bin/tesseract"
        ]

        for path in candidates:
            if path and os.path.exists(path):
                abs_path = os.path.abspath(path)
                logger.info(f"Discovered Tesseract binary at: {abs_path}")
                return abs_path

        logger.warning("No Tesseract executable found in standard system locations.")
        return None

    def _configure_environment(self) -> None:
        """Sets pytesseract binary path and TESSDATA_PREFIX if local tessdata directory exists."""
        if not HAS_PYTESSERACT or not self.tesseract_cmd:
            return

        pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd

        # Check for adjacent tessdata directory
        base_dir = os.path.dirname(self.tesseract_cmd)
        tessdata_dir = os.path.join(base_dir, "tessdata")
        if os.path.exists(tessdata_dir):
            os.environ["TESSDATA_PREFIX"] = tessdata_dir
            logger.info(f"Configured TESSDATA_PREFIX: {tessdata_dir}")

    def is_available(self) -> bool:
        """Checks if Tesseract binary and Python bindings are operational."""
        return HAS_PYTESSERACT and bool(self.tesseract_cmd) and os.path.exists(self.tesseract_cmd)

    def get_provider_name(self) -> str:
        return "tesseract"

    def _ocr_single_image(self, img: Image.Image, aggressive: bool = False) -> Tuple[str, float]:
        """Performs image preprocessing and word-level confidence OCR on a single PIL image."""
        if not self.is_available():
            raise RuntimeError("Tesseract OCR engine is not configured or binary was not found.")

        processed = self.preprocessor.preprocess(img, aggressive=aggressive)

        try:
            # Extract word-level bounding boxes and confidence scores
            data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
            words = []
            confidences = []

            for text, conf in zip(data.get("text", []), data.get("conf", [])):
                stripped = text.strip()
                if stripped:
                    words.append(stripped)
                    try:
                        c_val = float(conf)
                        if c_val >= 0:
                            confidences.append(c_val)
                    except (ValueError, TypeError):
                        pass

            full_text = pytesseract.image_to_string(processed).strip()

            if confidences:
                avg_confidence = (sum(confidences) / len(confidences)) / 100.0
            else:
                avg_confidence = 0.50 if full_text else 0.0

            return full_text, round(min(1.0, max(0.0, avg_confidence)), 2)
        except Exception as e:
            logger.error(f"Tesseract OCR failed on image: {e}")
            return "", 0.0

    async def _process_pdf(self, file_bytes: bytes, filename: str) -> OCRResult:
        """
        Processes PDF document:
        1. Checks for digital text on all pages.
        2. If sufficient digital text exists, returns direct extraction without OCR.
        3. If scanned pages are detected, renders pages to images and executes OCR.
        """
        page_texts: List[str] = []
        page_confidences: List[float] = []
        total_pages = 0

        # Phase 1: Digital extraction probe
        all_digital = False
        if HAS_PYPDF:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                total_pages = len(reader.pages)
                digital_pages = [page.extract_text() or "" for page in reader.pages]
                min_chars = self.settings.OCR_MIN_DIGITAL_TEXT_CHARS

                if total_pages > 0 and all(len(p.strip()) >= min_chars for p in digital_pages):
                    all_digital = True
                    combined_text = "\n\n".join(p.strip() for p in digital_pages)
                    logger.info(f"PDF '{filename}' completely processed via digital text extraction ({total_pages} pages)")
                    return OCRResult(
                        text=combined_text,
                        confidence=0.98,
                        page_count=total_pages,
                        provider="digital_pdf",
                        metadata={"extractionType": "digital"}
                    )
            except Exception as e:
                logger.warning(f"Error reading digital PDF via pypdf: {e}")

        # Phase 2: Rasterize scanned/mixed pages and run OCR
        if not HAS_PDFIUM:
            raise RuntimeError("PDF rendering requires pypdfium2 for scanned document processing.")

        pdf = pdfium.PdfDocument(io.BytesIO(file_bytes))
        total_pages = len(pdf)
        logger.info(f"Rendering and running OCR on {total_pages} pages of '{filename}'")

        for page_idx in range(total_pages):
            page = pdf[page_idx]

            # Render page at 2.5x scale (approx 180-200 DPI, optimal balance of speed and clarity)
            bitmap = page.render(scale=2.5)
            pil_img = bitmap.to_pil()

            text, conf = self._ocr_single_image(pil_img, aggressive=False)
            # If initial OCR confidence is low (<0.50), retry with aggressive binarization
            if conf < 0.50 or not text:
                alt_text, alt_conf = self._ocr_single_image(pil_img, aggressive=True)
                if alt_conf > conf:
                    text, conf = alt_text, alt_conf

            page_texts.append(f"--- Page {page_idx + 1} ---\n{text}" if total_pages > 1 else text)
            page_confidences.append(conf)

        combined_text = "\n\n".join(page_texts).strip()
        overall_conf = sum(page_confidences) / len(page_confidences) if page_confidences else 0.0

        return OCRResult(
            text=combined_text,
            confidence=round(overall_conf, 2),
            page_count=total_pages,
            provider=self.get_provider_name(),
            metadata={"extractionType": "scanned_ocr"}
        )

    async def extract_text(self, file_bytes: bytes, filename: str) -> OCRResult:
        """Main entrypoint for document text extraction."""
        logger.info(f"TesseractOCRProvider processing '{filename}' ({len(file_bytes)} bytes)")

        if filename.lower().endswith(".pdf"):
            return await self._process_pdf(file_bytes, filename)

        # Process image file (PNG, JPG, JPEG)
        pil_img = Image.open(io.BytesIO(file_bytes))
        text, conf = self._ocr_single_image(pil_img, aggressive=False)

        # Fallback to aggressive preprocessing if confidence is marginal
        if conf < 0.55 or not text:
            alt_text, alt_conf = self._ocr_single_image(pil_img, aggressive=True)
            if alt_conf > conf:
                text, conf = alt_text, alt_conf

        warnings = []
        if conf < self.settings.OCR_CONFIDENCE_THRESHOLD:
            warnings.append(
                f"OCR confidence ({conf:.2f}) is below standard threshold ({self.settings.OCR_CONFIDENCE_THRESHOLD:.2f})."
            )

        return OCRResult(
            text=text,
            confidence=conf,
            page_count=1,
            provider=self.get_provider_name(),
            warnings=warnings,
            metadata={"format": pil_img.format}
        )
