# EXAMIND — AI Evaluation & Document Processing Service (MEM2 & MEM3)

Production-grade, asynchronous-ready AI evaluation and document processing service built with **Python 3.11+** and **FastAPI**. It integrates directly with the primary EXAMIND Spring Boot backend to deliver intelligent, multi-signal, and explainable assessment of student answers along with a robust OCR and document parsing pipeline.

---

## 🏗️ Architecture

```text
Spring Boot Backend (Port 8080)
         │  REST (JSON / Multipart)
         ▼
FastAPI AI Service (Port 8000)
   ├── /health & /ready (Diagnostics & Probes)
   ├── POST /api/v1/ocr/extract (MEM3: Document Ingestion, Image Preprocessing & OCR)
   ├── POST /api/v1/evaluate (MEM2: Multi-signal Explainable Evaluation)
   ├── POST /api/v1/similarity/check (Pairwise Semantic Overlap)
   ├── POST /api/v1/insights/student (Personalized Student Mastery Analytics)
   ├── POST /evaluate (Legacy backward-compatible alias)
   └── POST /ocr/extract (Legacy backward-compatible alias)
```

---

## 📄 MEM3 — OCR & Document Processing Pipeline

The document pipeline processes student answer sheets from raw files into structured question-answer mappings ready for AI evaluation:

```text
Student Answer Sheet (PDF, PNG, JPG, JPEG)
        ↓
File Validation & Security (Magic bytes, signatures, size limit, executable rejection)
        ↓
PDF / Image Detection
        ↓
PDF Text Extraction (Digital probe)
        ↓
If scanned / raster images:
        ↓
Image Preprocessing (Resolution normalization, EXIF/OSD rotation, deskew, CLAHE contrast, border cleanup)
        ↓
OCR Engine (TesseractOCRProvider with word-level confidence)
        ↓
OCR Confidence Scoring & Calibration
        ↓
Text Cleaning & Unicode Normalization
        ↓
Question / Answer Segmentation (Q1, 1., 1), Question 1, Ans 1; prompt vs. answer separation)
        ↓
Structured Document Response
        ↓
Spring Boot Backend / AI Evaluation Pipeline
```

---

## 🚀 Key Features

### 1. Document Ingestion & File Validation
- **Supported Formats**: PDF, PNG, JPG, JPEG.
- **Defense in Depth**:
  - Validates file signatures and magic bytes (`%PDF-`, `\x89PNG`, `\xff\xd8`).
  - Rejects executable files (Windows PE `MZ`, Linux ELF `\x7fELF`, Mach-O, Java bytecode, scripts with shebang `#!`).
  - Enforces size limits (`MAX_UPLOAD_SIZE_MB`, default 15MB).
  - Sanitizes filenames and prevents directory traversal attacks (`..`).
  - Verifies file integrity against corruption prior to processing.

### 2. Multi-Stage PDF Processing
- **Digital Extraction First**: Inspects embedded text streams per page. If sufficient text exists (>= 50 chars), extracts digital text immediately with high confidence (0.98), bypassing OCR to save compute.
- **Scanned PDF Fallback**: For scanned or image-only PDF pages, rasterizes pages using `pypdfium2` at high resolution (~200 DPI), executes image preprocessing, and performs OCR.
- **Multi-Page Support**: Combines page texts with page boundaries and aggregates page-level confidences.

### 3. Non-Destructive Image Preprocessing
- **Resolution Normalization**: Adaptively upscales low-resolution scans (Lanczos interpolation) and caps oversized images to prevent memory exhaustion.
- **Orientation & Rotation**: Respects EXIF camera tags and runs Tesseract Orientation & Script Detection (OSD) to auto-rotate 90°/180°/270° orientation errors.
- **Deskewing**: Calculates text skew angle via minimum area bounding rectangle and applies affine rotation with white padding.
- **Contrast & Grayscale**: Converts to grayscale and applies CLAHE (Contrast Limited Adaptive Histogram Equalization) to balance uneven scanner lighting.
- **Border / Crop Cleanup**: Detects and suppresses dark photocopy scanner margins.
- **Fallback Binarization**: Re-attempts OCR with Otsu binarization and denoising if initial confidence is low.

### 4. Pluggable OCR Provider Abstraction
- `OCRProvider` (Abstract Base Class): Defines `extract_text(file_bytes, filename) -> OCRResult`.
- `TesseractOCRProvider`: Real local OCR implementation using `pytesseract` with auto-discovery of Tesseract binaries across Windows, Linux, and macOS.
- `MockOCRProvider`: Offline simulated provider preserving digital PDF extraction and returning predictable mock answer sheets for fast automated test suites.
- `HandwritingOCRProvider`: Dedicated handwriting provider architecture. Explicitly exposes local OCR limitations on handwritten cursive instead of fabricating text, setting `requiresReview = true` and adding actionable warnings.
- `OCRProviderFactory`: Caches provider singletons and provides graceful fallback to mock mode if system binaries are unavailable.

### 5. Automated Question & Answer Segmentation
- Recognizes standard exam conventions:
  - `1.`, `2.`
  - `1)`, `2)`, `(1)`, `(2)`
  - `Q1`, `Q.1`, `Question 1`, `Question 1:`
  - `Ans 1`, `Answer 1`, `Ans 1:`
- Separates question prompt lines (e.g., `"Explain polymorphism."`) from the student's answer text.
- Detects non-sequential numbers or duplicates, lowering segmentation confidence and flagging human review.

---

## 📦 Structured Document Response (`/api/v1/ocr/extract`)

```json
{
  "filename": "answer-sheet.pdf",
  "pageCount": 2,
  "extractedText": "1. Explain polymorphism.\nJava supports polymorphism...\n\n2. What is inheritance?\nInheritance allows...",
  "confidence": 0.94,
  "provider": "tesseract",
  "requiresReview": false,
  "answers": [
    {
      "questionNumber": 1,
      "text": "Java supports polymorphism...",
      "confidence": 0.95
    },
    {
      "questionNumber": 2,
      "text": "Inheritance allows...",
      "confidence": 0.95
    }
  ],
  "warnings": []
}
```

*Backward compatibility*: Legacy clients expecting `{ "filename": "...", "extractedText": "...", "confidence": 0.94, "provider": "..." }` remain 100% compatible.

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Deployment environment (`development` / `production`) |
| `PORT` | `8000` | Port on which the FastAPI service listens |
| `AI_SERVICE_API_KEY` | `""` | Optional shared secret for `X-AI-Service-Key` header |
| `OCR_PROVIDER` | `tesseract` | Active OCR provider: `tesseract`, `mock`, `handwriting` |
| `OCR_CONFIDENCE_THRESHOLD` | `0.70` | Threshold below which `requiresReview = true` |
| `OCR_MIN_DIGITAL_TEXT_CHARS` | `50` | Minimum chars to treat a PDF page as digital text |
| `TESSERACT_CMD` | `""` | Optional path to `tesseract` executable (auto-discovered if empty) |
| `MAX_UPLOAD_SIZE_MB` | `15` | Maximum upload file size in megabytes |
| `LLM_PROVIDER` | `mock` | Active LLM evaluation provider: `mock`, `gemini`, `openai` |
| `CONFIDENCE_REVIEW_THRESHOLD` | `0.60` | Evaluation confidence threshold for human review |

---

## 🧪 Running Locally & Testing

### 1. Run Unit & Integration Tests
```bash
cd ai-service
python -m pytest tests/ -v
```

### 2. Run OCR Specific Tests
```bash
python -m pytest tests/test_ocr_pipeline.py -v
```

### 3. Start the Service Locally
```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
