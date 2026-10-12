"""
Compatibility entrypoint: exports the production FastAPI application from app.main.
This guarantees that running `uvicorn main:app` or `uvicorn app.main:app` both execute
the complete production AI and OCR evaluation pipeline.
"""
from app.main import app

__all__ = ["app"]
