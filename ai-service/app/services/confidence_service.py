from typing import Tuple
import numpy as np
from app.core.config import get_settings
from app.utils.scoring import clamp_metric


class ConfidenceService:
    """
    Calibrated AI Confidence Estimation Service.
    Evaluates signal convergence, conflicting evidence, answer length/depth,
    and rubric certainty to calculate a calibrated confidence score [0.0, 1.0]
    and determine whether Human-in-the-Loop review is required.
    """

    def __init__(self):
        self.settings = get_settings()

    def estimate_confidence(
        self,
        semantic_similarity: float,
        concept_coverage: float,
        correctness: float,
        completeness: float,
        answer_length: int,
        has_rubric: bool,
        has_misconception: bool = False
    ) -> Tuple[float, bool, str]:
        signals = [semantic_similarity, concept_coverage, correctness, completeness]
        variance = float(np.var(signals))

        # Base confidence: higher agreement (low variance) yields higher certainty
        base_confidence = 0.92 - (variance * 1.0)

        # Conflicting evidence penalty (e.g. misconception: high similarity but low correctness)
        if has_misconception:
            base_confidence -= 0.25
        if abs(semantic_similarity - correctness) > 0.40:
            base_confidence -= 0.15

        # Length and detail penalties
        if answer_length < 20:
            base_confidence -= 0.25
        elif answer_length < 50:
            base_confidence -= 0.10

        # Completeness penalty for very incomplete answers
        if completeness < 0.35:
            base_confidence -= 0.15

        # Rubric presence enhances structural evaluation certainty
        if has_rubric:
            base_confidence += 0.05

        calibrated_confidence = clamp_metric(base_confidence)
        review_threshold = self.settings.CONFIDENCE_REVIEW_THRESHOLD
        auto_threshold = self.settings.CONFIDENCE_AUTO_THRESHOLD

        requires_review = calibrated_confidence < review_threshold

        if calibrated_confidence >= auto_threshold:
            rationale = "High signal convergence and complete conceptual coverage; eligible for autonomous grading."
        elif calibrated_confidence >= review_threshold:
            rationale = "Evaluation allowed with moderate confidence; minor variance detected across signals."
        else:
            rationale = (
                f"Confidence ({calibrated_confidence:.2f}) is below review threshold ({review_threshold:.2f}). "
                "Human-in-the-Loop teacher review is required."
            )

        return calibrated_confidence, requires_review, rationale


_confidence_service_instance: ConfidenceService | None = None


def get_confidence_service() -> ConfidenceService:
    global _confidence_service_instance
    if _confidence_service_instance is None:
        _confidence_service_instance = ConfidenceService()
    return _confidence_service_instance

