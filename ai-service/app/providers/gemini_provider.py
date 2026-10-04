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
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False


class GeminiProvider(AIProvider):
    """
    Production Google Gemini LLM Provider for EXAMIND.
    Uses structured output generation, anti-hallucination prompts,
    strict Pydantic response validation, and downstream scoring engine calibration.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        pipeline: Optional[EvaluationPipeline] = None
    ):
        self.settings = get_settings()
        self.api_key = api_key or self.settings.LLM_API_KEY
        self.model_name = model_name or self.settings.LLM_MODEL or "gemini-1.5-flash"
        self.pipeline = pipeline or get_evaluation_pipeline()
        self.semantic_service = get_semantic_service()
        self.confidence_service = get_confidence_service()
        self.prompt_version = "gemini-rubric-v2"

        self._client = None
        if self.api_key and HAS_GENAI_SDK:
            try:
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"GeminiProvider initialized with model '{self.model_name}'")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")
                self._client = None

    def get_provider_name(self) -> str:
        return f"gemini-{self.model_name}"

    def build_system_instruction(self) -> str:
        return """You are the EXAMIND AI Senior Academic Evaluation Engine.
Your responsibility is to rigorously, objectively, and fairly grade student responses.

CRITICAL ANTI-HALLUCINATION RULES:
1. Base your evaluation strictly and exclusively on the provided Question, Reference Answer, Rubric, Expected Concepts, and Student Answer.
2. Never assume, extrapolate, or invent facts that the student did not write.
3. If an expected concept is absent, explicitly record it in missingConcepts.
4. If a statement contradicts the reference answer or introduces a technical fallacy, record it in misconceptions and penalize correctness accordingly.
5. Provide clear, supportive, and pedagogical feedback without generic platitudes."""

    def build_prompt(self, request: EvaluationRequest) -> str:
        rubric_text = "\n".join([
            f"- {r.criterion} (Max Marks: {r.maxMarks}): {r.description or 'No description'}"
            for r in (request.rubric or [])
        ]) or "No explicit rubric provided. Grade based on overall correctness and completeness."

        expected_concepts_text = ", ".join(request.expectedConcepts) if request.expectedConcepts else "None specified."

        return f"""Evaluate the following student submission:

QUESTION:
{request.question}

MAXIMUM MARKS:
{request.maxMarks}

EXPECTED CONCEPTS:
{expected_concepts_text}

GRADING RUBRIC:
{rubric_text}

REFERENCE ANSWER:
{request.referenceAnswer or "None provided"}

STUDENT ANSWER:
{request.studentAnswer}

Respond with a strictly compliant JSON object containing:
- criterionScores: list of objects with "criterion", "score" (number <= maxMarks for that criterion), "reasoning" (string)
- correctness: number between 0.0 and 1.0 (accuracy)
- completeness: number between 0.0 and 1.0 (thoroughness)
- detectedConcepts: list of strings (concepts present in student answer)
- missingConcepts: list of strings (expected concepts not found)
- misconceptions: list of strings (incorrect or fallacious statements)
- strengths: list of strings
- weaknesses: list of strings
- feedback: string (comprehensive constructive feedback)"""

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        # Fallback to local semantic pipeline if no client/key is available
        if not self._client or not self.api_key:
            logger.info("GeminiProvider running in fallback mode via EvaluationPipeline.")
            return await self.pipeline.execute(request, model_name=f"{self.get_provider_name()}-fallback")

        try:
            logger.info(f"Calling Gemini API ({self.model_name}) for evaluationId={request.evaluationId}")
            prompt = self.build_prompt(request)
            system_instruction = self.build_system_instruction()

            # Call Gemini via google-genai SDK
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )

            raw_json = response.text
            cleaned_json = re.sub(r"^```json\s*|\s*```$", "", raw_json.strip())
            parsed_data = json.loads(cleaned_json)

            # Strict Pydantic validation (Rule 12)
            validated_output = LLMStructuredEvaluationOutput.model_validate(parsed_data)

            # Re-integrate with ground-truth semantic and scoring systems
            ref_text = request.referenceAnswer or ""
            semantic_sim = self.semantic_service.compute_semantic_similarity(request.studentAnswer, ref_text) if ref_text else 0.80

            total_concepts = len(request.expectedConcepts) if request.expectedConcepts else 1
            concept_cov = min(1.0, len(validated_output.detectedConcepts) / max(1, total_concepts))

            # Sum rubric scores
            criterion_scores = [
                CriterionScore(
                    criterion=c.criterion,
                    score=c.score,
                    maxMarks=next((r.maxMarks for r in (request.rubric or []) if r.criterion == c.criterion), c.score),
                    feedback=c.reasoning
                )
                for c in validated_output.criterionScores
            ]
            rubric_score = sum(c.score for c in criterion_scores) if criterion_scores else None

            final_score = calculate_weighted_score(
                max_marks=request.maxMarks,
                semantic_similarity=semantic_sim,
                concept_coverage=concept_cov,
                correctness=validated_output.correctness,
                completeness=validated_output.completeness,
                rubric_score=rubric_score
            )

            has_misconceptions = bool(validated_output.misconceptions)
            confidence, requires_review, _ = self.confidence_service.estimate_confidence(
                semantic_similarity=semantic_sim,
                concept_coverage=concept_cov,
                correctness=validated_output.correctness,
                completeness=validated_output.completeness,
                answer_length=len(request.studentAnswer),
                has_rubric=bool(request.rubric),
                has_misconception=has_misconceptions
            )

            return EvaluationResponse(
                evaluationId=request.evaluationId,
                score=final_score,
                maxMarks=request.maxMarks,
                confidence=confidence,
                semanticSimilarity=semantic_sim,
                conceptCoverage=concept_cov,
                correctness=validated_output.correctness,
                completeness=validated_output.completeness,
                rubricScore=clamp_score(rubric_score or final_score, request.maxMarks),
                criterionScores=criterion_scores,
                detectedConcepts=validated_output.detectedConcepts,
                missingConcepts=validated_output.missingConcepts,
                strengths=validated_output.strengths,
                weaknesses=validated_output.weaknesses,
                feedback=validated_output.feedback,
                requiresHumanReview=requires_review,
                evaluationVersion=self.settings.EVALUATION_VERSION,
                modelUsed=self.get_provider_name(),
                promptVersion=self.prompt_version
            )

        except Exception as ex:
            logger.error(f"Gemini evaluation failed: {ex}. Falling back to EvaluationPipeline.")
            return await self.pipeline.execute(request, model_name=f"{self.get_provider_name()}-fallback")

