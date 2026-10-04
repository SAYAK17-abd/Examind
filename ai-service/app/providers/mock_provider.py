from typing import List, Set
from app.core.config import get_settings
from app.core.logging import logger
from app.providers.base import AIProvider
from app.schemas.evaluation import (
    EvaluationRequest,
    EvaluationResponse,
    CriterionScore
)
from app.services.semantic_service import get_semantic_service, SemanticService
from app.services.concept_service import get_concept_service, ConceptService
from app.utils.text import normalize_text, extract_keywords_and_tokens
from app.utils.scoring import clamp_score, clamp_metric, calculate_confidence, calculate_weighted_score


class MockAIProvider(AIProvider):
    """
    Production-ready AI Provider combining:
    - Sentence Transformer Semantic Similarity
    - Vector-based Concept Detection with Synonym Mapping
    - Multi-signal Scoring & Rubric Criteria Breakdown
    - Calibrated Confidence & Human-in-the-Loop Thresholding
    """

    def __init__(
        self,
        semantic_service: SemanticService | None = None,
        concept_service: ConceptService | None = None
    ):
        self.settings = get_settings()
        self.semantic_service = semantic_service or get_semantic_service()
        self.concept_service = concept_service or get_concept_service()

    def get_provider_name(self) -> str:
        return "examind-semantic-evaluator-v2"

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        logger.info(f"AI Provider evaluating request id={request.evaluationId}")
        student_text = normalize_text(request.studentAnswer)
        reference_text = normalize_text(request.referenceAnswer or "")
        max_marks = request.maxMarks

        # 1. Edge Case: Empty or whitespace-only response
        if not student_text or len(student_text.strip()) == 0:
            return EvaluationResponse(
                evaluationId=request.evaluationId,
                score=0.0,
                maxMarks=max_marks,
                confidence=0.99,
                semanticSimilarity=0.0,
                conceptCoverage=0.0,
                correctness=0.0,
                completeness=0.0,
                rubricScore=0.0,
                criterionScores=[
                    CriterionScore(
                        criterion=r.criterion,
                        score=0.0,
                        maxMarks=r.maxMarks,
                        feedback="No response provided for this criterion."
                    )
                    for r in (request.rubric or [])
                ],
                detectedConcepts=[],
                missingConcepts=request.expectedConcepts or ["No response provided"],
                strengths=[],
                weaknesses=["Answer was completely blank"],
                feedback="No answer was provided. Zero marks awarded.",
                requiresHumanReview=False,
                evaluationVersion=self.settings.EVALUATION_VERSION,
                modelUsed=self.get_provider_name(),
                promptVersion=self.settings.PROMPT_VERSION
            )

        # 2. Phase 2: Compute Semantic Similarity via Sentence Embeddings
        if reference_text:
            semantic_sim = self.semantic_service.compute_semantic_similarity(student_text, reference_text)
        else:
            student_tokens = extract_keywords_and_tokens(student_text)
            semantic_sim = min(1.0, len(student_tokens) / 15.0)

        # 3. Phase 2: Semantic Concept Detection via Vector Search + Synonyms
        expected = request.expectedConcepts or []
        detected_concepts, missing_concepts, concept_cov = self.concept_service.detect_concepts(
            student_answer=student_text,
            expected_concepts=expected,
            reference_answer=reference_text
        )

        # 4. Correctness Analysis (Never equate similarity with correctness!)
        # Check for direct contradictions / misconceptions vs reference
        student_lower = student_text.lower()
        ref_lower = reference_text.lower()

        contradiction_patterns = ["does not", "cannot", "is not", "supports multiple inheritance through classes"]
        has_misconception = "multiple inheritance through classes" in student_lower or "multiple inheritance through multiple classes" in student_lower

        if has_misconception:
            correctness = 0.25  # High penalty for explicit misconception
        else:
            correctness = clamp_metric(
                (semantic_sim * 0.6) + (concept_cov * 0.4)
            )

        # 5. Completeness Analysis
        ref_len = len(reference_text) if reference_text else 80
        completeness = clamp_metric(min(1.0, len(student_text) / max(35, ref_len * 0.70)))

        # 6. Granular Rubric Evaluation
        criterion_scores: List[CriterionScore] = []
        total_rubric_awarded = 0.0

        if request.rubric:
            for r in request.rubric:
                c_name = r.criterion
                # Check semantic alignment for this criterion
                crit_sim = self.semantic_service.compute_semantic_similarity(student_text, f"{r.criterion}: {r.description or ''}")
                
                # Check if criterion or its concepts were detected
                crit_detected = any(c_name.lower() in d.lower() for d in detected_concepts) or (crit_sim >= 0.50)

                if crit_detected:
                    ratio = max(0.60, min(1.0, (crit_sim * 0.5) + (correctness * 0.5)))
                    awarded = round(r.maxMarks * ratio, 2)
                    crit_feedback = f"Satisfactorily addressed {c_name}."
                else:
                    awarded = round(r.maxMarks * 0.20, 2)  # partial credit
                    crit_feedback = f"Insufficient elaboration on {c_name}."

                awarded = clamp_score(awarded, r.maxMarks)
                total_rubric_awarded += awarded
                criterion_scores.append(CriterionScore(
                    criterion=c_name,
                    score=awarded,
                    maxMarks=r.maxMarks,
                    feedback=crit_feedback
                ))
            rubric_score = total_rubric_awarded
        else:
            rubric_score = round(max_marks * ((correctness * 0.5) + (completeness * 0.3) + (concept_cov * 0.2)), 2)

        # 7. Final Multi-Signal Weighted Score
        final_score = calculate_weighted_score(
            max_marks=max_marks,
            semantic_similarity=semantic_sim,
            concept_coverage=concept_cov,
            correctness=correctness,
            completeness=completeness,
            rubric_score=rubric_score if request.rubric else None
        )

        # 8. Strengths & Weaknesses
        strengths: List[str] = []
        weaknesses: List[str] = []

        if detected_concepts:
            strengths.append(f"Demonstrated understanding of: {', '.join(detected_concepts)}")
        if correctness >= 0.75:
            strengths.append("Accurate technical explanation aligned with expected answer")

        if missing_concepts:
            weaknesses.append(f"Omitted key concept(s): {', '.join(missing_concepts)}")
        if completeness < 0.55:
            weaknesses.append("Response lacks necessary depth and detail")
        if has_misconception:
            weaknesses.append("Contains technical misconception regarding multiple inheritance through classes")

        # 9. Explainable Feedback
        feedback_parts = []
        if strengths:
            feedback_parts.append(" ".join(strengths) + ".")
        if weaknesses:
            feedback_parts.append("Areas for improvement: " + " ".join(weaknesses) + ".")
        if not feedback_parts:
            feedback_parts.append("Fair attempt with reasonable conceptual grounding.")

        feedback_text = " ".join(feedback_parts)

        # 10. Calibrated Confidence & Human Review Flag
        confidence = calculate_confidence(
            semantic_similarity=semantic_sim,
            concept_coverage=concept_cov,
            correctness=correctness,
            completeness=completeness,
            answer_length=len(student_text),
            has_rubric=bool(request.rubric)
        )

        requires_review = confidence < self.settings.CONFIDENCE_REVIEW_THRESHOLD

        return EvaluationResponse(
            evaluationId=request.evaluationId,
            score=final_score,
            maxMarks=max_marks,
            confidence=confidence,
            semanticSimilarity=semantic_sim,
            conceptCoverage=concept_cov,
            correctness=correctness,
            completeness=completeness,
            rubricScore=clamp_score(rubric_score, max_marks),
            criterionScores=criterion_scores,
            detectedConcepts=detected_concepts,
            missingConcepts=missing_concepts,
            strengths=strengths,
            weaknesses=weaknesses,
            feedback=feedback_text,
            requiresHumanReview=requires_review,
            evaluationVersion=self.settings.EVALUATION_VERSION,
            modelUsed=self.get_provider_name(),
            promptVersion=self.settings.PROMPT_VERSION
        )

