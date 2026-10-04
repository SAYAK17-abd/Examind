import json
import re
from typing import Optional
from app.core.config import get_settings
from app.core.logging import logger
from app.providers.base import AIProvider
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse, CriterionScore
from app.schemas.llm import LLMStructuredEvaluationOutput
from app.pipelines.evaluation_pipeline import get_evaluation_pipeline, EvaluationPipeline
from app.services.confidence_service import get_confidence_service, ConfidenceService
from app.services.semantic_service import get_semantic_service, SemanticService
from app.utils.scoring import clamp_score, calculate_weighted_score

try:
    from openai import OpenAI
    HAS_OPENAI_SDK = True
except ImportError:
    HAS_OPENAI_SDK = False


class OpenAIProvider(AIProvider):
    """
    Production OpenAI LLM Provider for EXAMIND.
    Supports GPT-4o / GPT-3.5 with JSON output modes and Pydantic validation.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        pipeline: Optional[EvaluationPipeline] = None
    ):
        self.settings = get_settings()
        self.api_key = api_key or self.settings.LLM_API_KEY
        self.model_name = model_name or "gpt-4o-mini"
        self.pipeline = pipeline or get_evaluation_pipeline()
        self.semantic_service = get_semantic_service()
        self.confidence_service = get_confidence_service()
        self.prompt_version = "openai-rubric-v1"

        self._client = None
        if self.api_key and HAS_OPENAI_SDK:
            try:
                self._client = OpenAI(api_key=self.api_key)
                logger.info(f"OpenAIProvider initialized with model '{self.model_name}'")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self._client = None

    def get_provider_name(self) -> str:
        return f"openai-{self.model_name}"

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        if not self._client or not self.api_key:
            logger.info("OpenAIProvider running in fallback mode via EvaluationPipeline.")
            return await self.pipeline.execute(request, model_name=f"{self.get_provider_name()}-fallback")

        try:
            logger.info(f"Calling OpenAI ({self.model_name}) for evaluationId={request.evaluationId}")
            rubric_text = "\n".join([
                f"- {r.criterion} (Max Marks: {r.maxMarks}): {r.description or 'No description'}"
                for r in (request.rubric or [])
            ]) or "Grade based on overall correctness and completeness."

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are the EXAMIND AI Senior Academic Evaluation Engine.\n"
                        "Base your assessment strictly on the provided materials. Do not hallucinate.\n"
                        "Always respond with a valid JSON object matching the requested schema."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"QUESTION: {request.question}\n"
                        f"MAX MARKS: {request.maxMarks}\n"
                        f"EXPECTED CONCEPTS: {request.expectedConcepts}\n"
                        f"RUBRIC:\n{rubric_text}\n"
                        f"REFERENCE ANSWER: {request.referenceAnswer or 'None'}\n"
                        f"STUDENT ANSWER: {request.studentAnswer}\n"
                    )
                }
            ]

            response = self._client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.2
            )

            raw_json = response.choices[0].message.content
            parsed = json.loads(raw_json)
            validated = LLMStructuredEvaluationOutput.model_validate(parsed)

            ref_text = request.referenceAnswer or ""
            semantic_sim = self.semantic_service.compute_semantic_similarity(request.studentAnswer, ref_text) if ref_text else 0.80

            total_concepts = len(request.expectedConcepts) if request.expectedConcepts else 1
            concept_cov = min(1.0, len(validated.detectedConcepts) / max(1, total_concepts))

            criterion_scores = [
                CriterionScore(
                    criterion=c.criterion,
                    score=c.score,
                    maxMarks=next((r.maxMarks for r in (request.rubric or []) if r.criterion == c.criterion), c.score),
                    feedback=c.reasoning
                )
                for c in validated.criterionScores
            ]
            rubric_score = sum(c.score for c in criterion_scores) if criterion_scores else None

            final_score = calculate_weighted_score(
                max_marks=request.maxMarks,
                semantic_similarity=semantic_sim,
                concept_coverage=concept_cov,
                correctness=validated.correctness,
                completeness=validated.completeness,
                rubric_score=rubric_score
            )

            confidence, requires_review, _ = self.confidence_service.estimate_confidence(
                semantic_similarity=semantic_sim,
                concept_coverage=concept_cov,
                correctness=validated.correctness,
                completeness=validated.completeness,
                answer_length=len(request.studentAnswer),
                has_rubric=bool(request.rubric),
                has_misconception=bool(validated.misconceptions)
            )

            return EvaluationResponse(
                evaluationId=request.evaluationId,
                score=final_score,
                maxMarks=request.maxMarks,
                confidence=confidence,
                semanticSimilarity=semantic_sim,
                conceptCoverage=concept_cov,
                correctness=validated.correctness,
                completeness=validated.completeness,
                rubricScore=clamp_score(rubric_score or final_score, request.maxMarks),
                criterionScores=criterion_scores,
                detectedConcepts=validated.detectedConcepts,
                missingConcepts=validated.missingConcepts,
                strengths=validated.strengths,
                weaknesses=validated.weaknesses,
                feedback=validated.feedback,
                requiresHumanReview=requires_review,
                evaluationVersion=self.settings.EVALUATION_VERSION,
                modelUsed=self.get_provider_name(),
                promptVersion=self.prompt_version
            )

        except Exception as ex:
            logger.error(f"OpenAI evaluation failed: {ex}. Falling back to EvaluationPipeline.")
            return await self.pipeline.execute(request, model_name=f"{self.get_provider_name()}-fallback")

