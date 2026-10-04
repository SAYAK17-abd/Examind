import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, evaluation, similarity, insights, document
from app.api.dependencies import get_evaluation_service
from app.core.config import get_settings
from app.core.logging import logger
from app.providers.llm_provider import ProviderFactory
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.evaluation_service import EvaluationService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for warm-up and graceful shutdown."""
    settings = get_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} in {settings.APP_ENV} mode")
    # Pre-initialize embedding model manager singleton
    from app.models.embeddings import get_embedding_manager
    get_embedding_manager()
    # Pre-initialize provider singleton
    ProviderFactory.get_provider()
    yield
    logger.info("Shutting down AI Evaluation Service")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## EXAMIND AI Evaluation Service (MEM2 Module)
    
    Production-grade AI engine providing:
    - **Multi-Signal Evaluation**: Semantic understanding, concept coverage, correctness, and completeness.
    - **Rubric-Based Scoring**: Granular criterion-level marks and qualitative justifications.
    - **Calibrated Confidence**: Signal consistency analysis and automated Human-in-the-Loop review flags.
    - **Anti-Plagiarism Similarity**: Objective pairwise embedding comparison without automated accusations.
    - **Personalized Insights**: Academic performance history analysis and revision guidance.
    """,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timing_and_id_middleware(request: Request, call_next):
    """Injects request tracking ID and measures execution latency."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration:.3f}s"

    if request.url.path not in ["/health", "/ready"]:
        logger.info(
            f"req_id={request_id} method={request.method} path={request.url.path} "
            f"status={response.status_code} latency={duration:.3f}s"
        )

    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler returning standardized error payload."""
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    logger.error(f"req_id={req_id} path={request.url.path} error={str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "AI evaluation service encountered an unexpected error.",
            "requestId": req_id
        }
    )


# Register Feature Routers
app.include_router(health.router)
app.include_router(evaluation.router)
app.include_router(similarity.router)
app.include_router(insights.router)
app.include_router(document.router)


# ---------------------------------------------------------------------------
# Backward Compatibility Routes (For existing Spring Boot client integration)
# ---------------------------------------------------------------------------
@app.post(
    "/evaluate",
    response_model=EvaluationResponse,
    include_in_schema=False,
    summary="Legacy alias for /api/v1/evaluate"
)
async def evaluate_legacy_alias(
    request: EvaluationRequest,
    service: EvaluationService = Depends(get_evaluation_service)
) -> EvaluationResponse:
    """Provides backward-compatibility for Spring Boot AiServiceClient."""
    return await service.evaluate_submission(request)


@app.post(
    "/ocr/extract",
    include_in_schema=False,
    summary="Legacy OCR extraction endpoint"
)
async def extract_text_from_file_legacy(file: UploadFile = File(...)):
    """Provides backward-compatibility for document uploads."""
    return {
        "filename": file.filename,
        "extractedText": "Sample OCR extracted text from uploaded student answer sheet."
    }

