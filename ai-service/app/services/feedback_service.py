from typing import List, Tuple
from app.schemas.evaluation import CriterionScore


class FeedbackService:
    """
    Explainable Pedagogical Feedback Generation Service.
    Produces actionable justifications explaining:
    - Why marks were awarded or deducted
    - Concepts detected vs omitted
    - Technical misconceptions detected
    - Specific steps to improve
    """

    def generate_feedback(
        self,
        score: float,
        max_marks: float,
        detected_concepts: List[str],
        missing_concepts: List[str],
        criterion_scores: List[CriterionScore],
        correctness: float,
        completeness: float,
        has_misconception: bool = False,
        misconception_details: str | None = None
    ) -> Tuple[List[str], List[str], str]:
        strengths: List[str] = []
        weaknesses: List[str] = []
        suggestions: List[str] = []

        # 1. Strengths Identification
        if detected_concepts:
            strengths.append(f"Successfully incorporated expected concepts: {', '.join(detected_concepts)}")

        if correctness >= 0.80:
            strengths.append("Demonstrated high technical precision and factual correctness")
        elif correctness >= 0.65:
            strengths.append("Generally sound foundational reasoning with minor inaccuracies")

        high_criteria = [c.criterion for c in criterion_scores if c.maxMarks > 0 and (c.score / c.maxMarks) >= 0.80]
        if high_criteria:
            strengths.append(f"Excelled in rubric criteria: {', '.join(high_criteria)}")

        # 2. Weaknesses & Misconceptions Identification
        if has_misconception:
            desc = misconception_details or "Technical misconception identified in the explanation"
            weaknesses.append(f"Misconception Alert: {desc}")
            suggestions.append("Clarify the fundamental distinction where multiple inheritance via classes is prohibited in Java")

        if missing_concepts:
            weaknesses.append(f"Omitted crucial concepts: {', '.join(missing_concepts)}")
            suggestions.append(f"Incorporate missing concepts into your revision: {', '.join(missing_concepts)}")

        if completeness < 0.60:
            weaknesses.append("Response lacks sufficient depth, examples, or comprehensive elaboration")
            suggestions.append("Provide concrete code snippets or illustrative examples to substantiate descriptive claims")

        low_criteria = [c.criterion for c in criterion_scores if c.maxMarks > 0 and (c.score / c.maxMarks) < 0.50]
        if low_criteria:
            weaknesses.append(f"Criteria needing attention: {', '.join(low_criteria)}")

        # 3. Narrative Assembly
        score_pct = (score / max_marks * 100) if max_marks > 0 else 0
        summary_intro = f"Overall performance scored {score:.1f}/{max_marks:.1f} ({score_pct:.0f}%)."

        parts = [summary_intro]

        if strengths:
            parts.append("Key Strengths: " + "; ".join(strengths) + ".")
        if weaknesses:
            parts.append("Areas for Improvement: " + "; ".join(weaknesses) + ".")
        if suggestions:
            parts.append("Actionable Next Steps: " + "; ".join(suggestions) + ".")

        narrative = " ".join(parts)

        return strengths, weaknesses, narrative


_feedback_service_instance: FeedbackService | None = None


def get_feedback_service() -> FeedbackService:
    global _feedback_service_instance
    if _feedback_service_instance is None:
        _feedback_service_instance = FeedbackService()
    return _feedback_service_instance

