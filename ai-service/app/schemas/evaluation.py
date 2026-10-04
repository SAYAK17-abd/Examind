from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RubricCriterion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    criterion: str = Field(..., description="Rubric criterion name or title", examples=["Definition"])
    description: Optional[str] = Field(None, description="Detailed explanation of criterion", examples=["Correct definition of polymorphism"])
    maxMarks: float = Field(..., alias="maxScore", ge=0.0, description="Maximum marks assignable for this criterion", examples=[2.0])


class CriterionScore(BaseModel):
    criterion: str = Field(..., description="Rubric criterion name")
    score: float = Field(..., ge=0.0, description="Marks awarded")
    maxMarks: float = Field(..., ge=0.0, description="Maximum attainable marks")
    feedback: Optional[str] = Field(None, description="Specific feedback for this criterion")


class EvaluationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    evaluationId: Optional[str] = Field(None, description="Unique evaluation identifier or submission tracking ID")
    question: str = Field(..., min_length=1, description="Question prompt given to the student")
    studentAnswer: str = Field(..., description="Answer submitted by the student")
    referenceAnswer: Optional[str] = Field(None, description="Exemplar / model reference answer from educator")
    maxMarks: float = Field(default=10.0, alias="maxScore", gt=0.0, description="Maximum marks for the question")
    rubric: Optional[List[RubricCriterion]] = Field(default_factory=list, description="Grading criteria checklist")
    expectedConcepts: Optional[List[str]] = Field(default_factory=list, description="Specific domain concepts expected in the answer")
    subject: Optional[str] = Field(None, description="Subject domain, e.g. Java, Computer Science")
    difficulty: Optional[str] = Field("MEDIUM", description="Question difficulty: EASY, MEDIUM, HARD")
    questionType: Optional[str] = Field("DESCRIPTIVE", description="Type: MCQ, SHORT_ANSWER, DESCRIPTIVE, CODING, NUMERICAL")


class EvaluationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    evaluationId: Optional[str] = Field(None, description="Matching evaluation identifier")
    score: float = Field(..., ge=0.0, description="Final awarded score, clamped between 0 and maxMarks")
    maxMarks: float = Field(..., ge=0.0, description="Maximum marks for the question")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence score between 0.0 and 1.0")
    semanticSimilarity: float = Field(..., ge=0.0, le=1.0, description="Semantic cosine similarity between student and reference answer")
    conceptCoverage: float = Field(..., ge=0.0, le=1.0, description="Ratio of expected concepts captured in student response")
    correctness: float = Field(..., ge=0.0, le=1.0, description="Technical factual accuracy score")
    completeness: float = Field(..., ge=0.0, le=1.0, description="Thoroughness and depth of response")
    rubricScore: float = Field(..., ge=0.0, description="Aggregated score from rubric evaluation")
    criterionScores: List[CriterionScore] = Field(default_factory=list, description="Breakdown per rubric criterion")
    detectedConcepts: List[str] = Field(default_factory=list, description="Concepts successfully identified in answer")
    missingConcepts: List[str] = Field(default_factory=list, description="Expected concepts absent from answer")
    strengths: List[str] = Field(default_factory=list, description="Notable strengths of the response")
    weaknesses: List[str] = Field(default_factory=list, description="Areas of inaccuracy or omission")
    feedback: str = Field(..., description="Actionable, explainable feedback explaining marks awarded")
    requiresHumanReview: bool = Field(False, description="Flag indicating teacher review is necessary (confidence < threshold)")
    evaluationVersion: str = Field("1.0", description="Version of the evaluation pipeline")
    modelUsed: Optional[str] = Field(None, description="Model identifier used for evaluation")
    promptVersion: Optional[str] = Field(None, description="Prompt version identifier")

