import pytest
from pydantic import ValidationError
from app.schemas.llm import LLMStructuredEvaluationOutput, LLMCriterionScore


def test_valid_llm_output_parsing():
    raw_data = {
        "criterionScores": [
            {"criterion": "Definition", "score": 2.5, "reasoning": "Clear explanation"}
        ],
        "correctness": 0.85,
        "completeness": 0.80,
        "detectedConcepts": ["polymorphism"],
        "missingConcepts": ["overloading"],
        "misconceptions": [],
        "strengths": ["Accurate definition"],
        "weaknesses": ["Missing example"],
        "feedback": "Well-formulated answer covering the core definition."
    }

    validated = LLMStructuredEvaluationOutput.model_validate(raw_data)
    assert validated.correctness == 0.85
    assert validated.completeness == 0.80
    assert len(validated.criterionScores) == 1
    assert validated.criterionScores[0].criterion == "Definition"


def test_invalid_llm_metric_out_of_bounds_rejected():
    raw_data = {
        "criterionScores": [],
        "correctness": 1.5,  # Invalid: > 1.0
        "completeness": 0.8,
        "feedback": "Invalid metric test"
    }

    with pytest.raises(ValidationError):
        LLMStructuredEvaluationOutput.model_validate(raw_data)


def test_missing_feedback_rejected():
    raw_data = {
        "criterionScores": [],
        "correctness": 0.8,
        "completeness": 0.8
        # Missing feedback field
    }

    with pytest.raises(ValidationError):
        LLMStructuredEvaluationOutput.model_validate(raw_data)

