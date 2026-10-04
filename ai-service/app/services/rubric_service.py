from typing import List, Tuple
from app.models.embeddings import get_embedding_manager, EmbeddingModelManager
from app.schemas.evaluation import RubricCriterion, CriterionScore
from app.utils.text import normalize_text, extract_keywords_and_tokens
from app.utils.scoring import clamp_score
from app.core.logging import logger


class RubricService:
    """
    Granular Rubric Evaluation Service.
    Evaluates each rubric criterion independently using semantic alignment,
    concept presence, and technical completeness.
    """

    def __init__(self, embedding_manager: EmbeddingModelManager | None = None):
        self.embedding_manager = embedding_manager or get_embedding_manager()

    def evaluate_criterion(
        self,
        criterion: RubricCriterion,
        student_text: str,
        student_tokens: set,
        detected_concepts: List[str]
    ) -> CriterionScore:
        """Evaluates an individual rubric criterion and assigns discrete marks with justification."""
        c_name = criterion.criterion.strip()
        c_desc = (criterion.description or "").strip()
        max_marks = criterion.maxMarks

        if not student_text:
            return CriterionScore(
                criterion=c_name,
                score=0.0,
                maxMarks=max_marks,
                feedback=f"No response provided for '{c_name}'."
            )

        # 1. Semantic alignment with criterion definition
        full_crit_text = f"{c_name}: {c_desc}" if c_desc else c_name
        crit_sim = self.embedding_manager.compute_similarity(student_text, full_crit_text)

        # 2. Token / concept overlap for this criterion
        c_tokens = set(extract_keywords_and_tokens(full_crit_text))
        token_overlap_ratio = len(c_tokens.intersection(student_tokens)) / max(1, len(c_tokens))

        # 3. Check if any detected concept aligns with this criterion
        concept_aligned = any(c_name.lower() in d.lower() or d.lower() in c_name.lower() for d in detected_concepts)

        # 4. Multi-level grading ratio [0.0, 1.0]
        if concept_aligned and (crit_sim >= 0.50 or token_overlap_ratio >= 0.35):
            # Exemplary coverage
            awarded_ratio = max(0.85, min(1.0, (crit_sim * 0.5) + (token_overlap_ratio * 0.5) + 0.3))
            feedback = f"Full/strong demonstration of '{c_name}'. Satisfies core requirements."
        elif crit_sim >= 0.45 or token_overlap_ratio >= 0.25:
            # Partial coverage
            awarded_ratio = max(0.50, min(0.80, (crit_sim * 0.6) + (token_overlap_ratio * 0.4)))
            feedback = f"Partially addressed '{c_name}'. Key principles touched upon but lacks thorough depth."
        elif crit_sim >= 0.30 or token_overlap_ratio > 0:
            # Minimal mention
            awarded_ratio = 0.25
            feedback = f"Minimal mention of '{c_name}'. Important aspects omitted."
        else:
            # Not addressed
            awarded_ratio = 0.0
            feedback = f"Criterion '{c_name}' was not addressed in the response."

        awarded_marks = clamp_score(round(max_marks * awarded_ratio, 2), max_marks)

        return CriterionScore(
            criterion=c_name,
            score=awarded_marks,
            maxMarks=max_marks,
            feedback=feedback
        )

    def evaluate_rubric(
        self,
        rubric: List[RubricCriterion],
        student_answer: str,
        detected_concepts: List[str]
    ) -> Tuple[float, List[CriterionScore]]:
        """
        Evaluates a complete rubric checklist.
        Returns total rubric score and list of criterion breakdown scores.
        """
        if not rubric:
            return 0.0, []

        student_clean = normalize_text(student_answer)
        student_tokens = set(extract_keywords_and_tokens(student_clean))

        criterion_scores: List[CriterionScore] = []
        total_awarded = 0.0

        for criterion in rubric:
            score_item = self.evaluate_criterion(
                criterion=criterion,
                student_text=student_clean,
                student_tokens=student_tokens,
                detected_concepts=detected_concepts
            )
            criterion_scores.append(score_item)
            total_awarded += score_item.score

        return round(total_awarded, 2), criterion_scores


_rubric_service_instance: RubricService | None = None


def get_rubric_service() -> RubricService:
    global _rubric_service_instance
    if _rubric_service_instance is None:
        _rubric_service_instance = RubricService()
    return _rubric_service_instance
