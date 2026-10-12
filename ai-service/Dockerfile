# ==============================================================================
# EXAMIND AI & OCR Service Production Dockerfile
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies:
# - tesseract-ocr & english traineddata for OCR text extraction
# - poppler-utils for pdf rendering
# - libgl1 & libglib2.0-0 for opencv-python-headless
# - curl for Docker container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root system user for secure container execution
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/uploads && \
    chown -R appuser:appuser /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application package and source code
COPY app/ ./app/

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose FastAPI service port
EXPOSE 8000

# Container healthcheck against /health endpoint
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=15s \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch the production FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
