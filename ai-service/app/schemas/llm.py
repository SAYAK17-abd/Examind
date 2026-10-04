from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class LLMCriterionScore(BaseModel):
    """Structured criterion score emitted by the LLM."""
    criterion: str = Field(..., description="Criterion name matching rubric")
    score: float = Field(..., ge=0.0, description="Marks awarded for this criterion")
    reasoning: Optional[str] = Field(None, description="Reasoning for marks awarded")


class LLMStructuredEvaluationOutput(BaseModel):
    """
    Strict Pydantic schema for validating raw LLM JSON outputs.
    Guarantees structural integrity before passing into the scoring engine.
    """
    criterionScores: List[LLMCriterionScore] = Field(
        default_factory=list,
        description="Evaluated criteria matching rubric"
    )
    correctness: float = Field(..., ge=0.0, le=1.0, description="Factual correctness metric between 0.0 and 1.0")
    completeness: float = Field(..., ge=0.0, le=1.0, description="Completeness metric between 0.0 and 1.0")
    detectedConcepts: List[str] = Field(default_factory=list, description="Concepts found in answer")
    missingConcepts: List[str] = Field(default_factory=list, description="Expected concepts omitted")
    misconceptions: List[str] = Field(default_factory=list, description="Explicit technical misconceptions identified")
    strengths: List[str] = Field(default_factory=list, description="Key strengths demonstrated")
    weaknesses: List[str] = Field(default_factory=list, description="Areas of inaccuracy or omission")
    feedback: str = Field(..., min_length=5, description="Clear, explainable feedback narrative")

    @field_validator("correctness", "completeness")
    @classmethod
    def validate_metrics(cls, v: float) -> float:
        if v < 0.0 or v > 1.0:
            raise ValueError(f"Metric value must be between 0.0 and 1.0, got {v}")
        return round(float(v), 3)

