from app.core.logging import logger
from app.providers.llm_provider import ProviderFactory
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.utils.validation import validate_evaluation_input
from fastapi import HTTPException, status


class EvaluationService:
    """Service handling answer evaluation orchestration."""

    def __init__(self):
        self.provider = ProviderFactory.get_provider()

    async def evaluate_submission(self, request: EvaluationRequest) -> EvaluationResponse:
        is_valid, err_msg = validate_evaluation_input(request)
        if not is_valid:
            logger.warning(f"Evaluation input validation failed: {err_msg}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": "VALIDATION_FAILED", "message": err_msg}
            )

        logger.info(
            f"Evaluating answer for question='{request.question[:40]}...' (maxMarks={request.maxMarks})"
        )
        response = await self.provider.evaluate(request)
        return response

