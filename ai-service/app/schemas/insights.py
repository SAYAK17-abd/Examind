from typing import List, Optional
from pydantic import BaseModel, Field


class StudentEvaluationHistoryItem(BaseModel):
    questionId: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    score: float
    maxMarks: float
    detectedConcepts: List[str] = []
    missingConcepts: List[str] = []


class StudentInsightsRequest(BaseModel):
    studentId: str = Field(..., description="Student unique ID")
    evaluations: List[StudentEvaluationHistoryItem] = Field(..., description="Historical evaluations list")


class StudentInsightsResponse(BaseModel):
    studentId: str
    strongTopics: List[str]
    weakTopics: List[str]
    commonMistakes: List[str]
    recommendedRevision: List[str]
    overallMasteryRate: float

