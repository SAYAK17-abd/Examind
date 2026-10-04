from fastapi import APIRouter, Depends, status
from app.core.security import verify_api_key
from app.schemas.similarity import SimilarityCheckRequest, SimilarityCheckResponse
from app.services.similarity_service import get_similarity_service, SimilarityService

router = APIRouter(tags=["Academic Integrity & Similarity"])


@router.post(
    "/api/v1/similarity/check",
    response_model=SimilarityCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Check pairwise similarity between two student submissions using vector embeddings",
    description="Calculates semantic cosine similarity between two answers without making automated accusations of plagiarism.",
    dependencies=[Depends(verify_api_key)]
)
async def check_similarity(
    req: SimilarityCheckRequest,
    service: SimilarityService = Depends(get_similarity_service)
) -> SimilarityCheckResponse:
    """Evaluates semantic similarity between two student responses using sentence embeddings."""
    return service.check_pairwise_similarity(req)

