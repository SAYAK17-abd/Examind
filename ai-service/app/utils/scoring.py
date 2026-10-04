from typing import Dict
from app.core.config import get_settings


def clamp_score(score: float, max_marks: float) -> float:
    """Clamps a numeric score strictly within [0.0, max_marks]."""
    if max_marks <= 0:
        return 0.0
    return round(max(0.0, min(float(max_marks), float(score))), 2)


def clamp_metric(val: float) -> float:
    """Clamps a 0..1 metric score strictly within [0.0, 1.0]."""
    return round(max(0.0, min(1.0, float(val))), 2)


def calculate_weighted_score(
    max_marks: float,
    semantic_similarity: float,
    concept_coverage: float,
    correctness: float,
    completeness: float,
    rubric_score: float | None = None
) -> float:
    settings = get_settings()

    w_semantic = settings.WEIGHT_SEMANTIC
    w_concept = settings.WEIGHT_CONCEPT
    w_correctness = settings.WEIGHT_CORRECTNESS
    w_completeness = settings.WEIGHT_COMPLETENESS

    total_w = w_semantic + w_concept + w_correctness + w_completeness
    if total_w <= 0:
        total_w = 1.0
    w_semantic /= total_w
    w_concept /= total_w
    w_correctness /= total_w
    w_completeness /= total_w

    multi_signal_ratio = (
        (w_semantic * semantic_similarity) +
        (w_concept * concept_coverage) +
        (w_correctness * correctness) +
        (w_completeness * completeness)
    )

    if rubric_score is not None and rubric_score > 0:
        base_score = (0.70 * rubric_score) + (0.30 * (max_marks * multi_signal_ratio))
    else:
        base_score = max_marks * multi_signal_ratio

    # Pedagogical Rule: Never reward a factually incorrect answer even if lengthy
    if correctness < 0.40:
        base_score = min(base_score, max_marks * (correctness + 0.15))

    return clamp_score(base_score, max_marks)


def calculate_confidence(
    semantic_similarity: float,
    concept_coverage: float,
    correctness: float,
    completeness: float,
    answer_length: int,
    has_rubric: bool
) -> float:
    signals = [semantic_similarity, concept_coverage, correctness, completeness]
    mean_val = sum(signals) / len(signals)
    variance = sum((s - mean_val) ** 2 for s in signals) / len(signals)

    base_conf = 0.90 - (variance * 0.45)

    if completeness < 0.35:
        base_conf -= 0.25
    elif completeness < 0.60:
        base_conf -= 0.10

    if answer_length < 25:
        base_conf -= 0.20
    elif answer_length < 60:
        base_conf -= 0.10

    if has_rubric:
        base_conf += 0.05

    return clamp_metric(base_conf)
