from typing import Tuple
from app.schemas.evaluation import EvaluationRequest


def validate_evaluation_input(req: EvaluationRequest) -> Tuple[bool, str]:
    if not req.question or not req.question.strip():
        return False, "Question text cannot be blank."

    if req.maxMarks <= 0:
        return False, "maxMarks must be strictly greater than 0."

    if req.rubric:
        total_rubric_marks = sum(r.maxMarks for r in req.rubric)
        if total_rubric_marks > req.maxMarks * 1.5:
            return False, f"Sum of rubric criteria ({total_rubric_marks}) exceeds question maxMarks ({req.maxMarks})."

    return True, ""

