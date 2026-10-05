import io
import cv2
import numpy as np
from typing import Optional, Tuple
from PIL import Image, ImageOps, ImageEnhance
from app.core.logging import logger

try:
    import pytesseract
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


class ImagePreprocessor:
    """
    Production-grade document and answer sheet image preprocessor.
    Performs non-destructive, memory-efficient transformations:
    - Orientation / EXIF correction
    - Resolution normalization
    - Grayscale conversion
    - Contrast enhancement (CLAHE)
    - Deskewing
    - Border / scanner margin cleanup
    - Denoising & Adaptive Binarization (optional / fallback)
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.tesseract_cmd = tesseract_cmd
        if tesseract_cmd and HAS_PYTESSERACT:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def correct_orientation(self, img: Image.Image) -> Image.Image:
        """Corrects image orientation via EXIF tags and Tesseract OSD if available."""
        # 1. EXIF orientation
        try:
            img = ImageOps.exif_transpose(img)
        except Exception as e:
            logger.debug(f"EXIF transpose skipped: {e}")

        # 2. Tesseract OSD check
        if HAS_PYTESSERACT:
            try:
                osd = pytesseract.image_to_osd(img, output_type=pytesseract.Output.DICT)
                rotate = osd.get("rotate", 0)
                conf = osd.get("orientation_conf", 0)
                if conf >= 30 and rotate in [90, 180, 270]:
                    logger.info(f"Rotating image by {360 - rotate}° based on OSD (confidence: {conf})")
                    img = img.rotate(360 - rotate, expand=True)
            except Exception as e:
                logger.debug(f"Orientation OSD check bypassed: {e}")

        return img

    def normalize_resolution(
        self,
        img: Image.Image,
        min_dim_target: int = 1200,
        max_dim_cap: int = 3200
    ) -> Image.Image:
        """
        Normalizes image dimensions to optimal OCR resolution.
        Upscales small/low-DPI scans, caps excessively large images to conserve memory.
        """
        w, h = img.size
        min_dim = min(w, h)
        max_dim = max(w, h)

        if min_dim < min_dim_target:
            scale = min_dim_target / float(min_dim)
            # Cap maximum scale factor to 3x to prevent excessive memory usage
            scale = min(scale, 3.0)
            new_w = int(w * scale)
            new_h = int(h * scale)
            return img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        elif max_dim > max_dim_cap:
            scale = max_dim_cap / float(max_dim)
            new_w = int(w * scale)
            new_h = int(h * scale)
            return img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        return img

    def calculate_skew_angle(self, gray: np.ndarray) -> float:
        """Calculates skew angle in degrees using Otsu threshold and minimum area rectangle."""
        try:
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            coords = np.column_stack(np.where(thresh > 0))
            if len(coords) < 100:
                return 0.0

            rect = cv2.minAreaRect(coords)
            angle = rect[-1]
            (w, h) = rect[1]
            if w < h:
                angle = angle - 90 if angle > 0 else angle + 90

            while angle < -45:
                angle += 90
            while angle > 45:
                angle -= 90

            return float(angle)
        except Exception as e:
            logger.debug(f"Skew calculation failed: {e}")
            return 0.0

    def deskew(self, gray: np.ndarray) -> np.ndarray:
        """Deskews the image if a significant angle is detected."""
        angle = self.calculate_skew_angle(gray)
        if abs(angle) < 0.5 or abs(angle) > 45.0:
            return gray

        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, -angle, 1.0)
        rotated = cv2.warpAffine(
            gray,
            M,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=255
        )
        return rotated

    def clean_borders(self, gray: np.ndarray, border_percent: float = 0.02) -> np.ndarray:
        """Removes dark borders and scanning artifacts along page margins."""
        h, w = gray.shape[:2]
        border_y = max(1, int(h * border_percent))
        border_x = max(1, int(w * border_percent))

        cleaned = gray.copy()
        # If margins are predominantly dark (scanner edges), whiten them
        for region in [
            (slice(0, border_y), slice(0, w)),       # top
            (slice(h - border_y, h), slice(0, w)),   # bottom
            (slice(0, h), slice(0, border_x)),       # left
            (slice(0, h), slice(w - border_x, w))    # right
        ]:
            patch = cleaned[region]
            if np.mean(patch) < 100:  # Dark margin detected
                cleaned[region] = 255

        return cleaned

    def enhance_contrast(self, gray: np.ndarray) -> np.ndarray:
        """Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)."""
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(gray)

    def denoise(self, gray: np.ndarray) -> np.ndarray:
        """Applies gentle noise reduction preserving text edges."""
        return cv2.GaussianBlur(gray, (3, 3), 0)

    def binarize(self, gray: np.ndarray) -> np.ndarray:
        """Applies Otsu's optimal thresholding."""
        return cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    def preprocess(
        self,
        image_input: bytes | Image.Image,
        aggressive: bool = False,
        fix_orientation: bool = True
    ) -> Image.Image:
        """
        Executes standard or aggressive preprocessing pipeline.
        Returns processed PIL Image without modifying original input.
        """
        # 1. Load into PIL
        if isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input))
        else:
            pil_img = image_input.copy()

        # Ensure RGB mode for color conversions
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        # 2. Orientation & Resolution
        if fix_orientation:
            pil_img = self.correct_orientation(pil_img)
        pil_img = self.normalize_resolution(pil_img)

        # 3. Convert to OpenCV Grayscale
        arr = np.array(pil_img)
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

        # 4. Deskewing
        deskewed = self.deskew(gray)

        # 5. Border cleanup
        border_cleaned = self.clean_borders(deskewed)

        # 6. Contrast Enhancement
        enhanced = self.enhance_contrast(border_cleaned)

        # 7. Aggressive mode (denoise + binarize) for faint/noisy documents
        if aggressive:
            denoised = self.denoise(enhanced)
            binarized = self.binarize(denoised)
            final_img = Image.fromarray(binarized)
        else:
            final_img = Image.fromarray(enhanced)

        return final_img
