from abc import ABC, abstractmethod
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse


class AIProvider(ABC):
    """Abstract interface for AI evaluation providers."""

    @abstractmethod
    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass

