from typing import Optional
from pydantic import BaseModel, Field


class SimilarityCheckRequest(BaseModel):
    answer1: str = Field(..., min_length=1, description="First student answer")
    answer2: str = Field(..., min_length=1, description="Second student answer")
    question: Optional[str] = Field(None, description="Question prompt context")
    threshold: float = Field(0.85, ge=0.0, le=1.0, description="Flagging threshold")


class SimilarityCheckResponse(BaseModel):
    similarity: float = Field(..., ge=0.0, le=1.0, description="Embedding cosine similarity")
    possibleSimilarity: bool = Field(..., description="Flag indicating potential overlap requiring teacher review")
    rationale: str = Field(..., description="Objective explanation of similarity analysis without accusatory tone")

