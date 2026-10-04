from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_evaluation_service
from app.core.security import verify_api_key
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.evaluation_service import EvaluationService

router = APIRouter(tags=["Answer Evaluation"])


@router.post(
    "/api/v1/evaluate",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate student answer with explainable multi-signal AI",
    dependencies=[Depends(verify_api_key)]
)
async def evaluate_answer(
    request: EvaluationRequest,
    service: EvaluationService = Depends(get_evaluation_service)
) -> EvaluationResponse:
    """Evaluates student submission and returns explainable scoring breakdown."""
    return await service.evaluate_submission(request)
