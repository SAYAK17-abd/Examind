from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AuditWarning(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: str = Field(..., description="Warning identifier, e.g. MISSING_MARKS, AMBIGUOUS_PROMPT")
    message: str = Field(..., description="Human-readable warning explanation")
    severity: str = Field(default="WARNING", description="Severity level: INFO, WARNING, or ERROR")
    suggestion: Optional[str] = Field(None, description="Actionable AI recommendation to fix the issue")


class AuditedQuestion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    questionNumber: int = Field(..., description="Question position or index")
    questionText: str = Field(..., description="Extracted question prompt text")
    questionType: str = Field(default="SHORT_ANSWER", description="Detected question type: MCQ, SHORT_ANSWER, DESCRIPTIVE, CODING, NUMERICAL")
    maxMarks: Optional[float] = Field(None, description="Detected marks allocation, if specified")
    topic: Optional[str] = Field(None, description="Inferred academic topic or concept")
    referenceAnswer: Optional[str] = Field(None, description="Draft reference answer or key if detected")
    options: Optional[List[str]] = Field(default=None, description="Extracted choices for MCQ questions")
    expectedConcepts: Optional[List[str]] = Field(default_factory=list, description="Extracted or recommended key concepts")
    warnings: List[AuditWarning] = Field(default_factory=list, description="AI validation warnings for this question")


class QuestionPaperAuditResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    filename: str = Field(..., description="Original filename of the question paper")
    totalQuestions: int = Field(..., description="Count of detected questions")
    totalMarksScanned: float = Field(default=0.0, description="Sum of explicitly detected marks across questions")
    cleanQuestionsCount: int = Field(default=0, description="Number of questions without any warning flags")
    questions: List[AuditedQuestion] = Field(default_factory=list, description="Extracted questions with audit warnings")
    summaryWarnings: List[str] = Field(default_factory=list, description="High-level document audit observations")
